"""
Technology Extraction, Alias Normalization, and Taxonomy Engine.
Maps variants, synonyms, and abbreviations to standard canonical names with category classification.
"""

import re
from typing import Dict, Tuple, List, Set, Any

# Canonical alias mapping: alias_lower -> (canonical_name, category)
TECH_TAXONOMY: Dict[str, Tuple[str, str]] = {
    # ─── Programming Languages ────────────────────────────────────────────────
    "python": ("Python", "Programming Language"),
    "py": ("Python", "Programming Language"),
    "python3": ("Python", "Programming Language"),
    "javascript": ("JavaScript", "Programming Language"),
    "js": ("JavaScript", "Programming Language"),
    "typescript": ("TypeScript", "Programming Language"),
    "ts": ("TypeScript", "Programming Language"),
    "java": ("Java", "Programming Language"),
    "c++": ("C++", "Programming Language"),
    "cpp": ("C++", "Programming Language"),
    "c#": ("C#", "Programming Language"),
    "csharp": ("C#", "Programming Language"),
    "c sharp": ("C#", "Programming Language"),
    "go": ("Go", "Programming Language"),
    "golang": ("Go", "Programming Language"),
    "rust": ("Rust", "Programming Language"),
    "php": ("PHP", "Programming Language"),
    "kotlin": ("Kotlin", "Programming Language"),
    "swift": ("Swift", "Programming Language"),
    "ruby": ("Ruby", "Programming Language"),
    "r": ("R", "Programming Language"),
    "scala": ("Scala", "Programming Language"),
    "dart": ("Dart", "Programming Language"),
    "sql": ("SQL", "Programming Language"),
    "html": ("HTML5", "Programming Language"),
    "html5": ("HTML5", "Programming Language"),
    "css": ("CSS3", "Programming Language"),
    "css3": ("CSS3", "Programming Language"),

    # ─── Frameworks & Libraries ───────────────────────────────────────────────
    "react": ("React", "Framework & Library"),
    "reactjs": ("React", "Framework & Library"),
    "react.js": ("React", "Framework & Library"),
    "angular": ("Angular", "Framework & Library"),
    "angularjs": ("Angular", "Framework & Library"),
    "vue": ("Vue.js", "Framework & Library"),
    "vuejs": ("Vue.js", "Framework & Library"),
    "vue.js": ("Vue.js", "Framework & Library"),
    "next.js": ("Next.js", "Framework & Library"),
    "nextjs": ("Next.js", "Framework & Library"),
    "node.js": ("Node.js", "Framework & Library"),
    "nodejs": ("Node.js", "Framework & Library"),
    "node": ("Node.js", "Framework & Library"),
    "express": ("Express.js", "Framework & Library"),
    "expressjs": ("Express.js", "Framework & Library"),
    "fastapi": ("FastAPI", "Framework & Library"),
    "django": ("Django", "Framework & Library"),
    "flask": ("Flask", "Framework & Library"),
    "spring": ("Spring Boot", "Framework & Library"),
    "spring boot": ("Spring Boot", "Framework & Library"),
    "springboot": ("Spring Boot", "Framework & Library"),
    ".net": (".NET", "Framework & Library"),
    "dotnet": (".NET", "Framework & Library"),
    "asp.net": ("ASP.NET", "Framework & Library"),
    "laravel": ("Laravel", "Framework & Library"),
    "flutter": ("Flutter", "Framework & Library"),
    "react native": ("React Native", "Framework & Library"),
    "tailwind": ("Tailwind CSS", "Framework & Library"),
    "tailwindcss": ("Tailwind CSS", "Framework & Library"),

    # ─── Cloud Platforms ──────────────────────────────────────────────────────
    "aws": ("AWS", "Cloud Platform"),
    "amazon web services": ("AWS", "Cloud Platform"),
    "azure": ("Microsoft Azure", "Cloud Platform"),
    "microsoft azure": ("Microsoft Azure", "Cloud Platform"),
    "gcp": ("Google Cloud", "Cloud Platform"),
    "google cloud": ("Google Cloud", "Cloud Platform"),
    "google cloud platform": ("Google Cloud", "Cloud Platform"),
    "oracle cloud": ("Oracle Cloud", "Cloud Platform"),
    "cloud": ("Cloud Computing", "Cloud Platform"),

    # ─── DevOps & Infrastructure ──────────────────────────────────────────────
    "docker": ("Docker", "DevOps & Infrastructure"),
    "kubernetes": ("Kubernetes", "DevOps & Infrastructure"),
    "k8s": ("Kubernetes", "DevOps & Infrastructure"),
    "terraform": ("Terraform", "DevOps & Infrastructure"),
    "jenkins": ("Jenkins", "DevOps & Infrastructure"),
    "ansible": ("Ansible", "DevOps & Infrastructure"),
    "github actions": ("GitHub Actions", "DevOps & Infrastructure"),
    "gitlab ci": ("GitLab CI", "DevOps & Infrastructure"),
    "ci/cd": ("CI/CD", "DevOps & Infrastructure"),
    "linux": ("Linux", "DevOps & Infrastructure"),
    "git": ("Git", "DevOps & Infrastructure"),
    "prometheus": ("Prometheus", "DevOps & Infrastructure"),
    "grafana": ("Grafana", "DevOps & Infrastructure"),
    "helm": ("Helm", "DevOps & Infrastructure"),

    # ─── Databases & Storage ──────────────────────────────────────────────────
    "postgresql": ("PostgreSQL", "Database & Storage"),
    "postgres": ("PostgreSQL", "Database & Storage"),
    "mysql": ("MySQL", "Database & Storage"),
    "mongodb": ("MongoDB", "Database & Storage"),
    "mongo": ("MongoDB", "Database & Storage"),
    "redis": ("Redis", "Database & Storage"),
    "elasticsearch": ("Elasticsearch", "Database & Storage"),
    "oracle db": ("Oracle Database", "Database & Storage"),
    "sqlite": ("SQLite", "Database & Storage"),
    "cassandra": ("Cassandra", "Database & Storage"),
    "dynamodb": ("DynamoDB", "Database & Storage"),
    "snowflake": ("Snowflake", "Database & Storage"),
    "kafka": ("Apache Kafka", "Database & Storage"),
    "rabbitmq": ("RabbitMQ", "Database & Storage"),

    # ─── AI & Machine Learning ────────────────────────────────────────────────
    "pytorch": ("PyTorch", "AI & Machine Learning"),
    "tensorflow": ("TensorFlow", "AI & Machine Learning"),
    "tf": ("TensorFlow", "AI & Machine Learning"),
    "keras": ("Keras", "AI & Machine Learning"),
    "scikit-learn": ("Scikit-Learn", "AI & Machine Learning"),
    "sklearn": ("Scikit-Learn", "AI & Machine Learning"),
    "hugging face": ("Hugging Face", "AI & Machine Learning"),
    "huggingface": ("Hugging Face", "AI & Machine Learning"),
    "transformers": ("Transformers", "AI & Machine Learning"),
    "langchain": ("LangChain", "AI & Machine Learning"),
    "llm": ("Large Language Models (LLM)", "AI & Machine Learning"),
    "llms": ("Large Language Models (LLM)", "AI & Machine Learning"),
    "generative ai": ("Generative AI", "AI & Machine Learning"),
    "genai": ("Generative AI", "AI & Machine Learning"),
    "nlp": ("Natural Language Processing", "AI & Machine Learning"),
    "natural language processing": ("Natural Language Processing", "AI & Machine Learning"),
    "machine learning": ("Machine Learning", "AI & Machine Learning"),
    "ml": ("Machine Learning", "AI & Machine Learning"),
    "deep learning": ("Deep Learning", "AI & Machine Learning"),
    "dl": ("Deep Learning", "AI & Machine Learning"),
    "computer vision": ("Computer Vision", "AI & Machine Learning"),
    "opencv": ("OpenCV", "AI & Machine Learning"),
    "spacy": ("spaCy", "AI & Machine Learning"),
    "nltk": ("NLTK", "AI & Machine Learning"),
    "pandas": ("Pandas", "AI & Machine Learning"),
    "numpy": ("NumPy", "AI & Machine Learning"),
    "spark": ("Apache Spark", "AI & Machine Learning"),
    "pyspark": ("PySpark", "AI & Machine Learning"),
}

# Compile regex keywords for exact word-boundary token matching
# Special handling for single letters and symbols like C, C++, C#, R, .NET
EXACT_SPECIAL_PATTERNS = {
    r"(?i)\bc\+\+\b": ("C++", "Programming Language"),
    r"(?i)\bc#\b": ("C#", "Programming Language"),
    r"(?i)\b\.net\b": (".NET", "Framework & Library"),
    r"(?i)\bci/cd\b": ("CI/CD", "DevOps & Infrastructure"),
}


class TechnologyNormalizer:
    """Extracts, standardizes, and classifies technologies from unstructured job texts."""

    @staticmethod
    def normalize_name(raw_name: str) -> Tuple[str, str]:
        """Convert a raw technology token or synonym to canonical (name, category)."""
        clean = raw_name.strip().lower()
        if clean in TECH_TAXONOMY:
            return TECH_TAXONOMY[clean]
        # Title case fallback
        return (raw_name.strip().title(), "General Technology")

    @staticmethod
    def extract_technologies(text: str) -> List[str]:
        """Extract all unique normalized technology names present in the text."""
        if not text:
            return []

        text_lower = text.lower()
        extracted: Set[str] = set()

        # 1. Match special regex terms (C++, C#, .NET, CI/CD)
        for pattern, (canonical, _) in EXACT_SPECIAL_PATTERNS.items():
            if re.search(pattern, text):
                extracted.add(canonical)

        # 2. Match known taxonomy aliases using regex word boundaries
        for alias, (canonical, _) in TECH_TAXONOMY.items():
            # Skip single-character aliases in general matching to avoid false positives (e.g. 'r', 'c')
            if len(alias) <= 1:
                continue

            # Escape special regex chars in alias
            escaped = re.escape(alias)
            # Use boundary \b
            if re.search(r"\b" + escaped + r"\b", text_lower):
                extracted.add(canonical)

        return sorted(list(extracted))


tech_normalizer = TechnologyNormalizer()
