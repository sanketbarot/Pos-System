// Crust & Chilly POS - Root SPA Controller & Router
// Manages authentication flow, routing transitions, role restrictions, and global layout.

// Global toast notifier helper
window.showToast = function(message, type = "success") {
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
    window.customModal.init();
    
    // Bind Session authentication
    const loginForm = document.getElementById("login-form");
    loginForm.onsubmit = (e) => {
      e.preventDefault();
      const userField = document.getElementById("login-username").value;
      const passField = document.getElementById("login-password").value;
      
      const authResult = window.db.login(userField, passField);
      if (authResult.success) {
        this.runAppSession();
      } else {
        window.showToast("Invalid username or password.", "error");
      }
    };

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

    // Check session on startup
    this.runAppSession();

    // Bind route listener
    window.onhashchange = () => this.route();

    // Start header timer
    this.startHeaderTimer();
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

      // Trigger routing
      this.route();
    } else {
      this.showLogin();
    }
  },

  showLogin() {
    this.currentUser = null;
    document.getElementById("app-container").style.display = "none";
    document.getElementById("auth-view").style.display = "flex";
    document.getElementById("login-form").reset();
    window.location.hash = "";
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
  }
};

// Initialize SPA App on script load
document.addEventListener("DOMContentLoaded", () => {
  app.init();
});
