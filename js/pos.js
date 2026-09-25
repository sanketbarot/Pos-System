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
    if (n.includes("cheese blast") || n.includes("cheese burst") || n.includes("special")) {
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

  // 6. TIKKA PAV
  if (n.includes("tikka") || n.includes("pav")) {
    return "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=200&auto=format&fit=crop&q=80"; // toasted pav / tikka
  }

  // 7. MOJITOS & COLD DRINKS & WATER (Mapped name-wise)
  if (n.includes("mojito")) {
    return "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=200&auto=format&fit=crop&q=80"; // Mojito glass
  }
  if (n.includes("drink") || categoryId === "cat8") {
    return "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=200&auto=format&fit=crop&q=80"; // soft drink bottle
  }
  if (n.includes("water") || categoryId === "cat10") {
    return "https://images.unsplash.com/photo-1608889174637-3c44f6326f1a?w=200&auto=format&fit=crop&q=80"; // water bottle
  }

  // 8. COMBOS
  if (n.includes("combo")) {
    return "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=200&auto=format&fit=crop&q=80"; // combo platter
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

  getTodayStats() {
    const orders = window.db ? (window.db.get("orders") || []) : [];
    const todayStr = new Date().toISOString().substring(0, 10);
    const todayOrders = orders.filter(o => o.createdAt && o.createdAt.substring(0, 10) === todayStr && o.status !== "Cancelled");
    const nextToken = todayOrders.length + 1;
    return { count: todayOrders.length, nextToken: nextToken };
  },

  getHeldOrders() {
    try {
      const data = localStorage.getItem("cc_pos_held_orders");
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveHeldOrders(list) {
    try {
      localStorage.setItem("cc_pos_held_orders", JSON.stringify(list));
    } catch (e) {}
  },

  init(container) {
    // Reset view variables
    this.cart = [];
    this.selectedCategory = "all";
    this.searchQuery = "";
    this.selectedPayment = "UPI";
    this.orderType = "Dine-in";
    this.currentUser = window.db.getCurrentUser();

    const stats = this.getTodayStats();
    const tokenDisplay = String(stats.nextToken).padStart(2, '0');
    const heldList = this.getHeldOrders();

    container.innerHTML = `
      <div class="pos-layout view-animate">
        <!-- Top Custom Terminal Header -->
        <div class="pos-custom-header">
          <!-- Search Bar -->
          <div class="pos-header-search-area">
            <div class="pos-search-wrapper">
              <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 14px; color: var(--text-muted); pointer-events: none; z-index: 5;"></i>
              <input type="text" id="pos-search" class="pos-search-input" value="${this.searchQuery}" placeholder="Search menu (e.g. Burger, Sandwich, Fries)..." autocomplete="off">
              <button type="button" id="btn-clear-search" style="position: absolute; right: 80px; background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; display: ${this.searchQuery ? 'flex' : 'none'}; align-items: center; justify-content: center; outline: none; z-index: 5;" title="Clear search">
                <i class="fa-solid fa-circle-xmark" style="font-size: 14px;"></i>
              </button>
              <span class="pos-search-shortcut" style="position: absolute; right: 12px; font-size: 10px; font-weight: 700; background: #f1f5f9; border: 1px solid var(--border-color); color: #64748b; padding: 2px 6px; border-radius: 6px; pointer-events: none; z-index: 5;">Ctrl+K</span>
            </div>
          </div>

          <!-- Dine In / Takeaway / Delivery Segmented Control -->
          <div class="pos-header-type-area">
            <div style="display: inline-flex; background: #f1f5f9; border: 1px solid var(--border-color); border-radius: 16px; padding: 3px; gap: 3px;">
              <button class="pos-header-btn ${this.orderType === 'Dine-in' ? 'active' : ''}" id="type-dinein" style="border: none; border-radius: 12px; padding: 6px 14px; font-size: 11.5px;">
                <i class="fa-solid fa-utensils"></i> Dine In
              </button>
              <button class="pos-header-btn ${this.orderType === 'Takeaway' ? 'active' : ''}" id="type-takeaway" style="border: none; border-radius: 12px; padding: 6px 14px; font-size: 11.5px;">
                <i class="fa-solid fa-bag-shopping"></i> Takeaway
              </button>
              <button class="pos-header-btn ${this.orderType === 'Delivery' ? 'active' : ''}" id="type-delivery" style="border: none; border-radius: 12px; padding: 6px 14px; font-size: 11.5px;">
                <i class="fa-solid fa-motorcycle"></i> Delivery
              </button>
            </div>

            <!-- Table Input & Quick Selector Chips -->
            <div id="header-table-box" style="display: ${this.orderType === 'Dine-in' ? 'flex' : 'none'}; align-items: center; gap: 6px; background: #ffffff; border: 1px solid var(--border-color); border-radius: 14px; padding: 4px 10px; height: 38px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
              <span style="font-size: 11.5px; font-weight: 700; color: var(--text-dark); display: flex; align-items: center; gap: 4px;"><i class="fa-solid fa-chair" style="color: #2563eb;"></i> Table:</span>
              <input type="text" id="pos-table-input" placeholder="T-1" value="${this.orderType === 'Dine-in' ? 'T-1' : ''}" style="border: none; outline: none; font-size: 12px; font-weight: 800; width: 44px; color: #2563eb; background: transparent;">
              <div class="pos-table-chips">
                <span class="pos-table-chip ${this.orderType === 'Dine-in' ? 'active' : ''}" onclick="views.pos.setQuickTable('T-1')">T1</span>
                <span class="pos-table-chip" onclick="views.pos.setQuickTable('T-2')">T2</span>
                <span class="pos-table-chip" onclick="views.pos.setQuickTable('T-3')">T3</span>
                <span class="pos-table-chip" onclick="views.pos.setQuickTable('T-4')">T4</span>
                <span class="pos-table-chip" onclick="views.pos.setQuickTable('T-5')">T5</span>
              </div>
            </div>
          </div>

          <!-- Right side: Shift Stats, Sound, Cashier -->
          <div class="pos-header-actions-area">
            <!-- Shift Live Stats Pill -->
            <div class="pos-shift-stats" style="display: inline-flex; align-items: center; gap: 8px; background: #f8fafc; border: 1px solid var(--border-color); padding: 5px 12px; border-radius: 14px; font-size: 11px; font-weight: 700;">
              <span style="color: #2563eb; display: flex; align-items: center; gap: 4px;" title="Orders completed today">
                <i class="fa-solid fa-clipboard-check"></i> <span id="pos-today-orders-count">${stats.count} Bills</span>
              </span>
              <span style="color: #cbd5e1;">|</span>
              <span style="color: #d97706; display: flex; align-items: center; gap: 4px;" title="Next Order Token">
                <i class="fa-solid fa-ticket"></i> <span>Tk #${tokenDisplay}</span>
              </span>
            </div>

            <!-- Sound toggle button -->
            <button id="pos-sound-toggle-pill" class="sound-toggle-pill active" onclick="window.soundAlerts && window.soundAlerts.toggleSound(true)" title="Kitchen Audio Alerts: Active everywhere (Click to toggle)" style="display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 12px; font-size: 11px; font-weight: 700; border: 1px solid #bfdbfe; background: #eff6ff; color: #1e40af; cursor: pointer; transition: all 0.2s ease;">
              <i class="fa-solid fa-volume-high" id="pos-sound-icon" style="font-size: 10px; color: #2563eb;"></i>
              <span id="pos-sound-text">Sound: ON</span>
            </button>

            <!-- User profile info -->
            <div style="display: flex; align-items: center; gap: 7px; background: #ffffff; border: 1px solid var(--border-color); padding: 4px 10px 4px 6px; border-radius: 14px;">
              <div class="user-avatar" style="width: 26px; height: 26px; font-size: 11px; font-weight: 800; background: var(--primary-gradient); color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">S</div>
              <div style="text-align: left;">
                <div style="font-size: 11.5px; font-weight: 800; color: var(--text-dark); line-height: 1.1;">${this.currentUser ? this.currentUser.name.split(' ')[0] : 'Sanket'}</div>
              </div>
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
          <div class="pos-cart-panel">
            <!-- Cart Header -->
            <div class="cart-header">
              <div class="cart-title">
                <i class="fa-solid fa-cart-shopping" style="color: #2563eb; font-size: 14px;"></i> Current Order 
                <span class="cart-item-count-badge" id="cart-qty-badge">0 Items</span>
              </div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <!-- Held Orders Badge button (if any) -->
                <div id="btn-held-badge-container" style="display: ${heldList.length > 0 ? 'inline-flex' : 'none'};">
                  <button type="button" class="btn-held-badge" onclick="views.pos.showHeldOrdersModal()" title="View Parked Orders">
                    <i class="fa-solid fa-clock-rotate-left"></i> Held (${heldList.length})
                  </button>
                </div>
                <!-- Hold Order trigger -->
                <button type="button" class="btn-hold-cart" onclick="views.pos.holdCurrentCart()" title="Hold / Park Current Cart (F3)">
                  <i class="fa-solid fa-pause"></i> Hold
                </button>
                <!-- Clear Cart trigger -->
                <button class="btn-clear-cart" id="btn-clear-cart-trigger" title="Clear Cart (Alt+C)">
                  <i class="fa-solid fa-trash-can"></i> Clear
                </button>
              </div>
            </div>

            <!-- Customer Details Block with 1-Tap Walk-in Button -->
            <div class="pos-customer-card">
              <!-- Row 1: Name + Walk-in quick button -->
              <div class="pos-cust-row">
                <i class="fa-regular fa-user cust-icon"></i>
                <input type="text" id="cust-name" class="customer-input" placeholder="Customer Name" list="customer-names-list" value="Walk-in Customer" autocomplete="off" style="border: none; outline: none; background: transparent; font-weight: 700; font-size: 12px; color: var(--text-dark); flex-grow: 1; padding: 0;">
                <datalist id="customer-names-list"></datalist>
                <button type="button" class="cust-add-btn" onclick="views.pos.setQuickCustomerWalkin()" title="1-Tap Set Walk-in Customer" style="cursor: pointer; border: none; background: #eff6ff; color: #2563eb; font-weight: 800; font-size: 10px; padding: 2px 7px; border-radius: 8px;">
                  <i class="fa-solid fa-rotate-left"></i> Walk-in
                </button>
              </div>
              <!-- Row 2: Phone -->
              <div class="pos-cust-row" style="margin-top: 4px;">
                <i class="fa-solid fa-phone cust-icon"></i>
                <span class="cust-prefix">+91</span>
                <input type="tel" id="cust-phone" class="customer-input" placeholder="Phone (10 digits)" list="customer-phones-list" autocomplete="off" style="border: none; outline: none; background: transparent; font-size: 12px; color: var(--text-dark); flex-grow: 1; padding: 0;">
                <datalist id="customer-phones-list"></datalist>
              </div>
            </div>

            <!-- Cart items list scrollable -->
            <div class="cart-items-scroll" id="cart-items-list" style="flex-grow: 1; overflow-y: auto; margin: 4px 0; padding-right: 4px; min-height: 90px;">
              <div class="cart-empty-box">
                <div class="cart-empty-icon-circle">
                  <i class="fa-solid fa-basket-shopping"></i>
                </div>
                <div style="font-size: 13px; font-weight: 700; color: var(--text-dark); margin-bottom: 2px;">Cart is empty</div>
                <div style="font-size: 11px; color: var(--text-muted); max-width: 180px;">Tap on items on the left to add to order</div>
              </div>
            </div>

            <!-- Cart billing summary & checkout panel -->
            <div class="cart-billing-details" style="flex-shrink: 0; background: transparent; padding: 0; border: none;">
              <!-- Special Cooking Note & 1-Click Preset Chips -->
              <div style="margin-bottom: 6px;">
                <div class="pos-kitchen-note-box">
                  <i class="fa-solid fa-pencil note-icon"></i>
                  <input type="text" id="order-kitchen-note" placeholder="Kitchen instructions (e.g. Jain, Less Spicy)..." oninput="views.pos.updateKitchenNoteChips()">
                </div>
                <!-- 1-Click Preset Chips -->
                <div class="pos-preset-notes">
                  <span class="pos-preset-chip" data-text="Jain" onclick="views.pos.toggleKitchenNotePreset('Jain')">🌱 Jain</span>
                  <span class="pos-preset-chip" data-text="Less Spicy" onclick="views.pos.toggleKitchenNotePreset('Less Spicy')">🌶️ Less Spicy</span>
                  <span class="pos-preset-chip" data-text="Extra Spicy" onclick="views.pos.toggleKitchenNotePreset('Extra Spicy')">🔥 Extra Spicy</span>
                  <span class="pos-preset-chip" data-text="No Onion/Garlic" onclick="views.pos.toggleKitchenNotePreset('No Onion/Garlic')">🧅 No Onion</span>
                  <span class="pos-preset-chip" data-text="Extra Cheese" onclick="views.pos.toggleKitchenNotePreset('Extra Cheese')">🧀 Extra Cheese</span>
                  <span class="pos-preset-chip" data-text="Parcel Pack" onclick="views.pos.toggleKitchenNotePreset('Parcel Pack')">📦 Parcel</span>
                  <span class="pos-preset-chip" data-text="Urgent" onclick="views.pos.toggleKitchenNotePreset('Urgent')">⚡ Urgent</span>
                </div>
              </div>

              <!-- Quick Discount Section & Coupon -->
              <div class="pos-discount-section">
                <div class="pos-discount-header">
                  <span class="discount-label"><i class="fa-solid fa-tag" style="color: #2563eb;"></i> Quick Discount:</span>
                  <div class="cart-discount-chips" id="cart-discount-chips">
                    <button class="cart-discount-chip active" data-discount="0" onclick="views.pos.setQuickDiscount(0)">0%</button>
                    <button class="cart-discount-chip" data-discount="5" onclick="views.pos.setQuickDiscount(5)">5%</button>
                    <button class="cart-discount-chip" data-discount="10" onclick="views.pos.setQuickDiscount(10)">10%</button>
                    <button class="cart-discount-chip" data-discount="15" onclick="views.pos.setQuickDiscount(15)">15%</button>
                    <button class="cart-discount-chip" data-discount="20" onclick="views.pos.setQuickDiscount(20)">20%</button>
                  </div>
                </div>
                <div class="pos-coupon-row">
                  <input type="text" id="coupon-code-input" placeholder="Promo code (e.g. DISCOUNT10)">
                  <button onclick="views.pos.applyCouponCode()">Apply</button>
                </div>
              </div>

              <!-- Invoice billing summary calculations -->
              <div class="pos-billing-card">
                <div class="billing-line">
                  <span>Subtotal</span>
                  <span id="bill-subtotal" class="bill-val">₹0.00</span>
                </div>
                <div class="billing-line" id="bogo-discount-row" style="display: none;">
                  <span style="color: #10b981; font-weight: 700;"><i class="fa-solid fa-gift"></i> BOGO Savings</span>
                  <span id="bill-bogo-discount" style="color: #10b981; font-weight: 800;">-₹0.00</span>
                </div>
                <div class="billing-line">
                  <span class="discount-text-line">Discount (<input type="number" id="bill-discount-input" value="0" min="0" max="100">%)</span>
                  <span id="bill-discount-amount" class="bill-val-green">-₹0.00</span>
                </div>
                <div class="billing-line">
                  <span class="tax-text-line">
                    GST (5%)
                    <input type="checkbox" id="tax-enable-checkbox" checked>
                  </span>
                  <span id="bill-tax" class="bill-val">₹0.00</span>
                </div>
                <div class="billing-line total" style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <span style="font-size: 13px; font-weight: 900; letter-spacing: 0.5px;">TOTAL AMOUNT</span>
                    <span style="font-size: 10px; font-weight: 700; color: #2563eb; display: block;">Token #${tokenDisplay}</span>
                  </div>
                  <span id="bill-total" class="bill-grand-total">₹0.00</span>
                </div>
              </div>

              <!-- Payment Type Selection Button Options -->
              <div class="pos-payment-grid">
                <button class="payment-btn active" id="pay-upi"><i class="fa-solid fa-qrcode"></i>UPI</button>
                <button class="payment-btn" id="pay-cash"><i class="fa-solid fa-money-bill-wave"></i>Cash</button>
                <button class="payment-btn" id="pay-card"><i class="fa-solid fa-credit-card"></i>Card</button>
                <button class="payment-btn" id="pay-split"><i class="fa-solid fa-shuffle"></i>Split</button>
              </div>

              <!-- Cash Tender Assistant (shown when Cash is active) -->
              <div id="cash-tender-drawer" class="cash-tender-box" style="display: none;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <span style="font-size: 10.5px; font-weight: 700; color: var(--text-muted);">Quick Cash:</span>
                  <div style="display: flex; gap: 4px;">
                    <button class="cash-chip" onclick="views.pos.setCashTender('exact')">Exact</button>
                    <button class="cash-chip" onclick="views.pos.setCashTender(100)">₹100</button>
                    <button class="cash-chip" onclick="views.pos.setCashTender(200)">₹200</button>
                    <button class="cash-chip" onclick="views.pos.setCashTender(500)">₹500</button>
                  </div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div style="display: flex; align-items: center; gap: 4px;">
                    <span style="font-size: 12px; font-weight: 800; color: #2563eb;">₹</span>
                    <input type="number" id="cash-received-input" placeholder="Amount" style="width: 80px; border: 1.5px solid var(--border-color); border-radius: 6px; padding: 3px 6px; font-size: 12px; font-weight: 800; outline: none; background: #fff;" oninput="views.pos.calcChangeReturn()">
                  </div>
                  <span id="cash-change-return" style="font-size: 12px; font-weight: 800; color: var(--text-muted);">Change: ₹0.00</span>
                </div>
              </div>

              <!-- Submit checkout and Save Order -->
              <div class="pos-action-group">
                <button class="btn-checkout" id="btn-checkout-trigger">
                  <i class="fa-solid fa-print"></i> Place Order & Print Bill <span class="shortcut-tag">[Ctrl+B]</span>
                </button>
                <div class="pos-secondary-actions">
                  <button class="btn-pos-secondary btn-save-action" id="btn-save-order-trigger">
                    <i class="fa-solid fa-bookmark"></i> Save Order
                  </button>
                  <button class="btn-pos-secondary btn-kot-action" id="btn-print-kot-trigger" onclick="views.pos.printKitchenKOT()">
                    <i class="fa-solid fa-fire-burner"></i> Print KOT
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Shortcuts Bar -->
        <div class="pos-footer-bar">
          <div style="display: flex; gap: 14px;">
            <span><span style="color: #2563eb; font-weight:800; margin-right:4px;">Ctrl+K</span> Search</span>
            <span><span style="color: #2563eb; font-weight:800; margin-right:4px;">F1</span> New Bill</span>
            <span><span style="color: #d97706; font-weight:800; margin-right:4px;">F3</span> Hold Cart</span>
            <span><span style="color: #d97706; font-weight:800; margin-right:4px;">F4</span> Held Orders</span>
          </div>
          <div style="display: flex; gap: 14px;">
            <span><span style="color: #2563eb; font-weight:800; margin-right:4px;">Ctrl+B</span> Print Bill</span>
            <span><span style="color: #ef4444; font-weight:800; margin-right:4px;">Alt+C</span> Clear Cart</span>
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="display: flex; align-items: center; gap: 6px;"><i class="fa-solid fa-circle" style="color: #10b981; font-size: 8px;"></i> POS Terminal Ready</span>
            <span id="pos-footer-clock" style="font-family: monospace; font-weight: 700;">Loading...</span>
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
      if (c.icon === "bowl-rice") icon = "fa-bowl-rice";
      if (c.icon === "leaf") icon = "fa-leaf";
      if (c.icon === "seedling") icon = "fa-seedling";

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

    grid.innerHTML = filtered.map((p, index) => {
      // Check recipe stocks to display indicators
      const stockCheck = window.db.checkStockAvailability(p.id, 1);
      const isAvailable = stockCheck.available;

      // Top left status dot color based on stock
      let statusDotColor = "var(--color-ready)";
      if (!isAvailable) {
        statusDotColor = "var(--color-cancelled)";
      } else {
        const ingredients = window.db.get("ingredients") || [];
        // Bypassed near-low stock warning dot - stock is always full
        const isNearLowStock = false;
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
            <input type="number" class="pos-card-qty-val" value="${cartQty}" 
                   onchange="views.pos.setQty('${p.id}', parseInt(this.value) || 0)"
                   onclick="this.select();" 
                   onkeydown="if(event.key==='Enter') { event.preventDefault(); this.blur(); }">
            <button class="pos-card-qty-btn" onclick="views.pos.modifyQty('${p.id}', 1)"><i class="fa-solid fa-plus"></i></button>
          </div>
        `;
      }

      const outOfStockClass = !isAvailable ? "out-of-stock" : "";
      const selectedClass = cartQty > 0 ? "selected" : "";

      return `
        <div class="product-card ${outOfStockClass} ${selectedClass}" data-id="${p.id}" style="--card-i: ${index};">
          <!-- Indian Pure Veg green square-circle indicator at top left -->
          <span style="position: absolute; top: 12px; left: 12px; display: inline-flex; align-items: center; justify-content: center; width: 13px; height: 13px; border: 1.2px solid #0f8a4f; padding: 1px; border-radius: 2px; background: #fff; z-index: 5;">
            <span style="width: 6px; height: 6px; border-radius: 50%; background: #0f8a4f;"></span>
          </span>
          
          <!-- BOGO offer badge at top right -->
          ${p.bogo ? `<span class="product-bogo-badge">BOGO</span>` : ""}
          
          <!-- Product Name in Middle -->
          <div style="margin-top: 28px; text-align: left;">
            <h4 class="product-name" style="margin: 0; font-size: 13px; font-weight: 700; color: var(--text-dark); line-height: 1.3; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; min-height: 34px;">
              ${p.name}
            </h4>
          </div>

          <!-- Bottom Row: Price on left, Add Button on right -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px; width: 100%;">
            <span class="product-price" style="font-weight: 800; color: #ebb036; background: #fffbeb; border: 1px solid #fde68a; padding: 2px 8px; border-radius: 10px; font-size: 14.5px;">₹${p.price}</span>
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
      window.showToast(`Low stock warning! Need more: ${missingIng}`, "info");
    }

    if (existing) {
      existing.quantity = targetQty;
    } else {
      this.cart.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        bogo: product.bogo,
        category: product.category
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
          const missingIng = stockCheck.issues.map(i => `${i.name} (${Math.round(i.shortage)} ${i.unit} short)`).join(", ");
          window.showToast(`Low stock warning! Need more: ${missingIng}`, "info");
        }
      }
      item.quantity = targetQty;
    }

    this.renderCart();
  },

  setQty(productId, qty) {
    const item = this.cart.find(item => item.productId === productId);
    if (!item) return;

    if (isNaN(qty) || qty <= 0) {
      this.removeFromCart(productId);
      return;
    }

    // Validate stock
    const stockCheck = window.db.checkStockAvailability(productId, qty);
    if (!stockCheck.available) {
      const missingIng = stockCheck.issues.map(i => `${i.name} (${Math.round(i.shortage)} ${i.unit} short)`).join(", ");
      window.showToast(`Low stock warning! Need more: ${missingIng}`, "info");
    }

    item.quantity = qty;
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
    if (badge) {
      badge.textContent = `${totalQty} ${totalQty === 1 ? 'Item' : 'Items'}`;
    }

    // Dynamically sync quantities on product grid cards
    this.renderProducts();

    if (this.cart.length === 0) {
      list.innerHTML = `
        <div class="cart-empty-box">
          <div class="cart-empty-icon-circle">
            <i class="fa-solid fa-basket-shopping"></i>
          </div>
          <div style="font-size: 13px; font-weight: 700; color: var(--text-dark); margin-bottom: 2px;">Cart is empty</div>
          <div style="font-size: 11px; color: var(--text-muted); max-width: 180px;">Tap on menu items on the left to add to order</div>
        </div>
      `;
      this.calculateBillTotals();
      return;
    }

    list.innerHTML = this.cart.map(item => {
      let bogoTag = "";
      if (item.bogo) {
        bogoTag = `<span style="font-size: 9px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color:#fff; padding:1px 6px; border-radius:4px; font-weight: 800; margin-left: 4px; vertical-align: middle;">BOGO</span>`;
      }

      const lineTotal = item.price * item.quantity;

      return `
        <div class="cart-item-row" style="background: var(--bg-darkest); border: 1px solid rgba(255, 255, 255, 0.9); border-radius: 16px; padding: 10px 12px; margin-bottom: 8px; display: flex; flex-direction: column; gap: 6px; box-sizing: border-box; width: 100%; box-shadow: 4px 4px 10px #cad5e2, -4px -4px 10px #ffffff;">
          
          <!-- Top Row: Veg Icon + Full Item Name + Remove Button -->
          <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;">
            <div style="display: flex; align-items: flex-start; gap: 6px; flex-grow: 1; min-width: 0;">
              <!-- Pure Veg Green Dot -->
              <span style="display: inline-flex; align-items: center; justify-content: center; width: 13px; height: 13px; border: 1.2px solid #0f8a4f; padding: 1px; border-radius: 3px; background: #fff; flex-shrink: 0; margin-top: 2px;">
                <span style="width: 5px; height: 5px; border-radius: 50%; background: #0f8a4f;"></span>
              </span>
              <span style="font-size: 12.5px; font-weight: 700; color: #1e293b; line-height: 1.35; word-break: break-word; text-align: left;">
                ${item.name} ${bogoTag}
              </span>
            </div>
            <!-- Remove Item Button -->
            <button onclick="views.pos.removeFromCart('${item.productId}')" style="background: var(--bg-darkest); border: 1px solid rgba(255, 255, 255, 0.8); color: #ef4444; width: 22px; height: 22px; border-radius: 50%; cursor: pointer; font-size: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.2s; box-shadow: 2px 2px 5px #cad5e2, -2px -2px 5px #ffffff;" title="Remove Item">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <!-- Bottom Row: Add Note (Left) & Controls + Unit Price + Line Total (Right) -->
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; border-top: 1px dashed rgba(200, 214, 229, 0.6); padding-top: 6px;">
            <button class="btn-add-note" onclick="views.pos.addItemNotePrompt('${item.productId}')" style="background: transparent; border: none; color: #2563eb; font-size: 10.5px; font-weight: 700; cursor: pointer; padding: 0; text-align: left; display: flex; align-items: center; gap: 3px; max-width: 130px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              <i class="fa-regular fa-comment-dots"></i> ${item.note ? `Note: ${item.note}` : '+ Add note'}
            </button>

            <div style="display: flex; align-items: center; gap: 7px; flex-shrink: 0;">
              <span style="font-size: 11px; color: #ebb036; font-weight: 700;">₹${item.price}</span>
              <!-- Qty Stepper Pill - Sunken Inset -->
              <div style="display: flex; align-items: center; background: var(--bg-darkest); border: 1px solid rgba(255, 255, 255, 0.6); border-radius: 12px; height: 24px; padding: 0 3px; box-shadow: inset 2px 2px 4px #cad5e2, inset -2px -2px 4px #ffffff;" onclick="event.stopPropagation();">
                <button onclick="views.pos.modifyQty('${item.productId}', -1)" style="background: transparent; border: none; width: 18px; height: 100%; cursor: pointer; font-size: 10px; color: #2563eb; display: flex; align-items: center; justify-content: center; font-weight: bold;"><i class="fa-solid fa-minus"></i></button>
                <input type="number" class="cart-qty-input" value="${item.quantity}" 
                       onchange="views.pos.setQty('${item.productId}', parseInt(this.value) || 0)"
                       onclick="this.select();" 
                       onkeydown="if(event.key==='Enter') { event.preventDefault(); this.blur(); }"
                       style="background: transparent; border: none; font-size: 11px; font-weight: 800; width: 28px; text-align: center; color: var(--text-dark); outline: none; padding: 0;">
                <button onclick="views.pos.modifyQty('${item.productId}', 1)" style="background: transparent; border: none; width: 18px; height: 100%; cursor: pointer; font-size: 10px; color: #2563eb; display: flex; align-items: center; justify-content: center; font-weight: bold;"><i class="fa-solid fa-plus"></i></button>
              </div>
              <!-- Line Total -->
              <span style="font-size: 13px; font-weight: 800; color: #ebb036; min-width: 44px; text-align: right;">₹${lineTotal}</span>
            </div>
          </div>
        </div>
      `;
    }).join("");

    this.calculateBillTotals();
  },

  // Category-specific BOGO calculations:
  // - Burger pairs only with Burger (Signature & Premium burgers)
  // - Tikka Pav pairs only with Tikka Pav (Signature & Premium tikka pavs)
  // For each category group, highest priced items are charged and cheapest Math.floor(n/2) items are free
  calculateBogoDiscount(cart = this.cart) {
    if (!cart || cart.length === 0) return 0;

    const products = window.db ? (window.db.get("products") || []) : [];
    const categories = window.db ? (window.db.get("categories") || []) : [];

    const groupPrices = {};

    cart.forEach(item => {
      if (!item.bogo) return;

      let catId = item.category;
      if (!catId) {
        const prod = products.find(p => p.id === item.productId);
        if (prod) catId = prod.category;
      }

      const catObj = categories.find(c => c.id === catId);
      const catName = (catObj ? catObj.name : "").toLowerCase();
      const itemName = (item.name || "").toLowerCase();

      // BOGO strictly applies ONLY to Burger and Tikka Pav (Signature & Premium)
      let groupKey = null;
      if (catId === "cat1" || catName.includes("burger") || itemName.includes("burger")) {
        groupKey = "burger";
      } else if (catId === "cat5" || catName.includes("tikka") || itemName.includes("tikka")) {
        groupKey = "tikkapav";
      }

      if (!groupKey) return;

      if (!groupPrices[groupKey]) {
        groupPrices[groupKey] = [];
      }

      for (let i = 0; i < item.quantity; i++) {
        groupPrices[groupKey].push(item.price);
      }
    });

    let totalBogoDiscount = 0;

    // For each group with 2 or more BOGO items, charge the higher priced item(s) and make cheapest free
    Object.keys(groupPrices).forEach(k => {
      const prices = groupPrices[k];
      if (prices.length < 2) return;

      prices.sort((a, b) => b - a); // Higher price first
      const numFree = Math.floor(prices.length / 2);
      for (let i = prices.length - numFree; i < prices.length; i++) {
        totalBogoDiscount += prices[i];
      }
    });

    return totalBogoDiscount;
  },

  calculateBillTotals() {
    let subtotal = 0;

    // Sum standard totals
    this.cart.forEach(item => {
      subtotal += item.price * item.quantity;
    });

    // Category-specific BOGO calculations (Burger on Burger, Tikka Pav on Tikka Pav)
    const bogoDiscount = this.calculateBogoDiscount(this.cart);

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

    // Sync active discount chips
    const chips = document.querySelectorAll(".cart-discount-chip");
    chips.forEach(chip => {
      chip.classList.toggle("active", Number(chip.getAttribute("data-discount")) === discountPercent);
    });

    // Sync cash change calculation if open
    this.calcChangeReturn();
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
        const noteInput = document.getElementById("order-kitchen-note");
        if (noteInput) noteInput.value = "";
        const cashInput = document.getElementById("cash-received-input");
        if (cashInput) cashInput.value = "";
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

    // 5. Order Type selection (Header buttons)
    const dinein = document.getElementById("type-dinein");
    const takeaway = document.getElementById("type-takeaway");
    const delivery = document.getElementById("type-delivery");
    const tableBox = document.getElementById("header-table-box");

    const setOrderType = (type) => {
      this.orderType = type;
      [dinein, takeaway, delivery].forEach(b => {
        if (b) b.classList.toggle("active", b.id === `type-${type.toLowerCase().replace(/[^a-z]/g, "")}`);
      });
      if (tableBox) {
        tableBox.style.display = type === "Dine-in" ? "flex" : "none";
        if (type === "Dine-in") {
          const tInput = document.getElementById("pos-table-input");
          if (tInput && !tInput.value.trim()) {
            this.setQuickTable("T-1");
          }
        }
      }
    };

    if (dinein) dinein.onclick = () => setOrderType("Dine-in");
    if (takeaway) takeaway.onclick = () => setOrderType("Takeaway");
    if (delivery) delivery.onclick = () => setOrderType("Delivery");

    // Table input sync with chips
    const tableInput = document.getElementById("pos-table-input");
    if (tableInput) {
      tableInput.oninput = (e) => {
        const val = e.target.value.trim().toUpperCase().replace("-", "");
        const chips = document.querySelectorAll(".pos-table-chip");
        chips.forEach(chip => {
          chip.classList.toggle("active", chip.textContent.trim().toUpperCase() === val);
        });
      };
    }

    // 5c. Keydown keyboard hotkeys shortcuts listener
    this.handleKeydown = (e) => {
      const search = document.getElementById("pos-search");
      if (!search || !search.isConnected) return; // Exit if POS tab is inactive

      // 1. Focus search with Ctrl+K or "/" key
      if ((e.key === "/" || (e.ctrlKey && (e.key === "k" || e.key === "K"))) && document.activeElement !== search && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
        e.preventDefault();
        search.focus();
        search.select();
      }
      // 2. F1 for New Bill (clear cart)
      if (e.key === "F1") {
        e.preventDefault();
        const clearBtn = document.getElementById("btn-clear-cart-trigger");
        if (clearBtn) clearBtn.click();
      }
      // 3. F3 to hold cart
      if (e.key === "F3") {
        e.preventDefault();
        this.holdCurrentCart();
      }
      // 4. F4 to open held orders modal
      if (e.key === "F4") {
        e.preventDefault();
        this.showHeldOrdersModal();
      }
      // 5. Ctrl+B or F8 to place order and print bill
      if (e.key === "F8" || (e.ctrlKey && (e.key === "b" || e.key === "B"))) {
        e.preventDefault();
        this.processCheckout(false);
      }
      // 6. Alt + C to clear cart
      if (e.altKey && (e.key === "c" || e.key === "C")) {
        e.preventDefault();
        const clearBtn = document.getElementById("btn-clear-cart-trigger");
        if (clearBtn) clearBtn.click();
      }
      // 7. Escape to clear search query
      if (e.key === "Escape" && document.activeElement === search) {
        search.value = "";
        this.searchQuery = "";
        this.renderProducts();
        search.blur();
      }
    };
    document.addEventListener("keydown", this.handleKeydown);

    // 6. Payment Modes click select & Cash assistant toggle
    const pUpi = document.getElementById("pay-upi");
    const pCash = document.getElementById("pay-cash");
    const pCard = document.getElementById("pay-card");
    const pSplit = document.getElementById("pay-split");
    const cashDrawer = document.getElementById("cash-tender-drawer");

    const selectPayment = (btn, mode) => {
      [pUpi, pCash, pCard, pSplit].forEach(b => {
        if (b) b.classList.remove("active");
      });
      if (btn) btn.classList.add("active");
      this.selectedPayment = mode;
      if (cashDrawer) {
        cashDrawer.style.display = mode === "Cash" ? "flex" : "none";
        if (mode === "Cash") {
          this.calcChangeReturn();
        }
      }
    };

    if (pUpi) pUpi.onclick = () => selectPayment(pUpi, "UPI");
    if (pCash) pCash.onclick = () => selectPayment(pCash, "Cash");
    if (pCard) pCard.onclick = () => selectPayment(pCard, "Card");
    if (pSplit) pSplit.onclick = () => selectPayment(pSplit, "Split");

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

  setQuickDiscount(percent) {
    const discInput = document.getElementById("bill-discount-input");
    if (discInput) {
      discInput.value = percent;
      this.calculateBillTotals();
    }
    const chips = document.querySelectorAll(".cart-discount-chip");
    chips.forEach(chip => {
      chip.classList.toggle("active", Number(chip.getAttribute("data-discount")) === Number(percent));
    });
  },

  setCashTender(val) {
    const cashInput = document.getElementById("cash-received-input");
    if (!cashInput) return;
    if (val === "exact") {
      const totalEl = document.getElementById("bill-total");
      const totalNum = parseFloat(totalEl.textContent.replace(/[^0-9.]/g, "")) || 0;
      cashInput.value = Math.ceil(totalNum);
    } else {
      cashInput.value = val;
    }
    this.calcChangeReturn();
  },

  calcChangeReturn() {
    const cashInput = document.getElementById("cash-received-input");
    const changeEl = document.getElementById("cash-change-return");
    const totalEl = document.getElementById("bill-total");
    if (!cashInput || !changeEl || !totalEl) return;

    const totalNum = parseFloat(totalEl.textContent.replace(/[^0-9.]/g, "")) || 0;
    const received = parseFloat(cashInput.value) || 0;
    const change = Math.max(0, received - totalNum);

    if (received >= totalNum && totalNum > 0) {
      changeEl.textContent = `Change: ₹${change.toFixed(2)}`;
      changeEl.style.color = "#10b981";
    } else if (received > 0) {
      changeEl.textContent = `Due: ₹${(totalNum - received).toFixed(2)}`;
      changeEl.style.color = "#ef4444";
    } else {
      changeEl.textContent = `Change: ₹0.00`;
      changeEl.style.color = "var(--text-muted)";
    }
  },

  printKitchenKOT() {
    if (this.cart.length === 0) {
      window.showToast("Cart is empty. Add items to print KOT.", "error");
      return;
    }
    const settings = window.db.get("settings") || {};
    const tableNo = document.getElementById("pos-table-input") ? document.getElementById("pos-table-input").value.trim() : "";
    const kitchenNote = document.getElementById("order-kitchen-note") ? document.getElementById("order-kitchen-note").value.trim() : "";
    const custName = document.getElementById("cust-name") ? document.getElementById("cust-name").value.trim() : "Walk-in";

    const dateObj = new Date();
    const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const kotHtml = `
      <div class="receipt-wrapper" style="font-family: monospace; padding: 10px; max-width: 72mm; margin: 0 auto; text-align: left;">
        <div style="text-align: center; border-bottom: 2px dashed #000; padding-bottom: 6px; margin-bottom: 6px;">
          <h2 style="margin: 0; font-size: 18px; font-weight: 900;">*** KITCHEN ORDER TICKET (KOT) ***</h2>
          <div style="font-size: 13px; font-weight: bold; margin-top: 2px;">${settings.restaurantName || "Crust & Chilly"}</div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; margin-bottom: 4px;">
          <span>Type: ${this.orderType} ${tableNo ? `(Table: ${tableNo})` : ''}</span>
          <span>Time: ${timeStr}</span>
        </div>
        <div style="font-size: 11px; margin-bottom: 6px;">Customer: ${custName}</div>
        <div style="border-bottom: 1px solid #000; margin-bottom: 6px;"></div>
        <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px dashed #000;">
              <th style="text-align: left; padding: 4px 0; width: 75%;">Item Description</th>
              <th style="text-align: right; padding: 4px 0; width: 25%;">Qty</th>
            </tr>
          </thead>
          <tbody>
            ${this.cart.map(item => `
              <tr style="border-bottom: 1px dotted #ccc;">
                <td style="padding: 5px 0; font-weight: bold;">
                  ${item.name}
                  ${item.note ? `<div style="font-size: 10px; font-style: italic; color: #555;">>> Note: ${item.note}</div>` : ''}
                </td>
                <td style="text-align: right; padding: 5px 0; font-size: 14px; font-weight: 900;">${item.quantity}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
        ${kitchenNote ? `
          <div style="margin-top: 8px; border: 1px dashed #000; padding: 4px; font-size: 11px; font-weight: bold;">
            SPECIAL NOTE: ${kitchenNote}
          </div>
        ` : ''}
        <div style="text-align: center; border-top: 2px dashed #000; margin-top: 10px; padding-top: 6px; font-size: 11px; font-weight: bold;">
          Total Qty: ${this.cart.reduce((s, i) => s + i.quantity, 0)} Items
        </div>
      </div>
    `;

    window.customModal.show({
      title: "Kitchen Order Ticket (KOT)",
      bodyHtml: kotHtml,
      confirmText: "Print KOT",
      cancelText: "Close",
      onConfirm: () => {
        window.print();
        return false;
      }
    });
  },

  processCheckout(skipPrint = false, bypassStockCheck = false) {
    if (this.cart.length === 0) {
      window.showToast("Cannot place order. The cart is empty.", "error");
      return;
    }

    const customerName = document.getElementById("cust-name").value.trim() || "Walk-in Customer";
    const customerPhone = document.getElementById("cust-phone").value.trim() || "";
    const tableNoVal = document.getElementById("pos-table-input") ? document.getElementById("pos-table-input").value.trim() : "";
    const kitchenNoteVal = document.getElementById("order-kitchen-note") ? document.getElementById("order-kitchen-note").value.trim() : "";

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
        category: item.category,
        lineTotal: lineTotal,
        note: item.note || ""
      };
    });

    // Category-specific BOGO calculations (Burger on Burger, Tikka Pav on Tikka Pav)
    const bogoDiscount = this.calculateBogoDiscount(this.cart);

    const settings = window.db.get("settings") || {};
    const gstRate = settings.gstPercentage || 5;

    const discountPercent = Math.min(100, Math.max(0, discountVal));
    const flatDiscountAmount = Math.round((subtotal - bogoDiscount) * (discountPercent / 100) * 100) / 100;

    const netBeforeTax = Math.max(0, subtotal - bogoDiscount - flatDiscountAmount);
    const taxVal = gstEnabled ? Math.round(netBeforeTax * (gstRate / 100) * 100) / 100 : 0;
    const netTotal = netBeforeTax + taxVal;

    // Call database create transaction
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
      tableNumber: this.orderType === "Dine-in" ? tableNoVal : "",
      notes: kitchenNoteVal,
      paymentMethod: this.selectedPayment
    }, bypassStockCheck);

    if (response.success) {
      if (window.soundAlerts && typeof window.soundAlerts.playNewOrderSound === "function") {
        try {
          window.soundAlerts.playNewOrderSound();
        } catch (e) {
          console.warn("Sound play error:", e);
        }
      }
      window.showToast(`Order #${response.order.orderNumber} successfully processed!`, "success");

      // Force update inventory warnings in headers
      const updateHeaderPill = document.createEvent("Event");
      updateHeaderPill.initEvent("db-update", true, true);
      window.dispatchEvent(updateHeaderPill);

      // Trigger printable receipt billing modal
      if (!skipPrint) {
        this.showReceiptModal(response.order, true);
      }

      // Clear Cart state
      this.cart = [];
      document.getElementById("cust-name").value = "Walk-in Customer";
      document.getElementById("cust-phone").value = "";
      document.getElementById("bill-discount-input").value = "0";
      const noteInput = document.getElementById("order-kitchen-note");
      if (noteInput) noteInput.value = "";
      const cashInput = document.getElementById("cash-received-input");
      if (cashInput) cashInput.value = "";
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
        title: "Stock Allocation Alert",
        bodyHtml: `
          <div style="color: #ff9f0a; margin-bottom: 12px; font-weight: 600;">
            <i class="fa-solid fa-triangle-exclamation"></i> Insufficient raw material ingredients for some items:
          </div>
          <ul style="padding-left: 20px; font-size: 13px; line-height: 1.6; color: var(--text-muted); margin-bottom: 12px;">
            ${missingHtml}
          </ul>
          <div style="font-weight: 600; font-size: 13px; color: var(--text-dark);">
            Do you want to override and place the order anyway?
          </div>
        `,
        confirmText: "Place Order Anyway",
        cancelText: "Cancel & Refill",
        onConfirm: () => {
          this.processCheckout(skipPrint, true);
        }
      });
    }
  },

  currentReceiptOrder: null,
  currentReceiptTab: "bill",

  switchReceiptTab(tab) {
    this.currentReceiptTab = tab;
    const billSec = document.getElementById("receipt-section-bill");
    const kotSec = document.getElementById("receipt-section-kot");
    const tearSec = document.getElementById("receipt-section-tear");
    const btnBill = document.getElementById("btn-tab-bill");
    const btnKot = document.getElementById("btn-tab-kot");
    const btnBoth = document.getElementById("btn-tab-both");
    const modalConfirmBtn = document.getElementById("modal-submit-btn");

    if (!billSec || !kotSec) return;

    [btnBill, btnKot, btnBoth].forEach(b => {
      if (b) {
        b.style.background = "#f1f5f9";
        b.style.color = "#475569";
        b.style.borderColor = "#cbd5e1";
        b.style.fontWeight = "600";
      }
    });

    if (tab === "bill") {
      billSec.style.display = "block";
      kotSec.style.display = "none";
      if (tearSec) tearSec.style.display = "none";
      if (btnBill) {
        btnBill.style.background = "#2563eb";
        btnBill.style.color = "#fff";
        btnBill.style.borderColor = "#2563eb";
        btnBill.style.fontWeight = "800";
      }
      if (modalConfirmBtn) modalConfirmBtn.innerHTML = '<i class="fa-solid fa-print"></i> Print Bill';
    } else if (tab === "kot") {
      billSec.style.display = "none";
      kotSec.style.display = "block";
      if (tearSec) tearSec.style.display = "none";
      if (btnKot) {
        btnKot.style.background = "#2563eb";
        btnKot.style.color = "#fff";
        btnKot.style.borderColor = "#2563eb";
        btnKot.style.fontWeight = "800";
      }
      if (modalConfirmBtn) modalConfirmBtn.innerHTML = '<i class="fa-solid fa-fire-burner"></i> Print Kitchen KOT';
    } else if (tab === "both") {
      billSec.style.display = "block";
      kotSec.style.display = "block";
      if (tearSec) tearSec.style.display = "block";
      if (btnBoth) {
        btnBoth.style.background = "#2563eb";
        btnBoth.style.color = "#fff";
        btnBoth.style.borderColor = "#2563eb";
        btnBoth.style.fontWeight = "800";
      }
      if (modalConfirmBtn) modalConfirmBtn.innerHTML = '<i class="fa-solid fa-file-invoice"></i> Print Both (Bill + KOT)';
    }
  },

  shareReceiptWhatsApp(order) {
    if (!order) order = this.currentReceiptOrder;
    if (!order) return;
    const settings = window.db.get("settings") || {};
    const currency = settings.currencySymbol || "₹";
    const shopName = settings.restaurantName || "Crust & Chilly";

    let phone = (order.customerPhone || "").replace(/\D/g, "");
    if (!phone || phone.length !== 10) {
      phone = prompt("Enter customer WhatsApp Mobile Number (10 digits):", phone || "");
      if (!phone) return;
      phone = phone.replace(/\D/g, "");
    }

    if (phone.length === 10) phone = `91${phone}`;

    const itemsText = (order.items || []).map(i => `• ${i.name} x${i.quantity} = ${currency}${(i.price * i.quantity)}`).join("%0A");

    const message = `*${encodeURIComponent(shopName)}*%0A`
      + `Order: *%23${order.orderNumber || order.id}* (Token *%23${order.tokenNumber || 1}*)%0A`
      + `Date: ${new Date(order.createdAt).toLocaleDateString("en-IN")}%0A`
      + `Customer: ${encodeURIComponent(order.customerName || "Valued Guest")}%0A`
      + `--------------------------%0A`
      + `${itemsText}%0A`
      + `--------------------------%0A`
      + `*Total Amount: ${currency}${Number(order.total).toFixed(2)}*%0A`
      + `Paid via: ${order.paymentMethod || "Cash"}%0A%0A`
      + `Thank you for visiting *${encodeURIComponent(shopName)}*! Enjoy your meal!`;

    const waUrl = `https://wa.me/${phone}?text=${message}`;
    window.open(waUrl, "_blank");
  },

  showReceiptModal(order, autoPrint = false) {
    this.currentReceiptOrder = order;
    this.currentReceiptTab = "bill";
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
    const totalQty = (order.items || []).reduce((sum, item) => sum + item.quantity, 0);

    // Dynamic UPI QR code payload
    const upiId = settings.upiId || "7487980840@okbizaxis";
    const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(settings.restaurantName || "Crust & Chilly")}&am=${Number(order.total || 0).toFixed(2)}&cu=INR&tn=Order${order.orderNumber}`;

    const modalHtml = `
      <!-- Toolbar switcher (Screen only, hidden on print) -->
      <div class="receipt-tabs-toolbar no-print" style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid var(--border-color); flex-wrap: wrap;">
        <div style="display: flex; gap: 6px;">
          <button id="btn-tab-bill" type="button" onclick="views.pos.switchReceiptTab('bill')" style="padding: 6px 12px; border-radius: 8px; border: 1.5px solid #2563eb; background: #2563eb; color: #fff; font-size: 12px; font-weight: 800; cursor: pointer; transition: all 0.2s;">
            <i class="fa-solid fa-receipt"></i> Customer Bill
          </button>
          <button id="btn-tab-kot" type="button" onclick="views.pos.switchReceiptTab('kot')" style="padding: 6px 12px; border-radius: 8px; border: 1.5px solid #cbd5e1; background: #f1f5f9; color: #475569; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s;">
            <i class="fa-solid fa-fire-burner"></i> Kitchen KOT
          </button>
          <button id="btn-tab-both" type="button" onclick="views.pos.switchReceiptTab('both')" style="padding: 6px 12px; border-radius: 8px; border: 1.5px solid #cbd5e1; background: #f1f5f9; color: #475569; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s;" title="Prints both customer bill and kitchen copy on single thermal slip">
            <i class="fa-solid fa-file-invoice"></i> Both (Bill + KOT)
          </button>
        </div>
        <div>
          <button type="button" onclick="views.pos.shareReceiptWhatsApp()" style="padding: 6px 12px; border-radius: 8px; border: 1.5px solid #16a34a; background: #dcfce7; color: #15803d; font-size: 12px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 6px;">
            <i class="fa-brands fa-whatsapp" style="font-size: 14px;"></i> WhatsApp
          </button>
        </div>
      </div>

      <div class="receipt-wrapper" id="receipt-printable-content">
        <!-- Customer Bill Section -->
        <div id="receipt-section-bill">
          <img src="logo.jpg" alt="Logo" class="receipt-logo" onerror="this.style.display='none'">
          
          <div class="receipt-header">
            <div class="receipt-title">${settings.restaurantName || "Crust & Chilly"}</div>
            <div class="receipt-subtitle">${settings.address || "Shop No. 09, Shree Sanidhya Flora, Near Turquoise BLU Road, Shela, Ahmedabad - 380057, Gujarat"}</div>
            <div class="receipt-subtitle">Phone: ${settings.phone || "+91 9664870840"}</div>
          </div>
          
          <div class="receipt-dotted-line"></div>
          
          <div class="receipt-meta">
            <div style="font-weight: bold; margin-bottom: 4px;">Name: ${order.customerName || "Walk-in Customer"}</div>
            ${order.customerPhone ? `<div style="font-weight: bold; margin-bottom: 4px;">Phone: ${order.customerPhone}</div>` : ""}
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
              ${(order.items || []).map(item => {
                let bogoLabel = item.bogo ? "<br><span class='receipt-bogo-label'>(BOGO Eligible)</span>" : "";
                const linePrice = Number(item.price || 0).toFixed(2);
                const lineAmt = Number(item.lineTotal || (item.price * item.quantity)).toFixed(2);
                return `
                  <tr>
                    <td>
                      <span class="receipt-item-name">${item.name}</span>
                      ${bogoLabel}
                    </td>
                    <td style="text-align: center;">${item.quantity}</td>
                    <td style="text-align: right;">${linePrice}</td>
                    <td style="text-align: right;">${lineAmt}</td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
          
          <div class="receipt-dotted-line"></div>
          
          <div class="receipt-totals">
            <div class="receipt-total-line">
              <span>Total Qty: ${totalQty}</span>
              <span>Sub Total: ₹${Number(order.subtotal || 0).toFixed(2)}</span>
            </div>
            
            ${order.bogoDiscount > 0 || order.discount > 0 || order.tax > 0 ? `
              <div class="receipt-dotted-line" style="margin: 4px 0;"></div>
            ` : ""}
            
            ${order.bogoDiscount > 0 ? `
              <div class="receipt-total-line" style="font-weight: 600; color: #d62d20;">
                <span>BOGO Discount:</span>
                <span>-₹${Number(order.bogoDiscount).toFixed(2)}</span>
              </div>
            ` : ""}
            
            ${order.discount > 0 ? `
              <div class="receipt-total-line">
                <span>Cash Discount:</span>
                <span>-₹${Number(order.discount).toFixed(2)}</span>
              </div>
            ` : ""}
            
            ${order.tax > 0 ? `
              <div class="receipt-total-line">
                <span>GST (5%):</span>
                <span>₹${Number(order.tax).toFixed(2)}</span>
              </div>
            ` : ""}
            
            <div class="receipt-grand-total">
              <span>Grand Total</span>
              <span>₹${Number(order.total || 0).toFixed(2)}</span>
            </div>
          </div>
          
          <div class="receipt-dotted-line"></div>
          
          <div class="receipt-footer">
            <div style="font-weight: bold; margin-bottom: 6px;">For Order or More : ${settings.phone || "+91 9664870840"}</div>
            
            <div class="receipt-qr-wrapper" style="text-align: center; margin: 8px 0;">
              <div id="receipt-qrcode-box" style="display: flex; justify-content: center; align-items: center; margin: 4px auto; width: 95px; height: 95px; overflow: hidden;"></div>
              <div class="receipt-qr-text" style="font-size: 10px; font-weight: bold; margin-top: 4px;">Scan & Pay via UPI</div>
            </div>
            
            <div class="receipt-dotted-line" style="margin: 10px 0 6px 0;"></div>
            <div style="font-weight: bold; margin-top: 6px; text-transform: uppercase; font-size: 10px;">Thank you for dining with us!</div>
          </div>
        </div>

        <!-- Tear Line for Combined Bill + KOT Print -->
        <div id="receipt-section-tear" style="display: none; text-align: center; margin: 14px 0; border-top: 2px dashed #000; padding-top: 8px; font-weight: 800; font-size: 11px; text-transform: uppercase;">
          ✂️ - - - - TEAR HERE FOR KITCHEN (KOT) - - - - ✂️
        </div>

        <!-- Kitchen Order Ticket (KOT) Section -->
        <div id="receipt-section-kot" style="display: none;">
          <div class="receipt-header">
            <div class="receipt-title" style="font-size: 16px; font-weight: 900; letter-spacing: 0.5px;">*** KITCHEN ORDER TICKET ***</div>
            <div class="receipt-subtitle" style="font-weight: 800; font-size: 14px; margin-top: 4px; color: #000;">Token No.: ${tokenNo}</div>
          </div>
          
          <div class="receipt-dotted-line"></div>
          
          <div class="receipt-meta">
            <div style="font-weight: bold; margin-bottom: 4px;">Name: ${order.customerName || "Walk-in Customer"}</div>
            ${order.customerPhone ? `<div style="font-weight: bold; margin-bottom: 4px;">Phone: ${order.customerPhone}</div>` : ""}
            <div class="receipt-dotted-line" style="margin: 4px 0;"></div>
            <div class="receipt-meta-row">
              <span>Date: ${orderDate}</span>
              <span style="font-weight: bold;">${order.tableNumber ? `${order.type} (${order.tableNumber})` : order.type}</span>
            </div>
            <div class="receipt-meta-row">
              <span>Time: ${orderTime}</span>
              <span>Bill No.: ${order.orderNumber}</span>
            </div>
          </div>
          
          <div class="receipt-dotted-line"></div>
          
          <table class="receipt-table">
            <thead>
              <tr>
                <th style="width: 75%; font-weight: 800;">Item</th>
                <th style="text-align: right; width: 25%; font-weight: 800;">Qty</th>
              </tr>
            </thead>
            <tbody>
              ${(order.items || []).map(item => {
                let noteLabel = item.note ? `<br><span class="receipt-item-note" style="font-size: 10px; font-weight: bold; color: #ea580c;">* Note: ${item.note}</span>` : "";
                return `
                  <tr>
                    <td>
                      <span class="receipt-item-name" style="font-size: 13px; font-weight: bold;">${item.name}</span>
                      ${noteLabel}
                    </td>
                    <td style="text-align: right; font-size: 14px; font-weight: 900;">${item.quantity}</td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>

          ${order.notes ? `
            <div style="margin-top: 8px; border: 1.5px dashed #000; padding: 6px; font-size: 11px; font-weight: bold;">
              SPECIAL INSTRUCTION: ${order.notes}
            </div>
          ` : ""}
          
          <div class="receipt-dotted-line" style="margin-top: 10px;"></div>
          <div class="receipt-footer" style="text-align: center; font-size: 11px; font-weight: bold; margin-top: 8px; text-transform: uppercase;">
            Total Qty: ${totalQty} Items | Crust & Chilly Kitchen Copy
          </div>
        </div>
      </div>
      
      <!-- Custom print styles only active when printing -->
      <style>
        @media print {
          @page {
            margin: 0 !important;
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
          #app-container, .toast-container, .modal-header, .modal-footer, .no-print, .receipt-no-print { 
            display: none !important; 
          }
          #modal-container, .modal-overlay { 
            position: absolute !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 100% !important; 
            height: auto !important; 
            background: transparent !important; 
            background-color: transparent !important;
            backdrop-filter: none !important; 
            box-shadow: none !important; 
            display: block !important;
            opacity: 1 !important;
            visibility: visible !important;
            padding: 0 !important; 
            margin: 0 !important; 
          }
          #modal-container .modal-content, .modal-content { 
            border: none !important; 
            box-shadow: none !important; 
            background: transparent !important; 
            background-color: transparent !important;
            width: 100% !important; 
            max-width: 100% !important; 
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            padding: 0 !important; 
            margin: 0 !important; 
            transform: none !important;
          }
          #modal-container .modal-body, .modal-body { 
            padding: 0 !important; 
            margin: 0 !important; 
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            background: transparent !important;
            background-color: transparent !important;
          }
          .receipt-wrapper { 
            width: 72mm !important;
            max-width: 72mm !important;
            margin: 0 auto !important; 
            padding: 2mm 3mm !important;
            box-sizing: border-box !important;
            box-shadow: none !important; 
            border: none !important;
            border-radius: 0 !important;
          }
          .receipt-table th, .receipt-table td {
            font-size: 11px !important;
          }
          #receipt-qrcode-box canvas {
            display: none !important;
          }
          #receipt-qrcode-box img,
          .receipt-qr-img {
            display: block !important;
            margin: 0 auto !important;
            width: 95px !important;
            height: 95px !important;
            max-width: 95px !important;
          }
        }
      </style>
    `;

    window.customModal.show({
      title: `Bill & Receipt #${order.orderNumber} (Token #${tokenNo})`,
      bodyHtml: modalHtml,
      confirmText: "🖨️ Print Bill",
      cancelText: "Done / Close",
      onConfirm: () => {
        window.print();
        return false; // KEEP MODAL OPEN SO USER CAN RE-PRINT OR VIEW
      },
      onCancel: () => {
        window.customModal.hide();
      }
    });

    // Generate UPI QR Code locally (100% offline, instant & guaranteed on bill)
    const qrContainer = document.getElementById("receipt-qrcode-box");
    if (qrContainer) {
      qrContainer.innerHTML = "";
      try {
        if (typeof QRCode !== "undefined") {
          new QRCode(qrContainer, {
            text: upiUrl,
            width: 95,
            height: 95,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.M
          });

          // qrcodejs creates both canvas and img; make sure only img is displayed so it never doubles up
          const cvs = qrContainer.querySelector("canvas");
          if (cvs) cvs.style.display = "none";
          const img = qrContainer.querySelector("img");
          if (img) {
            img.style.display = "block";
            img.style.margin = "0 auto";
          }
        } else {
          // Fallback online QR if library missing
          qrContainer.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=95x95&data=${encodeURIComponent(upiUrl)}" style="width:95px;height:95px;margin:0 auto;display:block;" alt="Scan to Pay">`;
        }
      } catch (err) {
        console.warn("QR code render error:", err);
      }
    }

    // If autoPrint requested (e.g. from Place Order & Print Bill), trigger window.print() after QR paint
    if (autoPrint) {
      setTimeout(() => {
        try {
          window.print();
        } catch (err) {
          console.error("Print dialog error:", err);
        }
      }, 80);
    }
  },

  showKitchenReceiptModal(order) {
    if (!order) return;
    this.showReceiptModal(order, false);
    this.switchReceiptTab("kot");
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

      nameDatalist.innerHTML = Array.from(uniqueNames).map(name => '<option value="' + name + '"></option>').join("");
      phoneDatalist.innerHTML = Array.from(uniquePhones).map(phone => '<option value="' + phone + '"></option>').join("");
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
  },

  setQuickTable(tableNo) {
    const input = document.getElementById("pos-table-input");
    if (input) {
      input.value = tableNo;
      input.focus();
    }
    const chips = document.querySelectorAll(".pos-table-chip");
    chips.forEach(chip => {
      chip.classList.toggle("active", chip.textContent.trim() === tableNo.replace("-", ""));
    });
  },

  setQuickCustomerWalkin() {
    const nameInput = document.getElementById("cust-name");
    const phoneInput = document.getElementById("cust-phone");
    if (nameInput) nameInput.value = "Walk-in Customer";
    if (phoneInput) phoneInput.value = "";
    window.showToast("Customer set to Walk-in", "info");
  },

  toggleKitchenNotePreset(noteText) {
    const input = document.getElementById("order-kitchen-note");
    if (!input) return;
    let current = input.value.trim();
    let parts = current ? current.split(",").map(s => s.trim()).filter(Boolean) : [];
    
    const existingIndex = parts.findIndex(p => p.toLowerCase() === noteText.toLowerCase());
    if (existingIndex > -1) {
      parts.splice(existingIndex, 1);
    } else {
      parts.push(noteText);
    }
    input.value = parts.join(", ");
    this.updateKitchenNoteChips();
  },

  updateKitchenNoteChips() {
    const input = document.getElementById("order-kitchen-note");
    const current = (input ? input.value : "").toLowerCase();
    const chips = document.querySelectorAll(".pos-preset-chip");
    chips.forEach(chip => {
      const text = (chip.getAttribute("data-text") || "").toLowerCase();
      if (text && current.includes(text)) {
        chip.classList.add("active");
      } else {
        chip.classList.remove("active");
      }
    });
  },

  holdCurrentCart() {
    if (this.cart.length === 0) {
      window.showToast("Cart is empty! Nothing to hold.", "error");
      return;
    }

    const heldList = this.getHeldOrders();
    const custName = (document.getElementById("cust-name") ? document.getElementById("cust-name").value.trim() : "") || "Walk-in";
    const custPhone = (document.getElementById("cust-phone") ? document.getElementById("cust-phone").value.trim() : "");
    const tableNo = (document.getElementById("pos-table-input") ? document.getElementById("pos-table-input").value.trim() : "");
    const note = (document.getElementById("order-kitchen-note") ? document.getElementById("order-kitchen-note").value.trim() : "");
    const discount = Number(document.getElementById("bill-discount-input") ? document.getElementById("bill-discount-input").value : 0) || 0;

    let subtotal = 0;
    this.cart.forEach(i => subtotal += (i.price * i.quantity));

    const newHeld = {
      id: "HELD-" + Date.now(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      cart: JSON.parse(JSON.stringify(this.cart)),
      customerName: custName,
      customerPhone: custPhone,
      orderType: this.orderType,
      tableNumber: tableNo,
      notes: note,
      discount: discount,
      subtotal: subtotal,
      itemCount: this.cart.reduce((s, i) => s + i.quantity, 0)
    };

    heldList.unshift(newHeld);
    this.saveHeldOrders(heldList);

    // Reset current cart
    this.cart = [];
    this.renderCart();

    const noteInput = document.getElementById("order-kitchen-note");
    if (noteInput) noteInput.value = "";
    this.updateKitchenNoteChips();

    this.updateHeldOrdersBadge();
    window.showToast(`Order held for ${custName} (${newHeld.itemCount} items)`, "success");
  },

  updateHeldOrdersBadge() {
    const heldList = this.getHeldOrders();
    const container = document.getElementById("btn-held-badge-container");
    if (!container) return;

    if (heldList.length > 0) {
      container.style.display = "inline-flex";
      container.innerHTML = `
        <button type="button" class="btn-held-badge" onclick="views.pos.showHeldOrdersModal()" title="View Held / Parked Orders (F4)">
          <i class="fa-solid fa-clock-rotate-left"></i> Held (${heldList.length})
        </button>
      `;
    } else {
      container.style.display = "none";
    }
  },

  showHeldOrdersModal() {
    const heldList = this.getHeldOrders();
    if (heldList.length === 0) {
      window.showToast("No orders currently held/parked.", "info");
      return;
    }

    const bodyHtml = `
      <div style="display: flex; flex-direction: column; gap: 10px; max-height: 400px; overflow-y: auto; padding: 4px;">
        ${heldList.map(h => `
          <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 12px; display: flex; justify-content: space-between; align-items: center; gap: 12px;">
            <div style="flex-grow: 1;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <span style="font-weight: 800; font-size: 13px; color: #1e293b;">${h.customerName}</span>
                <span style="font-size: 10px; font-weight: 700; background: #e0f2fe; color: #0284c7; padding: 2px 6px; border-radius: 6px;">${h.orderType} ${h.tableNumber ? `(${h.tableNumber})` : ''}</span>
                <span style="font-size: 11px; color: #94a3b8; font-weight: 600;"><i class="fa-regular fa-clock"></i> ${h.time}</span>
              </div>
              <div style="font-size: 11.5px; color: #64748b; line-height: 1.3;">
                ${h.cart.map(i => `${i.quantity}x ${i.name}`).join(", ")}
              </div>
              ${h.notes ? `<div style="font-size: 10.5px; color: #d97706; font-weight: 600; margin-top: 3px;"><i class="fa-solid fa-pencil"></i> ${h.notes}</div>` : ''}
            </div>
            <div style="text-align: right; flex-shrink: 0; display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
              <div style="font-size: 14px; font-weight: 800; color: #2563eb;">₹${h.subtotal.toFixed(2)}</div>
              <div style="display: flex; gap: 6px;">
                <button onclick="views.pos.resumeHeldOrder('${h.id}')" style="background: #2563eb; color: #fff; border: none; border-radius: 8px; padding: 5px 10px; font-size: 11px; font-weight: 700; cursor: pointer;">
                  <i class="fa-solid fa-arrow-rotate-right"></i> Resume
                </button>
                <button onclick="views.pos.discardHeldOrder('${h.id}')" style="background: #fee2e2; color: #dc2626; border: none; border-radius: 8px; padding: 5px 8px; font-size: 11px; font-weight: 700; cursor: pointer;" title="Discard">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </div>
            </div>
          </div>
        `).join("")}
      </div>
    `;

    window.customModal.show({
      title: `Held Orders (${heldList.length})`,
      bodyHtml: bodyHtml,
      confirmText: "Close",
      cancelText: null,
      onConfirm: () => {
        window.customModal.hide();
      }
    });
  },

  resumeHeldOrder(heldId) {
    const heldList = this.getHeldOrders();
    const item = heldList.find(h => h.id === heldId);
    if (!item) return;

    if (this.cart.length > 0) {
      if (!confirm("Your current cart is not empty. Replace with held order?")) {
        return;
      }
    }

    this.cart = item.cart || [];
    this.orderType = item.orderType || "Dine-in";

    // Set header buttons
    const dinein = document.getElementById("type-dinein");
    const takeaway = document.getElementById("type-takeaway");
    const delivery = document.getElementById("type-delivery");
    const tableBox = document.getElementById("header-table-box");
    if (dinein && takeaway && delivery) {
      [dinein, takeaway, delivery].forEach(b => {
        b.classList.toggle("active", b.id === `type-${this.orderType.toLowerCase().replace(/[^a-z]/g, "")}`);
      });
    }
    if (tableBox) {
      tableBox.style.display = this.orderType === "Dine-in" ? "flex" : "none";
    }

    const tableInput = document.getElementById("pos-table-input");
    if (tableInput) tableInput.value = item.tableNumber || "";

    const custName = document.getElementById("cust-name");
    if (custName) custName.value = item.customerName || "Walk-in Customer";

    const custPhone = document.getElementById("cust-phone");
    if (custPhone) custPhone.value = item.customerPhone || "";

    const noteInput = document.getElementById("order-kitchen-note");
    if (noteInput) {
      noteInput.value = item.notes || "";
      this.updateKitchenNoteChips();
    }

    const discInput = document.getElementById("bill-discount-input");
    if (discInput) discInput.value = item.discount || 0;

    // Remove from held list
    const updated = heldList.filter(h => h.id !== heldId);
    this.saveHeldOrders(updated);

    this.renderCart();
    this.updateHeldOrdersBadge();
    window.customModal.hide();
    window.showToast("Held order restored to active cart!", "success");
  },

  discardHeldOrder(heldId) {
    const heldList = this.getHeldOrders();
    const updated = heldList.filter(h => h.id !== heldId);
    this.saveHeldOrders(updated);
    this.updateHeldOrdersBadge();
    if (updated.length > 0) {
      this.showHeldOrdersModal();
    } else {
      window.customModal.hide();
      window.showToast("All held orders cleared.", "info");
    }
  }
};