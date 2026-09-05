// map.js - Track Generation, Terrain, Road, and Tunnels

window.buildTrackSpline = function() {
  const waypoints = [
    new THREE.Vector3(0, 0, -350),
    new THREE.Vector3(180, 0, -350),
    new THREE.Vector3(320, 0, -200),
    new THREE.Vector3(350, 0, 0),
    new THREE.Vector3(200, 0, 120),
    new THREE.Vector3(380, 0, 280),
    new THREE.Vector3(150, 0, 420),
    new THREE.Vector3(-180, 0, 380),
    new THREE.Vector3(-380, 0, 180),
    new THREE.Vector3(-250, 0, -100),
    new THREE.Vector3(-350, 0, -280)
  ];

  window.trackCurve = new THREE.CatmullRomCurve3(waypoints, true, 'centripetal', 0.5);
  return window.trackCurve;
};

window.getBaseTerrainHeight = function(x, z) {
  const hill1 = Math.sin(x * 0.005 + z * 0.004) * 28.0;
  const hill2 = Math.cos(x * 0.002 - z * 0.003) * 18.0;
  const chocolateDome = Math.sin(x * 0.01) * Math.cos(z * 0.01) * 12.0;
  return Math.max(0, hill1 + hill2 + chocolateDome - 4.0);
};

window.getMinDistanceToTrack = function(x, z) {
  if (!window.trackCurve) return 200;
  let minDistance = Infinity;
  const samples = 160;
  for (let i = 0; i < samples; i++) {
    const pt = window.trackCurve.getPointAt(i / samples);
    const dist = Math.hypot(x - pt.x, z - pt.z);
    if (dist < minDistance) minDistance = dist;
  }
  return minDistance;
};

window.getTerrainHeight = function(x, z) {
  const baseHeight = window.getBaseTerrainHeight(x, z);
  const dist = window.getMinDistanceToTrack(x, z);
  const clearZone = (window.roadWidth || 12.0) + 20.0;
  const blendZone = clearZone + 40.0;

  if (dist < clearZone) {
    return 0;
  } else if (dist < blendZone) {
    const factor = (dist - clearZone) / (blendZone - clearZone);
    const smoothFactor = factor * factor * (3 - 2 * factor);
    return baseHeight * smoothFactor;
  }
  return baseHeight;
};

window.createExpandedTerrain = function(scene) {
  const size = 1200;
  const segments = 160;
  const geo = new THREE.PlaneGeometry(size, size, segments, segments);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  const colors = [];
  const color = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i);
    const vz = pos.getZ(i);
    const h = window.getTerrainHeight(vx, vz);
    pos.setY(i, h);

    const angle = Math.atan2(vz, vx);
    const uApprox = (angle + Math.PI) / (Math.PI * 2);

    if (uApprox < 0.20) {
      color.setHex(0xffb6c1); // Cakeway
    } else if (uApprox < 0.40) {
      color.setHex(0xd97706); // Gumball Gorge
    } else if (uApprox < 0.60) {
      color.setHex(0xe0f2fe); // Soft Serve
    } else if (uApprox < 0.80) {
      color.setHex(0xb91c1c); // Candy Cane
    } else {
      color.setHex(0x5c2c16); // Diet Cola Mountain
    }
    colors.push(color.r, color.g, color.b);
  }

  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.85,
    flatShading: true
  });

  const terrainMesh = new THREE.Mesh(geo, mat);
  terrainMesh.receiveShadow = true;
  scene.add(terrainMesh);
};

window.createBridgesAndTunnels = function(scene, roadWidth) {
  const samples = 400;
  for (let i = 0; i < samples; i++) {
    const u = i / samples;
    const pt = window.trackCurve.getPointAt(u);
    const tangent = window.trackCurve.getTangentAt(u).normalize();

    if (u >= 0.75 && u <= 0.85 && i % 8 === 0) {
      const tunnelArchGeo = new THREE.TorusGeometry(roadWidth + 1.5, 1.0, 8, 16, Math.PI);
      const tunnelMat = new THREE.MeshStandardMaterial({ color: 0x3d1c02, roughness: 0.6, metalness: 0.2 });
      const arch = new THREE.Mesh(tunnelArchGeo, tunnelMat);
      arch.position.copy(pt);
      arch.position.y = 0;
      arch.rotation.y = Math.atan2(tangent.x, tangent.z);
      scene.add(arch);
    }
  }
};

window.createRoadAndBarriers = function(scene, roadWidth) {
  const roadSamples = 800;
  const curvePoints = window.trackCurve.getSpacedPoints(roadSamples);
  const roadGeo = new THREE.BufferGeometry();

  const vertices = [];
  const uvs = [];

  for (let i = 0; i <= roadSamples; i++) {
    const uVal = (i % roadSamples) / roadSamples;
    const pt = curvePoints[i % roadSamples];
    const tangent = window.trackCurve.getTangentAt(uVal).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const side = new THREE.Vector3().crossVectors(tangent, up).normalize();

    const roadY = 0.05;

    const leftX = pt.x - side.x * roadWidth;
    const leftZ = pt.z - side.z * roadWidth;
    const rightX = pt.x + side.x * roadWidth;
    const rightZ = pt.z + side.z * roadWidth;

    vertices.push(leftX, roadY, leftZ);
    vertices.push(rightX, roadY, rightZ);

    uvs.push(0, (i / roadSamples) * 120);
    uvs.push(1, (i / roadSamples) * 120);
  }

  const indices = [];
  for (let i = 0; i < roadSamples; i++) {
    const r1 = i * 2;
    const r2 = (i + 1) * 2;
    indices.push(r1, r1 + 1, r2);
    indices.push(r1 + 1, r2 + 1, r2);
  }

  roadGeo.setIndex(indices);
  roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  roadGeo.computeVertexNormals();

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = '#181a1f';
  ctx.fillRect(0, 0, 512, 512);

  for (let y = 0; y < 512; y += 64) {
    ctx.fillStyle = (y / 64) % 2 === 0 ? '#b91c1c' : '#f8fafc';
    ctx.fillRect(0, y, 28, 64);
    ctx.fillRect(484, y, 28, 64);
  }

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(32, 0, 8, 512);
  ctx.fillRect(472, 0, 8, 512);

  ctx.fillStyle = '#eab308';
  for (let y = 0; y < 512; y += 64) {
    ctx.fillRect(250, y, 12, 36);
  }

  const roadTex = new THREE.CanvasTexture(canvas);
  roadTex.wrapS = THREE.RepeatWrapping;
  roadTex.wrapT = THREE.RepeatWrapping;

  const roadMat = new THREE.MeshStandardMaterial({
    map: roadTex,
    roughness: 0.5,
    metalness: 0.05,
    side: THREE.DoubleSide
  });

  const roadMesh = new THREE.Mesh(roadGeo, roadMat);
  roadMesh.receiveShadow = true;
  scene.add(roadMesh);

  window.createBridgesAndTunnels(scene, roadWidth);

  const barrierGeo = new THREE.BoxGeometry(0.6, 1.2, 2.5);
  const barrierMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, metalness: 0.2, roughness: 0.5 });

  for (let i = 0; i < roadSamples; i += 8) {
    const uVal = i / roadSamples;
    const pt = curvePoints[i];
    const tangent = window.trackCurve.getTangentAt(uVal).normalize();
    const side = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();
    const bY = 0.6;

    const leftB = new THREE.Mesh(barrierGeo, barrierMat);
    leftB.position.copy(pt).add(side.clone().multiplyScalar(-roadWidth - 0.4));
    leftB.position.y = bY;
    leftB.lookAt(leftB.position.clone().add(tangent));
    scene.add(leftB);

    const rightB = new THREE.Mesh(barrierGeo, barrierMat);
    rightB.position.copy(pt).add(side.clone().multiplyScalar(roadWidth + 0.4));
    rightB.position.y = bY;
    rightB.lookAt(rightB.position.clone().add(tangent));
    scene.add(rightB);
  }
};

window.createStartArch = function(scene, roadWidth) {
  const startPt = window.trackCurve.getPointAt(0);
  const tangent = window.trackCurve.getTangentAt(0).normalize();
  const side = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();

  const archGroup = new THREE.Group();

  const pillarGeo = new THREE.BoxGeometry(1.6, 12, 1.6);
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.4, roughness: 0.4 });

  const leftPillar = new THREE.Mesh(pillarGeo, pillarMat);
  leftPillar.position.copy(startPt).add(side.clone().multiplyScalar(-roadWidth - 0.5));
  leftPillar.position.y = 6;

  const rightPillar = new THREE.Mesh(pillarGeo, pillarMat);
  rightPillar.position.copy(startPt).add(side.clone().multiplyScalar(roadWidth + 0.5));
  rightPillar.position.y = 6;

  const headerGeo = new THREE.BoxGeometry(roadWidth * 2.5, 2.5, 2.2);
  const headerMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.2, roughness: 0.4 });
  const header = new THREE.Mesh(headerGeo, headerMat);
  header.position.copy(startPt);
  header.position.y = 12;
  header.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), side);

  archGroup.add(leftPillar, rightPillar, header);
  scene.add(archGroup);
};