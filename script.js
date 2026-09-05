// script.js - Main Game Loop & Controller for 3D Apex Grand Prix

let scene, camera, renderer, playerCar, trackCurve;
let aiCars = [];
let isPlaying = false;
let isPaused = false;
let minimapCtx;

const TOTAL_LAPS = 3;
let raceStartTime = 0;

let isCinematic = false;
let isVictoryCinematic = false;
let cinematicStartTime = 0;
let countdownValue = 3;
let isCountdownActive = false;
let raceStarted = false;
let countdownTimer = null;

let speed = 0;
const maxSpeed = 1.2;
const accel = 0.015;
const decel = 0.008;
const turnSpeed = 0.035;
const roadWidth = 12.0;

const keys = { forward: false, backward: false, left: false, right: false, boost: false };

// script.js (Update the keydown listener section)

window.addEventListener('keydown', (e) => {
  if (isPlaying && !isPaused) {
    updateKeys(e.code, e.key, true);
  }
});
window.addEventListener('keyup', (e) => updateKeys(e.code, e.key, false));

function updateKeys(code, key, state) {
  if (['ArrowUp', 'w', 'W'].includes(key)) keys.forward = state;
  if (['ArrowDown', 's', 'S'].includes(key)) keys.backward = state;
  if (['ArrowLeft', 'a', 'A'].includes(key)) keys.left = state;
  if (['ArrowRight', 'd', 'D'].includes(key)) keys.right = state;
  if (code === 'Space' || key === ' ') keys.boost = state;
}

function init() {
  const container = document.getElementById('canvas-container');
  container.innerHTML = '';

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x70b2e8); 
  scene.fog = new THREE.FogExp2(0x70b2e8, 0.001);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const sun = new THREE.DirectionalLight(0xfff5ea, 1.0);
  sun.position.set(300, 400, 200);
  sun.castShadow = true;
  scene.add(sun);

  if (typeof window.buildTrackSpline === 'function') {
    trackCurve = window.buildTrackSpline();
  }
  if (typeof window.createExpandedTerrain === 'function') {
    window.createExpandedTerrain(scene);
  }
  if (typeof window.createRoadAndBarriers === 'function') {
    window.createRoadAndBarriers(scene, roadWidth);
  }
  if (typeof window.createStartArch === 'function') {
    window.createStartArch(scene, roadWidth);
  }

  if (typeof window.createSceneryObjects === 'function') {
    window.createSceneryObjects(scene, trackCurve, roadWidth);
  }

  // Initialize Sugar Rush Mystery Boxes safely after scene and trackCurve exist
  if (typeof window.MysteryBoxSystem !== 'undefined' && trackCurve) {
    window.MysteryBoxSystem.init(scene, trackCurve);
  }

  createVehicles();

  const minimapCanvas = document.getElementById('minimap');
  if (minimapCanvas) {
    minimapCtx = minimapCanvas.getContext('2d');
  }

  window.addEventListener('resize', onWindowResize);
}

function createVehicles() {
  if (playerCar) {
    scene.remove(playerCar);
    playerCar = null;
  }

  if (aiCars && aiCars.length > 0) {
    aiCars.forEach(ai => {
      if (ai.mesh) {
        scene.remove(ai.mesh);
      }
    });
  }
  aiCars = [];

  const gridPositions = [
    { lane: -3.2, distOffset: 0.000 },
    { lane:  3.2, distOffset: -0.010 },
    { lane: -3.2, distOffset: -0.020 },
    { lane:  3.2, distOffset: -0.030 }
  ];

  for (let i = gridPositions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [gridPositions[i], gridPositions[j]] = [gridPositions[j], gridPositions[i]];
  }

  let chosenConfig = null;
  if (window.userCustomProfile) {
    window.KART_CONFIGS.player.name = window.userCustomProfile.name;
    chosenConfig = window.PLAYER_KART_OPTIONS?.[window.userCustomProfile.selectedKartIndex];
    if (chosenConfig) {
      window.KART_CONFIGS.player.color = chosenConfig.color;
      window.KART_CONFIGS.player.bodyMetalness = chosenConfig.bodyMetalness;
      window.KART_CONFIGS.player.bodyRoughness = chosenConfig.bodyRoughness;
      window.KART_CONFIGS.player.cabinColor = chosenConfig.cabinColor;
    }
  }

  let candidates = JSON.parse(JSON.stringify(window.KART_CONFIGS.candidates || []));
  const distinctColors = [0x00ff66, 0xff3366, 0x9900ff, 0xff6600, 0x33ccff, 0xffff00, 0xff00ff, 0x00ffff];
  const usedColors = [window.KART_CONFIGS.player.color];
  let colorIdx = 0;

  candidates.forEach(candidate => {
    if (usedColors.includes(candidate.color)) {
      while (colorIdx < distinctColors.length && usedColors.includes(distinctColors[colorIdx])) {
        colorIdx++;
      }
      candidate.color = distinctColors[colorIdx % distinctColors.length];
      colorIdx++;
    }
    usedColors.push(candidate.color);
  });

  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  playerCar = window.createKartMesh(window.KART_CONFIGS.player);
  setKartOnGrid(playerCar, gridPositions[0].lane, gridPositions[0].distOffset);
  scene.add(playerCar);

  for (let i = 0; i < 3 && i < candidates.length; i++) {
    const candidate = candidates[i];
    const aiKart = window.createKartMesh(candidate);
    const grid = gridPositions[i + 1];
    const aiStartU = 0.0;
    const visualOffset = typeof grid.distOffset === 'number' ? grid.distOffset : 0.0;
    setKartOnGrid(aiKart, grid.lane, visualOffset);
    scene.add(aiKart);

    aiCars.push({
      id: i + 1,
      name: candidate.name,
      color: candidate.color,
      mesh: aiKart,
      u: aiStartU,
      lastU: aiStartU,
      initialU: aiStartU,
      visualUOffset: visualOffset,
      initialVisualUOffset: visualOffset,
      lap: 1,
      speed: 0.0004,
      offsetLane: grid.lane,
      initialOffsetLane: grid.lane,
      finished: false,
      finalRank: null
    });
  }
}

function setKartOnGrid(kart, laneOffset, uOffset) {
  let u = (0.0 + uOffset) % 1.0;
  if (u < 0) u += 1.0;

  const pt = trackCurve.getPointAt(u);
  const tangent = trackCurve.getTangentAt(u).normalize();
  const side = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();

  const pos = pt.clone().add(side.multiplyScalar(laneOffset));
  kart.position.set(pos.x, 0.0, pos.z);
  kart.lookAt(pos.clone().add(tangent));
}

function startCinematicRace() {
  if (isCinematic || isCountdownActive || raceStarted) return;

  const mainMenu = document.getElementById('menu');
  if (mainMenu) {
    mainMenu.style.display = 'none';
  }

  const bgVideo = document.getElementById('bg-video');
  if (bgVideo) {
    bgVideo.pause();
  }

  isPaused = false;
  speed = 0;
  raceStarted = false;
  isVictoryCinematic = false;
  isPlaying = true;
  isCinematic = true;
  isCountdownActive = false;
  countdownValue = 3;
  cinematicStartTime = performance.now();

  if (typeof window.switchToRaceMusic === 'function') {
    window.switchToRaceMusic();
  }

  if (typeof createVehicles === 'function') {
    createVehicles();
  }

  if (typeof window.resetRankSystem === 'function') {
    window.resetRankSystem();
  }
  if (typeof window.initKartBehavior === 'function') {
    window.initKartBehavior(aiCars);
  }
}

function showMenu() {
  const menuEl = document.getElementById('menu');
  if (menuEl) {
    menuEl.style.display = 'flex';
  }
  
  const bgVideo = document.getElementById('bg-video');
  if (bgVideo && bgVideo.play) {
    bgVideo.play().catch(err => {
      console.log("Video resume prevented:", err);
    });
  }
}

function hideMenu() {
  const menuEl = document.getElementById('menu');
  if (menuEl) {
    menuEl.style.display = 'none';
  }
}

function handleCinematicCamera(elapsedSec) {
  const startPt = trackCurve.getPointAt(0);
  const tangent = trackCurve.getTangentAt(0).normalize();
  const side = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();

  if (elapsedSec < 3.5) {
    const angle = elapsedSec * 0.35;
    camera.position.set(
      startPt.x + Math.sin(angle) * 32,
      22,
      startPt.z + Math.cos(angle) * 32
    );
    camera.lookAt(startPt.x, 2, startPt.z);
  } else if (elapsedSec < 7.0) {
    const t = (elapsedSec - 3.5) / 3.5;
    const sweepSide = side.clone().multiplyScalar((t - 0.5) * 20);
    const camPos = startPt.clone().add(tangent.clone().multiplyScalar(12)).add(sweepSide).add(new THREE.Vector3(0, 2.5, 0));
    
    camera.position.copy(camPos);
    camera.lookAt(startPt.x, 0.8, startPt.z);
  } else {
    isCinematic = false;
    if (!isCountdownActive) {
      isCountdownActive = true;
      runCountdown();
    }
  }
}

function handleVictoryCinematic(elapsedSec) {
  const angle = elapsedSec * 1.2;
  const radius = 14;
  camera.position.set(
    playerCar.position.x + Math.sin(angle) * radius,
    playerCar.position.y + 4.5,
    playerCar.position.z + Math.cos(angle) * radius
  );
  camera.lookAt(playerCar.position.x, playerCar.position.y + 1.0, playerCar.position.z);
}

function runCountdown() {
  const display = document.getElementById('countdown-display');
  if (!display) return;

  if (countdownTimer !== null) {
    clearInterval(countdownTimer);
  }

  display.style.display = 'block';
  countdownValue = 3;
  isCountdownActive = true;
  raceStarted = false;
  display.innerText = countdownValue;
  display.style.color = '#00f0ff';

  countdownTimer = setInterval(() => {
    if (isPaused) return;

    countdownValue--;
    if (countdownValue > 0) {
      display.innerText = countdownValue;
    } else if (countdownValue === 0) {
      display.innerText = 'GO!';
      display.style.color = '#ff007f';
      raceStartTime = performance.now();
    } else {
      display.style.display = 'none';
      countdownValue = -1;
      raceStarted = true;
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
  }, 1000);
}

function triggerKartImpact(kart, impactVector, strength = 1) {
  if (!kart || !kart.position) return;

  const dir = impactVector && impactVector.lengthSq ? impactVector.clone().setY(0).normalize() : new THREE.Vector3(1, 0, 0);
  kart.userData = kart.userData || {};
  kart.userData.hitDir = dir;
  kart.userData.hitTimer = Math.max(kart.userData.hitTimer || 0, 0.22);
  kart.userData.hitStrength = strength;
}

function applyKartImpactAnimation(kart) {
  if (!kart || !kart.userData) return;

  const hitTimer = kart.userData.hitTimer || 0;
  if (hitTimer <= 0) return;

  const dir = kart.userData.hitDir || new THREE.Vector3(1, 0, 0);
  const amount = (hitTimer / 0.22) * 0.7;
  kart.position.add(dir.clone().multiplyScalar(0.2 * (kart.userData.hitStrength || 1) * amount));

  if (kart.userData.frontLeftWheel) {
    kart.userData.frontLeftWheel.rotation.x += 0.08 * (kart.userData.hitStrength || 1);
    kart.userData.frontRightWheel.rotation.x += 0.08 * (kart.userData.hitStrength || 1);
    kart.userData.rearLeftWheel.rotation.x += 0.08 * (kart.userData.hitStrength || 1);
    kart.userData.rearRightWheel.rotation.x += 0.08 * (kart.userData.hitStrength || 1);
  }

  kart.userData.hitTimer = Math.max(0, hitTimer - 0.016);
}

function checkKartCollisions() {
  if (!playerCar || !aiCars) return;
  const collisionRadius = 2.4;

  aiCars.forEach(ai => {
    if (!ai.mesh) return;
    const dist = playerCar.position.distanceTo(ai.mesh.position);
    if (dist < collisionRadius) {
      const delta = new THREE.Vector3().subVectors(playerCar.position, ai.mesh.position);
      delta.y = 0;
      const pushDir = delta.lengthSq() > 0 ? delta.normalize() : new THREE.Vector3(1, 0, 0);
      const overlap = (collisionRadius - dist) * 0.5;

      playerCar.position.add(pushDir.clone().multiplyScalar(overlap * 0.55));
      ai.mesh.position.add(pushDir.clone().multiplyScalar(-overlap * 0.55));

      speed *= -0.18;
      if (Math.abs(speed) < 0.05) speed = 0.08 * (keys.forward ? 1 : -1 || 1);
      ai.speed = Math.max(0.00015, ai.speed * -0.2);
      playerCar.position.y = 0;
      ai.mesh.position.y = 0;

      triggerKartImpact(playerCar, pushDir.clone(), 1.2);
      triggerKartImpact(ai.mesh, pushDir.clone().multiplyScalar(-1), 1.0);
    }
  });

  for (let i = 0; i < aiCars.length; i++) {
    for (let j = i + 1; j < aiCars.length; j++) {
      const a = aiCars[i];
      const b = aiCars[j];
      if (!a.mesh || !b.mesh) continue;

      const dist = a.mesh.position.distanceTo(b.mesh.position);
      if (dist < collisionRadius * 0.9) {
        const delta = new THREE.Vector3().subVectors(a.mesh.position, b.mesh.position);
        delta.y = 0;
        const pushDir = delta.lengthSq() > 0 ? delta.normalize() : new THREE.Vector3(1, 0, 0);
        const overlap = (collisionRadius * 0.9 - dist) * 0.5;

        a.mesh.position.add(pushDir.clone().multiplyScalar(overlap));
        b.mesh.position.add(pushDir.clone().multiplyScalar(-overlap));

        a.speed = Math.max(0.00015, a.speed * -0.5);
        b.speed = Math.max(0.00015, b.speed * -0.5);

        triggerKartImpact(a.mesh, pushDir.clone(), 0.9);
        triggerKartImpact(b.mesh, pushDir.clone().multiplyScalar(-1), 0.9);
      }
    }
  }
}

function animate() {
  requestAnimationFrame(animate);

  if (typeof window.MysteryBoxSystem !== 'undefined') {
    window.MysteryBoxSystem.update(0.016, playerCar, aiCars);
  }

  if (!isPlaying || isPaused) return;

  if (isCinematic) {
    const elapsedSec = (performance.now() - cinematicStartTime) / 1000;
    handleCinematicCamera(elapsedSec);
    renderer.render(scene, camera);
    return;
  }

  if (countdownValue >= 0) {
    updateChaseCamera();
    if (typeof window.drawMinimap === 'function') {
      window.drawMinimap(minimapCtx, playerCar, aiCars);
    }
    renderer.render(scene, camera);
    return;
  }

  if (!raceStarted) {
    raceStarted = true;
  }

  if (typeof window.updateKartBehavior === 'function') {
    window.updateKartBehavior(aiCars, trackCurve, TOTAL_LAPS);
  }

  if (playerCar) applyKartImpactAnimation(playerCar);
  if (aiCars && Array.isArray(aiCars)) {
    aiCars.forEach(ai => {
      if (ai && ai.mesh) applyKartImpactAnimation(ai.mesh);
    });
  }

  if (typeof window.updateRanksAndLaps === 'function') {
    window.updateRanksAndLaps(trackCurve, TOTAL_LAPS, playerCar, aiCars);
  }

  if (typeof window.playerFinished !== 'undefined' && !window.playerFinished) {
    let steeringInput = 0;
    if (keys.left) {
      playerCar.rotation.y -= turnSpeed * (Math.abs(speed) > 0.1 ? Math.sign(speed) : 1);
      steeringInput = -0.6;
    }
    if (keys.right) {
      playerCar.rotation.y += turnSpeed * (Math.abs(speed) > 0.1 ? Math.sign(speed) : 1);
      steeringInput = 0.6;
    }

    if (playerCar.userData) {
      if (playerCar.userData.frontLeftPivot && playerCar.userData.frontRightPivot) {
        playerCar.userData.frontLeftPivot.rotation.y = THREE.MathUtils.lerp(
          playerCar.userData.frontLeftPivot.rotation.y, 
          steeringInput, 
          0.2
        );
        playerCar.userData.frontRightPivot.rotation.y = THREE.MathUtils.lerp(
          playerCar.userData.frontRightPivot.rotation.y, 
          steeringInput, 
          0.2
        );
      }

      const rollDelta = speed * 2.5;
      ['frontLeftWheel', 'frontRightWheel', 'rearLeftWheel', 'rearRightWheel'].forEach(wheelKey => {
        if (playerCar.userData[wheelKey]) {
          playerCar.userData[wheelKey].rotation.x += rollDelta;
        }
      });
    }

    const topSpeed = keys.boost ? maxSpeed * 1.4 : maxSpeed;
    if (keys.forward) speed = Math.min(speed + accel, topSpeed);
    else if (keys.backward) speed = Math.max(speed - accel, -maxSpeed * 0.35);
    else speed *= (1 - decel);

    playerCar.translateZ(speed);
    playerCar.position.y = 0.0;
    
    enforceTrackBarriers();
    checkKartCollisions();
    updateChaseCamera();

    const speedMph = Math.floor(Math.abs(speed) * 110);
    const speedText = document.getElementById('speed');
    const speedBar = document.getElementById('speed-bar');
    if (speedText) speedText.innerText = speedMph;
    if (speedBar) speedBar.style.width = `${Math.min(100, (speedMph / 150) * 100)}%`;

  } else {
    if (speed > 0.0001) {
      let distToArch = 1.0 - window.playerU;
      if (distToArch > 0.5) distToArch -= 1.0;

      if (distToArch > 0.001) {
        speed *= 0.88;
      } else {
        speed *= 0.72;
      }

      if (speed < 0.0005) speed = 0;

      playerCar.translateZ(speed);
      playerCar.position.y = 0.0;

      if (playerCar.userData) {
        const rollDelta = speed * 2.5;
        ['frontLeftWheel', 'frontRightWheel', 'rearLeftWheel', 'rearRightWheel'].forEach(wheelKey => {
          if (playerCar.userData[wheelKey]) {
            playerCar.userData[wheelKey].rotation.x += rollDelta;
          }
        });
      }
    } else {
      speed = 0;
    }

    if (isVictoryCinematic) {
      const elapsedSec = (performance.now() - cinematicStartTime) / 1000;
      handleVictoryCinematic(elapsedSec);
    }

    checkKartCollisions();
  }

  if (typeof window.drawMinimap === 'function') {
    window.drawMinimap(minimapCtx, playerCar, aiCars);
  }

  renderer.render(scene, camera);
}

function updateChaseCamera() {
  const relativeCameraOffset = new THREE.Vector3(0, 3.8, -9.0);
  const cameraOffset = relativeCameraOffset.applyMatrix4(playerCar.matrixWorld);
  camera.position.lerp(cameraOffset, 0.15);
  camera.lookAt(playerCar.position.x, playerCar.position.y + 0.8, playerCar.position.z);
}

function enforceTrackBarriers() {
  let closestU = 0;
  let minDistanceSq = Infinity;
  const samples = 160;

  for (let i = 0; i < samples; i++) {
    const u = i / samples;
    const pt = trackCurve.getPointAt(u);
    const distSq = playerCar.position.distanceToSquared(pt);
    if (distSq < minDistanceSq) {
      minDistanceSq = distSq;
      closestU = u;
    }
  }

  const centerPt = trackCurve.getPointAt(closestU);
  const currentDist = playerCar.position.distanceTo(centerPt);

  const maxAllowedDist = roadWidth + 0.9;
  if (currentDist > maxAllowedDist) {
    const pushDir = new THREE.Vector3().subVectors(centerPt, playerCar.position);
    pushDir.y = 0;
    if (pushDir.lengthSq() === 0) {
      pushDir.set(1, 0, 0);
    } else {
      pushDir.normalize();
    }

    const recoverAmount = Math.min(currentDist - maxAllowedDist, 1.2);
    playerCar.position.add(pushDir.multiplyScalar(recoverAmount * 0.45));
    speed *= 0.35;
    if (Math.abs(speed) < 0.05) speed = 0.08;
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.togglePauseMenu = function(forceState) {
  isPaused = forceState !== undefined ? forceState : !isPaused;

  if (isPaused) {
    if (typeof window.pauseRaceMusic === 'function') window.pauseRaceMusic();
  } else {
    if (typeof window.resumeRaceMusic === 'function') window.resumeRaceMusic();
    // Ensure video resumes if pause menu closes and we return to main menu context
    const bgVideo = document.getElementById('bg-video');
    if (bgVideo && bgVideo.play) {
      bgVideo.play().catch(err => {
        console.log("Video resume prevented:", err);
      });
    }
  }

  if (typeof window.openPauseMenu === 'function') {
    window.openPauseMenu(isPaused);
  }
};

document.getElementById('start-btn').addEventListener('click', startCinematicRace);
document.getElementById('restart-btn').addEventListener('click', window.restartGameSession);
document.getElementById('main-menu-btn').addEventListener('click', window.returnToMainMenu);

document.addEventListener('DOMContentLoaded', () => {
  const menuVolSlider = document.getElementById('menu-volume-slider');
  const settingsVolSlider = document.getElementById('settings-volume-slider');
  const menuSettingsBtn = document.getElementById('menu-settings-btn');

  if (menuVolSlider) {
    menuVolSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      if (settingsVolSlider) settingsVolSlider.value = val;
      const volPercentText = document.getElementById('volume-percentage');
      if (volPercentText) volPercentText.innerText = `${Math.round(val * 100)}%`;
      if (typeof window.setGameVolume === 'function') window.setGameVolume(val);
    });
  }

  if (menuSettingsBtn) {
    menuSettingsBtn.addEventListener('click', () => {
      if (typeof window.openSettingsModal === 'function') window.openSettingsModal();
    });
  }
});

init();
animate();