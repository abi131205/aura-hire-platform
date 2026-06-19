import zipfile
import xml.etree.ElementTree as ET
import re
from pathlib import Path

# Canonical skills mentioned in the JD
CANONICAL_SKILLS = {
    "embeddings": [
        "embeddings", "embedding", "sentence-transformers", "sentence transformers",
        "sentence-transformer", "openai embeddings", "bge", "e5", "dense retrieval"
    ],
    "vector_databases": [
        "vector database", "vector databases", "vector db", "vector search",
        "pinecone", "weaviate", "qdrant", "milvus", "opensearch", "elasticsearch", "faiss"
    ],
    "python": [
        "python", "pyspark"
    ],
    "ranking_evaluation": [
        "evaluation", "evaluation frameworks", "ndcg", "mrr", "map", 
        "a/b testing", "ab testing", "metrics", "experimentation"
    ],
    "llm_fine_tuning": [
        "fine-tuning", "fine tuning", "lora", "qlora", "peft"
    ],
    "learning_to_rank": [
        "learning-to-rank", "learning to rank", "xgboost", "ltr"
    ],
    "nlp_ir": [
        "nlp", "natural language processing", "information retrieval", "ir", "search", "indexing"
    ]
}

# Consulting/Service companies to explicitly penalize (from the JD)
CONSULTING_COMPANIES = {
    "tcs", "infosys", "wipro", "accenture", "cognizant", "capgemini", 
    "tata consultancy services", "wipro technologies", "infosys limited"
}

def extract_text_from_docx(docx_path):
    """
    Extracts plain text from a .docx file using built-in zipfile and xml parser.
    Robust, fast, and does not require python-docx.
    """
    word_namespace = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
    para_tag = word_namespace + 'p'
    text_tag = word_namespace + 't'
    
    try:
        with zipfile.ZipFile(docx_path) as docx:
            tree = ET.fromstring(docx.read('word/document.xml'))
            paragraphs = []
            for paragraph in tree.iter(para_tag):
                texts = [node.text for node in paragraph.iter(text_tag) if node.text]
                if texts:
                    paragraphs.append(''.join(texts))
            return '\n'.join(paragraphs)
    except Exception as e:
        raise RuntimeError(f"Error reading docx file {docx_path}: {e}")

class JobDescriptionParser:
    def __init__(self, docx_path):
        self.docx_path = Path(docx_path)
        self.raw_text = ""
        self.skills = []
        self.min_exp = 5.0
        self.max_exp = 9.0
        self.parse()

    def parse(self):
        # Extract raw text
        self.raw_text = extract_text_from_docx(self.docx_path)
        
        # Parse experience requirement (looks for X-Y years)
        exp_match = re.search(r"(\d+)[–-](\d+)\s+years", self.raw_text)
        if exp_match:
            self.min_exp = float(exp_match.group(1))
            self.max_exp = float(exp_match.group(2))
        else:
            # Fallback based on typical JD search
            self.min_exp = 5.0
            self.max_exp = 9.0
            
        # Extract skills (using canonical list as the base)
        self.skills = list(CANONICAL_SKILLS.keys())

    def get_clean_text_for_embedding(self):
        """
        Returns a cleaned, condensed version of the JD text suitable for semantic embedding.
        Focuses on required technical depth, skills, and expectations.
        """
        # We can extract paragraphs containing important keywords or return a subset.
        # Since the JD is relatively short (~9.5k chars), embedding the full text works well.
        return self.raw_text

    def get_embedding(self, model):
        """
        Computes the semantic embedding of the JD text.
        """
        text = self.get_clean_text_for_embedding()
        return model.encode(text, convert_to_numpy=True)
