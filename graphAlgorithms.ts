import { TransactionGraph, SearchResult, GraphNode } from './types';

// ────────────────────────────────────────────────
// Breadth-First Search (BFS)
// K-Hop contamination radius from a source node
// ────────────────────────────────────────────────

export function bfs(
  graph: TransactionGraph,
  startId: string,
  targetId: string
): SearchResult {
  const t0 = performance.now();
  const visited = new Set<string>();
  const visitOrder: string[] = [];
  const queue: { node: string; path: string[] }[] = [{ node: startId, path: [startId] }];
  let maxQueueDepth = 1;
  let nodesExpanded = 0;

  visited.add(startId);

  while (queue.length > 0) {
    maxQueueDepth = Math.max(maxQueueDepth, queue.length);
    const current = queue.shift()!;
    nodesExpanded++;
    visitOrder.push(current.node);

    if (current.node === targetId) {
      const t1 = performance.now();
      return {
        path: current.path,
        visited: [...visited],
        visitOrder,
        cost: current.path.length - 1,
        nodesExpanded,
        maxQueueDepth,
        executionTimeMs: t1 - t0,
        algorithm: 'BFS',
      };
    }

    const neighbors = graph.adjacency.get(current.node) || [];
    for (const { node: neighbor } of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push({ node: neighbor, path: [...current.path, neighbor] });
      }
    }
  }

  const t1 = performance.now();
  return {
    path: [],
    visited: [...visited],
    visitOrder,
    cost: Infinity,
    nodesExpanded,
    maxQueueDepth,
    executionTimeMs: t1 - t0,
    algorithm: 'BFS',
  };
}

// ────────────────────────────────────────────────
// Depth-First Search (DFS)
// Cycle detection and deep path exploration
// ────────────────────────────────────────────────

export function dfs(
  graph: TransactionGraph,
  startId: string,
  targetId: string
): SearchResult {
  const t0 = performance.now();
  const visited = new Set<string>();
  const visitOrder: string[] = [];
  let maxStackDepth = 0;
  let nodesExpanded = 0;
  let resultPath: string[] = [];

  function dfsRecursive(node: string, path: string[], depth: number): boolean {
    visited.add(node);
    visitOrder.push(node);
    nodesExpanded++;
    maxStackDepth = Math.max(maxStackDepth, depth);

    if (node === targetId) {
      resultPath = [...path];
      return true;
    }

    const neighbors = graph.adjacency.get(node) || [];
    for (const { node: neighbor } of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfsRecursive(neighbor, [...path, neighbor], depth + 1)) {
          return true;
        }
      }
    }

    return false;
  }

  dfsRecursive(startId, [startId], 1);

  const t1 = performance.now();
  return {
    path: resultPath,
    visited: [...visited],
    visitOrder,
    cost: resultPath.length > 0 ? resultPath.length - 1 : Infinity,
    nodesExpanded,
    maxQueueDepth: maxStackDepth,
    executionTimeMs: t1 - t0,
    algorithm: 'DFS',
  };
}

// ────────────────────────────────────────────────
// DFS Cycle Detection
// Finds cycles (money laundering loops) in the graph
// ────────────────────────────────────────────────

export function detectCycles(graph: TransactionGraph): string[][] {
  const cycles: string[][] = [];
  const allVisited = new Set<string>();

  for (const node of graph.nodes) {
    if (allVisited.has(node.id)) continue;

    const stack: { id: string; path: string[] }[] = [{ id: node.id, path: [node.id] }];
    const localVisited = new Set<string>();

    while (stack.length > 0) {
      const current = stack.pop()!;

      if (localVisited.has(current.id)) {
        // Found a cycle
        const cycleStart = current.path.indexOf(current.id);
        if (cycleStart >= 0 && current.path.length - cycleStart >= 3) {
          const cycle = current.path.slice(cycleStart);
          cycle.push(current.id);
          if (cycle.length >= 3) {
            cycles.push(cycle);
          }
        }
        continue;
      }

      localVisited.add(current.id);
      allVisited.add(current.id);

      const neighbors = graph.adjacency.get(current.id) || [];
      for (const { node: neighbor } of neighbors) {
        if (current.path.length > 1 && neighbor === current.path[current.path.length - 2]) {
          continue; // skip immediate backtrack
        }
        stack.push({ id: neighbor, path: [...current.path, neighbor] });
      }
    }
  }

  // Deduplicate cycles
  const unique: string[][] = [];
  const seen = new Set<string>();
  for (const cycle of cycles) {
    const key = [...cycle].sort().join(',');
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(cycle);
    }
  }

  return unique.slice(0, 10); // Limit to 10 cycles
}

// ────────────────────────────────────────────────
// Dijkstra's Algorithm
// Shortest weighted path (lowest-cost cash flow route)
// ────────────────────────────────────────────────

export function dijkstra(
  graph: TransactionGraph,
  startId: string,
  targetId: string
): SearchResult {
  const t0 = performance.now();
  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>();
  const visited = new Set<string>();
  const visitOrder: string[] = [];
  let nodesExpanded = 0;
  let maxQueueDepth = 0;

  // Initialize
  for (const node of graph.nodes) {
    dist.set(node.id, Infinity);
    prev.set(node.id, null);
  }
  dist.set(startId, 0);

  // Priority queue (simple array-based for clarity)
  const pq: { node: string; dist: number }[] = [{ node: startId, dist: 0 }];

  while (pq.length > 0) {
    maxQueueDepth = Math.max(maxQueueDepth, pq.length);

    // Extract minimum
    pq.sort((a, b) => a.dist - b.dist);
    const current = pq.shift()!;

    if (visited.has(current.node)) continue;
    visited.add(current.node);
    visitOrder.push(current.node);
    nodesExpanded++;

    if (current.node === targetId) break;

    const neighbors = graph.adjacency.get(current.node) || [];
    for (const { node: neighbor, weight } of neighbors) {
      if (!visited.has(neighbor)) {
        const newDist = dist.get(current.node)! + weight;
        if (newDist < dist.get(neighbor)!) {
          dist.set(neighbor, newDist);
          prev.set(neighbor, current.node);
          pq.push({ node: neighbor, dist: newDist });
        }
      }
    }
  }

  // Reconstruct path
  const path: string[] = [];
  let current: string | null = targetId;
  while (current !== null) {
    path.unshift(current);
    current = prev.get(current) || null;
  }

  const t1 = performance.now();
  const finalCost = dist.get(targetId) ?? Infinity;

  return {
    path: path[0] === startId ? path : [],
    visited: [...visited],
    visitOrder,
    cost: finalCost,
    nodesExpanded,
    maxQueueDepth,
    executionTimeMs: t1 - t0,
    algorithm: 'Dijkstra',
  };
}

// ────────────────────────────────────────────────
// A* Search Algorithm
// Heuristic-driven pathfinding using geo-distance
// ────────────────────────────────────────────────

function heuristic(nodeA: GraphNode, nodeB: GraphNode): number {
  // Use Euclidean distance in the graph layout as heuristic
  const dx = nodeA.x - nodeB.x;
  const dy = nodeA.y - nodeB.y;
  return Math.sqrt(dx * dx + dy * dy) / 100; // Scale down
}

export function aStar(
  graph: TransactionGraph,
  startId: string,
  targetId: string
): SearchResult {
  const t0 = performance.now();
  const nodeMap = new Map(graph.nodes.map(n => [n.id, n]));
  const targetNode = nodeMap.get(targetId);
  if (!targetNode) {
    return {
      path: [], visited: [], visitOrder: [],
      cost: Infinity, nodesExpanded: 0, maxQueueDepth: 0,
      executionTimeMs: performance.now() - t0, algorithm: 'A*',
    };
  }

  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();
  const prev = new Map<string, string | null>();
  const visited = new Set<string>();
  const visitOrder: string[] = [];
  let nodesExpanded = 0;
  let maxQueueDepth = 0;

  for (const node of graph.nodes) {
    gScore.set(node.id, Infinity);
    fScore.set(node.id, Infinity);
    prev.set(node.id, null);
  }

  gScore.set(startId, 0);
  const startNode = nodeMap.get(startId)!;
  fScore.set(startId, heuristic(startNode, targetNode));

  const openSet: { node: string; f: number }[] = [
    { node: startId, f: fScore.get(startId)! },
  ];

  while (openSet.length > 0) {
    maxQueueDepth = Math.max(maxQueueDepth, openSet.length);

    // Get node with lowest f-score
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift()!;

    if (visited.has(current.node)) continue;
    visited.add(current.node);
    visitOrder.push(current.node);
    nodesExpanded++;

    if (current.node === targetId) break;

    const neighbors = graph.adjacency.get(current.node) || [];
    for (const { node: neighborId, weight } of neighbors) {
      if (visited.has(neighborId)) continue;

      const tentativeG = gScore.get(current.node)! + weight;
      if (tentativeG < gScore.get(neighborId)!) {
        prev.set(neighborId, current.node);
        gScore.set(neighborId, tentativeG);

        const neighborNode = nodeMap.get(neighborId);
        const h = neighborNode ? heuristic(neighborNode, targetNode) : 0;
        const f = tentativeG + h;
        fScore.set(neighborId, f);
        openSet.push({ node: neighborId, f });
      }
    }
  }

  // Reconstruct path
  const path: string[] = [];
  let cur: string | null = targetId;
  while (cur !== null) {
    path.unshift(cur);
    cur = prev.get(cur) || null;
  }

  const t1 = performance.now();

  return {
    path: path[0] === startId ? path : [],
    visited: [...visited],
    visitOrder,
    cost: gScore.get(targetId) ?? Infinity,
    nodesExpanded,
    maxQueueDepth,
    executionTimeMs: t1 - t0,
    algorithm: 'A*',
  };
}

// ────────────────────────────────────────────────
// K-Hop Neighborhood (BFS-based)
// ────────────────────────────────────────────────

export function kHopNeighborhood(
  graph: TransactionGraph,
  startId: string,
  k: number
): { nodes: string[]; depth: Map<string, number> } {
  const visited = new Set<string>();
  const depth = new Map<string, number>();
  const queue: { node: string; d: number }[] = [{ node: startId, d: 0 }];
  visited.add(startId);
  depth.set(startId, 0);

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.d >= k) continue;

    const neighbors = graph.adjacency.get(current.node) || [];
    for (const { node: neighbor } of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        depth.set(neighbor, current.d + 1);
        queue.push({ node: neighbor, d: current.d + 1 });
      }
    }
  }

  return { nodes: [...visited], depth };
}

// ────────────────────────────────────────────────
// Run all algorithms and return comparative metrics
// ────────────────────────────────────────────────

export function runAllAlgorithms(
  graph: TransactionGraph,
  startId: string,
  targetId: string
): SearchResult[] {
  return [
    bfs(graph, startId, targetId),
    dfs(graph, startId, targetId),
    dijkstra(graph, startId, targetId),
    aStar(graph, startId, targetId),
  ];
}
