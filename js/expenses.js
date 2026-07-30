// Crust & Chilly POS - Overhead Expenses Module
// Tracks business operating costs including raw materials, salaries, utility bills, and delivery expenses.

window.views = window.views || {};
window.views.expenses = {
  selectedCategory: "all",

  init(container) {
    container.innerHTML = `
      <div class="view-animate" style="display: flex; flex-direction: column; gap: 16px;">
        
        <!-- Overhead stats & action bar -->
        <div class="flex-space" style="background: var(--bg-darker); padding: 12px 20px; border-radius: var(--border-radius-lg); border: 1px solid var(--border-color);">
          <div class="flex-gap-sm">
            <span style="font-size: 13px; font-weight: 600; color: var(--text-muted);">Category Filter:</span>
            <select id="expense-cat-filter" class="customer-input" style="width: 180px; height: 32px; padding: 4px 8px; font-size: 13px;">
              <option value="all">All Expense Categories</option>
              <option value="Raw material">Raw material</option>
              <option value="Electricity">Electricity</option>
              <option value="Salary">Salary</option>
              <option value="Delivery">Delivery</option>
              <option value="Other expenses">Other expenses</option>
            </select>
            <div style="font-size: 14px; font-weight: 700; color: #fff; margin-left: 10px;">
              Total: <span id="expense-filter-sum" style="color: #ff4b2b;">₹0.00</span>
            </div>
          </div>
          <button class="btn btn-primary" id="btn-log-new-expense">
            <i class="fa-solid fa-plus-circle"></i> Log Expense Transaction
          </button>
        </div>

        <!-- Expenses List View -->
        <div class="table-container view-animate">
          <table class="premium-table">
            <thead>
              <tr>
                <th>Expense ID</th>
                <th>Category</th>
                <th>Description Details</th>
                <th>Date Logged</th>
                <th>Amount Paid</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="expenses-table-body">
              <!-- Injected dynamically -->
            </tbody>
          </table>
        </div>
      </div>
    `;

    this.setupListeners();
    this.render();
  },

  setupListeners() {
    const filter = document.getElementById("expense-cat-filter");
    filter.onchange = (e) => {
      this.selectedCategory = e.target.value;
      this.render();
    };

    document.getElementById("btn-log-new-expense").onclick = () => {
      this.openLogExpenseModal();
    };
  },

  render() {
    const expenses = window.db.get("expenses") || [];
    const settings = window.db.get("settings") || {};
    const currency = settings.currencySymbol || "₹";

    // Filter
    let filtered = expenses;
    if (this.selectedCategory !== "all") {
      filtered = expenses.filter(e => e.category === this.selectedCategory);
    }

    // Compute sum
    const totalSum = filtered.reduce((sum, e) => sum + e.amount, 0);
    document.getElementById("expense-filter-sum").textContent = `${currency}${totalSum.toFixed(2)}`;

    const tbody = document.getElementById("expenses-table-body");
    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 40px;">
            No expenses logged under this category.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(exp => {
      const date = new Date(exp.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
      
      let categoryColor = "color-pending";
      if (exp.category === "Raw material") categoryColor = "color-completed";
      if (exp.category === "Electricity") categoryColor = "color-preparing";
      if (exp.category === "Salary") categoryColor = "color-ready";

      return `
        <tr>
          <td style="font-weight: 700;">${exp.id}</td>
          <td>
            <span class="badge" style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); color: var(--text-muted);">
              ${exp.category}
            </span>
          </td>
          <td>${exp.description || 'N/A'}</td>
          <td>${date}</td>
          <td style="font-weight: 700; color: #ff4b2b;">${currency}${exp.amount.toFixed(2)}</td>
          <td>
            <button class="btn btn-danger btn-delete-expense" data-id="${exp.id}" style="padding: 4px 8px; font-size: 11px;">
              <i class="fa-solid fa-trash-can"></i> Delete
            </button>
          </td>
        </tr>
      `;
    }).join("");

    // Bind delete expense actions
    tbody.querySelectorAll(".btn-delete-expense").forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-id");
        if (confirm("Are you sure you want to delete this expense log? It will be removed from accounts.")) {
          window.db.deleteExpense(id);
          window.showToast("Expense entry deleted.", "info");
          this.render();
        }
      };
    });
  },

  openLogExpenseModal() {
    const formHtml = `
      <div class="form-group">
        <label class="form-label" for="exp-modal-cat">Overhead Category</label>
        <select id="exp-modal-cat" class="form-select">
          <option value="Daily expense">Daily expense</option>
          <option value="Electricity">Electricity</option>
          <option value="Raw material">Raw material</option>
          <option value="Salary">Salary</option>
          <option value="Delivery">Delivery</option>
          <option value="Other expenses">Other expenses</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label" for="exp-modal-amt">Amount Paid (₹)</label>
        <input type="number" id="exp-modal-amt" class="form-input" placeholder="e.g. 1500" required>
      </div>
      <div class="form-group">
        <label class="form-label" for="exp-modal-desc">Description Details</label>
        <input type="text" id="exp-modal-desc" class="form-input" placeholder="e.g. Electricity bill for July" required>
      </div>
    `;

    window.customModal.show({
      title: "Log Expense Transaction",
      bodyHtml: formHtml,
      confirmText: "Save Transaction",
      onConfirm: () => {
        const cat = document.getElementById("exp-modal-cat").value;
        const amt = document.getElementById("exp-modal-amt").value;
        const desc = document.getElementById("exp-modal-desc").value.trim();

        if (!amt || isNaN(amt) || Number(amt) <= 0) {
          window.showToast("Please enter a valid amount.", "error");
          return false;
        }

        window.db.createExpense({
          category: cat,
          amount: Number(amt),
          description: desc
        });

        window.showToast("Expense recorded in dashboard stats.", "success");
        this.render();
      }
    });
  }
};
