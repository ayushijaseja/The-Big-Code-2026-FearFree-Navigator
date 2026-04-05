import torch
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from model import FearFreeSOTA
from data_loader import get_graph_from_db
import datetime
import uvicorn

app = FastAPI(title="FearFree SOTA Inference Service")

DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
MODEL_PATH = 'sota_safety_model.pt'
GRAPH_DATA = None
MODEL = None
H3_TO_IDX = {} 

class RouteRequest(BaseModel):
    h3_indexes: list[str] 
    timestamp_iso: str    

@app.on_event("startup")
async def startup_event():
    global GRAPH_DATA, MODEL, H3_TO_IDX
    print(f"🚀 Initializing SOTA Service on {DEVICE}...")

    try:
        GRAPH_DATA, H3_TO_IDX = get_graph_from_db()
        GRAPH_DATA = GRAPH_DATA.to(DEVICE)
        print(f"✅ Graph Loaded: {GRAPH_DATA.num_nodes} nodes, {GRAPH_DATA.num_edges} edges")
    except Exception as e:
        print(f"❌ Database/Graph Error: {e}")
        raise e

    MODEL = FearFreeSOTA(feature_size=4).to(DEVICE)
    try:
        MODEL.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
        print(f"✅ Model Weights Loaded from {MODEL_PATH}")
    except FileNotFoundError:
        print(f"⚠️ Warning: {MODEL_PATH} not found. Running with uninitialized weights!")
    

@app.post("/predict-route-safety")
async def predict_route_safety(req: RouteRequest):
    if MODEL is None or GRAPH_DATA is None:
        raise HTTPException(status_code=503, detail="Model not initialized")

    try:
        dt = datetime.datetime.fromisoformat(req.timestamp_iso.replace("Z", "+00:00"))
        hour_norm = dt.hour / 24.0
        current_time_tensor = torch.full((GRAPH_DATA.num_nodes, 1), hour_norm).to(DEVICE)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid timestamp format")

    MODEL.train() 
    iterations = 5
    all_preds = []

    try:
        with torch.no_grad():
            for _ in range(iterations):
                risk_scores = MODEL(GRAPH_DATA, current_time_tensor)
                all_preds.append(risk_scores)

        stacked_preds = torch.stack(all_preds)
        mean_risk = torch.mean(stacked_preds, dim=0)
        std_risk = torch.std(stacked_preds, dim=0)

        results_danger = []
        results_uncertainty = []

        for h3 in req.h3_indexes:
            idx = H3_TO_IDX.get(h3)
            if idx is not None:
                results_danger.append(mean_risk[idx].item())
                results_uncertainty.append(std_risk[idx].item())
            else:
                print(f"⚠️ H3 index {h3} not found in city graph. Skipping.")

        if not results_danger:
            return {"safety_score": 50.0, "confidence": 0.0, "status": "no_data_for_region"}

        avg_danger = sum(results_danger) / len(results_danger)
        avg_uncertainty = sum(results_uncertainty) / len(results_uncertainty)
        
        safety_score = (1 - avg_danger) * 100
        calculated_confidence = max(0.1, min(1.0, 1.0 - (avg_uncertainty * 2)))

        return {
            "safety_score": round(safety_score, 2),
            "confidence": round(calculated_confidence, 2),
            "checkpoints_analyzed": len(results_danger),
            "status": "success"
        }

    except Exception as e:
        print(f"🔥 Inference Error: {e}")
        raise HTTPException(status_code=500, detail="Inference engine failure")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)