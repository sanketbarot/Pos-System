// Crust & Chilly POS - Dashboard Analytics Module
// Calculates running stats, instantiates Chart.js graphic graphs, and binds action buttons.

window.views = window.views || {};
window.views.dashboard = {
  salesChart: null,
  paymentChart: null,

  init(container) {
    container.innerHTML = `
      <div class="view-animate" style="display: flex; flex-direction: column; gap: 20px;">
        
        <!-- Welcome Header Banner -->
        <div style="background: var(--bg-darkest); border: 1.5px solid rgba(255, 255, 255, 0.95); border-radius: 22px; padding: 18px 24px; display: flex; justify-content: space-between; align-items: center; gap: 20px; box-shadow: 6px 6px 16px #cad5e2, -6px -6px 16px #ffffff;">
          <div>
            <h1 style="font-size: 20px; font-weight: 800; color: var(--text-dark); margin: 0 0 4px 0;">Welcome back, Chef! 🍕</h1>
            <p style="font-size: 13px; color: var(--text-muted); margin: 0;">Here is today's live overview and analytics for Crust & Chilly.</p>
          </div>
          <div style="background: var(--bg-darkest); padding: 8px 16px; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.8); font-size: 12px; font-weight: 700; display: flex; align-items: center; gap: 8px; box-shadow: var(--neu-shadow-btn); color: #10b981;">
            <i class="fa-solid fa-circle" style="color: #10b981; font-size: 8px; animation: pulse 1.5s infinite alternate;"></i> KDS Connected Live
          </div>
        </div>

        <!-- 3 Stats Cards Grid -->
        <div class="dashboard-grid-stats" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); margin-bottom: 0;">
          <div class="glass-card stat-card" style="border-left: 4px solid #2563eb;">
            <div class="stat-info">
              <span class="stat-label">Today's Sales</span>
              <span class="stat-value" id="dash-sales-val" style="color: #2563eb; font-size: 28px; font-weight: 900;">₹0</span>
              <span class="stat-change up" id="dash-sales-count" style="color: #10b981; font-weight: 700;"><i class="fa-solid fa-arrow-trend-up"></i> 0 active orders today</span>
            </div>
            <div class="stat-icon-wrapper" style="background: #eff6ff; border-color: #bfdbfe; color: #2563eb;">
              <i class="fa-solid fa-indian-rupee-sign"></i>
            </div>
          </div>
          <div class="glass-card stat-card" style="border-left: 4px solid #2563eb;">
            <div class="stat-info">
              <span class="stat-label">Today's Orders</span>
              <span class="stat-value" id="dash-orders-val" style="color: var(--text-dark); font-size: 28px; font-weight: 900;">0</span>
              <span class="stat-change" style="color: var(--text-muted); font-weight: 600;">Completed & Active</span>
            </div>
            <div class="stat-icon-wrapper" style="background: #eff6ff; border-color: #bfdbfe; color: #2563eb;">
              <i class="fa-solid fa-receipt"></i>
            </div>
          </div>
          <div class="glass-card stat-card" style="border-left: 4px solid #10b981;">
            <div class="stat-info">
              <span class="stat-label">Active Kitchen Queue</span>
              <span class="stat-value" id="dash-active-val" style="color: #10b981; font-size: 28px; font-weight: 900;">0</span>
              <span class="stat-change" id="dash-active-sub" style="color: var(--text-muted); font-weight: 600;">Preparing / Pending</span>
            </div>
            <div class="stat-icon-wrapper" style="background: #ecfdf5; border-color: #a7f3d0; color: #059669;">
              <i class="fa-solid fa-fire-burner"></i>
            </div>
          </div>
        </div>

        <!-- Charts Layout Row -->
        <div class="dashboard-charts-row" style="margin-bottom: 0;">
          <div class="glass-card chart-card">
            <div class="flex-space mb-3" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <h3 style="font-size: 15px; font-weight: 800; color: var(--text-dark); margin: 0;"><i class="fa-solid fa-chart-line" style="color: #2563eb; margin-right: 6px;"></i> Sales Analytics (Last 7 Days)</h3>
              <span style="font-size: 11px; color: #2563eb; background: #eff6ff; border: 1px solid #bfdbfe; padding: 2px 8px; border-radius: 10px; font-weight: 800; text-transform: uppercase;">Weekly Trend</span>
            </div>
            <div class="chart-container">
              <canvas id="salesTrendsChartCanvas"></canvas>
            </div>
          </div>
          <div class="glass-card chart-card">
            <div class="flex-space mb-3" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <h3 style="font-size: 15px; font-weight: 800; color: var(--text-dark); margin: 0;"><i class="fa-solid fa-wallet" style="color: #2563eb; margin-right: 6px;"></i> Payment Distribution</h3>
              <span style="font-size: 11px; color: #10b981; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 2px 8px; border-radius: 10px; font-weight: 800; text-transform: uppercase;">Today's Share</span>
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
            <div class="flex-space mb-3" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <h3 style="font-size: 15px; font-weight: 800; color: var(--text-dark); margin: 0;"><i class="fa-solid fa-star" style="color: #2563eb; margin-right: 6px;"></i> Best Selling Menu Items</h3>
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
              <h3 style="font-size: 15px; font-weight: 800; color: var(--text-dark); margin-bottom: 4px;"><i class="fa-solid fa-bolt" style="color: #2563eb; margin-right: 6px;"></i> Quick Management</h3>
              <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">Quickly jump to active operations dashboards.</p>
            </div>
            
            <div class="grid-3col" style="flex-grow: 1; align-items: center; gap: 12px; display: grid; grid-template-columns: repeat(3, 1fr);">
              <button class="btn btn-secondary text-center w-100" onclick="window.location.hash='#pos'" style="flex-direction: column; padding: 18px 8px; gap: 10px; height: 110px; border-radius: 18px; box-shadow: var(--neu-shadow-btn); border: 1px solid rgba(255, 255, 255, 0.9);">
                <i class="fa-solid fa-cash-register" style="font-size: 24px; color: #2563eb;"></i>
                <span style="font-size: 13px; font-weight: 800; color: var(--text-dark);">POS Terminal</span>
              </button>
              <button class="btn btn-secondary text-center w-100" onclick="window.location.hash='#orders'" style="flex-direction: column; padding: 18px 8px; gap: 10px; height: 110px; border-radius: 18px; box-shadow: var(--neu-shadow-btn); border: 1px solid rgba(255, 255, 255, 0.9);">
                <i class="fa-solid fa-kitchen-set" style="font-size: 24px; color: #2563eb;"></i>
                <span style="font-size: 13px; font-weight: 800; color: var(--text-dark);">Kitchen KDS</span>
              </button>
              <button class="btn btn-secondary text-center w-100" id="dash-action-menu-setup" onclick="window.location.hash='#menu'" style="flex-direction: column; padding: 18px 8px; gap: 10px; height: 110px; border-radius: 18px; box-shadow: var(--neu-shadow-btn); border: 1px solid rgba(255, 255, 255, 0.9);">
                <i class="fa-solid fa-burger" style="font-size: 24px; color: #2563eb;"></i>
                <span style="font-size: 13px; font-weight: 800; color: var(--text-dark);">Menu Setup</span>
              </button>
            </div>
            
            <div style="border-top: 1px solid rgba(202, 213, 226, 0.6); padding-top: 14px; font-size: 12px; color: var(--text-muted); text-align: center; font-weight: 600;">
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
          <td colspan="3" style="text-align: center; color: var(--text-muted); padding: 40px; font-weight: 600;">
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
            <td style="font-weight: 700; padding: 12px 18px; color: var(--text-dark);">${item.name}</td>
            <td style="color: var(--text-muted); padding: 12px 18px; font-weight: 600;">${item.category}</td>
            <td style="text-align: right; padding: 12px 18px;">
              <div style="display: flex; align-items: center; justify-content: flex-end; gap: 10px;">
                <div style="flex-grow: 1; max-width: 100px; height: 6px; background: rgba(202, 213, 226, 0.5); border-radius: 3px; overflow: hidden;">
                  <div style="width: ${pct}%; height: 100%; background: var(--primary-gradient); border-radius: 3px;"></div>
                </div>
                <span style="font-weight: 800; color: #2563eb; font-size: 13px; min-width: 50px; text-align: right;">${item.quantity} sold</span>
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
    const textMuted = '#64748b';
    const bgDarker = '#edf1f7';
    const borderColor = 'rgba(202, 213, 226, 0.6)';

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

    // Create a linear gradient for the line chart fill in Royal Blue
    const fillGradient = trendsCtx.createLinearGradient(0, 0, 0, 260);
    fillGradient.addColorStop(0, 'rgba(37, 99, 235, 0.20)');
    fillGradient.addColorStop(1, 'rgba(37, 99, 235, 0.00)');

    this.salesChart = new Chart(trendsCtx, {
      type: "line",
      data: {
        labels: daysLabel,
        datasets: [
          {
            label: "Sales (₹)",
            data: salesData,
            borderColor: "#2563eb",
            backgroundColor: fillGradient,
            borderWidth: 3,
            tension: 0.35,
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
          legend: {
            labels: { color: textMuted, font: { family: "Outfit", size: 12, weight: "bold" } }
          },
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
            backgroundColor: totalPayment === 0 ? [borderColor, borderColor, borderColor] : ["#2563eb", "#10b981", "#6366f1"],
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
            labels: { color: textMuted, font: { family: "Outfit", size: 12, weight: "bold" }, padding: 15 }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
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
