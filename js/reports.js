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
      <div class="view-animate" style="display: flex; flex-direction: column; gap: 20px;">
        
        <!-- Date Filters Control Panel Bar -->
        <div class="glass-card flex-space" style="padding: 14px 20px; flex-wrap: wrap; gap: 12px;">
          <div class="flex-gap-sm" style="flex-wrap: wrap;">
            <span style="font-size: 13px; font-weight: 600; color: var(--text-muted);">Custom Period:</span>
            <input type="date" id="report-start-date" class="customer-input" style="height:32px; font-size:12px; padding: 4px 8px;" value="${this.startDate}">
            <span style="font-size: 12px; color: var(--text-muted);">to</span>
            <input type="date" id="report-end-date" class="customer-input" style="height:32px; font-size:12px; padding: 4px 8px;" value="${this.endDate}">
            <button class="btn btn-primary" id="btn-reports-apply-filter" style="padding: 0 16px; height: 32px; font-size: 12px;">
              Apply Filters
            </button>
          </div>
          <div class="flex-gap-sm">
            <button class="btn btn-secondary" id="btn-report-export-csv" style="padding: 0 12px; height: 32px; font-size: 12px;">
              <i class="fa-solid fa-file-csv" style="color: #ff8008;"></i> Export CSV
            </button>
            <button class="btn btn-secondary" id="btn-report-print-summary" style="padding: 0 12px; height: 32px; font-size: 12px;">
              <i class="fa-solid fa-print"></i> Print Summary
            </button>
          </div>
        </div>

        <!-- 3 Stats Cards Row -->
        <div class="grid-3col">
          <div class="glass-card stat-card">
            <div class="stat-info">
              <span class="stat-label">Total Revenue</span>
              <span class="stat-value" id="rep-total-sales" style="color: #ff8008;">₹0</span>
              <span class="stat-change" style="color: var(--text-muted);">Gross order sums</span>
            </div>
            <div class="stat-icon-wrapper"><i class="fa-solid fa-calculator"></i></div>
          </div>
          <div class="glass-card stat-card">
            <div class="stat-info">
              <span class="stat-label">Transactions Count</span>
              <span class="stat-value" id="rep-total-orders" style="color: #00b0ff;">0</span>
              <span class="stat-change" style="color: var(--text-muted);">Total orders placed</span>
            </div>
            <div class="stat-icon-wrapper"><i class="fa-solid fa-receipt"></i></div>
          </div>
          <div class="glass-card stat-card">
            <div class="stat-info">
              <span class="stat-label">Total Discounts Given</span>
              <span class="stat-value" id="rep-total-discounts" style="color: #ff4b2b;">₹0</span>
              <span class="stat-change" id="rep-total-discounts-sub" style="color: var(--text-muted);">BOGO + Cash</span>
            </div>
            <div class="stat-icon-wrapper"><i class="fa-solid fa-tags"></i></div>
          </div>
        </div>

        <!-- Charts Segment -->
        <div class="dashboard-charts-row">
          <div class="glass-card chart-card">
            <h3>Revenue Analytics Trend Curve</h3>
            <div class="chart-container">
              <canvas id="repSalesCurveCanvas"></canvas>
            </div>
          </div>
          <div class="glass-card chart-card">
            <h3>Top Moving Categories Breakdown</h3>
            <div class="chart-container">
              <canvas id="repCategoryPieCanvas"></canvas>
            </div>
          </div>
        </div>

        <!-- Tables breakdown row -->
        <div class="dashboard-details-row">
          
          <!-- Item velocity stats -->
          <div class="glass-card">
            <h3 style="font-size: 15px; font-weight: 600; margin-bottom: 12px;">Itemized Sales Velocity (Top Sellers First)</h3>
            <div class="table-container" style="max-height: 240px; overflow-y: auto;">
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
          <div class="glass-card" style="display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <h3 style="font-size: 15px; font-weight: 600; margin-bottom: 12px;">Payment Collection Split</h3>
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
            <div style="background: var(--bg-darker); padding: 12px; border-radius: var(--border-radius-md); border: 1px solid var(--border-color); margin-top: 14px;">
              <h4 style="font-size: 12px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Discount Statistics</h4>
              <div class="flex-space" style="font-size: 13px;">
                <span>BOGO Discount Given:</span>
                <span id="rep-bogo-given" style="font-weight: 600; color: #ff4b2b;">₹0.00</span>
              </div>
              <div class="flex-space" style="font-size: 13px; margin-top: 4px;">
                <span>Cash Discount Given:</span>
                <span id="rep-cash-given" style="font-weight: 600; color: #ff8008;">₹0.00</span>
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

    // Inject stats
    document.getElementById("rep-total-sales").textContent = `${currency}${Math.round(totalSales)}`;
    document.getElementById("rep-total-orders").textContent = filteredValidOrders.length;
    document.getElementById("rep-total-discounts").textContent = `${currency}${Math.round(totalDiscountCombined)}`;
    document.getElementById("rep-total-discounts-sub").textContent = `BOGO: ${currency}${Math.round(totalBogoDiscount)} | Cash: ${currency}${Math.round(totalCashDiscount)}`;

    document.getElementById("rep-bogo-given").textContent = `${currency}${totalBogoDiscount.toFixed(2)}`;
    document.getElementById("rep-cash-given").textContent = `${currency}${totalCashDiscount.toFixed(2)}`;

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
      itemTableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 20px;">No sales logged in range.</td></tr>`;
    } else {
      itemTableBody.innerHTML = itemizedList.map(item => `
        <tr>
          <td style="font-weight:600;">${item.name}</td>
          <td>${currency}${item.price}</td>
          <td style="font-weight:700; color:#fff;">${item.quantity} sold</td>
          <td style="text-align: right; font-weight:700; color:#ff8008;">${currency}${item.totalRevenue.toFixed(2)}</td>
        </tr>
      `).join("");
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
        <td style="font-weight:600;"><i class="fa-solid fa-circle" style="color: ${mode === 'UPI' ? '#00b0ff' : mode==='Cash' ? '#ff8008' : '#00e676'}; font-size:8px; margin-right:6px;"></i> ${mode}</td>
        <td>${paySplitCounts[mode]} transactions</td>
        <td style="text-align: right; font-weight:700; color:#fff;">${currency}${paySplitAmounts[mode].toFixed(2)}</td>
      </tr>
    `).join("");

    // Render Charts
    this.renderReportsCharts(filteredValidOrders, categories, products);
  },

  renderReportsCharts(orders, categories, products) {
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

    this.salesTrendChart = new Chart(curveCtx, {
      type: "line",
      data: {
        labels: datesLabel,
        datasets: [
          {
            label: "Sales Revenue (₹)",
            data: salesDataPoints,
            borderColor: "#ff8008",
            backgroundColor: "rgba(255, 128, 8, 0.15)",
            borderWidth: 3,
            fill: true,
            tension: 0.25,
            pointBackgroundColor: "#ff8008"
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: "#9ba1ad", font: { family: "Outfit" } } }
        },
        scales: {
          x: {
            grid: { color: "rgba(255,255,255,0.02)" },
            ticks: { color: "#9ba1ad", font: { family: "Outfit" } }
          },
          y: {
            grid: { color: "rgba(255,255,255,0.02)" },
            ticks: { color: "#9ba1ad", font: { family: "Outfit" } }
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
            backgroundColor: pieData.length === 0 ? ["#292524"] : ["#ff4b2b", "#ff8008", "#00e676", "#00b0ff", "#2979ff", "#ffb300", "#e91e63", "#9c27b0", "#009688", "#795548"],
            borderWidth: 1,
            borderColor: "#121010"
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "right",
            labels: { color: "#9ba1ad", font: { family: "Outfit" } }
          }
        },
        cutout: "60%"
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
