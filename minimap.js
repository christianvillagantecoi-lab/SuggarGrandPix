// minimap.js - Dynamic Minimap & Expandable Map Overlay System

window.isMapExpanded = false;

window.drawMinimap = function(minimapCtx, playerCar, aiCars) {
  if (!minimapCtx || !playerCar || !window.trackCurve) return;

  const canvas = minimapCtx.canvas;
  const isExpanded = window.isMapExpanded;

  const w = canvas.width;
  const h = canvas.height;
  
  minimapCtx.clearRect(0, 0, w, h);

  const startPt = window.trackCurve.getPointAt(0);

  // Helper to convert numeric color (e.g., 0xff007f) to CSS hex string
  const getCssColor = (colorNum, fallback) => {
    if (colorNum === undefined || colorNum === null) return fallback;
    return '#' + Number(colorNum).toString(16).padStart(6, '0');
  };

  const playerColor = getCssColor(window.KART_CONFIGS?.player?.color, '#00f0ff');

  if (isExpanded) {
    // --- FULL OVERLAY OVERVIEW MAP ---
    minimapCtx.fillStyle = 'rgba(8, 11, 18, 0.85)';
    minimapCtx.fillRect(0, 0, w, h);

    const points = window.trackCurve.getSpacedPoints(180);
    
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    points.forEach(p => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.z < minZ) minZ = p.z;
      if (p.z > maxZ) maxZ = p.z;
    });

    const mapPadding = 40;
    const scaleX = (w - mapPadding * 2) / (maxX - minX);
    const scaleZ = (h - mapPadding * 2) / (maxZ - minZ);
    const scale = Math.min(scaleX, scaleZ);

    const mapCenterX = (minX + maxX) / 2;
    const mapCenterZ = (minZ + maxZ) / 2;

    const toCanvasX = (x) => (w / 2) + (x - mapCenterX) * scale;
    const toCanvasY = (z) => (h / 2) + (z - mapCenterZ) * scale;

    // Draw track path
    minimapCtx.beginPath();
    minimapCtx.strokeStyle = 'rgba(0, 240, 255, 0.8)';
    minimapCtx.lineWidth = 10;
    points.forEach((pt, idx) => {
      const cx = toCanvasX(pt.x);
      const cy = toCanvasY(pt.z);
      if (idx === 0) minimapCtx.moveTo(cx, cy);
      else minimapCtx.lineTo(cx, cy);
    });
    minimapCtx.closePath();
    minimapCtx.stroke();

    // Mark Start/Finish Arch
    const archX = toCanvasX(startPt.x);
    const archY = toCanvasY(startPt.z);
    
    minimapCtx.fillStyle = '#facc15';
    minimapCtx.beginPath();
    minimapCtx.arc(archX, archY, 7, 0, Math.PI * 2);
    minimapCtx.fill();
    minimapCtx.strokeStyle = '#ffffff';
    minimapCtx.lineWidth = 2;
    minimapCtx.stroke();

    minimapCtx.font = 'bold 10px sans-serif';
    minimapCtx.fillStyle = '#facc15';
    minimapCtx.textAlign = 'center';
    minimapCtx.fillText('FINISH', archX, archY - 10);

    // Draw AI Cars with their respective unique colors
    if (aiCars && Array.isArray(aiCars)) {
      aiCars.forEach(ai => {
        if (ai.mesh) {
          const ax = toCanvasX(ai.mesh.position.x);
          const ay = toCanvasY(ai.mesh.position.z);
          minimapCtx.fillStyle = getCssColor(ai.color, '#ff007f');
          minimapCtx.beginPath();
          minimapCtx.arc(ax, ay, 6, 0, Math.PI * 2);
          minimapCtx.fill();
        }
      });
    }

    // Draw Player with chosen custom color
    const px = toCanvasX(playerCar.position.x);
    const py = toCanvasY(playerCar.position.z);
    minimapCtx.fillStyle = playerColor;
    minimapCtx.beginPath();
    minimapCtx.arc(px, py, 8, 0, Math.PI * 2);
    minimapCtx.fill();

  } else {
    // --- HUD MINIMAP (RADAR) ---
    const scale = 0.15;
    const cx = w / 2;
    const cy = h / 2;

    minimapCtx.save();
    minimapCtx.translate(cx, cy);
    minimapCtx.rotate(-playerCar.rotation.y);

    minimapCtx.beginPath();
    minimapCtx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    minimapCtx.lineWidth = 6;
    const points = window.trackCurve.getSpacedPoints(120);
    points.forEach((pt, idx) => {
      const mx = (pt.x - playerCar.position.x) * scale;
      const my = (pt.z - playerCar.position.z) * scale;
      if (idx === 0) minimapCtx.moveTo(mx, my);
      else minimapCtx.lineTo(mx, my);
    });
    minimapCtx.closePath();
    minimapCtx.stroke();

    // Mark Start/Finish Dot
    const archMx = (startPt.x - playerCar.position.x) * scale;
    const archMy = (startPt.z - playerCar.position.z) * scale;

    minimapCtx.fillStyle = '#facc15';
    minimapCtx.beginPath();
    minimapCtx.arc(archMx, archMy, 5, 0, Math.PI * 2);
    minimapCtx.fill();

    minimapCtx.font = 'bold 9px sans-serif';
    minimapCtx.fillStyle = '#facc15';
    minimapCtx.textAlign = 'center';
    minimapCtx.fillText('FINISH', archMx, archMy - 8);

    // Draw AI Cars on radar with respective colors
    if (aiCars && Array.isArray(aiCars)) {
      aiCars.forEach(ai => {
        if (ai.mesh) {
          const ax = (ai.mesh.position.x - playerCar.position.x) * scale;
          const ay = (ai.mesh.position.z - playerCar.position.z) * scale;
          minimapCtx.fillStyle = getCssColor(ai.color, '#ff007f');
          minimapCtx.beginPath();
          minimapCtx.arc(ax, ay, 4, 0, Math.PI * 2);
          minimapCtx.fill();
        }
      });
    }

    minimapCtx.restore();

    // Draw Player dot on center of radar with chosen custom color
    minimapCtx.fillStyle = playerColor;
    minimapCtx.beginPath();
    minimapCtx.arc(cx, cy, 6, 0, Math.PI * 2);
    minimapCtx.fill();
  }
};

// --- TOUCH / CLICK INTERACTIVE EXPANSION LOGIC ---
window.initMapInteractions = function() {
  const container = document.getElementById('minimap-container');
  const canvas = document.getElementById('minimap');
  if (!container || !canvas) return;

  const toggleExpand = (e) => {
    e.stopPropagation();
    window.isMapExpanded = !window.isMapExpanded;

    if (window.isMapExpanded) {
      container.classList.add('expanded');
      canvas.width = Math.min(window.innerWidth * 0.8, 500);
      canvas.height = Math.min(window.innerHeight * 0.8, 500);
    } else {
      container.classList.remove('expanded');
      canvas.width = 140;
      canvas.height = 140;
    }
  };

  container.style.pointerEvents = 'auto'; // Enable touch/click during game
  container.addEventListener('click', toggleExpand);
  container.addEventListener('touchstart', toggleExpand, { passive: true });
};

document.addEventListener('DOMContentLoaded', window.initMapInteractions);