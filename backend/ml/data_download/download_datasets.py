import os
import sys
import pandas as pd
from datasets import load_dataset

import ssl
ssl._create_default_https_context = ssl._create_unverified_context
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

DATASETS = {
    "resume_dataset": "C0ldSmi1e/resume-dataset",
    "job_skill_set": "batuhanmtl/job-skill-set",
    "job_resume_fit": "batuhanmtl/job_resume_fit",
    "resume_jd_match": "recuse/resume-jd-match-kr",
    "resume_matching_dataset_v2": "jminc/resume-matching-dataset-v2"
}

RAW_DATA_DIR = os.path.join("data", "raw")

def download_and_save():
    print("==================================================")
    print("PROGRAMMATIC DATASET DOWNLOADER")
    print("==================================================")
    
    os.makedirs(RAW_DATA_DIR, exist_ok=True)
    
    status_report = {}

    for name, path in DATASETS.items():
        save_path = os.path.join(RAW_DATA_DIR, name)
        os.makedirs(save_path, exist_ok=True)
        csv_file = os.path.join(save_path, f"{name}.csv")

        if os.path.exists(csv_file):
            print(f"[EXISTS] Dataset '{name}' already exists at: {csv_file}")
            df = pd.read_csv(csv_file)
            print(f"  Rows: {len(df)}, Columns: {list(df.columns)}")
            status_report[name] = {"status": "EXISTS", "rows": len(df), "cols": len(df.columns), "file": csv_file}
            continue

        print(f"[DOWNLOADING] Ingesting from Hugging Face: {path}...")
        try:
            # We load the split (default to train)
            dataset = load_dataset(path, split="train")
            df = dataset.to_pandas()
            df.to_csv(csv_file, index=False)
            print(f"[SUCCESS] Saved to: {csv_file}")
            print(f"  Rows: {len(df)}, Columns: {list(df.columns)}")
            status_report[name] = {"status": "SUCCESS", "rows": len(df), "cols": len(df.columns), "file": csv_file}
        except Exception as e:
            print(f"[FAILED] Could not load dataset '{name}': {e}")
            status_report[name] = {"status": "FAILED", "error": str(e)}

    print("\n==================================================")
    print("DOWNLOAD PROGRESS SUMMARY")
    print("==================================================")
    for name, stats in status_report.items():
        if stats["status"] in ["SUCCESS", "EXISTS"]:
            print(f"Dataset: {name} | Rows: {stats['rows']} | Columns: {stats['cols']} | {stats['status']}")
        else:
            print(f"Dataset: {name} | FAILED | Error: {stats['error']}")
    
    return status_report

if __name__ == "__main__":
    download_and_save()
