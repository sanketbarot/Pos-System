// Crust & Chilly POS - Advanced Kitchen Display System (KDS) & Order Flow Module
// High-Visibility Kitchen Kanban, Interactive Item Cook Checklist, Live Dish Aggregator Matrix,
// Multi-Tier Audio Warnings (1m Chime & Overtime Siren), Target Prep Pacing, and KOT Thermal Slips.

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
  playOneMinWarningSound(order = null) {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      const chimes = [
        { time: 0.00, freq: 783.99, gain: 0.65, dur: 0.45 },
        { time: 0.22, freq: 1046.50, gain: 0.70, dur: 0.60 },
        { time: 0.65, freq: 783.99, gain: 0.60, dur: 0.45 },
        { time: 0.87, freq: 1046.50, gain: 0.70, dur: 0.85 }
      ];

      chimes.forEach(chime => {
        const start = now + chime.time;
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

      if (window.showToast) {
        if (order && order.orderNumber) {
          window.showToast(`⏳ 1 MINUTE WARNING: Order #${order.orderNumber} (Tk: ${order.tokenNumber || 1}) - 1 min left!`, "warning");
        } else {
          window.showToast(`⏳ 1 MINUTE WARNING: Order nearing target prep time!`, "warning");
        }
      }
    } catch (e) {
      console.warn("One-min warning audio error:", e);
    }
  },

  // 2. Urgent Overtime Alert ("ઓવરટાઇમ થઈ ગયો" Alarm Siren / Buzzer)
  playOverdueSound(order = null) {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      const pulses = [
        { time: 0.00, freq: 880, dur: 0.12, gain: 0.70 },
        { time: 0.14, freq: 698.46, dur: 0.12, gain: 0.70 },
        { time: 0.28, freq: 880, dur: 0.12, gain: 0.75 },
        { time: 0.42, freq: 698.46, dur: 0.14, gain: 0.75 },
        { time: 0.68, freq: 987.77, dur: 0.12, gain: 0.80 },
        { time: 0.82, freq: 783.99, dur: 0.12, gain: 0.80 },
        { time: 0.96, freq: 987.77, dur: 0.12, gain: 0.85 },
        { time: 1.10, freq: 783.99, dur: 0.24, gain: 0.85 }
      ];

      pulses.forEach(p => {
        const start = now + p.time;
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

  playNewOrderSound() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});

      const now = ctx.currentTime;
      const notes = [
        { time: 0.00, freq: 1046.50, dur: 0.20, gain: 0.4 },
        { time: 0.10, freq: 1567.98, dur: 0.35, gain: 0.45 }
      ];

      notes.forEach(n => {
        const start = now + n.time;
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(n.freq, start);
        gainNode.gain.setValueAtTime(n.gain, start);
        gainNode.gain.exponentialRampToValueAtTime(0.001, start + n.dur);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + n.dur);
      });
    } catch (e) {
      console.warn("New order sound error:", e);
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
    const unlock = () => { this.unlockAudio(); };
    ['click', 'touchstart', 'keydown', 'mousedown'].forEach(evt => {
      document.addEventListener(evt, unlock, { passive: true });
    });
    this.startGlobalMonitor();
    this.updateAllSoundUI();
  },

  startGlobalMonitor() {
    if (this.globalMonitorInterval) return;
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
            this.playOverdueSound(order);
            needsKdsRerender = true;
          }
        } else if (remainingSeconds <= 60) {
          if (!this.notifiedOneMinIds.has(order.id)) {
            this.notifiedOneMinIds.add(order.id);
            this.playOneMinWarningSound(order);
            needsKdsRerender = true;
          }
        } else {
          if (this.notifiedOneMinIds.has(order.id)) this.notifiedOneMinIds.delete(order.id);
          if (this.notifiedOverdueIds.has(order.id)) this.notifiedOverdueIds.delete(order.id);
        }
      }
    });

    for (const id of this.notifiedOneMinIds) {
      if (!activePrepIds.has(id)) this.notifiedOneMinIds.delete(id);
    }
    for (const id of this.notifiedOverdueIds) {
      if (!activePrepIds.has(id)) this.notifiedOverdueIds.delete(id);
    }

    if (anyOverdue && (nowTs - this.lastReminderTimestamp > 30000)) {
      this.lastReminderTimestamp = nowTs;
      this.playOverdueSound();
    }

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
      const progressFill = card ? card.querySelector(".kds-card-progress-fill") : null;

      if (status === "Pending") {
        const elapsedSeconds = Math.floor((now - createdTime) / 1000);
        const remainingSeconds = 15 - elapsedSeconds;
        if (remainingSeconds > 0) {
          el.textContent = `${remainingSeconds}s`;
          if (label) {
            label.innerHTML = `<i class="fa-regular fa-hourglass-half" style="margin-right: 4px; color: #f59e0b;"></i> Auto-Start:`;
          }
          el.className = remainingSeconds <= 5 ? "kds-timer-countdown warning-blink" : "kds-timer-countdown";
          if (progressFill) {
            const pct = Math.min(100, Math.round(((15 - remainingSeconds) / 15) * 100));
            progressFill.style.width = `${pct}%`;
          }
        }
      } else if (status === "Preparing") {
        const autoPrepStartTime = createdTime.getTime() + 15 * 1000;
        const startedTime = order.preparingStartedAt 
          ? new Date(Math.min(new Date(order.preparingStartedAt).getTime(), autoPrepStartTime)) 
          : new Date(autoPrepStartTime);
        const elapsedSeconds = Math.floor((now - startedTime) / 1000);
        const remainingSeconds = targetSeconds - elapsedSeconds;

        if (progressFill) {
          const pct = Math.min(100, Math.round((elapsedSeconds / targetSeconds) * 100));
          progressFill.style.width = `${pct}%`;
          if (remainingSeconds <= 0) {
            progressFill.className = "kds-card-progress-fill overdue";
          } else if (remainingSeconds <= 60) {
            progressFill.className = "kds-card-progress-fill warn";
          } else {
            progressFill.className = "kds-card-progress-fill";
          }
        }

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
            card.style.boxShadow = "0 0 14px rgba(239, 68, 68, 0.28)";
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
            card.style.boxShadow = "0 0 10px rgba(245, 158, 11, 0.22)";
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

    const kdsBtn = document.getElementById("btn-kds-sound-toggle");
    if (kdsBtn) {
      kdsBtn.style.background = isEnabled ? '#eff6ff' : '#f1f5f9';
      kdsBtn.style.borderColor = isEnabled ? '#bfdbfe' : 'var(--border-color)';
      kdsBtn.style.color = isEnabled ? '#2563eb' : 'var(--text-muted)';
      kdsBtn.innerHTML = `<i class="fa-solid ${isEnabled ? 'fa-volume-high' : 'fa-volume-xmark'}"></i> Sound: ${isEnabled ? 'ON' : 'MUTED'}`;
    }

    const headerPill = document.getElementById("header-sound-toggle-pill");
    const headerIcon = document.getElementById("header-sound-icon");
    const headerText = document.getElementById("header-sound-text");
    if (headerPill) {
      headerPill.className = `sound-toggle-pill ${isEnabled ? 'active' : 'muted'}`;
      if (headerIcon) {
        headerIcon.className = `fa-solid ${isEnabled ? 'fa-volume-high' : 'fa-volume-xmark'}`;
        headerIcon.style.color = isEnabled ? '#2563eb' : '#94a3b8';
      }
      if (headerText) headerText.textContent = `Sound: ${isEnabled ? 'ON' : 'MUTED'}`;
    }

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
  activeSubTab: "kds", // 'kds' | 'history'
  searchQuery: "",
  typeFilter: "all", // 'all' | 'dine-in' | 'takeaway'
  checkedItems: {}, // In-memory session checklist: { `${orderId}_${itemIndex}`: true }

  init(container) {
    container.innerHTML = `
      <div class="view-animate" style="display: flex; flex-direction: column; gap: 14px;">
        
        <!-- Top Sub-Header & Controls -->
        <div style="background: var(--bg-darkest); padding: 12px 18px; border-radius: 18px; border: 1.5px solid rgba(255, 255, 255, 0.95); display: flex; justify-content: space-between; align-items: center; box-shadow: var(--neu-shadow-raised); flex-wrap: wrap; gap: 10px;">
          
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <button class="btn ${this.activeSubTab === 'kds' ? 'btn-primary' : 'btn-secondary'}" id="btn-sub-kds" style="border-radius: 12px; padding: 7px 16px; font-weight: 800; font-size: 12.5px;">
              <i class="fa-solid fa-kitchen-set"></i> Kitchen KDS Queue
            </button>
            <button class="btn ${this.activeSubTab === 'history' ? 'btn-primary' : 'btn-secondary'}" id="btn-sub-history" style="border-radius: 12px; padding: 7px 16px; font-weight: 800; font-size: 12.5px;">
              <i class="fa-solid fa-clock-rotate-left"></i> Order Audit & KOT Slips
            </button>
          </div>
          
          <!-- History Search Input -->
          <div id="history-search-container" style="display: ${this.activeSubTab === 'history' ? 'block' : 'none'}; width: 260px;">
            <input type="text" id="order-history-search" class="form-input" style="padding: 6px 12px; font-size: 12px; height: 34px; border-radius: 10px; width: 100%;" placeholder="Search Token / Order / Phone...">
          </div>
        </div>

        <!-- Dynamic Mount view body -->
        <div id="orders-content-mount"></div>
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
    if (searchInput) {
      searchInput.oninput = (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderActiveTab();
      };
    }
  },

  renderActiveTab() {
    const mount = document.getElementById("orders-content-mount");
    if (!mount) return;

    if (this.activeSubTab === "kds") {
      this.renderKds(mount);
    } else {
      this.renderHistory(mount);
    }
  },

  renderKds(mount) {
    const allOrders = window.db.get("orders") || [];

    // Filter by type if active
    let orders = allOrders;
    if (this.typeFilter !== "all") {
      orders = allOrders.filter(o => (o.type || "Dine-in").toLowerCase().includes(this.typeFilter));
    }

    const pendingOrders = orders.filter(o => o.status === "Pending");
    const preparingOrders = orders.filter(o => o.status === "Preparing");
    const readyOrders = orders.filter(o => o.status === "Ready");

    // Metrics & Statistics
    const targetMinutes = Number(window.db.get("settings")?.targetPrepMinutes) || 15;
    const targetSeconds = targetMinutes * 60;
    const now = new Date();

    let overdueOrdersCount = 0;
    let oneMinOrdersCount = 0;

    preparingOrders.forEach(o => {
      const autoPrepStartTime = new Date(o.createdAt).getTime() + 15 * 1000;
      const start = o.preparingStartedAt 
        ? new Date(Math.min(new Date(o.preparingStartedAt).getTime(), autoPrepStartTime)) 
        : new Date(autoPrepStartTime);
      const elapsedSecs = Math.floor((now - start) / 1000);
      const remainingSecs = targetSeconds - elapsedSecs;
      if (remainingSecs <= 0) overdueOrdersCount++;
      else if (remainingSecs <= 60) oneMinOrdersCount++;
    });

    // Average prep time calculation
    const todayStr = new Date().toISOString().substring(0, 10);
    const todayPrepOrders = allOrders.filter(o => {
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

    // On-Time rate
    const onTimeOrders = todayPrepOrders.filter(o => {
      const dur = o.prepDurationSeconds || Math.round((new Date(o.readyAt || o.completedAt) - new Date(o.preparingStartedAt || o.createdAt)) / 1000);
      return dur <= targetSeconds;
    }).length;
    const onTimeRate = todayPrepOrders.length > 0 ? Math.round((onTimeOrders / todayPrepOrders.length) * 100) : 100;

    // Kitchen Items Aggregator (Dish matrix across all active cooking tickets)
    const activeCookingOrders = [...pendingOrders, ...preparingOrders];
    const dishCountMap = {};
    activeCookingOrders.forEach(o => {
      if (Array.isArray(o.items)) {
        o.items.forEach(it => {
          dishCountMap[it.name] = (dishCountMap[it.name] || 0) + (Number(it.quantity) || 1);
        });
      }
    });
    const dishAggregatorList = Object.entries(dishCountMap).sort((a, b) => b[1] - a[1]);

    mount.innerHTML = `
      <!-- Audio activation notification banner if suspended -->
      <div id="kds-audio-unlock-banner" style="display: ${window.soundAlerts && window.soundAlerts.audioCtx && window.soundAlerts.audioCtx.state === 'suspended' ? 'flex' : 'none'}; background: #eff6ff; border: 1.5px solid #93c5fd; padding: 10px 16px; border-radius: 12px; align-items: center; justify-content: space-between; gap: 12px;">
        <span style="font-size: 12.5px; font-weight: 700; color: #1e40af; display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-volume-high" style="color: #2563eb; font-size: 14px;"></i>
          <span><strong>Kitchen Audio Alert:</strong> Tap "Activate Audio" so the kitchen 1-minute warning chime & overtime siren ring clearly.</span>
        </span>
        <button id="btn-enable-kds-audio" class="btn btn-primary" style="padding: 5px 14px; font-size: 11.5px; font-weight: 800; border-radius: 8px; cursor: pointer;">
          <i class="fa-solid fa-bell"></i> Activate Audio
        </button>
      </div>

      <!-- Live Kitchen Command & Performance Header -->
      <div class="glass-card" style="padding: 12px 18px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        
        <!-- Performance Indicators -->
        <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
          
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Active Cooking:</span>
            <span style="font-size: 13px; font-weight: 900; color: #2563eb; background: #eff6ff; border: 1px solid #bfdbfe; padding: 2px 9px; border-radius: 8px;">
              ${pendingOrders.length + preparingOrders.length} Tickets
            </span>
          </div>

          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Avg Prep Speed:</span>
            <span style="font-size: 13px; font-weight: 900; color: #059669; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 2px 9px; border-radius: 8px;">
              ${avgPrepSpeedText}
            </span>
          </div>

          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">On-Time Rate:</span>
            <span style="font-size: 13px; font-weight: 900; color: #0891b2; background: #ecfeff; border: 1px solid #a5f3fc; padding: 2px 9px; border-radius: 8px;">
              ${onTimeRate}%
            </span>
          </div>

          <!-- Alert Status Badge -->
          ${overdueOrdersCount > 0 ? `
            <span style="font-size: 12px; font-weight: 900; color: #dc2626; background: #fef2f2; border: 1.5px solid #fecaca; padding: 3px 9px; border-radius: 8px;">
              <i class="fa-solid fa-triangle-exclamation"></i> ${overdueOrdersCount} Overtime Tickets
            </span>
          ` : oneMinOrdersCount > 0 ? `
            <span style="font-size: 12px; font-weight: 900; color: #d97706; background: #fffbeb; border: 1.5px solid #fde68a; padding: 3px 9px; border-radius: 8px;">
              <i class="fa-solid fa-hourglass-end"></i> ${oneMinOrdersCount} Tickets (1m Left)
            </span>
          ` : `
            <span style="font-size: 12px; font-weight: 800; color: #059669; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 3px 9px; border-radius: 8px;">
              <i class="fa-solid fa-circle-check"></i> Kitchen On-Time
            </span>
          `}
        </div>

        <!-- Controls: Filters, Target, Sound, Fullscreen -->
        <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
          
          <!-- Fulfillment Type Filter Pills -->
          <div class="counter-time-pills" id="kds-type-filter-pills">
            <button type="button" class="counter-time-pill ${this.typeFilter === 'all' ? 'active' : ''}" data-type="all">All</button>
            <button type="button" class="counter-time-pill ${this.typeFilter === 'dine-in' ? 'active' : ''}" data-type="dine-in">Dine-in</button>
            <button type="button" class="counter-time-pill ${this.typeFilter === 'takeaway' ? 'active' : ''}" data-type="takeaway">Parcel</button>
          </div>

          <!-- Target Prep Time Selector -->
          <div style="display: flex; align-items: center; gap: 4px;">
            <span style="font-size: 11px; font-weight: 700; color: var(--text-muted);">Target:</span>
            <select id="kds-target-select" class="form-input" style="height: 32px; font-size: 11px; padding: 2px 6px; border-radius: 8px; font-weight: 700; width: 105px;">
              <option value="1" ${targetMinutes === 1 ? 'selected' : ''}>1m (Test)</option>
              <option value="2" ${targetMinutes === 2 ? 'selected' : ''}>2m (Fast)</option>
              <option value="3" ${targetMinutes === 3 ? 'selected' : ''}>3m</option>
              <option value="5" ${targetMinutes === 5 ? 'selected' : ''}>5m</option>
              <option value="10" ${targetMinutes === 10 ? 'selected' : ''}>10m</option>
              <option value="12" ${targetMinutes === 12 ? 'selected' : ''}>12m</option>
              <option value="15" ${targetMinutes === 15 ? 'selected' : ''}>15m (Std)</option>
              <option value="20" ${targetMinutes === 20 ? 'selected' : ''}>20m</option>
            </select>
          </div>

          <!-- Sound Toggle Button -->
          <button type="button" id="btn-kds-sound-toggle" title="Toggle Kitchen Audio Alerts" style="background: ${window.soundAlerts.soundEnabled ? '#eff6ff' : '#f1f5f9'}; border: 1px solid ${window.soundAlerts.soundEnabled ? '#bfdbfe' : 'var(--border-color)'}; color: ${window.soundAlerts.soundEnabled ? '#2563eb' : 'var(--text-muted)'}; padding: 5px 12px; border-radius: 8px; font-size: 11.5px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 5px;">
            <i class="fa-solid ${window.soundAlerts.soundEnabled ? 'fa-volume-high' : 'fa-volume-xmark'}"></i> Sound: ${window.soundAlerts.soundEnabled ? 'ON' : 'MUTED'}
          </button>

          <!-- Fullscreen Button -->
          <button type="button" id="btn-kds-fullscreen" class="kds-btn-fullscreen" title="Toggle Fullscreen Kitchen Monitor">
            <i class="fa-solid fa-expand"></i> Fullscreen
          </button>
        </div>
      </div>

      <!-- Live Kitchen Item Aggregator Strip (Cooking Matrix) -->
      ${dishAggregatorList.length > 0 ? `
        <div class="kds-aggregator-bar">
          <div class="kds-agg-title">
            <i class="fa-solid fa-fire-burner" style="color: #2563eb;"></i> Cook Summary:
          </div>
          <div class="kds-agg-items">
            ${dishAggregatorList.map(([dishName, count]) => `
              <div class="kds-agg-chip">
                <span>${dishName}</span>
                <span class="kds-agg-qty">${count}</span>
              </div>
            `).join("")}
          </div>
        </div>
      ` : ''}

      <!-- Kanban 4-Lane Board -->
      <div class="kds-board view-animate" id="kds-kanban-board">
        
        <!-- LANE 1: PENDING -->
        <div class="kds-column">
          <div class="kds-column-header pending">
            <span><i class="fa-regular fa-clock" style="color: #f59e0b; margin-right: 6px;"></i>Pending Orders</span>
            <span class="kds-order-count">${pendingOrders.length}</span>
          </div>
          <div class="kds-order-list">
            ${this.generateKdsCards(pendingOrders, "Pending", targetSeconds)}
          </div>
        </div>

        <!-- LANE 2: PREPARING -->
        <div class="kds-column">
          <div class="kds-column-header preparing">
            <span><i class="fa-solid fa-fire-burner" style="color: #2563eb; margin-right: 6px;"></i>Cooking (${targetMinutes}m)</span>
            <span class="kds-order-count">${preparingOrders.length}</span>
          </div>
          <div class="kds-order-list">
            ${this.generateKdsCards(preparingOrders, "Preparing", targetSeconds)}
          </div>
        </div>

        <!-- LANE 3: READY -->
        <div class="kds-column">
          <div class="kds-column-header ready">
            <span><i class="fa-solid fa-bell" style="color: #10b981; margin-right: 6px;"></i>Ready for Pickup</span>
            <span class="kds-order-count">${readyOrders.length}</span>
          </div>
          <div class="kds-order-list">
            ${this.generateKdsCards(readyOrders, "Ready", targetSeconds)}
          </div>
        </div>

        <!-- LANE 4: COMPLETED (Recently Closed with Recall) -->
        <div class="kds-column">
          <div class="kds-column-header completed">
            <span><i class="fa-solid fa-circle-check" style="color: #6366f1; margin-right: 6px;"></i>Recently Closed</span>
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
        window.soundAlerts.toggleSound(true);
      };
    }

    // Hook Fullscreen button
    const btnFullscreen = document.getElementById("btn-kds-fullscreen");
    if (btnFullscreen) {
      btnFullscreen.onclick = () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
          btnFullscreen.innerHTML = `<i class="fa-solid fa-compress"></i> Exit`;
        } else {
          document.exitFullscreen().catch(() => {});
          btnFullscreen.innerHTML = `<i class="fa-solid fa-expand"></i> Fullscreen`;
        }
      };
    }

    // Hook Fulfillment Type Filter Pills
    mount.querySelectorAll("#kds-type-filter-pills button").forEach(pill => {
      pill.onclick = () => {
        mount.querySelectorAll("#kds-type-filter-pills button").forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        this.typeFilter = pill.getAttribute("data-type");
        this.renderActiveTab();
      };
    });

    // Hook Activate Audio button
    const enableAudioBtn = document.getElementById("btn-enable-kds-audio");
    if (enableAudioBtn) {
      enableAudioBtn.onclick = () => {
        window.soundAlerts.unlockAudio();
        window.soundAlerts.playOneMinWarningSound();
        window.showToast("🔊 Kitchen Audio Alerts Activated!", "success");
      };
    }

    // Hook Advance buttons
    mount.querySelectorAll(".kds-btn-advance").forEach(btn => {
      btn.onclick = () => {
        const orderId = btn.getAttribute("data-id");
        const nextStatus = btn.getAttribute("data-next");
        window.soundAlerts.notifiedOneMinIds.delete(orderId);
        window.soundAlerts.notifiedOverdueIds.delete(orderId);
        window.db.updateOrderStatus(orderId, nextStatus);
        window.showToast(`Order status updated to ${nextStatus}`, "success");
        this.renderActiveTab();
      };
    });

    // Hook Undo / Recall buttons
    mount.querySelectorAll(".kds-btn-recall").forEach(btn => {
      btn.onclick = () => {
        const orderId = btn.getAttribute("data-id");
        const prevStatus = btn.getAttribute("data-prev") || "Preparing";
        window.db.updateOrderStatus(orderId, prevStatus);
        window.showToast(`Order #${orderId} recalled back to ${prevStatus}`, "info");
        this.renderActiveTab();
      };
    });

    // Hook Print KOT buttons
    mount.querySelectorAll(".kds-btn-kot").forEach(btn => {
      btn.onclick = () => {
        const orderId = btn.getAttribute("data-id");
        this.printKotSlip(orderId);
      };
    });

    // Hook Cancel / Void buttons
    mount.querySelectorAll(".kds-btn-cancel").forEach(btn => {
      btn.onclick = () => {
        const orderId = btn.getAttribute("data-id");
        if (confirm(`Cancel and void Order #${orderId}? Stock will be refunded.`)) {
          window.soundAlerts.notifiedOneMinIds.delete(orderId);
          window.soundAlerts.notifiedOverdueIds.delete(orderId);
          window.db.updateOrderStatus(orderId, "Cancelled");
          window.showToast("Order cancelled & ingredients refunded.", "info");
          this.renderActiveTab();
        }
      };
    });

    // Hook Interactive Item Checkoff Checklist
    mount.querySelectorAll(".kds-order-item-check").forEach(itemEl => {
      itemEl.onclick = () => {
        const key = itemEl.getAttribute("data-check-key");
        this.checkedItems[key] = !this.checkedItems[key];
        itemEl.classList.toggle("item-done", this.checkedItems[key]);

        // Check if all items in card are checked
        const card = itemEl.closest(".kds-order-card");
        if (card) {
          const totalChecks = card.querySelectorAll(".kds-order-item-check").length;
          const doneChecks = card.querySelectorAll(".kds-order-item-check.item-done").length;
          const advanceBtn = card.querySelector(".kds-btn-advance");
          if (advanceBtn && totalChecks > 0 && totalChecks === doneChecks) {
            advanceBtn.style.boxShadow = "0 0 14px rgba(16, 185, 129, 0.7)";
          } else if (advanceBtn) {
            advanceBtn.style.boxShadow = "";
          }
        }
      };
    });

    this.startKdsTimerLoop(targetSeconds);
  },

  generateKdsCards(ordersList, lane, targetSeconds = 900) {
    if (ordersList.length === 0) {
      return `
        <div style="text-align: center; color: var(--text-muted); padding: 40px 10px; font-size: 13px; font-weight: 600;">
          <i class="fa-regular fa-folder-open" style="font-size: 24px; opacity: 0.35; display: block; margin-bottom: 8px; color: #2563eb;"></i>
          No tickets in this lane.
        </div>
      `;
    }

    const now = new Date();

    return ordersList.map(order => {
      const formattedTime = new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      // Interactive items checklist
      const itemsHtml = (order.items || []).map((item, idx) => {
        const checkKey = `${order.id}_${idx}`;
        const isDone = this.checkedItems[checkKey] === true;

        return `
          <li class="kds-order-item-check ${isDone ? 'item-done' : ''}" data-check-key="${checkKey}">
            <div style="display: flex; align-items: center; gap: 6px;">
              <i class="fa-regular ${isDone ? 'fa-square-check' : 'fa-square'}" style="font-size: 12px; color: ${isDone ? '#059669' : '#94a3b8'};"></i>
              <span style="font-weight: 700; color: var(--text-dark);">${item.name}</span>
            </div>
            <span class="kds-item-qty">x${item.quantity}</span>
          </li>
        `;
      }).join("");

      let actionBtnText = "Start Cooking";
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

      // Check timer states
      let isOverdue = false;
      let isOneMinLeft = false;
      let delayText = "";
      let cardStyle = "";
      let timerLabelHtml = `<i class="fa-regular fa-clock" style="margin-right: 4px;"></i> Time Left:`;
      let timerText = "--:--";
      let timerClass = "kds-timer-countdown";
      let containerClass = "kds-timer-container";
      let progressPct = 0;

      if (lane === "Pending") {
        const created = new Date(order.createdAt);
        const elapsedSecs = Math.floor((now - created) / 1000);
        const remainingSecs = Math.max(0, 15 - elapsedSecs);
        progressPct = Math.min(100, Math.round((elapsedSecs / 15) * 100));
        timerLabelHtml = `<i class="fa-regular fa-hourglass-half" style="margin-right: 4px; color: #f59e0b;"></i> Auto-Start:`;
        timerText = `${remainingSecs}s`;
        if (remainingSecs <= 5) timerClass = "kds-timer-countdown warning-blink";
      } else if (lane === "Preparing") {
        const autoPrepStartTime = new Date(order.createdAt).getTime() + 15 * 1000;
        const start = order.preparingStartedAt 
          ? new Date(Math.min(new Date(order.preparingStartedAt).getTime(), autoPrepStartTime)) 
          : new Date(autoPrepStartTime);
        const elapsedSecs = Math.floor((now - start) / 1000);
        const remainingSecs = targetSeconds - elapsedSecs;
        progressPct = Math.min(100, Math.round((elapsedSecs / targetSeconds) * 100));

        if (remainingSecs <= 0) {
          isOverdue = true;
          const diffSecs = Math.abs(remainingSecs);
          const dm = Math.floor(diffSecs / 60);
          const ds = diffSecs % 60;
          delayText = `+${dm}m ${ds}s Overtime`;
          cardStyle = `border: 2px solid #ef4444 !important; background: #fff5f5; box-shadow: 0 0 14px rgba(239, 68, 68, 0.28);`;
          timerLabelHtml = `<i class="fa-solid fa-triangle-exclamation" style="margin-right: 4px; color: #ef4444;"></i> Overtime:`;
          timerText = `Overdue (-${dm.toString().padStart(2, '0')}:${ds.toString().padStart(2, '0')})`;
          timerClass = "kds-timer-countdown overdue";
          containerClass = "kds-timer-container overdue";
        } else if (remainingSecs <= 60) {
          isOneMinLeft = true;
          cardStyle = `border: 2px solid #f59e0b !important; background: #fffdf5; box-shadow: 0 0 10px rgba(245, 158, 11, 0.22);`;
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

      const isDineIn = (order.type || "Dine-in").toLowerCase().includes("dine");
      const orderTypeBadge = isDineIn
        ? `<span class="kds-order-type dine-in">${order.tableNumber ? `Table ${order.tableNumber}` : 'Dine-in'}</span>`
        : `<span class="kds-order-type takeaway">Parcel 🛍️</span>`;

      return `
        <div class="kds-order-card" style="${cardStyle}">
          
          <!-- Overtime or Warning Bar -->
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

          <!-- Header: Large Token & Order # -->
          <div class="kds-order-top">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 15px; font-weight: 900; color: #2563eb; background: #eff6ff; border: 1.5px solid #bfdbfe; padding: 2px 8px; border-radius: 8px;">
                Tk #${order.tokenNumber || 1}
              </span>
              <span class="kds-order-num">#${order.orderNumber}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span class="kds-order-time">${formattedTime}</span>
              ${orderTypeBadge}
            </div>
          </div>

          <!-- Items Checklist (Tap to strike off) -->
          <ul class="kds-order-items" style="margin: 6px 0;">
            ${itemsHtml}
          </ul>

          <!-- Customer details -->
          <div class="kds-order-cust" style="font-weight: 600; display: flex; justify-content: space-between; align-items: center;">
            <span><i class="fa-regular fa-user" style="color: #2563eb; margin-right: 4px;"></i> ${order.customerName || "Walk-in Guest"}</span>
            <span style="font-size: 11px; color: var(--text-muted);">${order.items ? order.items.length : 0} items</span>
          </div>

          <!-- Timer & Progress Bar (for Pending & Preparing) -->
          ${(lane === "Pending" || lane === "Preparing") ? `
            <div class="${containerClass}">
              <span class="kds-timer-label">${timerLabelHtml}</span>
              <span class="${timerClass}" data-order-id="${order.id}" data-status="${order.status}">${timerText}</span>
            </div>
            <div class="kds-card-progress-bar">
              <div class="kds-card-progress-fill ${isOverdue ? 'overdue' : isOneMinLeft ? 'warn' : ''}" style="width: ${progressPct}%;"></div>
            </div>
          ` : ""}
          
          <!-- Actions Row -->
          <div style="display: flex; gap: 6px; width: 100%; margin-top: 8px; align-items: center;">
            <button class="kds-btn-advance" data-id="${order.id}" data-next="${nextStatus}" style="flex-grow: 1;">
              <i class="fa-solid ${icon}"></i> ${actionBtnText}
            </button>
            
            <!-- Print KOT button -->
            <button class="kds-btn-kot" data-id="${order.id}" title="Print Kitchen KOT Slip">
              <i class="fa-solid fa-print"></i> KOT
            </button>

            ${lane === "Ready" ? `
              <!-- Recall back to preparing -->
              <button class="kds-btn-recall" data-id="${order.id}" data-prev="Preparing" title="Recall back to Cooking lane">
                <i class="fa-solid fa-arrow-rotate-left"></i> Recall
              </button>
            ` : lane !== "Ready" ? `
              <button class="btn btn-danger kds-btn-cancel" data-id="${order.id}" title="Void Order" style="padding: 8px 10px; border-radius: 12px;">
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
      const isCompleted = order.status === "Completed";
      const badgeClass = isCompleted ? "badge-completed" : "badge-cancelled";
      const prepDuration = order.prepDurationSeconds ? `${Math.floor(order.prepDurationSeconds / 60)}m ${order.prepDurationSeconds % 60}s` : "";

      return `
        <div class="kds-order-card" style="opacity: 0.9;">
          <div class="kds-order-top">
            <span class="kds-order-num">Tk #${order.tokenNumber || 1} (#${order.orderNumber})</span>
            <div style="display: flex; gap: 6px; align-items: center;">
              ${prepDuration ? `<span style="font-size: 10.5px; font-weight: 700; color: #059669; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 1px 6px; border-radius: 6px;"><i class="fa-solid fa-stopwatch"></i> ${prepDuration}</span>` : ""}
              <span class="badge ${badgeClass}">${order.status.toUpperCase()}</span>
            </div>
          </div>
          <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 4px; font-weight: 500;">
            ${(order.items || []).map(i => `${i.name} (x${i.quantity})`).join(", ")}
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; font-size: 12px;">
            <span style="font-weight: 600; color: var(--text-dark);">${order.customerName || 'Walk-in'}</span>
            ${isCompleted ? `
              <button class="kds-btn-recall" data-id="${order.id}" data-prev="Preparing" title="Recall order back to kitchen queue">
                <i class="fa-solid fa-arrow-rotate-left"></i> Re-open
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join("");
  },

  printKotSlip(orderId) {
    const orders = window.db.get("orders") || [];
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const settings = window.db.get("settings") || {};
    const restaurantName = settings.restaurantName || "Crust & Chilly";
    const timeStr = new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const itemsHtml = (order.items || []).map(item => `
      <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 800; padding: 4px 0; border-bottom: 1px dashed #000;">
        <span>${item.name}</span>
        <span style="font-size: 16px;">x${item.quantity}</span>
      </div>
    `).join("");

    const kotHtml = `
      <div id="kot-print-area" style="font-family: 'Courier New', monospace; font-size: 13px; color: #000; background: #fff; padding: 16px; line-height: 1.4;">
        <div style="text-align: center; margin-bottom: 8px;">
          <h2 style="font-size: 18px; font-weight: 900; margin: 0;">*** KITCHEN ORDER TICKET (KOT) ***</h2>
          <p style="font-size: 12px; margin: 2px 0; font-weight: 700;">${restaurantName.toUpperCase()}</p>
        </div>

        <div style="border-top: 1.5px dashed #000; border-bottom: 1.5px dashed #000; padding: 6px 0; margin-bottom: 8px; font-size: 13px;">
          <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: 900;">
            <span>TOKEN: #${order.tokenNumber || 1}</span>
            <span>ORDER #${order.orderNumber || order.id}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 3px;">
            <span>Type: <strong>${order.type || "Dine-in"}</strong></span>
            <span>Time: <strong>${timeStr}</strong></span>
          </div>
          ${order.tableNumber ? `
            <div style="margin-top: 2px; font-weight: 800;">Table: ${order.tableNumber}</div>
          ` : ''}
        </div>

        <div style="margin-bottom: 10px;">
          <div style="font-weight: 800; margin-bottom: 4px;">ITEMS TO PREPARE:</div>
          ${itemsHtml}
        </div>

        ${order.notes ? `
          <div style="border: 1px solid #000; padding: 6px; margin-bottom: 8px; font-weight: 700;">
            KITCHEN NOTE: ${order.notes}
          </div>
        ` : ''}

        <div style="text-align: center; margin-top: 14px; font-size: 11px;">
          Chef Stamp / Cook Initials: _______________
        </div>
      </div>
    `;

    window.customModal.show({
      title: `Kitchen Order Ticket (KOT) #${order.orderNumber || order.id}`,
      bodyHtml: kotHtml,
      confirmText: "Print KOT",
      cancelText: "Close",
      onConfirm: () => {
        window.print();
        return true;
      }
    });
  },

  renderHistory(mount) {
    const orders = window.db.get("orders") || [];
    const settings = window.db.get("settings") || {};
    const currency = settings.currencySymbol || "₹";

    let filtered = orders;
    if (this.searchQuery) {
      const q = this.searchQuery;
      filtered = orders.filter(o =>
        String(o.orderNumber || "").toLowerCase().includes(q) ||
        String(o.tokenNumber || "").includes(q) ||
        (o.customerName && o.customerName.toLowerCase().includes(q)) ||
        (o.customerPhone && String(o.customerPhone).includes(q))
      );
    }

    let rowsHtml = "";
    if (filtered.length === 0) {
      rowsHtml = `
        <tr>
          <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 40px; font-weight: 600;">
            No orders found matching search criteria.
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
            <td>
              <div style="font-weight: 800; color: var(--text-dark);">#${o.orderNumber}</div>
              <div style="font-size: 11px; font-weight: 800; color: #2563eb;">Token #${o.tokenNumber || 1}</div>
            </td>
            <td style="color: var(--text-muted); font-size: 12px; font-weight: 600;">${date}</td>
            <td>
              <div style="font-weight: 700; color: var(--text-dark);">${o.customerName || 'Walk-in'}</div>
              <div style="font-size: 11px; color: var(--text-muted);">${o.customerPhone || 'No Phone'}</div>
            </td>
            <td><span style="font-size: 11.5px; font-weight: 700; background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; padding: 2px 8px; border-radius: 8px;">${o.type}</span></td>
            <td style="font-weight: 800; color: #2563eb; font-size: 13.5px;">${currency}${Number(o.total || 0).toFixed(2)}</td>
            <td>
              <div style="display: flex; flex-direction: column; gap: 3px;">
                <span class="badge ${statusBadge}">${o.status}</span>
                ${o.status === "Completed" ? `<span style="font-size: 10px; color: #059669; font-weight: 700;"><i class="fa-solid fa-stopwatch"></i> ${prepTime}</span>` : ""}
              </div>
            </td>
            <td>
              <div style="display: flex; gap: 6px; align-items: center;">
                <button class="btn btn-secondary btn-reprint" data-id="${o.id}" style="padding: 5px 9px; font-size: 11px; border-radius: 8px;" title="Print Customer Bill Receipt">
                  <i class="fa-solid fa-print" style="color: #2563eb;"></i> Bill
                </button>
                <button class="kds-btn-kot" data-id="${o.id}" style="padding: 5px 9px; font-size: 11px; border-radius: 8px;" title="Print Kitchen KOT Slip">
                  <i class="fa-solid fa-receipt"></i> KOT
                </button>
                ${o.status !== "Cancelled" && o.status !== "Completed" ? `
                  <button class="btn btn-danger btn-cancel-history" data-id="${o.id}" style="padding: 5px 8px; font-size: 11px; border-radius: 8px;" title="Cancel Order">
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
      <div class="table-container view-animate" style="max-height: 520px; overflow-y: auto;">
        <table class="premium-table" style="font-size: 12.5px;">
          <thead>
            <tr>
              <th>Order / Token</th>
              <th>Date & Time</th>
              <th>Customer</th>
              <th>Type</th>
              <th>Total Amount</th>
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
        if (window.views.counter && window.views.counter.showReceiptModal) {
          window.views.counter.showReceiptModal(orderId);
        } else {
          const order = orders.find(o => o.id === orderId);
          if (order && window.views.pos && window.views.pos.showReceiptModal) {
            window.views.pos.showReceiptModal(order);
          }
        }
      };
    });

    // Bind KOT slips
    mount.querySelectorAll(".kds-btn-kot").forEach(btn => {
      btn.onclick = () => {
        const orderId = btn.getAttribute("data-id");
        this.printKotSlip(orderId);
      };
    });

    // Bind cancellation buttons
    mount.querySelectorAll(".btn-cancel-history").forEach(btn => {
      btn.onclick = () => {
        const orderId = btn.getAttribute("data-id");
        if (confirm(`Cancel and refund Order #${orderId}?`)) {
          window.db.updateOrderStatus(orderId, "Cancelled");
          window.showToast("Order Cancelled and Stock Restored.", "info");
          this.renderActiveTab();
        }
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
