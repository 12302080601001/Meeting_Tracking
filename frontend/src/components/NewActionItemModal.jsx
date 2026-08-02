import React, { useState } from 'react';
import { X, CheckSquare, Plus, Loader2 } from 'lucide-react';
import { createActionItem } from '../api/client';

export default function NewActionItemModal({ isOpen, onClose, onSuccess, meetings = [] }) {
  const [task, setTask] = useState('');
  const [owner, setOwner] = useState('Unassigned');
  const [dueDate, setDueDate] = useState('Not specified');
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('Open');
  const [meetingId, setMeetingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!task.trim()) {
      setError('Task description is required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await createActionItem({
        task: task.trim(),
        owner: owner.trim() || 'Unassigned',
        due_date: dueDate.trim() || 'Not specified',
        priority,
        status,
        meeting_id: meetingId ? parseInt(meetingId) : null
      });
      setLoading(false);
      onSuccess(res);
      onClose();
      // Reset
      setTask('');
      setOwner('Unassigned');
      setDueDate('Not specified');
      setPriority('Medium');
      setStatus('Open');
      setMeetingId('');
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Failed to create action item.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <CheckSquare className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-100">Add New Action Item</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Task Description *</label>
            <input
              type="text"
              required
              placeholder="e.g. Verify database migration script"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Assigned Owner</label>
              <input
                type="text"
                placeholder="e.g. Marcus Vance"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Due Date</label>
              <input
                type="text"
                placeholder="YYYY-MM-DD or Next Friday"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Initial Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Blocked">Blocked</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {meetings.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Link to Meeting (Optional)</label>
              <select
                value={meetingId}
                onChange={(e) => setMeetingId(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="">-- Standalone Task --</option>
                {meetings.map((m) => (
                  <option key={m.id} value={m.id}>{m.title} ({m.date})</option>
                ))}
              </select>
            </div>
          )}

          <div className="pt-2 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create Action Item
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
