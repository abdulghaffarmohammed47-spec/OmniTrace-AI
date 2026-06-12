# OmniTrace-AI
ai-fraud-detection-application
# ⚡ OmniTrace AI: Enterprise Anti-Money Laundering (AML) & Graph Analytics Engine

[![Python Version](https://img.shields.io/badge/Python-3.10%20%7C%203.11%20%7C%203.12-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Streamlit Framework](https://img.shields.io/badge/Streamlit-FF4B4B?style=for-the-badge&logo=Streamlit&logoColor=white)](https://streamlit.io/)
[![Scikit-Learn](https://img.shields.io/badge/scikit--learn-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![NetworkX](https://img.shields.io/badge/NetworkX-000000?style=for-the-badge&logo=networkx&logoColor=white)](https://networkx.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)](https://opensource.org/licenses/MIT)

**OmniTrace AI** is an advanced, production-grade investigative intelligence workspace engineered to intercept online transaction fraud, reveal identity-clustering schemas, and track multi-hop money laundering syndicates. By unifying **Predictive Machine Learning Classifiers** and a deterministic **Expert Knowledge Rules Engine** with fundamental **State-Space Search Algorithms**, the platform maps abstract transaction ledgers into highly interactive network topologies to visually expose financial crime in real time.

---

## 🔮 Core System Architecture

The workspace decouples high-throughput analytical operations into three standalone pipelines:

### 1. Hybrid Risk Classification Matrix
Rather than relying purely on static value thresholds, OmniTrace AI deploys a layered verification model:
* **Statistical Risk Engine (ML Classifier):** Uses an optimized Scikit-Learn `RandomForestClassifier` to ingest multi-dimensional transaction vectors (e.g., account tenure, payment method, historical bounds) and compute dynamic behavioral anomaly probabilities.
* **Heuristic Compliance Matrix (Expert System):** A strict, conditional verification layer checking for real-time risk indicators, including **Velocity Spikes** (e.g., multiple rapid transactions in a tiny time window) and the **Impossible Travel Anomaly** (e.g., matching physical transactions occurring thousands of miles apart within minutes).
* **Unified Threat Scoring:** Aggregates statistical predictions with heuristic rule violations to deliver a composite Fraud Risk Index (0% to 100%).

### 2. Live Graph Topology Space
Leveraging deep network abstraction structures, the application maps relational transaction ledgers directly into clear graphical networks managed via `NetworkX` and rendered through interactive `Plotly` environments:
* **Nodes:** Represent explicit consumer profiles, hardware device IDs, routing terminals, and regional IP subnets.
* **Edges:** Model capital flow pathways, dynamically colored and weighted by transaction velocities and raw monetary scale.

### 3. State-Space Computational Routing
The framework bridges classical AI search algorithms with mission-critical financial forensics workflows:
* **Breadth-First Search (BFS):** Quantifies the *Radius of Contamination*. Starting from an explicit flagged node, BFS isolates all auxiliary connected customer profiles within an arbitrary $K$-hop distance threshold.
* **Depth-First Search (DFS):** Scans for *Money Laundering Loop Cycles*. Tracks structural paths across the network graph to flag transactional loops designed to mask asset origin points (e.g., Account $A \rightarrow B \rightarrow C \rightarrow A$).
* **Dijkstra's Algorithm:** Calculates the *Optimal Asset Tracking Pathway*. Automatically maps out the lowest-cost routing corridor connecting two high-risk endpoints based on connection frequencies and structural clearance velocities.
* **A\* Search Engine:** Executes *Heuristic-Driven Trajectory Mapping*. Utilizing an informed evaluation function $f(n) = g(n) + h(n)$, it implements **Inverse Transaction Velocity** and **Geographical Haversine Displacements** as heuristics to prune search trees and accelerate route detection.

---

## 📂 Project Directory Structure

```text
OmniTrace-AI/
│
├── requirements.txt            # System dependencies manifest
├── README.md                   # System documentation
│
├── backend/
│   ├── __init__.py             # Namespace anchor
│   ├── algorithms.py           # Custom state-space search engines (BFS, DFS, Dijkstra, A*)
│   └── fraud_model.py          # ML classifiers, Rules matrix, and synthetic data simulation
│
└── frontend/
    ├── __init__.py             # Namespace anchor
    └── app.py                  # Streamlit visual application controller
