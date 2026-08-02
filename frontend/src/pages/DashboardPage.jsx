import React, { useEffect, useState } from 'react';
import { Video, CheckSquare, Clock, AlertTriangle, CheckCircle2, ArrowRight, Sparkles, Database, Plus } from 'lucide-react';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import { fetchDashboard, fetchMeetings, fetchActionItems, updateActionItem } from '../api/client';

export default function DashboardPage({ setActiveTab, onOpenNewMeeting, onSeedData, setSelectedMeetingId }) {
  const [metrics, setMetrics] = useState(null);
  const [recentMeetings, setRecentMeetings] = useState([]);
  const [urgentTasks, setUrgentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [dashData, meetingsData, tasksData] = await Promise.all([
        fetchDashboard(),
        fetchMeetings(),
        fetchActionItems({ status: 'Open' })
      ]);
      setMetrics(dashData);
      setRecentMeetings(meetingsData.slice(0, 4));
      setUrgentTasks(tasksData.slice(0, 5));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateActionItem(taskId, { status: newStatus });
      loadDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-indigo-400 text-sm">
          <Sparkles className="w-5 h-5 animate-spin" />
          Loading AI Dashboard metrics...
        </div>
      </div>
    );
  }

  const hasData = metrics && metrics.total_meetings > 0;

  return (
    <div className="space-y-8 pb-12">
      
      {/* Welcome Banner */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            AI Executive Dashboard
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
              Real-time Analytics
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Automated meeting intelligence powered by Gemini 2.5 Flash SDK and Pydantic response schema extraction.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {!hasData && (
            <button
              onClick={onSeedData}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-all"
            >
              <Database className="w-4 h-4" />
              Seed Demo Data
            </button>
          )}
          <button
            onClick={onOpenNewMeeting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Meeting
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Meetings"
          value={metrics?.total_meetings || 0}
          icon={Video}
          color="indigo"
          subtitle="Processed transcripts"
        />
        <StatCard
          title="Total Action Items"
          value={metrics?.total_action_items || 0}
          icon={CheckSquare}
          color="cyan"
          subtitle="Extracted to-do items"
        />
        <StatCard
          title="Open Action Items"
          value={(metrics?.open_tasks || 0) + (metrics?.in_progress_tasks || 0)}
          icon={Clock}
          color="amber"
          subtitle={`${metrics?.in_progress_tasks || 0} currently in progress`}
        />
        <StatCard
          title="Completed Tasks"
          value={metrics?.completed_tasks || 0}
          icon={CheckCircle2}
          color="emerald"
          subtitle={`${metrics?.overdue_tasks || 0} overdue tasks`}
        />
      </div>

      {/* Priority Distribution & Overdue Warning */}
      {metrics && metrics.total_action_items > 0 && (
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">Action Item Priority Distribution</span>
            <span className="text-slate-400">{metrics.total_action_items} Total Items</span>
          </div>
          <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${(metrics.priority_breakdown.High / metrics.total_action_items) * 100}%` }}
              className="bg-rose-500 transition-all"
              title={`High: ${metrics.priority_breakdown.High}`}
            />
            <div
              style={{ width: `${(metrics.priority_breakdown.Medium / metrics.total_action_items) * 100}%` }}
              className="bg-amber-500 transition-all"
              title={`Medium: ${metrics.priority_breakdown.Medium}`}
            />
            <div
              style={{ width: `${(metrics.priority_breakdown.Low / metrics.total_action_items) * 100}%` }}
              className="bg-slate-500 transition-all"
              title={`Low: ${metrics.priority_breakdown.Low}`}
            />
          </div>
          <div className="flex items-center gap-4 text-xs pt-1">
            <span className="flex items-center gap-1.5 text-rose-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              High ({metrics.priority_breakdown.High})
            </span>
            <span className="flex items-center gap-1.5 text-amber-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Medium ({metrics.priority_breakdown.Medium})
            </span>
            <span className="flex items-center gap-1.5 text-slate-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-slate-500"></span>
              Low ({metrics.priority_breakdown.Low})
            </span>
          </div>
        </div>
      )}

      {/* Main Content Grid: Recent Meetings & Urgent Action Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Meetings Card */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <Video className="w-4 h-4 text-indigo-400" />
                Recent Meetings
              </h2>
              <button
                onClick={() => setActiveTab('meetings')}
                className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentMeetings.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-slate-700/50 bg-slate-900/30 rounded-2xl flex flex-col items-center justify-center">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center mb-3">
                  <Video className="w-6 h-6 text-indigo-400" />
                </div>
                <p className="text-sm font-semibold text-slate-300 mb-1">No meetings yet</p>
                <p className="text-xs text-slate-500 mb-4 max-w-[200px]">Get started by creating your first meeting to unlock AI insights.</p>
                <button
                  onClick={onSeedData}
                  className="px-4 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold transition-all border border-indigo-500/30"
                >
                  Load Sample Data
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentMeetings.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => {
                      setSelectedMeetingId(m.id);
                      setActiveTab('meetings');
                    }}
                    className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-indigo-500/40 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div>
                      <h3 className="text-sm font-semibold text-slate-200">{m.title}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{m.date} • {m.participants || 'No participants listed'}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                        {m.open_action_items_count} Open Tasks
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Urgent Action Items */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-cyan-400" />
                Active Action Items
              </h2>
              <button
                onClick={() => setActiveTab('action-items')}
                className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                Central Action Tracker <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {urgentTasks.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-slate-700/50 bg-slate-900/30 rounded-2xl flex flex-col items-center justify-center">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-sm font-semibold text-slate-300 mb-1">All caught up!</p>
                <p className="text-xs text-slate-500 max-w-[200px]">There are no urgent or open action items pending.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {urgentTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <PriorityBadge priority={task.priority} />
                        <span className="text-xs text-slate-400 font-medium truncate">
                          Owner: <strong className="text-slate-200">{task.owner}</strong>
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 font-medium truncate">{task.task}</p>
                    </div>
                    <div className="shrink-0">
                      <StatusBadge
                        status={task.status}
                        editable={true}
                        onStatusChange={(newStatus) => handleStatusChange(task.id, newStatus)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
