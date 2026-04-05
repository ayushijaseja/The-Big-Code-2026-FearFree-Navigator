import torch
from torch_geometric.data import Data
import psycopg2

def get_graph_from_db():
    conn = psycopg2.connect("postgres://fearfree_admin:supersecret@localhost:5433/fearfree_db")
    cursor = conn.cursor()

    cursor.execute("SELECT h3_index, safe_places, is_lit, density FROM hex_environments")
    nodes = cursor.fetchall()
    
    h3_to_idx = {row[0]: i for i, row in enumerate(nodes)}

    cursor.execute("""
        SELECT a.h3_index, b.h3_index 
        FROM hex_environments a, hex_environments b 
        WHERE ST_Touches(a.geom, b.geom)
    """)
    raw_edges = cursor.fetchall()

    edges = []
    for start_h3, end_h3 in raw_edges:
        if start_h3 in h3_to_idx and end_h3 in h3_to_idx:
            edges.append([h3_to_idx[start_h3], h3_to_idx[end_h3]])

    x = torch.tensor([n[1:] for n in nodes], dtype=torch.float)
    
    if len(edges) > 0:
        edge_index = torch.tensor(edges, dtype=torch.long).t().contiguous()
    else:
        edge_index = torch.empty((2, 0), dtype=torch.long)
    
    return Data(x=x, edge_index=edge_index), h3_to_idx