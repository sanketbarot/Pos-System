// Crust & Chilly POS - Terminal POS Billing Module
// Coordinates search, category tab filters, recipe stock warnings, BOGO, cart modification, and receipt generation.

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

    container.innerHTML = `
      <div class="pos-layout view-animate">
        <!-- Products Grid Container Panel -->
        <div class="pos-products-panel">
          
          <!-- Search & Category Filters -->
          <div class="pos-search-filter-row">
            <input type="text" id="pos-search" class="search-bar-input" placeholder="Search menu items (e.g. Burger, Mojito)...">
          </div>
          
          <div class="pos-categories-tabs" id="pos-category-list">
            <!-- Categories injected dynamically -->
          </div>

          <!-- Product Grid Area -->
          <div class="pos-products-grid-scroll">
            <div class="pos-products-grid" id="pos-grid">
              <!-- Products injected dynamically -->
            </div>
          </div>
        </div>

        <!-- Right Checkout Billing Drawer -->
        <div class="pos-cart-panel">
          <div class="cart-header">
            <div class="cart-title">
              <i class="fa-solid fa-cart-shopping"></i> Active Order
              <span class="cart-item-count-badge" id="cart-qty-badge">0</span>
            </div>
            <button class="btn-clear-cart" id="btn-clear-cart-trigger"><i class="fa-solid fa-trash-can"></i> Reset</button>
          </div>

          <!-- Cart items list scrollable -->
          <div class="cart-items-scroll" id="cart-items-list">
            <div style="text-align: center; color: var(--text-muted); margin-top: 60px;">
              <i class="fa-solid fa-basket-shopping" style="font-size: 36px; margin-bottom: 12px; display: block; opacity: 0.3;"></i>
              Cart is currently empty.<br>Click items on the left to add.
            </div>
          </div>

          <!-- Customer details inputs -->
          <div class="cart-billing-details">
            <div class="customer-details-inputs">
              <input type="text" id="cust-name" class="customer-input" placeholder="Customer Name" value="Walk-in Customer">
              <input type="tel" id="cust-phone" class="customer-input" placeholder="Phone Number">
            </div>

            <!-- Order type (Dine-in / Takeaway) -->
            <div class="order-settings-row">
              <div class="toggle-group">
                <div class="toggle-option active" id="type-dinein">Dine-in</div>
                <div class="toggle-option" id="type-takeaway">Takeaway</div>
              </div>
            </div>

            <!-- Invoice billing summary calculations -->
            <div class="billing-summary-lines">
              <div class="billing-line">
                <span>Subtotal</span>
                <span id="bill-subtotal">₹0.00</span>
              </div>
              <div class="billing-line" id="bogo-discount-row" style="display: none;">
                <span>BOGO Discount</span>
                <span id="bill-bogo-discount" style="color: #ff4b2b;">-₹0.00</span>
              </div>
              <div class="billing-line">
                <span>Discount (₹)</span>
                <input type="number" id="bill-discount-input" class="customer-input" style="width: 70px; height: 22px; padding: 2px 4px; font-size: 11px; text-align: right;" value="0" min="0">
              </div>
              <div class="billing-line">
                <span class="flex-gap-sm">
                  Tax/GST (5%)
                  <input type="checkbox" id="tax-enable-checkbox" style="cursor: pointer;">
                </span>
                <span id="bill-tax">₹0.00</span>
              </div>
              <div class="billing-line total">
                <span>Total Amount</span>
                <span id="bill-total">₹0.00</span>
              </div>
            </div>

            <!-- Payment Type Selection Button Options -->
            <div class="checkout-payment-options">
              <button class="payment-btn active" id="pay-upi"><i class="fa-solid fa-mobile-screen-button"></i>UPI</button>
              <button class="payment-btn" id="pay-cash"><i class="fa-solid fa-money-bill-1"></i>Cash</button>
              <button class="payment-btn" id="pay-card"><i class="fa-solid fa-credit-card"></i>Card</button>
            </div>

            <!-- Submit checkout -->
            <button class="btn-checkout" id="btn-checkout-trigger">
              <i class="fa-solid fa-circle-check"></i> Place & Print Order
            </button>
          </div>
        </div>
      </div>
    `;

    this.renderCategories();
    this.renderProducts();
    this.setupListeners();
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
      
      let indicatorHtml = `<span class="product-stock-indicator"><i class="fa-solid fa-circle" style="color: var(--color-ready); font-size: 8px;"></i> Available</span>`;
      let outOfStockClass = "";
      
      if (!stockCheck.available) {
        indicatorHtml = `<span class="product-stock-indicator low"><i class="fa-solid fa-circle" style="color: var(--color-cancelled); font-size: 8px;"></i> OUT OF STOCK</span>`;
        outOfStockClass = "out-of-stock";
      } else {
        // Double check details if ingredients are close to low stock limit
        const ingredients = window.db.get("ingredients") || [];
        const isNearLowStock = p.recipe ? Object.keys(p.recipe).some(ingId => {
          const ing = ingredients.find(i => i.id === ingId);
          return ing && ing.stock <= ing.minLimit * 1.5; // low stock warnings helper
        }) : false;
        
        if (isNearLowStock) {
          indicatorHtml = `<span class="product-stock-indicator low"><i class="fa-solid fa-circle" style="color: var(--color-pending); font-size: 8px;"></i> Low Ingredients</span>`;
        }
      }

      return `
        <div class="product-card ${outOfStockClass}" data-id="${p.id}">
          ${p.bogo ? `<span class="product-bogo-badge">BOGO Offer</span>` : ""}
          <div class="product-info-top">
            <span class="product-name">${p.name}</span>
            <span class="product-price">₹${p.price}</span>
          </div>
          ${indicatorHtml}
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

    window.showToast(`Added ${product.name} to checkout`, "success");
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
        bogoTag = `<span style="font-size: 10px; background: #e91e63; color:#fff; padding:1px 4px; border-radius:3px; margin-left:6px;">BOGO Eligible</span>`;
      }
      
      const lineTotal = item.price * item.quantity;

      return `
        <div class="cart-item-row">
          <div class="cart-item-info">
            <span class="cart-item-name">${item.name}</span>
            <span class="cart-item-subtext">₹${item.price} each ${bogoTag}</span>
          </div>
          <div class="cart-item-actions">
            <div class="quantity-controls">
              <button class="qty-btn" onclick="views.pos.modifyQty('${item.productId}', -1)"><i class="fa-solid fa-minus"></i></button>
              <span class="qty-val">${item.quantity}</span>
              <button class="qty-btn" onclick="views.pos.modifyQty('${item.productId}', 1)"><i class="fa-solid fa-plus"></i></button>
            </div>
            <span class="cart-item-total">₹${lineTotal}</span>
            <button class="btn-remove-item" onclick="views.pos.removeFromCart('${item.productId}')">
              <i class="fa-solid fa-xmark"></i>
            </button>
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
    const gstEnabled = document.getElementById("tax-enable-checkbox").checked;
    
    const settings = window.db.get("settings") || {};
    const gstRate = settings.gstPercentage || 5;

    const netBeforeTax = Math.max(0, subtotal - bogoDiscount - discountVal);
    const taxVal = gstEnabled ? Math.round(netBeforeTax * (gstRate / 100) * 100) / 100 : 0;
    const netTotal = netBeforeTax + taxVal;

    document.getElementById("bill-subtotal").textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById("bill-tax").textContent = `₹${taxVal.toFixed(2)}`;
    document.getElementById("bill-total").textContent = `₹${netTotal.toFixed(2)}`;
  },

  setupListeners() {
    // 1. Search text filter
    const search = document.getElementById("pos-search");
    search.oninput = (e) => {
      this.searchQuery = e.target.value;
      this.renderProducts();
    };

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

    // 4. GST checkbox check recalculate
    document.getElementById("tax-enable-checkbox").onchange = () => {
      this.calculateBillTotals();
    };

    // 5. Order Type selection
    const dinein = document.getElementById("type-dinein");
    const takeaway = document.getElementById("type-takeaway");
    
    dinein.onclick = () => {
      dinein.classList.add("active");
      takeaway.classList.remove("active");
      this.orderType = "Dine-in";
    };

    takeaway.onclick = () => {
      takeaway.classList.add("active");
      dinein.classList.remove("active");
      this.orderType = "Takeaway";
    };

    // 6. Payment Modes click select
    const pUpi = document.getElementById("pay-upi");
    const pCash = document.getElementById("pay-cash");
    const pCard = document.getElementById("pay-card");

    const selectPayment = (btn, mode) => {
      [pUpi, pCash, pCard].forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      this.selectedPayment = mode;
    };

    pUpi.onclick = () => selectPayment(pUpi, "UPI");
    pCash.onclick = () => selectPayment(pCash, "Cash");
    pCard.onclick = () => selectPayment(pCard, "Card");

    // 7. Checkout Process Confirmation modal
    document.getElementById("btn-checkout-trigger").onclick = () => {
      this.processCheckout();
    };
  },

  processCheckout() {
    if (this.cart.length === 0) {
      window.showToast("Cannot place order. The cart is empty.", "error");
      return;
    }

    const customerName = document.getElementById("cust-name").value.trim() || "Walk-in Customer";
    const customerPhone = document.getElementById("cust-phone").value.trim() || "";
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

    const netBeforeTax = Math.max(0, subtotal - bogoDiscount - discountVal);
    const taxVal = gstEnabled ? Math.round(netBeforeTax * (gstRate / 100) * 100) / 100 : 0;
    const netTotal = netBeforeTax + taxVal;

    // Call database create transaction
    const response = window.db.createOrder({
      customerName: customerName,
      customerPhone: customerPhone,
      items: formattedItems,
      subtotal: subtotal,
      discount: discountVal,
      bogoDiscount: bogoDiscount, // save global bogo discount
      tax: taxVal,
      total: netTotal,
      type: this.orderType,
      paymentMethod: this.selectedPayment
    });

    if (response.success) {
      window.showToast(`Order #${response.order.orderNumber} successfully processed!`, "success");
      
      // Force update inventory warnings in headers
      const updateHeaderPill = document.createEvent("Event");
      updateHeaderPill.initEvent("db-update", true, true);
      window.dispatchEvent(updateHeaderPill);

      // Trigger printable receipt billing modal
      this.showReceiptModal(response.order);
      
      // Clear Cart state
      this.cart = [];
      document.getElementById("cust-name").value = "Walk-in Customer";
      document.getElementById("cust-phone").value = "";
      document.getElementById("bill-discount-input").value = "0";
      this.renderCart();
      this.renderProducts(); // refresh stock numbers on cards
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
    const dateStr = new Date(order.createdAt).toLocaleString();
    
    const itemsHtml = order.items.map(item => {
      let bogoLabel = item.bogo ? " (BOGO)" : "";
      return `${item.name.substring(0, 20).padEnd(20)}${bogoLabel.padEnd(6)} x${item.quantity.toString().padEnd(2)} ₹${item.lineTotal.toString().padStart(5)}`;
    }).join("\n");

    const receiptHtml = `
      <div class="receipt-wrapper">
        <div class="receipt-header">
          <div class="receipt-title">${settings.restaurantName || "Crust & Chilly"}</div>
          <div>${settings.address || "Chili Square, Corporate Road"}</div>
          <div>Phone: ${settings.phone || "9876543210"}</div>
        </div>
        
        <div class="receipt-dotted-line"></div>
        
        <div class="receipt-meta">
          <div><strong>Order #:</strong> ${order.orderNumber}</div>
          <div><strong>Date:</strong> ${dateStr}</div>
          <div><strong>Type:</strong> ${order.type} (${order.paymentMethod})</div>
          <div><strong>Cust:</strong> ${order.customerName}</div>
        </div>
        
        <div class="receipt-dotted-line"></div>
        
        <pre style="margin: 0; font-family: inherit; font-size: inherit;">
${"Item Description".padEnd(26)} Qty  Amount
${"-".repeat(38)}
${itemsHtml}
        </pre>
        
        <div class="receipt-dotted-line"></div>
        
        <div class="receipt-totals">
          <div class="receipt-total-line"><span>Subtotal:</span><span>₹${order.subtotal.toFixed(2)}</span></div>
          ${order.bogoDiscount > 0 ? `<div class="receipt-total-line" style="font-weight: 600; color: #d62d20;"><span>BOGO Discount:</span><span>-₹${order.bogoDiscount.toFixed(2)}</span></div>` : ""}
          ${order.discount > 0 ? `<div class="receipt-total-line"><span>Cash Discount:</span><span>-₹${order.discount.toFixed(2)}</span></div>` : ""}
          <div class="receipt-total-line"><span>GST (5%):</span><span>₹${order.tax.toFixed(2)}</span></div>
          <div class="receipt-total-line bold" style="font-size: 15px; border-top: 1px dashed #000; padding-top: 5px;"><span>Grand Total:</span><span>₹${order.total.toFixed(2)}</span></div>
        </div>
        
        <div class="receipt-dotted-line" style="margin-top: 15px;"></div>
        <div style="text-align: center; margin-top: 10px; font-weight: bold;">
          Thank you for dining with us!
        </div>
      </div>
      
      <!-- Custom print styles only active when printing -->
      <style>
        @media print {
          body * { visibility: hidden; }
          .modal-overlay { background: transparent !important; backdrop-filter: none !important; position: absolute; left: 0; top: 0; width: 100%; height: auto; }
          .modal-content { border: none !important; box-shadow: none !important; width: 100% !important; max-width: 100% !important; }
          .modal-header, .modal-footer { display: none !important; }
          .receipt-wrapper { visibility: visible; width: 80mm; margin: 0; padding: 0; }
          .receipt-wrapper * { visibility: visible; }
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
  }
};
