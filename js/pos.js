function getProductImage(name, categoryId) {
  const n = name.toLowerCase();

  // 1. BURGERS (Mapped name-wise for different looks)
  if (n.includes("burger")) {
    if (n.includes("schezwan") || n.includes("spicy")) {
      return "https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?w=200&auto=format&fit=crop&q=80";
    }
    if (n.includes("achari")) {
      return "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&auto=format&fit=crop&q=80"; // Mockup sesame burger
    }
    if (n.includes("pizzeria")) {
      return "https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=200&auto=format&fit=crop&q=80";
    }
    if (n.includes("afghani") || n.includes("indian style")) {
      return "https://images.unsplash.com/photo-1550547660-d9450f859349?w=200&auto=format&fit=crop&q=80";
    }
    if (n.includes("cheese burst") || n.includes("special")) {
      return "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=200&auto=format&fit=crop&q=80"; // double cheese patty
    }
    return "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&auto=format&fit=crop&q=80";
  }

  // 2. SANDWICHES & SLICES (Mapped name-wise)
  if (n.includes("sandwich") || n.includes("slice")) {
    if (n.includes("jam") || n.includes("chocolate")) {
      return "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=200&auto=format&fit=crop&q=80"; // sweet jam toast
    }
    if (n.includes("cheese") || n.includes("chutney")) {
      return "https://images.unsplash.com/photo-1540713786274-575b51d42137?w=200&auto=format&fit=crop&q=80"; // grilled cheese
    }
    return "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=200&auto=format&fit=crop&q=80"; // fresh green veg sandwich
  }

  // 3. FRANKIE / WRAP
  if (n.includes("frankie") || n.includes("wrap")) {
    return "https://images.unsplash.com/photo-1626700051175-6518c4793f4f?w=200&auto=format&fit=crop&q=80"; // Paneer wrap
  }

  // 4. FRIES
  if (n.includes("fries")) {
    return "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=200&auto=format&fit=crop&q=80"; // golden fries
  }

  // 5. MAGGI / NOODLES
  if (n.includes("maggi") || n.includes("noodle")) {
    return "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200&auto=format&fit=crop&q=80"; // veg noodles
  }

  // 6. MOJITOS & COLD DRINKS & WATER (Mapped name-wise)
  if (n.includes("mojito")) {
    return "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=200&auto=format&fit=crop&q=80"; // Mojito glass
  }
  if (n.includes("drink") || categoryId === "cat8") {
    return "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=200&auto=format&fit=crop&q=80"; // soft drink bottle
  }
  if (n.includes("water") || categoryId === "cat10") {
    return "https://images.unsplash.com/photo-1608889174637-3c44f6326f1a?w=200&auto=format&fit=crop&q=80"; // water bottle
  }

  // 7. COMBOS
  if (n.includes("combo")) {
    return "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=200&auto=format&fit=crop&q=80"; // samosa snack combo platter
  }

  return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&auto=format&fit=crop&q=80"; // default
}

window.views = window.views || {};
window.views.pos = {
  cart: [],
  selectedCategory: "all",
  searchQuery: "",
  selectedPayment: "UPI",
  orderType: "Dine-in",

  init(container) {
    // Reset view variables
    this.cart = [];
    this.selectedCategory = "all";
    this.searchQuery = "";
    this.selectedPayment = "UPI";
    this.orderType = "Dine-in";
    this.currentUser = window.db.getCurrentUser();

    container.innerHTML = `
      <div class="pos-layout view-animate">
        <!-- Top Custom Header -->
        <div class="pos-custom-header">
          <!-- Search Bar -->
          <div style="position: relative; display: flex; align-items: center; width: 450px;">
            <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 14px; color: var(--text-muted); pointer-events: none; z-index: 5;"></i>
            <input type="text" id="pos-search" class="pos-search-input" value="${this.searchQuery}" placeholder="Search menu items... (e.g. Burger, Pizza, Fries)">
            <button type="button" id="btn-clear-search" style="position: absolute; right: 90px; background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; display: ${this.searchQuery ? 'flex' : 'none'}; align-items: center; justify-content: center; outline: none; z-index: 5;">
              <i class="fa-solid fa-circle-xmark" style="font-size: 14px;"></i>
            </button>
            <span style="position: absolute; right: 12px; font-size: 10px; background: var(--bg-dark); border: 1px solid var(--border-color); color: var(--text-muted); padding: 2px 6px; border-radius: 4px; pointer-events: none; z-index: 5;">Ctrl + K</span>
          </div>

          <!-- Dine In / Takeaway / Delivery Toggle Buttons -->
          <div style="display: flex; gap: 10px; align-items: center;">
            <button class="pos-header-btn ${this.orderType === 'Dine-in' ? 'active' : ''}" id="type-dinein">
              <i class="fa-solid fa-utensils"></i> Dine In
            </button>
            <button class="pos-header-btn ${this.orderType === 'Takeaway' ? 'active' : ''}" id="type-takeaway">
              <i class="fa-solid fa-bag-shopping"></i> Takeaway
            </button>
            <button class="pos-header-btn ${this.orderType === 'Delivery' ? 'active' : ''}" id="type-delivery">
              <i class="fa-solid fa-motorcycle"></i> Delivery
            </button>
          </div>

          <!-- Right side: Notifications, User info -->
          <div style="display: flex; align-items: center; gap: 20px;">
            <!-- Notifications bell with badge -->
            <div class="alert-badge-container" style="position: relative; cursor: pointer; color: var(--text-dark); font-size: 18px;">
              <i class="fa-solid fa-bell"></i>
              <span style="position: absolute; top: -5px; right: -5px; background: #ff3b30; color: #fff; font-size: 9px; font-weight: 800; border-radius: 50%; width: 15px; height: 15px; display: flex; align-items: center; justify-content: center;">3</span>
            </div>

            <!-- User profile info -->
            <div style="display: flex; align-items: center; gap: 8px;">
              <div class="user-avatar" style="width: 32px; height: 32px; font-size: 13px; font-weight: 700; background: #ff5c00; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">S</div>
              <div style="text-align: left;">
                <div style="font-size: 12px; font-weight: 700; color: var(--text-dark); line-height: 1.2;">Sanket Barot</div>
                <div style="font-size: 10px; color: var(--text-muted); text-transform: capitalize; line-height: 1.1;">Admin</div>
              </div>
              <i class="fa-solid fa-chevron-down" style="font-size: 10px; color: var(--text-muted);"></i>
            </div>
          </div>
        </div>

        <!-- Main Workspace split pane -->
        <div class="pos-main-content">
          <!-- Products Panel (Left) -->
          <div class="pos-products-panel">
            <div class="pos-categories-tabs" id="pos-category-list" style="padding-bottom: 0; margin-bottom: 4px;">
              <!-- Categories injected dynamically -->
            </div>
            
            <div class="pos-products-grid-scroll">
              <div class="pos-products-grid" id="pos-grid">
                <!-- Products injected dynamically -->
              </div>
            </div>
          </div>

          <!-- Right Checkout Billing Drawer -->
          <div class="pos-cart-panel" style="border-left: 1px solid var(--border-color); padding-left: 20px; display: flex; flex-direction: column; overflow: hidden; height: 100%;">
            <div class="cart-header" style="flex-shrink: 0;">
              <div class="cart-title" style="font-size: 15px; font-weight: 700; display: flex; align-items: center; gap: 6px;">
                Current Order <span class="cart-item-count-badge" id="cart-qty-badge" style="background: #ff5c00; font-size: 11px; color:#fff; border-radius:50%; width:18px; height:18px; display:inline-flex; align-items:center; justify-content:center;">0</span>
              </div>
              <button class="btn-clear-cart" id="btn-clear-cart-trigger" style="font-size: 12px; display: flex; align-items: center; gap: 4px; color:#f44336; border:none; background:transparent; font-weight:700; cursor:pointer;"><i class="fa-solid fa-trash-can"></i> Clear</button>
            </div>

            <!-- Customer Details Block (Top of Sidebar) -->
            <div style="display: flex; flex-direction: column; gap: 6px; padding: 10px 0; border-bottom: 1px solid var(--border-color); flex-shrink: 0;">
              <!-- Row 1: Name -->
              <div style="display: flex; align-items: center; border: 1px solid var(--border-color); border-radius: 6px; padding: 6px 10px; background: #fff;">
                <i class="fa-regular fa-user" style="color: var(--text-muted); font-size: 13px; margin-right: 8px;"></i>
                <input type="text" id="cust-name" class="customer-input" placeholder="Customer Name" list="customer-names-list" value="Walk-in Customer" autocomplete="off" style="border: none; outline: none; background: transparent; font-weight: 600; font-size: 12px; color: var(--text-dark); flex-grow: 1; padding: 0;">
                <datalist id="customer-names-list"></datalist>
                <span id="btn-add-cust-shortcut" style="color: var(--text-muted); font-size: 11px; font-weight: 600; border-left: 1px solid var(--border-color); padding-left: 8px; margin-left: 8px; cursor: pointer; white-space: nowrap;"><i class="fa-solid fa-plus" style="font-size: 9px; margin-right: 2px;"></i> Add Customer</span>
              </div>
              <!-- Row 2: Phone -->
              <div style="display: flex; align-items: center; border: 1px solid var(--border-color); border-radius: 6px; padding: 6px 10px; background: #fff;">
                <i class="fa-solid fa-phone" style="color: var(--text-muted); font-size: 12px; margin-right: 8px;"></i>
                <span style="color: var(--text-muted); font-size: 11px; font-weight: 600; margin-right: 6px;">+91</span>
                <input type="tel" id="cust-phone" class="customer-input" placeholder="Phone number" list="customer-phones-list" autocomplete="off" style="border: none; outline: none; background: transparent; font-size: 12px; color: var(--text-dark); flex-grow: 1; padding: 0;">
                <datalist id="customer-phones-list"></datalist>
              </div>
            </div>

            <!-- Cart items list scrollable -->
            <div class="cart-items-scroll" id="cart-items-list" style="flex-grow: 1; overflow-y: auto; margin: 8px 0; padding-right: 4px;">
              <div style="text-align: center; color: var(--text-muted); margin-top: 60px;">
                <i class="fa-solid fa-basket-shopping" style="font-size: 36px; margin-bottom: 12px; display: block; opacity: 0.3;"></i>
                Cart is currently empty.<br>Click items on the left to add.
              </div>
            </div>

            <!-- Cart billing summary details -->
            <div class="cart-billing-details" style="flex-shrink: 0; background: transparent; padding: 0; border: none;">
              <!-- Coupon Code Section -->
              <div style="display: flex; gap: 8px; margin: 4px 0 8px 0; padding-bottom: 8px; border-bottom: 1px dashed var(--border-color);">
                <input type="text" id="coupon-code-input" class="customer-input" placeholder="Enter coupon code" style="flex-grow: 1; height: 32px; font-size: 12px; padding: 0 10px; border: 1px solid var(--border-color); border-radius: 6px; outline: none; background: #fff; width: 100%;">
                <button onclick="views.pos.applyCouponCode()" style="background: #ff5c00; border: none; color: #fff; padding: 0 16px; height: 32px; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer; transition: var(--transition-smooth);">Apply</button>
              </div>

              <!-- Invoice billing summary calculations -->
              <div class="billing-summary-lines" style="padding: 0; gap: 4px; background: transparent; border: none; box-shadow: none;">
                <div class="billing-line" style="font-size: 12px; display: flex; justify-content: space-between;">
                  <span>Subtotal</span>
                  <span id="bill-subtotal" style="font-weight: 600; color: var(--text-dark);">₹0.00</span>
                </div>
                <div class="billing-line" id="bogo-discount-row" style="display: none; font-size: 12px; justify-content: space-between;">
                  <span>BOGO Discount</span>
                  <span id="bill-bogo-discount" style="color: #ff5c00; font-weight: 600;">-₹0.00</span>
                </div>
                <div class="billing-line" style="font-size: 12px; display: flex; justify-content: space-between; align-items: center;">
                  <span>Discount (<input type="number" id="bill-discount-input" style="width: 28px; border: none; background: transparent; padding: 0; font-weight: 700; color: #ff5c00; font-family: inherit; font-size: inherit; text-align: center; outline: none;" value="0" min="0" max="100">%)</span>
                  <span id="bill-discount-amount" style="color: #4caf50; font-weight: 700;">-₹0.00</span>
                </div>
                <div class="billing-line" style="font-size: 12px; display: flex; justify-content: space-between; align-items: center;">
                  <span class="flex-gap-sm" style="display: flex; align-items: center; gap: 4px;">
                    Tax / GST (5%)
                    <input type="checkbox" id="tax-enable-checkbox" style="cursor: pointer; width: 12px; height: 12px; margin: 0;" checked>
                  </span>
                  <span id="bill-tax" style="font-weight: 600; color: var(--text-dark);">₹0.00</span>
                </div>
                <div class="billing-line total" style="font-size: 14px; padding-top: 8px; border-top: 1px dashed var(--border-color); margin-top: 6px; display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-weight: 800; color: var(--text-dark);">TOTAL</span>
                  <span id="bill-total" style="color: #ff5c00; font-weight: 800; font-size: 20px;">₹0.00</span>
                </div>
              </div>

              <!-- Payment Type Selection Button Options -->
              <div class="checkout-payment-options" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-top: 10px; margin-bottom: 10px;">
                <button class="payment-btn active" id="pay-upi" style="height: 52px; font-size: 11px; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 4px; border-radius: 8px; border: 1px solid var(--border-color); cursor: pointer;"><i class="fa-solid fa-qrcode" style="font-size: 14px;"></i>UPI</button>
                <button class="payment-btn" id="pay-cash" style="height: 52px; font-size: 11px; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 4px; border-radius: 8px; border: 1px solid var(--border-color); cursor: pointer; color: var(--text-muted);"><i class="fa-solid fa-money-bill-wave" style="font-size: 14px;"></i>Cash</button>
                <button class="payment-btn" id="pay-card" style="height: 52px; font-size: 11px; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 4px; border-radius: 8px; border: 1px solid var(--border-color); cursor: pointer; color: var(--text-muted);"><i class="fa-solid fa-credit-card" style="font-size: 14px;"></i>Card</button>
                <button class="payment-btn" id="pay-split" style="height: 52px; font-size: 11px; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 4px; border-radius: 8px; border: 1px solid var(--border-color); cursor: pointer; color: var(--text-muted);"><i class="fa-solid fa-shuffle" style="font-size: 14px;"></i>Split</button>
              </div>

              <!-- Submit checkout and Save Order -->
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <button class="btn-checkout" id="btn-checkout-trigger" style="padding: 10px; font-size: 14px; font-weight: 700; border-radius: 6px; background: #ff5c00; color: #fff; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: var(--transition-smooth); width: 100%;">
                  <i class="fa-solid fa-print"></i> Place Order & Print
                </button>
                <button class="btn btn-secondary" id="btn-save-order-trigger" style="width: 100%; padding: 8px; font-size: 13px; font-weight: 700; border-radius: 6px; border: 1.5px solid #ff5c00; background: #fff; color: #ff5c00; display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; transition: var(--transition-smooth);">
                  <i class="fa-solid fa-bookmark"></i> Save Order
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Bar -->
        <div class="pos-footer-bar">
          <div style="display: flex; gap: 16px;">
            <span><span style="color: var(--text-muted); font-weight:700; margin-right:4px;">F1</span> New Order</span>
            <span><span style="color: var(--text-muted); font-weight:700; margin-right:4px;">F3</span> Hold Order</span>
            <span><span style="color: var(--text-muted); font-weight:700; margin-right:4px;">F4</span> Orders</span>
          </div>
          <div style="display: flex; gap: 16px;">
            <span><span style="color: var(--text-muted); font-weight:700; margin-right:4px;">Ctrl + B</span> Bill Print</span>
            <span><span style="color: var(--text-muted); font-weight:700; margin-right:4px;">Ctrl + D</span> Discount</span>
            <span><span style="color: var(--text-muted); font-weight:700; margin-right:4px;">Ctrl + P</span> Payment</span>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="display: flex; align-items: center; gap: 6px;"><i class="fa-solid fa-circle" style="color: #00e676; font-size: 8px;"></i> Online</span>
            <span id="pos-footer-clock" style="font-family: monospace;">Loading...</span>
          </div>
        </div>
      </div>
    `;

    this.renderCategories();
    this.renderProducts();

    // Start Clock in Footer
    const startFooterClock = () => {
      const clock = document.getElementById("pos-footer-clock");
      if (!clock) return;
      const update = () => {
        if (!clock.isConnected) return;
        const d = new Date();
        const dateStr = d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
        const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        clock.textContent = `${dateStr} ${timeStr}`;
        setTimeout(update, 1000);
      };
      update();
    };
    startFooterClock();

    // Restore GST toggle state memory
    const taxCheck = document.getElementById("tax-enable-checkbox");
    if (taxCheck) {
      taxCheck.checked = localStorage.getItem("cc_pos_tax_enabled") === "true";
    }

    this.setupListeners();
    this.populateCustomerAutocompletes();
  },

  renderCategories() {
    const cats = window.db.get("categories") || [];
    const container = document.getElementById("pos-category-list");

    let html = `<div class="category-tab active" data-id="all"><i class="fa-solid fa-border-all"></i> All Items</div>`;

    cats.forEach(c => {
      // Map fontawesome names to solid icons
      let icon = "fa-pizza-slice";
      if (c.icon === "hamburger") icon = "fa-hamburger";
      if (c.icon === "bread-slice") icon = "fa-bread-slice";
      if (c.icon === "hotdog") icon = "fa-hotdog";
      if (c.icon === "wrap") icon = "fa-scroll";
      if (c.icon === "box-tissue") icon = "fa-box-tissue";
      if (c.icon === "bowl-food") icon = "fa-bowl-food";
      if (c.icon === "glass-water") icon = "fa-glass-water";
      if (c.icon === "wine-bottle") icon = "fa-wine-bottle";
      if (c.icon === "plus") icon = "fa-plus";
      if (c.icon === "utensils") icon = "fa-utensils";

      html += `
        <div class="category-tab" data-id="${c.id}">
          <i class="fa-solid ${icon}"></i> ${c.name}
        </div>
      `;
    });
    container.innerHTML = html;

    // Attach click listeners to tabs
    const tabs = container.querySelectorAll(".category-tab");
    tabs.forEach(tab => {
      tab.onclick = () => {
        tabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        this.selectedCategory = tab.getAttribute("data-id");
        this.renderProducts();
      };
    });
  },

  renderProducts() {
    const products = window.db.get("products") || [];
    const grid = document.getElementById("pos-grid");

    // Filter logic
    let filtered = products.filter(p => p.available);

    if (this.selectedCategory !== "all") {
      filtered = filtered.filter(p => p.category === this.selectedCategory);
    }

    if (this.searchQuery.trim() !== "") {
      const q = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(q));
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 60px;">
          <i class="fa-solid fa-magnifying-glass" style="font-size: 32px; margin-bottom: 12px; display: block; opacity: 0.3;"></i>
          No products matched search or category.
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(p => {
      // Check recipe stocks to display indicators
      const stockCheck = window.db.checkStockAvailability(p.id, 1);
      const isAvailable = stockCheck.available;

      // Top left status dot color based on stock
      let statusDotColor = "var(--color-ready)";
      if (!isAvailable) {
        statusDotColor = "var(--color-cancelled)";
      } else {
        const ingredients = window.db.get("ingredients") || [];
        const isNearLowStock = p.recipe ? Object.keys(p.recipe).some(ingId => {
          const ing = ingredients.find(i => i.id === ingId);
          return ing && ing.stock <= ing.minLimit * 1.5;
        }) : false;
        if (isNearLowStock) {
          statusDotColor = "var(--color-pending)";
        }
      }

      // Check current cart quantity of this item
      const cartItem = this.cart.find(item => item.productId === p.id);
      const cartQty = cartItem ? cartItem.quantity : 0;

      let actionButtonHtml = "";
      if (cartQty === 0) {
        actionButtonHtml = `
          <button class="pos-card-add-btn" onclick="event.stopPropagation(); views.pos.addToCart('${p.id}')">
            Add <i class="fa-solid fa-plus" style="font-size: 10px; margin-left: 4px;"></i>
          </button>
        `;
      } else {
        actionButtonHtml = `
          <div class="pos-card-qty-control" onclick="event.stopPropagation();">
            <button class="pos-card-qty-btn" onclick="views.pos.modifyQty('${p.id}', -1)"><i class="fa-solid fa-minus"></i></button>
            <span class="pos-card-qty-val">${cartQty}</span>
            <button class="pos-card-qty-btn" onclick="views.pos.modifyQty('${p.id}', 1)"><i class="fa-solid fa-plus"></i></button>
          </div>
        `;
      }

      const outOfStockClass = !isAvailable ? "out-of-stock" : "";
      const selectedClass = cartQty > 0 ? "selected" : "";

      return `
        <div class="product-card ${outOfStockClass} ${selectedClass}" data-id="${p.id}" style="${cartQty > 0 ? 'border-color: #ff5c00; box-shadow: 0 4px 12px rgba(255, 92, 0, 0.08);' : ''}">
          <!-- Indian Pure Veg green square-circle indicator at top left -->
          <span style="position: absolute; top: 12px; left: 12px; display: inline-flex; align-items: center; justify-content: center; width: 13px; height: 13px; border: 1.2px solid #0f8a4f; padding: 1px; border-radius: 2px; background: #fff; z-index: 5;">
            <span style="width: 6px; height: 6px; border-radius: 50%; background: #0f8a4f;"></span>
          </span>
          
          <!-- BOGO offer badge at top right -->
          ${p.bogo ? `<span class="product-bogo-badge" style="position: absolute; top: 12px; right: 12px; margin: 0; background: #4caf50; font-size: 10px; font-weight: 700; color: #fff; padding: 2px 6px; border-radius: 4px; z-index: 5;">BOGO</span>` : ""}
          
          <!-- Product Name in Middle -->
          <div style="margin-top: 28px; text-align: left;">
            <h4 class="product-name" style="margin: 0; font-size: 13px; font-weight: 700; color: var(--text-dark); line-height: 1.3; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; min-height: 34px;">
              ${p.name}
            </h4>
          </div>

          <!-- Bottom Row: Price on left, Add Button on right -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px; width: 100%;">
            <span class="product-price" style="font-weight: 800; color: #ff5c00; font-size: 15px;">₹${p.price}</span>
            <div style="display: flex; align-items: center; min-height: 28px;">
              ${actionButtonHtml}
            </div>
          </div>
        </div>
      `;
    }).join("");

    // Bind card clicks
    grid.querySelectorAll(".product-card").forEach(card => {
      card.onclick = () => {
        if (card.classList.contains("out-of-stock")) {
          window.showToast("Cannot add to cart: One or more raw materials are completely out of stock.", "error");
          return;
        }
        const prodId = card.getAttribute("data-id");
        this.addToCart(prodId);
      };
    });
  },

  addToCart(productId) {
    const products = window.db.get("products") || [];
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Check quantity needed
    const existing = this.cart.find(item => item.productId === productId);
    const targetQty = existing ? existing.quantity + 1 : 1;

    // Stock verification check
    const stockCheck = window.db.checkStockAvailability(productId, targetQty);
    if (!stockCheck.available) {
      const missingIng = stockCheck.issues.map(i => `${i.name} (${Math.round(i.shortage)} ${i.unit} short)`).join(", ");
      window.showToast(`Insufficient stock! Need more: ${missingIng}`, "error");
      return;
    }

    if (existing) {
      existing.quantity = targetQty;
    } else {
      this.cart.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        bogo: product.bogo
      });
    }

    this.renderCart();
  },

  modifyQty(productId, delta) {
    const item = this.cart.find(item => item.productId === productId);
    if (!item) return;

    const targetQty = item.quantity + delta;

    if (targetQty <= 0) {
      this.cart = this.cart.filter(i => i.productId !== productId);
      window.showToast(`Removed ${item.name} from checkout`, "info");
    } else {
      if (delta > 0) {
        // Validate stock increment
        const stockCheck = window.db.checkStockAvailability(productId, targetQty);
        if (!stockCheck.available) {
          window.showToast("Cannot increase quantity. Insufficient ingredients in stock.", "error");
          return;
        }
      }
      item.quantity = targetQty;
    }

    this.renderCart();
  },

  removeFromCart(productId) {
    const item = this.cart.find(i => i.productId === productId);
    if (item) {
      this.cart = this.cart.filter(i => i.productId !== productId);
      window.showToast(`Removed ${item.name} from cart`, "info");
      this.renderCart();
    }
  },

  renderCart() {
    const list = document.getElementById("cart-items-list");
    const badge = document.getElementById("cart-qty-badge");

    let totalQty = this.cart.reduce((sum, item) => sum + item.quantity, 0);
    badge.textContent = totalQty;

    // Dynamically sync quantities on product grid cards
    this.renderProducts();

    if (this.cart.length === 0) {
      list.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); margin-top: 60px;">
          <i class="fa-solid fa-basket-shopping" style="font-size: 36px; margin-bottom: 12px; display: block; opacity: 0.3;"></i>
          Cart is currently empty.<br>Click items on the left to add.
        </div>
      `;
      this.calculateBillTotals();
      return;
    }

    list.innerHTML = this.cart.map(item => {
      let bogoTag = "";
      if (item.bogo) {
        bogoTag = `<span style="font-size: 9px; background: #2db7f5; color:#fff; padding:1px 4px; border-radius:3px; font-weight: 700; margin-left: 4px;">BOGO</span>`;
      }

      const lineTotal = item.price * item.quantity;

      return `
        <div class="cart-item-row" style="position: relative; display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--border-radius-md); margin-bottom: 6px; background: #fff; box-sizing: border-box; width: 100%;">
          
          <!-- Delete button x at top right -->
          <button onclick="views.pos.removeFromCart('${item.productId}')" style="position: absolute; top: 6px; right: 8px; background: transparent; border: none; color: #f44336; cursor: pointer; font-size: 13px;"><i class="fa-solid fa-xmark"></i></button>

          <!-- Left Info: Name, Veg Icon, Add Note -->
          <div style="display: flex; flex-direction: column; gap: 4px; overflow: hidden; min-width: 0; padding-right: 40px; text-align: left;">
            <span style="font-size: 13px; font-weight: 700; color: var(--text-dark); display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              <!-- Pure Veg Green dot -->
              <span style="display: inline-flex; align-items: center; justify-content: center; width: 11px; height: 11px; border: 1.2px solid #0f8a4f; padding: 1px; border-radius: 2px; background: #fff; flex-shrink: 0;">
                <span style="width: 5px; height: 5px; border-radius: 50%; background: #0f8a4f;"></span>
              </span>
              ${item.name}
            </span>
            <button class="btn-add-note" onclick="views.pos.addItemNotePrompt('${item.productId}')" style="background: transparent; border: none; color: #ff5c00; font-size: 10px; font-weight: 600; cursor: pointer; padding: 0; text-align: left; display: flex; align-items: center; gap: 2px;">
              <i class="fa-regular fa-comment-dots"></i> ${item.note ? `Note: ${item.note}` : 'Add note'}
            </button>
          </div>

          <!-- Right Info: Price, Qty Controls, Line Total -->
          <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0;">
            <!-- Price above controls -->
            <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">₹${item.price} each ${bogoTag}</span>
            <div style="display: flex; align-items: center; gap: 8px;">
              <!-- Qty controls pill -->
              <div style="display: flex; align-items: center; background: #f1f3f5; border-radius: 12px; height: 24px; padding: 0 4px;">
                <button onclick="views.pos.modifyQty('${item.productId}', -1)" style="background: transparent; border: none; width: 20px; height: 100%; cursor: pointer; font-size: 10px; color: var(--text-dark); display: flex; align-items: center; justify-content: center;"><i class="fa-solid fa-minus"></i></button>
                <span style="font-size: 12px; font-weight: 700; width: 18px; text-align: center; color: var(--text-dark);">${item.quantity}</span>
                <button onclick="views.pos.modifyQty('${item.productId}', 1)" style="background: transparent; border: none; width: 20px; height: 100%; cursor: pointer; font-size: 10px; color: var(--text-dark); display: flex; align-items: center; justify-content: center;"><i class="fa-solid fa-plus"></i></button>
              </div>
              <!-- Line Total -->
              <span style="font-size: 13px; font-weight: 700; color: var(--text-dark); min-width: 45px; text-align: right;">₹${lineTotal}</span>
            </div>
          </div>
        </div>
      `;
    }).join("");

    this.calculateBillTotals();
  },

  calculateBillTotals() {
    let subtotal = 0;

    // Sum standard totals
    this.cart.forEach(item => {
      subtotal += item.price * item.quantity;
    });

    // Mix-and-match BOGO calculations: 
    // Collect all individual BOGO item prices, sort descending, and charge every odd-indexed item as FREE
    const bogoPrices = [];
    this.cart.forEach(item => {
      if (item.bogo) {
        for (let i = 0; i < item.quantity; i++) {
          bogoPrices.push(item.price);
        }
      }
    });

    bogoPrices.sort((a, b) => b - a); // Higher price first

    let bogoDiscount = 0;
    for (let i = 1; i < bogoPrices.length; i += 2) {
      bogoDiscount += bogoPrices[i]; // Second/lower price item in every pair is free
    }

    const bogoRow = document.getElementById("bogo-discount-row");
    const bogoDiscountEl = document.getElementById("bill-bogo-discount");
    if (bogoDiscount > 0) {
      bogoRow.style.display = "flex";
      bogoDiscountEl.textContent = `-₹${bogoDiscount.toFixed(2)}`;
    } else {
      bogoRow.style.display = "none";
    }

    const discountVal = Number(document.getElementById("bill-discount-input").value) || 0;
    const discountPercent = Math.min(100, Math.max(0, discountVal));
    const flatDiscountAmount = Math.round((subtotal - bogoDiscount) * (discountPercent / 100) * 100) / 100;

    const gstEnabled = document.getElementById("tax-enable-checkbox").checked;

    const settings = window.db.get("settings") || {};
    const gstRate = settings.gstPercentage || 5;

    const netBeforeTax = Math.max(0, subtotal - bogoDiscount - flatDiscountAmount);
    const taxVal = gstEnabled ? Math.round(netBeforeTax * (gstRate / 100) * 100) / 100 : 0;
    const netTotal = netBeforeTax + taxVal;

    document.getElementById("bill-subtotal").textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById("bill-tax").textContent = `₹${taxVal.toFixed(2)}`;
    document.getElementById("bill-total").textContent = `₹${netTotal.toFixed(2)}`;

    const discAmtEl = document.getElementById("bill-discount-amount");
    if (discAmtEl) {
      discAmtEl.textContent = `-₹${flatDiscountAmount.toFixed(2)}`;
    }
  },

  setupListeners() {
    // 1. Search text filter & Clear button toggle
    const search = document.getElementById("pos-search");
    const clearSearchBtn = document.getElementById("btn-clear-search");

    search.oninput = (e) => {
      const val = e.target.value;
      this.searchQuery = val;
      if (clearSearchBtn) {
        clearSearchBtn.style.display = val ? "flex" : "none";
      }
      this.renderProducts();
    };

    if (clearSearchBtn) {
      clearSearchBtn.onclick = () => {
        search.value = "";
        this.searchQuery = "";
        clearSearchBtn.style.display = "none";
        this.renderProducts();
        search.focus();
      };
    }

    // 2. Clear Cart trigger
    document.getElementById("btn-clear-cart-trigger").onclick = () => {
      if (this.cart.length > 0) {
        this.cart = [];
        this.renderCart();
        window.showToast("Cart has been cleared.", "info");
      }
    };

    // 3. Discount inputs recalculate
    document.getElementById("bill-discount-input").oninput = () => {
      this.calculateBillTotals();
    };

    // 4. GST checkbox check recalculate & state memory
    const taxCheck = document.getElementById("tax-enable-checkbox");
    taxCheck.onchange = () => {
      localStorage.setItem("cc_pos_tax_enabled", taxCheck.checked);
      this.calculateBillTotals();
    };

    // 5. Order Type selection
    const dinein = document.getElementById("type-dinein");
    const takeaway = document.getElementById("type-takeaway");
    const delivery = document.getElementById("type-delivery");

    dinein.onclick = () => {
      dinein.classList.add("active");
      takeaway.classList.remove("active");
      delivery.classList.remove("active");
      this.orderType = "Dine-in";
    };

    takeaway.onclick = () => {
      takeaway.classList.add("active");
      dinein.classList.remove("active");
      delivery.classList.remove("active");
      this.orderType = "Takeaway";
    };

    delivery.onclick = () => {
      delivery.classList.add("active");
      dinein.classList.remove("active");
      takeaway.classList.remove("active");
      this.orderType = "Delivery";
    };

    // (Removed discount preset buttons)

    // 5c. Keydown keyboard hotkeys shortcuts listener
    this.handleKeydown = (e) => {
      const search = document.getElementById("pos-search");
      if (!search || !search.isConnected) return; // Exit if POS tab is inactive

      // 1. Focus search with "/" key
      if (e.key === "/" && document.activeElement !== search && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
        e.preventDefault();
        search.focus();
        search.select();
      }
      // 2. F8 to instantly place order
      if (e.key === "F8") {
        e.preventDefault();
        this.processCheckout();
      }
      // 3. Alt + C to instantly clear/reset cart
      if (e.altKey && (e.key === "c" || e.key === "C")) {
        e.preventDefault();
        document.getElementById("btn-clear-cart-trigger").click();
      }
      // 4. Escape to clear search query
      if (e.key === "Escape" && document.activeElement === search) {
        search.value = "";
        this.searchQuery = "";
        this.renderProducts();
        search.blur();
      }
    };
    document.addEventListener("keydown", this.handleKeydown);

    // 6. Payment Modes click select
    const pUpi = document.getElementById("pay-upi");
    const pCash = document.getElementById("pay-cash");
    const pCard = document.getElementById("pay-card");
    const pMore = document.getElementById("pay-more");

    const selectPayment = (btn, mode) => {
      [pUpi, pCash, pCard, pMore].forEach(b => {
        if (b) b.classList.remove("active");
      });
      btn.classList.add("active");
      this.selectedPayment = mode;
    };

    if (pUpi) pUpi.onclick = () => selectPayment(pUpi, "UPI");
    if (pCash) pCash.onclick = () => selectPayment(pCash, "Cash");
    if (pCard) pCard.onclick = () => selectPayment(pCard, "Card");
    if (pMore) pMore.onclick = () => selectPayment(pMore, "More");

    // 7. Checkout Process Confirmation modal & Save Order triggers
    document.getElementById("btn-checkout-trigger").onclick = () => {
      this.processCheckout(false);
    };

    const btnSave = document.getElementById("btn-save-order-trigger");
    if (btnSave) {
      btnSave.onclick = () => {
        this.processCheckout(true);
      };
    }

    // 8. Customer Autofill listeners
    const nameInput = document.getElementById("cust-name");
    const phoneInput = document.getElementById("cust-phone");

    nameInput.addEventListener("input", () => {
      const val = nameInput.value.trim();
      if (val.toLowerCase() === "walk-in customer" || val.length < 2) return;

      const orders = window.db.get("orders") || [];
      const match = orders.find(o => o.customerName && o.customerName.trim().toLowerCase() === val.toLowerCase() && o.customerPhone);
      if (match) {
        phoneInput.value = match.customerPhone;
      }
    });

    phoneInput.addEventListener("input", (e) => {
      let val = e.target.value.replace(/\D/g, ""); // Allow only digits
      if (val.length > 10) val = val.substring(0, 10); // Limit to 10 digits
      e.target.value = val;

      if (!val || val.length < 4) return;

      const orders = window.db.get("orders") || [];
      const match = orders.find(o => o.customerPhone && o.customerPhone.trim() === val);
      if (match) {
        nameInput.value = match.customerName;
      }
    });
  },

  processCheckout(skipPrint = false) {
    if (this.cart.length === 0) {
      window.showToast("Cannot place order. The cart is empty.", "error");
      return;
    }

    const customerName = document.getElementById("cust-name").value.trim() || "Walk-in Customer";
    const customerPhone = document.getElementById("cust-phone").value.trim() || "";

    // Validate phone number length (must be empty or exactly 10 digits)
    if (customerPhone && customerPhone.length !== 10) {
      window.showToast("Customer phone number must be exactly 10 digits.", "error");
      return;
    }

    const discountVal = Number(document.getElementById("bill-discount-input").value) || 0;
    const gstEnabled = document.getElementById("tax-enable-checkbox").checked;

    let subtotal = 0;
    const formattedItems = this.cart.map(item => {
      const lineTotal = item.price * item.quantity;
      subtotal += lineTotal;

      return {
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        bogo: item.bogo,
        lineTotal: lineTotal
      };
    });

    // BOGO Mix-and-match calculations
    const bogoPrices = [];
    this.cart.forEach(item => {
      if (item.bogo) {
        for (let i = 0; i < item.quantity; i++) {
          bogoPrices.push(item.price);
        }
      }
    });

    bogoPrices.sort((a, b) => b - a);
    let bogoDiscount = 0;
    for (let i = 1; i < bogoPrices.length; i += 2) {
      bogoDiscount += bogoPrices[i];
    }

    const settings = window.db.get("settings") || {};
    const gstRate = settings.gstPercentage || 5;

    const discountPercent = Math.min(100, Math.max(0, discountVal));
    const flatDiscountAmount = Math.round((subtotal - bogoDiscount) * (discountPercent / 100) * 100) / 100;

    const netBeforeTax = Math.max(0, subtotal - bogoDiscount - flatDiscountAmount);
    const taxVal = gstEnabled ? Math.round(netBeforeTax * (gstRate / 100) * 100) / 100 : 0;
    const netTotal = netBeforeTax + taxVal;

    // Call database create transaction
    const tableSelectVal = document.getElementById("pos-table-select") ? document.getElementById("pos-table-select").value : "";
    const response = window.db.createOrder({
      customerName: customerName,
      customerPhone: customerPhone,
      items: formattedItems,
      subtotal: subtotal,
      discount: flatDiscountAmount,
      bogoDiscount: bogoDiscount, // save global bogo discount
      tax: taxVal,
      total: netTotal,
      type: this.orderType,
      tableNumber: this.orderType === "Dine-in" ? tableSelectVal : "",
      paymentMethod: this.selectedPayment
    });

    if (response.success) {
      window.showToast(`Order #${response.order.orderNumber} successfully processed!`, "success");

      // Force update inventory warnings in headers
      const updateHeaderPill = document.createEvent("Event");
      updateHeaderPill.initEvent("db-update", true, true);
      window.dispatchEvent(updateHeaderPill);

      // Trigger printable receipt billing modal
      if (!skipPrint) {
        this.showReceiptModal(response.order);
      }

      // Clear Cart state
      this.cart = [];
      document.getElementById("cust-name").value = "Walk-in Customer";
      document.getElementById("cust-phone").value = "";
      document.getElementById("bill-discount-input").value = "0";
      this.renderCart();
      this.renderProducts(); // refresh stock numbers on cards
      this.populateCustomerAutocompletes();
      if (window.updateSidebarSummary) {
        window.updateSidebarSummary();
      }
    } else {
      // Trigger error details
      const missingHtml = response.details.map(d => `<li><strong>${d.name}</strong>: Current stock is ${Math.round(d.current)} ${d.unit}, but order needs ${Math.round(d.needed)} ${d.unit}.</li>`).join("");

      window.customModal.show({
        title: "Stock Allocation Blocked",
        bodyHtml: `
          <div style="color: #ff4b2b; margin-bottom: 12px; font-weight: 600;">
            <i class="fa-solid fa-triangle-exclamation"></i> Checkout failed due to insufficient raw material ingredients:
          </div>
          <ul style="padding-left: 20px; font-size: 13px; line-height: 1.6; color: var(--text-muted);">
            ${missingHtml}
          </ul>
        `,
        confirmText: "Close & Refill",
        hideFooter: false
      });
    }
  },

  showReceiptModal(order) {
    const settings = window.db.get("settings") || {};

    // Format Date & Time
    const dateObj = new Date(order.createdAt);
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const yy = String(dateObj.getFullYear()).slice(-2);
    const orderDate = `${dd}/${mm}/${yy}`;

    const hh = String(dateObj.getHours()).padStart(2, '0');
    const min = String(dateObj.getMinutes()).padStart(2, '0');
    const orderTime = `${hh}:${min}`;

    // Get cashier info
    const currentUser = window.db.getCurrentUser() || { name: "biller" };
    const cashierName = currentUser.name.split(' ')[0];

    // Token No. (padded daily token number to 2 digits: 01 to n)
    const tokenNo = String(order.tokenNumber || 1).padStart(2, '0');

    // Total items quantity
    const totalQty = order.items.reduce((sum, item) => sum + item.quantity, 0);

    // Dynamic UPI QR code payload
    const upiId = settings.upiId || "7487980840@okbizaxis";
    const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(settings.restaurantName || "Crust & Chilly")}&am=${order.total.toFixed(2)}&cu=INR&tn=Order${order.orderNumber}`;



    const receiptHtml = `
      <div class="receipt-wrapper">
        <!-- Logo centered -->
        <img src="logo.jpg" alt="Logo" class="receipt-logo">
        
        <div class="receipt-header">
          <div class="receipt-title">${settings.restaurantName || "Crust & Chilly"}</div>
          <div class="receipt-subtitle">${settings.address || "Shop-09, Shree sanidhya flora, Turquoise BLU Rd, Shela, Ahmedabad, Gujarat 380057"}</div>
          <div class="receipt-subtitle">Phone: ${settings.phone || "096648 70840"}</div>
        </div>
        
        <div class="receipt-dotted-line"></div>
        
        <div class="receipt-meta">
          <div style="font-weight: bold; margin-bottom: 4px;">Name: ${order.customerName || "Walk-in Customer"}</div>
          <div class="receipt-dotted-line" style="margin: 4px 0;"></div>
          <div class="receipt-meta-row">
            <span>Date: ${orderDate}</span>
            <span style="font-weight: bold;">${order.tableNumber ? `${order.type} (${order.tableNumber})` : order.type}</span>
          </div>
          <div class="receipt-meta-row">
            <span>Time: ${orderTime}</span>
            <span></span>
          </div>
          <div class="receipt-meta-row">
            <span>Cashier: ${cashierName}</span>
            <span>Bill No.: ${order.orderNumber}</span>
          </div>
          <div class="receipt-token-no">Token No.: ${tokenNo}</div>
        </div>
        
        <div class="receipt-dotted-line"></div>
        
        <table class="receipt-table">
          <thead>
            <tr>
              <th style="width: 50%;">Item</th>
              <th style="text-align: center; width: 15%;">Qty</th>
              <th style="text-align: right; width: 15%;">Price</th>
              <th style="text-align: right; width: 20%;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => {
      let bogoLabel = item.bogo ? "<br><span class='receipt-bogo-label'>(BOGO Eligible)</span>" : "";
      return `
                <tr>
                  <td>
                    <span class="receipt-item-name">${item.name}</span>
                    ${bogoLabel}
                  </td>
                  <td style="text-align: center;">${item.quantity}</td>
                  <td style="text-align: right;">${item.price.toFixed(2)}</td>
                  <td style="text-align: right;">${item.lineTotal.toFixed(2)}</td>
                </tr>
              `;
    }).join("")}
          </tbody>
        </table>
        
        <div class="receipt-dotted-line"></div>
        
        <div class="receipt-totals">
          <div class="receipt-total-line">
            <span>Total Qty: ${totalQty}</span>
            <span>Sub Total: ₹${order.subtotal.toFixed(2)}</span>
          </div>
          
          ${order.bogoDiscount > 0 || order.discount > 0 || order.tax > 0 ? `
            <div class="receipt-dotted-line" style="margin: 4px 0;"></div>
          ` : ""}
          
          ${order.bogoDiscount > 0 ? `
            <div class="receipt-total-line" style="font-weight: 600; color: #d62d20;">
              <span>BOGO Discount:</span>
              <span>-₹${order.bogoDiscount.toFixed(2)}</span>
            </div>
          ` : ""}
          
          ${order.discount > 0 ? `
            <div class="receipt-total-line">
              <span>Cash Discount:</span>
              <span>-₹${order.discount.toFixed(2)}</span>
            </div>
          ` : ""}
          
          ${order.tax > 0 ? `
            <div class="receipt-total-line">
              <span>GST (5%):</span>
              <span>₹${order.tax.toFixed(2)}</span>
            </div>
          ` : ""}
          
          <div class="receipt-grand-total">
            <span>Grand Total</span>
            <span>₹${order.total.toFixed(2)}</span>
          </div>
        </div>
        
        <div class="receipt-dotted-line"></div>
        
        <div class="receipt-footer">
          <div style="font-weight: bold; margin-bottom: 6px;">For Order or More : ${settings.phone || "096648 70840"}</div>
          
          <div class="receipt-qr-wrapper">
            <img class="receipt-qr-img" src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(upiUrl)}" alt="Scan to Pay">
            <div class="receipt-qr-text">Pay via the QR code.</div>
          </div>
          
          <div class="receipt-dotted-line" style="margin-top: 8px;"></div>
          <div style="font-weight: bold; margin-top: 6px; text-transform: uppercase;">Thank you for dining with us!</div>
        </div>
      </div>
      
      <!-- Custom print styles only active when printing -->
      <style>
        @media print {
          @page {
            margin: 4mm 6mm; /* Safe print margins to prevent side text cutoff */
            size: auto;
          }
          body { 
            background: #fff !important; 
            color: #000 !important; 
            margin: 0 !important;
            padding: 0 !important;
          }
          * {
            color: #000 !important;
            text-shadow: none !important;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #app-container, .toast-container, .modal-header, .modal-footer, .receipt-wa-btn { 
            display: none !important; 
          }
          .modal-overlay { 
            position: absolute !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 100% !important; 
            height: auto !important; 
            background: transparent !important; 
            backdrop-filter: none !important; 
            box-shadow: none !important; 
            display: block !important;
            opacity: 1 !important;
            visibility: visible !important;
            padding: 0 !important; 
            margin: 0 !important; 
          }
          .modal-content { 
            border: none !important; 
            box-shadow: none !important; 
            background: transparent !important; 
            width: 100% !important; 
            max-width: 100% !important; 
            padding: 0 !important; 
            margin: 0 !important; 
            transform: none !important;
          }
          .modal-body { 
            padding: 0 !important; 
            margin: 0 !important; 
          }
          .receipt-wrapper { 
            width: 70mm !important; /* Set to 70mm to safely fit within thermal head printable area */
            max-width: 70mm !important;
            margin: 0 auto !important; 
            padding: 0 3mm !important; /* Internal safe side padding */
            box-sizing: border-box !important;
            box-shadow: none !important; 
            border: none !important;
          }
        }
      </style>
    `;

    window.customModal.show({
      title: "Invoice Generated Successfully",
      bodyHtml: receiptHtml,
      confirmText: "Print Bill",
      cancelText: "Close",
      onConfirm: () => {
        window.print();
        return false; // prevent closing immediately so they can print again if needed
      }
    });
  },

  populateCustomerAutocompletes() {
    const orders = window.db.get("orders") || [];

    // Extract unique customer records (latest first)
    const customersMap = new Map();
    orders.forEach(order => {
      const name = (order.customerName || "").trim();
      const phone = (order.customerPhone || "").trim();

      if (name && name.toLowerCase() !== "walk-in customer") {
        if (phone && !customersMap.has(name.toLowerCase())) {
          customersMap.set(name.toLowerCase(), { name, phone });
        }
      }
      if (phone && !customersMap.has(phone)) {
        customersMap.set(phone, { name, phone });
      }
    });

    const nameDatalist = document.getElementById("customer-names-list");
    const phoneDatalist = document.getElementById("customer-phones-list");

    if (nameDatalist && phoneDatalist) {
      const uniqueNames = new Set();
      const uniquePhones = new Set();

      customersMap.forEach(cust => {
        if (cust.name && cust.name.toLowerCase() !== "walk-in customer") {
          uniqueNames.add(cust.name);
        }
        if (cust.phone) {
          uniquePhones.add(cust.phone);
        }
      });

      nameDatalist.innerHTML = Array.from(uniqueNames).map(name => `<option value="${name}"></option>`).join("");
      phoneDatalist.innerHTML = Array.from(uniquePhones).map(phone => `<option value="${phone}"></option>`).join("");
    }
  },

  addItemNotePrompt(productId) {
    const item = this.cart.find(i => i.productId === productId);
    if (!item) return;
    const currentNote = item.note || "";
    const note = prompt(`Enter instruction note for ${item.name}:`, currentNote);
    if (note !== null) {
      item.note = note.trim();
      this.renderCart();
    }
  },

  applyCouponCode() {
    const input = document.getElementById("coupon-code-input");
    if (!input) return;
    const code = input.value.trim().toUpperCase();
    if (code === "WELCOME10" || code === "CRUST10" || code === "DISCOUNT10") {
      const discountInput = document.getElementById("bill-discount-input");
      if (discountInput) {
        discountInput.value = 10;
        this.calculateBillTotals();
        window.showToast("Coupon Applied! 10% Discount applied.", "success");
      }
    } else if (code === "") {
      window.showToast("Please enter a coupon code.", "info");
    } else {
      window.showToast("Invalid coupon code! Try DISCOUNT10", "error");
    }
  }
};
