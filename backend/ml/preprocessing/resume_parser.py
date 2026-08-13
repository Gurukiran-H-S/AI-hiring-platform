import os
import sys
import re
import logging
from typing import Dict, List, Any, Optional
import spacy
from spacy.matcher import PhraseMatcher

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from ml.preprocessing.skill_normalizer import skill_normalizer

logger = logging.getLogger(__name__)

# Core section headers mapping
SECTION_HEADERS = {
    "summary": ["summary", "objective", "profile", "about", "overview", "career objective"],
    "experience": ["experience", "work experience", "employment", "work history", "professional experience", "internship"],
    "education": ["education", "academic", "qualification", "educational background"],
    "skills": ["skills", "technical skills", "core competencies", "expertise", "proficiencies", "technologies"],
    "certifications": ["certifications", "certificates", "licenses", "credentials"],
    "projects": ["projects", "personal projects", "academic projects", "portfolio"],
    "languages": ["languages", "language proficiency"]
}

class ResumeParser:
    """Production-grade resume parser using spaCy, PhraseMatcher, and Regex."""

    def __init__(self):
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except Exception:
            logger.warning("spaCy model 'en_core_web_sm' not found, installing fallback...")
            import subprocess
            subprocess.run([sys.executable, "-m", "spacy", "download", "en_core_web_sm"], capture_output=True)
            self.nlp = spacy.load("en_core_web_sm")
        
        self.matcher = PhraseMatcher(self.nlp.vocab)
        self._build_phrase_matcher()

    def _build_phrase_matcher(self):
        """Loads canonical skills into spaCy PhraseMatcher."""
        skills = list(set(skill_normalizer.skills))
        if not skills:
            skills = ["Python", "Java", "SQL", "Machine Learning", "Deep Learning", "React", "Docker", "AWS"]
        
        patterns = [self.nlp.make_doc(text) for text in skills]
        self.matcher.add("SKILL_PATTERNS", patterns)

    def parse(self, text: str) -> Dict[str, Any]:
        """Extract profile information, skills, and sections from resume raw text."""
        if not text:
            return {}

        doc = self.nlp(text)
        
        # 1. Contact details extraction via Regex
        email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
        email = email_match.group(0) if email_match else None

        phone_match = re.search(r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text)
        phone = phone_match.group(0) if phone_match else None

        # Name extraction fallback
        name = None
        for ent in doc.ents:
            if ent.label_ == "PERSON":
                # Ensure it doesn't contain digits or email/phone elements
                candidate = ent.text.strip()
                if len(candidate.split()) >= 2 and not any(char.isdigit() for char in candidate):
                    name = candidate
                    break

        # 2. Extract sections based on headers
        sections = self._extract_sections(text)

        # 3. Extract skills using PhraseMatcher & Regex fallback
        extracted_skills = self._extract_skills(doc, text)

        return {
            "name": name or "Candidate Profile",
            "email": email,
            "phone": phone,
            "location": self._extract_location(doc, text),
            "summary": sections.get("summary", ""),
            "skills": extracted_skills,
            "education": self._extract_education(sections.get("education", "")),
            "experience": self._extract_experience(sections.get("experience", "")),
            "certifications": self._extract_certifications(sections.get("certifications", "")),
            "projects": self._extract_projects(sections.get("projects", "")),
            "languages": self._extract_languages(sections.get("languages", ""))
        }

    def _extract_sections(self, text: str) -> Dict[str, str]:
        """Split raw text into constituent sections based on section headers."""
        lines = text.split("\n")
        sections = {}
        current_section = None
        current_content = []

        for line in lines:
            cleaned = line.strip().lower().replace(":", "")
            is_header = False
            for sec_key, headers in SECTION_HEADERS.items():
                if cleaned in headers:
                    if current_section:
                        sections[current_section] = "\n".join(current_content).strip()
                    current_section = sec_key
                    current_content = []
                    is_header = True
                    break
            
            if not is_header:
                current_content.append(line)

        if current_section:
            sections[current_section] = "\n".join(current_content).strip()

        return sections

    def _extract_skills(self, doc, text: str) -> List[str]:
        """Extract skills using PhraseMatcher + case-insensitive token lookup."""
        skills = []
        
        # PhraseMatcher matches
        matches = self.matcher(doc)
        for _, start, end in matches:
            span = doc[start:end]
            skills.append(span.text)

        # Regex fallback for standard keywords
        for k in skill_normalizer.aliases.keys():
            if re.search(r'\b' + re.escape(k) + r'\b', text.lower()):
                skills.append(skill_normalizer.aliases[k])

        return list(set(skills))

    def _extract_location(self, doc, text: str) -> Optional[str]:
        """Extract GPE (Geopolitical Entity) location names."""
        for ent in doc.ents:
            if ent.label_ == "GPE":
                return ent.text.strip()
        return None

    def _extract_education(self, text: str) -> List[Dict[str, Any]]:
        """Parse education details (institutions, degree titles)."""
        education = []
        if not text:
            return education
        
        # Simple line-by-line parsing
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        for line in lines[:5]:  # Take first few lines
            education.append({"degree": line, "institution": "", "year": ""})
        return education

    def _extract_experience(self, text: str) -> List[Dict[str, Any]]:
        """Parse work experience details."""
        experience = []
        if not text:
            return experience
        
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        for line in lines[:4]:
            experience.append({"title": line, "company": "", "duration": "", "desc": ""})
        return experience

    def _extract_certifications(self, text: str) -> List[Dict[str, Any]]:
        """Parse professional certifications."""
        certs = []
        if not text:
            return certs
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        for line in lines[:4]:
            certs.append({"name": line, "issuer": "", "year": ""})
        return certs

    def _extract_projects(self, text: str) -> List[Dict[str, Any]]:
        """Parse portfolio projects."""
        projects = []
        if not text:
            return projects
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        for line in lines[:4]:
            projects.append({"name": line, "desc": ""})
        return projects

    def _extract_languages(self, text: str) -> List[str]:
        """Parse spoken/written languages."""
        if not text:
            return []
        return [l.strip() for l in text.replace(",", "\n").split("\n") if l.strip()]

resume_parser = ResumeParser()
