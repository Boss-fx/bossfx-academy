// ================================================================
// BFX.chatbot — AI-style FAQ Chatbot Widget
// Conversational UI with keyword matching, quick prompts, and escalation
// ================================================================
var BFX = window.BFX || {};

BFX.chatbot = (function() {
    'use strict';

    // ----- Knowledge Base -----
    var KB = {
        greeting: {
            text: "Hey there! I'm the BossFx Assistant. I can help you get started with forex, find the right course, explore mentorship, or grab free resources. What would you like to know?",
            prompts: ['How do I start forex?', 'Tell me about courses', 'Mentorship options', 'Free resources', 'Upcoming webinars']
        },
        responses: [
            {
                patterns: [/start|beginn|new to|first time|learn forex|how.*forex|getting started/i],
                text: "Great question! Here's the best path for beginners:\n\n1. Download our free <b>Forex Starter Pack</b>\n2. Enroll in <b>Forex 101: The Trader's Bible</b> (free)\n3. Join the <b>Telegram community</b> for daily analysis\n\nThe Starter Pack covers currency pairs, key terms, and your first strategy.",
                ctas: [
                    { label: 'Start Forex 101', url: 'courses.html' },
                    { label: 'Get Starter Pack', action: 'resource', magnet: 'starter-pack' }
                ]
            },
            {
                patterns: [/course|forex 101|curriculum|module|lesson|learn|education|study/i],
                text: "Our flagship course is <b>Forex 101: The Trader's Bible</b> — 12 modules covering everything from candlestick basics to advanced risk management.\n\nIt's self-paced, free to start, and includes lifetime access with community support.\n\nMore courses (Smart Money Concepts, Trading Psychology) are coming soon!",
                ctas: [
                    { label: 'Explore Courses', url: 'courses.html' },
                    { label: 'View Live Schedule', url: 'live.html' }
                ]
            },
            {
                patterns: [/mentor|coaching|1.on.1|one.*one|personal|guidance|tutor/i],
                text: "BossFx offers two mentorship paths:\n\n<b>Group Mentorship</b> — Weekly sessions, strategy breakdowns, and community accountability.\n\n<b>1-on-1 Mentorship</b> — Personalized coaching with live XAU/USD analysis calls.\n\nBoth include access to our private trading community and direct support from Timilehin Shobande.",
                ctas: [
                    { label: 'View Mentorship', url: 'mentorship.html' },
                    { label: 'Apply Now', url: 'contact.html' }
                ]
            },
            {
                patterns: [/resource|download|free|guide|checklist|template|journal|starter pack|blueprint/i],
                text: "We have 8 free downloadable resources:\n\n📦 Forex Starter Pack\n✅ Pre-Trade Checklist\n🛡️ Risk Management Blueprint\n🧮 Position Size Calculator\n📋 Trading Plan Template\n📓 Trade Journal Sheet\n🎯 Prop Firm Survival Guide\n🔥 30-Day Discipline Tracker\n\nAll are print-ready and authored by BossFx founder Timilehin Shobande.",
                ctas: [
                    { label: 'Browse Resources', url: 'index.html#resources' }
                ]
            },
            {
                patterns: [/webinar|live.*session|workshop|bootcamp|sunday|wednesday|saturday/i],
                text: "We run 3 weekly webinars:\n\n📅 <b>Sunday Market Prep</b> — Weekly bias & key levels\n📅 <b>Wednesday Beginner Bootcamp</b> — Charts, candles & setups\n📅 <b>Saturday EA Workshop</b> — Automation & MT5 tools\n\nAll are free and hosted on Telegram. Register on the Live page to get calendar reminders!",
                ctas: [
                    { label: 'View Live Schedule', url: 'live.html' },
                    { label: 'Join Telegram', url: BFX.config ? BFX.config.socials.telegram : 'https://t.me/qD_fBeaziqE5YzU8' }
                ]
            },
            {
                patterns: [/prop.*firm|ftmo|funded|challenge|pass|evaluation/i],
                text: "Prop firms give you access to large trading capital ($10K-$200K+) if you pass their challenge.\n\nOur <b>Prop Firm Survival Guide</b> covers:\n• How challenges work\n• 7 rules to pass\n• Common failure reasons\n• Staying funded\n\nMany BossFx traders use our EA on prop firm accounts for consistent execution.",
                ctas: [
                    { label: 'Download Guide', action: 'resource', magnet: 'prop-guide' },
                    { label: 'View Mentorship', url: 'mentorship.html' }
                ]
            },
            {
                patterns: [/ea|robot|automat|expert.*advisor|sma.*pro|mt5|metatrader/i],
                text: "The <b>SMA Pro Trend EA</b> is our automated trading system built for MT5.\n\n✅ MetaQuotes validated\n✅ Smart trailing stop\n✅ 1% risk per trade\n✅ Free demo available\n\nPrice: $49.99 with instant download and lifetime updates.",
                ctas: [
                    { label: 'Get the EA', url: BFX.config ? BFX.config.ea.url : 'https://www.mql5.com/en/market/product/174970' },
                    { label: 'Learn More', url: 'index.html#ea' }
                ]
            },
            {
                patterns: [/price|cost|pay|afford|money|fee|subscription/i],
                text: "Here's what BossFx offers:\n\n<b>Free:</b> Forex 101 course, all 8 resources, Telegram community, weekly webinars\n\n<b>Paid:</b>\n• SMA Pro Trend EA — $49.99 (one-time)\n• Group Mentorship — check mentorship page\n• 1-on-1 Mentorship — premium tier\n\nMost of what we offer is completely free!",
                ctas: [
                    { label: 'View Pricing', url: 'courses.html' },
                    { label: 'Start Free', url: 'courses.html' }
                ]
            },
            {
                patterns: [/telegram|community|join|group|chat|member/i],
                text: "Our Telegram community has 5,200+ traders sharing daily analysis, trade ideas, and accountability.\n\nIt's completely free to join. You'll get:\n• Daily market bias updates\n• Live webinar notifications\n• Trade setups from mentors\n• Peer support and motivation",
                ctas: [
                    { label: 'Join Telegram Free', url: BFX.config ? BFX.config.socials.telegram : 'https://t.me/qD_fBeaziqE5YzU8' }
                ]
            },
            {
                patterns: [/risk|position.*size|stop.*loss|drawdown|money.*management/i],
                text: "Risk management is everything. Our core rules:\n\n1. Never risk more than 1% per trade\n2. Always use a stop loss\n3. Minimum 1:2 risk-to-reward ratio\n4. 3% daily loss limit\n5. Journal every trade\n\nDownload our <b>Risk Management Blueprint</b> for the complete framework.",
                ctas: [
                    { label: 'Download Blueprint', action: 'resource', magnet: 'risk-blueprint' },
                    { label: 'Try Calculator', action: 'resource', magnet: 'risk-calculator' }
                ]
            },
            {
                patterns: [/who|founder|about|timilehin|bossfx.*academy|story/i],
                text: "BossFx Academy was founded by <b>Timilehin 'BossFx' Shobande</b> — a forex trader and educator building the most accessible trading education platform for traders across Africa and beyond.\n\nOur mission: make professional trading education available to everyone.",
                ctas: [
                    { label: 'Read Our Story', url: 'about.html' }
                ]
            },
            {
                patterns: [/contact|support|help|email|reach|speak|human|real.*person/i],
                text: "You can reach the BossFx team through:\n\n📧 <b>Email:</b> hello@bossfxcademy.com\n💬 <b>Telegram:</b> DM us in the community\n📱 <b>Instagram:</b> @bossfx_academy\n\nOr use the contact form on our website for specific inquiries.",
                ctas: [
                    { label: 'Contact Form', url: 'contact.html' },
                    { label: 'DM on Telegram', url: BFX.config ? BFX.config.socials.telegram : 'https://t.me/qD_fBeaziqE5YzU8' }
                ]
            }
        ],
        fallback: {
            text: "I'm not sure I understood that. Here are some things I can help with:",
            prompts: ['Getting started', 'Courses', 'Mentorship', 'Free resources', 'Webinars', 'Talk to support']
        }
    };

    // ----- State -----
    var isOpen = false;
    var messages = [];
    var panel, msgContainer, input;

    // ----- Init -----
    function init() {
        // Restore session
        try {
            var saved = sessionStorage.getItem('bfx_chat');
            if (saved) messages = JSON.parse(saved);
        } catch(e) {}

        createDOM();
        if (messages.length === 0) {
            addBotMessage(KB.greeting.text, KB.greeting.prompts);
        } else {
            messages.forEach(function(m) {
                renderMessage(m.role, m.text, m.ctas, m.prompts, true);
            });
        }

        // Track
        if (BFX.analytics && BFX.analytics.track) {
            BFX.analytics.track('chatbot_loaded', { page: window.location.pathname });
        }
    }

    // ----- DOM Creation -----
    function createDOM() {
        // Bubble
        var bubble = document.createElement('button');
        bubble.className = 'bfx-chat-bubble';
        bubble.setAttribute('aria-label', 'Open BossFx chat');
        bubble.innerHTML = '💬<span class="badge-dot"></span>';
        bubble.addEventListener('click', toggle);
        document.body.appendChild(bubble);

        // Panel
        panel = document.createElement('div');
        panel.className = 'bfx-chat-panel';
        panel.innerHTML =
            '<div class="bfx-chat-header">' +
                '<div class="bfx-chat-avatar">🤖</div>' +
                '<div class="bfx-chat-header-info">' +
                    '<h4>BossFx Assistant</h4>' +
                    '<span>Online now</span>' +
                '</div>' +
                '<button class="bfx-chat-close" aria-label="Close chat">&times;</button>' +
            '</div>' +
            '<div class="bfx-chat-messages"></div>' +
            '<div class="bfx-chat-input-wrap">' +
                '<input class="bfx-chat-input" type="text" placeholder="Type your question..." autocomplete="off">' +
                '<button class="bfx-chat-send" aria-label="Send">➤</button>' +
            '</div>';

        panel.querySelector('.bfx-chat-close').addEventListener('click', toggle);

        msgContainer = panel.querySelector('.bfx-chat-messages');
        input = panel.querySelector('.bfx-chat-input');

        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && input.value.trim()) {
                handleUserInput(input.value.trim());
                input.value = '';
            }
        });

        panel.querySelector('.bfx-chat-send').addEventListener('click', function() {
            if (input.value.trim()) {
                handleUserInput(input.value.trim());
                input.value = '';
            }
        });

        document.body.appendChild(panel);
    }

    // ----- Toggle -----
    function toggle() {
        isOpen = !isOpen;
        panel.classList.toggle('open', isOpen);
        document.querySelector('.bfx-chat-bubble').classList.toggle('open', isOpen);

        // Remove badge dot on first open
        var dot = document.querySelector('.bfx-chat-bubble .badge-dot');
        if (dot && isOpen) dot.remove();

        if (isOpen) {
            scrollToBottom();
            setTimeout(function() { input.focus(); }, 300);

            if (BFX.analytics && BFX.analytics.track) {
                BFX.analytics.track('chatbot_opened', { page: window.location.pathname });
            }
        }
    }

    // ----- Handle User Input -----
    function handleUserInput(text) {
        addUserMessage(text);

        // Find matching response
        var match = null;
        for (var i = 0; i < KB.responses.length; i++) {
            for (var j = 0; j < KB.responses[i].patterns.length; j++) {
                if (KB.responses[i].patterns[j].test(text)) {
                    match = KB.responses[i];
                    break;
                }
            }
            if (match) break;
        }

        // Show typing, then respond
        showTyping();
        var delay = 600 + Math.random() * 600;
        setTimeout(function() {
            removeTyping();
            if (match) {
                addBotMessage(match.text, null, match.ctas);
            } else {
                addBotMessage(KB.fallback.text, KB.fallback.prompts);
            }

            if (BFX.analytics && BFX.analytics.track) {
                BFX.analytics.track('chatbot_message_sent', {
                    query: text.substring(0, 100),
                    matched: !!match
                });
            }
        }, delay);
    }

    // ----- Add Messages -----
    function addBotMessage(text, prompts, ctas) {
        messages.push({ role: 'bot', text: text, prompts: prompts || null, ctas: ctas || null });
        saveSession();
        renderMessage('bot', text, ctas, prompts);
    }

    function addUserMessage(text) {
        messages.push({ role: 'user', text: text });
        saveSession();
        renderMessage('user', text);
    }

    function renderMessage(role, text, ctas, prompts, skipAnim) {
        var msg = document.createElement('div');
        msg.className = 'bfx-msg ' + role;
        msg.innerHTML = text;

        // Add CTA buttons
        if (ctas && ctas.length) {
            var ctaWrap = document.createElement('div');
            ctaWrap.style.marginTop = '8px';
            ctaWrap.style.display = 'flex';
            ctaWrap.style.flexWrap = 'wrap';
            ctaWrap.style.gap = '6px';
            ctas.forEach(function(cta) {
                var btn = document.createElement('a');
                btn.className = 'bfx-msg-cta';
                btn.textContent = cta.label;
                if (cta.url) {
                    btn.href = cta.url;
                    if (cta.url.startsWith('http')) btn.target = '_blank';
                } else if (cta.action === 'resource' && BFX.socialGate) {
                    btn.href = '#';
                    btn.addEventListener('click', function(e) {
                        e.preventDefault();
                        BFX.socialGate.open(cta.magnet, cta.label);
                    });
                }
                ctaWrap.appendChild(btn);
            });
            msg.appendChild(ctaWrap);
        }

        if (skipAnim) msg.style.animation = 'none';
        msgContainer.appendChild(msg);

        // Add quick prompts if any
        if (prompts && prompts.length) {
            var promptWrap = document.createElement('div');
            promptWrap.className = 'bfx-chat-prompts';
            promptWrap.style.padding = '0';
            promptWrap.style.border = 'none';
            promptWrap.style.marginTop = '4px';
            prompts.forEach(function(p) {
                var chip = document.createElement('button');
                chip.className = 'bfx-prompt-chip';
                chip.textContent = p;
                chip.addEventListener('click', function() {
                    handleUserInput(p);
                    // Remove prompt chips after clicking
                    if (promptWrap.parentNode) promptWrap.remove();
                });
                promptWrap.appendChild(chip);
            });
            msgContainer.appendChild(promptWrap);
        }

        scrollToBottom();
    }

    // ----- Typing Indicator -----
    function showTyping() {
        var t = document.createElement('div');
        t.className = 'bfx-typing';
        t.id = 'bfx-typing';
        t.innerHTML = '<span></span><span></span><span></span>';
        msgContainer.appendChild(t);
        scrollToBottom();
    }

    function removeTyping() {
        var t = document.getElementById('bfx-typing');
        if (t) t.remove();
    }

    // ----- Utilities -----
    function scrollToBottom() {
        setTimeout(function() {
            msgContainer.scrollTop = msgContainer.scrollHeight;
        }, 50);
    }

    function saveSession() {
        try {
            // Only save last 30 messages to prevent storage overflow
            var toSave = messages.slice(-30);
            sessionStorage.setItem('bfx_chat', JSON.stringify(toSave));
        } catch(e) {}
    }

    // ----- Public API -----
    return {
        init: init,
        open: function() { if (!isOpen) toggle(); },
        close: function() { if (isOpen) toggle(); }
    };
})();

// Auto-init after a short delay (don't block critical path)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(BFX.chatbot.init, 2000);
    });
} else {
    setTimeout(BFX.chatbot.init, 2000);
}
