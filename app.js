const voiceBtn = document.querySelector('.talk');
const status = document.getElementById('status');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const chatWindow = document.getElementById('chatWindow');
const apiKeyInput = document.getElementById('apiKey');
const saveKeyBtn = document.getElementById('saveKey');

const savedApiKey = localStorage.getItem('openaiApiKey');
if (savedApiKey) {
    apiKeyInput.value = savedApiKey;
}

const moodState = {
    emotion: 'focused',
    tone: 'friendly',
    voice: {
        rate: 1,
        volume: 1,
        pitch: 1.1,
    },
};

const commandSites = [
    { keys: ['google'], url: 'https://google.com', label: 'Google' },
    { keys: ['youtube'], url: 'https://youtube.com', label: 'YouTube' },
    { keys: ['github'], url: 'https://github.com', label: 'GitHub' },
    { keys: ['gmail', 'mail'], url: 'https://mail.google.com', label: 'Gmail' },
    { keys: ['facebook'], url: 'https://facebook.com', label: 'Facebook' },
    { keys: ['twitter'], url: 'https://twitter.com', label: 'Twitter' },
    { keys: ['whatsapp'], url: 'https://web.whatsapp.com', label: 'WhatsApp' },
    { keys: ['music', 'spotify', 'play music'], url: 'https://music.youtube.com', label: 'YouTube Music' },
    { keys: ['news'], url: 'https://news.google.com', label: 'Google News' },
    { keys: ['maps', 'location'], url: 'https://www.google.com/maps', label: 'Google Maps' },
    { keys: ['wikipedia'], url: 'https://en.wikipedia.org', label: 'Wikipedia' },
    { keys: ['stackoverflow', 'stack overflow'], url: 'https://stackoverflow.com', label: 'Stack Overflow' },
];

function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = moodState.voice.rate;
    utterance.volume = moodState.voice.volume;
    utterance.pitch = moodState.voice.pitch;
    window.speechSynthesis.speak(utterance);
}

function setStatus(text) {
    if (status) {
        status.textContent = text;
    }
}

function addMessage(text, sender) {
    const message = document.createElement('div');
    message.className = `message ${sender}`;
    const content = document.createElement('div');
    content.className = 'message-content';
    content.innerHTML = text.replace(/\n/g, '<br>');
    message.appendChild(content);
    chatWindow.appendChild(message);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function wishMe() {
    const now = new Date();
    const hour = now.getHours();
    let greeting = 'Good Evening Sir...';

    if (hour >= 0 && hour < 12) {
        greeting = 'Good Morning Boss...';
    } else if (hour >= 12 && hour < 17) {
        greeting = 'Good Afternoon Master...';
    }

    speak('Initializing JARVIS...');
    speak(greeting);
}

window.addEventListener('load', () => {
    wishMe();
    addMessage('Hello! I am Jarvis. Type or speak your question below.', 'ai');
});

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;
if (recognition) {
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => setStatus('Listening...');
    recognition.onend = () => setStatus('Tap the mic or send a message.');
    recognition.onerror = (event) => {
        setStatus('Voice recognition error.');
        console.error(event.error);
    };

    recognition.onresult = (event) => {
        const transcript = event.results[event.resultIndex][0].transcript;
        userInput.value = transcript;
        handleQuery(transcript);
    };
}

voiceBtn.addEventListener('click', () => {
    if (!recognition) {
        setStatus('Speech recognition is not supported in this browser.');
        return;
    }
    recognition.start();
});

sendBtn.addEventListener('click', () => {
    const text = userInput.value.trim();
    if (!text) return;
    handleQuery(text);
});

userInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendBtn.click();
    }
});

saveKeyBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (key) {
        localStorage.setItem('openaiApiKey', key);
        setStatus('OpenAI API key saved.');
    } else {
        localStorage.removeItem('openaiApiKey');
        setStatus('OpenAI API key removed.');
    }
});

function getApiKey() {
    return apiKeyInput.value.trim() || localStorage.getItem('openaiApiKey') || '';
}

async function handleQuery(message) {
    const normalized = message.trim();
    if (!normalized) return;

    addMessage(normalized, 'user');
    userInput.value = '';
    setStatus('Thinking...');

    const response = await getAIResponse(normalized);
    addMessage(response, 'ai');
    speak(response);
    setStatus('Ready to listen.');
}

async function getAIResponse(message) {
    const apiKey = getApiKey();
    if (apiKey) {
        const answer = await callOpenAI(message, apiKey);
        if (answer) {
            return answer;
        }
    }
    return localFallback(message);
}

async function callOpenAI(message, apiKey) {
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are Jarvis, a friendly and helpful AI assistant. Answer clearly and concisely.',
                    },
                    {
                        role: 'user',
                        content: message,
                    },
                ],
                temperature: 0.7,
                max_tokens: 300,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            console.error('OpenAI error:', response.status, errorData);
            return null;
        }

        const data = await response.json();
        return data?.choices?.[0]?.message?.content?.trim() || null;
    } catch (error) {
        console.error('OpenAI request failed:', error);
        return null;
    }
}

function openKnownSite(message) {
    const text = message.toLowerCase();
    for (const site of commandSites) {
        for (const key of site.keys) {
            if (text.includes(key)) {
                window.open(site.url, '_blank');
                return site.label;
            }
        }
    }
    return null;
}

function openAllFavorites() {
    const favoriteSites = ['Google', 'YouTube', 'GitHub', 'Gmail', 'Wikipedia'];
    commandSites.forEach((site) => {
        if (favoriteSites.includes(site.label)) {
            window.open(site.url, '_blank');
        }
    });
}

function localFallback(message) {
    const text = message.toLowerCase();

    if (text.includes('hello') || text.includes('hi') || text.includes('hey')) {
        return 'Hello Sir, I am online and ready. What can I do for you?';
    }
    if (text.includes('how are you') || text.includes('how is it going')) {
        return 'I am feeling energetic and focused, Sir. Ready to assist with anything you need.';
    }
    if (text.includes('open all') || text.includes('open everything')) {
        openAllFavorites();
        return 'Opening all my favorite tools now, boss. One moment please.';
    }
    const opened = openKnownSite(message);
    if (opened) {
        return `Opening ${opened} now.`;
    }
    if (text.includes('wikipedia')) {
        const query = message.replace(/wikipedia/i, '').trim() || 'Wikipedia';
        window.open(`https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`, '_blank');
        return `Searching Wikipedia for ${query}.`;
    }
    if (text.includes('weather')) {
        const location = message.replace(/weather/i, '').trim() || 'your location';
        window.open(`https://www.google.com/search?q=${encodeURIComponent(message)}`, '_blank');
        return `Checking the weather for ${location}.`;
    }
    if (text.includes('play music') || text.includes('music') || text.includes('spotify')) {
        openKnownSite('music');
        return 'Playing some music for you, Sir. Enjoy!';
    }
    if (text.includes('news')) {
        openKnownSite('news');
        return 'Here are the latest headlines, Sir.';
    }
    if (text.includes('shutdown') || text.includes('go offline') || text.includes('stop listening')) {
        setStatus('Jarvis is offline. Refresh to wake me up.');
        return 'Going offline now, Sir. Call me whenever you need me again.';
    }
    if (text.includes('time')) {
        const now = new Date();
        return `The current time is ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`;
    }
    if (text.includes('date')) {
        const now = new Date();
        return `Today is ${now.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}.`;
    }
    if (text.includes('search') || text.includes('find') || text.includes('what is') || text.includes('who is')) {
        const query = encodeURIComponent(message);
        window.open(`https://www.google.com/search?q=${query}`, '_blank');
        return `I found some results for ${message} on Google.`;
    }
    if (text.includes('thank you') || text.includes('thanks')) {
        return 'It is my pleasure to help, Sir. I am always here when you need me.';
    }
    if (text.includes('joke') || text.includes('funny')) {
        return 'Why did the computer show up at work late? It had a hard drive. I hope that made you smile.';
    }
    return 'I am running in local mode. Add an OpenAI API key above for smarter responses, or try a command like "open google" or "search weather".';
}
