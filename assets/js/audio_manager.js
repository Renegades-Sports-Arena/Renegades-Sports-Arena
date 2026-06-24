/* ==========================================================================
   RENEGADES SPORTS ARENA - BACKGROUND AUDIO MANAGER
   Manages playlist configs, user preferences, and floating toggle controls.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  initBackgroundAudio();
});

function initBackgroundAudio() {
  const audioCfg = window.RENEGADES_CONFIG?.audio;
  if (!audioCfg || !audioCfg.enabled) {
    console.log("Background audio is globally disabled.");
    return;
  }

  const tracks = audioCfg.tracks || [];
  if (tracks.length === 0) return;

  // Identify current page name
  let pageName = window.location.pathname.split("/").pop() || "index.html";
  if (pageName === "") pageName = "index.html";

  // Find active track for this page
  const activeTrack = tracks.find(t => t.enabled && t.pages && t.pages.includes(pageName));
  if (!activeTrack) {
    console.log(`No active background audio track configured for page: ${pageName}`);
    return;
  }

  console.log(`Configuring audio track: "${activeTrack.title}"`);

  // Create audio element
  const audioEl = document.createElement("audio");
  audioEl.id = "rsa-background-audio";
  audioEl.src = activeTrack.url;
  audioEl.loop = true;
  audioEl.volume = (activeTrack.volume || audioCfg.volume || 50) / 100;
  document.body.appendChild(audioEl);

  // Ingest theme from body class
  const isQueens = document.body.classList.contains("queens-theme") || pageName.includes("queens.html");
  const themeColor = isQueens ? "#8B5CF6" : "#FF6B00";
  const hoverColor = isQueens ? "#E9D5FF" : "#FFA366";

  // Inject Floating Control Button
  const btn = document.createElement("button");
  btn.id = "rsa-audio-toggle-btn";
  btn.type = "button";
  btn.ariaLabel = "Toggle Background Audio";
  btn.style.cssText = `
    position: fixed;
    bottom: 25px;
    left: 25px;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: rgba(18, 18, 18, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #fff;
    font-size: 1.1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4), 0 0 10px rgba(255, 255, 255, 0.05);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  `;

  // Wave visual bars
  btn.innerHTML = `
    <div class="audio-waves" style="display: flex; align-items: flex-end; gap: 3px; height: 16px;">
      <span class="wave-bar" style="width: 2px; height: 10px; background: #fff; transition: height 0.2s ease;"></span>
      <span class="wave-bar" style="width: 2px; height: 16px; background: #fff; transition: height 0.2s ease;"></span>
      <span class="wave-bar" style="width: 2px; height: 8px; background: #fff; transition: height 0.2s ease;"></span>
      <span class="wave-bar" style="width: 2px; height: 12px; background: #fff; transition: height 0.2s ease;"></span>
    </div>
  `;

  document.body.appendChild(btn);

  // Inject CSS animations for active wave effects
  const styleEl = document.createElement("style");
  styleEl.textContent = `
    @keyframes rsaWaveAnim {
      0%, 100% { height: 6px; }
      50% { height: 18px; }
    }
    #rsa-audio-toggle-btn.playing .wave-bar:nth-child(1) { animation: rsaWaveAnim 1.2s infinite ease-in-out; }
    #rsa-audio-toggle-btn.playing .wave-bar:nth-child(2) { animation: rsaWaveAnim 0.8s infinite ease-in-out; }
    #rsa-audio-toggle-btn.playing .wave-bar:nth-child(3) { animation: rsaWaveAnim 1.5s infinite ease-in-out; }
    #rsa-audio-toggle-btn.playing .wave-bar:nth-child(4) { animation: rsaWaveAnim 1.0s infinite ease-in-out; }
    
    #rsa-audio-toggle-btn.muted .wave-bar {
      height: 3px !important;
      background: #888 !important;
      animation: none !important;
    }
    #rsa-audio-toggle-btn.muted::after {
      content: "";
      position: absolute;
      width: 24px;
      height: 2px;
      background: ${themeColor};
      transform: rotate(-45deg);
      border-radius: 2px;
      box-shadow: 0 0 4px rgba(0,0,0,0.5);
    }
    #rsa-audio-toggle-btn:hover {
      transform: scale(1.1);
      border-color: ${themeColor};
      box-shadow: 0 0 15px ${themeColor};
    }
  `;
  document.head.appendChild(styleEl);

  // Helper: check saved volume/mute preference
  // "muted" by default for modern browser standards compliance, but if user explicitly unmutes, we save it.
  let isMuted = localStorage.getItem("rsa_audio_muted") !== "false"; // default is TRUE (muted)

  function updateVisualState() {
    if (isMuted) {
      btn.classList.add("muted");
      btn.classList.remove("playing");
      audioEl.muted = true;
    } else {
      btn.classList.remove("muted");
      btn.classList.add("playing");
      audioEl.muted = false;
      
      // Try playing
      audioEl.play().catch(err => {
        console.warn("Autoplay block: Interaction required to play audio.", err);
        // Fall back to muted visually until user interaction
        isMuted = true;
        btn.classList.add("muted");
        btn.classList.remove("playing");
      });
    }
  }

  // Set initial state
  updateVisualState();

  // Try to play if not muted (handles page navigation continuation)
  if (!isMuted) {
    document.addEventListener("click", function startOnFirstClick() {
      if (!isMuted) {
        audioEl.play().catch(() => {});
      }
      document.removeEventListener("click", startOnFirstClick);
    }, { once: true });
  }

  // Toggle play/mute on click
  btn.addEventListener("click", () => {
    isMuted = !isMuted;
    localStorage.setItem("rsa_audio_muted", isMuted ? "true" : "false");
    updateVisualState();
    
    if (!isMuted) {
      audioEl.play().catch(err => {
        console.error("Playback failed:", err);
      });
    } else {
      audioEl.pause();
    }
  });
}
