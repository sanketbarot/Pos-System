// Crust & Chilly POS - Menu & Recipe Setup Module
// Manages category edits, item creations, BOGO toggle actions, and ingredient recipe mappings.

window.views = window.views || {};
window.views.menu = {
  activeTab: "products", // 'products' or 'categories'

  init(container) {
    container.innerHTML = `
      <div class="view-animate" style="display: flex; flex-direction: column; gap: 16px;">
        <!-- Sub Header Tabs -->
        <div class="flex-space" style="background: var(--bg-darker); padding: 12px 20px; border-radius: var(--border-radius-lg); border: 1px solid var(--border-color);">
          <div class="flex-gap-sm">
            <button class="btn btn-secondary ${this.activeTab === 'products' ? 'btn-primary' : ''}" id="menu-sub-products">
              <i class="fa-solid fa-burger"></i> Menu Products
            </button>
            <button class="btn btn-secondary ${this.activeTab === 'categories' ? 'btn-primary' : ''}" id="menu-sub-categories">
              <i class="fa-solid fa-tags"></i> Item Categories
            </button>
          </div>
          <button class="btn btn-primary" id="btn-add-menu-entity">
            <i class="fa-solid fa-plus-circle"></i> Add New
          </button>
        </div>

        <!-- Render Mount -->
        <div id="menu-content-mount"></div>
      </div>
    `;

    this.setupListeners();
    this.render();
  },

  setupListeners() {
    const btnProd = document.getElementById("menu-sub-products");
    const btnCat = document.getElementById("menu-sub-categories");
    const btnAdd = document.getElementById("btn-add-menu-entity");

    btnProd.onclick = () => {
      this.activeTab = "products";
      btnProd.className = "btn btn-primary";
      btnCat.className = "btn btn-secondary";
      this.render();
    };

    btnCat.onclick = () => {
      this.activeTab = "categories";
      btnCat.className = "btn btn-primary";
      btnProd.className = "btn btn-secondary";
      this.render();
    };

    btnAdd.onclick = () => {
      if (this.activeTab === "products") {
        this.openProductModal();
      } else {
        this.openCategoryModal();
      }
    };
  },

  render() {
    const mount = document.getElementById("menu-content-mount");
    if (this.activeTab === "products") {
      this.renderProducts(mount);
    } else {
      this.renderCategories(mount);
    }
  },

  // 1. PRODUCTS MANAGEMENT
  renderProducts(mount) {
    const products = window.db.get("products") || [];
    const categories = window.db.get("categories") || [];

    let rows = "";
    if (products.length === 0) {
      rows = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 40px;">No products configured. Click Add New to create.</td></tr>`;
    } else {
      rows = products.map(p => {
        const cat = categories.find(c => c.id === p.category);
        const recipeCount = p.recipe ? Object.keys(p.recipe).length : 0;
        
        return `
          <tr>
            <td style="font-weight: 600;">${p.name}</td>
            <td><span class="badge badge-preparing" style="background: rgba(41,121,255,0.05); border: 1px solid var(--border-color); color: var(--text-muted);">${cat ? cat.name : 'None'}</span></td>
            <td style="font-weight: 700; color: #ff8008;">₹${p.price.toFixed(2)}</td>
            <td>
              <span class="badge ${p.bogo ? 'badge-completed' : 'badge-cancelled'}">${p.bogo ? 'ACTIVE BOGO' : 'No'}</span>
            </td>
            <td>
              <!-- Interactive checkbox toggle -->
              <input type="checkbox" class="toggle-availability-chk" data-id="${p.id}" ${p.available ? 'checked' : ''} style="cursor: pointer; width: 16px; height: 16px;">
            </td>
            <td>
              <div class="flex-gap-sm">
                <button class="btn btn-secondary btn-recipe-setup" data-id="${p.id}" style="padding: 6px 12px; font-size: 12px; border-color: var(--border-color-hover);">
                  <i class="fa-solid fa-mortar-pestle" style="color: #ff8008;"></i> Recipe (${recipeCount})
                </button>
                <button class="btn btn-secondary btn-edit-product" data-id="${p.id}" style="padding: 6px 10px; font-size: 12px;"><i class="fa-solid fa-edit"></i></button>
                <button class="btn btn-danger btn-delete-product" data-id="${p.id}" style="padding: 6px 10px; font-size: 12px;"><i class="fa-solid fa-trash"></i></button>
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
              <th>Item Name</th>
              <th>Category</th>
              <th>Unit Price</th>
              <th>BOGO Offer</th>
              <th>Available</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;

    // Bind item availability checkbox change
    mount.querySelectorAll(".toggle-availability-chk").forEach(chk => {
      chk.onchange = () => {
        const id = chk.getAttribute("data-id");
        const prod = products.find(p => p.id === id);
        if (prod) {
          prod.available = chk.checked;
          window.db.saveProduct(prod);
          window.showToast(`${prod.name} availability toggled.`, "success");
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
        if (confirm(`Are you sure you want to delete ${prod.name}?`)) {
          window.db.deleteProduct(id);
          window.showToast("Product deleted.", "info");
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
      <div class="form-group">
        <label class="form-label" for="prod-modal-name">Product Name</label>
        <input type="text" id="prod-modal-name" class="form-input" value="${product ? product.name : ''}" placeholder="e.g. Cheese Veggie Frankie" required>
      </div>
      <div class="form-group">
        <label class="form-label" for="prod-modal-price">Price (₹)</label>
        <input type="number" id="prod-modal-price" class="form-input" value="${product ? product.price : ''}" placeholder="e.g. 110" required>
      </div>
      <div class="form-group">
        <label class="form-label" for="prod-modal-category">Category</label>
        <select id="prod-modal-category" class="form-select">
          ${categoriesOptions}
        </select>
      </div>
      <div class="form-group" style="flex-direction: row; gap: 10px; align-items: center; margin-top: 10px;">
        <input type="checkbox" id="prod-modal-bogo" style="cursor: pointer; width:16px; height:16px;" ${product && product.bogo ? 'checked' : ''}>
        <label class="form-label" for="prod-modal-bogo" style="cursor: pointer; margin-bottom: 0;">Enable Buy One Get One (BOGO) Offer</label>
      </div>
      <div class="form-group" style="flex-direction: row; gap: 10px; align-items: center;">
        <input type="checkbox" id="prod-modal-avail" style="cursor: pointer; width:16px; height:16px;" ${product && !product.available ? '' : 'checked'}>
        <label class="form-label" for="prod-modal-avail" style="cursor: pointer; margin-bottom: 0;">Mark Available Immediately</label>
      </div>
    `;

    window.customModal.show({
      title: product ? "Edit Menu Product" : "Create New Product",
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
      }
    });
  },

  // 2. CATEGORIES MANAGEMENT
  renderCategories(mount) {
    const categories = window.db.get("categories") || [];
    const products = window.db.get("products") || [];

    let rows = categories.map(c => {
      const itemsCount = products.filter(p => p.category === c.id).length;
      return `
        <tr>
          <td><i class="fa-solid fa-tags" style="color:#ff8008; margin-right: 6px;"></i> <strong>${c.name}</strong></td>
          <td>${c.id}</td>
          <td>${itemsCount} items linked</td>
          <td>
            <div class="flex-gap-sm">
              <button class="btn btn-secondary btn-edit-category" data-id="${c.id}" style="padding: 6px 10px; font-size: 12px;"><i class="fa-solid fa-edit"></i> Edit Name</button>
              <button class="btn btn-danger btn-delete-category" data-id="${c.id}" style="padding: 6px 10px; font-size: 12px;"><i class="fa-solid fa-trash"></i></button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    mount.innerHTML = `
      <div class="table-container view-animate">
        <table class="premium-table">
          <thead>
            <tr>
              <th>Category Name</th>
              <th>Internal ID</th>
              <th>Menu Items Count</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;

    // Bind Edit Cat name
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
        if (confirm(`Deleting category "${cat.name}" will make all items inside it unavailable. Proceed?`)) {
          window.db.deleteCategory(id);
          window.showToast("Category removed and products disabled.", "info");
          this.render();
        }
      };
    });
  },

  openCategoryModal(category = null) {
    const formHtml = `
      <div class="form-group">
        <label class="form-label" for="cat-modal-name">Category Title</label>
        <input type="text" id="cat-modal-name" class="form-input" value="${category ? category.name : ''}" placeholder="e.g. Paneer Wraps" required>
      </div>
    `;

    window.customModal.show({
      title: category ? "Edit Category Name" : "Add New Category",
      bodyHtml: formHtml,
      confirmText: category ? "Update" : "Save",
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

        window.showToast("Category settings updated successfully.", "success");
        this.render();
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
            <td>${ing.name}</td>
            <td style="font-weight: 700; color: #ff8008;">${qty} ${ing.unit}</td>
            <td style="text-align: right;">
              <button class="btn btn-danger btn-delete-recipe-item" data-id="${ingId}" style="padding: 4px 8px; font-size: 11px;">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </td>
          </tr>
        `;
      }).join("");

      return `
        <div class="table-container" style="max-height: 200px; overflow-y: auto; margin-bottom: 16px;">
          <table class="premium-table" style="font-size: 13px;">
            <thead>
              <tr>
                <th>Raw Ingredient</th>
                <th>Quantity Required</th>
                <th style="text-align: right;">Remove</th>
              </tr>
            </thead>
            <tbody id="recipe-modal-table-body">
              ${rows || `<tr><td colspan="3" style="text-align: center; color: var(--text-muted); padding: 20px;">No ingredients configured. This is served directly.</td></tr>`}
            </tbody>
          </table>
        </div>
      `;
    };

    const dropdownOptions = ingredients
      .filter(ing => !localRecipe[ing.id]) // don't list already added ingredients
      .map(ing => `<option value="${ing.id}">${ing.name} (${ing.unit})</option>`)
      .join("");

    const completeHtml = `
      <div style="margin-bottom: 14px; font-size: 13px; color: var(--text-muted);">
        Configure recipe ingredients required to prepare a single portion of <strong>${product.name}</strong>.
      </div>
      
      <!-- Current Recipe Table -->
      <div id="recipe-table-wrapper">
        ${renderRecipeTable()}
      </div>

      <!-- Add New Ingredient Form Wrapper -->
      <div style="background: var(--bg-darker); border: 1px solid var(--border-color); padding: 12px; border-radius: var(--border-radius-md);">
        <h4 style="font-size: 12px; margin-bottom: 8px; color: #ff8008;">Add Ingredient Component</h4>
        <div class="customer-details-inputs" style="grid-template-columns: 2fr 1fr auto; gap: 8px;">
          <select id="recipe-add-ing-select" class="customer-input" style="font-size: 12px; height: 32px;">
            ${dropdownOptions || '<option value="">No more ingredients</option>'}
          </select>
          <input type="number" id="recipe-add-qty-input" class="customer-input" placeholder="Qty" style="font-size: 12px; height: 32px;">
          <button class="btn btn-primary" id="btn-recipe-add-item-trigger" style="padding: 0 12px; height: 32px; font-size: 12px;">Add</button>
        </div>
      </div>
    `;

    // Internal controllers
    const bindTableListeners = () => {
      const body = document.getElementById("recipe-modal-table-body");
      body.querySelectorAll(".btn-delete-recipe-item").forEach(btn => {
        btn.onclick = () => {
          const ingId = btn.getAttribute("data-id");
          delete localRecipe[ingId];
          refreshModalContent();
        };
      });
    };

    const refreshModalContent = () => {
      // Re-render table wrapper
      document.getElementById("recipe-table-wrapper").innerHTML = renderRecipeTable();
      
      // Update dropdown options
      const select = document.getElementById("recipe-add-ing-select");
      const opts = ingredients
        .filter(ing => !localRecipe[ing.id])
        .map(ing => `<option value="${ing.id}">${ing.name} (${ing.unit})</option>`)
        .join("");
      
      select.innerHTML = opts || '<option value="">No more ingredients</option>';
      bindTableListeners();
    };

    window.customModal.show({
      title: `Edit Recipe - ${product.name}`,
      bodyHtml: completeHtml,
      confirmText: "Update Recipe Matrix",
      onConfirm: () => {
        product.recipe = localRecipe;
        window.db.saveProduct(product);
        window.showToast(`Recipe matrix successfully saved for ${product.name}`, "success");
        this.render();
      }
    });

    // Bind sub-add trigger clicks
    document.getElementById("btn-recipe-add-item-trigger").onclick = () => {
      const ingId = document.getElementById("recipe-add-ing-select").value;
      const qty = document.getElementById("recipe-add-qty-input").value;

      if (!ingId) {
        window.showToast("Select an ingredient.", "error");
        return;
      }
      if (!qty || isNaN(qty) || Number(qty) <= 0) {
        window.showToast("Please enter a valid recipe requirement quantity.", "error");
        return;
      }

      localRecipe[ingId] = Number(qty);
      document.getElementById("recipe-add-qty-input").value = "";
      refreshModalContent();
      window.showToast("Ingredient component added below.", "success");
    };

    // Bind initial delete listeners
    bindTableListeners();
  }
};
