// menu.js - Dedicated Isolated Main Menu and UI/UX Platform

(function() {
  function initMainMenu() {
    const mainMenuEl = document.getElementById('menu');
    const startBtn = document.getElementById('start-btn');
    const menuSettingsBtn = document.getElementById('menu-settings-btn');

    if (menuSettingsBtn) {
      menuSettingsBtn.addEventListener('click', () => {
        if (typeof window.openSettingsModal === 'function') {
          window.openSettingsModal();
        }
      });
    }

    if (startBtn && !startBtn.dataset.menuBound) {
      startBtn.addEventListener('click', () => {
        if (typeof window.startCinematicRace === 'function') {
          window.startCinematicRace();
        } else if (mainMenuEl) {
          mainMenuEl.style.display = 'none';
        }
      });
      startBtn.dataset.menuBound = 'true';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMainMenu);
  } else {
    initMainMenu();
  }
})();