class FeedbackApp {
  constructor() {
    this.feedbacks = [];
    this.form = document.getElementById('feedback-form');
    this.container = document.getElementById('feedback-container');
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    this.form.addEventListener('submit', this.handleSubmit.bind(this));
  }

  async handleSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const feedback = document.getElementById('feedback').value.trim();
    if (!name || !feedback) return;

    this.addFeedback(name, feedback);
    this.form.reset();
  }

  addFeedback(name, feedback) {
    const feedbackObj = { id: Date.now(), name, feedback, timestamp: new Date().toISOString() };
    this.feedbacks.unshift(feedbackObj);
    this.renderFeedbacks();
  }

  renderFeedbacks() {
    this.container.innerHTML = this.feedbacks.map(item => `
      <div class="feedback-item" data-id="${item.id}">
        <div class="item-content">
          <strong>${this.escapeHtml(item.name)}:</strong>
          <p>${this.escapeHtml(item.feedback)}</p>
          <small>${new Date(item.timestamp).toLocaleString()}</small>
        </div>
        <div class="item-actions">
          <button class="btn-secondary" data-action="edit">Edit</button>
          <button class="btn-danger" data-action="delete">Delete</button>
        </div>
      </div>
    `).join('');
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  delay(ms) { return new Promise(r => setTimeout(r, ms)); }
}

class PersistentFeedbackApp extends FeedbackApp {
  constructor() {
    super();
    this.exportBtn = document.getElementById('export-btn');
    this.clearBtn = document.getElementById('clear-btn');
    this.container.addEventListener('click', this.handleItemAction.bind(this));
    this.clearBtn.addEventListener('click', this.clearAllData.bind(this));
    this.loadFromStorage();
  }

  addFeedback(name, feedback) {
    super.addFeedback(name, feedback);
    this.saveToStorage();
  }

  handleItemAction(e) {
    const actionBtn = e.target.closest('button[data-action]');
    if (!actionBtn) return;
    const action = actionBtn.getAttribute('data-action');
    const itemEl = actionBtn.closest('.feedback-item');
    const id = Number(itemEl.getAttribute('data-id'));

    if (action === 'delete') {
      this.deleteFeedback(id);
    } else if (action === 'edit') {
      this.editFeedback(id);
    }
  }

  deleteFeedback(id) {
    if (!confirm('Delete this feedback?')) return;
    this.feedbacks = this.feedbacks.filter(f => f.id !== id);
    this.saveToStorage();
    this.renderFeedbacks();
  }

  editFeedback(id) {
    const target = this.feedbacks.find(f => f.id === id);
    if (!target) return;
    const newMessage = prompt('Edit feedback message:', target.feedback);
    if (newMessage === null) return;
    const trimmed = newMessage.trim();
    if (!trimmed) return alert('Message cannot be empty.');
    target.feedback = trimmed;
    this.saveToStorage();
    this.renderFeedbacks();
  }

  saveToStorage() {
    localStorage.setItem('feedbackData', JSON.stringify(this.feedbacks));
  }

  loadFromStorage() {
    const stored = localStorage.getItem('feedbackData');
    if (stored) {
      try {
        this.feedbacks = JSON.parse(stored);
        this.renderFeedbacks();
      } catch (_) { this.feedbacks = []; }
    }
  }

  clearAllData() {
    if (confirm('Are you sure you want to clear all feedback?')) {
      this.feedbacks = [];
      this.saveToStorage();
      this.renderFeedbacks();
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new PersistentFeedbackApp();
}); 