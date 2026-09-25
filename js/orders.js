// Crust & Chilly POS - KDS (Kitchen Display System) & History Module
// Handles Kanban card progression (Pending -> Preparing -> Ready -> Completed), live prep-time metrics, order delay alerts, and chime audio.

// Global Kitchen Audio & Orders Alert Service
// Runs continuously in background across ALL app pages (Dashboard, POS, Counter, Reports, Menu, KDS)
window.soundAlerts = {
  audioCtx: null,
  globalMonitorInterval: null,
  notifiedOneMinIds: new Set(),
  notifiedOverdueIds: new Set(),
  lastReminderTimestamp: 0,

  // Persistent Sound Setting across reloads & pages
  get soundEnabled() {
    const val = localStorage.getItem("pos_kitchen_sound_enabled");
    return val === null ? true : val === "true";
  },
  set soundEnabled(enabled) {
    localStorage.setItem("pos_kitchen_sound_enabled", enabled ? "true" : "false");
    this.updateAllSoundUI();
  },

  getAudioContext() {
    try {
      if (!this.audioCtx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.audioCtx = new AudioCtx();
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
    } catch (e) {
      console.warn("AudioContext init error:", e);
    }
    return this.audioCtx;
  },

  unlockAudio() {
    try {
      const ctx = this.getAudioContext();
      if (ctx) {
        if (ctx.state === 'suspended') {
          ctx.resume().then(() => this.updateAllSoundUI()).catch(() => {});
        }
        // Play silent 1-sample buffer to permanently unlock hardware audio pipeline
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
      }
      this.updateAllSoundUI();
    } catch (e) {
      console.warn("Audio unlock error:", e);
    }
  },

  // 1. Unmistakable 1-Minute Warning Kitchen Chime ("1 મિનિટ બાકી છે" Timer Bell)
  // Crystal-clear resonant brass kitchen bell chime: "Ding... Dong! ... Ding... Dong!"
  playOneMinWarningSound(order = null) {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;

      // Resonant, crystal-clear brass kitchen bell chime (Double Ding-Dong)
      // Notes: G5 (783.99Hz) -> C6 (1046.5Hz) | repeated for high kitchen audibility
      const chimes = [
        { time: 0.00, freq: 783.99, gain: 0.65, dur: 0.45 },
        { time: 0.22, freq: 1046.50, gain: 0.70, dur: 0.60 },
        { time: 0.65, freq: 783.99, gain: 0.60, dur: 0.45 },
        { time: 0.87, freq: 1046.50, gain: 0.70, dur: 0.85 }
      ];

      chimes.forEach(chime => {
        const start = now + chime.time;
        // Fundamental tone
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(chime.freq, start);
        gainNode.gain.setValueAtTime(chime.gain, start);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, start + chime.dur);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + chime.dur);

        // Overtone harmonic for realistic metallic kitchen timer bell resonance
        const harmonic = ctx.createOscillator();
        const harmGain = ctx.createGain();
        harmonic.type = "triangle";
        harmonic.frequency.setValueAtTime(chime.freq * 2, start);
        harmGain.gain.setValueAtTime(chime.gain * 0.35, start);
        harmGain.gain.exponentialRampToValueAtTime(0.0001, start + chime.dur * 0.75);
        harmonic.connect(harmGain);
        harmGain.connect(ctx.destination);
        harmonic.start(start);
        harmonic.stop(start + chime.dur * 0.75);
      });

      // Cancel any browser speech synthesis to ensure NO spoken words
      if (window.speechSynthesis) {
        try { window.speechSynthesis.cancel(); } catch (e) {}
      }

      // Visual Alert Message (Toast)
      if (window.showToast) {
        if (order && order.orderNumber) {
          window.showToast(`⏳ 1 MINUTE WARNING: Order #${order.orderNumber} (Tk: ${order.tokenNumber || 1}) - 1 minute remaining!`, "warning");
        } else {
          window.showToast(`⏳ 1 MINUTE WARNING: Kitchen Order has only 1 minute remaining!`, "warning");
        }
      }
    } catch (e) {
      console.warn("One-min warning audio error:", e);
    }
  },

  // 2. Urgent Overtime Alert ("ઓવરટાઇમ થઈ ગયો" Alarm Siren / Buzzer)
  // Piercing, rapid dual-burst emergency kitchen buzzer: "BEEP-BEEP! BEEP-BEEP! BEEP-BEEP!"
  playOverdueSound(order = null) {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;

      // Piercing, rapid dual-burst emergency kitchen buzzer
      // Burst 1: A5 (880Hz) / F5 (698Hz) rapid alarm pulses
      // Burst 2: B5 (988Hz) / G5 (784Hz) higher urgency pulses
      const pulses = [
        { time: 0.00, freq: 880, dur: 0.12, gain: 0.70 },
        { time: 0.14, freq: 698.46, dur: 0.12, gain: 0.70 },
        { time: 0.28, freq: 880, dur: 0.12, gain: 0.75 },
        { time: 0.42, freq: 698.46, dur: 0.14, gain: 0.75 },
        // Short pause between bursts
        { time: 0.68, freq: 987.77, dur: 0.12, gain: 0.80 },
        { time: 0.82, freq: 783.99, dur: 0.12, gain: 0.80 },
        { time: 0.96, freq: 987.77, dur: 0.12, gain: 0.85 },
        { time: 1.10, freq: 783.99, dur: 0.24, gain: 0.85 }
      ];

      pulses.forEach(p => {
        const start = now + p.time;
        // Layered sawtooth oscillator with low-pass filtering for maximum punch through kitchen noise
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gainNode = ctx.createGain();

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(p.freq, start);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(2400, start);

        gainNode.gain.setValueAtTime(p.gain, start);
        gainNode.gain.exponentialRampToValueAtTime(0.001, start + p.dur);

        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + p.dur);
      });

      // Cancel any browser speech synthesis to ensure NO spoken words
      if (window.speechSynthesis) {
        try { window.speechSynthesis.cancel(); } catch (e) {}
      }

      // Visual Alert Message (Toast)
      if (window.showToast) {
        if (order && order.orderNumber) {
          window.showToast(`🚨 KITCHEN OVERTIME ALERT: Order #${order.orderNumber} (Tk: ${order.tokenNumber || 1}) is Overtime!`, "danger");
        } else {
          window.showToast(`🚨 KITCHEN OVERTIME ALERT: Order exceeded target prep time!`, "danger");
        }
      }
    } catch (e) {
      console.warn("Overdue alert audio error:", e);
    }
  },

  playKitchenChime() {
    this.playOneMinWarningSound();
  },

  toggleSound(withPreview = true) {
    this.soundEnabled = !this.soundEnabled;
    if (this.soundEnabled) {
      this.unlockAudio();
      if (withPreview) {
        this.playOneMinWarningSound();
        setTimeout(() => this.playOverdueSound(), 1400);
      }
      window.showToast("Kitchen audio alerts enabled 🔔 (1m Chime & Overtime Alarm Active)", "success");
    } else {
      window.showToast("Kitchen audio alerts muted 🔇", "info");
    }
    this.updateAllSoundUI();
  },

  init() {
    // Unlock browser audio policy on first user interaction anywhere
    const unlock = () => {
      this.unlockAudio();
    };
    ['click', 'touchstart', 'keydown', 'mousedown'].forEach(evt => {
      document.addEventListener(evt, unlock, { passive: true });
    });

    this.startGlobalMonitor();
    this.updateAllSoundUI();
  },

  startGlobalMonitor() {
    if (this.globalMonitorInterval) return;

    // Run every 1000ms permanently across all views (Dashboard, POS, Counter, Reports, Menu, KDS)
    this.globalMonitorInterval = setInterval(() => {
      this.checkOrdersAndAlert();
    }, 1000);
  },

  checkOrdersAndAlert() {
    if (!window.db || typeof window.db.get !== "function") return;
    const orders = window.db.get("orders") || [];
    const settings = window.db.get("settings") || {};
    const targetSeconds = (Number(settings.targetPrepMinutes) || 15) * 60;
    const now = new Date();
    const nowTs = now.getTime();

    let needsKdsRerender = false;
    let anyOverdue = false;

    const activePrepIds = new Set();

    orders.forEach(order => {
      if (!order || !order.id) return;

      if (order.status === "Pending") {
        const createdTime = new Date(order.createdAt).getTime();
        const elapsedSeconds = Math.floor((nowTs - createdTime) / 1000);
        // Auto-start after 15 seconds
        if (elapsedSeconds >= 15) {
          const autoStartTime = new Date(createdTime + 15 * 1000).toISOString();
          window.db.updateOrderStatus(order.id, "Preparing", autoStartTime);
          needsKdsRerender = true;
        }
      } else if (order.status === "Preparing") {
        activePrepIds.add(order.id);
        const createdTime = new Date(order.createdAt).getTime();
        const autoPrepStartTime = createdTime + 15 * 1000;
        const startedTime = order.preparingStartedAt
          ? new Date(Math.min(new Date(order.preparingStartedAt).getTime(), autoPrepStartTime)).getTime()
          : autoPrepStartTime;
        const elapsedSeconds = Math.floor((nowTs - startedTime) / 1000);
        const remainingSeconds = targetSeconds - elapsedSeconds;

        if (remainingSeconds <= 0) {
          anyOverdue = true;
          if (!this.notifiedOverdueIds.has(order.id)) {
            this.notifiedOverdueIds.add(order.id);
            this.playOverdueSound(order); // Urgent overtime alert!
            needsKdsRerender = true;
          }
        } else if (remainingSeconds <= 60) {
          if (!this.notifiedOneMinIds.has(order.id)) {
            this.notifiedOneMinIds.add(order.id);
            this.playOneMinWarningSound(order); // 1 minute warning chime!
            needsKdsRerender = true;
          }
        } else {
          // If remainingSeconds > 60 (for example if target time was changed), reset notification so it can alert again
          if (this.notifiedOneMinIds.has(order.id)) {
            this.notifiedOneMinIds.delete(order.id);
          }
          if (this.notifiedOverdueIds.has(order.id)) {
            this.notifiedOverdueIds.delete(order.id);
          }
        }
      }
    });

    // Cleanup finished orders from tracking sets
    for (const id of this.notifiedOneMinIds) {
      if (!activePrepIds.has(id)) this.notifiedOneMinIds.delete(id);
    }
    for (const id of this.notifiedOverdueIds) {
      if (!activePrepIds.has(id)) this.notifiedOverdueIds.delete(id);
    }

    // Overdue repeating buzzer every 30 seconds if any order remains overdue
    if (anyOverdue && (nowTs - this.lastReminderTimestamp > 30000)) {
      this.lastReminderTimestamp = nowTs;
      this.playOverdueSound();
    }

    // Update DOM countdown timers if user is currently on KDS view
    const isKdsActive = window.app && window.app.activeView === "orders" && window.views.orders && window.views.orders.activeSubTab === "kds";
    if (isKdsActive) {
      if (needsKdsRerender) {
        window.views.orders.renderActiveTab();
      } else {
        this.updateKdsDomTimers(orders, targetSeconds, now);
      }
    }
  },

  updateKdsDomTimers(orders, targetSeconds, now) {
    const countdownEls = document.querySelectorAll(".kds-timer-countdown");
    if (!countdownEls || countdownEls.length === 0) return;

    countdownEls.forEach(el => {
      const orderId = el.getAttribute("data-order-id");
      const status = el.getAttribute("data-status");
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      const createdTime = new Date(order.createdAt);
      const container = el.closest(".kds-timer-container");
      const label = container ? container.querySelector(".kds-timer-label") : null;
      const card = el.closest(".kds-order-card");

      if (status === "Pending") {
        const elapsedSeconds = Math.floor((now - createdTime) / 1000);
        const remainingSeconds = 15 - elapsedSeconds;
        if (remainingSeconds > 0) {
          el.textContent = `${remainingSeconds}s`;
          if (label) {
            label.innerHTML = `<i class="fa-regular fa-hourglass-half" style="margin-right: 4px; color: #f59e0b;"></i> Auto-Start:`;
          }
          if (remainingSeconds <= 5) {
            el.className = "kds-timer-countdown warning-blink";
          } else {
            el.className = "kds-timer-countdown";
          }
        }
      } else if (status === "Preparing") {
        const autoPrepStartTime = createdTime.getTime() + 15 * 1000;
        const startedTime = order.preparingStartedAt 
          ? new Date(Math.min(new Date(order.preparingStartedAt).getTime(), autoPrepStartTime)) 
          : new Date(autoPrepStartTime);
        const elapsedSeconds = Math.floor((now - startedTime) / 1000);
        const remainingSeconds = targetSeconds - elapsedSeconds;

        if (remainingSeconds <= 0) {
          const absSeconds = Math.abs(remainingSeconds);
          const mins = Math.floor(absSeconds / 60);
          const secs = absSeconds % 60;
          el.textContent = `Overdue (-${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')})`;
          el.className = "kds-timer-countdown overdue";
          if (container) {
            container.classList.remove("one-min-warn");
            container.classList.add("overdue");
          }
          if (label) {
            label.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="margin-right: 4px; color: #ef4444;"></i> Overtime:`;
          }
          if (card) {
            card.style.border = "2px solid #ef4444";
            card.style.background = "#fff5f5";
            card.style.boxShadow = "0 0 12px rgba(239, 68, 68, 0.25)";
          }
        } else if (remainingSeconds <= 60) {
          const secs = remainingSeconds % 60;
          el.textContent = `00:${secs.toString().padStart(2, '0')}`;
          el.className = "kds-timer-countdown warning-blink";
          if (container) {
            container.classList.remove("overdue");
            container.classList.add("one-min-warn");
          }
          if (label) {
            label.innerHTML = `<i class="fa-solid fa-hourglass-end" style="margin-right: 4px; color: #d97706;"></i> 1 Min Left:`;
          }
          if (card) {
            card.style.border = "2px solid #f59e0b";
            card.style.background = "#fffdf5";
            card.style.boxShadow = "0 0 10px rgba(245, 158, 11, 0.2)";
          }
        } else {
          const mins = Math.floor(remainingSeconds / 60);
          const secs = remainingSeconds % 60;
          el.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
          el.className = "kds-timer-countdown";
          if (container) {
            container.classList.remove("overdue");
            container.classList.remove("one-min-warn");
          }
          if (label) {
            label.innerHTML = `<i class="fa-regular fa-clock" style="margin-right: 4px;"></i> Time Left:`;
          }
          if (card) {
            card.style.border = "";
            card.style.background = "";
            card.style.boxShadow = "";
          }
        }
      }
    });
  },

  updateAllSoundUI() {
    const isEnabled = this.soundEnabled;
    const isSuspended = this.audioCtx && this.audioCtx.state === 'suspended';

    // 1. KDS sound button
    const kdsBtn = document.getElementById("btn-kds-sound-toggle");
    if (kdsBtn) {
      kdsBtn.style.background = isEnabled ? '#eff6ff' : '#f1f5f9';
      kdsBtn.style.borderColor = isEnabled ? '#bfdbfe' : 'var(--border-color)';
      kdsBtn.style.color = isEnabled ? '#2563eb' : 'var(--text-muted)';
      kdsBtn.innerHTML = `<i class="fa-solid ${isEnabled ? 'fa-volume-high' : 'fa-volume-xmark'}"></i> Sound: ${isEnabled ? 'ON (1m Chime + Alarm)' : 'MUTED'}`;
    }
    // 2. Global top header sound toggle
    const headerPill = document.getElementById("header-sound-toggle-pill");
    const headerIcon = document.getElementById("header-sound-icon");
    const headerText = document.getElementById("header-sound-text");
    if (headerPill) {
      headerPill.className = `sound-toggle-pill ${isEnabled ? 'active' : 'muted'}`;
      if (headerIcon) {
        headerIcon.className = `fa-solid ${isEnabled ? 'fa-volume-high' : 'fa-volume-xmark'}`;
        headerIcon.style.color = isEnabled ? '#2563eb' : '#94a3b8';
      }
      if (headerText) {
        headerText.textContent = `Sound: ${isEnabled ? 'ON' : 'MUTED'}`;
      }
    }
    // 3. POS view pill
    const posPill = document.getElementById("pos-sound-toggle-pill");
    const posIcon = document.getElementById("pos-sound-icon");
    const posText = document.getElementById("pos-sound-text");
    if (posPill) {
      posPill.className = `sound-toggle-pill ${isEnabled ? 'active' : 'muted'}`;
      if (posIcon) {
        posIcon.className = `fa-solid ${isEnabled ? 'fa-volume-high' : 'fa-volume-xmark'}`;
        posIcon.style.color = isEnabled ? '#2563eb' : '#94a3b8';
      }
      if (posText) {
        posText.textContent = `Sound: ${isEnabled ? 'ON' : 'MUTED'}`;
      }
    }
    // 4. KDS Audio Unlock Banner
    const unlockBanner = document.getElementById("kds-audio-unlock-banner");
    if (unlockBanner) {
      unlockBanner.style.display = isSuspended ? "flex" : "none";
    }
  }
};

// Auto-initialize sound alerts on load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => window.soundAlerts.init());
} else {
  window.soundAlerts.init();
}

window.views = window.views || {};
window.views.orders = {
  activeSubTab: "kds", // 'kds' or 'history'
  searchQuery: "",

  // Backward-compatible accessors bound to global sound alerts
  get soundAlertEnabled() {
    return window.soundAlerts ? window.soundAlerts.soundEnabled : true;
  },
  set soundAlertEnabled(val) {
    if (window.soundAlerts) window.soundAlerts.soundEnabled = val;
  },
  get notifiedOneMinIds() {
    return window.soundAlerts ? window.soundAlerts.notifiedOneMinIds : new Set();
  },
  get notifiedOverdueIds() {
    return window.soundAlerts ? window.soundAlerts.notifiedOverdueIds : new Set();
  },
  get lastReminderTimestamp() {
    return window.soundAlerts ? window.soundAlerts.lastReminderTimestamp : 0;
  },
  set lastReminderTimestamp(val) {
    if (window.soundAlerts) window.soundAlerts.lastReminderTimestamp = val;
  },

  playOneMinWarningSound(order = null) {
    if (window.soundAlerts) window.soundAlerts.playOneMinWarningSound(order);
  },
  playOverdueSound(order = null) {
    if (window.soundAlerts) window.soundAlerts.playOverdueSound(order);
  },
  playKitchenChime() {
    if (window.soundAlerts) window.soundAlerts.playKitchenChime();
  },

  init(container) {
    container.innerHTML = `
      <div class="view-animate" style="display: flex; flex-direction: column; gap: 16px;">
        <!-- Sub navigation header -->
        <div style="background: var(--bg-darkest); padding: 12px 20px; border-radius: 20px; border: 1.5px solid rgba(255, 255, 255, 0.95); display: flex; justify-content: space-between; align-items: center; box-shadow: 6px 6px 16px #cad5e2, -6px -6px 16px #ffffff; flex-wrap: wrap; gap: 10px;">
          <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
            <button class="btn ${this.activeSubTab === 'kds' ? 'btn-primary' : 'btn-secondary'}" id="btn-sub-kds" style="border-radius: 16px; padding: 9px 18px; font-weight: 800; font-size: 13px;">
              <i class="fa-solid fa-kitchen-set"></i> Kitchen KDS Queue
            </button>
            <button class="btn ${this.activeSubTab === 'history' ? 'btn-primary' : 'btn-secondary'}" id="btn-sub-history" style="border-radius: 16px; padding: 9px 18px; font-weight: 800; font-size: 13px;">
              <i class="fa-solid fa-clock-rotate-left"></i> Order History & Reprint
            </button>
          </div>
          
          <div id="history-search-container" style="display: ${this.activeSubTab === 'history' ? 'block' : 'none'}; width: 280px;">
            <input type="text" id="order-history-search" class="form-input" style="padding: 8px 14px; font-size: 13px; width: 100%; border-radius: 16px;" placeholder="Search Customer, ID or Phone...">
          </div>
        </div>

        <!-- Dynamic Mount view body -->
        <div id="orders-content-mount">
          <!-- KDS Board or History Table injected here -->
        </div>
      </div>
    `;

    this.setupListeners();
    this.renderActiveTab();
  },

  setupListeners() {
    const btnKds = document.getElementById("btn-sub-kds");
    const btnHistory = document.getElementById("btn-sub-history");
    const searchContainer = document.getElementById("history-search-container");

    btnKds.onclick = () => {
      this.activeSubTab = "kds";
      btnKds.className = "btn btn-primary";
      btnHistory.className = "btn btn-secondary";
      searchContainer.style.display = "none";
      this.renderActiveTab();
    };

    btnHistory.onclick = () => {
      this.activeSubTab = "history";
      btnHistory.className = "btn btn-primary";
      btnKds.className = "btn btn-secondary";
      searchContainer.style.display = "block";
      this.renderActiveTab();
    };

    const searchInput = document.getElementById("order-history-search");
    searchInput.oninput = (e) => {
      this.searchQuery = e.target.value;
      this.renderActiveTab();
    };
  },

  renderActiveTab() {
    const mount = document.getElementById("orders-content-mount");
    if (this.activeSubTab === "kds") {
      this.renderKds(mount);
    } else {
      if (this.kdsTimerInterval) {
        clearInterval(this.kdsTimerInterval);
        this.kdsTimerInterval = null;
      }
      this.renderHistory(mount);
    }
  },

  renderKds(mount) {
    const orders = window.db.get("orders") || [];

    // KDS tracks Pending, Preparing, Ready
    const pendingOrders = orders.filter(o => o.status === "Pending");
    const preparingOrders = orders.filter(o => o.status === "Preparing");
    const readyOrders = orders.filter(o => o.status === "Ready");

    // Live Kitchen Speed & Prep-Time Stats
    const targetMinutes = Number(window.db.get("settings")?.targetPrepMinutes) || 15;
    const targetSeconds = targetMinutes * 60;
    const now = new Date();

    // Check currently overdue and 1-minute warning preparing orders
    let overdueOrdersCount = 0;
    let oneMinOrdersCount = 0;
    preparingOrders.forEach(o => {
      const autoPrepStartTime = new Date(o.createdAt).getTime() + 15 * 1000;
      const start = o.preparingStartedAt 
        ? new Date(Math.min(new Date(o.preparingStartedAt).getTime(), autoPrepStartTime)) 
        : new Date(autoPrepStartTime);
      const elapsedSecs = Math.floor((now - start) / 1000);
      const remainingSecs = targetSeconds - elapsedSecs;
      if (remainingSecs <= 0) {
        overdueOrdersCount++;
      } else if (remainingSecs <= 60) {
        oneMinOrdersCount++;
      }
    });

    // Calculate today's average prep duration
    const todayStr = new Date().toISOString().substring(0, 10);
    const todayPrepOrders = orders.filter(o => {
      if (!o.createdAt || o.status === "Cancelled") return false;
      const isToday = o.createdAt.substring(0, 10) === todayStr;
      return isToday && (o.status === "Ready" || o.status === "Completed") && (o.prepDurationSeconds || (o.readyAt && o.createdAt));
    });

    let totalDurationSecs = 0;
    todayPrepOrders.forEach(o => {
      const dur = o.prepDurationSeconds || Math.round((new Date(o.readyAt || o.completedAt) - new Date(o.preparingStartedAt || o.createdAt)) / 1000);
      totalDurationSecs += Math.max(0, dur);
    });

    const avgDurationSecs = todayPrepOrders.length > 0 ? Math.round(totalDurationSecs / todayPrepOrders.length) : 0;
    const avgM = Math.floor(avgDurationSecs / 60);
    const avgS = avgDurationSecs % 60;
    const avgPrepSpeedText = todayPrepOrders.length > 0 ? `${avgM}m ${avgS}s` : "--m --s";

    mount.innerHTML = `
      <!-- Unlocked audio banner if suspended -->
      <div id="kds-audio-unlock-banner" style="display: ${window.soundAlerts && window.soundAlerts.audioCtx && window.soundAlerts.audioCtx.state === 'suspended' ? 'flex' : 'none'}; background: #eff6ff; border: 1.5px solid #93c5fd; padding: 10px 16px; border-radius: 14px; margin-bottom: 14px; align-items: center; justify-content: space-between; gap: 12px; box-shadow: 0 2px 10px rgba(37,99,235,0.08);">
        <span style="font-size: 13px; font-weight: 700; color: #1e40af; display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-volume-high" style="color: #2563eb; font-size: 15px;"></i>
          <span><strong>Kitchen Audio Alert:</strong> Click "Activate Audio" so the browser allows the 1-minute warning chime & overtime alarm to ring continuously.</span>
        </span>
        <button id="btn-enable-kds-audio" class="btn btn-primary" style="padding: 6px 16px; font-size: 12px; font-weight: 800; border-radius: 10px; cursor: pointer; white-space: nowrap;">
          <i class="fa-solid fa-bell"></i> Activate Audio
        </button>
      </div>

      <!-- Live Kitchen Speed & Order Delay Control Bar -->
      <div class="glass-card" style="padding: 12px 18px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 14px;">
        <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Active Cooking:</span>
            <span style="font-size: 13.5px; font-weight: 900; color: #2563eb; background: #eff6ff; border: 1px solid #bfdbfe; padding: 2px 10px; border-radius: 10px;">${pendingOrders.length + preparingOrders.length} Orders</span>
          </div>

          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Avg Prep Speed:</span>
            <span style="font-size: 13.5px; font-weight: 900; color: #059669; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 2px 10px; border-radius: 10px;">${avgPrepSpeedText}</span>
          </div>

          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Kitchen Status:</span>
            ${overdueOrdersCount > 0 ? `
              <span style="font-size: 12.5px; font-weight: 900; color: #dc2626; background: #fef2f2; border: 1.5px solid #fecaca; padding: 2px 10px; border-radius: 10px; animation: warning-pulse 1.2s infinite alternate;">
                <i class="fa-solid fa-triangle-exclamation"></i> ${overdueOrdersCount} Overtime (> ${targetMinutes}m)
              </span>
            ` : oneMinOrdersCount > 0 ? `
              <span style="font-size: 12.5px; font-weight: 900; color: #d97706; background: #fffbeb; border: 1.5px solid #fde68a; padding: 2px 10px; border-radius: 10px; animation: warning-pulse 0.9s infinite alternate;">
                <i class="fa-solid fa-hourglass-end"></i> ${oneMinOrdersCount} Orders (1m Left)
              </span>
            ` : `
              <span style="font-size: 12.5px; font-weight: 800; color: #059669; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 2px 10px; border-radius: 10px;">
                <i class="fa-solid fa-circle-check"></i> All Orders On-Time
              </span>
            `}
          </div>
        </div>

        <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 11.5px; font-weight: 700; color: var(--text-muted);">Target:</span>
            <select id="kds-target-select" class="form-input" style="height: 32px; font-size: 11.5px; padding: 2px 8px; border-radius: 8px; font-weight: 700; width: 115px;">
              <option value="1" ${targetMinutes === 1 ? 'selected' : ''}>1 Min (Test)</option>
              <option value="2" ${targetMinutes === 2 ? 'selected' : ''}>2 Mins (Fast)</option>
              <option value="3" ${targetMinutes === 3 ? 'selected' : ''}>3 Mins</option>
              <option value="5" ${targetMinutes === 5 ? 'selected' : ''}>5 Mins</option>
              <option value="10" ${targetMinutes === 10 ? 'selected' : ''}>10 Mins</option>
              <option value="12" ${targetMinutes === 12 ? 'selected' : ''}>12 Mins</option>
              <option value="15" ${targetMinutes === 15 ? 'selected' : ''}>15 Mins (Std)</option>
              <option value="20" ${targetMinutes === 20 ? 'selected' : ''}>20 Mins</option>
            </select>
          </div>

          <button type="button" id="btn-kds-sound-toggle" title="Click to toggle Kitchen Audio Alert" style="background: ${this.soundAlertEnabled ? '#eff6ff' : '#f1f5f9'}; border: 1px solid ${this.soundAlertEnabled ? '#bfdbfe' : 'var(--border-color)'}; color: ${this.soundAlertEnabled ? '#2563eb' : 'var(--text-muted)'}; padding: 6px 14px; border-radius: 10px; font-size: 11.5px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s;">
            <i class="fa-solid ${this.soundAlertEnabled ? 'fa-volume-high' : 'fa-volume-xmark'}"></i> Sound: ${this.soundAlertEnabled ? 'ON (1m + Overtime)' : 'MUTED'}
          </button>
        </div>
      </div>

      <div class="kds-board view-animate">
        
        <!-- PENDING LANE -->
        <div class="kds-column">
          <div class="kds-column-header pending">
            <span><i class="fa-regular fa-clock" style="color: #f59e0b; margin-right: 7px;"></i>Pending Orders (15s)</span>
            <span class="kds-order-count">${pendingOrders.length}</span>
          </div>
          <div class="kds-order-list">
            ${this.generateKdsCards(pendingOrders, "Pending", targetSeconds)}
          </div>
        </div>

        <!-- PREPARING LANE -->
        <div class="kds-column">
          <div class="kds-column-header preparing">
            <span><i class="fa-solid fa-fire-burner" style="color: #2563eb; margin-right: 7px;"></i>Preparing (${targetMinutes}m)</span>
            <span class="kds-order-count">${preparingOrders.length}</span>
          </div>
          <div class="kds-order-list">
            ${this.generateKdsCards(preparingOrders, "Preparing", targetSeconds)}
          </div>
        </div>

        <!-- READY LANE -->
        <div class="kds-column">
          <div class="kds-column-header ready">
            <span><i class="fa-solid fa-bell" style="color: #10b981; margin-right: 7px;"></i>Ready for Pickup</span>
            <span class="kds-order-count">${readyOrders.length}</span>
          </div>
          <div class="kds-order-list">
            ${this.generateKdsCards(readyOrders, "Ready", targetSeconds)}
          </div>
        </div>

        <!-- COMPLETED HIGHLIGHTS (showing last 5 briefly for reference) -->
        <div class="kds-column">
          <div class="kds-column-header completed">
            <span><i class="fa-solid fa-circle-check" style="color: #6366f1; margin-right: 7px;"></i>Recently Closed</span>
          </div>
          <div class="kds-order-list">
            ${this.generateClosedKdsCards(orders.filter(o => o.status === "Completed" || o.status === "Cancelled").slice(0, 5))}
          </div>
        </div>

      </div>
    `;

    // Hook Target Time selector
    const targetSelect = document.getElementById("kds-target-select");
    if (targetSelect) {
      targetSelect.onchange = (e) => {
        const newTarget = Number(e.target.value) || 15;
        const curSettings = window.db.get("settings") || {};
        curSettings.targetPrepMinutes = newTarget;
        window.db.set("settings", curSettings);
        window.showToast(`Target Kitchen Prep Time set to ${newTarget} Minutes`, "info");
        this.renderActiveTab();
      };
    }

    // Hook Sound Alert toggle
    const soundToggle = document.getElementById("btn-kds-sound-toggle");
    if (soundToggle) {
      soundToggle.onclick = () => {
        if (window.soundAlerts) {
          window.soundAlerts.toggleSound(true);
        }
      };
    }


    // Hook Activate Audio Banner button
    const enableAudioBtn = document.getElementById("btn-enable-kds-audio");
    if (enableAudioBtn) {
      enableAudioBtn.onclick = () => {
        if (window.soundAlerts) {
          window.soundAlerts.unlockAudio();
          window.soundAlerts.playOneMinWarningSound();
          window.showToast("🔊 Kitchen Audio Alerts Activated!", "success");
        }
      };
    }

    // Bind event hooks to advance state
    mount.querySelectorAll(".kds-btn-advance").forEach(btn => {
      btn.onclick = () => {
        const orderId = btn.getAttribute("data-id");
        const nextStatus = btn.getAttribute("data-next");
        this.notifiedOneMinIds.delete(orderId);
        this.notifiedOverdueIds.delete(orderId);
        window.db.updateOrderStatus(orderId, nextStatus);

        window.showToast(`Order status updated to ${nextStatus}`, "success");
        this.renderActiveTab();
      };
    });

    // Bind Cancel buttons
    mount.querySelectorAll(".kds-btn-cancel").forEach(btn => {
      btn.onclick = () => {
        const orderId = btn.getAttribute("data-id");
        this.notifiedOneMinIds.delete(orderId);
        this.notifiedOverdueIds.delete(orderId);
        window.db.updateOrderStatus(orderId, "Cancelled");
        window.showToast("Order cancelled & ingredients refunded back to stock.", "info");
        this.renderActiveTab();
      };
    });

    this.startKdsTimerLoop(targetSeconds);
  },

  generateKdsCards(ordersList, lane, targetSeconds = 900) {
    if (ordersList.length === 0) {
      return `
        <div style="text-align: center; color: var(--text-muted); padding: 40px 10px; font-size: 13px; font-weight: 600;">
          <i class="fa-regular fa-folder-open" style="font-size: 24px; opacity: 0.4; display: block; margin-bottom: 8px; color: #2563eb;"></i>
          No orders in this queue.
        </div>
      `;
    }

    const now = new Date();

    return ordersList.map(order => {
      const formattedTime = new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const itemsHtml = order.items.map(item => `
        <li class="kds-order-item" style="padding: 3px 0;">
          <span style="font-weight: 600; color: var(--text-dark);">${item.name}</span>
          <span class="kds-item-qty">x${item.quantity}</span>
        </li>
      `).join("");

      let actionBtnText = "Start Preparing";
      let nextStatus = "Preparing";
      let icon = "fa-fire-burner";

      if (lane === "Preparing") {
        actionBtnText = "Mark Ready";
        nextStatus = "Ready";
        icon = "fa-bell";
      } else if (lane === "Ready") {
        actionBtnText = "Complete Order";
        nextStatus = "Completed";
        icon = "fa-circle-check";
      }

      // Check timer states for Pending and Preparing
      let isOverdue = false;
      let isOneMinLeft = false;
      let delayText = "";
      let cardStyle = "";
      let timerLabelHtml = `<i class="fa-regular fa-clock" style="margin-right: 4px;"></i> Time Left:`;
      let timerText = "--:--";
      let timerClass = "kds-timer-countdown";
      let containerClass = "kds-timer-container";

      if (lane === "Pending") {
        const created = new Date(order.createdAt);
        const elapsedSecs = Math.floor((now - created) / 1000);
        const remainingSecs = Math.max(0, 15 - elapsedSecs);
        timerLabelHtml = `<i class="fa-regular fa-hourglass-half" style="margin-right: 4px; color: #f59e0b;"></i> Auto-Start:`;
        timerText = `${remainingSecs}s`;
        if (remainingSecs <= 5) {
          timerClass = "kds-timer-countdown warning-blink";
        }
      } else if (lane === "Preparing") {
        const autoPrepStartTime = new Date(order.createdAt).getTime() + 15 * 1000;
        const start = order.preparingStartedAt 
          ? new Date(Math.min(new Date(order.preparingStartedAt).getTime(), autoPrepStartTime)) 
          : new Date(autoPrepStartTime);
        const elapsedSecs = Math.floor((now - start) / 1000);
        const remainingSecs = targetSeconds - elapsedSecs;

        if (remainingSecs <= 0) {
          isOverdue = true;
          const diffSecs = Math.abs(remainingSecs);
          const dm = Math.floor(diffSecs / 60);
          const ds = diffSecs % 60;
          delayText = `+${dm}m ${ds}s Overtime`;
          cardStyle = `border: 2px solid #ef4444 !important; background: #fff5f5; box-shadow: 0 0 12px rgba(239, 68, 68, 0.25);`;
          timerLabelHtml = `<i class="fa-solid fa-triangle-exclamation" style="margin-right: 4px; color: #ef4444;"></i> Overtime:`;
          timerText = `Overdue (-${dm.toString().padStart(2, '0')}:${ds.toString().padStart(2, '0')})`;
          timerClass = "kds-timer-countdown overdue";
          containerClass = "kds-timer-container overdue";
        } else if (remainingSecs <= 60) {
          isOneMinLeft = true;
          cardStyle = `border: 2px solid #f59e0b !important; background: #fffdf5; box-shadow: 0 0 10px rgba(245, 158, 11, 0.2);`;
          timerLabelHtml = `<i class="fa-solid fa-hourglass-end" style="margin-right: 4px; color: #d97706;"></i> 1 Min Left:`;
          timerText = `00:${remainingSecs.toString().padStart(2, '0')}`;
          timerClass = "kds-timer-countdown warning-blink";
          containerClass = "kds-timer-container one-min-warn";
        } else {
          const mins = Math.floor(remainingSecs / 60);
          const secs = remainingSecs % 60;
          timerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
      }

      return `
        <div class="kds-order-card" style="${cardStyle}">
          ${isOverdue ? `
            <div style="background: #dc2626; color: #fff; font-size: 10px; font-weight: 900; text-transform: uppercase; padding: 4px 8px; border-radius: 6px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
              <span style="display: flex; align-items: center; gap: 4px;"><i class="fa-solid fa-triangle-exclamation"></i> KITCHEN OVERTIME</span>
              <span>${delayText}</span>
            </div>
          ` : isOneMinLeft ? `
            <div style="background: #d97706; color: #fff; font-size: 10px; font-weight: 900; text-transform: uppercase; padding: 4px 8px; border-radius: 6px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; animation: warning-pulse 0.9s infinite alternate;">
              <span style="display: flex; align-items: center; gap: 4px;"><i class="fa-solid fa-hourglass-end"></i> 1 MINUTE REMAINING</span>
              <span>HURRY UP</span>
            </div>
          ` : ""}
          <div class="kds-order-top">
            <span class="kds-order-num">#${order.orderNumber} <span style="font-size: 11px; font-weight: 600; color: #2563eb; background: #eff6ff; border: 1px solid #bfdbfe; padding: 1px 6px; border-radius: 8px;">Tk: ${String(order.tokenNumber || 1).padStart(2, '0')}</span></span>
            <span class="kds-order-time">${formattedTime}</span>
            <span class="kds-order-type ${order.type.toLowerCase()}">${order.tableNumber ? `${order.type} (${order.tableNumber})` : order.type}</span>
          </div>
          <ul class="kds-order-items">
            ${itemsHtml}
          </ul>
          <div class="kds-order-cust" style="font-weight: 600;">
            <i class="fa-regular fa-user" style="color: #2563eb; margin-right: 4px;"></i> ${order.customerName}
          </div>
          ${(lane === "Pending" || lane === "Preparing") ? `
            <div class="${containerClass}">
              <span class="kds-timer-label">${timerLabelHtml}</span>
              <span class="${timerClass}" data-order-id="${order.id}" data-status="${order.status}">${timerText}</span>
            </div>
          ` : ""}
          
          <div style="display: flex; gap: 8px; width: 100%; margin-top: 6px;">
            <button class="kds-btn-advance" data-id="${order.id}" data-next="${nextStatus}" style="flex-grow: 1;">
              <i class="fa-solid ${icon}"></i> ${actionBtnText}
            </button>
            ${lane !== "Ready" ? `
              <button class="btn btn-danger kds-btn-cancel" data-id="${order.id}" title="Cancel Order" style="padding: 8px 12px; border-radius: 14px;">
                <i class="fa-solid fa-ban"></i>
              </button>
            ` : ""}
          </div>
        </div>
      `;
    }).join("");
  },

  generateClosedKdsCards(ordersList) {
    if (ordersList.length === 0) {
      return `<div style="text-align: center; color: var(--text-muted); padding: 40px 10px; font-size: 13px; font-weight: 600;">No recently closed orders.</div>`;
    }

    return ordersList.map(order => {
      const badgeClass = order.status === "Completed" ? "badge-completed" : "badge-cancelled";
      const prepDuration = order.prepDurationSeconds ? `${Math.floor(order.prepDurationSeconds / 60)}m ${order.prepDurationSeconds % 60}s` : "";

      return `
        <div class="kds-order-card" style="opacity: 0.85;">
          <div class="kds-order-top">
            <span class="kds-order-num">#${order.orderNumber}</span>
            <div style="display: flex; gap: 6px; align-items: center;">
              ${prepDuration ? `<span style="font-size: 10.5px; font-weight: 700; color: #059669; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 1px 6px; border-radius: 6px;"><i class="fa-solid fa-stopwatch"></i> ${prepDuration}</span>` : ""}
              <span class="badge ${badgeClass}">${order.status.toUpperCase()}</span>
            </div>
          </div>
          <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px; font-weight: 500;">
            ${order.items.map(i => `${i.name} x${i.quantity}`).join(", ")}
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; font-size: 12px;">
            <span style="font-weight: 600; color: var(--text-dark);">${order.customerName}</span>
            <strong style="color: #ebb036; font-size: 13px;">₹${Math.round(order.total)}</strong>
          </div>
        </div>
      `;
    }).join("");
  },

  renderHistory(mount) {
    const orders = window.db.get("orders") || [];
    const settings = window.db.get("settings") || {};
    const currency = settings.currencySymbol || "₹";

    // Filter by search query
    let filtered = orders;
    if (this.searchQuery.trim() !== "") {
      const q = this.searchQuery.toLowerCase().trim();
      filtered = orders.filter(o =>
        (o.orderNumber && String(o.orderNumber).includes(q)) ||
        (o.customerName && o.customerName.toLowerCase().includes(q)) ||
        (o.customerPhone && o.customerPhone.includes(q))
      );
    }

    let rowsHtml = "";
    if (filtered.length === 0) {
      rowsHtml = `
        <tr>
          <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 40px; font-weight: 600;">
            No transaction records matched search query.
          </td>
        </tr>
      `;
    } else {
      rowsHtml = filtered.map(o => {
        const date = new Date(o.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
        const prepTime = o.prepDurationSeconds ? `${Math.floor(o.prepDurationSeconds / 60)}m ${o.prepDurationSeconds % 60}s` : "--";

        let statusBadge = "badge-pending";
        if (o.status === "Preparing") statusBadge = "badge-preparing";
        if (o.status === "Ready") statusBadge = "badge-ready";
        if (o.status === "Completed") statusBadge = "badge-completed";
        if (o.status === "Cancelled") statusBadge = "badge-cancelled";

        return `
          <tr>
            <td style="font-weight: 800; color: var(--text-dark);">#${o.orderNumber}</td>
            <td style="color: var(--text-muted); font-size: 12.5px; font-weight: 600;">${date}</td>
            <td>
              <div style="font-weight: 700; color: var(--text-dark);">${o.customerName}</div>
              <div style="font-size: 11px; color: var(--text-muted);">${o.customerPhone || 'No Phone'}</div>
            </td>
            <td><span style="font-size: 11.5px; font-weight: 700; background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; padding: 2px 8px; border-radius: 10px;">${o.type}</span></td>
            <td style="font-weight: 800; color: #ebb036; font-size: 14px;">${currency}${Number(o.total || 0).toFixed(2)}</td>
            <td>
              <div style="display: flex; flex-direction: column; gap: 3px;">
                <span class="badge ${statusBadge}">${o.status}</span>
                ${o.status === "Completed" ? `<span style="font-size: 10px; color: var(--text-muted);"><i class="fa-solid fa-stopwatch"></i> ${prepTime}</span>` : ""}
              </div>
            </td>
            <td>
              <div style="display: flex; gap: 8px;">
                <button class="btn btn-secondary btn-reprint" data-id="${o.id}" style="padding: 6px 12px; font-size: 12px; border-radius: 12px;">
                  <i class="fa-solid fa-print" style="color: #2563eb;"></i> Receipt
                </button>
                ${o.status !== "Cancelled" && o.status !== "Completed" ? `
                  <button class="btn btn-danger btn-cancel-history" data-id="${o.id}" style="padding: 6px 10px; font-size: 12px; border-radius: 12px;">
                    <i class="fa-solid fa-ban"></i>
                  </button>
                ` : ""}
              </div>
            </td>
          </tr>
        `;
      }).join("");
    }

    mount.innerHTML = `
      <div class="table-container view-animate">
        <table class="premium-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date & Time</th>
              <th>Customer</th>
              <th>Type</th>
              <th>Amount Paid</th>
              <th>Status & Prep</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;

    // Bind reprint receipts
    mount.querySelectorAll(".btn-reprint").forEach(btn => {
      btn.onclick = () => {
        const orderId = btn.getAttribute("data-id");
        const order = orders.find(o => o.id === orderId);
        if (order && window.views.pos && window.views.pos.showReceiptModal) {
          window.views.pos.showReceiptModal(order);
        }
      };
    });

    // Bind cancellation buttons
    mount.querySelectorAll(".btn-cancel-history").forEach(btn => {
      btn.onclick = () => {
        const orderId = btn.getAttribute("data-id");
        window.db.updateOrderStatus(orderId, "Cancelled");
        window.showToast("Order Cancelled and Stock Restored.", "info");
        this.renderActiveTab();
      };
    });
  },

  startKdsTimerLoop(targetSeconds = 900) {
    if (window.soundAlerts) {
      window.soundAlerts.startGlobalMonitor();
      window.soundAlerts.checkOrdersAndAlert();
    }
  }
};

