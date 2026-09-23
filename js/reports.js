// Crust & Chilly POS - Reports & Business Intelligence Module
// Provides granular sales metrics, payment breakouts, item velocity analysis, shift peak hours, customer loyalty, and data exports.

window.views = window.views || {};
window.views.reports = {
  startDate: null,
  endDate: null,
  salesTrendChart: null,
  categoryBreakdownChart: null,
  hourlyRushChart: null,

  getLocalDateStr(d = new Date()) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  init(container) {
    // Default date range: Last 7 days in local time
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);

    this.startDate = this.getLocalDateStr(lastWeek);
    this.endDate = this.getLocalDateStr(today);

    container.innerHTML = `
      <div class="view-animate" style="display: flex; flex-direction: column; gap: 20px; max-width: 100%; width: 100%; overflow-x: hidden;">
        
        <!-- Date Filters Control Panel Bar -->
        <div class="glass-card report-filter-bar" style="padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
          <div class="report-dates-group" style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
            <span style="font-size: 13px; font-weight: 800; color: var(--text-dark); white-space: nowrap;"><i class="fa-solid fa-calendar-days" style="color: #2563eb; margin-right: 6px;"></i> Analytics Period:</span>
            
            <!-- Quick Preset Pills -->
            <div style="display: flex; gap: 6px; flex-wrap: wrap;" id="rep-preset-group">
              <button type="button" class="btn-rep-preset" data-range="today" style="background: #f1f5f9; border: 1px solid var(--border-color); border-radius: 8px; padding: 5px 11px; font-size: 11.5px; font-weight: 700; cursor: pointer; color: var(--text-dark); transition: all 0.2s;">Today</button>
              <button type="button" class="btn-rep-preset" data-range="yesterday" style="background: #f1f5f9; border: 1px solid var(--border-color); border-radius: 8px; padding: 5px 11px; font-size: 11.5px; font-weight: 700; cursor: pointer; color: var(--text-dark); transition: all 0.2s;">Yesterday</button>
              <button type="button" class="btn-rep-preset active" data-range="last7" style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 5px 11px; font-size: 11.5px; font-weight: 700; cursor: pointer; color: #2563eb; transition: all 0.2s;">Last 7 Days</button>
              <button type="button" class="btn-rep-preset" data-range="thisMonth" style="background: #f1f5f9; border: 1px solid var(--border-color); border-radius: 8px; padding: 5px 11px; font-size: 11.5px; font-weight: 700; cursor: pointer; color: var(--text-dark); transition: all 0.2s;">This Month</button>
            </div>

            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-left: 2px;">
              <input type="date" id="report-start-date" class="form-input" style="height: 36px; font-size: 12px; padding: 4px 10px; border-radius: 10px;" value="${this.startDate}">
              <span style="font-size: 12px; color: var(--text-muted); font-weight: 600;">to</span>
              <input type="date" id="report-end-date" class="form-input" style="height: 36px; font-size: 12px; padding: 4px 10px; border-radius: 10px;" value="${this.endDate}">
            </div>
            <button class="btn btn-primary" id="btn-reports-apply-filter" style="padding: 0 16px; height: 36px; font-size: 12px; border-radius: 10px; font-weight: 700;">
              Apply
            </button>
          </div>
          <div class="report-actions-group" style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button class="btn btn-secondary" id="btn-report-export-csv" style="padding: 0 16px; height: 36px; font-size: 12px; border-radius: 10px; font-weight: 700;">
              <i class="fa-solid fa-file-csv" style="color: #2563eb; font-size: 14px;"></i> Export CSV
            </button>
            <button class="btn btn-secondary" id="btn-report-print-summary" style="padding: 0 16px; height: 36px; font-size: 12px; border-radius: 10px; font-weight: 700;">
              <i class="fa-solid fa-print" style="color: #2563eb;"></i> Print Summary
            </button>
          </div>
        </div>

        <!-- 4 Stats Cards Row -->
        <div class="dashboard-grid-stats" style="margin-bottom: 0;">
          <div class="glass-card stat-card" style="border-left: 4px solid #2563eb;">
            <div class="stat-info">
              <span class="stat-label">Gross Revenue</span>
              <span class="stat-value" id="rep-total-sales" style="color: #2563eb; font-size: 26px; font-weight: 900;">₹0</span>
              <span class="stat-change" style="color: var(--text-muted); font-weight: 600;">Sum of all orders in period</span>
            </div>
            <div class="stat-icon-wrapper" style="background: #eff6ff; border-color: #bfdbfe; color: #2563eb;">
              <i class="fa-solid fa-calculator"></i>
            </div>
          </div>
          <div class="glass-card stat-card" style="border-left: 4px solid #10b981;">
            <div class="stat-info">
              <span class="stat-label">Net Revenue</span>
              <span class="stat-value" id="rep-net-sales" style="color: #10b981; font-size: 26px; font-weight: 900;">₹0</span>
              <span class="stat-change" style="color: var(--text-muted); font-weight: 600;">Revenue minus discounts</span>
            </div>
            <div class="stat-icon-wrapper" style="background: #ecfdf5; border-color: #a7f3d0; color: #059669;">
              <i class="fa-solid fa-wallet"></i>
            </div>
          </div>
          <div class="glass-card stat-card" style="border-left: 4px solid #2563eb;">
            <div class="stat-info">
              <span class="stat-label">Average Order (AOV)</span>
              <span class="stat-value" id="rep-aov" style="color: var(--text-dark); font-size: 26px; font-weight: 900;">₹0</span>
              <span class="stat-change" style="color: var(--text-muted); font-weight: 600;">Average billing amount</span>
            </div>
            <div class="stat-icon-wrapper" style="background: #eff6ff; border-color: #bfdbfe; color: #2563eb;">
              <i class="fa-solid fa-chart-simple"></i>
            </div>
          </div>
          <div class="glass-card stat-card" style="border-left: 4px solid #10b981;">
            <div class="stat-info">
              <span class="stat-label">Discounts Given</span>
              <span class="stat-value" id="rep-total-discounts" style="color: #10b981; font-size: 26px; font-weight: 900;">₹0</span>
              <span class="stat-change" id="rep-total-discounts-sub" style="color: var(--text-muted); font-weight: 600;">BOGO + Cash discounts</span>
            </div>
            <div class="stat-icon-wrapper" style="background: #ecfdf5; border-color: #a7f3d0; color: #059669;">
              <i class="fa-solid fa-tags"></i>
            </div>
          </div>
        </div>

        <!-- Charts Segment 1: Sales Trend Line + Category Pie -->
        <div class="dashboard-charts-row" style="margin-bottom: 0;">
          <div class="glass-card chart-card">
            <div class="flex-space mb-3" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <h3 style="font-size: 15px; font-weight: 800; color: var(--text-dark); margin: 0;"><i class="fa-solid fa-chart-line" style="color: #2563eb; margin-right: 6px;"></i> Revenue Analytics Trend Curve</h3>
              <span style="font-size: 11px; color: #2563eb; background: #eff6ff; border: 1px solid #bfdbfe; padding: 2px 8px; border-radius: 10px; font-weight: 800; text-transform: uppercase;">Sales Curve</span>
            </div>
            <div class="chart-container">
              <canvas id="repSalesCurveCanvas"></canvas>
            </div>
          </div>

          <div class="glass-card chart-card">
            <div class="flex-space mb-3" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <h3 style="font-size: 15px; font-weight: 800; color: var(--text-dark); margin: 0;"><i class="fa-solid fa-pizza-slice" style="color: #2563eb; margin-right: 6px;"></i> Top Categories Breakdown</h3>
              <span style="font-size: 11px; color: #10b981; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 2px 8px; border-radius: 10px; font-weight: 800; text-transform: uppercase;">Category Velocity</span>
            </div>
            <div class="chart-container">
              <canvas id="repCategoryPieCanvas"></canvas>
            </div>
          </div>
        </div>

        <!-- NEW Charts Segment 2: Hourly Rush Curve (2 PM – 12 AM) + Day of Week Matrix -->
        <div class="dashboard-charts-row" style="margin-bottom: 0;">
          
          <!-- Hourly Rush Chart -->
          <div class="glass-card chart-card">
            <div class="flex-space mb-3" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
              <div>
                <h3 style="font-size: 15px; font-weight: 800; color: var(--text-dark); margin: 0;">
                  <i class="fa-solid fa-chart-column" style="color: #f59e0b; margin-right: 6px;"></i> Hourly Rush Curve (2 PM – 12 AM)
                </h3>
                <div style="font-size: 11px; color: var(--text-muted); font-weight: 600; margin-top: 2px;">
                  Orders & revenue pattern by hour of day
                </div>
              </div>
              <span id="rep-peak-hour-chip" style="font-size: 11px; color: #b45309; background: #fffbeb; border: 1px solid #fde68a; padding: 2px 8px; border-radius: 10px; font-weight: 800;">
                Calculating...
              </span>
            </div>
            <div class="chart-container">
              <canvas id="repHourlyRushCanvas"></canvas>
            </div>
          </div>

          <!-- Day of Week Performance Matrix -->
          <div class="glass-card chart-card" style="display: flex; flex-direction: column; justify-content: space-between;">
            <div class="flex-space mb-3" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <div>
                <h3 style="font-size: 15px; font-weight: 800; color: var(--text-dark); margin: 0;">
                  <i class="fa-solid fa-calendar-week" style="color: #2563eb; margin-right: 6px;"></i> Day of Week Performance
                </h3>
                <div style="font-size: 11px; color: var(--text-muted); font-weight: 600; margin-top: 2px;">
                  Average revenue & bills across days of the week
                </div>
              </div>
              <span id="rep-best-day-badge" style="font-size: 11px; color: #1e40af; background: #eff6ff; border: 1px solid #bfdbfe; padding: 2px 8px; border-radius: 10px; font-weight: 800;">
                Weekday vs Weekend
              </span>
            </div>
            <div id="rep-day-of-week-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(105px, 1fr)); gap: 8px; flex-grow: 1;">
              <!-- Injected via JS -->
            </div>
          </div>

        </div>

        <!-- Comprehensive Business Intelligence Suite (4 Key Insights Cards for Selected Period) -->
        <div class="dash-insights-grid">
          
          <!-- Insight Card 1: Order Types (Dine-in vs Takeaway vs Delivery) -->
          <div class="dash-insight-card">
            <div class="insight-header">
              <div class="insight-title">
                <i class="fa-solid fa-utensils" style="color: #2563eb;"></i> Order Fulfillment Channels
              </div>
              <span class="insight-badge" id="rep-orders-channel-badge">0 Bills</span>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 10px;" id="rep-order-types-container">
              <!-- Injected dynamically -->
            </div>
          </div>

          <!-- Insight Card 2: Daily/Period Cash Drawer & Reconciliation -->
          <div class="dash-insight-card">
            <div class="insight-header">
              <div class="insight-title">
                <i class="fa-solid fa-cash-register" style="color: #059669;"></i> Cash Drawer Reconciliation
              </div>
              <span class="insight-badge" style="background: #ecfdf5; color: #065f46; border-color: #a7f3d0;">Period Drawer</span>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 10px;" id="rep-cash-reconcile-container">
              <!-- Injected dynamically -->
            </div>
          </div>

          <!-- Insight Card 3: Shift Rush & Peak Hours (2-5, 5-7, 7-10, 10-12) -->
          <div class="dash-insight-card">
            <div class="insight-header">
              <div>
                <div class="insight-title">
                  <i class="fa-solid fa-stopwatch" style="color: #f59e0b;"></i> Peak Hours & Shifts
                </div>
                <div style="font-size: 11px; color: var(--text-muted); font-weight: 600; margin-top: 2px;">
                  <i class="fa-regular fa-clock"></i> Shop Time: 2:00 PM – 12:00 AM
                </div>
              </div>
              <span class="insight-badge" id="rep-peak-hour-badge" style="background: #fffbeb; color: #b45309; border-color: #fde68a;">Calculating...</span>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 8px;" id="rep-shifts-container">
              <!-- Injected dynamically -->
            </div>
          </div>

          <!-- Insight Card 4: Promotional Impact & Discounts -->
          <div class="dash-insight-card">
            <div class="insight-header">
              <div class="insight-title">
                <i class="fa-solid fa-tags" style="color: #8b5cf6;"></i> Offers & BOGO Discounts
              </div>
              <span class="insight-badge" id="rep-discount-rate-badge" style="background: #f5f3ff; color: #5b21b6; border-color: #ddd6fe;">0% Discount</span>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 10px;" id="rep-discounts-container">
              <!-- Injected dynamically -->
            </div>
          </div>

        </div>

        <!-- Tables breakdown row 1: Item Velocity + Payment Split -->
        <div class="dashboard-details-row">
          
          <!-- Item velocity stats -->
          <div class="glass-card" style="display: flex; flex-direction: column;">
            <div class="flex-space mb-3" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <h3 style="font-size: 15px; font-weight: 800; color: var(--text-dark); margin: 0;"><i class="fa-solid fa-list-ol" style="color: #2563eb; margin-right: 6px;"></i> Itemized Sales Velocity</h3>
              <span class="badge badge-ready">Top Sellers First</span>
            </div>
            <div class="table-container" style="max-height: 320px; overflow-y: auto; overflow-x: auto; width: 100%; -webkit-overflow-scrolling: touch; flex-grow: 1;">
              <table class="premium-table" style="font-size: 13px;">
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th>Price</th>
                    <th>Units Sold</th>
                    <th style="text-align: right;">Gross Generated</th>
                  </tr>
                </thead>
                <tbody id="rep-item-sales-tbody">
                  <!-- Injected via JS -->
                </tbody>
              </table>
            </div>
          </div>

          <!-- Payment collection stats -->
          <div class="glass-card" style="display: flex; flex-direction: column; justify-content: space-between; gap: 16px;">
            <div>
              <div class="flex-space mb-3" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h3 style="font-size: 15px; font-weight: 800; color: var(--text-dark); margin: 0;"><i class="fa-solid fa-credit-card" style="color: #2563eb; margin-right: 6px;"></i> Payment Collection Split</h3>
                <span class="badge badge-completed" id="rep-total-orders-badge">0 Transactions</span>
              </div>
              <div class="table-container" style="overflow-x: auto; width: 100%; -webkit-overflow-scrolling: touch;">
                <table class="premium-table" style="font-size: 13px;">
                  <thead>
                    <tr>
                      <th>Payment Channel</th>
                      <th>Collection Count</th>
                      <th style="text-align: right;">Total Collected</th>
                    </tr>
                  </thead>
                  <tbody id="rep-payment-split-tbody">
                    <!-- Injected via JS -->
                  </tbody>
                </table>
              </div>
            </div>
            <div style="font-size: 12px; color: var(--text-muted); text-align: center; border-top: 1px solid rgba(202, 213, 226, 0.6); padding-top: 12px; font-weight: 600;">
              Data includes completed dine-in, takeaway, and delivery orders.
            </div>
          </div>
        </div>

        <!-- NEW Tables breakdown row 2: Customer Loyalty & VIP Regulars + Slow Moving Items -->
        <div class="dashboard-details-row">
          
          <!-- Customer Loyalty Card -->
          <div class="glass-card" style="display: flex; flex-direction: column;">
            <div class="flex-space mb-3" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
              <div>
                <h3 style="font-size: 15px; font-weight: 800; color: var(--text-dark); margin: 0;">
                  <i class="fa-solid fa-users" style="color: #10b981; margin-right: 6px;"></i> Customer Loyalty & Regulars
                </h3>
                <div style="font-size: 11px; color: var(--text-muted); font-weight: 600; margin-top: 2px;" id="rep-loyalty-subtext">
                  Repeat visits intelligence
                </div>
              </div>
              <span class="badge badge-completed" id="rep-repeat-rate-badge">0% Repeat Rate</span>
            </div>
            <div class="table-container" style="max-height: 280px; overflow-y: auto; overflow-x: auto; width: 100%; -webkit-overflow-scrolling: touch; flex-grow: 1;">
              <table class="premium-table" style="font-size: 13px;">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Phone / Contact</th>
                    <th>Orders Placed</th>
                    <th style="text-align: right;">Total Spent</th>
                  </tr>
                </thead>
                <tbody id="rep-loyalty-tbody">
                  <!-- Injected via JS -->
                </tbody>
              </table>
            </div>
          </div>

          <!-- Slow Moving Menu Watchlist -->
          <div class="glass-card" style="display: flex; flex-direction: column;">
            <div class="flex-space mb-3" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
              <div>
                <h3 style="font-size: 15px; font-weight: 800; color: var(--text-dark); margin: 0;">
                  <i class="fa-solid fa-triangle-exclamation" style="color: #ea580c; margin-right: 6px;"></i> Low Velocity Menu Watchlist
                </h3>
                <div style="font-size: 11px; color: var(--text-muted); font-weight: 600; margin-top: 2px;">
                  Items with low sales volume in selected period
                </div>
              </div>
              <span class="badge" style="background: #fff7ed; color: #c2410c; border: 1px solid #ffedd5;" id="rep-slow-items-badge">Menu Attention</span>
            </div>
            <div class="table-container" style="max-height: 280px; overflow-y: auto; overflow-x: auto; width: 100%; -webkit-overflow-scrolling: touch; flex-grow: 1;">
              <table class="premium-table" style="font-size: 13px;">
                <thead>
                  <tr>
                    <th>Menu Item</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th style="text-align: right;">Units Sold</th>
                  </tr>
                </thead>
                <tbody id="rep-slow-items-tbody">
                  <!-- Injected via JS -->
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    `;

    this.bindEvents();
    this.processDataAndRender();
  },

  bindEvents() {
    const btnApply = document.getElementById("btn-reports-apply-filter");
    const btnExport = document.getElementById("btn-report-export-csv");
    const btnPrint = document.getElementById("btn-report-print-summary");
    const presetButtons = document.querySelectorAll(".btn-rep-preset");

    const highlightPreset = (activeBtn) => {
      presetButtons.forEach(b => {
        b.style.background = "#f1f5f9";
        b.style.borderColor = "var(--border-color)";
        b.style.color = "var(--text-dark)";
      });
      if (activeBtn) {
        activeBtn.style.background = "#eff6ff";
        activeBtn.style.borderColor = "#bfdbfe";
        activeBtn.style.color = "#2563eb";
      }
    };

    presetButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const range = btn.getAttribute("data-range");
        const today = new Date();
        const todayStr = this.getLocalDateStr(today);

        if (range === "today") {
          this.startDate = todayStr;
          this.endDate = todayStr;
        } else if (range === "yesterday") {
          const y = new Date();
          y.setDate(today.getDate() - 1);
          const yStr = this.getLocalDateStr(y);
          this.startDate = yStr;
          this.endDate = yStr;
        } else if (range === "last7") {
          const l7 = new Date();
          l7.setDate(today.getDate() - 7);
          this.startDate = this.getLocalDateStr(l7);
          this.endDate = todayStr;
        } else if (range === "thisMonth") {
          const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
          this.startDate = this.getLocalDateStr(firstDay);
          this.endDate = todayStr;
        }

        document.getElementById("report-start-date").value = this.startDate;
        document.getElementById("report-end-date").value = this.endDate;

        highlightPreset(btn);
        this.processDataAndRender();
        window.showToast(`Showing data: ${this.startDate} to ${this.endDate}`, "info");
      });
    });

    btnApply.onclick = () => {
      this.startDate = document.getElementById("report-start-date").value;
      this.endDate = document.getElementById("report-end-date").value;

      if (!this.startDate || !this.endDate) {
        window.showToast("Please choose valid start and end dates.", "error");
        return;
      }
      if (this.startDate > this.endDate) {
        window.showToast("Start date cannot be after end date.", "error");
        return;
      }

      highlightPreset(null);
      this.processDataAndRender();
      window.showToast("Analytics updated for selected range.", "success");
    };

    btnExport.onclick = () => {
      this.exportReportToCSV();
    };

    btnPrint.onclick = () => {
      window.print();
    };
  },

  processDataAndRender() {
    const orders = window.db.get("orders") || [];
    const products = window.db.get("products") || [];
    const categories = window.db.get("categories") || [];
    const expenses = window.db.get("expenses") || [];
    const settings = window.db.get("settings") || {};
    const currency = settings.currencySymbol || "₹";

    const startStr = this.startDate;
    const endStr = this.endDate;

    // Filter non-cancelled orders inside the date range using local calendar date
    const filteredValidOrders = orders.filter(o => {
      if (!o.createdAt || o.status === "Cancelled") return false;
      const orderDate = new Date(o.createdAt);
      const d = !isNaN(orderDate.getTime()) ? this.getLocalDateStr(orderDate) : o.createdAt.substring(0, 10);
      return d >= startStr && d <= endStr;
    });

    // Filter expenses in this period
    const filteredExpenses = expenses.filter(e => {
      const expDate = e.date || (e.createdAt && !isNaN(new Date(e.createdAt).getTime())
        ? this.getLocalDateStr(new Date(e.createdAt))
        : (e.createdAt ? e.createdAt.substring(0, 10) : ""));
      return expDate >= startStr && expDate <= endStr;
    });
    const periodExpenses = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    // 1. Gross Revenue & Payment Breakdowns
    let cashTotal = 0;
    let upiTotal = 0;
    let cardTotal = 0;
    let grossRevenue = 0;

    filteredValidOrders.forEach(o => {
      const amt = Number(o.total) || 0;
      grossRevenue += amt;
      if (o.paymentMethod === "Cash") cashTotal += amt;
      else if (o.paymentMethod === "Card") cardTotal += amt;
      else upiTotal += amt;
    });

    document.getElementById("rep-total-sales").textContent = `${currency}${Math.round(grossRevenue).toLocaleString("en-IN")}`;

    // 2. Total Discounts given
    const totalDiscounts = filteredValidOrders.reduce((sum, o) => sum + (Number(o.discount) || 0) + (Number(o.bogoDiscount) || 0), 0);
    const bogoDiscounts = filteredValidOrders.reduce((sum, o) => sum + (Number(o.bogoDiscount) || 0), 0);
    const cashDiscounts = filteredValidOrders.reduce((sum, o) => sum + (Number(o.discount) || 0), 0);
    document.getElementById("rep-total-discounts").textContent = `${currency}${Math.round(totalDiscounts).toLocaleString("en-IN")}`;
    document.getElementById("rep-total-discounts-sub").textContent = `BOGO: ${currency}${Math.round(bogoDiscounts).toLocaleString("en-IN")} | Cash: ${currency}${Math.round(cashDiscounts).toLocaleString("en-IN")}`;

    // 3. Net Revenue
    const netRevenue = grossRevenue; // In schema total is already discounted subtotal
    document.getElementById("rep-net-sales").textContent = `${currency}${Math.round(netRevenue).toLocaleString("en-IN")}`;

    // 4. AOV (Average Order Value)
    const aov = filteredValidOrders.length > 0 ? (grossRevenue / filteredValidOrders.length) : 0;
    document.getElementById("rep-aov").textContent = `${currency}${Math.round(aov).toLocaleString("en-IN")}`;

    // 5. Total Transactions badge in table header
    document.getElementById("rep-total-orders-badge").textContent = `${filteredValidOrders.length} Transactions`;

    // 6. Itemized Sales Velocity Calculations
    const itemSoldMap = {};
    filteredValidOrders.forEach(o => {
      if (Array.isArray(o.items)) {
        o.items.forEach(item => {
          if (!itemSoldMap[item.name]) {
            itemSoldMap[item.name] = {
              name: item.name,
              price: item.price,
              quantity: 0,
              gross: 0
            };
          }
          itemSoldMap[item.name].quantity += (Number(item.quantity) || 0);
          itemSoldMap[item.name].gross += (Number(item.lineTotal) || 0);
        });
      }
    });

    const itemSortedList = Object.values(itemSoldMap).sort((a, b) => b.gross - a.gross);
    const itemTableBody = document.getElementById("rep-item-sales-tbody");

    if (itemSortedList.length === 0) {
      itemTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:30px; color:var(--text-muted); font-weight:600;">No item sales in this period.</td></tr>`;
    } else {
      itemTableBody.innerHTML = itemSortedList.map(i => `
        <tr>
          <td style="font-weight: 700; color: var(--text-dark);">${i.name}</td>
          <td style="color: var(--text-muted); font-weight: 600;">${currency}${Number(i.price || 0).toFixed(0)}</td>
          <td><span style="font-weight: 800; color: #2563eb; background: #eff6ff; border: 1px solid #bfdbfe; padding: 2px 8px; border-radius: 10px;">${i.quantity} sold</span></td>
          <td style="text-align: right; font-weight: 800; color: #d97706;">${currency}${Number(i.gross || 0).toFixed(2)}</td>
        </tr>
      `).join("");
    }

    // 7. Payment collection split
    const paySplitCounts = { UPI: 0, Cash: 0, Card: 0 };
    const paySplitAmounts = { UPI: 0, Cash: 0, Card: 0 };

    filteredValidOrders.forEach(o => {
      const mode = o.paymentMethod || "UPI";
      if (paySplitCounts[mode] !== undefined) {
        paySplitCounts[mode]++;
        paySplitAmounts[mode] += (Number(o.total) || 0);
      } else {
        paySplitCounts.UPI++;
        paySplitAmounts.UPI += (Number(o.total) || 0);
      }
    });

    const payTableBody = document.getElementById("rep-payment-split-tbody");
    payTableBody.innerHTML = ["UPI", "Cash", "Card"].map(mode => `
      <tr>
        <td style="font-weight: 700; padding: 12px 18px; color: var(--text-dark);"><i class="fa-solid fa-circle" style="color: ${mode === 'UPI' ? '#2563eb' : mode==='Cash' ? '#10b981' : '#6366f1'}; font-size: 8px; margin-right: 8px;"></i> ${mode}</td>
        <td style="padding: 12px 18px; color: var(--text-muted); font-weight: 600;">${paySplitCounts[mode]} transactions</td>
        <td style="text-align: right; font-weight: 800; color: #2563eb; padding: 12px 18px;">${currency}${paySplitAmounts[mode].toFixed(2)}</td>
      </tr>
    `).join("");

    // 8. Render Comprehensive Business Intelligence Suite (4 Insight Cards)
    this.renderOrderChannels(filteredValidOrders, grossRevenue, currency);
    this.renderCashReconciliation(cashTotal, upiTotal, periodExpenses, currency);
    this.renderShiftsAndPeak(filteredValidOrders, currency);
    this.renderDiscountsImpact(filteredValidOrders, grossRevenue, currency);

    // 9. Render Customer Loyalty & Low Velocity Menu Watchlist
    this.renderCustomerLoyalty(filteredValidOrders, currency);
    this.renderLowVelocityMenu(products, categories, itemSoldMap, currency);

    // 10. Render Day of Week Performance Matrix
    this.renderDayOfWeekPerformance(filteredValidOrders, currency);

    // 11. Render Charts (Trend, Categories, and Hourly Rush Pattern)
    this.renderReportsCharts(filteredValidOrders, categories, products);
  },

  // 1. Order Fulfillment Channels
  renderOrderChannels(orders, grossSales, currencySymbol) {
    const container = document.getElementById("rep-order-types-container");
    if (!container) return;

    let dineCount = 0, dineSales = 0;
    let takeCount = 0, takeSales = 0;
    let delCount = 0, delSales = 0;

    orders.forEach(o => {
      const type = (o.type || "Dine-in").toLowerCase();
      const amt = Number(o.total) || 0;
      if (type.includes("takeaway") || type.includes("parcel")) {
        takeCount++;
        takeSales += amt;
      } else if (type.includes("delivery")) {
        delCount++;
        delSales += amt;
      } else {
        dineCount++;
        dineSales += amt;
      }
    });

    const totalBills = orders.length;
    const badgeEl = document.getElementById("rep-orders-channel-badge");
    if (badgeEl) badgeEl.textContent = `${totalBills} Bills in Period`;

    const dinePct = grossSales > 0 ? Math.round((dineSales / grossSales) * 100) : 0;
    const takePct = grossSales > 0 ? Math.round((takeSales / grossSales) * 100) : 0;
    const delPct = grossSales > 0 ? Math.round((delSales / grossSales) * 100) : 0;

    container.innerHTML = `
      <!-- Dine In -->
      <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: 12px; padding: 10px 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <span style="font-size: 12.5px; font-weight: 800; color: var(--text-dark); display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-chair" style="color: #2563eb;"></i> Dine-in (Tables)
          </span>
          <span style="font-size: 12.5px; font-weight: 900; color: #2563eb;">${currencySymbol}${Math.round(dineSales).toLocaleString("en-IN")} (${dinePct}%)</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted); font-weight: 600;">
          <span>${dineCount} orders</span>
          <span>Avg: ${currencySymbol}${dineCount > 0 ? Math.round(dineSales / dineCount) : 0}/table</span>
        </div>
        <div class="leaderboard-progress-bg" style="margin-top: 5px;">
          <div class="leaderboard-progress-bar" style="width: ${dinePct}%; background: #2563eb;"></div>
        </div>
      </div>

      <!-- Takeaway / Parcel -->
      <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: 12px; padding: 10px 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <span style="font-size: 12.5px; font-weight: 800; color: var(--text-dark); display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-bag-shopping" style="color: #10b981;"></i> Takeaway (Parcel)
          </span>
          <span style="font-size: 12.5px; font-weight: 900; color: #059669;">${currencySymbol}${Math.round(takeSales).toLocaleString("en-IN")} (${takePct}%)</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted); font-weight: 600;">
          <span>${takeCount} orders</span>
          <span>Avg: ${currencySymbol}${takeCount > 0 ? Math.round(takeSales / takeCount) : 0}/parcel</span>
        </div>
        <div class="leaderboard-progress-bg" style="margin-top: 5px;">
          <div class="leaderboard-progress-bar" style="width: ${takePct}%; background: #10b981;"></div>
        </div>
      </div>

      ${delCount > 0 ? `
      <!-- Delivery -->
      <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: 12px; padding: 10px 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <span style="font-size: 12.5px; font-weight: 800; color: var(--text-dark); display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-motorcycle" style="color: #f59e0b;"></i> Direct Delivery
          </span>
          <span style="font-size: 12.5px; font-weight: 900; color: #d97706;">${currencySymbol}${Math.round(delSales).toLocaleString("en-IN")} (${delPct}%)</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted); font-weight: 600;">
          <span>${delCount} orders</span>
          <span>Avg: ${currencySymbol}${delCount > 0 ? Math.round(delSales / delCount) : 0}/delivery</span>
        </div>
        <div class="leaderboard-progress-bg" style="margin-top: 5px;">
          <div class="leaderboard-progress-bar" style="width: ${delPct}%; background: #f59e0b;"></div>
        </div>
      </div>
      ` : ""}
    `;
  },

  // 2. Cash Drawer Reconciliation (Closing Register in Period)
  renderCashReconciliation(cashTotal, upiTotal, periodExpenses, currencySymbol) {
    const container = document.getElementById("rep-cash-reconcile-container");
    if (!container) return;

    const expectedCashInDrawer = Math.max(0, cashTotal - periodExpenses);

    container.innerHTML = `
      <div style="background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 14px; padding: 12px 14px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-size: 11px; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">Expected Cash in Drawer</div>
          <div style="font-size: 22px; font-weight: 900; color: #15803d; margin-top: 2px;">${currencySymbol}${Math.round(expectedCashInDrawer).toLocaleString("en-IN")}</div>
        </div>
        <div style="background: #ffffff; padding: 6px 12px; border-radius: 10px; border: 1px solid #bbf7d0; font-size: 11.5px; font-weight: 800; color: #166534;">
          <i class="fa-solid fa-lock"></i> Period Cash
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px;">
        <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: 10px; padding: 8px 10px;">
          <span style="color: var(--text-muted); font-size: 11px;">Cash Sales (+)</span>
          <div style="font-weight: 800; color: #059669; font-size: 13.5px;">${currencySymbol}${Math.round(cashTotal).toLocaleString("en-IN")}</div>
        </div>
        <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: 10px; padding: 8px 10px;">
          <span style="color: var(--text-muted); font-size: 11px;">Cash Expenses (-)</span>
          <div style="font-weight: 800; color: #dc2626; font-size: 13.5px;">${currencySymbol}${Math.round(periodExpenses).toLocaleString("en-IN")}</div>
        </div>
      </div>

      <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; font-size: 12px;">
        <span style="font-weight: 700; color: #1e40af;"><i class="fa-solid fa-building-columns"></i> Bank / UPI Received:</span>
        <span style="font-weight: 900; color: #2563eb; font-size: 13.5px;">${currencySymbol}${Math.round(upiTotal).toLocaleString("en-IN")}</span>
      </div>
    `;
  },

  // 3. Shift Rush & Peak Hours (Store Operational Hours: 2:00 PM – 12:00 AM Midnight)
  // Shifts: 2 to 5 PM, 5 to 7 PM, 7 to 10 PM, 10 to 12 AM
  renderShiftsAndPeak(orders, currencySymbol) {
    const container = document.getElementById("rep-shifts-container");
    if (!container) return;

    const shifts = [
      {
        name: "2 PM – 5 PM",
        label: "Afternoon",
        icon: "fa-sun",
        iconColor: "#f59e0b",
        color: "#d97706",
        orders: 0,
        sales: 0,
        match: (h) => h >= 14 && h < 17
      },
      {
        name: "5 PM – 7 PM",
        label: "Evening",
        icon: "fa-mug-hot",
        iconColor: "#ea580c",
        color: "#ea580c",
        orders: 0,
        sales: 0,
        match: (h) => h >= 17 && h < 19
      },
      {
        name: "7 PM – 10 PM",
        label: "Dinner Rush",
        icon: "fa-utensils",
        iconColor: "#7c3aed",
        color: "#7c3aed",
        orders: 0,
        sales: 0,
        match: (h) => h >= 19 && h < 22
      },
      {
        name: "10 PM – 12 AM",
        label: "Late Night",
        icon: "fa-moon",
        iconColor: "#4f46e5",
        color: "#4f46e5",
        orders: 0,
        sales: 0,
        match: (h) => (h >= 22 && h <= 23) || h === 0
      }
    ];

    let otherOrders = 0, otherSales = 0;
    const hourFrequency = {};

    orders.forEach(o => {
      const d = new Date(o.createdAt);
      if (isNaN(d.getTime())) return;
      const hour = d.getHours();
      const amt = Number(o.total) || 0;

      hourFrequency[hour] = (hourFrequency[hour] || 0) + 1;

      let matched = false;
      for (const shift of shifts) {
        if (shift.match(hour)) {
          shift.orders++;
          shift.sales += amt;
          matched = true;
          break;
        }
      }

      if (!matched) {
        otherOrders++;
        otherSales += amt;
      }
    });

    let peakHour = null;
    let maxOrdersInHour = 0;
    Object.keys(hourFrequency).forEach(h => {
      if (hourFrequency[h] > maxOrdersInHour) {
        maxOrdersInHour = hourFrequency[h];
        peakHour = Number(h);
      }
    });

    const formatHourWindow = (h) => {
      const ampm1 = h >= 12 ? 'PM' : 'AM';
      const h1 = h % 12 || 12;
      const nextH = (h + 1) % 24;
      const ampm2 = nextH >= 12 ? 'PM' : 'AM';
      const h2 = nextH % 12 || 12;
      return `${h1} ${ampm1} - ${h2} ${ampm2}`;
    };

    const peakBadgeEl = document.getElementById("rep-peak-hour-badge");
    const peakChipEl = document.getElementById("rep-peak-hour-chip");
    if (peakHour !== null && maxOrdersInHour > 0) {
      const peakTxt = `Peak: ${formatHourWindow(peakHour)} (${maxOrdersInHour} bills)`;
      if (peakBadgeEl) peakBadgeEl.textContent = peakTxt;
      if (peakChipEl) peakChipEl.textContent = peakTxt;
    } else {
      if (peakBadgeEl) peakBadgeEl.textContent = "Open 2 PM - 12 AM";
      if (peakChipEl) peakChipEl.textContent = "No Rush Logged";
    }

    let otherHtml = '';
    if (otherOrders > 0) {
      otherHtml = `
        <div style="background: #f8fafc; border: 1px dashed var(--border-color); border-radius: 10px; padding: 7px 12px; margin-top: 2px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 11.5px; font-weight: 700; color: var(--text-muted); display: flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-clock-rotate-left"></i> Pre-Opening / Off-Hours (< 2 PM)
            </span>
            <span style="font-weight: 800; color: var(--text-dark); font-size: 12px;">${currencySymbol}${Math.round(otherSales).toLocaleString("en-IN")}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 10.5px; color: var(--text-muted); margin-top: 2px;">
            <span>${otherOrders} orders placed</span>
            <span>Avg: ${currencySymbol}${Math.round(otherSales / otherOrders)}/bill</span>
          </div>
        </div>
      `;
    }

    container.innerHTML = shifts.map(s => `
      <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: 10px; padding: 8px 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 12px; font-weight: 800; color: var(--text-dark); display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid ${s.icon}" style="color: ${s.iconColor};"></i> ${s.name} <span style="font-size: 10.5px; font-weight: 600; color: var(--text-muted);">(${s.label})</span>
          </span>
          <span style="font-weight: 900; color: ${s.color}; font-size: 13px;">${currencySymbol}${Math.round(s.sales).toLocaleString("en-IN")}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 10.5px; color: var(--text-muted); font-weight: 600; margin-top: 3px;">
          <span>${s.orders} orders placed</span>
          <span>Avg: ${currencySymbol}${s.orders > 0 ? Math.round(s.sales / s.orders) : 0}/bill</span>
        </div>
      </div>
    `).join('') + otherHtml;
  },

  // 4. Discounts & Promotional Impact
  renderDiscountsImpact(orders, grossSales, currencySymbol) {
    const container = document.getElementById("rep-discounts-container");
    if (!container) return;

    let bogoDiscount = 0;
    let flatDiscount = 0;
    let grossOriginal = 0;

    orders.forEach(o => {
      bogoDiscount += (Number(o.bogoDiscount) || 0);
      flatDiscount += (Number(o.discount) || 0);
      grossOriginal += (Number(o.subtotal) || Number(o.total) || 0);
    });

    const totalDiscounts = bogoDiscount + flatDiscount;
    const discountRate = grossOriginal > 0 ? Math.round((totalDiscounts / grossOriginal) * 100) : 0;
    const rateBadge = document.getElementById("rep-discount-rate-badge");
    if (rateBadge) rateBadge.textContent = `${discountRate}% Disc Rate`;

    container.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <div style="background: #fdf2f8; border: 1px solid #fbcfe8; border-radius: 12px; padding: 8px 10px;">
          <span style="font-size: 11px; font-weight: 700; color: #9d174d;"><i class="fa-solid fa-gift"></i> BOGO Savings</span>
          <div style="font-size: 16px; font-weight: 900; color: #be185d; margin-top: 2px;">${currencySymbol}${Math.round(bogoDiscount).toLocaleString("en-IN")}</div>
        </div>

        <div style="background: #fdf2f8; border: 1px solid #fbcfe8; border-radius: 12px; padding: 8px 10px;">
          <span style="font-size: 11px; font-weight: 700; color: #9d174d;"><i class="fa-solid fa-percent"></i> Flat Discounts</span>
          <div style="font-size: 16px; font-weight: 900; color: #be185d; margin-top: 2px;">${currencySymbol}${Math.round(flatDiscount).toLocaleString("en-IN")}</div>
        </div>
      </div>

      <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: 10px; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; font-size: 12px;">
        <span style="font-weight: 600; color: var(--text-muted);">Total Promotional Savings Given:</span>
        <span style="font-weight: 900; color: #be185d; font-size: 13.5px;">-${currencySymbol}${Math.round(totalDiscounts).toLocaleString("en-IN")}</span>
      </div>
    `;
  },

  // 5. Customer Loyalty & Regulars Leaderboard
  renderCustomerLoyalty(orders, currencySymbol) {
    const tbody = document.getElementById("rep-loyalty-tbody");
    if (!tbody) return;

    const customerMap = {};
    orders.forEach(o => {
      const rawName = (o.customerName || "").trim();
      const rawPhone = (o.customerPhone || "").trim();
      
      // Filter out generic guest placeholders
      const lowerName = rawName.toLowerCase();
      if (!rawName || lowerName === "walk-in" || lowerName === "walk in" || lowerName === "walk-in guest" || lowerName === "guest") {
        if (!rawPhone) return;
      }

      const key = rawPhone || rawName.toLowerCase();
      if (!customerMap[key]) {
        customerMap[key] = {
          name: rawName || "Regular Guest",
          phone: rawPhone || "--",
          ordersCount: 0,
          totalSpent: 0
        };
      }
      customerMap[key].ordersCount++;
      customerMap[key].totalSpent += (Number(o.total) || 0);
    });

    const customerList = Object.values(customerMap).sort((a, b) => b.totalSpent - a.totalSpent);
    const totalCustomers = customerList.length;
    const repeatCustomers = customerList.filter(c => c.ordersCount >= 2).length;
    const repeatRate = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0;

    const rateBadge = document.getElementById("rep-repeat-rate-badge");
    if (rateBadge) rateBadge.textContent = `${repeatRate}% Repeat Rate`;

    const subtextEl = document.getElementById("rep-loyalty-subtext");
    if (subtextEl) subtextEl.textContent = `${totalCustomers} unique guests • ${repeatCustomers} repeat visitors in period`;

    if (customerList.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:25px; color:var(--text-muted); font-size:12px; font-weight:600;"><i class="fa-solid fa-address-book" style="margin-right:6px;"></i> Guest names/phone numbers added in POS terminal will appear here.</td></tr>`;
    } else {
      tbody.innerHTML = customerList.slice(0, 5).map(c => `
        <tr>
          <td style="font-weight: 700; color: var(--text-dark); display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-user-check" style="color: #10b981; font-size: 11px;"></i> ${c.name}
          </td>
          <td style="color: var(--text-muted); font-weight: 600; font-size: 12px;">${c.phone}</td>
          <td><span style="font-weight: 800; color: #10b981; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 2px 8px; border-radius: 10px; font-size: 11px;">${c.ordersCount} visits</span></td>
          <td style="text-align: right; font-weight: 800; color: #2563eb;">${currencySymbol}${Math.round(c.totalSpent).toLocaleString("en-IN")}</td>
        </tr>
      `).join("");
    }
  },

  // 6. Low Velocity / Menu Watchlist
  renderLowVelocityMenu(products, categories, itemSoldMap, currencySymbol) {
    const tbody = document.getElementById("rep-slow-items-tbody");
    if (!tbody) return;

    const activeProducts = products.filter(p => p.status !== "Inactive");
    const itemVelocityList = activeProducts.map(p => {
      const soldInfo = itemSoldMap[p.name];
      const categoryObj = categories.find(c => c.id === p.category);
      return {
        name: p.name,
        category: categoryObj ? categoryObj.name : "General",
        price: Number(p.price) || 0,
        quantitySold: soldInfo ? soldInfo.quantity : 0
      };
    }).sort((a, b) => a.quantitySold - b.quantitySold);

    const lowVelocityItems = itemVelocityList.slice(0, 5);

    if (lowVelocityItems.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:25px; color:var(--text-muted); font-size:12px; font-weight:600;">All active menu items are performing well.</td></tr>`;
    } else {
      tbody.innerHTML = lowVelocityItems.map(item => `
        <tr>
          <td style="font-weight: 700; color: var(--text-dark);">${item.name}</td>
          <td style="color: var(--text-muted); font-size: 12px;">${item.category}</td>
          <td style="color: var(--text-muted); font-weight: 600;">${currencySymbol}${item.price.toFixed(0)}</td>
          <td style="text-align: right;">
            <span style="font-weight: 800; color: ${item.quantitySold === 0 ? '#dc2626' : '#ea580c'}; background: ${item.quantitySold === 0 ? '#fef2f2' : '#fff7ed'}; border: 1px solid ${item.quantitySold === 0 ? '#fecaca' : '#ffedd5'}; padding: 2px 8px; border-radius: 10px; font-size: 11px;">
              ${item.quantitySold} sold
            </span>
          </td>
        </tr>
      `).join("");
    }
  },

  // 7. Day of Week Performance Matrix
  renderDayOfWeekPerformance(orders, currencySymbol) {
    const container = document.getElementById("rep-day-of-week-container");
    if (!container) return;

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayStats = dayNames.map((name, idx) => ({
      name,
      dayIdx: idx,
      sales: 0,
      orders: 0
    }));

    orders.forEach(o => {
      const d = new Date(o.createdAt);
      if (isNaN(d.getTime())) return;
      const dayIdx = d.getDay();
      dayStats[dayIdx].orders++;
      dayStats[dayIdx].sales += (Number(o.total) || 0);
    });

    let bestDayIdx = 0;
    let maxDaySales = 0;
    dayStats.forEach(ds => {
      if (ds.sales > maxDaySales) {
        maxDaySales = ds.sales;
        bestDayIdx = ds.dayIdx;
      }
    });

    const bestDayBadge = document.getElementById("rep-best-day-badge");
    if (bestDayBadge) {
      if (maxDaySales > 0) {
        bestDayBadge.textContent = `👑 Peak Day: ${dayNames[bestDayIdx]}`;
        bestDayBadge.style.color = "#b45309";
        bestDayBadge.style.background = "#fffbeb";
        bestDayBadge.style.borderColor = "#fde68a";
      } else {
        bestDayBadge.textContent = "Weekly Velocity";
      }
    }

    container.innerHTML = dayStats.map(ds => {
      const isTop = ds.dayIdx === bestDayIdx && maxDaySales > 0;
      return `
        <div style="background: ${isTop ? '#fffbeb' : '#f8fafc'}; border: ${isTop ? '1.5px solid #fde68a' : '1px solid var(--border-color)'}; border-radius: 10px; padding: 10px 8px; text-align: center; display: flex; flex-direction: column; justify-content: space-between; gap: 4px;">
          <div style="font-size: 11.5px; font-weight: 800; color: ${isTop ? '#b45309' : 'var(--text-dark)'};">
            ${ds.name} ${isTop ? '👑' : ''}
          </div>
          <div style="font-size: 13px; font-weight: 900; color: ${isTop ? '#b45309' : '#2563eb'};">
            ${currencySymbol}${Math.round(ds.sales).toLocaleString("en-IN")}
          </div>
          <div style="font-size: 10.5px; color: var(--text-muted); font-weight: 600;">
            ${ds.orders} bills
          </div>
        </div>
      `;
    }).join("");
  },

  renderReportsCharts(orders, categories, products) {
    const textMuted = '#64748b';
    const bgDarker = '#edf1f7';
    const borderColor = 'rgba(202, 213, 226, 0.6)';

    // 1. Line Trend Chart
    const datesLabel = [];
    const salesDataPoints = [];

    const [sY, sM, sD] = this.startDate.split('-').map(Number);
    const [eY, eM, eD] = this.endDate.split('-').map(Number);
    const start = new Date(sY, sM - 1, sD);
    const end = new Date(eY, eM - 1, eD);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = this.getLocalDateStr(d);
      datesLabel.push(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }));

      const daySales = orders
        .filter(o => {
          if (!o.createdAt) return false;
          const orderDate = new Date(o.createdAt);
          const dStr = !isNaN(orderDate.getTime()) ? this.getLocalDateStr(orderDate) : o.createdAt.substring(0, 10);
          return dStr === dateStr;
        })
        .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
      salesDataPoints.push(Math.round(daySales));
    }

    const curveCanvas = document.getElementById("repSalesCurveCanvas");
    if (curveCanvas) {
      const curveCtx = curveCanvas.getContext("2d");
      if (this.salesTrendChart) {
        this.salesTrendChart.destroy();
      }

      const fillGradient = curveCtx.createLinearGradient(0, 0, 0, 260);
      fillGradient.addColorStop(0, 'rgba(37, 99, 235, 0.20)');
      fillGradient.addColorStop(1, 'rgba(37, 99, 235, 0.00)');

      this.salesTrendChart = new Chart(curveCtx, {
        type: "line",
        data: {
          labels: datesLabel,
          datasets: [
            {
              label: "Sales Revenue (₹)",
              data: salesDataPoints,
              borderColor: "#2563eb",
              backgroundColor: fillGradient,
              borderWidth: 3,
              fill: true,
              tension: 0.25,
              pointBackgroundColor: "#2563eb",
              pointBorderColor: "#ffffff",
              pointHoverBackgroundColor: "#1d4ed8",
              pointHoverBorderColor: "#ffffff",
              pointRadius: 4,
              pointHoverRadius: 7
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: textMuted, font: { family: "Outfit", size: 12, weight: "bold" } } },
            tooltip: {
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              titleFont: { family: "Outfit", size: 13, weight: "bold" },
              bodyFont: { family: "Outfit", size: 12 },
              padding: 10,
              cornerRadius: 8
            }
          },
          scales: {
            x: {
              grid: { color: borderColor },
              ticks: { color: textMuted, font: { family: "Outfit", size: 11, weight: "600" } }
            },
            y: {
              grid: { color: borderColor },
              ticks: { color: textMuted, font: { family: "Outfit", size: 11, weight: "600" } }
            }
          }
        }
      });
    }

    // 2. Category Velocity Pie
    const catSalesSums = {};
    categories.forEach(c => {
      catSalesSums[c.name] = 0;
    });

    orders.forEach(o => {
      if (Array.isArray(o.items)) {
        o.items.forEach(item => {
          const prod = products.find(p => p.id === item.productId);
          if (prod) {
            const cat = categories.find(c => c.id === prod.category);
            if (cat) {
              catSalesSums[cat.name] = (catSalesSums[cat.name] || 0) + (Number(item.lineTotal) || 0);
            }
          }
        });
      }
    });

    const pieCanvas = document.getElementById("repCategoryPieCanvas");
    if (pieCanvas) {
      const pieCtx = pieCanvas.getContext("2d");
      if (this.categoryBreakdownChart) {
        this.categoryBreakdownChart.destroy();
      }

      const pieLabels = Object.keys(catSalesSums).filter(name => catSalesSums[name] > 0);
      const pieData = pieLabels.map(name => Math.round(catSalesSums[name]));

      this.categoryBreakdownChart = new Chart(pieCtx, {
        type: "doughnut",
        data: {
          labels: pieLabels.length === 0 ? ["No Sales"] : pieLabels,
          datasets: [
            {
              data: pieData.length === 0 ? [1] : pieData,
              backgroundColor: pieData.length === 0 ? [borderColor] : ["#2563eb", "#10b981", "#6366f1", "#0284c7", "#f59e0b", "#ec4899", "#8b5cf6", "#14b8a6", "#64748b"],
              borderWidth: 3,
              borderColor: bgDarker,
              borderRadius: pieData.length === 0 ? 0 : 4,
              hoverOffset: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "right",
              labels: { color: textMuted, font: { family: "Outfit", size: 12, weight: "bold" }, padding: 12 }
            },
            tooltip: {
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              titleFont: { family: "Outfit", size: 13, weight: "bold" },
              bodyFont: { family: "Outfit", size: 12 },
              padding: 10,
              cornerRadius: 8,
              callbacks: {
                label: function(context) {
                  if (pieData.length === 0) return " No sales logged";
                  return ` ${context.label}: ₹${context.raw}`;
                }
              }
            }
          },
          cutout: "65%"
        }
      });
    }

    // 3. NEW: Hourly Rush Pattern Bar Chart (2 PM – 12 AM)
    const rushCanvas = document.getElementById("repHourlyRushCanvas");
    if (rushCanvas) {
      const rushCtx = rushCanvas.getContext("2d");
      if (this.hourlyRushChart) {
        this.hourlyRushChart.destroy();
      }

      // Operational Hours: 14 to 23 (2 PM to 11 PM, covering up to midnight closing)
      const opHours = [14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
      const rushLabels = ["2 PM", "3 PM", "4 PM", "5 PM", "6 PM", "7 PM", "8 PM", "9 PM", "10 PM", "11 PM"];
      const rushSales = opHours.map(() => 0);
      const rushBills = opHours.map(() => 0);

      // Colors matching the 4 shifts
      const barColors = opHours.map(h => {
        if (h >= 14 && h < 17) return "#f59e0b"; // Afternoon (2-5)
        if (h >= 17 && h < 19) return "#ea580c"; // Evening (5-7)
        if (h >= 19 && h < 22) return "#7c3aed"; // Dinner Rush (7-10)
        return "#4f46e5"; // Late Night (10-12)
      });

      orders.forEach(o => {
        const d = new Date(o.createdAt);
        if (isNaN(d.getTime())) return;
        const h = d.getHours();
        const amt = Number(o.total) || 0;
        const idx = opHours.indexOf(h);
        if (idx !== -1) {
          rushSales[idx] += amt;
          rushBills[idx]++;
        }
      });

      this.hourlyRushChart = new Chart(rushCtx, {
        type: "bar",
        data: {
          labels: rushLabels,
          datasets: [
            {
              label: "Sales Revenue (₹)",
              data: rushSales.map(Math.round),
              backgroundColor: barColors,
              borderRadius: 6,
              borderSkipped: false
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              titleFont: { family: "Outfit", size: 13, weight: "bold" },
              bodyFont: { family: "Outfit", size: 12 },
              padding: 10,
              cornerRadius: 8,
              callbacks: {
                title: function(items) {
                  const idx = items[0].dataIndex;
                  const h = opHours[idx];
                  let shiftName = "Late Night (10-12)";
                  if (h >= 14 && h < 17) shiftName = "Afternoon Shift (2-5)";
                  else if (h >= 17 && h < 19) shiftName = "Evening Shift (5-7)";
                  else if (h >= 19 && h < 22) shiftName = "Dinner Rush (7-10)";
                  return `${rushLabels[idx]} (${shiftName})`;
                },
                label: function(context) {
                  const idx = context.dataIndex;
                  return [
                    ` Revenue: ₹${context.raw.toLocaleString("en-IN")}`,
                    ` Orders: ${rushBills[idx]} bills`
                  ];
                }
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: textMuted, font: { family: "Outfit", size: 11, weight: "600" } }
            },
            y: {
              grid: { color: borderColor },
              ticks: { color: textMuted, font: { family: "Outfit", size: 11, weight: "600" } }
            }
          }
        }
      });
    }
  },

  exportReportToCSV() {
    const orders = window.db.get("orders") || [];
    const startStr = this.startDate;
    const endStr = this.endDate;
    const filtered = orders.filter(o => {
      if (!o.createdAt) return false;
      const orderDate = new Date(o.createdAt);
      const d = !isNaN(orderDate.getTime()) ? this.getLocalDateStr(orderDate) : o.createdAt.substring(0, 10);
      return d >= startStr && d <= endStr;
    });

    if (filtered.length === 0) {
      window.showToast("No data to export.", "error");
      return;
    }

    let csv = "Order ID,Date,Customer,Type,Payment Mode,Subtotal,BOGO Discount,Cash Discount,Grand Total,Status\r\n";
    filtered.forEach(o => {
      csv += `ORD-${o.orderNumber},"${o.createdAt}",` +
             `"${(o.customerName || '').replace(/"/g, '""')}",` +
             `"${o.type || 'Dine-in'}","${o.paymentMethod || 'Cash'}",` +
             `${(Number(o.subtotal) || 0).toFixed(2)},${(Number(o.bogoDiscount) || 0).toFixed(2)},` +
             `${(Number(o.discount) || 0).toFixed(2)},${(Number(o.total) || 0).toFixed(2)},"${o.status}"\r\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `CC_Sales_Report_${startStr}_to_${endStr}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.showToast("CSV file successfully downloaded.", "success");
  }
};
