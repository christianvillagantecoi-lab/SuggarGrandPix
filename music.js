// music.js - Strict Audio Manager for Menu (sugar2.mp3) & Race (sugar.mp3)

const menuMusic = new Audio('sugar2.mp3');
menuMusic.loop = true;
menuMusic.volume = 0.5;

const raceMusic = new Audio('sugar.mp3');
raceMusic.loop = true;
raceMusic.volume = 0.5;

let masterVolume = 0.5;
let currentMusicMode = 'menu';
window.currentMusicMode = 'menu';

function safePlay(audio) {
    if (!audio) return;
    audio.volume = masterVolume;
    try {
        const playPromise = audio.play();
        if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(() => {});
        }
    } catch (error) {
        // Ignore autoplay restrictions.
    }
}

function setMusicMode(mode) {
    currentMusicMode = mode;
    window.currentMusicMode = mode;

    if (mode === 'menu') {
        raceMusic.pause();
        raceMusic.currentTime = 0;
        menuMusic.currentTime = 0;
        menuMusic.volume = masterVolume;
        safePlay(menuMusic);
        return;
    }

    if (mode === 'race') {
        menuMusic.pause();
        menuMusic.currentTime = 0;
        raceMusic.currentTime = 0;
        raceMusic.volume = masterVolume;
        safePlay(raceMusic);
        return;
    }

    menuMusic.pause();
    menuMusic.currentTime = 0;
    raceMusic.pause();
    raceMusic.currentTime = 0;
}

window.addEventListener('load', () => {
    setMusicMode('menu');
    const unlockAudio = () => {
        if (document.getElementById('menu') && document.getElementById('menu').style.display !== 'none') {
            setMusicMode('menu');
        }
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
    };
    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });
});

window.switchToRaceMusic = function() {
    setMusicMode('race');
};

window.stopAllMusic = function() {
    setMusicMode('stop');
};

window.stopRaceMusic = function() {
    raceMusic.pause();
    raceMusic.currentTime = 0;
    if (currentMusicMode === 'race') {
        currentMusicMode = 'stop';
        window.currentMusicMode = 'stop';
    }
};

window.restartRaceMusic = function() {
    setMusicMode('race');
};

window.playMenuMusic = function() {
    setMusicMode('menu');
};

window.playWinnerMusic = function() {
    setMusicMode('menu');
};

window.pauseRaceMusic = function() {
    if (!raceMusic.paused) {
        raceMusic.pause();
    }
};

window.resumeRaceMusic = function() {
    if (raceMusic.paused && currentMusicMode === 'race') {
        const menuEl = document.getElementById('menu');
        if (!menuEl || menuEl.style.display === 'none') {
            safePlay(raceMusic);
        }
    }
};

window.setGameVolume = function(val) {
    masterVolume = Math.max(0, Math.min(1, val));
    menuMusic.volume = masterVolume;
    raceMusic.volume = masterVolume;
};

// Automatically pause music when switching tabs and resume when returning
let isPausedByTabSwitch = false;

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Tab is hidden / switched away
        if (currentMusicMode === 'menu' && !menuMusic.paused) {
            menuMusic.pause();
            isPausedByTabSwitch = true;
        } else if (currentMusicMode === 'race' && !raceMusic.paused) {
            raceMusic.pause();
            isPausedByTabSwitch = true;
        }
    } else {
        // Tab is active again / user switched back
        if (isPausedByTabSwitch) {
            isPausedByTabSwitch = false;
            
            if (currentMusicMode === 'menu') {
                safePlay(menuMusic);
            } else if (currentMusicMode === 'race') {
                safePlay(raceMusic);
            }
        }
    }
});