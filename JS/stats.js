import { readStats, resetStats } from "./utility.js";

const formatRecord = function (record) {
    if (record.val === 0 || record.players.length === 0) {
        return "0";
    }

    const players = record.players
        .map(player => `<span class="player-name">${player}</span>`)
        .join(", ");

    return `${record.val} by ${players}`;
};

const renderStats = function () {
    const stats = readStats();

    document.getElementById("totalMatches").textContent = stats.totalMatches;
    document.getElementById("totalRounds").textContent = stats.totalRounds;

    document.getElementById("roundsPerMatch").textContent =
        stats.totalMatches === 0
            ? "0"
            : (stats.totalRounds / stats.totalMatches).toFixed(2);

    document.getElementById("sawsUsed").textContent = stats.itemFrequencies.saw;
    document.getElementById("magnifyingLensesUsed").textContent = stats.itemFrequencies.magnifyingLens;
    document.getElementById("phonesUsed").textContent = stats.itemFrequencies.phone;
    document.getElementById("beersUsed").textContent = stats.itemFrequencies.beer;
    document.getElementById("smokesUsed").textContent = stats.itemFrequencies.smoke;
    document.getElementById("deadlyPillsUsed").textContent = stats.itemFrequencies.deadlyPill;
    document.getElementById("chainsUsed").textContent = stats.itemFrequencies.chains;
    document.getElementById("invertersUsed").textContent = stats.itemFrequencies.inverter;

    document.getElementById("longestLiveStreak").innerHTML = formatRecord(stats.longestLiveStreak);
    document.getElementById("longestBlankStreak").innerHTML = formatRecord(stats.longestBlankStreak);
    document.getElementById("closestCall").innerHTML = formatRecord(stats.closestCall);
    document.getElementById("mostDamageSurvived").innerHTML = formatRecord(stats.mostDamageSurvived);
    document.getElementById("consecutiveSelfShots").innerHTML = formatRecord(stats.longestConsecutiveSelfShots);
}


renderStats();


document.getElementById("resetStatsBtn").addEventListener("click", () => {
    if (!confirm("Are you sure you want to reset all stats?! This can't be undone!")) {
        return;
    }

    resetStats();
    renderStats();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});