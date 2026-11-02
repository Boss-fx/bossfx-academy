// ================================================================
// BFX.learn — Student area (auth + course progress + entitlement)
// Client-side Supabase via BFX.auth. Progress in `lesson_progress`
// and paid access in `enrollments` — both RLS-gated per user.
// Forex 101 = free intro (modules 01-03) + paid full (04-12).
// No serverless functions used on the read path.
// ================================================================
var BFX = window.BFX || {};

BFX.learn = (function () {
    'use strict';

    // Course catalog — Forex 101's 12 modules mirror courses.html
    // (the public curriculum). `free:true` = open to any signed-in
    // student; the rest unlock with an active `forex-101` enrollment.
    // `video` holds a YouTube video ID (unlisted) once uploaded.
    var COURSES = {
        'forex-101': {
            title: 'Forex 101 — The Trader\'s Bible',
            blurb: 'Your 12-module foundation, from market basics to a complete trading plan.',
            priceNGN: 25000,
            enrollUrl: '/courses.html#forex101',
            freeCount: 2,
            lessons: [
                { id: 'module-01', n: '01', title: 'Introduction to Forex', blurb: 'What forex is, how it works, and why it matters', video: '/media/lessons/module-01.mp4', free: true,
                  summary: "Forex is the global marketplace where currencies are traded in pairs — the largest, most liquid market on earth, with over $7 trillion changing hands daily. You profit from changes in the exchange rate, and with the right education and risk management you can trade it from anywhere, including right here in Africa.",
                  keyPoints: ["Forex means trading one currency against another — always in pairs", "It's the biggest, most liquid market in the world, open 24 hours, 5 days a week", "Your profit or loss comes from the change in the exchange rate", "Sessions follow the sun: Sydney → Tokyo → London → New York", "Forex is a skill, not a shortcut — master the fundamentals first"] },
                { id: 'module-02', n: '02', title: 'Currency Pairs & Quotes', blurb: 'Understanding majors, minors, and exotics', video: '/media/lessons/module-02.mp4', free: true,
                  summary: "Every pair has a base currency and a quote currency; the price tells you how much of the quote it takes to buy one unit of the base. Pairs split into majors, minors and exotics, and every quote has a bid, an ask and a spread — with movement measured in pips.",
                  keyPoints: ["First currency = base, second = quote (e.g. EUR/USD)", "Majors (all involve the US Dollar) are the most liquid with the tightest spreads", "Minors/crosses have no Dollar; exotics carry higher risk and cost", "Bid = the price you sell at, Ask = the price you buy at; the gap is the spread", "A pip is the standard unit for measuring profit, loss and risk"] },
                { id: 'module-03', n: '03', title: 'Market Structure 101', blurb: 'How price moves and market phases', video: '/media/lessons/module-03.mp4', free: false,
                  summary: "Price moves in waves of highs and lows, and reading those swings tells you who is in control. A market is trending up, trending down, or ranging — and a 'break of structure' is an early clue the trend may be reversing.",
                  keyPoints: ["Price moves in waves, not straight lines", "Uptrend = higher highs and higher lows (buyers in control)", "Downtrend = lower highs and lower lows (sellers in control)", "Range = sideways between clear support and resistance", "A break of structure warns the trend may be ending or reversing", "Read structure first, then trade with it — never against it"] },
                { id: 'module-04', n: '04', title: 'Market Sessions & Volatility', blurb: 'Trading the right sessions at the right time', video: '/media/lessons/module-04.mp4', free: false,
                  summary: "The market runs 24/5 across four sessions, but not every hour is worth trading. The London–New York overlap (afternoon in West Africa) is the most active window. Match your strategy to the volatility of the session you trade.",
                  keyPoints: ["Four sessions follow the sun; each has different volatility", "London is the most liquid; the London–New York overlap has the biggest moves", "That overlap falls conveniently in the West African afternoon/evening", "Don't trade a quiet Asian range with a London breakout strategy", "Pick 2–3 hours that fit your life and learn how they behave"] },
                { id: 'module-05', n: '05', title: 'Risk Management', blurb: 'Protect your capital — the #1 rule', video: '/media/lessons/module-05.mp4', free: false,
                  summary: "Risk management — not strategy — decides who survives. Risk only 1–2% of your account per trade, place your stop where your idea is proven wrong, size your position so a loss stays within that risk, and always aim for at least 1:2 reward-to-risk.",
                  keyPoints: ["Never risk more than 1–2% of your account on a single trade", "Your stop-loss goes where your trade idea is proven wrong", "Size your lot so a stop-out only costs your planned risk", "Use the free Position Size Calculator to do the maths for you", "Aim for 1:2+ reward-to-risk — then you can lose most trades and still profit"] },
                { id: 'module-06', n: '06', title: 'Trading Psychology', blurb: 'Master your mindset and emotions', video: '/media/lessons/module-06.mp4', free: false,
                  summary: "Most traders fail on psychology, not strategy. Fear, greed, hope and revenge quietly destroy accounts. The fix isn't to be emotionless — it's to decide your entry, stop and target in advance, risk only what you can afford, and journal every trade.",
                  keyPoints: ["Most losses come from mindset, not a bad system", "The four account-killers: fear, greed, hope and revenge", "Decide entry, stop and target BEFORE you enter — then follow them", "Risk small enough that no single loss can rattle you", "Journaling builds the self-awareness that beats emotional trading"] },
                { id: 'module-07', n: '07', title: 'Technical Analysis Foundations', blurb: 'Reading charts like a professional', video: '/media/lessons/module-07.mp4', free: false,
                  summary: "Technical analysis is reading price to make probability-based decisions. Start with candles and timeframes, work top-down (higher timeframe for direction, lower for entry), trade with the trend, and use indicators to confirm — never to predict.",
                  keyPoints: ["Each candle shows the open, close, high and low for its period", "Check the higher timeframe first for direction, then drop down to time entries", "Trade with the trend, not against it", "Indicators like MA and RSI describe what price is doing — they don't predict", "Never take a trade on an indicator alone"] },
                { id: 'module-08', n: '08', title: 'Candlestick Patterns', blurb: 'Price action and pattern recognition', video: '/media/lessons/module-08.mp4', free: false,
                  summary: "Candlesticks map the battle between buyers and sellers. The doji signals indecision, the pin bar/hammer signals rejection, and engulfing candles signal a shift in control — and they matter most when they appear at a key level.",
                  keyPoints: ["Doji = indecision; the trend may pause or turn", "Pin bar / hammer = a long wick rejecting price", "Bullish/bearish engulfing = one side has taken control", "A pattern in the middle of nowhere is just noise", "Pattern + location (at support or resistance) is where the edge lives"] },
                { id: 'module-09', n: '09', title: 'Support & Resistance', blurb: 'Key levels and zones that matter', video: '/media/lessons/module-09.mp4', free: false,
                  summary: "Support is a floor where buyers step in; resistance is a ceiling where sellers take over. Draw them where price reversed at least twice, treat them as zones, and remember broken levels flip roles. Combine a level with a candle signal to trade it.",
                  keyPoints: ["Support = floor (buyers step in); Resistance = ceiling (sellers take over)", "Draw a level where price reversed at least twice", "Think in zones, not razor-thin lines", "Broken resistance becomes support — and broken support becomes resistance", "Level + candlestick signal = a high-probability entry"] },
                { id: 'module-10', n: '10', title: 'Trading Strategies', blurb: 'Fibonacci, moving averages, and intraday setups', video: '', free: false,
                  summary: "Combine your skills into repeatable setups: the moving-average trend strategy, Fibonacci retracements (the 50%–61.8% pullback zone), and the intraday session breakout. Every strong setup stacks confluence — trend, level and signal agreeing. Master one before adding more.",
                  keyPoints: ["A moving-average cross shows momentum shifting; use the MA as dynamic support", "Fibonacci 50% and 61.8% mark the high-quality pullback entry zone", "Session breakout: trade the London break of the Asian range with the trend", "Confluence (trend + level + signal) beats any single indicator", "Pick one strategy and master it before touching the rest"] },
                { id: 'module-11', n: '11', title: 'Building Your Trading Plan', blurb: 'Your personal roadmap to execution', video: '/media/lessons/module-11.mp4', free: false,
                  summary: "A trading plan is your personal rulebook that removes guesswork and emotion. It defines your markets and sessions, your exact strategy, your risk rules, your trade management and your review routine. Write it down, keep it to one page, and read it before every session.",
                  keyPoints: ["A plan in your head is a wish — write it down", "Cover: markets/sessions, strategy, risk rules, trade management, review routine", "Every decision is made in advance, while you're calm", "Keep it to one page and read it before each session", "Consistency comes from following rules, not feelings"] },
                { id: 'module-12', n: '12', title: 'Live Trading & Journaling', blurb: 'Execute, track, and improve every trade', video: '', free: false,
                  summary: "Put it all together: check the higher-timeframe trend, wait for price at a key level, take the signal, set entry/stop/target at 1:2, size to 1% risk, then let the trade run your plan. A trade isn't finished until it's journaled — that's what builds a real edge.",
                  keyPoints: ["Top-down: trend first, then a level, then a signal", "No level, no trade — wait for your setup", "Enter with stop and target set (1:2), risking only 1%", "Once you're in, do nothing — follow the plan, don't fear-manage", "Journal every trade: pair, reason, screenshot and how you felt", "Your journal turns random trades into a repeatable edge"] }
            ]
        },

        // ---- Next-level courses (launching 2027) ----
        // `status:'upcoming'` → not yet for sale: the free intro module is a
        // readable teaser, the rest stay locked behind the waitlist (no video
        // yet). Drop a `video` path/ID into a module and it goes live instantly.
        'advanced-price-action': {
            title: 'Advanced Price Action — Trade Like the Institutions',
            blurb: 'Read raw price the way the banks do — order blocks, liquidity, fair value gaps and live chart mark-ups.',
            priceNGN: 45000,
            enrollUrl: '/courses.html#advanced-price-action',
            freeCount: 1,
            lessons: [
                { id: 'module-01', n: '01', title: 'Beyond Indicators: Reading Raw Price', blurb: 'Why price itself beats every lagging indicator', video: '/media/lessons/advanced-price-action/module-01.mp4', poster: '/media/thumbs/advanced-price-action-module-01.jpg', free: true,
                  summary: "Indicators lag because they're built from past price. Advanced price action skips the middle-man and reads what price itself is telling you — where big money entered, where the crowd got trapped, and where price is drawn next. This module resets how you see a chart.",
                  keyPoints: ["Every indicator is just a formula on past price — price action reads the source", "Institutions can't hide: their size leaves a footprint on the chart", "You're learning to read intent, not to predict with certainty", "Clean charts beat cluttered ones — strip indicators, see structure", "This course builds on Forex 101 — master structure and risk first"] },
                { id: 'module-02', n: '02', title: 'The Anatomy of an Institutional Move', blurb: 'Accumulation, expansion and distribution', video: '', free: false,
                  summary: "Big players don't buy all at once — they accumulate quietly, push price, then distribute into the crowd. Learn the three phases of an institutional move and the candle signatures that mark each one, so you stop reacting late and start reading the move as it builds.",
                  keyPoints: ["Price moves in three phases: accumulation, expansion, distribution", "Displacement (momentum) candles mark where big money stepped in", "Slow, overlapping candles = accumulation; wide, one-sided = intent", "The crowd buys the top of expansion — you want the origin", "Mark the move's origin; that's the level price tends to return to"] },
                { id: 'module-03', n: '03', title: 'Order Blocks & Institutional Footprints', blurb: 'The exact zones where banks load positions', video: '', free: false,
                  summary: "An order block is the last opposing candle before a strong move — the footprint of where institutions loaded their positions. Price often returns to that zone to fill remaining orders, giving you a precise, repeatable entry with tight risk.",
                  keyPoints: ["An order block = the last down-candle before a strong up-move (and vice-versa)", "It marks unfilled institutional orders price tends to return to", "A valid order block is created by displacement away from it", "Mark the zone (open-to-wick), not a single line", "Enter on the return to the block; stop beyond it — tight risk, big reward"] },
                { id: 'module-04', n: '04', title: 'Liquidity: Pools, Sweeps & Stop Hunts', blurb: 'Why your stop keeps getting hit — and how to use it', video: '', free: false,
                  summary: "The market hunts liquidity — the clustered stop-losses sitting above highs and below lows. Big money drives price into those pools to fill large orders, then reverses. Once you see liquidity, the 'random' stop-outs stop looking random.",
                  keyPoints: ["Liquidity sits where stops cluster: above old highs, below old lows", "A sweep (stop hunt) spikes through a level, then snaps back", "That snap-back is institutions filling against trapped traders", "Don't put your stop where everyone else does — it's a target", "A sweep into an order block is one of the highest-probability setups"] },
                { id: 'module-05', n: '05', title: 'Fair Value Gaps & Imbalance', blurb: 'The gaps the crowd never sees', video: '', free: false,
                  summary: "When price moves so fast it leaves a gap between candles, it creates an imbalance — a 'fair value gap' the market often returns to rebalance before continuing. FVGs hand you entries and targets most traders never notice.",
                  keyPoints: ["An FVG is a 3-candle gap left by a fast, one-sided move (imbalance)", "Price tends to retrace to fill the gap, then continue the move", "An unfilled FVG acts as a magnet and a target", "FVG + order block in the same zone = strong confluence", "Not every gap fills — pair it with structure, never trade it alone"] },
                { id: 'module-06', n: '06', title: 'Reading the Chart Like the Institutions', blurb: 'The top-down, multi-timeframe read', video: '', free: false,
                  summary: "Pull it together across timeframes: the higher timeframe tells the story and the draw on liquidity, the lower timeframe times your entry. This is the top-down read that turns isolated concepts into one clear, tradeable bias.",
                  keyPoints: ["Higher timeframe sets direction and the next liquidity target", "Drop down to find the order block or FVG that times your entry", "Trade toward liquidity, with the higher-timeframe story", "If timeframes disagree, the higher timeframe wins", "One clear narrative per pair — if you can't explain it simply, skip it"] },
                { id: 'module-07', n: '07', title: 'Live Chart Mark-Ups with BossFx', blurb: 'The whole method applied to real charts', video: '', free: false,
                  summary: "Watch the entire method applied to live charts, step by step: mark structure, spot the liquidity, find the order block or FVG, and plan the trade before it happens. This is where theory becomes a repeatable routine.",
                  keyPoints: ["See the exact mark-up routine on real, recent charts", "Structure first, then liquidity, then entry zone — always in that order", "Plan the trade fully before entering: entry, stop, target", "Watch how invalid setups are filtered out, not forced", "Screenshot your own mark-ups and compare to the walkthroughs"] },
                { id: 'module-08', n: '08', title: 'The Advanced Price Action Playbook', blurb: 'Your written, repeatable A+ setup', video: '', free: false,
                  summary: "Turn the concepts into a written playbook: the exact conditions for your A+ setup, how you size and manage it, and how you review it. A method you can't write down is a method you can't repeat.",
                  keyPoints: ["Define your A+ setup in writing: structure + liquidity + entry zone", "Pre-set entry, stop and target before the session — no improvising", "Risk 1% until the method is proven on your own journal", "Backtest 30–50 setups before trading it live", "Review weekly: what you followed, what you forced, what to cut"] }
            ]
        },

        'smart-money-concepts': {
            title: 'Smart Money Concepts — Trade With the Big Players',
            blurb: 'Understand how institutions engineer price — market-maker models, BOS & CHoCH, premium/discount, and smart-money entries.',
            priceNGN: 45000,
            enrollUrl: '/courses.html#smart-money-concepts',
            freeCount: 1,
            lessons: [
                { id: 'module-01', n: '01', title: 'How the Big Players Move Price', blurb: 'The game behind the candles', video: '/media/lessons/smart-money-concepts/module-01.mp4', poster: '/media/thumbs/smart-money-concepts-module-01.jpg', free: true,
                  summary: "Retail traders react to price; smart money creates it. This module reframes the market as a game of engineered moves, where institutions fill huge orders by trading against the crowd. Once you see the game, you stop being the exit liquidity.",
                  keyPoints: ["'Smart money' = banks and institutions big enough to move price", "They need the crowd on the wrong side to fill their size", "Many retail habits (chasing breakouts) exist to be exploited", "SMC is a lens on structure and liquidity — not magic", "Build on Forex 101 structure; SMC refines it, doesn't replace it"] },
                { id: 'module-02', n: '02', title: 'The Market-Maker Model & Manipulation', blurb: 'Accumulate, trap, expand', video: '', free: false,
                  summary: "The market-maker model describes the cycle institutions repeat: accumulate a position quietly, manipulate price to trap the crowd, then expand toward their real target. Learn the cycle and you anticipate the fake-out instead of falling for it.",
                  keyPoints: ["The cycle: accumulation → manipulation → distribution/expansion", "Manipulation is the fake move that traps breakout traders", "The real move usually comes AFTER the trap, the opposite way", "The 'Judas swing': an early false push before the true move", "Patience through the manipulation is the whole edge"] },
                { id: 'module-03', n: '03', title: 'Break of Structure & Change of Character', blurb: 'Telling continuation from reversal', video: '', free: false,
                  summary: "BOS confirms a trend is continuing; CHoCH is the first warning it's turning. Telling them apart — and knowing which swing points actually matter — is how you stay with smart money instead of fighting it.",
                  keyPoints: ["Break of Structure (BOS) = continuation: a new high/low in trend", "Change of Character (CHoCH) = the first break against the trend", "CHoCH is an early reversal signal; BOS is a continuation signal", "Mark only meaningful swing highs/lows, not every wiggle", "Wait for confirmation — one break isn't always the turn"] },
                { id: 'module-04', n: '04', title: 'Premium vs Discount Zones', blurb: 'Buy cheap, sell expensive — like the banks', video: '', free: false,
                  summary: "Smart money buys cheap and sells expensive. Split any range in half: the upper half is 'premium' (look to sell), the lower half is 'discount' (look to buy). Entering from the right side of the range is half the battle.",
                  keyPoints: ["Draw the dealing range from a key swing low to swing high", "Above the 50% = premium (sell zone); below = discount (buy zone)", "Buy in discount, sell in premium — never chase the middle", "The 'equilibrium' (50%) is a decision point, not an entry", "Combine premium/discount with an order block for precision"] },
                { id: 'module-05', n: '05', title: 'Mapping Liquidity & the Draw on Liquidity', blurb: 'Where price is really headed', video: '', free: false,
                  summary: "Every move has a destination: the next pool of liquidity. Buy-side liquidity sits above highs, sell-side below lows. Identify where the liquidity rests and you've found where price is most likely to be drawn next.",
                  keyPoints: ["Buy-side liquidity = stops above highs; sell-side = stops below lows", "Price is 'drawn' toward the nearest meaningful liquidity", "Equal highs/lows are magnets — they get swept", "Ask 'where's the liquidity?' before every trade", "Target the opposing liquidity as your take-profit"] },
                { id: 'module-06', n: '06', title: 'Entries That Follow the Smart Money', blurb: 'The full SMC entry sequence', video: '', free: false,
                  summary: "Bring the model to an entry: higher-timeframe bias, a liquidity sweep, a change of character, then an order block or FVG entry inside discount or premium. This is the SMC entry sequence, step by step.",
                  keyPoints: ["Start with HTF bias and the draw on liquidity", "Wait for a liquidity sweep against the crowd", "Confirm with a CHoCH on the lower timeframe", "Enter at the order block / FVG inside premium or discount", "Stop beyond the sweep; target opposing liquidity (1:3+ common)"] },
                { id: 'module-07', n: '07', title: 'The Smart Money Trade Narrative', blurb: 'Case studies that train your eye', video: '', free: false,
                  summary: "Walk through complete trades as stories: what the institutions were likely doing, where the trap was set, and how the setup resolved. Case studies train your eye to build the narrative yourself, live.",
                  keyPoints: ["Every A+ trade has a one-sentence narrative — learn to tell it", "Case studies connect sweep → CHoCH → entry → target", "Hindsight is a teacher: review how each move actually paid out", "Spot the trap first; the entry follows naturally", "If you can't narrate the trade, you don't have the trade"] },
                { id: 'module-08', n: '08', title: 'Your Smart Money Trading System', blurb: 'A tested checklist you can trust', video: '', free: false,
                  summary: "Assemble a personal SMC system: your timeframes, your checklist, your risk rules and your review loop — then backtest it until it's yours. A system you've tested is a system you can trust under pressure.",
                  keyPoints: ["Write a fixed checklist: bias, sweep, CHoCH, zone, risk", "Pick 2–3 pairs and 2 timeframes — depth over breadth", "Risk 1% and demand 1:2+ before any entry", "Backtest 50+ setups and log them before going live", "Review weekly; cut the setups that don't fit the model"] }
            ]
        },

        'trading-psychology': {
            title: 'Trading Psychology Deep Dive — Master the Mental Game',
            blurb: 'The mindset that decides who survives — beat fear, greed and revenge, build discipline, and journal like a pro.',
            priceNGN: 35000,
            enrollUrl: '/courses.html#trading-psychology',
            freeCount: 1,
            lessons: [
                { id: 'module-01', n: '01', title: 'The Mental Game That Decides Everything', blurb: 'Why mindset, not strategy, is the edge', video: '/media/lessons/trading-psychology/module-01.mp4', poster: '/media/thumbs/trading-psychology-module-01.jpg', free: true,
                  summary: "Two traders can follow the same strategy and get opposite results — the difference is between the ears. This module makes the case that psychology, not strategy, is the real edge, and sets up the work of building a professional mindset.",
                  keyPoints: ["The same system wins or loses depending on who's trading it", "Discipline, patience and emotional control are trainable skills", "Your biggest opponent in the market is yourself", "An edge means nothing if you can't execute it calmly", "Mindset work compounds — small habits, big results over time"] },
                { id: 'module-02', n: '02', title: 'Fear, Greed & Revenge Trading', blurb: 'The three account-killers and their tells', video: '', free: false,
                  summary: "The three account-killers each have a tell and a trigger. Fear makes you cut winners and skip valid trades; greed makes you over-risk and overstay; revenge makes you force trades to 'win back' a loss. Naming them is the first step to defusing them.",
                  keyPoints: ["Fear: skipping valid setups, cutting winners, panic-moving stops", "Greed: over-leveraging, no exit plan, chasing 'one more' trade", "Revenge: forcing trades right after a loss to get even", "Emotions aren't the enemy — acting on them unplanned is", "A pre-set plan is what stops emotion from trading your account"] },
                { id: 'module-03', n: '03', title: 'Building Unshakeable Discipline', blurb: 'Discipline is a system, not willpower', video: '', free: false,
                  summary: "Discipline isn't willpower — it's systems. When your rules are written, your risk is small, and your process is a routine, doing the right thing stops requiring heroic self-control. This module builds the scaffolding that makes discipline the default.",
                  keyPoints: ["Discipline is a system, not a feeling — remove the live decision", "Written rules beat good intentions every time", "Small, fixed risk makes it easy to follow the plan", "Habits and checklists carry you when motivation dips", "One rule at a time — stack small wins into consistency"] },
                { id: 'module-04', n: '04', title: 'The Routines & Rules of Elite Traders', blurb: 'Win with boring consistency', video: '', free: false,
                  summary: "Professionals win with boring consistency: the same pre-market prep, the same session routine, the same post-market review. Learn to build a daily structure that keeps you calm, focused and out of low-quality trades.",
                  keyPoints: ["Pre-market: bias, levels, news and a clear plan before you trade", "During: follow the checklist, trade only your setups", "Post-market: journal and score how well you followed the plan", "Fixed session hours protect you from boredom trades", "Rules about when NOT to trade matter as much as entries"] },
                { id: 'module-05', n: '05', title: 'Handling Losses, Drawdown & Tilt', blurb: 'Respond like a pro, not a gambler', video: '', free: false,
                  summary: "Losses are a cost of doing business and drawdown is unavoidable. What separates pros is how they respond — stepping away before tilt, protecting capital, and treating a losing streak as data, not a verdict on their worth.",
                  keyPoints: ["A loss is a business expense, not a personal failure", "Drawdowns are normal — plan for them before they happen", "Tilt is the real danger; step away after back-to-back losses", "Reduce size when you're off; scale up only when consistent", "Judge yourself on process followed, not on any single result"] },
                { id: 'module-06', n: '06', title: 'Confidence, Patience & Emotional Detachment', blurb: 'The calm that lets you execute', video: '', free: false,
                  summary: "Confidence comes from a tested plan and a track record, not a hot streak. Patience is waiting for your setup and nothing less. Detachment is caring about the process, not one trade's outcome — the mindset that lets you execute cleanly.",
                  keyPoints: ["Real confidence is built from backtesting and journaled results", "Patience: no setup, no trade — cash is a position", "Detach from any single trade's outcome; think in large samples", "Think in probabilities — any one trade can lose, and that's fine", "Trust the edge over 100 trades, not the feeling on trade #1"] },
                { id: 'module-07', n: '07', title: 'Journaling for a Pro Mindset', blurb: 'Where random trades become an edge', video: '', free: false,
                  summary: "Your journal is where random trades become a repeatable edge. Logging not just the numbers but your emotions and decisions reveals the patterns — the setups that work and the behaviours that cost you — that no strategy video can show you.",
                  keyPoints: ["Log every trade: pair, setup, screenshot, result — and how you felt", "Review weekly for patterns in both results and behaviour", "Your journal exposes your real edge and your real leaks", "Separate good decisions from good outcomes (and bad from bad)", "The journal, reviewed honestly, is the best coach you'll have"] },
                { id: 'module-08', n: '08', title: 'Your 30-Day Mental Edge Plan', blurb: 'Turn mindset into daily practice', video: '', free: false,
                  summary: "Finish with an action plan: daily mindset habits, pre- and post-session routines, and a simple scoring system to build discipline over 30 days. Psychology improves by practice, not by reading — this is the practice.",
                  keyPoints: ["Six daily rules, scored each session, tracked for 30 days", "Build the pre-market and post-market routine into a habit", "Rate discipline daily — not profit — to train the right behaviour", "Pair it with the 30-Day Discipline Tracker from the free resources", "Small, consistent reps compound into a professional mindset"] }
            ]
        }
    };

    function ready() {
        return !!(BFX.auth && BFX.auth.isConfigured && BFX.auth.isConfigured());
    }

    function currentUser() {
        if (!BFX.auth) return Promise.resolve(null);
        // Race the session lookup against a timeout so a slow/unreachable
        // Supabase falls back to the logged-out view instead of hanging.
        var timeout = new Promise(function (resolve) { setTimeout(function () { resolve(null); }, 8000); });
        return Promise.race([BFX.auth.getUser(), timeout]);
    }

    // ---- entitlement (RLS: users only see their own enrollment rows) ----
    // Resolves true when the signed-in user has an active enrollment for the
    // course. Fails safe to false so a hiccup never leaks paid content.
    function isEnrolled(courseId) {
        var db = BFX.auth.db && BFX.auth.db();
        if (!db) return Promise.resolve(false);
        return db.from('enrollments')
            .select('course_id, status')
            .eq('course_id', courseId)
            .eq('status', 'active')
            .limit(1)
            .then(function (res) { return !!(res.data && res.data.length); })
            .catch(function () { return false; });
    }

    // A lesson is accessible if it's free, or the student is enrolled.
    function canAccess(lesson, enrolled) {
        return !!(lesson && (lesson.free || enrolled));
    }

    // ---- progress (RLS: users only see/write their own rows) ----
    function getProgress(courseId) {
        var db = BFX.auth.db && BFX.auth.db();
        if (!db) return Promise.resolve({});
        return db.from('lesson_progress')
            .select('lesson_id, completed')
            .eq('course_id', courseId)
            .then(function (res) {
                var map = {};
                (res.data || []).forEach(function (r) { if (r.completed) map[r.lesson_id] = true; });
                return map;
            });
    }

    function markComplete(userId, courseId, lessonId, completed) {
        var db = BFX.auth.db && BFX.auth.db();
        if (!db) return Promise.reject(new Error('Not configured'));
        if (completed) {
            return db.from('lesson_progress').upsert({
                user_id: userId, course_id: courseId, lesson_id: lessonId,
                completed: true, completed_at: new Date().toISOString()
            }, { onConflict: 'user_id,course_id,lesson_id' });
        }
        return db.from('lesson_progress').delete()
            .eq('course_id', courseId).eq('lesson_id', lessonId);
    }

    // ---- notes / journal (RLS: users only see/write their own rows) ----
    // Resolves the saved note content (a string, '' if empty) or null when the
    // `lesson_notes` table is unavailable (not migrated / offline) — callers
    // fall back to on-device storage on null.
    function getNote(courseId, lessonId) {
        var db = BFX.auth.db && BFX.auth.db();
        if (!db) return Promise.resolve(null);
        return db.from('lesson_notes')
            .select('content')
            .eq('course_id', courseId)
            .eq('lesson_id', lessonId)
            .limit(1)
            .then(function (res) { if (res.error) return null; return (res.data && res.data[0]) ? (res.data[0].content || '') : ''; })
            .catch(function () { return null; });
    }

    function saveNote(userId, courseId, lessonId, content) {
        var db = BFX.auth.db && BFX.auth.db();
        if (!db) return Promise.reject(new Error('Not configured'));
        return db.from('lesson_notes').upsert({
            user_id: userId, course_id: courseId, lesson_id: lessonId,
            content: content, updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,course_id,lesson_id' });
    }

    // Fire a lightweight event to the Brevo pipeline via /api/lead-capture.
    // Powers the LMS lifecycle automations (signup, free-completed, progress,
    // checkout intent). opts: { once, noSeq, email, name }.
    // - once  → send at most once per (source,email) in this browser
    // - noSeq → attribute update only, never starts an email sequence
    function syncBrevo(source, attrs, opts) {
        opts = opts || {};
        function post(email, name) {
            if (!email) return;
            if (opts.once) {
                var k = 'bfx_sync_' + source + '_' + email;
                try { if (localStorage.getItem(k)) return; localStorage.setItem(k, '1'); } catch (e) {}
            }
            var payload = { email: email, source: source, name: name || '', attributes: attrs || {}, no_sequence: !!opts.noSeq };
            try {
                fetch('/api/lead-capture', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload), keepalive: true
                }).catch(function () {});
            } catch (e) {}
        }
        if (opts.email) { post(opts.email, opts.name); return Promise.resolve(); }
        return currentUser().then(function (user) {
            if (user && user.email) post(user.email, (user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) || '');
        }).catch(function () {});
    }

    return {
        COURSES: COURSES,
        ready: ready,
        currentUser: currentUser,
        isEnrolled: isEnrolled,
        canAccess: canAccess,
        getProgress: getProgress,
        markComplete: markComplete,
        getNote: getNote,
        saveNote: saveNote,
        syncBrevo: syncBrevo,
        course: function (id) { return COURSES[id] || null; },
        lesson: function (courseId, lessonId) {
            var c = COURSES[courseId];
            if (!c) return null;
            for (var i = 0; i < c.lessons.length; i++) {
                if (c.lessons[i].id === lessonId) {
                    return { lesson: c.lessons[i], index: i, next: c.lessons[i + 1] || null, prev: c.lessons[i - 1] || null, course: c };
                }
            }
            return null;
        }
    };
})();
