from pathlib import Path
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

MODEL_DIR = Path(__file__).parent / "models" / "phishing_classifier"

device = torch.device("cpu")  # using CPU backend

tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_DIR).to(device)
model.eval()

@torch.no_grad()
def predict_phishing_risk(text: str) -> dict:
    inputs = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        padding=True,
        max_length=128,
    )
    inputs = {k: v.to(device) for k, v in inputs.items()}
    
    outputs = model(**inputs)
    probs = torch.softmax(outputs.logits, dim=-1)[0].cpu().numpy()

    return {
        "normal_prob": float(probs[0]),
        "phishing_prob": float(probs[1]),
        "risk_score": int(probs[1] * 100),
    }
