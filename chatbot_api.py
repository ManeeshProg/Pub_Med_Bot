# -----------------------------
# chatbot_api.py (FastAPI backend with user authentication & mode-specific endpoints)
# -----------------------------
from fastapi import FastAPI, HTTPException, Depends, Header
from pydantic import BaseModel
from pymongo import MongoClient
from groq import Groq
import datetime
import warnings
from fastapi.middleware.cors import CORSMiddleware
from bson import ObjectId
import jwt
import os

# -----------------------------
# 1. Setup
# -----------------------------
warnings.filterwarnings("ignore", message="You appear to be connected to a CosmosDB cluster")

groq_api_key = os.getenv("GROQ_API")
mongo_uri = os.getenv("MONGO_URI")
JWT_SECRET = os.getenv("JWT_SECRET", "supersecretkey")

if not groq_api_key or not mongo_uri:
    raise ValueError("❌ Missing API keys or MongoDB URI")

# -----------------------------
# 2. Init Clients
# -----------------------------
client_groq = Groq(api_key=groq_api_key)
mongo_client = MongoClient(mongo_uri)
db = mongo_client["pubmed_db"]
collection = db["chatbot_articles"]
users_collection = db["users"]

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
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

class ChatRequest(BaseModel):
    user_input: str

# -----------------------------
# 5. Core Functions
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
# 6. Mode-specific Endpoints
# -----------------------------
@app.post("/concept")
def concept_endpoint(request: ChatRequest, user_id: str = Depends(get_current_user)):
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
def literature_review_endpoint(request: ChatRequest, user_id: str = Depends(get_current_user)):
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
def citation_endpoint(request: ChatRequest, user_id: str = Depends(get_current_user)):
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
def exam_notes_endpoint(request: ChatRequest, user_id: str = Depends(get_current_user)):
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
# 7. Profile Endpoint
# -----------------------------
@app.get("/profile")
def get_profile(user_id: str = Depends(get_current_user)):
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
