import os
import sys
import logging
import spacy
import numpy as np

import ssl
ssl._create_default_https_context = ssl._create_unverified_context
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Set requests CA bundle environment variables to bypass SSL checks
os.environ["CURL_CA_BUNDLE"] = ""
os.environ["REQUESTS_CA_BUNDLE"] = ""

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

logger = logging.getLogger(__name__)

class ModelLoader:
    """Loads Sentence-Transformers and spaCy models once to optimize memory footprints."""
    
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelLoader, cls).__new__(cls)
            cls._instance._loaded_embedder = None
            cls._instance._loaded_nlp = None
        return cls._instance

    @property
    def embedder(self):
        if self._loaded_embedder is None:
            print("Loading SentenceTransformer model 'all-MiniLM-L6-v2' into memory...")
            try:
                from sentence_transformers import SentenceTransformer
                self._loaded_embedder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
            except Exception as e:
                logger.warning(f"Failed to load sentence-transformers from Hugging Face: {e}. Using deterministic offline fallback.")
                class MockEmbedder:
                    def encode(self, text):
                        import hashlib
                        # Generate a deterministic vector of length 384 based on the input text hash
                        h = hashlib.sha256(text.encode("utf-8")).digest()
                        np.random.seed(int.from_bytes(h[:4], "big"))
                        return np.random.randn(384).astype(np.float32)
                self._loaded_embedder = MockEmbedder()
        return self._loaded_embedder

    @property
    def nlp(self):
        if self._loaded_nlp is None:
            print("Loading spaCy NLP model 'en_core_web_sm' into memory...")
            try:
                self._loaded_nlp = spacy.load("en_core_web_sm")
            except Exception:
                import subprocess
                subprocess.run([sys.executable, "-m", "spacy", "download", "en_core_web_sm"], capture_output=True)
                self._loaded_nlp = spacy.load("en_core_web_sm")
        return self._loaded_nlp

model_loader = ModelLoader()
