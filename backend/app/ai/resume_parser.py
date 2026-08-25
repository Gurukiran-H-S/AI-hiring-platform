"""
Resume Parser AI Module
Uses spaCy and NLTK for NLP-based resume parsing.
Extracts: Skills, Education, Experience, Certifications, Projects, Contact Info
"""

import re
import json
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Skill keywords database (expandable)
# ---------------------------------------------------------------------------
SKILL_KEYWORDS = {
    "programming_languages": [
        "python", "java", "javascript", "typescript", "c++", "c#", "c", "go",
        "golang", "rust", "swift", "kotlin", "ruby", "php", "scala", "r",
        "matlab", "perl", "shell", "bash", "powershell", "vba", "dart", "lua",
    ],
    "web_frameworks": [
        "react", "angular", "vue", "nextjs", "nuxtjs", "express", "fastapi",
        "django", "flask", "spring", "rails", "laravel", "asp.net", "nestjs",
        "svelte", "gatsby", "remix", "htmx",
    ],
    "databases": [
        "postgresql", "mysql", "sqlite", "mongodb", "redis", "elasticsearch",
        "cassandra", "dynamodb", "firebase", "supabase", "oracle", "mssql",
        "neo4j", "influxdb", "cockroachdb",
    ],
    "cloud_devops": [
        "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ansible",
        "jenkins", "github actions", "circleci", "gitlab ci", "helm", "argocd",
        "prometheus", "grafana", "nginx", "apache",
    ],
    "ai_ml": [
        "machine learning", "deep learning", "nlp", "computer vision",
        "tensorflow", "pytorch", "keras", "scikit-learn", "pandas", "numpy",
        "matplotlib", "seaborn", "transformers", "langchain", "openai",
        "huggingface", "spacy", "nltk", "opencv", "yolo",
    ],
    "tools": [
        "git", "github", "gitlab", "jira", "confluence", "slack", "postman",
        "figma", "adobe xd", "sketch", "notion", "trello", "vscode", "linux",
    ],
    "soft_skills": [
        "leadership", "communication", "teamwork", "problem solving",
        "critical thinking", "time management", "agile", "scrum",
        "project management", "analytical",
    ],
}

ALL_SKILLS = []
for category_skills in SKILL_KEYWORDS.values():
    ALL_SKILLS.extend(category_skills)
ALL_SKILLS = list(set(ALL_SKILLS))

# Pre-compile regex patterns for all skills to achieve microsecond execution
SKILL_PATTERNS = [
    (skill.title(), re.compile(r'\b' + re.escape(skill) + r'\b', re.IGNORECASE))
    for skill in ALL_SKILLS
]

EDUCATION_KEYWORDS = [
    "bachelor", "master", "phd", "doctorate", "b.e", "b.tech", "m.tech",
    "m.e", "b.sc", "m.sc", "mba", "diploma", "associate", "b.com", "m.com",
    "bca", "mca", "b.arch", "llb", "mbbs", "bds",
]

CERT_KEYWORDS = [
    "certified", "certification", "certificate", "aws certified",
    "google certified", "microsoft certified", "cisco", "pmp", "cpa",
    "cfa", "six sigma", "itil", "comptia", "gcp", "azure",
]

SECTION_HEADERS = {
    "summary": ["summary", "objective", "profile", "about", "overview", "career objective"],
    "experience": ["experience", "work experience", "employment", "work history",
                   "professional experience", "career history", "internship"],
    "education": ["education", "academic", "qualification", "educational background"],
    "skills": ["skills", "technical skills", "core competencies", "expertise",
               "proficiencies", "technologies"],
    "certifications": ["certifications", "certificates", "licenses", "credentials",
                       "professional certifications"],
    "projects": ["projects", "personal projects", "academic projects", "portfolio"],
    "languages": ["languages", "language proficiency"],
    "achievements": ["achievements", "awards", "honors", "recognition", "accomplishments"],
}


class ResumeParser:
    """NLP-powered resume parser using spaCy and regex."""

    def __init__(self):
        self._nlp = None

    def initialize_model(self):
        """Warm up spaCy NLP pipeline during application startup."""
        return self._get_nlp()

    def _get_nlp(self):
        if self._nlp is None:
            try:
                import spacy
                self._nlp = spacy.load("en_core_web_sm")
                logger.info("Loaded spaCy en_core_web_sm pipeline")
            except Exception:
                logger.warning("spaCy model not found, using basic regex parsing")
                self._nlp = False
        return self._nlp if self._nlp is not False else None

    def parse(self, text: str) -> Dict[str, Any]:
        """Main parse method. Returns structured resume data."""
        text = self._clean_text(text)
        sections = self._extract_sections(text)

        result = {
            "name": self._extract_name(text),
            "email": self._extract_email(text),
            "phone": self._extract_phone(text),
            "location": self._extract_location(text),
            "summary": sections.get("summary", ""),
            "skills": self._extract_skills(text),
            "education": self._extract_education(sections.get("education", "")),
            "experience": self._extract_experience(sections.get("experience", "")),
            "certifications": self._extract_certifications(
                sections.get("certifications", "") + " " + text
            ),
            "projects": self._extract_projects(sections.get("projects", "")),
            "languages": self._extract_languages(sections.get("languages", "")),
        }
        return result

    def _clean_text(self, text: str) -> str:
        lines = [re.sub(r'[ \t]+', ' ', line).strip() for line in text.split('\n')]
        cleaned_text = '\n'.join(lines)
        cleaned_text = re.sub(r'[^\x00-\x7f\n]+', ' ', cleaned_text)
        return cleaned_text.strip()

    def _extract_sections(self, text: str) -> Dict[str, str]:
        """Split resume into sections based on header keywords."""
        sections = {}
        lines = text.split('\n')
        current_section = "general"
        section_text = []

        for line in lines:
            line_lower = line.strip().lower()
            detected = False
            for section_name, keywords in SECTION_HEADERS.items():
                if any(line_lower.startswith(kw) or line_lower == kw for kw in keywords):
                    if section_text:
                        sections[current_section] = "\n".join(section_text)
                    current_section = section_name
                    section_text = []
                    detected = True
                    break
            if not detected:
                section_text.append(line)

        if section_text:
            sections[current_section] = "\n".join(section_text)
        return sections

    def _extract_name(self, text: str) -> Optional[str]:
        nlp = self._get_nlp()
        if nlp:
            doc = nlp(text[:500])
            for ent in doc.ents:
                if ent.label_ == "PERSON":
                    return ent.text.strip()
        # Fallback: first non-empty line
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        if lines:
            first_line = lines[0]
            if len(first_line.split()) <= 4 and not any(
                c in first_line for c in ['@', '.com', '/', '|']
            ):
                return first_line
        return None

    def _extract_email(self, text: str) -> Optional[str]:
        pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        match = re.search(pattern, text)
        return match.group(0) if match else None

    def _extract_phone(self, text: str) -> Optional[str]:
        patterns = [
            r'\+?[\d\s\-\(\)]{10,15}',
            r'\b\d{10}\b',
            r'\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b',
        ]
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                phone = re.sub(r'\s+', '', match.group(0))
                if len(re.sub(r'\D', '', phone)) >= 10:
                    return phone
        return None

    def _extract_location(self, text: str) -> Optional[str]:
        # Common location patterns
        patterns = [
            r'\b[A-Z][a-z]+,\s*[A-Z]{2}\b',  # City, ST
            r'\b[A-Z][a-z]+,\s*[A-Z][a-z]+\b',  # City, Country
            r'\b(?:Bangalore|Mumbai|Delhi|Chennai|Hyderabad|Pune|Kolkata)\b',
        ]
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(0)
        return None

    def _extract_skills(self, text: str) -> List[str]:
        if not text:
            return []
        found_skills = []
        for skill_title, pattern in SKILL_PATTERNS:
            if pattern.search(text):
                found_skills.append(skill_title)
        return list(set(found_skills))

    def _extract_education(self, text: str) -> List[Dict]:
        education = []
        if not text:
            return education

        # Find degree patterns
        degree_pattern = r'(?:' + '|'.join(EDUCATION_KEYWORDS) + r')[\w\s,.()\-/]*'
        matches = re.finditer(degree_pattern, text, re.IGNORECASE)

        year_pattern = r'\b(19|20)\d{2}\b'

        for match in matches:
            entry_text = match.group(0)
            years = re.findall(year_pattern, entry_text + text[match.start():match.start()+200])
            education.append({
                "degree": entry_text.strip()[:100],
                "institution": self._extract_institution(text[match.start():match.start()+300]),
                "year": years[-1] if years else None,
                "gpa": self._extract_gpa(entry_text + text[match.start():match.start()+200]),
            })

        return education[:5]  # Limit to 5 entries

    def _extract_institution(self, text: str) -> Optional[str]:
        patterns = [
            r'(?:University|College|Institute|School|Academy)\s+of\s+[\w\s]+',
            r'[\w\s]+(?:University|College|Institute|School)',
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(0).strip()
        return None

    def _extract_gpa(self, text: str) -> Optional[str]:
        match = re.search(r'(?:gpa|cgpa|grade)[:\s]*(\d+\.?\d*)', text, re.IGNORECASE)
        return match.group(1) if match else None

    def _extract_experience(self, text: str) -> List[Dict]:
        experience = []
        if not text:
            return experience

        # Split into entries by common patterns
        entries = re.split(
            r'\n(?=[A-Z][a-z]+(?:\s[A-Z][a-z]+)?\s+(?:at|@|–|-)\s+|[A-Z]{2,})',
            text
        )

        year_pattern = r'\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)?\s*(?:19|20)\d{2}\b'
        duration_pattern = r'(\d+)\s*(?:year|yr|month|mo)s?'

        for entry in entries[:10]:
            if len(entry.strip()) < 20:
                continue
            years = re.findall(year_pattern, entry)
            title_match = re.match(r'^([A-Za-z\s,]+?)(?:\s+at\s+|\s*@\s*|\s*–\s*|\s*-\s*)', entry.strip())

            experience.append({
                "title": title_match.group(1).strip() if title_match else entry.split('\n')[0][:80],
                "company": self._extract_company(entry),
                "duration": f"{years[0]} - {years[1]}" if len(years) >= 2 else (years[0] if years else None),
                "description": entry.strip()[:500],
                "technologies": self._extract_skills(entry),
            })

        return experience[:8]

    def _extract_company(self, text: str) -> Optional[str]:
        patterns = [
            r'(?:at|@)\s+([A-Z][a-zA-Z\s,&.]+?)(?:\n|,|\||–|-)',
            r'([A-Z][a-zA-Z\s&.]+(?:Inc|LLC|Ltd|Corp|Technologies|Solutions|Systems)[\w.]*)',
        ]
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(1).strip()[:100]
        return None

    def _extract_certifications(self, text: str) -> List[Dict]:
        certs = []
        cert_pattern = r'(?:' + '|'.join(CERT_KEYWORDS) + r')[\w\s,.\-()]*'
        matches = re.finditer(cert_pattern, text, re.IGNORECASE)
        year_pattern = r'\b(20\d{2})\b'

        seen = set()
        for match in matches:
            cert_text = match.group(0).strip()[:150]
            if cert_text.lower() not in seen and len(cert_text) > 10:
                seen.add(cert_text.lower())
                years = re.findall(year_pattern, text[match.start():match.start()+200])
                certs.append({
                    "name": cert_text,
                    "issuer": self._extract_issuer(cert_text),
                    "year": years[0] if years else None,
                })
        return certs[:10]

    def _extract_issuer(self, text: str) -> Optional[str]:
        providers = ["AWS", "Google", "Microsoft", "Cisco", "PMI", "CompTIA",
                     "Oracle", "Salesforce", "IBM", "Meta", "Coursera", "Udemy"]
        for provider in providers:
            if provider.lower() in text.lower():
                return provider
        return None

    def _extract_projects(self, text: str) -> List[Dict]:
        projects = []
        if not text:
            return projects

        entries = re.split(r'\n(?=[A-Z])', text)
        for entry in entries[:8]:
            if len(entry.strip()) < 20:
                continue
            lines = entry.strip().split('\n')
            projects.append({
                "name": lines[0][:100] if lines else "Project",
                "description": '\n'.join(lines[1:])[:500] if len(lines) > 1 else entry[:300],
                "technologies": self._extract_skills(entry),
                "url": self._extract_url(entry),
            })
        return projects

    def _extract_url(self, text: str) -> Optional[str]:
        pattern = r'https?://[^\s\)\]>]+'
        match = re.search(pattern, text)
        return match.group(0) if match else None

    def _extract_languages(self, text: str) -> List[Dict]:
        if not text:
            return []
        common_languages = [
            "english", "hindi", "kannada", "tamil", "telugu", "malayalam",
            "french", "german", "spanish", "arabic", "chinese", "japanese",
            "portuguese", "russian", "italian",
        ]
        proficiency_levels = ["native", "fluent", "proficient", "intermediate", "basic", "beginner"]
        found = []
        text_lower = text.lower()
        for lang in common_languages:
            if lang in text_lower:
                proficiency = None
                for level in proficiency_levels:
                    if level in text_lower:
                        proficiency = level.title()
                        break
                found.append({
                    "language": lang.title(),
                    "proficiency": proficiency or "Conversational",
                })
        return found


# Singleton instance
resume_parser = ResumeParser()
