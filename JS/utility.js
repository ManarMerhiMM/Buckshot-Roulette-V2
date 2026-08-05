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

const readScores = function (p1Name, p2Name) {
    const results = localStorage.getItem(`${BUCKSHOTROULETTE}-${p1Name}-${p2Name}`) || localStorage.getItem(`${BUCKSHOTROULETTE}-${p2Name}-${p1Name}`);

    if (!results)
        return -1; // No stored results for these 2 players found


    try {
        return JSON.parse(results);
    }
    catch {
        return -1; // Corrupt storage
    }

};

const writeScores = function (p1Name, p2Name, scores) {
    const curResults = readScores(p1Name, p2Name);

    if (curResults === -1) {
        localStorage.setItem(`${BUCKSHOTROULETTE}-${p1Name}-${p2Name}`, JSON.stringify({
            players: {
                p1: p1Name,
                p2: p2Name
            },
            scores: [...scores]
        }));
    }
    else {
        if (curResults.players.p1 === p2Name) {
            curResults.scores.push(...scores.map(score => [score[1], score[0]]));

            localStorage.setItem(`${BUCKSHOTROULETTE}-${p2Name}-${p1Name}`, JSON.stringify(curResults));
        }
        else {
            curResults.scores.push(...scores);
            localStorage.setItem(`${BUCKSHOTROULETTE}-${p1Name}-${p2Name}`, JSON.stringify(curResults));
        }
    }
};


const clearHistory = function (p1Name, p2Name) {
    localStorage.removeItem(`${BUCKSHOTROULETTE}-${p1Name}-${p2Name}`);
    localStorage.removeItem(`${BUCKSHOTROULETTE}-${p2Name}-${p1Name}`);
};

const getDefaults = async function () {
    const response = await fetch("./Data/Defaults.json");
    return await response.json();
};

const readSettings = async function () {
    const settings = localStorage.getItem(`${BUCKSHOTROULETTE}-Settings`);

    if (settings) {
        try {
            return JSON.parse(settings);
        }
        catch {
            return getDefaults();
        }
    }

    return getDefaults();
};

const writeSettings = function (settings) {
    localStorage.setItem(`${BUCKSHOTROULETTE}-Settings`, JSON.stringify(settings));
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

export { COMBINATIONS, ITEMS, COLORS, readScores, writeScores, clearHistory, readSettings, writeSettings, getRandom, getPermutation };