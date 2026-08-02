import React from 'react';

const STATUS_CONFIG = {
  'Open': { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30', dot: 'bg-indigo-400' },
  'In Progress': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', dot: 'bg-amber-400' },
  'Blocked': { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30', dot: 'bg-rose-400' },
  'Completed': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', dot: 'bg-emerald-400' }
};

export default function StatusBadge({ status, onStatusChange, editable = false }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG['Open'];

  if (!editable) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
        {status}
      </span>
    );
  }

  return (
    <select
      value={status}
      onChange={(e) => onStatusChange && onStatusChange(e.target.value)}
      className={`px-2.5 py-1 rounded-full text-xs font-medium border bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer ${config.text} ${config.border}`}
    >
      <option value="Open" className="bg-slate-900 text-indigo-400">Open</option>
      <option value="In Progress" className="bg-slate-900 text-amber-400">In Progress</option>
      <option value="Blocked" className="bg-slate-900 text-rose-400">Blocked</option>
      <option value="Completed" className="bg-slate-900 text-emerald-400">Completed</option>
    </select>
  );
}
