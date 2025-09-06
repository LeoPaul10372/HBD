(function () {
  const loadingScreen = document.getElementById('loading-screen');
  const menuScreen = document.getElementById('menu-screen');
  const messageScreen = document.getElementById('message-screen');
  const cakeScreen = document.getElementById('cake-screen');

  const progressText = document.getElementById('progress-text');
  const progressFill = document.getElementById('progress-fill');

  const btnExitMain = document.getElementById('btn-exit-main');
  const btnOpen = document.getElementById('btn-open');
  const btnOpenCake = document.getElementById('btn-open-cake');
  const btnExitMessage = document.getElementById('btn-exit-message');
  const btnBackToMessage = document.getElementById('btn-back-to-message');
  const btnExitCake = document.getElementById('btn-exit-cake');
  const balloonsLayer = document.querySelector('#message-screen .balloons-layer');
  const paperText = document.getElementById('paper-text');
  const interactiveCake = document.getElementById('interactive-cake');
  const candleCountDisplay = document.getElementById('candleCount');

  const EXIT_URL = 'https://websitecursor.com/downloads';

  function showScreen(screenEl) {
    for (const el of [loadingScreen, menuScreen, messageScreen, cakeScreen]) {
      if (!el) continue;
      el.classList.remove('active');
    }
    if (screenEl) screenEl.classList.add('active');
  }

  function startLoading() {
    let progress = 0;

    function nextDelay() {
      // 400–650ms to avoid looking too uniform
      return 400 + Math.floor(Math.random() * 250);
    }

    function nextIncrement(current) {
      // Base around ~3%, slight variance 2–4%
      let inc = 2 + Math.random() * 2;
      // Ease near the end (90%+): smaller bumps
      if (current > 90) inc = 1 + Math.random();
      // Tiny chance of a micro step to break pattern
      if (Math.random() < 0.08) inc = 1;
      return inc;
    }

    function tick() {
      progress = Math.min(100, progress + nextIncrement(progress));
      const shown = Math.min(100, Math.round(progress));
      progressText.textContent = `${shown}%`;
      progressFill.style.width = `${shown}%`;

      if (shown >= 100) {
        setTimeout(() => showScreen(menuScreen), 450);
        return;
      }

      setTimeout(tick, nextDelay());
    }

    setTimeout(tick, nextDelay());
  }

  function exitToUrl() {
    // Attempt to close tab if opened by script, otherwise redirect
    window.open('', '_self');
    window.close();
    setTimeout(() => {
      window.location.href = EXIT_URL;
    }, 200);
  }

  // Wire up buttons
  btnExitMain.addEventListener('click', exitToUrl);
  btnOpen.addEventListener('click', () => {
    showScreen(messageScreen);
    try { spawnBalloons(30); } catch (_) { /* ignore */ }
  });
  btnOpenCake.addEventListener('click', () => {
    showScreen(cakeScreen);
    initializeInteractiveCake();
  });
  btnBackToMessage.addEventListener('click', () => {
    cleanupCakeScreen();
    showScreen(messageScreen);
  });
  btnExitCake.addEventListener('click', () => {
    cleanupCakeScreen();
    exitToUrl();
  });
  btnExitMessage.addEventListener('click', exitToUrl);

  // Interactive Cake functionality
  let candles = [];
  let audioContext;
  let analyser;
  let microphone;
  let audio = new Audio('hbd.mp3');
  let blowOutInterval;
  let confettiInterval;

  function initializeInteractiveCake() {
    if (!interactiveCake) return;
    
    // Clear existing candles
    candles = [];
    const existingCandles = interactiveCake.querySelectorAll('.candle');
    existingCandles.forEach(candle => candle.remove());

    // Add initial candles
    addCandle(125, 50); // Center candle
    addCandle(100, 40); // Left candle
    addCandle(150, 40); // Right candle

    // Add microphone status indicator
    addMicrophoneIndicator();

    // Setup microphone
    setupMicrophone();
  }

  function addMicrophoneIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'mic-indicator';
    indicator.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0,0,0,0.7);
      color: white;
      padding: 10px;
      border-radius: 5px;
      font-size: 14px;
      z-index: 1000;
    `;
    indicator.textContent = '🎤 Microphone: Checking...';
    document.body.appendChild(indicator);
  }

  function updateMicrophoneStatus(status) {
    const indicator = document.getElementById('mic-indicator');
    if (indicator) {
      indicator.textContent = `🎤 Microphone: ${status}`;
    }
  }

  function updateCandleCount() {
    const activeCandles = candles.filter(
      (candle) => !candle.classList.contains("out")
    ).length;
    if (candleCountDisplay) {
      candleCountDisplay.textContent = activeCandles;
    }
  }

  function addCandle(left, top) {
    const candle = document.createElement("div");
    candle.className = "candle";
    candle.style.left = left + "px";
    candle.style.top = top + "px";

    const flame = document.createElement("div");
    flame.className = "flame";
    candle.appendChild(flame);

    interactiveCake.appendChild(candle);
    candles.push(candle);
    updateCandleCount();
  }

  interactiveCake.addEventListener("click", function (event) {
    const rect = interactiveCake.getBoundingClientRect();
    const left = event.clientX - rect.left;
    const top = event.clientY - rect.top;
    addCandle(left, top);
  });

  function isBlowing() {
    if (!analyser) return false;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    let average = sum / bufferLength;

    // Lower threshold and add debug logging
    console.log('Audio level:', average);
    return average > 15; // Much lower threshold
  }

  function blowOutCandles() {
    if (candles.length === 0) return;
    
    let blownOut = 0;
    const hasUnlitCandles = candles.some((candle) => !candle.classList.contains("out"));
    
    if (hasUnlitCandles && isBlowing()) {
      console.log("Blowing detected! Attempting to blow out candles...");
      updateMicrophoneStatus("Blowing detected! 💨");
      
      candles.forEach((candle) => {
        if (!candle.classList.contains("out") && Math.random() > 0.3) { // Higher chance
          candle.classList.add("out");
          blownOut++;
          console.log("Candle blown out!");
        }
      });

      if (blownOut > 0) {
        updateCandleCount();
        console.log(`${blownOut} candles blown out!`);
      }

      // Check if all candles are out
      if (candles.every((candle) => candle.classList.contains("out"))) {
        console.log("All candles blown out! Triggering celebration...");
        updateMicrophoneStatus("All candles out! 🎉");
        setTimeout(function() {
          triggerConfetti();
          endlessConfetti();
        }, 200);
        
        // Play audio
        audio.play().catch(err => {
          console.log("Audio play failed:", err);
        });
      }
    } else if (hasUnlitCandles) {
      // Reset status if not blowing
      updateMicrophoneStatus("Ready - Blow to extinguish candles!");
    }
  }

  function setupMicrophone() {
    updateMicrophoneStatus("Requesting access...");
    
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ 
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false
          }
        })
        .then(function (stream) {
          console.log("Microphone access granted");
          updateMicrophoneStatus("Ready - Blow to extinguish candles!");
          
          audioContext = new (window.AudioContext || window.webkitAudioContext)();
          analyser = audioContext.createAnalyser();
          analyser.fftSize = 512; // Increased for better sensitivity
          analyser.smoothingTimeConstant = 0.3;
          microphone = audioContext.createMediaStreamSource(stream);
          microphone.connect(analyser);
          
          // Start checking for blowing
          blowOutInterval = setInterval(blowOutCandles, 100); // More frequent checking
          console.log("Microphone setup complete");
        })
        .catch(function (err) {
          console.log("Unable to access microphone: " + err);
          updateMicrophoneStatus("Failed - Click candles to blow them out");
          // Fallback: allow manual candle blowing by clicking
          setupManualBlowing();
        });
    } else {
      console.log("getUserMedia not supported on your browser!");
      updateMicrophoneStatus("Not supported - Click candles to blow them out");
      setupManualBlowing();
    }
  }

  function setupManualBlowing() {
    // Fallback: allow users to click on candles to blow them out
    console.log("Setting up manual candle blowing as fallback");
    interactiveCake.addEventListener('click', function(event) {
      const candle = event.target.closest('.candle');
      if (candle && !candle.classList.contains('out')) {
        candle.classList.add('out');
        updateCandleCount();
        
        // Check if all candles are out
        if (candles.every((c) => c.classList.contains("out"))) {
          setTimeout(function() {
            triggerConfetti();
            endlessConfetti();
          }, 200);
          audio.play();
        }
      }
    });
  }

  function triggerConfetti() {
    if (typeof confetti !== 'undefined') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }

  function endlessConfetti() {
    if (typeof confetti !== 'undefined') {
      confettiInterval = setInterval(function() {
        confetti({
          particleCount: 200,
          spread: 90,
          origin: { y: 0 }
        });
      }, 1000);
    }
  }

  // Kick off loading once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { startLoading(); setupAutoResize(); });
  } else {
    startLoading();
    setupAutoResize();
  }

  // Balloons
  function spawnBalloons(count) {
    if (!balloonsLayer) return;
    balloonsLayer.innerHTML = '';

    const colors = [
      '#ff6b6b', '#ff9f1c', '#ffd166', '#06d6a0', '#2ec4b6',
      '#4cc9f0', '#4361ee', '#b5179e', '#f94144', '#90be6d'
    ];

    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.className = 'balloon';

      // Random size category
      const sizeRoll = Math.random();
      let width = 22, height = 30; // base medium
      if (sizeRoll < 0.4) { width = 16; height = 22; }       // small
      else if (sizeRoll < 0.8) { width = 22; height = 30; }  // medium
      else { width = 30; height = 40; }                      // large

      // Random horizontal start (leave margins)
      const left = 5 + Math.random() * 90;
      // Random color
      const color = colors[Math.floor(Math.random() * colors.length)];
      const darker = darken(color, 0.28);
      const shadow = colorShadow(color, 0.25);

      // Random float duration and delay
      const floatDuration = 7 + Math.random() * 4;    // 7s–11s
      const delay = Math.random() * 1.2;              // 0–1.2s

      el.style.left = left + '%';
      el.style.setProperty('--balloon-color', color);
      el.style.setProperty('--balloon-color-dark', darker);
      el.style.setProperty('--balloon-shadow', shadow);
      el.style.color = color;
      el.style.animationDuration = `${floatDuration}s`;
      el.style.animationDelay = `${delay}s`;
      el.style.width = `${width}px`;
      el.style.height = `${height}px`;

      // slight vertical offset to avoid same start line
      el.style.bottom = `${-120 - Math.floor(Math.random() * 80)}px`;

      // Cleanup after animation
      const ttl = (delay + floatDuration + 0.5) * 1000;
      setTimeout(() => { el.remove(); }, ttl);

      // Add glossy shine element
      const shine = document.createElement('div');
      shine.className = 'shine';
      el.appendChild(shine);

      // Add curly string as SVG path
      const stringWrap = document.createElement('div');
      stringWrap.className = 'balloon-string';

      // Randomize string width/height for variation
      const stringWidth = 18 + Math.random() * 20;   // 18–38px
      const stringHeight = 70 + Math.random() * 50;  // 70–120px
      stringWrap.style.width = `${stringWidth}px`;
      stringWrap.style.height = `${stringHeight}px`;

      const curl = createCurlyPath(stringWidth, stringHeight);
      stringWrap.appendChild(curl);

      el.appendChild(stringWrap);

      balloonsLayer.appendChild(el);
    }
  }

  // Color helpers
  function darken(hex, amt) {
    const { r, g, b } = hexToRgb(hex);
    const dr = Math.max(0, Math.round(r * (1 - amt)));
    const dg = Math.max(0, Math.round(g * (1 - amt)));
    const db = Math.max(0, Math.round(b * (1 - amt)));
    return rgbToHex(dr, dg, db);
  }

  // Auto-resize the message box for long text
  function setupAutoResize() {
    if (!paperText) return;
    const adjust = () => {
      paperText.style.height = 'auto';
      paperText.style.height = Math.max(320, paperText.scrollHeight) + 'px';
    };
    // Run once initially and whenever content changes programmatically
    adjust();
    // If you decide to make it editable later, this will keep resizing
    paperText.addEventListener('input', adjust);
  }

  function colorShadow(hex, alpha) {
    const { r, g, b } = hexToRgb(hex);
    // darker mixed shadow
    const rr = Math.round(r * 0.25);
    const gg = Math.round(g * 0.25);
    const bb = Math.round(b * 0.25);
    return `rgba(${rr}, ${gg}, ${bb}, ${alpha})`;
  }

  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    const bigint = parseInt(h.length === 3 ? h.split('').map(x => x + x).join('') : h, 16);
    return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
  }

  function rgbToHex(r, g, b) {
    const toHex = (n) => n.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  function createCurlyPath(w, h) {
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

    const path = document.createElementNS(svgNS, 'path');
    // Build a sine-like path with cubic Beziers
    const waves = 4 + Math.floor(Math.random() * 3); // 4–6 waves
    const amplitude = Math.max(6, Math.min(12, w * 0.28));
    let d = `M ${w/2} 0`;
    const segment = h / waves;
    for (let i = 0; i < waves; i++) {
      const y1 = segment * i + segment * 0.33;
      const y2 = segment * i + segment * 0.66;
      const y3 = segment * (i + 1);
      const dir = i % 2 === 0 ? 1 : -1;
      const x1 = w/2 + dir * amplitude;
      const x2 = w/2 - dir * amplitude;
      d += ` C ${x1} ${y1}, ${x2} ${y2}, ${w/2} ${y3}`;
    }

    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'rgba(0,0,0,0.45)');
    path.setAttribute('stroke-width', '1.6');
    path.setAttribute('stroke-linecap', 'round');

    svg.appendChild(path);
    return svg;
  }


  // Cleanup function for cake screen
  function cleanupCakeScreen() {
    // Stop audio
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    // Stop intervals
    if (blowOutInterval) {
      clearInterval(blowOutInterval);
      blowOutInterval = null;
    }

    if (confettiInterval) {
      clearInterval(confettiInterval);
      confettiInterval = null;
    }

    // Stop microphone stream
    if (microphone && microphone.mediaStream) {
      microphone.mediaStream.getTracks().forEach(track => track.stop());
    }

    // Close audio context
    if (audioContext && audioContext.state !== 'closed') {
      audioContext.close();
    }

    // Reset variables
    audioContext = null;
    analyser = null;
    microphone = null;

    // Remove microphone indicator
    const micIndicator = document.getElementById('mic-indicator');
    if (micIndicator) {
      micIndicator.remove();
    }

    console.log("Cake screen cleaned up");
  }
})();


