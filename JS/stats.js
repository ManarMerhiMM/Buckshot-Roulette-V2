import { readStats, resetStats, getRandom } from "./utility.js";

const achievementsSection = document.getElementById("achievementsSection");

let tooltipEl = null;
let activeLabel = null;

// ---------- SFX ----------
// Each key holds an array of paths — playSfx picks one at random.
const SFX = {
    cleared: ["Assets/SFX/history-cleared.mp3"],
    intro: ["Assets/SFX/stats_on_load.mp3"]
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


const formatRecord = function (record) {
    if (record.players.length === 0) {
        return "0";
    }

    if (record.players.length === 1) {
        return `${record.val} by <span class="player-name-special">${record.players[0]}</span>`
    }

    const players = record.players
        .map(player => `<span class="player-name-regular">${player}</span>`)
        .join(", ");

    return `${record.val} by ${players}`;
};

const formatTimeRecord = function (record) {
    if (record.players.length === 0) {
        return "0";
    }

    const minutes = Math.floor(record.val / 60);
    const seconds = (record.val % 60).toFixed(2);

    const time = minutes > 0
        ? `${minutes}m ${seconds}s`
        : `${seconds}s`;

    if (record.players.length === 1) {
        return `${time} by <span class="player-name-special">${record.players[0]}</span>`;
    }

    const players = record.players
        .map(player => `<span class="player-name-regular">${player}</span>`)
        .join(", ");

    return `${time} by ${players}`;
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
    document.getElementById("landminesUsed").textContent = stats.itemFrequencies.landmine;
    document.getElementById("defuseKitsUsed").textContent = stats.itemFrequencies.defuseKit;

    document.getElementById("longestLiveStreak").innerHTML = formatRecord(stats.longestLiveStreak);
    document.getElementById("liveStreakLabel").dataset.description = stats.longestLiveStreak.description;

    document.getElementById("longestBlankStreak").innerHTML = formatRecord(stats.longestBlankStreak);
    document.getElementById("blankStreakLabel").dataset.description = stats.longestBlankStreak.description;

    document.getElementById("closestCall").innerHTML = formatRecord(stats.closestCall);
    document.getElementById("closestCallLabel").dataset.description = stats.closestCall.description;

    document.getElementById("mostDamageSurvived").innerHTML = formatRecord(stats.mostDamageSurvived);
    document.getElementById("mostDamageSurvivedLabel").dataset.description = stats.mostDamageSurvived.description;

    document.getElementById("consecutiveSelfShots").innerHTML = formatRecord(stats.longestConsecutiveSelfShots);
    document.getElementById("mostConsecutiveSelfShotsLabel").dataset.description = stats.longestConsecutiveSelfShots.description;

    document.getElementById("longestTurnsOn1HP").innerHTML = formatRecord(stats.longestTurnsOn1HP);
    document.getElementById("longestTurnsOn1HPLabel").dataset.description = stats.longestTurnsOn1HP.description;

    document.getElementById("mostItemsInARound").innerHTML = formatRecord(stats.mostItemsInARound);
    document.getElementById("mostItemsInARoundLabel").dataset.description = stats.mostItemsInARound.description;

    document.getElementById("biggestHPDeficitOvercome").innerHTML = formatRecord(stats.biggestHPDeficitOvercome);
    document.getElementById("biggestHPDeficitOvercomeLabel").dataset.description = stats.biggestHPDeficitOvercome.description;

    document.getElementById("consecutiveTurnsNoItem").innerHTML = formatRecord(stats.consecutiveTurnsNoItem);
    document.getElementById("consecutiveTurnsNoItemLabel").dataset.description = stats.consecutiveTurnsNoItem.description;

    document.getElementById("mostItemsHeld").innerHTML = formatRecord(stats.mostItemsHeld);
    document.getElementById("mostItemsHeldLabel").dataset.description = stats.mostItemsHeld.description;

    document.getElementById("fastestRound").innerHTML = formatTimeRecord(stats.fastestRound);
    document.getElementById("fastestRoundLabel").dataset.description = stats.fastestRound.description;

    document.getElementById("slowestRound").innerHTML = formatTimeRecord(stats.slowestRound);
    document.getElementById("slowestRoundLabel").dataset.description = stats.slowestRound.description;

    document.getElementById("mostConsecutiveNoCheck").innerHTML = formatRecord(stats.mostConsecutiveNoCheck);
    document.getElementById("mostConsecutiveNoCheckLabel").dataset.description = stats.mostConsecutiveNoCheck.description;

    document.getElementById("mostHealing").innerHTML = formatRecord(stats.mostHealing);
    document.getElementById("mostHealingLabel").dataset.description = stats.mostHealing.description;

    document.getElementById("mostInvertedUses").innerHTML = formatRecord(stats.mostInvertedUses);
    document.getElementById("mostInvertedUsesLabel").dataset.description = stats.mostInvertedUses.description;

    document.getElementById("mostBeerUses").innerHTML = formatRecord(stats.mostBeerUses);
    document.getElementById("mostBeerUsesLabel").dataset.description = stats.mostBeerUses.description;

    document.getElementById("mostLensUses").innerHTML = formatRecord(stats.mostLensUses);
    document.getElementById("mostLensUsesLabel").dataset.description = stats.mostLensUses.description;

    document.getElementById("mostPhoneUses").innerHTML = formatRecord(stats.mostPhoneUses);
    document.getElementById("mostPhoneUsesLabel").dataset.description = stats.mostPhoneUses.description;

    document.getElementById("mostSawUses").innerHTML = formatRecord(stats.mostSawUses);
    document.getElementById("mostSawUsesLabel").dataset.description = stats.mostSawUses.description;

    document.getElementById("mostChainUses").innerHTML = formatRecord(stats.mostChainUses);
    document.getElementById("mostChainUsesLabel").dataset.description = stats.mostChainUses.description;

    document.getElementById("mostSmokeUses").innerHTML = formatRecord(stats.mostSmokeUses);
    document.getElementById("mostSmokeUsesLabel").dataset.description = stats.mostSmokeUses.description;

    document.getElementById("mostDeadlyPillUses").innerHTML = formatRecord(stats.mostDeadlyPillUses);
    document.getElementById("mostDeadlyPillUsesLabel").dataset.description = stats.mostDeadlyPillUses.description;

    document.getElementById("leastDamageSurvived").innerHTML = formatRecord(stats.leastDamageSurvived);
    document.getElementById("leastDamageSurvivedLabel").dataset.description = stats.leastDamageSurvived.description;

    document.getElementById("mostLandmineUses").innerHTML = formatRecord(stats.mostLandmineUses);
    document.getElementById("mostLandmineUsesLabel").dataset.description = stats.mostLandmineUses.description;

    document.getElementById("mostDefuseKitUses").innerHTML = formatRecord(stats.mostDefuseKitUses);
    document.getElementById("mostDefuseKitUsesLabel").dataset.description = stats.mostDefuseKitUses.description;
}


renderStats();

const ensureTooltip = function () {
    if (tooltipEl) return tooltipEl;

    tooltipEl = document.createElement("div");
    tooltipEl.className = "achievement-tooltip";
    tooltipEl.setAttribute("role", "tooltip");
    document.body.appendChild(tooltipEl);

    return tooltipEl;
};

const positionTooltip = function (label) {
    const rect = label.getBoundingClientRect();
    const tip = tooltipEl.getBoundingClientRect();
    const margin = 8;

    // Prefer below the label; flip above if it would overflow the viewport.
    let top = rect.bottom + margin;
    if (top + tip.height > window.innerHeight - margin) {
        top = rect.top - tip.height - margin;
    }
    top = Math.max(margin, top);

    // Center horizontally over the label, then clamp inside the viewport.
    let left = rect.left + rect.width / 2 - tip.width / 2;
    left = Math.max(margin, Math.min(left, window.innerWidth - tip.width - margin));

    tooltipEl.style.top = `${top}px`;
    tooltipEl.style.left = `${left}px`;
};

const hideTooltip = function () {
    if (tooltipEl) tooltipEl.classList.remove("is-visible");
    activeLabel = null;
};

const showTooltip = function (label) {
    const text = label.dataset.description;
    if (!text) return;

    ensureTooltip();
    tooltipEl.textContent = text;   // set text first so size is correct
    positionTooltip(label);         // measure & place while still hidden
    tooltipEl.classList.add("is-visible");
    activeLabel = label;
};

if (achievementsSection) {
    // Toggle the tooltip when an achievement label is tapped/clicked.
    achievementsSection.addEventListener("click", (e) => {
        const label = e.target.closest(".label");
        if (!label) return;

        e.stopPropagation(); // keep the document handler below from closing it

        if (activeLabel === label) {
            hideTooltip();
        } else {
            showTooltip(label);
        }
    });
}

// Dismiss on any outside tap/click, on scroll, on resize, or on Escape.
document.addEventListener("click", hideTooltip);
window.addEventListener("scroll", hideTooltip, { passive: true });
window.addEventListener("resize", hideTooltip);
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideTooltip();
});


document.getElementById("resetStatsBtn").addEventListener("click", () => {
    if (!confirm("Are you sure you want to reset all stats?! This can't be undone!")) {
        return;
    }

    resetStats();
    renderStats();
    hideTooltip();
    playSfx("cleared");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});



const playStatsIntro = async function () {
    if (document.querySelectorAll(".player-name-special").length === 0 && document.querySelectorAll(".player-name-regular").length === 0)
        return;

    try {
        const introBase = sfxCache["Assets/SFX/stats_on_load.mp3"];
        const intro = introBase ? introBase.cloneNode(true) : new Audio("Assets/SFX/stats_on_load.mp3");
        await intro.play();

        setTimeout(() => {
            document.querySelectorAll(".player-name-special").forEach(player =>
                player.classList.add("player-name-special-shot")
            );
            document.querySelectorAll(".player-name-regular").forEach(player =>
                player.classList.add("player-name-regular-shot")
            );
        }, 3200);

    } catch (err) {
        console.warn("Audio playback was blocked or failed:", err);

        document.querySelectorAll(".player-name-special").forEach(player =>
            player.classList.add("player-name-special-shot")
        );
        document.querySelectorAll(".player-name-regular").forEach(player =>
            player.classList.add("player-name-regular-shot")
        );
    }


};

// Try on page load
playStatsIntro();