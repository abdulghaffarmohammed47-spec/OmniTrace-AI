import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
  LineChart, Line,
} from 'recharts';
import { TransactionGraph, SearchResult } from '../lib/types';
import { runAllAlgorithms } from '../lib/graphAlgorithms';

interface Props {
  graph: TransactionGraph;
}

export default function PerformanceAnalytics({ graph }: Props) {
  const [startNode, setStartNode] = useState('');
  const [targetNode, setTargetNode] = useState('');
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [multiResults, setMultiResults] = useState<SearchResult[][]>([]);

  const nodeIds = useMemo(() => graph.nodes.map(n => n.id).sort(), [graph]);

  const runBenchmark = () => {
    if (!startNode || !targetNode) return;
    const allResults = runAllAlgorithms(graph, startNode, targetNode);
    setResults(allResults);
    setMultiResults(prev => [...prev, allResults]);
  };

  const clearHistory = () => {
    setMultiResults([]);
    setResults(null);
  };

  const chartData = useMemo(() => {
    if (!results) return [];
    return results.map(r => ({
      algorithm: r.algorithm,
      executionTime: parseFloat(r.executionTimeMs.toFixed(3)),
      nodesExpanded: r.nodesExpanded,
      maxQueueDepth: r.maxQueueDepth,
      pathLength: r.path.length > 0 ? r.path.length - 1 : 0,
      pathCost: r.cost === Infinity ? 0 : parseFloat(r.cost.toFixed(2)),
    }));
  }, [results]);

  const radarData = useMemo(() => {
    if (!results) return [];
    const maxTime = Math.max(...results.map(r => r.executionTimeMs), 0.001);
    const maxNodes = Math.max(...results.map(r => r.nodesExpanded), 1);
    const maxQueue = Math.max(...results.map(r => r.maxQueueDepth), 1);
    const maxPath = Math.max(...results.map(r => r.path.length), 1);
    const maxCost = Math.max(...results.filter(r => r.cost !== Infinity).map(r => r.cost), 1);

    return [
      { metric: 'Speed', ...Object.fromEntries(results.map(r => [r.algorithm, Math.round((1 - r.executionTimeMs / maxTime) * 100)])) },
      { metric: 'Memory Eff.', ...Object.fromEntries(results.map(r => [r.algorithm, Math.round((1 - r.maxQueueDepth / maxQueue) * 100)])) },
      { metric: 'Path Quality', ...Object.fromEntries(results.map(r => [r.algorithm, r.path.length > 0 ? Math.round((1 - (r.path.length - 1) / maxPath) * 100) : 0])) },
      { metric: 'Exploration', ...Object.fromEntries(results.map(r => [r.algorithm, Math.round((1 - r.nodesExpanded / maxNodes) * 100)])) },
      { metric: 'Cost Opt.', ...Object.fromEntries(results.map(r => [r.algorithm, r.cost === Infinity ? 0 : Math.round((1 - r.cost / maxCost) * 100)])) },
    ];
  }, [results]);

  const historyData = useMemo(() => {
    return multiResults.map((run, i) => {
      const entry: Record<string, number | string> = { run: `Run ${i + 1}` };
      run.forEach(r => {
        entry[`${r.algorithm}_time`] = parseFloat(r.executionTimeMs.toFixed(3));
        entry[`${r.algorithm}_nodes`] = r.nodesExpanded;
      });
      return entry;
    });
  }, [multiResults]);

  const algoColors: Record<string, string> = {
    BFS: '#22d3ee',
    DFS: '#a78bfa',
    Dijkstra: '#fbbf24',
    'A*': '#f87171',
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl text-xs">
          <p className="text-slate-200 font-semibold mb-1">{label}</p>
          {payload.map((entry: any, i: number) => (
            <p key={i} style={{ color: entry.color }} className="font-mono">
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="text-3xl">📊</span>
            Comparative Performance Analytics
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Benchmark execution speed, memory footprint, and search density across all algorithms
          </p>
        </div>
        {multiResults.length > 0 && (
          <button
            onClick={clearHistory}
            className="px-3 py-1.5 text-xs text-slate-400 border border-slate-700 rounded-lg hover:bg-slate-700/50 transition-colors"
          >
            Clear History
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="text-[11px] text-slate-400 mb-1 block">Start Node</label>
            <select
              value={startNode}
              onChange={e => setStartNode(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-xs text-slate-200
                focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none"
            >
              <option value="">Select...</option>
              {nodeIds.map(id => (
                <option key={id} value={id}>{id}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-[11px] text-slate-400 mb-1 block">Target Node</label>
            <select
              value={targetNode}
              onChange={e => setTargetNode(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-xs text-slate-200
                focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none"
            >
              <option value="">Select...</option>
              {nodeIds.map(id => (
                <option key={id} value={id}>{id}</option>
              ))}
            </select>
          </div>
          <button
            onClick={runBenchmark}
            disabled={!startNode || !targetNode}
            className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500
              text-white font-semibold text-xs hover:from-cyan-400 hover:via-blue-400 hover:to-purple-400
              transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
          >
            ⚡ Run All Algorithms
          </button>
        </div>
      </div>

      {results && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {results.map(r => (
              <div key={r.algorithm}
                className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4"
                style={{ borderLeftColor: algoColors[r.algorithm], borderLeftWidth: 3 }}
              >
                <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: algoColors[r.algorithm] }} />
                  {r.algorithm}
                </div>
                <div className="text-lg font-bold font-mono text-white">{r.executionTimeMs.toFixed(3)}ms</div>
                <div className="mt-2 grid grid-cols-2 gap-x-3 text-[10px]">
                  <div className="text-slate-400">Path: <span className="text-slate-200 font-mono">{r.path.length > 0 ? r.path.length - 1 : '∞'}</span></div>
                  <div className="text-slate-400">Cost: <span className="text-slate-200 font-mono">{r.cost === Infinity ? '∞' : r.cost.toFixed(1)}</span></div>
                  <div className="text-slate-400">Nodes: <span className="text-slate-200 font-mono">{r.nodesExpanded}</span></div>
                  <div className="text-slate-400">Queue: <span className="text-slate-200 font-mono">{r.maxQueueDepth}</span></div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Execution Time */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
              <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                ⏱️ Execution Time (ms)
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="algorithm" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="executionTime" name="Time (ms)" radius={[4, 4, 0, 0]}
                    fill="#22d3ee" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Nodes Expanded */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
              <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                🔢 Nodes Expanded (Search Density)
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="algorithm" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="nodesExpanded" name="Nodes" radius={[4, 4, 0, 0]}
                    fill="#a78bfa" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Queue Depth */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
              <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                📦 Peak Queue/Stack Depth (Space Complexity)
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="algorithm" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="maxQueueDepth" name="Depth" radius={[4, 4, 0, 0]}
                    fill="#fbbf24" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Radar Chart */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
              <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                🎯 Multi-Dimensional Comparison
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <PolarRadiusAxis tick={{ fill: '#64748b', fontSize: 9 }} domain={[0, 100]} />
                  {results.map(r => (
                    <Radar
                      key={r.algorithm}
                      name={r.algorithm}
                      dataKey={r.algorithm}
                      stroke={algoColors[r.algorithm]}
                      fill={algoColors[r.algorithm]}
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                  ))}
                  <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* History Chart */}
          {multiResults.length > 1 && (
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
              <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                📈 Benchmark History — Execution Time Trend
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={historyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="run" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                  {Object.entries(algoColors).map(([algo, color]) => (
                    <Line
                      key={algo}
                      type="monotone"
                      dataKey={`${algo}_time`}
                      name={`${algo} (ms)`}
                      stroke={color}
                      strokeWidth={2}
                      dot={{ fill: color, r: 4 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Algorithm Comparison Table */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
            <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
              📋 Detailed Algorithm Comparison
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-700">
                    <th className="text-left py-2 px-3 font-medium">Algorithm</th>
                    <th className="text-left py-2 px-3 font-medium">Type</th>
                    <th className="text-right py-2 px-3 font-medium">Time (ms)</th>
                    <th className="text-right py-2 px-3 font-medium">Nodes</th>
                    <th className="text-right py-2 px-3 font-medium">Queue</th>
                    <th className="text-right py-2 px-3 font-medium">Path Len</th>
                    <th className="text-right py-2 px-3 font-medium">Cost</th>
                    <th className="text-left py-2 px-3 font-medium">Optimal?</th>
                    <th className="text-left py-2 px-3 font-medium">Complete?</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map(r => {
                    const isOptimal = r.algorithm === 'Dijkstra' || r.algorithm === 'A*';
                    return (
                      <tr key={r.algorithm} className="border-b border-slate-800/50 hover:bg-slate-700/20">
                        <td className="py-2 px-3 font-semibold" style={{ color: algoColors[r.algorithm] }}>
                          {r.algorithm}
                        </td>
                        <td className="py-2 px-3 text-slate-400">
                          {r.algorithm === 'BFS' || r.algorithm === 'DFS' ? 'Uninformed' : 'Informed'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-200">{r.executionTimeMs.toFixed(3)}</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-200">{r.nodesExpanded}</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-200">{r.maxQueueDepth}</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-200">
                          {r.path.length > 0 ? r.path.length - 1 : '∞'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-200">
                          {r.cost === Infinity ? '∞' : r.cost.toFixed(1)}
                        </td>
                        <td className="py-2 px-3">
                          <span className={isOptimal ? 'text-emerald-400' : 'text-slate-500'}>
                            {isOptimal ? '✅ Yes' : '❌ No'}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span className={r.path.length > 0 ? 'text-emerald-400' : 'text-red-400'}>
                            {r.path.length > 0 ? '✅ Yes' : '❌ No'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Empty state */}
      {!results && (
        <div className="bg-slate-800/30 rounded-xl border border-dashed border-slate-700/50 p-16 text-center">
          <div className="text-5xl mb-4">⚡</div>
          <h3 className="text-lg font-semibold text-slate-300 mb-2">No Benchmark Data Yet</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Select a start and target node above, then click "Run All Algorithms" to generate
            comparative performance analytics across BFS, DFS, Dijkstra, and A*.
          </p>
        </div>
      )}
    </div>
  );
}
