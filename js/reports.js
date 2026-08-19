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
        <div class="glass-card" style="padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
            <span style="font-size: 13px; font-weight: 800; color: var(--text-dark);"><i class="fa-solid fa-calendar-days" style="color: #2563eb; margin-right: 6px;"></i> Custom Period:</span>
            <input type="date" id="report-start-date" class="form-input" style="height: 36px; font-size: 12.5px; padding: 4px 12px; border-radius: 14px;" value="${this.startDate}">
            <span style="font-size: 12px; color: var(--text-muted); font-weight: 600;">to</span>
            <input type="date" id="report-end-date" class="form-input" style="height: 36px; font-size: 12.5px; padding: 4px 12px; border-radius: 14px;" value="${this.endDate}">
            <button class="btn btn-primary" id="btn-reports-apply-filter" style="padding: 0 18px; height: 36px; font-size: 12.5px; border-radius: 14px;">
              Apply Filters
            </button>
          </div>
          <div style="display: flex; gap: 10px;">
            <button class="btn btn-secondary" id="btn-report-export-csv" style="padding: 0 16px; height: 36px; font-size: 12.5px; border-radius: 14px;">
              <i class="fa-solid fa-file-csv" style="color: #2563eb; font-size: 14px;"></i> Export CSV
            </button>
            <button class="btn btn-secondary" id="btn-report-print-summary" style="padding: 0 16px; height: 36px; font-size: 12.5px; border-radius: 14px;">
              <i class="fa-solid fa-print" style="color: #2563eb;"></i> Print Summary
            </button>
          </div>
        </div>

        <!-- 4 Stats Cards Row -->
        <div class="dashboard-grid-stats" style="grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 0;">
          <div class="glass-card stat-card" style="border-left: 4px solid #2563eb;">
            <div class="stat-info">
              <span class="stat-label">Gross Revenue</span>
              <span class="stat-value" id="rep-total-sales" style="color: #2563eb; font-size: 26px; font-weight: 900;">₹0</span>
              <span class="stat-change" style="color: var(--text-muted); font-weight: 600;">Sum of all orders</span>
            </div>
            <div class="stat-icon-wrapper" style="background: #eff6ff; border-color: #bfdbfe; color: #2563eb;">
              <i class="fa-solid fa-calculator"></i>
            </div>
          </div>
          <div class="glass-card stat-card" style="border-left: 4px solid #10b981;">
            <div class="stat-info">
              <span class="stat-label">Net Revenue</span>
              <span class="stat-value" id="rep-net-sales" style="color: #10b981; font-size: 26px; font-weight: 900;">₹0</span>
              <span class="stat-change" style="color: var(--text-muted); font-weight: 600;">Revenue minus discounts</span>
            </div>
            <div class="stat-icon-wrapper" style="background: #ecfdf5; border-color: #a7f3d0; color: #059669;">
              <i class="fa-solid fa-wallet"></i>
            </div>
          </div>
          <div class="glass-card stat-card" style="border-left: 4px solid #2563eb;">
            <div class="stat-info">
              <span class="stat-label">Average Order (AOV)</span>
              <span class="stat-value" id="rep-aov" style="color: var(--text-dark); font-size: 26px; font-weight: 900;">₹0</span>
              <span class="stat-change" style="color: var(--text-muted); font-weight: 600;">Average billing amount</span>
            </div>
            <div class="stat-icon-wrapper" style="background: #eff6ff; border-color: #bfdbfe; color: #2563eb;">
              <i class="fa-solid fa-chart-simple"></i>
            </div>
          </div>
          <div class="glass-card stat-card" style="border-left: 4px solid #10b981;">
            <div class="stat-info">
              <span class="stat-label">Discounts Given</span>
              <span class="stat-value" id="rep-total-discounts" style="color: #10b981; font-size: 26px; font-weight: 900;">₹0</span>
              <span class="stat-change" id="rep-total-discounts-sub" style="color: var(--text-muted); font-weight: 600;">BOGO + Cash discounts</span>
            </div>
            <div class="stat-icon-wrapper" style="background: #ecfdf5; border-color: #a7f3d0; color: #059669;">
              <i class="fa-solid fa-tags"></i>
            </div>
          </div>
        </div>

        <!-- Charts Segment -->
        <div class="dashboard-charts-row" style="margin-bottom: 0;">
          <div class="glass-card chart-card">
            <div class="flex-space mb-3" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <h3 style="font-size: 15px; font-weight: 800; color: var(--text-dark); margin: 0;"><i class="fa-solid fa-chart-line" style="color: #2563eb; margin-right: 6px;"></i> Revenue Analytics Trend Curve</h3>
              <span style="font-size: 11px; color: #2563eb; background: #eff6ff; border: 1px solid #bfdbfe; padding: 2px 8px; border-radius: 10px; font-weight: 800; text-transform: uppercase;">Sales Curve</span>
            </div>
            <div class="chart-container">
              <canvas id="repSalesCurveCanvas"></canvas>
            </div>
          </div>
          <div class="glass-card chart-card">
            <div class="flex-space mb-3" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <h3 style="font-size: 15px; font-weight: 800; color: var(--text-dark); margin: 0;"><i class="fa-solid fa-pizza-slice" style="color: #2563eb; margin-right: 6px;"></i> Top Categories Breakdown</h3>
              <span style="font-size: 11px; color: #10b981; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 2px 8px; border-radius: 10px; font-weight: 800; text-transform: uppercase;">Category Velocity</span>
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
            <div class="flex-space mb-3" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <h3 style="font-size: 15px; font-weight: 800; color: var(--text-dark); margin: 0;"><i class="fa-solid fa-list-ol" style="color: #2563eb; margin-right: 6px;"></i> Itemized Sales Velocity</h3>
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
              <div class="flex-space mb-3" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h3 style="font-size: 15px; font-weight: 800; color: var(--text-dark); margin: 0;"><i class="fa-solid fa-credit-card" style="color: #2563eb; margin-right: 6px;"></i> Payment Collection Split</h3>
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
            <div style="font-size: 12px; color: var(--text-muted); text-align: center; border-top: 1px solid rgba(202, 213, 226, 0.6); padding-top: 12px; font-weight: 600;">
              Data includes completed dine-in, takeaway, and delivery orders.
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

    btnApply.onclick = () => {
      this.startDate = document.getElementById("report-start-date").value;
      this.endDate = document.getElementById("report-end-date").value;

      if (!this.startDate || !this.endDate) {
        window.showToast("Please choose valid start and end dates.", "error");
        return;
      }
      if (this.startDate > this.endDate) {
        window.showToast("Start date cannot be after end date.", "error");
        return;
      }

      this.processDataAndRender();
      window.showToast("Reports updated for selected range.", "success");
    };

    btnExport.onclick = () => {
      this.exportReportToCSV();
    };

    btnPrint.onclick = () => {
      window.print();
    };
  },

  processDataAndRender() {
    const orders = window.db.get("orders") || [];
    const products = window.db.get("products") || [];
    const categories = window.db.get("categories") || [];
    const settings = window.db.get("settings") || {};
    const currency = settings.currencySymbol || "₹";

    const startStr = this.startDate;
    const endStr = this.endDate;

    // Filter non-cancelled orders inside the date range
    const filteredValidOrders = orders.filter(o => {
      const d = o.createdAt.substring(0, 10);
      return d >= startStr && d <= endStr && o.status !== "Cancelled";
    });

    // 1. Gross Revenue
    const grossRevenue = filteredValidOrders.reduce((sum, o) => sum + o.total, 0);
    document.getElementById("rep-total-sales").textContent = `${currency}${Math.round(grossRevenue)}`;

    // 2. Total Discounts given
    const totalDiscounts = filteredValidOrders.reduce((sum, o) => sum + (o.discount || 0) + (o.bogoDiscount || 0), 0);
    const bogoDiscounts = filteredValidOrders.reduce((sum, o) => sum + (o.bogoDiscount || 0), 0);
    const cashDiscounts = filteredValidOrders.reduce((sum, o) => sum + (o.discount || 0), 0);
    document.getElementById("rep-total-discounts").textContent = `${currency}${Math.round(totalDiscounts)}`;
    document.getElementById("rep-total-discounts-sub").textContent = `BOGO: ${currency}${Math.round(bogoDiscounts)} | Cash: ${currency}${Math.round(cashDiscounts)}`;

    // 3. Net Revenue
    const netRevenue = grossRevenue; // In our schema total is already discounted subtotal
    document.getElementById("rep-net-sales").textContent = `${currency}${Math.round(netRevenue)}`;

    // 4. AOV (Average Order Value)
    const aov = filteredValidOrders.length > 0 ? (grossRevenue / filteredValidOrders.length) : 0;
    document.getElementById("rep-aov").textContent = `${currency}${Math.round(aov)}`;

    // 5. Total Transactions
    document.getElementById("rep-total-orders-badge").textContent = `${filteredValidOrders.length} Transactions`;

    // 6. Itemized Sales Velocity Calculations
    const itemSoldMap = {};
    filteredValidOrders.forEach(o => {
      o.items.forEach(item => {
        if (!itemSoldMap[item.name]) {
          itemSoldMap[item.name] = {
            name: item.name,
            price: item.price,
            quantity: 0,
            gross: 0
          };
        }
        itemSoldMap[item.name].quantity += item.quantity;
        itemSoldMap[item.name].gross += item.lineTotal;
      });
    });

    const itemSortedList = Object.values(itemSoldMap).sort((a, b) => b.gross - a.gross);
    const itemTableBody = document.getElementById("rep-item-sales-tbody");

    if (itemSortedList.length === 0) {
      itemTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:30px; color:var(--text-muted); font-weight:600;">No item sales in this period.</td></tr>`;
    } else {
      itemTableBody.innerHTML = itemSortedList.map(i => `
        <tr>
          <td style="font-weight: 700; color: var(--text-dark);">${i.name}</td>
          <td style="color: var(--text-muted); font-weight: 600;">${currency}${i.price.toFixed(0)}</td>
          <td><span style="font-weight: 800; color: #2563eb; background: #eff6ff; border: 1px solid #bfdbfe; padding: 2px 8px; border-radius: 10px;">${i.quantity} sold</span></td>
          <td style="text-align: right; font-weight: 800; color: #ebb036;">${currency}${i.gross.toFixed(2)}</td>
        </tr>
      `).join("");
    }

    // 7. Payment collection split
    const paySplitCounts = { UPI: 0, Cash: 0, Card: 0 };
    const paySplitAmounts = { UPI: 0, Cash: 0, Card: 0 };

    filteredValidOrders.forEach(o => {
      paySplitCounts[o.paymentMethod]++;
      paySplitAmounts[o.paymentMethod] += o.total;
    });

    const payTableBody = document.getElementById("rep-payment-split-tbody");
    payTableBody.innerHTML = ["UPI", "Cash", "Card"].map(mode => `
      <tr>
        <td style="font-weight: 700; padding: 12px 18px; color: var(--text-dark);"><i class="fa-solid fa-circle" style="color: ${mode === 'UPI' ? '#2563eb' : mode==='Cash' ? '#10b981' : '#6366f1'}; font-size: 8px; margin-right: 8px;"></i> ${mode}</td>
        <td style="padding: 12px 18px; color: var(--text-muted); font-weight: 600;">${paySplitCounts[mode]} transactions</td>
        <td style="text-align: right; font-weight: 800; color: #2563eb; padding: 12px 18px;">${currency}${paySplitAmounts[mode].toFixed(2)}</td>
      </tr>
    `).join("");

    // Render Charts
    this.renderReportsCharts(filteredValidOrders, categories, products);
  },

  renderReportsCharts(orders, categories, products) {
    const textMuted = '#64748b';
    const bgDarker = '#edf1f7';
    const borderColor = 'rgba(202, 213, 226, 0.6)';

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

    // Create a linear gradient for the line chart fill in Royal Blue
    const fillGradient = curveCtx.createLinearGradient(0, 0, 0, 260);
    fillGradient.addColorStop(0, 'rgba(37, 99, 235, 0.20)');
    fillGradient.addColorStop(1, 'rgba(37, 99, 235, 0.00)');

    this.salesTrendChart = new Chart(curveCtx, {
      type: "line",
      data: {
        labels: datesLabel,
        datasets: [
          {
            label: "Sales Revenue (₹)",
            data: salesDataPoints,
            borderColor: "#2563eb",
            backgroundColor: fillGradient,
            borderWidth: 3,
            fill: true,
            tension: 0.25,
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
          legend: { labels: { color: textMuted, font: { family: "Outfit", size: 12, weight: "bold" } } },
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
            backgroundColor: pieData.length === 0 ? [borderColor] : ["#2563eb", "#10b981", "#6366f1", "#0284c7", "#f59e0b", "#ec4899", "#8b5cf6", "#14b8a6", "#64748b"],
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
            labels: { color: textMuted, font: { family: "Outfit", size: 12, weight: "bold" }, padding: 12 }
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
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
