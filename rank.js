// rank.js - Midpoint Checkpoint Guarded Rank & Continuous Lap Tracking

window.playerLap = 1;
window.playerU = 0;
window.playerLastU = 0;
window.playerPassedMidpoint = false;
window.playerFinished = false;
window.raceFinishOrder = [];
let lastLeaderName = null;

// Helper to grab the latest customized player name
const getPlayerName = () => window.KART_CONFIGS?.player?.name || window.userCustomProfile?.name || 'YOU (Player)';

// Helper to retrieve and convert kart color number to a CSS hex string
const getDriverColorHex = (driverName, isPlayer, driverObj) => {
  let colorNum = 0xffffff;
  if (isPlayer) {
    colorNum = window.KART_CONFIGS?.player?.color ?? 0x00ff66;
  } else if (driverObj && driverObj.color) {
    colorNum = driverObj.color;
  } else if (typeof aiCars !== 'undefined') {
    const foundAi = aiCars.find(a => a.name === driverName);
    if (foundAi && foundAi.color) colorNum = foundAi.color;
  }
  
  if (typeof colorNum === 'number') {
    return '#' + colorNum.toString(16).padStart(6, '0');
  }
  return colorNum || '#ffffff';
};

function getAiProgress(ai) {
  if (!ai) return 0;
  const maxLaps = typeof TOTAL_LAPS !== 'undefined' ? TOTAL_LAPS : 3;
  
  if (ai.finished) {
    return maxLaps + (ai.finishOrderIndex ? (1.0 / (ai.finishOrderIndex + 1)) : 0.1);
  }
  
  const currentLap = Math.min(ai.lap || 1, maxLaps);
  return (currentLap - 1) + (ai.u || 0);
}

function resetRankSystem() {
  window.playerLap = 1;
  window.playerU = 0;
  window.playerLastU = 0;
  window.playerPassedMidpoint = false;
  window.playerFinished = false;
  window.raceFinishOrder = [];
  lastLeaderName = null;

  if (typeof aiCars !== 'undefined' && Array.isArray(aiCars)) {
    aiCars.forEach(ai => {
      ai.lap = 1;
      ai.passedMidpoint = false;
      ai.finished = false;
      ai.u = 0;
      ai.lastU = 0;
      ai.initialU = 0;
      ai.finishOrderIndex = null;
      ai.visualUOffset = typeof ai.initialVisualUOffset === 'number' ? ai.initialVisualUOffset : 0;
      ai.offsetLane = typeof ai.initialOffsetLane === 'number' ? ai.initialOffsetLane : (ai.offsetLane ?? 0);
      delete ai._baseSpeed;
      delete ai._targetLane;
    });
    if (typeof window.initKartBehavior === 'function') {
      window.initKartBehavior(aiCars);
    }
  }

  const lapEl = document.getElementById('current-lap');
  if (lapEl) lapEl.innerText = window.playerLap;
}

function updateRanksAndLaps(trackCurve, TOTAL_LAPS, playerCar, aiCars) {
  if (!playerCar || !trackCurve || typeof trackCurve.getPointAt !== 'function') return;

  let minDistanceSq = Infinity;
  let bestU = window.playerU;

  const searchRange = 0.40;
  const samples = 200;

  for (let i = 0; i < samples; i++) {
    const offset = ((i / samples) - 0.5) * searchRange;
    const testU = (window.playerLastU + offset + 1.0) % 1.0;
    const pt = trackCurve.getPointAt(testU);
    
    if (pt && playerCar.position) {
      const distSq = playerCar.position.distanceToSquared(pt);

      if (distSq < minDistanceSq) {
        minDistanceSq = distSq;
        bestU = testU;
      }
    }
  }

  window.playerU = bestU;

  // Track Player Midpoint Checkpoint
  if (window.playerU > 0.40 && window.playerU < 0.60) {
    window.playerPassedMidpoint = true;
  }

  // Lap progression for Player (Requires passing midpoint first)
  if (window.playerLastU > 0.80 && window.playerU < 0.20 && window.playerPassedMidpoint && !window.playerFinished) {
    window.playerPassedMidpoint = false;
    window.playerLap += 1;

    if (window.playerLap > TOTAL_LAPS) {
      window.playerFinished = true;
      window.playerLap = TOTAL_LAPS;
      recordFinish({ name: getPlayerName(), isPlayer: true });
    }

    const lapEl = document.getElementById('current-lap');
    if (lapEl) lapEl.innerText = Math.min(window.playerLap, TOTAL_LAPS);
  }
  window.playerLastU = window.playerU;

  if (aiCars && Array.isArray(aiCars)) {
    const playerProgress = (window.playerLap - 1) + window.playerU;

    aiCars.forEach(ai => {
      if (ai.finished) return;

      if (!ai._baseSpeed) ai._baseSpeed = ai.speed;
      if (ai._targetLane === undefined) ai._targetLane = ai.offsetLane;

      const aiProg = getAiProgress(ai);
      let desiredLane = (ai.id % 2 === 0) ? 3.0 : -3.0;

      aiCars.forEach(otherAi => {
        if (otherAi === ai) return;
        const otherProg = getAiProgress(otherAi);
        const gap = otherProg - aiProg;

        if (gap > 0 && gap < 0.05) {
          desiredLane = otherAi.offsetLane > 0 ? -3.5 : 3.5;
        }
      });

      const playerGap = playerProgress - aiProg;
      if (playerGap > 0 && playerGap < 0.05) {
        desiredLane = ai.offsetLane >= 0 ? -3.5 : 3.5;
      }

      ai._targetLane += (desiredLane - ai._targetLane) * 0.03;
      ai.offsetLane += (ai._targetLane - ai.offsetLane) * 0.04;
    });
  }

  const competitors = [
    {
      name: getPlayerName(),
      isPlayer: true,
      totalProgress: window.playerFinished ? 1000.0 : ((window.playerLap - 1) + window.playerU),
      finished: window.playerFinished
    },
    ...(aiCars || []).map(ai => ({
      name: ai.name,
      isPlayer: false,
      color: ai.color,
      totalProgress: getAiProgress(ai),
      finished: !!ai.finished
    }))
  ];

  competitors.sort((a, b) => b.totalProgress - a.totalProgress);

  // Dynamic Announcement: Notify continuous 1st place leader during race (Guarded against triggers after finish)
  const currentLeader = competitors[0];
  if (currentLeader && currentLeader.name !== lastLeaderName) {
    if (lastLeaderName !== null && typeof showSideAnnouncement === 'function' && !window.playerFinished && window.raceFinishOrder.length === 0) {
      showSideAnnouncement(`⚡ RACE LEADER`, `${currentLeader.name} IS NOW IN 1ST PLACE!`);
    }
    lastLeaderName = currentLeader.name;
  }

  const playerRank = window.playerFinished ? (window.raceFinishOrder.findIndex(c => c.isPlayer) + 1 || 1) : (competitors.findIndex(c => c.isPlayer) + 1);
  const posEl = document.getElementById('position');
  if (posEl) posEl.innerText = playerRank;

  if (typeof window.refreshStandingsList === 'function') {
    window.refreshStandingsList();
  }

  const resultsModal = document.getElementById('results-modal');
  if (window.playerFinished && resultsModal && resultsModal.style.display === 'none') {
    setTimeout(() => {
      showResultsModal();
    }, 1200);
  }
}

function showSideAnnouncement(text, subtext) {
  let container = document.getElementById('side-announcements');
  if (!container) {
    container = document.createElement('div');
    container.id = 'side-announcements';
    document.body.appendChild(container);
  }

  const card = document.createElement('div');
  card.className = 'side-announcement-card';
  card.innerHTML = `
    <div class="announcement-title">${text}</div>
    <div class="announcement-sub">${subtext}</div>
  `;
  container.appendChild(card);

  setTimeout(() => {
    card.classList.add('show');
  }, 50);

  setTimeout(() => {
    card.classList.remove('show');
    setTimeout(() => card.remove(), 400);
  }, 3500);
}

function recordFinish(competitor) {
  if (!window.raceFinishOrder.some(c => c.isPlayer === competitor.isPlayer && c.name === competitor.name)) {
    window.raceFinishOrder.push(competitor);
    const place = window.raceFinishOrder.length;

    if (!competitor.isPlayer && typeof aiCars !== 'undefined') {
      const targetAi = aiCars.find(a => a.name === competitor.name);
      if (targetAi) {
        targetAi.finishOrderIndex = place;
        targetAi.finished = true;
        targetAi.lap = TOTAL_LAPS || 3;
      }
    }

    if (place === 1) {
      showSideAnnouncement(`🏆 WINNER ANNOUNCEMENT`, `${competitor.name} WINS THE RACE!`);
    } else {
      showSideAnnouncement(`${competitor.name}`, `FINISHED #${place} IN THE RACE!`);
    }
  }

  if (competitor.isPlayer && typeof isVictoryCinematic !== 'undefined' && !isVictoryCinematic) {
    isVictoryCinematic = true;
    cinematicStartTime = performance.now();
  }
}

function getLapTextForDriver(driver) {
  const totalLaps = typeof TOTAL_LAPS !== 'undefined' ? TOTAL_LAPS : 3;

  if (driver && driver.finished) {
    return `FINISHED (${totalLaps}/${totalLaps})`;
  }

  const labelLap = Math.max(1, Math.min(totalLaps, driver?.lap || 1));
  return `LAP ${labelLap}/${totalLaps}`;
}

function refreshStandingsList() {
  const standingsList = document.getElementById('standings-list');
  if (!standingsList) return;

  const currentAiCars = typeof aiCars !== 'undefined' ? aiCars : [];
  const sortedCompetitors = [
    { name: getPlayerName(), isPlayer: true, finished: window.playerFinished, lap: window.playerLap || 1, progress: window.playerFinished ? 1000 : ((window.playerLap - 1) + window.playerU) },
    ...currentAiCars.map(ai => ({ name: ai.name, isPlayer: false, color: ai.color, finished: ai.finished, lap: ai.lap || 1, progress: getAiProgress(ai) }))
  ];

  sortedCompetitors.sort((a, b) => {
    const orderA = window.raceFinishOrder.findIndex(c => c.name === a.name);
    const orderB = window.raceFinishOrder.findIndex(c => c.name === b.name);

    if (orderA !== -1 && orderB !== -1) return orderA - orderB;
    if (orderA !== -1) return -1;
    if (orderB !== -1) return 1;
    return b.progress - a.progress;
  });

  standingsList.innerHTML = '';
  sortedCompetitors.forEach((driver, idx) => {
    const row = document.createElement('div');
    let highlightClass = idx < 3 ? 'top-3' : '';
    if (idx === 0) highlightClass = 'first';

    const driverColor = getDriverColorHex(driver.name, driver.isPlayer, driver);

    row.className = `standing-row ${highlightClass}`;
    row.innerHTML = `
      <span style="color: ${driverColor}; font-weight: bold;">${idx + 1}. ${driver.name}</span>
      <span>${getLapTextForDriver(driver)}</span>
    `;
    standingsList.appendChild(row);
  });
}

function showResultsModal() {
  if (typeof window.playWinnerMusic === 'function') {
    window.playWinnerMusic();
  }

  if (typeof window.playEndMusic === 'function') {
    window.playEndMusic();
  }

  const modal = document.getElementById('results-modal');
  const title = document.getElementById('results-title');
  const badge = document.getElementById('results-badge');
  const scoreEl = document.getElementById('final-score');
  const standingsList = document.getElementById('standings-list');

  const playerFinishIndex = window.raceFinishOrder.findIndex(c => c.isPlayer);
  const finalRank = playerFinishIndex !== -1 ? playerFinishIndex + 1 : 1;

  if (finalRank === 1) {
    title.innerText = 'GRAND PRIX CHAMPION!';
    badge.innerText = 'VICTORY';
    badge.className = 'badge gold';
  } else if (finalRank === 2) {
    title.innerText = 'RACE FINISHED';
    badge.innerText = 'PLACED 2ND';
    badge.className = 'badge';
  } else if (finalRank === 3) {
    title.innerText = 'RACE FINISHED';
    badge.innerText = 'PLACED 3RD';
    badge.className = 'badge';
  } else {
    title.innerText = 'RACE FINISHED';
    badge.innerText = 'PLACED 4TH';
    badge.className = 'badge';
  }

  const startTime = typeof raceStartTime !== 'undefined' ? raceStartTime : performance.now();
  const timeElapsed = ((performance.now() - startTime) / 1000);
  const lapProgress = Math.max(1, Math.min(TOTAL_LAPS || 3, window.playerLap || 1));
  const lapBonus = (TOTAL_LAPS || 3) * 500 - (Math.max(0, lapProgress - 1) * 250);
  const rankBonus = [1800, 1200, 700, 250][finalRank - 1] || 0;
  const timeBonus = Math.max(0, 2200 - Math.floor(timeElapsed * 80));
  const finalScore = Math.max(1400, Math.floor(1800 + lapBonus + rankBonus + timeBonus));

  if (scoreEl) scoreEl.innerText = finalScore.toLocaleString();
  if (standingsList) {
    refreshStandingsList();
  }

  if (modal) modal.style.display = 'flex';
}

window.getLapTextForDriver = getLapTextForDriver;
window.refreshStandingsList = refreshStandingsList;
window.resetRankSystem = resetRankSystem;
window.updateRanksAndLaps = updateRanksAndLaps;
window.recordFinish = recordFinish;
window.showResultsModal = showResultsModal;