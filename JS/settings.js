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


document.getElementById("saveSettingsBtn").addEventListener("click", () => {
    errorMessage.textContent = "";

    const minHealth = +minHealthInput.value;
    const maxHealth = +maxHealthInput.value;
    const minItems = +minItemsInput.value;
    const maxItems = +maxItemsInput.value;
    const p1Name = p1NameInput.value.trim();
    const p2Name = p2NameInput.value.trim();

    if ([minHealth, maxHealth, minItems, maxItems].some(v => isNaN(v))) {
        errorMessage.textContent = "Please enter valid numbers for all settings.";
        return;
    }

    if (minHealth < 1 || maxHealth < 1) {
        errorMessage.textContent = "Health must be at least 1.";
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
        return;
    }

    if (minItems < 0 || maxItems < 0) {
        errorMessage.textContent = "Items cannot be negative.";
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
        return;
    }

    if (minHealth > maxHealth) {
        errorMessage.textContent = "Minimum health cannot be greater than maximum health.";
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
        return;
    }

    if (minItems > maxItems) {
        errorMessage.textContent = "Minimum items cannot be greater than maximum items.";
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
        return;
    }

    if (!p1Name || !p2Name) {
        {
            errorMessage.textContent = "Must enter a name for each player.";
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
            return;
        }
    }

    if (p1Name.toLowerCase() === p2Name.toLowerCase()) {
        errorMessage.textContent = "The 2 players cannot have the same name (case-insensitive).";
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
        return;
    }

    
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

    errorMessage.textContent = "Successfully saved edits!";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});

document.getElementById("resetSettingsBtn").addEventListener("click", () => {
    if (!confirm("Are you sure you want to reset back to defaults?")) {
        return;
    }

    resetSettings();
    loadSettings();

    errorMessage.textContent = "Settings have been reset!";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});