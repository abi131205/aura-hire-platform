import numpy as np
import pickle
from pathlib import Path

class SemanticScorer:
    def __init__(self, embeddings_cache_path=None):
        self.embeddings_cache_path = Path(embeddings_cache_path) if embeddings_cache_path else None
        self.embeddings_dict = {}
        self.candidate_ids = []
        self.embeddings_matrix = None
        self.id_to_index = {}
        
        if self.embeddings_cache_path and self.embeddings_cache_path.exists():
            self.load_cache()

    def load_cache(self):
        """
        Loads pre-computed candidate embeddings and candidate_ids from the pickle cache.
        """
        try:
            with open(self.embeddings_cache_path, 'rb') as f:
                cache_data = pickle.load(f)
                
            # The cache contains 'embeddings', 'candidate_ids', and optionally 'skill_alias_map'
            self.candidate_ids = cache_data.get('candidate_ids', [])
            embeddings = cache_data.get('embeddings', None)
            
            if embeddings is not None:
                # Ensure it's a numpy array
                self.embeddings_matrix = np.array(embeddings)
                
                # Check if embeddings are empty or not
                if len(self.embeddings_matrix) > 0:
                    # L2 normalize embeddings for fast cosine similarity via dot product
                    norms = np.linalg.norm(self.embeddings_matrix, axis=1, keepdims=True)
                    # Avoid division by zero
                    norms[norms == 0] = 1e-9
                    self.embeddings_matrix = self.embeddings_matrix / norms
                
                # Map candidate_id to its index in the matrix for quick lookup
                self.id_to_index = {cid: idx for idx, cid in enumerate(self.candidate_ids)}
        except Exception as e:
            print(f"Warning: Failed to load embeddings cache from {self.embeddings_cache_path}: {e}")

    def score_candidates(self, jd_embedding, candidates_list):
        """
        Computes cosine similarity between the JD embedding and all candidates.
        Returns a dictionary mapping candidate_id -> normalized semantic score [0, 1].
        """
        # Ensure JD embedding is L2 normalized
        jd_norm = np.linalg.norm(jd_embedding)
        if jd_norm > 0:
            jd_vec = jd_embedding / jd_norm
        else:
            jd_vec = jd_embedding
            
        scores = {}
        
        # If cache is loaded and we have a valid matrix, compute similarity in bulk
        if self.embeddings_matrix is not None and len(self.embeddings_matrix) > 0:
            # np.dot is extremely fast for 100k vectors
            raw_similarities = np.dot(self.embeddings_matrix, jd_vec)
            
            # Map back to candidate IDs
            for cid in [c['candidate_id'] for c in candidates_list]:
                idx = self.id_to_index.get(cid)
                if idx is not None:
                    sim = raw_similarities[idx]
                    # Map cosine similarity (typically in [-1, 1], but practically in [0, 1] for these texts)
                    # Min-Max scale or simple clipping to [0, 1]
                    norm_score = max(0.0, float(sim))
                    scores[cid] = norm_score
                else:
                    # Fallback if candidate not in cache (should not happen for full pool)
                    scores[cid] = 0.0
        else:
            # Fallback if cache is missing (e.g. during standalone test runs without precompute)
            for c in candidates_list:
                scores[c['candidate_id']] = 0.0
                
        return scores
