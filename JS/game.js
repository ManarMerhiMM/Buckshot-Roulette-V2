import { readSettings, COMBINATIONS, ITEMS, getRandom, getPermutation, readStats, writeStats } from "./utility.js";


// GAME LOGIC (NO UI)

const GAMESTATE = {
    players: {
        p1: {
            name: "",
            health: 0,
            items: [],
            table: [],
            chained: false,
            score: 0
        },

        p2: {
            name: "",
            health: 0,
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
        // tie — add any players not already listed
        trackerRecord.players.forEach(player => {
            const name = player.toLowerCase();

            if (!globalRecord.players.includes(name)) {
                globalRecord.players.push(name);
            }
        });
    }
};

const promote = function (key, val, players, higherIsBetter = true) {
    if (val === 0 || players.length === 0) return;

    mergeRecord(STAT_TRACKER[key], { val, players }, higherIsBetter);
};


// ============================================================
//  MATCH  →  ROUND  →  CHAMBER
//  Three lifetimes, three setup functions.
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
    // Same starting health for both players
    const startingHealth = getRandomInt(MATCH_SETTINGS.minHealth, MATCH_SETTINGS.maxHealth);
    GAMESTATE.players.p1.health = startingHealth;
    GAMESTATE.players.p2.health = startingHealth;

    // Everyone starts a round empty-handed
    GAMESTATE.players.p1.items = [];
    GAMESTATE.players.p2.items = [];

    // Same item count for both players, independent draws
    const itemCount = getRandomInt(MATCH_SETTINGS.minItems, MATCH_SETTINGS.maxItems);
    GAMESTATE.players.p1.table = drawItems(itemCount);
    GAMESTATE.players.p2.table = drawItems(itemCount);

    // Inventory space — re-rolled each round, shared by both players
    const itemlessGame = MATCH_SETTINGS.minItems === 0 && MATCH_SETTINGS.maxItems === 0;

    GAMESTATE.players.inventorySpace = itemlessGame
        ? 0
        : getRandomInt(1, MATCH_SETTINGS.maxItems);

    // Fresh chamber, clean shotgun
    GAMESTATE.shotgun.chamber = getPermutation(getRandom(COMBINATIONS));
    GAMESTATE.shotgun.sawedOff = false;

    GAMESTATE.players.p1.chained = false;
    GAMESTATE.players.p2.chained = false;

    // Random starter turn
    GAMESTATE.players.turn = getRandomInt(0, 1) ? "p1" : "p2";

    ROUND_TRACKER = structuredClone(DEFAULT_ROUND_TRACKER);
    ROUND_TRACKER.startTime = Date.now();
};


const reloadShotgun = function () {
    // New chamber
    GAMESTATE.shotgun.chamber = getPermutation(getRandom(COMBINATIONS));

    // New table draw for both players — same count, independent items
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

    // Winner-only records
    promote("closestCall", GAMESTATE.players[winner].health, [winnerName], false);
    promote("mostDamageSurvived", w.damageTaken, [winnerName], true);
    promote("leastDamageSurvived", w.damageTaken, [winnerName], false);
    promote("biggestHPDeficitOvercome", w.maxDeficit, [winnerName], true);
    promote("fastestRound", duration, [winnerName], false);
    promote("slowestRound", duration, [winnerName], true);

    // Round-level records — shared counters, credited to both players
    promote("longestLiveStreak", ROUND_TRACKER.liveStreakBest, bothNames, true);
    promote("longestBlankStreak", ROUND_TRACKER.blankStreakBest, bothNames, true);
    promote("consecutiveTurnsNoItem", ROUND_TRACKER.turnsNoItemBest, bothNames, true);
    promote("mostConsecutiveNoCheck", ROUND_TRACKER.noCheckBest, bothNames, true);

    // Per-player records
    ["p1", "p2"].forEach(slot => {
        const r = ROUND_TRACKER[slot];
        const name = [GAMESTATE.players[slot].name];

        promote("mostItemsInARound", r.itemsUsed, name);
        promote("mostHealing", r.healing, name);
        promote("longestConsecutiveSelfShots", r.selfShotBest, name);
        promote("longestTurnsOn1HP", r.turnsOn1HPBest, name);

        promote("mostSawUses", r.items.saw, name);
        promote("mostBeerUses", r.items.beer, name);
        promote("mostLensUses", r.items.magnifyingLens, name);
        promote("mostPhoneUses", r.items.phone, name);
        promote("mostInvertedUses", r.items.inverter, name);
        promote("mostChainUses", r.items.chains, name);
    });
};


const updateStats = function () {
    const STATS = readStats();

    STATS.totalMatches += 1;
    STATS.totalRounds += STAT_TRACKER.totalRounds;

    // Item frequencies — accumulate counts
    Object.keys(STAT_TRACKER.itemFrequencies).forEach(item => {
        STATS.itemFrequencies[item] += STAT_TRACKER.itemFrequencies[item];
    });

    // Records where a higher value is better
    const higherIsBetter = [
        "longestLiveStreak",
        "longestBlankStreak",
        "mostDamageSurvived",
        "longestConsecutiveSelfShots",
        "longestTurnsOn1HP",
        "mostItemsInARound",
        "biggestHPDeficitOvercome",
        "consecutiveTurnsNoItem",
        "mostItemsHeld",
        "slowestRound",
        "mostConsecutiveNoCheck",
        "mostHealing",
        "mostInvertedUses",
        "mostBeerUses",
        "mostLensUses",
        "mostPhoneUses",
        "mostSawUses",
        "mostChainUses"
    ];

    higherIsBetter.forEach(key => {
        mergeRecord(STATS[key], STAT_TRACKER[key], true);
    });

    // Records where a lower value is better
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

    // A chained player loses this turn; the chain is spent
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

    GAMESTATE.shotgun.sawedOff = false;   // saw is spent either way

    const damage = isLive ? (wasSawed ? 2 : 1) : 0;

    GAMESTATE.players[targetSlot].health = Math.max(
        0,
        GAMESTATE.players[targetSlot].health - damage
    );

    const roundOver = GAMESTATE.players[targetSlot].health === 0;

    // Blank on yourself keeps the turn; everything else passes it
    const keptTurn = isSelf && !isLive;
    let opponentSkipped = false;

    if (!roundOver && !keptTurn) {
        opponentSkipped = !passTurn();
    }

    return {
        shooter,
        target: targetSlot,     // "p1" | "p2"
        isLive,
        wasSawed,
        damage,
        keptTurn,
        opponentSkipped,
        chamberEmpty: GAMESTATE.shotgun.chamber.length === 0,
        roundOver,
        loser: roundOver ? targetSlot : null
    };
};