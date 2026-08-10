const BUCKSHOTROULETTE = "BuckshotRoulette";

// Grouped by length so every length (2–8) is equally likely to be
// picked, regardless of how many live/blank splits exist within it.
const COMBINATIONS = [
    [ // length 2
        [true, false]
    ],
    [ // length 3
        [true, false, false],
        [true, true, false]
    ],
    [ // length 4
        [true, false, false, false],
        [true, true, false, false],
        [true, true, true, false]
    ],
    [ // length 5
        [true, false, false, false, false],
        [true, true, false, false, false],
        [true, true, true, false, false],
        [true, true, true, true, false]
    ],
    [ // length 6
        [true, false, false, false, false, false],
        [true, true, false, false, false, false],
        [true, true, true, false, false, false],
        [true, true, true, true, false, false],
        [true, true, true, true, true, false]
    ],
    [ // length 7
        [true, false, false, false, false, false, false],
        [true, true, false, false, false, false, false],
        [true, true, true, false, false, false, false],
        [true, true, true, true, false, false, false],
        [true, true, true, true, true, false, false],
        [true, true, true, true, true, true, false]
    ],
    [ // length 8
        [true, false, false, false, false, false, false, false],
        [true, true, false, false, false, false, false, false],
        [true, true, true, false, false, false, false, false],
        [true, true, true, true, false, false, false, false],
        [true, true, true, true, true, false, false, false],
        [true, true, true, true, true, true, false, false],
        [true, true, true, true, true, true, true, false]
    ]
];

const ITEMS = [
    // 16%
    "saw", "saw", "saw", "saw", "saw", "saw", "saw", "saw",
    "saw", "saw", "saw", "saw", "saw", "saw", "saw", "saw",

    // 16%
    "beer", "beer", "beer", "beer", "beer", "beer", "beer", "beer",
    "beer", "beer", "beer", "beer", "beer", "beer", "beer", "beer",


    // 16%
    "deadly pill", "deadly pill", "deadly pill", "deadly pill",
    "deadly pill", "deadly pill", "deadly pill", "deadly pill",
    "deadly pill", "deadly pill", "deadly pill", "deadly pill",
    "deadly pill", "deadly pill", "deadly pill", "deadly pill",

    // 16%
    "inverter", "inverter", "inverter", "inverter", "inverter", "inverter",
    "inverter", "inverter", "inverter", "inverter", "inverter", "inverter",
    "inverter", "inverter", "inverter", "inverter",

    // 10%
    "smoke", "smoke", "smoke", "smoke", "smoke",
    "smoke", "smoke", "smoke", "smoke", "smoke",

    // 7%
    "phone", "phone", "phone", "phone", "phone", "phone", "phone",

    // 7%
    "magnifying lens", "magnifying lens", "magnifying lens",
    "magnifying lens", "magnifying lens", "magnifying lens",
    "magnifying lens",

    // 6%
    "chains", "chains", "chains", "chains", "chains", "chains",

    // 6%
    "landmine", "landmine", "landmine", "landmine", "landmine", "landmine"
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
        inverter: 0,
        landmine: 0
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
    mostSmokeUses: { val: 0, players: [], description: "Most smokes used in one round" },
    mostDeadlyPillUses: { val: 0, players: [], description: "Most deadly pills used in one round" },
    mostLandmineUses: { val: 0, players: [], description: "Most landmines used in one round" },
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

// Dynamic on read: merges whatever is actually in localStorage against
// the CURRENT defaults, one level deep for stats/settings, and one
// level deeper still for itemFrequencies (the one nested object whose
// inside can grow when a new item is added). This is what lets old
// players' localStorage stay compatible after new achievements,
// settings, or items get added — nothing else needs to change per
// addition, since every write goes through getData() first too.
const getData = function () {
    const fallback = {
        matches: [],
        stats: structuredClone(DEFAULTSTATS),
        settings: structuredClone(DEFAULTSETTINGS)
    };

    const raw = localStorage.getItem(BUCKSHOTROULETTE);
    if (!raw) return fallback;

    try {
        const data = JSON.parse(raw);

        return {
            matches: data.matches ?? [],
            settings: { ...fallback.settings, ...data.settings },
            stats: {
                ...fallback.stats,
                ...data.stats,
                itemFrequencies: {
                    ...fallback.stats.itemFrequencies,
                    ...data.stats?.itemFrequencies
                }
            }
        };
    }
    catch {
        return fallback;
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

const getRandomCombination = function () {
    return getRandom(getRandom(COMBINATIONS));
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



export { COMBINATIONS, ITEMS, getRandomCombination, getMatch, writeScores, clearHistory, readSettings, writeSettings, resetSettings, readStats, writeStats, resetStats, getRandom, getPermutation };