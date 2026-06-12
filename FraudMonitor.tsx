import { useState, useMemo } from 'react';
import { Transaction, FraudScore } from '../lib/types';
import { calculateFraudScore, scoreTransaction } from '../lib/fraudEngine';

interface Props {
  transactions: Transaction[];
}

function RiskGauge({ score, size = 180 }: { score: number; size?: number }) {
  const radius = size / 2 - 20;
  const circumference = Math.PI * radius; // semicircle
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 75 ? '#ef4444' : score >= 50 ? '#f97316' : score >= 25 ? '#eab308' : '#22c55e';

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 30} viewBox={`0 0 ${size} ${size / 2 + 30}`}>
        {/* Background arc */}
        <path
          d={`M 20 ${size / 2 + 10} A ${radius} ${radius} 0 0 1 ${size - 20} ${size / 2 + 10}`}
          fill="none"
          stroke="#1e293b"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Score arc */}
        <path
          d={`M 20 ${size / 2 + 10} A ${radius} ${radius} 0 0 1 ${size - 20} ${size / 2 + 10}`}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ filter: `drop-shadow(0 0 8px ${color}40)`, transition: 'stroke-dashoffset 0.8s ease-out' }}
        />
        {/* Score text */}
        <text
          x={size / 2}
          y={size / 2 - 5}
          textAnchor="middle"
          fill={color}
          fontSize="36"
          fontWeight="bold"
          fontFamily="JetBrains Mono, monospace"
        >
          {score}
        </text>
        <text
          x={size / 2}
          y={size / 2 + 18}
          textAnchor="middle"
          fill="#64748b"
          fontSize="12"
          fontFamily="Inter, sans-serif"
        >
          RISK INDEX
        </text>
      </svg>
    </div>
  );
}

function ClassBadge({ classification }: { classification: FraudScore['classification'] }) {
  const styles = {
    LOW: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    MEDIUM: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    HIGH: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    CRITICAL: 'bg-red-500/15 text-red-400 border-red-500/30 animate-pulse',
  };

  return (
    <span className={`px-3 py-1 text-xs font-bold rounded-full border ${styles[classification]}`}>
      {classification} RISK
    </span>
  );
}

export default function FraudMonitor({ transactions }: Props) {
  const [amount, setAmount] = useState(5000);
  const [hour, setHour] = useState(2);
  const [cardAge, setCardAge] = useState(1);
  const [velocity, setVelocity] = useState(4);
  const [distance, setDistance] = useState(6000);
  const [timeBetween, setTimeBetween] = useState(5);
  const [sharedDevices, setSharedDevices] = useState(4);
  const [sharedIPs, setSharedIPs] = useState(5);

  const score = useMemo(() =>
    calculateFraudScore(amount, hour, cardAge, velocity, distance, timeBetween, sharedDevices, sharedIPs),
    [amount, hour, cardAge, velocity, distance, timeBetween, sharedDevices, sharedIPs]
  );

  // Score recent transactions
  const recentScores = useMemo(() => {
    return transactions.slice(-12).map(txn => ({
      txn,
      score: scoreTransaction(txn, transactions),
    }));
  }, [transactions]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="text-3xl">🔮</span>
            Real-Time Fraud Monitor
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Input transaction variables to see live hybrid scoring (ML + Rules Engine)
          </p>
        </div>
        <ClassBadge classification={score.classification} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <div className="lg:col-span-1 bg-slate-800/50 rounded-xl border border-slate-700/50 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <span>⚙️</span> Transaction Variables
          </h3>

          <InputSlider label="Transaction Amount ($)" value={amount} min={0} max={50000} step={100}
            onChange={setAmount} format={v => `$${v.toLocaleString()}`} />
          <InputSlider label="Transaction Hour" value={hour} min={0} max={23} step={1}
            onChange={setHour} format={v => `${v}:00`} />
          <InputSlider label="Card Age (months)" value={cardAge} min={0} max={120} step={1}
            onChange={setCardAge} format={v => `${v} mo`} />
          <InputSlider label="Velocity (txns/min)" value={velocity} min={0} max={10} step={0.5}
            onChange={setVelocity} format={v => `${v}/min`} />
          <InputSlider label="Travel Distance (km)" value={distance} min={0} max={20000} step={100}
            onChange={setDistance} format={v => `${v.toLocaleString()} km`} />
          <InputSlider label="Time Between Txns (min)" value={timeBetween} min={1} max={480} step={1}
            onChange={setTimeBetween} format={v => `${v} min`} />
          <InputSlider label="Shared Devices" value={sharedDevices} min={1} max={10} step={1}
            onChange={setSharedDevices} format={v => `${v}`} />
          <InputSlider label="Shared IPs" value={sharedIPs} min={1} max={10} step={1}
            onChange={setSharedIPs} format={v => `${v}`} />
        </div>

        {/* Score Display */}
        <div className="lg:col-span-1 space-y-5">
          {/* Main gauge */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5 flex flex-col items-center">
            <RiskGauge score={score.combinedScore} />
            <div className="grid grid-cols-2 gap-4 w-full mt-4">
              <ScoreCard label="Rule Engine" value={score.ruleScore} color="#8b5cf6" />
              <ScoreCard label="ML Classifier" value={score.mlScore} color="#06b6d4" />
            </div>
          </div>

          {/* ML Feature Weights */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span>🧠</span> ML Feature Activations
            </h3>
            <div className="space-y-2">
              {Object.entries(score.mlFeatures).map(([key, value]) => (
                <FeatureBar key={key} label={key} value={value as number} />
              ))}
            </div>
          </div>
        </div>

        {/* Rule Details */}
        <div className="lg:col-span-1 bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span>📋</span> Rule Engine Analysis
          </h3>
          <div className="space-y-3">
            {score.ruleDetails.map((rule, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg border ${
                  rule.triggered
                    ? 'bg-red-500/10 border-red-500/30'
                    : 'bg-slate-900/50 border-slate-700/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">
                    {rule.triggered ? '🚨' : '✅'} {rule.rule}
                  </span>
                  {rule.triggered && (
                    <span className="text-xs font-mono text-red-400">+{rule.contribution}%</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{rule.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transaction Feed */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span>📊</span> Recent Transaction Risk Feed
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-700/50">
                <th className="text-left py-2 px-3 font-medium">TXN ID</th>
                <th className="text-left py-2 px-3 font-medium">User</th>
                <th className="text-right py-2 px-3 font-medium">Amount</th>
                <th className="text-left py-2 px-3 font-medium">Location</th>
                <th className="text-center py-2 px-3 font-medium">Rule</th>
                <th className="text-center py-2 px-3 font-medium">ML</th>
                <th className="text-center py-2 px-3 font-medium">Combined</th>
                <th className="text-center py-2 px-3 font-medium">Class</th>
              </tr>
            </thead>
            <tbody>
              {recentScores.map(({ txn, score: s }, i) => (
                <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-700/20 transition-colors">
                  <td className="py-2 px-3 font-mono text-slate-300">{txn.id}</td>
                  <td className="py-2 px-3 text-slate-300">{txn.userId}</td>
                  <td className="py-2 px-3 text-right text-slate-200 font-mono">
                    ${txn.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 px-3 text-slate-400">{txn.city}</td>
                  <td className="py-2 px-3 text-center">
                    <MiniScore value={s.ruleScore} />
                  </td>
                  <td className="py-2 px-3 text-center">
                    <MiniScore value={s.mlScore} />
                  </td>
                  <td className="py-2 px-3 text-center">
                    <MiniScore value={s.combinedScore} />
                  </td>
                  <td className="py-2 px-3 text-center">
                    <ClassBadge classification={s.classification} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function InputSlider({
  label, value, min, max, step, onChange, format,
}: {
  label: string; value: number; min: number; max: number;
  step: number; onChange: (v: number) => void; format: (v: number) => string;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-200 font-mono font-semibold">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none bg-slate-700 accent-cyan-500 cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:shadow-lg
          [&::-webkit-slider-thumb]:shadow-cyan-500/30 [&::-webkit-slider-thumb]:cursor-pointer"
      />
    </div>
  );
}

function ScoreCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-slate-900/50 rounded-lg p-3 text-center border border-slate-700/30">
      <div className="text-2xl font-bold font-mono" style={{ color }}>{value}%</div>
      <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">{label}</div>
    </div>
  );
}

function FeatureBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 70 ? '#ef4444' : pct >= 40 ? '#f97316' : '#22c55e';
  return (
    <div>
      <div className="flex justify-between text-[10px] mb-0.5">
        <span className="text-slate-400">{label.replace(/([A-Z])/g, ' $1').trim()}</span>
        <span className="font-mono text-slate-300">{pct}%</span>
      </div>
      <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function MiniScore({ value }: { value: number }) {
  const color = value >= 75 ? 'text-red-400' : value >= 50 ? 'text-orange-400' : value >= 25 ? 'text-yellow-400' : 'text-emerald-400';
  return <span className={`font-mono font-bold ${color}`}>{value}</span>;
}
