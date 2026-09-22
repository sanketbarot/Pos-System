// Crust & Chilly POS - Daily Counter & Order History Module
// Provides daily cash/UPI counter reconciliation and complete searchable order history with bill reprint.

window.views = window.views || {};
window.views.counter = {
  activeDateStr: null,
  searchQuery: "",
  paymentFilter: "all",

  init(container) {
    const today = new Date();
    this.activeDateStr = this.getIstDateString(today);

    container.innerHTML = `
      <div class="view-animate" style="display: flex; flex-direction: column; gap: 20px;">
        
        <!-- Top Date & Quick Action Bar -->
        <div class="glass-card" style="padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
          <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
            <span style="font-size: 14px; font-weight: 800; color: var(--text-dark);">
              <i class="fa-solid fa-cash-register" style="color: #2563eb; margin-right: 6px;"></i> Daily Counter:
            </span>
            <input type="date" id="counter-date-picker" class="form-input" value="${this.activeDateStr}" style="height: 38px; font-size: 13px; font-weight: 700; padding: 4px 12px; border-radius: 12px;">
            <button class="btn btn-secondary" id="btn-counter-today" style="padding: 0 14px; height: 38px; font-size: 12px; border-radius: 12px; font-weight: 700;">
              Today
            </button>
            <button class="btn btn-secondary" id="btn-counter-yesterday" style="padding: 0 14px; height: 38px; font-size: 12px; border-radius: 12px; font-weight: 700;">
              Yesterday
            </button>
          </div>

          <div style="display: flex; align-items: center; gap: 10px;">
            <button class="btn btn-primary" id="btn-counter-refresh" style="padding: 0 16px; height: 38px; font-size: 12.5px; border-radius: 12px; font-weight: 700;">
              <i class="fa-solid fa-arrows-rotate"></i> Refresh Counter
            </button>
          </div>
        </div>

        <!-- Daily Counter KPI Cards Grid -->
        <div class="dashboard-grid-stats" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 0;">
          <!-- Total Collection -->
          <div class="glass-card stat-card" style="border-left: 4px solid #2563eb;">
            <div class="stat-info">
              <span class="stat-label">Total Counter Sales</span>
              <span class="stat-value" id="counter-total-sales" style="color: #2563eb; font-size: 26px; font-weight: 900;">₹0</span>
              <span class="stat-change" id="counter-orders-count" style="color: var(--text-muted); font-weight: 700;">0 orders</span>
            </div>
            <div class="stat-icon-wrapper" style="background: #eff6ff; border-color: #bfdbfe; color: #2563eb;">
              <i class="fa-solid fa-indian-rupee-sign"></i>
            </div>
          </div>

          <!-- Cash in Drawer -->
          <div class="glass-card stat-card" style="border-left: 4px solid #10b981;">
            <div class="stat-info">
              <span class="stat-label">Cash Collection</span>
              <span class="stat-value" id="counter-cash-sales" style="color: #10b981; font-size: 26px; font-weight: 900;">₹0</span>
              <span class="stat-change" id="counter-cash-count" style="color: var(--text-muted); font-weight: 600;">0 Cash Bills</span>
            </div>
            <div class="stat-icon-wrapper" style="background: #ecfdf5; border-color: #a7f3d0; color: #059669;">
              <i class="fa-solid fa-money-bill-wave"></i>
            </div>
          </div>

          <!-- UPI Online Received -->
          <div class="glass-card stat-card" style="border-left: 4px solid #8b5cf6;">
            <div class="stat-info">
              <span class="stat-label">UPI / QR Collection</span>
              <span class="stat-value" id="counter-upi-sales" style="color: #8b5cf6; font-size: 26px; font-weight: 900;">₹0</span>
              <span class="stat-change" id="counter-upi-count" style="color: var(--text-muted); font-weight: 600;">0 UPI Bills</span>
            </div>
            <div class="stat-icon-wrapper" style="background: #f5f3ff; border-color: #ddd6fe; color: #7c3aed;">
              <i class="fa-solid fa-qrcode"></i>
            </div>
          </div>

          <!-- Token Range & Avg Ticket -->
          <div class="glass-card stat-card" style="border-left: 4px solid #f59e0b;">
            <div class="stat-info">
              <span class="stat-label">Token Range / Avg</span>
              <span class="stat-value" id="counter-token-range" style="color: #f59e0b; font-size: 24px; font-weight: 900;">Tk #0</span>
              <span class="stat-change" id="counter-avg-ticket" style="color: var(--text-muted); font-weight: 700;">Avg: ₹0 / bill</span>
            </div>
            <div class="stat-icon-wrapper" style="background: #fffbeb; border-color: #fde68a; color: #d97706;">
              <i class="fa-solid fa-ticket"></i>
            </div>
          </div>
        </div>

        <!-- Orders History & Bills Search Section -->
        <div class="glass-card" style="padding: 20px; display: flex; flex-direction: column; gap: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
            <div>
              <h3 style="font-size: 16px; font-weight: 800; color: var(--text-dark); margin: 0 0 2px 0;">
                <i class="fa-solid fa-clock-rotate-left" style="color: #2563eb; margin-right: 6px;"></i> Day Orders & Bills History
              </h3>
              <p style="font-size: 12px; color: var(--text-muted); margin: 0;">Search, inspect items, and reprint receipts for any order.</p>
            </div>

            <!-- Search and Filter controls -->
            <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
              <select id="counter-payment-filter" class="form-input" style="height: 38px; font-size: 12px; font-weight: 700; border-radius: 12px; width: 120px;">
                <option value="all">All Modes</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
              </select>
              <div style="position: relative; width: 240px;">
                <input type="text" id="counter-search-input" class="form-input" placeholder="Search Cust / Phone / Bill#" style="padding: 6px 12px 6px 30px; font-size: 12.5px; height: 38px; border-radius: 12px; width: 100%;">
                <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 10px; top: 12px; color: var(--text-muted); font-size: 12px; pointer-events: none;"></i>
              </div>
            </div>
          </div>

          <!-- Orders Table Container -->
          <div class="table-container">
            <table class="premium-table">
              <thead>
                <tr>
                  <th>Order # / Token</th>
                  <th>Time</th>
                  <th>Customer</th>
                  <th>Items Summary</th>
                  <th>Payment</th>
                  <th style="text-align: right;">Total Amount</th>
                  <th>Status</th>
                  <th style="text-align: center;">Action</th>
                </tr>
              </thead>
              <tbody id="counter-orders-table-body">
                <!-- Dynamic order rows rendered here -->
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;

    this.bindEvents();
    this.render();
  },

  getIstDateString(dateObj) {
    const date = dateObj || new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(date.getTime() + istOffset);
    const yyyy = istDate.getUTCFullYear();
    const mm = String(istDate.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(istDate.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  },

  bindEvents() {
    const datePicker = document.getElementById("counter-date-picker");
    const btnToday = document.getElementById("btn-counter-today");
    const btnYest = document.getElementById("btn-counter-yesterday");
    const btnRefresh = document.getElementById("btn-counter-refresh");
    const searchInput = document.getElementById("counter-search-input");
    const filterSelect = document.getElementById("counter-payment-filter");

    if (datePicker) {
      datePicker.onchange = (e) => {
        this.activeDateStr = e.target.value;
        this.render();
      };
    }

    if (btnToday) {
      btnToday.onclick = () => {
        this.activeDateStr = this.getIstDateString(new Date());
        if (datePicker) datePicker.value = this.activeDateStr;
        this.render();
      };
    }

    if (btnYest) {
      btnYest.onclick = () => {
        const yest = new Date();
        yest.setDate(yest.getDate() - 1);
        this.activeDateStr = this.getIstDateString(yest);
        if (datePicker) datePicker.value = this.activeDateStr;
        this.render();
      };
    }

    if (btnRefresh) {
      btnRefresh.onclick = () => {
        this.render();
        window.showToast("Daily counter refreshed with latest cloud data.", "info");
      };
    }

    if (searchInput) {
      searchInput.oninput = (e) => {
        this.searchQuery = e.target.value.trim().toLowerCase();
        this.renderTableOnly();
      };
    }

    if (filterSelect) {
      filterSelect.onchange = (e) => {
        this.paymentFilter = e.target.value;
        this.renderTableOnly();
      };
    }
  },

  render() {
    const allOrders = window.db.get("orders") || [];
    const settings = window.db.get("settings") || {};
    const currency = settings.currencySymbol || "₹";

    // Filter orders matching active date (based on IST)
    const targetDate = this.activeDateStr;
    const dayOrders = allOrders.filter(o => {
      if (!o.createdAt) return false;
      const oDate = new Date(o.createdAt);
      return this.getIstDateString(oDate) === targetDate;
    });

    const validDayOrders = dayOrders.filter(o => o.status !== "Cancelled");

    // Metrics calculations
    const totalSales = validDayOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const cashOrders = validDayOrders.filter(o => (o.paymentMethod || "Cash").toLowerCase() === "cash");
    const cashSales = cashOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    const upiOrders = validDayOrders.filter(o => (o.paymentMethod || "").toLowerCase() === "upi");
    const upiSales = upiOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    const avgTicket = validDayOrders.length > 0 ? Math.round(totalSales / validDayOrders.length) : 0;

    let minToken = 999999;
    let maxToken = 0;
    validDayOrders.forEach(o => {
      const tok = Number(o.tokenNumber) || 0;
      if (tok > 0) {
        if (tok < minToken) minToken = tok;
        if (tok > maxToken) maxToken = tok;
      }
    });

    const tokenRangeText = maxToken > 0 ? `Tk #${minToken} - #${maxToken}` : "None";

    // Update KPI Cards
    const totalEl = document.getElementById("counter-total-sales");
    const ordersEl = document.getElementById("counter-orders-count");
    const cashEl = document.getElementById("counter-cash-sales");
    const cashCountEl = document.getElementById("counter-cash-count");
    const upiEl = document.getElementById("counter-upi-sales");
    const upiCountEl = document.getElementById("counter-upi-count");
    const tokenEl = document.getElementById("counter-token-range");
    const avgEl = document.getElementById("counter-avg-ticket");

    if (totalEl) totalEl.textContent = `${currency}${Math.round(totalSales).toLocaleString("en-IN")}`;
    if (ordersEl) ordersEl.textContent = `${validDayOrders.length} valid / ${dayOrders.length} total orders`;
    if (cashEl) cashEl.textContent = `${currency}${Math.round(cashSales).toLocaleString("en-IN")}`;
    if (cashCountEl) cashCountEl.textContent = `${cashOrders.length} Cash Bills (${Math.round(totalSales > 0 ? (cashSales / totalSales) * 100 : 0)}%)`;
    if (upiEl) upiEl.textContent = `${currency}${Math.round(upiSales).toLocaleString("en-IN")}`;
    if (upiCountEl) upiCountEl.textContent = `${upiOrders.length} UPI Bills (${Math.round(totalSales > 0 ? (upiSales / totalSales) * 100 : 0)}%)`;
    if (tokenEl) tokenEl.textContent = tokenRangeText;
    if (avgEl) avgEl.textContent = `Avg: ${currency}${avgTicket} / bill`;

    this.renderTableOnly();
  },

  renderTableOnly() {
    const allOrders = window.db.get("orders") || [];
    const settings = window.db.get("settings") || {};
    const currency = settings.currencySymbol || "₹";

    // 1. Filter by Date
    const targetDate = this.activeDateStr;
    let dayOrders = allOrders.filter(o => {
      if (!o.createdAt) return false;
      const oDate = new Date(o.createdAt);
      return this.getIstDateString(oDate) === targetDate;
    });

    // 2. Filter by Payment Mode
    if (this.paymentFilter !== "all") {
      dayOrders = dayOrders.filter(o => (o.paymentMethod || "Cash").toLowerCase() === this.paymentFilter.toLowerCase());
    }

    // 3. Filter by Search Query
    if (this.searchQuery) {
      const q = this.searchQuery;
      dayOrders = dayOrders.filter(o => {
        const id = (o.id || "").toLowerCase();
        const num = String(o.orderNumber || "");
        const tok = String(o.tokenNumber || "");
        const name = (o.customerName || "").toLowerCase();
        const phone = (o.customerPhone || "");
        return id.includes(q) || num.includes(q) || tok.includes(q) || name.includes(q) || phone.includes(q);
      });
    }

    const tbody = document.getElementById("counter-orders-table-body");
    if (!tbody) return;

    if (dayOrders.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 40px; font-weight: 600;">
            <i class="fa-solid fa-folder-open" style="font-size: 24px; opacity: 0.4; display: block; margin-bottom: 8px;"></i>
            No orders found for the selected date and filters.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = dayOrders.map(o => {
      const timeStr = new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const itemsBrief = (o.items || []).map(i => `${i.name} (x${i.quantity})`).join(", ");

      let statusBadge = "badge-pending";
      if (o.status === "Preparing") statusBadge = "badge-preparing";
      if (o.status === "Ready") statusBadge = "badge-ready";
      if (o.status === "Completed") statusBadge = "badge-completed";
      if (o.status === "Cancelled") statusBadge = "badge-cancelled";

      const isUpi = (o.paymentMethod || "").toLowerCase() === "upi";
      const payBadge = isUpi
        ? `<span style="background: #f5f3ff; color: #7c3aed; border: 1px solid #ddd6fe; padding: 2px 8px; border-radius: 8px; font-size: 11px; font-weight: 800;"><i class="fa-solid fa-qrcode"></i> UPI</span>`
        : `<span style="background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; padding: 2px 8px; border-radius: 8px; font-size: 11px; font-weight: 800;"><i class="fa-solid fa-money-bill"></i> Cash</span>`;

      return `
        <tr>
          <td>
            <div style="font-weight: 800; color: var(--text-dark); font-size: 13.5px;">#${o.orderNumber || o.id}</div>
            <div style="font-size: 11px; font-weight: 700; color: #2563eb;">Token #${o.tokenNumber || 1}</div>
          </td>
          <td style="color: var(--text-muted); font-size: 12px; font-weight: 600;">${timeStr}</td>
          <td>
            <div style="font-weight: 700; color: var(--text-dark);">${o.customerName || "Walk-in Customer"}</div>
            <div style="font-size: 11px; color: var(--text-muted);">${o.customerPhone || "No phone"}</div>
          </td>
          <td style="max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 12px; color: var(--text-dark);" title="${itemsBrief}">
            ${itemsBrief}
          </td>
          <td>${payBadge}</td>
          <td style="text-align: right; font-weight: 900; color: #ebb036; font-size: 14px;">
            ${currency}${Number(o.total || 0).toFixed(2)}
          </td>
          <td><span class="badge ${statusBadge}">${o.status}</span></td>
          <td style="text-align: center;">
            <button class="btn btn-secondary btn-reprint-counter" data-id="${o.id}" style="padding: 6px 12px; font-size: 11.5px; border-radius: 10px; font-weight: 700;">
              <i class="fa-solid fa-receipt" style="color: #2563eb;"></i> View Bill
            </button>
          </td>
        </tr>
      `;
    }).join("");

    // Bind reprint / view bill buttons
    tbody.querySelectorAll(".btn-reprint-counter").forEach(btn => {
      btn.onclick = () => {
        const orderId = btn.getAttribute("data-id");
        this.showReceiptModal(orderId);
      };
    });
  },

  showReceiptModal(orderId) {
    const orders = window.db.get("orders") || [];
    const order = orders.find(o => o.id === orderId);
    if (!order) {
      window.showToast("Order not found.", "error");
      return;
    }

    const settings = window.db.get("settings") || {};
    const currency = settings.currencySymbol || "₹";
    const dateStr = new Date(order.createdAt).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short"
    });

    const itemsHtml = (order.items || []).map(item => `
      <tr style="border-bottom: 1px dashed #cbd5e1;">
        <td style="padding: 6px 0; font-weight: 600;">${item.name}</td>
        <td style="padding: 6px 0; text-align: center;">x${item.quantity}</td>
        <td style="padding: 6px 0; text-align: right;">${currency}${item.price}</td>
        <td style="padding: 6px 0; text-align: right; font-weight: 700;">${currency}${item.lineTotal || (item.price * item.quantity)}</td>
      </tr>
    `).join("");

    const bodyHtml = `
      <div id="receipt-print-area" style="font-family: 'Courier New', monospace; font-size: 13px; color: #1e293b; background: #fff; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; line-height: 1.4;">
        <div style="text-align: center; margin-bottom: 12px;">
          <h2 style="font-size: 18px; font-weight: 900; margin: 0; text-transform: uppercase;">${settings.restaurantName || "Crust & Chilly"}</h2>
          <p style="font-size: 11px; margin: 2px 0; color: #64748b;">${settings.address || "Shop No. 09, Shela, Ahmedabad"}</p>
          <p style="font-size: 11px; margin: 0; color: #64748b;">Mo: ${settings.phone || "+91 9664870840"}</p>
        </div>

        <div style="border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 6px 0; margin-bottom: 10px; font-size: 12px;">
          <div style="display: flex; justify-content: space-between;">
            <span><strong>Order:</strong> #${order.orderNumber || order.id}</span>
            <span><strong style="color: #2563eb; font-size: 14px;">Token #${order.tokenNumber || 1}</strong></span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 2px;">
            <span><strong>Date:</strong> ${dateStr}</span>
            <span><strong>Type:</strong> ${order.type || "Dine-in"}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 2px;">
            <span><strong>Customer:</strong> ${order.customerName || "Walk-in"}</span>
            <span><strong>Pay:</strong> ${order.paymentMethod || "Cash"}</span>
          </div>
        </div>

        <table style="width: 100%; font-size: 12px; margin-bottom: 10px;">
          <thead>
            <tr style="border-bottom: 1px solid #000;">
              <th style="text-align: left; padding-bottom: 4px;">Item</th>
              <th style="text-align: center; padding-bottom: 4px;">Qty</th>
              <th style="text-align: right; padding-bottom: 4px;">Rate</th>
              <th style="text-align: right; padding-bottom: 4px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="border-top: 1px dashed #000; padding-top: 6px; font-size: 12px;">
          <div style="display: flex; justify-content: space-between;">
            <span>Subtotal:</span>
            <span>${currency}${Number(order.subtotal || 0).toFixed(2)}</span>
          </div>
          ${order.bogoDiscount ? `
            <div style="display: flex; justify-content: space-between; color: #16a34a;">
              <span>BOGO Discount:</span>
              <span>-${currency}${Number(order.bogoDiscount).toFixed(2)}</span>
            </div>
          ` : ""}
          ${order.discount ? `
            <div style="display: flex; justify-content: space-between; color: #16a34a;">
              <span>Flat Discount:</span>
              <span>-${currency}${Number(order.discount).toFixed(2)}</span>
            </div>
          ` : ""}
          <div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: 900; border-top: 1px solid #000; margin-top: 6px; padding-top: 4px;">
            <span>GRAND TOTAL:</span>
            <span>${currency}${Number(order.total || 0).toFixed(2)}</span>
          </div>
        </div>

        <div style="text-align: center; margin-top: 14px; font-size: 11px; color: #64748b;">
          *** Thank You! Visit Again ***<br>
          Follow us on Instagram: @crustandchillyindia
        </div>
      </div>
    `;

    window.customModal.show({
      title: `Bill Receipt #${order.orderNumber || order.id}`,
      bodyHtml: bodyHtml,
      confirmText: "Print Receipt",
      cancelText: "Close",
      onConfirm: () => {
        window.print();
        return true;
      }
    });
  }
};
