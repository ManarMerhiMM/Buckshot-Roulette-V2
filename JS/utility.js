const BUCKSHOTROULETTE = "BuckshotRoulette";

const COMBINATIONS = [
    [true, false],
    [true, true, false],
    [true, false, false],
    [true, true, false, false],
    [true, false, false, false],
    [true, true, true, false, false, false],
    [true, true, false, false, false, false],
    [true, true, true, true, false, false],
    [true, true, true, true, false, false, false, false]
];

const ITEMS = [
    "saw",
    "saw",
    "saw",
    "magnifying lens",
    "magnifying lens",
    "phone",
    "phone",
    "beer",
    "beer",
    "beer",
    "smoke",
    "smoke",
    "deadly pill",
    "deadly pill",
    "deadly pill",
    "chains",
    "chains",
    "chains",
    "inverter",
    "inverter"
];

const DEFAULTSTATS = {
    totalMatches: 0,
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

    longestLiveStreak: { val: 0, players: [], description: "Longest consecutive sequence of live bullets" },
    longestBlankStreak: { val: 0, players: [], description: "Longest consecutive sequence of blank bullets" },
    closestCall: { val: 0, players: [], description: "Lowest HP where a round was won" },
    mostDamageSurvived: { val: 0, players: [], description: "Most damage survived in a round" },
    longestConsecutiveSelfShots: { val: 0, players: [], description: "Longest consecutive sequence of safe self-shots" },
    longestTurnsOn1HP: { val: 0, players: [], description: "Longest chain of turns where a player was constantly at 1HP" },
    mostItemsInARound: { val: 0, players: [], description: "Most items used in a single round" },
    biggestHPDeficitOvercome: { val: 0, players: [], description: "Biggest HP deficit overcome to win a round" },
    consecutiveTurnsNoItem: { val: 0, players: [], description: "Most consecutive turns ended without using an item (must not be an itemless round)" },
    mostItemsHeld: { val: 0, players: [], description: "Most items held at one time" },
    fastestRound: { val: 0, players: [], description: "Fastest round ever completed" },
    slowestRound: { val: 0, players: [], description: "Slowest round ever completed" },
    mostConsecutiveNoCheck: { val: 0, players: [], description: "Most consecutive shots fired at the opponent without using items" },
    mostHealing: { val: 0, players: [], description: "Most healing done in one round" },
    mostInvertedUses: { val: 0, players: [], description: "Most inverter uses in one round" },
    mostBeerUses: { val: 0, players: [], description: "Most beers consumed in one round" },
    mostLensUses: { val: 0, players: [], description: "Most magnifying lenses used in one round" },
    mostPhoneUses: { val: 0, players: [], description: "Most phone uses in one round" },
    mostSawUses: { val: 0, players: [], description: "Most saw uses in one round" },
    mostChainUses: { val: 0, players: [], description: "Most chains used in one round" },
    leastDamageSurvived: { val: 0, players: [], description: "Least damage survived in a round" }
};

const DEFAULTSETTINGS = {
    minHealth: 2,
    maxHealth: 4,
    minItems: 0,
    maxItems: 2,
    p1Color: "#ff0000",
    p2Color: "#0a64ca",
    p1Name: "Player 1",
    p2Name: "Player 2"
};

const getData = function () {
    const raw = localStorage.getItem(BUCKSHOTROULETTE);

    if (!raw) {
        return {
            matches: [],
            stats: structuredClone(DEFAULTSTATS),
            settings: structuredClone(DEFAULTSETTINGS)
        };
    }

    try {
        return JSON.parse(raw);
    }
    catch {
        return {
            matches: [],
            stats: structuredClone(DEFAULTSTATS),
            settings: structuredClone(DEFAULTSETTINGS)
        };
    }
};

const getMatchIdx = function (p1Name, p2Name) {
    p1Name = p1Name.toLowerCase();
    p2Name = p2Name.toLowerCase();

    const data = getData();

    return data.matches.findIndex(match =>
        (match.players.p1 === p1Name && match.players.p2 === p2Name) ||
        (match.players.p1 === p2Name && match.players.p2 === p1Name)
    );
};


const getMatch = function (p1Name, p2Name) {
    p1Name = p1Name.toLowerCase();
    p2Name = p2Name.toLowerCase();

    const data = getData();

    return data.matches.find(match =>
        (match.players.p1 === p1Name && match.players.p2 === p2Name) ||
        (match.players.p1 === p2Name && match.players.p2 === p1Name)
    );
};

const writeScores = function (p1Name, p2Name, score1, score2) {
    p1Name = p1Name.toLowerCase();
    p2Name = p2Name.toLowerCase();
    const matchIdx = getMatchIdx(p1Name, p2Name);
    const data = getData();
    const date = new Date().toLocaleDateString("en-GB"); // dd/mm/yyyy

    if (matchIdx === -1) {
        data.matches.push({
            players: {
                p1: p1Name,
                p2: p2Name
            },
            scores: [[score1, score2, date]]
        });
        localStorage.setItem(BUCKSHOTROULETTE, JSON.stringify(data));
    }
    else {
        if (data.matches[matchIdx].players.p1 === p2Name) {
            data.matches[matchIdx].scores.push([score2, score1, date]);
        }
        else {
            data.matches[matchIdx].scores.push([score1, score2, date]);
        }

        localStorage.setItem(BUCKSHOTROULETTE, JSON.stringify(data));
    }
};


const clearHistory = function (p1Name, p2Name) {
    p1Name = p1Name.toLowerCase();
    p2Name = p2Name.toLowerCase();

    const data = getData();
    const matchIdx = getMatchIdx(p1Name, p2Name);

    if (matchIdx === -1)
        return;

    data.matches.splice(matchIdx, 1);

    localStorage.setItem(BUCKSHOTROULETTE, JSON.stringify(data));
};

const readSettings = function () {
    return getData().settings;
};

const writeSettings = function (settings) {
    const data = getData();

    data.settings = settings;

    localStorage.setItem(BUCKSHOTROULETTE, JSON.stringify(data));
};

const resetSettings = function () {
    const data = getData();

    data.settings = structuredClone(DEFAULTSETTINGS);

    localStorage.setItem(BUCKSHOTROULETTE, JSON.stringify(data));
};

const readStats = function () {
    return getData().stats;
};

const writeStats = function (stats) {
    const data = getData();

    data.stats = stats;

    localStorage.setItem(BUCKSHOTROULETTE, JSON.stringify(data));
};

const resetStats = function () {
    const data = getData();

    data.stats = structuredClone(DEFAULTSTATS);

    localStorage.setItem(BUCKSHOTROULETTE, JSON.stringify(data));
};

const getRandom = function (array) {
    return array[Math.floor(Math.random() * array.length)];
};

const getPermutations = function (array) {
    if (array.length === 0)
        return [[]];

    const result = [];

    for (let i = 0; i < array.length; i++) {
        const current = array[i];

        const remaining = [
            ...array.slice(0, i),
            ...array.slice(i + 1)
        ];

        for (const perm of getPermutations(remaining)) {
            result.push([current, ...perm]);
        }
    }

    return result;
};


const getPermutation = function (combination) {
    return getRandom(getPermutations(combination));
};



export { COMBINATIONS, ITEMS, getMatch, writeScores, clearHistory, readSettings, writeSettings, resetSettings, readStats, writeStats, resetStats, getRandom, getPermutation };