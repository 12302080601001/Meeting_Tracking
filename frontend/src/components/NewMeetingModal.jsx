import React, { useState, useRef } from 'react';
import { X, Sparkles, FileText, Loader2, Play, Mic, UploadCloud } from 'lucide-react';
import { createMeeting, createAudioMeeting } from '../api/client';

const SAMPLE_TRANSCRIPTS = [
  {
    title: "Engineering Sprint & Architecture Sync",
    participants: "Alex Rivera (Tech Lead), Sarah Chen (Product Manager), Marcus Vance (Backend Lead)",
    transcript: `Sarah: Welcome team. We need to align on our Q3 release goals.\nAlex: We decided to adopt Python FastAPI with SQLite for local execution.\nMarcus: What about AI structured extraction?\nAlex: We agreed to use google-genai SDK with Gemini 2.5 Flash. We enforce Pydantic response_schema to guarantee valid JSON.\nSarah: Perfect.\nAction item: Marcus will write database models and router endpoints by Wednesday. Priority: High.\nAction item: Alex will setup Gemini GenAI Pydantic SDK handler by Thursday. Priority: High.\nAction item: Sarah will prepare sprint launch presentation by Friday. Priority: Medium.`
  },
  {
    title: "UI/UX & Central Tracker Review",
    participants: "David Kim (UX Designer), Elena Rostova (Frontend Lead), Sarah Chen (Product Manager)",
    transcript: `David: I've prepared UI mockups for our Central Action Tracker and Dashboard.\nElena: Looks clean! Can we filter tasks by owner, status, and priority with inline status editing?\nDavid: Yes, inline status dropdowns will allow updating task status from Open to In Progress or Completed directly in the table.\nSarah: Great! Decision: We adopt dark glassmorphism layout across all views.\nAction item: Elena will build inline status table component by Thursday. Priority: High. Assigned to Elena.\nAction item: David will export SVG icons and theme tokens by Tuesday. Priority: Medium. Assigned to David.`
  }
];

export default function NewMeetingModal({ isOpen, onClose, onSuccess }) {
  const [activeTab, setActiveTab] = useState('text'); // 'text' | 'audio'
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [participants, setParticipants] = useState('');
  const [transcript, setTranscript] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleSelectSample = (sample) => {
    setActiveTab('text');
    setTitle(sample.title);
    setParticipants(sample.participants);
    setTranscript(sample.transcript);
    setAudioFile(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAudioFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Meeting title is required.');
      return;
    }

    if (activeTab === 'text' && !transcript.trim()) {
      setError('Meeting transcript is required in Text mode.');
      return;
    }

    if (activeTab === 'audio' && !audioFile) {
      setError('Please select an audio file.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let res;
      if (activeTab === 'text') {
        res = await createMeeting({
          title: title.trim(),
          date,
          participants: participants.trim(),
          transcript: transcript.trim()
        });
      } else {
        const formData = new FormData();
        formData.append('audio', audioFile);
        formData.append('title', title.trim());
        formData.append('date', date);
        formData.append('participants', participants.trim());
        res = await createAudioMeeting(formData);
      }
      
      setLoading(false);
      onSuccess(res);
      
      // Reset form
      setTitle('');
      setParticipants('');
      setTranscript('');
      setAudioFile(null);
      setActiveTab('text');
      onClose();
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Failed to process with Gemini AI.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Create & Analyze Meeting</h3>
              <p className="text-xs text-slate-400">Extract insights using Google Gemini 2.5</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Mode Tabs */}
        <div className="flex gap-1 p-2 bg-slate-950 border-b border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'text' ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" /> Text Transcript
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audio')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'audio' ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic className="w-4 h-4" /> Audio Upload
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          )}

          {/* Quick Preset Selector */}
          {activeTab === 'text' && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                Quick Demo Presets:
              </label>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_TRANSCRIPTS.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSample(s)}
                    className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:border-indigo-500/50 hover:bg-indigo-500/5 text-xs text-slate-300 transition-all flex items-center gap-1.5"
                  >
                    <Play className="w-3 h-3 text-indigo-400 fill-indigo-400" />
                    {s.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">Meeting Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Q3 Architecture Sync"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Meeting Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Participants</label>
            <input
              type="text"
              placeholder="e.g. Alex Rivera, Sarah Chen, Marcus Vance"
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {activeTab === 'text' ? (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Raw Meeting Transcript *</label>
              <textarea
                required
                rows={8}
                placeholder="Paste raw conversation notes or meeting transcript here..."
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500 font-mono text-xs leading-relaxed"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Audio File Recording (.mp3, .wav, .m4a) *</label>
              <div 
                className="w-full p-8 border-2 border-dashed border-slate-800 rounded-xl bg-slate-950 text-center flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file"
                  className="hidden"
                  ref={fileInputRef}
                  accept="audio/*,video/webm"
                  onChange={handleFileChange}
                />
                <UploadCloud className="w-10 h-10 text-indigo-400 mb-2" />
                {audioFile ? (
                  <>
                    <p className="text-sm font-semibold text-slate-200">{audioFile.name}</p>
                    <p className="text-xs text-slate-500">{(audioFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-slate-300">Click to upload audio</p>
                    <p className="text-xs text-slate-500 mt-1">Accepts .mp3, .wav, .m4a, .ogg up to ~10MB</p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <p className="text-[11px] text-slate-400">
              {activeTab === 'audio' 
                ? "Audio will be transcribed and summarized by Gemini multimodal."
                : "Gemini model will extract Summary, Decisions & Action Items."}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing {activeTab === 'audio' ? 'Audio' : 'AI'}...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Process {activeTab === 'audio' ? 'Audio' : 'Transcript'}
                  </>
                )}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
