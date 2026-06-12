export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  deviceId: string;
  ipAddress: string;
  lat: number;
  lng: number;
  city: string;
  timestamp: number;
  cardAge: number; // months
  isFraud: boolean;
  fraudType?: string;
}

export interface FraudScore {
  ruleScore: number;
  mlScore: number;
  combinedScore: number;
  ruleDetails: RuleResult[];
  mlFeatures: Record<string, number>;
  classification: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface RuleResult {
  rule: string;
  triggered: boolean;
  contribution: number;
  description: string;
}

export interface GraphNode {
  id: string;
  type: 'account' | 'ip' | 'device';
  label: string;
  x: number;
  y: number;
  isFraud: boolean;
  riskScore: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  weight: number;
  amount: number;
  label: string;
}

export interface TransactionGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  adjacency: Map<string, { node: string; weight: number }[]>;
}

export interface SearchResult {
  path: string[];
  visited: string[];
  visitOrder: string[];
  cost: number;
  nodesExpanded: number;
  maxQueueDepth: number;
  executionTimeMs: number;
  algorithm: string;
}

export interface PerformanceMetrics {
  algorithm: string;
  executionTimeMs: number;
  nodesExpanded: number;
  maxQueueDepth: number;
  pathLength: number;
  pathCost: number;
}
