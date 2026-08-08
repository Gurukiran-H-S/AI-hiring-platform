"""
Skill Gap Analysis & Course Recommendation Engine
Identifies missing skills and recommends courses to bridge the gap.
"""

import logging
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

# Comprehensive course database mapped to skills
COURSE_DATABASE = {
    "python": [
        {
            "title": "Python for Everybody Specialization",
            "provider": "Coursera (University of Michigan)",
            "url": "https://www.coursera.org/specializations/python",
            "difficulty": "Beginner",
            "duration": "8 months",
            "rating": 4.8,
            "is_free": False,
            "skill": "Python",
        },
        {
            "title": "Complete Python Bootcamp",
            "provider": "Udemy",
            "url": "https://www.udemy.com/course/complete-python-bootcamp",
            "difficulty": "Beginner to Advanced",
            "duration": "22 hours",
            "rating": 4.6,
            "is_free": False,
            "skill": "Python",
        },
    ],
    "machine learning": [
        {
            "title": "Machine Learning Specialization",
            "provider": "Coursera (Stanford/DeepLearning.AI)",
            "url": "https://www.coursera.org/specializations/machine-learning-introduction",
            "difficulty": "Intermediate",
            "duration": "3 months",
            "rating": 4.9,
            "is_free": False,
            "skill": "Machine Learning",
        },
        {
            "title": "Practical Machine Learning with Python",
            "provider": "Google",
            "url": "https://developers.google.com/machine-learning/crash-course",
            "difficulty": "Beginner",
            "duration": "15 hours",
            "rating": 4.7,
            "is_free": True,
            "skill": "Machine Learning",
        },
    ],
    "deep learning": [
        {
            "title": "Deep Learning Specialization",
            "provider": "Coursera (DeepLearning.AI)",
            "url": "https://www.coursera.org/specializations/deep-learning",
            "difficulty": "Advanced",
            "duration": "5 months",
            "rating": 4.9,
            "is_free": False,
            "skill": "Deep Learning",
        },
    ],
    "react": [
        {
            "title": "React - The Complete Guide",
            "provider": "Udemy",
            "url": "https://www.udemy.com/course/react-the-complete-guide-incl-redux",
            "difficulty": "Beginner to Advanced",
            "duration": "48 hours",
            "rating": 4.7,
            "is_free": False,
            "skill": "React",
        },
        {
            "title": "Full Stack Open - React",
            "provider": "University of Helsinki",
            "url": "https://fullstackopen.com/en/",
            "difficulty": "Intermediate",
            "duration": "Self-paced",
            "rating": 4.8,
            "is_free": True,
            "skill": "React",
        },
    ],
    "docker": [
        {
            "title": "Docker Mastery with Kubernetes",
            "provider": "Udemy",
            "url": "https://www.udemy.com/course/docker-mastery",
            "difficulty": "Intermediate",
            "duration": "19 hours",
            "rating": 4.7,
            "is_free": False,
            "skill": "Docker",
        },
    ],
    "kubernetes": [
        {
            "title": "Kubernetes for Absolute Beginners",
            "provider": "Udemy",
            "url": "https://www.udemy.com/course/learn-kubernetes",
            "difficulty": "Beginner",
            "duration": "6 hours",
            "rating": 4.6,
            "is_free": False,
            "skill": "Kubernetes",
        },
    ],
    "aws": [
        {
            "title": "AWS Certified Solutions Architect",
            "provider": "Udemy",
            "url": "https://www.udemy.com/course/aws-certified-solutions-architect-associate-saa-c03",
            "difficulty": "Intermediate",
            "duration": "28 hours",
            "rating": 4.7,
            "is_free": False,
            "skill": "AWS",
        },
        {
            "title": "AWS Training - Free Tier",
            "provider": "AWS",
            "url": "https://aws.amazon.com/training/digital/",
            "difficulty": "Beginner",
            "duration": "Self-paced",
            "rating": 4.5,
            "is_free": True,
            "skill": "AWS",
        },
    ],
    "fastapi": [
        {
            "title": "FastAPI - The Complete Course",
            "provider": "Udemy",
            "url": "https://www.udemy.com/course/fastapi-the-complete-course",
            "difficulty": "Intermediate",
            "duration": "12 hours",
            "rating": 4.6,
            "is_free": False,
            "skill": "FastAPI",
        },
    ],
    "postgresql": [
        {
            "title": "The Complete SQL Bootcamp",
            "provider": "Udemy",
            "url": "https://www.udemy.com/course/the-complete-sql-bootcamp",
            "difficulty": "Beginner",
            "duration": "9 hours",
            "rating": 4.7,
            "is_free": False,
            "skill": "PostgreSQL",
        },
    ],
    "nlp": [
        {
            "title": "Natural Language Processing Specialization",
            "provider": "Coursera (DeepLearning.AI)",
            "url": "https://www.coursera.org/specializations/natural-language-processing",
            "difficulty": "Advanced",
            "duration": "4 months",
            "rating": 4.8,
            "is_free": False,
            "skill": "NLP",
        },
    ],
    "typescript": [
        {
            "title": "Understanding TypeScript",
            "provider": "Udemy",
            "url": "https://www.udemy.com/course/understanding-typescript",
            "difficulty": "Intermediate",
            "duration": "15 hours",
            "rating": 4.6,
            "is_free": False,
            "skill": "TypeScript",
        },
    ],
    "java": [
        {
            "title": "Java Programming Masterclass",
            "provider": "Udemy",
            "url": "https://www.udemy.com/course/java-the-complete-java-developer-course",
            "difficulty": "Beginner to Advanced",
            "duration": "80 hours",
            "rating": 4.7,
            "is_free": False,
            "skill": "Java",
        },
    ],
    "git": [
        {
            "title": "Git Complete: The Definitive Guide",
            "provider": "Udemy",
            "url": "https://www.udemy.com/course/git-complete",
            "difficulty": "Beginner",
            "duration": "6 hours",
            "rating": 4.5,
            "is_free": False,
            "skill": "Git",
        },
    ],
    "leadership": [
        {
            "title": "Leading Teams",
            "provider": "Coursera (University of Michigan)",
            "url": "https://www.coursera.org/learn/leading-teams",
            "difficulty": "Beginner",
            "duration": "4 weeks",
            "rating": 4.7,
            "is_free": False,
            "skill": "Leadership",
        },
    ],
    "agile": [
        {
            "title": "Agile Project Management",
            "provider": "Google (Coursera)",
            "url": "https://www.coursera.org/learn/agile-project-management",
            "difficulty": "Beginner",
            "duration": "4 weeks",
            "rating": 4.8,
            "is_free": False,
            "skill": "Agile",
        },
    ],
}


class SkillGapAnalyzer:
    """Analyzes skill gaps between candidate and job requirements."""

    def analyze(
        self,
        candidate_skills: List[str],
        required_skills: List[str],
        preferred_skills: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        candidate_lower = {s.lower() for s in candidate_skills}
        required_lower = [s.lower() for s in required_skills]
        preferred_lower = [s.lower() for s in (preferred_skills or [])]

        matched_required = [s for s in required_lower if s in candidate_lower]
        missing_required = [s for s in required_lower if s not in candidate_lower]
        matched_preferred = [s for s in preferred_lower if s in candidate_lower]
        missing_preferred = [s for s in preferred_lower if s not in candidate_lower]

        total_required = len(required_lower)
        gap_count = len(missing_required)

        if total_required > 0:
            gap_percentage = (gap_count / total_required) * 100
            match_percentage = 100 - gap_percentage
        else:
            gap_percentage = 0
            match_percentage = 100

        # Categorize missing skills by domain
        missing_categorized = self._categorize_skills(missing_required + missing_preferred)

        return {
            "candidate_skills": [s.title() for s in candidate_lower],
            "matched_required_skills": [s.title() for s in matched_required],
            "missing_required_skills": [s.title() for s in missing_required],
            "matched_preferred_skills": [s.title() for s in matched_preferred],
            "missing_preferred_skills": [s.title() for s in missing_preferred],
            "match_percentage": round(match_percentage, 1),
            "gap_percentage": round(gap_percentage, 1),
            "total_required": total_required,
            "total_matched": len(matched_required),
            "total_missing": gap_count,
            "missing_by_category": missing_categorized,
            "priority_skills_to_learn": missing_required[:5],
            "skill_readiness": self._get_readiness_level(match_percentage),
        }

    def _categorize_skills(self, skills: List[str]) -> Dict[str, List[str]]:
        categories = {
            "Programming Languages": ["python", "java", "javascript", "typescript", "c++", "go", "rust"],
            "Web Frameworks": ["react", "angular", "vue", "fastapi", "django", "flask", "express"],
            "Databases": ["postgresql", "mysql", "mongodb", "redis", "elasticsearch"],
            "Cloud & DevOps": ["aws", "azure", "gcp", "docker", "kubernetes", "terraform"],
            "AI/ML": ["machine learning", "deep learning", "nlp", "tensorflow", "pytorch"],
            "Tools": ["git", "jira", "figma", "postman"],
            "Soft Skills": ["leadership", "agile", "scrum", "communication"],
        }

        result = {}
        for skill in skills:
            placed = False
            for category, keywords in categories.items():
                if skill.lower() in keywords:
                    result.setdefault(category, []).append(skill.title())
                    placed = True
                    break
            if not placed:
                result.setdefault("Other", []).append(skill.title())

        return result

    def _get_readiness_level(self, match_pct: float) -> str:
        if match_pct >= 80:
            return "Ready"
        elif match_pct >= 60:
            return "Nearly Ready"
        elif match_pct >= 40:
            return "Developing"
        else:
            return "Needs Significant Preparation"


class CourseRecommender:
    """Recommends courses based on skill gaps."""

    def recommend(
        self,
        missing_skills: List[str],
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """Get course recommendations for missing skills."""
        recommendations = []
        seen_titles = set()

        for skill in missing_skills:
            skill_lower = skill.lower()

            # Direct match
            courses = COURSE_DATABASE.get(skill_lower, [])

            # Partial match
            if not courses:
                for key, value in COURSE_DATABASE.items():
                    if key in skill_lower or skill_lower in key:
                        courses = value
                        break

            for course in courses:
                if course["title"] not in seen_titles:
                    seen_titles.add(course["title"])
                    recommendations.append({
                        **course,
                        "skill_targeted": skill.title(),
                        "relevance_score": 1.0 if skill_lower in COURSE_DATABASE else 0.8,
                    })

        # Sort by rating
        recommendations.sort(key=lambda x: x.get("rating", 0), reverse=True)

        return recommendations[:limit]

    def recommend_for_job(
        self,
        gap_analysis: Dict[str, Any],
        limit: int = 8,
    ) -> List[Dict[str, Any]]:
        """Get course recommendations from a gap analysis result."""
        missing = gap_analysis.get("missing_required_skills", []) + \
                  gap_analysis.get("missing_preferred_skills", [])
        return self.recommend(missing, limit)


# Singletons
skill_gap_analyzer = SkillGapAnalyzer()
course_recommender = CourseRecommender()
