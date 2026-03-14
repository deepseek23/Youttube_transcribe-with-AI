// Config
const API_BASE_URL = "http://127.0.0.1:8000"; // Ensure your FastAPI has CORS enabled

// DOM Elements
const videoUrlInput = document.getElementById('video-url');
const loadBtn = document.getElementById('load-btn');
const loadBtnText = loadBtn.querySelector('.btn-text');
const loadBtnLoader = loadBtn.querySelector('.loader');
const statusMessage = document.getElementById('status-message');
const statusText = statusMessage.querySelector('.status-text');

const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const chatHistory = document.getElementById('chat-history');

const connectionDot = document.getElementById('connection-dot');
const connectionText = document.getElementById('connection-text');

let isVideoLoaded = false;

// Event Listeners
loadBtn.addEventListener('click', handleLoadVideo);
chatForm.addEventListener('submit', handleSendMessage);

/**
 * Handle loading the video via the backend
 */
async function handleLoadVideo() {
    const url = videoUrlInput.value.trim();

    if (!url) {
        showStatus('Please enter a valid YouTube URL', 'error');
        return;
    }

    // Set Loading State
    setLoadState(true);
    showStatus('Fetching transcript & generating vector store. This might take a moment...', '');

    try {
        const response = await fetch(`${API_BASE_URL}/load_video`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url: url })
        });

        const data = await response.json();

        if (response.ok) {
            showStatus('Video loaded successfully! You can now chat.', 'success');
            isVideoLoaded = true;
            enableChat();

            // Clear prior chat (except system msg)
            chatHistory.innerHTML = '';
            appendMessage('system', `Connected to video. Ask anything about the transcript!`);
        } else {
            showStatus(`Error: ${data.detail || 'Failed to load video'}`, 'error');
            disableChat();
        }
    } catch (error) {
        console.error('Network Error:', error);
        showStatus('Connection failed. Make sure your FastAPI server is running with CORS enabled.', 'error');
        disableChat();
    } finally {
        setLoadState(false);
    }
}

/**
 * Handle sending a chat message to the backend
 */
async function handleSendMessage(e) {
    e.preventDefault();

    if (!isVideoLoaded) return;

    const question = chatInput.value.trim();
    if (!question) return;

    // UI Update: User Message
    appendMessage('user', question);
    chatInput.value = '';

    // UI Update: Assistant Loading Message
    const loadingId = appendMessage('assistant', '<span class="loader" style="display:inline-block; border-top-color:var(--text-primary); width: 14px; height: 14px; margin-right: 6px; vertical-align: middle;"></span> Thinking...', true);

    setChatState(false); // disable input while generating

    try {
        const response = await fetch(`${API_BASE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ question: question })
        });

        const data = await response.json();

        // Remove loading state message
        document.getElementById(loadingId).remove();

        if (response.ok) {
            const htmlAnswer = typeof marked !== 'undefined' ? marked.parse(data.answer) : data.answer;
            appendMessage('assistant', htmlAnswer, typeof marked !== 'undefined');
        } else {
            appendMessage('assistant', `⚠️ Error: ${data.detail || 'Failed to get an answer'}`);
        }
    } catch (error) {
        console.error('Chat Error:', error);
        document.getElementById(loadingId).remove();
        appendMessage('assistant', '⚠️ Connection failed. Server might be down.');
    } finally {
        setChatState(true);
        chatInput.focus();
    }
}

// --- Helper Functions ---

function setLoadState(isLoading) {
    if (isLoading) {
        loadBtn.disabled = true;
        videoUrlInput.disabled = true;
        loadBtnText.textContent = "Processing...";
        loadBtnLoader.classList.remove('hidden');
        statusMessage.classList.add('hidden');
    } else {
        loadBtn.disabled = false;
        videoUrlInput.disabled = false;
        loadBtnText.textContent = "Load & Process Video";
        loadBtnLoader.classList.add('hidden');
    }
}

function showStatus(message, type) {
    statusMessage.className = `status-message ${type}`;
    statusText.textContent = message;
    statusMessage.classList.remove('hidden');
}

function enableChat() {
    chatInput.disabled = false;
    sendBtn.disabled = false;
    connectionDot.className = 'dot connected';
    connectionText.textContent = 'Connected';
}

function disableChat() {
    chatInput.disabled = true;
    sendBtn.disabled = true;
    connectionDot.className = 'dot disconnected';
    connectionText.textContent = 'Awaiting Video';
    isVideoLoaded = false;
}

function setChatState(enabled) {
    chatInput.disabled = !enabled;
    sendBtn.disabled = !enabled;
}

/**
 * Append message to chat history UI
 * Returns the auto-generated ID of the message wrapper
 */
function appendMessage(role, content, isHtml = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}`;

    // Generate a unique ID for the element, useful for targeting loading states
    const uniqueId = 'msg-' + Math.random().toString(36).substr(2, 9);
    msgDiv.id = uniqueId;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    if (isHtml) {
        contentDiv.innerHTML = content;
    } else {
        contentDiv.textContent = content; // prevents XSS nicely for text responses
    }

    msgDiv.appendChild(contentDiv);
    chatHistory.appendChild(msgDiv);

    // Scroll to bottom
    chatHistory.scrollTop = chatHistory.scrollHeight;

    return uniqueId;
}
