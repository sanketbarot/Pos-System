// Crust & Chilly POS - Enhanced Daily Counter & Bills History Module
// Provides comprehensive cash drawer reconciliation, denomination counting,
// multi-period filtering, all-time search, WhatsApp bill sharing, order voiding, and CSV export.

window.views = window.views || {};
window.views.counter = {
  activeDateStr: null,
  selectedPeriod: "today", // 'today' | 'yesterday' | 'week' | 'month' | 'all' | 'custom'
  searchQuery: "",
  paymentFilter: "all",
  statusFilter: "all",
  typeFilter: "all",
  sortBy: "newest", // 'newest' | 'oldest' | 'highest' | 'lowest'
  showTallyPanel: false,

  // Denominations state
  denominations: {
    500: 0,
    200: 0,
    100: 0,
    50: 0,
    20: 0,
    10: 0,
    coins: 0
  },

  init(container) {
    const today = new Date();
    this.activeDateStr = this.getIstDateString(today);

    // Load saved denominations for today if available
    try {
      const savedDenoms = localStorage.getItem(`crust_denom_${this.activeDateStr}`);
      if (savedDenoms) {
        this.denominations = JSON.parse(savedDenoms);
      } else {
        this.denominations = { 500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, coins: 0 };
      }
    } catch (e) {
      this.denominations = { 500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, coins: 0 };
    }

    container.innerHTML = `
      <div class="view-animate" style="display: flex; flex-direction: column; gap: 16px;">
        
        <!-- Top Control & Action Bar -->
        <div class="glass-card counter-control-bar" style="padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          
          <!-- Period Selector & Date Controls -->
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 14px; font-weight: 800; color: var(--text-dark); white-space: nowrap; display: flex; align-items: center; gap: 6px;">
                <i class="fa-solid fa-cash-register" style="color: #2563eb;"></i> Daily Counter:
              </span>
            </div>

            <!-- Timeframe Quick Pills -->
            <div class="counter-time-pills">
              <button type="button" class="counter-time-pill ${this.selectedPeriod === 'today' ? 'active' : ''}" data-period="today">Today</button>
              <button type="button" class="counter-time-pill ${this.selectedPeriod === 'yesterday' ? 'active' : ''}" data-period="yesterday">Yesterday</button>
              <button type="button" class="counter-time-pill ${this.selectedPeriod === 'week' ? 'active' : ''}" data-period="week">Last 7 Days</button>
              <button type="button" class="counter-time-pill ${this.selectedPeriod === 'month' ? 'active' : ''}" data-period="month">This Month</button>
              <button type="button" class="counter-time-pill ${this.selectedPeriod === 'all' ? 'active' : ''}" data-period="all">All Time</button>
            </div>

            <input type="date" id="counter-date-picker" class="form-input" value="${this.activeDateStr}" style="height: 34px; font-size: 12px; font-weight: 700; padding: 2px 10px; border-radius: 10px; width: 140px;">
          </div>

          <!-- Utility Operations Toolbar -->
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <button class="btn btn-secondary" id="btn-toggle-tally" style="height: 34px; padding: 0 12px; font-size: 12px; font-weight: 700; border-radius: 10px; display: inline-flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-calculator" style="color: #059669;"></i> Cash Drawer Tally
            </button>
            <button class="btn btn-secondary" id="btn-counter-expense" style="height: 34px; padding: 0 12px; font-size: 12px; font-weight: 700; border-radius: 10px; display: inline-flex; align-items: center; gap: 6px;" title="Log Petty Cash or Counter Expense">
              <i class="fa-solid fa-hand-holding-dollar" style="color: #dc2626;"></i> + Cash Out
            </button>
            <button class="btn btn-secondary" id="btn-export-csv" style="height: 34px; padding: 0 12px; font-size: 12px; font-weight: 700; border-radius: 10px; display: inline-flex; align-items: center; gap: 6px;" title="Download Bills CSV Excel">
              <i class="fa-solid fa-file-csv" style="color: #2563eb;"></i> Export CSV
            </button>
            <button class="btn btn-secondary" id="btn-print-daysummary" style="height: 34px; padding: 0 12px; font-size: 12px; font-weight: 700; border-radius: 10px; display: inline-flex; align-items: center; gap: 6px;" title="Print 80mm Day Summary Slip">
              <i class="fa-solid fa-print" style="color: #4b5563;"></i> Day Summary
            </button>
            <button class="btn btn-primary" id="btn-counter-refresh" style="height: 34px; padding: 0 14px; font-size: 12px; font-weight: 700; border-radius: 10px; display: inline-flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-arrows-rotate"></i> Refresh
            </button>
          </div>
        </div>

        <!-- Cash Drawer Tally & Denominations Counter Card (Collapsible) -->
        <div id="counter-tally-container" class="counter-tally-box" style="display: ${this.showTallyPanel ? 'block' : 'none'};">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 14px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 10px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 32px; height: 32px; border-radius: 10px; background: #ecfdf5; color: #059669; display: flex; align-items: center; justify-content: center; font-size: 15px;">
                <i class="fa-solid fa-vault"></i>
              </div>
              <div>
                <h4 style="margin: 0; font-size: 14px; font-weight: 800; color: var(--text-dark);">Cash Drawer Reconciliation & Notes Counter</h4>
                <p style="margin: 2px 0 0 0; font-size: 11.5px; color: var(--text-muted);">Tally physical drawer cash with system register sales and expenses.</p>
              </div>
            </div>
            <div style="display: flex; gap: 8px;">
              <button type="button" class="btn btn-secondary" id="btn-reset-denoms" style="height: 30px; font-size: 11px; padding: 0 10px; border-radius: 8px;">
                <i class="fa-solid fa-arrow-rotate-left"></i> Reset Count
              </button>
              <button type="button" class="btn btn-primary" id="btn-print-tally-slip" style="height: 30px; font-size: 11px; padding: 0 12px; border-radius: 8px;">
                <i class="fa-solid fa-print"></i> Print Tally Slip
              </button>
            </div>
          </div>

          <!-- Drawer Calculation Math Summary Row -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 16px;">
            <!-- Opening Float -->
            <div style="background: #ffffff; border: 1px solid var(--border-color); border-radius: 12px; padding: 10px 14px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Opening Cash Float</span>
                <button type="button" id="btn-edit-float" title="Change Opening Cash Float" style="background: none; border: none; color: #2563eb; cursor: pointer; font-size: 11px; font-weight: 700;">
                  <i class="fa-solid fa-pen"></i> Edit
                </button>
              </div>
              <div id="tally-opening-float" style="font-size: 20px; font-weight: 900; color: var(--text-dark); margin-top: 4px;">₹1,000</div>
              <span style="font-size: 10.5px; color: var(--text-muted);">Morning shift base cash</span>
            </div>

            <!-- (+) Cash Sales -->
            <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 10px 14px;">
              <span style="font-size: 11px; font-weight: 700; color: #047857; text-transform: uppercase;">(+) Cash Sales</span>
              <div id="tally-cash-sales" style="font-size: 20px; font-weight: 900; color: #059669; margin-top: 4px;">₹0</div>
              <span id="tally-cash-bills-count" style="font-size: 10.5px; color: #065f46;">0 bills collected</span>
            </div>

            <!-- (-) Cash Paid Out / Expenses -->
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 10px 14px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 11px; font-weight: 700; color: #b91c1c; text-transform: uppercase;">(-) Cash Expenses</span>
                <span id="tally-expense-count" style="font-size: 10.5px; color: #991b1b; font-weight: 700;">0 entries</span>
              </div>
              <div id="tally-cash-out" style="font-size: 20px; font-weight: 900; color: #dc2626; margin-top: 4px;">₹0</div>
              <span style="font-size: 10.5px; color: #991b1b;">Petty cash paid from till</span>
            </div>

            <!-- (=) Expected Drawer Cash -->
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 10px 14px;">
              <span style="font-size: 11px; font-weight: 700; color: #1d4ed8; text-transform: uppercase;">(=) Expected in Drawer</span>
              <div id="tally-expected-cash" style="font-size: 20px; font-weight: 900; color: #2563eb; margin-top: 4px;">₹1,000</div>
              <span style="font-size: 10.5px; color: #1e40af;">Float + Cash In - Cash Out</span>
            </div>

            <!-- Physical Counted & Difference -->
            <div id="tally-diff-card" style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: 12px; padding: 10px 14px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 11px; font-weight: 700; color: var(--text-dark); text-transform: uppercase;">Physical Counted</span>
                <span id="tally-variance-badge" style="font-size: 10.5px; font-weight: 800; padding: 1px 6px; border-radius: 6px; background: #e2e8f0; color: var(--text-dark);">₹0 Diff</span>
              </div>
              <div id="tally-actual-cash" style="font-size: 20px; font-weight: 900; color: var(--text-dark); margin-top: 4px;">₹0</div>
              <span id="tally-variance-desc" style="font-size: 10.5px; color: var(--text-muted);">Enter denominations below</span>
            </div>
          </div>

          <!-- Currency Denomination Note Counters Grid -->
          <div style="margin-top: 10px;">
            <div style="font-size: 12px; font-weight: 800; color: var(--text-dark); margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-money-bill-1-wave" style="color: #059669;"></i> Physical Cash Note Breakdown:
            </div>
            <div class="counter-denom-grid">
              <div class="counter-denom-item">
                <span class="counter-denom-label">₹500 x</span>
                <input type="number" min="0" class="counter-denom-input" data-denom="500" value="${this.denominations[500] || ''}" placeholder="0">
                <span id="denom-sub-500" style="font-size: 11px; font-weight: 700; color: var(--text-muted); min-width: 45px; text-align: right;">₹0</span>
              </div>
              <div class="counter-denom-item">
                <span class="counter-denom-label">₹200 x</span>
                <input type="number" min="0" class="counter-denom-input" data-denom="200" value="${this.denominations[200] || ''}" placeholder="0">
                <span id="denom-sub-200" style="font-size: 11px; font-weight: 700; color: var(--text-muted); min-width: 45px; text-align: right;">₹0</span>
              </div>
              <div class="counter-denom-item">
                <span class="counter-denom-label">₹100 x</span>
                <input type="number" min="0" class="counter-denom-input" data-denom="100" value="${this.denominations[100] || ''}" placeholder="0">
                <span id="denom-sub-100" style="font-size: 11px; font-weight: 700; color: var(--text-muted); min-width: 45px; text-align: right;">₹0</span>
              </div>
              <div class="counter-denom-item">
                <span class="counter-denom-label">₹50 x</span>
                <input type="number" min="0" class="counter-denom-input" data-denom="50" value="${this.denominations[50] || ''}" placeholder="0">
                <span id="denom-sub-50" style="font-size: 11px; font-weight: 700; color: var(--text-muted); min-width: 45px; text-align: right;">₹0</span>
              </div>
              <div class="counter-denom-item">
                <span class="counter-denom-label">₹20 x</span>
                <input type="number" min="0" class="counter-denom-input" data-denom="20" value="${this.denominations[20] || ''}" placeholder="0">
                <span id="denom-sub-20" style="font-size: 11px; font-weight: 700; color: var(--text-muted); min-width: 45px; text-align: right;">₹0</span>
              </div>
              <div class="counter-denom-item">
                <span class="counter-denom-label">₹10 x</span>
                <input type="number" min="0" class="counter-denom-input" data-denom="10" value="${this.denominations[10] || ''}" placeholder="0">
                <span id="denom-sub-10" style="font-size: 11px; font-weight: 700; color: var(--text-muted); min-width: 45px; text-align: right;">₹0</span>
              </div>
              <div class="counter-denom-item">
                <span class="counter-denom-label">Coins ₹</span>
                <input type="number" min="0" class="counter-denom-input" data-denom="coins" value="${this.denominations.coins || ''}" placeholder="0" style="width: 65px;">
                <span id="denom-sub-coins" style="font-size: 11px; font-weight: 700; color: var(--text-muted); min-width: 45px; text-align: right;">₹0</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Counter 5 KPI Cards Grid -->
        <div class="dashboard-grid-stats counter-kpi-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; margin-bottom: 0;">
          
          <!-- Net Sales -->
          <div class="glass-card stat-card" style="border-left: 4px solid #2563eb; padding: 14px 16px;">
            <div class="stat-info">
              <span class="stat-label">Net Counter Sales</span>
              <span class="stat-value" id="counter-total-sales" style="color: #2563eb; font-size: 24px; font-weight: 900;">₹0</span>
              <span class="stat-change" id="counter-orders-count" style="color: var(--text-muted); font-weight: 700; font-size: 11.5px;">0 orders</span>
            </div>
            <div class="stat-icon-wrapper" style="background: #eff6ff; border-color: #bfdbfe; color: #2563eb;">
              <i class="fa-solid fa-indian-rupee-sign"></i>
            </div>
          </div>

          <!-- Cash in Till -->
          <div class="glass-card stat-card" style="border-left: 4px solid #10b981; padding: 14px 16px;">
            <div class="stat-info">
              <span class="stat-label">Cash In Drawer</span>
              <span class="stat-value" id="counter-cash-sales" style="color: #10b981; font-size: 24px; font-weight: 900;">₹0</span>
              <span class="stat-change" id="counter-cash-count" style="color: var(--text-muted); font-weight: 600; font-size: 11.5px;">0 Cash Bills</span>
            </div>
            <div class="stat-icon-wrapper" style="background: #ecfdf5; border-color: #a7f3d0; color: #059669;">
              <i class="fa-solid fa-money-bill-wave"></i>
            </div>
          </div>

          <!-- UPI Online Received -->
          <div class="glass-card stat-card" style="border-left: 4px solid #8b5cf6; padding: 14px 16px;">
            <div class="stat-info">
              <span class="stat-label">UPI / QR Collection</span>
              <span class="stat-value" id="counter-upi-sales" style="color: #8b5cf6; font-size: 24px; font-weight: 900;">₹0</span>
              <span class="stat-change" id="counter-upi-count" style="color: var(--text-muted); font-weight: 600; font-size: 11.5px;">0 UPI Bills</span>
            </div>
            <div class="stat-icon-wrapper" style="background: #f5f3ff; border-color: #ddd6fe; color: #7c3aed;">
              <i class="fa-solid fa-qrcode"></i>
            </div>
          </div>

          <!-- Discounts & Deductions -->
          <div class="glass-card stat-card" style="border-left: 4px solid #f59e0b; padding: 14px 16px;">
            <div class="stat-info">
              <span class="stat-label">Total Discounts</span>
              <span class="stat-value" id="counter-discount-sales" style="color: #f59e0b; font-size: 24px; font-weight: 900;">₹0</span>
              <span class="stat-change" id="counter-discount-count" style="color: var(--text-muted); font-weight: 700; font-size: 11.5px;">BOGO & Offers</span>
            </div>
            <div class="stat-icon-wrapper" style="background: #fffbeb; border-color: #fde68a; color: #d97706;">
              <i class="fa-solid fa-tag"></i>
            </div>
          </div>

          <!-- Avg Ticket & Peak Rush -->
          <div class="glass-card stat-card" style="border-left: 4px solid #06b6d4; padding: 14px 16px;">
            <div class="stat-info">
              <span class="stat-label">Avg Ticket & Rush</span>
              <span class="stat-value" id="counter-avg-ticket" style="color: #0891b2; font-size: 22px; font-weight: 900;">₹0</span>
              <span class="stat-change" id="counter-token-range" style="color: var(--text-muted); font-weight: 700; font-size: 11.5px;">Tk #0 - #0</span>
            </div>
            <div class="stat-icon-wrapper" style="background: #ecfeff; border-color: #a5f3fc; color: #0891b2;">
              <i class="fa-solid fa-chart-line"></i>
            </div>
          </div>
        </div>

        <!-- Hourly Rush Meter (Collapsible Strip) -->
        <div class="glass-card" style="padding: 12px 18px; display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 12.5px; font-weight: 800; color: var(--text-dark); display: flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-chart-column" style="color: #2563eb;"></i> Hourly Store Rush Timeline
            </span>
            <span id="counter-peak-hour-badge" style="font-size: 11px; font-weight: 700; background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; padding: 2px 8px; border-radius: 8px;">
              Peak: --
            </span>
          </div>
          <div class="counter-rush-strip" id="counter-rush-timeline">
            <!-- Hourly bars dynamically populated -->
          </div>
        </div>

        <!-- Orders History & Bills Search Section -->
        <div class="glass-card" style="padding: 18px 20px; display: flex; flex-direction: column; gap: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
            <div>
              <h3 style="font-size: 16px; font-weight: 800; color: var(--text-dark); margin: 0 0 2px 0;">
                <i class="fa-solid fa-clock-rotate-left" style="color: #2563eb; margin-right: 6px;"></i> Bills & Order History
              </h3>
              <p style="font-size: 12px; color: var(--text-muted); margin: 0;" id="counter-history-subtitle">
                Search, inspect items, send WhatsApp receipt, or reprint bill.
              </p>
            </div>

            <!-- Comprehensive Search and Filter controls -->
            <div class="counter-search-row" style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
              
              <!-- Payment Filter -->
              <select id="counter-payment-filter" class="form-input" style="height: 36px; font-size: 11.5px; font-weight: 700; border-radius: 10px; width: 110px;">
                <option value="all">All Modes</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
              </select>

              <!-- Status Filter -->
              <select id="counter-status-filter" class="form-input" style="height: 36px; font-size: 11.5px; font-weight: 700; border-radius: 10px; width: 120px;">
                <option value="all">All Statuses</option>
                <option value="Completed">Completed</option>
                <option value="Preparing">Preparing</option>
                <option value="Ready">Ready</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              <!-- Order Type Filter -->
              <select id="counter-type-filter" class="form-input" style="height: 36px; font-size: 11.5px; font-weight: 700; border-radius: 10px; width: 110px;">
                <option value="all">All Types</option>
                <option value="Dine-in">Dine-in</option>
                <option value="Takeaway">Takeaway</option>
              </select>

              <!-- Sort Order -->
              <select id="counter-sort-by" class="form-input" style="height: 36px; font-size: 11.5px; font-weight: 700; border-radius: 10px; width: 125px;">
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest ₹</option>
                <option value="lowest">Lowest ₹</option>
              </select>

              <!-- Search Box -->
              <div class="counter-search-box" style="position: relative; width: 220px;">
                <input type="text" id="counter-search-input" class="form-input" placeholder="Search Cust / Phone / Bill#" style="padding: 6px 12px 6px 30px; font-size: 12px; height: 36px; border-radius: 10px; width: 100%;">
                <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 10px; top: 11px; color: var(--text-muted); font-size: 11px; pointer-events: none;"></i>
              </div>
            </div>
          </div>

          <!-- Matching records summary banner -->
          <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 6px 14px; border-radius: 10px; border: 1px solid var(--border-color); font-size: 12px; color: var(--text-muted);">
            <span id="counter-records-count" style="font-weight: 700; color: var(--text-dark);">Showing 0 bills</span>
            <span id="counter-records-amount" style="font-weight: 800; color: #2563eb;">Total: ₹0</span>
          </div>

          <!-- Orders Table Container -->
          <div class="table-container">
            <table class="premium-table">
              <thead>
                <tr>
                  <th>Bill # / Token</th>
                  <th>Time & Date</th>
                  <th>Customer & Type</th>
                  <th>Items Summary</th>
                  <th>Payment</th>
                  <th>Discount</th>
                  <th style="text-align: right;">Total Amount</th>
                  <th>Status</th>
                  <th style="text-align: center;">Actions</th>
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
    const btnRefresh = document.getElementById("btn-counter-refresh");
    const searchInput = document.getElementById("counter-search-input");
    const filterPayment = document.getElementById("counter-payment-filter");
    const filterStatus = document.getElementById("counter-status-filter");
    const filterType = document.getElementById("counter-type-filter");
    const sortBy = document.getElementById("counter-sort-by");
    const btnToggleTally = document.getElementById("btn-toggle-tally");
    const btnExpense = document.getElementById("btn-counter-expense");
    const btnExportCsv = document.getElementById("btn-export-csv");
    const btnPrintSummary = document.getElementById("btn-print-daysummary");
    const btnEditFloat = document.getElementById("btn-edit-float");
    const btnResetDenoms = document.getElementById("btn-reset-denoms");
    const btnPrintTallySlip = document.getElementById("btn-print-tally-slip");

    // Quick Time Pills
    document.querySelectorAll(".counter-time-pill").forEach(pill => {
      pill.onclick = () => {
        document.querySelectorAll(".counter-time-pill").forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        this.selectedPeriod = pill.getAttribute("data-period");

        const today = new Date();
        if (this.selectedPeriod === "today") {
          this.activeDateStr = this.getIstDateString(today);
          if (datePicker) datePicker.value = this.activeDateStr;
        } else if (this.selectedPeriod === "yesterday") {
          const yest = new Date();
          yest.setDate(yest.getDate() - 1);
          this.activeDateStr = this.getIstDateString(yest);
          if (datePicker) datePicker.value = this.activeDateStr;
        }

        this.render();
      };
    });

    if (datePicker) {
      datePicker.onchange = (e) => {
        this.activeDateStr = e.target.value;
        this.selectedPeriod = "custom";
        document.querySelectorAll(".counter-time-pill").forEach(p => p.classList.remove("active"));
        this.render();
      };
    }

    if (btnRefresh) {
      btnRefresh.onclick = () => {
        this.render();
        window.showToast("Daily Counter refreshed.", "info");
      };
    }

    if (btnToggleTally) {
      btnToggleTally.onclick = () => {
        this.showTallyPanel = !this.showTallyPanel;
        const box = document.getElementById("counter-tally-container");
        if (box) {
          box.style.display = this.showTallyPanel ? "block" : "none";
          if (this.showTallyPanel) {
            box.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }
      };
    }

    if (btnExpense) {
      btnExpense.onclick = () => this.openQuickCashOutModal();
    }

    if (btnExportCsv) {
      btnExportCsv.onclick = () => this.exportOrdersToCsv();
    }

    if (btnPrintSummary) {
      btnPrintSummary.onclick = () => this.showDaySummaryPrintModal();
    }

    if (btnEditFloat) {
      btnEditFloat.onclick = () => this.promptEditOpeningFloat();
    }

    if (btnResetDenoms) {
      btnResetDenoms.onclick = () => {
        this.denominations = { 500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, coins: 0 };
        document.querySelectorAll(".counter-denom-input").forEach(input => input.value = "");
        this.saveAndRecalcDenominations();
      };
    }

    if (btnPrintTallySlip) {
      btnPrintTallySlip.onclick = () => this.printTallySlip();
    }

    // Denomination inputs
    document.querySelectorAll(".counter-denom-input").forEach(input => {
      input.oninput = (e) => {
        const denom = e.target.getAttribute("data-denom");
        const val = Math.max(0, parseInt(e.target.value, 10) || 0);
        this.denominations[denom] = val;
        this.saveAndRecalcDenominations();
      };
    });

    if (searchInput) {
      searchInput.oninput = (e) => {
        this.searchQuery = e.target.value.trim().toLowerCase();
        this.renderTableOnly();
      };
    }

    if (filterPayment) {
      filterPayment.onchange = (e) => {
        this.paymentFilter = e.target.value;
        this.renderTableOnly();
      };
    }

    if (filterStatus) {
      filterStatus.onchange = (e) => {
        this.statusFilter = e.target.value;
        this.renderTableOnly();
      };
    }

    if (filterType) {
      filterType.onchange = (e) => {
        this.typeFilter = e.target.value;
        this.renderTableOnly();
      };
    }

    if (sortBy) {
      sortBy.onchange = (e) => {
        this.sortBy = e.target.value;
        this.renderTableOnly();
      };
    }
  },

  getOpeningFloat() {
    const key = `crust_opening_float_${this.activeDateStr}`;
    const saved = localStorage.getItem(key);
    if (saved !== null && !isNaN(Number(saved))) {
      return Number(saved);
    }
    const settings = window.db.get("settings") || {};
    return Number(settings.defaultOpeningFloat) || 1000;
  },

  promptEditOpeningFloat() {
    const current = this.getOpeningFloat();
    const res = prompt("Enter Morning Opening Cash Float for " + this.activeDateStr + " (₹):", current);
    if (res !== null) {
      const num = Math.max(0, Number(res) || 0);
      localStorage.setItem(`crust_opening_float_${this.activeDateStr}`, num);
      window.showToast(`Opening cash float set to ₹${num.toLocaleString("en-IN")}`, "success");
      this.recalculateDrawerMath();
    }
  },

  saveAndRecalcDenominations() {
    try {
      localStorage.setItem(`crust_denom_${this.activeDateStr}`, JSON.stringify(this.denominations));
    } catch (e) {}
    this.recalculateDrawerMath();
  },

  getFilteredOrdersByPeriod(allOrders) {
    const now = new Date();
    const todayStr = this.getIstDateString(now);

    if (this.selectedPeriod === "all") {
      return allOrders;
    }

    if (this.selectedPeriod === "today") {
      return allOrders.filter(o => o.createdAt && this.getIstDateString(new Date(o.createdAt)) === todayStr);
    }

    if (this.selectedPeriod === "yesterday") {
      const yest = new Date();
      yest.setDate(yest.getDate() - 1);
      const yestStr = this.getIstDateString(yest);
      return allOrders.filter(o => o.createdAt && this.getIstDateString(new Date(o.createdAt)) === yestStr);
    }

    if (this.selectedPeriod === "week") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      return allOrders.filter(o => o.createdAt && new Date(o.createdAt) >= sevenDaysAgo);
    }

    if (this.selectedPeriod === "month") {
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      return allOrders.filter(o => {
        if (!o.createdAt) return false;
        const d = new Date(o.createdAt);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });
    }

    // Default to activeDateStr (Custom date)
    const targetDate = this.activeDateStr;
    return allOrders.filter(o => o.createdAt && this.getIstDateString(new Date(o.createdAt)) === targetDate);
  },

  render() {
    const allOrders = window.db.get("orders") || [];
    const settings = window.db.get("settings") || {};
    const currency = settings.currencySymbol || "₹";

    const periodOrders = this.getFilteredOrdersByPeriod(allOrders);
    const validOrders = periodOrders.filter(o => o.status !== "Cancelled");
    const cancelledOrders = periodOrders.filter(o => o.status === "Cancelled");

    // Metrics calculations
    const netSales = validOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const cashOrders = validOrders.filter(o => (o.paymentMethod || "Cash").toLowerCase() === "cash");
    const cashSales = cashOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    const upiOrders = validOrders.filter(o => (o.paymentMethod || "").toLowerCase() === "upi");
    const upiSales = upiOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    const totalDiscounts = validOrders.reduce((sum, o) => {
      const bogo = Number(o.bogoDiscount) || 0;
      const flat = Number(o.discount) || 0;
      return sum + bogo + flat;
    }, 0);

    const avgTicket = validOrders.length > 0 ? Math.round(netSales / validOrders.length) : 0;

    let minToken = 999999;
    let maxToken = 0;
    validOrders.forEach(o => {
      const tok = Number(o.tokenNumber) || 0;
      if (tok > 0) {
        if (tok < minToken) minToken = tok;
        if (tok > maxToken) maxToken = tok;
      }
    });

    const tokenRangeText = maxToken > 0 ? `Tk #${minToken} - #${maxToken}` : "Tk #0 - #0";

    // Update KPI Elements
    const totalEl = document.getElementById("counter-total-sales");
    const ordersEl = document.getElementById("counter-orders-count");
    const cashEl = document.getElementById("counter-cash-sales");
    const cashCountEl = document.getElementById("counter-cash-count");
    const upiEl = document.getElementById("counter-upi-sales");
    const upiCountEl = document.getElementById("counter-upi-count");
    const discountEl = document.getElementById("counter-discount-sales");
    const discountCountEl = document.getElementById("counter-discount-count");
    const avgEl = document.getElementById("counter-avg-ticket");
    const tokenEl = document.getElementById("counter-token-range");

    if (totalEl) totalEl.textContent = `${currency}${Math.round(netSales).toLocaleString("en-IN")}`;
    if (ordersEl) ordersEl.textContent = `${validOrders.length} valid bills ${cancelledOrders.length > 0 ? `(${cancelledOrders.length} void)` : ''}`;
    if (cashEl) cashEl.textContent = `${currency}${Math.round(cashSales).toLocaleString("en-IN")}`;
    if (cashCountEl) cashCountEl.textContent = `${cashOrders.length} Cash Bills (${Math.round(netSales > 0 ? (cashSales / netSales) * 100 : 0)}%)`;
    if (upiEl) upiEl.textContent = `${currency}${Math.round(upiSales).toLocaleString("en-IN")}`;
    if (upiCountEl) upiCountEl.textContent = `${upiOrders.length} UPI Bills (${Math.round(netSales > 0 ? (upiSales / netSales) * 100 : 0)}%)`;
    if (discountEl) discountEl.textContent = `${currency}${Math.round(totalDiscounts).toLocaleString("en-IN")}`;
    if (discountCountEl) discountCountEl.textContent = `${validOrders.filter(o => o.bogoDiscount || o.discount).length} Discounted Bills`;
    if (avgEl) avgEl.textContent = `${currency}${avgTicket} / bill`;
    if (tokenEl) tokenEl.textContent = tokenRangeText;

    // Recalculate Cash Drawer math & Denominations
    this.recalculateDrawerMath();

    // Render Rush meter
    this.renderRushMeter(validOrders);

    // Render Table
    this.renderTableOnly();
  },

  recalculateDrawerMath() {
    const allOrders = window.db.get("orders") || [];
    const allExpenses = window.db.get("expenses") || [];
    const settings = window.db.get("settings") || {};
    const currency = settings.currencySymbol || "₹";

    const periodOrders = this.getFilteredOrdersByPeriod(allOrders);
    const validOrders = periodOrders.filter(o => o.status !== "Cancelled");

    // Cash Sales
    const cashOrders = validOrders.filter(o => (o.paymentMethod || "Cash").toLowerCase() === "cash");
    const cashSales = cashOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    // Filter cash expenses for active date
    const targetDate = this.activeDateStr;
    const periodExpenses = allExpenses.filter(e => {
      const eDate = e.date || (e.createdAt ? this.getIstDateString(new Date(e.createdAt)) : "");
      const isCash = (e.paymentMode || e.paymentMethod || "Cash").toLowerCase() === "cash";
      return isCash && (this.selectedPeriod === "all" || eDate === targetDate);
    });

    const cashOut = periodExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const openingFloat = this.getOpeningFloat();
    const expectedCash = openingFloat + cashSales - cashOut;

    // Physical counted calculation
    const d = this.denominations;
    const sub500 = (d[500] || 0) * 500;
    const sub200 = (d[200] || 0) * 200;
    const sub100 = (d[100] || 0) * 100;
    const sub50 = (d[50] || 0) * 50;
    const sub20 = (d[20] || 0) * 20;
    const sub10 = (d[10] || 0) * 10;
    const subCoins = d.coins || 0;

    const actualCash = sub500 + sub200 + sub100 + sub50 + sub20 + sub10 + subCoins;
    const variance = actualCash - expectedCash;

    // Update DOM
    const floatEl = document.getElementById("tally-opening-float");
    const cashSalesEl = document.getElementById("tally-cash-sales");
    const cashBillsCountEl = document.getElementById("tally-cash-bills-count");
    const cashOutEl = document.getElementById("tally-cash-out");
    const expenseCountEl = document.getElementById("tally-expense-count");
    const expectedEl = document.getElementById("tally-expected-cash");
    const actualEl = document.getElementById("tally-actual-cash");
    const diffBadgeEl = document.getElementById("tally-variance-badge");
    const diffDescEl = document.getElementById("tally-variance-desc");
    const diffCardEl = document.getElementById("tally-diff-card");

    if (floatEl) floatEl.textContent = `${currency}${openingFloat.toLocaleString("en-IN")}`;
    if (cashSalesEl) cashSalesEl.textContent = `${currency}${Math.round(cashSales).toLocaleString("en-IN")}`;
    if (cashBillsCountEl) cashBillsCountEl.textContent = `${cashOrders.length} cash orders`;
    if (cashOutEl) cashOutEl.textContent = `${currency}${Math.round(cashOut).toLocaleString("en-IN")}`;
    if (expenseCountEl) expenseCountEl.textContent = `${periodExpenses.length} cash payouts`;
    if (expectedEl) expectedEl.textContent = `${currency}${Math.round(expectedCash).toLocaleString("en-IN")}`;
    if (actualEl) actualEl.textContent = `${currency}${Math.round(actualCash).toLocaleString("en-IN")}`;

    // Update denomination sub-labels
    const s500 = document.getElementById("denom-sub-500");
    const s200 = document.getElementById("denom-sub-200");
    const s100 = document.getElementById("denom-sub-100");
    const s50 = document.getElementById("denom-sub-50");
    const s20 = document.getElementById("denom-sub-20");
    const s10 = document.getElementById("denom-sub-10");
    const sCoins = document.getElementById("denom-sub-coins");

    if (s500) s500.textContent = `₹${sub500.toLocaleString("en-IN")}`;
    if (s200) s200.textContent = `₹${sub200.toLocaleString("en-IN")}`;
    if (s100) s100.textContent = `₹${sub100.toLocaleString("en-IN")}`;
    if (s50) s50.textContent = `₹${sub50.toLocaleString("en-IN")}`;
    if (s20) s20.textContent = `₹${sub20.toLocaleString("en-IN")}`;
    if (s10) s10.textContent = `₹${sub10.toLocaleString("en-IN")}`;
    if (sCoins) sCoins.textContent = `₹${subCoins.toLocaleString("en-IN")}`;

    // Variance badge styling
    if (diffBadgeEl && diffDescEl && diffCardEl) {
      if (actualCash === 0) {
        diffBadgeEl.textContent = "Uncounted";
        diffBadgeEl.style.background = "#f1f5f9";
        diffBadgeEl.style.color = "#64748b";
        diffDescEl.textContent = "Fill note counts below";
        diffCardEl.style.borderColor = "var(--border-color)";
      } else if (variance === 0) {
        diffBadgeEl.textContent = "PERFECT MATCH";
        diffBadgeEl.style.background = "#ecfdf5";
        diffBadgeEl.style.color = "#059669";
        diffDescEl.textContent = "Cash drawer perfectly balanced!";
        diffCardEl.style.borderColor = "#10b981";
      } else if (variance > 0) {
        diffBadgeEl.textContent = `+${currency}${Math.abs(variance)} SURPLUS`;
        diffBadgeEl.style.background = "#eff6ff";
        diffBadgeEl.style.color = "#2563eb";
        diffDescEl.textContent = "More physical cash than expected";
        diffCardEl.style.borderColor = "#3b82f6";
      } else {
        diffBadgeEl.textContent = `-${currency}${Math.abs(variance)} SHORTAGE`;
        diffBadgeEl.style.background = "#fef2f2";
        diffBadgeEl.style.color = "#dc2626";
        diffDescEl.textContent = "Drawer cash is short!";
        diffCardEl.style.borderColor = "#ef4444";
      }
    }
  },

  renderRushMeter(validOrders) {
    const timelineEl = document.getElementById("counter-rush-timeline");
    const peakBadgeEl = document.getElementById("counter-peak-hour-badge");
    if (!timelineEl) return;

    // Hours from 11 AM to 11 PM (11 to 23)
    const hours = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
    const hourCounts = {};
    hours.forEach(h => hourCounts[h] = 0);

    validOrders.forEach(o => {
      if (!o.createdAt) return;
      const h = new Date(o.createdAt).getHours();
      if (hourCounts[h] !== undefined) {
        hourCounts[h]++;
      }
    });

    const maxCount = Math.max(...Object.values(hourCounts), 1);
    let peakHour = null;
    let peakCount = 0;
    hours.forEach(h => {
      if (hourCounts[h] > peakCount) {
        peakCount = hourCounts[h];
        peakHour = h;
      }
    });

    if (peakBadgeEl) {
      if (peakCount > 0 && peakHour !== null) {
        const ampm = peakHour >= 12 ? (peakHour === 12 ? "12 PM" : `${peakHour - 12} PM`) : `${peakHour} AM`;
        peakBadgeEl.textContent = `Peak Rush: ${ampm} (${peakCount} bills)`;
      } else {
        peakBadgeEl.textContent = "Peak: No Rush Yet";
      }
    }

    timelineEl.innerHTML = hours.map(h => {
      const count = hourCounts[h] || 0;
      const heightPercent = Math.max(8, Math.round((count / maxCount) * 100));
      const isPeak = h === peakHour && count > 0;
      const label = h >= 12 ? (h === 12 ? "12p" : `${h - 12}p`) : `${h}a`;

      return `
        <div class="counter-rush-col" title="${label}: ${count} orders">
          <div class="counter-rush-bar ${isPeak ? 'peak' : ''}" style="height: ${heightPercent}%;"></div>
          <span class="counter-rush-hour" style="${isPeak ? 'color: #2563eb; font-weight: 900;' : ''}">${label}</span>
        </div>
      `;
    }).join("");
  },

  renderTableOnly() {
    const allOrders = window.db.get("orders") || [];
    const settings = window.db.get("settings") || {};
    const currency = settings.currencySymbol || "₹";

    // 1. Period filter
    let orders = this.getFilteredOrdersByPeriod(allOrders);

    // 2. Payment filter
    if (this.paymentFilter !== "all") {
      orders = orders.filter(o => (o.paymentMethod || "Cash").toLowerCase() === this.paymentFilter.toLowerCase());
    }

    // 3. Status filter
    if (this.statusFilter !== "all") {
      orders = orders.filter(o => (o.status || "").toLowerCase() === this.statusFilter.toLowerCase());
    }

    // 4. Order type filter
    if (this.typeFilter !== "all") {
      orders = orders.filter(o => (o.type || "Dine-in").toLowerCase() === this.typeFilter.toLowerCase());
    }

    // 5. Search Query
    if (this.searchQuery) {
      const q = this.searchQuery;
      orders = orders.filter(o => {
        const id = (o.id || "").toLowerCase();
        const num = String(o.orderNumber || "");
        const tok = String(o.tokenNumber || "");
        const name = (o.customerName || "").toLowerCase();
        const phone = String(o.customerPhone || "");
        const items = (o.items || []).map(i => i.name.toLowerCase()).join(" ");
        return id.includes(q) || num.includes(q) || tok.includes(q) || name.includes(q) || phone.includes(q) || items.includes(q);
      });
    }

    // 6. Sorting
    orders = [...orders].sort((a, b) => {
      if (this.sortBy === "newest") {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      } else if (this.sortBy === "oldest") {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      } else if (this.sortBy === "highest") {
        return (Number(b.total) || 0) - (Number(a.total) || 0);
      } else if (this.sortBy === "lowest") {
        return (Number(a.total) || 0) - (Number(b.total) || 0);
      }
      return 0;
    });

    // Update banner summary
    const countEl = document.getElementById("counter-records-count");
    const amountEl = document.getElementById("counter-records-amount");
    const totalMatching = orders.filter(o => o.status !== "Cancelled").reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    if (countEl) countEl.textContent = `Showing ${orders.length} orders (${orders.filter(o => o.status !== "Cancelled").length} active)`;
    if (amountEl) amountEl.textContent = `Total: ${currency}${Math.round(totalMatching).toLocaleString("en-IN")}`;

    const tbody = document.getElementById("counter-orders-table-body");
    if (!tbody) return;

    if (orders.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center; color: var(--text-muted); padding: 40px; font-weight: 600;">
            <i class="fa-solid fa-receipt" style="font-size: 28px; opacity: 0.3; display: block; margin-bottom: 8px;"></i>
            No orders found for the selected filters.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = orders.map(o => {
      const orderDate = new Date(o.createdAt);
      const timeStr = orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = this.selectedPeriod !== "today" && this.selectedPeriod !== "yesterday"
        ? `${orderDate.toLocaleDateString("en-IN", { day: '2-digit', month: 'short' })} `
        : "";

      const itemCount = (o.items || []).reduce((sum, i) => sum + (i.quantity || 1), 0);
      const itemsBrief = (o.items || []).map(i => `${i.name} (x${i.quantity})`).join(", ");

      let statusBadge = "badge-pending";
      if (o.status === "Preparing") statusBadge = "badge-preparing";
      if (o.status === "Ready") statusBadge = "badge-ready";
      if (o.status === "Completed") statusBadge = "badge-completed";
      if (o.status === "Cancelled") statusBadge = "badge-cancelled";

      const isUpi = (o.paymentMethod || "").toLowerCase() === "upi";
      const isCard = (o.paymentMethod || "").toLowerCase() === "card";
      let payBadge = `<span style="background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; padding: 2px 7px; border-radius: 8px; font-size: 11px; font-weight: 800;"><i class="fa-solid fa-money-bill"></i> Cash</span>`;
      if (isUpi) {
        payBadge = `<span style="background: #f5f3ff; color: #7c3aed; border: 1px solid #ddd6fe; padding: 2px 7px; border-radius: 8px; font-size: 11px; font-weight: 800;"><i class="fa-solid fa-qrcode"></i> UPI</span>`;
      } else if (isCard) {
        payBadge = `<span style="background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; padding: 2px 7px; border-radius: 8px; font-size: 11px; font-weight: 800;"><i class="fa-solid fa-credit-card"></i> Card</span>`;
      }

      const discTotal = (Number(o.bogoDiscount) || 0) + (Number(o.discount) || 0);
      const discTag = discTotal > 0
        ? `<span style="color: #16a34a; font-weight: 800; font-size: 11px;">-${currency}${discTotal.toFixed(0)}</span>`
        : `<span style="color: var(--text-muted); font-size: 11px;">-</span>`;

      const typeBadge = (o.type || "Dine-in") === "Takeaway"
        ? `<span style="background: #fffbeb; color: #b45309; border: 1px solid #fde68a; padding: 1px 6px; border-radius: 6px; font-size: 10px; font-weight: 800;">Takeaway</span>`
        : `<span style="background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; padding: 1px 6px; border-radius: 6px; font-size: 10px; font-weight: 800;">Dine-in</span>`;

      const isCancelled = o.status === "Cancelled";

      return `
        <tr style="${isCancelled ? 'opacity: 0.6; background: #fff5f5;' : ''}">
          <td>
            <div style="font-weight: 800; color: var(--text-dark); font-size: 13.5px;">#${o.orderNumber || o.id}</div>
            <div style="font-size: 11px; font-weight: 800; color: #2563eb;">Token #${o.tokenNumber || 1}</div>
          </td>
          <td>
            <div style="font-size: 12px; font-weight: 700; color: var(--text-dark);">${timeStr}</div>
            <div style="font-size: 10.5px; color: var(--text-muted);">${dateStr}</div>
          </td>
          <td>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-weight: 700; color: var(--text-dark);">${o.customerName || "Walk-in"}</span>
              ${typeBadge}
            </div>
            <div style="font-size: 11px; color: var(--text-muted);">${o.customerPhone || "No phone"}</div>
          </td>
          <td style="max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 12px; color: var(--text-dark);" title="${itemsBrief}">
            <strong style="color: #2563eb;">${itemCount}x</strong> ${itemsBrief}
          </td>
          <td>${payBadge}</td>
          <td>${discTag}</td>
          <td style="text-align: right; font-weight: 900; color: ${isCancelled ? '#94a3b8' : '#ebb036'}; font-size: 14px; ${isCancelled ? 'text-decoration: line-through;' : ''}">
            ${currency}${Number(o.total || 0).toFixed(2)}
          </td>
          <td><span class="badge ${statusBadge}">${o.status}</span></td>
          <td style="text-align: center;">
            <div style="display: flex; align-items: center; justify-content: center; gap: 6px;">
              <button class="btn btn-secondary btn-reprint-counter" data-id="${o.id}" title="View & Print Bill Receipt" style="padding: 5px 9px; font-size: 11px; border-radius: 8px; font-weight: 700;">
                <i class="fa-solid fa-receipt" style="color: #2563eb;"></i> View
              </button>
              <button class="btn-wa-share" data-id="${o.id}" title="Share Bill on WhatsApp">
                <i class="fa-brands fa-whatsapp"></i> WA
              </button>
              ${!isCancelled ? `
                <button class="btn-void-order" data-id="${o.id}" title="Cancel & Void this Bill">
                  <i class="fa-solid fa-ban"></i> Void
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join("");

    // Bind action buttons
    tbody.querySelectorAll(".btn-reprint-counter").forEach(btn => {
      btn.onclick = () => {
        const orderId = btn.getAttribute("data-id");
        this.showReceiptModal(orderId);
      };
    });

    tbody.querySelectorAll(".btn-wa-share").forEach(btn => {
      btn.onclick = () => {
        const orderId = btn.getAttribute("data-id");
        this.shareOrderWhatsApp(orderId);
      };
    });

    tbody.querySelectorAll(".btn-void-order").forEach(btn => {
      btn.onclick = () => {
        const orderId = btn.getAttribute("data-id");
        this.promptVoidOrder(orderId);
      };
    });
  },

  shareOrderWhatsApp(orderId) {
    const orders = window.db.get("orders") || [];
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const settings = window.db.get("settings") || {};
    const currency = settings.currencySymbol || "₹";
    const shopName = settings.restaurantName || "Crust & Chilly";

    let phone = (order.customerPhone || "").replace(/\D/g, "");
    if (!phone) {
      phone = prompt("Enter customer WhatsApp Mobile Number (10 digits):", "");
      if (!phone) return;
      phone = phone.replace(/\D/g, "");
    }

    if (phone.length === 10) phone = `91${phone}`;

    const itemsText = (order.items || []).map(i => `• ${i.name} x${i.quantity} = ${currency}${(i.price * i.quantity)}`).join("%0A");

    const message = `*${encodeURIComponent(shopName)}*%0A`
      + `Order: *%23${order.orderNumber || order.id}* (Token *%23${order.tokenNumber || 1}*)%0A`
      + `Date: ${new Date(order.createdAt).toLocaleDateString("en-IN")}%0A`
      + `Customer: ${encodeURIComponent(order.customerName || "Valued Guest")}%0A`
      + `--------------------------%0A`
      + `${itemsText}%0A`
      + `--------------------------%0A`
      + `*Total Amount: ${currency}${Number(order.total).toFixed(2)}*%0A`
      + `Paid via: ${order.paymentMethod || "Cash"}%0A%0A`
      + `Thank you for visiting *${encodeURIComponent(shopName)}*! Enjoy your meal!`;

    const waUrl = `https://wa.me/${phone}?text=${message}`;
    window.open(waUrl, "_blank");
  },

  promptVoidOrder(orderId) {
    const orders = window.db.get("orders") || [];
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const confirmVoid = confirm(`Are you sure you want to VOID and CANCEL Order #${order.orderNumber || order.id} (₹${order.total})?\n\nThis will remove it from net counter collection.`);
    if (confirmVoid) {
      window.db.updateOrderStatus(orderId, "Cancelled");
      window.showToast(`Order #${order.orderNumber || order.id} has been VOIDED.`, "error");
      this.render();
    }
  },

  openQuickCashOutModal() {
    const settings = window.db.get("settings") || {};
    const currency = settings.currencySymbol || "₹";

    const modalHtml = `
      <div style="display: flex; flex-direction: column; gap: 14px; font-size: 13px;">
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 10px 14px; color: #991b1b; font-size: 12px; display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-hand-holding-dollar" style="font-size: 16px;"></i>
          <span>This expense will be deducted directly from today's physical cash drawer register.</span>
        </div>

        <div>
          <label style="font-weight: 700; color: var(--text-dark); display: block; margin-bottom: 5px;">Description / Purpose *</label>
          <input type="text" id="cashout-desc" class="form-input" placeholder="e.g. Milk, Amul Cheese, Ice, Veggies, Gas Refill" style="height: 38px; border-radius: 10px;">
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label style="font-weight: 700; color: var(--text-dark); display: block; margin-bottom: 5px;">Amount (${currency}) *</label>
            <input type="number" id="cashout-amount" class="form-input" placeholder="0.00" min="1" step="any" style="height: 38px; font-weight: 800; font-size: 14px; border-radius: 10px;">
          </div>
          <div>
            <label style="font-weight: 700; color: var(--text-dark); display: block; margin-bottom: 5px;">Category</label>
            <select id="cashout-cat" class="form-input" style="height: 38px; border-radius: 10px; font-weight: 600;">
              <option value="Raw Materials">Raw Materials (Dairy, Veg)</option>
              <option value="Beverages & Ice">Beverages & Ice</option>
              <option value="Packaging & Disposables">Packaging & Disposables</option>
              <option value="Gas & Fuel">Gas & Fuel</option>
              <option value="Staff Refreshment">Staff Refreshment</option>
              <option value="Store Maintenance">Store Maintenance</option>
              <option value="Other Petty Cash">Other Petty Cash</option>
            </select>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label style="font-weight: 700; color: var(--text-dark); display: block; margin-bottom: 5px;">Payment Mode</label>
            <select id="cashout-mode" class="form-input" style="height: 38px; border-radius: 10px; font-weight: 700;">
              <option value="Cash" selected>Cash (Drawer Cash Out)</option>
              <option value="UPI">UPI / Online</option>
            </select>
          </div>
          <div>
            <label style="font-weight: 700; color: var(--text-dark); display: block; margin-bottom: 5px;">Date</label>
            <input type="date" id="cashout-date" class="form-input" value="${this.activeDateStr}" style="height: 38px; border-radius: 10px; font-weight: 600;">
          </div>
        </div>
      </div>
    `;

    window.customModal.show({
      title: "Log Cash Out / Counter Expense",
      bodyHtml: modalHtml,
      confirmText: "Record Cash Out",
      cancelText: "Cancel",
      onConfirm: () => {
        const descInput = document.getElementById("cashout-desc");
        const amountInput = document.getElementById("cashout-amount");
        const catInput = document.getElementById("cashout-cat");
        const modeInput = document.getElementById("cashout-mode");
        const dateInput = document.getElementById("cashout-date");

        const desc = descInput ? descInput.value.trim() : "";
        const amount = amountInput ? parseFloat(amountInput.value) : 0;
        const category = catInput ? catInput.value : "Raw Materials";
        const paymentMode = modeInput ? modeInput.value : "Cash";
        const date = dateInput && dateInput.value ? dateInput.value : this.activeDateStr;

        if (!desc) {
          window.showToast("Please provide expense description.", "error");
          return false;
        }
        if (!amount || isNaN(amount) || amount <= 0) {
          window.showToast("Please enter a valid amount.", "error");
          return false;
        }

        const expenses = window.db.get("expenses") || [];
        const newExpense = {
          id: `EXP-${Date.now()}`,
          title: desc,
          description: desc,
          amount: amount,
          category: category,
          paymentMode: paymentMode,
          date: date,
          createdAt: new Date().toISOString()
        };

        expenses.unshift(newExpense);
        window.db.set("expenses", expenses);

        window.showToast(`Logged ₹${amount} expense. Till updated!`, "success");
        this.render();
        return true;
      }
    });
  },

  exportOrdersToCsv() {
    const allOrders = window.db.get("orders") || [];
    let orders = this.getFilteredOrdersByPeriod(allOrders);

    if (this.paymentFilter !== "all") {
      orders = orders.filter(o => (o.paymentMethod || "Cash").toLowerCase() === this.paymentFilter.toLowerCase());
    }
    if (this.statusFilter !== "all") {
      orders = orders.filter(o => (o.status || "").toLowerCase() === this.statusFilter.toLowerCase());
    }
    if (this.typeFilter !== "all") {
      orders = orders.filter(o => (o.type || "Dine-in").toLowerCase() === this.typeFilter.toLowerCase());
    }

    if (orders.length === 0) {
      window.showToast("No orders available to export.", "error");
      return;
    }

    const headers = ["Order No", "Token No", "Date", "Time", "Customer Name", "Customer Phone", "Type", "Items", "Payment Mode", "Subtotal", "Discount", "Total", "Status"];
    const rows = orders.map(o => {
      const dt = new Date(o.createdAt || Date.now());
      const dateStr = dt.toLocaleDateString("en-IN");
      const timeStr = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const itemsBrief = (o.items || []).map(i => `${i.name} (x${i.quantity})`).join("; ");
      const disc = (Number(o.bogoDiscount) || 0) + (Number(o.discount) || 0);

      return [
        `"#${o.orderNumber || o.id}"`,
        `"${o.tokenNumber || 1}"`,
        `"${dateStr}"`,
        `"${timeStr}"`,
        `"${(o.customerName || 'Walk-in').replace(/"/g, '""')}"`,
        `"${o.customerPhone || ''}"`,
        `"${o.type || 'Dine-in'}"`,
        `"${itemsBrief.replace(/"/g, '""')}"`,
        `"${o.paymentMethod || 'Cash'}"`,
        Number(o.subtotal || 0).toFixed(2),
        disc.toFixed(2),
        Number(o.total || 0).toFixed(2),
        `"${o.status || 'Completed'}"`
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Crust_Chilly_Bills_${this.activeDateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.showToast(`Exported ${orders.length} bills to CSV successfully!`, "success");
  },

  showDaySummaryPrintModal() {
    const allOrders = window.db.get("orders") || [];
    const allExpenses = window.db.get("expenses") || [];
    const settings = window.db.get("settings") || {};
    const currency = settings.currencySymbol || "₹";

    const periodOrders = this.getFilteredOrdersByPeriod(allOrders);
    const validOrders = periodOrders.filter(o => o.status !== "Cancelled");
    const cancelledOrders = periodOrders.filter(o => o.status === "Cancelled");

    const grossSales = validOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const cashOrders = validOrders.filter(o => (o.paymentMethod || "Cash").toLowerCase() === "cash");
    const cashSales = cashOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    const upiOrders = validOrders.filter(o => (o.paymentMethod || "").toLowerCase() === "upi");
    const upiSales = upiOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    const targetDate = this.activeDateStr;
    const periodExpenses = allExpenses.filter(e => {
      const eDate = e.date || (e.createdAt ? this.getIstDateString(new Date(e.createdAt)) : "");
      return eDate === targetDate;
    });

    const cashExpenses = periodExpenses.filter(e => (e.paymentMode || "Cash").toLowerCase() === "cash")
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const openingFloat = this.getOpeningFloat();
    const expectedDrawerCash = openingFloat + cashSales - cashExpenses;

    const summaryHtml = `
      <div id="counter-summary-printable-area" style="font-family: 'Courier New', monospace; font-size: 12.5px; color: #000; background: #fff; padding: 14px; line-height: 1.4;">
        <div style="text-align: center; margin-bottom: 10px;">
          <h2 style="font-size: 17px; font-weight: 900; margin: 0; text-transform: uppercase;">${settings.restaurantName || "Crust & Chilly"}</h2>
          <p style="font-size: 11px; margin: 2px 0;">DAILY COUNTER SUMMARY</p>
          <p style="font-size: 11px; margin: 0;">Date: ${this.activeDateStr} | Time: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        </div>

        <div style="border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 6px 0; margin-bottom: 8px;">
          <div style="display: flex; justify-content: space-between;">
            <span>Total Bills Issued:</span>
            <strong>${periodOrders.length} (${validOrders.length} Valid, ${cancelledOrders.length} Void)</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 900; margin-top: 4px;">
            <span>GROSS SALES:</span>
            <span>${currency}${grossSales.toFixed(2)}</span>
          </div>
        </div>

        <div style="margin-bottom: 8px;">
          <strong style="text-decoration: underline;">PAYMENT COLLECTION:</strong>
          <div style="display: flex; justify-content: space-between; margin-top: 4px;">
            <span>Cash Sales (${cashOrders.length} bills):</span>
            <strong>${currency}${cashSales.toFixed(2)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 2px;">
            <span>UPI / QR Sales (${upiOrders.length} bills):</span>
            <strong>${currency}${upiSales.toFixed(2)}</strong>
          </div>
        </div>

        <div style="border-top: 1px dashed #000; padding-top: 6px; margin-bottom: 8px;">
          <strong style="text-decoration: underline;">CASH DRAWER TALLY:</strong>
          <div style="display: flex; justify-content: space-between; margin-top: 4px;">
            <span>Opening Float:</span>
            <span>${currency}${openingFloat.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>(+) Cash Sales:</span>
            <span>+${currency}${cashSales.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>(-) Cash Expenses Paid:</span>
            <span>-${currency}${cashExpenses.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 900; border-top: 1px solid #000; margin-top: 4px; padding-top: 4px;">
            <span>EXPECTED DRAWER CASH:</span>
            <span>${currency}${expectedDrawerCash.toFixed(2)}</span>
          </div>
        </div>

        <div style="text-align: center; margin-top: 18px; font-size: 11px; border-top: 1px dashed #000; padding-top: 8px;">
          Cashier Sign: _____________________<br><br>
          Manager Sign: _____________________
        </div>
      </div>
    `;

    window.customModal.show({
      title: "Daily Counter Summary Slip",
      bodyHtml: summaryHtml,
      confirmText: "Print Summary Slip",
      cancelText: "Close",
      onConfirm: () => {
        document.body.classList.add("printing-counter-summary");
        window.print();
        setTimeout(() => {
          document.body.classList.remove("printing-counter-summary");
        }, 1000);
        return true;
      }
    });
  },

  printTallySlip() {
    const settings = window.db.get("settings") || {};
    const currency = settings.currencySymbol || "₹";
    const d = this.denominations;

    const sub500 = (d[500] || 0) * 500;
    const sub200 = (d[200] || 0) * 200;
    const sub100 = (d[100] || 0) * 100;
    const sub50 = (d[50] || 0) * 50;
    const sub20 = (d[20] || 0) * 20;
    const sub10 = (d[10] || 0) * 10;
    const subCoins = d.coins || 0;
    const actualCash = sub500 + sub200 + sub100 + sub50 + sub20 + sub10 + subCoins;

    const floatVal = this.getOpeningFloat();

    const tallyHtml = `
      <div id="counter-tally-printable-area" style="font-family: 'Courier New', monospace; font-size: 12.5px; color: #000; background: #fff; padding: 14px; line-height: 1.4;">
        <div style="text-align: center; margin-bottom: 10px;">
          <h2 style="font-size: 17px; font-weight: 900; margin: 0; text-transform: uppercase;">${settings.restaurantName || "Crust & Chilly"}</h2>
          <p style="font-size: 11px; margin: 2px 0;">CASH DRAWER RECONCILIATION SLIP</p>
          <p style="font-size: 11px; margin: 0;">Date: ${this.activeDateStr} | Shift Closing</p>
        </div>

        <div style="border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 6px 0; margin-bottom: 8px;">
          <strong style="text-decoration: underline;">PHYSICAL NOTE DENOMINATIONS:</strong>
          <table style="width: 100%; font-size: 12px; margin-top: 4px;">
            <tr><td>Rs 500 x ${d[500] || 0}</td><td style="text-align: right;">${currency}${sub500}</td></tr>
            <tr><td>Rs 200 x ${d[200] || 0}</td><td style="text-align: right;">${currency}${sub200}</td></tr>
            <tr><td>Rs 100 x ${d[100] || 0}</td><td style="text-align: right;">${currency}${sub100}</td></tr>
            <tr><td>Rs 50 x ${d[50] || 0}</td><td style="text-align: right;">${currency}${sub50}</td></tr>
            <tr><td>Rs 20 x ${d[20] || 0}</td><td style="text-align: right;">${currency}${sub20}</td></tr>
            <tr><td>Rs 10 x ${d[10] || 0}</td><td style="text-align: right;">${currency}${sub10}</td></tr>
            <tr><td>Coins Total</td><td style="text-align: right;">${currency}${subCoins}</td></tr>
            <tr style="border-top: 1px solid #000; font-weight: 900; font-size: 14px;">
              <td>TOTAL CASH COUNTED:</td>
              <td style="text-align: right;">${currency}${actualCash}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin-top: 16px; font-size: 11px;">
          Cashier Sign: _____________________<br><br>
          Verified By: _____________________
        </div>
      </div>
    `;

    window.customModal.show({
      title: "Print Cash Tally Slip",
      bodyHtml: tallyHtml,
      confirmText: "Print Slip",
      cancelText: "Close",
      onConfirm: () => {
        document.body.classList.add("printing-counter-tally");
        window.print();
        setTimeout(() => {
          document.body.classList.remove("printing-counter-tally");
        }, 1000);
        return true;
      }
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
