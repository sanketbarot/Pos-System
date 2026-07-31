// Crust & Chilly POS - KDS (Kitchen Display System) & History Module
// Handles Kanban card progression (Pending -> Preparing -> Ready -> Completed) and order logs archiving.

window.views = window.views || {};
window.views.orders = {
  activeSubTab: "kds", // 'kds' or 'history'
  searchQuery: "",

  init(container) {
    container.innerHTML = `
      <div class="view-animate" style="display: flex; flex-direction: column; gap: 16px;">
        <!-- Sub navigation header -->
        <div class="flex-space" style="background: var(--bg-darker); padding: 12px 20px; border-radius: var(--border-radius-lg); border: 1px solid var(--border-color);">
          <div class="flex-gap-sm">
            <button class="btn btn-secondary ${this.activeSubTab === 'kds' ? 'btn-primary' : ''}" id="btn-sub-kds">
              <i class="fa-solid fa-kitchen-set"></i> Kitchen KDS Queue
            </button>
            <button class="btn btn-secondary ${this.activeSubTab === 'history' ? 'btn-primary' : ''}" id="btn-sub-history">
              <i class="fa-solid fa-clock-rotate-left"></i> Order History & Reprint
            </button>
          </div>
          
          <div id="history-search-container" style="display: ${this.activeSubTab === 'history' ? 'block' : 'none'}; width: 280px;">
            <input type="text" id="order-history-search" class="search-bar-input" style="padding: 8px 12px; font-size: 13px;" placeholder="Search Customer, ID or Phone...">
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
      this.renderHistory(mount);
    }
  },

  renderKds(mount) {
    const orders = window.db.get("orders") || [];

    // KDS tracks Pending, Preparing, Ready
    const pendingOrders = orders.filter(o => o.status === "Pending");
    const preparingOrders = orders.filter(o => o.status === "Preparing");
    const readyOrders = orders.filter(o => o.status === "Ready");

    mount.innerHTML = `
      <div class="kds-board view-animate">
        
        <!-- PENDING LANE -->
        <div class="kds-column">
          <div class="kds-column-header pending">
            <span>Pending Orders</span>
            <span class="kds-order-count">${pendingOrders.length}</span>
          </div>
          <div class="kds-order-list">
            ${this.generateKdsCards(pendingOrders, "Pending")}
          </div>
        </div>

        <!-- PREPARING LANE -->
        <div class="kds-column">
          <div class="kds-column-header preparing">
            <span>Preparing</span>
            <span class="kds-order-count">${preparingOrders.length}</span>
          </div>
          <div class="kds-order-list">
            ${this.generateKdsCards(preparingOrders, "Preparing")}
          </div>
        </div>

        <!-- READY LANE -->
        <div class="kds-column">
          <div class="kds-column-header ready">
            <span>Ready for Pickup</span>
            <span class="kds-order-count">${readyOrders.length}</span>
          </div>
          <div class="kds-order-list">
            ${this.generateKdsCards(readyOrders, "Ready")}
          </div>
        </div>

        <!-- COMPLETED HIGHLIGHTS (showing last 5 briefly for reference) -->
        <div class="kds-column">
          <div class="kds-column-header completed">
            <span>Recently Closed</span>
          </div>
          <div class="kds-order-list">
            ${this.generateClosedKdsCards(orders.filter(o => o.status === "Completed" || o.status === "Cancelled").slice(0, 5))}
          </div>
        </div>

      </div>
    `;

    // Bind event hooks to advance state
    mount.querySelectorAll(".kds-btn-advance").forEach(btn => {
      btn.onclick = () => {
        const orderId = btn.getAttribute("data-id");
        const nextStatus = btn.getAttribute("data-next");
        window.db.updateOrderStatus(orderId, nextStatus);

        window.showToast(`Order status updated to ${nextStatus}`, "success");
        this.renderActiveTab();
      };
    });

    // Bind Cancel buttons
    mount.querySelectorAll(".kds-btn-cancel").forEach(btn => {
      btn.onclick = () => {
        const orderId = btn.getAttribute("data-id");
        window.db.updateOrderStatus(orderId, "Cancelled");
        window.showToast("Order cancelled & ingredients refunded back to stock.", "info");
        this.renderActiveTab();
      };
    });

    this.startKdsTimerLoop();
  },

  generateKdsCards(ordersList, lane) {
    if (ordersList.length === 0) {
      return `
        <div style="text-align: center; color: var(--text-muted); padding: 40px 10px; font-size: 13px;">
          <i class="fa-regular fa-folder-open" style="font-size: 24px; opacity: 0.3; display: block; margin-bottom: 8px;"></i>
          No orders in this queue.
        </div>
      `;
    }

    return ordersList.map(order => {
      const formattedTime = new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const itemsHtml = order.items.map(item => `
        <li class="kds-order-item">
          <span>${item.name}</span>
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

      return `
        <div class="kds-order-card">
          <div class="kds-order-top">
            <span class="kds-order-num">#${order.orderNumber}</span>
            <span class="kds-order-time">${formattedTime}</span>
            <span class="kds-order-type ${order.type.toLowerCase()}">${order.tableNumber ? `${order.type} (${order.tableNumber})` : order.type}</span>
          </div>
          <ul class="kds-order-items">
            ${itemsHtml}
          </ul>
          <div class="kds-order-cust">
            <i class="fa-regular fa-user"></i> ${order.customerName}
          </div>
          ${(lane === "Pending" || lane === "Preparing") ? `
            <div class="kds-timer-container">
              <span><i class="fa-regular fa-clock"></i> Time Left:</span>
              <span class="kds-timer-countdown" data-order-id="${order.id}" data-status="${order.status}">--:--</span>
            </div>
          ` : ""}
          
          <div class="flex-gap-sm mt-3" style="width: 100%;">
            <button class="kds-btn-advance" data-id="${order.id}" data-next="${nextStatus}" style="flex-grow: 1;">
              <i class="fa-solid ${icon}"></i> ${actionBtnText}
            </button>
            ${lane !== "Ready" ? `
              <button class="btn btn-danger kds-btn-cancel" data-id="${order.id}" title="Cancel Order" style="padding: 8px 10px;">
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
      return `<div style="text-align: center; color: var(--text-muted); padding: 40px 10px; font-size: 13px;">No recently closed orders.</div>`;
    }

    return ordersList.map(order => {
      const badgeClass = order.status === "Completed" ? "badge-completed" : "badge-cancelled";
      return `
        <div class="kds-order-card" style="opacity: 0.7;">
          <div class="kds-order-top">
            <span class="kds-order-num">#${order.orderNumber}</span>
            <span class="badge ${badgeClass}">${order.status.toUpperCase()}</span>
          </div>
          <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
            ${order.items.map(i => `${i.name} x${i.quantity}`).join(", ")}
          </div>
          <div class="flex-space mt-3" style="font-size: 12px;">
            <span>${order.customerName}</span>
            <strong>₹${Math.round(order.total)}</strong>
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
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q)
      );
    }

    let rowsHtml = "";
    if (filtered.length === 0) {
      rowsHtml = `
        <tr>
          <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 40px;">
            No transaction records matched search query.
          </td>
        </tr>
      `;
    } else {
      rowsHtml = filtered.map(o => {
        const date = new Date(o.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

        let statusBadge = "badge-pending";
        if (o.status === "Preparing") statusBadge = "badge-preparing";
        if (o.status === "Ready") statusBadge = "badge-ready";
        if (o.status === "Completed") statusBadge = "badge-completed";
        if (o.status === "Cancelled") statusBadge = "badge-cancelled";

        return `
          <tr>
            <td style="font-weight: 700;">#${o.orderNumber}</td>
            <td>${date}</td>
            <td>
              <div style="font-weight: 600;">${o.customerName}</div>
              <div style="font-size: 11px; color: var(--text-muted);">${o.customerPhone || 'No Phone'}</div>
            </td>
            <td>${o.type}</td>
            <td style="font-weight: 700; color: #ff5c00;">${currency}${o.total.toFixed(2)}</td>
            <td><span class="badge ${statusBadge}">${o.status}</span></td>
            <td>
              <div class="flex-gap-sm">
                <button class="btn btn-secondary btn-reprint" data-id="${o.id}" style="padding: 6px 12px; font-size: 12px;">
                  <i class="fa-solid fa-print"></i> Receipt
                </button>
                ${o.status !== "Cancelled" && o.status !== "Completed" ? `
                  <button class="btn btn-danger btn-cancel-history" data-id="${o.id}" style="padding: 6px 10px; font-size: 12px;">
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
              <th>Status</th>
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
        if (order) {
          // Borrow receipt renderer from POS Terminals module
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

  kdsTimerInterval: null,

  startKdsTimerLoop() {
    if (this.kdsTimerInterval) {
      clearInterval(this.kdsTimerInterval);
    }

    this.kdsTimerInterval = setInterval(() => {
      // Check if KDS queue is still active and visible in DOM
      const countdownEls = document.querySelectorAll(".kds-timer-countdown");
      if (countdownEls.length === 0 || this.activeSubTab !== "kds") {
        clearInterval(this.kdsTimerInterval);
        this.kdsTimerInterval = null;
        return;
      }

      const orders = window.db.get("orders") || [];
      let needsRerender = false;

      countdownEls.forEach(el => {
        const orderId = el.getAttribute("data-order-id");
        const status = el.getAttribute("data-status");
        const order = orders.find(o => o.id === orderId);

        if (!order) return;

        const now = new Date();
        const createdTime = new Date(order.createdAt);

        if (status === "Pending") {
          const elapsedSeconds = Math.floor((now - createdTime) / 1000);
          const remainingSeconds = 15 - elapsedSeconds;

          if (remainingSeconds <= 0) {
            window.db.updateOrderStatus(orderId, "Preparing");
            needsRerender = true;
          } else {
            el.textContent = `${remainingSeconds}s`;
          }
        } else if (status === "Preparing") {
          // 15 minutes = 900 seconds
          const startedTime = order.preparingStartedAt ? new Date(order.preparingStartedAt) : createdTime;
          const elapsedSeconds = Math.floor((now - startedTime) / 1000);
          const remainingSeconds = 900 - elapsedSeconds;

          if (remainingSeconds <= 0) {
            const absSeconds = Math.abs(remainingSeconds);
            const mins = Math.floor(absSeconds / 60);
            const secs = absSeconds % 60;
            el.textContent = `Overdue (-${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')})`;
            el.className = "kds-timer-countdown overdue";
          } else {
            const mins = Math.floor(remainingSeconds / 60);
            const secs = remainingSeconds % 60;
            el.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

            if (remainingSeconds <= 60) {
              el.className = "kds-timer-countdown warning-blink";
            } else {
              el.className = "kds-timer-countdown";
            }
          }
        }
      });

      if (needsRerender) {
        this.renderActiveTab();
      }
    }, 1000);
  }
};
