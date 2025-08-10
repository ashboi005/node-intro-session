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
        const feedbackObj = {
            id: Date.now(),
            name,
            feedback,
            timestamp: new Date()
        };
        
        this.feedbacks.unshift(feedbackObj);
        this.renderFeedbacks();
    }

    renderFeedbacks() {
        this.container.innerHTML = this.feedbacks.map(item => `
            <div class="feedback-item">
                <strong>${this.escapeHtml(item.name)}:</strong>
                <p>${this.escapeHtml(item.feedback)}</p>
                <small>Just now</small>
            </div>
        `).join('');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FeedbackApp();
}); 