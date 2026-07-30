// Crust & Chilly POS - Dashboard Analytics Module
// Calculates running stats, instantiates Chart.js graphic graphs, and binds action buttons.

window.views = window.views || {};
window.views.dashboard = {
  salesChart: null,
  paymentChart: null,

  init(container) {
    container.innerHTML = `
      <div class="view-animate">
        <!-- 3 Stats Cards Grid -->
        <div class="dashboard-grid-stats" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));">
          <div class="glass-card stat-card">
            <div class="stat-info">
              <span class="stat-label">Today's Sales</span>
              <span class="stat-value" id="dash-sales-val">₹0</span>
              <span class="stat-change up" id="dash-sales-count">0 orders</span>
            </div>
            <div class="stat-icon-wrapper">
              <i class="fa-solid fa-indian-rupee-sign"></i>
            </div>
          </div>
          <div class="glass-card stat-card">
            <div class="stat-info">
              <span class="stat-label">Today's Orders</span>
              <span class="stat-value" id="dash-orders-val">0</span>
              <span class="stat-change" style="color: var(--text-muted);">Completed & Cancelled</span>
            </div>
            <div class="stat-icon-wrapper" style="color: #ff8008;">
              <i class="fa-solid fa-receipt"></i>
            </div>
          </div>
          <div class="glass-card stat-card">
            <div class="stat-info">
              <span class="stat-label">Active Kitchen Queue</span>
              <span class="stat-value" id="dash-active-val">0</span>
              <span class="stat-change" id="dash-active-sub" style="color: var(--text-muted);">Preparing / Pending</span>
            </div>
            <div class="stat-icon-wrapper" style="color: #2979ff;">
              <i class="fa-solid fa-fire-burner"></i>
            </div>
          </div>
        </div>

        <!-- Charts Layout Row -->
        <div class="dashboard-charts-row">
          <div class="glass-card chart-card">
            <h3>Sales Analytics (Last 7 Days)</h3>
            <div class="chart-container">
              <canvas id="salesTrendsChartCanvas"></canvas>
            </div>
          </div>
          <div class="glass-card chart-card">
            <h3>Payment Distribution</h3>
            <div class="chart-container">
              <canvas id="paymentPieChartCanvas"></canvas>
            </div>
          </div>
        </div>

        <!-- Details Grid Row -->
        <div class="dashboard-details-row">
          <!-- Best Selling items -->
          <div class="glass-card">
            <div class="flex-space mb-3">
              <h3 style="font-size: 16px; font-weight: 600;">Best Selling Menu Items</h3>
              <span class="badge badge-ready">Top Moving</span>
            </div>
            <div class="table-container">
              <table class="premium-table">
                <thead>
                  <tr>
                    <th>Item Details</th>
                    <th>Category</th>
                    <th style="text-align: right;">Quantity Sold</th>
                  </tr>
                </thead>
                <tbody id="dash-best-sellers-body">
                  <!-- Injected via JS -->
                </tbody>
              </table>
            </div>
          </div>

          <!-- Quick Terminal Actions -->
          <div class="glass-card" style="display: flex; flex-direction: column; gap: 16px; justify-content: space-between;">
            <div>
              <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 4px;">Quick Management</h3>
              <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">Quickly jump to active operations dashboards.</p>
            </div>
            
            <div class="grid-3col" style="flex-grow: 1; align-items: center;">
              <button class="btn btn-primary text-center w-100" onclick="window.location.hash='#pos'" style="flex-direction: column; padding: 24px 8px; gap: 12px; height: 110px;">
                <i class="fa-solid fa-plus-circle" style="font-size: 22px;"></i>
                <span style="font-size: 13px;">New Order (POS)</span>
              </button>
              <button class="btn btn-secondary text-center w-100" onclick="window.location.hash='#orders'" style="flex-direction: column; padding: 24px 8px; gap: 12px; height: 110px; border-color: var(--border-color-hover);">
                <i class="fa-solid fa-kitchen-set" style="font-size: 22px; color: #2979ff;"></i>
                <span style="font-size: 13px;">Kitchen (KDS)</span>
              </button>
              <button class="btn btn-secondary text-center w-100" id="dash-action-menu-setup" onclick="window.location.hash='#menu'" style="flex-direction: column; padding: 24px 8px; gap: 12px; height: 110px;">
                <i class="fa-solid fa-burger" style="font-size: 22px; color: #ff8008;"></i>
                <span style="font-size: 13px;">Menu Settings</span>
              </button>
            </div>
            
            <div style="border-top: 1px solid var(--border-color); padding-top: 14px; font-size: 12px; color: var(--text-muted); text-align: center;">
              Crust & Chilly POS • Operating Terminal Session
            </div>
          </div>
        </div>
      </div>
    `;

    this.calculateAndRenderMetrics();
    this.setupQuickActions();
  },

  calculateAndRenderMetrics() {
    const orders = window.db.get("orders") || [];
    const products = window.db.get("products") || [];
    const categories = window.db.get("categories") || [];
    const settings = window.db.get("settings") || {};

    const currencySymbol = settings.currencySymbol || "₹";
    const todayStr = new Date().toISOString().substring(0, 10);

    // Filter Today's completed/non-cancelled orders
    const todayOrders = orders.filter(o => o.createdAt.substring(0, 10) === todayStr);
    const todayValidOrders = todayOrders.filter(o => o.status !== "Cancelled");
    
    // 1. Sales Revenue
    const totalSales = todayValidOrders.reduce((sum, o) => sum + o.total, 0);
    document.getElementById("dash-sales-val").textContent = `${currencySymbol}${Math.round(totalSales)}`;
    document.getElementById("dash-sales-count").textContent = `${todayValidOrders.length} active orders today`;

    // 2. Today's Total Orders count
    document.getElementById("dash-orders-val").textContent = todayOrders.length;

    // 3. Active Queue Orders (Pending or Preparing)
    const activeOrdersCount = orders.filter(o => o.status === "Pending" || o.status === "Preparing").length;
    document.getElementById("dash-active-val").textContent = activeOrdersCount;

    // 4. Best Sellers Calculations
    const productSoldCounter = {};
    orders.forEach(o => {
      if (o.status === "Cancelled") return;
      o.items.forEach(item => {
        productSoldCounter[item.name] = (productSoldCounter[item.name] || 0) + item.quantity;
      });
    });

    const bestSellersList = Object.keys(productSoldCounter)
      .map(name => {
        const prod = products.find(p => p.name === name);
        const cat = prod ? categories.find(c => c.id === prod.category) : null;
        return {
          name: name,
          category: cat ? cat.name : "Menu Item",
          quantity: productSoldCounter[name]
        };
      })
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    const bestSellersBody = document.getElementById("dash-best-sellers-body");
    if (bestSellersList.length === 0) {
      bestSellersBody.innerHTML = `
        <tr>
          <td colspan="3" style="text-align: center; color: var(--text-muted); padding: 40px;">
            No item sales logged yet. Place orders to see statistics.
          </td>
        </tr>
      `;
    } else {
      bestSellersBody.innerHTML = bestSellersList.map(item => `
        <tr>
          <td style="font-weight: 600;">${item.name}</td>
          <td style="color: var(--text-muted);">${item.category}</td>
          <td style="text-align: right; font-weight: 700; color: #ff8008;">${item.quantity} sold</td>
        </tr>
      `).join("");
    }

    // 5. Graph Rendering (Sales last 7 days)
    this.renderTrendCharts(orders, todayStr);
  },

  renderTrendCharts(orders, todayStr) {
    // Get style variables for theme compatibility
    const textMuted = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#9ba1ad';
    const bgDarker = getComputedStyle(document.documentElement).getPropertyValue('--bg-darker').trim() || '#ffffff';
    const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim() || 'rgba(0,0,0,0.08)';

    const daysLabel = [];
    const salesData = [];

    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().substring(0, 10);
      
      const dayLabel = d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
      daysLabel.push(dayLabel);

      // Sum sales
      const daySales = orders
        .filter(o => o.createdAt.substring(0, 10) === dateStr && o.status !== "Cancelled")
        .reduce((sum, o) => sum + o.total, 0);
      salesData.push(Math.round(daySales));
    }

    const trendsCtx = document.getElementById("salesTrendsChartCanvas").getContext("2d");
    if (this.salesChart) {
      this.salesChart.destroy();
    }

    this.salesChart = new Chart(trendsCtx, {
      type: "line",
      data: {
        labels: daysLabel,
        datasets: [
          {
            label: "Sales (₹)",
            data: salesData,
            borderColor: "#ff8008",
            backgroundColor: "rgba(255, 128, 8, 0.15)",
            borderWidth: 3,
            tension: 0.3,
            fill: true,
            pointBackgroundColor: "#ff8008",
            pointBorderColor: bgDarker,
            pointHoverRadius: 7
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: textMuted, font: { family: "Outfit" } }
          }
        },
        scales: {
          x: {
            grid: { color: borderColor },
            ticks: { color: textMuted, font: { family: "Outfit" } }
          },
          y: {
            grid: { color: borderColor },
            ticks: { color: textMuted, font: { family: "Outfit" } }
          }
        }
      }
    });

    // Payment Distribution
    const todayOrders = orders.filter(o => o.createdAt.substring(0, 10) === todayStr && o.status !== "Cancelled");
    const paymentSums = { UPI: 0, Cash: 0, Card: 0 };
    todayOrders.forEach(o => {
      paymentSums[o.paymentMethod] = (paymentSums[o.paymentMethod] || 0) + o.total;
    });

    const paymentCtx = document.getElementById("paymentPieChartCanvas").getContext("2d");
    if (this.paymentChart) {
      this.paymentChart.destroy();
    }

    const upiVal = Math.round(paymentSums.UPI);
    const cashVal = Math.round(paymentSums.Cash);
    const cardVal = Math.round(paymentSums.Card);

    const paymentData = [upiVal, cashVal, cardVal];
    const totalPayment = upiVal + cashVal + cardVal;

    this.paymentChart = new Chart(paymentCtx, {
      type: "doughnut",
      data: {
        labels: ["UPI", "Cash", "Card"],
        datasets: [
          {
            data: totalPayment === 0 ? [1, 1, 1] : paymentData,
            backgroundColor: totalPayment === 0 ? [borderColor, borderColor, borderColor] : ["#00b0ff", "#ff8008", "#00e676"],
            borderWidth: 2,
            borderColor: bgDarker,
            hoverOffset: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: { color: textMuted, font: { family: "Outfit" } }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                if (totalPayment === 0) return "No sales logged today";
                return ` ${context.label}: ₹${context.raw}`;
              }
            }
          }
        },
        cutout: "70%"
      }
    });
  },

  setupQuickActions() {
    // Hide Menu Setup button for staff role on dashboard
    const user = window.db.getCurrentUser();
    const isStaff = user && user.role === "staff";
    const btnMenu = document.getElementById("dash-action-menu-setup");
    if (btnMenu && isStaff) {
      btnMenu.style.display = "none";
    }
  }
};
