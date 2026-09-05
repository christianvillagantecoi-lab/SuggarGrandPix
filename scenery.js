// scenery.js - Giant Cake Castle Placed Precisely at the Center of the Cakeway Biome (u = 0.10) & Clean Gumball Gorge

function createSceneryObjects(scene, trackCurve, roadWidth) {
  const totalObjects = 450; 
  const defaultMinDist = (roadWidth || 12.0) + 12.0;
  
  // Pre-sample track for precise collision checking
  const trackPoints = trackCurve.getSpacedPoints(500);

  // Helper function to strictly check if a world position is too close to the track
  function isTooCloseToTrack(worldX, worldZ, extraBuffer = 10.0) {
    const threshold = roadWidth + extraBuffer;
    for (let j = 0; j < trackPoints.length; j++) {
      const tp = trackPoints[j];
      if (Math.hypot(worldX - tp.x, worldZ - tp.z) < threshold) {
        return true;
      }
    }
    return false;
  }

 // =========================================================================
  // CASTLE POSITION CONTROLS (Adjust these to move your castle easily!)
  // =========================================================================
  const useManualWorldCoordinates = false; // Set to true to use exact X, Y, Z coordinates instead of track path
  
  let castleSpawnPos;

  if (useManualWorldCoordinates) {
    // --- METHOD B: Exact World Coordinates (X, Y, Z) ---
    // Change these numbers to place the castle at a fixed spot in your world
    castleSpawnPos = new THREE.Vector3(-300.0, 0.0, 300.0);
  } else {
    // --- METHOD A: Track-Relative Positioning ---
    // castleU: Position along the track loop (0.0 to 1.0)
    // multiplyScalar: Distance away from the track (negative goes to one side, positive to the other)
    const castleU = 0.87; 
    const castlePt = trackCurve.getPointAt(castleU);
    const castleTangent = trackCurve.getTangentAt(castleU).normalize();
    const castleSide = new THREE.Vector3().crossVectors(castleTangent, new THREE.Vector3(0, 1, 0)).normalize();
    
    castleSpawnPos = castlePt.clone().add(castleSide.multiplyScalar(-150.0));
  }

  // Automatically fetch terrain height for the chosen castle position
  let castleTerrainY = 0;
  if (typeof window.getTerrainHeight === 'function') {
    castleTerrainY = window.getTerrainHeight(castleSpawnPos.x, castleSpawnPos.z);
  }
  
  // Spawn the castle
  if (typeof window.createCakeCastle === 'function') {
    window.createCakeCastle(scene, castleSpawnPos, castleTerrainY, isTooCloseToTrack);
  }

  for (let i = 0; i < totalObjects; i++) {
    const u = i / totalObjects; 
    const pt = trackCurve.getPointAt(u);
    const tangent = trackCurve.getTangentAt(u).normalize();
    const side = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();

    const angle = Math.atan2(pt.z, pt.x);
    const uBiome = (angle + Math.PI) / (Math.PI * 2);

    let sideDistance;
    if (uBiome >= 0.40 && uBiome < 0.60) {
      sideDistance = 30.0 + Math.random() * 120; 
    } else {
      sideDistance = defaultMinDist + Math.random() * 120;
    }

    const sideDirection = Math.random() < 0.5 ? 1 : -1;
    const spawnPos = pt.clone().add(side.multiplyScalar(sideDistance * sideDirection));
    
    // --- STRICT ROAD CLEARANCE CHECK FOR MAIN OBJECT ---
    if (isTooCloseToTrack(spawnPos.x, spawnPos.z, 16.0)) continue;

    let terrainY = 0;
    if (typeof window.getTerrainHeight === 'function') {
      terrainY = window.getTerrainHeight(spawnPos.x, spawnPos.z);
    }

    const itemGroup = new THREE.Group();
    let scale = 0.7 + Math.random() * 1.4;

    // ==========================================
    // 1. CAKEWAY - Whipped Cream Cakes
    // ==========================================
    if (uBiome < 0.20) {
      const frostingMat = new THREE.MeshStandardMaterial({ color: 0xff69b4, roughness: 0.4 });
      const spongeMat = new THREE.MeshStandardMaterial({ color: 0xf5deb3, roughness: 0.8 });

      const baseMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 2.2, 10), spongeMat);
      baseMesh.position.y = 1.1;
      baseMesh.castShadow = true;

      const topMesh = new THREE.Mesh(new THREE.SphereGeometry(1.8, 10, 10, 0, Math.PI * 2, 0, Math.PI * 0.7), frostingMat);
      topMesh.position.y = 2.2;
      topMesh.castShadow = true;
      itemGroup.add(baseMesh, topMesh);
    }
    // ==========================================
    // 2. GUMBALL GORGE - Most Biggest Super Mega Tall Gumball Machine Tower (Candy Canes Removed)[cite: 5]
    // ==========================================
    else if (uBiome < 0.40) {
      const isMegaMonolith = Math.random() < 0.35;
      const heightMult = isMegaMonolith ? (3.5 + Math.random() * 2.0) : (1.6 + Math.random() * 0.9);
      const widthMult = isMegaMonolith ? (2.2 + Math.random() * 1.0) : (1.3 + Math.random() * 0.4);

      const standHeight = 5.0 * heightMult;
      const standRadiusBottom = 1.4 * widthMult;
      const standRadiusTop = 0.7 * widthMult;

      const baseColors = [0xb91c1c, 0x1d4ed8, 0xb45309, 0x6d28d9];
      const chosenBaseColor = baseColors[Math.floor(Math.random() * baseColors.length)];
      const metalMat = new THREE.MeshStandardMaterial({ color: chosenBaseColor, metalness: 0.5, roughness: 0.3 });
      
      const stand = new THREE.Mesh(new THREE.CylinderGeometry(standRadiusTop, standRadiusBottom, standHeight, 12), metalMat);
      stand.position.y = standHeight / 2;
      stand.castShadow = true;

      const chuteMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.8, roughness: 0.2 });
      const chute = new THREE.Mesh(new THREE.BoxGeometry(standRadiusTop * 1.2, standHeight * 0.15, standRadiusTop * 1.2), chuteMat);
      chute.position.set(0, standHeight * 0.1, standRadiusBottom * 0.8);
      chute.castShadow = true;

      const globeRadius = 2.6 * widthMult;
      const globePosY = standHeight + globeRadius * 0.75;
      const globe = new THREE.Mesh(
        new THREE.SphereGeometry(globeRadius, 16, 16), 
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1, transparent: true, opacity: 0.6, side: THREE.DoubleSide })
      );
      globe.position.y = globePosY;

      const capMat = new THREE.MeshStandardMaterial({ color: chosenBaseColor, metalness: 0.6, roughness: 0.3 });
      const globeCap = new THREE.Mesh(new THREE.CylinderGeometry(globeRadius * 0.4, globeRadius * 0.5, 0.8, 12), capMat);
      globeCap.position.y = globePosY + globeRadius + 0.4;
      globeCap.castShadow = true;

      itemGroup.add(stand, chute, globe, globeCap);

      const gumballColors = [0xef4444, 0x38bdf8, 0xfacc15, 0x4ade80, 0xf472b6, 0xa78bfa, 0xffffff, 0xf97316];
      const numGumballs = 18 + Math.floor(Math.random() * 15); 
      for (let g = 0; g < numGumballs; g++) {
        const gbRadius = (0.3 + Math.random() * 0.35) * widthMult;
        const gbMat = new THREE.MeshStandardMaterial({ 
          color: gumballColors[Math.floor(Math.random() * gumballColors.length)], 
          roughness: 0.15 
        });
        const gbMesh = new THREE.Mesh(new THREE.SphereGeometry(gbRadius, 8, 8), gbMat);
        
        const uTheta = Math.random() * Math.PI * 2;
        const uPhi = Math.acos((Math.random() * 2) - 1);
        const uDist = Math.random() * (globeRadius * 0.72);
        
        const gx = Math.sin(uPhi) * Math.cos(uTheta) * uDist;
        const gy = globePosY + Math.cos(uPhi) * uDist;
        const gz = Math.sin(uPhi) * Math.sin(uTheta) * uDist;

        gbMesh.position.set(gx, gy, gz);
        itemGroup.add(gbMesh);
      }
      // Note: Candy canes have been fully removed from Gumball Gorge per request[cite: 5].
    } 
    // ==========================================
    // 3. SOFT SERVE SPEEDWAY - Swirl Trees & Rocks[cite: 5]
    // ==========================================
    else if (uBiome < 0.60) {
      const isSuperBig = Math.random() < 0.35;
      const swirlScale = isSuperBig ? (2.0 + Math.random() * 1.2) : (0.9 + Math.random() * 1.0);
      scale *= swirlScale;

      const flavorPalettes = [
        { body: 0xfffbeb, top: 0xef4444 }, 
        { body: 0xfbcfe8, top: 0x84cc16 }, 
        { body: 0xfde68a, top: 0x7c2d12 }, 
        { body: 0xc7d2fe, top: 0xf43f5e }, 
        { body: 0xa7f3d0, top: 0x3b82f6 }  
      ];
      const chosenFlavor = flavorPalettes[Math.floor(Math.random() * flavorPalettes.length)];

      const iceMat = new THREE.MeshStandardMaterial({ color: chosenFlavor.body, roughness: 0.3 });
      const layers = 3 + Math.floor(Math.random() * 3);
      
      for (let t = 0; t < layers; t++) {
        const radius = (2.4 - (t * 0.35));
        const height = 1.4;
        const swirlMesh = new THREE.Mesh(new THREE.ConeGeometry(Math.max(0.5, radius), height, 12), iceMat);
        swirlMesh.position.y = (t * 1.1) + 0.8;
        swirlMesh.castShadow = true;
        itemGroup.add(swirlMesh);
      }

      const topMat = new THREE.MeshStandardMaterial({ color: chosenFlavor.top, roughness: 0.2 });
      const topScoop = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 10), topMat);
      topScoop.position.y = (layers * 1.1) + 0.4;
      itemGroup.add(topScoop);

      if (Math.random() < 0.7) {
        const waferMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.6 });
        const waferStick = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.8, 6), waferMat);
        waferStick.rotation.z = 0.4;
        waferStick.rotation.x = 0.2;
        waferStick.position.set(0.4, (layers * 1.1) + 0.2, 0);
        itemGroup.add(waferStick);
      }

      const rockColors = [0xfbcfe8, 0xbae6fd, 0xfef08a, 0xf9a8d4, 0xd8b4fe];
      const numRocks = 1 + Math.floor(Math.random() * 2); 
      
      for (let r = 0; r < numRocks; r++) {
        const rSize = 0.6 + Math.random() * 0.8;
        const rockMat = new THREE.MeshStandardMaterial({ 
          color: rockColors[Math.floor(Math.random() * rockColors.length)], 
          roughness: 0.35,
          flatShading: true 
        });
        const rockMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(rSize, 0), rockMat);
        
        const angleOffset = Math.random() * Math.PI * 2;
        const distOffset = 2.0 + Math.random() * 1.5; 
        const localX = Math.cos(angleOffset) * distOffset;
        const localZ = Math.sin(angleOffset) * distOffset;
        const worldRockX = spawnPos.x + localX;
        const worldRockZ = spawnPos.z + localZ;

        if (isTooCloseToTrack(worldRockX, worldRockZ, 12.0)) continue;

        const rockTerrainY = typeof window.getTerrainHeight === 'function' ? window.getTerrainHeight(worldRockX, worldRockZ) : terrainY;
        const localRockY = (rockTerrainY - terrainY) + (rSize * 0.5);

        rockMesh.position.set(localX, localRockY, localZ);
        rockMesh.castShadow = true;
        itemGroup.add(rockMesh);
      }
    } 
    // ==========================================
    // 4. CANDY CANE FOREST - Lollipops & Gummy Rocks[cite: 5]
    // ==========================================
    else if (uBiome < 0.80) {
      const stickMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
      const candyHeadMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });

      const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 4.5, 8), stickMat);
      stick.position.y = 2.25;

      const candyTop = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.6, 12), candyHeadMat);
      candyTop.rotation.x = Math.PI / 2;
      candyTop.position.y = 4.8;
      itemGroup.add(stick, candyTop);

      const gummyColors = [0xef4444, 0x22c55e, 0x38bdf8, 0xa855f7, 0xf97316];
      const numGummies = 2 + Math.floor(Math.random() * 2);
      for (let g = 0; g < numGummies; g++) {
        const gSize = 0.5 + Math.random() * 0.6;
        const gummyMat = new THREE.MeshStandardMaterial({
          color: gummyColors[Math.floor(Math.random() * gummyColors.length)],
          roughness: 0.1,
          transparent: true,
          opacity: 0.75
        });
        const gummyMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(gSize, 0), gummyMat);
        
        const gAngle = Math.random() * Math.PI * 2;
        const gDist = 2.5 + Math.random() * 1.5;
        const localX = Math.cos(gAngle) * gDist;
        const localZ = Math.sin(gAngle) * gDist;
        const worldGummyX = spawnPos.x + localX;
        const worldGummyZ = spawnPos.z + localZ;

        if (isTooCloseToTrack(worldGummyX, worldGummyZ, 10.0)) continue;

        const gummyTerrainY = typeof window.getTerrainHeight === 'function' ? window.getTerrainHeight(worldGummyX, worldGummyZ) : terrainY;
        const localGummyY = (gummyTerrainY - terrainY) + (gSize * 0.5);

        gummyMesh.position.set(localX, localGummyY, localZ);
        gummyMesh.castShadow = true;
        itemGroup.add(gummyMesh);
      }
    } 
    // ==========================================
    // 5. DIET COLA MOUNTAIN - Soda Bottles & Super Mega Tall Dome Chocolate Hills[cite: 5]
    // ==========================================
    else {
      const bottleGlass = new THREE.MeshStandardMaterial({ color: 0x3d1c02, roughness: 0.3, metalness: 0.2 });
      const capMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });

      const heightMultiplier = 0.8 + Math.random() * 1.5;
      const widthMultiplier = 0.9 + Math.random() * 0.5;

      const bodyHeight = 6.5 * heightMultiplier;
      const bodyRadius = 2.8 * widthMultiplier;

      const body = new THREE.Mesh(new THREE.CylinderGeometry(bodyRadius, bodyRadius * 1.05, bodyHeight, 12), bottleGlass);
      body.position.y = bodyHeight / 2;
      body.castShadow = true;

      const neckHeight = 2.5 * (0.8 + Math.random() * 1.0);
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(bodyRadius * 0.35, bodyRadius, neckHeight, 12), bottleGlass);
      neck.position.y = bodyHeight + (neckHeight / 2);

      const capHeight = 0.9 * (0.8 + Math.random() * 1.2);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(bodyRadius * 0.38, bodyRadius * 0.38, capHeight, 10), capMat);
      cap.position.y = bodyHeight + neckHeight + (capHeight / 2);

      itemGroup.add(body, neck, cap);

      const chocoMat = new THREE.MeshStandardMaterial({ color: 0x271202, roughness: 0.25 });
      const syrupMat = new THREE.MeshStandardMaterial({ color: 0x4a2204, roughness: 0.1 });
      
      const isSuperMegaHill = Math.random() < 0.45; 
      const hillRadius = isSuperMegaHill ? (5.0 + Math.random() * 3.5) : (2.5 + Math.random() * 2.0);
      const hillHeight = isSuperMegaHill ? (8.0 + Math.random() * 6.0) : (3.0 + Math.random() * 2.5);
      
      const hillX = 4.5 + Math.random() * 3.0;
      const hillZ = 2.0 + Math.random() * 3.0;
      const worldHillX = spawnPos.x + hillX;
      const worldHillZ = spawnPos.z + hillZ;

      if (!isTooCloseToTrack(worldHillX, worldHillZ, 12.0)) {
        const hillTerrainY = typeof window.getTerrainHeight === 'function' ? window.getTerrainHeight(worldHillX, worldHillZ) : terrainY;
        const localHillY = hillTerrainY - terrainY;

        const domeGeom = new THREE.SphereGeometry(hillRadius, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
        const hillMesh = new THREE.Mesh(domeGeom, chocoMat);
        hillMesh.position.set(hillX, localHillY, hillZ);
        hillMesh.scale.set(1, hillHeight / hillRadius, 1);
        hillMesh.castShadow = true;

        const syrupTop = new THREE.Mesh(
          new THREE.SphereGeometry(hillRadius * 0.4, 10, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), 
          syrupMat
        );
        syrupTop.position.set(hillX, localHillY + (hillHeight * 0.8), hillZ);
        syrupTop.scale.set(1, 0.6, 1);
        syrupTop.castShadow = true;

        itemGroup.add(hillMesh, syrupTop);

        if (Math.random() < 0.65) {
          const subHillRadius = 2.0 + Math.random() * 1.8;
          const subHillHeight = 3.5 + Math.random() * 2.5;
          const subHillX = hillX - (3.5 + Math.random() * 2.5);
          const subHillZ = hillZ + (2.0 + Math.random() * 2.0);
          const worldSubX = spawnPos.x + subHillX;
          const worldSubZ = spawnPos.z + subHillZ;

          if (!isTooCloseToTrack(worldSubX, worldSubZ, 10.0)) {
            const subTerrainY = typeof window.getTerrainHeight === 'function' ? window.getTerrainHeight(worldSubX, worldSubZ) : terrainY;
            const localSubY = subTerrainY - terrainY;

            const subDomeGeom = new THREE.SphereGeometry(subHillRadius, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.5);
            const subHillMesh = new THREE.Mesh(subDomeGeom, chocoMat);
            subHillMesh.position.set(subHillX, localSubY, subHillZ);
            subHillMesh.scale.set(1, subHillHeight / subHillRadius, 1);
            subHillMesh.castShadow = true;
            itemGroup.add(subHillMesh);
          }
        }
      }
    }

    itemGroup.scale.set(scale, scale, scale);
    itemGroup.position.set(spawnPos.x, terrainY, spawnPos.z);
    scene.add(itemGroup);
  }
}

window.createSceneryObjects = createSceneryObjects;