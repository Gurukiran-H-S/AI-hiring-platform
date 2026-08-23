"""
Build the skill-demand time-series dataset for the forecasting model.

Merges multiple REAL LinkedIn job-posting datasets into one monthly series:

 1. arshkon/linkedin-job-postings (Kaggle, ~124K postings)
    - structured skill annotations (jobs/job_skills.csv + mappings/skills.csv)
    - coverage: 2024-03 .. 2024-04
 2. GitHub mirror of the 2023 Kaggle scrape (iameugenejo/...)
    - keyword matching on title+description
    - coverage: 2023-08 .. 2023-11
 3. joykimaiyo18/linkedin-data-jobs-dataset (Kaggle)
    - keyword matching on title+description
    - coverage: 2025-04 .. 2025-06

Outputs:
  data/historical_jobs/historical_jobs.csv   -> month,skill,demand_count
  data/historical_jobs/month_totals.json     -> {"2024-03": 123849, ...}

month_totals lets the trainer normalize counts into "mentions per 1,000
postings" so differently-sized sources become comparable.

The monthly retrain pipeline re-runs this script, so new datasets/sources
can be added without touching the trainer.
"""

import io
import json
import os
import sys
import zipfile
from tempfile import gettempdir

import pandas as pd
import requests

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

OUT_DIR = os.path.join("data", "historical_jobs")
OUT_FILE = os.path.join(OUT_DIR, "historical_jobs.csv")
TOTALS_FILE = os.path.join(OUT_DIR, "month_totals.json")
CACHE_DIR = os.path.join(gettempdir(), "opencode", "jobsdata")

SKILL_KEYWORDS = {
    "Python": ["python"],
    "SQL": [" sql", "sql ", "postgresql", "mysql"],
    "AWS": ["aws", "amazon web services"],
    "Azure": ["azure"],
    "Docker": ["docker", "containeriz"],
    "Kubernetes": ["kubernetes", " k8s"],
    "React": ["react.js", "reactjs", "(react"],
    "JavaScript": ["javascript", "typescript", "node.js"],
    "Java": ["java,", "java ", "spring boot"],
    "Machine Learning": ["machine learning", "ml engineer", "ml model"],
    "Deep Learning": ["deep learning", "neural network", "pytorch", "tensorflow"],
    "NLP": [" nlp", "natural language processing", " llm"],
    "Data Analysis": ["data analyst", "data analysis", "power bi", "tableau"],
    "Git": ["gitlab", "github", "version control"],
    "REST API": ["rest api", "restful"],
    "Linux": ["linux"],
}

CANONICAL_MAP = {
    "Python": {"Python"}, "SQL": {"SQL"},
    "AWS": {"AWS", "Amazon Web Services (AWS)"}, "Azure": {"Microsoft Azure", "Azure"},
    "Docker": {"Docker"}, "Kubernetes": {"Kubernetes"},
    "React": {"React.js", "ReactJS", "React"}, "JavaScript": {"JavaScript", "TypeScript", "Node.js"},
    "Java": {"Java"}, "Machine Learning": {"Machine Learning"}, "Deep Learning": {"Deep Learning"},
    "NLP": {"Natural Language Processing (NLP)"},
    "Data Analysis": {"Data Analysis", "Data Analytics", "Microsoft Excel", "Power BI", "Tableau"},
    "Git": {"Git", "GitHub", "Version Control"},
    "REST API": {"REST APIs", "Application Programming Interfaces (APIs)"}, "Linux": {"Linux"},
}


def _count_by_keyword(df: pd.DataFrame, text_cols) -> tuple:
    """Keyword-match skills in text columns -> (month x skill counts, monthly totals)."""
    for c in text_cols:
        if c not in df.columns:
            df[c] = ""
    text = (df[text_cols[0]].fillna("") + " " + df[text_cols[1]].fillna("")).str.lower()
    rows = []
    months = sorted(df["month"].unique())
    totals = {m: int((df["month"] == m).sum()) for m in months}
    for skill, kws in SKILL_KEYWORDS.items():
        mask = None
        for kw in kws:
            m = text.str.contains(kw, regex=False)
            mask = m if mask is None else (mask | m)
        counts = df[mask]["month"].value_counts()
        for month in months:
            c = int(counts.get(month, 0))
            if c:
                rows.append({"month": month, "skill": skill, "demand_count": c})
    return pd.DataFrame(rows), totals


def _source_kaggle_full_2024() -> tuple:
    """Structured annotations from arshkon full dataset (cached zip)."""
    cache = os.path.join(CACHE_DIR, "linkedin_full.zip")
    if not os.path.exists(cache):
        print("  [INFO] Downloading arshkon/linkedin-job-postings (~166 MB)...")
        r = requests.get(
            "https://www.kaggle.com/api/v1/datasets/download/arshkon/linkedin-job-postings",
            timeout=900,
        )
        os.makedirs(CACHE_DIR, exist_ok=True)
        open(cache, "wb").write(r.content)

    with zipfile.ZipFile(cache) as z:
        smap = pd.read_csv(z.open("mappings/skills.csv"))
        abr_to_name = dict(zip(smap["skill_abr"], smap["skill_name"]))
        js = pd.read_csv(z.open("jobs/job_skills.csv"))
        js["skill_name"] = js["skill_abr"].map(abr_to_name)
        po = pd.read_csv(z.open("postings.csv"), usecols=["job_id", "listed_time"], low_memory=False)
        po["listed_time"] = pd.to_datetime(po["listed_time"], unit="ms", errors="coerce")
        po = po.dropna(subset=["listed_time"])
        po["month"] = po["listed_time"].dt.strftime("%Y-%m")

    merged = po.merge(js.dropna(subset=["skill_name"])[["job_id", "skill_name"]], on="job_id")
    counts = merged.groupby(["month", "skill_name"]).size().reset_index(name="demand_count")
    counts["skill"] = counts["skill_name"]
    for canon, variants in CANONICAL_MAP.items():
        counts.loc[counts["skill_name"].isin(variants), "skill"] = canon
    out = counts.groupby(["month", "skill"])["demand_count"].sum().reset_index()
    totals = {m: int(n) for m, n in po["month"].value_counts().items()}
    print(f"  [src1] arshkon 2024: {len(po)} postings, {sorted(totals)}")
    return out, totals


def _source_mirror_2023() -> tuple:
    """Keyword-based counts from the 2023 GitHub mirror."""
    import urllib.request
    cache = os.path.join(CACHE_DIR, "job_postings.csv.zip")
    if not os.path.exists(cache):
        print("  [INFO] Downloading 2023 mirror (~41 MB)...")
        urllib.request.urlretrieve(
            "https://raw.githubusercontent.com/iameugenejo/2023-linkedin-job-posting/main/job_postings.csv.zip",
            cache,
        )
    with zipfile.ZipFile(cache) as z:
        df = pd.read_csv(z.open(z.namelist()[0]), low_memory=False)
    df["listed_time"] = pd.to_datetime(df["listed_time"], unit="ms", errors="coerce")
    df = df.dropna(subset=["listed_time"])
    df["month"] = df["listed_time"].dt.strftime("%Y-%m")
    out, totals = _count_by_keyword(df, ("title", "description"))
    print(f"  [src2] mirror 2023: {len(df)} postings, {sorted(totals)}")
    return out, totals


def _source_2025() -> tuple:
    """Keyword-based counts from the 2025 Kaggle dataset."""
    cache = os.path.join(CACHE_DIR, "jobs2025.zip")
    if not os.path.exists(cache):
        print("  [INFO] Downloading joykimaiyo18/linkedin-data-jobs-dataset...")
        r = requests.get(
            "https://www.kaggle.com/api/v1/datasets/download/joykimaiyo18/linkedin-data-jobs-dataset",
            timeout=600,
        )
        open(cache, "wb").write(r.content)
    with zipfile.ZipFile(cache) as z:
        name = [n for n in z.namelist() if n.endswith(".csv")][0]
        df = pd.read_csv(z.open(name), low_memory=False)
    dates = pd.to_datetime(df["date_posted"], errors="coerce")
    df = df.assign(month=dates.dt.strftime("%Y-%m")).dropna(subset=["month"])
    out, totals = _count_by_keyword(df, ("title", "description"))
    print(f"  [src3] 2025 dataset: {len(df)} postings, {sorted(totals)}")
    return out, totals


def build_historical_jobs() -> dict:
    os.makedirs(OUT_DIR, exist_ok=True)

    sources = [_source_kaggle_full_2024(), _source_mirror_2023(), _source_2025()]
    frames = [s[0] for s in sources]

    # merge per-month posting volumes across sources
    month_totals = {}
    for _, totals in sources:
        for m, n in totals.items():
            month_totals[m] = month_totals.get(m, 0) + n
    with open(TOTALS_FILE, "w") as f:
        json.dump(month_totals, f, indent=2)

    all_counts = (
        pd.concat(frames, ignore_index=True)
        .groupby(["month", "skill"])["demand_count"].sum().reset_index()
    )
    all_counts.to_csv(OUT_FILE, index=False)

    months = sorted(all_counts["month"].unique())
    summary = {
        "output_file": OUT_FILE,
        "months": len(months),
        "date_range": f"{months[0]}..{months[-1]}",
        "skills_tracked": int(all_counts["skill"].nunique()),
        "rows": int(len(all_counts)),
        "totals_file": TOTALS_FILE,
    }
    print(f"  [SUCCESS] {summary}")
    return summary


if __name__ == "__main__":
    build_historical_jobs()