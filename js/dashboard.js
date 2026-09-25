// Crust & Chilly POS - Executive Dashboard & Business Intelligence Module
// Real-time operations metrics, cash reconciliation, order channel breakouts, shift rush analysis, 
// raw materials inventory watch, category sales contribution, customer retention insights, and thermal Z-Report.

window.views = window.views || {};
window.views.dashboard = {
  salesChart: null,
  paymentChart: null,
  selectedTimeframe: "today", // 'today' | 'yesterday' | 'week' | 'month'

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

    const monthStartStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;

    return { todayStr, yesterdayStr, weekStartStr, monthStartStr };
  },

  setTimeframe(period) {
    this.selectedTimeframe = period;
    document.querySelectorAll(".dash-period-btn").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-period") === period);
    });
    this.calculateAndRenderMetrics();
  },

  init(container) {
    const today = new Date();
    const formattedDate = today.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric"
    });

    container.innerHTML = `
      <div class="dash-container view-animate" style="max-width: 100%; width: 100%; overflow-x: hidden; display: flex; flex-direction: column; gap: 16px;">
        
        <!-- Welcome Executive Banner with Timeframe Toggle -->
        <div class="dash-banner">
          <div>
            <h1>Crust & Chilly Business Overview 🍕</h1>
            <p><i class="fa-regular fa-calendar" style="color: #2563eb; margin-right: 5px;"></i> ${formattedDate} • Live Operations & Intelligence</p>
          </div>
          
          <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
            <!-- Period Selector Pills -->
            <div class="dash-period-pills" id="dash-period-selector">
              <button class="dash-period-btn ${this.selectedTimeframe === 'today' ? 'active' : ''}" data-period="today" onclick="views.dashboard.setTimeframe('today')">Today</button>
              <button class="dash-period-btn ${this.selectedTimeframe === 'yesterday' ? 'active' : ''}" data-period="yesterday" onclick="views.dashboard.setTimeframe('yesterday')">Yesterday</button>
              <button class="dash-period-btn ${this.selectedTimeframe === 'week' ? 'active' : ''}" data-period="week" onclick="views.dashboard.setTimeframe('week')">7 Days</button>
              <button class="dash-period-btn ${this.selectedTimeframe === 'month' ? 'active' : ''}" data-period="month" onclick="views.dashboard.setTimeframe('month')">This Month</button>
            </div>

            <div class="dash-status-pill" style="height: 34px; display: inline-flex; align-items: center; gap: 6px; padding: 0 12px; border-radius: 12px; font-size: 11px; font-weight: 700; box-sizing: border-box; line-height: 1;">
              <i class="fa-solid fa-circle" style="font-size: 7px; animation: pulse 1.5s infinite alternate;"></i> Live Cloud Connected
            </div>
            
            <button class="btn btn-secondary" id="dash-btn-refresh" style="height: 34px; display: inline-flex; align-items: center; gap: 6px; padding: 0 14px; border-radius: 12px; font-size: 11.5px; font-weight: 700; box-sizing: border-box; line-height: 1;">
              <i class="fa-solid fa-rotate-right"></i> Refresh
            </button>
          </div>
        </div>

        <!-- Daily Sales Goal / Target Progress Card -->
        <div class="glass-card" style="padding: 12px 18px; display: flex; flex-direction: column; gap: 8px; margin-bottom: 0;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 13px; font-weight: 800; color: var(--text-dark); display: flex; align-items: center; gap: 6px;">
                <i class="fa-solid fa-bullseye" style="color: #2563eb;"></i> <span id="dash-target-title">Daily Revenue Goal</span>
              </span>
              <span id="dash-target-badge" style="font-size: 11px; font-weight: 800; background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; padding: 2px 8px; border-radius: 10px;">0% Achieved</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <span id="dash-target-amounts" style="font-size: 12.5px; font-weight: 800; color: var(--text-dark);">₹0 / ₹15,000</span>
              <button id="dash-btn-set-target" title="Set Revenue Target" style="background: #f1f5f9; border: 1px solid var(--border-color); border-radius: 8px; padding: 4px 10px; cursor: pointer; color: var(--text-dark); font-size: 11px; font-weight: 700; display: flex; align-items: center; gap: 5px;">
                <i class="fa-solid fa-pen-to-square" style="color: #2563eb;"></i> Set Target
              </button>
            </div>
          </div>
          <div style="width: 100%; height: 8px; background: #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div id="dash-target-bar" style="height: 100%; width: 0%; background: linear-gradient(90deg, #2563eb, #10b981); border-radius: 8px; transition: width 0.6s ease;"></div>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted); font-weight: 600;">
            <span id="dash-target-remaining">Calculating target progress...</span>
            <span id="dash-target-status" style="font-weight: 700; color: #d97706;">In Progress</span>
          </div>
        </div>

        <!-- 4 Primary KPI Cards Grid -->
        <div class="dash-kpi-grid">
          
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

          <!-- KPI 2: Estimated Net Profit -->
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

          <!-- KPI 3: Total Orders & AOV -->
          <div class="dash-card accent-amber">
            <div>
              <div class="dash-card-header">
                <span class="dash-card-label">Bills & Avg Ticket</span>
                <div class="dash-card-icon icon-amber">
                  <i class="fa-solid fa-receipt"></i>
                </div>
              </div>
              <div class="dash-card-val" id="dash-orders-val">0</div>
            </div>
            <div class="dash-breakdown-tags">
              <span class="dash-sub-pill pill-neutral" id="dash-aov-pill"><i class="fa-solid fa-calculator"></i> Avg: ₹0/bill</span>
              <span class="dash-sub-pill pill-neutral" id="dash-completed-pill">0 Completed</span>
            </div>
          </div>

          <!-- KPI 4: Kitchen Queue Flow -->
          <div class="dash-card accent-purple">
            <div>
              <div class="dash-card-header">
                <span class="dash-card-label">Active Kitchen Queue</span>
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

        </div>

        <!-- 2 Visual Charts Row -->
        <div class="dash-charts-grid">
          
          <!-- Chart 1: 7-Day Revenue Trend -->
          <div class="dash-chart-card">
            <div class="chart-header">
              <div class="chart-title">
                <i class="fa-solid fa-chart-line" style="color: #2563eb;"></i> 7-Day Revenue Trajectory
              </div>
              <span style="font-size: 11px; color: #2563eb; background: #eff6ff; border: 1px solid #bfdbfe; padding: 3px 10px; border-radius: 12px; font-weight: 800; text-transform: uppercase;">
                Weekly Trend
              </span>
            </div>
            <div class="dash-chart-wrap">
              <canvas id="salesTrendsChartCanvas"></canvas>
            </div>
          </div>

          <!-- Chart 2: Payment Distribution -->
          <div class="dash-chart-card">
            <div class="chart-header">
              <div class="chart-title">
                <i class="fa-solid fa-wallet" style="color: #10b981;"></i> Payment Mode Distribution
              </div>
              <span style="font-size: 11px; color: #059669; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 3px 10px; border-radius: 12px; font-weight: 800; text-transform: uppercase;">
                Collection Split
              </span>
            </div>
            <div class="dash-chart-wrap">
              <canvas id="paymentPieChartCanvas"></canvas>
            </div>
          </div>

        </div>

        <!-- NEW: Operations & Deep Intelligence Suite (3 Cards Grid) -->
        <div class="dash-extra-grid">
          
          <!-- Card 1: Raw Material Inventory Health & Low Stock Watch -->
          <div class="dash-extra-card">
            <div class="extra-header">
              <div class="extra-title">
                <i class="fa-solid fa-boxes-stacked" style="color: #dc2626;"></i> Raw Material Stock Watch
              </div>
              <span id="dash-inventory-badge" class="insight-badge">Checking...</span>
            </div>
            <div id="dash-inventory-watch-list" style="display: flex; flex-direction: column; gap: 8px;">
              <!-- Injected dynamically -->
            </div>
          </div>

          <!-- Card 2: Category Revenue Contribution -->
          <div class="dash-extra-card">
            <div class="extra-header">
              <div class="extra-title">
                <i class="fa-solid fa-chart-pie" style="color: #2563eb;"></i> Category Sales Share
              </div>
              <span class="insight-badge" id="dash-category-badge">Categories</span>
            </div>
            <div id="dash-category-breakdown-list" style="display: flex; flex-direction: column; gap: 7px;">
              <!-- Injected dynamically -->
            </div>
          </div>

          <!-- Card 3: Customer Retention & Top Regulars -->
          <div class="dash-extra-card">
            <div class="extra-header">
              <div class="extra-title">
                <i class="fa-solid fa-users" style="color: #059669;"></i> Customer Retention
              </div>
              <span class="insight-badge" id="dash-cust-badge">0 Customers</span>
            </div>
            <div id="dash-customer-insights-list" style="display: flex; flex-direction: column; gap: 7px;">
              <!-- Injected dynamically -->
            </div>
          </div>

        </div>

        <!-- Comprehensive Business Intelligence Suite (4 Key Insights Cards) -->
        <div class="dash-insights-grid">
          
          <!-- Insight Card 1: Order Types (Dine-in vs Takeaway vs Delivery) -->
          <div class="dash-insight-card">
            <div class="insight-header">
              <div class="insight-title">
                <i class="fa-solid fa-utensils" style="color: #2563eb;"></i> Order Fulfillment Channels
              </div>
              <span class="insight-badge" id="dash-orders-total-badge">0 Total Bills</span>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 10px;" id="dash-order-types-container">
              <!-- Injected dynamically -->
            </div>
          </div>

          <!-- Insight Card 2: Daily Cash Drawer & Reconciliation -->
          <div class="dash-insight-card">
            <div class="insight-header">
              <div class="insight-title">
                <i class="fa-solid fa-cash-register" style="color: #059669;"></i> Cash Drawer Reconciliation
              </div>
              <span class="insight-badge" style="background: #ecfdf5; color: #065f46; border-color: #a7f3d0;">Closing Drawer</span>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 10px;" id="dash-cash-reconcile-container">
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
              <span class="insight-badge" id="dash-peak-hour-badge" style="background: #fffbeb; color: #b45309; border-color: #fde68a;">Calculating...</span>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 8px;" id="dash-shifts-container">
              <!-- Injected dynamically -->
            </div>
          </div>

          <!-- Insight Card 4: Promotional Impact & Discounts -->
          <div class="dash-insight-card">
            <div class="insight-header">
              <div class="insight-title">
                <i class="fa-solid fa-tags" style="color: #8b5cf6;"></i> Offers & BOGO Discounts
              </div>
              <span class="insight-badge" id="dash-discount-rate-badge" style="background: #f5f3ff; color: #5b21b6; border-color: #ddd6fe;">0% Discount</span>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 10px;" id="dash-discounts-container">
              <!-- Injected dynamically -->
            </div>
          </div>

        </div>

        <!-- 2 Details Row: Top Selling Leaderboard & Today's Recent Bills -->
        <div class="dash-details-grid">
          
          <!-- Best Selling Menu Items Leaderboard -->
          <div class="dash-leaderboard-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <h3 style="font-size: 15px; font-weight: 800; color: var(--text-dark); margin: 0; display: flex; align-items: center; gap: 8px;">
                <i class="fa-solid fa-crown" style="color: #f59e0b;"></i> Best Selling Menu Items
              </h3>
              <span style="font-size: 11px; background: #fffbeb; color: #b45309; border: 1px solid #fde68a; padding: 3px 10px; border-radius: 12px; font-weight: 800;">Top Velocity</span>
            </div>
            
            <div id="dash-best-sellers-list" style="display: flex; flex-direction: column; gap: 10px;">
              <!-- Injected dynamically -->
            </div>
          </div>

          <!-- Recent Bills Activity Stream -->
          <div class="dash-recent-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <h3 style="font-size: 15px; font-weight: 800; color: var(--text-dark); margin: 0; display: flex; align-items: center; gap: 8px;">
                <i class="fa-solid fa-clock-rotate-left" style="color: #2563eb;"></i> Recent Register Bills
              </h3>
              <a href="#counter" style="font-size: 12px; font-weight: 800; color: #2563eb; text-decoration: none; display: flex; align-items: center; gap: 4px;">
                View All <i class="fa-solid fa-chevron-right" style="font-size: 10px;"></i>
              </a>
            </div>

            <div id="dash-recent-orders-list" style="display: flex; flex-direction: column; gap: 9px;">
              <!-- Injected dynamically -->
            </div>
          </div>

        </div>

      </div>
    `;

    document.getElementById("dash-btn-refresh").addEventListener("click", () => {
      this.calculateAndRenderMetrics();
      window.showToast("Dashboard metrics refreshed!", "info");
    });

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
          window.showToast(`Daily target set to ${curSettings.currencySymbol || "₹"}${Number(newTarget).toLocaleString("en-IN")}`, "success");
        }
      });
    }

    this.calculateAndRenderMetrics();
  },

  calculateAndRenderMetrics() {
    const orders = window.db.get("orders") || [];
    const products = window.db.get("products") || [];
    const categories = window.db.get("categories") || [];
    const expenses = window.db.get("expenses") || [];
    const settings = window.db.get("settings") || {};

    const currencySymbol = settings.currencySymbol || "₹";
    const { todayStr, yesterdayStr, weekStartStr, monthStartStr } = this.getTimeframeDates();

    // Filter orders based on selected timeframe
    let filteredOrders = [];
    let periodLabel = "Today";

    if (this.selectedTimeframe === "yesterday") {
      filteredOrders = orders.filter(o => o.createdAt && o.createdAt.substring(0, 10) === yesterdayStr);
      periodLabel = "Yesterday's";
    } else if (this.selectedTimeframe === "week") {
      filteredOrders = orders.filter(o => {
        if (!o.createdAt) return false;
        const dStr = o.createdAt.substring(0, 10);
        return dStr >= weekStartStr && dStr <= todayStr;
      });
      periodLabel = "7-Day";
    } else if (this.selectedTimeframe === "month") {
      filteredOrders = orders.filter(o => {
        if (!o.createdAt) return false;
        const dStr = o.createdAt.substring(0, 10);
        return dStr >= monthStartStr && dStr <= todayStr;
      });
      periodLabel = "This Month's";
    } else {
      // Default: today
      filteredOrders = orders.filter(o => o.createdAt && o.createdAt.substring(0, 10) === todayStr);
      periodLabel = "Today's";
    }

    const validOrders = filteredOrders.filter(o => o.status !== "Cancelled");
    
    // Label updates
    const salesLabelEl = document.getElementById("dash-sales-label");
    if (salesLabelEl) salesLabelEl.textContent = `${periodLabel} Gross Sales`;

    // Gross Sales & Payment Breakdowns
    let cashTotal = 0;
    let upiTotal = 0;
    let cardTotal = 0;
    let grossSales = 0;

    validOrders.forEach(o => {
      const amt = Number(o.total) || 0;
      grossSales += amt;
      if (o.paymentMethod === "Cash") cashTotal += amt;
      else if (o.paymentMethod === "Card") cardTotal += amt;
      else upiTotal += amt;
    });

    document.getElementById("dash-sales-val").textContent = `${currencySymbol}${Math.round(grossSales).toLocaleString("en-IN")}`;
    
    // Calculate Day-over-Day growth indicator if "today" is selected
    const growthEl = document.getElementById("dash-growth-indicator");
    if (growthEl) {
      if (this.selectedTimeframe === "today") {
        const ydayOrders = orders.filter(o => o.createdAt && o.createdAt.substring(0, 10) === yesterdayStr && o.status !== "Cancelled");
        const ydaySales = ydayOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
        if (ydaySales > 0) {
          const diffPct = Math.round(((grossSales - ydaySales) / ydaySales) * 100);
          const isUp = diffPct >= 0;
          growthEl.innerHTML = `
            <span style="font-size: 11px; font-weight: 800; color: ${isUp ? '#10b981' : '#f59e0b'}; background: ${isUp ? '#ecfdf5' : '#fffbeb'}; border: 1px solid ${isUp ? '#a7f3d0' : '#fde68a'}; padding: 2px 7px; border-radius: 8px; display: inline-flex; align-items: center; gap: 4px;">
              <i class="fa-solid ${isUp ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}"></i> ${isUp ? '+' : ''}${diffPct}% vs yday
            </span>
          `;
        } else {
          growthEl.innerHTML = "";
        }
      } else {
        growthEl.innerHTML = "";
      }
    }

    // Render Sales Goal Tracker
    let multiplier = 1;
    if (this.selectedTimeframe === "week") multiplier = 7;
    if (this.selectedTimeframe === "month") multiplier = 30;

    const baseTarget = Number(settings.dailySalesTarget) || 15000;
    const targetGoal = baseTarget * multiplier;
    const targetPct = targetGoal > 0 ? Math.min(100, Math.round((grossSales / targetGoal) * 100)) : 0;
    
    const targetTitleEl = document.getElementById("dash-target-title");
    if (targetTitleEl) {
      targetTitleEl.textContent = this.selectedTimeframe === "week" ? "Weekly Revenue Goal" : (this.selectedTimeframe === "month" ? "Monthly Revenue Goal" : "Daily Revenue Goal");
    }

    const targetBadgeEl = document.getElementById("dash-target-badge");
    const targetAmountsEl = document.getElementById("dash-target-amounts");
    const targetBarEl = document.getElementById("dash-target-bar");
    const targetRemEl = document.getElementById("dash-target-remaining");
    const targetStatusEl = document.getElementById("dash-target-status");

    if (targetBadgeEl) targetBadgeEl.textContent = `${targetPct}% Achieved`;
    if (targetAmountsEl) targetAmountsEl.textContent = `${currencySymbol}${Math.round(grossSales).toLocaleString("en-IN")} / ${currencySymbol}${Math.round(targetGoal).toLocaleString("en-IN")}`;
    if (targetBarEl) targetBarEl.style.width = `${targetPct}%`;
    if (targetRemEl) {
      if (grossSales >= targetGoal) {
        targetRemEl.innerHTML = `<span style="color: #059669; font-weight: 700;"><i class="fa-solid fa-circle-check"></i> Great job! Revenue target achieved!</span>`;
      } else {
        targetRemEl.textContent = `${currencySymbol}${Math.round(targetGoal - grossSales).toLocaleString("en-IN")} remaining to hit target`;
      }
    }
    if (targetStatusEl) {
      if (grossSales >= targetGoal) {
        targetStatusEl.textContent = "Goal Achieved! 🎉";
        targetStatusEl.style.color = "#059669";
      } else {
        targetStatusEl.textContent = "In Progress";
        targetStatusEl.style.color = "#d97706";
      }
    }
    
    let breakdownHtml = `
      <span class="dash-sub-pill pill-cash"><i class="fa-solid fa-money-bill-wave"></i> Cash: ${currencySymbol}${Math.round(cashTotal).toLocaleString("en-IN")}</span>
      <span class="dash-sub-pill pill-upi"><i class="fa-solid fa-qrcode"></i> UPI: ${currencySymbol}${Math.round(upiTotal).toLocaleString("en-IN")}</span>
    `;
    if (cardTotal > 0) {
      breakdownHtml += `<span class="dash-sub-pill pill-card"><i class="fa-solid fa-credit-card"></i> Card: ${currencySymbol}${Math.round(cardTotal).toLocaleString("en-IN")}</span>`;
    }
    document.getElementById("dash-sales-breakdown").innerHTML = breakdownHtml;

    // Filter expenses by timeframe
    const periodExpenses = expenses.filter(e => {
      const dStr = e.date || (e.createdAt ? e.createdAt.substring(0, 10) : "");
      if (this.selectedTimeframe === "yesterday") return dStr === yesterdayStr;
      if (this.selectedTimeframe === "week") return dStr >= weekStartStr && dStr <= todayStr;
      if (this.selectedTimeframe === "month") return dStr >= monthStartStr && dStr <= todayStr;
      return dStr === todayStr;
    });

    const totalPeriodExpense = periodExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const estimatedCOGS = grossSales * 0.32;
    const netProfit = Math.max(0, grossSales - estimatedCOGS - totalPeriodExpense);
    const profitMargin = grossSales > 0 ? Math.round((netProfit / grossSales) * 100) : 0;

    document.getElementById("dash-profit-val").textContent = `${currencySymbol}${Math.round(netProfit).toLocaleString("en-IN")}`;
    document.getElementById("dash-margin-pill").innerHTML = `<i class="fa-solid fa-percent"></i> ${profitMargin}% Est. Margin`;
    document.getElementById("dash-expense-pill").innerHTML = `<i class="fa-solid fa-receipt"></i> Expenses: ${currencySymbol}${Math.round(totalPeriodExpense).toLocaleString("en-IN")}`;

    // Orders & AOV
    const totalOrdersCount = filteredOrders.length;
    const completedCount = validOrders.filter(o => o.status === "Completed").length;
    const aov = validOrders.length > 0 ? Math.round(grossSales / validOrders.length) : 0;

    document.getElementById("dash-orders-val").textContent = totalOrdersCount;
    document.getElementById("dash-aov-pill").innerHTML = `<i class="fa-solid fa-calculator"></i> Avg: ${currencySymbol}${aov}/bill`;
    document.getElementById("dash-completed-pill").textContent = `${completedCount} Completed`;

    // Active Kitchen Queue
    const activeQueueCount = orders.filter(o => o.status === "Pending" || o.status === "Preparing").length;
    document.getElementById("dash-active-val").textContent = activeQueueCount;

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

    // Render Deep Insights Suite
    this.renderInventoryWatch();
    this.renderCategoryBreakdown(validOrders, currencySymbol);
    this.renderCustomerInsights(validOrders, currencySymbol);

    // Render Business Intelligence Suite Cards
    this.renderOrderChannels(validOrders, grossSales, currencySymbol);
    this.renderCashReconciliation(cashTotal, upiTotal, totalPeriodExpense, currencySymbol);
    this.renderShiftsAndPeak(validOrders, currencySymbol);
    this.renderDiscountsImpact(validOrders, grossSales, currencySymbol);

    // Leaderboard & Recent Stream
    this.renderBestSellers(filteredOrders, products, categories, currencySymbol);
    this.renderRecentBills(filteredOrders, currencySymbol);

    // Visual Charts
    this.renderTrendCharts(orders, todayStr);
  },

  // NEW 1: Raw Material Inventory Health Watch
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
        badgeEl.textContent = `${lowItems.length} Low Items`;
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
          <div style="font-size: 11px; color: #15803d; margin-top: 2px;">Kitchen has sufficient inventory for all rush orders.</div>
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

  // NEW 2: Category Revenue Breakdown
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
    if (badgeEl) badgeEl.textContent = `${sortedCats.length} Categories`;

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

  // NEW 3: Customer Retention & Regulars
  renderCustomerInsights(filteredOrders, currencySymbol) {
    const container = document.getElementById("dash-customer-insights-list");
    if (!container) return;

    const custFreq = {};
    filteredOrders.forEach(o => {
      if (o.status === "Cancelled") return;
      const phone = (o.customerPhone || "").trim();
      const name = (o.customerName || "").trim() || "Walk-in";
      const key = phone ? phone : name;
      if (!custFreq[key]) {
        custFreq[key] = { name: name, phone: phone, count: 0, spent: 0 };
      }
      custFreq[key].count++;
      custFreq[key].spent += (Number(o.total) || 0);
    });

    const allCusts = Object.values(custFreq);
    const totalCustCount = allCusts.length;
    const repeatCount = allCusts.filter(c => c.count > 1).length;
    const repeatRate = totalCustCount > 0 ? Math.round((repeatCount / totalCustCount) * 100) : 0;

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

  // 1. Order Types Channel Breakdown
  renderOrderChannels(todayValidOrders, grossSales, currencySymbol) {
    const container = document.getElementById("dash-order-types-container");
    if (!container) return;

    let dineCount = 0, dineSales = 0;
    let takeCount = 0, takeSales = 0;
    let delCount = 0, delSales = 0;

    todayValidOrders.forEach(o => {
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

    const totalBills = todayValidOrders.length;
    document.getElementById("dash-orders-total-badge").textContent = `${totalBills} Bills`;

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
        <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted); font-weight: 600;">
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

      ${delCount > 0 ? `
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
      ` : ""}
    `;
  },

  // 2. Cash Drawer Reconciliation (Closing Register)
  renderCashReconciliation(cashTotal, upiTotal, todayExpenses, currencySymbol) {
    const container = document.getElementById("dash-cash-reconcile-container");
    if (!container) return;

    const expectedCashInDrawer = Math.max(0, cashTotal - todayExpenses);

    container.innerHTML = `
      <div style="background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 14px; padding: 12px 14px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-size: 11px; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">Expected Cash in Drawer</div>
          <div style="font-size: 22px; font-weight: 900; color: #15803d; margin-top: 2px;">${currencySymbol}${Math.round(expectedCashInDrawer).toLocaleString("en-IN")}</div>
        </div>
        <button type="button" onclick="views.dashboard.openDayEndReportModal()" style="background: #ffffff; padding: 6px 12px; border-radius: 10px; border: 1px solid #bbf7d0; font-size: 11.5px; font-weight: 800; color: #166534; cursor: pointer;">
          <i class="fa-solid fa-lock"></i> Close Drawer
        </button>
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

  // 3. Shift Rush & Peak Hours (Store Operational Hours: 2:00 PM – 12:00 AM Midnight)
  renderShiftsAndPeak(todayValidOrders, currencySymbol) {
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

    todayValidOrders.forEach(o => {
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

  // 4. Discounts & Promotional Impact
  renderDiscountsImpact(todayValidOrders, grossSales, currencySymbol) {
    const container = document.getElementById("dash-discounts-container");
    if (!container) return;

    let bogoDiscount = 0;
    let flatDiscount = 0;
    let grossOriginal = 0;

    todayValidOrders.forEach(o => {
      bogoDiscount += (Number(o.bogoDiscount) || 0);
      flatDiscount += (Number(o.discount) || 0);
      grossOriginal += (Number(o.subtotal) || Number(o.total) || 0);
    });

    const totalDiscounts = bogoDiscount + flatDiscount;
    const discountRate = grossOriginal > 0 ? Math.round((totalDiscounts / grossOriginal) * 100) : 0;
    document.getElementById("dash-discount-rate-badge").textContent = `${discountRate}% Disc Rate`;

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
      .sort((a, b) => b.quantity - a.quantity)
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

    const maxQty = bestSellersList[0].quantity || 1;
    const rankClasses = ["rank-1", "rank-2", "rank-3", "rank-norm", "rank-norm"];
    const rankIcons = ["🥇", "🥈", "🥉", "4", "5"];

    container.innerHTML = bestSellersList.map((item, idx) => {
      const pct = Math.round((item.quantity / maxQty) * 100);
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

  renderRecentBills(todayOrders, currencySymbol) {
    const container = document.getElementById("dash-recent-orders-list");
    if (!container) return;

    if (!todayOrders || todayOrders.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 30px 10px; font-weight: 600; font-size: 13px;">
          <i class="fa-solid fa-receipt" style="font-size: 24px; color: #cbd5e1; margin-bottom: 8px; display: block;"></i>
          No bills recorded in this timeframe yet.
        </div>
      `;
      return;
    }

    const sorted = [...todayOrders].sort((a, b) => (b.orderNumber || 0) - (a.orderNumber || 0)).slice(0, 5);

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
        <div style="padding: 9px 12px; background: #f8fafc; border: 1px solid var(--border-color); border-radius: 12px; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <div style="min-width: 0; flex: 1;">
            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
              <span style="font-weight: 800; font-size: 12.5px; color: var(--text-dark);">#${o.orderNumber || "Bill"}</span>
              <span style="font-size: 10.5px; color: var(--text-muted); font-weight: 600;">${timeStr}</span>
              <span class="dash-sub-pill ${payPillClass}" style="padding: 1px 6px; font-size: 10px;">
                <i class="fa-solid ${payIcon}"></i> ${o.paymentMethod || "UPI"}
              </span>
            </div>
            <div style="font-size: 11px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; max-width: 100%;">
              ${itemsSummary}
            </div>
          </div>
          <div style="text-align: right; flex-shrink: 0;">
            <div style="font-weight: 800; font-size: 13px; color: var(--text-dark);">${currencySymbol}${Math.round(o.total || 0)}</div>
            <span style="display: inline-block; padding: 2px 7px; border-radius: 7px; font-size: 10px; font-weight: 700; color: ${statusColor}; background: ${statusBg}; margin-top: 2px;">
              ${o.status || "Pending"}
            </span>
          </div>
        </div>
      `;
    }).join("");
  },

  renderTrendCharts(orders, todayStr) {
    const textMuted = '#64748b';
    const bgDarker = '#ffffff';
    const borderColor = 'rgba(202, 213, 226, 0.6)';

    // 1. 7-Day Revenue Trend Line Graph
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

    const trendsCanvas = document.getElementById("salesTrendsChartCanvas");
    if (trendsCanvas) {
      const trendsCtx = trendsCanvas.getContext("2d");
      if (this.salesChart) {
        this.salesChart.destroy();
      }

      const fillGradient = trendsCtx.createLinearGradient(0, 0, 0, 240);
      fillGradient.addColorStop(0, 'rgba(37, 99, 235, 0.22)');
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
            legend: {
              display: false
            },
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

    // 2. Today's Payment Distribution Doughnut
    const paymentCanvas = document.getElementById("paymentPieChartCanvas");
    if (paymentCanvas) {
      const todayValidOrders = orders.filter(o => {
        if (!o.createdAt || o.status === "Cancelled") return false;
        return o.createdAt.substring(0, 10) === todayStr;
      });

      let upiSum = 0;
      let cashSum = 0;
      let cardSum = 0;

      todayValidOrders.forEach(o => {
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

      this.paymentChart = new Chart(paymentCtx, {
        type: "doughnut",
        data: {
          labels: ["UPI", "Cash", "Card"],
          datasets: [
            {
              data: totalPayment === 0 ? [1] : [upiSum, cashSum, cardSum],
              backgroundColor: totalPayment === 0 ? ["#e2e8f0"] : ["#2563eb", "#10b981", "#8b5cf6"],
              borderWidth: 2,
              borderColor: bgDarker,
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
                font: { family: "Outfit", size: 11.5, weight: "bold" },
                padding: 12,
                boxWidth: 12
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
                  if (totalPayment === 0) return " No transactions yet today";
                  const val = context.raw;
                  const pct = totalPayment > 0 ? Math.round((val / totalPayment) * 100) : 0;
                  return ` ${context.label}: ₹${val.toLocaleString("en-IN")} (${pct}%)`;
                }
              }
            }
          },
          cutout: "70%"
        }
      });
    }
  },

  // Interactive Feature 1: Quick Shop Expense Logger Modal
  openQuickExpenseModal() {
    const todayStr = this.getLocalDateStr();
    const bodyHtml = `
      <form id="dash-quick-expense-form" style="display: flex; flex-direction: column; gap: 12px; font-size: 13px;">
        <div>
          <label style="font-weight: 700; color: var(--text-dark); display: block; margin-bottom: 4px;">Expense Description / Reason *</label>
          <input type="text" id="quick-exp-desc" placeholder="e.g. Burger Buns, Dairy / Milk, Gas Cylinder, Staff Snacks" required style="width: 100%; border: 1.5px solid var(--border-color); border-radius: 10px; padding: 8px 12px; font-size: 13px; outline: none; box-sizing: border-box;">
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

  // Interactive Feature 2: Day-End Register Closing Z-Report Modal
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

  // Interactive Feature 3: Quick Restock Ingredient Prompt
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
  }
};
