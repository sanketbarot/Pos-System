// Crust & Chilly POS - Local Database Module
// Manages localStorage data access, transactional order creation with recipe deduction, and seeding.

const DB_PREFIX = "cc_pos_";

const db = {
  // Generic Read/Write
  get(key) {
    const data = localStorage.getItem(DB_PREFIX + key);
    return data ? JSON.parse(data) : null;
  },

  set(key, val) {
    localStorage.setItem(DB_PREFIX + key, JSON.stringify(val));
    // Trigger storage event locally for SPA notification sync if needed
    window.dispatchEvent(new Event("db-update"));
  },

  // Initialize Database with Demo Data
  init(force = false) {
    if (force) {
      localStorage.clear();
    }

    if (!this.get("initialized") || force) {
      this.seedData();
      this.set("initialized", true);
      console.log("Crust & Chilly POS: Database initialized with seed data.");
    } else {
      // Auto-update existing settings with new address, phone, and upiId
      const currentSettings = this.get("settings") || {};
      currentSettings.address = "Shop-09, Shree sanidhya flora, Turquoise BLU Rd, Shela, Ahmedabad, Gujarat 380057";
      currentSettings.phone = "096648 70840";
      currentSettings.upiId = "7487980840@okbizaxis";
      this.set("settings", currentSettings);
    }
  },

  seedData() {
    // 1. Users Setup (Admin / Staff)
    const users = [
      { id: "u1", username: "admin", password: "123", role: "admin", name: "Sanket Barot (Admin)" },
      { id: "u2", username: "staff", password: "123", role: "staff", name: "Rajesh Kumar (Staff)" }
    ];
    this.set("users", users);

    // 2. Categories
    const categories = [
      { id: "cat1", name: "Burgers", icon: "hamburger" },
      { id: "cat2", name: "Slice Sandwich", icon: "bread-slice" },
      { id: "cat3", name: "3 Layer Sandwich", icon: "utensils" },
      { id: "cat4", name: "Frankie", icon: "wrap" },
      { id: "cat5", name: "Tikka Pav", icon: "hotdog" },
      { id: "cat6", name: "Fries", icon: "box-tissue" },
      { id: "cat7", name: "Maggi", icon: "bowl-food" },
      { id: "cat8", name: "Mojitos", icon: "glass-water" },
      { id: "cat9", name: "Combo Meals", icon: "utensils" }
    ];
    this.set("categories", categories);

    // 3. Raw Materials (Inventory Ingredients)
    const ingredients = [
      { id: "ing1", name: "Burger Bun", unit: "pcs", stock: 150, minLimit: 30 },
      { id: "ing2", name: "Veg Patty", unit: "pcs", stock: 120, minLimit: 25 },
      { id: "ing3", name: "Cheese Slice", unit: "pcs", stock: 200, minLimit: 40 },
      { id: "ing4", name: "Sandwich Bread", unit: "pcs (slices)", stock: 300, minLimit: 60 },
      { id: "ing5", name: "Frankie Roti", unit: "pcs", stock: 100, minLimit: 20 },
      { id: "ing6", name: "Raw Potatoes", unit: "g", stock: 20000, minLimit: 5000 },
      { id: "ing7", name: "Maggi Packet", unit: "pcs", stock: 80, minLimit: 15 },
      { id: "ing8", name: "Mint Leaves", unit: "g", stock: 1500, minLimit: 300 },
      { id: "ing9", name: "Lime Fruit", unit: "pcs", stock: 60, minLimit: 15 },
      { id: "ing10", name: "Soda Water", unit: "ml", stock: 15000, minLimit: 3000 },
      { id: "ing11", name: "Soft Drink Can", unit: "pcs", stock: 72, minLimit: 12 },
      { id: "ing12", name: "Paneer Blocks", unit: "g", stock: 8000, minLimit: 1500 },
      { id: "ing13", name: "Mayonnaise Sauce", unit: "ml", stock: 5000, minLimit: 1000 },
      { id: "ing14", name: "Chili Sauce", unit: "ml", stock: 3000, minLimit: 800 }
    ];
    this.set("ingredients", ingredients);

    // 4. Products (Menu items with recipe mappings and BOGO tags)
    // Recipe map maps ingredient ID -> required quantity per single item
    const products = [
      // --- BURGERS ---
      // Classic (BOGO: false)
      { id: "p1", name: "Classic Burger", price: 49, category: "cat1", available: true, bogo: false, recipe: { ing1: 1, ing2: 1, ing13: 15 } },
      { id: "p2", name: "Veg Delight Burger", price: 59, category: "cat1", available: true, bogo: false, recipe: { ing1: 1, ing2: 1, ing13: 20 } },
      { id: "p3", name: "Aloo Tikki Burger", price: 69, category: "cat1", available: true, bogo: false, recipe: { ing1: 1, ing2: 1, ing3: 1, ing13: 20 } },
      // Signature (BOGO: true)
      { id: "p4", name: "Makhani Burger", price: 99, category: "cat1", available: true, bogo: true, recipe: { ing1: 1, ing2: 1, ing13: 20 } },
      { id: "p5", name: "Peri Peri Burger", price: 109, category: "cat1", available: true, bogo: true, recipe: { ing1: 1, ing2: 1, ing13: 30 } },
      { id: "p6", name: "Tandoori Burger", price: 109, category: "cat1", available: true, bogo: true, recipe: { ing1: 1, ing2: 1, ing13: 30 } },
      { id: "p7", name: "Spicy Schezwan Burger", price: 119, category: "cat1", available: true, bogo: true, recipe: { ing1: 1, ing2: 1, ing14: 20 } },
      { id: "p8", name: "Achari Masti Burger", price: 119, category: "cat1", available: true, bogo: true, recipe: { ing1: 1, ing2: 1, ing13: 20 } },
      { id: "p9", name: "Pizzeria Burger", price: 119, category: "cat1", available: true, bogo: true, recipe: { ing1: 1, ing2: 1, ing3: 1, ing13: 20 } },
      { id: "p10", name: "Indian Style Burger", price: 129, category: "cat1", available: true, bogo: true, recipe: { ing1: 1, ing2: 1, ing13: 30 } },
      { id: "p11", name: "Afghani Burger", price: 129, category: "cat1", available: true, bogo: true, recipe: { ing1: 1, ing2: 1, ing13: 30 } },
      { id: "p12", name: "Hot & Spicy Chilli Garlic Burger", price: 129, category: "cat1", available: true, bogo: true, recipe: { ing1: 1, ing2: 1, ing14: 30 } },
      { id: "p13", name: "Crust &Chilly Special Burger", price: 149, category: "cat1", available: true, bogo: true, recipe: { ing1: 1, ing2: 1, ing3: 1, ing13: 40 } },
      // Premium (BOGO: true)
      { id: "p14", name: "Cheese Burst Aloo Tikki", price: 129, category: "cat1", available: true, bogo: true, recipe: { ing1: 1, ing2: 1, ing3: 2 } },
      { id: "p15", name: "Cheese Burst Peri Peri", price: 139, category: "cat1", available: true, bogo: true, recipe: { ing1: 1, ing2: 1, ing3: 2, ing13: 20 } },
      { id: "p16", name: "Cheese Burst Tandoori", price: 139, category: "cat1", available: true, bogo: true, recipe: { ing1: 1, ing2: 1, ing3: 2, ing13: 20 } },
      { id: "p17", name: "Cheese Burst Achari Masti", price: 139, category: "cat1", available: true, bogo: true, recipe: { ing1: 1, ing2: 1, ing3: 2, ing13: 20 } },
      { id: "p18", name: "Cheese Burst Spicy Schezwan", price: 149, category: "cat1", available: true, bogo: true, recipe: { ing1: 1, ing2: 1, ing3: 2, ing14: 20 } },
      { id: "p19", name: "Cheese Burst Hot & Spicy Chilli Garlic", price: 149, category: "cat1", available: true, bogo: true, recipe: { ing1: 1, ing2: 1, ing3: 2, ing14: 25 } },
      { id: "p20", name: "Cheese Burst Crust &Chilly Special", price: 159, category: "cat1", available: true, bogo: true, recipe: { ing1: 1, ing2: 1, ing3: 3, ing13: 30 } },

      // --- SLICE SANDWICH (Classic: BOGO false) ---
      { id: "p21", name: "Butter Slice", price: 29, category: "cat2", available: true, bogo: false, recipe: { ing4: 2 } },
      { id: "p22", name: "Sing Sev Slice", price: 35, category: "cat2", available: true, bogo: false, recipe: { ing4: 2 } },
      { id: "p23", name: "Jam Slice", price: 39, category: "cat2", available: true, bogo: false, recipe: { ing4: 2 } },
      { id: "p24", name: "Chocolate Slice", price: 39, category: "cat2", available: true, bogo: false, recipe: { ing4: 2 } },
      { id: "p25", name: "Cheese Slice", price: 39, category: "cat2", available: true, bogo: false, recipe: { ing4: 2, ing3: 1 } },
      { id: "p26", name: "Cheese Chutney Slice", price: 49, category: "cat2", available: true, bogo: false, recipe: { ing4: 2, ing3: 1 } },
      { id: "p27", name: "Cheese Jam Slice", price: 49, category: "cat2", available: true, bogo: false, recipe: { ing4: 2, ing3: 1 } },
      { id: "p28", name: "Cheese Chocolate Slice", price: 49, category: "cat2", available: true, bogo: false, recipe: { ing4: 2, ing3: 1 } },

      // --- 3 LAYER SANDWICH ---
      // Classic (BOGO: false)
      { id: "p29", name: "Veg Sandwich", price: 79, category: "cat3", available: true, bogo: false, recipe: { ing4: 3 } },
      { id: "p30", name: "Veg Cheese Sandwich", price: 109, category: "cat3", available: true, bogo: false, recipe: { ing4: 3, ing3: 1 } },
      { id: "p31", name: "Coleslaw Cheese Sandwich", price: 109, category: "cat3", available: true, bogo: false, recipe: { ing4: 3, ing3: 1 } },
      { id: "p32", name: "Cheese Chutney Sandwich", price: 119, category: "cat3", available: true, bogo: false, recipe: { ing4: 3, ing3: 1 } },
      // Signature (BOGO: true)
      { id: "p33", name: "Junglee Sandwich", price: 169, category: "cat3", available: true, bogo: true, recipe: { ing4: 3, ing3: 1 } },
      { id: "p34", name: "Pizzeria Sandwich", price: 179, category: "cat3", available: true, bogo: true, recipe: { ing4: 3, ing3: 1 } },
      { id: "p35", name: "1000 Island Sandwich", price: 179, category: "cat3", available: true, bogo: true, recipe: { ing4: 3, ing3: 1 } },
      { id: "p36", name: "Peri Peri Sandwich", price: 189, category: "cat3", available: true, bogo: true, recipe: { ing4: 3, ing3: 1 } },
      { id: "p37", name: "Tandoori Sandwich", price: 189, category: "cat3", available: true, bogo: true, recipe: { ing4: 3, ing3: 1 } },
      { id: "p38", name: "Spicy Schezwan Sandwich", price: 189, category: "cat3", available: true, bogo: true, recipe: { ing4: 3, ing3: 1 } },
      { id: "p39", name: "Afghani Sandwich", price: 189, category: "cat3", available: true, bogo: true, recipe: { ing4: 3, ing3: 1 } },
      { id: "p40", name: "Achari Masti Sandwich", price: 189, category: "cat3", available: true, bogo: true, recipe: { ing4: 3, ing3: 1 } },
      { id: "p41", name: "Makhani Sandwich", price: 189, category: "cat3", available: true, bogo: true, recipe: { ing4: 3, ing3: 1 } },
      { id: "p42", name: "Hot & Spicy Chilli Garlic Sandwich", price: 189, category: "cat3", available: true, bogo: true, recipe: { ing4: 3, ing3: 1 } },
      // Premium (BOGO: true)
      { id: "p43", name: "Tandoori Paneer Sandwich", price: 199, category: "cat3", available: true, bogo: true, recipe: { ing4: 3, ing3: 1, ing12: 50 } },
      { id: "p44", name: "Peri Peri Paneer Sandwich", price: 199, category: "cat3", available: true, bogo: true, recipe: { ing4: 3, ing3: 1, ing12: 50 } },
      { id: "p45", name: "Afghani Garlic Paneer Sandwich", price: 209, category: "cat3", available: true, bogo: true, recipe: { ing4: 3, ing3: 1, ing12: 50 } },
      { id: "p46", name: "Spicy Schezwan Paneer Sandwich", price: 209, category: "cat3", available: true, bogo: true, recipe: { ing4: 3, ing3: 1, ing12: 50 } },
      { id: "p47", name: "Crust &Chilly Premium Sandwich", price: 219, category: "cat3", available: true, bogo: true, recipe: { ing4: 3, ing3: 2, ing12: 60 } },

      // --- FRANKIE (BOGO: false) ---
      { id: "p48", name: "Veg Delight Frankie", price: 129, category: "cat4", available: true, bogo: false, recipe: { ing5: 1 } },
      { id: "p49", name: "Corn Delight Frankie", price: 139, category: "cat4", available: true, bogo: false, recipe: { ing5: 1 } },
      { id: "p50", name: "Paneer Delight Frankie", price: 139, category: "cat4", available: true, bogo: false, recipe: { ing5: 1, ing12: 50 } },
      { id: "p51", name: "Cheese Chilli Paneer Frankie", price: 149, category: "cat4", available: true, bogo: false, recipe: { ing5: 1, ing12: 50, ing3: 1 } },
      { id: "p52", name: "Cheese Chilli Corn Frankie", price: 149, category: "cat4", available: true, bogo: false, recipe: { ing5: 1, ing3: 1 } },
      { id: "p53", name: "Tandoori Frankie", price: 169, category: "cat4", available: true, bogo: false, recipe: { ing5: 1 } },
      { id: "p54", name: "Peri Peri Frankie", price: 169, category: "cat4", available: true, bogo: false, recipe: { ing5: 1 } },
      { id: "p55", name: "Crust & Chilly Special Frankie", price: 189, category: "cat4", available: true, bogo: false, recipe: { ing5: 1, ing3: 1, ing12: 55 } },

      // --- TIKKA PAV ---
      // Classic (BOGO: false)
      { id: "p56", name: "Veg Delight Tikka Pav", price: 129, category: "cat5", available: true, bogo: false, recipe: { ing1: 1 } },
      { id: "p57", name: "Makhani Tikka Pav", price: 139, category: "cat5", available: true, bogo: false, recipe: { ing1: 1 } },
      // Signature (BOGO: true)
      { id: "p58", name: "Pizzeria Tikka Pav", price: 159, category: "cat5", available: true, bogo: true, recipe: { ing1: 1, ing3: 1 } },
      { id: "p59", name: "1000 Island Tikka Pav", price: 159, category: "cat5", available: true, bogo: true, recipe: { ing1: 1 } },
      { id: "p60", name: "Achari Masti Tikka Pav", price: 169, category: "cat5", available: true, bogo: true, recipe: { ing1: 1 } },
      { id: "p61", name: "Spicy Schezwan Tikka Pav", price: 169, category: "cat5", available: true, bogo: true, recipe: { ing1: 1 } },
      { id: "p62", name: "Indian Style Tikka Pav", price: 169, category: "cat5", available: true, bogo: true, recipe: { ing1: 1 } },
      // Premium (BOGO: true)
      { id: "p63", name: "Tandoori Tikka Pav", price: 179, category: "cat5", available: true, bogo: true, recipe: { ing1: 1, ing3: 1 } },
      { id: "p64", name: "Peri Peri Tikka Pav", price: 179, category: "cat5", available: true, bogo: true, recipe: { ing1: 1, ing3: 1 } },
      { id: "p65", name: "Afghani Garlic Tikka Pav", price: 189, category: "cat5", available: true, bogo: true, recipe: { ing1: 1 } },
      { id: "p66", name: "Hot & Spicy Chilli Garlic Tikka Pav", price: 179, category: "cat5", available: true, bogo: true, recipe: { ing1: 1 } },
      { id: "p67", name: "Crust & Chilly Special Tikka Pav", price: 199, category: "cat5", available: true, bogo: true, recipe: { ing1: 1, ing3: 1 } },

      // --- FRIES (BOGO: false) ---
      { id: "p68", name: "Golden Fries", price: 79, category: "cat6", available: true, bogo: false, recipe: { ing6: 150 } },
      { id: "p69", name: "Peri Peri Fries", price: 99, category: "cat6", available: true, bogo: false, recipe: { ing6: 150 } },
      { id: "p70", name: "Cheesy Loaded Fries", price: 119, category: "cat6", available: true, bogo: false, recipe: { ing6: 200, ing3: 1 } },

      // --- MAGGI (BOGO: false) ---
      { id: "p71", name: "Classic Masala Maggi", price: 59, category: "cat7", available: true, bogo: false, recipe: { ing7: 1 } },
      { id: "p72", name: "Tadka Maggi", price: 79, category: "cat7", available: true, bogo: false, recipe: { ing7: 1 } },
      { id: "p73", name: "Veg Loaded Maggi", price: 89, category: "cat7", available: true, bogo: false, recipe: { ing7: 1 } },
      { id: "p74", name: "Cheese Burst Maggi", price: 99, category: "cat7", available: true, bogo: false, recipe: { ing7: 1, ing3: 1 } },
      { id: "p75", name: "Cheese Burst Tadka Maggi", price: 109, category: "cat7", available: true, bogo: false, recipe: { ing7: 1, ing3: 1 } },
      { id: "p76", name: "Cheese Burst Veg Loaded Maggi", price: 119, category: "cat7", available: true, bogo: false, recipe: { ing7: 1, ing3: 1 } },

      // --- MOJITOS (BOGO: false) ---
      { id: "p77", name: "Mint Mojito", price: 99, category: "cat8", available: true, bogo: false, recipe: { ing8: 15, ing9: 1, ing10: 250 } },
      { id: "p78", name: "Blue Lagoon Mojito", price: 99, category: "cat8", available: true, bogo: false, recipe: { ing8: 15, ing9: 1, ing10: 250 } },
      { id: "p79", name: "Blue Berry Mojito", price: 99, category: "cat8", available: true, bogo: false, recipe: { ing8: 15, ing9: 1, ing10: 250 } },
      { id: "p80", name: "Green Apple Mojito", price: 99, category: "cat8", available: true, bogo: false, recipe: { ing8: 15, ing9: 1, ing10: 250 } },

      // --- COMBO MEALS (BOGO: false) ---
      { id: "p81", name: "Signature Burger + Fries + Cold Drink Combo", price: 149, category: "cat9", available: true, bogo: false, recipe: { ing1: 1, ing2: 1, ing6: 100, ing11: 1 } },
      { id: "p82", name: "Premium Burger + Fries + Mojito Combo", price: 199, category: "cat9", available: true, bogo: false, recipe: { ing1: 1, ing2: 1, ing3: 1, ing6: 100, ing8: 15, ing9: 1, ing10: 250 } },
      { id: "p83", name: "Signature Sandwich + Fries + Cold Drink Combo", price: 199, category: "cat9", available: true, bogo: false, recipe: { ing4: 3, ing6: 100, ing11: 1 } },
      { id: "p84", name: "Premium Sandwich + Fries + Mojito Combo", price: 249, category: "cat9", available: true, bogo: false, recipe: { ing4: 3, ing3: 1, ing6: 100, ing8: 15, ing9: 1, ing10: 250 } },
      { id: "p85", name: "Signature Tikka Pav + Fries + Cold Drink Combo", price: 179, category: "cat9", available: true, bogo: false, recipe: { ing1: 1, ing6: 100, ing11: 1 } },
      { id: "p86", name: "Premium Tikka Pav + Fries + Mojito Combo", price: 249, category: "cat9", available: true, bogo: false, recipe: { ing1: 1, ing3: 1, ing6: 100, ing8: 15, ing9: 1, ing10: 250 } }
    ];
    this.set("products", products);

    // 5. System Settings
    const settings = {
      restaurantName: "Crust & Chilly",
      gstPercentage: 5,
      enableGst: false,
      serviceCharge: 0,
      currencySymbol: "₹",
      phone: "096648 70840",
      address: "Shop-09, Shree sanidhya flora, Turquoise BLU Rd, Shela, Ahmedabad, Gujarat 380057",
      upiId: "7487980840@okbizaxis"
    };
    this.set("settings", settings);

    // 6. Generate historical and current Orders
    const orders = [];
    const expenses = [];
    const today = new Date();

    // Setup helper to create historical dates
    const getPastDateStr = (daysAgo, hour = 12) => {
      const d = new Date(today);
      d.setDate(today.getDate() - daysAgo);
      d.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
      return d.toISOString();
    };

    // Generate orders for the past 7 days
    let orderCounter = 1000;
    const paymentMethods = ["UPI", "Cash", "Card"];
    const statuses = ["Completed", "Completed", "Completed", "Cancelled", "Completed"]; // skewed to completed

    for (let day = 7; day >= 0; day--) {
      // 2 to 5 orders per day
      const ordersCount = day === 0 ? 6 : Math.floor(Math.random() * 4) + 2;
      for (let j = 0; j < ordersCount; j++) {
        orderCounter++;

        // Random items (1 to 3 items per order)
        const items = [];
        const itemCount = Math.min(products.length, Math.floor(Math.random() * 3) + 1);
        let subtotal = 0;

        // Choose items randomly, ensuring uniqueness in single cart order
        const chosenProducts = [];
        while (chosenProducts.length < itemCount) {
          const randProd = products[Math.floor(Math.random() * products.length)];
          if (!chosenProducts.includes(randProd)) {
            chosenProducts.push(randProd);
          }
        }

        for (let k = 0; k < itemCount; k++) {
          const prod = chosenProducts[k];
          const qty = Math.floor(Math.random() * 2) + 1;

          // Calculate BOGO discount if applicable
          let bogoApplied = prod.bogo && qty >= 2;
          let chargedQty = qty;
          if (bogoApplied) {
            chargedQty = Math.ceil(qty / 2);
          }

          const lineTotal = prod.price * chargedQty;

          items.push({
            productId: prod.id,
            name: prod.name,
            price: prod.price,
            quantity: qty,
            bogo: prod.bogo,
            lineTotal: lineTotal
          });
          subtotal += lineTotal;
        }

        const discount = Math.random() > 0.7 ? (Math.random() > 0.5 ? 50 : 20) : 0;
        const netBeforeTax = Math.max(0, subtotal - discount);
        const gstVal = Math.round(netBeforeTax * (settings.gstPercentage / 100) * 100) / 100;
        const total = netBeforeTax + gstVal;

        const time = getPastDateStr(day, 11 + Math.floor(Math.random() * 10)); // between 11 AM and 9 PM

        orders.push({
          id: `ORD-${orderCounter}`,
          orderNumber: orderCounter,
          customerName: Math.random() > 0.5 ? ["Yash", "Sanket", "Pooja", "Amit", "Kunal"][Math.floor(Math.random() * 5)] : "Walk-in Customer",
          customerPhone: Math.random() > 0.5 ? "9988776655" : "",
          items: items,
          subtotal: subtotal,
          discount: discount,
          tax: gstVal,
          total: total,
          type: Math.random() > 0.4 ? "Dine-in" : "Takeaway",
          paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
          status: day === 0 && j >= 4 ? (j === 4 ? "Preparing" : "Pending") : statuses[Math.floor(Math.random() * statuses.length)],
          createdAt: time
        });
      }

      // Add 1 or 2 expenses per day
      const expCategories = ["Raw material", "Electricity", "Salary", "Delivery", "Other expenses"];
      const expCount = Math.floor(Math.random() * 2) + 1;
      for (let e = 0; e < expCount; e++) {
        const cat = expCategories[Math.floor(Math.random() * expCategories.length)];
        let amount = 0;
        let desc = "";

        if (cat === "Raw material") {
          amount = Math.floor(Math.random() * 800) + 200;
          desc = "Vegetables & sauces purchase from local vendor";
        } else if (cat === "Electricity") {
          if (day === 5) {
            amount = 3500;
            desc = "Monthly electricity bill payment";
          } else {
            amount = Math.floor(Math.random() * 100) + 50;
            desc = "Gas tank refill contribution";
          }
        } else if (cat === "Salary") {
          if (day === 7) {
            amount = 5000;
            desc = "Weekly part-time helper salary";
          } else {
            continue;
          }
        } else if (cat === "Delivery") {
          amount = Math.floor(Math.random() * 150) + 50;
          desc = "Delivery boy fuel allowance";
        } else {
          amount = Math.floor(Math.random() * 200) + 30;
          desc = "Cleaning items / napkins purchase";
        }

        expenses.push({
          id: `EXP-${1000 + expenses.length}`,
          category: cat,
          amount: amount,
          description: desc,
          createdAt: getPastDateStr(day, 10 + Math.floor(Math.random() * 8))
        });
      }
    }

    this.set("orders", orders);
    this.set("expenses", expenses);

    // Track order sequence
    this.set("orderCounter", orderCounter);

    // Track stock purchase log
    const purchases = [
      { id: "PUR-101", date: getPastDateStr(5), items: [{ ingredientId: "ing1", quantity: 100, cost: 400 }, { ingredientId: "ing2", quantity: 100, cost: 1200 }], totalCost: 1600, supplier: "Apex Bakery" },
      { id: "PUR-102", date: getPastDateStr(2), items: [{ ingredientId: "ing3", quantity: 200, cost: 1000 }, { ingredientId: "ing6", quantity: 20000, cost: 700 }], totalCost: 1700, supplier: "Fresh Farms" }
    ];
    this.set("purchases", purchases);
  },

  // Helper APIs for CRUD

  // Auth Helpers
  login(username, password) {
    const users = this.get("users") || [];
    const user = users.find(u => u.username === username.toLowerCase().trim() && u.password === password);
    if (user) {
      sessionStorage.setItem("cc_session_user", JSON.stringify(user));
      return { success: true, user };
    }
    return { success: false, message: "Invalid credentials" };
  },

  getCurrentUser() {
    const session = sessionStorage.getItem("cc_session_user");
    return session ? JSON.parse(session) : null;
  },

  logout() {
    sessionStorage.removeItem("cc_session_user");
  },

  // Recipe Stock checks
  checkStockAvailability(productId, qtyNeeded = 1) {
    const products = this.get("products") || [];
    const ingredients = this.get("ingredients") || [];
    const product = products.find(p => p.id === productId);

    if (!product || !product.recipe) return { available: true }; // No recipe means service item or simple product

    const issues = [];

    for (const [ingId, amount] of Object.entries(product.recipe)) {
      const ing = ingredients.find(i => i.id === ingId);
      if (!ing) continue;

      const totalRequired = amount * qtyNeeded;
      if (ing.stock < totalRequired) {
        issues.push({
          ingredientId: ingId,
          name: ing.name,
          currentStock: ing.stock,
          required: totalRequired,
          shortage: totalRequired - ing.stock,
          unit: ing.unit
        });
      }
    }

    return {
      available: issues.length === 0,
      issues: issues
    };
  },

  // Transactional order submission
  createOrder(orderData) {
    // 1. Lock and decrement stock for all items
    const ingredients = this.get("ingredients") || [];
    const products = this.get("products") || [];

    // Perform aggregate recipe requirements check first
    const aggregatedIngredientsNeeded = {};

    for (const item of orderData.items) {
      const product = products.find(p => p.id === item.productId);
      if (product && product.recipe) {
        for (const [ingId, reqQty] of Object.entries(product.recipe)) {
          const totalReq = reqQty * item.quantity;
          aggregatedIngredientsNeeded[ingId] = (aggregatedIngredientsNeeded[ingId] || 0) + totalReq;
        }
      }
    }

    // Verify all aggregated ingredients exist in stock
    const stockIssues = [];
    for (const [ingId, totalNeeded] of Object.entries(aggregatedIngredientsNeeded)) {
      const ing = ingredients.find(i => i.id === ingId);
      if (!ing) continue;
      if (ing.stock < totalNeeded) {
        stockIssues.push({
          name: ing.name,
          current: ing.stock,
          needed: totalNeeded,
          unit: ing.unit
        });
      }
    }

    if (stockIssues.length > 0) {
      return {
        success: false,
        message: "Insufficient raw materials in stock to complete this order.",
        details: stockIssues
      };
    }

    // 2. Deduct Stock
    for (const [ingId, totalNeeded] of Object.entries(aggregatedIngredientsNeeded)) {
      const ingIndex = ingredients.findIndex(i => i.id === ingId);
      if (ingIndex !== -1) {
        ingredients[ingIndex].stock = Math.max(0, ingredients[ingIndex].stock - totalNeeded);
      }
    }
    this.set("ingredients", ingredients); // save updated ingredients back

    // 3. Create the Order
    const orders = this.get("orders") || [];
    const nextCounter = (this.get("orderCounter") || 1000) + 1;
    this.set("orderCounter", nextCounter);

    const newOrder = {
      id: `ORD-${nextCounter}`,
      orderNumber: nextCounter,
      customerName: orderData.customerName || "Walk-in Customer",
      customerPhone: orderData.customerPhone || "",
      items: orderData.items,
      subtotal: orderData.subtotal,
      discount: orderData.discount || 0,
      bogoDiscount: orderData.bogoDiscount || 0,
      tax: orderData.tax || 0,
      total: orderData.total,
      type: orderData.type || "Dine-in", // Dine-in or Takeaway
      paymentMethod: orderData.paymentMethod || "Cash", // Cash, UPI, Card
      status: "Pending", // Pending, Preparing, Ready, Completed, Cancelled
      createdAt: new Date().toISOString()
    };

    orders.unshift(newOrder); // Add to top
    this.set("orders", orders);

    return {
      success: true,
      order: newOrder
    };
  },

  // Update order status (Pending -> Preparing -> Ready -> Completed / Cancelled)
  updateOrderStatus(orderId, newStatus) {
    const orders = this.get("orders") || [];
    const index = orders.findIndex(o => o.id === orderId);

    if (index !== -1) {
      const oldStatus = orders[index].status;
      orders[index].status = newStatus;

      // If an order is Cancelled, should we refund the inventory?
      // Yes! To represent a realistic POS system, canceling a pending/preparing order returns ingredients back to stock.
      if (newStatus === "Cancelled" && oldStatus !== "Cancelled" && oldStatus !== "Completed") {
        const ingredients = this.get("ingredients") || [];
        const products = this.get("products") || [];

        for (const item of orders[index].items) {
          const product = products.find(p => p.id === item.productId);
          if (product && product.recipe) {
            for (const [ingId, reqQty] of Object.entries(product.recipe)) {
              const totalRefund = reqQty * item.quantity;
              const ingIndex = ingredients.findIndex(i => i.id === ingId);
              if (ingIndex !== -1) {
                ingredients[ingIndex].stock += totalRefund;
              }
            }
          }
        }
        this.set("ingredients", ingredients);
      }

      this.set("orders", orders);
      return { success: true, order: orders[index] };
    }
    return { success: false, message: "Order not found" };
  },

  // Ingredient restock or adjustment
  recordPurchase(purchaseData) {
    const purchases = this.get("purchases") || [];
    const ingredients = this.get("ingredients") || [];

    // Add purchase
    const nextId = `PUR-${100 + purchases.length + 1}`;
    const newPurchase = {
      id: nextId,
      date: new Date().toISOString(),
      items: purchaseData.items, // Array of { ingredientId, quantity, cost }
      totalCost: purchaseData.totalCost,
      supplier: purchaseData.supplier || "Local Supplier"
    };

    // Update stock levels
    for (const item of purchaseData.items) {
      const ingIndex = ingredients.findIndex(i => i.id === item.ingredientId);
      if (ingIndex !== -1) {
        ingredients[ingIndex].stock += Number(item.quantity);
      }
    }

    purchases.unshift(newPurchase);
    this.set("purchases", purchases);
    this.set("ingredients", ingredients);

    // Automatically log this as an expense in 'Raw material' category
    this.createExpense({
      category: "Raw material",
      amount: purchaseData.totalCost,
      description: `Stock Purchase ${nextId} from ${newPurchase.supplier}`
    });

    return { success: true, purchase: newPurchase };
  },

  createExpense(expenseData) {
    const expenses = this.get("expenses") || [];
    const newExpense = {
      id: `EXP-${1000 + expenses.length + 1}`,
      category: expenseData.category || "Other expenses",
      amount: Number(expenseData.amount),
      description: expenseData.description || "",
      createdAt: new Date().toISOString()
    };
    expenses.unshift(newExpense);
    this.set("expenses", expenses);
    return newExpense;
  },

  deleteExpense(expenseId) {
    const expenses = this.get("expenses") || [];
    const filtered = expenses.filter(e => e.id !== expenseId);
    this.set("expenses", filtered);
    return { success: true };
  },

  // Category & Product configuration CRUDs
  saveCategory(catData) {
    const categories = this.get("categories") || [];
    if (catData.id) {
      // Edit
      const index = categories.findIndex(c => c.id === catData.id);
      if (index !== -1) {
        categories[index] = { ...categories[index], ...catData };
      }
    } else {
      // Add
      const newCat = {
        id: `cat${categories.length + 1}`,
        name: catData.name,
        icon: catData.icon || "hamburger"
      };
      categories.push(newCat);
    }
    this.set("categories", categories);
    return { success: true };
  },

  deleteCategory(catId) {
    const categories = this.get("categories") || [];
    const filtered = categories.filter(c => c.id !== catId);
    this.set("categories", filtered);

    // Disable products belonging to deleted category
    const products = this.get("products") || [];
    const updatedProducts = products.map(p => {
      if (p.category === catId) {
        return { ...p, available: false };
      }
      return p;
    });
    this.set("products", updatedProducts);
    return { success: true };
  },

  saveProduct(prodData) {
    const products = this.get("products") || [];
    if (prodData.id) {
      // Edit
      const index = products.findIndex(p => p.id === prodData.id);
      if (index !== -1) {
        products[index] = { ...products[index], ...prodData };
      }
    } else {
      // Add
      const newProd = {
        id: `p${products.length + 1}`,
        name: prodData.name,
        price: Number(prodData.price),
        category: prodData.category,
        available: prodData.available !== undefined ? prodData.available : true,
        bogo: prodData.bogo !== undefined ? prodData.bogo : false,
        recipe: prodData.recipe || {}
      };
      products.push(newProd);
    }
    this.set("products", products);
    return { success: true };
  },

  deleteProduct(prodId) {
    const products = this.get("products") || [];
    const filtered = products.filter(p => p.id !== prodId);
    this.set("products", filtered);
    return { success: true };
  },

  saveIngredient(ingData) {
    const ingredients = this.get("ingredients") || [];
    if (ingData.id) {
      const index = ingredients.findIndex(i => i.id === ingData.id);
      if (index !== -1) {
        ingredients[index] = { ...ingredients[index], ...ingData };
      }
    } else {
      const newIng = {
        id: `ing${ingredients.length + 1}`,
        name: ingData.name,
        unit: ingData.unit || "pcs",
        stock: Number(ingData.stock) || 0,
        minLimit: Number(ingData.minLimit) || 10
      };
      ingredients.push(newIng);
    }
    this.set("ingredients", ingredients);
    return { success: true };
  },

  deleteIngredient(ingId) {
    const ingredients = this.get("ingredients") || [];
    const filtered = ingredients.filter(i => i.id !== ingId);
    this.set("ingredients", filtered);
    return { success: true };
  }
};

// Expose on window for easy access
window.db = db;

// Force reset database once if version changes, to automatically load the user's custom menu list
const TARGET_MENU_VERSION = "crust_chilly_v3";
if (localStorage.getItem("cc_pos_menu_version") !== TARGET_MENU_VERSION) {
  db.init(true); // Wipes old local storage key prefix & reseeds
  localStorage.setItem("cc_pos_menu_version", TARGET_MENU_VERSION);
  console.log("Database reset: Crust & Chilly seed menu updated to version: " + TARGET_MENU_VERSION);
} else {
  db.init(); // Ordinary load
}
