// Crust & Chilly POS - Root SPA Controller & Router
// Manages authentication flow, routing transitions, role restrictions, and global layout.

// Global toast notifier helper
window.showToast = function (message, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  let icon = "fa-circle-check";
  if (type === "error") icon = "fa-circle-exclamation";
  if (type === "info") icon = "fa-circle-info";

  toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
  container.appendChild(toast);

  // Animate slide-out and remove toast after 3 seconds
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    toast.style.transition = "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)";
    setTimeout(() => {
      toast.remove();
    }, 400);
  }, 3000);
};

// Global Modal utility helper
window.customModal = {
  element: null,
  confirmBtn: null,
  cancelBtn: null,
  closeBtn: null,
  body: null,
  title: null,
  onConfirmCallback: null,
  onCancelCallback: null,

  init() {
    this.element = document.getElementById("modal-container");
    this.confirmBtn = document.getElementById("modal-submit-btn");
    this.cancelBtn = document.getElementById("modal-cancel-btn");
    this.closeBtn = document.getElementById("modal-close-btn");
    this.title = document.getElementById("modal-title");
    this.body = document.getElementById("modal-body");

    // Close listeners
    const closeHandler = () => this.hide();
    this.closeBtn.onclick = closeHandler;
    this.cancelBtn.onclick = () => {
      if (this.onCancelCallback) this.onCancelCallback();
      this.hide();
    };

    // Confirm listener
    this.confirmBtn.onclick = () => {
      if (this.onConfirmCallback) {
        // If confirm returns false, don't close the modal
        const result = this.onConfirmCallback();
        if (result === false) return;
      }
      this.hide();
    };
  },

  show({ title, bodyHtml, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel", hideFooter = false }) {
    if (!this.element) this.init();

    this.title.textContent = title;
    this.body.innerHTML = bodyHtml;

    this.onConfirmCallback = onConfirm;
    this.onCancelCallback = onCancel;

    this.confirmBtn.textContent = confirmText;
    this.cancelBtn.textContent = cancelText;

    const footer = document.getElementById("modal-footer");
    if (hideFooter) {
      footer.style.display = "none";
    } else {
      footer.style.display = "flex";
    }

    this.element.classList.add("active");
  },

  hide() {
    if (this.element) {
      this.element.classList.remove("active");
    }
  }
};

// Initialize views object namespace safely
window.views = window.views || {};

// App Controller Core Namespace
const app = {
  currentUser: null,
  activeView: null,

  init() {
    window.app = this; // Expose on window for db & external callbacks
    window.customModal.init();

    // Bind Session authentication
    const loginForm = document.getElementById("login-form");
    const errorEl = document.getElementById("login-error-msg");
    const userField = document.getElementById("login-username");
    const passField = document.getElementById("login-password");

    const clearError = () => {
      if (errorEl) {
        errorEl.style.display = "none";
        errorEl.textContent = "";
      }
    };
    if (userField) userField.oninput = clearError;
    if (passField) passField.oninput = clearError;

    loginForm.onsubmit = (e) => {
      e.preventDefault();
      clearError();
      const uVal = userField.value;
      const pVal = passField.value;

      const authResult = window.db.login(uVal, pVal);
      if (authResult.success) {
        this.runAppSession();
      } else {
        if (errorEl) {
          errorEl.style.display = "block";
          errorEl.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> Invalid username or password. Please check credentials or use the 1-Click Fill button below.`;
        }
        window.showToast("Invalid username or password.", "error");
      }
    };

    // Quick 1-click Fill Admin Credentials
    const quickAdminBtn = document.getElementById("btn-quick-admin-login");
    if (quickAdminBtn) {
      quickAdminBtn.onclick = () => {
        if (userField) userField.value = "sanketadmin";
        if (passField) passField.value = "Sanket@3901";
        clearError();
        const authResult = window.db.login("sanketadmin", "Sanket@3901");
        if (authResult.success) {
          this.runAppSession();
        }
      };
    }

    // Toggle show/hide password view
    const togglePassBtn = document.getElementById("btn-toggle-password");
    if (togglePassBtn) {
      togglePassBtn.onclick = () => {
        const passInput = document.getElementById("login-password");
        const passIcon = document.getElementById("toggle-password-icon");
        if (passInput.type === "password") {
          passInput.type = "text";
          passIcon.className = "fa-solid fa-eye-slash";
        } else {
          passInput.type = "password";
          passIcon.className = "fa-solid fa-eye";
        }
      };
    }

    // Logout trigger
    document.getElementById("logout-button").onclick = () => {
      window.db.logout();
      window.showToast("Session logged out successfully.", "info");
      this.showLogin();
    };

    // Setup Cloud Sync status listeners
    this.setupCloudSyncUI();

    // Setup global db-update listener
    window.addEventListener("db-update", (e) => {
      const detail = e.detail || {};
      if (detail.source !== "cloud") {
        this.updateSidebarSummary();
      }
    });

    // Check session on startup
    this.runAppSession();

    // Bind route listener
    window.onhashchange = () => this.route();

    // Start header timer
    this.startHeaderTimer();
  },

  setupCloudSyncUI() {
    const handleStatus = (status, message) => {
      const pill = document.getElementById("cloud-sync-pill");
      const icon = document.getElementById("cloud-sync-icon");
      const text = document.getElementById("cloud-sync-text");
      const posPill = document.getElementById("pos-cloud-sync-pill");
      const posIcon = document.getElementById("pos-cloud-sync-icon");
      const posText = document.getElementById("pos-cloud-sync-text");

      const apply = (p, i, t) => {
        if (!p || !i || !t) return;
        p.className = `cloud-sync-pill ${status}`;
        if (status === "connected") {
          i.style.color = "#10b981"; // Emerald green
          i.className = "fa-solid fa-circle";
          t.textContent = "Cloud Synced";
          p.title = "Cloud sync active. All devices (Laptop & PC) are real-time connected.";
        } else if (status === "permission-denied") {
          i.style.color = "#ef4444"; // Red
          i.className = "fa-solid fa-triangle-exclamation";
          t.textContent = "Rules Permission Denied";
          p.title = "Firebase Firestore Rules need to be updated in Firebase Console. Click for help.";
        } else if (status === "connecting") {
          i.style.color = "#f59e0b"; // Amber
          i.className = "fa-solid fa-circle-notch fa-spin";
          t.textContent = "Syncing...";
          p.title = "Connecting to Cloud Firestore...";
        } else {
          i.style.color = "#ef4444";
          i.className = "fa-solid fa-circle-exclamation";
          t.textContent = "Sync Offline";
          p.title = message || "Could not connect to cloud";
        }
      };

      apply(pill, icon, text);
      apply(posPill, posIcon, posText);
    };

    window.addEventListener("cloud-sync-status", (e) => {
      const { status, message } = e.detail || {};
      handleStatus(status, message);
    });

    // Initial status apply
    handleStatus(window.cloudSyncStatus || "connecting", window.cloudSyncMessage || "");

    // Click handler for help modal when status is clicked
    const openHelp = () => {
      const isDenied = window.cloudSyncStatus === "permission-denied";
      window.customModal.show({
        title: isDenied ? "Firebase Firestore Permission Required" : "Cloud Sync Status",
        bodyHtml: `
          <div style="font-size: 13.5px; line-height: 1.6; color: var(--text-dark);">
            <div style="margin-bottom: 12px; padding: 10px 14px; border-radius: 12px; background: ${isDenied ? '#fee2e2' : '#ecfdf5'}; color: ${isDenied ? '#991b1b' : '#065f46'}; font-weight: 700;">
              <i class="fa-solid ${isDenied ? 'fa-triangle-exclamation' : 'fa-circle-check'}"></i>
              ${isDenied ? 'Firestore Rules Denied: Multi-device sync is paused until rules are updated.' : 'Firestore Cloud is connected and synchronizing live!'}
            </div>
            ${isDenied ? `
              <p style="margin-bottom: 8px;"><strong>Laptop and PC વચ્ચે ડેટા સિંક કરવા માટે Firebase Console માં આ 1 મિનિટનું સેટિંગ કરો:</strong></p>
              <ol style="padding-left: 20px; margin-bottom: 14px; color: var(--text-muted);">
                <li><a href="https://console.firebase.google.com/" target="_blank" style="color: #2563eb; font-weight: 700; text-decoration: underline;">Firebase Console</a> ખોલો અને <strong>crust-chilly-pos</strong> પ્રોજેક્ટ પસંદ કરો.</li>
                <li>ડાબી બાજુએ <strong>Firestore Database</strong> પર ક્લિક કરો.</li>
                <li>ઉપર <strong>Rules</strong> ટેબ પર ક્લિક કરો.</li>
                <li>ત્યાં રહેલા રૂલ્સને બદલીને નીચે મુજબ પેસ્ટ કરો:
                  <pre style="background: #1e293b; color: #f8fafc; padding: 10px; border-radius: 8px; font-size: 12px; margin: 8px 0; overflow-x: auto;"><code>rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}</code></pre>
                </li>
                <li>ઉપર <strong>Publish</strong> બટન પર ક્લિક કરો.</li>
              </ol>
              <p style="font-size: 12px; color: var(--text-muted);">Publish કર્યા પછી પેજ રિફ્રેશ કરશો એટલે તરત જ 🟢 <strong>Cloud Synced</strong> થઈ જશે અને લેપટોપ & PC વચ્ચે રિયલ-ટાઇમ સિંક ચાલુ થઈ જશે!</p>
            ` : `
              <p>તમારું POS System Google Firebase Firestore Cloud સાથે લાઈવ જોડાયેલું છે. લેપટોપ અથવા પીસી પરથી જે પણ બિલ બનશે તે તરત જ બંને ડીવાઈસ પર દેખાશે.</p>
            `}
          </div>
        `,
        confirmText: "Close",
        hideFooter: false
      });
    };

    const pill = document.getElementById("cloud-sync-pill");
    if (pill) pill.onclick = openHelp;
  },

  onCloudUpdate(key, val) {
    console.log(`[Cloud Sync] Received cloud update for '${key}'`);

    // 1. Orders updated in Cloud (from another terminal / device)
    if (key === "orders") {
      this.updateSidebarSummary();

      // If on KDS Kitchen view or Order History
      if (this.activeView === "orders" && window.views.orders) {
        if (typeof window.views.orders.renderActiveTab === "function") {
          window.views.orders.renderActiveTab();
        }
      }

      // If on Dashboard, refresh live metrics & charts
      if (this.activeView === "dashboard" && window.views.dashboard) {
        if (typeof window.views.dashboard.calculateAndRenderMetrics === "function") {
          window.views.dashboard.calculateAndRenderMetrics();
        }
      }

      // If on POS view, refresh products stock counts & table indicators
      if (this.activeView === "pos" && window.views.pos) {
        if (typeof window.views.pos.renderProducts === "function") {
          window.views.pos.renderProducts();
        }
      }

      // Friendly notification
      window.showToast("🔔 Live Sync: Orders updated from Cloud!", "info");
    }

    // 2. Products or Categories updated
    if (key === "products" || key === "categories") {
      if (this.activeView === "pos" && window.views.pos) {
        if (typeof window.views.pos.renderCategories === "function") window.views.pos.renderCategories();
        if (typeof window.views.pos.renderProducts === "function") window.views.pos.renderProducts();
      } else if (this.activeView === "menu" && window.views.menu) {
        if (typeof window.views.menu.render === "function") window.views.menu.render();
      }
    }
  },

  runAppSession() {
    this.currentUser = window.db.getCurrentUser();

    if (this.currentUser) {
      // Hide login, show dashboard app
      document.getElementById("auth-view").style.display = "none";
      document.getElementById("app-container").style.display = "flex";

      // Update User Panel in sidebar
      document.getElementById("header-username").textContent = this.currentUser.name;
      document.getElementById("header-role").textContent = this.currentUser.role;
      document.getElementById("header-avatar-letter").textContent = this.currentUser.name.charAt(0);

      // Hide or show links in sidebar based on dynamic permissions matrix
      const role = this.currentUser.role;
      const permissions = window.db.get("permissions") || {
        admin: ["dashboard", "pos", "orders", "menu", "reports"],
        manager: ["dashboard", "pos", "orders", "menu"],
        staff: ["pos", "orders"]
      };
      const allowedViews = permissions[role] || ["pos", "orders"];

      document.querySelectorAll('.nav-menu .nav-item').forEach(el => {
        const view = el.getAttribute("data-view");
        el.style.display = allowedViews.includes(view) ? "block" : "none";
      });

      // Trigger routing - preserving existing valid hash on refresh
      this.route();

      // Update sidebar summary metrics
      this.updateSidebarSummary();
      window.updateSidebarSummary = () => this.updateSidebarSummary();
    } else {
      this.showLogin();
    }
  },

  showLogin() {
    this.currentUser = null;
    document.getElementById("app-container").style.display = "none";
    document.getElementById("auth-view").style.display = "flex";
    document.getElementById("login-form").reset();
  },

  route() {
    if (!this.currentUser) return;

    const role = this.currentUser.role;
    let hash = window.location.hash.replace("#", "");

    // Read dynamic permissions matrix
    const permissions = window.db.get("permissions") || {
      admin: ["dashboard", "pos", "orders", "menu", "reports"],
      manager: ["dashboard", "pos", "orders", "menu"],
      staff: ["pos", "orders"]
    };
    const allowedViews = permissions[role] || ["pos", "orders"];

    // Landing fallback defaults to first allowed view
    const defaultHash = allowedViews.includes("dashboard") ? "dashboard" : allowedViews[0];

    if (!hash) {
      hash = defaultHash;
      window.location.hash = `#${hash}`;
      return;
    }

    if (!allowedViews.includes(hash)) {
      window.showToast(`Access Restricted: your role (${role}) does not have permission to access this page.`, "error");
      window.location.hash = `#${defaultHash}`;
      return;
    }

    // View validity fallback
    if (!window.views[hash]) {
      hash = defaultHash;
    }

    this.activeView = hash;

    // Highlight sidebar items
    const navItems = document.querySelectorAll(".nav-menu .nav-item");
    navItems.forEach(item => {
      if (item.getAttribute("data-view") === hash) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });

    // Update Header Title
    const viewTitles = {
      dashboard: "Dashboard Overview",
      pos: "Point of Sale (POS)",
      orders: "Kitchen Display System (KDS)",
      menu: "Menu Management",
      reports: "Sales & Profit Reports"
    };

    const titleElem = document.getElementById("current-view-title");
    if (titleElem) {
      titleElem.textContent = viewTitles[hash] || "POS Terminal";
    }

    // Toggle global top header display based on active view (POS view has custom mockup header)
    const topHeader = document.querySelector(".top-header");
    if (topHeader) {
      topHeader.style.display = (hash === "pos") ? "none" : "flex";
    }

    // Clear viewport, fade-in and render
    const viewport = document.getElementById("view-viewport");
    viewport.innerHTML = "";
    if (hash === "pos") {
      viewport.classList.add("pos-viewport-mode");
    } else {
      viewport.classList.remove("pos-viewport-mode");
    }

    // Trigger module initialization callback
    window.views[hash].init(viewport);
  },



  startHeaderTimer() {
    const clock = document.getElementById("header-date-time");
    const tick = () => {
      const date = new Date();
      const options = {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      };
      clock.textContent = date.toLocaleDateString('en-US', options);
    };
    tick();
    setInterval(tick, 1000);
  },

  updateSidebarSummary() {
    const orders = window.db.get("orders") || [];
    const today = new Date().toDateString();

    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toDateString();

    // Filter non-cancelled orders from today
    const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today && o.status !== "Cancelled");
    const totalOrdersCount = todayOrders.length;
    const totalSalesAmount = todayOrders.reduce((sum, o) => sum + o.total, 0);
    const avgOrderValue = totalOrdersCount > 0 ? (totalSalesAmount / totalOrdersCount) : 0;

    // Filter non-cancelled orders from yesterday
    const yesterdayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === yesterdayStr && o.status !== "Cancelled");
    const yesterdaySalesAmount = yesterdayOrders.reduce((sum, o) => sum + o.total, 0);

    let growthPercent = 0;
    let isPositive = true;

    if (yesterdaySalesAmount > 0) {
      growthPercent = ((totalSalesAmount - yesterdaySalesAmount) / yesterdaySalesAmount) * 100;
      isPositive = growthPercent >= 0;
    } else if (totalSalesAmount > 0) {
      growthPercent = 100;
      isPositive = true;
    } else {
      growthPercent = 0;
      isPositive = true;
    }

    const ordersEl = document.getElementById("sidebar-summary-orders");
    const salesEl = document.getElementById("sidebar-summary-sales");
    const avgEl = document.getElementById("sidebar-summary-avg");
    const growthEl = document.getElementById("sidebar-summary-growth");

    if (ordersEl) ordersEl.textContent = totalOrdersCount;
    if (salesEl) salesEl.textContent = `₹${Math.round(totalSalesAmount).toLocaleString()}`;
    if (avgEl) avgEl.textContent = `₹${Math.round(avgOrderValue)}`;
    if (growthEl) {
      const formattedPercent = Math.abs(growthPercent).toFixed(1);
      const icon = isPositive ? "fa-arrow-trend-up" : "fa-arrow-trend-down";
      const color = isPositive ? "#16a34a" : "#ef4444";
      const sign = isPositive ? "+" : "-";
      growthEl.style.color = color;
      growthEl.innerHTML = `<i class="fa-solid ${icon}"></i> ${sign}${formattedPercent}% vs yesterday`;
    }
  }
};

// Initialize SPA App on script load
document.addEventListener("DOMContentLoaded", () => {
  app.init();
});
