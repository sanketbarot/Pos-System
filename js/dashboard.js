// Crust & Chilly POS - Executive Dashboard & Business Intelligence Module
// Advanced Real-Time Executive Operations, Pacing & Revenue Forecasting, Financial Intelligence,
// Channel Performance, Shift Rush Analysis, Inventory Health Watch, Cash Drawer Audit, and Z-Report.

window.views = window.views || {};
window.views.dashboard = {
  salesChart: null,
  paymentChart: null,
  categoryChart: null,
  selectedTimeframe: "today", // 'today' | 'yesterday' | 'week' | 'month' | 'custom'
  customStartDate: null,
  customEndDate: null,
  activeChartMode: "trend", // 'trend' | 'hourlyRush' | 'hourlyOrders'
  bestSellerSort: "qty", // 'qty' | 'rev'
  autoRefreshEnabled: true,
  autoRefreshTimer: null,
  autoRefreshCountdown: 30,
  countdownInterval: null,
  clockInterval: null,

  getLocalDateStr(d = new Date()) {
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().substring(0, 10);
  },

  formatTime(isoOrDateStr) {
    if (!isoOrDateStr) return "--:--";
    const d = new Date(isoOrDateStr);
    return isNaN(d.getTime()) ? "--:--" : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  },

  getTimeframeDates() {
    const today = new Date();
    const todayStr = this.getLocalDateStr(today);

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = this.getLocalDateStr(yesterday);

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 6);
    const weekStartStr = this.getLocalDateStr(weekStart);

    // Prior 7 days for comparison
    const prevWeekStart = new Date(today);
    prevWeekStart.setDate(today.getDate() - 13);
    const prevWeekStartStr = this.getLocalDateStr(prevWeekStart);
    const prevWeekEndStr = this.getLocalDateStr(new Date(today.getTime() - 7 * 86400000));

    const monthStartStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;

    // Prior month for comparison
    const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const prevMonthStartStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}-01`;
    const lastDayPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
    const prevMonthEndStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}-${String(lastDayPrevMonth).padStart(2, '0')}`;

    return { 
      todayStr, 
      yesterdayStr, 
      weekStartStr, 
      prevWeekStartStr,
      prevWeekEndStr,
      monthStartStr,
      prevMonthStartStr,
      prevMonthEndStr
    };
  },

  setTimeframe(period) {
    this.selectedTimeframe = period;
    document.querySelectorAll(".dash-period-btn").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-period") === period);
    });
    this.calculateAndRenderMetrics();
  },

  setChartMode(mode) {
    this.activeChartMode = mode;
    document.querySelectorAll(".dash-chart-toggle-btn").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-mode") === mode);
    });
    const orders = window.db.get("orders") || [];
    const { todayStr } = this.getTimeframeDates();
    this.renderSalesChart(orders, todayStr);
  },

  setBestSellerSort(sortBy) {
    this.bestSellerSort = sortBy;
    document.querySelectorAll(".dash-leader-sort-btn").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-sort") === sortBy);
    });
    const filteredOrders = this.getFilteredOrders();
    const products = window.db.get("products") || [];
    const categories = window.db.get("categories") || [];
    const settings = window.db.get("settings") || {};
    this.renderBestSellers(filteredOrders, products, categories, settings.currencySymbol || "₹");
  },

  init(container) {
    // Clear any previous running intervals
    if (this.autoRefreshTimer) clearInterval(this.autoRefreshTimer);
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    if (this.clockInterval) clearInterval(this.clockInterval);

    const today = new Date();
    const formattedDate = today.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric"
    });

    container.innerHTML = `
      <div class="dash-container view-animate" style="max-width: 100%; width: 100%; overflow-x: hidden; display: flex; flex-direction: column; gap: 18px;">
        
        <!-- Welcome Executive Command Banner -->
        <div class="dash-banner glass-card" style="margin-bottom: 0;">
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
              <h1 style="margin: 0;">Crust & Chilly Executive Command Center 🍕</h1>
              <div id="dash-shift-indicator" class="dash-shift-live-pill">
                <i class="fa-solid fa-circle" style="font-size: 7px; animation: pulse 1.5s infinite alternate;"></i> 
                <span>Live Shift Active</span>
              </div>
            </div>
            <p style="margin: 0; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <span><i class="fa-regular fa-calendar" style="color: #2563eb;"></i> ${formattedDate}</span>
              <span>•</span>
              <span id="dash-live-clock" style="font-weight: 700; color: var(--text-dark);"><i class="fa-regular fa-clock" style="color: #2563eb;"></i> --:--:--</span>
              <span>•</span>
              <span style="color: var(--text-muted); font-weight: 600;">Real-Time Business Intelligence</span>
            </p>
          </div>
          
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <!-- Period Selector Pills -->
            <div class="dash-period-pills" id="dash-period-selector">
              <button class="dash-period-btn ${this.selectedTimeframe === 'today' ? 'active' : ''}" data-period="today" onclick="views.dashboard.setTimeframe('today')">Today</button>
              <button class="dash-period-btn ${this.selectedTimeframe === 'yesterday' ? 'active' : ''}" data-period="yesterday" onclick="views.dashboard.setTimeframe('yesterday')">Yesterday</button>
              <button class="dash-period-btn ${this.selectedTimeframe === 'week' ? 'active' : ''}" data-period="week" onclick="views.dashboard.setTimeframe('week')">7 Days</button>
              <button class="dash-period-btn ${this.selectedTimeframe === 'month' ? 'active' : ''}" data-period="month" onclick="views.dashboard.setTimeframe('month')">This Month</button>
              <button class="dash-period-btn ${this.selectedTimeframe === 'custom' ? 'active' : ''}" data-period="custom" onclick="views.dashboard.openCustomDateRangeModal()">Custom 📅</button>
            </div>

            <!-- Auto-Refresh Toggle Pill -->
            <button id="dash-autorefresh-btn" class="dash-auto-pill active" title="Toggle 30s Real-time Auto-Refresh" onclick="views.dashboard.toggleAutoRefresh()">
              <i class="fa-solid fa-arrows-rotate fa-spin" id="dash-refresh-icon" style="font-size: 11px;"></i>
              <span id="dash-countdown-text">Auto 30s</span>
            </button>

            <!-- Refresh Button -->
            <button class="btn btn-secondary" id="dash-btn-refresh" style="height: 36px; display: inline-flex; align-items: center; gap: 6px; padding: 0 14px; border-radius: 12px; font-size: 12px; font-weight: 700; box-sizing: border-box;">
              <i class="fa-solid fa-rotate-right"></i> Refresh
            </button>
          </div>
        </div>

        <!-- Executive Quick Actions Toolbar -->
        <div class="dash-quick-toolbar glass-card" style="padding: 10px 18px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
          <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 800; color: var(--text-dark);">
            <i class="fa-solid fa-bolt" style="color: #f59e0b;"></i> 
            <span>Executive Tools:</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <button class="dash-tool-btn btn-tool-expense" onclick="views.dashboard.openQuickExpenseModal()">
              <i class="fa-solid fa-plus-circle"></i> Log Expense
            </button>
            <button class="dash-tool-btn btn-tool-audit" onclick="views.dashboard.openCashDrawerAuditModal()">
              <i class="fa-solid fa-cash-register"></i> Audit Drawer
            </button>
            <button class="dash-tool-btn btn-tool-zreport" onclick="views.dashboard.openDayEndReportModal()">
              <i class="fa-solid fa-receipt"></i> Daily Z-Report
            </button>
            <button class="dash-tool-btn btn-tool-export" onclick="views.dashboard.exportExecutiveCSV()">
              <i class="fa-solid fa-file-csv"></i> Export CSV
            </button>
            <button class="dash-tool-btn btn-tool-print" onclick="views.dashboard.printExecutiveSummary()">
              <i class="fa-solid fa-print"></i> Print Briefing
            </button>
          </div>
        </div>

        <!-- Revenue Target Pacing & Forecast Card -->
        <div class="glass-card dash-pacing-card" style="padding: 16px 20px; display: flex; flex-direction: column; gap: 12px; margin-bottom: 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div class="pacing-icon-badge">
                <i class="fa-solid fa-bullseye"></i>
              </div>
              <div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 14px; font-weight: 800; color: var(--text-dark);" id="dash-target-title">Daily Revenue Goal</span>
                  <span id="dash-target-badge" class="badge-target-progress">0% Achieved</span>
                  <span id="dash-pacing-status-badge" class="badge-pacing-ontrack">Calculating Pace...</span>
                </div>
                <div style="font-size: 11.5px; color: var(--text-muted); font-weight: 600; margin-top: 2px;" id="dash-pacing-subtext">
                  Store Hours: 2:00 PM – 12:00 AM (10 Operating Hours)
                </div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="text-align: right;">
                <span id="dash-target-amounts" style="font-size: 15px; font-weight: 900; color: var(--text-dark);">₹0 / ₹15,000</span>
                <div id="dash-target-projected" style="font-size: 11px; color: #2563eb; font-weight: 700;">Projected Close: ₹0</div>
              </div>
              <button id="dash-btn-set-target" class="btn btn-secondary" style="height: 32px; padding: 0 10px; font-size: 11.5px; border-radius: 10px; font-weight: 700;">
                <i class="fa-solid fa-pen-to-square" style="color: #2563eb;"></i> Edit Goal
              </button>
            </div>
          </div>

          <!-- Progress Bar with milestone ticks -->
          <div class="pacing-bar-container">
            <div id="dash-target-bar" class="pacing-bar-fill" style="width: 0%;"></div>
            <div class="pacing-marker" style="left: 25%;" title="25%"></div>
            <div class="pacing-marker" style="left: 50%;" title="50%"></div>
            <div class="pacing-marker" style="left: 75%;" title="75%"></div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11.5px; color: var(--text-muted); font-weight: 600; flex-wrap: wrap; gap: 6px;">
            <span id="dash-target-remaining"><i class="fa-solid fa-calculator"></i> Calculating target progress...</span>
            <span id="dash-target-runrate" style="font-weight: 700; color: #2563eb;"><i class="fa-solid fa-gauge-high"></i> Current Velocity: ₹0 / hr</span>
          </div>
        </div>

        <!-- 6 Executive KPI Scorecard Cards Grid -->
        <div class="dash-kpi-grid-6">
          
          <!-- KPI 1: Gross Sales -->
          <div class="dash-card accent-blue">
            <div>
              <div class="dash-card-header">
                <span class="dash-card-label" id="dash-sales-label">Gross Revenue</span>
                <div class="dash-card-icon icon-blue">
                  <i class="fa-solid fa-indian-rupee-sign"></i>
                </div>
              </div>
              <div style="display: flex; align-items: baseline; gap: 8px;">
                <div class="dash-card-val" id="dash-sales-val">₹0</div>
                <div id="dash-growth-indicator"></div>
              </div>
            </div>
            <div class="dash-breakdown-tags" id="dash-sales-breakdown">
              <span class="dash-sub-pill pill-cash"><i class="fa-solid fa-money-bill-wave"></i> Cash: ₹0</span>
              <span class="dash-sub-pill pill-upi"><i class="fa-solid fa-qrcode"></i> UPI: ₹0</span>
            </div>
          </div>

          <!-- KPI 2: Estimated Net Profit & Margin -->
          <div class="dash-card accent-green">
            <div>
              <div class="dash-card-header">
                <span class="dash-card-label">Estimated Net Profit</span>
                <div class="dash-card-icon icon-green">
                  <i class="fa-solid fa-arrow-trend-up"></i>
                </div>
              </div>
              <div class="dash-card-val" id="dash-profit-val" style="color: #059669;">₹0</div>
            </div>
            <div class="dash-breakdown-tags">
              <span class="dash-sub-pill pill-cash" id="dash-margin-pill"><i class="fa-solid fa-percent"></i> 0% Margin</span>
              <span class="dash-sub-pill pill-neutral" id="dash-expense-pill"><i class="fa-solid fa-receipt"></i> Expenses: ₹0</span>
            </div>
          </div>

          <!-- KPI 3: Orders & Avg Ticket (AOV) -->
          <div class="dash-card accent-amber">
            <div>
              <div class="dash-card-header">
                <span class="dash-card-label">Orders & Avg Ticket</span>
                <div class="dash-card-icon icon-amber">
                  <i class="fa-solid fa-receipt"></i>
                </div>
              </div>
              <div class="dash-card-val" id="dash-orders-val">0</div>
            </div>
            <div class="dash-breakdown-tags">
              <span class="dash-sub-pill pill-neutral" id="dash-aov-pill"><i class="fa-solid fa-calculator"></i> Avg: ₹0/bill</span>
              <span class="dash-sub-pill pill-cash" id="dash-fulfillment-pill">100% Fulfilled</span>
            </div>
          </div>

          <!-- KPI 4: Kitchen Queue & Speed SLA -->
          <div class="dash-card accent-purple">
            <div>
              <div class="dash-card-header">
                <span class="dash-card-label">Kitchen Live Queue</span>
                <div class="dash-card-icon icon-purple">
                  <i class="fa-solid fa-fire-burner"></i>
                </div>
              </div>
              <div class="dash-card-val" id="dash-active-val" style="color: #7c3aed;">0</div>
            </div>
            <div class="dash-breakdown-tags">
              <span class="dash-sub-pill pill-neutral" id="dash-queue-status"><i class="fa-solid fa-stopwatch"></i> Avg: --m</span>
              <span class="dash-sub-pill pill-cash" id="dash-delay-pill"><i class="fa-solid fa-circle-check"></i> On-Time</span>
            </div>
          </div>

          <!-- KPI 5: Promotions & Net Realization -->
          <div class="dash-card accent-rose">
            <div>
              <div class="dash-card-header">
                <span class="dash-card-label">Discounts & Offers</span>
                <div class="dash-card-icon icon-rose">
                  <i class="fa-solid fa-tags"></i>
                </div>
              </div>
              <div class="dash-card-val" id="dash-discount-val" style="color: #be185d;">₹0</div>
            </div>
            <div class="dash-breakdown-tags">
              <span class="dash-sub-pill pill-neutral" id="dash-discount-rate-pill"><i class="fa-solid fa-percent"></i> 0% Rate</span>
              <span class="dash-sub-pill pill-neutral" id="dash-realized-pill">Net: ₹0</span>
            </div>
          </div>

          <!-- KPI 6: Customer Footfall & Loyalty -->
          <div class="dash-card accent-indigo">
            <div>
              <div class="dash-card-header">
                <span class="dash-card-label">Customer Footfall</span>
                <div class="dash-card-icon icon-indigo">
                  <i class="fa-solid fa-users"></i>
                </div>
              </div>
              <div class="dash-card-val" id="dash-customers-val" style="color: #4f46e5;">0</div>
            </div>
            <div class="dash-breakdown-tags">
              <span class="dash-sub-pill pill-cash" id="dash-repeat-pill"><i class="fa-solid fa-rotate"></i> 0% Repeat</span>
              <span class="dash-sub-pill pill-neutral" id="dash-spend-per-cust">₹0/guest</span>
            </div>
          </div>

        </div>

        <!-- 3 Interactive Visual Analytics Charts Grid -->
        <div class="dash-charts-row-triple">
          
          <!-- Chart 1: Revenue Trajectory & Rush Pattern (Interactive Tabs) -->
          <div class="dash-chart-card main-chart-span">
            <div class="chart-header">
              <div class="chart-title">
                <i class="fa-solid fa-chart-line" style="color: #2563eb;"></i> 
                <span id="dash-chart-title-text">Revenue Trajectory</span>
              </div>
              <!-- Chart Mode Switcher Pills -->
              <div class="dash-chart-toggle-group">
                <button class="dash-chart-toggle-btn active" data-mode="trend" onclick="views.dashboard.setChartMode('trend')">7-Day Trend</button>
                <button class="dash-chart-toggle-btn" data-mode="hourlyRush" onclick="views.dashboard.setChartMode('hourlyRush')">Hourly Sales</button>
                <button class="dash-chart-toggle-btn" data-mode="hourlyOrders" onclick="views.dashboard.setChartMode('hourlyOrders')">Hourly Bills</button>
              </div>
            </div>
            <div class="dash-chart-wrap" style="height: 270px;">
              <canvas id="salesTrendsChartCanvas"></canvas>
            </div>
          </div>

          <!-- Chart 2: Payment Distribution Split -->
          <div class="dash-chart-card">
            <div class="chart-header">
              <div class="chart-title">
                <i class="fa-solid fa-wallet" style="color: #10b981;"></i> Payment Split
              </div>
              <span class="insight-badge" style="background: #ecfdf5; color: #065f46; border-color: #a7f3d0;">
                Collection
              </span>
            </div>
            <div class="dash-chart-wrap" style="height: 270px;">
              <canvas id="paymentPieChartCanvas"></canvas>
            </div>
          </div>

          <!-- Chart 3: Category Revenue Distribution -->
          <div class="dash-chart-card">
            <div class="chart-header">
              <div class="chart-title">
                <i class="fa-solid fa-pie-chart" style="color: #8b5cf6;"></i> Category Share
              </div>
              <span class="insight-badge" id="dash-cat-chart-badge" style="background: #f5f3ff; color: #5b21b6; border-color: #ddd6fe;">
                Menu Mix
              </span>
            </div>
            <div class="dash-chart-wrap" style="height: 270px;">
              <canvas id="categoryChartCanvas"></canvas>
            </div>
          </div>

        </div>

        <!-- 6 Deep Operations Intelligence Cards Grid -->
        <div class="dash-insights-grid">
          
          <!-- Insight Card 1: Order Fulfillment Channels -->
          <div class="dash-insight-card">
            <div class="insight-header">
              <div class="insight-title">
                <i class="fa-solid fa-utensils" style="color: #2563eb;"></i> Order Fulfillment Channels
              </div>
              <span class="insight-badge" id="dash-orders-total-badge">0 Total Bills</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 9px;" id="dash-order-types-container">
              <!-- Injected dynamically -->
            </div>
          </div>

          <!-- Insight Card 2: Shift Rush & Peak Hours -->
          <div class="dash-insight-card">
            <div class="insight-header">
              <div>
                <div class="insight-title">
                  <i class="fa-solid fa-stopwatch" style="color: #f59e0b;"></i> Shift Rush & Operational Hours
                </div>
                <div style="font-size: 11px; color: var(--text-muted); font-weight: 600; margin-top: 2px;">
                  <i class="fa-regular fa-clock"></i> Shop Hours: 2:00 PM – 12:00 AM Midnight
                </div>
              </div>
              <span class="insight-badge" id="dash-peak-hour-badge" style="background: #fffbeb; color: #b45309; border-color: #fde68a;">Calculating...</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px;" id="dash-shifts-container">
              <!-- Injected dynamically -->
            </div>
          </div>

          <!-- Insight Card 3: Daily Cash Drawer & Audit -->
          <div class="dash-insight-card">
            <div class="insight-header">
              <div class="insight-title">
                <i class="fa-solid fa-cash-register" style="color: #059669;"></i> Cash Drawer & Vault Tally
              </div>
              <span class="insight-badge" style="background: #ecfdf5; color: #065f46; border-color: #a7f3d0;">Closing Drawer</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px;" id="dash-cash-reconcile-container">
              <!-- Injected dynamically -->
            </div>
          </div>

          <!-- Insight Card 4: Raw Material Inventory Health Watch -->
          <div class="dash-insight-card">
            <div class="insight-header">
              <div class="insight-title">
                <i class="fa-solid fa-boxes-stacked" style="color: #dc2626;"></i> Raw Material Stock Watch
              </div>
              <span id="dash-inventory-badge" class="insight-badge">Checking...</span>
            </div>
            <div id="dash-inventory-watch-list" style="display: flex; flex-direction: column; gap: 8px;">
              <!-- Injected dynamically -->
            </div>
          </div>

          <!-- Insight Card 5: Category Revenue Breakdown List -->
          <div class="dash-insight-card">
            <div class="insight-header">
              <div class="insight-title">
                <i class="fa-solid fa-chart-pie" style="color: #2563eb;"></i> Category Revenue Contribution
              </div>
              <span class="insight-badge" id="dash-category-badge">Categories</span>
            </div>
            <div id="dash-category-breakdown-list" style="display: flex; flex-direction: column; gap: 7px;">
              <!-- Injected dynamically -->
            </div>
          </div>

          <!-- Insight Card 6: Customer Retention & Top Regulars -->
          <div class="dash-insight-card">
            <div class="insight-header">
              <div class="insight-title">
                <i class="fa-solid fa-users" style="color: #059669;"></i> Customer Retention & VIP Spenders
              </div>
              <span class="insight-badge" id="dash-cust-badge">0 Customers</span>
            </div>
            <div id="dash-customer-insights-list" style="display: flex; flex-direction: column; gap: 7px;">
              <!-- Injected dynamically -->
            </div>
          </div>

        </div>

        <!-- 2 Details Row: Top Selling Leaderboard & Today's Recent Bills -->
        <div class="dash-details-grid">
          
          <!-- Best Selling Menu Items Leaderboard -->
          <div class="dash-leaderboard-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
              <h3 style="font-size: 15px; font-weight: 800; color: var(--text-dark); margin: 0; display: flex; align-items: center; gap: 8px;">
                <i class="fa-solid fa-crown" style="color: #f59e0b;"></i> Best Selling Menu Items
              </h3>
              <div style="display: flex; align-items: center; gap: 6px;">
                <button class="dash-leader-sort-btn active" data-sort="qty" onclick="views.dashboard.setBestSellerSort('qty')">By Quantity</button>
                <button class="dash-leader-sort-btn" data-sort="rev" onclick="views.dashboard.setBestSellerSort('rev')">By Revenue</button>
              </div>
            </div>
            
            <div id="dash-best-sellers-list" style="display: flex; flex-direction: column; gap: 10px;">
              <!-- Injected dynamically -->
            </div>
          </div>

          <!-- Recent Bills Activity Stream -->
          <div class="dash-recent-card" style="min-width: 0; box-sizing: border-box;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px;">
              <h3 style="font-size: 15px; font-weight: 800; color: var(--text-dark); margin: 0; display: flex; align-items: center; gap: 8px;">
                <i class="fa-solid fa-clock-rotate-left" style="color: #2563eb;"></i> Live Register Bills Stream
              </h3>
              <a href="#counter" style="font-size: 12px; font-weight: 800; color: #2563eb; text-decoration: none; display: flex; align-items: center; gap: 4px; white-space: nowrap;">
                View All <i class="fa-solid fa-chevron-right" style="font-size: 10px;"></i>
              </a>
            </div>

            <div id="dash-recent-orders-list" style="display: flex; flex-direction: column; gap: 9px; min-width: 0; width: 100%; box-sizing: border-box;">
              <!-- Injected dynamically -->
            </div>
          </div>

        </div>

      </div>
    `;

    // Bind Refresh button
    const btnRefresh = document.getElementById("dash-btn-refresh");
    if (btnRefresh) {
      btnRefresh.addEventListener("click", () => {
        this.calculateAndRenderMetrics();
        window.showToast("Executive metrics refreshed successfully!", "info");
      });
    }

    // Bind Set Target button
    const btnSetTarget = document.getElementById("dash-btn-set-target");
    if (btnSetTarget) {
      btnSetTarget.addEventListener("click", () => {
        const curSettings = window.db.get("settings") || {};
        const curTarget = Number(curSettings.dailySalesTarget) || 15000;
        const newTarget = prompt("Enter Daily Revenue Target (₹):", curTarget);
        if (newTarget !== null && !isNaN(Number(newTarget)) && Number(newTarget) > 0) {
          curSettings.dailySalesTarget = Number(newTarget);
          window.db.set("settings", curSettings);
          this.calculateAndRenderMetrics();
          window.showToast(`Daily revenue goal set to ${curSettings.currencySymbol || "₹"}${Number(newTarget).toLocaleString("en-IN")}`, "success");
        }
      });
    }

    // Start Live Clock
    this.startLiveClock();

    // Start 30s Auto-refresh timer
    this.startAutoRefresh();

    // Calculate metrics immediately
    this.calculateAndRenderMetrics();
  },

  startLiveClock() {
    const update = () => {
      const now = new Date();
      const clockEl = document.getElementById("dash-live-clock");
      if (clockEl) {
        clockEl.innerHTML = `<i class="fa-regular fa-clock" style="color: #2563eb;"></i> ${now.toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
      }

      // Check shift status (2 PM to 12 AM)
      const currentHour = now.getHours();
      const shiftEl = document.getElementById("dash-shift-indicator");
      if (shiftEl) {
        if (currentHour >= 14 && currentHour <= 23) {
          shiftEl.className = "dash-shift-live-pill shift-open";
          shiftEl.innerHTML = `<i class="fa-solid fa-circle" style="font-size: 7px; animation: pulse 1.5s infinite alternate;"></i> <span>Live Shift Active (2 PM – 12 AM)</span>`;
        } else if (currentHour === 0) {
          shiftEl.className = "dash-shift-live-pill shift-closing";
          shiftEl.innerHTML = `<i class="fa-solid fa-circle" style="font-size: 7px;"></i> <span>Day-End Closing Shift</span>`;
        } else {
          shiftEl.className = "dash-shift-live-pill shift-closed";
          shiftEl.innerHTML = `<i class="fa-solid fa-moon" style="font-size: 10px;"></i> <span>Pre-Opening / Off-Hours (Opens 2 PM)</span>`;
        }
      }
    };
    update();
    this.clockInterval = setInterval(update, 1000);
  },

  toggleAutoRefresh() {
    this.autoRefreshEnabled = !this.autoRefreshEnabled;
    const btn = document.getElementById("dash-autorefresh-btn");
    const icon = document.getElementById("dash-refresh-icon");
    const text = document.getElementById("dash-countdown-text");

    if (this.autoRefreshEnabled) {
      if (btn) btn.classList.add("active");
      if (icon) icon.className = "fa-solid fa-arrows-rotate fa-spin";
      if (text) text.textContent = "Auto 30s";
      this.startAutoRefresh();
      window.showToast("Real-time 30s auto-refresh enabled.", "info");
    } else {
      if (btn) btn.classList.remove("active");
      if (icon) icon.className = "fa-solid fa-pause";
      if (text) text.textContent = "Paused";
      if (this.autoRefreshTimer) clearInterval(this.autoRefreshTimer);
      if (this.countdownInterval) clearInterval(this.countdownInterval);
      window.showToast("Auto-refresh paused.", "info");
    }
  },

  startAutoRefresh() {
    if (this.autoRefreshTimer) clearInterval(this.autoRefreshTimer);
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    if (!this.autoRefreshEnabled) return;

    this.autoRefreshCountdown = 30;
    this.countdownInterval = setInterval(() => {
      this.autoRefreshCountdown--;
      const text = document.getElementById("dash-countdown-text");
      if (text && this.autoRefreshEnabled) {
        text.textContent = `Auto ${this.autoRefreshCountdown}s`;
      }
      if (this.autoRefreshCountdown <= 0) {
        this.autoRefreshCountdown = 30;
        this.calculateAndRenderMetrics();
      }
    }, 1000);
  },

  getFilteredOrders() {
    const orders = window.db.get("orders") || [];
    const { todayStr, yesterdayStr, weekStartStr, monthStartStr } = this.getTimeframeDates();

    if (this.selectedTimeframe === "yesterday") {
      return orders.filter(o => o.createdAt && o.createdAt.substring(0, 10) === yesterdayStr);
    } else if (this.selectedTimeframe === "week") {
      return orders.filter(o => {
        if (!o.createdAt) return false;
        const dStr = o.createdAt.substring(0, 10);
        return dStr >= weekStartStr && dStr <= todayStr;
      });
    } else if (this.selectedTimeframe === "month") {
      return orders.filter(o => {
        if (!o.createdAt) return false;
        const dStr = o.createdAt.substring(0, 10);
        return dStr >= monthStartStr && dStr <= todayStr;
      });
    } else if (this.selectedTimeframe === "custom" && this.customStartDate && this.customEndDate) {
      return orders.filter(o => {
        if (!o.createdAt) return false;
        const dStr = o.createdAt.substring(0, 10);
        return dStr >= this.customStartDate && dStr <= this.customEndDate;
      });
    } else {
      // Default: today
      return orders.filter(o => o.createdAt && o.createdAt.substring(0, 10) === todayStr);
    }
  },

  calculateAndRenderMetrics() {
    const orders = window.db.get("orders") || [];
    const products = window.db.get("products") || [];
    const categories = window.db.get("categories") || [];
    const expenses = window.db.get("expenses") || [];
    const settings = window.db.get("settings") || {};

    const currencySymbol = settings.currencySymbol || "₹";
    const { todayStr, yesterdayStr, weekStartStr, prevWeekStartStr, prevWeekEndStr, monthStartStr, prevMonthStartStr, prevMonthEndStr } = this.getTimeframeDates();

    const filteredOrders = this.getFilteredOrders();
    const validOrders = filteredOrders.filter(o => o.status !== "Cancelled");
    const cancelledOrders = filteredOrders.filter(o => o.status === "Cancelled");
    
    // Label updates
    let periodLabel = "Today's";
    if (this.selectedTimeframe === "yesterday") periodLabel = "Yesterday's";
    else if (this.selectedTimeframe === "week") periodLabel = "7-Day";
    else if (this.selectedTimeframe === "month") periodLabel = "This Month's";
    else if (this.selectedTimeframe === "custom") periodLabel = "Custom Period";

    const salesLabelEl = document.getElementById("dash-sales-label");
    if (salesLabelEl) salesLabelEl.textContent = `${periodLabel} Gross Sales`;

    // Gross Sales & Payment Breakdowns
    let cashTotal = 0, cashOrdersCount = 0;
    let upiTotal = 0, upiOrdersCount = 0;
    let cardTotal = 0, cardOrdersCount = 0;
    let grossSales = 0;
    let bogoDiscountTotal = 0;
    let flatDiscountTotal = 0;

    validOrders.forEach(o => {
      const amt = Number(o.total) || 0;
      grossSales += amt;
      bogoDiscountTotal += (Number(o.bogoDiscount) || 0);
      flatDiscountTotal += (Number(o.discount) || 0);

      if (o.paymentMethod === "Cash") {
        cashTotal += amt;
        cashOrdersCount++;
      } else if (o.paymentMethod === "Card") {
        cardTotal += amt;
        cardOrdersCount++;
      } else {
        upiTotal += amt;
        upiOrdersCount++;
      }
    });

    const salesValEl = document.getElementById("dash-sales-val");
    if (salesValEl) salesValEl.textContent = `${currencySymbol}${Math.round(grossSales).toLocaleString("en-IN")}`;
    
    // Day-over-Day or Period-over-Period growth indicator
    const growthEl = document.getElementById("dash-growth-indicator");
    if (growthEl) {
      let prevPeriodSales = 0;
      let compLabel = "vs prev";

      if (this.selectedTimeframe === "today") {
        prevPeriodSales = orders
          .filter(o => o.createdAt && o.createdAt.substring(0, 10) === yesterdayStr && o.status !== "Cancelled")
          .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
        compLabel = "vs yday";
      } else if (this.selectedTimeframe === "yesterday") {
        const dayBeforeYday = new Date();
        dayBeforeYday.setDate(dayBeforeYday.getDate() - 2);
        const dStr = this.getLocalDateStr(dayBeforeYday);
        prevPeriodSales = orders
          .filter(o => o.createdAt && o.createdAt.substring(0, 10) === dStr && o.status !== "Cancelled")
          .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
        compLabel = "vs prev day";
      } else if (this.selectedTimeframe === "week") {
        prevPeriodSales = orders
          .filter(o => o.createdAt && o.createdAt.substring(0, 10) >= prevWeekStartStr && o.createdAt.substring(0, 10) <= prevWeekEndStr && o.status !== "Cancelled")
          .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
        compLabel = "vs prev 7D";
      } else if (this.selectedTimeframe === "month") {
        prevPeriodSales = orders
          .filter(o => o.createdAt && o.createdAt.substring(0, 10) >= prevMonthStartStr && o.createdAt.substring(0, 10) <= prevMonthEndStr && o.status !== "Cancelled")
          .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
        compLabel = "vs prev month";
      }

      if (prevPeriodSales > 0) {
        const diffPct = Math.round(((grossSales - prevPeriodSales) / prevPeriodSales) * 100);
        const isUp = diffPct >= 0;
        growthEl.innerHTML = `
          <span class="growth-tag ${isUp ? 'growth-up' : 'growth-down'}">
            <i class="fa-solid ${isUp ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}"></i> ${isUp ? '+' : ''}${diffPct}% ${compLabel}
          </span>
        `;
      } else {
        growthEl.innerHTML = "";
      }
    }

    // Render Sales Goal & Run-Rate Pacing Tracker
    let multiplier = 1;
    if (this.selectedTimeframe === "week") multiplier = 7;
    else if (this.selectedTimeframe === "month") multiplier = 30;
    else if (this.selectedTimeframe === "custom" && this.customStartDate && this.customEndDate) {
      const d1 = new Date(this.customStartDate);
      const d2 = new Date(this.customEndDate);
      const diffDays = Math.max(1, Math.round((d2 - d1) / 86400000) + 1);
      multiplier = diffDays;
    }

    const baseTarget = Number(settings.dailySalesTarget) || 15000;
    const targetGoal = baseTarget * multiplier;
    const targetPct = targetGoal > 0 ? Math.min(100, Math.round((grossSales / targetGoal) * 100)) : 0;
    
    const targetTitleEl = document.getElementById("dash-target-title");
    if (targetTitleEl) {
      targetTitleEl.textContent = this.selectedTimeframe === "week" 
        ? "Weekly Revenue Goal" 
        : (this.selectedTimeframe === "month" 
          ? "Monthly Revenue Goal" 
          : (this.selectedTimeframe === "custom" ? "Custom Range Goal" : "Daily Revenue Goal"));
    }

    const targetBadgeEl = document.getElementById("dash-target-badge");
    const targetAmountsEl = document.getElementById("dash-target-amounts");
    const targetBarEl = document.getElementById("dash-target-bar");
    const targetRemEl = document.getElementById("dash-target-remaining");
    const pacingStatusBadge = document.getElementById("dash-pacing-status-badge");
    const projectedCloseEl = document.getElementById("dash-target-projected");
    const targetRunrateEl = document.getElementById("dash-target-runrate");

    if (targetBadgeEl) targetBadgeEl.textContent = `${targetPct}% Achieved`;
    if (targetAmountsEl) targetAmountsEl.textContent = `${currencySymbol}${Math.round(grossSales).toLocaleString("en-IN")} / ${currencySymbol}${Math.round(targetGoal).toLocaleString("en-IN")}`;
    if (targetBarEl) {
      targetBarEl.style.width = `${targetPct}%`;
      if (targetPct >= 100) {
        targetBarEl.style.background = "linear-gradient(90deg, #10b981, #059669)";
      } else {
        targetBarEl.style.background = "linear-gradient(90deg, #2563eb, #10b981)";
      }
    }

    // Run-rate & Projected end-of-day calculations (Store hours: 2:00 PM to 12:00 AM = 10 hours)
    if (this.selectedTimeframe === "today") {
      const now = new Date();
      const curHour = now.getHours() + (now.getMinutes() / 60);
      // Operating window starts at 14.0 (2 PM) and ends at 24.0 (12 AM)
      const operatingHoursElapsed = Math.max(0.5, Math.min(10, Math.max(0, curHour - 14)));
      const hourlyVelocity = Math.round(grossSales / operatingHoursElapsed);
      const remainingHours = Math.max(0, 24 - Math.max(14, curHour));
      const projectedClosingRevenue = Math.round(grossSales + (hourlyVelocity * remainingHours));

      if (targetRunrateEl) {
        targetRunrateEl.innerHTML = `<i class="fa-solid fa-gauge-high"></i> Pace: ${currencySymbol}${hourlyVelocity.toLocaleString("en-IN")} / hr (${operatingHoursElapsed.toFixed(1)}h open)`;
      }

      if (projectedCloseEl) {
        projectedCloseEl.textContent = `Projected 12 AM Close: ${currencySymbol}${projectedClosingRevenue.toLocaleString("en-IN")}`;
      }

      if (pacingStatusBadge) {
        if (grossSales >= targetGoal) {
          pacingStatusBadge.className = "badge-pacing-ontrack";
          pacingStatusBadge.textContent = "Goal Achieved! 🎉";
          pacingStatusBadge.style.background = "#ecfdf5";
          pacingStatusBadge.style.color = "#059669";
        } else if (projectedClosingRevenue >= targetGoal) {
          pacingStatusBadge.className = "badge-pacing-ontrack";
          pacingStatusBadge.textContent = "🚀 Ahead of Pace";
          pacingStatusBadge.style.background = "#eff6ff";
          pacingStatusBadge.style.color = "#2563eb";
        } else if (projectedClosingRevenue >= targetGoal * 0.8) {
          pacingStatusBadge.className = "badge-pacing-ontrack";
          pacingStatusBadge.textContent = "✨ On Track";
          pacingStatusBadge.style.background = "#fffbeb";
          pacingStatusBadge.style.color = "#b45309";
        } else {
          pacingStatusBadge.className = "badge-pacing-ontrack";
          pacingStatusBadge.textContent = "⚡ Needs Push";
          pacingStatusBadge.style.background = "#fee2e2";
          pacingStatusBadge.style.color = "#dc2626";
        }
      }
    } else {
      if (targetRunrateEl) targetRunrateEl.innerHTML = `<i class="fa-solid fa-check-double"></i> Multi-day period analysis`;
      if (projectedCloseEl) projectedCloseEl.textContent = `Target: ${currencySymbol}${Math.round(targetGoal).toLocaleString("en-IN")}`;
      if (pacingStatusBadge) {
        pacingStatusBadge.textContent = grossSales >= targetGoal ? "Goal Met 🎉" : "In Progress";
        pacingStatusBadge.style.background = grossSales >= targetGoal ? "#ecfdf5" : "#eff6ff";
        pacingStatusBadge.style.color = grossSales >= targetGoal ? "#059669" : "#2563eb";
      }
    }

    if (targetRemEl) {
      if (grossSales >= targetGoal) {
        targetRemEl.innerHTML = `<span style="color: #059669; font-weight: 800;"><i class="fa-solid fa-circle-check"></i> Great job! Revenue goal achieved (+${currencySymbol}${Math.round(grossSales - targetGoal).toLocaleString("en-IN")})</span>`;
      } else {
        targetRemEl.innerHTML = `<span><i class="fa-solid fa-flag"></i> ${currencySymbol}${Math.round(targetGoal - grossSales).toLocaleString("en-IN")} remaining to hit target</span>`;
      }
    }
    
    // Detailed Payment mode tags
    let breakdownHtml = `
      <span class="dash-sub-pill pill-cash"><i class="fa-solid fa-money-bill-wave"></i> Cash: ${currencySymbol}${Math.round(cashTotal).toLocaleString("en-IN")} (${cashOrdersCount})</span>
      <span class="dash-sub-pill pill-upi"><i class="fa-solid fa-qrcode"></i> UPI: ${currencySymbol}${Math.round(upiTotal).toLocaleString("en-IN")} (${upiOrdersCount})</span>
    `;
    if (cardTotal > 0) {
      breakdownHtml += `<span class="dash-sub-pill pill-card"><i class="fa-solid fa-credit-card"></i> Card: ${currencySymbol}${Math.round(cardTotal).toLocaleString("en-IN")} (${cardOrdersCount})</span>`;
    }
    const breakdownEl = document.getElementById("dash-sales-breakdown");
    if (breakdownEl) breakdownEl.innerHTML = breakdownHtml;

    // Filter expenses by timeframe
    const periodExpenses = expenses.filter(e => {
      const dStr = e.date || (e.createdAt ? e.createdAt.substring(0, 10) : "");
      if (this.selectedTimeframe === "yesterday") return dStr === yesterdayStr;
      if (this.selectedTimeframe === "week") return dStr >= weekStartStr && dStr <= todayStr;
      if (this.selectedTimeframe === "month") return dStr >= monthStartStr && dStr <= todayStr;
      if (this.selectedTimeframe === "custom" && this.customStartDate && this.customEndDate) {
        return dStr >= this.customStartDate && dStr <= this.customEndDate;
      }
      return dStr === todayStr;
    });

    const totalPeriodExpense = periodExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const estimatedCOGS = grossSales * 0.32; // Standard 32% food cost COGS
    const netProfit = Math.max(0, grossSales - estimatedCOGS - totalPeriodExpense);
    const profitMargin = grossSales > 0 ? Math.round((netProfit / grossSales) * 100) : 0;

    const profitValEl = document.getElementById("dash-profit-val");
    if (profitValEl) profitValEl.textContent = `${currencySymbol}${Math.round(netProfit).toLocaleString("en-IN")}`;
    
    const marginPillEl = document.getElementById("dash-margin-pill");
    if (marginPillEl) marginPillEl.innerHTML = `<i class="fa-solid fa-percent"></i> ${profitMargin}% Net Margin`;

    const expensePillEl = document.getElementById("dash-expense-pill");
    if (expensePillEl) expensePillEl.innerHTML = `<i class="fa-solid fa-receipt"></i> Expenses: ${currencySymbol}${Math.round(totalPeriodExpense).toLocaleString("en-IN")}`;

    // Orders & AOV
    const totalOrdersCount = filteredOrders.length;
    const completedCount = validOrders.filter(o => o.status === "Completed").length;
    const fulfillmentRate = totalOrdersCount > 0 ? Math.round((validOrders.length / totalOrdersCount) * 100) : 100;
    const aov = validOrders.length > 0 ? Math.round(grossSales / validOrders.length) : 0;

    const ordersValEl = document.getElementById("dash-orders-val");
    if (ordersValEl) ordersValEl.textContent = totalOrdersCount;

    const aovPillEl = document.getElementById("dash-aov-pill");
    if (aovPillEl) aovPillEl.innerHTML = `<i class="fa-solid fa-calculator"></i> Avg: ${currencySymbol}${aov}/bill`;

    const fulfillmentPillEl = document.getElementById("dash-fulfillment-pill");
    if (fulfillmentPillEl) {
      fulfillmentPillEl.innerHTML = `<i class="fa-solid fa-check"></i> ${fulfillmentRate}% Fulfilled`;
      if (cancelledOrders.length > 0) {
        fulfillmentPillEl.title = `${cancelledOrders.length} Cancelled orders`;
      }
    }

    // Active Kitchen Queue
    const activeQueueCount = orders.filter(o => o.status === "Pending" || o.status === "Preparing").length;
    const activeValEl = document.getElementById("dash-active-val");
    if (activeValEl) activeValEl.textContent = activeQueueCount;

    const prepOrders = filteredOrders.filter(o => (o.status === "Ready" || o.status === "Completed") && (o.prepDurationSeconds || (o.readyAt && o.createdAt)));
    let totalPrepSecs = 0;
    prepOrders.forEach(o => {
      const dur = o.prepDurationSeconds || Math.round((new Date(o.readyAt || o.completedAt) - new Date(o.preparingStartedAt || o.createdAt)) / 1000);
      totalPrepSecs += Math.max(0, dur);
    });
    const avgPrepSecs = prepOrders.length > 0 ? Math.round(totalPrepSecs / prepOrders.length) : 0;
    const avgPrepMins = Math.floor(avgPrepSecs / 60);

    const targetPrepMinutes = Number(settings.targetPrepMinutes) || 15;
    const targetPrepSecs = targetPrepMinutes * 60;
    const nowTs = new Date();
    const overdueCount = orders.filter(o => {
      if (o.status !== "Preparing") return false;
      const start = new Date(o.preparingStartedAt || o.createdAt);
      return Math.floor((nowTs - start) / 1000) > targetPrepSecs;
    }).length;

    const queueStatusEl = document.getElementById("dash-queue-status");
    if (queueStatusEl) {
      queueStatusEl.innerHTML = `<i class="fa-solid fa-stopwatch"></i> Avg: ${avgPrepMins > 0 ? `${avgPrepMins}m` : (prepOrders.length > 0 ? `${avgPrepSecs}s` : '--m')}`;
    }

    const delayPillEl = document.getElementById("dash-delay-pill");
    if (delayPillEl) {
      if (overdueCount > 0) {
        delayPillEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${overdueCount} Delayed!`;
        delayPillEl.style.background = "#fee2e2";
        delayPillEl.style.color = "#dc2626";
        delayPillEl.style.borderColor = "#fca5a5";
        delayPillEl.style.fontWeight = "800";
      } else {
        delayPillEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> On-Time`;
        delayPillEl.style.background = "#ecfdf5";
        delayPillEl.style.color = "#059669";
        delayPillEl.style.borderColor = "#a7f3d0";
        delayPillEl.style.fontWeight = "600";
      }
    }

    // Promotional & Discount KPI
    const totalDiscounts = bogoDiscountTotal + flatDiscountTotal;
    const originalSubtotal = grossSales + totalDiscounts;
    const discountRate = originalSubtotal > 0 ? Math.round((totalDiscounts / originalSubtotal) * 100) : 0;

    const discountValEl = document.getElementById("dash-discount-val");
    if (discountValEl) discountValEl.textContent = `${currencySymbol}${Math.round(totalDiscounts).toLocaleString("en-IN")}`;

    const discountRatePillEl = document.getElementById("dash-discount-rate-pill");
    if (discountRatePillEl) discountRatePillEl.innerHTML = `<i class="fa-solid fa-tags"></i> ${discountRate}% Rate`;

    const realizedPillEl = document.getElementById("dash-realized-pill");
    if (realizedPillEl) realizedPillEl.innerHTML = `<i class="fa-solid fa-indian-rupee-sign"></i> Realized: ${currencySymbol}${Math.round(grossSales).toLocaleString("en-IN")}`;

    // Customer Footfall & Loyalty KPI
    const custMap = {};
    validOrders.forEach(o => {
      const phone = (o.customerPhone || "").trim();
      const name = (o.customerName || "").trim() || "Walk-in";
      const key = phone ? phone : name;
      if (!custMap[key]) custMap[key] = { name, phone, count: 0, spent: 0 };
      custMap[key].count++;
      custMap[key].spent += (Number(o.total) || 0);
    });

    const totalUniqueCust = Object.keys(custMap).length;
    const repeatCustCount = Object.values(custMap).filter(c => c.count > 1).length;
    const repeatCustRate = totalUniqueCust > 0 ? Math.round((repeatCustCount / totalUniqueCust) * 100) : 0;
    const avgSpendPerCust = totalUniqueCust > 0 ? Math.round(grossSales / totalUniqueCust) : 0;

    const custValEl = document.getElementById("dash-customers-val");
    if (custValEl) custValEl.textContent = totalUniqueCust;

    const repeatPillEl = document.getElementById("dash-repeat-pill");
    if (repeatPillEl) repeatPillEl.innerHTML = `<i class="fa-solid fa-rotate"></i> ${repeatCustRate}% Repeat`;

    const spendPerCustEl = document.getElementById("dash-spend-per-cust");
    if (spendPerCustEl) spendPerCustEl.innerHTML = `<i class="fa-solid fa-receipt"></i> ${currencySymbol}${avgSpendPerCust}/guest`;

    // Render Deep Insights Suites
    this.renderInventoryWatch();
    this.renderCategoryBreakdown(validOrders, currencySymbol);
    this.renderCustomerInsights(custMap, totalUniqueCust, repeatCustRate, currencySymbol);

    // Render Business Intelligence Suite Cards
    this.renderOrderChannels(validOrders, grossSales, currencySymbol);
    this.renderCashReconciliation(cashTotal, upiTotal, totalPeriodExpense, currencySymbol);
    this.renderShiftsAndPeak(validOrders, currencySymbol);

    // Leaderboard & Recent Stream
    this.renderBestSellers(filteredOrders, products, categories, currencySymbol);
    this.renderRecentBills(filteredOrders, currencySymbol);

    // Visual Charts
    this.renderSalesChart(orders, todayStr);
    this.renderPaymentChart(orders, todayStr);
    this.renderCategoryChart(validOrders);
  },

  // 1. Raw Material Inventory Health Watch
  renderInventoryWatch() {
    const container = document.getElementById("dash-inventory-watch-list");
    if (!container) return;

    const ingredients = window.db.get("ingredients") || [];
    if (ingredients.length === 0) {
      container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 16px; font-size: 11.5px;">No inventory materials tracked.</div>`;
      return;
    }

    const lowItems = ingredients.filter(i => {
      const min = Number(i.minStock) || 5;
      return Number(i.stock) <= min;
    }).sort((a, b) => (Number(a.stock) - Number(b.stock)));

    const badgeEl = document.getElementById("dash-inventory-badge");
    if (badgeEl) {
      if (lowItems.length > 0) {
        badgeEl.className = "insight-badge";
        badgeEl.style.background = "#fee2e2";
        badgeEl.style.color = "#dc2626";
        badgeEl.style.borderColor = "#fca5a5";
        badgeEl.textContent = `${lowItems.length} Low Stock Alert`;
      } else {
        badgeEl.className = "insight-badge";
        badgeEl.style.background = "#ecfdf5";
        badgeEl.style.color = "#059669";
        badgeEl.style.borderColor = "#a7f3d0";
        badgeEl.textContent = "All Healthy 🟢";
      }
    }

    if (lowItems.length === 0) {
      container.innerHTML = `
        <div style="background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 12px; padding: 14px; text-align: center;">
          <i class="fa-solid fa-circle-check" style="font-size: 20px; color: #16a34a; margin-bottom: 4px; display: block;"></i>
          <div style="font-weight: 800; font-size: 12.5px; color: #166534;">All ${ingredients.length} Raw Materials In Stock</div>
          <div style="font-size: 11px; color: #15803d; margin-top: 2px;">Kitchen has sufficient inventory for all prep orders.</div>
        </div>
      `;
      return;
    }

    container.innerHTML = lowItems.slice(0, 4).map(item => `
      <div class="dash-stock-item">
        <div style="min-width: 0; flex: 1;">
          <div style="font-weight: 800; color: var(--text-dark); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.name}</div>
          <div style="font-size: 10px; color: var(--text-muted);">Reorder Min: ${item.minStock || 5} ${item.unit || 'units'}</div>
        </div>
        <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
          <span class="dash-stock-badge-low">${item.stock} ${item.unit || ''}</span>
          <button type="button" onclick="views.dashboard.openQuickRestockModal('${item.id}', '${item.name}')" style="background: #eff6ff; border: 1px solid #bfdbfe; color: #2563eb; border-radius: 8px; padding: 3px 8px; font-size: 10.5px; font-weight: 800; cursor: pointer;">
            + Stock
          </button>
        </div>
      </div>
    `).join("");
  },

  // 2. Category Revenue Breakdown
  renderCategoryBreakdown(filteredOrders, currencySymbol) {
    const container = document.getElementById("dash-category-breakdown-list");
    if (!container) return;

    const products = window.db.get("products") || [];
    const categories = window.db.get("categories") || [];

    const catMap = {};
    categories.forEach(c => {
      catMap[c.id] = { name: c.name, revenue: 0, itemsCount: 0 };
    });
    catMap["other"] = { name: "Other Items", revenue: 0, itemsCount: 0 };

    let totalCatRevenue = 0;
    filteredOrders.forEach(o => {
      if (o.status === "Cancelled" || !Array.isArray(o.items)) return;
      o.items.forEach(i => {
        const prod = products.find(p => p.name === i.name);
        const catId = (prod && prod.category) ? prod.category : "other";
        if (!catMap[catId]) {
          catMap[catId] = { name: catId, revenue: 0, itemsCount: 0 };
        }
        const lineTotal = (i.price || 0) * (i.quantity || 1);
        catMap[catId].revenue += lineTotal;
        catMap[catId].itemsCount += (i.quantity || 1);
        totalCatRevenue += lineTotal;
      });
    });

    const sortedCats = Object.values(catMap)
      .filter(c => c.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 4);

    const badgeEl = document.getElementById("dash-category-badge");
    if (badgeEl) badgeEl.textContent = `${sortedCats.length} Categories Active`;

    if (sortedCats.length === 0) {
      container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 16px; font-size: 11.5px;">No sales by category in this period.</div>`;
      return;
    }

    container.innerHTML = sortedCats.map(c => {
      const pct = totalCatRevenue > 0 ? Math.round((c.revenue / totalCatRevenue) * 100) : 0;
      return `
        <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: 10px; padding: 7px 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px;">
            <span style="font-weight: 800; color: var(--text-dark);">${c.name}</span>
            <span style="font-weight: 800; color: #2563eb;">${currencySymbol}${Math.round(c.revenue).toLocaleString("en-IN")} <span style="font-size: 10.5px; color: var(--text-muted);">(${pct}%)</span></span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 10.5px; color: var(--text-muted); margin-top: 2px;">
            <span>${c.itemsCount} items sold</span>
          </div>
          <div class="leaderboard-progress-bg" style="margin-top: 4px; height: 5px;">
            <div class="leaderboard-progress-bar" style="width: ${pct}%; background: #2563eb;"></div>
          </div>
        </div>
      `;
    }).join("");
  },

  // 3. Customer Retention & VIP Regulars
  renderCustomerInsights(custMap, totalCustCount, repeatRate, currencySymbol) {
    const container = document.getElementById("dash-customer-insights-list");
    if (!container) return;

    const allCusts = Object.values(custMap);
    const topCusts = allCusts
      .filter(c => c.name !== "Walk-in" || c.phone)
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 3);

    const badgeEl = document.getElementById("dash-cust-badge");
    if (badgeEl) badgeEl.textContent = `${totalCustCount} Customers`;

    container.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: 10px; padding: 7px 10px; text-align: center;">
          <span style="font-size: 10.5px; color: var(--text-muted); font-weight: 700;">Repeat Visitors</span>
          <div style="font-size: 16px; font-weight: 900; color: #10b981; margin-top: 1px;">${repeatRate}%</div>
        </div>
        <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: 10px; padding: 7px 10px; text-align: center;">
          <span style="font-size: 10.5px; color: var(--text-muted); font-weight: 700;">Total Served</span>
          <div style="font-size: 16px; font-weight: 900; color: #2563eb; margin-top: 1px;">${totalCustCount}</div>
        </div>
      </div>
      
      <div style="font-size: 10.5px; font-weight: 800; color: var(--text-muted); margin-top: 4px; text-transform: uppercase;">
        <i class="fa-solid fa-star" style="color: #f59e0b;"></i> Top Spenders / Regulars
      </div>
      <div style="display: flex; flex-direction: column; gap: 5px;">
        ${topCusts.length > 0 ? topCusts.map(c => `
          <div style="display: flex; justify-content: space-between; align-items: center; background: #ffffff; border: 1px solid var(--border-color); border-radius: 8px; padding: 6px 9px; font-size: 11.5px;">
            <div>
              <div style="font-weight: 800; color: var(--text-dark);">${c.name}</div>
              <div style="font-size: 10px; color: var(--text-muted);">${c.phone ? `+91 ${c.phone}` : 'Walk-in regular'} • ${c.count} orders</div>
            </div>
            <div style="font-weight: 900; color: #059669;">${currencySymbol}${Math.round(c.spent)}</div>
          </div>
        `).join("") : `<div style="text-align: center; color: var(--text-muted); font-size: 11px; padding: 6px;">Add customer phone numbers in POS to track loyalty!</div>`}
      </div>
    `;
  },

  // 4. Order Types Channel Breakdown
  renderOrderChannels(validOrders, grossSales, currencySymbol) {
    const container = document.getElementById("dash-order-types-container");
    if (!container) return;

    let dineCount = 0, dineSales = 0;
    let takeCount = 0, takeSales = 0;
    let delCount = 0, delSales = 0;

    validOrders.forEach(o => {
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

    const totalBills = validOrders.length;
    const badgeEl = document.getElementById("dash-orders-total-badge");
    if (badgeEl) badgeEl.textContent = `${totalBills} Bills`;

    const dinePct = grossSales > 0 ? Math.round((dineSales / grossSales) * 100) : 0;
    const takePct = grossSales > 0 ? Math.round((takeSales / grossSales) * 100) : 0;
    const delPct = grossSales > 0 ? Math.round((delSales / grossSales) * 100) : 0;

    container.innerHTML = `
      <!-- Dine In -->
      <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: 12px; padding: 9px 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
          <span style="font-size: 12.5px; font-weight: 800; color: var(--text-dark); display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-chair" style="color: #2563eb;"></i> Dine-in (Tables)
          </span>
          <span style="font-size: 12.5px; font-weight: 900; color: #2563eb;">${currencySymbol}${Math.round(dineSales).toLocaleString("en-IN")} (${dinePct}%)</span>
        </div>
        <div style="display: justify; display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted); font-weight: 600;">
          <span>${dineCount} orders</span>
          <span>Avg: ${currencySymbol}${dineCount > 0 ? Math.round(dineSales / dineCount) : 0}/table</span>
        </div>
        <div class="leaderboard-progress-bg" style="margin-top: 4px;">
          <div class="leaderboard-progress-bar" style="width: ${dinePct}%; background: #2563eb;"></div>
        </div>
      </div>

      <!-- Takeaway / Parcel -->
      <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: 12px; padding: 9px 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
          <span style="font-size: 12.5px; font-weight: 800; color: var(--text-dark); display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-bag-shopping" style="color: #10b981;"></i> Takeaway (Parcel)
          </span>
          <span style="font-size: 12.5px; font-weight: 900; color: #059669;">${currencySymbol}${Math.round(takeSales).toLocaleString("en-IN")} (${takePct}%)</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted); font-weight: 600;">
          <span>${takeCount} orders</span>
          <span>Avg: ${currencySymbol}${takeCount > 0 ? Math.round(takeSales / takeCount) : 0}/parcel</span>
        </div>
        <div class="leaderboard-progress-bg" style="margin-top: 4px;">
          <div class="leaderboard-progress-bar" style="width: ${takePct}%; background: #10b981;"></div>
        </div>
      </div>

      <!-- Delivery -->
      <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: 12px; padding: 9px 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
          <span style="font-size: 12.5px; font-weight: 800; color: var(--text-dark); display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-motorcycle" style="color: #f59e0b;"></i> Direct Delivery
          </span>
          <span style="font-size: 12.5px; font-weight: 900; color: #d97706;">${currencySymbol}${Math.round(delSales).toLocaleString("en-IN")} (${delPct}%)</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted); font-weight: 600;">
          <span>${delCount} orders</span>
          <span>Avg: ${currencySymbol}${delCount > 0 ? Math.round(delSales / delCount) : 0}/delivery</span>
        </div>
        <div class="leaderboard-progress-bg" style="margin-top: 4px;">
          <div class="leaderboard-progress-bar" style="width: ${delPct}%; background: #f59e0b;"></div>
        </div>
      </div>
    `;
  },

  // 5. Cash Drawer Reconciliation & Vault Audit
  renderCashReconciliation(cashTotal, upiTotal, todayExpenses, currencySymbol) {
    const container = document.getElementById("dash-cash-reconcile-container");
    if (!container) return;

    const expectedCashInDrawer = Math.max(0, cashTotal - todayExpenses);

    container.innerHTML = `
      <div style="background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 14px; padding: 12px 14px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
        <div>
          <div style="font-size: 11px; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">Expected Cash in Drawer</div>
          <div style="font-size: 22px; font-weight: 900; color: #15803d; margin-top: 2px;">${currencySymbol}${Math.round(expectedCashInDrawer).toLocaleString("en-IN")}</div>
        </div>
        <div style="display: flex; gap: 6px;">
          <button type="button" onclick="views.dashboard.openCashDrawerAuditModal()" style="background: #ffffff; padding: 6px 12px; border-radius: 10px; border: 1px solid #bbf7d0; font-size: 11.5px; font-weight: 800; color: #166534; cursor: pointer; display: flex; align-items: center; gap: 5px;">
            <i class="fa-solid fa-calculator"></i> Tally Cash
          </button>
          <button type="button" onclick="views.dashboard.openDayEndReportModal()" style="background: #166534; padding: 6px 12px; border-radius: 10px; border: none; font-size: 11.5px; font-weight: 800; color: #ffffff; cursor: pointer; display: flex; align-items: center; gap: 5px;">
            <i class="fa-solid fa-lock"></i> Close Day
          </button>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px;">
        <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: 10px; padding: 8px 10px;">
          <span style="color: var(--text-muted); font-size: 11px;">Cash Sales (+)</span>
          <div style="font-weight: 800; color: #059669; font-size: 13.5px;">${currencySymbol}${Math.round(cashTotal).toLocaleString("en-IN")}</div>
        </div>
        <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: 10px; padding: 8px 10px;">
          <span style="color: var(--text-muted); font-size: 11px;">Cash Expenses (-)</span>
          <div style="font-weight: 800; color: #dc2626; font-size: 13.5px;">${currencySymbol}${Math.round(todayExpenses).toLocaleString("en-IN")}</div>
        </div>
      </div>

      <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; font-size: 12px;">
        <span style="font-weight: 700; color: #1e40af;"><i class="fa-solid fa-building-columns"></i> Bank / UPI Received:</span>
        <span style="font-weight: 900; color: #2563eb; font-size: 13.5px;">${currencySymbol}${Math.round(upiTotal).toLocaleString("en-IN")}</span>
      </div>
    `;
  },

  // 6. Shift Rush & Peak Hours (Store Operational Hours: 2:00 PM – 12:00 AM Midnight)
  renderShiftsAndPeak(validOrders, currencySymbol) {
    const container = document.getElementById("dash-shifts-container");
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

    validOrders.forEach(o => {
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

    const peakBadgeEl = document.getElementById("dash-peak-hour-badge");
    if (peakBadgeEl) {
      if (peakHour !== null && maxOrdersInHour > 0) {
        peakBadgeEl.textContent = `Peak: ${formatHourWindow(peakHour)} (${maxOrdersInHour} bills)`;
      } else {
        peakBadgeEl.textContent = "Open 2 PM - 12 AM";
      }
    }

    let otherHtml = '';
    if (otherOrders > 0) {
      otherHtml = `
        <div style="background: #f8fafc; border: 1px dashed var(--border-color); border-radius: 10px; padding: 7px 12px; margin-top: 2px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 11.5px; font-weight: 700; color: var(--text-muted); display: flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-clock-rotate-left"></i> Off-Hours (< 2 PM)
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

    const currentHour = new Date().getHours();
    container.innerHTML = shifts.map(s => {
      const isNow = s.match(currentHour);
      return `
      <div style="background: ${isNow ? '#eff6ff' : '#f8fafc'}; border: ${isNow ? '1.5px solid #2563eb' : '1px solid var(--border-color)'}; border-radius: 10px; padding: 8px 12px; transition: all 0.2s; box-shadow: ${isNow ? '0 0 10px rgba(37,99,235,0.1)' : 'none'};">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 12px; font-weight: 800; color: var(--text-dark); display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid ${s.icon}" style="color: ${s.iconColor};"></i> ${s.name} <span style="font-size: 10.5px; font-weight: 600; color: var(--text-muted);">(${s.label})</span>
            ${isNow ? `<span style="background: #2563eb; color: #fff; font-size: 9px; font-weight: 800; padding: 1.5px 6px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-circle" style="font-size: 5px; animation: pulse 1s infinite alternate;"></i> ACTIVE NOW</span>` : ''}
          </span>
          <span style="font-weight: 900; color: ${s.color}; font-size: 13px;">${currencySymbol}${Math.round(s.sales).toLocaleString("en-IN")}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 10.5px; color: var(--text-muted); font-weight: 600; margin-top: 3px;">
          <span>${s.orders} orders placed</span>
          <span>Avg: ${currencySymbol}${s.orders > 0 ? Math.round(s.sales / s.orders) : 0}/bill</span>
        </div>
      </div>
    `;
    }).join('') + otherHtml;
  },

  // 7. Best Sellers Leaderboard with Sorting
  renderBestSellers(orders, products, categories, currencySymbol) {
    const productSoldCounter = {};
    const productRevenueCounter = {};

    orders.forEach(o => {
      if (o.status === "Cancelled" || !Array.isArray(o.items)) return;
      o.items.forEach(item => {
        productSoldCounter[item.name] = (productSoldCounter[item.name] || 0) + (item.quantity || 1);
        productRevenueCounter[item.name] = (productRevenueCounter[item.name] || 0) + ((item.price || 0) * (item.quantity || 1));
      });
    });

    const bestSellersList = Object.keys(productSoldCounter)
      .map(name => {
        const prod = products.find(p => p.name === name);
        const cat = prod ? categories.find(c => c.id === prod.category) : null;
        return {
          name: name,
          category: cat ? cat.name : "Menu Item",
          quantity: productSoldCounter[name],
          revenue: productRevenueCounter[name] || 0
        };
      })
      .sort((a, b) => {
        if (this.bestSellerSort === "rev") return b.revenue - a.revenue;
        return b.quantity - a.quantity;
      })
      .slice(0, 5);

    const container = document.getElementById("dash-best-sellers-list");
    if (!container) return;

    if (bestSellersList.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 30px 10px; font-weight: 600; font-size: 13px;">
          <i class="fa-solid fa-utensils" style="font-size: 24px; color: #cbd5e1; margin-bottom: 8px; display: block;"></i>
          No menu sales recorded for this timeframe yet.
        </div>
      `;
      return;
    }

    const maxVal = this.bestSellerSort === "rev" 
      ? (bestSellersList[0].revenue || 1) 
      : (bestSellersList[0].quantity || 1);

    const rankClasses = ["rank-1", "rank-2", "rank-3", "rank-norm", "rank-norm"];
    const rankIcons = ["🥇", "🥈", "🥉", "4", "5"];

    container.innerHTML = bestSellersList.map((item, idx) => {
      const curVal = this.bestSellerSort === "rev" ? item.revenue : item.quantity;
      const pct = Math.round((curVal / maxVal) * 100);
      const rankClass = rankClasses[idx] || "rank-norm";
      const rankLabel = rankIcons[idx] || `${idx + 1}`;

      return `
        <div style="padding: 9px 12px; background: #f8fafc; border: 1px solid var(--border-color); border-radius: 12px; display: flex; flex-direction: column; gap: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 10px; min-width: 0;">
              <span class="rank-pill ${rankClass}">${rankLabel}</span>
              <div style="min-width: 0;">
                <div style="font-weight: 800; font-size: 13px; color: var(--text-dark); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  ${item.name}
                </div>
                <span style="font-size: 10.5px; color: var(--text-muted); font-weight: 600;">${item.category}</span>
              </div>
            </div>
            <div style="text-align: right; flex-shrink: 0;">
              <div style="font-weight: 800; color: #2563eb; font-size: 12.5px;">${item.quantity} sold</div>
              <div style="font-size: 11px; color: var(--text-muted); font-weight: 600;">${currencySymbol}${Math.round(item.revenue).toLocaleString("en-IN")}</div>
            </div>
          </div>
          <div class="leaderboard-progress-bg">
            <div class="leaderboard-progress-bar" style="width: ${pct}%;"></div>
          </div>
        </div>
      `;
    }).join("");
  },

  // 8. Recent Register Bills Feed with Receipt Viewer
  renderRecentBills(orders, currencySymbol) {
    const container = document.getElementById("dash-recent-orders-list");
    if (!container) return;

    if (!orders || orders.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 30px 10px; font-weight: 600; font-size: 13px;">
          <i class="fa-solid fa-receipt" style="font-size: 24px; color: #cbd5e1; margin-bottom: 8px; display: block;"></i>
          No bills recorded in this timeframe yet.
        </div>
      `;
      return;
    }

    const sorted = [...orders].sort((a, b) => (b.orderNumber || 0) - (a.orderNumber || 0)).slice(0, 6);

    container.innerHTML = sorted.map(o => {
      const timeStr = this.formatTime(o.createdAt);
      const isCash = o.paymentMethod === "Cash";
      const payPillClass = isCash ? "pill-cash" : "pill-upi";
      const payIcon = isCash ? "fa-money-bill-wave" : "fa-qrcode";

      let statusColor = "#f59e0b";
      let statusBg = "#fffbeb";
      if (o.status === "Completed") { statusColor = "#2563eb"; statusBg = "#eff6ff"; }
      else if (o.status === "Ready") { statusColor = "#10b981"; statusBg = "#ecfdf5"; }
      else if (o.status === "Cancelled") { statusColor = "#94a3b8"; statusBg = "#f1f5f9"; }

      const itemsSummary = Array.isArray(o.items)
        ? o.items.map(i => `${i.quantity}x ${i.name}`).join(", ")
        : "Order items";

      return `
        <div class="dash-stream-row" style="padding: 10px 14px; background: #f8fafc; border: 1px solid var(--border-color); border-radius: 12px; display: flex; align-items: center; justify-content: space-between; gap: 12px; min-width: 0; width: 100%; box-sizing: border-box;">
          <div style="min-width: 0; flex: 1 1 0%; overflow: hidden;">
            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
              <span style="font-weight: 800; font-size: 13px; color: var(--text-dark);">#${o.orderNumber || "Bill"}</span>
              <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">${timeStr}</span>
              <span class="dash-sub-pill ${payPillClass}" style="padding: 1.5px 7px; font-size: 10px;">
                <i class="fa-solid ${payIcon}"></i> ${o.paymentMethod || "UPI"}
              </span>
              <span style="font-size: 10px; font-weight: 700; color: #475569; background: #e2e8f0; padding: 1.5px 7px; border-radius: 6px;">
                ${o.type || "Dine-in"}
              </span>
            </div>
            <div style="font-size: 11px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 3px; width: 100%; min-width: 0;" title="${itemsSummary.replace(/"/g, '&quot;')}">
              ${itemsSummary}
            </div>
          </div>
          <div style="text-align: right; flex-shrink: 0; display: flex; flex-direction: column; align-items: flex-end; gap: 3px; min-width: 85px;">
            <div style="font-weight: 900; font-size: 13.5px; color: var(--text-dark);">${currencySymbol}${Math.round(o.total || 0)}</div>
            <div style="display: flex; align-items: center; gap: 5px;">
              <span style="display: inline-block; padding: 2px 7px; border-radius: 7px; font-size: 10px; font-weight: 750; color: ${statusColor}; background: ${statusBg}; white-space: nowrap;">
                ${o.status || "Pending"}
              </span>
              <button type="button" onclick="views.dashboard.openViewBillModal('${o.id}')" title="View Full Bill Slip" style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 3px 7px; font-size: 10.5px; cursor: pointer; color: #2563eb; display: inline-flex; align-items: center; justify-content: center;">
                <i class="fa-solid fa-receipt"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join("");
  },

  // 9. Interactive Visual Sales Chart (7-Day Trend OR Hourly Rush Pattern)
  renderSalesChart(orders, todayStr) {
    const textMuted = '#64748b';
    const borderColor = 'rgba(202, 213, 226, 0.6)';

    const trendsCanvas = document.getElementById("salesTrendsChartCanvas");
    if (!trendsCanvas) return;

    const trendsCtx = trendsCanvas.getContext("2d");
    if (this.salesChart) {
      this.salesChart.destroy();
    }

    const titleEl = document.getElementById("dash-chart-title-text");

    if (this.activeChartMode === "hourlyRush" || this.activeChartMode === "hourlyOrders") {
      // HOURLY RUSH PATTERN (2 PM - 12 AM Operational hours)
      if (titleEl) {
        titleEl.textContent = this.activeChartMode === "hourlyRush" ? "Today's Hourly Revenue Rush (₹)" : "Today's Hourly Bill Count";
      }

      const hours = [14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
      const hourLabels = ["2 PM", "3 PM", "4 PM", "5 PM", "6 PM", "7 PM", "8 PM", "9 PM", "10 PM", "11 PM"];
      const hourlySales = new Array(hours.length).fill(0);
      const hourlyOrders = new Array(hours.length).fill(0);

      const todayValid = orders.filter(o => o.createdAt && o.createdAt.substring(0, 10) === todayStr && o.status !== "Cancelled");
      
      todayValid.forEach(o => {
        const d = new Date(o.createdAt);
        if (isNaN(d.getTime())) return;
        const h = d.getHours();
        const idx = hours.indexOf(h);
        if (idx !== -1) {
          hourlySales[idx] += (Number(o.total) || 0);
          hourlyOrders[idx] += 1;
        }
      });

      const isRevenue = this.activeChartMode === "hourlyRush";
      const datasetData = isRevenue ? hourlySales.map(v => Math.round(v)) : hourlyOrders;

      this.salesChart = new Chart(trendsCtx, {
        type: "bar",
        data: {
          labels: hourLabels,
          datasets: [{
            label: isRevenue ? "Hourly Sales (₹)" : "Bills Count",
            data: datasetData,
            backgroundColor: isRevenue ? "rgba(37, 99, 235, 0.85)" : "rgba(16, 185, 129, 0.85)",
            hoverBackgroundColor: isRevenue ? "#1d4ed8" : "#059669",
            borderRadius: 6,
            borderSkipped: false
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              titleFont: { family: "Outfit", size: 12, weight: "bold" },
              bodyFont: { family: "Outfit", size: 11 },
              padding: 10,
              cornerRadius: 8,
              callbacks: {
                label: (ctx) => isRevenue ? ` Revenue: ₹${ctx.raw.toLocaleString("en-IN")}` : ` Orders: ${ctx.raw} bills`
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
              ticks: {
                color: textMuted,
                font: { family: "Outfit", size: 11, weight: "600" },
                callback: (val) => isRevenue ? `₹${val}` : `${val}`
              }
            }
          }
        }
      });

    } else {
      // 7-DAY REVENUE TRAJECTORY
      if (titleEl) titleEl.textContent = "7-Day Revenue Trajectory";

      const daysLabel = [];
      const salesData = [];

      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = this.getLocalDateStr(d);
        
        const dayLabel = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });
        daysLabel.push(dayLabel);

        const daySales = orders
          .filter(o => {
            if (!o.createdAt || o.status === "Cancelled") return false;
            return o.createdAt.substring(0, 10) === dateStr;
          })
          .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

        salesData.push(Math.round(daySales));
      }

      const fillGradient = trendsCtx.createLinearGradient(0, 0, 0, 240);
      fillGradient.addColorStop(0, 'rgba(37, 99, 235, 0.25)');
      fillGradient.addColorStop(1, 'rgba(37, 99, 235, 0.01)');

      this.salesChart = new Chart(trendsCtx, {
        type: "line",
        data: {
          labels: daysLabel,
          datasets: [
            {
              label: "Daily Revenue (₹)",
              data: salesData,
              borderColor: "#2563eb",
              backgroundColor: fillGradient,
              borderWidth: 3,
              tension: 0.35,
              fill: true,
              pointBackgroundColor: "#2563eb",
              pointBorderColor: "#ffffff",
              pointBorderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 6
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
              cornerRadius: 10,
              callbacks: {
                label: (ctx) => ` Revenue: ₹${ctx.raw.toLocaleString("en-IN")}`
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
              ticks: {
                color: textMuted,
                font: { family: "Outfit", size: 11, weight: "600" },
                callback: (val) => `₹${val}`
              }
            }
          }
        }
      });
    }
  },

  // 10. Payment Distribution Doughnut Chart
  renderPaymentChart(orders, todayStr) {
    const paymentCanvas = document.getElementById("paymentPieChartCanvas");
    if (!paymentCanvas) return;

    const filtered = this.getFilteredOrders().filter(o => o.status !== "Cancelled");
    let upiSum = 0, cashSum = 0, cardSum = 0;

    filtered.forEach(o => {
      const amt = Number(o.total) || 0;
      if (o.paymentMethod === "Cash") cashSum += amt;
      else if (o.paymentMethod === "Card") cardSum += amt;
      else upiSum += amt;
    });

    const totalPayment = upiSum + cashSum + cardSum;
    const paymentCtx = paymentCanvas.getContext("2d");

    if (this.paymentChart) {
      this.paymentChart.destroy();
    }

    const textMuted = '#64748b';

    this.paymentChart = new Chart(paymentCtx, {
      type: "doughnut",
      data: {
        labels: ["UPI", "Cash", "Card"],
        datasets: [
          {
            data: totalPayment === 0 ? [1] : [upiSum, cashSum, cardSum],
            backgroundColor: totalPayment === 0 ? ["#e2e8f0"] : ["#2563eb", "#10b981", "#8b5cf6"],
            borderWidth: 2,
            borderColor: "#ffffff",
            hoverOffset: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: textMuted,
              font: { family: "Outfit", size: 11, weight: "bold" },
              padding: 10,
              boxWidth: 10
            }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleFont: { family: "Outfit", size: 12, weight: "bold" },
            bodyFont: { family: "Outfit", size: 11 },
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (context) => {
                if (totalPayment === 0) return " No transactions yet";
                const val = context.raw;
                const pct = totalPayment > 0 ? Math.round((val / totalPayment) * 100) : 0;
                return ` ${context.label}: ₹${val.toLocaleString("en-IN")} (${pct}%)`;
              }
            }
          }
        },
        cutout: "68%"
      }
    });
  },

  // 11. Category Revenue Share Chart
  renderCategoryChart(validOrders) {
    const canvas = document.getElementById("categoryChartCanvas");
    if (!canvas) return;

    const products = window.db.get("products") || [];
    const categories = window.db.get("categories") || [];

    const catTotals = {};
    categories.forEach(c => { catTotals[c.name] = 0; });
    catTotals["Other"] = 0;

    validOrders.forEach(o => {
      if (Array.isArray(o.items)) {
        o.items.forEach(item => {
          const prod = products.find(p => p.name === item.name);
          const cat = prod ? categories.find(c => c.id === prod.category) : null;
          const catName = cat ? cat.name : "Other";
          const lineTotal = (item.price || 0) * (item.quantity || 1);
          catTotals[catName] = (catTotals[catName] || 0) + lineTotal;
        });
      }
    });

    const activeLabels = [];
    const activeValues = [];
    const palette = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#64748b"];

    Object.keys(catTotals).forEach(name => {
      if (catTotals[name] > 0) {
        activeLabels.push(name);
        activeValues.push(Math.round(catTotals[name]));
      }
    });

    const totalCatRev = activeValues.reduce((a, b) => a + b, 0);
    const badgeEl = document.getElementById("dash-cat-chart-badge");
    if (badgeEl) badgeEl.textContent = `${activeLabels.length} Categories`;

    const ctx = canvas.getContext("2d");
    if (this.categoryChart) {
      this.categoryChart.destroy();
    }

    const textMuted = '#64748b';

    this.categoryChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: activeLabels.length === 0 ? ["No Sales"] : activeLabels,
        datasets: [{
          data: activeLabels.length === 0 ? [1] : activeValues,
          backgroundColor: activeLabels.length === 0 ? ["#e2e8f0"] : palette.slice(0, activeLabels.length),
          borderWidth: 2,
          borderColor: "#ffffff",
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: textMuted,
              font: { family: "Outfit", size: 11, weight: "bold" },
              padding: 10,
              boxWidth: 10
            }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleFont: { family: "Outfit", size: 12, weight: "bold" },
            bodyFont: { family: "Outfit", size: 11 },
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (context) => {
                if (totalCatRev === 0) return " No category sales";
                const val = context.raw;
                const pct = totalCatRev > 0 ? Math.round((val / totalCatRev) * 100) : 0;
                return ` ${context.label}: ₹${val.toLocaleString("en-IN")} (${pct}%)`;
              }
            }
          }
        },
        cutout: "68%"
      }
    });
  },

  // Interactive Feature 1: Quick Shop Expense Logger Modal
  openQuickExpenseModal() {
    const todayStr = this.getLocalDateStr();
    const bodyHtml = `
      <form id="dash-quick-expense-form" style="display: flex; flex-direction: column; gap: 12px; font-size: 13px;">
        <div>
          <label style="font-weight: 700; color: var(--text-dark); display: block; margin-bottom: 4px;">Expense Description / Reason *</label>
          <input type="text" id="quick-exp-desc" placeholder="e.g. Burger Buns, Dairy / Milk, Gas Cylinder, Staff Tea" required style="width: 100%; border: 1.5px solid var(--border-color); border-radius: 10px; padding: 8px 12px; font-size: 13px; outline: none; box-sizing: border-box;">
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div>
            <label style="font-weight: 700; color: var(--text-dark); display: block; margin-bottom: 4px;">Amount (₹) *</label>
            <input type="number" id="quick-exp-amt" min="1" step="any" placeholder="₹0" required style="width: 100%; border: 1.5px solid var(--border-color); border-radius: 10px; padding: 8px 12px; font-size: 13px; outline: none; box-sizing: border-box; font-weight: 800; color: #2563eb;">
          </div>
          <div>
            <label style="font-weight: 700; color: var(--text-dark); display: block; margin-bottom: 4px;">Category</label>
            <select id="quick-exp-cat" style="width: 100%; border: 1.5px solid var(--border-color); border-radius: 10px; padding: 8px 10px; font-size: 12.5px; outline: none; box-sizing: border-box; background: #fff;">
              <option value="Raw material">Raw material</option>
              <option value="Milk / Dairy">Milk / Dairy</option>
              <option value="Vegetables">Vegetables</option>
              <option value="Gas / Fuel">Gas / Fuel</option>
              <option value="Tea / Refreshment">Tea / Refreshment</option>
              <option value="Electricity">Electricity</option>
              <option value="Salary">Salary</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Other expenses">Other expenses</option>
            </select>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div>
            <label style="font-weight: 700; color: var(--text-dark); display: block; margin-bottom: 4px;">Paid From</label>
            <select id="quick-exp-mode" style="width: 100%; border: 1.5px solid var(--border-color); border-radius: 10px; padding: 8px 10px; font-size: 12.5px; outline: none; box-sizing: border-box; background: #fff;">
              <option value="Cash">Cash (Deducts from Drawer)</option>
              <option value="UPI">UPI / Bank Account</option>
            </select>
          </div>
          <div>
            <label style="font-weight: 700; color: var(--text-dark); display: block; margin-bottom: 4px;">Date</label>
            <input type="date" id="quick-exp-date" value="${todayStr}" style="width: 100%; border: 1.5px solid var(--border-color); border-radius: 10px; padding: 8px 10px; font-size: 12.5px; outline: none; box-sizing: border-box;">
          </div>
        </div>
      </form>
    `;

    window.customModal.show({
      title: "Log Shop Overhead Expense",
      bodyHtml: bodyHtml,
      confirmText: "Save Expense",
      cancelText: "Cancel",
      onConfirm: () => {
        const desc = (document.getElementById("quick-exp-desc") ? document.getElementById("quick-exp-desc").value.trim() : "");
        const amt = Number(document.getElementById("quick-exp-amt") ? document.getElementById("quick-exp-amt").value : 0);
        const cat = document.getElementById("quick-exp-cat") ? document.getElementById("quick-exp-cat").value : "Other expenses";
        const mode = document.getElementById("quick-exp-mode") ? document.getElementById("quick-exp-mode").value : "Cash";
        const date = (document.getElementById("quick-exp-date") ? document.getElementById("quick-exp-date").value : "") || todayStr;

        if (!desc) {
          window.showToast("Please enter an expense description.", "error");
          return false;
        }
        if (!amt || amt <= 0) {
          window.showToast("Please enter a valid expense amount.", "error");
          return false;
        }

        const expenses = window.db.get("expenses") || [];
        expenses.unshift({
          id: "EXP-" + Date.now(),
          description: desc,
          amount: amt,
          category: cat,
          paymentMethod: mode,
          date: date,
          createdAt: new Date().toISOString()
        });
        window.db.set("expenses", expenses);
        window.showToast(`Logged ₹${amt} expense: ${desc}`, "success");
        this.calculateAndRenderMetrics();
      }
    });
  },

  // Interactive Feature 2: Cash Drawer Audit Modal with Difference Calculator
  openCashDrawerAuditModal() {
    const orders = window.db.get("orders") || [];
    const expenses = window.db.get("expenses") || [];
    const todayStr = this.getLocalDateStr();

    const cashSales = orders
      .filter(o => o.createdAt && o.createdAt.substring(0, 10) === todayStr && o.status !== "Cancelled" && o.paymentMethod === "Cash")
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    const cashExpenses = expenses
      .filter(e => (e.date === todayStr || (e.createdAt && e.createdAt.substring(0, 10) === todayStr)) && e.paymentMethod === "Cash")
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const expectedCash = Math.max(0, cashSales - cashExpenses);

    const bodyHtml = `
      <div style="display: flex; flex-direction: column; gap: 14px; font-size: 13px;">
        <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; padding: 12px 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 11px; font-weight: 800; color: #166534; text-transform: uppercase;">Expected In Drawer:</span>
            <span style="font-size: 18px; font-weight: 900; color: #15803d;">₹${Math.round(expectedCash).toLocaleString("en-IN")}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; color: #166534; margin-top: 4px;">
            <span>(+) Cash Sales: ₹${Math.round(cashSales)}</span>
            <span>(-) Cash Expenses: ₹${Math.round(cashExpenses)}</span>
          </div>
        </div>

        <div>
          <label style="font-weight: 800; color: var(--text-dark); display: block; margin-bottom: 6px;">
            Enter Physical Counted Cash (₹):
          </label>
          <input type="number" id="drawer-counted-input" placeholder="Enter counted amount in cash register" min="0" step="any" style="width: 100%; border: 2px solid #2563eb; border-radius: 12px; padding: 10px 14px; font-size: 16px; font-weight: 900; outline: none; box-sizing: border-box; color: #2563eb;">
        </div>

        <div id="drawer-audit-variance-box" style="display: none; border-radius: 12px; padding: 12px 14px;">
          <!-- Injected on input -->
        </div>

        <div>
          <label style="font-weight: 700; color: var(--text-dark); display: block; margin-bottom: 4px;">Audit Note / Manager Signature:</label>
          <input type="text" id="drawer-audit-note" placeholder="e.g. Shift closing tally checked by Sanket" style="width: 100%; border: 1px solid var(--border-color); border-radius: 10px; padding: 8px 12px; font-size: 12.5px; outline: none; box-sizing: border-box;">
        </div>
      </div>
    `;

    window.customModal.show({
      title: "Cash Drawer Physical Audit & Tally",
      bodyHtml: bodyHtml,
      confirmText: "Verify & Save Audit",
      cancelText: "Close",
      onConfirm: () => {
        const countedVal = Number(document.getElementById("drawer-counted-input") ? document.getElementById("drawer-counted-input").value : null);
        if (isNaN(countedVal) || countedVal === null || document.getElementById("drawer-counted-input").value === "") {
          window.showToast("Please enter counted cash amount.", "error");
          return false;
        }

        const variance = countedVal - expectedCash;
        const note = (document.getElementById("drawer-audit-note") ? document.getElementById("drawer-audit-note").value.trim() : "") || "Verified";

        const auditRecord = {
          date: todayStr,
          timestamp: new Date().toISOString(),
          expected: expectedCash,
          counted: countedVal,
          variance: variance,
          note: note
        };

        const audits = window.db.get("drawer_audits") || [];
        audits.unshift(auditRecord);
        window.db.set("drawer_audits", audits);

        if (variance === 0) {
          window.showToast("Cash Drawer perfectly balanced! ₹0 difference.", "success");
        } else if (variance > 0) {
          window.showToast(`Drawer audited: Over by +₹${Math.round(variance)}`, "info");
        } else {
          window.showToast(`Drawer audited: Short by -₹${Math.round(Math.abs(variance))}`, "error");
        }
        this.calculateAndRenderMetrics();
      }
    });

    // Real-time variance calculation listener
    setTimeout(() => {
      const inputEl = document.getElementById("drawer-counted-input");
      const varBox = document.getElementById("drawer-audit-variance-box");
      if (inputEl && varBox) {
        inputEl.addEventListener("input", () => {
          const val = Number(inputEl.value);
          if (isNaN(val) || inputEl.value === "") {
            varBox.style.display = "none";
            return;
          }
          varBox.style.display = "block";
          const diff = val - expectedCash;
          if (diff === 0) {
            varBox.style.background = "#f0fdf4";
            varBox.style.border = "1.5px solid #86efac";
            varBox.innerHTML = `
              <div style="display: flex; justify-content: space-between; align-items: center; font-weight: 800; color: #166534;">
                <span><i class="fa-solid fa-circle-check"></i> Drawer Balanced:</span>
                <span>₹0 Variance</span>
              </div>
            `;
          } else if (diff > 0) {
            varBox.style.background = "#eff6ff";
            varBox.style.border = "1.5px solid #93c5fd";
            varBox.innerHTML = `
              <div style="display: flex; justify-content: space-between; align-items: center; font-weight: 800; color: #1e40af;">
                <span><i class="fa-solid fa-arrow-up"></i> Cash Excess / Over:</span>
                <span>+₹${Math.round(diff).toLocaleString("en-IN")}</span>
              </div>
            `;
          } else {
            varBox.style.background = "#fef2f2";
            varBox.style.border = "1.5px solid #fca5a5";
            varBox.innerHTML = `
              <div style="display: flex; justify-content: space-between; align-items: center; font-weight: 800; color: #991b1b;">
                <span><i class="fa-solid fa-triangle-exclamation"></i> Cash Shortage:</span>
                <span>-₹${Math.round(Math.abs(diff)).toLocaleString("en-IN")}</span>
              </div>
            `;
          }
        });
      }
    }, 100);
  },

  // Interactive Feature 3: Day-End Register Closing Z-Report Modal
  openDayEndReportModal() {
    const orders = window.db.get("orders") || [];
    const expenses = window.db.get("expenses") || [];
    const settings = window.db.get("settings") || {};
    const currencySymbol = settings.currencySymbol || "₹";

    const todayStr = this.getLocalDateStr();
    const todayOrders = orders.filter(o => o.createdAt && o.createdAt.substring(0, 10) === todayStr);
    const todayValid = todayOrders.filter(o => o.status !== "Cancelled");

    let gross = 0, cash = 0, upi = 0, card = 0, bogoDisc = 0, flatDisc = 0;
    let dineCount = 0, takeCount = 0, delCount = 0;

    todayValid.forEach(o => {
      const amt = Number(o.total) || 0;
      gross += amt;
      if (o.paymentMethod === "Cash") cash += amt;
      else if (o.paymentMethod === "Card") card += amt;
      else upi += amt;

      bogoDisc += (Number(o.bogoDiscount) || 0);
      flatDisc += (Number(o.discount) || 0);

      const type = (o.type || "Dine-in").toLowerCase();
      if (type.includes("takeaway") || type.includes("parcel")) takeCount++;
      else if (type.includes("delivery")) delCount++;
      else dineCount++;
    });

    const cashExpenses = expenses
      .filter(e => (e.date === todayStr || (e.createdAt && e.createdAt.substring(0, 10) === todayStr)) && e.paymentMethod === "Cash")
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const expectedClosingCash = Math.max(0, cash - cashExpenses);
    const nowStr = new Date().toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const user = window.db.getCurrentUser();
    const cashierName = user ? user.name : "Sanket Barot";

    const bodyHtml = `
      <div id="z-report-printable-area" style="font-family: 'Courier New', monospace; font-size: 13px; color: #000; background: #fff; padding: 16px; border: 1px dashed #cbd5e1; border-radius: 12px; line-height: 1.4; max-width: 360px; margin: 0 auto;">
        <div style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px;">
          <h2 style="margin: 0; font-size: 17px; font-weight: 900; letter-spacing: 0.5px;">CRUST & CHILLY</h2>
          <div style="font-size: 11px; font-weight: 800; margin-top: 2px;">*** DAILY CLOSING Z-REPORT ***</div>
          <div style="font-size: 11px; margin-top: 3px;">Date: ${todayStr} | Time: ${nowStr}</div>
          <div style="font-size: 11px;">Register: Main POS Terminal • Cashier: ${cashierName}</div>
        </div>

        <div style="border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px;">
          <div style="display: flex; justify-content: space-between;"><span>Total Bills Generated:</span><strong>${todayOrders.length}</strong></div>
          <div style="display: flex; justify-content: space-between;"><span>Completed Orders:</span><strong>${todayValid.length}</strong></div>
          <div style="display: flex; justify-content: space-between;"><span>Cancelled Orders:</span><strong>${todayOrders.length - todayValid.length}</strong></div>
          <div style="display: flex; justify-content: space-between;"><span>Dine-in / Tables:</span><strong>${dineCount}</strong></div>
          <div style="display: flex; justify-content: space-between;"><span>Takeaway / Parcel:</span><strong>${takeCount}</strong></div>
          <div style="display: flex; justify-content: space-between;"><span>Direct Delivery:</span><strong>${delCount}</strong></div>
        </div>

        <div style="border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px;">
          <div style="font-weight: 900; margin-bottom: 4px;">COLLECTIONS & REVENUE</div>
          <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 900;">
            <span>GROSS SALES:</span>
            <span>${currencySymbol}${Math.round(gross).toLocaleString("en-IN")}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 4px;"><span>Cash Collection:</span><span>${currencySymbol}${Math.round(cash).toLocaleString("en-IN")}</span></div>
          <div style="display: flex; justify-content: space-between;"><span>UPI / Online:</span><span>${currencySymbol}${Math.round(upi).toLocaleString("en-IN")}</span></div>
          ${card > 0 ? `<div style="display: flex; justify-content: space-between;"><span>Card:</span><span>${currencySymbol}${Math.round(card).toLocaleString("en-IN")}</span></div>` : ''}
          <div style="display: flex; justify-content: space-between; color: #475569;"><span>BOGO Discounts:</span><span>-${currencySymbol}${Math.round(bogoDisc).toLocaleString("en-IN")}</span></div>
          <div style="display: flex; justify-content: space-between; color: #475569;"><span>Promo Discounts:</span><span>-${currencySymbol}${Math.round(flatDisc).toLocaleString("en-IN")}</span></div>
        </div>

        <div style="border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px;">
          <div style="font-weight: 900; margin-bottom: 4px;">DRAWER CASH RECONCILIATION</div>
          <div style="display: flex; justify-content: space-between;"><span>(+) Cash Sales:</span><span>${currencySymbol}${Math.round(cash).toLocaleString("en-IN")}</span></div>
          <div style="display: flex; justify-content: space-between; color: #dc2626;"><span>(-) Cash Expenses Paid:</span><span>-${currencySymbol}${Math.round(cashExpenses).toLocaleString("en-IN")}</span></div>
          <div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: 900; color: #15803d; margin-top: 6px; padding-top: 4px; border-top: 1px dashed #000;">
            <span>EXPECTED DRAWER CASH:</span>
            <span>${currencySymbol}${Math.round(expectedClosingCash).toLocaleString("en-IN")}</span>
          </div>
        </div>

        <div style="text-align: center; font-size: 10px; margin-top: 8px; color: #475569;">
          <div>Day-End Reconciliation Verified & Closed</div>
          <div style="margin-top: 16px; display: flex; justify-content: space-between; font-size: 10px;">
            <span>Cashier: ________________</span>
            <span>Manager: ________________</span>
          </div>
        </div>
      </div>
    `;

    window.customModal.show({
      title: "Daily Register Closing Z-Report",
      bodyHtml: bodyHtml,
      confirmText: "Print Slip",
      cancelText: "Close",
      onConfirm: () => {
        document.body.classList.add("printing-z-report");
        window.print();
        setTimeout(() => {
          document.body.classList.remove("printing-z-report");
        }, 1000);
      }
    });
  },

  // Interactive Feature 4: Custom Date Range Picker Modal
  openCustomDateRangeModal() {
    const todayStr = this.getLocalDateStr();
    const defaultStart = this.customStartDate || todayStr;
    const defaultEnd = this.customEndDate || todayStr;

    const bodyHtml = `
      <div style="display: flex; flex-direction: column; gap: 14px; font-size: 13px;">
        <p style="margin: 0; color: var(--text-muted);">Select custom start and end date to analyze business performance:</p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label style="font-weight: 700; color: var(--text-dark); display: block; margin-bottom: 4px;">Start Date</label>
            <input type="date" id="dash-custom-start" value="${defaultStart}" style="width: 100%; border: 1.5px solid var(--border-color); border-radius: 10px; padding: 8px 10px; font-size: 13px; outline: none; box-sizing: border-box;">
          </div>
          <div>
            <label style="font-weight: 700; color: var(--text-dark); display: block; margin-bottom: 4px;">End Date</label>
            <input type="date" id="dash-custom-end" value="${defaultEnd}" style="width: 100%; border: 1.5px solid var(--border-color); border-radius: 10px; padding: 8px 10px; font-size: 13px; outline: none; box-sizing: border-box;">
          </div>
        </div>
      </div>
    `;

    window.customModal.show({
      title: "Select Custom Analytics Period",
      bodyHtml: bodyHtml,
      confirmText: "Apply Range",
      cancelText: "Cancel",
      onConfirm: () => {
        const startVal = document.getElementById("dash-custom-start") ? document.getElementById("dash-custom-start").value : null;
        const endVal = document.getElementById("dash-custom-end") ? document.getElementById("dash-custom-end").value : null;

        if (!startVal || !endVal) {
          window.showToast("Please choose both start and end date.", "error");
          return false;
        }

        if (startVal > endVal) {
          window.showToast("Start date cannot be after end date.", "error");
          return false;
        }

        this.customStartDate = startVal;
        this.customEndDate = endVal;
        this.setTimeframe("custom");
        window.showToast(`Showing data from ${startVal} to ${endVal}`, "success");
      }
    });
  },

  // Interactive Feature 5: Quick Restock Ingredient Prompt
  openQuickRestockModal(ingredientId, ingredientName) {
    const qty = prompt(`Enter restock units to ADD for "${ingredientName}":`, "10");
    if (qty !== null && !isNaN(Number(qty)) && Number(qty) > 0) {
      const ingredients = window.db.get("ingredients") || [];
      const item = ingredients.find(i => i.id === ingredientId || i.name === ingredientName);
      if (item) {
        item.stock = (Number(item.stock) || 0) + Number(qty);
        window.db.set("ingredients", ingredients);
        window.showToast(`Added ${qty} ${item.unit || 'units'} to ${ingredientName}. New stock: ${item.stock}`, "success");
        this.calculateAndRenderMetrics();
      }
    }
  },

  // Interactive Feature 6: View Full Bill Receipt Modal
  openViewBillModal(orderId) {
    const orders = window.db.get("orders") || [];
    const order = orders.find(o => o.id === orderId);
    if (!order) {
      window.showToast("Order not found.", "error");
      return;
    }

    const settings = window.db.get("settings") || {};
    const currencySymbol = settings.currencySymbol || "₹";
    const dateFormatted = new Date(order.createdAt).toLocaleString("en-IN");

    const itemsHtml = Array.isArray(order.items) ? order.items.map(i => `
      <tr>
        <td style="padding: 4px 0;">${i.quantity}x ${i.name}</td>
        <td style="text-align: right; padding: 4px 0;">${currencySymbol}${((i.price || 0) * (i.quantity || 1))}</td>
      </tr>
    `).join("") : "";

    const bodyHtml = `
      <div style="font-family: 'Courier New', monospace; font-size: 13px; color: #000; background: #fff; padding: 14px; border: 1px dashed #cbd5e1; border-radius: 12px; line-height: 1.4; max-width: 320px; margin: 0 auto;">
        <div style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px;">
          <h3 style="margin: 0; font-size: 16px; font-weight: 900;">CRUST & CHILLY</h3>
          <div style="font-size: 11px;">Bill #${order.orderNumber || "N/A"}</div>
          <div style="font-size: 10px; color: #555;">${dateFormatted}</div>
          <div style="font-size: 11px; margin-top: 3px;">Type: <strong>${order.type || "Dine-in"}</strong> • Mode: <strong>${order.paymentMethod || "UPI"}</strong></div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 12px; border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px;">
          ${itemsHtml}
        </table>

        <div style="display: flex; flex-direction: column; gap: 3px; font-size: 12px; border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px;">
          <div style="display: flex; justify-content: space-between;"><span>Subtotal:</span><span>${currencySymbol}${Math.round(order.subtotal || order.total || 0)}</span></div>
          ${order.bogoDiscount ? `<div style="display: flex; justify-content: space-between; color: #166534;"><span>BOGO Discount:</span><span>-${currencySymbol}${Math.round(order.bogoDiscount)}</span></div>` : ''}
          ${order.discount ? `<div style="display: flex; justify-content: space-between; color: #166534;"><span>Promo Discount:</span><span>-${currencySymbol}${Math.round(order.discount)}</span></div>` : ''}
          <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 900; margin-top: 4px;">
            <span>TOTAL AMOUNT:</span>
            <span>${currencySymbol}${Math.round(order.total || 0)}</span>
          </div>
        </div>

        <div style="text-align: center; font-size: 10px; color: #555; margin-top: 6px;">
          Thank you for visiting Crust & Chilly!
        </div>
      </div>
    `;

    window.customModal.show({
      title: `Bill #${order.orderNumber || "Details"}`,
      bodyHtml: bodyHtml,
      confirmText: "Close",
      cancelText: "Print",
      onCancel: () => {
        window.print();
      }
    });
  },

  // Interactive Feature 7: Export Executive CSV
  exportExecutiveCSV() {
    const orders = this.getFilteredOrders();
    const expenses = window.db.get("expenses") || [];
    const settings = window.db.get("settings") || {};
    const curr = settings.currencySymbol || "₹";

    if (orders.length === 0) {
      window.showToast("No orders available to export for this timeframe.", "error");
      return;
    }

    let csv = "Order No,Date & Time,Type,Table,Customer,Phone,Payment Mode,Status,Items Count,Gross Total,Discounts,Net Total\n";

    orders.forEach(o => {
      const itemsCount = Array.isArray(o.items) ? o.items.reduce((sum, i) => sum + (i.quantity || 1), 0) : 0;
      const totalDisc = (Number(o.bogoDiscount) || 0) + (Number(o.discount) || 0);
      const row = [
        `"${o.orderNumber || ''}"`,
        `"${o.createdAt || ''}"`,
        `"${o.type || 'Dine-in'}"`,
        `"${o.tableNo || '-'}"`,
        `"${(o.customerName || 'Walk-in').replace(/"/g, '""')}"`,
        `"${o.customerPhone || ''}"`,
        `"${o.paymentMethod || 'UPI'}"`,
        `"${o.status || 'Completed'}"`,
        itemsCount,
        Math.round((o.total || 0) + totalDisc),
        Math.round(totalDisc),
        Math.round(o.total || 0)
      ];
      csv += row.join(",") + "\n";
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Crust_Chilly_Executive_Report_${this.selectedTimeframe}_${this.getLocalDateStr()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.showToast("Executive CSV export downloaded!", "success");
  },

  // Interactive Feature 8: Print Executive Summary Briefing
  printExecutiveSummary() {
    const orders = this.getFilteredOrders();
    const validOrders = orders.filter(o => o.status !== "Cancelled");
    const gross = validOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const cash = validOrders.filter(o => o.paymentMethod === "Cash").reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const upi = validOrders.filter(o => o.paymentMethod === "UPI").reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const card = validOrders.filter(o => o.paymentMethod === "Card").reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.print();
      return;
    }

    const todayStr = this.getLocalDateStr();
    printWindow.document.write(`
      <html>
        <head>
          <title>Executive Briefing - Crust & Chilly</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 30px; color: #1e293b; }
            h1 { font-size: 20px; font-weight: 800; margin-bottom: 4px; }
            .header { border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px; }
            .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 24px; }
            .kpi-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; }
            .kpi-label { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; }
            .kpi-val { font-size: 22px; font-weight: 900; color: #0f172a; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
            th { background: #f1f5f9; font-weight: 800; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>CRUST & CHILLY - EXECUTIVE BUSINESS BRIEFING</h1>
            <div>Date: ${todayStr} • Timeframe: ${this.selectedTimeframe.toUpperCase()}</div>
          </div>
          <div class="kpi-grid">
            <div class="kpi-box">
              <div class="kpi-label">Gross Revenue</div>
              <div class="kpi-val">₹${Math.round(gross).toLocaleString("en-IN")}</div>
            </div>
            <div class="kpi-box">
              <div class="kpi-label">Total Bills</div>
              <div class="kpi-val">${validOrders.length}</div>
            </div>
            <div class="kpi-box">
              <div class="kpi-label">Average Order Value</div>
              <div class="kpi-val">₹${validOrders.length > 0 ? Math.round(gross / validOrders.length) : 0}</div>
            </div>
          </div>
          <h3>Collections Summary</h3>
          <table>
            <tr><th>Payment Channel</th><th>Amount (₹)</th><th>Share (%)</th></tr>
            <tr><td>UPI / Online</td><td>₹${Math.round(upi).toLocaleString("en-IN")}</td><td>${gross > 0 ? Math.round((upi / gross) * 100) : 0}%</td></tr>
            <tr><td>Cash Drawer</td><td>₹${Math.round(cash).toLocaleString("en-IN")}</td><td>${gross > 0 ? Math.round((cash / gross) * 100) : 0}%</td></tr>
            <tr><td>Card</td><td>₹${Math.round(card).toLocaleString("en-IN")}</td><td>${gross > 0 ? Math.round((card / gross) * 100) : 0}%</td></tr>
          </table>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }
};
