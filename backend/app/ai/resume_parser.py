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
                self._nlp = spacy.load("en_core_web_sm", disable=["parser", "tagger", "lemmatizer", "textcat"])
                logger.info("Loaded lightweight spaCy entity pipeline")
            except Exception:
                logger.warning("spaCy model not found, using regex parsing")
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

    def _is_valid_name(self, name_cand: str) -> bool:
        """Validate whether a string candidate is a legitimate human name."""
        if not name_cand or not isinstance(name_cand, str):
            return False
        cleaned = re.sub(r'\s+', ' ', name_cand.strip())
        
        # Length & word count constraints
        words = cleaned.split()
        if len(words) < 1 or len(words) > 4:
            return False
        if len(cleaned) < 2 or len(cleaned) > 50:
            return False
        # Single-word names must be at least 3 characters (eliminates state codes like 'WA', 'CA')
        if len(words) == 1 and len(cleaned) < 3:
            return False
            
        # Must not contain emails, URLs, or domains
        if any(c in cleaned.lower() for c in ['@', '.com', '.in', '.org', '.net', '.edu', '.io', 'http', 'www', 'github', 'linkedin']):
            return False
            
        # Must not contain digits or invalid symbols
        if re.search(r'[\d:;/\\[\]{}()*=+#$%^&_<>]', cleaned):
            return False
            
        invalid_keywords = {
            "resume", "curriculum", "vitae", "cv", "profile", "summary", "objective",
            "career", "experience", "education", "skills", "technical", "projects",
            "certifications", "certificates", "contact", "details", "personal", "phone",
            "email", "address", "location", "developer", "engineer", "software",
            "programmer", "candidate", "applicant", "page", "portfolio", "technologies",
            "frameworks", "languages", "fullstack", "backend", "frontend", "internship",
            "work", "employment", "history", "qualification", "academic", "university",
            "college", "institute", "school", "bachelor", "master", "phd", "btech", "mtech",
            "senior", "junior", "lead", "architect", "manager", "designer",
            "docker", "kubernetes", "linux", "unix", "python", "java", "javascript", "typescript",
            "react", "angular", "vue", "django", "fastapi", "flask", "spring", "aws", "azure", "gcp",
            "html", "css", "sql", "nosql", "postgres", "mongodb", "redis", "git", "github", "gitlab", "cicd", "ci",
            # Indian cities & common location words
            "bengaluru", "bangalore", "hyderabad", "mumbai", "delhi", "chennai", "kolkata",
            "pune", "ahmedabad", "surat", "jaipur", "lucknow", "kanpur", "nagpur", "noida",
            "gurugram", "gurgaon", "chandigarh", "mysuru", "mysore", "mangaluru", "mangalore",
            "udupi", "manipal", "tumkur", "hubli", "hubballi", "belagavi", "belgaum",
            "kochi", "thiruvananthapuram", "visakhapatnam", "vizag", "coimbatore", "indore",
            "bhopal", "patna", "bhubaneswar", "guwahati", "dehradun", "roorkee", "ranchi",
            # Indian states & countries
            "karnataka", "telangana", "maharashtra", "gujarat", "rajasthan", "punjab",
            "haryana", "kerala", "tamilnadu", "andhra", "pradesh", "uttarakhand",
            "india", "usa", "canada", "singapore", "australia", "germany", "france",
            "remote", "worldwide", "global",
            # Global cities
            "seattle", "austin", "boston", "chicago", "toronto", "london", "berlin",
            "paris", "amsterdam", "dublin", "tokyo", "sydney", "melbourne", "dubai",
        }
        words_lower = [w.lower().strip(".,-") for w in words]
        if any(w in invalid_keywords for w in words_lower):
            return False
            
        # Must be primarily alphabetic
        if not re.match(r"^[A-Za-zÀ-ÖØ-öø-ÿ]+([ .'-][A-Za-zÀ-ÖØ-öø-ÿ]+)*$", cleaned):
            return False

        return True

    def _extract_name(self, text: str) -> Optional[str]:
        """Extract candidate's full human name using hybrid NLP, labeled regex, and header scanning."""
        if not text:
            return None

        def _clean_cand(line_str: str) -> str:
            # Strip emails, phones, URLs, cid artifacts, and punctuation
            s = re.sub(r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}', '', line_str)
            s = re.sub(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', '', s)
            s = re.sub(r'\+?\d{10,13}', '', s)
            s = re.sub(r'\(cid:\d+\)', '', s)
            s = re.sub(r'[|•·#*_\-~]+', ' ', s)
            s = re.sub(r'\s+', ' ', s).strip()
            return s

        # 1. Labeled pattern extraction (e.g. "Name: John Doe" or "Candidate Name: Jane Smith")
        labeled_pattern = r'(?:candidate\s*name|full\s*name|^name)\s*[:\-–]\s*([A-Za-z\s.\'-]{2,40})'
        labeled_match = re.search(labeled_pattern, text, re.IGNORECASE | re.MULTILINE)
        if labeled_match:
            # Take only the first line of the captured group to avoid bleeding into next field
            raw = labeled_match.group(1).split('\n')[0]
            candidate = _clean_cand(raw)
            if self._is_valid_name(candidate):
                return candidate.title()

        # 2. Line-by-line header inspection (top 15 non-empty lines)
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        for line in lines[:15]:
            # If line has separators like "|", "•", "·", "\t", ",", "#"
            parts = re.split(r'[|•·\t#,]', line)
            for part in parts:
                part_clean = _clean_cand(part)
                if self._is_valid_name(part_clean):
                    return part_clean.title()
            
            clean_line = _clean_cand(line)
            if self._is_valid_name(clean_line):
                return clean_line.title()

        # 3. spaCy Named Entity Recognition (with strict post-validation)
        nlp = self._get_nlp()
        if nlp:
            try:
                doc = nlp(text[:600])
                for ent in doc.ents:
                    if ent.label_ == "PERSON":
                        ent_text = ent.text.strip()
                        ent_clean = _clean_cand(ent_text.split('\n')[0])
                        if self._is_valid_name(ent_clean):
                            return ent_clean.title()
            except Exception as e:
                logger.warning(f"spaCy NER name extraction warning: {e}")

        # 4. Fallback: Parse human name from email username if structured (e.g., john.doe@gmail.com -> John Doe)
        email = self._extract_email(text)
        if email:
            username = email.split('@')[0]
            derived = re.sub(r'[\._\-]+', ' ', username)
            derived = re.sub(r'\d+$', '', derived).strip()
            if len(derived) >= 3 and self._is_valid_name(derived):
                return derived.title()

        return None

    def _extract_email(self, text: str) -> Optional[str]:
        pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        match = re.search(pattern, text)
        return match.group(0) if match else None

    def _extract_phone(self, text: str) -> Optional[str]:
        patterns = [
            r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b',
            r'\+?\d{1,3}[-.\s]\d{10}\b',
            r'\+?91[-.\s]?\d{10}\b',
            r'\b\d{10}\b',
            r'\+?[\d\s\-\(\)]{10,15}',
        ]
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                phone_candidate = match.group(0).strip()
                cleaned_digits = re.sub(r'\D', '', phone_candidate)
                if 10 <= len(cleaned_digits) <= 15:
                    return phone_candidate
        return None

    def _extract_location(self, text: str) -> Optional[str]:
        if not text:
            return None

        # Blacklist of technical words and non-location keywords that should NEVER be extracted as location
        non_location_terms = {
            "linux", "unix", "windows", "macos", "ubuntu", "debian", "redhat", "centos",
            "ci", "cd", "cicd", "git", "github", "gitlab", "docker", "kubernetes", "k8s",
            "python", "java", "javascript", "typescript", "c++", "c#", "golang", "rust",
            "react", "node", "nodejs", "angular", "vue", "nextjs", "django", "flask", "fastapi",
            "spring", "html", "css", "sql", "nosql", "postgres", "postgresql", "mysql", "mongodb",
            "redis", "aws", "azure", "gcp", "rest", "api", "apis", "graphql", "json", "xml",
            "agile", "scrum", "jira", "unit", "testing", "postman", "figma", "machine", "learning",
            "deep", "nlp", "ai", "ml", "data", "science", "developer", "engineer", "software"
        }

        valid_state_codes = {
            "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL",
            "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT",
            "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI",
            "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC", "ON", "BC", "QC", "AB"
        }

        # Indian cities & college hubs
        indian_cities = [
            "Bengaluru", "Bangalore", "Mysuru", "Mysore", "Mangaluru", "Mangalore", "Hubballi", "Hubli",
            "Belagavi", "Belgaum", "Tumakuru", "Tumkur", "Shivamogga", "Shimoga", "Davangere", "Ballari",
            "Bellary", "Udupi", "Manipal", "Kalaburagi", "Gulbarga", "Bidar", "Hassan", "Mandya", "Kolar",
            "Hyderabad", "Secunderabad", "Chennai", "Coimbatore", "Madurai", "Trichy", "Tiruchirappalli",
            "Salem", "Kochi", "Cochin", "Thiruvananthapuram", "Trivandrum", "Kozhikode", "Calicut", "Thrissur",
            "Visakhapatnam", "Vizag", "Vijayawada", "Guntur", "Tirupati", "Warangal", "Nellore",
            "Mumbai", "Navi Mumbai", "Thane", "Pune", "Nagpur", "Nashik", "Aurangabad", "Solapur", "Kolhapur",
            "Ahmedabad", "Surat", "Vadodara", "Baroda", "Rajkot", "Gandhinagar",
            "Indore", "Bhopal", "Gwalior", "Jabalpur", "Raipur",
            "Delhi", "New Delhi", "Noida", "Greater Noida", "Gurugram", "Gurgaon", "Faridabad", "Ghaziabad",
            "Chandigarh", "Mohali", "Panchkula", "Ludhiana", "Amritsar", "Jalandhar", "Patiala",
            "Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner", "Ajmer",
            "Lucknow", "Kanpur", "Varanasi", "Agra", "Prayagraj", "Allahabad", "Meerut", "Dehradun", "Roorkee",
            "Kolkata", "Calcutta", "Howrah", "Durgapur", "Siliguri", "Bhubaneswar", "Cuttack", "Rourkela",
            "Patna", "Ranchi", "Jamshedpur", "Dhanbad", "Guwahati", "Shillong", "Goa", "Uppunda", "Byndoor"
        ]

        states_and_countries = [
            "Karnataka", "Telangana", "Andhra Pradesh", "Tamil Nadu", "Kerala", "Maharashtra",
            "Gujarat", "Madhya Pradesh", "Rajasthan", "Punjab", "Haryana", "Uttar Pradesh",
            "Uttarakhand", "Himachal Pradesh", "West Bengal", "Odisha", "Bihar", "Jharkhand",
            "Assam", "Goa", "Delhi", "India", "USA", "United States", "Canada", "UK", "United Kingdom",
            "Germany", "France", "Netherlands", "Ireland", "Australia", "Singapore", "UAE", "Dubai"
        ]

        global_cities = [
            "San Francisco", "San Jose", "Sunnyvale", "Mountain View", "Palo Alto", "Santa Clara",
            "Seattle", "Redmond", "Austin", "Dallas", "Houston", "New York", "Boston", "Cambridge",
            "Chicago", "Los Angeles", "San Diego", "Atlanta", "Denver", "Phoenix", "Portland", "Miami",
            "London", "Manchester", "Birmingham", "Edinburgh", "Dublin", "Berlin", "Munich", "Frankfurt",
            "Paris", "Amsterdam", "Zurich", "Toronto", "Vancouver", "Montreal", "Singapore", "Tokyo", "Sydney", "Melbourne", "Dubai", "Remote"
        ]

        all_cities = indian_cities + global_cities

        # 1. Explicit location / address / city / residence header
        labeled_match = re.search(r'(?:location|address|city|place|current\s*city|residence)\s*[:\-–]\s*([A-Za-z0-9\s,.-]{2,70})', text, re.IGNORECASE)
        if labeled_match:
            loc = labeled_match.group(1).strip().split('\n')[0].strip()
            # If address contains District / City name
            for city in all_cities:
                if re.search(r'\b' + re.escape(city) + r'\b', loc, re.IGNORECASE):
                    if city.lower() in ["bangalore", "bengaluru", "tumkur", "tumakuru", "mysore", "mysuru", "mangaluru", "mangalore", "udupi", "manipal", "uppunda", "byndoor", "shivamogga", "shimoga", "hubli", "hubballi", "belgaum", "belagavi"]:
                        return f"{city.title()}, Karnataka"
                    return city.title()

            loc_lower_words = [w.lower().strip(".,-") for w in loc.split()]
            if loc and len(loc) <= 50 and not any(w in non_location_terms for w in loc_lower_words) and not any(c in loc for c in ['@', 'http']):
                return loc.title()

        # 2. Check City + State / City + Country (e.g. "Bengaluru, Karnataka" or "Bangalore, India" or "Tumkur, Karnataka")
        city_state_pattern = r'\b(' + '|'.join(re.escape(c) for c in all_cities) + r'),\s*(' + '|'.join(re.escape(s) for s in states_and_countries) + r')\b'
        match_city_state = re.search(city_state_pattern, text, re.IGNORECASE)
        if match_city_state:
            return f"{match_city_state.group(1).title()}, {match_city_state.group(2).title()}"

        # 3. Check City alone in top header lines (first 15 lines)
        header_text = '\n'.join(text.split('\n')[:15])
        for city in all_cities:
            if re.search(r'\b' + re.escape(city) + r'\b', header_text, re.IGNORECASE):
                if city.lower() in ["bangalore", "bengaluru", "tumkur", "tumakuru", "mysore", "mysuru", "mangaluru", "mangalore", "udupi", "manipal", "uppunda", "byndoor", "shivamogga", "shimoga", "hubli", "hubballi", "belgaum", "belagavi"]:
                    return f"{city.title()}, Karnataka"
                return city.title()

        # 4. Check College / University / Education place (e.g. "Bangalore Institute of Technology", "Polytechnic, Mangaluru", "Siddaganga Institute of Technology, Tumkur")
        for city in all_cities:
            if re.search(r'\b' + re.escape(city) + r'\b', text, re.IGNORECASE):
                if city.lower() in ["bangalore", "bengaluru", "tumkur", "tumakuru", "mysore", "mysuru", "mangaluru", "mangalore", "udupi", "manipal", "uppunda", "byndoor", "shivamogga", "shimoga", "hubli", "hubballi", "belgaum", "belagavi"]:
                    return f"{city.title()}, Karnataka"
                return city.title()

        # 5. Valid US/Canada City, ST format (with non_location_terms check)
        us_match = re.search(r'\b([A-Z][a-z]+),\s*([A-Z]{2})\b', text)
        if us_match:
            city_cand = us_match.group(1)
            state_cand = us_match.group(2)
            if state_cand in valid_state_codes and city_cand.lower() not in non_location_terms:
                return f"{city_cand}, {state_cand}"

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
