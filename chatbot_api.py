# -----------------------------
# chatbot_api.py (FastAPI backend with user authentication & mode-specific endpoints)
# -----------------------------
from fastapi import FastAPI, HTTPException, Depends, Header, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from pymongo import MongoClient
from groq import Groq
import datetime
import warnings
from fastapi.middleware.cors import CORSMiddleware
from bson import ObjectId
import jwt
import os
from dotenv import load_dotenv
import google.generativeai as genai
import string
import requests
from xml.etree import ElementTree
from transformers import AutoTokenizer, AutoModel
import torch
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import chromadb
from typing import Optional
from datetime import timezone

# -----------------------------
# 1. Setup
# -----------------------------
load_dotenv()
warnings.filterwarnings("ignore", message="You appear to be connected to a CosmosDB cluster")

groq_api_key = os.getenv("GROQ_API")
mongo_uri = os.getenv("MONGO_URI")
JWT_SECRET = os.getenv("JWT_SECRET", "supersecretkey")

if not groq_api_key or not mongo_uri:
    raise ValueError("❌ Missing API keys or MongoDB URI")

# -----------------------------
# 1. Configure Gemini API
# -----------------------------
GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# -----------------------------
# 2. Init Clients
# -----------------------------
client_groq = Groq(api_key=groq_api_key)
mongo_client = MongoClient(mongo_uri)
db = mongo_client["pubmed_db"]
collection = db["chatbot_articles"]
users_collection = db["users"]
semantic_collection = db["articles"]

# -----------------------------
# 3. FastAPI App
# -----------------------------
app = FastAPI(
    title="Biomedical Student Chatbot API",
    description="Mode-specific endpoints for Concept, Literature Review, Citation, Exam Notes",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# 4. Auth & Schemas
# -----------------------------
def get_current_user(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("id")
        email = payload.get("email")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return {"user_id": str(user_id), "email": email}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

class ChatRequest(BaseModel):
    user_input: str

class SemanticQuery(BaseModel):
    query: str
    top_k: Optional[int] = 10
    threshold: Optional[float] = 0.75

# -----------------------------
# 5. Core Functions (Chatbot)
# -----------------------------
def generate_groq_response(prompt, mode):
    system_prompt = f"""
    You are a biomedical tutor chatbot for students.
    Mode: {mode}
    - If mode is Concept, explain tough biomedical topics in very simple terms with analogies.
    - If mode is Literature Review, summarize 3–5 key findings (2021–2024) and add citations.
    - If mode is Citation, return properly formatted references (APA/IEEE/Vancouver/MLA).
    - If mode is Exam Notes, write ~200 word concise notes with 2 references.
    Keep answers clear, student-friendly, and accurate.
    """
    try:
        response = client_groq.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=700,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Groq API error: {str(e)}")

def save_to_mongo(user_input, response, mode, user_id):
    record = {
        "user_id": user_id,
        "mode": mode,
        "user_query": user_input,
        "llm_response": response,
        "timestamp": datetime.datetime.now(),
    }
    return collection.insert_one(record).inserted_id

def get_from_mongo(user_input, mode, user_id):
    record = collection.find_one(
        {"user_id": user_id, "mode": mode, "user_query": user_input},
        sort=[("timestamp", -1)],
    )
    return record["llm_response"] if record else None

# -----------------------------
# 6. Mode-specific Endpoints (Chatbot)
# -----------------------------
@app.post("/concept")
def concept_endpoint(request: ChatRequest, user: dict = Depends(get_current_user)):
    user_id = user['user_id']
    mode = "Concept"
    user_input = request.user_input.strip()
    if not user_input:
        raise HTTPException(status_code=400, detail="User input cannot be empty")

    cached = get_from_mongo(user_input, mode, user_id)
    if cached:
        return {"status": "cached", "response": cached}

    response = generate_groq_response(user_input, mode)
    save_to_mongo(user_input, response, mode, user_id)
    return {"status": "new", "response": response}

@app.post("/literature_review")
def literature_review_endpoint(request: ChatRequest, user: dict = Depends(get_current_user)):
    user_id = user['user_id']
    mode = "Literature Review"
    user_input = request.user_input.strip()
    if not user_input:
        raise HTTPException(status_code=400, detail="User input cannot be empty")

    cached = get_from_mongo(user_input, mode, user_id)
    if cached:
        return {"status": "cached", "response": cached}

    response = generate_groq_response(user_input, mode)
    save_to_mongo(user_input, response, mode, user_id)
    return {"status": "new", "response": response}

@app.post("/citation")
def citation_endpoint(request: ChatRequest, user: dict = Depends(get_current_user)):
    user_id = user['user_id']
    mode = "Citation"
    user_input = request.user_input.strip()
    if not user_input:
        raise HTTPException(status_code=400, detail="User input cannot be empty")

    cached = get_from_mongo(user_input, mode, user_id)
    if cached:
        return {"status": "cached", "response": cached}

    response = generate_groq_response(user_input, mode)
    save_to_mongo(user_input, response, mode, user_id)
    return {"status": "new", "response": response}

@app.post("/exam_notes")
def exam_notes_endpoint(request: ChatRequest, user: dict = Depends(get_current_user)):
    user_id = user['user_id']
    mode = "Exam Notes"
    user_input = request.user_input.strip()
    if not user_input:
        raise HTTPException(status_code=400, detail="User input cannot be empty")

    cached = get_from_mongo(user_input, mode, user_id)
    if cached:
        return {"status": "cached", "response": cached}

    response = generate_groq_response(user_input, mode)
    save_to_mongo(user_input, response, mode, user_id)
    return {"status": "new", "response": response}

# -----------------------------
# 7. Semantic Search Functions
# -----------------------------
def generate_gemini_response_for_search(prompt):
    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content(prompt)
    return response.text

def preprocess_query(query):
    query = query.lower().strip()
    query = query.translate(str.maketrans("", "", string.punctuation))
    query = " ".join(query.split())
    return query

def get_core_concepts_with_boolean(user_query):
    user_query_clean = preprocess_query(user_query)
    prompt = f"""
    You are an expert research assistant.

    Task:
    1️⃣ Extract the 2–4 main concepts from the user query.
    2️⃣ Generate an optimized Boolean query for PubMed with:
       - Boolean Operators: AND, OR, NOT
       - Truncation for word stems
       - Exact phrases in quotes

    Output ONLY in this format:

    Core Concepts for search:
    Concept 1: ...
    Concept 2: ...
    Concept 3 (optional): ...
    Other keywords (optional): ...

    Optimized Boolean Query:
    ... 

    User query: "{user_query_clean}"
    """
    response_text = generate_gemini_response_for_search(prompt)
    print("\n🔹 Core Concepts + Optimized Boolean Query 🔹")
    print(response_text)

    if "Optimized Boolean Query:" in response_text:
        optimized_query = response_text.split("Optimized Boolean Query:")[-1].strip()
        return optimized_query
    return None

def get_mesh_boolean_from_prompt(optimized_query):
    optimized_query_clean = preprocess_query(optimized_query)
    prompt = f"""
    You are an expert PubMed search assistant.

    Task:
    Convert the following optimized Boolean query into a MeSH-aware Boolean query:
    {optimized_query_clean}

    Guidelines:
    - Map diseases, genes, biomarkers, and medical terms to MeSH
    - Keep non-medical terms unchanged
    - Use AND, OR, NOT operators
    - Apply truncation where appropriate
    - Preserve multi-word phrases in quotes

    Output ONLY the final MeSH-aware Boolean query.
    """
    response_text = generate_gemini_response_for_search(prompt)
    print("\n🔹 MeSH-aware Boolean Query 🔹")
    print(response_text)
    return response_text

def pubmed_esearch(mesh_query, retmax=10):
    esearch_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
    params = {"db": "pubmed", "term": mesh_query, "retmax": retmax, "retmode": "xml"}
    response = requests.get(esearch_url, params=params)
    root = ElementTree.fromstring(response.content)
    pmids = [id_elem.text for id_elem in root.findall(".//Id")]
    print("\nRetrieved PMIDs:", pmids)
    return pmids

def pubmed_efetch(pmids):
    efetch_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
    params = {"db": "pubmed", "id": ",".join(pmids), "retmode": "xml"}
    response = requests.get(efetch_url, params=params)
    root = ElementTree.fromstring(response.content)
    articles = []

    for article in root.findall(".//PubmedArticle"):
        pmid = article.findtext(".//PMID")
        title = article.findtext(".//ArticleTitle")
        abstract = article.findtext(".//AbstractText")
        journal = article.findtext(".//Journal/Title")
        link = f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/" if pmid else None
        articles.append({
            "pmid": pmid,
            "title": title,
            "abstract": abstract,
            "journal": journal,
            "link": link
        })
    return articles

# -----------------------------
# 8. PubMedBERT Embeddings
# -----------------------------
model_name = "microsoft/BiomedNLP-PubMedBERT-base-uncased-abstract-fulltext"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModel.from_pretrained(model_name)

def get_embedding(text):
    if not text:
        return np.zeros(768)
    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True, max_length=512)
    with torch.no_grad():
        outputs = model(**inputs)
        token_embeddings = outputs.last_hidden_state
        attention_mask = inputs['attention_mask']
        mask_expanded = attention_mask.unsqueeze(-1).expand(token_embeddings.size()).float()
        sum_embeddings = torch.sum(token_embeddings * mask_expanded, 1)
        sum_mask = torch.clamp(mask_expanded.sum(1), min=1e-9)
        mean_pooling = sum_embeddings / sum_mask
        return mean_pooling.squeeze().numpy()

# -----------------------------
# 9. ChromaDB Setup
# -----------------------------
chroma_client = chromadb.PersistentClient(path="./chroma_store")
chroma_collection = chroma_client.get_or_create_collection("pubmed_articles")

# -----------------------------
# 10. Semantic Rerank (Improved)
# -----------------------------
def get_article_embedding(article, title_weight=0.7, abstract_weight=0.3):
    """Embed title + abstract with weights."""
    title_emb = get_embedding(article.get("title", "") or "")
    abstract_emb = get_embedding(article.get("abstract", "") or "")

    # Weighted sum
    weighted_emb = title_weight * title_emb + abstract_weight * abstract_emb
    return weighted_emb

def semantic_rerank(user_query, articles, top_k=5, threshold=0.85, title_weight=0.7, abstract_weight=0.3):
    query_embedding = get_embedding(user_query)
    article_embeddings = [
        get_article_embedding(a, title_weight=title_weight, abstract_weight=abstract_weight)
        for a in articles
    ]

    sims = cosine_similarity([query_embedding], article_embeddings)[0]

    # attach similarity score
    ranked = sorted(zip(articles, sims), key=lambda x: x[1], reverse=True)

    # filter low-similarity matches
    ranked = [(a, s) for a, s in ranked if s >= threshold]

    return ranked[:top_k]

# -----------------------------
# 11. API Endpoint: Semantic Search
# -----------------------------
@app.post("/search/semantic")
def search_semantic(body: SemanticQuery, user: dict = Depends(get_current_user)):
    try:
        # 1) Gemini optimized + MeSH-aware
        optimized_query = get_core_concepts_with_boolean(body.query) or body.query
        mesh_query = get_mesh_boolean_from_prompt(optimized_query) if optimized_query else body.query

        # 2) PubMed search with fallbacks
        pmids = pubmed_esearch(mesh_query, retmax=80)
        if not pmids:
            pmids = pubmed_esearch(optimized_query, retmax=80)
        if not pmids:
            pmids = pubmed_esearch(body.query, retmax=80)
        if not pmids:
            return {"source": "api", "results": [], "message": "No articles found"}

        # 3) Fetch & rerank
        articles = pubmed_efetch(pmids[:80])
        ranked = semantic_rerank(body.query, articles, top_k=body.top_k or 10, threshold=body.threshold or 0.75)
        articles_only = [a for a, _ in ranked]

        # 4) Persist to Mongo and return only plain articles
        doc = {
            "query": body.query,
            "optimized_query": optimized_query,
            "mesh_query": mesh_query,
            "results": articles_only,
            "articles": articles_only,
            "timestamp": datetime.datetime.now(timezone.utc),
            "user_id": user["user_id"],
            "email": user.get("email"),
        }
        semantic_collection.insert_one(doc)
        return {"source": "api", "results": articles_only}
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

# -----------------------------
# 7. Profile Endpoint
# -----------------------------
@app.get("/profile")
def get_profile(user: dict = Depends(get_current_user)):
    user_id = user['user_id']
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": str(user["_id"]),
        "name": user.get("name"),
        "email": user.get("email"),
        "joined": user["_id"].generation_time.isoformat(),
    }

# -----------------------------
# ✅ Root
# -----------------------------
@app.get("/")
def root():
    return {"message": "Biomedical Chatbot API is running 🚀"}

# -----------------------------
# 8. Run the application
# -----------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8002)