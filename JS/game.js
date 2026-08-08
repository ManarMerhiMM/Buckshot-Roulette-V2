import { readSettings, writeScores, ITEMS, getRandom, getRandomCombination, getPermutation, readStats, writeStats } from "./utility.js";

//  GAME LOGIC (NO UI) UI code starts further down, clearly marked.

const GAMESTATE = {
    players: {
        p1: {
            name: "",
            health: 0,
            maxHealth: 0,
            items: [],
            table: [],
            chained: false,
            score: 0
        },

        p2: {
            name: "",
            health: 0,
            maxHealth: 0,
            items: [],
            table: [],
            chained: false,
            score: 0
        },

        inventorySpace: 0,
        turn: "p1"
    },

    shotgun: {
        chamber: [],
        sawedOff: false
    }
};

const ITEM_KEYS = {
    "saw": "saw",
    "magnifying lens": "magnifyingLens",
    "phone": "phone",
    "beer": "beer",
    "smoke": "smoke",
    "deadly pill": "deadlyPill",
    "chains": "chains",
    "inverter": "inverter"
};

// Settings are frozen at match start so mid-match edits (another tab)
// can't change the rules of a game already in progress.
let MATCH_SETTINGS = null;

const DEFAULT_ROUND_TRACKER = {
    startTime: 0,

    // Round-level: shared counters, credited to both players
    liveStreak: 0, liveStreakBest: 0,
    blankStreak: 0, blankStreakBest: 0,
    turnsNoItem: 0, turnsNoItemBest: 0,
    noCheckStreak: 0, noCheckBest: 0,

    p1: {
        itemsUsed: 0,
        healing: 0,
        damageTaken: 0,
        maxDeficit: 0,
        items: { saw: 0, magnifyingLens: 0, phone: 0, beer: 0, smoke: 0, deadlyPill: 0, chains: 0, inverter: 0 },
        selfShotStreak: 0, selfShotBest: 0,
        turnsOn1HP: 0, turnsOn1HPBest: 0,
        maxItemsHeld: 0,
        usedItemThisTurn: false
    },

    p2: {
        itemsUsed: 0,
        healing: 0,
        damageTaken: 0,
        maxDeficit: 0,
        items: { saw: 0, magnifyingLens: 0, phone: 0, beer: 0, smoke: 0, deadlyPill: 0, chains: 0, inverter: 0 },
        selfShotStreak: 0, selfShotBest: 0,
        turnsOn1HP: 0, turnsOn1HPBest: 0,
        maxItemsHeld: 0,
        usedItemThisTurn: false
    }
};

let ROUND_TRACKER = structuredClone(DEFAULT_ROUND_TRACKER);

const DEFAULT_STAT_TRACKER = {
    totalRounds: 0,
    itemFrequencies: {
        saw: 0,
        magnifyingLens: 0,
        phone: 0,
        beer: 0,
        smoke: 0,
        deadlyPill: 0,
        chains: 0,
        inverter: 0
    },

    longestLiveStreak: { val: 0, players: [] },
    longestBlankStreak: { val: 0, players: [] },
    closestCall: { val: 0, players: [] },
    mostDamageSurvived: { val: 0, players: [] },
    longestConsecutiveSelfShots: { val: 0, players: [] },
    longestTurnsOn1HP: { val: 0, players: [] },
    mostItemsInARound: { val: 0, players: [] },
    biggestHPDeficitOvercome: { val: 0, players: [] },
    consecutiveTurnsNoItem: { val: 0, players: [] },
    mostItemsHeld: { val: 0, players: [] },
    fastestRound: { val: 0, players: [] },
    slowestRound: { val: 0, players: [] },
    mostConsecutiveNoCheck: { val: 0, players: [] },
    mostHealing: { val: 0, players: [] },
    mostInvertedUses: { val: 0, players: [] },
    mostBeerUses: { val: 0, players: [] },
    mostLensUses: { val: 0, players: [] },
    mostPhoneUses: { val: 0, players: [] },
    mostSawUses: { val: 0, players: [] },
    mostChainUses: { val: 0, players: [] },
    mostSmokeUses: { val: 0, players: [] },
    mostDeadlyPillUses: { val: 0, players: [] },
    leastDamageSurvived: { val: 0, players: [] }
};

let STAT_TRACKER = structuredClone(DEFAULT_STAT_TRACKER);

const getRandomInt = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getOpponent = function (player) {
    return player === "p1" ? "p2" : "p1";
};

const drawItems = function (count) {
    const items = [];

    for (let i = 0; i < count; i++) {
        items.push(getRandom(ITEMS));
    }

    return items;
};

const nextShellIndex = function () {
    return GAMESTATE.shotgun.chamber.length - 1;
};

const mergeRecord = function (globalRecord, trackerRecord, higherIsBetter = true) {
    if (trackerRecord.players.length === 0) return;

    const isFirst = globalRecord.players.length === 0;
    const beatsIt = higherIsBetter
        ? trackerRecord.val > globalRecord.val
        : trackerRecord.val < globalRecord.val;

    if (isFirst || beatsIt) {
        globalRecord.val = trackerRecord.val;
        globalRecord.players = trackerRecord.players.map(p => p.toLowerCase());
    }
    else if (trackerRecord.val === globalRecord.val) {
        trackerRecord.players.forEach(player => {
            const name = player.toLowerCase();

            if (!globalRecord.players.includes(name)) {
                globalRecord.players.push(name);
            }
        });
    }
};

// allowZero: most records treat 0 as "never happened", but a few
// (leastDamageSurvived) have 0 as their BEST possible value.
const promote = function (key, val, players, higherIsBetter = true, allowZero = false) {
    if (players.length === 0) return;
    if (val === 0 && !allowZero) return;

    mergeRecord(STAT_TRACKER[key], { val, players }, higherIsBetter);
};

// ============================================================
//  MATCH  →  ROUND  →  CHAMBER
// ============================================================

const initializeGameState = function () {
    MATCH_SETTINGS = readSettings();

    GAMESTATE.players.p1.name = MATCH_SETTINGS.p1Name;
    GAMESTATE.players.p2.name = MATCH_SETTINGS.p2Name;

    GAMESTATE.players.p1.score = 0;
    GAMESTATE.players.p2.score = 0;

    STAT_TRACKER = structuredClone(DEFAULT_STAT_TRACKER);

    startRound();
};

const startRound = function () {
    const startingHealth = getRandomInt(MATCH_SETTINGS.minHealth, MATCH_SETTINGS.maxHealth);
    GAMESTATE.players.p1.health = startingHealth;
    GAMESTATE.players.p1.maxHealth = startingHealth;
    GAMESTATE.players.p2.health = startingHealth;
    GAMESTATE.players.p2.maxHealth = startingHealth;

    GAMESTATE.players.p1.items = [];
    GAMESTATE.players.p2.items = [];

    const itemCount = getRandomInt(MATCH_SETTINGS.minItems, MATCH_SETTINGS.maxItems);
    GAMESTATE.players.p1.table = drawItems(itemCount);
    GAMESTATE.players.p2.table = drawItems(itemCount);

    const itemlessGame = MATCH_SETTINGS.minItems === 0 && MATCH_SETTINGS.maxItems === 0;

    GAMESTATE.players.inventorySpace = itemlessGame
        ? 0
        : getRandomInt(1, MATCH_SETTINGS.maxItems);

    GAMESTATE.shotgun.chamber = getPermutation(getRandomCombination());
    GAMESTATE.shotgun.sawedOff = false;

    GAMESTATE.players.p1.chained = false;
    GAMESTATE.players.p2.chained = false;

    GAMESTATE.players.turn = getRandomInt(0, 1) ? "p1" : "p2";

    ROUND_TRACKER = structuredClone(DEFAULT_ROUND_TRACKER);
    ROUND_TRACKER.startTime = Date.now();
};

const reloadShotgun = function () {
    GAMESTATE.shotgun.chamber = getPermutation(getRandomCombination());

    const itemCount = getRandomInt(MATCH_SETTINGS.minItems, MATCH_SETTINGS.maxItems);

    GAMESTATE.players.p1.table = drawItems(itemCount);
    GAMESTATE.players.p2.table = drawItems(itemCount);

    // health, inventorySpace, items, and turn all carry over untouched
};

const endRound = function (loser) {
    const winner = getOpponent(loser);
    const winnerName = GAMESTATE.players[winner].name;
    const bothNames = [GAMESTATE.players.p1.name, GAMESTATE.players.p2.name];

    const duration = (Date.now() - ROUND_TRACKER.startTime) / 1000;
    const w = ROUND_TRACKER[winner];

    GAMESTATE.players[winner].score += 1;
    STAT_TRACKER.totalRounds += 1;

    promote("closestCall", GAMESTATE.players[winner].health, [winnerName], false);
    promote("mostDamageSurvived", w.damageTaken, [winnerName], true);
    promote("biggestHPDeficitOvercome", w.maxDeficit, [winnerName], true);
    promote("fastestRound", duration, [winnerName], false);
    promote("slowestRound", duration, [winnerName], true);
    promote("leastDamageSurvived", w.damageTaken, [winnerName], false, true);

    promote("longestLiveStreak", ROUND_TRACKER.liveStreakBest, bothNames, true);
    promote("longestBlankStreak", ROUND_TRACKER.blankStreakBest, bothNames, true);
    promote("consecutiveTurnsNoItem", ROUND_TRACKER.turnsNoItemBest, bothNames, true);
    promote("mostConsecutiveNoCheck", ROUND_TRACKER.noCheckBest, bothNames, true);

    ["p1", "p2"].forEach(slot => {
        const r = ROUND_TRACKER[slot];
        const name = [GAMESTATE.players[slot].name];

        promote("mostItemsInARound", r.itemsUsed, name);
        promote("mostHealing", r.healing, name);
        promote("longestConsecutiveSelfShots", r.selfShotBest, name);
        promote("longestTurnsOn1HP", r.turnsOn1HPBest, name);
        promote("mostItemsHeld", r.maxItemsHeld, name);

        promote("mostSawUses", r.items.saw, name);
        promote("mostBeerUses", r.items.beer, name);
        promote("mostLensUses", r.items.magnifyingLens, name);
        promote("mostPhoneUses", r.items.phone, name);
        promote("mostInvertedUses", r.items.inverter, name);
        promote("mostChainUses", r.items.chains, name);
        promote("mostSmokeUses", r.items.smoke, name);
        promote("mostDeadlyPillUses", r.items.deadlyPill, name);
    });
};

const updateStats = function () {
    const STATS = readStats();

    STATS.totalMatches += 1;
    STATS.totalRounds += STAT_TRACKER.totalRounds;

    Object.keys(STAT_TRACKER.itemFrequencies).forEach(item => {
        STATS.itemFrequencies[item] += STAT_TRACKER.itemFrequencies[item];
    });

    const higherIsBetter = [
        "longestLiveStreak", "longestBlankStreak", "mostDamageSurvived",
        "longestConsecutiveSelfShots", "longestTurnsOn1HP", "mostItemsInARound",
        "biggestHPDeficitOvercome", "consecutiveTurnsNoItem", "mostItemsHeld",
        "slowestRound", "mostConsecutiveNoCheck", "mostHealing",
        "mostInvertedUses", "mostBeerUses", "mostLensUses",
        "mostPhoneUses", "mostSawUses", "mostChainUses", "mostSmokeUses", "mostDeadlyPillUses"
    ];

    higherIsBetter.forEach(key => {
        mergeRecord(STATS[key], STAT_TRACKER[key], true);
    });

    ["fastestRound", "leastDamageSurvived", "closestCall"].forEach(key => {
        mergeRecord(STATS[key], STAT_TRACKER[key], false);
    });

    writeStats(STATS);

    STAT_TRACKER = structuredClone(DEFAULT_STAT_TRACKER);
};

// ============================================================
//  TURN & SHOT
// ============================================================

const passTurn = function () {
    const next = getOpponent(GAMESTATE.players.turn);

    if (GAMESTATE.players[next].chained) {
        GAMESTATE.players[next].chained = false;
        return false;
    }

    GAMESTATE.players.turn = next;
    return true;
};

const fireShell = function (targetSlot) {
    if (targetSlot !== "p1" && targetSlot !== "p2") return null;
    if (GAMESTATE.shotgun.chamber.length === 0) return null;

    const shooter = GAMESTATE.players.turn;
    const isSelf = targetSlot === shooter;

    const isLive = GAMESTATE.shotgun.chamber.pop();
    const wasSawed = GAMESTATE.shotgun.sawedOff;

    GAMESTATE.shotgun.sawedOff = false;

    const damage = isLive ? (wasSawed ? 2 : 1) : 0;

    GAMESTATE.players[targetSlot].health = Math.max(
        0,
        GAMESTATE.players[targetSlot].health - damage
    );

    const roundOver = GAMESTATE.players[targetSlot].health === 0;

    const keptTurn = isSelf && !isLive;
    let opponentSkipped = false;

    if (!roundOver && !keptTurn) {
        opponentSkipped = !passTurn();
    }

    return {
        shooter,
        target: targetSlot,
        isLive,
        wasSawed,
        damage,
        keptTurn,
        turnEnded: !keptTurn,
        opponentSkipped,
        chamberEmpty: GAMESTATE.shotgun.chamber.length === 0,
        roundOver,
        loser: roundOver ? targetSlot : null
    };
};

// ============================================================
//  ITEMS
// ============================================================

const useItem = function (player, itemIndex) {
    const p = GAMESTATE.players[player];
    const item = p.items[itemIndex];

    if (item === undefined) return null;
    if (GAMESTATE.shotgun.chamber.length === 0) return null;

    const idx = nextShellIndex();
    const result = { player, item, effect: null };

    switch (item) {
        case "saw":
            GAMESTATE.shotgun.sawedOff = true;
            result.effect = { type: "saw" };
            break;

        case "magnifying lens":
            result.effect = {
                type: "reveal",
                position: idx,
                isLive: GAMESTATE.shotgun.chamber[idx]
            };
            break;

        case "phone": {
            const pick = getRandomInt(0, idx);

            result.effect = {
                type: "reveal",
                position: pick,
                shotsAway: idx - pick + 1,
                isLive: GAMESTATE.shotgun.chamber[pick]
            };
            break;
        }

        case "beer": {
            const racked = GAMESTATE.shotgun.chamber.pop();
            result.effect = { type: "rack", isLive: racked };
            break;
        }

        case "smoke": {
            p.health += 1;
            result.effect = { type: "heal", amount: 1 };
            break;
        }

        case "deadly pill": {
            const good = Math.random() < 0.4;
            const change = good ? 2 : -1;

            p.health = Math.max(0, p.health + change);

            result.effect = { type: "pill", change, died: p.health === 0 };
            break;
        }

        case "chains":
            GAMESTATE.players[getOpponent(player)].chained = true;
            result.effect = { type: "chain", target: getOpponent(player) };
            break;

        case "inverter":
            GAMESTATE.shotgun.chamber[idx] = !GAMESTATE.shotgun.chamber[idx];
            result.effect = { type: "invert" };
            break;

        default:
            return null;
    }

    p.items.splice(itemIndex, 1);

    STAT_TRACKER.itemFrequencies[ITEM_KEYS[item]] += 1;

    result.chamberEmpty = GAMESTATE.shotgun.chamber.length === 0;
    result.roundOver = p.health === 0;
    result.loser = result.roundOver ? player : null;

    return result;
};

// Swap-on-full: taking from a full inventory replaces one held item,
// which is discarded (not returned to the table).
const takeItem = function (player, tableIndex, replaceIndex = null) {
    const p = GAMESTATE.players[player];
    const item = p.table[tableIndex];

    if (item === undefined) return { ok: false, reason: "invalid-table-index" };

    if (p.items.length < GAMESTATE.players.inventorySpace) {
        p.items.push(item);
        p.table.splice(tableIndex, 1);
        return { ok: true, replaced: false };
    }

    if (replaceIndex === null || p.items[replaceIndex] === undefined) {
        return { ok: false, reason: "inventory-full", needsReplace: true };
    }

    const discarded = p.items[replaceIndex];
    p.items[replaceIndex] = item;
    p.table.splice(tableIndex, 1);

    return { ok: true, replaced: true, discarded };
};

// ============================================================
//  MATCH END
// ============================================================

const endMatch = function () {
    if (GAMESTATE.players.p1.score === 0 && GAMESTATE.players.p2.score === 0) {
        return false;
    }

    writeScores(
        GAMESTATE.players.p1.name,
        GAMESTATE.players.p2.name,
        GAMESTATE.players.p1.score,
        GAMESTATE.players.p2.score
    );

    updateStats();

    return true;
};

// ============================================================
//  ROUND TRACKING — the only functions that write to ROUND_TRACKER
// ============================================================

const trackHealthChange = function () {
    ["p1", "p2"].forEach(slot => {
        const deficit = GAMESTATE.players[getOpponent(slot)].health
            - GAMESTATE.players[slot].health;

        if (deficit > ROUND_TRACKER[slot].maxDeficit) {
            ROUND_TRACKER[slot].maxDeficit = deficit;
        }
    });
};

const trackShot = function (result) {
    const shooter = ROUND_TRACKER[result.shooter];
    const target = ROUND_TRACKER[result.target];
    const isSelf = result.target === result.shooter;

    if (result.isLive) {
        ROUND_TRACKER.liveStreak += 1;
        ROUND_TRACKER.blankStreak = 0;

        if (ROUND_TRACKER.liveStreak > ROUND_TRACKER.liveStreakBest) {
            ROUND_TRACKER.liveStreakBest = ROUND_TRACKER.liveStreak;
        }
    }
    else {
        ROUND_TRACKER.blankStreak += 1;
        ROUND_TRACKER.liveStreak = 0;

        if (ROUND_TRACKER.blankStreak > ROUND_TRACKER.blankStreakBest) {
            ROUND_TRACKER.blankStreakBest = ROUND_TRACKER.blankStreak;
        }
    }

    target.damageTaken += result.damage;

    if (isSelf && !result.isLive) {
        shooter.selfShotStreak += 1;

        if (shooter.selfShotStreak > shooter.selfShotBest) {
            shooter.selfShotBest = shooter.selfShotStreak;
        }
    }
    else {
        shooter.selfShotStreak = 0;
    }

    if (!isSelf && !shooter.usedItemThisTurn) {
        ROUND_TRACKER.noCheckStreak += 1;

        if (ROUND_TRACKER.noCheckStreak > ROUND_TRACKER.noCheckBest) {
            ROUND_TRACKER.noCheckBest = ROUND_TRACKER.noCheckStreak;
        }
    }
    else {
        ROUND_TRACKER.noCheckStreak = 0;
    }
};

const trackItemUse = function (player, item, effect) {
    const r = ROUND_TRACKER[player];
    const key = ITEM_KEYS[item];

    if (!key) return;

    r.itemsUsed += 1;
    r.items[key] += 1;
    r.usedItemThisTurn = true;

    if (effect && effect.type === "heal") {
        r.healing += effect.amount;
    }

    if (effect && effect.type === "pill" && effect.change > 0) {
        r.healing += effect.change;
    }

    ROUND_TRACKER.noCheckStreak = 0;
};

const trackTurnEnd = function (player) {
    const r = ROUND_TRACKER[player];

    if (r.usedItemThisTurn) {
        ROUND_TRACKER.turnsNoItem = 0;
    }
    else {
        ROUND_TRACKER.turnsNoItem += 1;

        if (ROUND_TRACKER.turnsNoItem > ROUND_TRACKER.turnsNoItemBest) {
            ROUND_TRACKER.turnsNoItemBest = ROUND_TRACKER.turnsNoItem;
        }
    }

    if (GAMESTATE.players[player].health === 1) {
        r.turnsOn1HP += 1;

        if (r.turnsOn1HP > r.turnsOn1HPBest) {
            r.turnsOn1HPBest = r.turnsOn1HP;
        }
    }
    else {
        r.turnsOn1HP = 0;
    }

    r.usedItemThisTurn = false;
};

const trackItemsHeld = function (player) {
    const held = GAMESTATE.players[player].items.length;

    if (held > ROUND_TRACKER[player].maxItemsHeld) {
        ROUND_TRACKER[player].maxItemsHeld = held;
    }
};

//                          UI LAYER

//  Everything below reads/renders GAMESTATE and calls the pure
//  logic functions above. No game rules live down here.

const ITEM_EMOJI = {
    "saw": "🪚",
    "magnifying lens": "🔍",
    "phone": "📱",
    "beer": "🍺",
    "smoke": "🚬",
    "deadly pill": "💊",
    "chains": "⛓️",
    "inverter": "🔄"
};

const ITEM_LABELS = {
    "saw": "Saw",
    "magnifying lens": "Magnifying Lens",
    "phone": "Phone",
    "beer": "Beer",
    "smoke": "Smoke",
    "deadly pill": "Deadly Pill",
    "chains": "Chains",
    "inverter": "Inverter"
};

// Only items with ONE deterministic activation sound live here.
// Deadly pill (pillGood/pillBad) and chains (chainApplied) have
// outcome-dependent sounds, played directly from handleEffectUI
// instead — they're intentionally absent from this map.
const ITEM_SFX_KEY = {
    "saw": "saw",
    "magnifying lens": "lens",
    "phone": "phone",
    "beer": "beer",
    "smoke": "smoke",
    "inverter": "inverter"
};

// ---------- SFX ----------
// Every playback is best-effort: a missing file or a blocked
// autoplay just fails silently, it never breaks the game.
const SFX = {
    // SHOOTING
    shootSelf: "Assets/SFX/shoot-self.mp3",
    shootOpponent: "Assets/SFX/shoot-opponent.mp3",

    // Triggered by the actual shell
    liveShot: "Assets/SFX/live-shot.mp3",
    sawedShot: "Assets/SFX/sawed-shot.mp3",
    blankShot: "Assets/SFX/blank-shot.mp3",

    // SHOTGUN
    reload: "Assets/SFX/reload.mp3",
    reloadShell: "Assets/SFX/reload-shell.mp3",

    // ITEMS
    itemPickup: "Assets/SFX/item-pickup.mp3",
    itemSwap: "Assets/SFX/item-swap.mp3",

    saw: "Assets/SFX/saw.mp3",
    smoke: "Assets/SFX/smoke.mp3",
    lens: "Assets/SFX/lens.mp3",
    phone: "Assets/SFX/phone.mp3",
    beer: "Assets/SFX/beer.mp3",
    pillGood: "Assets/SFX/pill-good.mp3",
    pillBad: "Assets/SFX/pill-bad.mp3",
    inverter: "Assets/SFX/inverter.mp3",

    // CHAINS
    chainApplied: "Assets/SFX/chain-applied.mp3",
    chainBroken: "Assets/SFX/chain-broken.mp3",

    // ROUND / MATCH
    roundWin: "Assets/SFX/round-win.mp3",
    matchEnd: "Assets/SFX/match-end.mp3"
};

const combinationText = function () {
    const live = GAMESTATE.shotgun.chamber.filter(Boolean).length;
    const blank = GAMESTATE.shotgun.chamber.length - live;

    return `🔫 Loaded: ${live} LIVE 💥 · ${blank} BLANK 🎭`;
};

const playSfx = function (key) {
    const src = SFX[key];
    if (!src) return;

    try {
        const audio = new Audio(src);
        audio.volume = 0.7;
        audio.play().catch(() => { /* autoplay blocked or file missing — ignore */ });
    }
    catch {
        // ignore
    }
};

// ---------- UI-only state (not part of GAMESTATE) ----------
let locked = false;
let replaceMode = null;          // { player, tableIndex, item } | null
let revealedShell = null;        // { position, isLive } | null
let revealBannerTimer = null;
let chainBadgeHold = null;       // slot whose "Chained" badge stays up until chainBroken actually plays
const SHOT_ANIM_MS = 420;
const CHAIN_BROKEN_DELAY_MS = 3200; // let the shot's own sounds clear first
const RELOAD_DELAY_MS = 1200; // pause on the empty chamber before it refills
const SHELL_LOAD_INTERVAL_MS = 970; // spacing between each individual shell-load sound
const ROUND_OVER_DELAY_MS = 1000; // let the fatal hit land before the popup + sound appear

// Pause between the "aim" sound (shoot-self / shoot-opponent) and the
// actual bang (live-shot / blank-shot / sawed-shot). Measured clip
// lengths: shoot-opponent ~1.15s, shoot-self ~1.93s — 1000ms sits
// close to the shorter of the two; raise/lower freely.
const SHOT_RESULT_DELAY_MS = 1000;

const nameOf = function (slot) {
    return GAMESTATE.players[slot].name || (slot === "p1" ? "Player 1" : "Player 2");
};

const $ = function (id) {
    return document.getElementById(id);
};

const addLog = function (msg) {
    const feed = $("logFeed");
    const li = document.createElement("li");
    li.textContent = msg;
    feed.prepend(li);

    while (feed.children.length > 40) {
        feed.removeChild(feed.lastChild);
    }
};

const applyPlayerColors = function () {
    [["p1Column", MATCH_SETTINGS.p1Color], ["p1Actions", MATCH_SETTINGS.p1Color],
    ["p2Column", MATCH_SETTINGS.p2Color], ["p2Actions", MATCH_SETTINGS.p2Color]]
        .forEach(([id, color]) => $(id).style.setProperty("--player-color", color));
};

const updateLockUI = function () {
    document.querySelector(".board").classList.toggle("locked", locked);
};

// ---------- Rendering ----------

const renderScoreboard = function () {
    $("scoreP1Name").textContent = nameOf("p1");
    $("scoreP1Val").textContent = GAMESTATE.players.p1.score;
    $("scoreP2Name").textContent = nameOf("p2");
    $("scoreP2Val").textContent = GAMESTATE.players.p2.score;
};

const renderTurnBanner = function () {
    const slot = GAMESTATE.players.turn;
    const el = $("turnBanner");

    el.textContent = `${nameOf(slot).toUpperCase()}'S TURN`;
    el.style.setProperty(
        "--player-color",
        slot === "p1" ? MATCH_SETTINGS.p1Color : MATCH_SETTINGS.p2Color
    );
};

const renderChamber = function () {
    const el = $("chamberPips");
    el.innerHTML = "";

    const chamber = GAMESTATE.shotgun.chamber;

    for (let i = chamber.length - 1; i >= 0; i--) {
        const pip = document.createElement("div");
        pip.className = "shell-pip";

        if (i === chamber.length - 1) pip.classList.add("next-up");

        if (revealedShell && revealedShell.position === i) {
            pip.classList.add(revealedShell.isLive ? "revealed-live" : "revealed-blank");
            pip.textContent = revealedShell.isLive ? "💥" : "🎭";
        }

        el.appendChild(pip);
    }

    $("shotgunArt").classList.toggle("sawed", GAMESTATE.shotgun.sawedOff);
};

const renderPlayerPanel = function (slot) {
    const p = GAMESTATE.players[slot];
    const isTurn = GAMESTATE.players.turn === slot;

    $(slot + "NameLabel").textContent = nameOf(slot);

    // Table — always interactive, either player can organize items anytime
    const tableEl = $(slot + "Table");
    tableEl.innerHTML = "";

    if (p.table.length === 0) {
        tableEl.innerHTML = '<p class="empty-note">No items on the table.</p>';
    }
    else {
        p.table.forEach((item, idx) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "item-slot table-slot";
            btn.dataset.index = idx;
            btn.title = ITEM_LABELS[item];
            btn.innerHTML = `<span class="item-icon">${ITEM_EMOJI[item]}</span>`;
            tableEl.appendChild(btn);
        });
    }

    // Inventory — using an item is turn-gated
    const invEl = $(slot + "Inventory");
    invEl.innerHTML = "";
    invEl.classList.toggle("is-turn", isTurn);
    invEl.classList.toggle("replace-target", !!(replaceMode && replaceMode.player === slot));

    for (let i = 0; i < GAMESTATE.players.inventorySpace; i++) {
        const item = p.items[i];
        const slotEl = document.createElement("button");
        slotEl.type = "button";
        slotEl.className = "item-slot inventory-slot";
        slotEl.dataset.index = i;

        if (item) {
            slotEl.innerHTML = `<span class="item-icon">${ITEM_EMOJI[item]}</span>`;
            slotEl.title = ITEM_LABELS[item];
        }
        else {
            slotEl.classList.add("empty");
            slotEl.disabled = true;
        }

        invEl.appendChild(slotEl);
    }

    // Health hearts
    const healthEl = $(slot + "Health");
    healthEl.innerHTML = "";

    const maxH = Math.max(p.health, p.maxHealth);

    for (let i = 0; i < maxH; i++) {
        const pip = document.createElement("span");
        pip.className = "health-pip" + (i < p.health ? " filled" : "");
        healthEl.appendChild(pip);
    }

    // Actions panel state
    const actionsEl = $(slot + "Actions");
    actionsEl.classList.toggle("is-turn", isTurn);
    actionsEl.classList.toggle("chained", p.chained || chainBadgeHold === slot);

    actionsEl.querySelectorAll(".action-btn").forEach(btn => {
        btn.disabled = !isTurn || locked;
    });
};

const renderAll = function () {
    renderScoreboard();
    renderTurnBanner();
    renderChamber();
    renderPlayerPanel("p1");
    renderPlayerPanel("p2");
};

// ---------- Item-effect narration (banner + log) ----------

const showBanner = function (text, ms) {
    clearTimeout(revealBannerTimer);
    const banner = $("revealBanner");
    banner.textContent = text;
    banner.classList.add("show");
    revealBannerTimer = setTimeout(() => banner.classList.remove("show"), ms);
};

const handleEffectUI = function (effect) {
    switch (effect.type) {
        case "reveal":
            if (effect.position === null) {
                revealedShell = null;
                showBanner("📱 No other shells left to check.", 4000);
            }
            else {
                revealedShell = { position: effect.position, isLive: effect.isLive };
                showBanner(
                    effect.isLive ? "👁️ Revealed: LIVE round ahead." : "👁️ Revealed: blank round ahead.",
                    6000
                );
            }
            break;

        case "saw":
            showBanner("🪚 Saw loaded — next shot deals double damage.", 4000);
            break;

        case "rack":
            revealedShell = null;
            showBanner(effect.isLive ? "🍺 Racked a LIVE shell out." : "🍺 Racked a blank out.", 4000);
            break;

        case "invert":
            if (revealedShell && revealedShell.position === nextShellIndex()) {
                revealedShell.isLive = !revealedShell.isLive;
            }
            else {
                revealedShell = null;
            }
            showBanner("🔄 The next shell has been flipped.", 4000);
            break;

        case "chain":
            showBanner(`⛓️ ${nameOf(effect.target)} is chained — their next turn will be skipped.`, 4000);
            playSfx("chainApplied");
            break;

        case "heal":
            showBanner(`🚬 +${effect.amount} HP.`, 3000);
            break;

        case "pill":
            showBanner(effect.change > 0 ? `💊 Lucky! +${effect.change} HP.` : `💊 Ouch! ${effect.change} HP.`, 4000);
            playSfx(effect.change > 0 ? "pillGood" : "pillBad");
            break;
    }
};

const formatShotLog = function (result) {
    const shooter = nameOf(result.shooter);
    const isSelf = result.target === result.shooter;
    const targetTxt = isSelf ? "themself" : nameOf(result.target);

    if (result.isLive) {
        return `🔫 ${shooter} shoots ${targetTxt} — 💥 LIVE${result.wasSawed ? " (SAWED)" : ""}! -${result.damage} HP`;
    }

    return `🔫 ${shooter} shoots ${targetTxt} — 🎭 blank.${result.keptTurn ? " Goes again!" : ""}`;
};

const formatItemLog = function (slot, item, effect) {
    const name = nameOf(slot);

    switch (effect.type) {
        case "saw": return `🪚 ${name} loads the saw.`;
        case "reveal":
            if (effect.position === null) return `📱 ${name} checks the phone — nothing left to find.`;
            return `🔍 ${name} checks a shell — it's ${effect.isLive ? "💥 LIVE" : "🎭 blank"}.`;
        case "rack": return `🍺 ${name} racks a ${effect.isLive ? "💥 LIVE" : "🎭 blank"} shell out.`;
        case "heal": return `🚬 ${name} heals ${effect.amount} HP.`;
        case "pill": return effect.change > 0
            ? `💊 ${name} gets lucky — +${effect.change} HP!`
            : `💊 ${name} isn't so lucky — ${effect.change} HP.`;
        case "chain": return `⛓️ ${name} chains ${nameOf(effect.target)}.`;
        case "invert": return `🔄 ${name} inverts the next shell.`;
        default: return `${name} uses an item.`;
    }
};

// ---------- Animation ----------

// Immediate: the gun swings to point at the target. This happens
// right away, before the pause — it reads as "taking aim."
const aimShotgun = function (targetSlot) {
    $("shotgunAim").className = "shotgun-aim aim-" + targetSlot;
};

// Delayed: the actual bang. Sound + recoil + hit-flash + chamber
// update all fire together, SHOT_RESULT_DELAY_MS after aimShotgun().
const resolveShot = function (result) {
    if (result.isLive) {
        playSfx(result.wasSawed ? "sawedShot" : "liveShot");
    }
    else {
        playSfx("blankShot");
    }

    $("shotgunArt").classList.add("firing");
    setTimeout(() => $("shotgunArt").classList.remove("firing"), SHOT_ANIM_MS);

    const targetPanel = $(result.target + "Column");

    if (result.isLive) {
        targetPanel.classList.add("hit-flash", "shake");
        setTimeout(() => targetPanel.classList.remove("hit-flash", "shake"), SHOT_ANIM_MS);
    }
    else {
        targetPanel.classList.add("blank-pulse");
        setTimeout(() => targetPanel.classList.remove("blank-pulse"), SHOT_ANIM_MS);
    }

    renderChamber();
};

// Plays one reloadShell sound per shell now in the chamber, spaced
// SHELL_LOAD_INTERVAL_MS apart, then a final chamber-close sound,
// then onComplete — the SOUND count always matches whatever random
// combination just got loaded, since it's read after reloadShotgun().
const playReloadSequence = function (shellCount, onComplete) {
    for (let i = 0; i < shellCount; i++) {
        setTimeout(() => playSfx("reloadShell"), i * SHELL_LOAD_INTERVAL_MS);
    }

    setTimeout(() => {
        playSfx("reload");
        if (onComplete) onComplete();
    }, shellCount * SHELL_LOAD_INTERVAL_MS);
};

// Same "shells loading in" experience as a mid-game reload, but for
// the very start of a match. The chamber is already populated by the
// time this runs (initializeGameState -> startRound already set it),
// so it's stashed and swapped for an empty array just long enough to
// render the "empty chamber" beat, then restored before the sound
// sequence plays against its real length.
const playStartupLoadSequence = function () {
    const chamber = GAMESTATE.shotgun.chamber;
    GAMESTATE.shotgun.chamber = [];

    locked = true;
    updateLockUI();
    renderAll();

    setTimeout(() => {
        GAMESTATE.shotgun.chamber = chamber;

        playReloadSequence(GAMESTATE.shotgun.chamber.length, () => {
            showBanner(combinationText(), 4500);
            locked = false;
            updateLockUI();
            renderAll();
        });
    }, RELOAD_DELAY_MS);
};

// ---------- Action handlers ----------

const handleShoot = function (shooterSlot, targetSlot) {
    if (locked) return;
    if (GAMESTATE.players.turn !== shooterSlot) return;

    locked = true;
    updateLockUI();

    const result = fireShell(targetSlot);

    if (!result) {
        locked = false;
        updateLockUI();
        return;
    }

    trackShot(result);
    trackHealthChange();
    if (result.turnEnded) trackTurnEnd(result.shooter);

    aimShotgun(targetSlot);
    playSfx(targetSlot === shooterSlot ? "shootSelf" : "shootOpponent");

    addLog(formatShotLog(result));

    if (result.opponentSkipped) {
        const skippedSlot = getOpponent(result.shooter);
        addLog(`⛓️ Chain broke — ${nameOf(skippedSlot)}'s turn was skipped!`);

        chainBadgeHold = skippedSlot;

        setTimeout(() => {
            chainBadgeHold = null;
            playSfx("chainBroken");
            renderAll();
        }, CHAIN_BROKEN_DELAY_MS);
    }

    setTimeout(() => {
        resolveShot(result);

        setTimeout(() => {
            revealedShell = null;

            if (result.roundOver) {
                setTimeout(() => handleRoundOver(result.loser), ROUND_OVER_DELAY_MS);
                return;
            }

            if (result.chamberEmpty) {
                renderAll(); // shows the empty chamber before it refills

                setTimeout(() => {
                    reloadShotgun();
                    addLog("🔄 The chamber is empty — reloading…");

                    playReloadSequence(GAMESTATE.shotgun.chamber.length, () => {
                        showBanner(combinationText(), 4500);
                        locked = false;
                        updateLockUI();
                        renderAll();
                    });
                }, RELOAD_DELAY_MS);

                return;
            }

            locked = false;
            updateLockUI();
            renderAll();
        }, SHOT_ANIM_MS);
    }, SHOT_RESULT_DELAY_MS);
};

const handleUseItem = function (slot, idx) {
    if (locked) return;
    if (GAMESTATE.players.turn !== slot) return;

    const item = GAMESTATE.players[slot].items[idx];
    if (!item) return;

    const result = useItem(slot, idx);
    if (!result) return;

    trackItemUse(slot, item, result.effect);
    trackHealthChange();

    // Item activation sound (saw/lens/phone/beer/smoke/inverter — one
    // deterministic sound each). Pill and chains play their own sound
    // from handleEffectUI below, based on the actual outcome.
    playSfx(ITEM_SFX_KEY[item]);

    addLog(formatItemLog(slot, item, result.effect));
    handleEffectUI(result.effect);

    if (result.roundOver) {
        locked = true;
        updateLockUI();
        setTimeout(() => handleRoundOver(result.loser), ROUND_OVER_DELAY_MS);
        return;
    }

    if (result.chamberEmpty) {
        revealedShell = null;
        locked = true;
        updateLockUI();
        renderAll(); // shows the empty chamber before it refills

        setTimeout(() => {
            reloadShotgun();
            addLog("🔄 The chamber is empty — reloading…");

            playReloadSequence(GAMESTATE.shotgun.chamber.length, () => {
                showBanner(combinationText(), 4500);
                locked = false;
                updateLockUI();
                renderAll();
            });
        }, RELOAD_DELAY_MS);

        return;
    }

    renderAll();
};

const handleTakeItem = function (slot, tableIndex) {
    if (locked || replaceMode) return;

    const p = GAMESTATE.players[slot];
    const item = p.table[tableIndex];
    if (!item) return;

    if (p.items.length < GAMESTATE.players.inventorySpace) {
        const res = takeItem(slot, tableIndex);

        if (res.ok) {
            trackItemsHeld(slot);
            playSfx("itemPickup");
            addLog(`📥 ${nameOf(slot)} picked up ${ITEM_LABELS[item]}.`);
            renderAll();
        }

        return;
    }

    replaceMode = { player: slot, tableIndex, item };
    $("replaceText").textContent =
        `${nameOf(slot)}: inventory full — choose an item to replace with ${ITEM_LABELS[item]}`;
    $("replaceBanner").hidden = false;
    renderAll();
};

const resolveReplace = function (slot, invIndex) {
    if (!replaceMode) return;

    const res = takeItem(slot, replaceMode.tableIndex, invIndex);

    if (res.ok) {
        trackItemsHeld(slot);
        playSfx("itemSwap");
        addLog(`🔁 ${nameOf(slot)} swapped in ${ITEM_LABELS[replaceMode.item]}.`);
    }

    replaceMode = null;
    $("replaceBanner").hidden = true;
    renderAll();
};

const handleRoundOver = function (loserSlot) {
    const winnerSlot = getOpponent(loserSlot);

    endRound(loserSlot);
    playSfx("roundWin");
    addLog(`🏆 ${nameOf(winnerSlot)} wins the round! Score: ${GAMESTATE.players.p1.score} - ${GAMESTATE.players.p2.score}`);

    renderAll();

    $("roundOverTitle").textContent = `${nameOf(winnerSlot)} wins the round!`;
    $("roundOverText").textContent =
        `Score: ${nameOf("p1")} ${GAMESTATE.players.p1.score} — ${GAMESTATE.players.p2.score} ${nameOf("p2")}`;
    $("roundOverOverlay").hidden = false;

    locked = true;
    updateLockUI();
};

const showMatchOver = function (saved) {
    $("matchOverText").textContent = saved
        ? `Final score: ${nameOf("p1")} ${GAMESTATE.players.p1.score} — ${GAMESTATE.players.p2.score} ${nameOf("p2")}.`
        : "No completed rounds — nothing was saved.";

    $("matchOverOverlay").hidden = false;
    locked = true;
    updateLockUI();
    playSfx("matchEnd");
};

// ---------- Wiring ----------

const setupDelegation = function () {
    ["p1", "p2"].forEach(slot => {
        $(slot + "Table").addEventListener("click", e => {
            const btn = e.target.closest(".table-slot");
            if (!btn) return;
            handleTakeItem(slot, Number(btn.dataset.index));
        });

        $(slot + "Inventory").addEventListener("click", e => {
            const btn = e.target.closest(".inventory-slot");
            if (!btn || btn.disabled) return;

            const idx = Number(btn.dataset.index);

            if (replaceMode && replaceMode.player === slot) {
                resolveReplace(slot, idx);
            }
            else {
                handleUseItem(slot, idx);
            }
        });
    });

    $("p1ShootSelf").addEventListener("click", () => handleShoot("p1", "p1"));
    $("p1ShootOpponent").addEventListener("click", () => handleShoot("p1", "p2"));
    $("p2ShootSelf").addEventListener("click", () => handleShoot("p2", "p2"));
    $("p2ShootOpponent").addEventListener("click", () => handleShoot("p2", "p1"));

    $("cancelReplaceBtn").addEventListener("click", () => {
        replaceMode = null;
        $("replaceBanner").hidden = true;
        renderAll();
    });

    $("nextRoundBtn").addEventListener("click", () => {
        $("roundOverOverlay").hidden = true;
        startRound();
        locked = false;
        revealedShell = null;
        chainBadgeHold = null;
        updateLockUI();
        addLog("— New round —");
        renderAll();
        showBanner(combinationText(), 4500);
    });

    $("endMatchBtn").addEventListener("click", () => {
        if (!confirm("End the match and save the result?")) return;
        const saved = endMatch();
        showMatchOver(saved);
    });

    $("playAgainBtn").addEventListener("click", () => {
        $("matchOverOverlay").hidden = true;

        initializeGameState();
        applyPlayerColors();

        replaceMode = null;
        revealedShell = null;
        chainBadgeHold = null;

        $("logFeed").innerHTML = "";
        addLog("Match started!");
        playStartupLoadSequence();
    });

    $("quitLink").addEventListener("click", e => {
        if (GAMESTATE.players.p1.score > 0 || GAMESTATE.players.p2.score > 0) {
            if (!confirm("Leave without ending the match? Unsaved rounds will be lost unless you end the match first.")) {
                e.preventDefault();
            }
        }
    });
};

// ---------- Init ----------

setupDelegation();
initializeGameState();
applyPlayerColors();
addLog("Match started!");
playStartupLoadSequence();