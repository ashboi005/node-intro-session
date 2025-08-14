'use client';

import { useState, useEffect } from 'react';
import { PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Feedback {
  id: number;
  name: string;
  message: string;
  isFlagged: boolean;
  flaggedReason: string | null;
  createdAt: string;
  canEdit?: boolean;
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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [currentView, setCurrentView] = useState<'main' | 'flagged'>('main');
  const [userToken, setUserToken] = useState<string>('');

  // Generate or retrieve user token on mount
  useEffect(() => {
    let token = localStorage.getItem('feedbackUserToken');
    if (!token) {
      token = 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      localStorage.setItem('feedbackUserToken', token);
    }
    setUserToken(token);
  }, []);

  useEffect(() => {
    if (userToken) {
      fetchFeedbacks();
      const interval = setInterval(fetchFeedbacks, 10000); // simple polling
      return () => clearInterval(interval);
    }
  }, [currentView, userToken]);

  const fetchFeedbacks = async () => {
    try {
      const endpoint = currentView === 'flagged' 
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/feedback/flagged`
        : `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/feedback`;
      const response = await fetch(endpoint, {
        headers: {
          'user-token': userToken
        }
      });
      const result: ApiResponse<{feedbacks: Feedback[]}> = await response.json();
      if (result.success && result.data) { setFeedbacks(result.data.feedbacks); }
    } catch (error) { showNotification('error', 'Failed to load feedbacks'); }
  };

  const submitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const body = { name: name.trim(), message: message.trim(), anonymous, userToken };
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

  const startEdit = (feedback: Feedback) => {
    setEditingId(feedback.id);
    setEditName(feedback.name);
    setEditMessage(feedback.message);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditMessage('');
  };

  const updateFeedback = async (id: number) => {
    setLoading(true);
    try {
      const body = { name: editName.trim(), message: editMessage.trim(), userToken };
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/feedback/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
      const result: ApiResponse<Feedback> = await response.json();
      if (result.success && result.data) {
        setFeedbacks(prev => prev.map(f => f.id === id ? result.data as Feedback : f));
        cancelEdit();
        showNotification('success', 'Feedback updated successfully!');
      } else { showNotification('error', result.error || 'Failed to update feedback'); }
    } catch (error) { showNotification('error', 'Network error. Please try again.'); }
    setLoading(false);
  };

  const deleteFeedback = async (id: number) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return;
    
    setLoading(true);
    try {
      const body = { userToken };
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/feedback/${id}`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
      const result: ApiResponse = await response.json();
      if (result.success) {
        setFeedbacks(prev => prev.filter(f => f.id !== id));
        showNotification('success', 'Feedback deleted successfully!');
      } else { showNotification('error', result.error || 'Failed to delete feedback'); }
    } catch (error) { showNotification('error', 'Network error. Please try again.'); }
    setLoading(false);
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
              <p className="text-sm text-slate-500">Share your thoughts. Flagged feedback is filtered by content moderation.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">Full Stack</span>
              <div className="flex bg-slate-100 rounded-lg p-1">
                <button 
                  onClick={() => setCurrentView('main')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    currentView === 'main' 
                      ? 'bg-white text-slate-900 shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Main Feed
                </button>
                <button 
                  onClick={() => setCurrentView('flagged')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    currentView === 'flagged' 
                      ? 'bg-white text-slate-900 shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Flagged ({flaggedFeedbacks.length})
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-4">
          {currentView === 'main' ? (
            <>
              <form onSubmit={submitFeedback} className="space-y-4 -mt-2">
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

              <div className="flex items-center justify-between pt-4">
                <h3 className="text-base font-semibold text-slate-900">Recent Feedback</h3>
                <button onClick={() => setShowFlagged(v => !v)} className="text-sm text-indigo-600 hover:text-indigo-500">
                  {showFlagged ? 'Hide flagged' : `Show flagged (${flaggedFeedbacks.length})`}
                </button>
              </div>

              <div className="space-y-3">
                {regularFeedbacks.map(item => (
                  <div key={item.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    {editingId === item.id ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                          <input 
                            value={editName} 
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                          <textarea 
                            value={editMessage} 
                            onChange={(e) => setEditMessage(e.target.value)}
                            rows={3}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => updateFeedback(item.id)}
                            disabled={loading}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-500 disabled:opacity-50"
                          >
                            <CheckIcon className="w-4 h-4" />
                            Save
                          </button>
                          <button 
                            onClick={cancelEdit}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-500"
                          >
                            <XMarkIcon className="w-4 h-4" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-slate-900">{item.name}</div>
                            <p className="text-slate-700 mt-1">{item.message}</p>
                            <div className="text-xs text-slate-500 mt-2">{new Date(item.createdAt).toLocaleString()}</div>
                          </div>
                          <div className="flex gap-1 ml-2">
                            <button 
                              onClick={() => startEdit(item)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit feedback"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => deleteFeedback(item.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete feedback"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
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
                      {editingId === item.id ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                            <input 
                              value={editName} 
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                            <textarea 
                              value={editMessage} 
                              onChange={(e) => setEditMessage(e.target.value)}
                              rows={3}
                              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => updateFeedback(item.id)}
                              disabled={loading}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-500 disabled:opacity-50"
                            >
                              <CheckIcon className="w-4 h-4" />
                              Save
                            </button>
                            <button 
                              onClick={cancelEdit}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-500"
                            >
                              <XMarkIcon className="w-4 h-4" />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="text-sm font-medium text-slate-900">{item.name}</div>
                              <p className="text-slate-700 mt-1">{item.message}</p>
                              <div className="text-xs text-slate-500 mt-2">
                                {new Date(item.createdAt).toLocaleString()} • {item.flaggedReason || 'Flagged'}
                              </div>
                            </div>
                            <div className="flex gap-1 ml-2">
                              <button 
                                onClick={() => startEdit(item)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="Edit feedback"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => deleteFeedback(item.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete feedback"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  {flaggedFeedbacks.length === 0 && (
                    <div className="text-sm text-slate-500">No flagged feedback.</div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">Flagged Content Management</h3>
                <div className="text-sm text-slate-500">{feedbacks.length} flagged items</div>
              </div>

              <div className="space-y-3">
                {feedbacks.map(item => (
                  <div key={item.id} className="bg-rose-50 rounded-lg p-4 border border-rose-200">
                    {editingId === item.id ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                          <input 
                            value={editName} 
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                          <textarea 
                            value={editMessage} 
                            onChange={(e) => setEditMessage(e.target.value)}
                            rows={3}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => updateFeedback(item.id)}
                            disabled={loading}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-500 disabled:opacity-50"
                          >
                            <CheckIcon className="w-4 h-4" />
                            Save
                          </button>
                          <button 
                            onClick={cancelEdit}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-500"
                          >
                            <XMarkIcon className="w-4 h-4" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="text-sm font-medium text-slate-900">{item.name}</div>
                              <span className="text-xs px-2 py-1 bg-rose-100 text-rose-700 rounded-full">
                                Flagged
                              </span>
                            </div>
                            <p className="text-slate-700 mt-1">{item.message}</p>
                            <div className="text-xs text-slate-500 mt-2">
                              {new Date(item.createdAt).toLocaleString()}
                            </div>
                            <div className="text-xs text-rose-600 mt-1 font-medium">
                              Reason: {item.flaggedReason || 'Flagged by moderation'}
                            </div>
                          </div>
                          <div className="flex gap-1 ml-2">
                            <button 
                              onClick={() => startEdit(item)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit to remove flag"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => deleteFeedback(item.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete feedback"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {feedbacks.length === 0 && (
                  <div className="text-sm text-slate-500">No flagged feedback.</div>
                )}
              </div>
            </>
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