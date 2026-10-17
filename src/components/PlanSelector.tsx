import React from 'react';
import { Clock, Flame, Zap, Check, Sparkles } from 'lucide-react';
import { ExpirationPlan, PlanConfig } from '../types';

interface PlanSelectorProps {
  selectedPlan: ExpirationPlan;
  onSelectPlan: (plan: ExpirationPlan) => void;
  maxDownloads: number;
  setMaxDownloads: (val: number) => void;
}

export const PLANS: PlanConfig[] = [
  {
    id: '15m',
    label: '15 Minutes',
    durationLabel: '15m',
    description: 'Instant disposable drop for quick handoffs',
    iconName: 'Zap',
    badge: 'Fast',
  },
  {
    id: '1h',
    label: '1 Hour',
    durationLabel: '1 Hour',
    description: 'Short-lived link for test builds and quick tasks',
    iconName: 'Clock',
  },
  {
    id: '6h',
    label: '6 Hours',
    durationLabel: '6 Hours',
    description: 'Covers an active workday collaboration session',
    iconName: 'Clock',
  },
  {
    id: '12h',
    label: '12 Hours',
    durationLabel: '12 Hours',
    description: 'Half-day window across timezones',
    iconName: 'Clock',
  },
  {
    id: '24h',
    label: '24 Hours',
    durationLabel: '24 Hours',
    description: 'Default standard ephemeral hosting window',
    iconName: 'Clock',
    badge: 'Popular',
  },
  {
    id: '3d',
    label: '3 Days',
    durationLabel: '72 Hours',
    description: 'Weekend safety cushion for team reviews',
    iconName: 'Clock',
  },
  {
    id: '7d',
    label: '7 Days',
    durationLabel: '1 Week',
    description: 'Maximum permitted temporary retention',
    iconName: 'Clock',
    badge: 'Max',
  },
  {
    id: 'burn',
    label: 'Burn After Read',
    durationLabel: '1 Download',
    description: 'Deletes permanently immediately after first download',
    iconName: 'Flame',
    badge: 'Secret',
  },
];

export const PlanSelector: React.FC<PlanSelectorProps> = ({
  selectedPlan,
  onSelectPlan,
  maxDownloads,
  setMaxDownloads,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            Expiration & Self-Destruct Policy
          </h3>
          <p className="text-xs text-neutral-400">
            Files are automatically scrubbed from server and storage when this timer expires.
          </p>
        </div>

        {selectedPlan !== 'burn' && (
          <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-neutral-300">
            <span className="text-neutral-400">Max downloads:</span>
            <select
              value={maxDownloads}
              onChange={(e) => setMaxDownloads(Number(e.target.value))}
              aria-label="Max downloads limit"
              className="bg-neutral-800 text-white rounded px-2 py-0.5 border border-neutral-700 text-xs focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value={0}>Unlimited</option>
              <option value={1}>1 download only</option>
              <option value={3}>3 downloads</option>
              <option value={5}>5 downloads</option>
              <option value={10}>10 downloads</option>
              <option value={25}>25 downloads</option>
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {PLANS.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          const isBurn = plan.id === 'burn';

          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => onSelectPlan(plan.id)}
              className={`relative flex flex-col items-start p-3 rounded-xl border text-left transition-all duration-200 group ${
                isSelected
                  ? isBurn
                    ? 'bg-rose-950/40 border-rose-500 shadow-md shadow-rose-950/50 ring-1 ring-rose-500/50'
                    : 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-950/50 ring-1 ring-cyan-500/50'
                  : 'bg-neutral-900/60 border-neutral-800/80 hover:bg-neutral-900 hover:border-neutral-700'
              }`}
            >
              {plan.badge && (
                <span
                  className={`absolute -top-2 -right-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full border shadow-sm ${
                    isSelected
                      ? isBurn
                        ? 'bg-rose-500 text-white border-rose-400'
                        : 'bg-cyan-500 text-neutral-950 border-cyan-400'
                      : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                  }`}
                >
                  {plan.badge}
                </span>
              )}

              <div className="flex items-center justify-between w-full mb-1.5">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                    isSelected
                      ? isBurn
                        ? 'bg-rose-500 text-white'
                        : 'bg-cyan-500 text-neutral-950'
                      : 'bg-neutral-800 text-neutral-400 group-hover:text-neutral-200'
                  }`}
                >
                  {isBurn ? (
                    <Flame className="w-3.5 h-3.5" />
                  ) : plan.id === '15m' ? (
                    <Zap className="w-3.5 h-3.5" />
                  ) : (
                    <Clock className="w-3.5 h-3.5" />
                  )}
                </div>
                {isSelected && (
                  <Check
                    className={`w-4 h-4 ${isBurn ? 'text-rose-400' : 'text-cyan-400'}`}
                  />
                )}
              </div>

              <span
                className={`text-xs font-bold leading-tight ${
                  isSelected ? 'text-white' : 'text-neutral-300'
                }`}
              >
                {plan.label}
              </span>

              <span
                className={`text-[11px] font-mono mt-0.5 ${
                  isSelected
                    ? isBurn
                      ? 'text-rose-300'
                      : 'text-cyan-300'
                    : 'text-neutral-500'
                }`}
              >
                {plan.durationLabel}
              </span>
            </button>
          );
        })}
      </div>

      <div className="bg-neutral-900/40 rounded-lg p-2.5 border border-neutral-800/60 flex items-center justify-between text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          {selectedPlan === 'burn' ? (
            <Flame className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          )}
          <span>
            {PLANS.find((p) => p.id === selectedPlan)?.description}
          </span>
        </div>
        <span className="font-mono text-[11px] text-neutral-500 hidden sm:inline">
          Public API param: <code className="text-cyan-400">expires={selectedPlan}</code>
        </span>
      </div>
    </div>
  );
};
