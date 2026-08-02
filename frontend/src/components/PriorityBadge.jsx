import React from 'react';

const PRIORITY_CONFIG = {
  'High': { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
  'Medium': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  'Low': { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30' }
};

export default function PriorityBadge({ priority }) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG['Medium'];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider border ${config.bg} ${config.text} ${config.border}`}>
      {priority}
    </span>
  );
}
