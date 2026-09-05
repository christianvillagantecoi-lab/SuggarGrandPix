// castle.js - Standalone Giant Cake Castle Generator with Arched Approach Bridge for Cakeway Biome

function createCakeCastle(scene, spawnPos, terrainY, isTooCloseToTrack) {
  const castleGroup = new THREE.Group();

  // --- High Hill Foundation for the Center of the Biome ---
  const castleHillRadius = 20.0;
  const castleHillHeight = 12.0;
  const chocoMat = new THREE.MeshStandardMaterial({ color: 0xffb6c1, roughness: 0.5, flatShading: true });
  
  const castleTerrainDome = new THREE.Mesh(
    new THREE.SphereGeometry(castleHillRadius, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), 
    chocoMat
  );
  castleTerrainDome.position.set(20, -10.5, 0);
  castleTerrainDome.scale.set(1, castleHillHeight / castleHillRadius, 20);
  castleTerrainDome.receiveShadow = true;
  castleGroup.add(castleTerrainDome);

  // Materials matching reference image & biome color palette
  const whiteFrostingMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
  const creamSpongeMat = new THREE.MeshStandardMaterial({ color: 0xfff5eb, roughness: 0.6 });
  const goldAccMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.6, roughness: 0.2 });
  const yellowRoofMat = new THREE.MeshStandardMaterial({ color: 0xfde047, metalness: 0.5, roughness: 0.2, flatShading: true });
  const pinkAccentMat = new THREE.MeshStandardMaterial({ color: 0xff69b4, roughness: 0.4 });
  const stoneBridgeMat = new THREE.MeshStandardMaterial({ color: 0x4b382a, roughness: 0.7 });

 
  

  // --- Massive 4-Layer Cake Base (Expanded with a new widest bottom layer) ---
  const layer0Height = 7.0;
  const layer0Radius = 20.0;
  const layer0Mesh = new THREE.Mesh(new THREE.CylinderGeometry(layer0Radius, layer0Radius * 1.15, layer0Height, 32), whiteFrostingMat);
  layer0Mesh.position.y = layer0Height / 2;
  layer0Mesh.castShadow = true;
  layer0Mesh.receiveShadow = true;
  castleGroup.add(layer0Mesh);

  // Decorative balcony trim around Layer 0 base
  const baseRailing = new THREE.Mesh(new THREE.TorusGeometry(layer0Radius * 1.04, 0.3, 10, 32), pinkAccentMat);
  baseRailing.rotation.x = Math.PI / 2;
  baseRailing.position.y = 0.2;
  castleGroup.add(baseRailing);

  // Layer 1: Previous Bottom Cake Tier (shifted up)
  const layer1Height = 9.5;
  const layer1Radius = 10.0;
  const layer1Mesh = new THREE.Mesh(new THREE.CylinderGeometry(layer1Radius, layer1Radius * 1.15, layer1Height, 28), creamSpongeMat);
  layer1Mesh.position.y = layer0Height + (layer1Height / 2);
  layer1Mesh.castShadow = true;
  layer1Mesh.receiveShadow = true;
  castleGroup.add(layer1Mesh);

  // Grand Ornate Golden Archway Gate at entrance (adjusted to new bottom tier)
  const gatePillarL = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 5.2, 10), goldAccMat);
  gatePillarL.position.set(-1.8, layer0Height + 2.6, layer0Radius * 0.98);
  const gatePillarR = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 5.2, 10), goldAccMat);
  gatePillarR.position.set(1.8, layer0Height + 2.6, layer0Radius * 0.98);
  const gateArch = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.35, 10, 16, Math.PI), goldAccMat);
  gateArch.position.set(0, layer0Height + 5.0, layer0Radius * 0.98);
  gateArch.rotation.z = Math.PI;
  castleGroup.add(gatePillarL, gatePillarR, gateArch);

  // Layer 2: Middle Cake Tier
  const layer2Height = 6.5;
  const layer2Radius = 8.5;
  const layer2Mesh = new THREE.Mesh(new THREE.CylinderGeometry(layer2Radius, layer2Radius, layer2Height, 24), whiteFrostingMat);
  layer2Mesh.position.y = layer0Height + layer1Height + (layer2Height / 2);
  layer2Mesh.castShadow = true;
  castleGroup.add(layer2Mesh);

  // Decorative balcony trim around Layer 2 base
  const midRailing = new THREE.Mesh(new THREE.TorusGeometry(layer2Radius * 1.04, 0.3, 10, 28), pinkAccentMat);
  midRailing.rotation.x = Math.PI / 2;
  midRailing.position.y = layer0Height + layer1Height + 0.2;
  castleGroup.add(midRailing);

  // Layer 3: Top Cake Tier
  const layer3Height = 5.5;
  const layer3Radius = 5.5;
  const layer3Mesh = new THREE.Mesh(new THREE.CylinderGeometry(layer3Radius, layer3Radius, layer3Height, 20), creamSpongeMat);
  layer3Mesh.position.y = layer0Height + layer1Height + layer2Height + (layer3Height / 2);
  layer3Mesh.castShadow = true;
  castleGroup.add(layer3Mesh);

  // Central Top Spire Roof
  const topRoof = new THREE.Mesh(new THREE.ConeGeometry(layer3Radius * 1.3, 6.0, 20), yellowRoofMat);
  topRoof.position.y = layer0Height + layer1Height + layer2Height + layer3Height + 3.0;
  topRoof.castShadow = true;
  castleGroup.add(topRoof);

  // Central Star / Finial Top
  const centralFinial = new THREE.Mesh(new THREE.SphereGeometry(0.6, 10, 10), goldAccMat);
  centralFinial.position.y = layer0Height + layer1Height + layer2Height + layer3Height + 6.2;
  centralFinial.castShadow = true;
  castleGroup.add(centralFinial);

 // --- Clustered Towers Organized by Tier (Core, Inner, Outer) and Position (North, South, East, West) ---
  const towerData = [
    // ==========================================
    // 1. OUTER RING (Perimeter / Edge Towers - Pushed significantly further out)
    // ==========================================
    { tier: 'outer', position: 'north',     x: 0.0,   z: 22.0, h: 16.0, r: 2.0 },
    { tier: 'outer', position: 'south',     x: 0.0,   z: -22.0, h: 20.0, r: 1.6 },
    { tier: 'outer', position: 'east',      x: 22.0,  z: 8.0,  h: 12.0, r: 1.7 },
    { tier: 'outer', position: 'west',      x: -22.0, z: 0.0,  h: 20.0, r: 1.7 },
    { tier: 'outer', position: 'north-east',x: 18.0,  z: 18.0, h: 15.0, r: 1.8 },
    { tier: 'outer', position: 'north-west',x: -18.0, z: 18.0, h: 12.0, r: 1.8 },
    { tier: 'outer', position: 'south-east',x: 18.0,  z: -18.0, h: 14.0, r: 1.8 },
    { tier: 'outer', position: 'south-west',x: -18.0, z: -18.0, h: 16.0, r: 1.8 },

    // ==========================================
    // 2. INNER RING (Mid-Level Towers - Pushed further away from the core)
    // ==========================================
    { tier: 'inner', position: 'north (front gate)', x: 0.0,   z: 15.0, h: 30.0, r: 2.1 },
    { tier: 'inner', position: 'south',              x: 0.0,   z: -15.0, h: 20.0, r: 1.7 },
    { tier: 'inner', position: 'east',               x: 15.0,  z: 0.0,  h: 15.0, r: 1.8 },
    { tier: 'inner', position: 'west',               x: -15.0, z: 1.0,  h: 45.0, r: 1.8 },
    { tier: 'inner', position: 'north-east',         x: 12.0,  z: 12.0, h: 25.5, r: 1.9 },
    { tier: 'inner', position: 'north-west',         x: -12.0, z: 12.0, h: 20.5, r: 1.9 },
    { tier: 'inner', position: 'south-east',         x: 12.0,  z: -12.0, h: 35.5, r: 1.8 },
    { tier: 'inner', position: 'south-west',         x: -12.0, z: -12.0, h: 20.5, r: 1.8 },


    // ==========================================
    // 3. CORE RING (Closest to Center Spire)
    // ==========================================
    { tier: 'core',  position: 'north-east',         x: 5.5,   z: 5.5,  h: 30.0, r: 1.3 },
    { tier: 'core',  position: 'north-west',         x: -5.5,  z: 5.5,  h: 60.0, r: 1.3 }
  ];

  towerData.forEach(td => {
    const worldTowerX = spawnPos.x + td.x;
    const worldTowerZ = spawnPos.z + td.z;

    if (!isTooCloseToTrack(worldTowerX, worldTowerZ, 10.0)) {
      const towerTerrainY = typeof window.getTerrainHeight === 'function' ? window.getTerrainHeight(worldTowerX, worldTowerZ) : terrainY;
      const localTowerY = towerTerrainY - terrainY;

      // Mega Tall Tower Body
      const towerBody = new THREE.Mesh(new THREE.CylinderGeometry(td.r, td.r * 1.1, td.h, 16), whiteFrostingMat);
      towerBody.position.set(td.x, localTowerY + (td.h / 2), td.z);
      towerBody.castShadow = true;

      // Elongated Spire Roof
      const spireRoof = new THREE.Mesh(new THREE.ConeGeometry(td.r * 1.4, 5.5, 16), yellowRoofMat);
      spireRoof.position.set(td.x, localTowerY + td.h + 2.75, td.z);
      spireRoof.castShadow = true;

      // Golden Finial Top
      const finial = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 10), goldAccMat);
      finial.position.set(td.x, localTowerY + td.h + 5.5, td.z);
      finial.castShadow = true;

      castleGroup.add(towerBody, spireRoof, finial);
    }
  });

  // Overall Grand Scale Multiplier
  castleGroup.scale.set(2.4, 2.4, 2.4);
  castleGroup.position.set(spawnPos.x, terrainY, spawnPos.z);
  scene.add(castleGroup);
}

window.createCakeCastle = createCakeCastle;