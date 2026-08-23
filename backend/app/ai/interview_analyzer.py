"""
AI Mock Interview NLP Engine:
- Semantic expected answer point detection (1 / Mentioned vs 0 / Not Mentioned)
- Multi-tier semantic similarity & anti-false-positive validation
- Question & overall interview scoring (70% Coverage + 30% Semantic Relevance)
- Communication metrics & filler word analysis
- Constructive feedback & skill gap synthesis
"""

import re
from typing import List, Dict, Any, Optional, Tuple

_st_model = None
_st_attempted = False

def _get_st_model():
    global _st_model, _st_attempted
    if not _st_attempted:
        _st_attempted = True
        try:
            from sentence_transformers import SentenceTransformer
            _st_model = SentenceTransformer("all-MiniLM-L6-v2")
        except Exception:
            _st_model = None
    return _st_model


FILLER_REGEX = re.compile(r"\b(um|uh|like|you know|actually|basically|sort of|kind of|i mean|right)\b", re.IGNORECASE)

SYNONYM_MAP = {
    "containerization": ["docker", "container", "containers", "podman", "kubernetes", "k8s"],
    "documentation": ["swagger", "openapi", "redoc", "docs", "docstring", "api docs"],
    "type validation": ["pydantic", "type hints", "type checking", "validation", "schemas", "data types"],
    "async support": ["asyncio", "asynchronous", "async", "await", "concurrency", "non-blocking", "event loop"],
    "rest api": ["restful", "http methods", "endpoints", "get post put delete", "json api", "http api"],
    "decorators": ["wrapper", "meta programming", "@", "higher order function", "function wrapper"],
    "database indexing": ["b-tree", "index", "indexes", "query optimization", "explain analyze", "indexed column"],
    "statelessness": ["stateless", "no session state", "independent requests", "jwt", "bearer token"],
    "orm": ["sqlalchemy", "hibernate", "django orm", "prisma", "database abstraction"],
    "caching": ["redis", "memcached", "in-memory cache", "cache hit", "cache invalidation"],
    "ci/cd": ["continuous integration", "github actions", "jenkins", "pipeline", "automated deployment"],
    "unit testing": ["pytest", "unittest", "test suite", "mocking", "fixtures", "test cases"],
}


def clean_text(text: str) -> str:
    """Normalize whitespace and lowercase."""
    return re.sub(r"\s+", " ", text or "").strip().lower()


def split_sentences(text: str) -> List[str]:
    """Split transcript into individual sentences / clauses for fine-grained matching."""
    if not text:
        return []
    sentences = re.split(r"[.!?;\n]+", text)
    cleaned = [s.strip() for s in sentences if len(s.strip()) > 3]
    return cleaned if cleaned else [text.strip()]


def calculate_semantic_similarity(text1: str, text2: str) -> float:
    """Calculate cosine similarity using SentenceTransformers or token overlap fallback."""
    if not text1 or not text2:
        return 0.0

    model = _get_st_model()
    if model is not None:
        try:
            from sentence_transformers import util
            emb1 = model.encode(text1, convert_to_tensor=True)
            emb2 = model.encode(text2, convert_to_tensor=True)
            sim = util.cos_sim(emb1, emb2).item()
            return max(0.0, min(1.0, float(sim)))
        except Exception:
            pass

    # Fallback: Normalized Jaccard / Token Overlap
    words1 = set(re.findall(r"\b\w{3,}\b", text1.lower()))
    words2 = set(re.findall(r"\b\w{3,}\b", text2.lower()))
    if not words1 or not words2:
        return 0.0
    intersection = len(words1 & words2)
    union = len(words1 | words2)
    return round(intersection / union, 2)


STOPWORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "as", "at",
    "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "could", "did", "do",
    "does", "doing", "down", "during", "each", "few", "for", "from", "further", "had", "has", "have", "having",
    "he", "her", "here", "hers", "herself", "him", "himself", "his", "how", "i", "if", "in", "into", "is", "it",
    "its", "itself", "just", "me", "more", "most", "my", "myself", "no", "nor", "not", "now", "of", "off", "on",
    "once", "only", "or", "other", "our", "ours", "ourselves", "out", "over", "own", "same", "she", "should", "so",
    "some", "such", "than", "that", "the", "their", "theirs", "them", "themselves", "then", "there", "these",
    "they", "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "we", "were", "what",
    "when", "where", "which", "while", "who", "whom", "why", "with", "would", "you", "your", "yours", "yourself",
    "yourselves", "based", "using", "useful", "explain", "describe", "build", "implemented", "configured", "verified"
}


def normalize_keywords(text: str) -> List[str]:
    """Extract significant conceptual keywords from text."""
    cleaned = re.sub(r"[^\w\s]", " ", text or "").lower()
    return [w for w in cleaned.split() if w not in STOPWORDS and len(w) >= 1]


def are_words_similar(w1: str, w2: str) -> bool:
    """Check if two words match exactly or share root stem (e.g., api/apis, container/containers)."""
    if w1 == w2:
        return True
    if len(w1) >= 3 and len(w2) >= 3:
        if w1.startswith(w2) or w2.startswith(w1):
            return True
    return False


def evaluate_expected_point(point_text: str, transcript: str, sentences: List[str]) -> Dict[str, Any]:
    """
    Evaluates whether an expected point was mentioned in the candidate transcript.
    Returns:
    {
        "expected_point": point_text,
        "matched": True/False,
        "confidence": float (0.0 - 1.0),
        "evidence_text": matching sentence snippet or None
    }
    """
    clean_point = clean_text(point_text)
    clean_trans = clean_text(transcript)

    if not clean_trans:
        return {
            "expected_point": point_text,
            "matched": False,
            "confidence": 0.0,
            "evidence_text": None,
        }

    # 1. Exact or near-exact phrase match in full transcript
    norm_point = re.sub(r"[^\w\s]", " ", clean_point).strip()
    norm_trans = re.sub(r"[^\w\s]", " ", clean_trans).strip()

    if norm_point in norm_trans or clean_point in clean_trans:
        evidence = next((s for s in sentences if any(w in s.lower() for w in norm_point.split())), transcript[:120])
        return {
            "expected_point": point_text,
            "matched": True,
            "confidence": 0.98,
            "evidence_text": evidence,
        }

    # 2. Check Synonym & Semantic equivalence mapping
    for key, synonyms in SYNONYM_MAP.items():
        if key in clean_point or any(syn in clean_point for syn in synonyms):
            for syn in synonyms:
                if syn in clean_trans or syn in norm_trans:
                    evidence = next((s for s in sentences if syn in s.lower()), transcript[:120])
                    return {
                        "expected_point": point_text,
                        "matched": True,
                        "confidence": 0.94,
                        "evidence_text": evidence,
                    }

    # 3. Sentence-level fine-grained keyword overlap & semantic similarity
    point_keywords = normalize_keywords(point_text)
    best_sim = 0.0
    best_sentence = None

    for sentence in sentences:
        sent_keywords = normalize_keywords(sentence)
        kw_overlap = sum(1 for pw in point_keywords if any(are_words_similar(pw, sw) for sw in sent_keywords))

        # Precision-guided keyword matching
        if len(point_keywords) == 1:
            if kw_overlap == 1 and point_keywords[0] not in {"point", "topic", "concept", "item", "thing"}:
                return {
                    "expected_point": point_text,
                    "matched": True,
                    "confidence": 0.90,
                    "evidence_text": sentence.strip(),
                }
        elif len(point_keywords) == 2:
            if kw_overlap == 2:
                return {
                    "expected_point": point_text,
                    "matched": True,
                    "confidence": 0.92,
                    "evidence_text": sentence.strip(),
                }
        elif len(point_keywords) >= 3:
            if kw_overlap >= 2 and (kw_overlap / len(point_keywords)) >= 0.50:
                return {
                    "expected_point": point_text,
                    "matched": True,
                    "confidence": 0.92,
                    "evidence_text": sentence.strip(),
                }

        sim = calculate_semantic_similarity(point_text, sentence)
        if sim > best_sim:
            best_sim = sim
            best_sentence = sentence

    # Also compare against whole transcript
    whole_sim = calculate_semantic_similarity(point_text, transcript)
    if whole_sim > best_sim:
        best_sim = whole_sim
        best_sentence = transcript[:150]

    # Threshold for positive match
    MATCH_THRESHOLD = 0.60
    is_matched = best_sim >= MATCH_THRESHOLD

    return {
        "expected_point": point_text,
        "matched": bool(is_matched),
        "confidence": round(best_sim, 2),
        "evidence_text": best_sentence if is_matched else None,
    }


def analyze_transcript(
    transcript: str,
    question_text: str,
    expected_points: List[Dict[str, Any]],
    duration_seconds: int = 0
) -> Dict[str, Any]:
    """
    Main analysis pipeline for a candidate's speech response to a single question.
    """
    clean_trans = transcript.strip()

    # If empty / silence
    if not clean_trans:
        return {
            "point_results": [
                {
                    "expected_point": p.get("point", str(p)),
                    "matched": False,
                    "confidence": 0.0,
                    "evidence_text": None
                }
                for p in expected_points
            ],
            "coverage_score": 0.0,
            "semantic_score": 0.0,
            "answer_score": 0.0,
            "filler_words_count": 0,
            "response_status": "NO_SPEECH",
            "communication": {
                "filler_words": 0,
                "word_count": 0,
                "words_per_minute": 0,
                "clarity_level": "No response detected"
            }
        }

    sentences = split_sentences(clean_trans)

    # 1. Evaluate each expected answer point
    point_results = []
    matched_weight = 0.0
    total_weight = 0.0

    for item in expected_points:
        p_text = item.get("point", str(item)) if isinstance(item, dict) else str(item)
        p_weight = float(item.get("weight", 1.0)) if isinstance(item, dict) else 1.0
        total_weight += p_weight

        res = evaluate_expected_point(p_text, clean_trans, sentences)
        point_results.append(res)
        if res["matched"]:
            matched_weight += p_weight

    # 2. Calculate Answer Coverage (Percentage)
    coverage_score = round((matched_weight / max(1.0, total_weight)) * 100.0, 1)

    # 3. Calculate Overall Semantic Relevance to Question
    semantic_sim = calculate_semantic_similarity(question_text, clean_trans)
    # Boost if candidate covered points
    if coverage_score >= 80:
        semantic_sim = max(semantic_sim, 0.85)
    elif coverage_score >= 50:
        semantic_sim = max(semantic_sim, 0.70)
    semantic_score = round(semantic_sim * 100.0, 1)

    # 4. Final Question Score Formula: 70% Answer Coverage + 30% Semantic Relevance
    answer_score = round((0.70 * coverage_score) + (0.30 * semantic_score), 1)
    answer_score = min(100.0, max(0.0, answer_score))

    # 5. Communication & Filler Words Analysis
    filler_matches = FILLER_REGEX.findall(clean_trans)
    filler_count = len(filler_matches)
    words = clean_trans.split()
    word_count = len(words)
    wpm = int((word_count / max(1, duration_seconds)) * 60) if duration_seconds > 0 else (word_count * 3)

    clarity = "High Clarity"
    if filler_count > 6 or (word_count > 0 and (filler_count / word_count) > 0.12):
        clarity = "Moderate Filler Usage"
    elif word_count < 10:
        clarity = "Brief Answer"

    return {
        "point_results": point_results,
        "coverage_score": coverage_score,
        "semantic_score": semantic_score,
        "answer_score": answer_score,
        "filler_words_count": filler_count,
        "response_status": "COMPLETED",
        "communication": {
            "filler_words": filler_count,
            "word_count": word_count,
            "words_per_minute": wpm,
            "clarity_level": clarity
        }
    }


def synthesize_interview_report(
    responses: List[Dict[str, Any]],
    questions: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Synthesizes overall interview metrics, strengths, improvement areas, and missing skill topics.
    """
    if not responses:
        return {
            "final_score": 0.0,
            "technical_score": 0.0,
            "coverage_score": 0.0,
            "relevance_score": 0.0,
            "communication_score": 0.0,
            "strengths": ["No responses submitted yet."],
            "improvements": ["Complete the interview questions to receive actionable feedback."],
            "missing_topics": [],
        }

    scores = [r.get("answer_score", 0.0) for r in responses]
    coverages = [r.get("coverage_score", 0.0) for r in responses]
    relevances = [r.get("semantic_score", 0.0) for r in responses]
    fillers = sum(r.get("filler_words_count", 0) for r in responses)

    final_score = round(sum(scores) / max(1, len(scores)), 1)
    avg_coverage = round(sum(coverages) / max(1, len(coverages)), 1)
    avg_relevance = round(sum(relevances) / max(1, len(relevances)), 1)

    # Communication score out of 100 based on clarity and manageable filler words
    comm_score = max(50.0, min(100.0, 100.0 - (fillers * 2.5)))

    # Collect strengths and missing points
    strengths = []
    missing_topics = []
    improvements = []

    for r in responses:
        for p in r.get("point_results", []):
            pt = p.get("expected_point", "")
            if p.get("matched"):
                if pt and pt not in strengths and len(strengths) < 4:
                    strengths.append(f"Demonstrated solid knowledge of {pt}")
            else:
                if pt and pt not in missing_topics:
                    missing_topics.append(pt)

    if not strengths:
        strengths = ["Participated in full interview session", "Familiarity with foundational concepts"]

    for topic in missing_topics[:4]:
        improvements.append(f"Deepen knowledge and mention specific details regarding {topic}")

    if not improvements:
        improvements = ["Maintain consistent speaking pace and continue practicing technical depth."]

    return {
        "final_score": final_score,
        "technical_score": final_score,
        "coverage_score": avg_coverage,
        "relevance_score": avg_relevance,
        "communication_score": round(comm_score, 1),
        "strengths": strengths,
        "improvements": improvements,
        "missing_topics": missing_topics[:6],
    }
