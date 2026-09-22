// Crust & Chilly POS - Executive Dashboard Analytics Module
// Calculates live business metrics, renders interactive Chart.js graphs, best-sellers leaderboard, and recent activity.

window.views = window.views || {};
window.views.dashboard = {
  salesChart: null,
  paymentChart: null,

  getLocalDateStr(d = new Date()) {
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().substring(0, 10);
  },

  formatTime(isoOrDateStr) {
    if (!isoOrDateStr) return "--:--";
    const d = new Date(isoOrDateStr);
    return isNaN(d.getTime()) ? "--:--" : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
      <div class="dash-container view-animate">
        
        <!-- Welcome Executive Banner -->
        <div class="dash-banner">
          <div>
            <h1>Crust & Chilly Business Dashboard 🍕</h1>
            <p><i class="fa-regular fa-calendar" style="color: #2563eb; margin-right: 5px;"></i> ${formattedDate} • Real-time Business Intelligence</p>
          </div>
          <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
            <div class="dash-status-pill">
              <i class="fa-solid fa-circle" style="font-size: 7px; animation: pulse 1.5s infinite alternate;"></i> Live Cloud Connected
            </div>
            <button class="btn btn-secondary" id="dash-btn-refresh" style="padding: 6px 14px; border-radius: 14px; font-size: 12px; font-weight: 700; height: 36px;">
              <i class="fa-solid fa-rotate-right"></i> Refresh
            </button>
          </div>
        </div>

        <!-- 4 KPI Cards Grid -->
        <div class="dash-kpi-grid">
          
          <!-- KPI 1: Gross Sales -->
          <div class="dash-card accent-blue">
            <div>
              <div class="dash-card-header">
                <span class="dash-card-label">Today's Gross Sales</span>
                <div class="dash-card-icon icon-blue">
                  <i class="fa-solid fa-indian-rupee-sign"></i>
                </div>
              </div>
              <div class="dash-card-val" id="dash-sales-val">₹0</div>
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
                <span class="dash-card-label">Orders & Avg Ticket</span>
                <div class="dash-card-icon icon-amber">
                  <i class="fa-solid fa-receipt"></i>
                </div>
              </div>
              <div class="dash-card-val" id="dash-orders-val">0</div>
            </div>
            <div class="dash-breakdown-tags">
              <span class="dash-sub-pill pill-neutral" id="dash-aov-pill"><i class="fa-solid fa-calculator"></i> Avg: ₹0/order</span>
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
              <span class="dash-sub-pill pill-neutral" id="dash-queue-status">Pending / Preparing</span>
            </div>
          </div>

        </div>

        <!-- 2 Visual Charts Row -->
        <div class="dash-charts-grid">
          
          <!-- Chart 1: 7-Day Revenue Trend -->
          <div class="dash-chart-card">
            <div class="chart-header">
              <div class="chart-title">
                <i class="fa-solid fa-chart-line" style="color: #2563eb;"></i> 7-Day Revenue Trend
              </div>
              <span style="font-size: 11px; color: #2563eb; background: #eff6ff; border: 1px solid #bfdbfe; padding: 3px 10px; border-radius: 12px; font-weight: 800; text-transform: uppercase;">
                Weekly Flow
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
                <i class="fa-solid fa-wallet" style="color: #10b981;"></i> Today's Payment Split
              </div>
              <span style="font-size: 11px; color: #059669; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 3px 10px; border-radius: 12px; font-weight: 800; text-transform: uppercase;">
                Cash vs UPI
              </span>
            </div>
            <div class="dash-chart-wrap">
              <canvas id="paymentPieChartCanvas"></canvas>
            </div>
          </div>

        </div>

        <!-- 2 Details Row: Top Selling Leaderboard & Today's Recent Bills -->
        <div class="dash-details-grid">
          
          <!-- Best Selling Products Leaderboard -->
          <div class="dash-leaderboard-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <h3 style="font-size: 15px; font-weight: 800; color: var(--text-dark); margin: 0; display: flex; align-items: center; gap: 8px;">
                <i class="fa-solid fa-crown" style="color: #f59e0b;"></i> Best Selling Menu Items
              </h3>
              <span style="font-size: 11px; background: #fffbeb; color: #b45309; border: 1px solid #fde68a; padding: 3px 10px; border-radius: 12px; font-weight: 800;">Top Velocity</span>
            </div>
            
            <div id="dash-best-sellers-list" style="display: flex; flex-direction: column; gap: 12px;">
              <!-- Injected dynamically -->
            </div>
          </div>

          <!-- Today's Recent Bills Activity Stream -->
          <div class="dash-recent-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <h3 style="font-size: 15px; font-weight: 800; color: var(--text-dark); margin: 0; display: flex; align-items: center; gap: 8px;">
                <i class="fa-solid fa-clock-rotate-left" style="color: #2563eb;"></i> Recent Register Bills
              </h3>
              <a href="#counter" style="font-size: 12px; font-weight: 800; color: #2563eb; text-decoration: none; display: flex; align-items: center; gap: 4px;">
                View All <i class="fa-solid fa-chevron-right" style="font-size: 10px;"></i>
              </a>
            </div>

            <div id="dash-recent-orders-list" style="display: flex; flex-direction: column; gap: 10px;">
              <!-- Injected dynamically -->
            </div>
          </div>

        </div>

        <!-- Executive Quick Navigation Cards -->
        <div>
          <h3 style="font-size: 14px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
            <i class="fa-solid fa-bolt" style="color: #2563eb; margin-right: 6px;"></i> Quick Navigation
          </h3>
          <div class="dash-actions-row">
            
            <a href="#counter" class="dash-quick-btn">
              <i class="fa-solid fa-cash-register"></i>
              <span>Daily Counter & Bills</span>
            </a>

            <a href="#reports" class="dash-quick-btn">
              <i class="fa-solid fa-chart-pie"></i>
              <span>Sales & Analytics</span>
            </a>

            <a href="#pos" class="dash-quick-btn" id="dash-btn-pos">
              <i class="fa-solid fa-calculator"></i>
              <span>POS Billing</span>
            </a>

            <a href="#orders" class="dash-quick-btn" id="dash-btn-orders">
              <i class="fa-solid fa-kitchen-set"></i>
              <span>Kitchen KDS</span>
            </a>

          </div>
        </div>

      </div>
    `;

    document.getElementById("dash-btn-refresh").addEventListener("click", () => {
      this.calculateAndRenderMetrics();
      window.showToast("Dashboard metrics refreshed!", "info");
    });

    this.calculateAndRenderMetrics();
    this.setupRoleRestrictions();
  },

  calculateAndRenderMetrics() {
    const orders = window.db.get("orders") || [];
    const products = window.db.get("products") || [];
    const categories = window.db.get("categories") || [];
    const expenses = window.db.get("expenses") || [];
    const settings = window.db.get("settings") || {};

    const currencySymbol = settings.currencySymbol || "₹";
    const todayStr = this.getLocalDateStr();

    // 1. Filter Today's orders using local date string
    const todayOrders = orders.filter(o => {
      if (!o.createdAt) return false;
      const orderDateStr = o.createdAt.substring(0, 10);
      return orderDateStr === todayStr;
    });

    const todayValidOrders = todayOrders.filter(o => o.status !== "Cancelled");
    
    // 2. Gross Sales & Payment Breakdowns
    let cashTotal = 0;
    let upiTotal = 0;
    let cardTotal = 0;
    let grossSales = 0;

    todayValidOrders.forEach(o => {
      const amt = Number(o.total) || 0;
      grossSales += amt;
      if (o.paymentMethod === "Cash") cashTotal += amt;
      else if (o.paymentMethod === "Card") cardTotal += amt;
      else upiTotal += amt; // Default to UPI
    });

    document.getElementById("dash-sales-val").textContent = `${currencySymbol}${Math.round(grossSales).toLocaleString("en-IN")}`;
    
    let breakdownHtml = `
      <span class="dash-sub-pill pill-cash"><i class="fa-solid fa-money-bill-wave"></i> Cash: ${currencySymbol}${Math.round(cashTotal).toLocaleString("en-IN")}</span>
      <span class="dash-sub-pill pill-upi"><i class="fa-solid fa-qrcode"></i> UPI: ${currencySymbol}${Math.round(upiTotal).toLocaleString("en-IN")}</span>
    `;
    if (cardTotal > 0) {
      breakdownHtml += `<span class="dash-sub-pill pill-card"><i class="fa-solid fa-credit-card"></i> Card: ${currencySymbol}${Math.round(cardTotal).toLocaleString("en-IN")}</span>`;
    }
    document.getElementById("dash-sales-breakdown").innerHTML = breakdownHtml;

    // 3. Estimated Net Profit
    // Today's expenses
    const todayExpenses = expenses
      .filter(e => e.date === todayStr || (e.createdAt && e.createdAt.substring(0, 10) === todayStr))
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    // Approximate Cost of Goods Sold (approx 32% food cost default or calculated from recipes)
    const estimatedCOGS = grossSales * 0.32;
    const netProfit = Math.max(0, grossSales - estimatedCOGS - todayExpenses);
    const profitMargin = grossSales > 0 ? Math.round((netProfit / grossSales) * 100) : 0;

    document.getElementById("dash-profit-val").textContent = `${currencySymbol}${Math.round(netProfit).toLocaleString("en-IN")}`;
    document.getElementById("dash-margin-pill").innerHTML = `<i class="fa-solid fa-percent"></i> ${profitMargin}% Est. Margin`;
    document.getElementById("dash-expense-pill").innerHTML = `<i class="fa-solid fa-receipt"></i> Expenses: ${currencySymbol}${Math.round(todayExpenses).toLocaleString("en-IN")}`;

    // 4. Today's Orders & Average Order Value
    const totalOrdersCount = todayOrders.length;
    const completedCount = todayValidOrders.filter(o => o.status === "Completed").length;
    const aov = todayValidOrders.length > 0 ? Math.round(grossSales / todayValidOrders.length) : 0;

    document.getElementById("dash-orders-val").textContent = totalOrdersCount;
    document.getElementById("dash-aov-pill").innerHTML = `<i class="fa-solid fa-calculator"></i> Avg: ${currencySymbol}${aov}/bill`;
    document.getElementById("dash-completed-pill").textContent = `${completedCount} Completed`;

    // 5. Active Kitchen Queue
    const activeQueueCount = orders.filter(o => o.status === "Pending" || o.status === "Preparing").length;
    document.getElementById("dash-active-val").textContent = activeQueueCount;
    document.getElementById("dash-queue-status").textContent = activeQueueCount > 5 ? "High Demand Live" : (activeQueueCount > 0 ? "Orders in Kitchen" : "Kitchen Clear");

    // 6. Best Selling Menu Items Leaderboard
    this.renderBestSellers(orders, products, categories, currencySymbol);

    // 7. Today's Recent Bills Activity Stream
    this.renderRecentBills(todayOrders, currencySymbol);

    // 8. Visual Charts (7-day trend + Payment Split)
    this.renderTrendCharts(orders, todayStr);
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
          No menu sales recorded yet. Place orders to see leaderboard.
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
        <div style="padding: 10px 12px; background: #f8fafc; border: 1px solid var(--border-color); border-radius: 12px; display: flex; flex-direction: column; gap: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 10px; min-width: 0;">
              <span class="rank-pill ${rankClass}">${rankLabel}</span>
              <div style="min-width: 0;">
                <div style="font-weight: 800; font-size: 13.5px; color: var(--text-dark); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  ${item.name}
                </div>
                <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">${item.category}</span>
              </div>
            </div>
            <div style="text-align: right; flex-shrink: 0;">
              <div style="font-weight: 800; color: #2563eb; font-size: 13px;">${item.quantity} sold</div>
              <div style="font-size: 11.5px; color: var(--text-muted); font-weight: 600;">${currencySymbol}${Math.round(item.revenue).toLocaleString("en-IN")}</div>
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
          No bills recorded today yet.
        </div>
      `;
      return;
    }

    // Sort descending by order id or creation time
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
        <div style="padding: 10px 12px; background: #f8fafc; border: 1px solid var(--border-color); border-radius: 12px; display: flex; align-items: center; justify-content: space-between; gap: 10px;">
          <div style="min-width: 0;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-weight: 800; font-size: 13px; color: var(--text-dark);">#${o.orderNumber || "Bill"}</span>
              <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">${timeStr}</span>
              <span class="dash-sub-pill ${payPillClass}" style="padding: 2px 6px; font-size: 10.5px;">
                <i class="fa-solid ${payIcon}"></i> ${o.paymentMethod || "UPI"}
              </span>
            </div>
            <div style="font-size: 11.5px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 3px; max-width: 220px;">
              ${itemsSummary}
            </div>
          </div>
          <div style="text-align: right; flex-shrink: 0;">
            <div style="font-weight: 800; font-size: 14px; color: var(--text-dark);">${currencySymbol}${Math.round(o.total || 0)}</div>
            <span style="display: inline-block; padding: 2px 8px; border-radius: 8px; font-size: 10.5px; font-weight: 700; color: ${statusColor}; background: ${statusBg}; margin-top: 2px;">
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

  setupRoleRestrictions() {
    const user = window.db.getCurrentUser();
    if (!user) return;
    const role = user.role;

    if (role === "staff") {
      const btnPos = document.getElementById("dash-btn-pos");
      const btnOrders = document.getElementById("dash-btn-orders");
      // Staff can access POS and KDS
    }
  }
};
