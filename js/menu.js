// Crust & Chilly POS - Enhanced Menu Management Module
// Manages menu catalog, category organization, BOGO offers, POS availability switches, recipes, and role permissions.

window.views = window.views || {};
window.views.menu = {
  activeTab: "products", // 'products' | 'categories' | 'permissions'
  searchQuery: "",
  selectedCategory: "all",

  init(container) {
    const products = window.db.get("products") || [];
    const categories = window.db.get("categories") || [];
    const currentUser = window.db.getCurrentUser() || {};
    const isAdmin = currentUser.role === "admin";

    container.innerHTML = `
      <div class="view-animate" style="display: flex; flex-direction: column; gap: 16px;">
        
        <!-- Top Sub-Header & Navigation Tabs -->
        <div class="glass-card" style="padding: 12px 18px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <button class="btn ${this.activeTab === 'products' ? 'btn-primary' : 'btn-secondary'}" id="menu-sub-products" style="height: 38px; border-radius: 12px; padding: 0 16px; font-weight: 800; font-size: 12.5px; display: inline-flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-burger"></i> Menu Products (${products.length})
            </button>
            <button class="btn ${this.activeTab === 'categories' ? 'btn-primary' : 'btn-secondary'}" id="menu-sub-categories" style="height: 38px; border-radius: 12px; padding: 0 16px; font-weight: 800; font-size: 12.5px; display: inline-flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-tags"></i> Categories (${categories.length})
            </button>
            ${isAdmin ? `
            <button class="btn ${this.activeTab === 'permissions' ? 'btn-primary' : 'btn-secondary'}" id="menu-sub-permissions" style="height: 38px; border-radius: 12px; padding: 0 16px; font-weight: 800; font-size: 12.5px; display: inline-flex; align-items: center; gap: 6px;">
              <i class="fa-solid fa-user-shield"></i> Role Permissions
            </button>
            ` : ""}
          </div>
          
          <button class="btn btn-primary" id="btn-add-menu-entity" style="display: ${this.activeTab === 'permissions' ? 'none' : 'inline-flex'}; height: 38px; border-radius: 12px; padding: 0 18px; font-weight: 800; font-size: 12.5px; align-items: center; gap: 6px;">
            <i class="fa-solid fa-plus"></i> <span id="btn-add-text">${this.activeTab === 'categories' ? 'Add Category' : 'Add Product'}</span>
          </button>
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

    if (btnProd) {
      btnProd.onclick = () => {
        this.activeTab = "products";
        btnProd.className = "btn btn-primary";
        if (btnCat) btnCat.className = "btn btn-secondary";
        if (btnPerm) btnPerm.className = "btn btn-secondary";
        if (btnAdd) {
          btnAdd.style.display = "inline-flex";
          if (addText) addText.textContent = "Add Product";
        }
        this.render();
      };
    }

    if (btnCat) {
      btnCat.onclick = () => {
        this.activeTab = "categories";
        btnCat.className = "btn btn-primary";
        if (btnProd) btnProd.className = "btn btn-secondary";
        if (btnPerm) btnPerm.className = "btn btn-secondary";
        if (btnAdd) {
          btnAdd.style.display = "inline-flex";
          if (addText) addText.textContent = "Add Category";
        }
        this.render();
      };
    }

    if (btnPerm) {
      btnPerm.onclick = () => {
        this.activeTab = "permissions";
        btnPerm.className = "btn btn-primary";
        if (btnProd) btnProd.className = "btn btn-secondary";
        if (btnCat) btnCat.className = "btn btn-secondary";
        if (btnAdd) btnAdd.style.display = "none";
        this.render();
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

  // 1. PRODUCTS MANAGEMENT
  renderProducts(mount) {
    const products = window.db.get("products") || [];
    const categories = window.db.get("categories") || [];
    const settings = window.db.get("settings") || {};
    const currency = settings.currencySymbol || "₹";

    // Summary counts
    const totalCount = products.length;
    const availableCount = products.filter(p => p.available !== false).length;
    const bogoCount = products.filter(p => p.bogo === true).length;
    const categoriesCount = categories.length;

    // Filter products by selected category and search query
    let filtered = products;
    if (this.selectedCategory !== "all") {
      filtered = filtered.filter(p => p.category === this.selectedCategory);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(p => {
        const cat = categories.find(c => c.id === p.category);
        const catName = cat ? cat.name.toLowerCase() : "";
        return (p.name || "").toLowerCase().includes(q) || catName.includes(q);
      });
    }

    // Build Category Filter Pills HTML
    const catPillsHtml = `
      <div class="menu-cat-pills-bar" style="display: flex; gap: 6px; overflow-x: auto; padding: 4px 2px; -webkit-overflow-scrolling: touch; flex-wrap: nowrap;">
        <button type="button" class="menu-cat-pill ${this.selectedCategory === 'all' ? 'active' : ''}" data-cat="all">
          All Items (${products.length})
        </button>
        ${categories.map(c => {
          const cCount = products.filter(p => p.category === c.id).length;
          const isActive = this.selectedCategory === c.id;
          return `
            <button type="button" class="menu-cat-pill ${isActive ? 'active' : ''}" data-cat="${c.id}">
              ${c.name} (${cCount})
            </button>
          `;
        }).join("")}
      </div>
    `;

    // Build Table Rows
    let rowsHtml = "";
    if (filtered.length === 0) {
      rowsHtml = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 40px; font-weight: 600;">
            <i class="fa-solid fa-burger" style="font-size: 28px; opacity: 0.3; display: block; margin-bottom: 8px;"></i>
            No products match the selected category or search query.
          </td>
        </tr>
      `;
    } else {
      rowsHtml = filtered.map(p => {
        const cat = categories.find(c => c.id === p.category);
        const recipeCount = p.recipe ? Object.keys(p.recipe).length : 0;
        const isAvail = p.available !== false;
        const isBogo = p.bogo === true;

        return `
          <tr>
            <td>
              <div style="font-weight: 800; color: var(--text-dark); font-size: 13.5px;">${p.name}</div>
              <div style="font-size: 11px; color: var(--text-muted);">ID: ${p.id}</div>
            </td>
            <td>
              <span style="font-size: 11.5px; font-weight: 700; background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; padding: 2px 9px; border-radius: 8px; display: inline-flex; align-items: center; gap: 4px;">
                <i class="fa-solid fa-tag" style="font-size: 9px;"></i> ${cat ? cat.name : 'Unassigned'}
              </span>
            </td>
            <td style="font-weight: 900; color: var(--text-dark); font-size: 14px;">
              ${currency}${Number(p.price || 0).toFixed(2)}
            </td>
            <td>
              <!-- Interactive BOGO toggle switch -->
              <label class="menu-toggle-switch" title="Toggle BOGO Offer status">
                <input type="checkbox" class="toggle-bogo-chk" data-id="${p.id}" ${isBogo ? 'checked' : ''}>
                <span class="menu-toggle-slider"></span>
              </label>
              <span style="font-size: 11px; font-weight: 700; margin-left: 6px; color: ${isBogo ? '#2563eb' : 'var(--text-muted)'};">
                ${isBogo ? 'BOGO ON' : 'Off'}
              </span>
            </td>
            <td>
              <!-- Interactive Availability toggle switch -->
              <label class="menu-toggle-switch" title="Toggle item live availability in POS">
                <input type="checkbox" class="toggle-availability-chk" data-id="${p.id}" ${isAvail ? 'checked' : ''}>
                <span class="menu-toggle-slider slider-green"></span>
              </label>
              <span style="font-size: 11px; font-weight: 700; margin-left: 6px; color: ${isAvail ? '#059669' : '#dc2626'};">
                ${isAvail ? 'In Stock' : 'Out of Stock'}
              </span>
            </td>
            <td>
              <div style="display: flex; gap: 6px; align-items: center;">
                <button class="btn btn-secondary btn-recipe-setup" data-id="${p.id}" title="Configure Recipe Ingredients" style="padding: 5px 10px; font-size: 11.5px; border-radius: 8px; font-weight: 700; display: inline-flex; align-items: center; gap: 5px;">
                  <i class="fa-solid fa-mortar-pestle" style="color: #2563eb;"></i> Recipe (${recipeCount})
                </button>
                <button class="btn btn-secondary btn-edit-product" data-id="${p.id}" title="Edit Product Details" style="padding: 5px 9px; font-size: 11.5px; border-radius: 8px;">
                  <i class="fa-solid fa-pen-to-square" style="color: #2563eb;"></i>
                </button>
                <button class="btn btn-danger btn-delete-product" data-id="${p.id}" title="Delete Product" style="padding: 5px 9px; font-size: 11.5px; border-radius: 8px;">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join("");
    }

    mount.innerHTML = `
      <div class="view-animate" style="display: flex; flex-direction: column; gap: 14px;">
        
        <!-- Summary Metric Chips Row -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px;">
          <div style="background: #ffffff; border: 1px solid var(--border-color); border-radius: 12px; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Total Catalog</div>
              <div style="font-size: 20px; font-weight: 900; color: var(--text-dark); margin-top: 2px;">${totalCount} Products</div>
            </div>
            <div style="width: 34px; height: 34px; border-radius: 10px; background: #eff6ff; color: #2563eb; display: flex; align-items: center; justify-content: center; font-size: 14px;">
              <i class="fa-solid fa-burger"></i>
            </div>
          </div>

          <div style="background: #ffffff; border: 1px solid var(--border-color); border-radius: 12px; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="font-size: 11px; font-weight: 700; color: #047857; text-transform: uppercase;">Available In POS</div>
              <div style="font-size: 20px; font-weight: 900; color: #059669; margin-top: 2px;">${availableCount} Active</div>
            </div>
            <div style="width: 34px; height: 34px; border-radius: 10px; background: #ecfdf5; color: #059669; display: flex; align-items: center; justify-content: center; font-size: 14px;">
              <i class="fa-solid fa-circle-check"></i>
            </div>
          </div>

          <div style="background: #ffffff; border: 1px solid var(--border-color); border-radius: 12px; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="font-size: 11px; font-weight: 700; color: #1e40af; text-transform: uppercase;">BOGO Special Offers</div>
              <div style="font-size: 20px; font-weight: 900; color: #2563eb; margin-top: 2px;">${bogoCount} Items</div>
            </div>
            <div style="width: 34px; height: 34px; border-radius: 10px; background: #eff6ff; color: #2563eb; display: flex; align-items: center; justify-content: center; font-size: 14px;">
              <i class="fa-solid fa-tags"></i>
            </div>
          </div>

          <div style="background: #ffffff; border: 1px solid var(--border-color); border-radius: 12px; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="font-size: 11px; font-weight: 700; color: #b45309; text-transform: uppercase;">Categories</div>
              <div style="font-size: 20px; font-weight: 900; color: #d97706; margin-top: 2px;">${categoriesCount} Food Groups</div>
            </div>
            <div style="width: 34px; height: 34px; border-radius: 10px; background: #fffbeb; color: #d97706; display: flex; align-items: center; justify-content: center; font-size: 14px;">
              <i class="fa-solid fa-layer-group"></i>
            </div>
          </div>
        </div>

        <!-- Filter & Search Toolbar Card -->
        <div class="glass-card" style="padding: 14px 18px; display: flex; flex-direction: column; gap: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
            <div class="menu-search-wrapper" style="position: relative; width: 260px;">
              <input type="text" id="menu-search-input" class="form-input" placeholder="Search menu item or category..." value="${this.searchQuery}" style="padding: 6px 12px 6px 30px; font-size: 12.5px; height: 36px; border-radius: 10px; width: 100%;">
              <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 10px; top: 11px; color: var(--text-muted); font-size: 12px; pointer-events: none;"></i>
            </div>
            <div style="font-size: 12px; color: var(--text-muted); font-weight: 700;">
              Showing <strong style="color: var(--text-dark);">${filtered.length}</strong> of ${products.length} items
            </div>
          </div>

          <!-- Category filter pills -->
          ${catPillsHtml}
        </div>

        <!-- Products Table Card -->
        <div class="glass-card" style="padding: 16px 18px;">
          <div class="table-container">
            <table class="premium-table">
              <thead>
                <tr>
                  <th>Product Details</th>
                  <th>Category</th>
                  <th>Unit Price</th>
                  <th>BOGO Offer</th>
                  <th>POS Availability</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="menu-products-tbody">
                ${rowsHtml}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;

    // Bind Search Input
    const searchInput = mount.querySelector("#menu-search-input");
    if (searchInput) {
      searchInput.oninput = (e) => {
        this.searchQuery = e.target.value.trim();
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

    // Bind item availability toggle
    mount.querySelectorAll(".toggle-availability-chk").forEach(chk => {
      chk.onchange = () => {
        const id = chk.getAttribute("data-id");
        const prod = products.find(p => p.id === id);
        if (prod) {
          prod.available = chk.checked;
          window.db.saveProduct(prod);
          window.showToast(`${prod.name} marked as ${chk.checked ? 'In Stock' : 'Out of Stock'} in POS.`, "success");
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

    // Bind Delete product
    mount.querySelectorAll(".btn-delete-product").forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-id");
        const prod = products.find(p => p.id === id);
        if (confirm(`Are you sure you want to delete "${prod.name}"?`)) {
          window.db.deleteProduct(id);
          window.showToast(`Product "${prod.name}" deleted.`, "info");
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

  openProductModal(product = null) {
    const categories = window.db.get("categories") || [];
    const categoriesOptions = categories.map(c => `<option value="${c.id}" ${product && product.category === c.id ? 'selected' : ''}>${c.name}</option>`).join("");

    const formHtml = `
      <div style="display: flex; flex-direction: column; gap: 14px; font-size: 13px;">
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label" for="prod-modal-name" style="font-weight: 700; margin-bottom: 5px;">Product Name *</label>
          <input type="text" id="prod-modal-name" class="form-input" value="${product ? product.name : ''}" placeholder="e.g. Cheese Veggie Frankie" style="height: 38px; border-radius: 10px;" required>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" for="prod-modal-price" style="font-weight: 700; margin-bottom: 5px;">Unit Price (₹) *</label>
            <input type="number" id="prod-modal-price" class="form-input" value="${product ? product.price : ''}" placeholder="e.g. 110" min="1" step="any" style="height: 38px; font-weight: 800; font-size: 14px; border-radius: 10px;" required>
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" for="prod-modal-category" style="font-weight: 700; margin-bottom: 5px;">Menu Category</label>
            <select id="prod-modal-category" class="form-select" style="height: 38px; border-radius: 10px; font-weight: 600;">
              ${categoriesOptions}
            </select>
          </div>
        </div>

        <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: 12px; padding: 12px 14px; display: flex; flex-direction: column; gap: 10px;">
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
        const category = document.getElementById("prod-modal-category").value;
        const bogo = document.getElementById("prod-modal-bogo").checked;
        const available = document.getElementById("prod-modal-avail").checked;

        if (!name || !price || isNaN(price) || Number(price) <= 0) {
          window.showToast("Please enter valid name and pricing details.", "error");
          return false;
        }

        window.db.saveProduct({
          id: product ? product.id : null,
          name,
          price: Number(price),
          category,
          bogo,
          available,
          recipe: product ? product.recipe : {}
        });

        window.showToast(product ? "Menu item details updated." : "New menu item saved successfully.", "success");
        this.render();
        return true;
      }
    });
  },

  // 2. CATEGORIES MANAGEMENT
  renderCategories(mount) {
    const categories = window.db.get("categories") || [];
    const products = window.db.get("products") || [];

    let rowsHtml = "";
    if (categories.length === 0) {
      rowsHtml = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 40px; font-weight: 600;">No categories found. Click Add Category to create one.</td></tr>`;
    } else {
      rowsHtml = categories.map(c => {
        const items = products.filter(p => p.category === c.id);
        const availCount = items.filter(p => p.available !== false).length;

        return `
          <tr>
            <td>
              <div style="font-weight: 800; color: var(--text-dark); font-size: 14px; display: flex; align-items: center; gap: 8px;">
                <div style="width: 28px; height: 28px; border-radius: 8px; background: #eff6ff; color: #2563eb; display: flex; align-items: center; justify-content: center; font-size: 12px;">
                  <i class="fa-solid fa-tag"></i>
                </div>
                ${c.name}
              </div>
            </td>
            <td style="color: var(--text-muted); font-size: 12px; font-weight: 600;">
              <code>${c.id}</code>
            </td>
            <td>
              <span style="font-size: 11.5px; font-weight: 800; background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; padding: 2px 10px; border-radius: 10px;">
                ${items.length} Products (${availCount} Active)
              </span>
            </td>
            <td>
              <div style="display: flex; gap: 6px;">
                <button class="btn btn-secondary btn-edit-category" data-id="${c.id}" title="Edit Category Name" style="padding: 5px 12px; font-size: 11.5px; border-radius: 8px; font-weight: 700; display: inline-flex; align-items: center; gap: 5px;">
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
              <i class="fa-solid fa-layer-group" style="color: #2563eb; margin-right: 6px;"></i> Menu Categories
            </h3>
            <p style="font-size: 12px; color: var(--text-muted); margin: 2px 0 0 0;">Manage food groups for sorting items on the POS terminal.</p>
          </div>
          <span style="font-size: 12px; font-weight: 800; color: #2563eb; background: #eff6ff; border: 1px solid #bfdbfe; padding: 3px 10px; border-radius: 10px;">
            ${categories.length} Categories
          </span>
        </div>

        <div class="table-container">
          <table class="premium-table">
            <thead>
              <tr>
                <th>Category Name</th>
                <th>Internal ID</th>
                <th>Menu Products Linked</th>
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
        if (confirm(`Deleting category "${cat.name}" will make all items inside it unassigned. Proceed?`)) {
          window.db.deleteCategory(id);
          window.showToast(`Category "${cat.name}" removed.`, "info");
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
          <input type="text" id="cat-modal-name" class="form-input" value="${category ? category.name : ''}" placeholder="e.g. Paneer Wraps, Premium Shakes" style="height: 38px; border-radius: 10px;" required>
        </div>
      </div>
    `;

    window.customModal.show({
      title: category ? `Edit Category Name - ${category.name}` : "Add New Menu Category",
      bodyHtml: formHtml,
      confirmText: category ? "Update Category" : "Save Category",
      onConfirm: () => {
        const name = document.getElementById("cat-modal-name").value.trim();
        if (!name) {
          window.showToast("Please enter a valid title.", "error");
          return false;
        }

        window.db.saveCategory({
          id: category ? category.id : null,
          name: name
        });

        window.showToast("Category updated successfully.", "success");
        this.render();
        return true;
      }
    });
  },

  // 3. RECIPE INGREDIENT MAPPER
  openRecipeModal(productId) {
    const products = window.db.get("products") || [];
    const ingredients = window.db.get("ingredients") || [];
    const product = products.find(p => p.id === productId);

    if (!product) return;

    // Local mutable copy of recipe mapping
    const localRecipe = { ...(product.recipe || {}) };

    const renderRecipeTable = () => {
      const rows = Object.entries(localRecipe).map(([ingId, qty]) => {
        const ing = ingredients.find(i => i.id === ingId);
        if (!ing) return "";
        return `
          <tr id="recipe-row-${ingId}">
            <td style="font-weight: 700; color: var(--text-dark);">${ing.name}</td>
            <td style="font-weight: 800; color: #2563eb;">${qty} ${ing.unit}</td>
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
                <th style="text-align: right;">Remove</th>
              </tr>
            </thead>
            <tbody id="recipe-modal-table-body">
              ${rows || `<tr><td colspan="3" style="text-align: center; color: var(--text-muted); padding: 25px; font-weight: 600;">No raw ingredients configured. This item does not deduct inventory.</td></tr>`}
            </tbody>
          </table>
        </div>
      `;
    };

    const dropdownOptions = ingredients
      .filter(ing => !localRecipe[ing.id])
      .map(ing => `<option value="${ing.id}">${ing.name} (${ing.unit})</option>`)
      .join("");

    const completeHtml = `
      <div style="margin-bottom: 12px; font-size: 12.5px; color: var(--text-muted); font-weight: 500;">
        Configure raw material inventory deducted when preparing a single portion of <strong style="color: #2563eb;">${product.name}</strong>.
      </div>
      
      <!-- Current Recipe Table -->
      <div id="recipe-table-wrapper">
        ${renderRecipeTable()}
      </div>

      <!-- Add New Ingredient Form Wrapper -->
      <div style="background: #f8fafc; border: 1px solid var(--border-color); padding: 12px 14px; border-radius: 12px;">
        <h4 style="font-size: 12px; margin: 0 0 8px 0; color: #2563eb; font-weight: 800; text-transform: uppercase;">+ Add Component to Recipe</h4>
        <div style="display: grid; grid-template-columns: 2fr 1fr auto; gap: 8px;">
          <select id="recipe-add-ing-select" class="form-select" style="font-size: 12px; height: 36px; padding: 4px 8px; border-radius: 8px;">
            ${dropdownOptions || '<option value="">No more ingredients</option>'}
          </select>
          <input type="number" id="recipe-add-qty-input" class="form-input" placeholder="Qty" min="0.01" step="any" style="font-size: 12px; height: 36px; padding: 4px 8px; border-radius: 8px; font-weight: 700;">
          <button class="btn btn-primary" id="btn-recipe-add-item-trigger" style="padding: 0 14px; height: 36px; font-size: 12px; border-radius: 8px; font-weight: 700;">Add</button>
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
          .map(ing => `<option value="${ing.id}">${ing.name} (${ing.unit})</option>`)
          .join("");
        select.innerHTML = opts || '<option value="">No more ingredients</option>';
      }
      bindTableListeners();
    };

    window.customModal.show({
      title: `Recipe Matrix - ${product.name}`,
      bodyHtml: completeHtml,
      confirmText: "Save Recipe Matrix",
      onConfirm: () => {
        product.recipe = localRecipe;
        window.db.saveProduct(product);
        window.showToast(`Recipe saved for ${product.name}`, "success");
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
          window.showToast("Select an ingredient component.", "error");
          return;
        }
        if (!qty || isNaN(qty) || Number(qty) <= 0) {
          window.showToast("Please enter a valid ingredient quantity.", "error");
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

  // 4. PERMISSIONS MATRIX
  renderPermissions(mount) {
    const permissions = window.db.get("permissions") || {
      admin: ["dashboard", "reports", "counter", "pos", "orders", "menu"],
      manager: ["dashboard", "reports", "counter", "pos", "orders", "menu"],
      staff: ["pos", "orders"]
    };

    const viewsList = [
      { id: "dashboard", name: "Dashboard Overview", icon: "fa-gauge-high", desc: "View business sales summaries, real-time metrics, and live charts." },
      { id: "reports", name: "Sales & Profit Reports", icon: "fa-chart-pie", desc: "Detailed historical analytics reports and CSV data exports." },
      { id: "counter", name: "Daily Counter & Bills", icon: "fa-cash-register", desc: "Daily cash & UPI counter totals, drawer tally, bill history & reprints." },
      { id: "pos", name: "POS Terminal Billing", icon: "fa-cart-shopping", desc: "Access the cashier billing screen to create and print bills." },
      { id: "orders", name: "KDS Kitchen Queue", icon: "fa-fire-burner", desc: "Display running kitchen orders and advance status." },
      { id: "menu", name: "Menu Setup & Recipes", icon: "fa-burger", desc: "Manage catalog items, food prices, BOGO, and recipes." }
    ];

    const rolesList = [
      { id: "admin", name: "Administrator", badge: "#eff6ff", color: "#1e40af" },
      { id: "manager", name: "Manager", badge: "#ecfdf5", color: "#065f46" },
      { id: "staff", name: "Kitchen / Staff", badge: "#fffbeb", color: "#b45309" }
    ];

    let rowsHtml = viewsList.map(v => {
      const cols = rolesList.map(r => {
        const isChecked = permissions[r.id].includes(v.id);
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
            <p style="font-size: 12px; color: var(--text-muted); margin: 3px 0 0 0;">Configure which screens each user role has permission to access.</p>
          </div>
          <span style="font-size: 11.5px; font-weight: 800; background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; padding: 3px 10px; border-radius: 10px;">
            Live Auto-Save
          </span>
        </div>
        
        <div class="table-container">
          <table class="premium-table">
            <thead>
              <tr>
                <th style="width: 45%; padding: 12px 18px;">POS Page / Feature</th>
                <th style="text-align: center; padding: 12px 16px;">Administrator</th>
                <th style="text-align: center; padding: 12px 16px;">Manager</th>
                <th style="text-align: center; padding: 12px 16px;">Staff / Cashier</th>
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

        if (chk.checked) {
          if (!permissions[roleId].includes(viewId)) {
            permissions[roleId].push(viewId);
          }
        } else {
          permissions[roleId] = permissions[roleId].filter(id => id !== viewId);
        }

        window.db.set("permissions", permissions);
        window.showToast(`Updated access for ${roleId.toUpperCase()} role.`, "success");
      };
    });
  }
};
