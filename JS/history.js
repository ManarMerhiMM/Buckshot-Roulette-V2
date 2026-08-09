import { getMatch, clearHistory, getRandom } from "./utility.js";


const historyForm = document.getElementById("historyForm");
const errorMessageEl = document.getElementById("ErrorMessage");
const p1Input = document.getElementById("p1");
const p2Input = document.getElementById("p2");
const p1Header = document.getElementById("p1Header");
const p2Header = document.getElementById("p2Header");
const matchHistoryContainer = document.getElementById("matchHistoryBody");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");

// ---------- SFX ----------
// Each key holds an array of paths — playSfx picks one at random
const SFX = {
    found: ["Assets/SFX/history-found.mp3"],
    notFound: ["Assets/SFX/history-not-found.mp3"],
    cleared: ["Assets/SFX/history-cleared.mp3"]
};

const playSfx = function (key) {
    const variants = SFX[key];
    if (!variants || variants.length === 0) return;

    const src = getRandom(variants);

    try {
        const audio = new Audio(src);
        audio.volume = 0.7;
        audio.play().catch(() => { /* autoplay blocked or file missing — ignore */ });
    }
    catch {
        // ignore
    }
};


historyForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const p1 = p1Input.value.trim();
    const p2 = p2Input.value.trim();

    if (!p1 || !p2) {
        errorMessageEl.textContent = "Please provide the names of both players!";
        matchHistoryContainer.innerHTML = "";
        playSfx("notFound");
        return;
    }

    if (p1.toLowerCase() === p2.toLowerCase()) {
        errorMessageEl.textContent = "Please enter two different player names (case-insensitive).";
        matchHistoryContainer.innerHTML = "";
        playSfx("notFound");
        return;
    }

    const results = getMatch(p1, p2);

    if (!results) {
        errorMessageEl.textContent = "No history found between these two";
        matchHistoryContainer.innerHTML = "";
        playSfx("notFound");
        return;
    }


    if (p1.toLowerCase() === results.players.p1) {
        p1Header.textContent = p1;
        p2Header.textContent = p2;
    }
    else {
        p1Header.textContent = p2;
        p2Header.textContent = p1;
    }

    errorMessageEl.textContent = "";
    matchHistoryContainer.innerHTML = "";

    let rows = "";

    for (let i = results.scores.length - 1; i >= 0; i--) {
        rows += `
        <tr>
            <td>${results.scores[i][0]}</td>
            <td>${results.scores[i][1]}</td>
            <td>${results.scores[i][2]}</td>
        </tr>`;
    }

    matchHistoryContainer.innerHTML = rows;
    playSfx("found");
});


clearHistoryBtn.addEventListener("click", () => {
    const p1 = p1Input.value.trim();
    const p2 = p2Input.value.trim();

    if (!p1 || !p2) {
        errorMessageEl.textContent = "Please provide the names of both players!";
        matchHistoryContainer.innerHTML = "";
        playSfx("notFound");
        return;
    }

    if (p1.toLowerCase() === p2.toLowerCase()) {
        errorMessageEl.textContent = "Please enter two different player names (case-insensitive).";
        matchHistoryContainer.innerHTML = "";
        playSfx("notFound");
        return;
    }


    if (!confirm(`Are you sure you want to clear ${p1} and ${p2} history?!`))
        return;

    clearHistory(p1, p2);
    errorMessageEl.textContent = `Successfully cleared ${p1} and ${p2} history!`;
    matchHistoryContainer.innerHTML = "";
    playSfx("cleared");
});