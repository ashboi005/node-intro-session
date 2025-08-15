// JavaScript for Interactive Web Development Demo
// This file demonstrates various JavaScript concepts and features

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 JavaScript loaded and ready!');
    
    // Initialize all components
    initializeClock();
    initializeTheme();
    initializeTracking();
    setupEventListeners();
    
    // Set current year in footer
    document.getElementById('current-year').textContent = new Date().getFullYear();
});

// ==================== GLOBAL VARIABLES ====================
let clickCounter = 0;
let startTime = Date.now();
let currentFactIndex = 0;
let counterInterval = null;
let isCounterRunning = false;

// Fun facts array for rotation
const interestingFacts = [
    "JavaScript powers over 95% of all websites on the internet!",
    "JavaScript was created in just 10 days by Brendan Eich in 1995!",
    "Despite its name, JavaScript has nothing to do with Java programming language!",
    "JavaScript can run on servers, mobile apps, desktop applications, and even IoT devices!",
    "The first JavaScript engine was called 'SpiderMonkey' and it's still used in Firefox!",
    "JavaScript is the only programming language that runs natively in web browsers!",
    "Node.js allows JavaScript to run on servers, making full-stack JS development possible!",
    "JavaScript frameworks like React, Angular, and Vue power modern web applications!",
    "JavaScript can manipulate 3D graphics, create games, and even control robots!",
    "ES6 (ECMAScript 2015) introduced many modern JavaScript features we use today!"
];

// Quiz questions and answers
const quizQuestions = [
    {
        question: "What does JavaScript add to websites?",
        options: ["Structure", "Styling", "Interactivity", "All of the above"],
        correct: 2,
        explanation: "JavaScript primarily adds interactivity and dynamic behavior to websites!"
    },
    {
        question: "When was JavaScript created?",
        options: ["1990", "1995", "2000", "2005"],
        correct: 1,
        explanation: "JavaScript was created in 1995 by Brendan Eich at Netscape!"
    },
    {
        question: "What does DOM stand for?",
        options: ["Document Object Model", "Data Object Management", "Dynamic Output Method", "Digital Operations Manager"],
        correct: 0,
        explanation: "DOM stands for Document Object Model - it's how JavaScript interacts with HTML!"
    }
];

let currentQuestionIndex = 0;

// ==================== THEME MANAGEMENT ====================
function initializeTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const colorChange = document.getElementById('colorChange');
    
    // Load saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        toggleDarkMode();
    }
}

function toggleDarkMode() {
    const body = document.body;
    const themeToggle = document.getElementById('themeToggle');
    const root = document.documentElement;
    
    if (body.classList.contains('dark-mode')) {
        // Switch to light mode
        body.classList.remove('dark-mode');
        root.classList.remove('dark-theme');
        themeToggle.textContent = '🌙 Dark Mode';
        localStorage.setItem('theme', 'light');
        showNotification('☀️ Switched to Light Mode!');
    } else {
        // Switch to dark mode
        body.classList.add('dark-mode');
        root.classList.add('dark-theme');
        themeToggle.textContent = '☀️ Light Mode';
        localStorage.setItem('theme', 'dark');
        showNotification('🌙 Switched to Dark Mode!');
    }
    
    incrementClickCounter();
}

function changeColorScheme() {
    const root = document.documentElement;
    const colors = [
        { primary: '#4f46e5', secondary: '#06b6d4', accent: '#f59e0b' }, // Default
        { primary: '#dc2626', secondary: '#059669', accent: '#7c3aed' }, // Red-Green-Purple
        { primary: '#c2410c', secondary: '#0891b2', accent: '#be123c' }, // Orange-Cyan-Pink
        { primary: '#166534', secondary: '#7c2d12', accent: '#a21caf' }, // Green-Brown-Magenta
        { primary: '#1e40af', secondary: '#ea580c', accent: '#be185d' }  // Blue-Orange-Pink
    ];
    
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    root.style.setProperty('--primary-color', randomColor.primary);
    root.style.setProperty('--secondary-color', randomColor.secondary);
    root.style.setProperty('--accent-color', randomColor.accent);
    
    showNotification('🎨 Colors Changed!');
    incrementClickCounter();
}

// ==================== CLOCK FUNCTIONALITY ====================
function initializeClock() {
    updateClock();
    setInterval(updateClock, 1000); // Update every second
}

function updateClock() {
    const clockElement = document.getElementById('liveClock');
    const now = new Date();
    
    const timeString = now.toLocaleTimeString('en-US', {
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    const dateString = now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    clockElement.innerHTML = `
        <div style="font-size: 2rem; margin-bottom: 0.5rem;">${timeString}</div>
        <div style="font-size: 1rem; opacity: 0.8;">${dateString}</div>
    `;
}

// ==================== TRACKING FUNCTIONALITY ====================
function initializeTracking() {
    // Update time spent every second
    setInterval(updateTimeSpent, 1000);
}

function updateTimeSpent() {
    const timeSpentElement = document.getElementById('timeSpent');
    const currentTime = Date.now();
    const secondsSpent = Math.floor((currentTime - startTime) / 1000);
    timeSpentElement.textContent = secondsSpent;
}

function incrementClickCounter() {
    clickCounter++;
    const clickCountElement = document.getElementById('clickCount');
    clickCountElement.textContent = clickCounter;
    
    // Add bounce animation
    clickCountElement.parentElement.classList.add('bounce');
    setTimeout(() => {
        clickCountElement.parentElement.classList.remove('bounce');
    }, 500);
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    // Theme controls
    document.getElementById('themeToggle').addEventListener('click', toggleDarkMode);
    document.getElementById('colorChange').addEventListener('click', changeColorScheme);
    
    // Demo buttons
    document.getElementById('magicBtn').addEventListener('click', activateMagic);
    document.getElementById('animateBtn').addEventListener('click', animateElements);
    document.getElementById('counterBtn').addEventListener('click', toggleCounter);
    
    // Celebration button
    document.getElementById('celebrateBtn').addEventListener('click', celebrate);
    
    // Quiz next question
    setupQuizEventListeners();
}

function setupQuizEventListeners() {
    // This will be called after quiz buttons are created
}

// ==================== INTERACTIVE DEMO FUNCTIONS ====================
function activateMagic() {
    const magicBox = document.getElementById('magicBox');
    const magicText = document.getElementById('magicText');
    
    const magicalTexts = [
        "✨ JavaScript makes the web magical! ✨",
        "🎭 Watch elements transform before your eyes! 🎭",
        "🚀 JavaScript powers modern web experiences! 🚀",
        "🌟 Interactive websites are more engaging! 🌟",
        "🎨 Dynamic content keeps users interested! 🎨",
        "⚡ Real-time updates without page refreshes! ⚡"
    ];
    
    magicBox.classList.add('magical');
    magicText.textContent = magicalTexts[Math.floor(Math.random() * magicalTexts.length)];
    
    // Remove magical class after animation
    setTimeout(() => {
        magicBox.classList.remove('magical');
    }, 3000);
    
    incrementClickCounter();
    showNotification('✨ Magic activated!');
}

function animateElements() {
    // Animate various elements on the page
    const elementsToAnimate = [
        { selector: '.feature-card', animation: 'bounce' },
        { selector: '.pillar-item', animation: 'shake' },
        { selector: '.importance-item-js', animation: 'glow' },
        { selector: '.progress-item', animation: 'spin' }
    ];
    
    elementsToAnimate.forEach((item, index) => {
        setTimeout(() => {
            const elements = document.querySelectorAll(item.selector);
            elements.forEach(el => {
                el.classList.add(item.animation);
                setTimeout(() => {
                    el.classList.remove(item.animation);
                }, 1000);
            });
        }, index * 200);
    });
    
    incrementClickCounter();
    showNotification('🚀 Elements animated!');
}

function toggleCounter() {
    const counterBtn = document.getElementById('counterBtn');
    const counterDisplay = document.getElementById('counterDisplay');
    const counter = document.getElementById('counter');
    
    if (isCounterRunning) {
        // Stop counter
        clearInterval(counterInterval);
        counterBtn.textContent = '🔢 Start Counter';
        counterBtn.style.background = '#f59e0b';
        isCounterRunning = false;
        showNotification('⏸️ Counter stopped!');
    } else {
        // Start counter
        let count = 0;
        counterInterval = setInterval(() => {
            count++;
            counter.textContent = count;
            counterDisplay.classList.add('counting');
            setTimeout(() => {
                counterDisplay.classList.remove('counting');
            }, 200);
        }, 100);
        
        counterBtn.textContent = '⏹️ Stop Counter';
        counterBtn.style.background = '#ef4444';
        isCounterRunning = true;
        showNotification('▶️ Counter started!');
    }
    
    incrementClickCounter();
}

// ==================== CONTENT TOGGLE FUNCTIONS ====================
function toggleContent(id) {
    const element = document.getElementById(id);
    const isVisible = element.style.display !== 'none';
    
    if (isVisible) {
        element.style.display = 'none';
    } else {
        element.style.display = 'block';
    }
    
    incrementClickCounter();
    showNotification(isVisible ? '📖 Content hidden' : '📖 Content revealed');
}

// ==================== PILLAR DEMONSTRATION ====================
function highlightPillar(element, type) {
    // Remove active class from all pillars
    document.querySelectorAll('.pillar-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to clicked pillar
    element.classList.add('active');
    
    // Update description
    const descriptions = {
        html: "🏗️ <strong>HTML (Structure):</strong> HTML provides the foundation and structure. Every heading, paragraph, link, and section you see is defined by HTML elements. Without HTML, there would be no content to style or make interactive!",
        css: "🎨 <strong>CSS (Presentation):</strong> CSS transforms the plain HTML into a visually appealing experience. All the colors, fonts, layouts, animations, and responsive design you see are powered by CSS. It's what makes websites beautiful!",
        js: "⚡ <strong>JavaScript (Behavior):</strong> JavaScript brings everything to life! The buttons you click, the animations you see, the real-time clock, and all interactive features are powered by JavaScript. It makes websites dynamic and engaging!"
    };
    
    document.getElementById('pillarDescription').innerHTML = `<p>${descriptions[type]}</p>`;
    
    incrementClickCounter();
}

// ==================== COMPARISON FUNCTIONS ====================
function showComparison(type) {
    // Update button states
    document.querySelectorAll('.comparison-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    const result = document.getElementById('comparisonResult');
    
    if (type === 'static') {
        result.innerHTML = `
            <p>📄 <strong>Static Version:</strong> Just HTML and CSS - no clicks, no animations, no real-time updates. Content never changes after the page loads.</p>
            <p style="color: #6b7280; font-style: italic;">This is what websites were like in the early days of the web!</p>
        `;
        result.style.borderColor = '#9ca3af';
    } else {
        result.innerHTML = `
            <p>✨ <strong>Interactive Mode:</strong> You can click, hover, animate, and modify content in real-time!</p>
            <p style="color: #059669; font-style: italic;">This is the power of modern web development with JavaScript!</p>
        `;
        result.style.borderColor = '#06b6d4';
    }
    
    incrementClickCounter();
}

// ==================== FEATURE DEMONSTRATIONS ====================
function demoFeature(feature) {
    const demoArea = document.getElementById('featureDemo');
    const demonstrations = {
        dom: {
            title: "DOM Manipulation Demo",
            content: "Watch as JavaScript changes this text and style in real-time!",
            action: () => {
                demoArea.style.background = 'linear-gradient(45deg, #ff6b6b, #4ecdc4)';
                demoArea.style.color = 'white';
                demoArea.style.transform = 'scale(1.05)';
                setTimeout(() => {
                    demoArea.style.transform = 'scale(1)';
                }, 300);
            }
        },
        events: {
            title: "Event Handling Demo",
            content: "This text appeared because JavaScript detected your click event!",
            action: () => {
                demoArea.classList.add('glow');
                setTimeout(() => demoArea.classList.remove('glow'), 2000);
            }
        },
        timing: {
            title: "Timing Functions Demo",
            content: "JavaScript can schedule actions to happen after delays...",
            action: () => {
                let countdown = 3;
                const countdownTimer = setInterval(() => {
                    demoArea.innerHTML = `<h3>Timing Functions Demo</h3><p>Something will happen in ${countdown} seconds...</p>`;
                    countdown--;
                    if (countdown < 0) {
                        clearInterval(countdownTimer);
                        demoArea.innerHTML = `<h3>🎉 Surprise!</h3><p>JavaScript executed this action after a 3-second delay!</p>`;
                        demoArea.classList.add('bounce');
                        setTimeout(() => demoArea.classList.remove('bounce'), 500);
                    }
                }, 1000);
            }
        },
        animation: {
            title: "Animation Demo",
            content: "JavaScript can create smooth animations and transitions!",
            action: () => {
                demoArea.classList.add('spin');
                setTimeout(() => {
                    demoArea.classList.remove('spin');
                    demoArea.classList.add('bounce');
                    setTimeout(() => demoArea.classList.remove('bounce'), 500);
                }, 1000);
            }
        },
        data: {
            title: "Data Processing Demo",
            content: "",
            action: () => {
                const numbers = [15, 23, 8, 42, 16, 4];
                const sum = numbers.reduce((a, b) => a + b, 0);
                const average = (sum / numbers.length).toFixed(1);
                const max = Math.max(...numbers);
                
                demoArea.innerHTML = `
                    <h3>Data Processing Demo</h3>
                    <p><strong>Data:</strong> [${numbers.join(', ')}]</p>
                    <p><strong>Sum:</strong> ${sum}</p>
                    <p><strong>Average:</strong> ${average}</p>
                    <p><strong>Maximum:</strong> ${max}</p>
                    <p><em>JavaScript calculated these results instantly!</em></p>
                `;
            }
        },
        async: {
            title: "Real-time Updates Demo",
            content: "JavaScript can update content continuously without page refreshes!",
            action: () => {
                let updateCount = 0;
                const updateInterval = setInterval(() => {
                    updateCount++;
                    demoArea.innerHTML = `
                        <h3>Real-time Updates Demo</h3>
                        <p>This content has been updated <strong>${updateCount}</strong> times!</p>
                        <p>Current time: <strong>${new Date().toLocaleTimeString()}</strong></p>
                        <p><em>Updates every second without page refresh!</em></p>
                    `;
                    
                    if (updateCount >= 5) {
                        clearInterval(updateInterval);
                        demoArea.innerHTML += `<p style="color: #10b981;"><strong>Demo complete!</strong> This is how modern web apps work.</p>`;
                    }
                }, 1000);
            }
        }
    };
    
    const demo = demonstrations[feature];
    if (demo) {
        demoArea.innerHTML = `<h3>${demo.title}</h3><p>${demo.content}</p>`;
        demoArea.style.display = 'block';
        demo.action();
        
        incrementClickCounter();
    }
}

// ==================== CODE EXAMPLE RUNNER ====================
function runCodeExample() {
    const demoElement = document.getElementById('demo');
    
    // Simulate the code execution
    demoElement.style.backgroundColor = 'lightblue';
    demoElement.textContent = 'Color changed!';
    demoElement.style.transition = 'all 0.3s ease';
    demoElement.style.transform = 'scale(1.05)';
    
    setTimeout(() => {
        demoElement.style.transform = 'scale(1)';
    }, 300);
    
    incrementClickCounter();
    showNotification('▶️ Code executed successfully!');
}

// ==================== QUIZ FUNCTIONALITY ====================
function checkAnswer(selectedIndex) {
    const currentQ = quizQuestions[currentQuestionIndex];
    const buttons = document.querySelectorAll('.quiz-btn');
    const resultDiv = document.getElementById('quizResult');
    
    // Disable all buttons
    buttons.forEach(btn => btn.disabled = true);
    
    // Show correct/incorrect styling
    buttons.forEach((btn, index) => {
        if (index === currentQ.correct) {
            btn.classList.add('correct');
        } else if (index === selectedIndex && index !== currentQ.correct) {
            btn.classList.add('incorrect');
        }
    });
    
    // Show result
    if (selectedIndex === currentQ.correct) {
        resultDiv.innerHTML = `<p style="color: #10b981; font-weight: bold;">✅ Correct! ${currentQ.explanation}</p>`;
        showNotification('🎉 Correct answer!');
    } else {
        resultDiv.innerHTML = `<p style="color: #ef4444; font-weight: bold;">❌ Incorrect. ${currentQ.explanation}</p>`;
        showNotification('❌ Try again next time!');
    }
    
    // Show next question button
    setTimeout(() => {
        if (currentQuestionIndex < quizQuestions.length - 1) {
            resultDiv.innerHTML += '<br><button onclick="nextQuestion()" style="background: #4f46e5; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Next Question →</button>';
        } else {
            resultDiv.innerHTML += '<br><p style="color: #4f46e5; font-weight: bold;">🎓 Quiz completed! You\'ve learned about JavaScript!</p>';
        }
    }, 2000);
    
    incrementClickCounter();
}

function nextQuestion() {
    currentQuestionIndex++;
    const currentQ = quizQuestions[currentQuestionIndex];
    
    if (currentQ) {
        document.getElementById('quizQuestion').textContent = currentQ.question;
        
        const buttons = document.querySelectorAll('.quiz-btn');
        buttons.forEach((btn, index) => {
            btn.textContent = currentQ.options[index];
            btn.disabled = false;
            btn.className = 'quiz-btn'; // Reset classes
            btn.onclick = () => checkAnswer(index);
        });
        
        document.getElementById('quizResult').innerHTML = '';
    }
}

// ==================== ROTATING FACTS ====================
function nextFact() {
    currentFactIndex = (currentFactIndex + 1) % interestingFacts.length;
    const factElement = document.getElementById('rotatingFact');
    
    // Fade out
    factElement.style.opacity = '0';
    
    setTimeout(() => {
        factElement.textContent = interestingFacts[currentFactIndex];
        factElement.style.opacity = '1';
    }, 300);
    
    incrementClickCounter();
}

// ==================== CELEBRATION FUNCTION ====================
function celebrate() {
    const celebrationArea = document.getElementById('celebration');
    const emojis = ['🎉', '🎊', '✨', '🌟', '🎈', '🏆', '👏', '🎯', '🚀', '💫'];
    
    // Clear previous celebration
    celebrationArea.innerHTML = '';
    
    // Create floating emojis
    for (let i = 0; i < 20; i++) {
        setTimeout(() => {
            const emoji = document.createElement('div');
            emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            emoji.style.cssText = `
                position: absolute;
                font-size: 2rem;
                left: ${Math.random() * 100}%;
                animation: floatUp 3s ease-out forwards;
                pointer-events: none;
            `;
            
            celebrationArea.appendChild(emoji);
            
            setTimeout(() => {
                if (emoji.parentNode) {
                    emoji.parentNode.removeChild(emoji);
                }
            }, 3000);
        }, i * 100);
    }
    
    // Add congratulatory message
    setTimeout(() => {
        celebrationArea.innerHTML += `
            <div style="text-align: center; margin-top: 2rem;">
                <h3 style="color: #10b981;">🎓 Congratulations!</h3>
                <p>You've completed the interactive web development journey!</p>
            </div>
        `;
    }, 2000);
    
    incrementClickCounter();
    showNotification('🎉 Celebration started!');
}

// Add CSS animation for floating emojis
const style = document.createElement('style');
style.textContent = `
    @keyframes floatUp {
        0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
        }
        100% {
            transform: translateY(-200px) rotate(360deg);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ==================== NOTIFICATION SYSTEM ====================
function showNotification(message) {
    // Remove existing notification
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create new notification
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #4f46e5, #06b6d4);
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease-out forwards';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }, 3000);
}

// Add notification animations
const notificationStyle = document.createElement('style');
notificationStyle.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(notificationStyle);

// ==================== CONSOLE MESSAGES ====================
console.log(`
🎯 Welcome to the Interactive JavaScript Demo!
📚 This page demonstrates various JavaScript concepts:

✨ DOM Manipulation - Changing content and styles
🎭 Event Handling - Responding to user interactions  
⏰ Timing Functions - Delays and intervals
🎬 Animations - CSS animations controlled by JS
📊 Data Processing - Calculations and transformations
🔄 Real-time Updates - Dynamic content without page reloads
🎨 Theme Management - Dark/light mode switching
📝 Local Storage - Remembering user preferences
🎮 Interactive Elements - Quizzes, demos, and games

Try clicking around and exploring all the interactive features!
Every click is tracked, and you can see your engagement stats in the footer.

Happy coding! 🚀
`);

// ==================== EASTER EGGS ====================
// Konami code easter egg
let konamiCode = [];
const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];

document.addEventListener('keydown', function(e) {
    konamiCode.push(e.code);
    if (konamiCode.length > konamiSequence.length) {
        konamiCode.shift();
    }
    
    if (konamiCode.join('') === konamiSequence.join('')) {
        showNotification('🎮 Konami Code activated! You found the easter egg!');
        celebrate();
        konamiCode = []; // Reset
    }
});

// Console easter egg
console.log('🕵️ Psst! Try typing the Konami code: ↑↑↓↓←→←→BA');

// ==================== EXPORT FOR TESTING ====================
// Make functions available globally for HTML onclick attributes
window.toggleContent = toggleContent;
window.highlightPillar = highlightPillar;
window.showComparison = showComparison;
window.demoFeature = demoFeature;
window.runCodeExample = runCodeExample;
window.checkAnswer = checkAnswer;
window.nextQuestion = nextQuestion;
window.nextFact = nextFact;
window.celebrate = celebrate;
