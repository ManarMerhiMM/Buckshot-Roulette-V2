import { readStats, resetStats } from "./utility.js";

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

    document.getElementById("longestLiveStreak").textContent = stats.longestLiveStreak;
    document.getElementById("longestBlankStreak").textContent = stats.longestBlankStreak;
    document.getElementById("closestCall").textContent = stats.closestCall;
    document.getElementById("mostDamageSurvived").textContent = stats.mostDamageSurvived;
    document.getElementById("consecutiveSelfShots").textContent = stats.longestConsecutiveSelfShots;
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