from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from phishing_model import predict_phishing_risk  # <-- our trained model

app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Transcript(BaseModel):
    text: str

@app.get("/")
def root():
    return {"message": "Voice phishing detector backend running"}

@app.post("/score")
def score(transcript: Transcript):
    text = transcript.text
    lower_text = text.lower()

    # 1) model-based risk
    result = predict_phishing_risk(text)

    # 2) (optional) simple keyword hits, just for display
    danger_keywords = [
        "account", "bank", "verification code", "otp", "password",
        "wire transfer", "send money", "gift card",
        "계좌", "은행", "인증번호", "otp", "송금", "보안카드",
        "검찰", "경찰", "수사", "압수수색", "체포",
    ]
    hits = [w for w in danger_keywords if w in lower_text]

    return {
        "risk_score": result["risk_score"],          # from model
        "normal_prob": result["normal_prob"],
        "phishing_prob": result["phishing_prob"],
        "detected_keywords": hits,                   # from simple rule
        "original_text": text,
    }
