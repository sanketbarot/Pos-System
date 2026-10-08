// Crust & Chilly POS - Advanced Sales & Profit Analytics Engine
// Comprehensive Profit & Loss (P&L) Analytics, Food Cost / COGS Benchmarking, Expense Overhead Tracking,
// Itemized Margin Engineering, Multi-Stream Trajectories, Shift Rush Curves, and Executive Audit Reports.

window.views = window.views || {};
window.views.reports = {
  startDate: null,
  endDate: null,
  cogsPercent: 32, // Default 32% Food Cost / COGS benchmark
  activeChartMode: "both", // 'both' | 'revenue' | 'profit' | 'cumulative'
  activeDonutMode: "categories", // 'categories' | 'expenses'
  itemSearchQuery: "",
  itemSortKey: "profit", // 'profit' | 'gross' | 'qty' | 'margin'
  
  // Chart instances
  mainTrendChart: null,
  donutBreakdownChart: null,
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
        
        <!-- Executive Control Bar (Date Range, Quick Presets & Export Actions) -->
        <div class="glass-card report-filter-bar" style="padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div class="report-dates-group" style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
            <span style="font-size: 13.5px; font-weight: 800; color: var(--text-dark); white-space: nowrap; display: flex; align-items: center; gap: 7px;">
              <i class="fa-solid fa-chart-line" style="color: #2563eb; font-size: 15px;"></i> Analytics Period:
            </span>
            
            <!-- Quick Date Preset Pills -->
            <div style="display: flex; gap: 5px; flex-wrap: wrap;" id="rep-preset-group">
              <button type="button" class="btn-rep-preset" data-range="today" style="background: #f1f5f9; border: 1px solid var(--border-color); border-radius: 8px; padding: 5px 10px; font-size: 11px; font-weight: 700; cursor: pointer; color: var(--text-dark); transition: all 0.2s;">Today</button>
              <button type="button" class="btn-rep-preset" data-range="yesterday" style="background: #f1f5f9; border: 1px solid var(--border-color); border-radius: 8px; padding: 5px 10px; font-size: 11px; font-weight: 700; cursor: pointer; color: var(--text-dark); transition: all 0.2s;">Yesterday</button>
              <button type="button" class="btn-rep-preset active" data-range="last7" style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 5px 10px; font-size: 11px; font-weight: 800; cursor: pointer; color: #2563eb; transition: all 0.2s;">Last 7 Days</button>
              <button type="button" class="btn-rep-preset" data-range="last30" style="background: #f1f5f9; border: 1px solid var(--border-color); border-radius: 8px; padding: 5px 10px; font-size: 11px; font-weight: 700; cursor: pointer; color: var(--text-dark); transition: all 0.2s;">Last 30 Days</button>
              <button type="button" class="btn-rep-preset" data-range="thisMonth" style="background: #f1f5f9; border: 1px solid var(--border-color); border-radius: 8px; padding: 5px 10px; font-size: 11px; font-weight: 700; cursor: pointer; color: var(--text-dark); transition: all 0.2s;">This Month</button>
              <button type="button" class="btn-rep-preset" data-range="lastMonth" style="background: #f1f5f9; border: 1px solid var(--border-color); border-radius: 8px; padding: 5px 10px; font-size: 11px; font-weight: 700; cursor: pointer; color: var(--text-dark); transition: all 0.2s;">Last Month</button>
            </div>

            <!-- Date Pickers -->
            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-left: 2px;">
              <input type="date" id="report-start-date" class="form-input" style="height: 35px; font-size: 11.5px; padding: 4px 8px; border-radius: 10px; width: 130px;" value="${this.startDate}">
              <span style="font-size: 12px; color: var(--text-muted); font-weight: 600;">to</span>
              <input type="date" id="report-end-date" class="form-input" style="height: 35px; font-size: 11.5px; padding: 4px 8px; border-radius: 10px; width: 130px;" value="${this.endDate}">
            </div>
            <button class="btn btn-primary" id="btn-reports-apply-filter" style="padding: 0 15px; height: 35px; font-size: 12px; border-radius: 10px; font-weight: 800; display: inline-flex; align-items: center; gap: 5px;">
              <i class="fa-solid fa-filter"></i> Apply
            </button>
          </div>

          <!-- Utility Operations Toolbar -->
          <div class="report-actions-group" style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
            <button class="btn btn-secondary" id="btn-report-export-csv" style="padding: 0 13px; height: 35px; font-size: 12px; border-radius: 10px; font-weight: 800; display: inline-flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-file-csv" style="color: #2563eb;"></i> Export CSV
            </button>
            <button class="btn btn-secondary" id="btn-report-print-summary" style="padding: 0 13px; height: 35px; font-size: 12px; border-radius: 10px; font-weight: 800; display: inline-flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-print" style="color: #059669;"></i> Print P&L Report
            </button>
          </div>
        </div>

        <!-- 6-Card Executive Profit & Revenue Scorecard Grid -->
        <div class="rep-kpi-grid">
          
          <!-- Card 1: Gross Sales -->
          <div class="rep-kpi-card accent-blue">
            <div class="rep-kpi-header">
              <span class="rep-kpi-label">Gross Sales Revenue</span>
              <div class="rep-kpi-icon icon-blue">
                <i class="fa-solid fa-coins"></i>
              </div>
            </div>
            <div>
              <div class="rep-kpi-val" id="rep-gross-sales">₹0</div>
              <div class="rep-kpi-sub" id="rep-orders-sub">0 valid orders placed</div>
            </div>
            <div class="rep-kpi-badges">
              <span class="dash-sub-pill pill-neutral" id="rep-gross-orders-badge"><i class="fa-solid fa-receipt"></i> 0 Bills</span>
              <span class="dash-sub-pill pill-neutral" id="rep-cancelled-badge" style="display: none; color: #ef4444;"><i class="fa-solid fa-ban"></i> 0 Cancelled</span>
            </div>
          </div>

          <!-- Card 2: Net Realized Revenue -->
          <div class="rep-kpi-card accent-indigo">
            <div class="rep-kpi-header">
              <span class="rep-kpi-label">Net Sales Realized</span>
              <div class="rep-kpi-icon icon-indigo">
                <i class="fa-solid fa-wallet"></i>
              </div>
            </div>
            <div>
              <div class="rep-kpi-val" id="rep-net-sales">₹0</div>
              <div class="rep-kpi-sub" id="rep-net-sub">Customer billing after deductions</div>
            </div>
            <div class="rep-kpi-badges">
              <span class="dash-sub-pill pill-cash" id="rep-discounts-badge"><i class="fa-solid fa-tag"></i> Total Discounts: -₹0</span>
            </div>
          </div>

          <!-- Card 3: Food Cost / COGS Benchmarking -->
          <div class="rep-kpi-card accent-amber">
            <div class="rep-kpi-header">
              <span class="rep-kpi-label">Cost of Goods (COGS)</span>
              <div class="rep-kpi-icon icon-amber">
                <i class="fa-solid fa-boxes-stacked"></i>
              </div>
            </div>
            <div>
              <div class="rep-kpi-val" id="rep-cogs-val" style="color: #b45309;">₹0</div>
              <div class="rep-kpi-sub" id="rep-cogs-sub">Estimated 32% food cost benchmark</div>
            </div>
            <div class="rep-kpi-badges">
              <span class="dash-sub-pill pill-neutral" id="rep-gross-margin-badge"><i class="fa-solid fa-percent"></i> 68% Gross Margin</span>
            </div>
          </div>

          <!-- Card 4: Operating Expenses -->
          <div class="rep-kpi-card accent-rose">
            <div class="rep-kpi-header">
              <span class="rep-kpi-label">Overhead Operating Expenses</span>
              <div class="rep-kpi-icon icon-rose">
                <i class="fa-solid fa-receipt"></i>
              </div>
            </div>
            <div>
              <div class="rep-kpi-val" id="rep-expense-val" style="color: #dc2626;">₹0</div>
              <div class="rep-kpi-sub" id="rep-expense-sub">Salaries, utilities & store overheads</div>
            </div>
            <div class="rep-kpi-badges">
              <span class="dash-sub-pill pill-neutral" id="rep-expense-entries-badge"><i class="fa-solid fa-list-check"></i> 0 Logged Expenses</span>
            </div>
          </div>

          <!-- Card 5: Net Operating Profit (The Core Business Metric) -->
          <div class="rep-kpi-card accent-green" id="rep-profit-card">
            <div class="rep-kpi-header">
              <span class="rep-kpi-label" style="font-weight: 800; color: #059669;">NET OPERATING PROFIT</span>
              <div class="rep-kpi-icon icon-green" id="rep-profit-icon">
                <i class="fa-solid fa-sack-dollar"></i>
              </div>
            </div>
            <div>
              <div class="rep-kpi-val" id="rep-net-profit-val" style="color: #059669; font-size: 28px;">₹0</div>
              <div class="rep-kpi-sub" id="rep-profit-sub">Net Sales (-) COGS (-) Overheads</div>
            </div>
            <div class="rep-kpi-badges">
              <span class="growth-tag growth-up" id="rep-profit-margin-badge"><i class="fa-solid fa-arrow-trend-up"></i> 0% Net Margin</span>
              <span class="dash-sub-pill pill-cash" id="rep-health-status-badge">Healthy Profit</span>
            </div>
          </div>

          <!-- Card 6: Average Order Value & Basket Velocity -->
          <div class="rep-kpi-card accent-cyan">
            <div class="rep-kpi-header">
              <span class="rep-kpi-label">Average Order (AOV)</span>
              <div class="rep-kpi-icon" style="background: #ecfeff; border: 1px solid #a5f3fc; color: #0891b2;">
                <i class="fa-solid fa-chart-pie"></i>
              </div>
            </div>
            <div>
              <div class="rep-kpi-val" id="rep-aov-val" style="color: #0891b2;">₹0</div>
              <div class="rep-kpi-sub" id="rep-aov-sub">Average ticket realized per guest</div>
            </div>
            <div class="rep-kpi-badges">
              <span class="dash-sub-pill pill-neutral" id="rep-items-per-order-badge"><i class="fa-solid fa-burger"></i> ~0 Items / Bill</span>
              <span class="dash-sub-pill pill-upi" id="rep-cashless-badge"><i class="fa-solid fa-qrcode"></i> 0% Cashless</span>
            </div>
          </div>

        </div>

        <!-- Executive Profit & Loss (P&L) Waterfall Ledger Banner -->
        <div class="rep-pnl-waterfall-card">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 14.5px; font-weight: 900; color: var(--text-dark); display: flex; align-items: center; gap: 8px;">
                <i class="fa-solid fa-file-invoice-dollar" style="color: #2563eb;"></i> Executive P&L Financial Waterfall
              </span>
              <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">(Real-time cashflow realization)</span>
            </div>

            <!-- Interactive Food Cost COGS Benchmark Calibrator -->
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 11.5px; font-weight: 700; color: var(--text-muted);">Food Cost COGS Benchmark:</span>
              <div class="cogs-calibrator-pill" id="rep-cogs-calibrator">
                <button type="button" class="cogs-btn" data-cogs="28">28%</button>
                <button type="button" class="cogs-btn" data-cogs="30">30%</button>
                <button type="button" class="cogs-btn active" data-cogs="32">32%</button>
                <button type="button" class="cogs-btn" data-cogs="35">35%</button>
              </div>
            </div>
          </div>

          <!-- Step-by-Step Waterfall Flow -->
          <div class="rep-pnl-steps-flow" id="rep-waterfall-steps">
            <!-- Injected via JavaScript -->
          </div>
        </div>

        <!-- Charts Grid: Multi-Stream Trend + Dual Doughnut + Hourly Rush -->
        <div class="dash-charts-row-triple">
          
          <!-- Chart 1: Interactive Multi-Stream Trend Chart -->
          <div class="dash-chart-card" style="min-height: 340px;">
            <div class="chart-header">
              <div>
                <div class="chart-title">
                  <i class="fa-solid fa-chart-line" style="color: #2563eb;"></i> Financial Trend Curve
                </div>
                <div style="font-size: 11px; color: var(--text-muted); font-weight: 600; margin-top: 2px;">
                  Daily revenue, cost baseline, and net operating profit trajectory
                </div>
              </div>

              <!-- Stream Mode Switcher -->
              <div class="dash-chart-toggle-group" id="rep-trend-mode-toggle">
                <button type="button" class="dash-chart-toggle-btn active" data-mode="both">Revenue & Profit</button>
                <button type="button" class="dash-chart-toggle-btn" data-mode="revenue">Revenue Only</button>
                <button type="button" class="dash-chart-toggle-btn" data-mode="profit">Net Profit Curve</button>
                <button type="button" class="dash-chart-toggle-btn" data-mode="cumulative">Cumulative Profit</button>
              </div>
            </div>
            <div class="dash-chart-wrap" style="height: 250px;">
              <canvas id="repMainTrendCanvas"></canvas>
            </div>
          </div>

          <!-- Chart 2: Category Revenue / Operating Expense Breakdown Doughnut -->
          <div class="dash-chart-card" style="min-height: 340px;">
            <div class="chart-header">
              <div>
                <div class="chart-title">
                  <i class="fa-solid fa-chart-pie" style="color: #10b981;"></i> Distribution Share
                </div>
                <div style="font-size: 11px; color: var(--text-muted); font-weight: 600; margin-top: 2px;">
                  Sales categories vs overhead expenses
                </div>
              </div>

              <!-- Doughnut Mode Switcher -->
              <div class="dash-chart-toggle-group" id="rep-donut-mode-toggle">
                <button type="button" class="dash-chart-toggle-btn active" data-mode="categories">Menu Categories</button>
                <button type="button" class="dash-chart-toggle-btn" data-mode="expenses">Operating Expenses</button>
              </div>
            </div>
            <div class="dash-chart-wrap" style="height: 250px;">
              <canvas id="repDonutCanvas"></canvas>
            </div>
          </div>

          <!-- Chart 3: Peak Hourly Rush Curve (2 PM – 12 AM) -->
          <div class="dash-chart-card" style="min-height: 340px;">
            <div class="chart-header">
              <div>
                <div class="chart-title">
                  <i class="fa-solid fa-stopwatch" style="color: #f59e0b;"></i> Hourly Rush (2 PM–12 AM)
                </div>
                <div style="font-size: 11px; color: var(--text-muted); font-weight: 600; margin-top: 2px;">
                  Sales density & orders by operational hour
                </div>
              </div>
              <span id="rep-peak-hour-chip" class="dash-shift-live-pill shift-closing" style="font-size: 10.5px;">
                Calculating...
              </span>
            </div>
            <div class="dash-chart-wrap" style="height: 250px;">
              <canvas id="repHourlyRushCanvas"></canvas>
            </div>
          </div>

        </div>

        <!-- Day of Week Performance Matrix (Sun - Sat) -->
        <div class="glass-card" style="padding: 16px 20px; display: flex; flex-direction: column; gap: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
            <div>
              <h3 style="font-size: 14.5px; font-weight: 800; color: var(--text-dark); margin: 0; display: flex; align-items: center; gap: 7px;">
                <i class="fa-solid fa-calendar-week" style="color: #2563eb;"></i> Day of Week Profitability & Sales Matrix
              </h3>
              <div style="font-size: 11px; color: var(--text-muted); font-weight: 600; margin-top: 2px;">
                Aggregated sales volume, guest traffic, and average ticket size across days
              </div>
            </div>
            <span id="rep-best-day-badge" class="badge-menu-star">Weekday vs Weekend</span>
          </div>
          <div id="rep-day-of-week-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 8px;">
            <!-- Injected via JS -->
          </div>
        </div>

        <!-- Menu Item Margin & Profitability Engineering Matrix (Advanced Suite) -->
        <div class="glass-card" style="padding: 18px 20px; display: flex; flex-direction: column; gap: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
            <div>
              <h3 style="font-size: 15px; font-weight: 900; color: var(--text-dark); margin: 0; display: flex; align-items: center; gap: 8px;">
                <i class="fa-solid fa-trophy" style="color: #eab308;"></i> Menu Item Profitability & Margin Engineering Matrix
              </h3>
              <div style="font-size: 11px; color: var(--text-muted); font-weight: 600; margin-top: 2px;">
                Analyze unit sales, gross revenue, estimated food cost (COGS), and exact net profit contribution per dish
              </div>
            </div>

            <!-- Search & Sort Controls -->
            <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
              <div style="position: relative; width: 190px;">
                <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 10px; top: 11px; font-size: 11px; color: var(--text-muted);"></i>
                <input type="text" id="rep-item-search-input" class="form-input" placeholder="Search menu item..." style="height: 34px; font-size: 12px; padding-left: 28px; border-radius: 10px; width: 100%;">
              </div>
              <select id="rep-item-sort-select" class="form-input" style="height: 34px; font-size: 11.5px; border-radius: 10px; padding: 2px 8px; font-weight: 700; width: 175px;">
                <option value="profit">Sort: Highest Profit First</option>
                <option value="gross">Sort: Highest Revenue</option>
                <option value="qty">Sort: Most Units Sold</option>
                <option value="margin">Sort: Highest Margin %</option>
              </select>
            </div>
          </div>

          <!-- Item Profitability Table -->
          <div class="table-container" style="max-height: 360px; overflow-y: auto; overflow-x: auto; width: 100%; -webkit-overflow-scrolling: touch;">
            <table class="premium-table" style="font-size: 12.5px;">
              <thead>
                <tr>
                  <th>Menu Item Description</th>
                  <th>Category</th>
                  <th>Menu Price</th>
                  <th>Units Sold</th>
                  <th style="text-align: right;">Gross Sales</th>
                  <th style="text-align: right;">Est. Food Cost</th>
                  <th style="text-align: right;">Gross Profit Contributed</th>
                  <th style="text-align: right;">Margin %</th>
                  <th style="text-align: center;">Profit Role</th>
                </tr>
              </thead>
              <tbody id="rep-item-profit-tbody">
                <!-- Injected via JS -->
              </tbody>
            </table>
          </div>
        </div>

        <!-- 4 Key Operational Insights Cards for Selected Period -->
        <div class="dash-insights-grid">
          
          <!-- Insight Card 1: Fulfillment Channels -->
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

          <!-- Insight Card 2: Cash & Payment Reconciliation -->
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
                  <i class="fa-solid fa-stopwatch" style="color: #f59e0b;"></i> Operational Shift Breakdown
                </div>
                <div style="font-size: 11px; color: var(--text-muted); font-weight: 600; margin-top: 2px;">
                  <i class="fa-regular fa-clock"></i> Timings: 2:00 PM – 12:00 AM
                </div>
              </div>
              <span class="insight-badge" id="rep-peak-hour-badge" style="background: #fffbeb; color: #b45309; border-color: #fde68a;">Calculating...</span>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 8px;" id="rep-shifts-container">
              <!-- Injected dynamically -->
            </div>
          </div>

          <!-- Insight Card 4: Promotional Discounts & BOGO Impact -->
          <div class="dash-insight-card">
            <div class="insight-header">
              <div class="insight-title">
                <i class="fa-solid fa-tags" style="color: #8b5cf6;"></i> Offers & BOGO Discounts Impact
              </div>
              <span class="insight-badge" id="rep-discount-rate-badge" style="background: #f5f3ff; color: #5b21b6; border-color: #ddd6fe;">0% Discount</span>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 10px;" id="rep-discounts-container">
              <!-- Injected dynamically -->
            </div>
          </div>

        </div>

        <!-- Tables Row: Customer Loyalty & Regular VIPs + Low Velocity Menu Watchlist -->
        <div class="dashboard-details-row">
          
          <!-- Customer Loyalty Card -->
          <div class="glass-card" style="display: flex; flex-direction: column;">
            <div class="flex-space mb-3" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
              <div>
                <h3 style="font-size: 15px; font-weight: 800; color: var(--text-dark); margin: 0;">
                  <i class="fa-solid fa-users" style="color: #10b981; margin-right: 6px;"></i> Customer Loyalty & Regular Guests
                </h3>
                <div style="font-size: 11px; color: var(--text-muted); font-weight: 600; margin-top: 2px;" id="rep-loyalty-subtext">
                  Repeat customer visits and lifetime value in selected period
                </div>
              </div>
              <span class="badge badge-completed" id="rep-repeat-rate-badge">0% Repeat Rate</span>
            </div>
            <div class="table-container" style="max-height: 280px; overflow-y: auto; overflow-x: auto; width: 100%; -webkit-overflow-scrolling: touch; flex-grow: 1;">
              <table class="premium-table" style="font-size: 12.5px;">
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
                  <i class="fa-solid fa-triangle-exclamation" style="color: #ea580c; margin-right: 6px;"></i> Zero Velocity Menu Watchlist
                </h3>
                <div style="font-size: 11px; color: var(--text-muted); font-weight: 600; margin-top: 2px;" id="rep-slow-items-subtext">
                  Active items with 0 sales in selected period to optimize inventory
                </div>
              </div>
              <span class="badge" style="background: #fef2f2; color: #dc2626; border: 1px solid #fecaca;" id="rep-slow-items-badge">0 Unsold Items</span>
            </div>
            <div class="table-container" style="max-height: 280px; overflow-y: auto; overflow-x: auto; width: 100%; -webkit-overflow-scrolling: touch; flex-grow: 1;">
              <table class="premium-table" style="font-size: 12.5px;">
                <thead>
                  <tr>
                    <th>Menu Item</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th style="text-align: right;">Status</th>
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
    const cogsButtons = document.querySelectorAll(".cogs-btn");
    const searchInput = document.getElementById("rep-item-search-input");
    const sortSelect = document.getElementById("rep-item-sort-select");

    // Quick Date Preset Buttons
    const highlightPreset = (activeBtn) => {
      presetButtons.forEach(b => {
        b.style.background = "#f1f5f9";
        b.style.borderColor = "var(--border-color)";
        b.style.color = "var(--text-dark)";
        b.style.fontWeight = "700";
      });
      if (activeBtn) {
        activeBtn.style.background = "#eff6ff";
        activeBtn.style.borderColor = "#bfdbfe";
        activeBtn.style.color = "#2563eb";
        activeBtn.style.fontWeight = "800";
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
        } else if (range === "last30") {
          const l30 = new Date();
          l30.setDate(today.getDate() - 30);
          this.startDate = this.getLocalDateStr(l30);
          this.endDate = todayStr;
        } else if (range === "thisMonth") {
          const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
          this.startDate = this.getLocalDateStr(firstDay);
          this.endDate = todayStr;
        } else if (range === "lastMonth") {
          const firstDayPrev = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          const lastDayPrev = new Date(today.getFullYear(), today.getMonth(), 0);
          this.startDate = this.getLocalDateStr(firstDayPrev);
          this.endDate = this.getLocalDateStr(lastDayPrev);
        }

        const startInput = document.getElementById("report-start-date");
        const endInput = document.getElementById("report-end-date");
        if (startInput) startInput.value = this.startDate;
        if (endInput) endInput.value = this.endDate;

        highlightPreset(btn);
        this.processDataAndRender();
        window.showToast(`Analytics updated: ${this.startDate} to ${this.endDate}`, "info");
      });
    });

    // Custom Date Range Apply Button
    if (btnApply) {
      btnApply.onclick = () => {
        const s = document.getElementById("report-start-date").value;
        const e = document.getElementById("report-end-date").value;

        if (!s || !e) {
          window.showToast("Please choose valid start and end dates.", "error");
          return;
        }
        if (s > e) {
          window.showToast("Start date cannot be after end date.", "error");
          return;
        }

        this.startDate = s;
        this.endDate = e;
        highlightPreset(null);
        this.processDataAndRender();
        window.showToast("Analytics updated for custom range.", "success");
      };
    }

    // COGS Calibrator Buttons
    cogsButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        cogsButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.cogsPercent = Number(btn.getAttribute("data-cogs")) || 32;
        this.processDataAndRender();
        window.showToast(`Food cost benchmark calibrated to ${this.cogsPercent}%`, "success");
      });
    });

    // Chart 1 Stream Mode Switcher
    const trendToggleBtns = document.querySelectorAll("#rep-trend-mode-toggle button");
    trendToggleBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        trendToggleBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.activeChartMode = btn.getAttribute("data-mode");
        this.renderTrendChartOnly();
      });
    });

    // Chart 2 Doughnut Mode Switcher
    const donutToggleBtns = document.querySelectorAll("#rep-donut-mode-toggle button");
    donutToggleBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        donutToggleBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.activeDonutMode = btn.getAttribute("data-mode");
        this.renderDonutChartOnly();
      });
    });

    // Item Search & Sort Listeners
    if (searchInput) {
      searchInput.oninput = (e) => {
        this.itemSearchQuery = e.target.value.toLowerCase().trim();
        this.renderItemProfitTableOnly();
      };
    }

    if (sortSelect) {
      sortSelect.onchange = (e) => {
        this.itemSortKey = e.target.value;
        this.renderItemProfitTableOnly();
      };
    }

    // Export CSV & Print P&L Report
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
    const expenses = window.db.get("expenses") || [];
    const settings = window.db.get("settings") || {};
    const currency = settings.currencySymbol || "₹";

    const startStr = this.startDate;
    const endStr = this.endDate;

    // 1. Filter Orders in range
    const filteredOrders = orders.filter(o => {
      if (!o.createdAt) return false;
      const orderDate = new Date(o.createdAt);
      const d = !isNaN(orderDate.getTime()) ? this.getLocalDateStr(orderDate) : o.createdAt.substring(0, 10);
      return d >= startStr && d <= endStr;
    });

    const validOrders = filteredOrders.filter(o => o.status !== "Cancelled");
    const cancelledOrders = filteredOrders.filter(o => o.status === "Cancelled");

    // 2. Filter Operating Expenses in range
    const periodExpenses = expenses.filter(e => {
      const dStr = e.date || (e.createdAt ? e.createdAt.substring(0, 10) : "");
      return dStr >= startStr && dStr <= endStr;
    });

    // 3. Core P&L Financial Calculations
    let cashTotal = 0;
    let upiTotal = 0;
    let cardTotal = 0;
    let grossSales = 0;
    let totalItemsCount = 0;

    validOrders.forEach(o => {
      const amt = Number(o.total) || 0;
      grossSales += amt;
      const pm = (o.paymentMethod || "UPI").toLowerCase();
      if (pm === "cash") cashTotal += amt;
      else if (pm === "card") cardTotal += amt;
      else upiTotal += amt;

      if (Array.isArray(o.items)) {
        o.items.forEach(it => { totalItemsCount += (Number(it.quantity) || 1); });
      }
    });

    const bogoDiscounts = validOrders.reduce((sum, o) => sum + (Number(o.bogoDiscount) || 0), 0);
    const flatDiscounts = validOrders.reduce((sum, o) => sum + (Number(o.discount) || 0), 0);
    const totalDiscounts = bogoDiscounts + flatDiscounts;

    const netSales = grossSales; // Realized order revenue
    const totalOperatingExpenses = periodExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    
    // COGS & Profit Benchmarking
    const cogsRate = this.cogsPercent / 100;
    const estimatedCOGS = grossSales * cogsRate;
    const grossProfit = Math.max(0, grossSales - estimatedCOGS);
    const grossMarginPct = grossSales > 0 ? Math.round((grossProfit / grossSales) * 100) : (100 - this.cogsPercent);
    
    // Net Operating Profit
    const netProfit = grossProfit - totalOperatingExpenses;
    const netMarginPct = grossSales > 0 ? ((netProfit / grossSales) * 100).toFixed(1) : "0.0";
    const aov = validOrders.length > 0 ? (grossSales / validOrders.length) : 0;
    const itemsPerOrder = validOrders.length > 0 ? (totalItemsCount / validOrders.length).toFixed(1) : "0";

    // Cashless Adoption
    const cashlessAmt = upiTotal + cardTotal;
    const cashlessPercent = grossSales > 0 ? Math.round((cashlessAmt / grossSales) * 100) : 0;

    // Cache calculations on instance for chart re-renders
    this.currentData = {
      validOrders,
      periodExpenses,
      categories,
      products,
      currency,
      grossSales,
      netSales,
      totalDiscounts,
      bogoDiscounts,
      flatDiscounts,
      estimatedCOGS,
      grossProfit,
      grossMarginPct,
      totalOperatingExpenses,
      netProfit,
      netMarginPct,
      aov,
      itemsPerOrder,
      cashlessPercent,
      cashTotal,
      upiTotal,
      cardTotal
    };

    // 4. Update Top 6 Scorecard Elements
    const grossSalesEl = document.getElementById("rep-gross-sales");
    const ordersSubEl = document.getElementById("rep-orders-sub");
    const grossOrdersBadge = document.getElementById("rep-gross-orders-badge");
    const cancelledBadge = document.getElementById("rep-cancelled-badge");

    const netSalesEl = document.getElementById("rep-net-sales");
    const discountsBadge = document.getElementById("rep-discounts-badge");

    const cogsValEl = document.getElementById("rep-cogs-val");
    const cogsSubEl = document.getElementById("rep-cogs-sub");
    const grossMarginBadge = document.getElementById("rep-gross-margin-badge");

    const expenseValEl = document.getElementById("rep-expense-val");
    const expenseEntriesBadge = document.getElementById("rep-expense-entries-badge");

    const netProfitValEl = document.getElementById("rep-net-profit-val");
    const profitMarginBadge = document.getElementById("rep-profit-margin-badge");
    const healthStatusBadge = document.getElementById("rep-health-status-badge");
    const profitCard = document.getElementById("rep-profit-card");

    const aovValEl = document.getElementById("rep-aov-val");
    const aovSubEl = document.getElementById("rep-aov-sub");
    const itemsPerOrderBadge = document.getElementById("rep-items-per-order-badge");
    const cashlessBadge = document.getElementById("rep-cashless-badge");

    if (grossSalesEl) grossSalesEl.textContent = `${currency}${Math.round(grossSales).toLocaleString("en-IN")}`;
    if (ordersSubEl) ordersSubEl.textContent = `${validOrders.length} completed transactions`;
    if (grossOrdersBadge) grossOrdersBadge.innerHTML = `<i class="fa-solid fa-receipt"></i> ${validOrders.length} Bills`;
    if (cancelledBadge) {
      if (cancelledOrders.length > 0) {
        cancelledBadge.style.display = "inline-flex";
        cancelledBadge.innerHTML = `<i class="fa-solid fa-ban"></i> ${cancelledOrders.length} Cancelled`;
      } else {
        cancelledBadge.style.display = "none";
      }
    }

    if (netSalesEl) netSalesEl.textContent = `${currency}${Math.round(netSales).toLocaleString("en-IN")}`;
    if (discountsBadge) discountsBadge.innerHTML = `<i class="fa-solid fa-tag"></i> Discounts: -${currency}${Math.round(totalDiscounts).toLocaleString("en-IN")}`;

    if (cogsValEl) cogsValEl.textContent = `${currency}${Math.round(estimatedCOGS).toLocaleString("en-IN")}`;
    if (cogsSubEl) cogsSubEl.textContent = `Benchmarked at ${this.cogsPercent}% food cost`;
    if (grossMarginBadge) grossMarginBadge.innerHTML = `<i class="fa-solid fa-percent"></i> ${grossMarginPct}% Gross Margin`;

    if (expenseValEl) expenseValEl.textContent = `${currency}${Math.round(totalOperatingExpenses).toLocaleString("en-IN")}`;
    if (expenseEntriesBadge) expenseEntriesBadge.innerHTML = `<i class="fa-solid fa-receipt"></i> ${periodExpenses.length} Expense Entries`;

    if (netProfitValEl) {
      const isProfitable = netProfit >= 0;
      netProfitValEl.textContent = `${isProfitable ? '' : '-'}${currency}${Math.abs(Math.round(netProfit)).toLocaleString("en-IN")}`;
      netProfitValEl.style.color = isProfitable ? "#059669" : "#dc2626";

      if (profitCard) {
        profitCard.className = `rep-kpi-card ${isProfitable ? 'accent-green' : 'accent-rose'}`;
      }

      if (profitMarginBadge) {
        profitMarginBadge.className = `growth-tag ${isProfitable ? 'growth-up' : 'growth-down'}`;
        profitMarginBadge.innerHTML = `<i class="fa-solid ${isProfitable ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}"></i> ${netMarginPct}% Net Margin`;
      }

      if (healthStatusBadge) {
        if (netProfit > (grossSales * 0.25)) {
          healthStatusBadge.className = "dash-sub-pill pill-cash";
          healthStatusBadge.textContent = "High Profitability";
        } else if (netProfit > 0) {
          healthStatusBadge.className = "dash-sub-pill pill-neutral";
          healthStatusBadge.textContent = "Profitable Operation";
        } else {
          healthStatusBadge.className = "dash-sub-pill pill-neutral";
          healthStatusBadge.style.color = "#dc2626";
          healthStatusBadge.textContent = "Operating at Deficit";
        }
      }
    }

    if (aovValEl) aovValEl.textContent = `${currency}${Math.round(aov).toLocaleString("en-IN")}`;
    if (aovSubEl) aovSubEl.textContent = `Average spend per completed ticket`;
    if (itemsPerOrderBadge) itemsPerOrderBadge.innerHTML = `<i class="fa-solid fa-burger"></i> ~${itemsPerOrder} Items / Order`;
    if (cashlessBadge) cashlessBadge.innerHTML = `<i class="fa-solid fa-qrcode"></i> ${cashlessPercent}% Cashless`;

    // 5. Render Executive P&L Waterfall Steps
    this.renderWaterfallSteps(grossSales, totalDiscounts, netSales, estimatedCOGS, grossProfit, totalOperatingExpenses, netProfit, currency);

    // 6. Render Item Profitability & Margin Engineering Matrix Table
    this.renderItemProfitTableOnly();

    // 7. Render Operational Insights (Channels, Cash Reconcile, Shifts, Discounts)
    this.renderOrderChannels(validOrders, grossSales, currency);
    this.renderCashReconciliation(cashTotal, upiTotal, cardTotal, grossSales, currency);
    this.renderShiftsAndPeak(validOrders, currency);
    this.renderDiscountsImpact(validOrders, grossSales, currency);

    // 8. Render Customer Loyalty & Low Velocity Items
    this.renderCustomerLoyalty(validOrders, currency);
    this.renderLowVelocityMenu(products, categories, validOrders, currency);

    // 9. Day of Week Matrix
    this.renderDayOfWeekPerformance(validOrders, currency);

    // 10. Render Charts
    this.renderTrendChartOnly();
    this.renderDonutChartOnly();
    this.renderHourlyRushChartOnly();
  },

  renderWaterfallSteps(gross, discounts, net, cogs, grossProf, expenses, netProf, currency) {
    const container = document.getElementById("rep-waterfall-steps");
    if (!container) return;

    const isProfitable = netProf >= 0;

    container.innerHTML = `
      <!-- Step 1: Gross Sales -->
      <div class="rep-pnl-step">
        <div class="rep-pnl-step-title">1. Gross Sales</div>
        <div class="rep-pnl-step-amt" style="color: #2563eb;">${currency}${Math.round(gross).toLocaleString("en-IN")}</div>
        <div class="rep-pnl-step-tag" style="color: var(--text-muted);">100% Billing</div>
      </div>

      <div class="rep-pnl-arrow"><i class="fa-solid fa-minus"></i></div>

      <!-- Step 2: Discounts -->
      <div class="rep-pnl-step">
        <div class="rep-pnl-step-title">2. Discounts</div>
        <div class="rep-pnl-step-amt" style="color: #ea580c;">-${currency}${Math.round(discounts).toLocaleString("en-IN")}</div>
        <div class="rep-pnl-step-tag" style="color: #ea580c;">Offers & BOGO</div>
      </div>

      <div class="rep-pnl-arrow"><i class="fa-solid fa-equals"></i></div>

      <!-- Step 3: Net Revenue -->
      <div class="rep-pnl-step">
        <div class="rep-pnl-step-title">3. Net Revenue</div>
        <div class="rep-pnl-step-amt" style="color: #4f46e5;">${currency}${Math.round(net).toLocaleString("en-IN")}</div>
        <div class="rep-pnl-step-tag" style="color: #4f46e5;">Realized Cashflow</div>
      </div>

      <div class="rep-pnl-arrow"><i class="fa-solid fa-minus"></i></div>

      <!-- Step 4: Food Cost COGS -->
      <div class="rep-pnl-step">
        <div class="rep-pnl-step-title">4. Food Cost (COGS)</div>
        <div class="rep-pnl-step-amt" style="color: #b45309;">-${currency}${Math.round(cogs).toLocaleString("en-IN")}</div>
        <div class="rep-pnl-step-tag" style="color: #b45309;">${this.cogsPercent}% Ingredients</div>
      </div>

      <div class="rep-pnl-arrow"><i class="fa-solid fa-equals"></i></div>

      <!-- Step 5: Gross Profit -->
      <div class="rep-pnl-step">
        <div class="rep-pnl-step-title">5. Gross Profit</div>
        <div class="rep-pnl-step-amt" style="color: #0d9488;">${currency}${Math.round(grossProf).toLocaleString("en-IN")}</div>
        <div class="rep-pnl-step-tag" style="color: #0d9488;">${100 - this.cogsPercent}% Gross Margin</div>
      </div>

      <div class="rep-pnl-arrow"><i class="fa-solid fa-minus"></i></div>

      <!-- Step 6: Operating Overheads -->
      <div class="rep-pnl-step">
        <div class="rep-pnl-step-title">6. Overhead Expenses</div>
        <div class="rep-pnl-step-amt" style="color: #dc2626;">-${currency}${Math.round(expenses).toLocaleString("en-IN")}</div>
        <div class="rep-pnl-step-tag" style="color: #dc2626;">Salaries & Bills</div>
      </div>

      <div class="rep-pnl-arrow"><i class="fa-solid fa-equals"></i></div>

      <!-- Step 7: Net Operating Profit -->
      <div class="rep-pnl-step step-highlight" style="background: ${isProfitable ? '#ecfdf5' : '#fef2f2'}; border-color: ${isProfitable ? '#a7f3d0' : '#fecaca'};">
        <div class="rep-pnl-step-title" style="color: ${isProfitable ? '#059669' : '#dc2626'}; font-weight: 900;">7. NET OPERATING PROFIT</div>
        <div class="rep-pnl-step-amt" style="color: ${isProfitable ? '#059669' : '#dc2626'}; font-size: 18px;">
          ${isProfitable ? '' : '-'}${currency}${Math.abs(Math.round(netProf)).toLocaleString("en-IN")}
        </div>
        <div class="rep-pnl-step-tag" style="color: ${isProfitable ? '#047857' : '#991b1b'}; font-weight: 800;">
          ${gross > 0 ? ((netProf / gross) * 100).toFixed(1) : '0'}% Final Margin
        </div>
      </div>
    `;
  },

  renderItemProfitTableOnly() {
    const tbody = document.getElementById("rep-item-profit-tbody");
    if (!tbody || !this.currentData) return;

    const { validOrders, categories, products, currency } = this.currentData;
    const cogsRate = this.cogsPercent / 100;

    // Aggregate items sold
    const itemMap = {};
    validOrders.forEach(o => {
      if (Array.isArray(o.items)) {
        o.items.forEach(it => {
          const name = it.name || "Unknown Item";
          if (!itemMap[name]) {
            const prod = products.find(p => p.id === it.productId || p.name === name);
            const cat = prod ? categories.find(c => c.id === prod.category) : null;
            itemMap[name] = {
              name,
              categoryName: cat ? cat.name : "General",
              price: Number(it.price || 0),
              unitsSold: 0,
              grossSales: 0
            };
          }
          itemMap[name].unitsSold += (Number(it.quantity) || 1);
          itemMap[name].grossSales += (Number(it.lineTotal) || (it.price * (it.quantity || 1)));
        });
      }
    });

    let itemList = Object.values(itemMap).map(i => {
      const estimatedCost = i.grossSales * cogsRate;
      const profitContributed = i.grossSales - estimatedCost;
      const marginPct = i.grossSales > 0 ? Math.round((profitContributed / i.grossSales) * 100) : (100 - this.cogsPercent);
      return {
        ...i,
        estimatedCost,
        profitContributed,
        marginPct
      };
    });

    // Filter by search query
    if (this.itemSearchQuery) {
      itemList = itemList.filter(i => 
        i.name.toLowerCase().includes(this.itemSearchQuery) || 
        i.categoryName.toLowerCase().includes(this.itemSearchQuery)
      );
    }

    // Sort
    if (this.itemSortKey === "gross") {
      itemList.sort((a, b) => b.grossSales - a.grossSales);
    } else if (this.itemSortKey === "qty") {
      itemList.sort((a, b) => b.unitsSold - a.unitsSold);
    } else if (this.itemSortKey === "margin") {
      itemList.sort((a, b) => b.marginPct - a.marginPct);
    } else {
      // Default: profit
      itemList.sort((a, b) => b.profitContributed - a.profitContributed);
    }

    if (itemList.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 35px; color: var(--text-muted); font-weight: 600;">No matching items sold during this period.</td></tr>`;
      return;
    }

    // Determine thresholds for Menu Engineering Role
    const maxQty = Math.max(...itemList.map(i => i.unitsSold), 1);
    const maxProfit = Math.max(...itemList.map(i => i.profitContributed), 1);

    tbody.innerHTML = itemList.map((item, idx) => {
      // Role Classification: Star, Horse, Opportunity/Puzzle, Slow
      let roleHtml = `<span class="badge-menu-horse">🐎 Volume Driver</span>`;
      if (item.unitsSold >= maxQty * 0.4 && item.profitContributed >= maxProfit * 0.4) {
        roleHtml = `<span class="badge-menu-star">🌟 Star Item</span>`;
      } else if (item.profitContributed >= maxProfit * 0.35 && item.unitsSold < maxQty * 0.4) {
        roleHtml = `<span class="badge-menu-puzzle">💡 High Margin</span>`;
      } else if (item.unitsSold <= 2) {
        roleHtml = `<span class="badge-menu-slow">⚠️ Low Velocity</span>`;
      }

      return `
        <tr>
          <td>
            <div style="font-weight: 800; color: var(--text-dark); display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 11px; color: var(--text-muted); width: 16px;">#${idx + 1}</span>
              ${item.name}
            </div>
          </td>
          <td>
            <span style="font-size: 11px; font-weight: 700; background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; padding: 2px 7px; border-radius: 6px;">
              ${item.categoryName}
            </span>
          </td>
          <td style="font-weight: 700; color: var(--text-dark);">${currency}${item.price.toFixed(0)}</td>
          <td>
            <span style="font-weight: 800; color: #2563eb; background: #eff6ff; border: 1px solid #bfdbfe; padding: 2px 8px; border-radius: 8px; font-size: 11.5px;">
              ${item.unitsSold} sold
            </span>
          </td>
          <td style="text-align: right; font-weight: 800; color: var(--text-dark);">${currency}${Math.round(item.grossSales).toLocaleString("en-IN")}</td>
          <td style="text-align: right; font-weight: 700; color: #b45309;">${currency}${Math.round(item.estimatedCost).toLocaleString("en-IN")}</td>
          <td style="text-align: right; font-weight: 900; color: #059669; font-size: 13.5px;">+${currency}${Math.round(item.profitContributed).toLocaleString("en-IN")}</td>
          <td style="text-align: right;">
            <span style="font-weight: 800; color: #059669; font-size: 11.5px;">${item.marginPct}%</span>
          </td>
          <td style="text-align: center;">
            ${roleHtml}
          </td>
        </tr>
      `;
    }).join("");
  },

  renderTrendChartOnly() {
    const canvas = document.getElementById("repMainTrendCanvas");
    if (!canvas || !this.currentData) return;

    const ctx = canvas.getContext("2d");
    if (this.mainTrendChart) {
      this.mainTrendChart.destroy();
    }

    const { validOrders, periodExpenses } = this.currentData;
    const cogsRate = this.cogsPercent / 100;
    const textMuted = '#64748b';
    const borderColor = 'rgba(202, 213, 226, 0.6)';

    // Date points generator
    const labels = [];
    const revenuePoints = [];
    const costPoints = [];
    const profitPoints = [];
    const cumulativeProfitPoints = [];

    const [sY, sM, sD] = this.startDate.split('-').map(Number);
    const [eY, eM, eD] = this.endDate.split('-').map(Number);
    const start = new Date(sY, sM - 1, sD);
    const end = new Date(eY, eM - 1, eD);

    let cumulativeSum = 0;

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = this.getLocalDateStr(d);
      labels.push(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }));

      const dayOrders = validOrders.filter(o => {
        const orderDate = new Date(o.createdAt);
        const oStr = !isNaN(orderDate.getTime()) ? this.getLocalDateStr(orderDate) : o.createdAt.substring(0, 10);
        return oStr === dateStr;
      });

      const dayExpenses = periodExpenses.filter(e => {
        const eStr = e.date || (e.createdAt ? e.createdAt.substring(0, 10) : "");
        return eStr === dateStr;
      });

      const dayRevenue = dayOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
      const dayExpenseTotal = dayExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      const dayCOGS = dayRevenue * cogsRate;
      const dayTotalCost = dayCOGS + dayExpenseTotal;
      const dayNetProfit = dayRevenue - dayTotalCost;

      cumulativeSum += dayNetProfit;

      revenuePoints.push(Math.round(dayRevenue));
      costPoints.push(Math.round(dayTotalCost));
      profitPoints.push(Math.round(dayNetProfit));
      cumulativeProfitPoints.push(Math.round(cumulativeSum));
    }

    // Gradient Fills
    const blueGradient = ctx.createLinearGradient(0, 0, 0, 240);
    blueGradient.addColorStop(0, 'rgba(37, 99, 235, 0.25)');
    blueGradient.addColorStop(1, 'rgba(37, 99, 235, 0.01)');

    const greenGradient = ctx.createLinearGradient(0, 0, 0, 240);
    greenGradient.addColorStop(0, 'rgba(16, 185, 129, 0.28)');
    greenGradient.addColorStop(1, 'rgba(16, 185, 129, 0.01)');

    let datasets = [];

    if (this.activeChartMode === "revenue") {
      datasets = [
        {
          label: "Sales Revenue (₹)",
          data: revenuePoints,
          borderColor: "#2563eb",
          backgroundColor: blueGradient,
          borderWidth: 3,
          tension: 0.25,
          fill: true,
          pointBackgroundColor: "#2563eb",
          pointRadius: 4
        }
      ];
    } else if (this.activeChartMode === "profit") {
      datasets = [
        {
          label: "Net Operating Profit (₹)",
          data: profitPoints,
          borderColor: "#10b981",
          backgroundColor: greenGradient,
          borderWidth: 3,
          tension: 0.25,
          fill: true,
          pointBackgroundColor: "#10b981",
          pointRadius: 4
        }
      ];
    } else if (this.activeChartMode === "cumulative") {
      datasets = [
        {
          label: "Cumulative Net Profit (₹)",
          data: cumulativeProfitPoints,
          borderColor: "#7c3aed",
          backgroundColor: 'rgba(124, 58, 237, 0.15)',
          borderWidth: 3,
          tension: 0.25,
          fill: true,
          pointBackgroundColor: "#7c3aed",
          pointRadius: 4
        }
      ];
    } else {
      // Default: 'both' (Multi-Stream)
      datasets = [
        {
          label: "Sales Revenue (₹)",
          data: revenuePoints,
          borderColor: "#2563eb",
          backgroundColor: blueGradient,
          borderWidth: 2.5,
          tension: 0.25,
          fill: true,
          pointBackgroundColor: "#2563eb",
          pointRadius: 3.5
        },
        {
          label: "Cost & Overheads (₹)",
          data: costPoints,
          borderColor: "#f59e0b",
          borderWidth: 2,
          borderDash: [5, 4],
          tension: 0.25,
          fill: false,
          pointBackgroundColor: "#f59e0b",
          pointRadius: 3
        },
        {
          label: "Net Profit (₹)",
          data: profitPoints,
          borderColor: "#10b981",
          backgroundColor: greenGradient,
          borderWidth: 3,
          tension: 0.25,
          fill: true,
          pointBackgroundColor: "#10b981",
          pointRadius: 4
        }
      ];
    }

    this.mainTrendChart = new Chart(ctx, {
      type: "line",
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            display: true,
            labels: { color: textMuted, font: { family: "Outfit", size: 11, weight: "bold" }, boxWidth: 12 }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleFont: { family: "Outfit", size: 12, weight: "bold" },
            bodyFont: { family: "Outfit", size: 11.5 },
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (context) => ` ${context.dataset.label}: ₹${context.raw.toLocaleString("en-IN")}`
            }
          }
        },
        scales: {
          x: {
            grid: { color: borderColor },
            ticks: { color: textMuted, font: { family: "Outfit", size: 10.5, weight: "600" } }
          },
          y: {
            grid: { color: borderColor },
            ticks: { color: textMuted, font: { family: "Outfit", size: 10.5, weight: "600" } }
          }
        }
      }
    });
  },

  renderDonutChartOnly() {
    const canvas = document.getElementById("repDonutCanvas");
    if (!canvas || !this.currentData) return;

    const ctx = canvas.getContext("2d");
    if (this.donutBreakdownChart) {
      this.donutBreakdownChart.destroy();
    }

    const { validOrders, periodExpenses, categories, products } = this.currentData;
    const textMuted = '#64748b';
    const borderColor = 'rgba(202, 213, 226, 0.6)';

    let labels = [];
    let data = [];
    let backgroundColors = [];

    if (this.activeDonutMode === "expenses") {
      // Group by expense category
      const expCatMap = {};
      periodExpenses.forEach(e => {
        const cat = e.category || "Other expenses";
        expCatMap[cat] = (expCatMap[cat] || 0) + (Number(e.amount) || 0);
      });

      labels = Object.keys(expCatMap);
      data = labels.map(k => Math.round(expCatMap[k]));
      backgroundColors = ["#ef4444", "#f59e0b", "#8b5cf6", "#06b6d4", "#64748b", "#10b981"];

      if (labels.length === 0) {
        labels = ["No Operating Expenses"];
        data = [1];
        backgroundColors = [borderColor];
      }
    } else {
      // Default: Categories
      const catSalesMap = {};
      categories.forEach(c => { catSalesMap[c.name] = 0; });

      validOrders.forEach(o => {
        if (Array.isArray(o.items)) {
          o.items.forEach(it => {
            const prod = products.find(p => p.id === it.productId || p.name === it.name);
            if (prod) {
              const cat = categories.find(c => c.id === prod.category);
              if (cat) {
                catSalesMap[cat.name] = (catSalesMap[cat.name] || 0) + (Number(it.lineTotal) || 0);
              }
            }
          });
        }
      });

      labels = Object.keys(catSalesMap).filter(k => catSalesMap[k] > 0);
      data = labels.map(k => Math.round(catSalesMap[k]));
      backgroundColors = ["#2563eb", "#10b981", "#6366f1", "#0284c7", "#f59e0b", "#ec4899", "#8b5cf6", "#14b8a6", "#64748b"];

      if (labels.length === 0) {
        labels = ["No Sales"];
        data = [1];
        backgroundColors = [borderColor];
      }
    }

    this.donutBreakdownChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: backgroundColors,
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
            position: "right",
            labels: { color: textMuted, font: { family: "Outfit", size: 11, weight: "bold" }, padding: 8, boxWidth: 10 }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleFont: { family: "Outfit", size: 12, weight: "bold" },
            bodyFont: { family: "Outfit", size: 11.5 },
            padding: 9,
            cornerRadius: 8,
            callbacks: {
              label: (ctx) => ` ${ctx.label}: ₹${Number(ctx.raw).toLocaleString("en-IN")}`
            }
          }
        },
        cutout: "68%"
      }
    });
  },

  renderHourlyRushChartOnly() {
    const canvas = document.getElementById("repHourlyRushCanvas");
    if (!canvas || !this.currentData) return;

    const ctx = canvas.getContext("2d");
    if (this.hourlyRushChart) {
      this.hourlyRushChart.destroy();
    }

    const { validOrders } = this.currentData;
    const textMuted = '#64748b';
    const borderColor = 'rgba(202, 213, 226, 0.6)';

    const opHours = [14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
    const rushLabels = ["2 PM", "3 PM", "4 PM", "5 PM", "6 PM", "7 PM", "8 PM", "9 PM", "10 PM", "11 PM"];
    const rushSales = opHours.map(() => 0);
    const rushBills = opHours.map(() => 0);

    const barColors = opHours.map(h => {
      if (h >= 14 && h < 17) return "#f59e0b"; // Afternoon
      if (h >= 17 && h < 19) return "#ea580c"; // Evening
      if (h >= 19 && h < 22) return "#7c3aed"; // Dinner Rush
      return "#4f46e5"; // Late Night
    });

    validOrders.forEach(o => {
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

    let peakIdx = 0;
    let maxRush = 0;
    rushSales.forEach((s, idx) => {
      if (s > maxRush) {
        maxRush = s;
        peakIdx = idx;
      }
    });

    const chip = document.getElementById("rep-peak-hour-chip");
    if (chip) {
      chip.textContent = maxRush > 0 ? `Peak Rush: ${rushLabels[peakIdx]}` : "No Rush Logged";
    }

    this.hourlyRushChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: rushLabels,
        datasets: [{
          label: "Sales (₹)",
          data: rushSales.map(Math.round),
          backgroundColor: barColors,
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
            bodyFont: { family: "Outfit", size: 11.5 },
            padding: 9,
            cornerRadius: 8,
            callbacks: {
              label: (ctx) => [
                ` Revenue: ₹${Number(ctx.raw).toLocaleString("en-IN")}`,
                ` Bills: ${rushBills[ctx.dataIndex]} orders`
              ]
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: textMuted, font: { family: "Outfit", size: 10.5, weight: "600" } }
          },
          y: {
            grid: { color: borderColor },
            ticks: { color: textMuted, font: { family: "Outfit", size: 10.5, weight: "600" } }
          }
        }
      }
    });
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
      badge.textContent = `👑 Best: ${dayNames[bestDayIdx]} (${currencySymbol}${Math.round(maxDaySales).toLocaleString("en-IN")})`;
    }

    container.innerHTML = dayStats.map(ds => {
      const isTop = ds.dayIdx === bestDayIdx && maxDaySales > 0;
      const avgBill = ds.orders > 0 ? Math.round(ds.sales / ds.orders) : 0;
      return `
        <div style="background: ${isTop ? '#fffbeb' : '#f8fafc'}; border: ${isTop ? '1.5px solid #fde68a' : '1px solid var(--border-color)'}; border-radius: 10px; padding: 10px 8px; text-align: center; display: flex; flex-direction: column; justify-content: space-between; gap: 4px;">
          <div style="font-size: 11.5px; font-weight: 800; color: ${isTop ? '#b45309' : 'var(--text-dark)'};">
            ${ds.name} ${isTop ? '👑' : ''}
          </div>
          <div style="font-size: 13.5px; font-weight: 900; color: ${isTop ? '#b45309' : '#2563eb'};">
            ${currencySymbol}${Math.round(ds.sales).toLocaleString("en-IN")}
          </div>
          <div style="font-size: 10px; color: var(--text-muted); font-weight: 600;">
            ${ds.orders} bills • Avg ${currencySymbol}${avgBill}
          </div>
        </div>
      `;
    }).join("");
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
            <i class="fa-solid fa-money-bill-wave"></i> Cash Collected in Till:
          </span>
          <span style="font-size: 13.5px; font-weight: 900; color: #059669;">${currencySymbol}${Math.round(cashTotal).toLocaleString("en-IN")}</span>
        </div>
        <div style="height: 5px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
          <div style="width: ${cashPct}%; height: 100%; background: #10b981; border-radius: 3px;"></div>
        </div>
        <div style="font-size: 10.5px; color: var(--text-muted); text-align: right; margin-top: 2px;">${cashPct}% of total collections</div>
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
        <div style="font-size: 10.5px; color: var(--text-muted); text-align: right; margin-top: 2px;">${upiPct}% of total collections</div>
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
          <div style="font-size: 10.5px; color: var(--text-muted); text-align: right; margin-top: 2px;">${cardPct}% of total collections</div>
        </div>
      ` : ''}
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
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:25px; color:var(--text-muted); font-size:12px; font-weight:600;"><i class="fa-solid fa-address-book" style="margin-right:6px;"></i> Guest details registered in POS terminal will appear here.</td></tr>`;
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

  renderLowVelocityMenu(products, categories, validOrders, currencySymbol) {
    const tbody = document.getElementById("rep-slow-items-tbody");
    if (!tbody) return;

    const itemSoldMap = {};
    validOrders.forEach(o => {
      if (Array.isArray(o.items)) {
        o.items.forEach(it => { itemSoldMap[it.name] = true; });
      }
    });

    const activeProducts = products.filter(p => p.status !== "Inactive");
    const unsoldItems = activeProducts.filter(p => !itemSoldMap[p.name]);

    const badge = document.getElementById("rep-slow-items-badge");
    if (badge) badge.textContent = `${unsoldItems.length} Unsold Items`;

    if (unsoldItems.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:25px; color:#059669; font-weight:700;"><i class="fa-solid fa-circle-check"></i> Great job! All active menu items recorded sales!</td></tr>`;
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

  showPrintSummaryModal() {
    if (!this.currentData) return;

    const {
      validOrders,
      periodExpenses,
      currency,
      grossSales,
      netSales,
      totalDiscounts,
      bogoDiscounts,
      flatDiscounts,
      estimatedCOGS,
      grossProfit,
      grossMarginPct,
      totalOperatingExpenses,
      netProfit,
      netMarginPct,
      aov,
      cashTotal,
      upiTotal,
      cardTotal
    } = this.currentData;

    const settings = window.db.get("settings") || {};
    const restaurantName = settings.restaurantName || "Crust & Chilly";

    const summaryHtml = `
      <div id="reports-pl-printable-area" style="font-family: 'Courier New', monospace; font-size: 12.5px; color: #000; background: #fff; padding: 18px; line-height: 1.45;">
        <div style="text-align: center; margin-bottom: 14px;">
          <h2 style="font-size: 19px; font-weight: 900; margin: 0; text-transform: uppercase;">${restaurantName}</h2>
          <p style="font-size: 12px; font-weight: 700; margin: 2px 0;">EXECUTIVE PROFIT & LOSS (P&L) STATEMENT</p>
          <p style="font-size: 11px; margin: 0;">Period: ${this.startDate} to ${this.endDate}</p>
        </div>

        <div style="border-top: 1.5px dashed #000; border-bottom: 1.5px dashed #000; padding: 8px 0; margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between;">
            <span>Completed Customer Orders:</span>
            <strong>${validOrders.length} orders</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 2px;">
            <span>Gross Sales (100%):</span>
            <strong>${currency}${(grossSales + totalDiscounts).toFixed(2)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 2px; color: #555;">
            <span>(-) Promotional Discounts (BOGO & Offers):</span>
            <span>-${currency}${totalDiscounts.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-weight: 900; border-top: 1px solid #000; margin-top: 4px; padding-top: 4px;">
            <span>NET SALES REVENUE:</span>
            <span>${currency}${netSales.toFixed(2)}</span>
          </div>
        </div>

        <div style="border-bottom: 1.5px dashed #000; padding-bottom: 8px; margin-bottom: 10px;">
          <div style="font-weight: 800; text-decoration: underline; margin-bottom: 4px;">COST OF GOODS & OPERATING EXPENSES:</div>
          <div style="display: flex; justify-content: space-between;">
            <span>(-) Cost of Goods Sold (COGS @ ${this.cogsPercent}%):</span>
            <span>-${currency}${estimatedCOGS.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-weight: 800; margin-top: 2px;">
            <span>GROSS PROFIT (${grossMarginPct}% Margin):</span>
            <span>${currency}${grossProfit.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 3px; color: #555;">
            <span>(-) Overhead Operating Expenses:</span>
            <span>-${currency}${totalOperatingExpenses.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: 900; border-top: 1.5px solid #000; margin-top: 6px; padding-top: 6px;">
            <span>NET OPERATING PROFIT:</span>
            <span>${currency}${netProfit.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; margin-top: 2px;">
            <span>Net Profit Margin %:</span>
            <strong>${netMarginPct}%</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; margin-top: 2px;">
            <span>Average Order Value (AOV):</span>
            <strong>${currency}${Math.round(aov)}</strong>
          </div>
        </div>

        <div style="margin-bottom: 12px; font-size: 12px;">
          <strong style="text-decoration: underline;">PAYMENT COLLECTION BREAKDOWN:</strong>
          <div style="display: flex; justify-content: space-between; margin-top: 4px;">
            <span>Cash in Till:</span>
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

        <div style="text-align: center; margin-top: 22px; font-size: 11px; border-top: 1px dashed #000; padding-top: 10px;">
          Authorized Manager Signature: _______________________<br><br>
          System Generated: ${new Date().toLocaleString("en-IN")}
        </div>
      </div>
    `;

    window.customModal.show({
      title: "Executive P&L Performance Report",
      bodyHtml: summaryHtml,
      confirmText: "Print P&L Summary",
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
    if (!this.currentData) return;

    const { validOrders } = this.currentData;
    const startStr = this.startDate;
    const endStr = this.endDate;
    const cogsRate = this.cogsPercent / 100;

    if (validOrders.length === 0) {
      window.showToast("No orders available to export for this period.", "error");
      return;
    }

    let csv = "Order ID,Date,Customer,Phone,Order Type,Payment Method,Subtotal,BOGO Discount,Flat Discount,Net Total,Estimated COGS,Net Profit Contributed,Status\r\n";
    validOrders.forEach(o => {
      const net = Number(o.total) || 0;
      const cogs = net * cogsRate;
      const profit = net - cogs;
      csv += `ORD-${o.orderNumber},"${o.createdAt}",` +
             `"${(o.customerName || 'Walk-in').replace(/"/g, '""')}",` +
             `"${(o.customerPhone || '').replace(/"/g, '""')}",` +
             `"${o.type || 'Dine-in'}","${o.paymentMethod || 'UPI'}",` +
             `${(Number(o.subtotal) || 0).toFixed(2)},${(Number(o.bogoDiscount) || 0).toFixed(2)},` +
             `${(Number(o.discount) || 0).toFixed(2)},${net.toFixed(2)},${cogs.toFixed(2)},${profit.toFixed(2)},"${o.status}"\r\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `CC_Sales_and_Profit_Report_${startStr}_to_${endStr}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.showToast("Comprehensive P&L CSV file successfully downloaded.", "success");
  }
};
