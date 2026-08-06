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

const COLORS = {
    RED: "#ff0000",
    GREEN: "#00ff00",
    YELLOW: "#ffff00",
    BLUE: "#0000ff",
    MAGENTA: "#ff00ff",
    CYAN: "#00ffff",
    WHITE: "#ffffff",
    BLACK: "#000000",
    LIGHT_BLACK: "#555555",
    LIGHT_RED: "#ff5555",
    LIGHT_GREEN: "#55ff55",
    LIGHT_YELLOW: "#ffff55",
    LIGHT_BLUE: "#5555ff",
    LIGHT_MAGENTA: "#ff55ff",
    LIGHT_CYAN: "#55ffff",
    LIGHT_GREY: "#d1d1d1"
};

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
    longestLiveStreak: 0,
    longestBlankStreak: 0,
    closestCall: 0,
    mostDamageSurvived: 0,
    longestConsecutiveSelfShots: 0
};

const DEFAULTSETTINGS = {
    minHealth: 2,
    maxHealth: 4,
    minItems: 0,
    maxItems: 2,
    p1Color: "#ff0000",
    p2Color: "#00ffff"
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

const resetSettings = function(){
    const data = getData();

    data.settings = structuredClone(DEFAULTSETTINGS);

    localStorage.setItem(BUCKSHOTROULETTE, JSON.stringify(data));
};

const readStats = function(){
    return getData().stats;
};

const writeStats = function(stats){
    const data = getData();

    data.stats = stats;

    localStorage.setItem(BUCKSHOTROULETTE, JSON.stringify(data));
};

const resetStats = function(){
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



export { COMBINATIONS, ITEMS, COLORS, getMatch, writeScores, clearHistory, readSettings, writeSettings, resetSettings, readStats, writeStats, resetStats, getRandom, getPermutation };