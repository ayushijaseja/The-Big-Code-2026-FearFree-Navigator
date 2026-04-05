import torch
import torch.nn.functional as F
from model import FearFreeSOTA
from data_loader import get_graph_from_db
import numpy as np
import os

# Set device to GPU (cuda) for B.Tech performance
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

def train_production_model():
    # 1. Load Real Data from PostGIS
    data, _ = get_graph_from_db() 
    data = data.to(device)
    
    # 2. SOTA LABEL ENGINEERING (Non-Linear Signal Amplification)
    with torch.no_grad():
        # Feature columns: [0: safe_places, 1: is_lit, 2: density]
        # We use tighter normalization to make features "pop"
        norm_places = torch.clamp(data.x[:, 0] / 15.0, 0, 1) 
        norm_lit = data.x[:, 1]
        norm_density = torch.clamp(data.x[:, 2] / 80.0, 0, 1)
        
        # Calculate Base Safety
        # Lighting is the strongest predictor for SOTA urban safety
        # In the label engineering block of train.py
        safety_score = (norm_places * 0.3) + (norm_lit * 0.5) + (norm_density * 0.2)
        # Squashing function to push values toward 0 and 1
        risk_labels = torch.where(safety_score > 0.5, safety_score * 0.2, 1.0 - (safety_score * 0.5))
        data.y = risk_labels.view(-1, 1).to(device)
        
        # Inject minor noise for generalization
        noise = torch.randn_like(risk_labels) * 0.01
        # data.y = (risk_labels + noise).clamp(0, 1).unsqueeze(1).to(device)

    # 3. Data Splitting
    indices = np.arange(data.num_nodes)
    np.random.shuffle(indices)
    
    train_mask = indices[:int(0.7 * len(indices))]
    val_mask = indices[int(0.7 * len(indices)):int(0.85 * len(indices))]
    test_mask = indices[int(0.85 * len(indices)):]

    # 4. Model Setup
    # Using a slightly higher LR (0.002) to help it jump out of the '1.0 risk' trap
    model = FearFreeSOTA(feature_size=4).to(device) 
    optimizer = torch.optim.Adam(model.parameters(), lr=0.002, weight_decay=1e-4)
    criterion = torch.nn.MSELoss()

    best_val_loss = float('inf')

    print(f"🚀 Starting Production Training on {device}...")

    # 5. Training Loop (300 Epochs)
    for epoch in range(1, 301):
        model.train()
        optimizer.zero_grad()
        
        # Time feature: Midday (0.0) to Midnight (1.0)
        time_val = (epoch % 24) / 24.0
        time_feature = torch.full((data.num_nodes, 1), time_val).to(device)
        
        out = model(data, time_feature)
        loss = criterion(out[train_mask], data.y[train_mask])
        
        loss.backward()
        optimizer.step()

        # Validation
        model.eval()
        with torch.no_grad():
            val_out = model(data, time_feature)
            val_loss = criterion(val_out[val_mask], data.y[val_mask])
            
            if val_loss < best_val_loss:
                best_val_loss = val_loss
                torch.save(model.state_dict(), 'sota_safety_model.pt')
                checkpoint_msg = "⭐ Best Model"
            else:
                checkpoint_msg = ""

        if epoch % 25 == 0:
            print(f"Epoch {epoch:03d} | Train: {loss.item():.5f} | Val: {val_loss.item():.5f} {checkpoint_msg}")

    # 6. Final Deployment Check
    model.load_state_dict(torch.load('sota_safety_model.pt'))
    model.eval()
    with torch.no_grad():
        test_out = model(data, time_feature)
        test_mae = F.l1_loss(test_out[test_mask], data.y[test_mask])
        print(f"\n✅ Final Test MAE: {test_mae.item():.4f}")
        print("📁 Model 'sota_safety_model.pt' ready for Prayagraj deployment.")

if __name__ == "__main__":
    train_production_model()