import React, { useEffect, useState, useCallback } from 'react';
import {
  CheckSquare, Search, Plus, Trash2, Calendar, User,
  ArrowUpDown, ArrowUp, ArrowDown, Sparkles, RefreshCw
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import NewActionItemModal from '../components/NewActionItemModal';
import { fetchActionItems, updateActionItem, deleteActionItem, fetchMeetings } from '../api/client';

const PRIORITY_ORDER = { High: 0, Medium: 1, Low: 2 };

export default function ActionItemsPage() {
  const [items, setItems] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('priority');   // 'priority' | 'due_date' | 'owner' | 'status'
  const [sortDir, setSortDir] = useState('asc');            // 'asc' | 'desc'
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  /* ─── Data Fetching ─────────────────────────────────────────── */
  const loadActionItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchActionItems({
        status: statusFilter,
        priority: priorityFilter,
        owner: ownerFilter,
        search: searchTerm,
      });
      setItems(data);
    } catch (err) {
      console.error('Failed to fetch action items:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, ownerFilter, searchTerm]);

  useEffect(() => { loadActionItems(); }, [loadActionItems]);
  useEffect(() => { fetchMeetings().then(setMeetings).catch(console.error); }, []);

  /* ─── Sorting ───────────────────────────────────────────────── */
  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sorted = [...items].sort((a, b) => {
    let valA, valB;
    switch (sortField) {
      case 'priority':
        valA = PRIORITY_ORDER[a.priority] ?? 1;
        valB = PRIORITY_ORDER[b.priority] ?? 1;
        break;
      case 'due_date':
        valA = a.due_date === 'Not specified' ? 'zzzz' : a.due_date;
        valB = b.due_date === 'Not specified' ? 'zzzz' : b.due_date;
        break;
      case 'owner':
        valA = (a.owner || '').toLowerCase();
        valB = (b.owner || '').toLowerCase();
        break;
      case 'status':
        valA = a.status || '';
        valB = b.status || '';
        break;
      default:
        return 0;
    }
    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  /* ─── Inline Status Update ──────────────────────────────────── */
  const handleStatusChange = async (itemId, newStatus) => {
    setUpdatingId(itemId);
    try {
      const updated = await updateActionItem(itemId, { status: newStatus });
      setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, status: updated.status } : i)));
    } catch (err) {
      console.error('Status update failed:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  /* ─── Delete ─────────────────────────────────────────────────── */
  const handleDelete = async (itemId) => {
    if (!window.confirm('Delete this action item?')) return;
    try {
      await deleteActionItem(itemId);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  /* ─── Summary counters ───────────────────────────────────────── */
  const counts = items.reduce(
    (acc, i) => {
      acc[i.status] = (acc[i.status] || 0) + 1;
      return acc;
    },
    {}
  );

  /* ─── Sort header helper ─────────────────────────────────────── */
  const SortTh = ({ field, label }) => {
    const active = sortField === field;
    return (
      <th
        className="py-3.5 px-4 cursor-pointer select-none whitespace-nowrap"
        onClick={() => toggleSort(field)}
      >
        <span className={`flex items-center gap-1 ${active ? 'text-indigo-400' : ''}`}>
          {label}
          {active ? (
            sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
          ) : (
            <ArrowUpDown className="w-3 h-3 opacity-30" />
          )}
        </span>
      </th>
    );
  };

  const hasFilters = statusFilter !== 'All' || priorityFilter !== 'All' || ownerFilter || searchTerm;

  return (
    <div className="space-y-6 pb-12">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-indigo-400" />
            Central Action Tracker
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time status management for all meeting deliverables and assigned tasks.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={loadActionItems}
            title="Refresh"
            className="p-2 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Action Item
          </button>
        </div>
      </div>

      {/* ── Status Summary Pills ────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {['Open', 'In Progress', 'Blocked', 'Completed'].map((s) => {
          const colorMap = {
            Open: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
            'In Progress': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
            Blocked: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
            Completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          };
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? 'All' : s)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${colorMap[s]} ${statusFilter === s ? 'ring-2 ring-offset-1 ring-offset-slate-950 ring-current' : 'opacity-70 hover:opacity-100'}`}
            >
              {s} <span className="ml-1 font-bold">{counts[s] || 0}</span>
            </button>
          );
        })}
      </div>

      {/* ── Filter Bar ──────────────────────────────────────── */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search task or owner..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-medium hidden sm:inline">Priority:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="All">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        {/* Owner Filter */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-medium hidden sm:inline">Owner:</span>
          <input
            type="text"
            placeholder="Filter by owner..."
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 w-32 sm:w-36"
          />
        </div>

        {hasFilters && (
          <button
            onClick={() => { setStatusFilter('All'); setPriorityFilter('All'); setOwnerFilter(''); setSearchTerm(''); }}
            className="text-xs text-indigo-400 hover:underline px-2 py-1"
          >
            Reset Filters
          </button>
        )}

        <span className="ml-auto text-xs text-slate-500 hidden sm:block">
          {sorted.length} item{sorted.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Table ───────────────────────────────────────────── */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 animate-spin text-indigo-400" />
            Loading Action Tracker...
          </div>
        ) : sorted.length === 0 ? (
          <div className="py-16 text-center bg-slate-900/30 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mb-4 border border-indigo-500/20 shadow-inner shadow-indigo-500/10">
              <CheckSquare className="w-8 h-8 text-indigo-400" />
            </div>
            <p className="text-base font-semibold text-slate-200 mb-1">No action items found</p>
            <p className="text-xs text-slate-400 mb-5 max-w-[300px]">
              {hasFilters 
                ? "We couldn't find any items matching your filters. Try adjusting them." 
                : "Your action tracker is empty. Create a new item to get started."}
            </p>
            {hasFilters ? (
              <button
                onClick={() => { setStatusFilter('All'); setPriorityFilter('All'); setOwnerFilter(''); setSearchTerm(''); }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700"
              >
                Clear Filters
              </button>
            ) : (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all border border-indigo-500/20"
              >
                <Plus className="w-4 h-4" />
                Add Action Item
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Task Deliverable</th>
                  <SortTh field="owner" label="Owner" />
                  <th className="py-3.5 px-4">Meeting Context</th>
                  <SortTh field="due_date" label="Due Date" />
                  <SortTh field="priority" label="Priority" />
                  <SortTh field="status" label="Status" />
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {sorted.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-900/40 transition-colors ${updatingId === item.id ? 'opacity-60' : ''}`}
                  >
                    <td className="py-3.5 px-4 font-medium text-slate-200 max-w-xs">
                      <p className="leading-snug">{item.task}</p>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        {item.owner}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 max-w-[160px] truncate">
                      {item.meeting_title || 'Standalone Task'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {item.due_date}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <PriorityBadge priority={item.priority} />
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge
                        status={item.status}
                        editable={true}
                        onStatusChange={(newStatus) => handleStatusChange(item.id, newStatus)}
                      />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                        title="Delete Action Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Action Item Modal */}
      <NewActionItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => loadActionItems()}
        meetings={meetings}
      />
    </div>
  );
}
