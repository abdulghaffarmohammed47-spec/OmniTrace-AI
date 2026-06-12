import { useRef, useEffect, useState, useCallback } from 'react';
import { TransactionGraph, SearchResult } from '../lib/types';

interface NetworkGraphProps {
  graph: TransactionGraph;
  searchResult?: SearchResult | null;
  highlightNodes?: Set<string>;
  highlightDepth?: Map<string, number>;
  width?: number;
  height?: number;
}

export default function NetworkGraph({
  graph,
  searchResult,
  highlightNodes,
  highlightDepth,
  width = 800,
  height = 600,
}: NetworkGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  const pathSet = new Set<string>();
  const visitedSet = new Set<string>(searchResult?.visited || []);

  if (searchResult?.path) {
    for (let i = 0; i < searchResult.path.length - 1; i++) {
      pathSet.add(`${searchResult.path[i]}|${searchResult.path[i + 1]}`);
      pathSet.add(`${searchResult.path[i + 1]}|${searchResult.path[i]}`);
    }
    searchResult.path.forEach(n => visitedSet.add(n));
  }

  const getNodeColor = useCallback((nodeId: string, isFraud: boolean, type: string) => {
    if (searchResult?.path?.length) {
      if (nodeId === searchResult.path[0]) return '#22c55e'; // Start - green
      if (nodeId === searchResult.path[searchResult.path.length - 1]) return '#f97316'; // End - orange
      if (searchResult.path.includes(nodeId)) return '#eab308'; // On path - yellow
      if (visitedSet.has(nodeId)) return '#6366f1'; // Visited - indigo
    }
    if (highlightNodes?.has(nodeId)) {
      const depth = highlightDepth?.get(nodeId) ?? 0;
      const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4'];
      return colors[Math.min(depth, colors.length - 1)];
    }
    if (isFraud) return '#ef4444';
    if (type === 'ip') return '#8b5cf6';
    if (type === 'device') return '#06b6d4';
    return '#3b82f6';
  }, [searchResult, highlightNodes, highlightDepth, visitedSet]);

  const getNodeRadius = (type: string) => {
    if (type === 'account') return 14;
    if (type === 'ip') return 10;
    return 8;
  };

  const getNodeShape = (type: string) => type;

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform(prev => ({
      ...prev,
      scale: Math.max(0.2, Math.min(3, prev.scale * scaleFactor)),
    }));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setDragging(true);
      setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    }
  }, [transform]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragging) {
      setTransform(prev => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      }));
    }
  }, [dragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setDragging(false);
  }, []);

  // Center graph on mount
  useEffect(() => {
    if (graph.nodes.length > 0) {
      const xs = graph.nodes.map(n => n.x);
      const ys = graph.nodes.map(n => n.y);
      const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
      const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
      setTransform({
        x: width / 2 - cx * 0.85,
        y: height / 2 - cy * 0.85,
        scale: 0.85,
      });
    }
  }, [graph, width, height]);

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-700/50 bg-slate-950">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glowStrong">
            <feGaussianBlur stdDeviation="5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="10"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#475569" />
          </marker>
          <marker
            id="arrowhead-active"
            markerWidth="10"
            markerHeight="7"
            refX="10"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#eab308" />
          </marker>
          <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1e293b" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#020617" stopOpacity="1" />
          </radialGradient>
        </defs>

        <rect width={width} height={height} fill="url(#bgGrad)" />

        {/* Grid pattern */}
        <g opacity="0.05">
          {Array.from({ length: Math.ceil(width / 40) }, (_, i) => (
            <line key={`vg${i}`} x1={i * 40} y1={0} x2={i * 40} y2={height} stroke="#64748b" strokeWidth="0.5" />
          ))}
          {Array.from({ length: Math.ceil(height / 40) }, (_, i) => (
            <line key={`hg${i}`} x1={0} y1={i * 40} x2={width} y2={i * 40} stroke="#64748b" strokeWidth="0.5" />
          ))}
        </g>

        <g transform={`translate(${transform.x},${transform.y}) scale(${transform.scale})`}>
          {/* Edges */}
          {graph.edges.map((edge, i) => {
            const sourceNode = graph.nodes.find(n => n.id === edge.source);
            const targetNode = graph.nodes.find(n => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;

            const edgeKey = `${edge.source}|${edge.target}`;
            const isOnPath = pathSet.has(edgeKey);
            const isVisited = visitedSet.has(edge.source) && visitedSet.has(edge.target);

            return (
              <line
                key={`e${i}`}
                x1={sourceNode.x}
                y1={sourceNode.y}
                x2={targetNode.x}
                y2={targetNode.y}
                stroke={isOnPath ? '#eab308' : isVisited ? '#6366f1' : '#334155'}
                strokeWidth={isOnPath ? 3 : 1}
                opacity={isOnPath ? 1 : isVisited ? 0.6 : 0.3}
                filter={isOnPath ? 'url(#glow)' : undefined}
                markerEnd={isOnPath ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
              />
            );
          })}

          {/* Nodes */}
          {graph.nodes.map(node => {
            const color = getNodeColor(node.id, node.isFraud, node.type);
            const r = getNodeRadius(node.type);
            const shape = getNodeShape(node.type);
            const isOnPath = searchResult?.path?.includes(node.id);
            const isHighlighted = highlightNodes?.has(node.id);

            return (
              <g
                key={node.id}
                onMouseEnter={(e) => {
                  const rect = svgRef.current?.getBoundingClientRect();
                  if (rect) {
                    setTooltip({
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top - 10,
                      text: `${node.id} (${node.type}) — Risk: ${(node.riskScore * 100).toFixed(0)}%`,
                    });
                  }
                }}
                onMouseLeave={() => setTooltip(null)}
                className="cursor-pointer"
              >
                {/* Glow ring for important nodes */}
                {(isOnPath || isHighlighted || node.isFraud) && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={r + 6}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    opacity="0.3"
                    filter="url(#glow)"
                  >
                    <animate
                      attributeName="r"
                      values={`${r + 4};${r + 8};${r + 4}`}
                      dur="2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.3;0.6;0.3"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                {shape === 'ip' ? (
                  <rect
                    x={node.x - r}
                    y={node.y - r}
                    width={r * 2}
                    height={r * 2}
                    rx={3}
                    fill={color}
                    opacity={0.9}
                    filter={isOnPath ? 'url(#glowStrong)' : undefined}
                  />
                ) : shape === 'device' ? (
                  <polygon
                    points={`${node.x},${node.y - r} ${node.x + r},${node.y + r} ${node.x - r},${node.y + r}`}
                    fill={color}
                    opacity={0.9}
                    filter={isOnPath ? 'url(#glowStrong)' : undefined}
                  />
                ) : (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={r}
                    fill={color}
                    opacity={0.9}
                    filter={isOnPath ? 'url(#glowStrong)' : undefined}
                  />
                )}

                {/* Label */}
                <text
                  x={node.x}
                  y={node.y + r + 14}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="8"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {node.label.length > 12 ? node.label.slice(0, 12) + '..' : node.label}
                </text>
              </g>
            );
          })}
        </g>

        {/* Tooltip */}
        {tooltip && (
          <g>
            <rect
              x={tooltip.x - 100}
              y={tooltip.y - 28}
              width={200}
              height={24}
              rx={4}
              fill="#1e293b"
              stroke="#475569"
              strokeWidth="1"
            />
            <text
              x={tooltip.x}
              y={tooltip.y - 12}
              textAnchor="middle"
              fill="#e2e8f0"
              fontSize="10"
              fontFamily="JetBrains Mono, monospace"
            >
              {tooltip.text}
            </text>
          </g>
        )}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50">
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Legend</div>
        <div className="flex flex-wrap gap-3 text-[10px] text-slate-300">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Account</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-purple-500 inline-block" /> IP</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-cyan-500 inline-block" style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }} /> Device</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> Fraud</span>
          {searchResult && (
            <>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> Start</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500 inline-block" /> Target</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-500 inline-block" /> Path</span>
            </>
          )}
        </div>
      </div>

      {/* Controls hint */}
      <div className="absolute top-3 right-3 text-[10px] text-slate-500 bg-slate-900/70 rounded px-2 py-1">
        Scroll to zoom · Drag to pan
      </div>
    </div>
  );
}
