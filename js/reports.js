// Crust & Chilly POS - Reports & Business Intelligence Module
// Provides granular sales metrics, payment breakouts, item velocity analysis, and data exports.

window.views = window.views || {};
window.views.reports = {
  startDate: null,
  endDate: null,
  salesTrendChart: null,
  categoryBreakdownChart: null,

  init(container) {
    // Set default date range to last 7 days
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);

    this.startDate = lastWeek.toISOString().substring(0, 10);
    this.endDate = today.toISOString().substring(0, 10);

    container.innerHTML = `
      <div class="view-animate" style="display: flex; flex-direction: column; gap: 24px;">
        
        <!-- Date Filters Control Panel Bar -->
        <div class="glass-card flex-space" style="padding: 14px 20px; flex-wrap: wrap; gap: 16px;">
          <div class="flex-gap-sm" style="flex-wrap: wrap; align-items: center;">
            <span style="font-size: 13px; font-weight: 700; color: var(--text-dark);"><i class="fa-solid fa-calendar-days" style="color: #ff5c00; margin-right: 6px;"></i> Custom Period:</span>
            <input type="date" id="report-start-date" class="customer-input" style="height:34px; font-size:12px; padding: 4px 10px;" value="${this.startDate}">
            <span style="font-size: 12px; color: var(--text-muted);">to</span>
            <input type="date" id="report-end-date" class="customer-input" style="height:34px; font-size:12px; padding: 4px 10px;" value="${this.endDate}">
            <button class="btn btn-primary" id="btn-reports-apply-filter" style="padding: 0 16px; height: 34px; font-size: 12px;">
              Apply Filters
            </button>
          </div>
          <div class="flex-gap-sm">
            <button class="btn btn-secondary" id="btn-report-export-csv" style="padding: 0 14px; height: 34px; font-size: 12px; border-color: var(--border-color-hover);">
              <i class="fa-solid fa-file-csv" style="color: #ff5c00; font-size: 14px;"></i> Export CSV
            </button>
            <button class="btn btn-secondary" id="btn-report-print-summary" style="padding: 0 14px; height: 34px; font-size: 12px;">
              <i class="fa-solid fa-print"></i> Print Summary
            </button>
          </div>
        </div>

        <!-- 4 Stats Cards Row -->
        <div class="dashboard-grid-stats" style="grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 0;">
          <div class="glass-card stat-card" style="border-left: 4px solid #ff5c00;">
            <div class="stat-info">
              <span class="stat-label">Gross Revenue</span>
              <span class="stat-value" id="rep-total-sales">₹0</span>
              <span class="stat-change" style="color: var(--text-muted);">Sum of all orders</span>
            </div>
            <div class="stat-icon-wrapper" style="background: rgba(255, 92, 0, 0.08); border-color: rgba(255, 92, 0, 0.15); color: #ff5c00;">
              <i class="fa-solid fa-calculator"></i>
            </div>
          </div>
          <div class="glass-card stat-card" style="border-left: 4px solid #00e676;">
            <div class="stat-info">
              <span class="stat-label">Net Revenue</span>
              <span class="stat-value" id="rep-net-sales">₹0</span>
              <span class="stat-change" style="color: var(--text-muted);">Revenue minus discounts</span>
            </div>
            <div class="stat-icon-wrapper" style="background: rgba(0, 230, 118, 0.08); border-color: rgba(0, 230, 118, 0.15); color: #00e676;">
              <i class="fa-solid fa-wallet"></i>
            </div>
          </div>
          <div class="glass-card stat-card" style="border-left: 4px solid #9c27b0;">
            <div class="stat-info">
              <span class="stat-label">Average Order (AOV)</span>
              <span class="stat-value" id="rep-aov">₹0</span>
              <span class="stat-change" style="color: var(--text-muted);">Average billing amount</span>
            </div>
            <div class="stat-icon-wrapper" style="background: rgba(156, 39, 176, 0.08); border-color: rgba(156, 39, 176, 0.15); color: #9c27b0;">
              <i class="fa-solid fa-chart-simple"></i>
            </div>
          </div>
          <div class="glass-card stat-card" style="border-left: 4px solid #ff4b2b;">
            <div class="stat-info">
              <span class="stat-label">Discounts Given</span>
              <span class="stat-value" id="rep-total-discounts">₹0</span>
              <span class="stat-change" id="rep-total-discounts-sub" style="color: var(--text-muted);">BOGO + Cash discounts</span>
            </div>
            <div class="stat-icon-wrapper" style="background: rgba(255, 75, 43, 0.08); border-color: rgba(255, 75, 43, 0.15); color: #ff4b2b;">
              <i class="fa-solid fa-tags"></i>
            </div>
          </div>
        </div>

        <!-- Charts Segment -->
        <div class="dashboard-charts-row" style="margin-bottom: 0;">
          <div class="glass-card chart-card">
            <div class="flex-space mb-3">
              <h3 style="font-size: 15px; font-weight: 700; margin: 0;"><i class="fa-solid fa-chart-line" style="color: #ff5c00; margin-right: 6px;"></i> Revenue Analytics Trend Curve</h3>
              <span style="font-size: 11px; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Sales Curve</span>
            </div>
            <div class="chart-container">
              <canvas id="repSalesCurveCanvas"></canvas>
            </div>
          </div>
          <div class="glass-card chart-card">
            <div class="flex-space mb-3">
              <h3 style="font-size: 15px; font-weight: 700; margin: 0;"><i class="fa-solid fa-pizza-slice" style="color: #ffb300; margin-right: 6px;"></i> Top Categories Breakdown</h3>
              <span style="font-size: 11px; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Category Velocity</span>
            </div>
            <div class="chart-container">
              <canvas id="repCategoryPieCanvas"></canvas>
            </div>
          </div>
        </div>

        <!-- Tables breakdown row -->
        <div class="dashboard-details-row">
          
          <!-- Item velocity stats -->
          <div class="glass-card" style="display: flex; flex-direction: column;">
            <div class="flex-space mb-3">
              <h3 style="font-size: 15px; font-weight: 700; margin: 0;"><i class="fa-solid fa-list-ol" style="color: #ff5c00; margin-right: 6px;"></i> Itemized Sales Velocity</h3>
              <span class="badge badge-ready">Top Sellers First</span>
            </div>
            <div class="table-container" style="max-height: 280px; overflow-y: auto; flex-grow: 1;">
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
              <div class="flex-space mb-3">
                <h3 style="font-size: 15px; font-weight: 700; margin: 0;"><i class="fa-solid fa-credit-card" style="color: #00b0ff; margin-right: 6px;"></i> Payment Collection Split</h3>
                <span class="badge badge-completed" id="rep-total-orders-badge">0 Transactions</span>
              </div>
              <div class="table-container">
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

            <!-- Discount breakdown stats -->
            <div style="background: var(--bg-darker); padding: 16px; border-radius: var(--border-radius-md); border: 1px solid var(--border-color);">
              <h4 style="font-size: 12px; color: var(--text-dark); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 10px 0; display: flex; align-items: center; gap: 6px;">
                <i class="fa-solid fa-percent" style="color: #ff4b2b;"></i> Discount Statistics
              </h4>
              <div class="flex-space" style="font-size: 13px; color: var(--text-muted);">
                <span>BOGO Discount Given:</span>
                <span id="rep-bogo-given" style="font-weight: 700; color: #ff4b2b;">₹0.00</span>
              </div>
              <div class="flex-space" style="font-size: 13px; margin-top: 8px; color: var(--text-muted);">
                <span>Cash Discount Given:</span>
                <span id="rep-cash-given" style="font-weight: 700; color: #ff5c00;">₹0.00</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    `;

    this.setupListeners();
    this.calculateAndRender();
  },

  setupListeners() {
    document.getElementById("btn-reports-apply-filter").onclick = () => {
      const start = document.getElementById("report-start-date").value;
      const end = document.getElementById("report-end-date").value;
      
      if (!start || !end) {
        window.showToast("Please choose valid date parameters.", "error");
        return;
      }
      if (new Date(start) > new Date(end)) {
        window.showToast("Start date cannot exceed end date parameters.", "error");
        return;
      }

      this.startDate = start;
      this.endDate = end;
      this.calculateAndRender();
      window.showToast("Date filters applied.", "success");
    };

    document.getElementById("btn-report-export-csv").onclick = () => {
      this.exportReportToCSV();
    };

    document.getElementById("btn-report-print-summary").onclick = () => {
      window.print();
    };
  },

  calculateAndRender() {
    const orders = window.db.get("orders") || [];
    const products = window.db.get("products") || [];
    const categories = window.db.get("categories") || [];
    const settings = window.db.get("settings") || {};

    const currency = settings.currencySymbol || "₹";
    const startStr = this.startDate;
    const endStr = this.endDate;

    const inRange = (dateIsoStr) => {
      const dateOnly = dateIsoStr.substring(0, 10);
      return dateOnly >= startStr && dateOnly <= endStr;
    };

    const filteredOrders = orders.filter(o => inRange(o.createdAt));
    const filteredValidOrders = filteredOrders.filter(o => o.status !== "Cancelled");

    // Calculate sales metrics
    const totalSales = filteredValidOrders.reduce((sum, o) => sum + o.total, 0);
    const totalBogoDiscount = filteredValidOrders.reduce((sum, o) => sum + (o.bogoDiscount || 0), 0);
    const totalCashDiscount = filteredValidOrders.reduce((sum, o) => sum + (o.discount || 0), 0);
    const totalDiscountCombined = totalBogoDiscount + totalCashDiscount;
    const netSales = Math.max(0, totalSales - totalDiscountCombined);
    const totalOrders = filteredValidOrders.length;
    const aov = totalOrders > 0 ? (totalSales / totalOrders) : 0;

    // Inject stats
    document.getElementById("rep-total-sales").textContent = `${currency}${Math.round(totalSales)}`;
    document.getElementById("rep-net-sales").textContent = `${currency}${Math.round(netSales)}`;
    document.getElementById("rep-aov").textContent = `${currency}${Math.round(aov)}`;
    document.getElementById("rep-total-discounts").textContent = `${currency}${Math.round(totalDiscountCombined)}`;
    document.getElementById("rep-total-discounts-sub").textContent = `BOGO: ${currency}${Math.round(totalBogoDiscount)} | Cash: ${currency}${Math.round(totalCashDiscount)}`;

    document.getElementById("rep-bogo-given").textContent = `${currency}${totalBogoDiscount.toFixed(2)}`;
    document.getElementById("rep-cash-given").textContent = `${currency}${totalCashDiscount.toFixed(2)}`;
    document.getElementById("rep-total-orders-badge").textContent = `${totalOrders} Transactions`;

    // Item-wise sales frequency
    const itemsSoldFrequency = {};
    filteredValidOrders.forEach(o => {
      o.items.forEach(item => {
        if (!itemsSoldFrequency[item.productId]) {
          itemsSoldFrequency[item.productId] = { quantity: 0, totalPaid: 0 };
        }
        itemsSoldFrequency[item.productId].quantity += item.quantity;
        itemsSoldFrequency[item.productId].totalPaid += item.lineTotal;
      });
    });

    const itemizedList = Object.entries(itemsSoldFrequency).map(([prodId, stats]) => {
      const prod = products.find(p => p.id === prodId);
      return {
        name: prod ? prod.name : "Deleted Menu Item",
        price: prod ? prod.price : 0,
        quantity: stats.quantity,
        totalRevenue: stats.totalPaid
      };
    }).sort((a, b) => b.quantity - a.quantity);

    const itemTableBody = document.getElementById("rep-item-sales-tbody");
    if (itemizedList.length === 0) {
      itemTableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 40px;">No sales logged in range.</td></tr>`;
    } else {
      const maxUnits = itemizedList[0].quantity;
      itemTableBody.innerHTML = itemizedList.map(item => {
        const pct = (item.quantity / maxUnits) * 100;
        return `
          <tr>
            <td style="font-weight:600; padding: 12px 18px;">${item.name}</td>
            <td style="padding: 12px 18px;">${currency}${item.price}</td>
            <td style="padding: 12px 18px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <div style="flex-grow: 1; max-width: 60px; height: 5px; background: var(--bg-darkest); border-radius: 2px; overflow: hidden; border: 1px solid var(--border-color);">
                  <div style="width: ${pct}%; height: 100%; background: var(--primary-gradient); border-radius: 2px;"></div>
                </div>
                <span style="font-weight:700; color: var(--text-main);">${item.quantity} sold</span>
              </div>
            </td>
            <td style="text-align: right; font-weight:700; color:#ff5c00; padding: 12px 18px;">${currency}${item.totalRevenue.toFixed(2)}</td>
          </tr>
        `;
      }).join("");
    }

    // Payment split
    const paySplitCounts = { UPI: 0, Cash: 0, Card: 0 };
    const paySplitAmounts = { UPI: 0, Cash: 0, Card: 0 };

    filteredValidOrders.forEach(o => {
      paySplitCounts[o.paymentMethod]++;
      paySplitAmounts[o.paymentMethod] += o.total;
    });

    const payTableBody = document.getElementById("rep-payment-split-tbody");
    payTableBody.innerHTML = ["UPI", "Cash", "Card"].map(mode => `
      <tr>
        <td style="font-weight:600; padding: 12px 18px;"><i class="fa-solid fa-circle" style="color: ${mode === 'UPI' ? '#2979ff' : mode==='Cash' ? '#ff5c00' : '#00e676'}; font-size:8px; margin-right:6px;"></i> ${mode}</td>
        <td style="padding: 12px 18px; color: var(--text-muted);">${paySplitCounts[mode]} transactions</td>
        <td style="text-align: right; font-weight:700; color: var(--text-dark); padding: 12px 18px;">${currency}${paySplitAmounts[mode].toFixed(2)}</td>
      </tr>
    `).join("");

    // Render Charts
    this.renderReportsCharts(filteredValidOrders, categories, products);
  },

  renderReportsCharts(orders, categories, products) {
    // Get style variables for theme compatibility
    const textMuted = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#9ba1ad';
    const bgDarker = getComputedStyle(document.documentElement).getPropertyValue('--bg-darker').trim() || '#ffffff';
    const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim() || 'rgba(0,0,0,0.08)';

    const datesLabel = [];
    const salesDataPoints = [];

    const start = new Date(this.startDate);
    const end = new Date(this.endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().substring(0, 10);
      datesLabel.push(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }));

      const daySales = orders
        .filter(o => o.createdAt.substring(0, 10) === dateStr)
        .reduce((sum, o) => sum + o.total, 0);
      salesDataPoints.push(Math.round(daySales));
    }

    const curveCtx = document.getElementById("repSalesCurveCanvas").getContext("2d");
    if (this.salesTrendChart) {
      this.salesTrendChart.destroy();
    }

    // Create a beautiful linear gradient for the line chart fill
    const fillGradient = curveCtx.createLinearGradient(0, 0, 0, 260);
    fillGradient.addColorStop(0, 'rgba(255, 75, 43, 0.22)');
    fillGradient.addColorStop(1, 'rgba(255, 128, 8, 0.00)');

    this.salesTrendChart = new Chart(curveCtx, {
      type: "line",
      data: {
        labels: datesLabel,
        datasets: [
          {
            label: "Sales Revenue (₹)",
            data: salesDataPoints,
            borderColor: "#ff4b2b",
            backgroundColor: fillGradient,
            borderWidth: 3,
            fill: true,
            tension: 0.25,
            pointBackgroundColor: "#ff4b2b",
            pointBorderColor: bgDarker,
            pointHoverBackgroundColor: "#ff5c00",
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
          legend: { labels: { color: textMuted, font: { family: "Outfit", size: 12 } } },
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

    // Pie Category Velocity
    const catSalesSums = {};
    categories.forEach(c => {
      catSalesSums[c.name] = 0;
    });

    orders.forEach(o => {
      o.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        if (prod) {
          const cat = categories.find(c => c.id === prod.category);
          if (cat) {
            catSalesSums[cat.name] += item.lineTotal;
          }
        }
      });
    });

    const pieCtx = document.getElementById("repCategoryPieCanvas").getContext("2d");
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
            backgroundColor: pieData.length === 0 ? [borderColor] : ["#ff4b2b", "#ff5c00", "#00e676", "#00b0ff", "#2979ff", "#ffb300", "#e91e63", "#9c27b0", "#009688", "#795548"],
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
            labels: { color: textMuted, font: { family: "Outfit", size: 12 }, padding: 12 }
          },
          tooltip: {
            backgroundColor: 'rgba(43, 38, 34, 0.95)',
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
  },

  exportReportToCSV() {
    const orders = window.db.get("orders") || [];
    const startStr = this.startDate;
    const endStr = this.endDate;
    const filtered = orders.filter(o => {
      const d = o.createdAt.substring(0, 10);
      return d >= startStr && d <= endStr;
    });

    if (filtered.length === 0) {
      window.showToast("No data to export.", "error");
      return;
    }

    let csv = "Order ID,Date,Customer,Type,Payment Mode,Subtotal,BOGO Discount,Cash Discount,Grand Total,Status\r\n";
    filtered.forEach(o => {
      csv += `ORD-${o.orderNumber},"${o.createdAt}",` +
             `"${o.customerName.replace(/"/g, '""')}",` +
             `"${o.type}","${o.paymentMethod}",` +
             `${o.subtotal.toFixed(2)},${(o.bogoDiscount || 0).toFixed(2)},` +
             `${o.discount.toFixed(2)},${o.total.toFixed(2)},"${o.status}"\r\n`;
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
