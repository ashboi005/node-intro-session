'use client';

import { useState, useEffect } from 'react';

interface Feedback {
  id: number;
  name: string;
  message: string;
  isFlagged: boolean;
  flaggedReason: string | null;
  createdAt: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export default function FeedbackApp() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showFlagged, setShowFlagged] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  useEffect(() => {
    fetchFeedbacks();
    const interval = setInterval(fetchFeedbacks, 10000); // simple polling
    return () => clearInterval(interval);
  }, []);

  const fetchFeedbacks = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/feedback`);
      const result: ApiResponse<{feedbacks: Feedback[]}> = await response.json();
      if (result.success && result.data) { setFeedbacks(result.data.feedbacks); }
    } catch (error) { showNotification('error', 'Failed to load feedbacks'); }
  };

  const submitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const body = { name: name.trim(), message: message.trim(), anonymous };
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/feedback`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
      const result: ApiResponse<Feedback> = await response.json();
      if (result.success && result.data) {
        setName(''); setMessage(''); setAnonymous(false);
        setFeedbacks(prev => [result.data as Feedback, ...prev]);
        showNotification('success', 'Feedback submitted successfully!');
      } else { showNotification('error', result.error || 'Failed to submit feedback'); }
    } catch (error) { showNotification('error', 'Network error. Please try again.'); }
    setLoading(false);
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const regularFeedbacks = feedbacks.filter(f => !f.isFlagged);
  const flaggedFeedbacks = feedbacks.filter(f => f.isFlagged);

  return (
    <div className="min-h-screen p-6 bg-[color:var(--background)]">
      <div className="max-w-2xl mx-auto bg-white/80 backdrop-blur border border-slate-200 rounded-2xl shadow-sm">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Anonymous Feedback</h1>
              <p className="text-sm text-slate-500">Share your thoughts. Flagged feedback is hidden by default.</p>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">Full Stack</span>
          </div>
        </div>

        <form onSubmit={submitFeedback} className="p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Your Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} disabled={anonymous}
                     placeholder={anonymous ? 'Anonymous' : 'Enter your name'}
                     className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <label className="mt-6 shrink-0 inline-flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)}
                     className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              Submit anonymously
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Your Feedback</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} required rows={4}
                      placeholder="Write your feedback here..."
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>

          <button type="submit" disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 text-white font-medium py-2.5 hover:bg-indigo-500 transition focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60">
            {loading ? 'Submitting…' : 'Submit Feedback'}
          </button>
        </form>

        <div className="px-6 pb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">Recent Feedback</h3>
            <button onClick={() => setShowFlagged(v => !v)} className="text-sm text-indigo-600 hover:text-indigo-500">
              {showFlagged ? 'Hide flagged' : `Show flagged (${flaggedFeedbacks.length})`}
            </button>
          </div>

          <div className="space-y-3">
            {regularFeedbacks.map(item => (
              <div key={item.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="text-sm font-medium text-slate-900">{item.name}</div>
                <p className="text-slate-700 mt-1">{item.message}</p>
                <div className="text-xs text-slate-500 mt-2">{new Date(item.createdAt).toLocaleString()}</div>
              </div>
            ))}
            {regularFeedbacks.length === 0 && (
              <div className="text-sm text-slate-500">No feedback yet.</div>
            )}
          </div>

          {showFlagged && (
            <div className="mt-4 space-y-3">
              <div className="text-sm font-medium text-slate-900">Flagged (hidden by default)</div>
              {flaggedFeedbacks.map(item => (
                <div key={item.id} className="bg-white rounded-lg p-4 border border-rose-200">
                  <div className="text-sm font-medium text-slate-900">{item.name}</div>
                  <p className="text-slate-700 mt-1">{item.message}</p>
                  <div className="text-xs text-slate-500 mt-2">
                    {new Date(item.createdAt).toLocaleString()} • {item.flaggedReason || 'Flagged'}
                  </div>
                </div>
              ))}
              {flaggedFeedbacks.length === 0 && (
                <div className="text-sm text-slate-500">No flagged feedback.</div>
              )}
            </div>
          )}
        </div>
      </div>

      {notification && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg shadow-md text-white ${notification.type === 'success' ? 'bg-green-600' : 'bg-rose-600'}`}>
          {notification.message}
        </div>
      )}
    </div>
  );
} 