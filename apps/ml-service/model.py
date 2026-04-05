import torch
import torch.nn.functional as F
from torch_geometric.nn import GATv2Conv

class FearFreeSOTA(torch.nn.Module):
    def __init__(self, feature_size):
        super(FearFreeSOTA, self).__init__()
        # 🚀 SOTA FIX: High Multi-Head Attention (8 heads)
        self.gat1 = GATv2Conv(feature_size, 16, heads=8, dropout=0.2)
        # Linear layer to ensure the original features are never lost
        self.skip = torch.nn.Linear(feature_size, 16 * 8)
        self.out = torch.nn.Linear(16 * 8, 1)

    def forward(self, data, current_time_feature):
        x, edge_index = data.x, data.edge_index
        
        # Merge raw features with time
        raw_x = torch.cat([x, current_time_feature], dim=1)
        
        # Graph path
        graph_x = self.gat1(raw_x, edge_index)
        
        # Skip path (The secret sauce to stop over-smoothing)
        skip_x = self.skip(raw_x)
        
        # Combine (Residual Connection)
        combined = F.elu(graph_x + skip_x)
        
        # Final prediction
        prediction = self.out(combined)
        return torch.sigmoid(prediction)