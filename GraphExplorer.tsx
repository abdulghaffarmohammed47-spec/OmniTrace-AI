import { useState, useMemo, useCallback } from 'react';
import { TransactionGraph, SearchResult } from '../lib/types';
import { bfs, dfs, dijkstra, aStar, kHopNeighborhood, detectCycles } from '../lib/graphAlgorithms';
import NetworkGraph from './NetworkGraph';

interface Props {
  graph: TransactionGraph;
}

type AlgoType = 'BFS' | 'DFS' | 'Dijkstra' | 'A*';

export default function GraphExplorer({ graph }: Props) {
  const [startNode, setStartNode] = useState('');
  const [targetNode, setTargetNode] = useState('');
  const [selectedAlgo, setSelectedAlgo] = useState<AlgoType>('BFS');
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [kHop, setKHop] = useState(2);
  const [kHopNode, setKHopNode] = useState('');
  const [kHopResult, setKHopResult] = useState<{ nodes: string[]; depth: Map<string, number> } | null>(null);
  const [cycles, setCycles] = useState<string[][] | null>(null);
  const [activeMode, setActiveMode] = useState<'pathfind' | 'khop' | 'cycles'>('pathfind');

  const nodeIds = useMemo(() => graph.nodes.map(n => n.id).sort(), [graph]);
  const _accountNodes = useMemo(() => graph.nodes.filter(n => n.type === 'account').map(n => n.id).sort(), [graph]);
  void _accountNodes;

  const runSearch = useCallback(() => {
    if (!startNode || !targetNode) return;
    let result: SearchResult;
    switch (selectedAlgo) {
      case 'BFS': result = bfs(graph, startNode, targetNode); break;
      case 'DFS': result = dfs(graph, startNode, targetNode); break;
      case 'Dijkstra': result = dijkstra(graph, startNode, targetNode); break;
      case 'A*': result = aStar(graph, startNode, targetNode); break;
    }
    setSearchResult(result);
    setKHopResult(null);
    setCycles(null);
    setActiveMode('pathfind');
  }, [graph, startNode, targetNode, selectedAlgo]);

  const runKHop = useCallback(() => {
    if (!kHopNode) return;
    const result = kHopNeighborhood(graph, kHopNode, kHop);
    setKHopResult(result);
    setSearchResult(null);
    setCycles(null);
    setActiveMode('khop');
  }, [graph, kHopNode, kHop]);

  const runCycleDetection = useCallback(() => {
    const detected = detectCycles(graph);
    setCycles(detected);
    setSearchResult(null);
    setKHopResult(null);
    setActiveMode('cycles');
  }, [graph]);

  const algos: { key: AlgoType; label: string; icon: string; desc: string }[] = [
    { key: 'BFS', label: 'BFS', icon: '🌊', desc: 'Breadth-First — Level-by-level exploration' },
    { key: 'DFS', label: 'DFS', icon: '🔍', desc: 'Depth-First — Deep path exploration' },
    { key: 'Dijkstra', label: 'Dijkstra', icon: '⚡', desc: 'Shortest weighted path (lowest cost)' },
    { key: 'A*', label: 'A*', icon: '🎯', desc: 'Heuristic-driven optimal pathfinding' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <span className="text-3xl">🕸️</span>
          AI Search Engine & Fraud Ring Tracer
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Trace illicit cash flow paths and uncover fraud rings using state-space search algorithms
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Controls */}
        <div className="xl:col-span-1 space-y-4">
          {/* Algorithm Pathfinding */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 space-y-3">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span>🧭</span> Path Search
            </h3>

            <div>
              <label className="text-[11px] text-slate-400 mb-1 block">Start Account</label>
              <select
                value={startNode}
                onChange={e => setStartNode(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200
                  focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none"
              >
                <option value="">Select node...</option>
                {nodeIds.map(id => (
                  <option key={id} value={id}>{id}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 mb-1 block">Target Account</label>
              <select
                value={targetNode}
                onChange={e => setTargetNode(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200
                  focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none"
              >
                <option value="">Select node...</option>
                {nodeIds.map(id => (
                  <option key={id} value={id}>{id}</option>
                ))}
              </select>
            </div>

            {/* Algorithm selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-400 block">Search Algorithm</label>
              {algos.map(a => (
                <button
                  key={a.key}
                  onClick={() => setSelectedAlgo(a.key)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${
                    selectedAlgo === a.key
                      ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300'
                      : 'bg-slate-900/50 border border-slate-700/30 text-slate-400 hover:bg-slate-700/40'
                  }`}
                >
                  <div className="font-semibold">{a.icon} {a.label}</div>
                  <div className="text-[10px] opacity-70 mt-0.5">{a.desc}</div>
                </button>
              ))}
            </div>

            <button
              onClick={runSearch}
              disabled={!startNode || !targetNode}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold
                text-xs hover:from-cyan-400 hover:to-blue-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed
                shadow-lg shadow-cyan-500/20"
            >
              🔎 Run {selectedAlgo} Search
            </button>
          </div>

          {/* K-Hop Neighborhood */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 space-y-3">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span>🎯</span> K-Hop Contamination
            </h3>
            <div>
              <label className="text-[11px] text-slate-400 mb-1 block">Source Node</label>
              <select
                value={kHopNode}
                onChange={e => setKHopNode(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200
                  focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none"
              >
                <option value="">Select node...</option>
                {nodeIds.map(id => (
                  <option key={id} value={id}>{id}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-400">Hop Depth (K)</span>
                <span className="text-slate-200 font-mono">{kHop}</span>
              </div>
              <input
                type="range" min={1} max={5} value={kHop}
                onChange={e => setKHop(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-slate-700 accent-purple-500 cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-400 [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>
            <button
              onClick={runKHop}
              disabled={!kHopNode}
              className="w-full py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold
                text-xs hover:from-purple-400 hover:to-pink-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              🌐 Trace K-Hop Radius
            </button>
          </div>

          {/* Cycle Detection */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 space-y-3">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span>🔄</span> Cycle Detection (DFS)
            </h3>
            <p className="text-[10px] text-slate-500">
              Detect cyclic fund transfer patterns indicating potential money laundering loops
            </p>
            <button
              onClick={runCycleDetection}
              className="w-full py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold
                text-xs hover:from-amber-400 hover:to-orange-400 transition-all"
            >
              🔍 Detect Cycles
            </button>
          </div>
        </div>

        {/* Graph Visualization */}
        <div className="xl:col-span-3 space-y-4">
          <NetworkGraph
            graph={graph}
            searchResult={activeMode === 'pathfind' ? searchResult : null}
            highlightNodes={activeMode === 'khop' && kHopResult ? new Set(kHopResult.nodes) : undefined}
            highlightDepth={activeMode === 'khop' && kHopResult ? kHopResult.depth : undefined}
            width={900}
            height={520}
          />

          {/* Results Panel */}
          {searchResult && activeMode === 'pathfind' && (
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                📊 {searchResult.algorithm} Search Results
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                <MetricCard label="Path Length" value={searchResult.path.length > 0 ? searchResult.path.length - 1 : '∞'} unit="hops" color="cyan" />
                <MetricCard label="Path Cost" value={searchResult.cost === Infinity ? '∞' : searchResult.cost.toFixed(1)} unit="weight" color="blue" />
                <MetricCard label="Nodes Expanded" value={searchResult.nodesExpanded} unit="nodes" color="purple" />
                <MetricCard label="Max Queue" value={searchResult.maxQueueDepth} unit="depth" color="amber" />
                <MetricCard label="Execution Time" value={searchResult.executionTimeMs.toFixed(2)} unit="ms" color="emerald" />
              </div>

              {searchResult.path.length > 0 ? (
                <div>
                  <div className="text-xs text-slate-400 mb-2">Path Traversal:</div>
                  <div className="flex flex-wrap items-center gap-1">
                    {searchResult.path.map((node, i) => (
                      <span key={i} className="flex items-center gap-1">
                        <span className={`px-2 py-1 rounded text-[11px] font-mono font-bold ${
                          i === 0 ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                          i === searchResult.path.length - 1 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                          'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        }`}>
                          {node}
                        </span>
                        {i < searchResult.path.length - 1 && (
                          <span className="text-slate-500 text-xs">→</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-red-400">❌ No path found between selected nodes</div>
              )}

              {/* Visit Order */}
              <div className="mt-3">
                <div className="text-xs text-slate-400 mb-1">Exploration Order ({searchResult.visitOrder.length} nodes):</div>
                <div className="text-[10px] font-mono text-slate-500 bg-slate-900/50 rounded-lg p-2 max-h-16 overflow-y-auto">
                  {searchResult.visitOrder.join(' → ')}
                </div>
              </div>
            </div>
          )}

          {/* K-Hop Results */}
          {kHopResult && activeMode === 'khop' && (
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
              <h3 className="text-sm font-semibold text-white mb-3">
                🎯 K-Hop Contamination Radius ({kHop} hops from {kHopNode})
              </h3>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <MetricCard label="Nodes Reached" value={kHopResult.nodes.length} unit="total" color="purple" />
                <MetricCard label="Hop Depth" value={kHop} unit="hops" color="pink" />
                <MetricCard label="Coverage" value={((kHopResult.nodes.length / graph.nodes.length) * 100).toFixed(1)} unit="%" color="cyan" />
              </div>
              <div className="text-[10px] font-mono text-slate-400 bg-slate-900/50 rounded-lg p-2 max-h-20 overflow-y-auto">
                {kHopResult.nodes.map(n => {
                  const d = kHopResult.depth.get(n) ?? 0;
                  return `${n} (depth ${d})`;
                }).join(' · ')}
              </div>
            </div>
          )}

          {/* Cycle Results */}
          {cycles !== null && activeMode === 'cycles' && (
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
              <h3 className="text-sm font-semibold text-white mb-3">
                🔄 Detected Cycles ({cycles.length} found)
              </h3>
              {cycles.length === 0 ? (
                <p className="text-xs text-slate-400">No cycles detected in the transaction graph.</p>
              ) : (
                <div className="space-y-2">
                  {cycles.map((cycle, i) => (
                    <div key={i} className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2">
                      <span className="text-[10px] text-amber-400 font-semibold">Cycle {i + 1}: </span>
                      <span className="text-[10px] font-mono text-amber-300">{cycle.join(' → ')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, unit, color }: { label: string; value: string | number; unit: string; color: string }) {
  const colorMap: Record<string, string> = {
    cyan: 'text-cyan-400', blue: 'text-blue-400', purple: 'text-purple-400',
    amber: 'text-amber-400', emerald: 'text-emerald-400', pink: 'text-pink-400',
  };
  return (
    <div className="bg-slate-900/60 rounded-lg p-3 text-center border border-slate-700/30">
      <div className={`text-lg font-bold font-mono ${colorMap[color] || 'text-white'}`}>{value}</div>
      <div className="text-[9px] text-slate-500 uppercase">{unit}</div>
      <div className="text-[10px] text-slate-400 mt-0.5">{label}</div>
    </div>
  );
}
