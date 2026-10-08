// Crust & Chilly POS - Advanced Executive Menu Management & Recipe Engineering Suite
// Features: Catalog Metrics, Accurate Food Costing (COGS Benchmark & Custom Cost Price),
// Visual Grid/Table Switcher, BOGO Controls, POS Stock Toggles, Recipe Inventory Deduction Matrix,
// Bulk Price Modifier, CSV Export & Price Sheet Printing.

window.views = window.views || {};
window.views.menu = {
  activeTab: "products", // 'products' | 'categories' | 'permissions'
  searchQuery: "",
  selectedCategory: "all",
  statusFilter: "all", // 'all' | 'in-stock' | 'out-of-stock' | 'bogo' | 'veg' | 'recipe-set' | 'recipe-missing'
  sortBy: "name-asc", // 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'margin-desc' | 'recipe-desc'
  viewMode: "table", // 'table' | 'grid'
  benchmarkCogsPercent: 32, // Default 32% Food Cost / COGS benchmark matching Reports suite

  // Ingredient standard unit reference costs (INR) for warehouse stock valuation
  ingredientCostMap: {
    ing1: 8.0,    // Burger Bun
    ing2: 12.0,   // Veg Patty
    ing3: 14.0,   // Cheese Slice
    ing4: 3.0,    // Sandwich Bread (per slice)
    ing5: 7.0,    // Frankie Roti
    ing6: 0.04,   // Raw Potatoes (per g) -> Rs 40/kg
    ing7: 14.0,   // Maggi Packet
    ing8: 0.08,   // Mint Leaves (per g)
    ing9: 5.0,    // Lime Fruit
    ing10: 0.03,  // Soda Water (per ml)
    ing11: 30.0,  // Soft Drink Can
    ing12: 0.40,  // Paneer Blocks (per g) -> Rs 400/kg
    ing13: 0.15,  // Mayonnaise (per ml)
    ing14: 0.15   // Chili Sauce (per ml)
  },

  // Calculate accurate plate cost & gross profit margin for a product
  calculateProductCost(product) {
    const price = Number(product.price) || 0;
    const settings = window.db.get("settings") || {};
    const benchmarkRate = (this.benchmarkCogsPercent || settings.cogsPercent || 32) / 100;

    let foodCost = 0;
    let isCustom = false;

    // 1. If explicit cost price is configured on the item by the manager, use it
    if (product.costPrice !== undefined && product.costPrice !== null && product.costPrice !== "" && !isNaN(product.costPrice) && Number(product.costPrice) > 0) {
      foodCost = Number(product.costPrice);
      isCustom = true;
    } else {
      // 2. Realistic standard restaurant Food Cost benchmark (32% matching Sales & Profit Reports)
      foodCost = Math.round(price * benchmarkRate * 100) / 100;
    }

    const grossProfit = Math.max(0, price - foodCost);
    const marginPct = price > 0 ? Math.round((grossProfit / price) * 100) : (100 - this.benchmarkCogsPercent);

    let marginTier = "med";
    if (marginPct >= 65) marginTier = "high";
    else if (marginPct < 50) marginTier = "warn";

    const recipe = product.recipe || {};
    const recipeKeys = Object.keys(recipe);

    return {
      foodCost: Math.round(foodCost * 100) / 100,
      grossProfit: Math.round(grossProfit * 100) / 100,
      marginPct,
      marginTier,
      isCustom,
      hasRecipe: recipeKeys.length > 0,
      recipeCount: recipeKeys.length
    };
  },

  init(container) {
    const products = window.db.get("products") || [];
    const categories = window.db.get("categories") || [];
    const currentUser = window.db.getCurrentUser() || {};
    const isAdmin = currentUser.role === "admin";

    container.innerHTML = `
      <div class="view-animate" style="display: flex; flex-direction: column; gap: 16px;">
        
        <!-- Header & Navigation Bar -->
        <div class="glass-card" style="padding: 12px 18px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <button class="btn ${this.activeTab === 'products' ? 'btn-primary' : 'btn-secondary'}" id="menu-sub-products" style="height: 38px; border-radius: 12px; padding: 0 16px; font-weight: 800; font-size: 12.5px; display: inline-flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-burger"></i> Menu Catalog (${products.length})
            </button>
            <button class="btn ${this.activeTab === 'categories' ? 'btn-primary' : 'btn-secondary'}" id="menu-sub-categories" style="height: 38px; border-radius: 12px; padding: 0 16px; font-weight: 800; font-size: 12.5px; display: inline-flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-tags"></i> Food Categories (${categories.length})
            </button>
            ${isAdmin ? `
            <button class="btn ${this.activeTab === 'permissions' ? 'btn-primary' : 'btn-secondary'}" id="menu-sub-permissions" style="height: 38px; border-radius: 12px; padding: 0 16px; font-weight: 800; font-size: 12.5px; display: inline-flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-user-shield"></i> Role Permissions Matrix
            </button>
            ` : ""}
          </div>
          
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            ${this.activeTab === 'products' ? `
            <button class="btn btn-secondary" id="btn-menu-bulk-tools" title="Bulk Price Modifier & Quick Actions" style="height: 38px; border-radius: 12px; padding: 0 12px; font-weight: 800; font-size: 12px; display: inline-flex; align-items: center; gap: 5px;">
              <i class="fa-solid fa-bolt" style="color: #d97706;"></i> Bulk Tools
            </button>
            <button class="btn btn-secondary" id="btn-menu-export-csv" title="Download Menu Catalog as CSV" style="height: 38px; border-radius: 12px; padding: 0 12px; font-weight: 800; font-size: 12px; display: inline-flex; align-items: center; gap: 5px;">
              <i class="fa-solid fa-file-csv" style="color: #059669;"></i> Export CSV
            </button>
            <button class="btn btn-secondary" id="btn-menu-print-sheet" title="Print Restaurant Menu & Price List" style="height: 38px; border-radius: 12px; padding: 0 12px; font-weight: 800; font-size: 12px; display: inline-flex; align-items: center; gap: 5px;">
              <i class="fa-solid fa-print" style="color: #2563eb;"></i> Print Menu
            </button>
            ` : ""}

            <button class="btn btn-primary" id="btn-add-menu-entity" style="display: ${this.activeTab === 'permissions' ? 'none' : 'inline-flex'}; height: 38px; border-radius: 12px; padding: 0 18px; font-weight: 800; font-size: 12.5px; align-items: center; gap: 6px;">
              <i class="fa-solid fa-plus"></i> <span id="btn-add-text">${this.activeTab === 'categories' ? 'Add Category' : 'Add Product'}</span>
            </button>
          </div>
        </div>

        <!-- Render Mount Container -->
        <div id="menu-content-mount"></div>
      </div>
    `;

    this.setupListeners();
    this.render();
  },

  setupListeners() {
    const btnProd = document.getElementById("menu-sub-products");
    const btnCat = document.getElementById("menu-sub-categories");
    const btnPerm = document.getElementById("menu-sub-permissions");
    const btnAdd = document.getElementById("btn-add-menu-entity");
    const addText = document.getElementById("btn-add-text");
    const btnBulk = document.getElementById("btn-menu-bulk-tools");
    const btnExport = document.getElementById("btn-menu-export-csv");
    const btnPrint = document.getElementById("btn-menu-print-sheet");

    const updateTabUI = () => {
      if (btnProd) btnProd.className = this.activeTab === "products" ? "btn btn-primary" : "btn btn-secondary";
      if (btnCat) btnCat.className = this.activeTab === "categories" ? "btn btn-primary" : "btn btn-secondary";
      if (btnPerm) btnPerm.className = this.activeTab === "permissions" ? "btn btn-primary" : "btn btn-secondary";

      if (btnAdd) {
        btnAdd.style.display = this.activeTab === "permissions" ? "none" : "inline-flex";
        if (addText) addText.textContent = this.activeTab === "categories" ? "Add Category" : "Add Product";
      }

      if (btnBulk) btnBulk.style.display = this.activeTab === "products" ? "inline-flex" : "none";
      if (btnExport) btnExport.style.display = this.activeTab === "products" ? "inline-flex" : "none";
      if (btnPrint) btnPrint.style.display = this.activeTab === "products" ? "inline-flex" : "none";

      this.render();
    };

    if (btnProd) {
      btnProd.onclick = () => {
        this.activeTab = "products";
        updateTabUI();
      };
    }

    if (btnCat) {
      btnCat.onclick = () => {
        this.activeTab = "categories";
        updateTabUI();
      };
    }

    if (btnPerm) {
      btnPerm.onclick = () => {
        this.activeTab = "permissions";
        updateTabUI();
      };
    }

    if (btnAdd) {
      btnAdd.onclick = () => {
        if (this.activeTab === "products") {
          this.openProductModal();
        } else if (this.activeTab === "categories") {
          this.openCategoryModal();
        }
      };
    }

    if (btnBulk) {
      btnBulk.onclick = () => this.openBulkOperationsModal();
    }

    if (btnExport) {
      btnExport.onclick = () => this.exportMenuCSV();
    }

    if (btnPrint) {
      btnPrint.onclick = () => this.printMenuPriceList();
    }
  },

  render() {
    const mount = document.getElementById("menu-content-mount");
    if (!mount) return;

    if (this.activeTab === "products") {
      this.renderProducts(mount);
    } else if (this.activeTab === "categories") {
      this.renderCategories(mount);
    } else if (this.activeTab === "permissions") {
      this.renderPermissions(mount);
    }
  },

  // =========================================================================
  // 1. PRODUCTS MANAGEMENT & CATALOG ENGINEERING
  // =========================================================================
  renderProducts(mount) {
    const products = window.db.get("products") || [];
    const categories = window.db.get("categories") || [];
    const settings = window.db.get("settings") || {};
    const currency = settings.currencySymbol || "₹";

    // Compute Executive Scorecard Metrics
    const totalCount = products.length;
    const availableCount = products.filter(p => p.available !== false).length;
    const outOfStockCount = totalCount - availableCount;
    const bogoCount = products.filter(p => p.bogo === true).length;
    const vegCount = products.filter(p => p.veg !== false).length;

    // Pricing & Margin Stats
    let totalPriceSum = 0;
    let minPrice = Infinity;
    let maxPrice = 0;
    let totalMarginSum = 0;
    let totalFoodCostSum = 0;
    let customCostCount = 0;
    let recipesMappedCount = 0;

    products.forEach(p => {
      const price = Number(p.price) || 0;
      totalPriceSum += price;
      if (price < minPrice) minPrice = price;
      if (price > maxPrice) maxPrice = price;

      const costInfo = this.calculateProductCost(p);
      totalMarginSum += costInfo.marginPct;
      totalFoodCostSum += costInfo.foodCost;
      if (costInfo.isCustom) customCostCount++;
      if (costInfo.hasRecipe) recipesMappedCount++;
    });

    const avgPrice = totalCount > 0 ? (totalPriceSum / totalCount).toFixed(1) : "0";
    const avgMargin = totalCount > 0 ? Math.round(totalMarginSum / totalCount) : (100 - this.benchmarkCogsPercent);
    const avgCost = totalCount > 0 ? (totalFoodCostSum / totalCount).toFixed(1) : "0";
    const inStockPct = totalCount > 0 ? Math.round((availableCount / totalCount) * 100) : 0;

    // Filter Products
    let filtered = [...products];

    // Category filter
    if (this.selectedCategory !== "all") {
      filtered = filtered.filter(p => p.category === this.selectedCategory);
    }

    // Status / Dietary Chip Filter
    if (this.statusFilter === "in-stock") {
      filtered = filtered.filter(p => p.available !== false);
    } else if (this.statusFilter === "out-of-stock") {
      filtered = filtered.filter(p => p.available === false);
    } else if (this.statusFilter === "bogo") {
      filtered = filtered.filter(p => p.bogo === true);
    } else if (this.statusFilter === "veg") {
      filtered = filtered.filter(p => p.veg !== false);
    } else if (this.statusFilter === "recipe-set") {
      filtered = filtered.filter(p => p.recipe && Object.keys(p.recipe).length > 0);
    } else if (this.statusFilter === "recipe-missing") {
      filtered = filtered.filter(p => !p.recipe || Object.keys(p.recipe).length === 0);
    }

    // Search query filter
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(p => {
        const cat = categories.find(c => c.id === p.category);
        const catName = cat ? cat.name.toLowerCase() : "";
        const idMatch = (p.id || "").toLowerCase().includes(q);
        const nameMatch = (p.name || "").toLowerCase().includes(q);
        return idMatch || nameMatch || catName.includes(q);
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      const costA = this.calculateProductCost(a);
      const costB = this.calculateProductCost(b);
      switch (this.sortBy) {
        case "name-asc":
          return (a.name || "").localeCompare(b.name || "");
        case "name-desc":
          return (b.name || "").localeCompare(a.name || "");
        case "price-asc":
          return (a.price || 0) - (b.price || 0);
        case "price-desc":
          return (b.price || 0) - (a.price || 0);
        case "margin-desc":
          return costB.marginPct - costA.marginPct;
        case "recipe-desc":
          return costB.recipeCount - costA.recipeCount;
        default:
          return 0;
      }
    });

    // Build Category Filter Pills HTML
    const catPillsHtml = `
      <div class="menu-cat-pills-bar" style="display: flex; gap: 6px; overflow-x: auto; padding: 4px 2px; -webkit-overflow-scrolling: touch; flex-wrap: nowrap;">
        <button type="button" class="menu-cat-pill ${this.selectedCategory === 'all' ? 'active' : ''}" data-cat="all">
          <i class="fa-solid fa-border-all" style="font-size: 10px; margin-right: 4px;"></i> All Items (${products.length})
        </button>
        ${categories.map(c => {
          const cCount = products.filter(p => p.category === c.id).length;
          const isActive = this.selectedCategory === c.id;
          return `
            <button type="button" class="menu-cat-pill ${isActive ? 'active' : ''}" data-cat="${c.id}">
              <i class="fa-solid fa-tag" style="font-size: 10px; margin-right: 4px;"></i> ${c.name} (${cCount})
            </button>
          `;
        }).join("")}
      </div>
    `;

    // Render Table Rows
    let rowsHtml = "";
    if (filtered.length === 0) {
      rowsHtml = `
        <tr>
          <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 40px; font-weight: 600;">
            <i class="fa-solid fa-burger" style="font-size: 32px; opacity: 0.3; display: block; margin-bottom: 8px;"></i>
            No menu products match the selected filters or search keyword.
          </td>
        </tr>
      `;
    } else {
      rowsHtml = filtered.map(p => {
        const cat = categories.find(c => c.id === p.category);
        const costInfo = this.calculateProductCost(p);
        const isAvail = p.available !== false;
        const isBogo = p.bogo === true;
        const isVeg = p.veg !== false;

        return `
          <tr class="${!isAvail ? 'table-row-dimmed' : ''}">
            <td>
              <div style="display: flex; align-items: center; gap: 10px;">
                <div class="menu-diet-box ${isVeg ? 'veg' : 'non-veg'}" title="${isVeg ? 'Pure Vegetarian' : 'Non-Vegetarian'}">
                  <div class="menu-diet-dot"></div>
                </div>
                <div>
                  <div style="font-weight: 800; color: var(--text-dark); font-size: 13.5px;">${p.name}</div>
                  <div style="font-size: 11px; color: var(--text-muted); display: flex; align-items: center; gap: 6px;">
                    <code>${p.id}</code>
                    <span>•</span>
                    <span style="color: #2563eb; font-weight: 700;">${cat ? cat.name : 'Unassigned'}</span>
                  </div>
                </div>
              </div>
            </td>

            <td>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="font-weight: 900; color: var(--text-dark); font-size: 14px;">
                  ${currency}${Number(p.price || 0).toFixed(2)}
                </span>
                <button class="btn btn-secondary btn-quick-price" data-id="${p.id}" data-price="${p.price}" title="Quick Edit Selling Price" style="padding: 2px 6px; font-size: 10px; border-radius: 6px;">
                  <i class="fa-solid fa-pen"></i>
                </button>
              </div>
            </td>

            <td>
              <div style="display: flex; flex-direction: column; gap: 3px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span class="menu-margin-badge ${costInfo.marginTier}">
                    <i class="fa-solid fa-chart-line" style="font-size: 9px;"></i> ${costInfo.marginPct}% Margin
                  </span>
                  ${costInfo.isCustom ? `<span style="font-size: 9.5px; font-weight: 800; background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; padding: 1px 6px; border-radius: 6px;">Custom</span>` : ''}
                </div>
                <div style="font-size: 11px; color: var(--text-muted); font-weight: 600; display: flex; align-items: center; gap: 4px;">
                  <span>Cost: <strong>${currency}${costInfo.foodCost.toFixed(1)}</strong></span>
                  <button class="btn-quick-cost" data-id="${p.id}" title="Quick Edit Cost Price (₹)" style="border: none; background: transparent; cursor: pointer; color: #64748b; padding: 0 2px; font-size: 10px;">
                    <i class="fa-solid fa-pen-to-square"></i>
                  </button>
                  <span>| Profit: <strong style="color: #059669;">${currency}${costInfo.grossProfit.toFixed(1)}</strong></span>
                </div>
              </div>
            </td>

            <td>
              <button class="btn ${costInfo.hasRecipe ? 'btn-secondary' : 'btn-outline'} btn-recipe-setup" data-id="${p.id}" title="Configure Inventory Deductions" style="padding: 4px 10px; font-size: 11.5px; border-radius: 8px; font-weight: 700; display: inline-flex; align-items: center; gap: 5px;">
                <i class="fa-solid fa-mortar-pestle" style="color: ${costInfo.hasRecipe ? '#2563eb' : '#d97706'};"></i> 
                ${costInfo.hasRecipe ? `${costInfo.recipeCount} Raw Items` : '<span style="color: #d97706;">+ Inventory Map</span>'}
              </button>
            </td>

            <td>
              <label class="menu-toggle-switch" title="Toggle BOGO Offer">
                <input type="checkbox" class="toggle-bogo-chk" data-id="${p.id}" ${isBogo ? 'checked' : ''}>
                <span class="menu-toggle-slider"></span>
              </label>
              <span style="font-size: 11px; font-weight: 800; margin-left: 6px; color: ${isBogo ? '#2563eb' : 'var(--text-muted)'};">
                ${isBogo ? 'BOGO ON' : 'Off'}
              </span>
            </td>

            <td>
              <label class="menu-toggle-switch" title="Toggle item live availability in POS">
                <input type="checkbox" class="toggle-availability-chk" data-id="${p.id}" ${isAvail ? 'checked' : ''}>
                <span class="menu-toggle-slider slider-green"></span>
              </label>
              <span style="font-size: 11px; font-weight: 800; margin-left: 6px; color: ${isAvail ? '#059669' : '#dc2626'};">
                ${isAvail ? 'In Stock' : 'Out of Stock'}
              </span>
            </td>

            <td>
              <div style="display: flex; gap: 5px; align-items: center; justify-content: flex-end;">
                <button class="btn btn-secondary btn-edit-product" data-id="${p.id}" title="Edit Dish Details & Cost Price" style="padding: 5px 8px; font-size: 11.5px; border-radius: 8px;">
                  <i class="fa-solid fa-pen-to-square" style="color: #2563eb;"></i>
                </button>
                <button class="btn btn-secondary btn-duplicate-product" data-id="${p.id}" title="Duplicate Item (Clone)" style="padding: 5px 8px; font-size: 11.5px; border-radius: 8px;">
                  <i class="fa-solid fa-copy" style="color: #059669;"></i>
                </button>
                <button class="btn btn-danger btn-delete-product" data-id="${p.id}" title="Delete Product" style="padding: 5px 8px; font-size: 11.5px; border-radius: 8px;">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join("");
    }

    // Render Cards Grid View
    let cardsHtml = "";
    if (filtered.length === 0) {
      cardsHtml = `
        <div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 50px; font-weight: 600;">
          <i class="fa-solid fa-burger" style="font-size: 36px; opacity: 0.3; display: block; margin-bottom: 10px;"></i>
          No products found matching filters.
        </div>
      `;
    } else {
      cardsHtml = filtered.map(p => {
        const cat = categories.find(c => c.id === p.category);
        const costInfo = this.calculateProductCost(p);
        const isAvail = p.available !== false;
        const isBogo = p.bogo === true;
        const isVeg = p.veg !== false;

        return `
          <div class="menu-item-card ${!isAvail ? 'out-of-stock' : ''}">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
              <div style="display: flex; align-items: flex-start; gap: 8px;">
                <div class="menu-diet-box ${isVeg ? 'veg' : 'non-veg'}" style="margin-top: 3px;" title="${isVeg ? 'Pure Veg' : 'Non-Veg'}">
                  <div class="menu-diet-dot"></div>
                </div>
                <div>
                  <h4 style="margin: 0; font-size: 14px; font-weight: 800; color: var(--text-dark);">${p.name}</h4>
                  <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
                    <code>${p.id}</code> • <strong style="color: #2563eb;">${cat ? cat.name : 'Unassigned'}</strong>
                  </div>
                </div>
              </div>
              <div style="font-size: 16px; font-weight: 900; color: var(--text-dark); white-space: nowrap;">
                ${currency}${Number(p.price || 0).toFixed(0)}
              </div>
            </div>

            <!-- Cost & Margin Meter -->
            <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: 10px; padding: 8px 10px;">
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px;">
                <span class="menu-margin-badge ${costInfo.marginTier}">
                  ${costInfo.marginPct}% Margin
                </span>
                <span style="color: var(--text-muted); font-weight: 700;">
                  Cost: ${currency}${costInfo.foodCost.toFixed(0)} (${costInfo.isCustom ? 'Custom' : `${this.benchmarkCogsPercent}%`})
                </span>
              </div>
              <div style="width: 100%; height: 5px; background: #e2e8f0; border-radius: 4px; overflow: hidden; margin-top: 6px;">
                <div style="width: ${costInfo.marginPct}%; height: 100%; background: ${costInfo.marginTier === 'high' ? '#059669' : costInfo.marginTier === 'med' ? '#2563eb' : '#dc2626'}; border-radius: 4px;"></div>
              </div>
            </div>

            <!-- Switches row -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 10px;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <label class="menu-toggle-switch" title="Toggle BOGO">
                  <input type="checkbox" class="toggle-bogo-chk" data-id="${p.id}" ${isBogo ? 'checked' : ''}>
                  <span class="menu-toggle-slider"></span>
                </label>
                <span style="font-size: 11px; font-weight: 700; color: ${isBogo ? '#2563eb' : 'var(--text-muted)'};">BOGO</span>
              </div>

              <div style="display: flex; align-items: center; gap: 6px;">
                <label class="menu-toggle-switch" title="Toggle In-Stock">
                  <input type="checkbox" class="toggle-availability-chk" data-id="${p.id}" ${isAvail ? 'checked' : ''}>
                  <span class="menu-toggle-slider slider-green"></span>
                </label>
                <span style="font-size: 11px; font-weight: 700; color: ${isAvail ? '#059669' : '#dc2626'};">
                  ${isAvail ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>
            </div>

            <!-- Actions footer -->
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px; border-top: 1px dashed var(--border-color); padding-top: 8px;">
              <button class="btn btn-secondary btn-recipe-setup" data-id="${p.id}" style="padding: 4px 8px; font-size: 11px; font-weight: 700; border-radius: 8px; display: inline-flex; align-items: center; gap: 4px;">
                <i class="fa-solid fa-mortar-pestle" style="color: #2563eb;"></i> Inventory (${costInfo.recipeCount})
              </button>

              <div style="display: flex; gap: 4px;">
                <button class="btn btn-secondary btn-edit-product" data-id="${p.id}" title="Edit Dish & Cost Price" style="padding: 4px 7px; font-size: 11px; border-radius: 8px;">
                  <i class="fa-solid fa-pen" style="color: #2563eb;"></i>
                </button>
                <button class="btn btn-secondary btn-duplicate-product" data-id="${p.id}" title="Duplicate Item" style="padding: 4px 7px; font-size: 11px; border-radius: 8px;">
                  <i class="fa-solid fa-copy" style="color: #059669;"></i>
                </button>
                <button class="btn btn-danger btn-delete-product" data-id="${p.id}" title="Delete" style="padding: 4px 7px; font-size: 11px; border-radius: 8px;">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </div>
            </div>
          </div>
        `;
      }).join("");
    }

    mount.innerHTML = `
      <div class="view-animate" style="display: flex; flex-direction: column; gap: 14px;">
        
        <!-- 5-Card Executive Scorecard Grid -->
        <div class="menu-kpi-grid">
          
          <!-- Card 1: Total Catalog & Availability -->
          <div class="menu-kpi-card">
            <div>
              <div class="menu-kpi-title">Catalog Inventory</div>
              <div class="menu-kpi-val">${totalCount} <span style="font-size: 14px; color: var(--text-muted); font-weight: 600;">Dishes</span></div>
              <div class="menu-kpi-sub" style="color: #059669;">
                <i class="fa-solid fa-circle-check"></i> ${availableCount} In-Stock (${inStockPct}%)
                ${outOfStockCount > 0 ? `<span style="color: #dc2626; margin-left: 4px;">• ${outOfStockCount} Out</span>` : ''}
              </div>
            </div>
            <div class="menu-kpi-icon" style="background: #eff6ff; color: #2563eb;">
              <i class="fa-solid fa-burger"></i>
            </div>
          </div>

          <!-- Card 2: Avg Price & Price Range -->
          <div class="menu-kpi-card">
            <div>
              <div class="menu-kpi-title">Catalog Valuation</div>
              <div class="menu-kpi-val">${currency}${avgPrice} <span style="font-size: 13px; color: var(--text-muted); font-weight: 600;">Avg / Dish</span></div>
              <div class="menu-kpi-sub" style="color: var(--text-muted);">
                <i class="fa-solid fa-arrows-left-right"></i> Range: ${currency}${totalCount > 0 ? minPrice : 0} - ${currency}${maxPrice}
              </div>
            </div>
            <div class="menu-kpi-icon" style="background: #ecfdf5; color: #059669;">
              <i class="fa-solid fa-indian-rupee-sign"></i>
            </div>
          </div>

          <!-- Card 3: Food Cost & Margin Calibration -->
          <div class="menu-kpi-card">
            <div>
              <div class="menu-kpi-title">Food Cost (COGS) & Margin</div>
              <div class="menu-kpi-val" style="color: #059669;">${avgMargin}% <span style="font-size: 13px; color: var(--text-muted); font-weight: 600;">Avg Profit</span></div>
              <div class="menu-kpi-sub" style="color: #b45309; display: flex; align-items: center; gap: 4px;">
                <span>${currency}${avgCost} Avg Cost (${this.benchmarkCogsPercent}% COGS)</span>
                ${customCostCount > 0 ? `<span style="color: #2563eb;">• ${customCostCount} Custom</span>` : ''}
              </div>
            </div>
            <div class="menu-kpi-icon" style="background: #f0fdf4; color: #16a34a;">
              <i class="fa-solid fa-percent"></i>
            </div>
          </div>

          <!-- Card 4: BOGO Offers -->
          <div class="menu-kpi-card">
            <div>
              <div class="menu-kpi-title">Promotions & Deals</div>
              <div class="menu-kpi-val" style="color: #2563eb;">${bogoCount} <span style="font-size: 13px; color: var(--text-muted); font-weight: 600;">BOGO Items</span></div>
              <div class="menu-kpi-sub" style="color: #b45309;">
                <i class="fa-solid fa-tag"></i> ${totalCount > 0 ? Math.round((bogoCount / totalCount) * 100) : 0}% of Menu Catalog
              </div>
            </div>
            <div class="menu-kpi-icon" style="background: #fffbeb; color: #d97706;">
              <i class="fa-solid fa-gift"></i>
            </div>
          </div>

          <!-- Card 5: Categories & Dietary -->
          <div class="menu-kpi-card">
            <div>
              <div class="menu-kpi-title">Categories & Dietary</div>
              <div class="menu-kpi-val">${categories.length} <span style="font-size: 13px; color: var(--text-muted); font-weight: 600;">Groups</span></div>
              <div class="menu-kpi-sub" style="color: #16a34a;">
                <i class="fa-solid fa-leaf"></i> ${vegCount} Pure Veg Items
              </div>
            </div>
            <div class="menu-kpi-icon" style="background: #f5f3ff; color: #7c3aed;">
              <i class="fa-solid fa-layer-group"></i>
            </div>
          </div>

        </div>

        <!-- Toolbar & Filter Engine -->
        <div class="glass-card" style="padding: 14px 18px; display: flex; flex-direction: column; gap: 12px;">
          
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
            
            <!-- Global Search -->
            <div style="position: relative; width: 260px;">
              <input type="text" id="menu-search-input" class="form-input" placeholder="Search dish name, ID, or category..." value="${this.searchQuery}" style="padding: 6px 12px 6px 32px; font-size: 12.5px; height: 36px; border-radius: 10px; width: 100%;">
              <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 10px; top: 11px; color: var(--text-muted); font-size: 12px; pointer-events: none;"></i>
            </div>

            <!-- Benchmark Food Cost Calibrator -->
            <div style="display: flex; align-items: center; gap: 6px;" title="Determines default food cost percentage across menu dishes without an explicit custom cost price">
              <span style="font-size: 11.5px; font-weight: 700; color: var(--text-muted); white-space: nowrap;">Food Cost Benchmark:</span>
              <div class="cogs-calibrator-pill" style="display: inline-flex; background: #f1f5f9; border: 1px solid var(--border-color); border-radius: 10px; padding: 2px;">
                <button type="button" class="menu-cogs-btn ${this.benchmarkCogsPercent === 28 ? 'active' : ''}" data-rate="28" style="padding: 4px 8px; border: none; background: ${this.benchmarkCogsPercent === 28 ? '#2563eb' : 'transparent'}; color: ${this.benchmarkCogsPercent === 28 ? '#fff' : 'var(--text-muted)'}; border-radius: 8px; font-size: 11px; font-weight: 800; cursor: pointer;">28%</button>
                <button type="button" class="menu-cogs-btn ${this.benchmarkCogsPercent === 30 ? 'active' : ''}" data-rate="30" style="padding: 4px 8px; border: none; background: ${this.benchmarkCogsPercent === 30 ? '#2563eb' : 'transparent'}; color: ${this.benchmarkCogsPercent === 30 ? '#fff' : 'var(--text-muted)'}; border-radius: 8px; font-size: 11px; font-weight: 800; cursor: pointer;">30%</button>
                <button type="button" class="menu-cogs-btn ${this.benchmarkCogsPercent === 32 ? 'active' : ''}" data-rate="32" style="padding: 4px 8px; border: none; background: ${this.benchmarkCogsPercent === 32 ? '#2563eb' : 'transparent'}; color: ${this.benchmarkCogsPercent === 32 ? '#fff' : 'var(--text-muted)'}; border-radius: 8px; font-size: 11px; font-weight: 800; cursor: pointer;">32%</button>
                <button type="button" class="menu-cogs-btn ${this.benchmarkCogsPercent === 35 ? 'active' : ''}" data-rate="35" style="padding: 4px 8px; border: none; background: ${this.benchmarkCogsPercent === 35 ? '#2563eb' : 'transparent'}; color: ${this.benchmarkCogsPercent === 35 ? '#fff' : 'var(--text-muted)'}; border-radius: 8px; font-size: 11px; font-weight: 800; cursor: pointer;">35%</button>
              </div>
            </div>

            <!-- Sort By Selector -->
            <div style="display: flex; align-items: center; gap: 8px;">
              <label for="menu-sort-select" style="font-size: 12px; font-weight: 700; color: var(--text-muted); white-space: nowrap;">Sort by:</label>
              <select id="menu-sort-select" class="form-select" style="height: 36px; font-size: 12px; border-radius: 10px; padding: 4px 10px; font-weight: 700;">
                <option value="name-asc" ${this.sortBy === 'name-asc' ? 'selected' : ''}>Dish Name (A - Z)</option>
                <option value="name-desc" ${this.sortBy === 'name-desc' ? 'selected' : ''}>Dish Name (Z - A)</option>
                <option value="price-asc" ${this.sortBy === 'price-asc' ? 'selected' : ''}>Price (Low to High)</option>
                <option value="price-desc" ${this.sortBy === 'price-desc' ? 'selected' : ''}>Price (High to Low)</option>
                <option value="margin-desc" ${this.sortBy === 'margin-desc' ? 'selected' : ''}>Gross Margin % (High to Low)</option>
                <option value="recipe-desc" ${this.sortBy === 'recipe-desc' ? 'selected' : ''}>Recipe Ingredients Count</option>
              </select>
            </div>

            <!-- View Switcher (Table vs Grid) -->
            <div class="menu-view-switcher">
              <button class="menu-view-btn ${this.viewMode === 'table' ? 'active' : ''}" id="btn-view-table" title="Dense Table View">
                <i class="fa-solid fa-table-list"></i> Table
              </button>
              <button class="menu-view-btn ${this.viewMode === 'grid' ? 'active' : ''}" id="btn-view-grid" title="Tile Cards Grid View">
                <i class="fa-solid fa-border-all"></i> Cards
              </button>
            </div>

            <div style="font-size: 12px; color: var(--text-muted); font-weight: 700;">
              Showing <strong style="color: var(--text-dark);">${filtered.length}</strong> of ${products.length} products
            </div>
          </div>

          <!-- Quick Status Filter Chips -->
          <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center; border-top: 1px dashed var(--border-color); padding-top: 10px;">
            <button class="menu-filter-chip ${this.statusFilter === 'all' ? 'active' : ''}" data-filter="all">
              All (${totalCount})
            </button>
            <button class="menu-filter-chip ${this.statusFilter === 'in-stock' ? 'active' : ''}" data-filter="in-stock">
              <i class="fa-solid fa-circle-check" style="color: #059669;"></i> In Stock (${availableCount})
            </button>
            <button class="menu-filter-chip ${this.statusFilter === 'out-of-stock' ? 'active' : ''}" data-filter="out-of-stock">
              <i class="fa-solid fa-circle-xmark" style="color: #dc2626;"></i> Out of Stock (${outOfStockCount})
            </button>
            <button class="menu-filter-chip ${this.statusFilter === 'bogo' ? 'active' : ''}" data-filter="bogo">
              <i class="fa-solid fa-gift" style="color: #d97706;"></i> BOGO Deals (${bogoCount})
            </button>
            <button class="menu-filter-chip ${this.statusFilter === 'veg' ? 'active' : ''}" data-filter="veg">
              <i class="fa-solid fa-leaf" style="color: #16a34a;"></i> Pure Veg (${vegCount})
            </button>
            <button class="menu-filter-chip ${this.statusFilter === 'recipe-set' ? 'active' : ''}" data-filter="recipe-set">
              <i class="fa-solid fa-mortar-pestle" style="color: #2563eb;"></i> Inventory Mapped (${recipesMappedCount})
            </button>
            <button class="menu-filter-chip ${this.statusFilter === 'recipe-missing' ? 'active' : ''}" data-filter="recipe-missing">
              <i class="fa-solid fa-triangle-exclamation" style="color: #d97706;"></i> Unmapped (${totalCount - recipesMappedCount})
            </button>
          </div>

          <!-- Category filter pills -->
          ${catPillsHtml}
        </div>

        <!-- Products View (Table or Cards) -->
        ${this.viewMode === 'table' ? `
          <div class="glass-card" style="padding: 16px 18px;">
            <div class="table-container">
              <table class="premium-table">
                <thead>
                  <tr>
                    <th style="min-width: 220px;">Dish & Category</th>
                    <th>Selling Price</th>
                    <th>Food Cost & Margin</th>
                    <th>Inventory Tracking</th>
                    <th>BOGO Offer</th>
                    <th>POS Stock Status</th>
                    <th style="text-align: right; min-width: 120px;">Actions</th>
                  </tr>
                </thead>
                <tbody id="menu-products-tbody">
                  ${rowsHtml}
                </tbody>
              </table>
            </div>
          </div>
        ` : `
          <div class="menu-cards-grid">
            ${cardsHtml}
          </div>
        `}

      </div>
    `;

    this.bindProductViewEvents(mount, products);
  },

  bindProductViewEvents(mount, products) {
    // Bind Search Input
    const searchInput = mount.querySelector("#menu-search-input");
    if (searchInput) {
      searchInput.oninput = (e) => {
        this.searchQuery = e.target.value.trim();
        this.renderProducts(mount);
      };
    }

    // Bind Food Cost Benchmark Calibrator Buttons
    mount.querySelectorAll(".menu-cogs-btn").forEach(btn => {
      btn.onclick = () => {
        const rate = Number(btn.getAttribute("data-rate")) || 32;
        this.benchmarkCogsPercent = rate;
        const settings = window.db.get("settings") || {};
        settings.cogsPercent = rate;
        window.db.set("settings", settings);
        window.showToast(`Food cost benchmark set to ${rate}%.`, "success");
        this.render();
      };
    });

    // Bind Sort selector
    const sortSelect = mount.querySelector("#menu-sort-select");
    if (sortSelect) {
      sortSelect.onchange = (e) => {
        this.sortBy = e.target.value;
        this.renderProducts(mount);
      };
    }

    // Bind View switcher buttons
    const btnTable = mount.querySelector("#btn-view-table");
    const btnGrid = mount.querySelector("#btn-view-grid");
    if (btnTable) {
      btnTable.onclick = () => {
        this.viewMode = "table";
        this.renderProducts(mount);
      };
    }
    if (btnGrid) {
      btnGrid.onclick = () => {
        this.viewMode = "grid";
        this.renderProducts(mount);
      };
    }

    // Bind Category Filter Pills
    mount.querySelectorAll(".menu-cat-pill").forEach(pill => {
      pill.onclick = () => {
        this.selectedCategory = pill.getAttribute("data-cat");
        this.renderProducts(mount);
      };
    });

    // Bind Status Filter Chips
    mount.querySelectorAll(".menu-filter-chip").forEach(chip => {
      chip.onclick = () => {
        this.statusFilter = chip.getAttribute("data-filter");
        this.renderProducts(mount);
      };
    });

    // Bind Quick Price Edit
    mount.querySelectorAll(".btn-quick-price").forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-id");
        const oldPrice = btn.getAttribute("data-price");
        const prod = products.find(p => p.id === id);
        if (!prod) return;

        const newPrice = prompt(`Enter new selling price for "${prod.name}" (Current: ₹${oldPrice}):`, oldPrice);
        if (newPrice !== null && !isNaN(newPrice) && Number(newPrice) > 0) {
          prod.price = Number(newPrice);
          window.db.saveProduct(prod);
          window.showToast(`Selling price for "${prod.name}" updated to ₹${prod.price}.`, "success");
          this.render();
        }
      };
    });

    // Bind Quick Cost Edit
    mount.querySelectorAll(".btn-quick-cost").forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-id");
        const prod = products.find(p => p.id === id);
        if (!prod) return;

        const currentCost = prod.costPrice !== undefined && prod.costPrice !== null ? prod.costPrice : "";
        const benchmarkEstimate = (Number(prod.price || 0) * (this.benchmarkCogsPercent / 100)).toFixed(1);

        const newCost = prompt(
          `Enter exact food cost price (₹) for "${prod.name}":\n(Leave empty to use automatic ${this.benchmarkCogsPercent}% benchmark: ₹${benchmarkEstimate})`,
          currentCost
        );

        if (newCost !== null) {
          if (newCost.trim() === "") {
            delete prod.costPrice;
            window.db.saveProduct(prod);
            window.showToast(`Food cost for "${prod.name}" reset to ${this.benchmarkCogsPercent}% benchmark.`, "info");
          } else if (!isNaN(newCost) && Number(newCost) >= 0) {
            prod.costPrice = Number(newCost);
            window.db.saveProduct(prod);
            window.showToast(`Food cost for "${prod.name}" set to ₹${prod.costPrice}.`, "success");
          } else {
            window.showToast("Please enter a valid cost number.", "error");
          }
          this.render();
        }
      };
    });

    // Bind item availability toggle
    mount.querySelectorAll(".toggle-availability-chk").forEach(chk => {
      chk.onchange = () => {
        const id = chk.getAttribute("data-id");
        const prod = products.find(p => p.id === id);
        if (prod) {
          prod.available = chk.checked;
          window.db.saveProduct(prod);
          window.showToast(`${prod.name} is now ${chk.checked ? 'In Stock (Live in POS)' : 'Out of Stock (Hidden)'}.`, chk.checked ? "success" : "info");
          this.render();
        }
      };
    });

    // Bind item BOGO toggle
    mount.querySelectorAll(".toggle-bogo-chk").forEach(chk => {
      chk.onchange = () => {
        const id = chk.getAttribute("data-id");
        const prod = products.find(p => p.id === id);
        if (prod) {
          prod.bogo = chk.checked;
          window.db.saveProduct(prod);
          window.showToast(`${prod.name} BOGO offer ${chk.checked ? 'Activated' : 'Deactivated'}.`, "success");
          this.render();
        }
      };
    });

    // Bind Edit product
    mount.querySelectorAll(".btn-edit-product").forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-id");
        const prod = products.find(p => p.id === id);
        if (prod) this.openProductModal(prod);
      };
    });

    // Bind Duplicate product
    mount.querySelectorAll(".btn-duplicate-product").forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-id");
        const prod = products.find(p => p.id === id);
        if (prod) this.duplicateProduct(prod);
      };
    });

    // Bind Delete product
    mount.querySelectorAll(".btn-delete-product").forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-id");
        const prod = products.find(p => p.id === id);
        if (!prod) return;
        if (confirm(`Are you sure you want to permanently delete "${prod.name}"?`)) {
          window.db.deleteProduct(id);
          window.showToast(`Product "${prod.name}" deleted from menu.`, "info");
          this.render();
        }
      };
    });

    // Bind Recipe Setup trigger
    mount.querySelectorAll(".btn-recipe-setup").forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-id");
        this.openRecipeModal(id);
      };
    });
  },

  // Duplicate product helper
  duplicateProduct(product) {
    const newName = `${product.name} (Copy)`;
    window.db.saveProduct({
      name: newName,
      price: product.price,
      costPrice: product.costPrice || null,
      category: product.category,
      bogo: product.bogo,
      available: product.available,
      veg: product.veg !== false,
      recipe: { ...(product.recipe || {}) }
    });
    window.showToast(`Duplicated "${product.name}" as "${newName}".`, "success");
    this.render();
  },

  // Product Add / Edit Modal
  openProductModal(product = null) {
    const categories = window.db.get("categories") || [];
    const categoriesOptions = categories.map(c => `
      <option value="${c.id}" ${product && product.category === c.id ? 'selected' : ''}>${c.name}</option>
    `).join("");

    const isVeg = product ? product.veg !== false : true;
    const currentCost = product && product.costPrice !== undefined && product.costPrice !== null ? product.costPrice : "";

    const formHtml = `
      <div style="display: flex; flex-direction: column; gap: 14px; font-size: 13px;">
        
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label" for="prod-modal-name" style="font-weight: 700; margin-bottom: 5px;">Dish / Item Name *</label>
          <input type="text" id="prod-modal-name" class="form-input" value="${product ? product.name : ''}" placeholder="e.g. Cheese Veggie Frankie" style="height: 38px; border-radius: 10px;" required>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" for="prod-modal-price" style="font-weight: 700; margin-bottom: 5px;">Unit Selling Price (₹) *</label>
            <input type="number" id="prod-modal-price" class="form-input" value="${product ? product.price : ''}" placeholder="e.g. 110" min="1" step="any" style="height: 38px; font-weight: 800; font-size: 14px; border-radius: 10px;" required>
          </div>

          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" for="prod-modal-cost" style="font-weight: 700; margin-bottom: 5px;">Cost Price (Food Cost ₹)</label>
            <input type="number" id="prod-modal-cost" class="form-input" value="${currentCost}" placeholder="Auto (${this.benchmarkCogsPercent}% benchmark)" min="0" step="any" style="height: 38px; font-size: 13px; font-weight: 700; border-radius: 10px;">
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: -6px; font-size: 11px; color: var(--text-muted);">
          <span>Leave Cost Price empty to auto-calculate with the standard ${this.benchmarkCogsPercent}% food cost benchmark.</span>
        </div>

        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label" for="prod-modal-category" style="font-weight: 700; margin-bottom: 5px;">Menu Category</label>
          <select id="prod-modal-category" class="form-select" style="height: 38px; border-radius: 10px; font-weight: 600;">
            ${categoriesOptions || '<option value="cat1">General</option>'}
          </select>
        </div>

        <!-- Dietary Type -->
        <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: 12px; padding: 12px 14px;">
          <label class="form-label" style="font-weight: 700; margin-bottom: 6px; display: block;">Dietary Classification</label>
          <div style="display: flex; gap: 16px;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: 700;">
              <input type="radio" name="prod-diet" id="prod-diet-veg" value="veg" ${isVeg ? 'checked' : ''}>
              <span class="menu-diet-box veg"><span class="menu-diet-dot"></span></span> Pure Vegetarian
            </label>
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: 700;">
              <input type="radio" name="prod-diet" id="prod-diet-nonveg" value="nonveg" ${!isVeg ? 'checked' : ''}>
              <span class="menu-diet-box non-veg"><span class="menu-diet-dot"></span></span> Non-Vegetarian / Egg
            </label>
          </div>
        </div>

        <!-- Switches for BOGO and Availability -->
        <div style="background: #ffffff; border: 1px solid var(--border-color); border-radius: 12px; padding: 12px 14px; display: flex; flex-direction: column; gap: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: 700; color: var(--text-dark);">Buy One Get One (BOGO) Offer</div>
              <div style="font-size: 11px; color: var(--text-muted);">Enables automatic BOGO discount calculation on POS checkout.</div>
            </div>
            <label class="menu-toggle-switch">
              <input type="checkbox" id="prod-modal-bogo" ${product && product.bogo ? 'checked' : ''}>
              <span class="menu-toggle-slider"></span>
            </label>
          </div>

          <div style="border-top: 1px dashed #cbd5e1; padding-top: 10px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: 700; color: var(--text-dark);">Live POS Availability</div>
              <div style="font-size: 11px; color: var(--text-muted);">When enabled, product appears immediately on the cashier billing screen.</div>
            </div>
            <label class="menu-toggle-switch">
              <input type="checkbox" id="prod-modal-avail" ${product && product.available === false ? '' : 'checked'}>
              <span class="menu-toggle-slider slider-green"></span>
            </label>
          </div>
        </div>

      </div>
    `;

    window.customModal.show({
      title: product ? `Edit Menu Product - ${product.name}` : "Create New Menu Product",
      bodyHtml: formHtml,
      confirmText: product ? "Update Product" : "Save Product",
      onConfirm: () => {
        const name = document.getElementById("prod-modal-name").value.trim();
        const price = document.getElementById("prod-modal-price").value;
        const rawCost = document.getElementById("prod-modal-cost").value.trim();
        const category = document.getElementById("prod-modal-category").value;
        const bogo = document.getElementById("prod-modal-bogo").checked;
        const available = document.getElementById("prod-modal-avail").checked;
        const veg = document.getElementById("prod-diet-veg").checked;

        if (!name || !price || isNaN(price) || Number(price) <= 0) {
          window.showToast("Please enter valid name and pricing details.", "error");
          return false;
        }

        const costPrice = rawCost && !isNaN(rawCost) && Number(rawCost) >= 0 ? Number(rawCost) : null;

        window.db.saveProduct({
          id: product ? product.id : null,
          name,
          price: Number(price),
          costPrice: costPrice,
          category,
          bogo,
          available,
          veg,
          recipe: product ? product.recipe : {}
        });

        window.showToast(product ? "Menu item details updated." : "New menu item saved successfully.", "success");
        this.render();
        return true;
      }
    });
  },

  // =========================================================================
  // 2. RECIPE INVENTORY DEDUCTION MATRIX
  // =========================================================================
  openRecipeModal(productId) {
    const products = window.db.get("products") || [];
    const ingredients = window.db.get("ingredients") || [];
    const settings = window.db.get("settings") || {};
    const currency = settings.currencySymbol || "₹";
    const product = products.find(p => p.id === productId);

    if (!product) return;

    // Local mutable copy of recipe mapping
    const localRecipe = { ...(product.recipe || {}) };
    const costInfo = this.calculateProductCost(product);

    const renderRecipeTable = () => {
      const rows = Object.entries(localRecipe).map(([ingId, qty]) => {
        const ing = ingredients.find(i => i.id === ingId);
        if (!ing) return "";
        const unitCost = this.ingredientCostMap[ingId] || 5.0;
        const componentVal = (Number(qty) * unitCost).toFixed(2);

        return `
          <tr id="recipe-row-${ingId}">
            <td>
              <div style="font-weight: 800; color: var(--text-dark);">${ing.name}</div>
              <div style="font-size: 11px; color: var(--text-muted);">Current Warehouse Stock: <strong>${ing.stock} ${ing.unit}</strong></div>
            </td>
            <td style="font-weight: 800; color: #2563eb;">
              ${qty} ${ing.unit}
            </td>
            <td style="color: var(--text-muted); font-size: 12px;">
              ${currency}${unitCost.toFixed(2)} / ${ing.unit}
            </td>
            <td style="font-weight: 800; color: var(--text-dark);">
              ${currency}${componentVal}
            </td>
            <td style="text-align: right;">
              <button class="btn btn-danger btn-delete-recipe-item" data-id="${ingId}" title="Remove Component" style="padding: 4px 8px; font-size: 11px; border-radius: 8px;">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </td>
          </tr>
        `;
      }).join("");

      return `
        <div class="table-container" style="max-height: 220px; overflow-y: auto; margin-bottom: 14px;">
          <table class="premium-table" style="font-size: 12.5px;">
            <thead>
              <tr>
                <th>Raw Material Component</th>
                <th>Deduction Quantity</th>
                <th>Ref Unit Price</th>
                <th>Stock Valuation</th>
                <th style="text-align: right;">Remove</th>
              </tr>
            </thead>
            <tbody id="recipe-modal-table-body">
              ${rows || `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 25px; font-weight: 600;">No raw materials mapped. When orders are checked out, no warehouse inventory is depleted for this item.</td></tr>`}
            </tbody>
          </table>
        </div>
      `;
    };

    const renderSummaryBanner = () => {
      return `
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 12px 14px; margin-bottom: 14px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; text-align: center;">
          <div>
            <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Selling Price</div>
            <div style="font-size: 16px; font-weight: 900; color: var(--text-dark); margin-top: 2px;">${currency}${Number(product.price || 0).toFixed(2)}</div>
          </div>
          <div>
            <div style="font-size: 11px; font-weight: 700; color: #b45309; text-transform: uppercase;">Food Cost (COGS)</div>
            <div style="font-size: 16px; font-weight: 900; color: #d97706; margin-top: 2px;">
              ${currency}${costInfo.foodCost.toFixed(2)}
              <span style="font-size: 10px; color: var(--text-muted); display: block; font-weight: 600;">${costInfo.isCustom ? '(Custom Cost)' : `(${this.benchmarkCogsPercent}% Benchmark)`}</span>
            </div>
          </div>
          <div>
            <div style="font-size: 11px; font-weight: 700; color: #047857; text-transform: uppercase;">Gross Profit</div>
            <div style="font-size: 16px; font-weight: 900; color: #059669; margin-top: 2px;">${currency}${costInfo.grossProfit.toFixed(2)}</div>
          </div>
          <div>
            <div style="font-size: 11px; font-weight: 700; color: #1e40af; text-transform: uppercase;">Profit Margin</div>
            <div style="font-size: 16px; font-weight: 900; color: #2563eb; margin-top: 2px;">${costInfo.marginPct}%</div>
          </div>
        </div>
      `;
    };

    const dropdownOptions = ingredients
      .filter(ing => !localRecipe[ing.id])
      .map(ing => `<option value="${ing.id}">${ing.name} (${ing.unit}) - Stock: ${ing.stock}</option>`)
      .join("");

    const completeHtml = `
      <div style="margin-bottom: 12px; font-size: 12.5px; color: var(--text-muted); font-weight: 500;">
        Map raw inventory materials automatically deducted from warehouse stock whenever <strong style="color: #2563eb;">${product.name}</strong> is ordered on POS.
      </div>
      
      <!-- Live Food Cost & Margin Summary Banner -->
      <div id="recipe-summary-banner-wrapper">
        ${renderSummaryBanner()}
      </div>

      <!-- Current Recipe Table -->
      <div id="recipe-table-wrapper">
        ${renderRecipeTable()}
      </div>

      <!-- Add New Ingredient Form Wrapper -->
      <div style="background: #f8fafc; border: 1px solid var(--border-color); padding: 12px 14px; border-radius: 12px;">
        <h4 style="font-size: 12px; margin: 0 0 8px 0; color: #2563eb; font-weight: 800; text-transform: uppercase;">
          <i class="fa-solid fa-plus-circle"></i> Add Raw Material Component
        </h4>
        <div style="display: grid; grid-template-columns: 2fr 1fr auto; gap: 8px;">
          <select id="recipe-add-ing-select" class="form-select" style="font-size: 12px; height: 36px; padding: 4px 8px; border-radius: 8px;">
            ${dropdownOptions || '<option value="">All ingredients already mapped</option>'}
          </select>
          <input type="number" id="recipe-add-qty-input" class="form-input" placeholder="Portion Qty" min="0.01" step="any" style="font-size: 12px; height: 36px; padding: 4px 8px; border-radius: 8px; font-weight: 700;">
          <button class="btn btn-primary" id="btn-recipe-add-item-trigger" style="padding: 0 16px; height: 36px; font-size: 12px; border-radius: 8px; font-weight: 700;">Add</button>
        </div>
      </div>
    `;

    const bindTableListeners = () => {
      const body = document.getElementById("recipe-modal-table-body");
      if (!body) return;
      body.querySelectorAll(".btn-delete-recipe-item").forEach(btn => {
        btn.onclick = () => {
          const ingId = btn.getAttribute("data-id");
          delete localRecipe[ingId];
          refreshModalContent();
        };
      });
    };

    const refreshModalContent = () => {
      const wrapper = document.getElementById("recipe-table-wrapper");
      if (wrapper) wrapper.innerHTML = renderRecipeTable();
      
      const select = document.getElementById("recipe-add-ing-select");
      if (select) {
        const opts = ingredients
          .filter(ing => !localRecipe[ing.id])
          .map(ing => `<option value="${ing.id}">${ing.name} (${ing.unit}) - Stock: ${ing.stock}</option>`)
          .join("");
        select.innerHTML = opts || '<option value="">All ingredients already mapped</option>';
      }
      bindTableListeners();
    };

    window.customModal.show({
      title: `Inventory Recipe - ${product.name}`,
      bodyHtml: completeHtml,
      confirmText: "Save Inventory Recipe",
      onConfirm: () => {
        product.recipe = localRecipe;
        window.db.saveProduct(product);
        window.showToast(`Inventory deduction recipe saved for "${product.name}".`, "success");
        this.render();
        return true;
      }
    });

    const addTrigger = document.getElementById("btn-recipe-add-item-trigger");
    if (addTrigger) {
      addTrigger.onclick = () => {
        const ingId = document.getElementById("recipe-add-ing-select").value;
        const qty = document.getElementById("recipe-add-qty-input").value;

        if (!ingId) {
          window.showToast("Select a raw ingredient.", "error");
          return;
        }
        if (!qty || isNaN(qty) || Number(qty) <= 0) {
          window.showToast("Please enter a valid ingredient portion quantity.", "error");
          return;
        }

        localRecipe[ingId] = Number(qty);
        document.getElementById("recipe-add-qty-input").value = "";
        refreshModalContent();
        window.showToast("Component added to recipe.", "success");
      };
    }

    bindTableListeners();
  },

  // =========================================================================
  // 3. CATEGORIES MANAGEMENT VIEW
  // =========================================================================
  renderCategories(mount) {
    const categories = window.db.get("categories") || [];
    const products = window.db.get("products") || [];
    const settings = window.db.get("settings") || {};
    const currency = settings.currencySymbol || "₹";

    let rowsHtml = "";
    if (categories.length === 0) {
      rowsHtml = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 40px; font-weight: 600;">No categories found. Click Add Category to create one.</td></tr>`;
    } else {
      rowsHtml = categories.map(c => {
        const items = products.filter(p => p.category === c.id);
        const availCount = items.filter(p => p.available !== false).length;
        const outCount = items.length - availCount;

        // Pricing range in this category
        let catPriceSum = 0;
        let catMin = Infinity;
        let catMax = 0;
        items.forEach(p => {
          const pr = Number(p.price) || 0;
          catPriceSum += pr;
          if (pr < catMin) catMin = pr;
          if (pr > catMax) catMax = pr;
        });
        const catAvg = items.length > 0 ? (catPriceSum / items.length).toFixed(1) : "0";

        return `
          <tr>
            <td>
              <div style="font-weight: 800; color: var(--text-dark); font-size: 14px; display: flex; align-items: center; gap: 8px;">
                <div style="width: 32px; height: 32px; border-radius: 8px; background: #eff6ff; color: #2563eb; display: flex; align-items: center; justify-content: center; font-size: 13px;">
                  <i class="fa-solid fa-layer-group"></i>
                </div>
                ${c.name}
              </div>
            </td>
            <td style="color: var(--text-muted); font-size: 12px; font-weight: 600;">
              <code>${c.id}</code>
            </td>
            <td>
              <span style="font-size: 12px; font-weight: 800; background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; padding: 3px 10px; border-radius: 10px;">
                ${items.length} Products (${availCount} Active${outCount > 0 ? `, ${outCount} Out` : ''})
              </span>
            </td>
            <td>
              <div style="font-size: 12.5px; font-weight: 800; color: var(--text-dark);">
                ${currency}${catAvg} <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">(${currency}${items.length > 0 ? catMin : 0} - ${currency}${catMax})</span>
              </div>
            </td>
            <td>
              <div style="display: flex; gap: 6px;">
                <button class="btn btn-secondary btn-edit-category" data-id="${c.id}" title="Edit Category Title" style="padding: 5px 12px; font-size: 11.5px; border-radius: 8px; font-weight: 700; display: inline-flex; align-items: center; gap: 5px;">
                  <i class="fa-solid fa-pen-to-square" style="color: #2563eb;"></i> Rename
                </button>
                <button class="btn btn-danger btn-delete-category" data-id="${c.id}" title="Delete Category" style="padding: 5px 9px; font-size: 11.5px; border-radius: 8px;">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join("");
    }

    mount.innerHTML = `
      <div class="glass-card view-animate" style="padding: 18px 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 14px; border-bottom: 1px solid var(--border-color); padding-bottom: 12px;">
          <div>
            <h3 style="font-size: 16px; font-weight: 800; color: var(--text-dark); margin: 0;">
              <i class="fa-solid fa-layer-group" style="color: #2563eb; margin-right: 6px;"></i> Food Categories Directory
            </h3>
            <p style="font-size: 12px; color: var(--text-muted); margin: 2px 0 0 0;">Organize menu items into navigation groups for fast cashier selection on the POS screen.</p>
          </div>
          <span style="font-size: 12px; font-weight: 800; color: #2563eb; background: #eff6ff; border: 1px solid #bfdbfe; padding: 4px 12px; border-radius: 10px;">
            ${categories.length} Total Categories
          </span>
        </div>

        <div class="table-container">
          <table class="premium-table">
            <thead>
              <tr>
                <th>Category Name</th>
                <th>Internal ID</th>
                <th>Assigned Items</th>
                <th>Average Dish Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Bind Edit Cat
    mount.querySelectorAll(".btn-edit-category").forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-id");
        const cat = categories.find(c => c.id === id);
        if (cat) this.openCategoryModal(cat);
      };
    });

    // Bind Delete Cat
    mount.querySelectorAll(".btn-delete-category").forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-id");
        const cat = categories.find(c => c.id === id);
        if (!cat) return;
        if (confirm(`Deleting category "${cat.name}" will make all items inside it unassigned. Proceed?`)) {
          window.db.deleteCategory(id);
          window.showToast(`Category "${cat.name}" deleted.`, "info");
          this.render();
        }
      };
    });
  },

  openCategoryModal(category = null) {
    const formHtml = `
      <div style="display: flex; flex-direction: column; gap: 12px; font-size: 13px;">
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label" for="cat-modal-name" style="font-weight: 700; margin-bottom: 5px;">Category Title *</label>
          <input type="text" id="cat-modal-name" class="form-input" value="${category ? category.name : ''}" placeholder="e.g. Premium Shakes, Paneer Wraps" style="height: 38px; border-radius: 10px;" required>
        </div>
      </div>
    `;

    window.customModal.show({
      title: category ? `Edit Category - ${category.name}` : "Create New Food Category",
      bodyHtml: formHtml,
      confirmText: category ? "Update Category" : "Save Category",
      onConfirm: () => {
        const name = document.getElementById("cat-modal-name").value.trim();
        if (!name) {
          window.showToast("Please enter a category title.", "error");
          return false;
        }

        window.db.saveCategory({
          id: category ? category.id : null,
          name: name
        });

        window.showToast(category ? "Category updated successfully." : "New category added.", "success");
        this.render();
        return true;
      }
    });
  },

  // =========================================================================
  // 4. PERMISSIONS ACCESS CONTROL MATRIX
  // =========================================================================
  renderPermissions(mount) {
    const permissions = window.db.get("permissions") || {
      admin: ["dashboard", "reports", "counter", "pos", "orders", "menu"],
      manager: ["dashboard", "reports", "counter", "pos", "orders", "menu"],
      staff: ["pos", "orders"]
    };

    const viewsList = [
      { id: "dashboard", name: "Dashboard Overview", icon: "fa-gauge-high", desc: "View executive revenue summaries, real-time KPI metrics, and sales charts." },
      { id: "reports", name: "Sales & Profit Reports", icon: "fa-chart-pie", desc: "Access P&L analytics, COGS calibrations, daily financial trends, and CSV exports." },
      { id: "counter", name: "Daily Counter & Cash Register", icon: "fa-cash-register", desc: "Daily cash & UPI counter totals, physical drawer tally, bill history & reprints." },
      { id: "pos", name: "POS Billing Terminal", icon: "fa-cart-shopping", desc: "Access the cashier billing screen to place orders and generate bills." },
      { id: "orders", name: "KDS Kitchen Queue", icon: "fa-fire-burner", desc: "Live kitchen display system for tracking active cooking orders and tickets." },
      { id: "menu", name: "Menu Catalog & Recipes", icon: "fa-burger", desc: "Manage food items, pricing, BOGO offers, raw recipes, and categories." }
    ];

    const rolesList = [
      { id: "admin", name: "Administrator" },
      { id: "manager", name: "Manager" },
      { id: "staff", name: "Kitchen / Staff" }
    ];

    let rowsHtml = viewsList.map(v => {
      const cols = rolesList.map(r => {
        const isChecked = (permissions[r.id] || []).includes(v.id);
        const isDisabled = r.id === "admin";

        return `
          <td style="text-align: center; padding: 12px 16px;">
            <label class="menu-toggle-switch" style="cursor: ${isDisabled ? 'not-allowed' : 'pointer'};">
              <input type="checkbox" class="perm-checkbox-toggle" data-role="${r.id}" data-view="${v.id}" 
                ${isChecked ? 'checked' : ''} ${isDisabled ? 'disabled' : ''}>
              <span class="menu-toggle-slider ${r.id === 'manager' ? 'slider-green' : ''}"></span>
            </label>
          </td>
        `;
      }).join("");

      return `
        <tr>
          <td style="padding: 12px 18px;">
            <div style="font-weight: 800; color: var(--text-dark); display: flex; align-items: center; gap: 8px;">
              <i class="fa-solid ${v.icon}" style="color: #2563eb; width: 16px;"></i>
              ${v.name}
            </div>
            <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 2px;">${v.desc}</div>
          </td>
          ${cols}
        </tr>
      `;
    }).join("");

    mount.innerHTML = `
      <div class="glass-card view-animate" style="padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; border-bottom: 1px solid var(--border-color); padding-bottom: 14px; margin-bottom: 16px;">
          <div>
            <h3 style="font-size: 16px; font-weight: 800; color: var(--text-dark); margin: 0;">
              <i class="fa-solid fa-user-shield" style="color: #2563eb; margin-right: 6px;"></i> Role Access Control Matrix
            </h3>
            <p style="font-size: 12px; color: var(--text-muted); margin: 3px 0 0 0;">Manage which POS features each user level is allowed to view.</p>
          </div>
          <span style="font-size: 11.5px; font-weight: 800; background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; padding: 4px 12px; border-radius: 10px;">
            <i class="fa-solid fa-cloud-arrow-up"></i> Live Auto-Save Active
          </span>
        </div>
        
        <div class="table-container">
          <table class="premium-table">
            <thead>
              <tr>
                <th style="width: 45%; padding: 12px 18px;">POS Screen / Feature</th>
                <th style="text-align: center; padding: 12px 16px;">Administrator</th>
                <th style="text-align: center; padding: 12px 16px;">Manager</th>
                <th style="text-align: center; padding: 12px 16px;">Kitchen / Staff</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Bind switch changes
    mount.querySelectorAll(".perm-checkbox-toggle").forEach(chk => {
      chk.onchange = () => {
        const roleId = chk.getAttribute("data-role");
        const viewId = chk.getAttribute("data-view");

        if (roleId === "admin") return;

        permissions[roleId] = permissions[roleId] || [];
        if (chk.checked) {
          if (!permissions[roleId].includes(viewId)) {
            permissions[roleId].push(viewId);
          }
        } else {
          permissions[roleId] = permissions[roleId].filter(id => id !== viewId);
        }

        window.db.set("permissions", permissions);
        window.showToast(`Access permissions updated for ${roleId.toUpperCase()} role.`, "success");
      };
    });
  },

  // =========================================================================
  // 5. BULK OPERATIONS & PRICE MODIFIER
  // =========================================================================
  openBulkOperationsModal() {
    const categories = window.db.get("categories") || [];
    const products = window.db.get("products") || [];

    const catOptions = categories.map(c => `
      <option value="${c.id}">${c.name} (${products.filter(p => p.category === c.id).length} items)</option>
    `).join("");

    const bodyHtml = `
      <div style="display: flex; flex-direction: column; gap: 14px; font-size: 13px;">
        
        <!-- Action 1: Bulk Price Adjustment -->
        <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: 12px; padding: 14px;">
          <h4 style="margin: 0 0 10px 0; font-size: 13.5px; font-weight: 800; color: #2563eb; display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-tags"></i> Bulk Price Modifier
          </h4>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
            <div>
              <label class="form-label" for="bulk-target-cat" style="font-weight: 700; margin-bottom: 4px;">Target Group:</label>
              <select id="bulk-target-cat" class="form-select" style="height: 36px; font-size: 12px; border-radius: 8px;">
                <option value="all">All Menu Items (${products.length} Products)</option>
                ${catOptions}
              </select>
            </div>

            <div>
              <label class="form-label" for="bulk-action-type" style="font-weight: 700; margin-bottom: 4px;">Action Type:</label>
              <select id="bulk-action-type" class="form-select" style="height: 36px; font-size: 12px; border-radius: 8px;">
                <option value="inc-pct">Increase by Percentage (%)</option>
                <option value="dec-pct">Decrease by Percentage (%)</option>
                <option value="inc-fixed">Add Fixed Amount (₹)</option>
                <option value="dec-fixed">Subtract Fixed Amount (₹)</option>
              </select>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="flex: 1;">
              <input type="number" id="bulk-action-val" class="form-input" placeholder="Value (e.g. 10 for 10% or ₹10)" min="1" step="any" style="height: 36px; font-size: 13px; font-weight: 800; border-radius: 8px;">
            </div>
            <button class="btn btn-primary" id="btn-apply-bulk-price" style="height: 36px; padding: 0 16px; font-size: 12px; border-radius: 8px; font-weight: 800;">
              Apply Price Change
            </button>
          </div>
        </div>

        <!-- Action 2: Stock Availability Reset -->
        <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: 12px; padding: 14px;">
          <h4 style="margin: 0 0 10px 0; font-size: 13.5px; font-weight: 800; color: #059669; display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-boxes-stacked"></i> Quick Stock Availability
          </h4>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button class="btn btn-secondary" id="btn-bulk-stock-all-on" style="height: 36px; font-size: 12px; font-weight: 800; border-radius: 8px; display: inline-flex; align-items: center; gap: 5px;">
              <i class="fa-solid fa-circle-check" style="color: #059669;"></i> Mark All In-Stock (Live)
            </button>
            <button class="btn btn-secondary" id="btn-bulk-stock-reset-bogo" style="height: 36px; font-size: 12px; font-weight: 800; border-radius: 8px; display: inline-flex; align-items: center; gap: 5px;">
              <i class="fa-solid fa-tag" style="color: #2563eb;"></i> Clear All BOGO Offers
            </button>
          </div>
        </div>

      </div>
    `;

    window.customModal.show({
      title: "Menu Bulk Operations Suite",
      bodyHtml: bodyHtml,
      confirmText: "Done",
      hideFooter: true,
      onConfirm: () => true
    });

    // Handle Bulk Price Change
    const btnApplyPrice = document.getElementById("btn-apply-bulk-price");
    if (btnApplyPrice) {
      btnApplyPrice.onclick = () => {
        const targetCat = document.getElementById("bulk-target-cat").value;
        const actionType = document.getElementById("bulk-action-type").value;
        const rawVal = document.getElementById("bulk-action-val").value;
        const val = Number(rawVal);

        if (!rawVal || isNaN(val) || val <= 0) {
          window.showToast("Please enter a valid positive adjustment value.", "error");
          return;
        }

        let targetProducts = targetCat === "all" ? products : products.filter(p => p.category === targetCat);
        if (targetProducts.length === 0) {
          window.showToast("No products found in target group.", "error");
          return;
        }

        if (!confirm(`Are you sure you want to modify prices for ${targetProducts.length} items? This cannot be undone automatically.`)) {
          return;
        }

        targetProducts.forEach(p => {
          let curr = Number(p.price) || 0;
          if (actionType === "inc-pct") {
            curr = curr * (1 + val / 100);
          } else if (actionType === "dec-pct") {
            curr = Math.max(1, curr * (1 - val / 100));
          } else if (actionType === "inc-fixed") {
            curr = curr + val;
          } else if (actionType === "dec-fixed") {
            curr = Math.max(1, curr - val);
          }
          p.price = Math.round(curr);
          window.db.saveProduct(p);
        });

        window.showToast(`Updated pricing for ${targetProducts.length} items.`, "success");
        window.customModal.hide();
        this.render();
      };
    }

    // Handle Mark All In-Stock
    const btnStockOn = document.getElementById("btn-bulk-stock-all-on");
    if (btnStockOn) {
      btnStockOn.onclick = () => {
        products.forEach(p => {
          p.available = true;
          window.db.saveProduct(p);
        });
        window.showToast(`All ${products.length} menu products marked as In-Stock.`, "success");
        window.customModal.hide();
        this.render();
      };
    }

    // Handle Reset BOGO
    const btnResetBogo = document.getElementById("btn-bulk-stock-reset-bogo");
    if (btnResetBogo) {
      btnResetBogo.onclick = () => {
        if (confirm("Deactivate BOGO promotions on all menu products?")) {
          products.forEach(p => {
            p.bogo = false;
            window.db.saveProduct(p);
          });
          window.showToast("All BOGO offers cleared.", "info");
          window.customModal.hide();
          this.render();
        }
      };
    }
  },

  // =========================================================================
  // 6. CSV EXPORT & MENU PRINTING
  // =========================================================================
  exportMenuCSV() {
    const products = window.db.get("products") || [];
    const categories = window.db.get("categories") || [];

    if (products.length === 0) {
      window.showToast("No products found to export.", "error");
      return;
    }

    const headers = [
      "Product ID",
      "Dish Name",
      "Category ID",
      "Category Name",
      "Dietary",
      "Selling Price (INR)",
      "Food Cost (INR)",
      "Cost Type",
      "Gross Margin (%)",
      "BOGO Active",
      "POS Available",
      "Recipe Items Count"
    ];

    const rows = products.map(p => {
      const cat = categories.find(c => c.id === p.category);
      const costInfo = this.calculateProductCost(p);
      return [
        `"${p.id}"`,
        `"${(p.name || '').replace(/"/g, '""')}"`,
        `"${p.category || ''}"`,
        `"${cat ? cat.name.replace(/"/g, '""') : 'Unassigned'}"`,
        `"${p.veg !== false ? 'Veg' : 'Non-Veg'}"`,
        Number(p.price || 0).toFixed(2),
        costInfo.foodCost.toFixed(2),
        `"${costInfo.isCustom ? 'Custom' : `${this.benchmarkCogsPercent}% Benchmark`}"`,
        `${costInfo.marginPct}%`,
        p.bogo ? "YES" : "NO",
        p.available !== false ? "YES" : "NO",
        costInfo.recipeCount
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Menu_Catalog_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    window.showToast("Menu catalog CSV exported successfully.", "success");
  },

  printMenuPriceList() {
    const products = window.db.get("products") || [];
    const categories = window.db.get("categories") || [];
    const settings = window.db.get("settings") || {};
    const restaurantName = settings.restaurantName || "Crust & Chilly Fast Food";
    const currency = settings.currencySymbol || "₹";

    // Group items by category
    const grouped = {};
    categories.forEach(c => {
      grouped[c.name] = products.filter(p => p.category === c.id);
    });

    const unassigned = products.filter(p => !categories.find(c => c.id === p.category));
    if (unassigned.length > 0) grouped["Other Special Dishes"] = unassigned;

    let sectionsHtml = "";
    Object.entries(grouped).forEach(([catTitle, items]) => {
      if (items.length === 0) return;
      const itemRows = items.map(p => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px dotted #e2e8f0; font-size: 13px;">
          <div>
            <strong style="color: #0f172a;">${p.name}</strong>
            ${p.bogo ? `<span style="font-size: 10px; font-weight: 800; background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; padding: 1px 5px; border-radius: 6px; margin-left: 6px;">BOGO</span>` : ''}
            ${p.available === false ? `<span style="font-size: 10px; color: #dc2626; margin-left: 4px;">(Unavailable)</span>` : ''}
          </div>
          <div style="font-weight: 900; color: #0f172a;">${currency}${Number(p.price || 0).toFixed(0)}</div>
        </div>
      `).join("");

      sectionsHtml += `
        <div style="margin-bottom: 20px; page-break-inside: avoid;">
          <h3 style="font-size: 15px; font-weight: 900; color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 4px; margin: 0 0 8px 0; text-transform: uppercase;">
            ${catTitle} (${items.length})
          </h3>
          <div style="display: flex; flex-direction: column;">
            ${itemRows}
          </div>
        </div>
      `;
    });

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.showToast("Popup was blocked by your browser. Please allow popups to print menu.", "error");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Menu Price List - ${restaurantName}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 30px; color: #0f172a; max-width: 800px; margin: 0 auto; }
          @media print {
            body { padding: 10px; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px; display: flex; justify-content: space-between;">
          <button onclick="window.print()" style="background: #2563eb; color: #fff; border: none; padding: 8px 18px; border-radius: 8px; font-weight: 700; cursor: pointer;">
            Print / Save PDF
          </button>
          <button onclick="window.close()" style="background: #64748b; color: #fff; border: none; padding: 8px 18px; border-radius: 8px; font-weight: 700; cursor: pointer;">
            Close
          </button>
        </div>

        <div style="text-align: center; margin-bottom: 24px; border-bottom: 2px solid #0f172a; padding-bottom: 12px;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">${restaurantName}</h1>
          <div style="font-size: 13px; color: #64748b; margin-top: 4px;">OFFICIAL MENU CATALOG & PRICE SHEET • ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
        </div>

        ${sectionsHtml}

        <div style="text-align: center; margin-top: 30px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px;">
          Generated automatically from Crust & Chilly POS • All prices in Indian Rupee (${currency})
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
  }
};
