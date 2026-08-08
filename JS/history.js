import { getMatch, clearHistory } from "./utility.js";


const historyForm = document.getElementById("historyForm");
const errorMessageEl = document.getElementById("ErrorMessage");
const p1Input = document.getElementById("p1");
const p2Input = document.getElementById("p2");
const p1Header = document.getElementById("p1Header");
const p2Header = document.getElementById("p2Header");
const matchHistoryContainer = document.getElementById("matchHistoryBody");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");

historyForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const p1 = p1Input.value.trim();
    const p2 = p2Input.value.trim();

    if (!p1 || !p2) {
        errorMessageEl.textContent = "Please provide the names of both players!";
        matchHistoryContainer.innerHTML = "";
        return;
    }

    if (p1.toLowerCase() === p2.toLowerCase()) {
        errorMessageEl.textContent = "Please enter two different player names.";
        matchHistoryContainer.innerHTML = "";
        return;
    }

    const results = getMatch(p1, p2);

    if (!results) {
        errorMessageEl.textContent = "No history found between these two";
        matchHistoryContainer.innerHTML = "";
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
});


clearHistoryBtn.addEventListener("click", () => {
    const p1 = p1Input.value.trim();
    const p2 = p2Input.value.trim();

    if (!p1 || !p2) {
        errorMessageEl.textContent = "Please provide the names of both players!";
        matchHistoryContainer.innerHTML = "";
        return;
    }

    if (p1.toLowerCase() === p2.toLowerCase()) {
        errorMessageEl.textContent = "Please enter two different player names.";
        matchHistoryContainer.innerHTML = "";
        return;
    }

    
    if (!confirm(`Are you sure you want to clear ${p1} and ${p2} history?!`))
        return;

    clearHistory(p1, p2);
    errorMessageEl.textContent = `Successfully cleared ${p1} and ${p2} history!`;
    matchHistoryContainer.innerHTML = "";
});