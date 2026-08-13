import { readSettings, writeSettings, resetSettings, getRandom } from "./utility.js";

const gameModeInput = document.getElementById("gameMode");
const minHealthInput = document.getElementById("minHealth");
const maxHealthInput = document.getElementById("maxHealth");
const minItemsInput = document.getElementById("minItems");
const maxItemsInput = document.getElementById("maxItems");
const p1ColorInput = document.getElementById("p1Color");
const p2ColorInput = document.getElementById("p2Color");
const p1NameInput = document.getElementById("p1Name");
const p2NameInput = document.getElementById("p2Name");

const errorMessage = document.getElementById("errorMessage");


const MAX_HEALTH = 10;
const MAX_ITEMS = 10;

// In PvE the opponent is a fixed AI identity the user can't rename/recolor.
const CPU_NAME = "CPU";
const CPU_COLOR = "#8a8a8a";                 // rgb(138, 138, 138)
const HUMAN_P2_NAME_FALLBACK = "Player 2";
const HUMAN_P2_COLOR_FALLBACK = "#0a64ca";

// "CPU" and its grey (rgb 138,138,138) belong to the AI opponent alone. No
// human may use either — in PvP or PvE — so nobody can impersonate the bot,
// including in saved stats and match history.
const isReservedName = (name) => name.trim().toLowerCase() === CPU_NAME.toLowerCase();
const isReservedColor = (color) => color.trim().toLowerCase() === CPU_COLOR.toLowerCase();

// Remembers the human's PvP Player-2 name/color while PvE has them locked,
// so switching back to PvP restores them instead of leaving "CPU" behind.
let savedP2Name = HUMAN_P2_NAME_FALLBACK;
let savedP2Color = HUMAN_P2_COLOR_FALLBACK;

// Lock the P2 name/color fields to the CPU identity in PvE; restore and
// unlock them in PvP. Called on load and whenever the mode changes.
const applyGameModeUI = function () {
    if (gameModeInput.value === "PvE") {
        p2NameInput.value = CPU_NAME;
        p2ColorInput.value = CPU_COLOR;
        p2NameInput.disabled = true;
        p2ColorInput.disabled = true;
    }
    else {
        p2NameInput.value = savedP2Name;
        p2ColorInput.value = savedP2Color;
        p2NameInput.disabled = false;
        p2ColorInput.disabled = false;
    }
};

// ---------- SFX ----------
// Each key holds an array of paths — playSfx picks one at random
const SFX = {
    success: ["Assets/SFX/settings-success.mp3"],
    error: ["Assets/SFX/settings-error.mp3"],
    reset: ["Assets/SFX/history-cleared.mp3"]
};

// Preload every SFX this page can play, once at load, so the first real play has no download delay.
const sfxCache = {};

Object.values(SFX).flat().forEach(src => {
    if (sfxCache[src]) return;

    const audio = new Audio();
    audio.preload = "auto";
    audio.src = src;
    audio.load();

    sfxCache[src] = audio;
});

const playSfx = function (key) {
    const variants = SFX[key];
    if (!variants || variants.length === 0) return;

    const src = getRandom(variants);

    try {
        const base = sfxCache[src];
        const audio = base ? base.cloneNode(true) : new Audio(src);
        audio.volume = 0.7;
        audio.play().catch(() => { /* autoplay blocked or file missing — ignore */ });
    }
    catch {
        // ignore
    }
};


const loadSettings = function () {
    const settings = readSettings();

    gameModeInput.value = settings.gameMode;
    minHealthInput.value = settings.minHealth;
    maxHealthInput.value = settings.maxHealth;
    minItemsInput.value = settings.minItems;
    maxItemsInput.value = settings.maxItems;

    p1ColorInput.value = settings.p1Color;
    p2ColorInput.value = settings.p2Color;
    p1NameInput.value = settings.p1Name;
    p2NameInput.value = settings.p2Name;

    // Seed the remembered PvP values from storage, ignoring a stored CPU
    // identity (which came from a previous PvE save), then lock/unlock
    // the P2 fields to match the current mode.
    savedP2Name = (settings.p2Name && settings.p2Name !== CPU_NAME)
        ? settings.p2Name : HUMAN_P2_NAME_FALLBACK;
    savedP2Color = (settings.p2Color && settings.p2Color !== CPU_COLOR)
        ? settings.p2Color : HUMAN_P2_COLOR_FALLBACK;

    applyGameModeUI();
}

loadSettings();

// When the user flips the mode, remember their PvP P2 values before PvE
// overwrites them, then relock/restore the fields.
gameModeInput.addEventListener("change", () => {
    if (gameModeInput.value === "PvE") {
        const currentName = p2NameInput.value.trim();
        if (currentName && currentName !== CPU_NAME) savedP2Name = currentName;
        savedP2Color = p2ColorInput.value;
    }
    applyGameModeUI();
});


const setMessage = function (msg) {
    errorMessage.textContent = msg;
    window.scrollTo({ top: 0, behavior: "smooth" });
};

const showError = function (msg) {
    setMessage(msg);
    playSfx("error");
};

const showSuccess = function (msg, successType) {
    setMessage(msg);

    if (successType)
        playSfx("success");
    else
        playSfx("reset");
};


document.getElementById("saveSettingsBtn").addEventListener("click", () => {
    errorMessage.textContent = "";

    const pve = gameModeInput.value === "PvE";

    const minHealth = +minHealthInput.value;
    const maxHealth = +maxHealthInput.value;
    const minItems = +minItemsInput.value;
    const maxItems = +maxItemsInput.value;
    const p1Name = p1NameInput.value.trim();
    // The P2 inputs only count in PvP. In PvE the slot is the CPU at runtime
    // (game.js assumes that), so we ignore the locked fields and persist the
    // remembered human P2 identity instead — "CPU"/grey are never saved.
    const p2Name = pve ? savedP2Name : p2NameInput.value.trim();
    const p2Color = pve ? savedP2Color : p2ColorInput.value;

    // 1. Are the numbers even numbers?
    if ([minHealth, maxHealth, minItems, maxItems].some(v => isNaN(v))) {
        return showError("Please enter valid numbers for all settings.");
    }

    // 2. Individual bounds — catch out-of-range values before comparing them to each other
    if (minHealth < 1 || maxHealth < 1) {
        return showError("Health must be at least 1.");
    }

    if (maxHealth > MAX_HEALTH) {
        return showError(`Maximum health is ${MAX_HEALTH}.`);
    }

    if (minItems < 0 || maxItems < 0) {
        return showError("Items cannot be negative.");
    }

    if (maxItems > MAX_ITEMS) {
        return showError(`Maximum number of items is ${MAX_ITEMS}.`);
    }

    // 3. Relational checks — now that each value is individually valid
    if (minHealth > maxHealth) {
        return showError("Minimum health cannot be greater than maximum health.");
    }

    if (minItems > maxItems) {
        return showError("Minimum items cannot be greater than maximum items.");
    }

    // 4. Players — the P2 fields only matter in PvP.
    if (!p1Name || (!pve && !p2Name)) {
        return showError("Must enter a name for each player.");
    }

    // "CPU" and its grey are reserved for the AI opponent — no human may use
    // them in either mode. In PvE the P2 slot legitimately IS the CPU, so it's
    // exempt from these two checks; everyone else is blocked.
    if (isReservedName(p1Name) || (!pve && isReservedName(p2Name))) {
        return showError('The name "CPU" is reserved for the AI opponent.');
    }

    if (isReservedColor(p1ColorInput.value) || (!pve && isReservedColor(p2Color))) {
        return showError("That exact grey is reserved for the AI opponent.");
    }

    if (!pve && p1Name.toLowerCase() === p2Name.toLowerCase()) {
        return showError("The 2 players cannot have the same name (case-insensitive).");
    }

    if (!pve && p1ColorInput.value.toLowerCase() === p2Color.toLowerCase()) {
        return showError("The 2 players cannot have the same color.");
    }

    // 5. Confirm and persist
    if (!confirm("Are you sure you want to save these settings?")) {
        return;
    }

    writeSettings({
        gameMode: gameModeInput.value,
        minHealth: minHealth,
        maxHealth: maxHealth,
        minItems: minItems,
        maxItems: maxItems,
        p1Color: p1ColorInput.value,
        p2Color: p2Color,
        p1Name: p1Name,
        p2Name: p2Name
    });

    showSuccess("Successfully saved edits!", true);
});

document.getElementById("resetSettingsBtn").addEventListener("click", () => {
    if (!confirm("Are you sure you want to reset back to defaults?")) {
        return;
    }

    resetSettings();
    loadSettings();

    showSuccess("Settings have been reset!", false);
});