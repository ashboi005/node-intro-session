'use client';

import { useState, useEffect, useCallback } from 'react';
import { PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { usePusher } from './hooks/usePusher';

interface Feedback {
  id: number;
  name: string;
  message: string;
  isFlagged: boolean;
  flaggedReason: string | null;
  createdAt: string;
  canEdit?: boolean;
}

interface ApiResponse<T = unknown> {
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
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editMessage, setEditMessage] = useState('');
  
  // Initialize Pusher
  const pusher = usePusher();
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
    }
  }, [currentView, userToken]);

  // Pusher real-time event listeners
  useEffect(() => {
    if (!pusher || !userToken) return;

    const channel = pusher.subscribe('feedback-channel');

    // Listen for new feedback
    channel.bind('new-feedback', (data: Feedback) => {
      setFeedbacks(prev => [data, ...prev]);
      showNotification('success', 'New feedback received!');
    });

    // Listen for updated feedback
    channel.bind('updated-feedback', (data: Feedback) => {
      setFeedbacks(prev => prev.map(f => f.id === data.id ? data : f));
      showNotification('success', 'Feedback updated!');
    });

    // Listen for deleted feedback
    channel.bind('deleted-feedback', (data: { id: number }) => {
      setFeedbacks(prev => prev.filter(f => f.id !== data.id));
      showNotification('success', 'Feedback deleted!');
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe('feedback-channel');
    };
  }, [pusher, userToken]);

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
        showNotification('success', 'Feedback submitted successfully!');
      } else { showNotification('error', result.error || 'Failed to submit feedback'); }
    } catch {
      showNotification('error', 'Network error. Please try again.');
    }
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
        cancelEdit();
        showNotification('success', 'Feedback updated successfully!');
      } else { showNotification('error', result.error || 'Failed to update feedback'); }
    } catch {
      showNotification('error', 'Network error. Please try again.');
    }
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
        showNotification('success', 'Feedback deleted successfully!');
      } else { showNotification('error', result.error || 'Failed to delete feedback'); }
    } catch {
      showNotification('error', 'Network error. Please try again.');
    }
    setLoading(false);
  };

  const regularFeedbacks = feedbacks.filter(f => !f.isFlagged);
  const flaggedFeedbacks = feedbacks.filter(f => f.isFlagged);

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-2"> <span className='text-red-600'>CESS</span> X <span className='text-blue-600'>Node</span> Live Workshop Feedback</h1>
          <p className="text-slate-600">What do you think about the Workshop? How's it going?</p>
        </div>

        {/* Navigation */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex bg-white rounded-xl p-1 shadow-sm border border-slate-200">
            <button 
              onClick={() => setCurrentView('main')}
              className={`px-6 py-2 text-sm font-medium rounded-lg transition-all ${
                currentView === 'main' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Main Feed
              {currentView === 'main' && ` (${regularFeedbacks.length})`}
            </button>
            <button 
              onClick={() => setCurrentView('flagged')}
              className={`px-6 py-2 text-sm font-medium rounded-lg transition-all ${
                currentView === 'flagged' 
                  ? 'bg-red-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Flagged
              {flaggedFeedbacks.length > 0 && ` (${flaggedFeedbacks.length})`}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 space-y-6">
            {currentView === 'main' ? (
              <>
                {/* Submission Form */}
                <form onSubmit={submitFeedback} className="space-y-4 border-b border-slate-100 pb-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Your Name</label>
                      <input 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        disabled={anonymous}
                        placeholder={anonymous ? 'Anonymous' : 'Enter your name'}
                        className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-50" 
                      />
                    </div>
                    <label className="mt-8 shrink-0 inline-flex items-center gap-3 text-sm text-slate-700">
                      <input 
                        type="checkbox" 
                        checked={anonymous} 
                        onChange={(e) => setAnonymous(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                      />
                      Submit anonymously
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Your Feedback</label>
                    <textarea 
                      value={message} 
                      onChange={(e) => setMessage(e.target.value)} 
                      required 
                      rows={4}
                      placeholder="Write your feedback here..."
                      className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 text-white font-medium py-3 hover:bg-indigo-500 transition focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                  >
                    {loading ? 'Submitting…' : 'Submit Feedback'}
                  </button>
                </form>

                {/* Recent Feedback Section */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Feedback</h3>
                  <div className="space-y-3">
                    {regularFeedbacks.map(item => (
                      <div key={item.id} className="bg-slate-50 rounded-xl p-5 border border-slate-200 hover:border-slate-300 transition-colors">
                        {editingId === item.id ? (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                              <input 
                                value={editName} 
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
                              <textarea 
                                value={editMessage} 
                                onChange={(e) => setEditMessage(e.target.value)}
                                rows={3}
                                className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              />
                            </div>
                            <div className="flex gap-3">
                              <button 
                                onClick={() => updateFeedback(item.id)}
                                disabled={loading}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-500 disabled:opacity-50 transition-colors"
                              >
                                <CheckIcon className="w-4 h-4" />
                                Save Changes
                              </button>
                              <button 
                                onClick={cancelEdit}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-600 text-white text-sm font-medium rounded-lg hover:bg-slate-500 transition-colors"
                              >
                                <XMarkIcon className="w-4 h-4" />
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-semibold text-slate-900">{item.name}</span>
                                <span className="text-xs text-slate-500">•</span>
                                <span className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</span>
                              </div>
                              <p className="text-slate-700 leading-relaxed">{item.message}</p>
                            </div>
                            {item.canEdit && (
                              <div className="flex gap-1 ml-4">
                                <button 
                                  onClick={() => startEdit(item)}
                                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                  title="Edit your feedback"
                                >
                                  <PencilIcon className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => deleteFeedback(item.id)}
                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete your feedback"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    {regularFeedbacks.length === 0 && (
                      <div className="text-center py-8 text-slate-500">
                        <p>No feedback yet. Be the first to share your thoughts!</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              /* Flagged Content View */
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Flagged Content</h3>
                <div className="space-y-3">
                  {flaggedFeedbacks.map(item => (
                    <div key={item.id} className="bg-red-50 rounded-xl p-5 border border-red-200">
                      {editingId === item.id ? (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                            <input 
                              value={editName} 
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
                            <textarea 
                              value={editMessage} 
                              onChange={(e) => setEditMessage(e.target.value)}
                              rows={3}
                              className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>
                          <div className="flex gap-3">
                            <button 
                              onClick={() => updateFeedback(item.id)}
                              disabled={loading}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-500 disabled:opacity-50 transition-colors"
                            >
                              <CheckIcon className="w-4 h-4" />
                              Save Changes
                            </button>
                            <button 
                              onClick={cancelEdit}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-600 text-white text-sm font-medium rounded-lg hover:bg-slate-500 transition-colors"
                            >
                              <XMarkIcon className="w-4 h-4" />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-sm font-semibold text-slate-900">{item.name}</span>
                              <span className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded-full font-medium">
                                Flagged
                              </span>
                            </div>
                            <p className="text-slate-700 leading-relaxed mb-3">{item.message}</p>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <span>{new Date(item.createdAt).toLocaleString()}</span>
                              <span>•</span>
                              <span className="text-red-600 font-medium">
                                Reason: {item.flaggedReason || 'Flagged by moderation'}
                              </span>
                            </div>
                          </div>
                          {item.canEdit && (
                            <div className="flex gap-1 ml-4">
                              <button 
                                onClick={() => startEdit(item)}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="Edit your feedback"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => deleteFeedback(item.id)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete your feedback"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {flaggedFeedbacks.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      <p>No flagged content found.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg text-white font-medium transition-all z-50 ${
            notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}>
            {notification.message}
          </div>
        )}
      </div>
         <footer className="mt-12 text-center text-sm text-slate-500">
            <p>&copy; {new Date().getFullYear()} <a href="https://www.instagram.com/node.hesh?igsh=M3JxYzBoNHJ3OHlj" className='underline hover:text-cyan-500'>Node</a> | All Rights Reserved.</p>
        </footer>
    </div>
  );
} 