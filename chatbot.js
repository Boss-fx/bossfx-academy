// ================================================================
// Mirror — BossFx AI Assistant v2.0
// Premium fintech chatbot · Intelligent routing · OpenAI-ready
// ================================================================
var BFX = window.BFX || {};

BFX.mirror = (function () {
    'use strict';

    // ============================================================
    // 1. CONFIG
    // ============================================================
    var CFG = {
        name: 'Mirror',
        tagline: 'BossFx AI Assistant',
        position: 'right',
        panelWidth: 400,
        zIndex: 9998,
        typingMin: 500,
        typingMax: 1100,
        idleTimeout: 25000,
        sessionKey: 'bfx_mirror_v2',
        maxMessages: 40,
        leadEndpoint: '/api/lead-capture'
    };

    // ============================================================
    // 2. STATE
    // ============================================================
    var state = {
        isOpen: false,
        view: 'home',
        messages: [],
        context: {
            intent: null,
            stage: 'greeting',
            turns: 0,
            leadCaptured: false,
            email: null,
            page: ''
        },
        hasInteracted: false,
        lastActivity: 0
    };

    var els = {};

    // ============================================================
    // 3. KNOWLEDGE BASE
    // ============================================================
    var KB = {
        responses: [
            {
                id: 'start-forex',
                patterns: [/start|beginn|new to|first time|learn forex|how.*forex|getting started|zero|scratch/i],
                intent: 'beginner',
                text: "Great question! Here's the fastest path to becoming a structured trader:\n\n<b>1.</b> Download the free <b>Forex Starter Pack</b> — covers the basics\n<b>2.</b> Start <b>Forex 101</b> — our 12-module course (free)\n<b>3.</b> Join <b>Telegram</b> — 5,200+ traders, daily analysis\n\nThis combo has helped thousands go from zero to understanding how markets actually move.",
                ctas: [
                    { label: '📚 Start Forex 101', url: 'courses.html' },
                    { label: '📦 Get Starter Pack', url: 'community.html#resources' }
                ],
                followUp: ['What does Forex 101 cover?', 'How long does it take?', 'Is it really free?']
            },
            {
                id: 'courses',
                patterns: [/course|forex 101|curriculum|module|lesson|education|study|class/i],
                intent: 'beginner',
                text: "Our flagship: <b>Forex 101 — The Trader's Bible</b>\n\n• 12 structured modules\n• Candlestick basics → advanced risk management\n• Self-paced, lifetime access\n• Free for all BossFx members\n• Community support included\n\nMore courses (Smart Money Concepts, Trading Psychology) are dropping soon.",
                ctas: [
                    { label: '📚 Explore Courses', url: 'courses.html' },
                    { label: '📅 View Live Schedule', url: 'live.html' }
                ],
                followUp: ['Tell me about mentorship', 'What about webinars?']
            },
            {
                id: 'mentorship',
                patterns: [/mentor|coaching|1.on.1|one.*one|personal|guidance|tutor|accelerat/i],
                intent: 'mentorship',
                text: "BossFx Mentorship is for traders who want structured, direct guidance.\n\n<b>Group Mentorship</b>\nWeekly sessions, strategy breakdowns, community accountability.\n\n<b>1-on-1 Mentorship</b>\nPersonalized coaching with live analysis calls, trade reviews, and a direct line to your mentor.\n\nBoth include private Telegram access and are led by Timilehin Shobande.",
                ctas: [
                    { label: '🎯 View Programs', url: 'mentorship.html' },
                    { label: '💬 Chat on WhatsApp', url: 'https://wa.me/2349155008539' }
                ],
                followUp: ['How much does it cost?', 'What results have students gotten?', 'Apply now']
            },
            {
                id: 'resources',
                patterns: [/resource|download|free.*guide|checklist|template|journal|starter.*pack|blueprint|toolkit/i],
                intent: 'resource',
                text: "We have <b>8 free professional trading tools</b>:\n\n📦 Forex Starter Pack\n✅ Pre-Trade Checklist\n🛡️ Risk Management Blueprint\n🧮 Position Size Calculator\n📋 Trading Plan Template\n📓 Trade Journal Sheet\n🎯 Prop Firm Survival Guide\n🔥 30-Day Discipline Tracker\n\nAll created by BossFx founder Timilehin Shobande.",
                ctas: [
                    { label: '📦 Browse Resources', url: 'community.html#resources' }
                ],
                followUp: ['Which one should I start with?', 'Tell me about courses']
            },
            {
                id: 'webinars',
                patterns: [/webinar|live.*session|workshop|bootcamp|sunday|wednesday|saturday|weekly/i],
                intent: 'webinar',
                text: "We run <b>3 free weekly webinars</b>:\n\n📅 <b>Sunday Market Prep</b> — Weekly bias & key levels\n📅 <b>Wednesday Beginner Bootcamp</b> — Charts, candles & setups\n📅 <b>Saturday EA Workshop</b> — Automation & MT5 tools\n\nAll are free and hosted on Telegram. Over 200 traders attend each session.",
                ctas: [
                    { label: '📅 View Schedule', url: 'live.html' },
                    { label: '💬 Join Telegram', url: getTelegramUrl() }
                ],
                followUp: ['How do I register?', 'Are replays available?']
            },
            {
                id: 'prop-firm',
                patterns: [/prop.*firm|ftmo|funded|challenge|pass|evaluation|capital|account.*size/i],
                intent: 'propfirm',
                text: "Prop firms give you access to large capital ($10K-$200K+) if you pass their challenge.\n\nOur <b>Prop Firm Survival Guide</b> covers:\n• How challenges work\n• 7 rules to pass\n• Common failure traps\n• How to stay funded\n\nMany BossFx traders combine mentorship with our EA for consistent prop firm execution.",
                ctas: [
                    { label: '📥 Download Guide', url: 'community.html#resources' },
                    { label: '🎯 Explore Mentorship', url: 'mentorship.html' }
                ],
                followUp: ['Tell me about the EA', 'What mentorship tier helps with prop firms?']
            },
            {
                id: 'ea',
                patterns: [/ea|robot|automat|expert.*advisor|sma.*pro|mt5|metatrader|algo/i],
                intent: 'ea',
                text: "The <b>SMA Pro Trend EA</b> is our automated trading system for MT5.\n\n✅ MetaQuotes marketplace validated\n✅ Smart trailing stop technology\n✅ Fixed 1% risk per trade\n✅ Free demo available\n\nPrice: <b>$49.99</b> — one-time purchase with lifetime updates.",
                ctas: [
                    { label: '🤖 Get the EA', url: getEAUrl() },
                    { label: '📖 Learn More', url: 'index.html#ea' }
                ],
                followUp: ['Does it work on prop firms?', 'What pairs does it trade?']
            },
            {
                id: 'pricing',
                patterns: [/price|cost|pay|afford|money|fee|subscription|how much|budget/i],
                intent: null,
                text: "Most of what BossFx offers is <b>completely free</b>:\n\n🆓 Forex 101 course\n🆓 All 8 trading resources\n🆓 Telegram community (5,200+ traders)\n🆓 Weekly webinars\n\n💰 <b>Paid options:</b>\n• SMA Pro Trend EA — $49.99 (one-time)\n• Group Mentorship — see mentorship page\n• 1-on-1 Mentorship — premium tier\n\nStart free, upgrade when you're ready.",
                ctas: [
                    { label: '🆓 Start Free', url: 'courses.html' },
                    { label: '💰 View Mentorship', url: 'mentorship.html' }
                ]
            },
            {
                id: 'telegram',
                patterns: [/telegram|community|join|group|chat.*group|member|discord/i],
                intent: null,
                text: "Our Telegram community is <b>5,200+ traders strong</b> and growing.\n\nWhat you get:\n• Daily market bias updates\n• Live webinar notifications\n• Trade setups from mentors\n• Peer support & motivation\n• Webinar replays\n\nIt's completely free to join.",
                ctas: [
                    { label: '💬 Join Telegram', url: getTelegramUrl() }
                ]
            },
            {
                id: 'risk',
                patterns: [/risk|position.*size|stop.*loss|drawdown|money.*manage|lot.*size/i],
                intent: 'beginner',
                text: "Risk management separates professionals from gamblers. Our core rules:\n\n<b>1.</b> Never risk more than 1% per trade\n<b>2.</b> Always use a stop loss — no exceptions\n<b>3.</b> Minimum 1:2 risk-to-reward ratio\n<b>4.</b> 3% daily loss limit\n<b>5.</b> Journal every single trade\n\nOur <b>Risk Management Blueprint</b> has the complete framework.",
                ctas: [
                    { label: '🛡️ Download Blueprint', url: 'community.html#resources' }
                ],
                followUp: ['How do I calculate position size?', 'Tell me about the trading journal']
            },
            {
                id: 'psychology',
                patterns: [/psycholog|emotion|discipline|revenge.*trad|fear|greed|mindset|mental|overtra/i],
                intent: 'beginner',
                text: "Trading psychology is often the <b>biggest edge</b> a trader can develop.\n\nCommon challenges:\n• Revenge trading after losses\n• Fear of pulling the trigger\n• Overtrading on good days\n• Moving stop losses\n• FOMO entries\n\n<b>The fix:</b> Structure. A trading plan eliminates 90% of emotional decisions. Our 30-Day Discipline Tracker helps build the habit.",
                ctas: [
                    { label: '🔥 Get Discipline Tracker', url: 'community.html#resources' },
                    { label: '📚 Start Forex 101', url: 'courses.html' }
                ]
            },
            {
                id: 'about',
                patterns: [/who|founder|about|timilehin|bossfx.*academy|story|behind/i],
                intent: null,
                text: "BossFx Academy was founded by <b>Timilehin 'BossFx' Shobande</b> — a forex trader and educator building Africa's most accessible trading education platform.\n\nOur mission: give every trader the structured education, tools, and community they need to succeed.\n\nWe've taught 5,200+ traders across Africa and beyond.",
                ctas: [
                    { label: '📖 Our Story', url: 'about.html' }
                ]
            },
            {
                id: 'support',
                patterns: [/contact|support|help|email|reach|speak|human|real.*person|complaint|issue/i],
                intent: 'support',
                text: "You can reach the BossFx team through:\n\n📧 <b>Email:</b> hello@bossfxcademy.com\n💬 <b>Telegram:</b> DM us in the community\n📱 <b>WhatsApp:</b> +234 915 500 8539\n📸 <b>Instagram:</b> @bossfx_academy\n\nOr use the contact form for detailed inquiries.",
                ctas: [
                    { label: '📝 Contact Form', url: 'contact.html' },
                    { label: '💬 WhatsApp', url: 'https://wa.me/2349155008539' }
                ]
            },
            {
                id: 'xauusd',
                patterns: [/gold|xau|xauusd|precious.*metal/i],
                intent: 'beginner',
                text: "XAU/USD (Gold) is one of the most popular instruments for forex traders.\n\nIt's known for:\n• High volatility = big opportunities\n• Strong technical patterns\n• Correlation with USD strength\n\nOur mentorship program includes <b>live XAU/USD analysis calls</b>. The weekly webinar also covers gold setups regularly.",
                ctas: [
                    { label: '🎯 View Mentorship', url: 'mentorship.html' },
                    { label: '📅 Join Webinar', url: 'live.html' }
                ]
            }
        ],
        fallback: {
            text: "I'm not sure I have the perfect answer for that. But here's what I can help with — just tap any option:",
            prompts: ['Start forex', 'Courses', 'Mentorship', 'Free resources', 'Webinars', 'Talk to support']
        }
    };

    // ============================================================
    // 4. QUICK ACTIONS
    // ============================================================
    var QUICK_ACTIONS = [
        { id: 'start-forex',  icon: '📈', label: 'Start Forex',     type: 'message', text: 'How do I start trading forex?' },
        { id: 'webinar',      icon: '🎥', label: 'Join Webinar',    type: 'message', text: 'Tell me about upcoming webinars' },
        { id: 'resources',    icon: '📚', label: 'Free Resources',  type: 'message', text: 'What free resources do you have?' },
        { id: 'telegram',     icon: '💬', label: 'Join Telegram',   type: 'link',    url: getTelegramUrl() },
        { id: 'mentorship',   icon: '🎯', label: 'Mentorship',      type: 'message', text: 'Tell me about mentorship options' },
        { id: 'prop-firm',    icon: '🏦', label: 'Prop Firm Help',  type: 'message', text: 'How do I pass a prop firm challenge?' },
        { id: 'psychology',   icon: '🧠', label: 'Trading Mindset', type: 'message', text: 'Help me with trading psychology' },
        { id: 'support',      icon: '🤝', label: 'Support',          type: 'message', text: 'I need help with something' }
    ];

    // ============================================================
    // 5. PAGE-CONTEXTUAL GREETINGS
    // ============================================================
    var PAGE_GREETINGS = {
        'index':      { title: 'Welcome to BossFx!', sub: "I'm Mirror — your AI trading guide. How can I help you today?" },
        'courses':    { title: 'Looking for courses?', sub: "I can help you find the right learning path. What's your experience level?" },
        'mentorship': { title: 'Considering mentorship?', sub: 'I can explain our programs and help you decide which fits your goals.' },
        'live':       { title: 'Webinars & Live Sessions', sub: 'Ask me about upcoming sessions, topics, or how to register.' },
        'community':  { title: 'Welcome to the Hub!', sub: 'Need help finding a resource or joining the Telegram community?' },
        'contact':    { title: 'Need help?', sub: 'I can answer most questions instantly. Try me before filling out the form!' },
        'about':      { title: 'Hey there!', sub: 'Want to learn about BossFx Academy or Timilehin Shobande?' }
    };

    var PROACTIVE_TIPS = {
        'index':      'New to forex? I can help you get started in under 2 minutes.',
        'courses':    'Not sure which course is right? Ask me!',
        'mentorship': 'Want to know which mentorship tier fits your level?',
        'live':       'Our next free webinar is this week — want details?',
        'community':  'Looking for a specific resource? I can point you to it.',
        'default':    'Hey! Need help with anything? Tap to chat.'
    };

    // ============================================================
    // 6. INTENT ENGINE
    // ============================================================
    function detectIntent(text, history) {
        var scores = { beginner: 0, mentorship: 0, ea: 0, propfirm: 0, webinar: 0, resource: 0, support: 0 };

        // Score from current message
        for (var i = 0; i < KB.responses.length; i++) {
            var r = KB.responses[i];
            if (!r.intent) continue;
            for (var j = 0; j < r.patterns.length; j++) {
                if (r.patterns[j].test(text)) {
                    scores[r.intent] = (scores[r.intent] || 0) + 3;
                }
            }
        }

        // Score from history
        if (history && history.length) {
            for (var h = 0; h < history.length; h++) {
                if (history[h].intent) {
                    scores[history[h].intent] = (scores[history[h].intent] || 0) + 1;
                }
            }
        }

        // Score from page context
        var page = getPageName();
        if (page === 'mentorship') scores.mentorship += 2;
        if (page === 'courses') scores.beginner += 2;
        if (page === 'live') scores.webinar += 2;
        if (page === 'community') scores.resource += 2;

        // Find highest
        var best = null;
        var bestScore = 0;
        for (var key in scores) {
            if (scores[key] > bestScore) {
                bestScore = scores[key];
                best = key;
            }
        }

        return bestScore > 0 ? { primary: best, confidence: Math.min(bestScore / 5, 1) } : null;
    }

    // ============================================================
    // 7. AI SERVICE LAYER (OpenAI-ready)
    // ============================================================
    var AIService = {
        provider: 'local',

        getResponse: function (userText, context, callback) {
            if (AIService.provider === 'local') {
                LocalEngine.process(userText, context, callback);
            } else if (AIService.provider === 'openai') {
                OpenAIEngine.process(userText, context, callback);
            }
        }
    };

    var LocalEngine = {
        process: function (text, context, callback) {
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

            var intent = detectIntent(text, context.history);

            if (match) {
                callback(null, {
                    text: match.text,
                    ctas: match.ctas || [],
                    prompts: match.followUp || [],
                    intent: match.intent,
                    matched: true
                });
            } else {
                callback(null, {
                    text: KB.fallback.text,
                    ctas: [],
                    prompts: KB.fallback.prompts,
                    intent: intent ? intent.primary : null,
                    matched: false
                });
            }
        }
    };

    // Stub for future OpenAI integration
    var OpenAIEngine = {
        endpoint: '/api/mirror-ai',
        systemPrompt: 'You are Mirror, the BossFx Academy AI assistant. You are an expert forex trading educator. You speak with confidence, clarity, and encouragement. You help users find the right BossFx resource (courses, mentorship, webinars, tools). You never give financial advice. You are concise but thorough. BossFx Academy is founded by Timilehin Shobande.',

        process: function (text, context, callback) {
            var body = {
                message: text,
                context: {
                    page: getPageName(),
                    intent: context.intent,
                    history: (context.history || []).slice(-6).map(function (m) { return { role: m.role, text: m.text.substring(0, 200) }; })
                },
                system: OpenAIEngine.systemPrompt
            };

            fetch(OpenAIEngine.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                callback(null, {
                    text: data.reply || 'Sorry, I had trouble processing that. Try again?',
                    ctas: data.ctas || [],
                    prompts: data.suggestions || [],
                    intent: data.intent || null,
                    matched: true
                });
            })
            .catch(function (err) {
                // Fallback to local engine on API failure
                LocalEngine.process(text, context, callback);
            });
        }
    };

    // ============================================================
    // 8. LEAD CAPTURE
    // ============================================================
    var LeadCapture = {
        shouldPrompt: function () {
            return state.context.turns >= 3 && !state.context.leadCaptured && getPageName() !== 'contact';
        },

        show: function (reason) {
            var prompts = {
                general: 'Want the free Forex Starter Pack sent to your inbox?',
                webinar: 'Want me to register you for the next webinar?',
                mentorship: 'Want us to reach out about mentorship options?',
                resource: 'Drop your email and we\'ll send the resources directly.'
            };
            var msg = prompts[reason] || prompts.general;
            renderLeadForm(msg, reason);
        },

        capture: function (email, source) {
            if (!email || email.indexOf('@') === -1) return;
            state.context.leadCaptured = true;
            state.context.email = email;
            saveState();

            // Use BFX.brevo integration
            if (BFX.brevo && BFX.brevo.capture) {
                BFX.brevo.capture(email, 'mirror_' + (source || 'chat'), {
                    source: 'mirror_assistant',
                    page: window.location.pathname
                });
            }

            trackEvent('mirror_lead_capture', { source: source, intent: state.context.intent });
        }
    };

    // ============================================================
    // 9. DOM BUILDER
    // ============================================================
    function createDOM() {
        // --- FAB ---
        var fab = document.createElement('button');
        fab.className = 'mirror-fab';
        fab.setAttribute('aria-label', 'Open BossFx AI Assistant');
        fab.innerHTML =
            '<svg class="mirror-fab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>' +
            '</svg>' +
            '<span class="mirror-fab-badge"></span>' +
            '<span class="mirror-fab-pulse"></span>';
        fab.addEventListener('click', function () { togglePanel(); });
        document.body.appendChild(fab);
        els.fab = fab;

        // --- Tooltip ---
        var tooltip = document.createElement('div');
        tooltip.className = 'mirror-tooltip';
        tooltip.innerHTML =
            '<button class="mirror-tooltip-close">&times;</button>' +
            '<span class="mirror-tooltip-text"></span>';
        tooltip.querySelector('.mirror-tooltip-close').addEventListener('click', function (e) {
            e.stopPropagation();
            hideTooltip();
        });
        tooltip.addEventListener('click', function () {
            hideTooltip();
            togglePanel();
        });
        document.body.appendChild(tooltip);
        els.tooltip = tooltip;

        // --- Panel ---
        var panel = document.createElement('div');
        panel.className = 'mirror-panel';

        var greeting = getGreeting();

        panel.innerHTML =
            // Header
            '<div class="mirror-header">' +
                '<div class="mirror-avatar">M</div>' +
                '<div class="mirror-header-info">' +
                    '<h4>Mirror</h4>' +
                    '<span class="mirror-header-status">BossFx AI Assistant</span>' +
                '</div>' +
                '<div class="mirror-header-actions">' +
                    '<button class="mirror-header-btn mirror-btn-close" aria-label="Close">&times;</button>' +
                '</div>' +
            '</div>' +
            // Home View
            '<div class="mirror-home" id="mirrorHome">' +
                '<div class="mirror-home-greeting">' +
                    '<h3>' + greeting.title + '</h3>' +
                    '<p>' + greeting.sub + '</p>' +
                '</div>' +
                '<div class="mirror-home-label">Quick Actions</div>' +
                '<div class="mirror-home-grid" id="mirrorGrid"></div>' +
                '<div class="mirror-home-footer">' +
                    '<a href="https://www.bossfxcademy.com" target="_blank">bossfxcademy.com</a>' +
                '</div>' +
            '</div>' +
            // Chat View
            '<div class="mirror-chat" id="mirrorChat">' +
                '<div class="mirror-messages" id="mirrorMessages"></div>' +
                '<div class="mirror-input-area">' +
                    '<input class="mirror-input" type="text" placeholder="Ask Mirror anything..." autocomplete="off">' +
                    '<button class="mirror-send" aria-label="Send">' +
                        '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>' +
                    '</button>' +
                '</div>' +
                '<button class="mirror-back-btn" id="mirrorBack">← Back to Quick Actions</button>' +
            '</div>';

        document.body.appendChild(panel);
        els.panel = panel;
        els.home = panel.querySelector('#mirrorHome');
        els.chat = panel.querySelector('#mirrorChat');
        els.messages = panel.querySelector('#mirrorMessages');
        els.input = panel.querySelector('.mirror-input');
        els.send = panel.querySelector('.mirror-send');
        els.grid = panel.querySelector('#mirrorGrid');

        // Close button
        panel.querySelector('.mirror-btn-close').addEventListener('click', function () { togglePanel(); });

        // Back button
        panel.querySelector('#mirrorBack').addEventListener('click', function () { switchView('home'); });

        // Input handlers
        els.input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && els.input.value.trim()) {
                handleUserInput(els.input.value.trim());
                els.input.value = '';
            }
        });
        els.send.addEventListener('click', function () {
            if (els.input.value.trim()) {
                handleUserInput(els.input.value.trim());
                els.input.value = '';
            }
        });

        // Render quick action tiles
        renderQuickActions();
    }

    function renderQuickActions() {
        var html = '';
        for (var i = 0; i < QUICK_ACTIONS.length; i++) {
            var a = QUICK_ACTIONS[i];
            html += '<div class="mirror-action-tile" data-action-id="' + a.id + '" data-type="' + a.type + '">' +
                '<span class="mirror-action-icon">' + a.icon + '</span>' +
                '<span class="mirror-action-label">' + a.label + '</span>' +
            '</div>';
        }
        els.grid.innerHTML = html;

        // Bind clicks
        var tiles = els.grid.querySelectorAll('.mirror-action-tile');
        for (var j = 0; j < tiles.length; j++) {
            tiles[j].addEventListener('click', function () {
                var id = this.getAttribute('data-action-id');
                var action = null;
                for (var k = 0; k < QUICK_ACTIONS.length; k++) {
                    if (QUICK_ACTIONS[k].id === id) { action = QUICK_ACTIONS[k]; break; }
                }
                if (!action) return;

                trackEvent('mirror_quick_action', { action: id, page: getPageName() });

                if (action.type === 'link') {
                    window.open(action.url, '_blank');
                } else {
                    switchView('chat');
                    handleUserInput(action.text);
                }
            });
        }
    }

    // ============================================================
    // 10. UI CONTROLLER
    // ============================================================
    function togglePanel() {
        state.isOpen = !state.isOpen;
        els.panel.classList.toggle('open', state.isOpen);
        els.fab.classList.toggle('open', state.isOpen);
        document.body.classList.toggle('mirror-active', state.isOpen);

        // Remove badge on first open
        if (state.isOpen && !state.hasInteracted) {
            state.hasInteracted = true;
            els.fab.classList.add('interacted');
            var badge = els.fab.querySelector('.mirror-fab-badge');
            if (badge) badge.classList.remove('visible');
            saveState();
        }

        if (state.isOpen) {
            hideTooltip();
            scrollToBottom();
            if (state.view === 'chat') {
                setTimeout(function () { els.input.focus(); }, 350);
            }
            trackEvent('mirror_opened', { page: getPageName(), view: state.view });
        } else {
            trackEvent('mirror_closed', { messages: state.messages.length });
        }
    }

    function switchView(view) {
        state.view = view;
        if (view === 'home') {
            els.home.classList.remove('hidden');
            els.chat.classList.remove('active');
        } else {
            els.home.classList.add('hidden');
            els.chat.classList.add('active');
            // Render saved messages if returning to chat
            if (state.messages.length === 0) {
                addBotMessage("Hey! I'm Mirror, your BossFx AI guide. Ask me anything about forex, our courses, mentorship, or resources.", null, [
                    'How do I start forex?',
                    'Tell me about courses',
                    'Free resources',
                    'Mentorship options'
                ]);
            }
            setTimeout(function () {
                scrollToBottom();
                els.input.focus();
            }, 200);
        }
    }

    // ============================================================
    // 11. MESSAGE RENDERING
    // ============================================================
    function addBotMessage(text, ctas, prompts, skipAnim) {
        state.messages.push({ role: 'bot', text: text, ctas: ctas || null, prompts: prompts || null, time: Date.now() });
        saveState();
        renderMsg('bot', text, ctas, prompts, skipAnim);
    }

    function addUserMessage(text) {
        state.messages.push({ role: 'user', text: text, time: Date.now() });
        state.context.turns++;
        saveState();
        renderMsg('user', text);
    }

    function renderMsg(role, text, ctas, prompts, skipAnim) {
        var row = document.createElement('div');
        row.className = 'mirror-msg-row ' + role;
        if (skipAnim) row.classList.add('no-anim');

        // Avatar
        var avatar = document.createElement('div');
        avatar.className = 'mirror-msg-avatar';
        avatar.textContent = role === 'bot' ? 'M' : '👤';

        // Content
        var content = document.createElement('div');
        content.className = 'mirror-msg-content';

        var bubble = document.createElement('div');
        bubble.className = 'mirror-msg-bubble';
        bubble.innerHTML = text.replace(/\n/g, '<br>');
        content.appendChild(bubble);

        // CTAs
        if (ctas && ctas.length) {
            var ctaWrap = document.createElement('div');
            ctaWrap.className = 'mirror-msg-ctas';
            for (var c = 0; c < ctas.length; c++) {
                var btn = document.createElement('a');
                btn.className = 'mirror-msg-cta';
                btn.textContent = ctas[c].label;
                if (ctas[c].url) {
                    btn.href = ctas[c].url;
                    if (ctas[c].url.indexOf('http') === 0) btn.target = '_blank';
                    btn.rel = 'noopener';
                }
                ctaWrap.appendChild(btn);
            }
            content.appendChild(ctaWrap);
        }

        // Timestamp
        var time = document.createElement('div');
        time.className = 'mirror-msg-time';
        time.textContent = role === 'bot' ? 'Mirror · just now' : 'You · just now';
        content.appendChild(time);

        row.appendChild(avatar);
        row.appendChild(content);
        els.messages.appendChild(row);

        // Suggestion chips
        if (prompts && prompts.length) {
            var chipWrap = document.createElement('div');
            chipWrap.className = 'mirror-chips';
            chipWrap.style.marginLeft = '38px';
            for (var p = 0; p < prompts.length; p++) {
                (function (promptText) {
                    var chip = document.createElement('button');
                    chip.className = 'mirror-chip';
                    chip.textContent = promptText;
                    chip.addEventListener('click', function () {
                        if (chipWrap.parentNode) chipWrap.remove();
                        handleUserInput(promptText);
                    });
                    chipWrap.appendChild(chip);
                })(prompts[p]);
            }
            els.messages.appendChild(chipWrap);
        }

        scrollToBottom();
    }

    function renderLeadForm(promptText, source) {
        var form = document.createElement('div');
        form.className = 'mirror-lead-form';
        form.innerHTML =
            '<p>' + promptText + '</p>' +
            '<div class="mirror-lead-row">' +
                '<input class="mirror-lead-input" type="email" placeholder="Your email address">' +
                '<button class="mirror-lead-submit">Send</button>' +
            '</div>';

        var input = form.querySelector('.mirror-lead-input');
        var btn = form.querySelector('.mirror-lead-submit');

        function submit() {
            var email = input.value.trim();
            if (!email || email.indexOf('@') === -1) {
                input.style.borderColor = '#ef4444';
                return;
            }
            LeadCapture.capture(email, source);
            form.innerHTML = '<div class="mirror-lead-success">✅ You\'re in! Check your inbox soon.</div>';
            addBotMessage("Awesome — you're all set! We'll send that right over. Anything else I can help with?", null, [
                'Tell me about courses',
                'Join Telegram',
                'Explore mentorship'
            ]);
        }

        btn.addEventListener('click', submit);
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') submit();
        });

        els.messages.appendChild(form);
        scrollToBottom();
        setTimeout(function () { input.focus(); }, 200);
    }

    // Typing indicator
    function showTyping() {
        var row = document.createElement('div');
        row.className = 'mirror-typing';
        row.id = 'mirrorTyping';

        var avatar = document.createElement('div');
        avatar.className = 'mirror-msg-avatar';
        avatar.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        avatar.style.color = '#fff';
        avatar.textContent = 'M';

        var dots = document.createElement('div');
        dots.className = 'mirror-typing-dots';
        dots.innerHTML = '<span></span><span></span><span></span>';

        row.appendChild(avatar);
        row.appendChild(dots);
        els.messages.appendChild(row);
        scrollToBottom();
    }

    function removeTyping() {
        var t = document.getElementById('mirrorTyping');
        if (t) t.remove();
    }

    // ============================================================
    // 12. CONVERSATION HANDLER
    // ============================================================
    function handleUserInput(text) {
        if (state.view !== 'chat') switchView('chat');

        addUserMessage(text);
        showTyping();

        var delay = CFG.typingMin + Math.random() * (CFG.typingMax - CFG.typingMin);

        var context = {
            intent: state.context.intent,
            history: state.messages.slice(-10),
            page: getPageName()
        };

        AIService.getResponse(text, context, function (err, response) {
            setTimeout(function () {
                removeTyping();

                if (err || !response) {
                    addBotMessage(KB.fallback.text, null, KB.fallback.prompts);
                    return;
                }

                // Update intent context
                if (response.intent) {
                    state.context.intent = response.intent;
                }
                state.context.stage = response.matched ? 'exploring' : 'greeting';

                addBotMessage(response.text, response.ctas, response.prompts);

                // Check if we should prompt for email capture
                if (LeadCapture.shouldPrompt()) {
                    setTimeout(function () {
                        var reason = state.context.intent || 'general';
                        LeadCapture.show(reason);
                    }, 1500);
                }

                trackEvent('mirror_message', {
                    query: text.substring(0, 100),
                    matched: response.matched,
                    intent: response.intent || 'none'
                });
            }, delay);
        });
    }

    // ============================================================
    // 13. ADAPTIVE BEHAVIOR
    // ============================================================
    function initProactiveEngagement() {
        setTimeout(function () {
            if (!state.hasInteracted && !state.isOpen) {
                var page = getPageName();
                var tip = PROACTIVE_TIPS[page] || PROACTIVE_TIPS['default'];
                showTooltip(tip);
                showBadge('1');
            }
        }, CFG.idleTimeout);
    }

    function showTooltip(text) {
        if (!els.tooltip) return;
        els.tooltip.querySelector('.mirror-tooltip-text').textContent = text;
        els.tooltip.classList.add('visible');
    }

    function hideTooltip() {
        if (els.tooltip) els.tooltip.classList.remove('visible');
    }

    function showBadge(count) {
        var badge = els.fab.querySelector('.mirror-fab-badge');
        if (badge) {
            badge.textContent = count;
            badge.classList.add('visible');
        }
    }

    // ============================================================
    // 14. UTILITIES
    // ============================================================
    function scrollToBottom() {
        setTimeout(function () {
            if (els.messages) els.messages.scrollTop = els.messages.scrollHeight;
        }, 50);
    }

    function getPageName() {
        var path = window.location.pathname.replace(/\.html$/, '').replace(/^\//, '');
        if (!path || path === '' || path === 'index') return 'index';
        return path;
    }

    function getGreeting() {
        var page = getPageName();
        return PAGE_GREETINGS[page] || { title: 'Hey there!', sub: "I'm Mirror — your BossFx AI guide. What can I help with?" };
    }

    function getTelegramUrl() {
        return (BFX.config && BFX.config.socials && BFX.config.socials.telegram) || 'https://t.me/qD_fBeaziqE5YzU8';
    }

    function getEAUrl() {
        return (BFX.config && BFX.config.ea && BFX.config.ea.url) || 'https://www.mql5.com/en/market/product/174970';
    }

    function trackEvent(name, data) {
        if (BFX.analytics && BFX.analytics.track) {
            BFX.analytics.track(name, data || {});
        }
        // Also push to dataLayer for GA4
        if (window.dataLayer) {
            var evt = { event: name };
            if (data) {
                for (var key in data) {
                    if (data.hasOwnProperty(key)) evt[key] = data[key];
                }
            }
            window.dataLayer.push(evt);
        }
    }

    // ============================================================
    // 15. SESSION PERSISTENCE
    // ============================================================
    function saveState() {
        try {
            var toSave = {
                messages: state.messages.slice(-CFG.maxMessages),
                context: state.context,
                hasInteracted: state.hasInteracted,
                view: state.view
            };
            sessionStorage.setItem(CFG.sessionKey, JSON.stringify(toSave));
        } catch (e) { /* quota exceeded — ignore */ }
    }

    function loadState() {
        try {
            var saved = sessionStorage.getItem(CFG.sessionKey);
            if (saved) {
                var data = JSON.parse(saved);
                state.messages = data.messages || [];
                state.context = data.context || state.context;
                state.hasInteracted = data.hasInteracted || false;
                state.view = data.view || 'home';
            }

            // Migrate from old chatbot
            if (!saved) {
                var old = sessionStorage.getItem('bfx_chat');
                if (old) {
                    var oldData = JSON.parse(old);
                    if (oldData.length) {
                        state.messages = oldData;
                        state.hasInteracted = true;
                        state.view = 'chat';
                        sessionStorage.removeItem('bfx_chat');
                    }
                }
            }
        } catch (e) { /* corrupted data — start fresh */ }
    }

    // ============================================================
    // 16. INIT
    // ============================================================
    function init() {
        loadState();
        createDOM();

        // Restore messages if returning to chat
        if (state.messages.length > 0 && state.view === 'chat') {
            switchView('chat');
            for (var i = 0; i < state.messages.length; i++) {
                var m = state.messages[i];
                renderMsg(m.role, m.text, m.ctas, m.prompts, true);
            }
        }

        // Start proactive engagement
        initProactiveEngagement();

        trackEvent('mirror_loaded', { page: getPageName() });
    }

    // ============================================================
    // 17. PUBLIC API
    // ============================================================
    return {
        init: init,
        open: function () { if (!state.isOpen) togglePanel(); },
        close: function () { if (state.isOpen) togglePanel(); },
        switchView: switchView,
        getState: function () { return state; }
    };
})();

// Backward compatibility
BFX.chatbot = BFX.mirror;

// Auto-init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
        setTimeout(BFX.mirror.init, 1500);
    });
} else {
    setTimeout(BFX.mirror.init, 1500);
}
