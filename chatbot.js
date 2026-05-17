// ================================================================
// Mirror — BossFx AI Market Intelligence Assistant v3.0
// Premium fintech chatbot · Market intelligence · OpenAI-ready
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
                patterns: [/resource|download|free.*guide|checklist|template|starter.*pack|blueprint|toolkit/i],
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
                patterns: [/\bea\b|robot|automat|expert.*advisor|sma.*pro|mt5|metatrader|algo/i],
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
                patterns: [/price|cost|pay|afford|fee|subscription|how much|budget/i],
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
                patterns: [/who.*(?:is|are|founded)|founder|about.*(?:bossfx|academy|you)|timilehin|bossfx.*academy|story|behind.*bossfx/i],
                intent: null,
                text: "BossFx Academy was founded by <b>Timilehin 'BossFx' Shobande</b> — a forex trader and educator building Africa's most accessible trading education platform.\n\nOur mission: give every trader the structured education, tools, and community they need to succeed.\n\nWe've taught 5,200+ traders across Africa and beyond.",
                ctas: [
                    { label: '📖 Our Story', url: 'about.html' }
                ]
            },
            {
                id: 'support',
                patterns: [/contact|support|need.*help|email|reach|speak|human|real.*person|complaint|issue/i],
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
                intent: 'market',
                text: "XAU/USD (Gold) is one of the most volatile and tradeable instruments in forex.\n\nWhy traders love gold:\n• Strong trending moves during NY session\n• Responds well to technical analysis\n• Inversely correlated with USD strength\n• High R:R setups on 1H and 4H timeframes\n\nOur mentorship includes <b>live XAU/USD analysis calls</b>, and our Sunday webinar covers gold bias every week.",
                ctas: [
                    { label: '📊 Live Market Data', url: 'live.html' },
                    { label: '🎯 View Mentorship', url: 'mentorship.html' }
                ],
                followUp: ['Live gold analysis', 'Best time to trade gold?', 'Gold trading strategy']
            },
            {
                id: 'student-results',
                patterns: [/result|success|testimon|proof|review|funded.*trader|stud.*result|track.*record|case.*stud|outcome|graduate/i],
                intent: 'mentorship',
                text: "BossFx has helped traders across Africa and beyond develop <b>real, structured trading skills</b>.\n\nWhat students have achieved:\n• Transitioned from complete beginners to consistently profitable traders\n• Passed prop firm evaluations (FTMO, MyForexFunds, TFT)\n• Improved risk management and reduced emotional trading\n• Built automated trading workflows using our EA\n• Developed structured daily routines and trading plans\n\nOur focus is not hype or signals — it's building <b>disciplined, system-driven traders</b> who can sustain results long-term.",
                ctas: [
                    { label: '🎯 Start Mentorship', url: 'mentorship.html' },
                    { label: '💬 Join Community', url: getTelegramUrl() }
                ],
                followUp: ['How does mentorship work?', 'How long to see results?', 'Start learning free']
            },
            {
                id: 'trading-plan',
                patterns: [/trading.*plan|plan.*trade|rules|system.*creat|build.*strat|develop.*plan|create.*plan/i],
                intent: 'beginner',
                text: "A <b>trading plan</b> is the single most important document a trader can create. It eliminates 90% of emotional decisions.\n\nYour plan should include:\n• Markets and sessions you trade\n• Entry and exit criteria (specific, not vague)\n• Risk per trade (we recommend 1%)\n• Maximum daily loss limit (3%)\n• Weekly review process\n\nOur <b>Trading Plan Template</b> gives you the exact framework — just fill in your rules and follow them.",
                ctas: [
                    { label: '📋 Get Plan Template', url: 'community.html#resources' },
                    { label: '📚 Take Forex 101', url: 'courses.html' }
                ],
                followUp: ['How do I backtest my plan?', 'Risk management rules', 'Trading journal tips']
            },
            {
                id: 'journal',
                patterns: [/journal|log.*trade|record|track.*trade|review.*trade|trade.*diary/i],
                intent: 'beginner',
                text: "Trade journaling is how professionals <b>turn data into edge</b>.\n\nEvery trade journal entry should capture:\n• Pair, direction, timeframe\n• Entry reason (what setup?)\n• Risk:reward ratio\n• Outcome and P&L\n• Screenshot of the chart\n• What you learned\n\nAfter 30 trades, patterns emerge — your strengths, weaknesses, and best setups become crystal clear.\n\nOur <b>Trade Journal Sheet</b> makes this process simple.",
                ctas: [
                    { label: '📓 Get Journal Template', url: 'community.html#resources' }
                ],
                followUp: ['How often should I review?', 'Trading plan template', '30-Day Discipline Challenge']
            },
            {
                id: 'candlesticks',
                patterns: [/candle|doji|engulf|hammer|pin.*bar|wick|shooting.*star|morning.*star|evening.*star/i],
                intent: 'beginner',
                text: "Candlestick patterns are the foundation of <b>price action trading</b>.\n\nKey patterns every trader should master:\n• <b>Pin Bar</b> — rejection from a key level\n• <b>Engulfing</b> — strong momentum shift\n• <b>Doji</b> — indecision, watch for breakout\n• <b>Morning/Evening Star</b> — reversal confirmation\n\nThe key is not memorizing every pattern — it's understanding <b>what they tell you about supply and demand</b>.\n\nForex 101, Module 4 covers this in depth with real chart examples.",
                ctas: [
                    { label: '📚 Start Forex 101', url: 'courses.html' }
                ],
                followUp: ['What about support and resistance?', 'Smart money concepts', 'Best timeframes to use']
            },
            {
                id: 'smart-money',
                patterns: [/smart.*money|smc|order.*block|liquidity|inducement|bos|choch|breaker|fair.*value|fvg|imbalance/i],
                intent: 'beginner',
                text: "Smart Money Concepts (SMC) is a methodology that focuses on <b>how institutional traders move the market</b>.\n\nCore concepts:\n• <b>Order Blocks</b> — institutional entry zones\n• <b>Liquidity Sweeps</b> — stop hunts before real moves\n• <b>Break of Structure (BOS)</b> — trend continuation\n• <b>Change of Character (CHoCH)</b> — trend reversal\n• <b>Fair Value Gaps</b> — price imbalances to fill\n\nBossFx covers SMC in our advanced modules. The key is combining it with <b>proper risk management</b> — the concept alone won't make you profitable.",
                ctas: [
                    { label: '📚 Explore Courses', url: 'courses.html' },
                    { label: '🎯 Advanced Mentorship', url: 'mentorship.html' }
                ],
                followUp: ['How do I find order blocks?', 'Best timeframe for SMC?', 'Supply and demand zones']
            },
            {
                id: 'timeframe',
                patterns: [/time.*frame|h1|h4|m15|m5|daily.*chart|weekly.*chart|multi.*time|mtf|higher.*time|lower.*time/i],
                intent: 'beginner',
                text: "Choosing the right timeframe depends on your <b>trading style and schedule</b>.\n\nRecommended combinations:\n• <b>Swing trading:</b> Daily + 4H (best for beginners)\n• <b>Day trading:</b> 4H + 1H + 15M\n• <b>Scalping:</b> 1H + 15M + 5M (not for beginners)\n\nPro tip: Use the <b>higher timeframe for direction</b> and the <b>lower timeframe for entries</b>. This is called Multi-Timeframe Analysis (MTF) and it's covered in Forex 101, Module 7.",
                ctas: [
                    { label: '📚 Forex 101 Course', url: 'courses.html' }
                ],
                followUp: ['Best pairs for beginners?', 'When should I trade?', 'How many pairs to watch?']
            },
            {
                id: 'pairs',
                patterns: [/best.*pair|which.*pair|major.*pair|exotic|minor.*pair|pair.*trade|how.*many.*pair|currency.*pair/i],
                intent: 'beginner',
                text: "For beginners, we recommend focusing on <b>2-3 major pairs</b> maximum.\n\nBest pairs to start with:\n• <b>EUR/USD</b> — most liquid, tightest spreads, clean trends\n• <b>GBP/USD</b> — good volatility, strong London session moves\n• <b>XAU/USD</b> — popular for its trending behavior\n\nAvoid:\n• Exotic pairs (wide spreads, erratic moves)\n• Trading more than 3 pairs simultaneously (as a beginner)\n\nMaster one pair first. Then expand. Our Telegram community shares daily setups on all major pairs.",
                ctas: [
                    { label: '💬 Join Telegram', url: getTelegramUrl() },
                    { label: '📚 Start Learning', url: 'courses.html' }
                ],
                followUp: ['Tell me about gold trading', 'Best time to trade?', 'How much capital to start?']
            },
            {
                id: 'demo-practice',
                patterns: [/demo|practice|paper.*trad|simulat|virtual|fake.*money|test.*account/i],
                intent: 'beginner',
                text: "Demo trading is an <b>essential step</b> — skipping it is one of the biggest mistakes beginners make.\n\nOur recommendation:\n• Trade demo for at least <b>2-3 months</b> with a structured plan\n• Treat it like real money — same lot sizes, same rules\n• Journal every trade, just like you would live\n• Aim for <b>3 consecutive profitable weeks</b> before going live\n\nThe goal isn't to \"make money\" on demo — it's to <b>prove your system works</b> and build discipline.\n\nOur Beginner Consistency Challenge on the Live page is designed for exactly this.",
                ctas: [
                    { label: '🏆 Join Challenge', url: 'live.html#challenges' },
                    { label: '📚 Start Forex 101', url: 'courses.html' }
                ],
                followUp: ['How long before going live?', 'Minimum capital to start?', 'Which broker to use?']
            },
            {
                id: 'capital-deposit',
                patterns: [/minimum|deposit|capital.*start|how.*much.*need|broker|fund.*account|starting.*amount|account.*size|cent.*account/i],
                intent: 'beginner',
                text: "The honest answer: you can start with <b>as little as $50-100</b> on a cent account.\n\nBut here's the real framework:\n• <b>$50-100:</b> Cent account — learn execution with real money\n• <b>$200-500:</b> Standard micro lots — small but meaningful\n• <b>$1,000+:</b> Where proper risk management (1% = $10) becomes practical\n\nMore important than account size:\n• <b>Risk only what you can afford to lose</b>\n• Master demo first\n• Never deposit money you need for bills\n\nProp firms are an excellent alternative — trade $10K-$200K+ in firm capital after passing a challenge.",
                ctas: [
                    { label: '📥 Prop Firm Guide', url: 'community.html#resources' },
                    { label: '📚 Start Free Course', url: 'courses.html' }
                ],
                followUp: ['How do prop firms work?', 'Best broker for beginners?', 'Start on demo first']
            },
            {
                id: 'sessions-schedule',
                patterns: [/schedule|session.*time|london.*session|new.*york|best.*time.*trade|asia|sydney.*session|when.*trade|market.*hour|overlap/i],
                intent: 'beginner',
                text: "The forex market runs <b>24 hours, 5 days a week</b>, but not all hours are equal.\n\n<b>Major sessions (WAT/GMT+1):</b>\n• Sydney: 11PM - 8AM\n• Tokyo: 1AM - 10AM\n• London: 8AM - 5PM <b>(highest volume)</b>\n• New York: 1PM - 10PM\n\n<b>Best times to trade:</b>\n• <b>London open (8-11AM WAT)</b> — cleanest moves\n• <b>London-NY overlap (1-5PM WAT)</b> — maximum volatility\n• <b>Avoid</b> low-volume Asian session if you trade major pairs\n\nCheck our <b>Live page</b> for real-time session tracking.",
                ctas: [
                    { label: '📊 Live Sessions', url: 'live.html' }
                ],
                followUp: ['Best pairs for London session?', 'How many hours should I trade?', 'Gold trading hours']
            },
            {
                id: 'supply-demand',
                patterns: [/supply|demand|zone|level|support|resist|key.*level|structure|snr|flip.*zone/i],
                intent: 'beginner',
                text: "Supply and demand zones are where <b>institutional orders cluster</b>, causing price to react.\n\n<b>Key concepts:</b>\n• <b>Demand zone:</b> Where buyers overwhelmed sellers (look for bounces)\n• <b>Supply zone:</b> Where sellers overwhelmed buyers (look for rejections)\n• <b>Flip zones:</b> Old support becomes new resistance (and vice versa)\n\n<b>How to identify strong zones:</b>\n• Strong momentum move away from the zone\n• Zone hasn't been tested yet (fresh)\n• Aligned with higher timeframe direction\n\nThis is covered in depth in Forex 101, Modules 5-6.",
                ctas: [
                    { label: '📚 Forex 101', url: 'courses.html' }
                ],
                followUp: ['Smart money concepts', 'How to set stop loss at zones?', 'Multi-timeframe analysis']
            },
            {
                id: 'backtesting',
                patterns: [/backtest|test.*strategy|historical|replay|forward.*test|prove.*system|optimiz/i],
                intent: 'beginner',
                text: "Backtesting is how you <b>prove your strategy works before risking real money</b>.\n\nStep-by-step approach:\n<b>1.</b> Define clear entry/exit rules (written down)\n<b>2.</b> Go through <b>100+ historical trades</b> on your chosen pair\n<b>3.</b> Record every trade in your journal\n<b>4.</b> Calculate win rate, average R:R, and expectancy\n<b>5.</b> If profitable over 100 trades, move to <b>forward testing</b> (demo)\n\nA strategy that wins 45% of the time with 1:2 R:R is <b>highly profitable</b>. Most traders don't backtest — that's why most traders lose.",
                ctas: [
                    { label: '📓 Get Journal Template', url: 'community.html#resources' },
                    { label: '📚 Courses', url: 'courses.html' }
                ],
                followUp: ['How many backtests is enough?', 'Demo trading tips', 'Trading plan template']
            },
            {
                id: 'trading-styles',
                patterns: [/scalp|swing|day.*trad|position|style|intraday|hold.*time|long.*term|short.*term/i],
                intent: 'beginner',
                text: "There are 3 main trading styles — the best one depends on <b>your schedule and personality</b>.\n\n<b>Scalping</b> (5M-15M charts)\n• 5-20+ trades/day, small gains\n• Requires screen time and fast execution\n• NOT recommended for beginners\n\n<b>Day Trading</b> (15M-1H charts)\n• 1-5 trades/day, closed before sleep\n• Good balance of activity and analysis\n• Best for traders with 2-4 hours daily\n\n<b>Swing Trading</b> (4H-Daily charts)\n• 2-5 trades/week, held for days\n• Best for beginners and part-time traders\n• Less screen time, higher R:R setups\n\nWe recommend starting with <b>swing trading on the 4H chart</b>.",
                ctas: [
                    { label: '📚 Start Learning', url: 'courses.html' },
                    { label: '🎯 Get Mentorship', url: 'mentorship.html' }
                ],
                followUp: ['Best timeframe for day trading?', 'How many hours per day?', 'Which pairs for swing trading?']
            },
            {
                id: 'indicators',
                patterns: [/indicator|moving.*average|rsi|macd|bollinger|fibonacci|ema|sma|stochastic|atr|volume/i],
                intent: 'beginner',
                text: "Indicators are <b>tools, not strategies</b>. The best traders use them to <b>confirm</b>, not to generate signals blindly.\n\n<b>Most useful indicators:</b>\n• <b>EMA 50 & 200</b> — trend direction and dynamic S/R\n• <b>RSI</b> — overbought/oversold + divergence\n• <b>ATR</b> — volatility measurement for stop placement\n\n<b>Common mistake:</b> Using 5+ indicators at once. This creates \"analysis paralysis\" and conflicting signals.\n\nOur approach: <b>Price action first, indicators for confirmation</b>. Clean charts, clear decisions. This is covered in Forex 101, Module 5.",
                ctas: [
                    { label: '📚 Forex 101', url: 'courses.html' }
                ],
                followUp: ['Best indicators for beginners?', 'Price action vs indicators?', 'Smart money concepts']
            },
            {
                id: 'market-live',
                patterns: [/market.*today|live.*price|current.*rate|what.*is.*trad|price.*now|how.*is.*market|market.*update|market.*bias|daily.*bias/i],
                intent: 'market',
                text: null,
                _dynamic: true,
                ctas: [
                    { label: '📊 Live Dashboard', url: 'live.html' }
                ],
                followUp: ['Gold analysis', 'Economic events today', 'Crypto sentiment']
            },
            {
                id: 'crypto',
                patterns: [/crypto|bitcoin|btc|ethereum|eth|blockchain|defi|altcoin|binance/i],
                intent: 'market',
                text: "BossFx tracks major crypto alongside forex for <b>complete market awareness</b>.\n\nWe currently cover:\n• <b>BTC/USD</b> — Bitcoin, the market driver\n• <b>ETH/USD</b> — Ethereum, the altcoin benchmark\n\nCrypto markets are 24/7, highly volatile, and increasingly correlated with traditional risk assets.\n\nOur <b>Live Dashboard</b> shows real-time crypto sentiment alongside forex data, so you can see the full picture in one place.",
                ctas: [
                    { label: '📊 Live Dashboard', url: 'live.html' },
                    { label: '💬 Join Telegram', url: getTelegramUrl() }
                ],
                followUp: ['Bitcoin analysis', 'How does crypto affect forex?', 'Live market data']
            },
            {
                id: 'indices',
                patterns: [/us30|nas100|nasdaq|dow.*jones|index|indices|spx|sp500|stock.*market/i],
                intent: 'market',
                text: "Indices like US30 (Dow Jones) and NAS100 (Nasdaq) are powerful instruments for <b>trend-following traders</b>.\n\nWhy many forex traders also trade indices:\n• Strong trending behavior\n• Respond well to key economic data\n• Correlated with USD and risk sentiment\n• Excellent R:R during NY session\n\nOur Live Dashboard tracks <b>US30 and NAS100</b> alongside forex pairs for a complete market view.",
                ctas: [
                    { label: '📊 Live Dashboard', url: 'live.html' }
                ],
                followUp: ['How to trade US30?', 'Live market data', 'Best session for indices?']
            },
            {
                id: 'economic-events',
                patterns: [/econom|calendar|cpi|nfp|fomc|fed|interest.*rate|news.*trad|fundamental|gdp|pmi|inflation|unemployment/i],
                intent: 'market',
                text: "Economic events are the <b>catalysts</b> that drive major market moves.\n\n<b>High-impact events to watch:</b>\n• <b>NFP</b> (Non-Farm Payrolls) — first Friday monthly\n• <b>CPI</b> (Inflation data) — mid-month\n• <b>FOMC</b> (Fed decisions) — every 6 weeks\n• <b>GDP</b> — quarterly\n\n<b>Our approach:</b>\n• Avoid entering trades 30 min before high-impact news\n• Close or tighten stops on open positions\n• Wait for the dust to settle, then trade the reaction\n\nCheck our <b>Live Dashboard</b> for this week's key events.",
                ctas: [
                    { label: '📊 Economic Calendar', url: 'live.html' },
                    { label: '📚 Learn More', url: 'courses.html' }
                ],
                followUp: ['How to trade news events?', 'Live market bias', 'This week calendar']
            },
            {
                id: 'prop-ea',
                patterns: [/ea.*prop|prop.*ea|automat.*challenge|robot.*funded|ea.*ftmo|bot.*challenge/i],
                intent: 'ea',
                text: "Yes — our <b>SMA Pro Trend EA</b> is designed with prop firm rules in mind.\n\n<b>Prop-friendly features:</b>\n• Fixed <b>1% risk per trade</b> — stays within drawdown limits\n• Smart trailing stop — locks in profits\n• No martingale, no grid — clean execution\n• Works on EURUSD, GBPUSD, XAUUSD (1H timeframe)\n\n<b>Important:</b> Always check your prop firm's rules on EA usage. Most firms allow EAs as long as they don't exploit latency or use high-frequency strategies.\n\nMany BossFx traders use the EA alongside manual setups for a hybrid approach.",
                ctas: [
                    { label: '🤖 Get the EA', url: getEAUrl() },
                    { label: '📥 Prop Firm Guide', url: 'community.html#resources' }
                ],
                followUp: ['Which prop firm do you recommend?', 'EA performance details', 'How much does the EA cost?']
            },
            {
                id: 'greeting',
                patterns: [/^(hi|hello|hey|good\s*(morning|afternoon|evening)|sup|yo|what'?s\s*up|howdy)/i],
                intent: null,
                text: "Hey there! Welcome to BossFx.\n\nI'm <b>Mirror</b> — your AI trading guide. I can help you with:\n\n• Getting started with forex trading\n• Live market data and analysis\n• Course and mentorship recommendations\n• Free trading tools and resources\n• Prop firm strategies\n\nWhat would you like to explore?",
                followUp: ['How do I start forex?', 'Live market bias', 'Free resources', 'Mentorship options']
            },
            {
                id: 'thanks',
                patterns: [/^(thank|thanks|thx|cheers|appreciate|helpful|awesome|great|nice|cool|perfect)/i],
                intent: null,
                text: "You're welcome! Glad I could help.\n\nIf you need anything else — market insights, course info, or trading tips — I'm always here. Just ask!",
                followUp: ['Live market update', 'Explore courses', 'Join Telegram community']
            }
        ],
        fallback: {
            text: "Great question. Let me point you in the right direction — BossFx has resources for every stage of your trading journey. Tap any of these to get started:",
            prompts: ['How do I start forex?', 'Live market bias', 'Courses & learning paths', 'Free trading tools', 'Mentorship programs', 'Talk to our team']
        }
    };

    // ============================================================
    // 4. QUICK ACTIONS
    // ============================================================
    var QUICK_ACTIONS = [
        { id: 'start-forex',   icon: '📈', label: 'Start Forex',      type: 'message', text: 'How do I start trading forex?' },
        { id: 'market-bias',   icon: '📊', label: 'Market Bias',      type: 'message', text: 'What is the market bias today?' },
        { id: 'gold-analysis', icon: '🥇', label: 'Gold Analysis',    type: 'message', text: 'Give me a gold market update' },
        { id: 'econ-events',   icon: '📅', label: 'Economic Events',  type: 'message', text: 'What economic events are coming up?' },
        { id: 'mentorship',    icon: '🎯', label: 'Mentorship',       type: 'message', text: 'Tell me about mentorship options' },
        { id: 'prop-firm',     icon: '🏦', label: 'Prop Firm Help',   type: 'message', text: 'How do I pass a prop firm challenge?' },
        { id: 'telegram',      icon: '💬', label: 'Join Telegram',    type: 'link',    url: getTelegramUrl() },
        { id: 'support',       icon: '🤝', label: 'Support',          type: 'message', text: 'I need help with something' }
    ];

    // ============================================================
    // 5. PAGE-CONTEXTUAL GREETINGS
    // ============================================================
    var PAGE_GREETINGS = {
        'index':      { title: 'Welcome to BossFx!', sub: "I'm Mirror — your AI trading guide. How can I help you today?" },
        'courses':    { title: 'Looking for courses?', sub: "I can help you find the right learning path. What's your experience level?" },
        'mentorship': { title: 'Considering mentorship?', sub: 'I can explain our programs and help you decide which fits your goals.' },
        'live':       { title: 'Market Intelligence', sub: 'Ask me for live market bias, economic events, or asset analysis.' },
        'community':  { title: 'Welcome to the Hub!', sub: 'Need help finding a resource or joining the Telegram community?' },
        'contact':    { title: 'Need help?', sub: 'I can answer most questions instantly. Try me before filling out the form!' },
        'about':      { title: 'Hey there!', sub: 'Want to learn about BossFx Academy or Timilehin Shobande?' }
    };

    var PROACTIVE_TIPS = {
        'index':      'New to forex? I can help you get started in under 2 minutes.',
        'courses':    'Not sure which course is right? Ask me!',
        'mentorship': 'Want to know which mentorship tier fits your level?',
        'live':       'Want a live market bias update or upcoming economic events?',
        'community':  'Looking for a specific resource? I can point you to it.',
        'default':    'Hey! Need help with anything? Tap to chat.'
    };

    // ============================================================
    // 6. INTENT ENGINE
    // ============================================================
    function detectIntent(text, history) {
        var scores = { beginner: 0, mentorship: 0, ea: 0, propfirm: 0, webinar: 0, resource: 0, support: 0, market: 0 };

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
        if (page === 'live') { scores.market += 2; scores.webinar += 1; }
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

    // ============================================================
    // 7b. MARKET ENGINE — Real-time market data integration
    // ============================================================
    var MarketEngine = {
        cache: null,
        cacheTime: 0,
        TTL: 300000, // 5 minutes

        ASSETS: {
            'EURUSD': { name: 'EUR/USD', type: 'forex' },
            'GBPUSD': { name: 'GBP/USD', type: 'forex' },
            'USDJPY': { name: 'USD/JPY', type: 'forex' },
            'XAUUSD': { name: 'XAU/USD (Gold)', type: 'metal' },
            'US30':   { name: 'US30 (Dow Jones)', type: 'index' },
            'NAS100': { name: 'NAS100 (Nasdaq)', type: 'index' },
            'BTCUSD': { name: 'BTC/USD (Bitcoin)', type: 'crypto' },
            'ETHUSD': { name: 'ETH/USD (Ethereum)', type: 'crypto' }
        },

        fetch: function (callback) {
            var now = Date.now();
            if (MarketEngine.cache && (now - MarketEngine.cacheTime) < MarketEngine.TTL) {
                callback(null, MarketEngine.cache);
                return;
            }
            // Also check localStorage cache
            try {
                var stored = localStorage.getItem('bfx_market_data');
                if (stored) {
                    var parsed = JSON.parse(stored);
                    if (parsed._ts && (now - parsed._ts) < MarketEngine.TTL) {
                        MarketEngine.cache = parsed;
                        MarketEngine.cacheTime = parsed._ts;
                        callback(null, parsed);
                        return;
                    }
                }
            } catch (e) { /* ignore */ }

            // Fetch from API
            var xhr = new XMLHttpRequest();
            xhr.open('GET', '/api/market-data?type=all', true);
            xhr.timeout = 8000;
            xhr.onload = function () {
                if (xhr.status === 200) {
                    try {
                        var data = JSON.parse(xhr.responseText);
                        data._ts = Date.now();
                        MarketEngine.cache = data;
                        MarketEngine.cacheTime = data._ts;
                        try { localStorage.setItem('bfx_market_data', JSON.stringify(data)); } catch (e) {}
                        callback(null, data);
                    } catch (e) {
                        callback(e, null);
                    }
                } else {
                    callback(new Error('API error'), null);
                }
            };
            xhr.onerror = function () { callback(new Error('Network error'), null); };
            xhr.ontimeout = function () { callback(new Error('Timeout'), null); };
            xhr.send();
        },

        generateOverview: function (data) {
            if (!data || !data.prices) return null;
            var lines = ["Here's today's <b>market overview</b>:\n"];
            var prices = data.prices;
            var sentiment = data.sentiment || {};
            for (var sym in prices) {
                if (prices.hasOwnProperty(sym) && MarketEngine.ASSETS[sym]) {
                    var p = prices[sym];
                    var arrow = p.changePct >= 0 ? '🟢' : '🔴';
                    var dir = p.changePct >= 0 ? '+' : '';
                    var s = sentiment[sym] ? ' (' + sentiment[sym].bias + ')' : '';
                    lines.push(arrow + ' <b>' + MarketEngine.ASSETS[sym].name + '</b>: ' + p.price + ' ' + dir + p.changePct + '%' + s);
                }
            }
            if (data.calendar && data.calendar.length > 0) {
                lines.push('\n<b>Upcoming events:</b>');
                var evts = data.calendar.slice(0, 3);
                for (var e = 0; e < evts.length; e++) {
                    lines.push('📅 ' + evts[e].title + (evts[e].impact === 'high' ? ' (HIGH impact)' : ''));
                }
            }
            lines.push('\nData refreshes every 5 minutes. For the full dashboard, visit the <b>Live page</b>.');
            return lines.join('\n');
        },

        generateAssetAnalysis: function (data, assetKey) {
            if (!data || !data.prices || !data.prices[assetKey]) return null;
            var p = data.prices[assetKey];
            var info = MarketEngine.ASSETS[assetKey];
            var s = (data.sentiment && data.sentiment[assetKey]) ? data.sentiment[assetKey] : null;

            var dir = p.changePct >= 0 ? 'bullish' : 'bearish';
            var momentum = Math.abs(p.changePct);
            var strength = momentum > 1 ? 'strong' : momentum > 0.3 ? 'moderate' : 'mild';

            var lines = [];
            lines.push('<b>' + info.name + ' Analysis</b>\n');
            lines.push('Current price: <b>' + p.price + '</b>');
            lines.push('Change: ' + (p.changePct >= 0 ? '+' : '') + p.changePct + '% (' + (p.changePct >= 0 ? '+' : '') + p.change + ')');
            lines.push('Direction: ' + (p.changePct >= 0 ? '🟢' : '🔴') + ' <b>' + dir.charAt(0).toUpperCase() + dir.slice(1) + '</b> (' + strength + ' momentum)');
            if (s) {
                lines.push('Sentiment: ' + s.bias.charAt(0).toUpperCase() + s.bias.slice(1) + ' (' + s.confidence + '% confidence)');
            }

            // Contextual commentary
            var commentary = MarketEngine.getCommentary(assetKey, dir, strength, p);
            if (commentary) lines.push('\n' + commentary);

            return lines.join('\n');
        },

        getCommentary: function (asset, dir, strength, price) {
            var templates = {
                bullish: {
                    strong: [
                        'Strong buying pressure is evident. Look for continuation setups on pullbacks.',
                        'Bulls are firmly in control. Consider trailing stops on existing longs.',
                        'Momentum is building — watch for breakout above recent resistance.'
                    ],
                    moderate: [
                        'Buyers are stepping in but conviction is building. Wait for confirmation above key levels.',
                        'Gradual upside movement. Good conditions for trend-following entries.',
                        'Steady bullish flow — London/NY overlap could accelerate this move.'
                    ],
                    mild: [
                        'Slight bullish bias, but the market is range-bound. Wait for a cleaner setup.',
                        'Price is drifting higher but lacks momentum. Be selective with entries.',
                        'Mild bullish tone — could shift with upcoming economic data.'
                    ]
                },
                bearish: {
                    strong: [
                        'Sellers are dominant. Avoid catching falling knives — wait for structure shifts.',
                        'Strong bearish momentum. Short setups on retracements may offer good R:R.',
                        'Heavy selling pressure — key support levels are being tested.'
                    ],
                    moderate: [
                        'Bearish pressure is building. Watch for break below recent support.',
                        'Sellers are gaining ground. Risk management is critical on any long positions.',
                        'Moderate downside — could accelerate during high-impact news events.'
                    ],
                    mild: [
                        'Slight bearish bias, but the market lacks clear conviction.',
                        'Mild selling pressure — price is consolidating with a downward lean.',
                        'Marginal bearish tone — watch for a catalyst to drive direction.'
                    ]
                }
            };

            var pool = templates[dir] && templates[dir][strength] ? templates[dir][strength] : [];
            if (pool.length === 0) return null;
            return pool[Math.floor(Math.random() * pool.length)];
        },

        detectAsset: function (text) {
            var lower = text.toLowerCase();
            var map = {
                'eurusd': 'EURUSD', 'eur/usd': 'EURUSD', 'euro': 'EURUSD', 'eur usd': 'EURUSD',
                'gbpusd': 'GBPUSD', 'gbp/usd': 'GBPUSD', 'pound': 'GBPUSD', 'cable': 'GBPUSD', 'gbp usd': 'GBPUSD',
                'usdjpy': 'USDJPY', 'usd/jpy': 'USDJPY', 'yen': 'USDJPY', 'usd jpy': 'USDJPY',
                'xauusd': 'XAUUSD', 'xau/usd': 'XAUUSD', 'gold': 'XAUUSD', 'xau': 'XAUUSD',
                'us30': 'US30', 'dow': 'US30', 'dow jones': 'US30',
                'nas100': 'NAS100', 'nasdaq': 'NAS100', 'nas 100': 'NAS100',
                'btcusd': 'BTCUSD', 'btc': 'BTCUSD', 'bitcoin': 'BTCUSD',
                'ethusd': 'ETHUSD', 'eth': 'ETHUSD', 'ethereum': 'ETHUSD'
            };
            for (var key in map) {
                if (lower.indexOf(key) !== -1) return map[key];
            }
            return null;
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

            // Dynamic market data responses
            if (match && match._dynamic) {
                var asset = MarketEngine.detectAsset(text);
                MarketEngine.fetch(function (err, data) {
                    if (err || !data) {
                        callback(null, {
                            text: "Markets are updating right now. In the meantime, check the <b>Live Dashboard</b> for the latest prices, sentiment, and economic calendar.",
                            ctas: [{ label: '📊 Live Dashboard', url: 'live.html' }],
                            prompts: ['Try again in a moment', 'Upcoming economic events', 'Trading tips'],
                            intent: 'market',
                            matched: true
                        });
                        return;
                    }
                    var responseText;
                    if (asset) {
                        responseText = MarketEngine.generateAssetAnalysis(data, asset);
                    }
                    if (!responseText) {
                        responseText = MarketEngine.generateOverview(data);
                    }
                    if (!responseText) {
                        responseText = "Markets are active. Visit the <b>Live Dashboard</b> for real-time data.";
                    }
                    callback(null, {
                        text: responseText,
                        ctas: match.ctas || [{ label: '📊 Live Dashboard', url: 'live.html' }],
                        prompts: match.followUp || ['Gold analysis', 'Bitcoin update', 'Economic calendar'],
                        intent: 'market',
                        matched: true
                    });
                });
                trackEvent('mirror_market_query', { asset: asset || 'overview', query: text.substring(0, 60) });
                return;
            }

            // Check for asset-specific queries even without KB match
            var assetFromText = MarketEngine.detectAsset(text);
            if (assetFromText && (!match || match.intent === 'market')) {
                MarketEngine.fetch(function (err, data) {
                    if (err || !data) {
                        // Fall through to normal KB match
                        if (match) {
                            callback(null, { text: match.text, ctas: match.ctas || [], prompts: match.followUp || [], intent: match.intent, matched: true });
                        } else {
                            callback(null, { text: KB.fallback.text, ctas: [], prompts: KB.fallback.prompts, intent: intent ? intent.primary : null, matched: false });
                        }
                        return;
                    }
                    var analysis = MarketEngine.generateAssetAnalysis(data, assetFromText);
                    if (analysis) {
                        callback(null, {
                            text: analysis,
                            ctas: [{ label: '📊 Live Dashboard', url: 'live.html' }],
                            prompts: ['Full market overview', 'Economic events', 'More analysis'],
                            intent: 'market',
                            matched: true
                        });
                    } else if (match) {
                        callback(null, { text: match.text, ctas: match.ctas || [], prompts: match.followUp || [], intent: match.intent, matched: true });
                    } else {
                        callback(null, { text: KB.fallback.text, ctas: [], prompts: KB.fallback.prompts, intent: intent ? intent.primary : null, matched: false });
                    }
                });
                trackEvent('mirror_market_query', { asset: assetFromText, query: text.substring(0, 60) });
                return;
            }

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
