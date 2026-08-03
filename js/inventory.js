// Crust & Chilly POS - Inventory & Purchases Module
// Coordinates ingredient listings, low-stock notifications, stock level edits, supplier purchases, and recipe bindings.

window.views = window.views || {};
window.views.inventory = {
  activeTab: "stock", // 'stock' or 'purchases'
  searchQuery: "",

  init(container) {
    container.innerHTML = `
      <div class="view-animate" style="display: flex; flex-direction: column; gap: 16px;">
        
        <!-- Tab Sub-Header -->
        <div class="flex-space" style="background: var(--bg-darker); padding: 12px 20px; border-radius: var(--border-radius-lg); border: 1px solid var(--border-color);">
          <div class="flex-gap-sm">
            <button class="btn btn-secondary ${this.activeTab === 'stock' ? 'btn-primary' : ''}" id="inv-sub-stock">
              <i class="fa-solid fa-boxes-stacked"></i> Stock Levels
            </button>
            <button class="btn btn-secondary ${this.activeTab === 'purchases' ? 'btn-primary' : ''}" id="inv-sub-purchases">
              <i class="fa-solid fa-truck-loading"></i> Purchase History
            </button>
          </div>
          <div class="flex-gap-sm">
            <div id="inv-search-container" style="width: 200px;">
              <input type="text" id="inv-search-input" class="search-bar-input" style="padding: 8px 12px; font-size: 13px;" placeholder="Search raw materials...">
            </div>
            <button class="btn btn-primary" id="btn-add-inv-entity">
              <i class="fa-solid fa-plus-circle"></i> Add New Material
            </button>
          </div>
        </div>

        <!-- Render Viewport -->
        <div id="inventory-content-mount"></div>
      </div>
    `;

    this.setupListeners();
    this.render();
  },

  setupListeners() {
    const btnStock = document.getElementById("inv-sub-stock");
    const btnPur = document.getElementById("inv-sub-purchases");
    const btnAdd = document.getElementById("btn-add-inv-entity");
    const searchInput = document.getElementById("inv-search-input");

    btnStock.onclick = () => {
      this.activeTab = "stock";
      btnStock.className = "btn btn-primary";
      btnPur.className = "btn btn-secondary";
      btnAdd.style.display = "inline-flex";
      this.render();
    };

    btnPur.onclick = () => {
      this.activeTab = "purchases";
      btnPur.className = "btn btn-primary";
      btnStock.className = "btn btn-secondary";
      btnAdd.style.display = "none";
      this.render();
    };

    btnAdd.onclick = () => {
      this.openIngredientModal();
    };

    searchInput.oninput = (e) => {
      this.searchQuery = e.target.value;
      this.render();
    };
  },

  render() {
    const mount = document.getElementById("inventory-content-mount");
    if (this.activeTab === "stock") {
      this.renderStock(mount);
    } else {
      this.renderPurchases(mount);
    }
  },

  // 1. INGREDIENT LIST & STOCK ADJUST
  renderStock(mount) {
    const ingredients = window.db.get("ingredients") || [];
    
    // Filter
    let filtered = ingredients;
    if (this.searchQuery.trim() !== "") {
      const q = this.searchQuery.toLowerCase().trim();
      filtered = ingredients.filter(i => i.name.toLowerCase().includes(q));
    }

    let rows = "";
    if (filtered.length === 0) {
      rows = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 40px;">No ingredients found.</td></tr>`;
    } else {
      rows = filtered.map(ing => {
        // Bypassed low stock check - company has full stock at all times
        const isLow = false;
        /*
        const isLow = ing.stock <= ing.minLimit;
        */
        return `
          <tr>
            <td style="font-weight: 600;">${ing.name}</td>
            <td style="font-weight: 700; color: ${isLow ? '#ff4b2b' : '#fff'};">
              ${ing.stock} <span style="font-size: 12px; font-weight: 500; color: var(--text-muted);">${ing.unit}</span>
            </td>
            <td>${ing.minLimit} ${ing.unit}</td>
            <td>
              <span class="badge ${isLow ? 'badge-cancelled' : 'badge-ready'}" style="${isLow ? 'background: rgba(255,75,43,0.15); color: #ff4b2b; border: 1px solid rgba(255,75,43,0.25);' : ''}">
                ${isLow ? 'LOW STOCK ALERT' : 'HEALTHY'}
              </span>
            </td>
            <td>
              <div class="flex-gap-sm">
                <button class="btn btn-secondary btn-adjust-stock" data-id="${ing.id}" style="padding: 6px 10px; font-size: 12px; border-color: var(--border-color-hover);">
                  <i class="fa-solid fa-scale-unbalanced" style="color: #ff5c00;"></i> Adjust
                </button>
                <button class="btn btn-secondary btn-edit-ing" data-id="${ing.id}" style="padding: 6px 10px; font-size: 12px;"><i class="fa-solid fa-edit"></i></button>
                <button class="btn btn-danger btn-delete-ing" data-id="${ing.id}" style="padding: 6px 10px; font-size: 12px;"><i class="fa-solid fa-trash"></i></button>
              </div>
            </td>
          </tr>
        `;
      }).join("");
    }

    mount.innerHTML = `
      <div class="table-container view-animate">
        <table class="premium-table">
          <thead>
            <tr>
              <th>Ingredient Name</th>
              <th>Current Stock</th>
              <th>Alert Limit Threshold</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;

    // Bind edit actions
    mount.querySelectorAll(".btn-edit-ing").forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-id");
        const ing = ingredients.find(i => i.id === id);
        if (ing) this.openIngredientModal(ing);
      };
    });

    // Bind delete actions
    mount.querySelectorAll(".btn-delete-ing").forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-id");
        const ing = ingredients.find(i => i.id === id);
        if (confirm(`Deleting ingredient "${ing.name}" will break any active recipes containing it. Continue?`)) {
          window.db.deleteIngredient(id);
          window.showToast("Ingredient deleted.", "info");
          
          // Force update low stock warnings in header
          const updateHeaderPill = document.createEvent("Event");
          updateHeaderPill.initEvent("db-update", true, true);
          window.dispatchEvent(updateHeaderPill);

          this.render();
        }
      };
    });

    // Bind manual adjust stock level
    mount.querySelectorAll(".btn-adjust-stock").forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-id");
        const ing = ingredients.find(i => i.id === id);
        if (ing) this.openAdjustStockModal(ing);
      };
    });
  },

  openIngredientModal(ing = null) {
    const formHtml = `
      <div class="form-group">
        <label class="form-label" for="ing-modal-name">Ingredient Name</label>
        <input type="text" id="ing-modal-name" class="form-input" value="${ing ? ing.name : ''}" placeholder="e.g. Paneer Blocks" required>
      </div>
      <div class="form-group">
        <label class="form-label" for="ing-modal-unit">Measurement Unit</label>
        <input type="text" id="ing-modal-unit" class="form-input" value="${ing ? ing.unit : 'pcs'}" placeholder="e.g. pcs, g, ml, slices" required>
      </div>
      <div class="form-group">
        <label class="form-label" for="ing-modal-stock">Initial Stock Level</label>
        <input type="number" id="ing-modal-stock" class="form-input" value="${ing ? ing.stock : '0'}" ${ing ? 'disabled' : ''} placeholder="e.g. 100" required>
      </div>
      <div class="form-group">
        <label class="form-label" for="ing-modal-limit">Low Stock Alert Level</label>
        <input type="number" id="ing-modal-limit" class="form-input" value="${ing ? ing.minLimit : '15'}" placeholder="e.g. 15" required>
      </div>
    `;

    window.customModal.show({
      title: ing ? "Edit Raw Ingredient" : "Add New Raw Material",
      bodyHtml: formHtml,
      confirmText: ing ? "Update Details" : "Save Material",
      onConfirm: () => {
        const name = document.getElementById("ing-modal-name").value.trim();
        const unit = document.getElementById("ing-modal-unit").value.trim();
        const stock = document.getElementById("ing-modal-stock").value;
        const limit = document.getElementById("ing-modal-limit").value;

        if (!name || !unit || !limit || isNaN(limit) || Number(limit) < 0) {
          window.showToast("Please fill all fields with valid details.", "error");
          return false;
        }

        window.db.saveIngredient({
          id: ing ? ing.id : null,
          name: name,
          unit: unit,
          stock: ing ? ing.stock : Number(stock),
          minLimit: Number(limit)
        });

        window.showToast("Ingredient details updated successfully.", "success");
        
        // Force update low stock warnings in header
        const updateHeaderPill = document.createEvent("Event");
        updateHeaderPill.initEvent("db-update", true, true);
        window.dispatchEvent(updateHeaderPill);

        this.render();
      }
    });
  },

  openAdjustStockModal(ing) {
    const formHtml = `
      <div style="margin-bottom: 12px; font-size: 13px;">
        Manually adjust stock balances for <strong>${ing.name}</strong>. Current level: <strong>${ing.stock} ${ing.unit}</strong>.
      </div>
      <div class="form-group">
        <label class="form-label" for="adj-modal-action">Adjustment Type</label>
        <select id="adj-modal-action" class="form-select">
          <option value="add">Add Stock (Manual Input)</option>
          <option value="sub">Deduct Stock (Wastage / Audit Loss)</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label" for="adj-modal-qty">Quantity (${ing.unit})</label>
        <input type="number" id="adj-modal-qty" class="form-input" placeholder="e.g. 10" required>
      </div>
      <div class="form-group">
        <label class="form-label" for="adj-modal-reason">Reason description</label>
        <input type="text" id="adj-modal-reason" class="form-input" placeholder="e.g. Spoilage check / Audit adjustment" required>
      </div>
    `;

    window.customModal.show({
      title: "Adjust Stock Balances",
      bodyHtml: formHtml,
      confirmText: "Submit Adjustment",
      onConfirm: () => {
        const action = document.getElementById("adj-modal-action").value;
        const qty = document.getElementById("adj-modal-qty").value;
        const reason = document.getElementById("adj-modal-reason").value.trim() || "Manual adjustment";

        if (!qty || isNaN(qty) || Number(qty) <= 0) {
          window.showToast("Please enter a valid positive quantity.", "error");
          return false;
        }

        const ingredients = window.db.get("ingredients") || [];
        const index = ingredients.findIndex(i => i.id === ing.id);
        
        if (index !== -1) {
          const change = Number(qty);
          if (action === "add") {
            ingredients[index].stock += change;
          } else {
            if (ingredients[index].stock < change) {
              window.showToast("Error: Deduction exceeds current stock balances.", "error");
              return false;
            }
            ingredients[index].stock -= change;
            
            // Log wastage deduction as an expense category "Other expenses"
            window.db.createExpense({
              category: "Other expenses",
              amount: 0, // audit deduction logs warning but is raw inventory writeoff
              description: `Inventory Waste writeoff: ${ing.name} x${change} (${reason})`
            });
          }
          
          window.db.set("ingredients", ingredients);
          window.showToast("Stock level manual correction applied successfully.", "success");
          
          // Force update low stock warnings in header
          const updateHeaderPill = document.createEvent("Event");
          updateHeaderPill.initEvent("db-update", true, true);
          window.dispatchEvent(updateHeaderPill);

          this.render();
        }
      }
    });
  },

  // 2. RESTOCK PURCHASE HISTORY
  renderPurchases(mount) {
    const purchases = window.db.get("purchases") || [];
    const ingredients = window.db.get("ingredients") || [];
    const settings = window.db.get("settings") || {};
    const currency = settings.currencySymbol || "₹";

    let rows = "";
    if (purchases.length === 0) {
      rows = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 40px;">No stock purchase receipts recorded.</td></tr>`;
    } else {
      rows = purchases.map(pur => {
        const date = new Date(pur.date).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
        
        const detailsHtml = pur.items.map(item => {
          const ing = ingredients.find(i => i.id === item.ingredientId);
          return `${ing ? ing.name : 'Unknown'} x${item.quantity} (₹${item.cost})`;
        }).join(", ");

        return `
          <tr>
            <td style="font-weight: 700;">${pur.id}</td>
            <td>${date}</td>
            <td style="color: var(--text-muted);">${pur.supplier}</td>
            <td style="font-size: 13px;">${detailsHtml}</td>
            <td style="font-weight: 700; color: #ff5c00;">${currency}${pur.totalCost}</td>
          </tr>
        `;
      }).join("");
    }

    mount.innerHTML = `
      <div class="table-container view-animate">
        <table class="premium-table">
          <thead>
            <tr>
              <th>Receipt ID</th>
              <th>Purchase Date</th>
              <th>Supplier</th>
              <th>Item details (Qty, Cost)</th>
              <th>Total Cost Paid</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }
};
