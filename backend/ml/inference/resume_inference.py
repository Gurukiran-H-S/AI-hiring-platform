import os
import sys
from typing import Dict, Any

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from ml.preprocessing.resume_parser import resume_parser

def parse_resume_text(text: str) -> Dict[str, Any]:
    """Parse resume text to extract skills, experience, and contact details."""
    return resume_parser.parse(text)
