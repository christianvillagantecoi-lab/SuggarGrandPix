// kartbehavior.js - AI Control & Precise Arch Stopping Dynamics with Spatial Sensing

window.initKartBehavior = function(aiCars) {
  if (!aiCars || !Array.isArray(aiCars)) return;

  aiCars.sort(() => Math.random() - 0.5);

  aiCars.forEach((ai) => {
    ai.clumsinessTimer = Math.random() * 100;
    ai.unpredictableOffset = 0;
    
    ai.baseSpeedSetting = 0.00034 + (Math.random() * 0.00012);
    ai.surgeTimer = Math.random() * 200;
    ai.surgeDuration = 0;
    ai.isSurging = false;
    ai.isWeakening = false;

    ai.speed = ai.baseSpeedSetting;
    ai.laneShiftAggression = 0.05;
    
    ai.lap = 1;
    ai.passedMidpoint = false; // Prevents premature lap increment on spawn
    ai.finished = false;
    ai.finishOrderIndex = null;
    ai.lastPos = ai.mesh ? ai.mesh.position.clone() : new THREE.Vector3();
  });
};

window.updateKartBehavior = function(aiCars, trackCurve, TOTAL_LAPS, playerProgress) {
  if (!aiCars || !Array.isArray(aiCars)) return;

  const maxLaps = typeof TOTAL_LAPS !== 'undefined' ? TOTAL_LAPS : 3;

  aiCars.forEach((ai, index) => {
    // Freeze AI during start countdown
    if (ai.u < 0.015 && typeof countdownValue !== 'undefined' && countdownValue >= 0) {
      ai.speed = 0;
      return;
    }

    // --- SPATIAL SENSOR & BRAIN PROXIMITY CHECK ---
    // Evaluates 3D proximity to surrounding karts to avoid overlaps or clamping
    let spatialProximityFactor = 1.0;
    if (ai.mesh && ai.mesh.position) {
      aiCars.forEach((otherAi, otherIdx) => {
        if (index === otherIdx || !otherAi.mesh || !otherAi.mesh.position) return;

        const dist = ai.mesh.position.distanceTo(otherAi.mesh.position);
        const minSafetyBuffer = 3.8; // Maintain healthy physical distance buffer

        if (dist < minSafetyBuffer) {
          // Sensor triggered: calculate deceleration factor based on closeness
          const closenessRatio = dist / minSafetyBuffer;
          spatialProximityFactor = Math.min(spatialProximityFactor, Math.max(0.2, closenessRatio * 0.8));
          
          // Nudge lane outward slightly if karts are overlapping horizontally
          const laneDiff = (ai.offsetLane || 0) - (otherAi.offsetLane || 0);
          if (Math.abs(laneDiff) < 1.8) {
            ai.offsetLane += (laneDiff >= 0 ? 0.08 : -0.08);
          }
        }
      });
    }

    // --- SPEED & FINISH POSITION CONTROL LOGIC ---
    if (ai.finished) {
      // Assign distinct parallel lanes under the arch
      const rank = ai.finishOrderIndex || (index + 2);
      
      const slotLanes = [-3.2, 1.1, -1.1, 3.2];
      // Staggered stopping coordinates under the arch (u ≈ 0.000 to 0.0020) to ensure longitudinal clearance
      const slotOffsetsU = [0.0000, 0.0006, 0.0012, 0.0018];

      const safeRankIdx = Math.max(0, Math.min(rank - 1, 3));
      ai._targetLane = slotLanes[safeRankIdx];
      const targetU = slotOffsetsU[safeRankIdx];

      // Calculate distance to the arch stop line
      let distToStop = targetU - ai.u;
      if (distToStop < -0.5) distToStop += 1.0;
      if (distToStop > 0.5) distToStop -= 1.0;

      // Strict boundary check: stop under arch with spatial safety adjustments
      if (distToStop <= 0) {
        ai.u = targetU; // Lock position right under the arch
        ai.speed = 0;
      } else if (distToStop > 0.0001) {
        // Controlled gradual deceleration applying spatial sensor factor
        const targetSpeed = Math.min(ai.baseSpeedSetting, distToStop * 0.12) * spatialProximityFactor;
        ai.speed += (targetSpeed - ai.speed) * 0.2;
      } else {
        ai.u = targetU;
        ai.speed = 0;
      }
    } else {
      // Normal race AI behavior
      ai.surgeTimer++;

      if (!ai.isSurging && !ai.isWeakening && ai.surgeTimer > 180 + (Math.random() * 220)) {
        ai.surgeTimer = 0;
        const roll = Math.random();
        
        if (roll < 0.55) {
          ai.isSurging = true;
          ai.surgeDuration = 100 + Math.random() * 120;
        } else if (roll < 0.85) {
          ai.isWeakening = true;
          ai.surgeDuration = 120 + Math.random() * 140;
        }
      }

      if (ai.isSurging || ai.isWeakening) {
        ai.surgeDuration--;
        if (ai.surgeDuration <= 0) {
          ai.isSurging = false;
          ai.isWeakening = false;
        }
      }

      let targetSpeed = ai.baseSpeedSetting;

      if (ai.isSurging) {
        targetSpeed = 0.00058 + (Math.random() * 0.00009);
      } else if (ai.isWeakening) {
        targetSpeed = 0.00020 + (Math.random() * 0.00005);
      } else {
        targetSpeed += (Math.random() - 0.5) * 0.00007;
      }

      // Dynamic longitudinal safety check against other AI karts to maintain gap
      aiCars.forEach((otherAi, otherIdx) => {
        if (index === otherIdx) return;
        let uDiff = otherAi.u - ai.u;
        if (uDiff < -0.5) uDiff += 1.0;
        if (uDiff > 0.5) uDiff -= 1.0;

        const laneDiff = Math.abs((ai._targetLane || ai.offsetLane) - (otherAi._targetLane || otherAi.offsetLane));
        if (uDiff > 0 && uDiff < 0.022 && laneDiff < 2.2) {
          targetSpeed *= 0.65; // Ease off throttle to preserve space
        }
      });

      // Apply real-time proximity sensing multiplier to target speed
      targetSpeed *= spatialProximityFactor;

      ai.speed += (targetSpeed - ai.speed) * 0.06;
      ai.speed = Math.max(0.00015, Math.min(0.00072, ai.speed));
    }

    // --- TRACK PROGRESSION ---
    const prevU = ai.u;
    if (ai.speed > 0) {
      ai.u = (ai.u + ai.speed) % 1.0;
    }

    // Track halfway checkpoint
    if (ai.u > 0.40 && ai.u < 0.60) {
      ai.passedMidpoint = true;
    }

    // Lap Completion Check across the finish arch
    if (prevU > 0.80 && ai.u < 0.20 && ai.passedMidpoint) {
      ai.passedMidpoint = false;
      
      if (!ai.finished) {
        ai.lap += 1;
        
        if (ai.lap > maxLaps) {
          ai.finished = true;
          ai.lap = maxLaps;
          if (typeof window.recordFinish === 'function') {
            window.recordFinish({ name: ai.name, isPlayer: false });
          }
        }
      }
    }
    ai.lastU = ai.u;

    // --- LANE & SWERVE LOGIC ---
    if (!ai.finished) {
      ai.clumsinessTimer++;
      if (ai.clumsinessTimer > 150 + (Math.random() * 100)) {
        ai.clumsinessTimer = 0;
        if (Math.random() < 0.45) {
          ai.unpredictableOffset = (Math.random() - 0.5) * 3.5;
        } else {
          ai.unpredictableOffset = 0;
        }
      }
    } else {
      ai.unpredictableOffset = 0; // Straight line into arch parking position
    }

    let targetLaneWithChaos = (ai._targetLane || 0) + ai.unpredictableOffset;
    targetLaneWithChaos = Math.max(-4.0, Math.min(4.0, targetLaneWithChaos));
    
    const lerpRate = ai.finished ? 0.08 : 0.05;
    ai.offsetLane += (targetLaneWithChaos - ai.offsetLane) * lerpRate;

    // --- UNIFIED SMOOTH RENDER PIPELINE ---
    if (ai.finished && typeof ai.visualUOffset === 'number' && ai.visualUOffset !== 0) {
      ai.visualUOffset *= 0.92;
      if (Math.abs(ai.visualUOffset) < 0.0001) ai.visualUOffset = 0;
    }

    const visualOffset = typeof ai.visualUOffset === 'number' ? ai.visualUOffset : 0;
    const renderU = (ai.u + visualOffset + 1.0) % 1.0;
    const pt = trackCurve.getPointAt(renderU);
    const aiTangent = trackCurve.getTangentAt(renderU).normalize();
    const side = new THREE.Vector3().crossVectors(aiTangent, new THREE.Vector3(0, 1, 0)).normalize();

    const targetPos = pt.clone().add(side.multiplyScalar(ai.offsetLane));
    
    ai.mesh.position.set(targetPos.x, 0.0, targetPos.z);
    ai.mesh.lookAt(targetPos.clone().add(aiTangent));

    // --- WHEEL & STEERING ANIMATION ---
    if (ai.mesh && ai.mesh.userData) {
      const movementDelta = ai.mesh.position.distanceTo(ai.lastPos);
      ai.lastPos.copy(ai.mesh.position);

      const targetLane = ai._targetLane !== undefined ? ai._targetLane : ai.offsetLane;
      const steeringAngle = ai.finished ? 0 : THREE.MathUtils.clamp((targetLane - ai.offsetLane) * 0.4, -0.6, 0.6);

      if (ai.mesh.userData.frontLeftPivot && ai.mesh.userData.frontRightPivot) {
        ai.mesh.userData.frontLeftPivot.rotation.y = THREE.MathUtils.lerp(
          ai.mesh.userData.frontLeftPivot.rotation.y, 
          steeringAngle, 
          0.1
        );
        ai.mesh.userData.frontRightPivot.rotation.y = THREE.MathUtils.lerp(
          ai.mesh.userData.frontRightPivot.rotation.y, 
          steeringAngle, 
          0.1
        );
      }

      const rollDelta = movementDelta * 8.0;
      ['frontLeftWheel', 'frontRightWheel', 'rearLeftWheel', 'rearRightWheel'].forEach(wheelKey => {
        if (ai.mesh.userData[wheelKey]) {
          ai.mesh.userData[wheelKey].rotation.x += rollDelta;
        }
      });
    }
  });
};