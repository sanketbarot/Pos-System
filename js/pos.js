// Crust & Chilly POS - Advanced High-Performance Cashier Billing Terminal
// Features: Shift Live KPIs, Fast Movers Bestseller Bar, Cards & Speed-Tiles View Switcher,
// Custom Open Item (F2), Add-on Upgrades, Live On-Screen UPI QR, Cash Tender Assistant,
// Fullscreen Kiosk Mode (F11), Hotkeys Cheatsheet, Sequential Thermal Printing, WhatsApp Sharing.

function getProductImage(name, categoryId) {
  const n = (name || "").toLowerCase();

  // 1. BURGERS
  if (n.includes("burger")) {
    if (n.includes("schezwan") || n.includes("spicy")) {
      return "https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?w=200&auto=format&fit=crop&q=80";
    }
    if (n.includes("achari")) {
      return "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&auto=format&fit=crop&q=80";
    }
    if (n.includes("pizzeria")) {
      return "https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=200&auto=format&fit=crop&q=80";
    }
    if (n.includes("afghani") || n.includes("indian style")) {
      return "https://images.unsplash.com/photo-1550547660-d9450f859349?w=200&auto=format&fit=crop&q=80";
    }
    if (n.includes("cheese blast") || n.includes("cheese burst") || n.includes("special")) {
      return "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=200&auto=format&fit=crop&q=80";
    }
    return "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&auto=format&fit=crop&q=80";
  }

  // 2. SANDWICHES & SLICES
  if (n.includes("sandwich") || n.includes("slice")) {
    if (n.includes("jam") || n.includes("chocolate")) {
      return "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=200&auto=format&fit=crop&q=80";
    }
    if (n.includes("cheese") || n.includes("chutney")) {
      return "https://images.unsplash.com/photo-1540713786274-575b51d42137?w=200&auto=format&fit=crop&q=80";
    }
    return "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=200&auto=format&fit=crop&q=80";
  }

  // 3. FRANKIE / WRAP
  if (n.includes("frankie") || n.includes("wrap")) {
    return "https://images.unsplash.com/photo-1626700051175-6518c4793f4f?w=200&auto=format&fit=crop&q=80";
  }

  // 4. FRIES
  if (n.includes("fries")) {
    return "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=200&auto=format&fit=crop&q=80";
  }

  // 5. MAGGI / NOODLES
  if (n.includes("maggi") || n.includes("noodle")) {
    return "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200&auto=format&fit=crop&q=80";
  }

  // 6. TIKKA PAV
  if (n.includes("tikka") || n.includes("pav")) {
    return "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=200&auto=format&fit=crop&q=80";
  }

  // 7. MOJITOS & COLD DRINKS
  if (n.includes("mojito")) {
    return "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=200&auto=format&fit=crop&q=80";
  }
  if (n.includes("drink") || categoryId === "cat8") {
    return "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=200&auto=format&fit=crop&q=80";
  }
  if (n.includes("water") || categoryId === "cat10") {
    return "https://images.unsplash.com/photo-1608889174637-3c44f6326f1a?w=200&auto=format&fit=crop&q=80";
  }

  // 8. COMBOS
  if (n.includes("combo")) {
    return "https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=200&auto=format&fit=crop&q=80";
  }

  return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&auto=format&fit=crop&q=80";
}

window.views = window.views || {};
window.views.pos = {
  cart: [],
  selectedCategory: "all",
  searchQuery: "",
  selectedPayment: "UPI",
  orderType: "Dine-in",
  roundOffEnabled: localStorage.getItem("cc_pos_roundoff") === "true",
  activeFilter: "all", // 'all' | 'veg' | 'bogo'
  activeSort: "default", // 'default' | 'fast' | 'price-asc' | 'price-desc' | 'name-asc'
  gridDensity: localStorage.getItem("cc_pos_density") || "compact", // 'compact' | 'dense'

  getTodayStats() {
    const orders = window.db ? (window.db.get("orders") || []) : [];
    const todayStr = new Date().toISOString().substring(0, 10);
    const todayOrders = orders.filter(o => o.createdAt && o.createdAt.substring(0, 10) === todayStr && o.status !== "Cancelled");
    const todayRevenue = todayOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const nextToken = todayOrders.length + 1;
    return { count: todayOrders.length, revenue: todayRevenue, nextToken: nextToken };
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
    this.currentUser = window.db.getCurrentUser() || { name: "Cashier" };

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
              <input type="text" id="pos-search" class="pos-search-input" value="${this.searchQuery}" placeholder="Search menu (e.g. Burger, Frankie, Mojito)..." autocomplete="off">
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
                <span class="pos-table-chip" onclick="views.pos.setQuickTable('T-6')">T6</span>
              </div>
            </div>
          </div>

          <!-- Right side: Shift Stats, Sound, View Mode, Fullscreen -->
          <div class="pos-header-actions-area">
            <!-- Shift Live Stats Pill (Orders & Revenue) -->
            <div class="pos-shift-stats" style="display: inline-flex; align-items: center; gap: 8px; background: #f8fafc; border: 1px solid var(--border-color); padding: 5px 12px; border-radius: 14px; font-size: 11px; font-weight: 700;">
              <span style="color: #2563eb; display: flex; align-items: center; gap: 4px;" title="Orders completed today">
                <i class="fa-solid fa-clipboard-check"></i> <span id="pos-today-orders-count">${stats.count} Bills</span>
              </span>
              <span style="color: #cbd5e1;">|</span>
              <span style="color: #059669; display: flex; align-items: center; gap: 4px;" title="Total register sales today">
                <i class="fa-solid fa-indian-rupee-sign"></i> <span>₹${Math.round(stats.revenue).toLocaleString("en-IN")}</span>
              </span>
              <span style="color: #cbd5e1;">|</span>
              <span style="color: #d97706; display: flex; align-items: center; gap: 4px;" title="Next Order Token">
                <i class="fa-solid fa-ticket"></i> <span>Tk #${tokenDisplay}</span>
              </span>
            </div>

            <!-- Custom Open Item Shortcut -->
            <button class="btn btn-secondary" onclick="views.pos.openCustomItemModal()" title="Add Custom Open Item / Charge (F2)" style="height: 36px; padding: 0 10px; font-size: 11.5px; border-radius: 12px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
              <i class="fa-solid fa-plus-circle" style="color: #059669;"></i> Custom Item
            </button>

            <!-- Fullscreen Toggle Button -->
            <button id="pos-fullscreen-btn" class="btn btn-secondary" onclick="views.pos.toggleFullscreen()" title="Toggle Fullscreen POS Mode (F11)" style="height: 36px; padding: 0 9px; font-size: 12px; border-radius: 12px;">
              <i class="fa-solid fa-expand"></i>
            </button>

            <!-- Sound toggle button -->
            <button id="pos-sound-toggle-pill" class="sound-toggle-pill active" onclick="window.soundAlerts && window.soundAlerts.toggleSound(true)" title="Kitchen Audio Alerts: Active (Click to toggle)" style="display: inline-flex; align-items: center; gap: 6px; padding: 5px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; border: 1px solid #bfdbfe; background: #eff6ff; color: #1e40af; cursor: pointer;">
              <i class="fa-solid fa-volume-high" id="pos-sound-icon" style="font-size: 10px; color: #2563eb;"></i>
            </button>

            <!-- Hotkeys Guide Button -->
            <button class="btn btn-secondary" onclick="views.pos.showHotkeysModal()" title="Keyboard Shortcuts Guide (?)" style="height: 36px; padding: 0 9px; font-size: 12px; border-radius: 12px; font-weight: 800; color: #64748b;">
              <i class="fa-solid fa-circle-question"></i>
            </button>
          </div>
        </div>

        <!-- Main Workspace split pane -->
        <div class="pos-main-content">
          
          <!-- Products Panel (Left) -->
          <div class="pos-products-panel">
            
            <!-- Pinned Bestsellers / Fast Movers Bar -->
            <div class="pos-favs-bar" id="pos-fast-movers-bar">
              <span style="font-size: 11px; font-weight: 800; color: #d97706; display: flex; align-items: center; gap: 4px; padding-left: 4px; white-space: nowrap;">
                <i class="fa-solid fa-fire"></i> Fast Movers:
              </span>
              <button class="pos-fav-chip" onclick="views.pos.addToCart('p1')">🍔 Classic Burger <span class="fav-price">₹49</span></button>
              <button class="pos-fav-chip" onclick="views.pos.addToCart('p2')">🍔 Veg Delight <span class="fav-price">₹59</span></button>
              <button class="pos-fav-chip" onclick="views.pos.addToCart('p26')">🥪 Cheese Chutney <span class="fav-price">₹49</span></button>
              <button class="pos-fav-chip" onclick="views.pos.addToCart('p48')">🌯 Veg Frankie <span class="fav-price">₹129</span></button>
              <button class="pos-fav-chip" onclick="views.pos.addToCart('p68')">🍟 Golden Fries <span class="fav-price">₹79</span></button>
              <button class="pos-fav-chip" onclick="views.pos.addToCart('p71')">🍜 Masala Maggi <span class="fav-price">₹59</span></button>
              <button class="pos-fav-chip" onclick="views.pos.addToCart('p77')">🥤 Mint Mojito <span class="fav-price">₹99</span></button>
            </div>

            <!-- Categories Tabs & Dietary Pills -->
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 2px;">
              <div class="pos-categories-tabs" id="pos-category-list" style="padding-bottom: 0; flex-grow: 1;">
                <!-- Categories injected dynamically -->
              </div>

              <!-- Quick Dietary / BOGO Filter Chips -->
              <div style="display: flex; gap: 5px; flex-shrink: 0;">
                <button type="button" class="btn btn-secondary ${this.activeFilter === 'veg' ? 'btn-primary' : ''}" id="btn-pos-filter-veg" onclick="views.pos.toggleDietFilter('veg')" style="height: 32px; padding: 0 8px; font-size: 11px; font-weight: 800; border-radius: 10px; display: inline-flex; align-items: center; gap: 4px;">
                  <span style="width: 7px; height: 7px; border-radius: 50%; background: #16a34a; display: inline-block;"></span> Veg
                </button>
                <button type="button" class="btn btn-secondary ${this.activeFilter === 'bogo' ? 'btn-primary' : ''}" id="btn-pos-filter-bogo" onclick="views.pos.toggleDietFilter('bogo')" style="height: 32px; padding: 0 8px; font-size: 11px; font-weight: 800; border-radius: 10px; display: inline-flex; align-items: center; gap: 4px;">
                  <i class="fa-solid fa-gift" style="color: #d97706;"></i> BOGO
                </button>
              </div>
            </div>

            <!-- Products Grid Scroll Container -->
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
                  <button type="button" class="btn-held-badge" onclick="views.pos.showHeldOrdersModal()" title="View Parked Orders (F4)">
                    <i class="fa-solid fa-clock-rotate-left"></i> Held (${heldList.length})
                  </button>
                </div>
                <!-- Hold Order trigger -->
                <button type="button" class="btn-hold-cart" onclick="views.pos.holdCurrentCart()" title="Hold / Park Current Cart (F3)">
                  <i class="fa-solid fa-pause"></i> Hold
                </button>
                <!-- Clear Cart trigger -->
                <button class="btn-clear-cart" id="btn-clear-cart-trigger" title="Clear Cart (Alt+C / F1)">
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

                <!-- Optional Round-Off Line -->
                <div class="billing-line" id="bill-roundoff-row" style="display: ${this.roundOffEnabled ? 'flex' : 'none'};">
                  <span style="color: var(--text-muted); font-size: 11.5px;">Round Off</span>
                  <span id="bill-roundoff-val" class="bill-val" style="font-size: 11.5px;">₹0.00</span>
                </div>

                <div class="billing-line total" style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <span style="font-size: 13px; font-weight: 900; letter-spacing: 0.5px;">TOTAL AMOUNT</span>
                    <span style="font-size: 10px; font-weight: 700; color: #2563eb; display: block;">Token #${tokenDisplay}</span>
                  </div>
                  <div style="text-align: right;">
                    <span id="bill-total" class="bill-grand-total">₹0.00</span>
                  </div>
                </div>
              </div>

              <!-- Payment Type Selection Button Options -->
              <div class="pos-payment-grid">
                <button class="payment-btn ${this.selectedPayment === 'UPI' ? 'active' : ''}" id="pay-upi"><i class="fa-solid fa-qrcode"></i>UPI</button>
                <button class="payment-btn ${this.selectedPayment === 'Cash' ? 'active' : ''}" id="pay-cash"><i class="fa-solid fa-money-bill-wave"></i>Cash</button>
                <button class="payment-btn ${this.selectedPayment === 'Card' ? 'active' : ''}" id="pay-card"><i class="fa-solid fa-credit-card"></i>Card</button>
                <button class="payment-btn ${this.selectedPayment === 'Split' ? 'active' : ''}" id="pay-split"><i class="fa-solid fa-shuffle"></i>Split</button>
              </div>

              <!-- Live On-Screen UPI QR Code preview box (Shown when UPI is active) -->
              <div id="pos-onscreen-upi-box" class="pos-screen-upi-box" style="display: ${this.selectedPayment === 'UPI' ? 'flex' : 'none'};">
                <div style="flex-grow: 1;">
                  <div style="font-size: 11.5px; font-weight: 800; color: #1e40af; display: flex; align-items: center; gap: 5px;">
                    <i class="fa-solid fa-qrcode"></i> Instant Customer Scan & Pay
                  </div>
                  <div style="font-size: 10.5px; color: #64748b; margin-top: 2px;">
                    Amount: <strong id="pos-upi-screen-amt" style="color: #2563eb;">₹0.00</strong> • Scan via GPay/PhonePe
                  </div>
                </div>
                <div class="pos-screen-upi-qr" id="pos-onscreen-qr-container">
                  <i class="fa-solid fa-qrcode" style="font-size: 24px; color: #94a3b8;"></i>
                </div>
              </div>

              <!-- Cash Tender Assistant (shown when Cash is active) -->
              <div id="cash-tender-drawer" class="cash-tender-box" style="display: ${this.selectedPayment === 'Cash' ? 'block' : 'none'};">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <span style="font-size: 10.5px; font-weight: 700; color: var(--text-muted);">Quick Cash Tender:</span>
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
                    <input type="number" id="cash-received-input" placeholder="Received" style="width: 80px; border: 1.5px solid var(--border-color); border-radius: 6px; padding: 3px 6px; font-size: 12px; font-weight: 800; outline: none; background: #fff;" oninput="views.pos.calcChangeReturn()">
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
          <div style="display: flex; gap: 14px; align-items: center;">
            <span><span style="color: #2563eb; font-weight:800; margin-right:4px;">Ctrl+K</span> Search</span>
            <span><span style="color: #2563eb; font-weight:800; margin-right:4px;">F1</span> New Bill</span>
            <span><span style="color: #059669; font-weight:800; margin-right:4px;">F2</span> Custom Item</span>
            <span><span style="color: #d97706; font-weight:800; margin-right:4px;">F3</span> Hold Cart</span>
            <span><span style="color: #d97706; font-weight:800; margin-right:4px;">F4</span> Held Orders</span>
            <span><span style="color: #2563eb; font-weight:800; margin-right:4px;">F8 / Ctrl+B</span> Print Bill</span>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <label style="display: flex; align-items: center; gap: 5px; cursor: pointer; font-size: 11px; font-weight: 700; color: var(--text-dark);" title="Automatically rounds grand total to the nearest whole rupee">
              <input type="checkbox" id="pos-roundoff-chk" ${this.roundOffEnabled ? 'checked' : ''} onchange="views.pos.toggleRoundOff(this.checked)">
              Round-off (₹)
            </label>
            <span style="color: #cbd5e1;">|</span>
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

  toggleViewMode() {
    this.tileViewMode = this.tileViewMode === "cards" ? "tiles" : "cards";
    localStorage.setItem("cc_pos_view_mode", this.tileViewMode);
    
    const btn = document.getElementById("pos-view-mode-toggle");
    if (btn) {
      btn.innerHTML = `<i class="fa-solid ${this.tileViewMode === 'tiles' ? 'fa-image' : 'fa-table-cells-large'}" style="color: #2563eb;"></i> <span>${this.tileViewMode === 'tiles' ? 'Photo Cards' : 'Speed Tiles'}</span>`;
    }

    const grid = document.getElementById("pos-grid");
    if (grid) {
      grid.classList.toggle("speed-tiles-mode", this.tileViewMode === "tiles");
    }
    this.renderProducts();
  },

  toggleDietFilter(type) {
    if (this.activeFilter === type) {
      this.activeFilter = "all";
    } else {
      this.activeFilter = type;
    }

    const btnVeg = document.getElementById("btn-pos-filter-veg");
    const btnBogo = document.getElementById("btn-pos-filter-bogo");
    if (btnVeg) btnVeg.className = `btn ${this.activeFilter === 'veg' ? 'btn-primary' : 'btn-secondary'}`;
    if (btnBogo) btnBogo.className = `btn ${this.activeFilter === 'bogo' ? 'btn-primary' : 'btn-secondary'}`;

    this.renderProducts();
  },

  toggleRoundOff(checked) {
    this.roundOffEnabled = checked;
    localStorage.setItem("cc_pos_roundoff", checked);
    const roundoffRow = document.getElementById("bill-roundoff-row");
    if (roundoffRow) roundoffRow.style.display = checked ? "flex" : "none";
    this.calculateBillTotals();
  },

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      window.showToast("POS Fullscreen Mode Enabled", "info");
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        window.showToast("Exited Fullscreen", "info");
      }
    }
  },

  renderCategories() {
    const cats = window.db.get("categories") || [];
    const container = document.getElementById("pos-category-list");
    if (!container) return;

    let html = `<div class="category-tab ${this.selectedCategory === 'all' ? 'active' : ''}" data-id="all"><i class="fa-solid fa-border-all"></i> All Items</div>`;

    cats.forEach(c => {
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
        <div class="category-tab ${this.selectedCategory === c.id ? 'active' : ''}" data-id="${c.id}">
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

  setSort(sortType) {
    this.activeSort = sortType;
    document.querySelectorAll(".pos-sort-chip").forEach(btn => {
      if (btn.getAttribute("data-sort") === sortType) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
    this.renderProducts();
  },

  toggleGridDensity() {
    this.gridDensity = this.gridDensity === "dense" ? "compact" : "dense";
    try {
      localStorage.setItem("cc_pos_density", this.gridDensity);
    } catch (e) {}

    const grid = document.getElementById("pos-grid");
    if (grid) {
      if (this.gridDensity === "dense") {
        grid.classList.add("dense-mode");
      } else {
        grid.classList.remove("dense-mode");
      }
    }

    const btn = document.getElementById("btn-pos-density-toggle");
    if (btn) {
      btn.className = `pos-density-toggle-btn ${this.gridDensity === 'dense' ? 'active' : ''}`;
      btn.innerHTML = `<i class="fa-solid ${this.gridDensity === 'dense' ? 'fa-table-cells' : 'fa-grip'}"></i> <span>${this.gridDensity === 'dense' ? 'Dense Grid' : 'Comfortable'}</span>`;
    }
  },

  getCategoryMeta(catId, prodName) {
    const name = (prodName || "").toLowerCase();
    
    // 1. BURGERS
    if (catId === "cat1" || name.includes("burger")) {
      return {
        id: "cat1",
        emoji: "🍔",
        icon: "fa-burger",
        shortName: "Burger",
        color: "#d97706",
        bgColor: "#fffbeb",
        borderColor: "#fde68a",
        accent: "#f59e0b"
      };
    }
    // 2. SLICE SANDWICH
    if (catId === "cat2" || name.includes("slice")) {
      return {
        id: "cat2",
        emoji: "🥪",
        icon: "fa-bread-slice",
        shortName: "Slice",
        color: "#059669",
        bgColor: "#f0fdf4",
        borderColor: "#bbf7d0",
        accent: "#10b981"
      };
    }
    // 3. 3-LAYER SANDWICH
    if (catId === "cat3" || name.includes("sandwich")) {
      return {
        id: "cat3",
        emoji: "🥪",
        icon: "fa-layer-group",
        shortName: "3-Layer",
        color: "#0f766e",
        bgColor: "#f0fdfa",
        borderColor: "#99f6e4",
        accent: "#14b8a6"
      };
    }
    // 4. FRANKIE / WRAP
    if (catId === "cat4" || name.includes("frankie") || name.includes("wrap")) {
      return {
        id: "cat4",
        emoji: "🌯",
        icon: "fa-scroll",
        shortName: "Frankie",
        color: "#7c3aed",
        bgColor: "#f5f3ff",
        borderColor: "#ddd6fe",
        accent: "#8b5cf6"
      };
    }
    // 5. TIKKA PAV
    if (catId === "cat5" || name.includes("tikka") || name.includes("pav")) {
      return {
        id: "cat5",
        emoji: "🥖",
        icon: "fa-hotdog",
        shortName: "Tikka Pav",
        color: "#e11d48",
        bgColor: "#fff1f2",
        borderColor: "#fecdd3",
        accent: "#f43f5e"
      };
    }
    // 6. FRIES
    if (catId === "cat6" || name.includes("fries")) {
      return {
        id: "cat6",
        emoji: "🍟",
        icon: "fa-bowl-food",
        shortName: "Fries",
        color: "#ca8a04",
        bgColor: "#fefce8",
        borderColor: "#fef08a",
        accent: "#eab308"
      };
    }
    // 7. MAGGI / NOODLES
    if (catId === "cat7" || name.includes("maggi") || name.includes("noodle")) {
      return {
        id: "cat7",
        emoji: "🍜",
        icon: "fa-bowl-rice",
        shortName: "Maggi",
        color: "#ea580c",
        bgColor: "#fff7ed",
        borderColor: "#fed7aa",
        accent: "#f97316"
      };
    }
    // 8. MOJITOS
    if (catId === "cat8" || name.includes("mojito")) {
      return {
        id: "cat8",
        emoji: "🥤",
        icon: "fa-glass-water",
        shortName: "Mojito",
        color: "#0284c7",
        bgColor: "#f0f9ff",
        borderColor: "#bae6fd",
        accent: "#0ea5e9"
      };
    }
    // 9. COMBO MEALS
    if (catId === "cat9" || name.includes("combo")) {
      return {
        id: "cat9",
        emoji: "🎁",
        icon: "fa-utensils",
        shortName: "Combo Meal",
        color: "#4f46e5",
        bgColor: "#eef2ff",
        borderColor: "#c7d2fe",
        accent: "#6366f1"
      };
    }
    // 10. COLD DRINKS & WATER
    if (catId === "cat10" || name.includes("drink") || name.includes("water") || name.includes("bottle")) {
      return {
        id: "cat10",
        emoji: "🥤",
        icon: "fa-bottle-water",
        shortName: "Drinks",
        color: "#2563eb",
        bgColor: "#eff6ff",
        borderColor: "#bfdbfe",
        accent: "#3b82f6"
      };
    }

    return {
      id: catId || "other",
      emoji: "🍽️",
      icon: "fa-utensils",
      shortName: "Item",
      color: "#475569",
      bgColor: "#f8fafc",
      borderColor: "#e2e8f0",
      accent: "#64748b"
    };
  },

  getItemTierBadge(name) {
    const n = (name || "").toLowerCase();
    if (n.includes("cheese blast") || n.includes("cheese burst")) {
      return `<span class="pos-item-tier-badge tier-cheese"><i class="fa-solid fa-cheese"></i> Cheese Blast</span>`;
    }
    if (n.includes("signature")) {
      return `<span class="pos-item-tier-badge tier-signature"><i class="fa-solid fa-star"></i> Signature</span>`;
    }
    if (n.includes("premium")) {
      return `<span class="pos-item-tier-badge tier-premium"><i class="fa-solid fa-crown"></i> Premium</span>`;
    }
    if (n.includes("special")) {
      return `<span class="pos-item-tier-badge tier-special"><i class="fa-solid fa-fire"></i> Special</span>`;
    }
    if (n.includes("combo")) {
      return `<span class="pos-item-tier-badge tier-combo"><i class="fa-solid fa-gift"></i> Combo Meal</span>`;
    }
    return "";
  },

  getItemShortCode(id) {
    if (!id) return "";
    const num = id.replace(/[^0-9]/g, "");
    return num ? `#${num.padStart(2, '0')}` : id.toUpperCase();
  },

  renderProducts() {
    const products = window.db.get("products") || [];
    const grid = document.getElementById("pos-grid");
    if (!grid) return;

    // Filter logic
    let filtered = products.filter(p => p.available !== false);

    if (this.selectedCategory !== "all") {
      filtered = filtered.filter(p => p.category === this.selectedCategory);
    }

    if (this.activeFilter === "veg") {
      filtered = filtered.filter(p => p.veg !== false);
    } else if (this.activeFilter === "bogo") {
      filtered = filtered.filter(p => p.bogo === true);
    }

    if (this.searchQuery.trim() !== "") {
      const q = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p => (p.name || "").toLowerCase().includes(q) || (p.id || "").toLowerCase().includes(q));
    }

    // Apply Sorting
    if (this.activeSort === "price-asc") {
      filtered.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (this.activeSort === "price-desc") {
      filtered.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    } else if (this.activeSort === "name-asc") {
      filtered.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (this.activeSort === "fast") {
      const fastMoversIds = ["p1", "p2", "p26", "p48", "p68", "p71", "p77", "p81", "p82"];
      filtered.sort((a, b) => {
        const aIndex = fastMoversIds.indexOf(a.id);
        const bIndex = fastMoversIds.indexOf(b.id);
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return 0;
      });
    }

    // Update toolbar counter text
    const countText = document.getElementById("pos-items-count-text");
    if (countText) {
      countText.textContent = `${filtered.length} Items Available`;
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 60px;">
          <i class="fa-solid fa-magnifying-glass" style="font-size: 32px; margin-bottom: 12px; display: block; opacity: 0.3;"></i>
          No products matched search or category filter.
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map((p) => {
      const isVeg = p.veg !== false;

      // Check current cart quantity of this item
      const cartItem = this.cart.find(item => item.productId === p.id);
      const cartQty = cartItem ? cartItem.quantity : 0;

      let actionButtonHtml = "";
      if (cartQty === 0) {
        actionButtonHtml = `
          <button class="pos-card-add-btn" onclick="event.stopPropagation(); views.pos.addToCart('${p.id}')">
            Add <i class="fa-solid fa-plus" style="font-size: 10px; margin-left: 2px;"></i>
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

      const selectedClass = cartQty > 0 ? "selected" : "";

      return `
        <div class="product-card ${selectedClass}" 
             data-id="${p.id}" 
             onclick="views.pos.addToCart('${p.id}')">
          
          <!-- Top Row: Veg indicator on left, BOGO badge on right (if applicable) -->
          <div class="card-top-row">
            <span class="pos-veg-dot-box ${isVeg ? 'veg' : 'nonveg'}" title="${isVeg ? 'Pure Veg' : 'Non-Veg'}">
              <span class="pos-veg-inner-dot"></span>
            </span>
            ${p.bogo ? `<span class="product-bogo-badge">BOGO</span>` : ""}
          </div>

          <!-- Middle: Crisp High-Contrast Product Name -->
          <div class="card-title-wrap">
            <h4 class="product-name" title="${p.name}">
              ${p.name}
            </h4>
          </div>

          <!-- Bottom Row: Warm Price Pill on left, Add Button on right -->
          <div class="card-bottom-row" onclick="event.stopPropagation();">
            <span class="product-price">₹${p.price}</span>
            <div class="pos-card-action-wrap">
              ${actionButtonHtml}
            </div>
          </div>
        </div>
      `;
    }).join("");

    // Bind card clicks
    grid.querySelectorAll(".product-card").forEach(card => {
      card.onclick = () => {
        const prodId = card.getAttribute("data-id");
        this.addToCart(prodId);
      };
    });
  },

  findCartItem(id) {
    if (!id) return null;
    return this.cart.find(i => (i.cartItemId && i.cartItemId === id) || i.productId === id);
  },

  isComboProduct(p) {
    if (!p) return false;
    if (p.category === "cat9") return true;
    const name = (p.name || "").toLowerCase();
    if (name.includes("combo")) return true;
    if (name.includes("+") && (name.includes("fries") || name.includes("drink") || name.includes("mojito"))) return true;
    return false;
  },

  getComboConfig(product) {
    const name = (product.name || "").toLowerCase();

    // Standard cold drinks & mojitos
    const coldDrinks = ["Thums Up", "Coca-Cola", "Sprite", "Fanta", "7Up"];
    const mojitos = [
      { name: "Mint Mojito", icon: "🌱", badge: "Mint Fresh" },
      { name: "Blue Lagoon Mojito", icon: "🌊", badge: "Blue Curacao" },
      { name: "Blue Berry Mojito", icon: "🫐", badge: "Berry Blast" },
      { name: "Green Apple Mojito", icon: "🍏", badge: "Tangy Apple" },
      { name: "Virgin Lime Mojito", icon: "🍋", badge: "Classic Lime" }
    ];

    // 1. SIGNATURE BURGER COMBO (e.g. "Signature Burger + Fries + Cold Drink")
    if (name.includes("signature") && name.includes("burger")) {
      const sigBurgers = [
        "Makhani Burger",
        "Peri Peri Burger",
        "Tandoori Burger",
        "Spicy Schezwan Burger",
        "Cheezy Jalapeno Burger",
        "Pizzeria Burger",
        "Indian Style Burger",
        "Afghani Burger",
        "Hot & Spicy Chilly Garlic Burger",
        "Crust & Chilly Special Burger"
      ];
      return {
        type: "sig_burger_combo",
        title: "Signature Burger Combo",
        subtitle: "Select 1 Signature Burger & 1 Chilled Beverage",
        slots: [
          {
            id: "mainItem",
            label: "1. Select Signature Burger",
            icon: "fa-burger",
            default: sigBurgers[0],
            options: sigBurgers.map(b => ({ name: b, icon: "🍔", badge: "Signature" }))
          },
          {
            id: "beverage",
            label: "2. Select Cold Drink",
            icon: "fa-bottle-water",
            default: coldDrinks[0],
            options: coldDrinks.map(d => ({ name: d, icon: "🥤", badge: "Cold Drink" }))
          }
        ]
      };
    }

    // 2. PREMIUM BURGER COMBO (e.g. "Premium Burger + Fries + Mojito")
    if (name.includes("premium") && name.includes("burger")) {
      const premBurgers = [
        "Cheese Blast Aloo Tikki",
        "Cheese Blast Peri Peri",
        "Cheese Blast Tandoori",
        "Cheese Blast Cheezy Jalapeno",
        "Cheese Blast Spicy Schezwan",
        "Cheese Blast Hot & Spicy Chilly Garlic",
        "Cheese Blast Crust & Chilly Special"
      ];
      return {
        type: "prem_burger_combo",
        title: "Premium Burger Combo",
        subtitle: "Select 1 Premium Cheese Blast Burger & 1 Handcrafted Mojito",
        slots: [
          {
            id: "mainItem",
            label: "1. Select Premium Burger",
            icon: "fa-burger",
            default: premBurgers[0],
            options: premBurgers.map(b => ({ name: b, icon: "🧀", badge: "Premium" }))
          },
          {
            id: "beverage",
            label: "2. Select Mojito",
            icon: "fa-martini-glass-citrus",
            default: mojitos[0].name,
            options: mojitos.map(m => ({ name: m.name, icon: m.icon, badge: m.badge }))
          }
        ]
      };
    }

    // 3. SIGNATURE SANDWICH COMBO (e.g. "Signature Sandwich + Fries + Cold Drink")
    if (name.includes("signature") && name.includes("sandwich")) {
      const sigSandwiches = [
        "Junglee Sandwich",
        "Pizzeria Sandwich",
        "1000 Island Sandwich",
        "Peri Peri Sandwich",
        "Tandoori Sandwich",
        "Spicy Schezwan Sandwich",
        "Afghani Sandwich",
        "Cheezy Jalapeno Sandwich",
        "Makhani Sandwich",
        "Hot & Spicy Chilly Garlic Sandwich"
      ];
      return {
        type: "sig_sandwich_combo",
        title: "Signature Sandwich Combo",
        subtitle: "Select 1 Signature 3-Layer Sandwich & 1 Chilled Beverage",
        slots: [
          {
            id: "mainItem",
            label: "1. Select Signature Sandwich",
            icon: "fa-bread-slice",
            default: sigSandwiches[0],
            options: sigSandwiches.map(s => ({ name: s, icon: "🥪", badge: "Signature" }))
          },
          {
            id: "beverage",
            label: "2. Select Cold Drink",
            icon: "fa-bottle-water",
            default: coldDrinks[0],
            options: coldDrinks.map(d => ({ name: d, icon: "🥤", badge: "Cold Drink" }))
          }
        ]
      };
    }

    // 4. PREMIUM SANDWICH COMBO (e.g. "Premium Sandwich + Fries + Mojito")
    if (name.includes("premium") && name.includes("sandwich")) {
      const premSandwiches = [
        "Tandoori Paneer Sandwich",
        "Peri Peri Paneer Sandwich",
        "Indian Style Paneer Sandwich",
        "Afghani Garlic Paneer Sandwich",
        "Spicy Schezwan Paneer Sandwich",
        "Crust & Chilly Premium Sandwich"
      ];
      return {
        type: "prem_sandwich_combo",
        title: "Premium Sandwich Combo",
        subtitle: "Select 1 Premium Paneer Sandwich & 1 Handcrafted Mojito",
        slots: [
          {
            id: "mainItem",
            label: "1. Select Premium Sandwich",
            icon: "fa-bread-slice",
            default: premSandwiches[0],
            options: premSandwiches.map(s => ({ name: s, icon: "🥪", badge: "Premium" }))
          },
          {
            id: "beverage",
            label: "2. Select Mojito",
            icon: "fa-martini-glass-citrus",
            default: mojitos[0].name,
            options: mojitos.map(m => ({ name: m.name, icon: m.icon, badge: m.badge }))
          }
        ]
      };
    }

    // 5. SIGNATURE TIKKA PAV COMBO (e.g. "Signature Tikka Pav + Fries + Cold Drink")
    if (name.includes("signature") && (name.includes("tikka") || name.includes("pav"))) {
      const sigTikka = [
        "Pizzeria Tikka Pav",
        "1000 Island Tikka Pav",
        "Cheezy Jalapeno Tikka Pav",
        "Spicy Schezwan Tikka Pav",
        "Indian Style Tikka Pav"
      ];
      return {
        type: "sig_tikka_combo",
        title: "Signature Tikka Pav Combo",
        subtitle: "Select 1 Signature Tikka Pav & 1 Cold Drink",
        slots: [
          {
            id: "mainItem",
            label: "1. Select Signature Tikka Pav",
            icon: "fa-hotdog",
            default: sigTikka[0],
            options: sigTikka.map(t => ({ name: t, icon: "🥖", badge: "Signature" }))
          },
          {
            id: "beverage",
            label: "2. Select Cold Drink",
            icon: "fa-bottle-water",
            default: coldDrinks[0],
            options: coldDrinks.map(d => ({ name: d, icon: "🥤", badge: "Cold Drink" }))
          }
        ]
      };
    }

    // 6. PREMIUM TIKKA PAV COMBO (e.g. "Premium Tikka Pav + Fries + Mojito")
    if (name.includes("premium") && (name.includes("tikka") || name.includes("pav"))) {
      const premTikka = [
        "Tandoori Tikka Pav",
        "Peri Peri Tikka Pav",
        "Hot & Spicy Chilly Garlic Tikka Pav",
        "Afghani Garlic Tikka Pav",
        "Crust & Chilly Special Tikka Pav"
      ];
      return {
        type: "prem_tikka_combo",
        title: "Premium Tikka Pav Combo",
        subtitle: "Select 1 Premium Tikka Pav & 1 Handcrafted Mojito",
        slots: [
          {
            id: "mainItem",
            label: "1. Select Premium Tikka Pav",
            icon: "fa-hotdog",
            default: premTikka[0],
            options: premTikka.map(t => ({ name: t, icon: "🥖", badge: "Premium" }))
          },
          {
            id: "beverage",
            label: "2. Select Mojito",
            icon: "fa-martini-glass-citrus",
            default: mojitos[0].name,
            options: mojitos.map(m => ({ name: m.name, icon: m.icon, badge: m.badge }))
          }
        ]
      };
    }

    // Default Fallback
    return {
      type: "generic_combo",
      title: product.name,
      subtitle: "Select your combo preferences",
      slots: [
        {
          id: "mainItem",
          label: "1. Select Main Item",
          icon: "fa-utensils",
          default: "Classic Burger",
          options: [
            { name: "Classic Burger", icon: "🍔", badge: "Burger" },
            { name: "Veg Sandwich", icon: "🥪", badge: "Sandwich" },
            { name: "Veg Tikka Pav", icon: "🥖", badge: "Tikka Pav" }
          ]
        },
        {
          id: "beverage",
          label: name.includes("mojito") ? "2. Select Mojito" : "2. Select Cold Drink",
          icon: name.includes("mojito") ? "fa-martini-glass-citrus" : "fa-bottle-water",
          default: name.includes("mojito") ? mojitos[0].name : coldDrinks[0],
          options: name.includes("mojito") ? mojitos.map(m => ({ name: m.name, icon: m.icon, badge: m.badge })) : coldDrinks.map(d => ({ name: d, icon: "🥤", badge: "Cold Drink" }))
        }
      ]
    };
  },

  openComboSelectionModal(product, existingCartItem = null) {
    const config = this.getComboConfig(product);
    const basePrice = Number(product.price) || 0;

    let selectedMain = config.slots[0].default;
    let selectedBeverage = config.slots[1].default;
    let selectedAddons = [];

    if (existingCartItem && existingCartItem.comboChoices) {
      selectedMain = existingCartItem.comboChoices.mainItem || selectedMain;
      selectedBeverage = existingCartItem.comboChoices.beverage || selectedBeverage;
      selectedAddons = existingCartItem.addons || [];
    }

    const availableAddons = [
      { id: "add_cheese", name: "Extra Cheese Slice", price: 20 },
      { id: "add_spicy", name: "Extra Spicy Sauce", price: 10 },
      { id: "add_patty", name: "Extra Veg Patty", price: 30 },
      { id: "add_jain", name: "Jain Preparation (No Onion/Garlic)", price: 0 },
      { id: "add_parcel", name: "Special Parcel Box", price: 10 }
    ];

    const slot1 = config.slots[0];
    const slot2 = config.slots[1];

    const bodyHtml = `
      <div class="combo-builder-container">
        
        <!-- Step 1: Main Item -->
        <div class="combo-step-block">
          <div class="combo-step-header">
            <span class="combo-step-title"><i class="fa-solid ${slot1.icon}" style="color: #2563eb;"></i> ${slot1.label}</span>
            <span class="combo-step-badge">1 Required</span>
          </div>
          <div class="combo-cards-grid" id="combo-slot1-grid">
            ${slot1.options.map(opt => {
              const isSel = opt.name === selectedMain;
              return `
                <div class="combo-choice-card ${isSel ? 'selected' : ''}" data-slot="mainItem" data-name="${opt.name}">
                  <div class="combo-card-radio"></div>
                  <span class="combo-choice-icon">${opt.icon}</span>
                  <span class="combo-choice-name">${opt.name}</span>
                </div>
              `;
            }).join("")}
          </div>
        </div>

        <!-- Step 2: Beverage (Cold Drink or Mojito) -->
        <div class="combo-step-block">
          <div class="combo-step-header">
            <span class="combo-step-title"><i class="fa-solid ${slot2.icon}" style="color: #059669;"></i> ${slot2.label}</span>
            <span class="combo-step-badge">1 Required</span>
          </div>
          <div class="combo-cards-grid" id="combo-slot2-grid">
            ${slot2.options.map(opt => {
              const isSel = opt.name === selectedBeverage;
              return `
                <div class="combo-choice-card ${isSel ? 'selected' : ''}" data-slot="beverage" data-name="${opt.name}">
                  <div class="combo-card-radio"></div>
                  <span class="combo-choice-icon">${opt.icon}</span>
                  <span class="combo-choice-name">${opt.name}</span>
                </div>
              `;
            }).join("")}
          </div>
        </div>

        <!-- Step 3: Included Side (French Fries) -->
        <div class="combo-step-block">
          <div class="combo-step-header" style="margin-bottom: 6px;">
            <span class="combo-step-title"><i class="fa-solid fa-bowl-food" style="color: #d97706;"></i> 3. Included Meal Side</span>
            <span class="combo-step-badge" style="background: #dcfce7; color: #15803d; border-color: #bbf7d0;">Included Free</span>
          </div>
          <div class="combo-fixed-side-card">
            <span><i class="fa-solid fa-check-circle" style="color: #16a34a; margin-right: 6px;"></i> <strong>French Fries</strong> (Crispy Golden & Salted)</span>
            <span>₹0 (Included)</span>
          </div>
        </div>

        <!-- Step 4: Optional Addons & Prep -->
        <div class="combo-step-block">
          <div class="combo-step-header" style="margin-bottom: 6px;">
            <span class="combo-step-title"><i class="fa-solid fa-plus-circle" style="color: #7c3aed;"></i> 4. Toppings & Prep Upgrades (Optional)</span>
            <span class="combo-step-badge" style="background: #f1f5f9; color: #64748b; border-color: #e2e8f0;">Optional</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            ${availableAddons.map(add => {
              const isChecked = selectedAddons.some(a => a.id === add.id);
              return `
                <label style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 1px solid var(--border-color); padding: 7px 12px; border-radius: 10px; cursor: pointer; font-size: 12px;">
                  <span style="display: flex; align-items: center; gap: 8px; font-weight: 700; color: var(--text-dark);">
                    <input type="checkbox" class="combo-addon-chk" data-id="${add.id}" data-name="${add.name}" data-price="${add.price}" ${isChecked ? 'checked' : ''}>
                    ${add.name}
                  </span>
                  <span style="font-weight: 800; color: #2563eb;">${add.price > 0 ? `+₹${add.price}` : 'Free'}</span>
                </label>
              `;
            }).join("")}
          </div>
        </div>

        <!-- Step 5: Live Summary & Price Box -->
        <div class="combo-summary-banner">
          <div class="combo-summary-details">
            <span class="combo-summary-label">Selected Combo</span>
            <span class="combo-summary-items" id="combo-live-summary-items">
              ${selectedMain} + ${selectedBeverage} + Fries
            </span>
          </div>
          <div class="combo-summary-price" id="combo-live-price">
            ₹${basePrice + selectedAddons.reduce((s, a) => s + (Number(a.price) || 0), 0)}
          </div>
        </div>

      </div>
    `;

    window.customModal.show({
      title: existingCartItem ? `Customize Combo - ${product.name}` : `Select Combo Choices - ${product.name}`,
      bodyHtml: bodyHtml,
      confirmText: existingCartItem ? '<i class="fa-solid fa-check"></i> Update Combo' : '<i class="fa-solid fa-cart-plus"></i> Add Combo to Cart',
      onConfirm: () => {
        const activeMainCard = document.querySelector('.combo-choice-card.selected[data-slot="mainItem"]');
        const activeBevCard = document.querySelector('.combo-choice-card.selected[data-slot="beverage"]');

        const mainName = activeMainCard ? activeMainCard.getAttribute("data-name") : slot1.default;
        const bevName = activeBevCard ? activeBevCard.getAttribute("data-name") : slot2.default;

        const finalAddons = [];
        document.querySelectorAll(".combo-addon-chk:checked").forEach(chk => {
          finalAddons.push({
            id: chk.getAttribute("data-id"),
            name: chk.getAttribute("data-name"),
            price: Number(chk.getAttribute("data-price")) || 0
          });
        });

        if (existingCartItem) {
          existingCartItem.comboChoices = {
            mainItem: mainName,
            beverage: bevName,
            side: "French Fries"
          };
          existingCartItem.addons = finalAddons;
          this.renderCart();
          window.showToast(`Updated combo: ${mainName} + ${bevName}`, "success");
        } else {
          this.cart.push({
            cartItemId: "combo_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
            productId: product.id,
            name: product.name,
            price: basePrice,
            quantity: 1,
            bogo: false,
            category: product.category,
            comboChoices: {
              mainItem: mainName,
              beverage: bevName,
              side: "French Fries"
            },
            addons: finalAddons,
            note: ""
          });
          this.renderCart();
          window.showToast(`Added Combo: ${mainName} + ${bevName}!`, "success");
        }
        return true;
      }
    });

    // Wire live selection interaction
    setTimeout(() => {
      const modalEl = document.getElementById("modal-body");
      if (!modalEl) return;

      const updateSummary = () => {
        const activeMain = modalEl.querySelector('.combo-choice-card.selected[data-slot="mainItem"]');
        const activeBev = modalEl.querySelector('.combo-choice-card.selected[data-slot="beverage"]');
        const mName = activeMain ? activeMain.getAttribute("data-name") : slot1.default;
        const bName = activeBev ? activeBev.getAttribute("data-name") : slot2.default;

        let extraCost = 0;
        modalEl.querySelectorAll(".combo-addon-chk:checked").forEach(chk => {
          extraCost += Number(chk.getAttribute("data-price")) || 0;
        });

        const summaryText = modalEl.querySelector("#combo-live-summary-items");
        if (summaryText) {
          summaryText.textContent = `${mName} + ${bName} + Fries`;
        }
        const summaryPrice = modalEl.querySelector("#combo-live-price");
        if (summaryPrice) {
          summaryPrice.textContent = `₹${basePrice + extraCost}`;
        }
      };

      modalEl.querySelectorAll(".combo-choice-card").forEach(card => {
        card.onclick = () => {
          const slot = card.getAttribute("data-slot");
          modalEl.querySelectorAll(`.combo-choice-card[data-slot="${slot}"]`).forEach(c => c.classList.remove("selected"));
          card.classList.add("selected");
          updateSummary();
        };
      });

      modalEl.querySelectorAll(".combo-addon-chk").forEach(chk => {
        chk.onchange = updateSummary;
      });
    }, 50);
  },

  addToCart(productId, customOptions = null) {
    const products = window.db.get("products") || [];
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // If this product is a Combo Meal and not passing explicit options, prompt combo builder!
    if (this.isComboProduct(product) && !customOptions) {
      this.openComboSelectionModal(product);
      return;
    }

    // Regular item (or non-combo)
    const existing = this.cart.find(item => item.productId === productId && !item.comboChoices);
    const targetQty = existing ? existing.quantity + 1 : 1;

    if (existing) {
      existing.quantity = targetQty;
    } else {
      this.cart.push({
        cartItemId: "item_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
        productId: product.id,
        name: product.name,
        price: Number(product.price) || 0,
        quantity: 1,
        bogo: product.bogo === true,
        category: product.category,
        addons: [],
        note: ""
      });
    }

    this.renderCart();
  },

  modifyQty(id, delta) {
    const item = this.findCartItem(id);
    if (!item) return;

    const targetQty = item.quantity + delta;

    if (targetQty <= 0) {
      this.cart = this.cart.filter(i => (i.cartItemId ? i.cartItemId !== id : i.productId !== id));
      window.showToast(`Removed ${item.name} from cart`, "info");
    } else {
      item.quantity = targetQty;
    }

    this.renderCart();
  },

  setQty(id, qty) {
    const item = this.findCartItem(id);
    if (!item) return;

    if (isNaN(qty) || qty <= 0) {
      this.removeFromCart(id);
      return;
    }

    item.quantity = qty;
    this.renderCart();
  },

  removeFromCart(id) {
    const item = this.findCartItem(id);
    if (item) {
      this.cart = this.cart.filter(i => (i.cartItemId ? i.cartItemId !== id : i.productId !== id));
      window.showToast(`Removed ${item.name} from cart`, "info");
      this.renderCart();
    }
  },

  renderCart() {
    const list = document.getElementById("cart-items-list");
    const badge = document.getElementById("cart-qty-badge");
    if (!list) return;

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
      const itemId = item.cartItemId || item.productId;
      let bogoTag = "";
      if (item.bogo) {
        bogoTag = `<span style="font-size: 9px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color:#fff; padding:1px 6px; border-radius:4px; font-weight: 800; margin-left: 4px; vertical-align: middle;">BOGO</span>`;
      }

      // Addons total
      const addonsCost = (item.addons || []).reduce((sum, a) => sum + (Number(a.price) || 0), 0);
      const unitPriceWithAddons = item.price + addonsCost;
      const lineTotal = unitPriceWithAddons * item.quantity;

      const addonsHtml = (item.addons && item.addons.length > 0) ? `
        <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-top: 2px;">
          ${item.addons.map(a => `<span class="pos-addon-tag">+ ${a.name} ${a.price > 0 ? `(₹${a.price})` : ''}</span>`).join("")}
        </div>
      ` : "";

      // Combo choices pills (if combo meal)
      const comboPillsHtml = item.comboChoices ? `
        <div class="pos-combo-pill-box">
          <span class="pos-combo-choice-tag" title="Selected Main Item"><i class="fa-solid fa-utensils" style="color: #2563eb;"></i> ${item.comboChoices.mainItem}</span>
          <span class="pos-combo-choice-tag" title="Selected Beverage"><i class="fa-solid fa-glass-water" style="color: #059669;"></i> ${item.comboChoices.beverage}</span>
          <span class="pos-combo-choice-tag" title="Included Side"><i class="fa-solid fa-bowl-food" style="color: #d97706;"></i> ${item.comboChoices.side || 'Fries'}</span>
        </div>
      ` : "";

      return `
        <div class="cart-item-row" style="background: var(--bg-darkest); border: 1px solid rgba(255, 255, 255, 0.9); border-radius: 16px; padding: 10px 12px; margin-bottom: 8px; display: flex; flex-direction: column; gap: 6px; box-sizing: border-box; width: 100%; box-shadow: 4px 4px 10px #cad5e2, -4px -4px 10px #ffffff;">
          
          <!-- Top Row: Veg Icon + Full Item Name + Remove Button -->
          <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;">
            <div style="display: flex; align-items: flex-start; gap: 6px; flex-grow: 1; min-width: 0;">
              <!-- Veg Dot -->
              <span style="display: inline-flex; align-items: center; justify-content: center; width: 13px; height: 13px; border: 1.2px solid #0f8a4f; padding: 1px; border-radius: 3px; background: #fff; flex-shrink: 0; margin-top: 2px;">
                <span style="width: 5px; height: 5px; border-radius: 50%; background: #0f8a4f;"></span>
              </span>
              <div>
                <span style="font-size: 12.5px; font-weight: 700; color: #1e293b; line-height: 1.35; word-break: break-word; text-align: left;">
                  ${item.name} ${bogoTag}
                </span>
                ${comboPillsHtml}
                ${addonsHtml}
              </div>
            </div>
            <!-- Remove Item Button -->
            <button onclick="views.pos.removeFromCart('${itemId}')" style="background: var(--bg-darkest); border: 1px solid rgba(255, 255, 255, 0.8); color: #ef4444; width: 22px; height: 22px; border-radius: 50%; cursor: pointer; font-size: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.2s; box-shadow: 2px 2px 5px #cad5e2, -2px -2px 5px #ffffff;" title="Remove Item">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <!-- Bottom Row: Addons / Note button & Controls + Line Total -->
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; border-top: 1px dashed rgba(200, 214, 229, 0.6); padding-top: 6px;">
            <div style="display: flex; gap: 6px; align-items: center;">
              <button class="btn-add-note" onclick="views.pos.openItemAddonModal('${itemId}')" style="background: transparent; border: none; color: #2563eb; font-size: 10.5px; font-weight: 700; cursor: pointer; padding: 0; display: inline-flex; align-items: center; gap: 3px;" title="${item.comboChoices ? 'Change Combo Selections' : 'Add Cheese, Extra Patty or Toppings'}">
                <i class="fa-solid ${item.comboChoices ? 'fa-layer-group' : 'fa-sliders'}"></i> ${item.comboChoices ? 'Change Combo' : 'Customize'}
              </button>
              <button class="btn-add-note" onclick="views.pos.addItemNotePrompt('${itemId}')" style="background: transparent; border: none; color: #64748b; font-size: 10.5px; font-weight: 700; cursor: pointer; padding: 0; max-width: 100px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                <i class="fa-regular fa-comment-dots"></i> ${item.note ? `Note: ${item.note}` : '+ Note'}
              </button>
            </div>

            <div style="display: flex; align-items: center; gap: 7px; flex-shrink: 0;">
              <span style="font-size: 11px; color: #d97706; font-weight: 700;">₹${unitPriceWithAddons}</span>
              <!-- Qty Stepper Pill -->
              <div style="display: flex; align-items: center; background: var(--bg-darkest); border: 1px solid rgba(255, 255, 255, 0.6); border-radius: 12px; height: 24px; padding: 0 3px; box-shadow: inset 2px 2px 4px #cad5e2, inset -2px -2px 4px #ffffff;" onclick="event.stopPropagation();">
                <button onclick="views.pos.modifyQty('${itemId}', -1)" style="background: transparent; border: none; width: 18px; height: 100%; cursor: pointer; font-size: 10px; color: #2563eb; display: flex; align-items: center; justify-content: center; font-weight: bold;"><i class="fa-solid fa-minus"></i></button>
                <input type="number" class="cart-qty-input" value="${item.quantity}" 
                       onchange="views.pos.setQty('${itemId}', parseInt(this.value) || 0)"
                       onclick="this.select();" 
                       onkeydown="if(event.key==='Enter') { event.preventDefault(); this.blur(); }"
                       style="background: transparent; border: none; font-size: 11px; font-weight: 800; width: 28px; text-align: center; color: var(--text-dark); outline: none; padding: 0;">
                <button onclick="views.pos.modifyQty('${itemId}', 1)" style="background: transparent; border: none; width: 18px; height: 100%; cursor: pointer; font-size: 10px; color: #2563eb; display: flex; align-items: center; justify-content: center; font-weight: bold;"><i class="fa-solid fa-plus"></i></button>
              </div>
              <!-- Line Total -->
              <span style="font-size: 13px; font-weight: 800; color: #d97706; min-width: 44px; text-align: right;">₹${lineTotal}</span>
            </div>
          </div>
        </div>
      `;
    }).join("");

    this.calculateBillTotals();
  },

  // Category-specific BOGO calculations (Burger on Burger, Tikka Pav on Tikka Pav)
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

      let groupKey = null;
      if (catId === "cat1" || catName.includes("burger") || itemName.includes("burger")) {
        groupKey = "burger";
      } else if (catId === "cat5" || catName.includes("tikka") || itemName.includes("tikka")) {
        groupKey = "tikkapav";
      }

      if (!groupKey) return;

      if (!groupPrices[groupKey]) groupPrices[groupKey] = [];

      for (let i = 0; i < item.quantity; i++) {
        groupPrices[groupKey].push(item.price);
      }
    });

    let totalBogoDiscount = 0;

    Object.keys(groupPrices).forEach(k => {
      const prices = groupPrices[k];
      if (prices.length < 2) return;

      prices.sort((a, b) => b - a);
      const numFree = Math.floor(prices.length / 2);
      for (let i = prices.length - numFree; i < prices.length; i++) {
        totalBogoDiscount += prices[i];
      }
    });

    return totalBogoDiscount;
  },

  calculateBillTotals() {
    let subtotal = 0;

    this.cart.forEach(item => {
      const addonsCost = (item.addons || []).reduce((sum, a) => sum + (Number(a.price) || 0), 0);
      subtotal += (item.price + addonsCost) * item.quantity;
    });

    const bogoDiscount = this.calculateBogoDiscount(this.cart);

    const bogoRow = document.getElementById("bogo-discount-row");
    const bogoDiscountEl = document.getElementById("bill-bogo-discount");
    if (bogoRow && bogoDiscountEl) {
      if (bogoDiscount > 0) {
        bogoRow.style.display = "flex";
        bogoDiscountEl.textContent = `-₹${bogoDiscount.toFixed(2)}`;
      } else {
        bogoRow.style.display = "none";
      }
    }

    const discountVal = Number(document.getElementById("bill-discount-input") ? document.getElementById("bill-discount-input").value : 0) || 0;
    const discountPercent = Math.min(100, Math.max(0, discountVal));
    const flatDiscountAmount = Math.round((subtotal - bogoDiscount) * (discountPercent / 100) * 100) / 100;

    const gstCheck = document.getElementById("tax-enable-checkbox");
    const gstEnabled = gstCheck ? gstCheck.checked : false;

    const settings = window.db.get("settings") || {};
    const gstRate = settings.gstPercentage || 5;

    const netBeforeTax = Math.max(0, subtotal - bogoDiscount - flatDiscountAmount);
    const taxVal = gstEnabled ? Math.round(netBeforeTax * (gstRate / 100) * 100) / 100 : 0;
    let netTotal = netBeforeTax + taxVal;

    // Handle optional round-off
    let roundOffDiff = 0;
    if (this.roundOffEnabled && netTotal > 0) {
      const rounded = Math.round(netTotal);
      roundOffDiff = Math.round((rounded - netTotal) * 100) / 100;
      netTotal = rounded;
    }

    const subEl = document.getElementById("bill-subtotal");
    const taxEl = document.getElementById("bill-tax");
    const totEl = document.getElementById("bill-total");
    const discAmtEl = document.getElementById("bill-discount-amount");
    const roundRow = document.getElementById("bill-roundoff-row");
    const roundValEl = document.getElementById("bill-roundoff-val");

    if (subEl) subEl.textContent = `₹${subtotal.toFixed(2)}`;
    if (taxEl) taxEl.textContent = `₹${taxVal.toFixed(2)}`;
    if (totEl) totEl.textContent = `₹${netTotal.toFixed(2)}`;
    if (discAmtEl) discAmtEl.textContent = `-₹${flatDiscountAmount.toFixed(2)}`;

    if (roundRow && roundValEl) {
      roundRow.style.display = this.roundOffEnabled ? "flex" : "none";
      roundValEl.textContent = `${roundOffDiff >= 0 ? '+' : ''}₹${roundOffDiff.toFixed(2)}`;
    }

    // Sync active discount chips
    const chips = document.querySelectorAll(".cart-discount-chip");
    chips.forEach(chip => {
      chip.classList.toggle("active", Number(chip.getAttribute("data-discount")) === discountPercent);
    });

    // Update screen UPI QR amount & image
    const upiScreenAmt = document.getElementById("pos-upi-screen-amt");
    if (upiScreenAmt) upiScreenAmt.textContent = `₹${netTotal.toFixed(2)}`;
    this.updateScreenUpiQr(netTotal);

    // Sync cash change calculation if open
    this.calcChangeReturn();
  },

  updateScreenUpiQr(amount) {
    const qrContainer = document.getElementById("pos-onscreen-qr-container");
    if (!qrContainer) return;

    if (!amount || amount <= 0) {
      qrContainer.innerHTML = `<i class="fa-solid fa-qrcode" style="font-size: 24px; color: #94a3b8;"></i>`;
      return;
    }

    const settings = window.db.get("settings") || {};
    const upiId = settings.upiId || "7487980840@okbizaxis";
    const shopName = settings.restaurantName || "Crust & Chilly";
    const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(shopName)}&am=${amount.toFixed(2)}&cu=INR`;

    qrContainer.innerHTML = "";
    try {
      if (typeof QRCode !== "undefined") {
        new QRCode(qrContainer, {
          text: upiUrl,
          width: 54,
          height: 54,
          colorDark: "#000000",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.M
        });
        const cvs = qrContainer.querySelector("canvas");
        if (cvs) cvs.style.display = "none";
        const img = qrContainer.querySelector("img");
        if (img) img.style.display = "block";
      }
    } catch (e) {
      qrContainer.innerHTML = `<i class="fa-solid fa-qrcode" style="font-size: 24px; color: #2563eb;"></i>`;
    }
  },

  setupListeners() {
    // 1. Search text filter & Clear button
    const search = document.getElementById("pos-search");
    const clearSearchBtn = document.getElementById("btn-clear-search");

    if (search) {
      search.oninput = (e) => {
        const val = e.target.value;
        this.searchQuery = val;
        if (clearSearchBtn) {
          clearSearchBtn.style.display = val ? "flex" : "none";
        }
        this.renderProducts();
      };
    }

    if (clearSearchBtn) {
      clearSearchBtn.onclick = () => {
        if (search) {
          search.value = "";
          this.searchQuery = "";
          clearSearchBtn.style.display = "none";
          this.renderProducts();
          search.focus();
        }
      };
    }

    // 2. Clear Cart trigger
    const clearCartBtn = document.getElementById("btn-clear-cart-trigger");
    if (clearCartBtn) {
      clearCartBtn.onclick = () => {
        if (this.cart.length > 0) {
          this.cart = [];
          this.renderCart();
          const noteInput = document.getElementById("order-kitchen-note");
          if (noteInput) noteInput.value = "";
          const cashInput = document.getElementById("cash-received-input");
          if (cashInput) cashInput.value = "";
          window.showToast("Cart cleared for new bill.", "info");
        }
      };
    }

    // 3. Discount inputs recalculate
    const discInput = document.getElementById("bill-discount-input");
    if (discInput) {
      discInput.oninput = () => this.calculateBillTotals();
    }

    // 4. GST checkbox check recalculate & state memory
    const taxCheck = document.getElementById("tax-enable-checkbox");
    if (taxCheck) {
      taxCheck.onchange = () => {
        localStorage.setItem("cc_pos_tax_enabled", taxCheck.checked);
        this.calculateBillTotals();
      };
    }

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
    if (this.handleKeydown) {
      document.removeEventListener("keydown", this.handleKeydown);
    }

    this.handleKeydown = (e) => {
      const searchEl = document.getElementById("pos-search");
      if (!searchEl || !searchEl.isConnected) return;

      // Focus search with Ctrl+K or "/"
      if ((e.key === "/" || (e.ctrlKey && (e.key === "k" || e.key === "K"))) && document.activeElement !== searchEl && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
        e.preventDefault();
        searchEl.focus();
        searchEl.select();
      }
      // F1 for New Bill
      if (e.key === "F1") {
        e.preventDefault();
        const btn = document.getElementById("btn-clear-cart-trigger");
        if (btn) btn.click();
      }
      // F2 for Custom Open Item
      if (e.key === "F2") {
        e.preventDefault();
        this.openCustomItemModal();
      }
      // F3 to hold cart
      if (e.key === "F3") {
        e.preventDefault();
        this.holdCurrentCart();
      }
      // F4 to open held orders
      if (e.key === "F4") {
        e.preventDefault();
        this.showHeldOrdersModal();
      }
      // Ctrl+B or F8 to place order and print bill
      if (e.key === "F8" || (e.ctrlKey && (e.key === "b" || e.key === "B"))) {
        e.preventDefault();
        this.processCheckout(false);
      }
      // F9 for Kitchen KOT
      if (e.key === "F9") {
        e.preventDefault();
        this.printKitchenKOT();
      }
      // Alt + C to clear cart
      if (e.altKey && (e.key === "c" || e.key === "C")) {
        e.preventDefault();
        const btn = document.getElementById("btn-clear-cart-trigger");
        if (btn) btn.click();
      }
      // Alt + 1, 2, 3 for Order Types
      if (e.altKey && e.key === "1") {
        e.preventDefault();
        setOrderType("Dine-in");
      }
      if (e.altKey && e.key === "2") {
        e.preventDefault();
        setOrderType("Takeaway");
      }
      if (e.altKey && e.key === "3") {
        e.preventDefault();
        setOrderType("Delivery");
      }
      // ? for Hotkeys Guide
      if (e.key === "?" && document.activeElement !== searchEl && document.activeElement.tagName !== "INPUT") {
        e.preventDefault();
        this.showHotkeysModal();
      }
      // Escape to clear search query
      if (e.key === "Escape" && document.activeElement === searchEl) {
        searchEl.value = "";
        this.searchQuery = "";
        this.renderProducts();
        searchEl.blur();
      }
    };
    document.addEventListener("keydown", this.handleKeydown);

    // 6. Payment Modes click select
    const pUpi = document.getElementById("pay-upi");
    const pCash = document.getElementById("pay-cash");
    const pCard = document.getElementById("pay-card");
    const pSplit = document.getElementById("pay-split");
    const cashDrawer = document.getElementById("cash-tender-drawer");
    const upiBox = document.getElementById("pos-onscreen-upi-box");

    const selectPayment = (btn, mode) => {
      [pUpi, pCash, pCard, pSplit].forEach(b => {
        if (b) b.classList.remove("active");
      });
      if (btn) btn.classList.add("active");
      this.selectedPayment = mode;
      
      if (cashDrawer) {
        cashDrawer.style.display = mode === "Cash" ? "block" : "none";
        if (mode === "Cash") this.calcChangeReturn();
      }

      if (upiBox) {
        upiBox.style.display = mode === "UPI" ? "flex" : "none";
        if (mode === "UPI") {
          const totEl = document.getElementById("bill-total");
          const net = parseFloat(totEl ? totEl.textContent.replace(/[^0-9.]/g, "") : 0) || 0;
          this.updateScreenUpiQr(net);
        }
      }
    };

    if (pUpi) pUpi.onclick = () => selectPayment(pUpi, "UPI");
    if (pCash) pCash.onclick = () => selectPayment(pCash, "Cash");
    if (pCard) pCard.onclick = () => selectPayment(pCard, "Card");
    if (pSplit) pSplit.onclick = () => selectPayment(pSplit, "Split");

    // 7. Checkout Process Confirmation modal & Save Order triggers
    const checkoutBtn = document.getElementById("btn-checkout-trigger");
    if (checkoutBtn) {
      checkoutBtn.onclick = () => this.processCheckout(false);
    }

    const btnSave = document.getElementById("btn-save-order-trigger");
    if (btnSave) {
      btnSave.onclick = () => this.processCheckout(true);
    }

    // 8. Customer Autofill listeners
    const nameInput = document.getElementById("cust-name");
    const phoneInput = document.getElementById("cust-phone");

    if (nameInput) {
      nameInput.addEventListener("input", () => {
        const val = nameInput.value.trim();
        if (val.toLowerCase() === "walk-in customer" || val.length < 2) return;

        const orders = window.db.get("orders") || [];
        const match = orders.find(o => o.customerName && o.customerName.trim().toLowerCase() === val.toLowerCase() && o.customerPhone);
        if (match && phoneInput) {
          phoneInput.value = match.customerPhone;
        }
      });
    }

    if (phoneInput) {
      phoneInput.addEventListener("input", (e) => {
        let val = e.target.value.replace(/\D/g, "");
        if (val.length > 10) val = val.substring(0, 10);
        e.target.value = val;

        if (!val || val.length < 4) return;

        const orders = window.db.get("orders") || [];
        const match = orders.find(o => o.customerPhone && o.customerPhone.trim() === val);
        if (match && nameInput) {
          nameInput.value = match.customerName;
        }
      });
    }
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

  // Open Custom Item Modal (F2)
  openCustomItemModal() {
    const formHtml = `
      <div style="display: flex; flex-direction: column; gap: 12px; font-size: 13px;">
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label" for="custom-item-name" style="font-weight: 700; margin-bottom: 4px;">Item Description / Service Title *</label>
          <input type="text" id="custom-item-name" class="form-input" placeholder="e.g. Special Shake, Catering Parcel, Extra Salad" style="height: 38px; border-radius: 10px;" required>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" for="custom-item-price" style="font-weight: 700; margin-bottom: 4px;">Selling Price (₹) *</label>
            <input type="number" id="custom-item-price" class="form-input" placeholder="e.g. 60" min="1" step="any" style="height: 38px; font-weight: 800; font-size: 14px; border-radius: 10px;" required>
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" for="custom-item-qty" style="font-weight: 700; margin-bottom: 4px;">Quantity</label>
            <input type="number" id="custom-item-qty" class="form-input" value="1" min="1" style="height: 38px; font-weight: 800; border-radius: 10px;">
          </div>
        </div>
      </div>
    `;

    window.customModal.show({
      title: "Add Custom Open Item / Service (F2)",
      bodyHtml: formHtml,
      confirmText: "Add to Current Bill",
      onConfirm: () => {
        const name = document.getElementById("custom-item-name").value.trim();
        const price = Number(document.getElementById("custom-item-price").value);
        const qty = Number(document.getElementById("custom-item-qty").value) || 1;

        if (!name || isNaN(price) || price <= 0) {
          window.showToast("Please enter valid item description and price.", "error");
          return false;
        }

        const customId = "custom-" + Date.now();
        this.cart.push({
          productId: customId,
          name: name,
          price: price,
          quantity: qty,
          bogo: false,
          category: "custom",
          addons: [],
          note: ""
        });

        this.renderCart();
        window.showToast(`Added custom item "${name}" (₹${price})`, "success");
        return true;
      }
    });
  },

  // Open Toppings / Addons Modal for a Cart Item (or Combo Customizer)
  openItemAddonModal(id) {
    const item = this.findCartItem(id);
    if (!item) return;

    const products = window.db ? (window.db.get("products") || []) : [];
    const product = products.find(p => p.id === item.productId) || { id: item.productId, name: item.name, price: item.price, category: item.category };

    // If this item is a combo meal, open the full Combo Customizer Builder!
    if (this.isComboProduct(item) || this.isComboProduct(product)) {
      this.openComboSelectionModal(product, item);
      return;
    }

    item.addons = item.addons || [];

    const availableAddons = [
      { id: "add_cheese", name: "Extra Cheese Slice", price: 20 },
      { id: "add_spicy", name: "Extra Spicy Sauce", price: 10 },
      { id: "add_patty", name: "Extra Veg Patty", price: 30 },
      { id: "add_jain", name: "Jain Preparation (No Onion/Garlic)", price: 0 },
      { id: "add_parcel", name: "Special Parcel Box", price: 10 }
    ];

    const bodyHtml = `
      <div style="display: flex; flex-direction: column; gap: 10px; font-size: 13px;">
        <div style="font-size: 12px; color: var(--text-muted);">
          Select toppings and preparation upgrades for <strong style="color: #2563eb;">${item.name}</strong>:
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${availableAddons.map(add => {
            const isChecked = item.addons.some(a => a.id === add.id);
            return `
              <label style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 1px solid var(--border-color); padding: 8px 12px; border-radius: 10px; cursor: pointer;">
                <span style="display: flex; align-items: center; gap: 8px; font-weight: 700; color: var(--text-dark);">
                  <input type="checkbox" class="addon-chk" data-id="${add.id}" data-name="${add.name}" data-price="${add.price}" ${isChecked ? 'checked' : ''}>
                  ${add.name}
                </span>
                <span style="font-weight: 800; color: #2563eb;">${add.price > 0 ? `+₹${add.price}` : 'Free'}</span>
              </label>
            `;
          }).join("")}
        </div>
      </div>
    `;

    window.customModal.show({
      title: `Customize Item - ${item.name}`,
      bodyHtml: bodyHtml,
      confirmText: "Save Customization",
      onConfirm: () => {
        const selected = [];
        document.querySelectorAll(".addon-chk:checked").forEach(chk => {
          selected.push({
            id: chk.getAttribute("data-id"),
            name: chk.getAttribute("data-name"),
            price: Number(chk.getAttribute("data-price")) || 0
          });
        });
        item.addons = selected;
        this.renderCart();
        window.showToast("Customization updated.", "success");
        return true;
      }
    });
  },

  // Show Keyboard Shortcuts Cheatsheet
  showHotkeysModal() {
    const hotkeysHtml = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12.5px;">
        <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: 10px; padding: 10px;">
          <div style="font-weight: 800; color: #2563eb; margin-bottom: 6px;"><i class="fa-solid fa-keyboard"></i> Navigation & Search</div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>Focus Search:</span> <kbd style="background:#e2e8f0; padding:2px 6px; border-radius:4px; font-weight:800;">Ctrl+K</kbd> / <kbd style="background:#e2e8f0; padding:2px 6px; border-radius:4px; font-weight:800;">/</kbd></div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>Clear Search:</span> <kbd style="background:#e2e8f0; padding:2px 6px; border-radius:4px; font-weight:800;">Esc</kbd></div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>Toggle Fullscreen:</span> <kbd style="background:#e2e8f0; padding:2px 6px; border-radius:4px; font-weight:800;">F11</kbd></div>
        </div>
        <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: 10px; padding: 10px;">
          <div style="font-weight: 800; color: #059669; margin-bottom: 6px;"><i class="fa-solid fa-cart-shopping"></i> Cart & Billing</div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>New Bill / Clear:</span> <kbd style="background:#e2e8f0; padding:2px 6px; border-radius:4px; font-weight:800;">F1</kbd> / <kbd style="background:#e2e8f0; padding:2px 6px; border-radius:4px; font-weight:800;">Alt+C</kbd></div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>Custom Open Item:</span> <kbd style="background:#e2e8f0; padding:2px 6px; border-radius:4px; font-weight:800;">F2</kbd></div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>Hold / Park Order:</span> <kbd style="background:#e2e8f0; padding:2px 6px; border-radius:4px; font-weight:800;">F3</kbd></div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>View Held Orders:</span> <kbd style="background:#e2e8f0; padding:2px 6px; border-radius:4px; font-weight:800;">F4</kbd></div>
        </div>
        <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: 10px; padding: 10px; grid-column: 1 / -1;">
          <div style="font-weight: 800; color: #d97706; margin-bottom: 6px;"><i class="fa-solid fa-print"></i> Order Processing</div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>Place Order & Print Bill:</span> <kbd style="background:#2563eb; color:#fff; padding:2px 8px; border-radius:4px; font-weight:800;">Ctrl+B</kbd> / <kbd style="background:#2563eb; color:#fff; padding:2px 8px; border-radius:4px; font-weight:800;">F8</kbd></div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>Print Kitchen KOT:</span> <kbd style="background:#e2e8f0; padding:2px 6px; border-radius:4px; font-weight:800;">F9</kbd></div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>Order Types:</span> <span><kbd style="background:#e2e8f0; padding:2px 6px; border-radius:4px; font-weight:800;">Alt+1</kbd> Dine-In • <kbd style="background:#e2e8f0; padding:2px 6px; border-radius:4px; font-weight:800;">Alt+2</kbd> Takeaway • <kbd style="background:#e2e8f0; padding:2px 6px; border-radius:4px; font-weight:800;">Alt+3</kbd> Delivery</span></div>
        </div>
      </div>
    `;

    window.customModal.show({
      title: "POS Terminal Keyboard Shortcuts (Hotkeys)",
      bodyHtml: hotkeysHtml,
      confirmText: "Got It",
      hideFooter: false,
      onConfirm: () => true
    });
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
            ${this.cart.map(item => {
              const addonsStr = (item.addons && item.addons.length > 0) ? ` (+ ${item.addons.map(a => a.name).join(", ")})` : "";
              const comboSubStr = item.comboChoices ? `
                <div style="font-size: 11px; font-weight: normal; margin-left: 4px; color: #333;">
                  ↳ <strong>${item.comboChoices.mainItem}</strong> + <strong>${item.comboChoices.beverage}</strong> + <strong>${item.comboChoices.side || 'Fries'}</strong>
                </div>
              ` : "";
              return `
                <tr style="border-bottom: 1px dotted #ccc;">
                  <td style="padding: 5px 0; font-weight: bold;">
                    ${item.name}${addonsStr}
                    ${comboSubStr}
                    ${item.note ? `<div style="font-size: 10px; font-style: italic; color: #555;">>> Note: ${item.note}</div>` : ''}
                  </td>
                  <td style="text-align: right; padding: 5px 0; font-size: 14px; font-weight: 900;">${item.quantity}</td>
                </tr>
              `;
            }).join("")}
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
        const autoClose = () => {
          window.removeEventListener("afterprint", autoClose);
          setTimeout(() => {
            if (window.customModal) window.customModal.hide();
          }, 250);
        };
        window.addEventListener("afterprint", autoClose);
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

    if (customerPhone && customerPhone.length !== 10) {
      window.showToast("Customer phone number must be exactly 10 digits.", "error");
      return;
    }

    const discountVal = Number(document.getElementById("bill-discount-input").value) || 0;
    const gstEnabled = document.getElementById("tax-enable-checkbox").checked;

    let subtotal = 0;
    const formattedItems = this.cart.map(item => {
      const addonsCost = (item.addons || []).reduce((sum, a) => sum + (Number(a.price) || 0), 0);
      const unitPriceWithAddons = item.price + addonsCost;
      const lineTotal = unitPriceWithAddons * item.quantity;
      subtotal += lineTotal;

      let displayName = item.name;
      if (item.comboChoices) {
        displayName += ` [${item.comboChoices.mainItem} + ${item.comboChoices.beverage}]`;
      }
      if (item.addons && item.addons.length > 0) {
        displayName += ` (+ ${item.addons.map(a => a.name).join(", ")})`;
      }

      return {
        productId: item.productId,
        name: displayName,
        price: unitPriceWithAddons,
        quantity: item.quantity,
        bogo: item.bogo,
        category: item.category,
        lineTotal: lineTotal,
        note: item.note || "",
        comboChoices: item.comboChoices || null
      };
    });

    const bogoDiscount = this.calculateBogoDiscount(this.cart);

    const settings = window.db.get("settings") || {};
    const gstRate = settings.gstPercentage || 5;

    const discountPercent = Math.min(100, Math.max(0, discountVal));
    const flatDiscountAmount = Math.round((subtotal - bogoDiscount) * (discountPercent / 100) * 100) / 100;

    const netBeforeTax = Math.max(0, subtotal - bogoDiscount - flatDiscountAmount);
    const taxVal = gstEnabled ? Math.round(netBeforeTax * (gstRate / 100) * 100) / 100 : 0;
    let netTotal = netBeforeTax + taxVal;

    if (this.roundOffEnabled && netTotal > 0) {
      netTotal = Math.round(netTotal);
    }

    // Call database create transaction
    const response = window.db.createOrder({
      customerName: customerName,
      customerPhone: customerPhone,
      items: formattedItems,
      subtotal: subtotal,
      discount: flatDiscountAmount,
      bogoDiscount: bogoDiscount,
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
      this.populateCustomerAutocompletes();
      if (window.updateSidebarSummary) {
        window.updateSidebarSummary();
      }
    } else {
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
  isPrintingSequence: false,

  printSeparately(shouldCloseModal = true) {
    if (this.isPrintingSequence) return;
    this.isPrintingSequence = true;

    const safetyTimer = setTimeout(() => {
      this.isPrintingSequence = false;
      if (shouldCloseModal && window.customModal) {
        window.customModal.hide();
      }
    }, 20000);

    this.switchReceiptTab("bill");

    let firstPrintCompleted = false;

    const handleFirstPrintCompleted = () => {
      window.removeEventListener("afterprint", handleFirstPrintCompleted);
      if (firstPrintCompleted) return;
      firstPrintCompleted = true;

      // Small delay before preparing KOT ticket and opening KOT print dialog
      setTimeout(() => {
        this.switchReceiptTab("kot");

        setTimeout(() => {
          let secondPrintCompleted = false;
          const handleSecondPrintCompleted = () => {
            window.removeEventListener("afterprint", handleSecondPrintCompleted);
            if (secondPrintCompleted) return;
            secondPrintCompleted = true;
            clearTimeout(safetyTimer);
            this.isPrintingSequence = false;
            
            // Revert tab and automatically close the receipt modal (image 3)
            setTimeout(() => {
              this.switchReceiptTab("bill");
              if (shouldCloseModal && window.customModal) {
                window.customModal.hide();
              }
            }, 300);
          };

          window.addEventListener("afterprint", handleSecondPrintCompleted);

          try {
            window.print();
          } catch (e2) {
            console.error("KOT print error:", e2);
            clearTimeout(safetyTimer);
            this.isPrintingSequence = false;
            if (shouldCloseModal && window.customModal) {
              window.customModal.hide();
            }
          }
        }, 200);
      }, 450);
    };

    window.addEventListener("afterprint", handleFirstPrintCompleted);

    setTimeout(() => {
      try {
        window.print();
      } catch (e1) {
        console.error("Customer Bill print error:", e1);
        clearTimeout(safetyTimer);
        this.isPrintingSequence = false;
        if (shouldCloseModal && window.customModal) {
          window.customModal.hide();
        }
      }
    }, 120);
  },

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
      if (modalConfirmBtn) modalConfirmBtn.innerHTML = '<i class="fa-solid fa-copy"></i> Print Both (Separate Prints)';
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

  showReceiptModal(order, autoPrint = false, defaultTab = "both") {
    this.currentReceiptOrder = order;
    this.currentReceiptTab = defaultTab;
    const settings = window.db.get("settings") || {};

    const dateObj = new Date(order.createdAt);
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const yy = String(dateObj.getFullYear()).slice(-2);
    const orderDate = `${dd}/${mm}/${yy}`;

    const hh = String(dateObj.getHours()).padStart(2, '0');
    const min = String(dateObj.getMinutes()).padStart(2, '0');
    const orderTime = `${hh}:${min}`;

    const currentUser = window.db.getCurrentUser() || { name: "biller" };
    const cashierName = currentUser.name.split(' ')[0];
    const tokenNo = String(order.tokenNumber || 1).padStart(2, '0');
    const totalQty = (order.items || []).reduce((sum, item) => sum + item.quantity, 0);

    const upiId = settings.upiId || "7487980840@okbizaxis";
    const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(settings.restaurantName || "Crust & Chilly")}&am=${Number(order.total || 0).toFixed(2)}&cu=INR&tn=Order${order.orderNumber}`;

    const modalHtml = `
      <div class="receipt-tabs-toolbar no-print" style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid var(--border-color); flex-wrap: wrap;">
        <div style="display: flex; gap: 6px;">
          <button id="btn-tab-bill" type="button" onclick="views.pos.switchReceiptTab('bill')" style="padding: 6px 12px; border-radius: 8px; border: 1.5px solid ${defaultTab === 'bill' ? '#2563eb' : '#cbd5e1'}; background: ${defaultTab === 'bill' ? '#2563eb' : '#f1f5f9'}; color: ${defaultTab === 'bill' ? '#fff' : '#475569'}; font-size: 12px; font-weight: ${defaultTab === 'bill' ? '800' : '600'}; cursor: pointer;">
            <i class="fa-solid fa-receipt"></i> Customer Bill
          </button>
          <button id="btn-tab-kot" type="button" onclick="views.pos.switchReceiptTab('kot')" style="padding: 6px 12px; border-radius: 8px; border: 1.5px solid ${defaultTab === 'kot' ? '#2563eb' : '#cbd5e1'}; background: ${defaultTab === 'kot' ? '#2563eb' : '#f1f5f9'}; color: ${defaultTab === 'kot' ? '#fff' : '#475569'}; font-size: 12px; font-weight: ${defaultTab === 'kot' ? '800' : '600'}; cursor: pointer;">
            <i class="fa-solid fa-fire-burner"></i> Kitchen KOT
          </button>
          <button id="btn-tab-both" type="button" onclick="views.pos.switchReceiptTab('both')" style="padding: 6px 12px; border-radius: 8px; border: 1.5px solid ${defaultTab === 'both' ? '#2563eb' : '#cbd5e1'}; background: ${defaultTab === 'both' ? '#2563eb' : '#f1f5f9'}; color: ${defaultTab === 'both' ? '#fff' : '#475569'}; font-size: 12px; font-weight: ${defaultTab === 'both' ? '800' : '600'}; cursor: pointer;" title="Prints Customer Bill first, then Kitchen KOT as separate prints">
            <i class="fa-solid fa-copy"></i> Both (Separate Prints)
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
        <div id="receipt-section-bill" style="display: ${defaultTab === 'kot' ? 'none' : 'block'};">
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
        <div id="receipt-section-tear" style="display: ${defaultTab === 'both' ? 'block' : 'none'}; text-align: center; margin: 16px 0 14px 0; border-top: 2px dashed #000; border-bottom: 2px dashed #000; padding: 6px 0; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">
          ✂️ - - - - TEAR HERE FOR KITCHEN (KOT) - - - - ✂️
        </div>

        <!-- Kitchen Order Ticket (KOT) Section -->
        <div id="receipt-section-kot" style="display: ${defaultTab === 'bill' ? 'none' : 'block'};">
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
      
      <style>
        @media print {
          @page { margin: 0 !important; size: auto; }
          body { background: #fff !important; color: #000 !important; margin: 0 !important; padding: 0 !important; }
          * { color: #000 !important; text-shadow: none !important; box-shadow: none !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          #app-container, .toast-container, .modal-header, .modal-footer, .no-print, .receipt-no-print { display: none !important; }
          #modal-container, .modal-overlay { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; height: auto !important; background: transparent !important; background-color: transparent !important; backdrop-filter: none !important; box-shadow: none !important; display: block !important; opacity: 1 !important; visibility: visible !important; padding: 0 !important; margin: 0 !important; }
          #modal-container .modal-content, .modal-content { border: none !important; box-shadow: none !important; background: transparent !important; background-color: transparent !important; width: 100% !important; max-width: 100% !important; height: auto !important; max-height: none !important; overflow: visible !important; padding: 0 !important; margin: 0 !important; transform: none !important; }
          #modal-container .modal-body, .modal-body { padding: 0 !important; margin: 0 !important; height: auto !important; max-height: none !important; overflow: visible !important; background: transparent !important; background-color: transparent !important; }
          .receipt-wrapper { width: 72mm !important; max-width: 72mm !important; margin: 0 auto !important; padding: 2mm 3mm !important; box-sizing: border-box !important; box-shadow: none !important; border: none !important; border-radius: 0 !important; }
          .receipt-table th, .receipt-table td { font-size: 11px !important; }
          #receipt-qrcode-box canvas { display: none !important; }
          #receipt-qrcode-box img, .receipt-qr-img { display: block !important; margin: 0 auto !important; width: 95px !important; height: 95px !important; max-width: 95px !important; }
        }
      </style>
    `;

    window.customModal.show({
      title: `Bill & Receipt #${order.orderNumber} (Token #${tokenNo})`,
      bodyHtml: modalHtml,
      confirmText: defaultTab === "both" ? '<i class="fa-solid fa-copy"></i> Print Both (Separate Prints)' : (defaultTab === "kot" ? '<i class="fa-solid fa-fire-burner"></i> Print Kitchen KOT' : '<i class="fa-solid fa-print"></i> Print Bill'),
      cancelText: "Done / Close",
      onConfirm: () => {
        if (this.currentReceiptTab === "both") {
          this.printSeparately(true);
        } else {
          const autoCloseHandler = () => {
            window.removeEventListener("afterprint", autoCloseHandler);
            setTimeout(() => {
              if (window.customModal) window.customModal.hide();
            }, 300);
          };
          window.addEventListener("afterprint", autoCloseHandler);
          window.print();
        }
        return false;
      },
      onCancel: () => {
        window.customModal.hide();
      }
    });

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

          const cvs = qrContainer.querySelector("canvas");
          if (cvs) cvs.style.display = "none";
          const img = qrContainer.querySelector("img");
          if (img) {
            img.style.display = "block";
            img.style.margin = "0 auto";
          }
        } else {
          qrContainer.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=95x95&data=${encodeURIComponent(upiUrl)}" style="width:95px;height:95px;margin:0 auto;display:block;" alt="Scan to Pay">`;
        }
      } catch (err) {
        console.warn("QR code render error:", err);
      }
    }

    if (autoPrint) {
      setTimeout(() => {
        try {
          if (defaultTab === "both") {
            this.printSeparately(true);
          } else {
            const autoCloseHandler = () => {
              window.removeEventListener("afterprint", autoCloseHandler);
              setTimeout(() => {
                if (window.customModal) window.customModal.hide();
              }, 300);
            };
            window.addEventListener("afterprint", autoCloseHandler);
            window.print();
          }
        } catch (err) {
          console.error("Print dialog error:", err);
        }
      }, 150);
    }
  },

  showKitchenReceiptModal(order) {
    if (!order) return;
    this.showReceiptModal(order, false, "kot");
  },

  populateCustomerAutocompletes() {
    const orders = window.db.get("orders") || [];

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

  addItemNotePrompt(id) {
    const item = this.findCartItem(id);
    if (!item) return;
    const currentNote = item.note || "";
    const note = prompt(`Enter preparation instruction note for ${item.name}:`, currentNote);
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
    this.cart.forEach(i => {
      const addonsCost = (i.addons || []).reduce((sum, a) => sum + (Number(a.price) || 0), 0);
      subtotal += ((i.price + addonsCost) * i.quantity);
    });

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