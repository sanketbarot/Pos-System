// Crust & Chilly POS - Dashboard Analytics Module
// Calculates running stats, instantiates Chart.js graphic graphs, and binds action buttons.

window.views = window.views || {};
window.views.dashboard = {
  salesChart: null,
  paymentChart: null,

  init(container) {
    container.innerHTML = `
      <div class="view-animate" style="display: flex; flex-direction: column; gap: 24px;">
        
        <!-- Welcome Header Banner -->
        <div style="background: linear-gradient(135deg, rgba(255, 75, 43, 0.07) 0%, rgba(255, 128, 8, 0.07) 100%); border: 1px solid var(--border-color); border-radius: var(--border-radius-lg); padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; gap: 20px;">
          <div>
            <h1 style="font-size: 20px; font-weight: 800; color: var(--text-dark); margin: 0 0 4px 0;">Welcome back, Chef! 🍕</h1>
            <p style="font-size: 13px; color: var(--text-muted); margin: 0;">Here is today's overview and analytics for Crust & Chilly.</p>
          </div>
          <div style="background: var(--bg-darker); padding: 8px 16px; border-radius: var(--border-radius-md); border: 1px solid var(--border-color); font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
            <i class="fa-solid fa-circle" style="color: var(--color-ready); font-size: 8px; animation: warning-pulse 1.5s infinite alternate;"></i> KDS Connected Live
          </div>
        </div>

        <!-- 3 Stats Cards Grid -->
        <div class="dashboard-grid-stats" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); margin-bottom: 0;">
          <div class="glass-card stat-card" style="border-left: 4px solid #f97316;">
            <div class="stat-info">
              <span class="stat-label">Today's Sales</span>
              <span class="stat-value" id="dash-sales-val">₹0</span>
              <span class="stat-change up" id="dash-sales-count"><i class="fa-solid fa-arrow-trend-up"></i> 0 orders today</span>
            </div>
            <div class="stat-icon-wrapper" style="background: rgba(249, 115, 22, 0.08); border-color: rgba(249, 115, 22, 0.15); color: #ea580c;">
              <i class="fa-solid fa-indian-rupee-sign"></i>
            </div>
          </div>
          <div class="glass-card stat-card" style="border-left: 4px solid #00b0ff;">
            <div class="stat-info">
              <span class="stat-label">Today's Orders</span>
              <span class="stat-value" id="dash-orders-val">0</span>
              <span class="stat-change" style="color: var(--text-muted);">Completed & Cancelled</span>
            </div>
            <div class="stat-icon-wrapper" style="background: rgba(0, 176, 255, 0.08); border-color: rgba(0, 176, 255, 0.15); color: #00b0ff;">
              <i class="fa-solid fa-receipt"></i>
            </div>
          </div>
          <div class="glass-card stat-card" style="border-left: 4px solid #2979ff;">
            <div class="stat-info">
              <span class="stat-label">Active Kitchen Queue</span>
              <span class="stat-value" id="dash-active-val">0</span>
              <span class="stat-change" id="dash-active-sub" style="color: var(--text-muted);">Preparing / Pending</span>
            </div>
            <div class="stat-icon-wrapper" style="background: rgba(41, 121, 255, 0.08); border-color: rgba(41, 121, 255, 0.15); color: #2979ff;">
              <i class="fa-solid fa-fire-burner"></i>
            </div>
          </div>
        </div>

        <!-- Charts Layout Row -->
        <div class="dashboard-charts-row" style="margin-bottom: 0;">
          <div class="glass-card chart-card">
            <div class="flex-space mb-3">
              <h3 style="font-size: 15px; font-weight: 700; margin: 0;"><i class="fa-solid fa-chart-line" style="color: #ea580c; margin-right: 6px;"></i> Sales Analytics (Last 7 Days)</h3>
              <span style="font-size: 11px; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Weekly Trend</span>
            </div>
            <div class="chart-container">
              <canvas id="salesTrendsChartCanvas"></canvas>
            </div>
          </div>
          <div class="glass-card chart-card">
            <div class="flex-space mb-3">
              <h3 style="font-size: 15px; font-weight: 700; margin: 0;"><i class="fa-solid fa-wallet" style="color: #00b0ff; margin-right: 6px;"></i> Payment Distribution</h3>
              <span style="font-size: 11px; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Today's Share</span>
            </div>
            <div class="chart-container">
              <canvas id="paymentPieChartCanvas"></canvas>
            </div>
          </div>
        </div>

        <!-- Details Grid Row -->
        <div class="dashboard-details-row">
          <!-- Best Selling items -->
          <div class="glass-card" style="display: flex; flex-direction: column;">
            <div class="flex-space mb-3">
              <h3 style="font-size: 15px; font-weight: 700; margin: 0;"><i class="fa-solid fa-star" style="color: #ffb300; margin-right: 6px;"></i> Best Selling Menu Items</h3>
              <span class="badge badge-ready">Top Moving</span>
            </div>
            <div class="table-container" style="flex-grow: 1;">
              <table class="premium-table">
                <thead>
                  <tr>
                    <th>Item Details</th>
                    <th>Category</th>
                    <th style="text-align: right; width: 45%;">Quantity Sold</th>
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
              <h3 style="font-size: 15px; font-weight: 700; margin-bottom: 4px;"><i class="fa-solid fa-bolt" style="color: #ff4b2b; margin-right: 6px;"></i> Quick Management</h3>
              <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">Quickly jump to active operations dashboards.</p>
            </div>
            
            <div class="grid-3col" style="flex-grow: 1; align-items: center; gap: 12px;">
              <button class="btn btn-secondary text-center w-100" onclick="window.location.hash='#pos'" style="flex-direction: column; padding: 20px 8px; gap: 10px; height: 110px; background: linear-gradient(135deg, rgba(255, 75, 43, 0.04) 0%, rgba(255, 128, 8, 0.04) 100%); border-color: rgba(255, 75, 43, 0.15);">
                <i class="fa-solid fa-plus-circle" style="font-size: 24px; color: #ff4b2b;"></i>
                <span style="font-size: 13px; font-weight: 700;">POS Terminal</span>
              </button>
              <button class="btn btn-secondary text-center w-100" onclick="window.location.hash='#orders'" style="flex-direction: column; padding: 20px 8px; gap: 10px; height: 110px; background: linear-gradient(135deg, rgba(41, 121, 255, 0.04) 0%, rgba(0, 176, 255, 0.04) 100%); border-color: rgba(41, 121, 255, 0.15);">
                <i class="fa-solid fa-kitchen-set" style="font-size: 24px; color: #2979ff;"></i>
                <span style="font-size: 13px; font-weight: 700;">Kitchen KDS</span>
              </button>
              <button class="btn btn-secondary text-center w-100" id="dash-action-menu-setup" onclick="window.location.hash='#menu'" style="flex-direction: column; padding: 20px 8px; gap: 10px; height: 110px; background: linear-gradient(135deg, rgba(255, 179, 0, 0.04) 0%, rgba(255, 128, 8, 0.04) 100%); border-color: rgba(255, 179, 0, 0.15);">
                <i class="fa-solid fa-burger" style="font-size: 24px; color: #ffb300;"></i>
                <span style="font-size: 13px; font-weight: 700;">Menu Setup</span>
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
    document.getElementById("dash-sales-count").innerHTML = `<i class="fa-solid fa-arrow-trend-up"></i> ${todayValidOrders.length} active orders today`;

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
      const maxQty = bestSellersList[0].quantity;
      bestSellersBody.innerHTML = bestSellersList.map(item => {
        const pct = (item.quantity / maxQty) * 100;
        return `
          <tr>
            <td style="font-weight: 600; padding: 12px 18px;">${item.name}</td>
            <td style="color: var(--text-muted); padding: 12px 18px;">${item.category}</td>
            <td style="text-align: right; padding: 12px 18px;">
              <div style="display: flex; align-items: center; justify-content: flex-end; gap: 10px;">
                <div style="flex-grow: 1; max-width: 100px; height: 6px; background: var(--bg-darkest); border-radius: 3px; overflow: hidden; border: 1px solid var(--border-color);">
                  <div style="width: ${pct}%; height: 100%; background: var(--primary-gradient); border-radius: 3px;"></div>
                </div>
                <span style="font-weight: 700; color: #ea580c; font-size: 13px; min-width: 50px; text-align: right;">${item.quantity} sold</span>
              </div>
            </td>
          </tr>
        `;
      }).join("");
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

    // Create a beautiful linear gradient for the line chart fill
    const fillGradient = trendsCtx.createLinearGradient(0, 0, 0, 260);
    fillGradient.addColorStop(0, 'rgba(249, 115, 22, 0.22)');
    fillGradient.addColorStop(1, 'rgba(249, 115, 22, 0.00)');

    this.salesChart = new Chart(trendsCtx, {
      type: "line",
      data: {
        labels: daysLabel,
        datasets: [
          {
            label: "Sales (₹)",
            data: salesData,
            borderColor: "#f97316",
            backgroundColor: fillGradient,
            borderWidth: 3,
            tension: 0.35,
            fill: true,
            pointBackgroundColor: "#f97316",
            pointBorderColor: bgDarker,
            pointHoverBackgroundColor: "#ea580c",
            pointHoverBorderColor: bgDarker,
            pointRadius: 4,
            pointHoverRadius: 7
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: textMuted, font: { family: "Outfit", size: 12 } }
          },
          tooltip: {
            backgroundColor: 'rgba(43, 38, 34, 0.95)',
            titleFont: { family: "Outfit", size: 13, weight: "bold" },
            bodyFont: { family: "Outfit", size: 12 },
            padding: 10,
            cornerRadius: 8
          }
        },
        scales: {
          x: {
            grid: { color: borderColor },
            ticks: { color: textMuted, font: { family: "Outfit", size: 11 } }
          },
          y: {
            grid: { color: borderColor },
            ticks: { color: textMuted, font: { family: "Outfit", size: 11 } }
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
            backgroundColor: totalPayment === 0 ? [borderColor, borderColor, borderColor] : ["#2979ff", "#f97316", "#00e676"],
            borderWidth: 3,
            borderColor: bgDarker,
            borderRadius: totalPayment === 0 ? 0 : 4,
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
            labels: { color: textMuted, font: { family: "Outfit", size: 12 }, padding: 15 }
          },
          tooltip: {
            backgroundColor: 'rgba(43, 38, 34, 0.95)',
            titleFont: { family: "Outfit", size: 13, weight: "bold" },
            bodyFont: { family: "Outfit", size: 12 },
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: function(context) {
                if (totalPayment === 0) return " No sales logged today";
                return ` ${context.label}: ₹${context.raw}`;
              }
            }
          }
        },
        cutout: "75%"
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
