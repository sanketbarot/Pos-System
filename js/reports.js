// Crust & Chilly POS - Sales & Revenue Analytics Module
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
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);

    this.startDate = this.getLocalDateStr(lastWeek);
    this.endDate = this.getLocalDateStr(today);

    container.innerHTML = `
      <div class="view-animate" style="display: flex; flex-direction: column; gap: 18px; max-width: 100%; width: 100%; overflow-x: hidden;">
        
        <!-- Date Filters Control Panel Bar -->
        <div class="glass-card report-filter-bar" style="padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div class="report-dates-group" style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
            <span style="font-size: 13.5px; font-weight: 800; color: var(--text-dark); white-space: nowrap; display: flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-chart-pie" style="color: #2563eb;"></i> Analytics Period:
            </span>
            
            <!-- Quick Preset Pills -->
            <div style="display: flex; gap: 6px; flex-wrap: wrap;" id="rep-preset-group">
              <button type="button" class="btn-rep-preset" data-range="today" style="background: #f1f5f9; border: 1px solid var(--border-color); border-radius: 8px; padding: 5px 11px; font-size: 11.5px; font-weight: 700; cursor: pointer; color: var(--text-dark); transition: all 0.2s;">Today</button>
              <button type="button" class="btn-rep-preset" data-range="yesterday" style="background: #f1f5f9; border: 1px solid var(--border-color); border-radius: 8px; padding: 5px 11px; font-size: 11.5px; font-weight: 700; cursor: pointer; color: var(--text-dark); transition: all 0.2s;">Yesterday</button>
              <button type="button" class="btn-rep-preset active" data-range="last7" style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 5px 11px; font-size: 11.5px; font-weight: 700; cursor: pointer; color: #2563eb; transition: all 0.2s;">Last 7 Days</button>
              <button type="button" class="btn-rep-preset" data-range="thisMonth" style="background: #f1f5f9; border: 1px solid var(--border-color); border-radius: 8px; padding: 5px 11px; font-size: 11.5px; font-weight: 700; cursor: pointer; color: var(--text-dark); transition: all 0.2s;">This Month</button>
            </div>

            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-left: 2px;">
              <input type="date" id="report-start-date" class="form-input" style="height: 35px; font-size: 12px; padding: 4px 10px; border-radius: 10px; width: 135px;" value="${this.startDate}">
              <span style="font-size: 12px; color: var(--text-muted); font-weight: 600;">to</span>
              <input type="date" id="report-end-date" class="form-input" style="height: 35px; font-size: 12px; padding: 4px 10px; border-radius: 10px; width: 135px;" value="${this.endDate}">
            </div>
            <button class="btn btn-primary" id="btn-reports-apply-filter" style="padding: 0 16px; height: 35px; font-size: 12px; border-radius: 10px; font-weight: 700;">
              Apply Filter
            </button>
          </div>

          <!-- Utility Operations Toolbar -->
          <div class="report-actions-group" style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="btn btn-secondary" id="btn-report-export-csv" style="padding: 0 14px; height: 35px; font-size: 12px; border-radius: 10px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-file-csv" style="color: #2563eb;"></i> Export CSV
            </button>
            <button class="btn btn-secondary" id="btn-report-print-summary" style="padding: 0 14px; height: 35px; font-size: 12px; border-radius: 10px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-print" style="color: #4b5563;"></i> Print Summary
            </button>
          </div>
        </div>

        <!-- 4 Top Executive Scorecard Cards -->
        <div class="dashboard-grid-stats" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin-bottom: 0;">
          
          <!-- Gross Revenue -->
          <div class="glass-card stat-card" style="border-left: 4px solid #2563eb; padding: 14px 16px;">
            <div class="stat-info">
              <span class="stat-label">Gross Sales</span>
              <span class="stat-value" id="rep-total-sales" style="color: #2563eb; font-size: 26px; font-weight: 900;">₹0</span>
              <span class="stat-change" id="rep-total-orders-sub" style="color: var(--text-muted); font-weight: 700; font-size: 11.5px;">0 orders placed</span>
            </div>
            <div class="stat-icon-wrapper" style="background: #eff6ff; border-color: #bfdbfe; color: #2563eb;">
              <i class="fa-solid fa-calculator"></i>
            </div>
          </div>

          <!-- Net Revenue -->
          <div class="glass-card stat-card" style="border-left: 4px solid #10b981; padding: 14px 16px;">
            <div class="stat-info">
              <span class="stat-label">Net Revenue</span>
              <span class="stat-value" id="rep-net-sales" style="color: #10b981; font-size: 26px; font-weight: 900;">₹0</span>
              <span class="stat-change" id="rep-net-sales-sub" style="color: var(--text-muted); font-weight: 600; font-size: 11.5px;">Realized order collection</span>
            </div>
            <div class="stat-icon-wrapper" style="background: #ecfdf5; border-color: #a7f3d0; color: #059669;">
              <i class="fa-solid fa-wallet"></i>
            </div>
          </div>

          <!-- Average Order Value (AOV) -->
          <div class="glass-card stat-card" style="border-left: 4px solid #06b6d4; padding: 14px 16px;">
            <div class="stat-info">
              <span class="stat-label">Average Order (AOV)</span>
              <span class="stat-value" id="rep-aov" style="color: #0891b2; font-size: 26px; font-weight: 900;">₹0</span>
              <span class="stat-change" id="rep-aov-sub" style="color: var(--text-muted); font-weight: 600; font-size: 11.5px;">Average spend per ticket</span>
            </div>
            <div class="stat-icon-wrapper" style="background: #ecfeff; border-color: #a5f3fc; color: #0891b2;">
              <i class="fa-solid fa-chart-simple"></i>
            </div>
          </div>

          <!-- Total Discounts -->
          <div class="glass-card stat-card" style="border-left: 4px solid #f59e0b; padding: 14px 16px;">
            <div class="stat-info">
              <span class="stat-label">Discounts Given</span>
              <span class="stat-value" id="rep-total-discounts" style="color: #f59e0b; font-size: 26px; font-weight: 900;">₹0</span>
              <span class="stat-change" id="rep-total-discounts-sub" style="color: var(--text-muted); font-weight: 600; font-size: 11.5px;">BOGO + Offers</span>
            </div>
            <div class="stat-icon-wrapper" style="background: #fffbeb; border-color: #fde68a; color: #d97706;">
              <i class="fa-solid fa-tags"></i>
            </div>
          </div>

        </div>

        <!-- Charts Segment 1: Sales Trend Line + Category Breakdown -->
        <div class="dashboard-charts-row" style="margin-bottom: 0;">
          
          <!-- Sales Trend Line Chart -->
          <div class="glass-card chart-card">
            <div class="flex-space mb-3" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
              <div>
                <h3 style="font-size: 15px; font-weight: 800; color: var(--text-dark); margin: 0;">
                  <i class="fa-solid fa-chart-line" style="color: #2563eb; margin-right: 6px;"></i> Revenue Analytics Trend Curve
                </h3>
                <div style="font-size: 11px; color: var(--text-muted); font-weight: 600; margin-top: 2px;">
                  Daily sales revenue trajectory for selected period
                </div>
              </div>
              <span style="font-size: 11px; color: #2563eb; background: #eff6ff; border: 1px solid #bfdbfe; padding: 2px 8px; border-radius: 10px; font-weight: 800; text-transform: uppercase;">
                Sales Curve
              </span>
            </div>
            <div class="chart-container">
              <canvas id="repSalesCurveCanvas"></canvas>
            </div>
          </div>

          <!-- Category Breakdown Pie -->
          <div class="glass-card chart-card">
            <div class="flex-space mb-3" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
              <div>
                <h3 style="font-size: 15px; font-weight: 800; color: var(--text-dark); margin: 0;">
                  <i class="fa-solid fa-pizza-slice" style="color: #2563eb; margin-right: 6px;"></i> Category Revenue Share
                </h3>
                <div style="font-size: 11px; color: var(--text-muted); font-weight: 600; margin-top: 2px;">
                  Sales contribution across food categories
                </div>
              </div>
              <span style="font-size: 11px; color: #10b981; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 2px 8px; border-radius: 10px; font-weight: 800; text-transform: uppercase;">Category Velocity</span>
            </div>
            <div class="chart-container">
              <canvas id="repCategoryPieCanvas"></canvas>
            </div>
          </div>
        </div>

        <!-- Charts Segment 2: Hourly Rush Curve (2 PM – 12 AM) + Day of Week Matrix -->
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

          <!-- Insight Card 2: Cash & Payment Collection Reconciliation -->
          <div class="dash-insight-card">
            <div class="insight-header">
              <div class="insight-title">
                <i class="fa-solid fa-cash-register" style="color: #059669;"></i> Cash & Payment Reconciliation
              </div>
              <span class="insight-badge" id="rep-payment-summary-badge" style="background: #ecfdf5; color: #065f46; border-color: #a7f3d0;">Period Total</span>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 8px;" id="rep-cash-reconcile-container">
              <!-- Injected dynamically -->
            </div>
          </div>

          <!-- Insight Card 3: Shift Rush & Peak Hours -->
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
            <div class="flex-space mb-3" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
              <div>
                <h3 style="font-size: 15px; font-weight: 800; color: var(--text-dark); margin: 0;">
                  <i class="fa-solid fa-list-ol" style="color: #2563eb; margin-right: 6px;"></i> Menu Item Sales Velocity
                </h3>
                <div style="font-size: 11px; color: var(--text-muted); font-weight: 600; margin-top: 2px;">
                  Item description, price, volume sold, and total revenue generated
                </div>
              </div>
              <span class="badge badge-ready">Top Sellers First</span>
            </div>
            <div class="table-container" style="max-height: 340px; overflow-y: auto; overflow-x: auto; width: 100%; -webkit-overflow-scrolling: touch; flex-grow: 1;">
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

          <!-- Payment collection stats & Cashless Index -->
          <div class="glass-card" style="display: flex; flex-direction: column; justify-content: space-between; gap: 16px;">
            <div>
              <div class="flex-space mb-3" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
                <div>
                  <h3 style="font-size: 15px; font-weight: 800; color: var(--text-dark); margin: 0;">
                    <i class="fa-solid fa-credit-card" style="color: #2563eb; margin-right: 6px;"></i> Payment Collection Split
                  </h3>
                  <div style="font-size: 11px; color: var(--text-muted); font-weight: 600; margin-top: 2px;">
                    Cash vs UPI QR vs Card adoption
                  </div>
                </div>
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
            <div id="rep-cashless-summary" style="font-size: 12px; color: var(--text-muted); text-align: center; border-top: 1px solid rgba(202, 213, 226, 0.6); padding-top: 12px; font-weight: 700;">
              Cashless digital collection: 0%
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
                <div style="font-size: 11px; color: var(--text-muted); font-weight: 600; margin-top: 2px;" id="rep-slow-items-subtext">
                  Items with 0 sales in selected period
                </div>
              </div>
              <span class="badge" style="background: #fef2f2; color: #dc2626; border: 1px solid #fecaca;" id="rep-slow-items-badge">0 Unsold Items</span>
            </div>
            <div class="table-container" style="max-height: 280px; overflow-y: auto; overflow-x: auto; width: 100%; -webkit-overflow-scrolling: touch; flex-grow: 1;">
              <table class="premium-table" style="font-size: 13px;">
                <thead>
                  <tr>
                    <th>Menu Item</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th style="text-align: right;">Sales Status</th>
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
        window.showToast(`Showing analytics: ${this.startDate} to ${this.endDate}`, "info");
      });
    });

    if (btnApply) {
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
    }

    if (btnExport) {
      btnExport.onclick = () => this.exportReportToCSV();
    }

    if (btnPrint) {
      btnPrint.onclick = () => this.showPrintSummaryModal();
    }
  },

  processDataAndRender() {
    const orders = window.db.get("orders") || [];
    const products = window.db.get("products") || [];
    const categories = window.db.get("categories") || [];
    const settings = window.db.get("settings") || {};
    const currency = settings.currencySymbol || "₹";

    const startStr = this.startDate;
    const endStr = this.endDate;

    // Filter non-cancelled orders inside the date range
    const filteredValidOrders = orders.filter(o => {
      if (!o.createdAt || o.status === "Cancelled") return false;
      const orderDate = new Date(o.createdAt);
      const d = !isNaN(orderDate.getTime()) ? this.getLocalDateStr(orderDate) : o.createdAt.substring(0, 10);
      return d >= startStr && d <= endStr;
    });

    // 1. Gross Revenue & Payment Breakdowns
    let cashTotal = 0;
    let upiTotal = 0;
    let cardTotal = 0;
    let grossRevenue = 0;

    filteredValidOrders.forEach(o => {
      const amt = Number(o.total) || 0;
      grossRevenue += amt;
      const pm = (o.paymentMethod || "UPI").toLowerCase();
      if (pm === "cash") cashTotal += amt;
      else if (pm === "card") cardTotal += amt;
      else upiTotal += amt;
    });

    // 2. Total Discounts given
    const totalDiscounts = filteredValidOrders.reduce((sum, o) => sum + (Number(o.discount) || 0) + (Number(o.bogoDiscount) || 0), 0);
    const bogoDiscounts = filteredValidOrders.reduce((sum, o) => sum + (Number(o.bogoDiscount) || 0), 0);
    const cashDiscounts = filteredValidOrders.reduce((sum, o) => sum + (Number(o.discount) || 0), 0);

    // 3. Net Revenue & AOV
    const netRevenue = grossRevenue;
    const aov = filteredValidOrders.length > 0 ? (grossRevenue / filteredValidOrders.length) : 0;

    // Update Top 4 Scorecard Elements
    const totalSalesEl = document.getElementById("rep-total-sales");
    const totalOrdersSubEl = document.getElementById("rep-total-orders-sub");
    const netSalesEl = document.getElementById("rep-net-sales");
    const netSalesSubEl = document.getElementById("rep-net-sales-sub");
    const aovEl = document.getElementById("rep-aov");
    const aovSubEl = document.getElementById("rep-aov-sub");
    const totalDiscountsEl = document.getElementById("rep-total-discounts");
    const totalDiscountsSubEl = document.getElementById("rep-total-discounts-sub");

    if (totalSalesEl) totalSalesEl.textContent = `${currency}${Math.round(grossRevenue).toLocaleString("en-IN")}`;
    if (totalOrdersSubEl) totalOrdersSubEl.textContent = `${filteredValidOrders.length} valid orders placed`;
    if (netSalesEl) netSalesEl.textContent = `${currency}${Math.round(netRevenue).toLocaleString("en-IN")}`;
    if (netSalesSubEl) netSalesSubEl.textContent = `${filteredValidOrders.length} completed transactions`;
    if (aovEl) aovEl.textContent = `${currency}${Math.round(aov).toLocaleString("en-IN")}`;
    if (aovSubEl) aovSubEl.textContent = `Avg: ${currency}${Math.round(aov)} / bill`;
    if (totalDiscountsEl) totalDiscountsEl.textContent = `${currency}${Math.round(totalDiscounts).toLocaleString("en-IN")}`;
    if (totalDiscountsSubEl) totalDiscountsSubEl.textContent = `BOGO: ${currency}${Math.round(bogoDiscounts).toLocaleString("en-IN")} | Off: ${currency}${Math.round(cashDiscounts).toLocaleString("en-IN")}`;

    // Total Transactions badge
    const badgeOrders = document.getElementById("rep-total-orders-badge");
    if (badgeOrders) badgeOrders.textContent = `${filteredValidOrders.length} Transactions`;

    // 4. Itemized Sales Velocity
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

    if (itemTableBody) {
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
    }

    // 5. Payment Collection Split
    const paySplitCounts = { UPI: 0, Cash: 0, Card: 0 };
    const paySplitAmounts = { UPI: 0, Cash: 0, Card: 0 };

    filteredValidOrders.forEach(o => {
      const pm = (o.paymentMethod || "UPI").toLowerCase();
      let mode = "UPI";
      if (pm === "cash") mode = "Cash";
      else if (pm === "card") mode = "Card";

      paySplitCounts[mode]++;
      paySplitAmounts[mode] += (Number(o.total) || 0);
    });

    const payTableBody = document.getElementById("rep-payment-split-tbody");
    if (payTableBody) {
      payTableBody.innerHTML = ["UPI", "Cash", "Card"].map(mode => `
        <tr>
          <td style="font-weight: 700; padding: 10px 14px; color: var(--text-dark);"><i class="fa-solid fa-circle" style="color: ${mode === 'UPI' ? '#2563eb' : mode==='Cash' ? '#10b981' : '#6366f1'}; font-size: 8px; margin-right: 8px;"></i> ${mode}</td>
          <td style="padding: 10px 14px; color: var(--text-muted); font-weight: 600;">${paySplitCounts[mode]} transactions</td>
          <td style="text-align: right; font-weight: 800; color: #2563eb; padding: 10px 14px;">${currency}${paySplitAmounts[mode].toFixed(2)}</td>
        </tr>
      `).join("");
    }

    const cashlessSummaryEl = document.getElementById("rep-cashless-summary");
    if (cashlessSummaryEl) {
      const cashlessAmt = paySplitAmounts.UPI + paySplitAmounts.Card;
      const cashlessPercent = grossRevenue > 0 ? Math.round((cashlessAmt / grossRevenue) * 100) : 0;
      cashlessSummaryEl.textContent = `Cashless digital adoption: ${cashlessPercent}% (${currency}${Math.round(cashlessAmt).toLocaleString("en-IN")})`;
    }

    // 6. Render Cash & Payment Reconciliation (replacing expense card)
    this.renderCashReconciliation(cashTotal, upiTotal, cardTotal, grossRevenue, currency);

    // 7. Render Fulfillment Channels & Shifts
    this.renderOrderChannels(filteredValidOrders, grossRevenue, currency);
    this.renderShiftsAndPeak(filteredValidOrders, currency);
    this.renderDiscountsImpact(filteredValidOrders, grossRevenue, currency);

    // 8. Customer Loyalty & Low Velocity
    this.renderCustomerLoyalty(filteredValidOrders, currency);
    this.renderLowVelocityMenu(products, categories, itemSoldMap, currency);

    // 9. Day of Week Performance
    this.renderDayOfWeekPerformance(filteredValidOrders, currency);

    // 10. Charts (Trend, Categories, Hourly Rush)
    this.renderReportsCharts(filteredValidOrders, categories, products);
  },

  renderCashReconciliation(cashTotal, upiTotal, cardTotal, grossRevenue, currencySymbol) {
    const container = document.getElementById("rep-cash-reconcile-container");
    const badge = document.getElementById("rep-payment-summary-badge");
    if (badge) badge.textContent = `${currencySymbol}${Math.round(grossRevenue).toLocaleString("en-IN")} Total`;
    if (!container) return;

    const cashPct = grossRevenue > 0 ? Math.round((cashTotal / grossRevenue) * 100) : 0;
    const upiPct = grossRevenue > 0 ? Math.round((upiTotal / grossRevenue) * 100) : 0;
    const cardPct = grossRevenue > 0 ? Math.round((cardTotal / grossRevenue) * 100) : 0;

    container.innerHTML = `
      <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: 10px; padding: 10px 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <span style="font-size: 12px; font-weight: 700; color: #059669; display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-money-bill-wave"></i> Cash Collected (Till):
          </span>
          <span style="font-size: 13.5px; font-weight: 900; color: #059669;">${currencySymbol}${Math.round(cashTotal).toLocaleString("en-IN")}</span>
        </div>
        <div style="height: 5px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
          <div style="width: ${cashPct}%; height: 100%; background: #10b981; border-radius: 3px;"></div>
        </div>
        <div style="font-size: 10.5px; color: var(--text-muted); text-align: right; margin-top: 2px;">${cashPct}% of total sales</div>
      </div>

      <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: 10px; padding: 10px 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <span style="font-size: 12px; font-weight: 700; color: #2563eb; display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-qrcode"></i> UPI Online Received:
          </span>
          <span style="font-size: 13.5px; font-weight: 900; color: #2563eb;">${currencySymbol}${Math.round(upiTotal).toLocaleString("en-IN")}</span>
        </div>
        <div style="height: 5px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
          <div style="width: ${upiPct}%; height: 100%; background: #2563eb; border-radius: 3px;"></div>
        </div>
        <div style="font-size: 10.5px; color: var(--text-muted); text-align: right; margin-top: 2px;">${upiPct}% of total sales</div>
      </div>

      ${cardTotal > 0 ? `
        <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: 10px; padding: 10px 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-size: 12px; font-weight: 700; color: #7c3aed; display: flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-credit-card"></i> Card Swiped:
            </span>
            <span style="font-size: 13.5px; font-weight: 900; color: #7c3aed;">${currencySymbol}${Math.round(cardTotal).toLocaleString("en-IN")}</span>
          </div>
          <div style="height: 5px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
            <div style="width: ${cardPct}%; height: 100%; background: #7c3aed; border-radius: 3px;"></div>
          </div>
          <div style="font-size: 10.5px; color: var(--text-muted); text-align: right; margin-top: 2px;">${cardPct}% of total sales</div>
        </div>
      ` : ''}
    `;
  },

  renderOrderChannels(orders, grossSales, currencySymbol) {
    const container = document.getElementById("rep-order-types-container");
    if (!container) return;

    let dineCount = 0, dineSales = 0;
    let takeCount = 0, takeSales = 0;

    orders.forEach(o => {
      const type = (o.type || "Dine-in").toLowerCase();
      const amt = Number(o.total) || 0;
      if (type.includes("takeaway") || type.includes("parcel")) {
        takeCount++;
        takeSales += amt;
      } else {
        dineCount++;
        dineSales += amt;
      }
    });

    const badge = document.getElementById("rep-orders-channel-badge");
    if (badge) badge.textContent = `${orders.length} Bills Total`;

    const dinePct = grossSales > 0 ? Math.round((dineSales / grossSales) * 100) : 0;
    const takePct = grossSales > 0 ? Math.round((takeSales / grossSales) * 100) : 0;

    container.innerHTML = `
      <div>
        <div style="display: flex; justify-content: space-between; font-size: 11.5px; font-weight: 700; margin-bottom: 3px;">
          <span style="color: var(--text-dark);"><i class="fa-solid fa-chair" style="color: #2563eb;"></i> Dine-in (${dineCount} bills)</span>
          <span style="color: #2563eb;">${currencySymbol}${Math.round(dineSales).toLocaleString("en-IN")} (${dinePct}%)</span>
        </div>
        <div style="height: 6px; background: #eff6ff; border-radius: 4px; overflow: hidden;">
          <div style="width: ${dinePct}%; height: 100%; background: #2563eb; border-radius: 4px;"></div>
        </div>
      </div>

      <div>
        <div style="display: flex; justify-content: space-between; font-size: 11.5px; font-weight: 700; margin-bottom: 3px;">
          <span style="color: var(--text-dark);"><i class="fa-solid fa-bag-shopping" style="color: #f59e0b;"></i> Takeaway & Parcel (${takeCount} bills)</span>
          <span style="color: #d97706;">${currencySymbol}${Math.round(takeSales).toLocaleString("en-IN")} (${takePct}%)</span>
        </div>
        <div style="height: 6px; background: #fffbeb; border-radius: 4px; overflow: hidden;">
          <div style="width: ${takePct}%; height: 100%; background: #f59e0b; border-radius: 4px;"></div>
        </div>
      </div>
    `;
  },

  renderShiftsAndPeak(orders, currencySymbol) {
    const container = document.getElementById("rep-shifts-container");
    if (!container) return;

    const shifts = [
      { name: "Afternoon Shift (2 PM - 5 PM)", hours: [14, 15, 16], color: "#f59e0b", sales: 0, count: 0 },
      { name: "Evening Shift (5 PM - 7 PM)", hours: [17, 18], color: "#ea580c", sales: 0, count: 0 },
      { name: "Dinner Rush (7 PM - 10 PM)", hours: [19, 20, 21], color: "#7c3aed", sales: 0, count: 0 },
      { name: "Late Night (10 PM - 12 AM)", hours: [22, 23], color: "#4f46e5", sales: 0, count: 0 }
    ];

    orders.forEach(o => {
      if (!o.createdAt) return;
      const h = new Date(o.createdAt).getHours();
      const amt = Number(o.total) || 0;
      shifts.forEach(s => {
        if (s.hours.includes(h)) {
          s.sales += amt;
          s.count++;
        }
      });
    });

    let peakShift = shifts[0];
    shifts.forEach(s => {
      if (s.sales > peakShift.sales) peakShift = s;
    });

    const badge = document.getElementById("rep-peak-hour-badge");
    if (badge) {
      badge.textContent = peakShift.sales > 0 ? `Peak: ${peakShift.name.split('(')[0].trim()}` : "No Rush";
    }

    container.innerHTML = shifts.map(s => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; border-radius: 8px; background: #f8fafc; border: 1px solid var(--border-color); font-size: 11.5px;">
        <span style="font-weight: 700; color: var(--text-dark); display: flex; align-items: center; gap: 6px;">
          <i class="fa-solid fa-circle" style="color: ${s.color}; font-size: 7px;"></i> ${s.name}
        </span>
        <span style="font-weight: 800; color: ${s.color};">${currencySymbol}${Math.round(s.sales).toLocaleString("en-IN")} (${s.count} bills)</span>
      </div>
    `).join("");
  },

  renderDiscountsImpact(orders, grossSales, currencySymbol) {
    const container = document.getElementById("rep-discounts-container");
    if (!container) return;

    const bogoDiscounts = orders.reduce((sum, o) => sum + (Number(o.bogoDiscount) || 0), 0);
    const flatDiscounts = orders.reduce((sum, o) => sum + (Number(o.discount) || 0), 0);
    const totalDiscounts = bogoDiscounts + flatDiscounts;
    const rate = grossSales > 0 ? ((totalDiscounts / (grossSales + totalDiscounts)) * 100).toFixed(1) : 0;

    const badge = document.getElementById("rep-discount-rate-badge");
    if (badge) badge.textContent = `${rate}% Discount Rate`;

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; padding: 6px 10px; border-radius: 8px; background: #f8fafc; font-size: 11.5px;">
        <span style="font-weight: 700; color: var(--text-dark);">BOGO Special Offer Discounts:</span>
        <span style="font-weight: 800; color: #16a34a;">${currencySymbol}${Math.round(bogoDiscounts).toLocaleString("en-IN")}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 6px 10px; border-radius: 8px; background: #f8fafc; font-size: 11.5px;">
        <span style="font-weight: 700; color: var(--text-dark);">Flat Off / Coupon Deductions:</span>
        <span style="font-weight: 800; color: #2563eb;">${currencySymbol}${Math.round(flatDiscounts).toLocaleString("en-IN")}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 6px 10px; border-radius: 8px; background: #fff1f2; border: 1px solid #fecdd3; font-size: 12px; font-weight: 800;">
        <span style="color: #9f1239;">Total Customer Savings:</span>
        <span style="color: #be123c;">${currencySymbol}${Math.round(totalDiscounts).toLocaleString("en-IN")}</span>
      </div>
    `;
  },

  renderCustomerLoyalty(orders, currencySymbol) {
    const tbody = document.getElementById("rep-loyalty-tbody");
    if (!tbody) return;

    const customerMap = {};
    orders.forEach(o => {
      const rawName = (o.customerName || "").trim();
      const rawPhone = (o.customerPhone || "").trim();
      
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

  renderLowVelocityMenu(products, categories, itemSoldMap, currencySymbol) {
    const tbody = document.getElementById("rep-slow-items-tbody");
    if (!tbody) return;

    const activeProducts = products.filter(p => p.status !== "Inactive");
    const unsoldItems = activeProducts.filter(p => !itemSoldMap[p.name]);

    const badge = document.getElementById("rep-slow-items-badge");
    if (badge) badge.textContent = `${unsoldItems.length} Unsold Items`;

    if (unsoldItems.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:25px; color:#059669; font-weight:700;"><i class="fa-solid fa-circle-check"></i> Great job! All active menu items have recorded sales!</td></tr>`;
    } else {
      tbody.innerHTML = unsoldItems.slice(0, 6).map(p => {
        const cat = categories.find(c => c.id === p.category);
        return `
          <tr>
            <td style="font-weight: 700; color: var(--text-dark);">${p.name}</td>
            <td style="color: var(--text-muted); font-size: 11.5px;">${cat ? cat.name : '--'}</td>
            <td style="font-weight: 700; color: var(--text-dark);">${currencySymbol}${p.price}</td>
            <td style="text-align: right;"><span style="font-size: 10.5px; font-weight: 800; color: #dc2626; background: #fef2f2; border: 1px solid #fecaca; padding: 2px 7px; border-radius: 6px;">0 Sold</span></td>
          </tr>
        `;
      }).join("");
    }
  },

  renderDayOfWeekPerformance(orders, currencySymbol) {
    const container = document.getElementById("rep-day-of-week-container");
    if (!container) return;

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayStats = dayNames.map((name, idx) => ({ name, dayIdx: idx, sales: 0, orders: 0 }));

    orders.forEach(o => {
      if (!o.createdAt) return;
      const d = new Date(o.createdAt);
      if (isNaN(d.getTime())) return;
      const dayIdx = d.getDay();
      dayStats[dayIdx].sales += (Number(o.total) || 0);
      dayStats[dayIdx].orders++;
    });

    let bestDayIdx = 0;
    let maxDaySales = 0;
    dayStats.forEach(ds => {
      if (ds.sales > maxDaySales) {
        maxDaySales = ds.sales;
        bestDayIdx = ds.dayIdx;
      }
    });

    const badge = document.getElementById("rep-best-day-badge");
    if (badge && maxDaySales > 0) {
      badge.textContent = `Best: ${dayNames[bestDayIdx]} (${currencySymbol}${Math.round(maxDaySales).toLocaleString("en-IN")})`;
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

    // 1. Single Clean Sales Trend Line Chart with Smooth Blue Gradient
    const datesLabel = [];
    const salesDataPoints = [];
    const orderCountPoints = [];

    const [sY, sM, sD] = this.startDate.split('-').map(Number);
    const [eY, eM, eD] = this.endDate.split('-').map(Number);
    const start = new Date(sY, sM - 1, sD);
    const end = new Date(eY, eM - 1, eD);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = this.getLocalDateStr(d);
      datesLabel.push(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }));

      const matchingOrders = orders.filter(o => {
        if (!o.createdAt) return false;
        const orderDate = new Date(o.createdAt);
        const dStr = !isNaN(orderDate.getTime()) ? this.getLocalDateStr(orderDate) : o.createdAt.substring(0, 10);
        return dStr === dateStr;
      });

      const daySales = matchingOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
      salesDataPoints.push(Math.round(daySales));
      orderCountPoints.push(matchingOrders.length);
    }

    const curveCanvas = document.getElementById("repSalesCurveCanvas");
    if (curveCanvas) {
      const curveCtx = curveCanvas.getContext("2d");
      if (this.salesTrendChart) {
        this.salesTrendChart.destroy();
      }

      const fillGradient = curveCtx.createLinearGradient(0, 0, 0, 260);
      fillGradient.addColorStop(0, 'rgba(37, 99, 235, 0.22)');
      fillGradient.addColorStop(1, 'rgba(37, 99, 235, 0.01)');

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
              tension: 0.25,
              fill: true,
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
              cornerRadius: 8,
              callbacks: {
                label: function(ctx) {
                  const idx = ctx.dataIndex;
                  return [
                    ` Revenue: ₹${ctx.raw.toLocaleString("en-IN")}`,
                    ` Orders: ${orderCountPoints[idx]} bills`
                  ];
                }
              }
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
    categories.forEach(c => { catSalesSums[c.name] = 0; });

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
              labels: { color: textMuted, font: { family: "Outfit", size: 11.5, weight: "bold" }, padding: 10 }
            },
            tooltip: {
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              titleFont: { family: "Outfit", size: 12, weight: "bold" },
              bodyFont: { family: "Outfit", size: 11.5 },
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

    // 3. Hourly Rush Pattern
    const rushCanvas = document.getElementById("repHourlyRushCanvas");
    if (rushCanvas) {
      const rushCtx = rushCanvas.getContext("2d");
      if (this.hourlyRushChart) {
        this.hourlyRushChart.destroy();
      }

      const opHours = [14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
      const rushLabels = ["2 PM", "3 PM", "4 PM", "5 PM", "6 PM", "7 PM", "8 PM", "9 PM", "10 PM", "11 PM"];
      const rushSales = opHours.map(() => 0);
      const rushBills = opHours.map(() => 0);

      const barColors = opHours.map(h => {
        if (h >= 14 && h < 17) return "#f59e0b";
        if (h >= 17 && h < 19) return "#ea580c";
        if (h >= 19 && h < 22) return "#7c3aed";
        return "#4f46e5";
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
              titleFont: { family: "Outfit", size: 12, weight: "bold" },
              bodyFont: { family: "Outfit", size: 11.5 },
              padding: 10,
              cornerRadius: 8,
              callbacks: {
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

  showPrintSummaryModal() {
    const orders = window.db.get("orders") || [];
    const settings = window.db.get("settings") || {};
    const currency = settings.currencySymbol || "₹";

    const startStr = this.startDate;
    const endStr = this.endDate;

    const filteredValidOrders = orders.filter(o => {
      if (!o.createdAt || o.status === "Cancelled") return false;
      const orderDate = new Date(o.createdAt);
      const d = !isNaN(orderDate.getTime()) ? this.getLocalDateStr(orderDate) : o.createdAt.substring(0, 10);
      return d >= startStr && d <= endStr;
    });

    const grossRevenue = filteredValidOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const totalDiscounts = filteredValidOrders.reduce((sum, o) => sum + (Number(o.discount) || 0) + (Number(o.bogoDiscount) || 0), 0);
    const aov = filteredValidOrders.length > 0 ? (grossRevenue / filteredValidOrders.length) : 0;

    let cashTotal = 0, upiTotal = 0, cardTotal = 0;
    filteredValidOrders.forEach(o => {
      const pm = (o.paymentMethod || "UPI").toLowerCase();
      const amt = Number(o.total) || 0;
      if (pm === "cash") cashTotal += amt;
      else if (pm === "card") cardTotal += amt;
      else upiTotal += amt;
    });

    const summaryHtml = `
      <div id="reports-pl-printable-area" style="font-family: 'Courier New', monospace; font-size: 13px; color: #000; background: #fff; padding: 16px; line-height: 1.45;">
        <div style="text-align: center; margin-bottom: 12px;">
          <h2 style="font-size: 18px; font-weight: 900; margin: 0; text-transform: uppercase;">${settings.restaurantName || "Crust & Chilly"}</h2>
          <p style="font-size: 11px; margin: 2px 0;">SALES & REVENUE PERFORMANCE REPORT</p>
          <p style="font-size: 11px; margin: 0;">Period: ${startStr} to ${endStr}</p>
        </div>

        <div style="border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 6px 0; margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between;">
            <span>Completed Orders:</span>
            <strong>${filteredValidOrders.length} orders</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 2px;">
            <span>Gross Sales:</span>
            <strong>${currency}${(grossRevenue + totalDiscounts).toFixed(2)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 2px;">
            <span>(-) Discounts Given:</span>
            <span>-${currency}${totalDiscounts.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: 900; border-top: 1px solid #000; margin-top: 4px; padding-top: 4px;">
            <span>NET REVENUE:</span>
            <span>${currency}${grossRevenue.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-top: 2px;">
            <span>Average Order Value (AOV):</span>
            <strong>${currency}${Math.round(aov)}</strong>
          </div>
        </div>

        <div style="margin-bottom: 12px; font-size: 12px;">
          <strong style="text-decoration: underline;">PAYMENT COLLECTION BREAKDOWN:</strong>
          <div style="display: flex; justify-content: space-between; margin-top: 4px;">
            <span>Cash In Till:</span>
            <span>${currency}${cashTotal.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 2px;">
            <span>UPI Online Received:</span>
            <span>${currency}${upiTotal.toFixed(2)}</span>
          </div>
          ${cardTotal > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-top: 2px;">
              <span>Card Swiped:</span>
              <span>${currency}${cardTotal.toFixed(2)}</span>
            </div>
          ` : ''}
        </div>

        <div style="text-align: center; margin-top: 20px; font-size: 11px; border-top: 1px dashed #000; padding-top: 8px;">
          Manager Signature: _____________________<br><br>
          Generated on: ${new Date().toLocaleString("en-IN")}
        </div>
      </div>
    `;

    window.customModal.show({
      title: "Sales & Revenue Performance Report",
      bodyHtml: summaryHtml,
      confirmText: "Print Summary",
      cancelText: "Close",
      onConfirm: () => {
        document.body.classList.add("printing-reports-pl");
        window.print();
        setTimeout(() => {
          document.body.classList.remove("printing-reports-pl");
        }, 1000);
        return true;
      }
    });
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
