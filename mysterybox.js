// mysterybox.js - Sugar Rush Inspired Floating Sugar Cubes & Power-Up System

window.MysteryBoxSystem = (function() {
  let boxes = [];
  let sceneRef = null;
  let trackCurveRef = null;
  const BOX_SPAWN_COOLDOWN = 5.0; // 5 seconds respawn cooldown as requested

  // Power-up configurations with balanced effects
  const POWER_TYPES = [
    { id: 'speed_boost', type: 'good', name: 'Sugar Rush Boost', duration: 4000 },
    { id: 'hyper_glide', type: 'good', name: 'Hyper Glide Float', duration: 3500 },
    { id: 'cherry_bomb', type: 'bad', name: 'Cherry Bomb Explosion' },
    { id: 'syrup_puddle', type: 'bad', name: 'Sticky Syrup Puddle' }
  ];

  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playExplosionSound() {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.4);

      gain.gain.setValueAtTime(0.6, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch(e) { console.log(e); }
  }

  function playSplashSound() {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch(e) { console.log(e); }
  }

  function playBoostSound() {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch(e) { console.log(e); }
  }

  function initMysteryBoxes(scene, trackCurve) {
    sceneRef = scene;
    trackCurveRef = trackCurve;
    boxes = [];

    const rowPositions = [0.25, 0.50, 0.75, 0.90]; 

    rowPositions.forEach((u, rIndex) => {
      const pt = trackCurve.getPointAt(u);
      const tangent = trackCurve.getTangentAt(u).normalize();
      const side = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();

      const laneOffsets = [-4.5, -1.5, 1.5, 4.5];

      laneOffsets.forEach((laneOffset, index) => {
        const cubeMesh = createSugarCubeMesh();
        const worldPos = pt.clone().add(side.clone().multiplyScalar(laneOffset));
        worldPos.y = 1.2;

        cubeMesh.position.copy(worldPos);
        sceneRef.add(cubeMesh);

        boxes.push({
          mesh: cubeMesh,
          u: u,
          rowIndex: rIndex,
          laneOffset: laneOffset,
          baseY: 1.2,
          active: true,
          cooldownTimer: 0,
          index: index + (rIndex * 4)
        });
      });
    });
  }

  function createSugarCubeMesh() {
    const group = new THREE.Group();
    
    const geo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xfff0f5,
      roughness: 0.1,
      metalness: 0.1,
      transparent: true,
      opacity: 0.88
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    group.add(mesh);

    const coreGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xff007f });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    return group;
  }

  function updateMysteryBoxes(delta, playerCar, aiCars) {
    const time = performance.now() * 0.003;
    const nowMs = performance.now();

    boxes.forEach(box => {
      if (box.active) {
        box.mesh.position.y = box.baseY + Math.sin(time + box.index) * 0.25;
        box.mesh.rotation.y += 0.02;
        box.mesh.rotation.x += 0.01;

        // Check collision with Player
        if (playerCar && playerCar.position.distanceTo(box.mesh.position) < 2.0) {
          playerCar.userData = playerCar.userData || {};
          playerCar.userData.rowCooldowns = playerCar.userData.rowCooldowns || {};
          
          if ((playerCar.userData.rowCooldowns[box.rowIndex] || 0) < nowMs) {
            playerCar.userData.rowCooldowns[box.rowIndex] = nowMs + 2000;
            triggerBoxEffect({ name: 'You (Player)', isPlayer: true, kartRef: playerCar }, aiCars);
            deactivateSingleBox(box);
          }
        }

        // Check collision with AI Karts
        if (aiCars && Array.isArray(aiCars)) {
          aiCars.forEach((ai, aiIdx) => {
            if (ai.mesh && ai.mesh.position.distanceTo(box.mesh.position) < 2.0) {
              ai.rowCooldowns = ai.rowCooldowns || {};
              if ((ai.rowCooldowns[box.rowIndex] || 0) < nowMs) {
                ai.rowCooldowns[box.rowIndex] = nowMs + 2000;
                triggerBoxEffect({ name: `AI Racer #${aiIdx + 1}`, isPlayer: false, kartRef: ai }, aiCars);
                deactivateSingleBox(box);
              }
            }
          });
        }
      } else {
        box.cooldownTimer -= delta;
        if (box.cooldownTimer <= 0) {
          box.active = true;
          box.mesh.visible = true;
        }
      }
    });
  }

  function deactivateSingleBox(box) {
    box.active = false;
    box.mesh.visible = false;
    box.cooldownTimer = BOX_SPAWN_COOLDOWN; // 5 seconds respawn cooldown
  }

  function triggerBoxEffect(recipient, aiCars) {
    const randomEffect = POWER_TYPES[Math.floor(Math.random() * POWER_TYPES.length)];

    if (randomEffect.type === 'good') {
      playBoostSound();
      if (recipient.isPlayer) {
        showHUDNotification(`🎁 ${recipient.name} got POWER-UP: ${randomEffect.name}!`);
        window.playerBoostActive = true;
        setTimeout(() => { window.playerBoostActive = false; }, randomEffect.duration);
      } else {
        showHUDNotification(`🎁 ${recipient.name} got POWER-UP: ${randomEffect.name}!`);
        recipient.kartRef.speed = Math.max(recipient.kartRef.speed * 1.4, 0.0012);
        setTimeout(() => {
          if (recipient.kartRef.speed) recipient.kartRef.speed = 0.0004;
        }, randomEffect.duration);
      }
    } else {
      // Bad disadvantage mechanics: Option to keep trap or pass to a random available opponent!
      const availableOpponents = [];
      if (recipient.isPlayer) {
        if (aiCars && Array.isArray(aiCars)) {
          aiCars.forEach(ai => availableOpponents.push({ name: ai.name, isPlayer: false, kartRef: ai }));
        }
      } else {
        availableOpponents.push({ name: 'You (Player)', isPlayer: true, kartRef: playerCar });
        if (aiCars && Array.isArray(aiCars)) {
          aiCars.forEach(ai => {
            if (ai !== recipient.kartRef) availableOpponents.push({ name: ai.name, isPlayer: false, kartRef: ai });
          });
        }
      }

      // 50% probability chance to deflect/pass the bad disadvantage to another opponent if available
      let targetVictim = recipient;
      let wasPassed = false;

      if (availableOpponents.length > 0 && Math.random() < 0.50) {
        targetVictim = availableOpponents[Math.floor(Math.random() * availableOpponents.length)];
        wasPassed = true;
      }

      if (randomEffect.id === 'cherry_bomb') {
        playExplosionSound();
        if (targetVictim.isPlayer) triggerCherryExplosionOverlay();
      } else {
        playSplashSound();
        if (targetVictim.isPlayer) triggerMudSplashOverlay();
      }

      if (wasPassed) {
        showHUDNotification(`⚡ TRAP PASSED! ${recipient.name} deflected ${randomEffect.name} onto ${targetVictim.name}!`);
      } else {
        showHUDNotification(`⚠️ TRAP UNLEASHED! ${targetVictim.name} was hit by ${randomEffect.name}!`);
      }

      if (targetVictim.isPlayer) {
        applyBadAdvantageToKart({ isPlayerKart: true }, randomEffect.id);
      } else {
        applyBadAdvantageToKart(targetVictim.kartRef, randomEffect.id);
      }
    }
  }

  function triggerCherryExplosionOverlay() {
    let overlay = document.getElementById('screen-fx-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'screen-fx-overlay';
      overlay.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; pointer-events:none; z-index:9999; transition:background 0.2s ease;';
      document.body.appendChild(overlay);
    }
    overlay.style.background = 'radial-gradient(circle, rgba(255,0,0,0.85) 0%, rgba(100,0,0,0.9) 80%)';
    setTimeout(() => {
      overlay.style.background = 'transparent';
    }, 600);
  }

  function triggerMudSplashOverlay() {
    let overlay = document.getElementById('screen-fx-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'screen-fx-overlay';
      overlay.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; pointer-events:none; z-index:9999; transition:background 0.2s ease;';
      document.body.appendChild(overlay);
    }
    overlay.style.background = 'radial-gradient(ellipse at center, rgba(90,50,20,0.9) 0%, rgba(40,20,10,0.95) 90%)';
    setTimeout(() => {
      overlay.style.background = 'transparent';
    }, 800);
  }

  function applyBadAdvantageToKart(target, effectId) {
    if (target.isPlayerKart) {
      if (effectId === 'cherry_bomb') {
        speed *= 0.3;
        setTimeout(() => { speed *= 2.5; }, 1500);
      } else {
        speed *= 0.5;
        setTimeout(() => { speed *= 1.8; }, 1800);
      }
    } else if (target.mesh) {
      if (effectId === 'cherry_bomb') {
        target.speed = 0.0001;
        setTimeout(() => { target.speed = 0.0004; }, 1500);
      } else {
        target.speed = 0.00015;
        setTimeout(() => { target.speed = 0.0004; }, 1800);
      }
    }
  }

  function showHUDNotification(text) {
    let notif = document.getElementById('hud-notification');
    if (!notif) {
      notif = document.createElement('div');
      notif.id = 'hud-notification';
      notif.style.cssText = 'position:fixed; top:18%; left:50%; transform:translate(-50%, -50%); background:rgba(255,0,127,0.85); color:#fff; padding:12px 24px; font-family:sans-serif; font-weight:bold; font-size:1.1rem; border-radius:8px; z-index:999; pointer-events:none; transition:opacity 0.3s ease; text-align:center; box-shadow: 0 4px 20px rgba(0,0,0,0.5);';
      document.body.appendChild(notif);
    }
    notif.innerText = text;
    notif.style.opacity = '1';
    setTimeout(() => {
      notif.style.opacity = '0';
    }, 3000);
  }

  return {
    init: initMysteryBoxes,
    update: updateMysteryBoxes
  };
})();