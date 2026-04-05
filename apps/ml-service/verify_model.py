import torch
from torch_geometric.data import Data
from model import FearFreeSOTA

def verify_safety_logic():
    model = FearFreeSOTA(feature_size=4)
    model.load_state_dict(torch.load('sota_safety_model.pt', map_location='cpu'))
    model.eval()

    # [safe_places, is_lit, density]
    nodes_x = torch.tensor([
        [20.0, 1.0, 95.0], # Node 0: Elite Safety
        [0.0,  0.0, 0.0],  # Node 1: Absolute Danger
    ], dtype=torch.float)

    edge_index = torch.tensor([[0, 1], [1, 0]], dtype=torch.long)
    test_data = Data(x=nodes_x, edge_index=edge_index)
    dummy_time = torch.tensor([[0.5], [0.5]], dtype=torch.float)

    with torch.no_grad():
        risk_scores = model(test_data, dummy_time)

    safe_risk = risk_scores[0].item()
    danger_risk = risk_scores[1].item()

    print(f"\n📊 GNN Residual Test:")
    print(f"   - Safe Node Risk: {safe_risk:.4f}")
    print(f"   - Dark Node Risk: {danger_risk:.4f}")

    if danger_risk > (safe_risk + 0.1):
        print("\n✅ PASS: The Skip-Connection fixed the smoothing!")
    else:
        print("\n❌ FAIL: Check if your training labels are actually changing.")

if __name__ == "__main__":
    verify_safety_logic()