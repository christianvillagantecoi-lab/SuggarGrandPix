// customize.js - Modern UI/UX Kart and Profile Customizer

window.userCustomProfile = {
  name: 'YOU (Player)',
  selectedKartIndex: 0
};

// Available custom color configurations for player karts
window.PLAYER_KART_OPTIONS = [
  { id: 0, name: 'Cyber Cyan', color: 0x00f0ff, bodyMetalness: 0.6, bodyRoughness: 0.2, cabinColor: 0x0f172a },
  { id: 1, name: 'Neon Magenta', color: 0xff007f, bodyMetalness: 0.6, bodyRoughness: 0.2, cabinColor: 0x1a0510 },
  { id: 2, name: 'Solar Gold', color: 0xfacc15, bodyMetalness: 0.7, bodyRoughness: 0.15, cabinColor: 0x1f1a05 },
  { id: 3, name: 'Emerald Speed', color: 0x10b981, bodyMetalness: 0.6, bodyRoughness: 0.2, cabinColor: 0x031f14 }
];

document.addEventListener('DOMContentLoaded', () => {
  injectCustomizerUI();
  setupCustomizerListeners();
});

function injectCustomizerUI() {
  const mainMenuContent = document.querySelector('#menu .menu-content');
  if (!mainMenuContent) return;

  // Insert Customizer panel right before the start button
  const customizerHtml = `
    <div class="customizer-box">
      <div class="control-title">PILOT & KART CUSTOMIZATION</div>
      
      <div class="customizer-field">
        <label for="player-name-input" class="action">RACER NAME</label>
        <input type="text" id="player-name-input" value="YOU (Player)" maxlength="16" autocomplete="off" />
      </div>

      <div class="customizer-field" style="margin-top: 10px;">
        <span class="action">CHOOSE KART STYLE</span>
        <div class="kart-options-grid" id="kart-options-grid">
          ${window.PLAYER_KART_OPTIONS.map((opt, idx) => `
            <button type="button" class="kart-option-btn ${idx === 0 ? 'active' : ''}" data-index="${idx}" style="border-color: #${opt.color.toString(16).padStart(6, '0')}">
              <span class="color-dot" style="background-color: #${opt.color.toString(16).padStart(6, '0')}"></span>
              <span class="kart-name">${opt.name}</span>
            </button>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  const startBtn = document.getElementById('start-btn');
  if (startBtn) {
    startBtn.insertAdjacentHTML('beforebegin', customizerHtml);
  }
}

function setupCustomizerListeners() {
  const nameInput = document.getElementById('player-name-input');
  if (nameInput) {
    nameInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      window.userCustomProfile.name = val !== '' ? val : 'YOU (Player)';
      if (window.KART_CONFIGS && window.KART_CONFIGS.player) {
        window.KART_CONFIGS.player.name = window.userCustomProfile.name;
      }
    });
  }

  const optionBtns = document.querySelectorAll('.kart-option-btn');
  optionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      optionBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const idx = parseInt(btn.getAttribute('data-index'), 10);
      window.userCustomProfile.selectedKartIndex = idx;

      const chosenConfig = window.PLAYER_KART_OPTIONS[idx];
      if (window.KART_CONFIGS && window.KART_CONFIGS.player) {
        window.KART_CONFIGS.player.color = chosenConfig.color;
        window.KART_CONFIGS.player.bodyMetalness = chosenConfig.bodyMetalness;
        window.KART_CONFIGS.player.bodyRoughness = chosenConfig.bodyRoughness;
        window.KART_CONFIGS.player.cabinColor = chosenConfig.cabinColor;
      }
    });
  });
}