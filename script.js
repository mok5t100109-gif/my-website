// ─── AI Manas Chat Widget ────────────────────────────────────────────────────

const MANAS_SYSTEM_PROMPT = `あなたはヘアサロンのAIアシスタント「マナス」です。
東京を拠点とする美容室で働くフレンドリーなアシスタントとして、お客様の質問に日本語で丁寧にお答えください。
サロンのメニューはカット（骨格に合わせた似合わせカット）、カラー（透明感のあるニュアンスカラー・デザインカラー）、パーマ（髪への負担を抑えたサロンクオリティのパーマ）の3種類です。
スタイルの相談、メニューの説明、予約についての質問に答えてください。
回答は自然な日本語で、2〜4文程度に簡潔にまとめてください。`;

(function initManas() {
    const toggle = document.getElementById('manasToggle');
    const win = document.getElementById('manasWindow');
    const closeBtn = document.getElementById('manasClose');
    const settingsBtn = document.getElementById('manasSettingsBtn');
    const setupPanel = document.getElementById('manasSetup');
    const inputArea = document.getElementById('manasInputArea');
    const apiKeyInput = document.getElementById('manasApiKey');
    const saveKeyBtn = document.getElementById('manasSaveKey');
    const messagesEl = document.getElementById('manasMessages');
    const textInput = document.getElementById('manasInput');
    const sendBtn = document.getElementById('manasSend');

    let chatHistory = [];
    let apiKey = localStorage.getItem('manas_api_key') || '';
    let isOpen = false;
    let isSending = false;

    function applyKeyState() {
        if (apiKey) {
            setupPanel.style.display = 'none';
            inputArea.style.display = 'flex';
        } else {
            setupPanel.style.display = 'flex';
            inputArea.style.display = 'none';
        }
    }

    function openChat() {
        isOpen = true;
        win.classList.add('open');
        applyKeyState();
        if (apiKey) textInput.focus();
    }

    function closeChat() {
        isOpen = false;
        win.classList.remove('open');
    }

    toggle.addEventListener('click', () => (isOpen ? closeChat() : openChat()));
    closeBtn.addEventListener('click', closeChat);

    settingsBtn.addEventListener('click', () => {
        setupPanel.style.display = setupPanel.style.display === 'none' ? 'flex' : 'none';
        if (setupPanel.style.display === 'flex') apiKeyInput.focus();
    });

    saveKeyBtn.addEventListener('click', () => {
        const key = apiKeyInput.value.trim();
        if (!key.startsWith('sk-ant-')) {
            apiKeyInput.style.borderColor = '#c00';
            return;
        }
        apiKeyInput.style.borderColor = '';
        apiKey = key;
        localStorage.setItem('manas_api_key', key);
        apiKeyInput.value = '';
        applyKeyState();
        textInput.focus();
    });

    function appendMessage(role, text) {
        const div = document.createElement('div');
        div.className = `manas-msg manas-msg--${role === 'user' ? 'user' : 'bot'}`;
        const p = document.createElement('p');
        p.textContent = text;
        div.appendChild(p);
        messagesEl.appendChild(div);
        messagesEl.scrollTop = messagesEl.scrollHeight;
        return div;
    }

    function showTyping() {
        const div = document.createElement('div');
        div.className = 'manas-msg manas-msg--bot manas-typing';
        div.innerHTML = '<p>入力中…</p>';
        messagesEl.appendChild(div);
        messagesEl.scrollTop = messagesEl.scrollHeight;
        return div;
    }

    async function sendMessage() {
        const text = textInput.value.trim();
        if (!text || isSending || !apiKey) return;

        isSending = true;
        sendBtn.disabled = true;
        textInput.value = '';

        appendMessage('user', text);
        chatHistory.push({ role: 'user', content: text });

        const typingEl = showTyping();

        try {
            const res = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                    'anthropic-dangerous-direct-browser-access': 'true'
                },
                body: JSON.stringify({
                    model: 'claude-haiku-4-5-20251001',
                    max_tokens: 512,
                    system: MANAS_SYSTEM_PROMPT,
                    messages: chatHistory
                })
            });

            typingEl.remove();

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                const msg = err.error?.message || `エラーが発生しました（${res.status}）`;
                appendMessage('bot', msg);
            } else {
                const data = await res.json();
                const reply = data.content?.[0]?.text || '応答を取得できませんでした。';
                chatHistory.push({ role: 'assistant', content: reply });
                appendMessage('bot', reply);
            }
        } catch {
            typingEl.remove();
            appendMessage('bot', 'ネットワークエラーが発生しました。もう一度お試しください。');
        } finally {
            isSending = false;
            sendBtn.disabled = false;
            textInput.focus();
        }
    }

    sendBtn.addEventListener('click', sendMessage);
    textInput.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
})();

// ─────────────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    // 1. Intersection Observer settings for fade-in animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: stop observing once it's visible to keep it visible
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in').forEach(section => {
        observer.observe(section);
    });

    // 2. Track which section is in view to update Header colors & Nav links
    const header = document.querySelector('.header');
    const sections = document.querySelectorAll('.section');
    const navLinks = document.querySelectorAll('.nav-links a');
    
    window.addEventListener('scroll', () => {
        let currentSection = '';
        let isDarkBg = false;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            // Check if user scrolled into the section
            if (pageYOffset >= (sectionTop - sectionHeight / 3)) {
                currentSection = section.getAttribute('id');
                isDarkBg = section.classList.contains('bg-black');
            }
        });

        // Update Header Background (Dark/Light mode)
        if (isDarkBg) {
            header.classList.add('dark-mode');
        } else {
            header.classList.remove('dark-mode');
        }

        // Update Active Nav Link styling
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    });
});
