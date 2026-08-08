import { readSettings, writeSettings, resetSettings } from "./utility.js";

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

const loadSettings = function () {
    const settings = readSettings();

    minHealthInput.value = settings.minHealth;
    maxHealthInput.value = settings.maxHealth;
    minItemsInput.value = settings.minItems;
    maxItemsInput.value = settings.maxItems;

    p1ColorInput.value = settings.p1Color;
    p2ColorInput.value = settings.p2Color;
    p1NameInput.value = settings.p1Name;
    p2NameInput.value = settings.p2Name;
}

loadSettings();


const showError = function (msg) {
    errorMessage.textContent = msg;
    window.scrollTo({ top: 0, behavior: "smooth" });
};


document.getElementById("saveSettingsBtn").addEventListener("click", () => {
    errorMessage.textContent = "";

    const minHealth = +minHealthInput.value;
    const maxHealth = +maxHealthInput.value;
    const minItems = +minItemsInput.value;
    const maxItems = +maxItemsInput.value;
    const p1Name = p1NameInput.value.trim();
    const p2Name = p2NameInput.value.trim();

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

    // 4. Players
    if (!p1Name || !p2Name) {
        return showError("Must enter a name for each player.");
    }

    if (p1Name.toLowerCase() === p2Name.toLowerCase()) {
        return showError("The 2 players cannot have the same name (case-insensitive).");
    }

    if (p1ColorInput.value === p2ColorInput.value) {
        return showError("The 2 players cannot have the same color.");
    }

    // 5. Confirm and persist
    if (!confirm("Are you sure you want to save these settings?")) {
        return;
    }

    writeSettings({
        minHealth: minHealth,
        maxHealth: maxHealth,
        minItems: minItems,
        maxItems: maxItems,
        p1Color: p1ColorInput.value,
        p2Color: p2ColorInput.value,
        p1Name: p1Name,
        p2Name: p2Name
    });

    showError("Successfully saved edits!");
});

document.getElementById("resetSettingsBtn").addEventListener("click", () => {
    if (!confirm("Are you sure you want to reset back to defaults?")) {
        return;
    }

    resetSettings();
    loadSettings();

    showError("Settings have been reset!");
});