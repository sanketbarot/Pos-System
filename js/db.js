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
    this.syncToFirebase(key, val);
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

      // Auto-update Farali category and products if not present
      const currentCategories = this.get("categories") || [];
      let faraliCat = currentCategories.find(c => c.name.toLowerCase() === "farali" || c.id === "cat11");
      if (!faraliCat) {
        const maxCatNum = currentCategories.reduce((max, c) => {
          const num = parseInt(c.id.replace(/\D/g, ""), 10);
          return isNaN(num) ? max : Math.max(max, num);
        }, 0);
        faraliCat = { id: `cat${Math.max(11, maxCatNum + 1)}`, name: "Farali", icon: "bowl-rice" };
        currentCategories.push(faraliCat);
        this.set("categories", currentCategories);
      }

      const currentProducts = this.get("products") || [];
      let productsUpdated = false;
      if (!currentProducts.some(p => p.name.toLowerCase() === "farali bhel")) {
        const maxProdNum = currentProducts.reduce((max, p) => {
          const num = parseInt(p.id.replace(/\D/g, ""), 10);
          return isNaN(num) ? max : Math.max(max, num);
        }, 0);
        currentProducts.push({
          id: `p${Math.max(92, maxProdNum + 1)}`,
          name: "Farali Bhel",
          price: 89,
          category: faraliCat.id,
          available: true,
          bogo: false,
          recipe: {}
        });
        productsUpdated = true;
      }
      if (!currentProducts.some(p => p.name.toLowerCase() === "cheese farali bhel")) {
        const maxProdNum = currentProducts.reduce((max, p) => {
          const num = parseInt(p.id.replace(/\D/g, ""), 10);
          return isNaN(num) ? max : Math.max(max, num);
        }, 0);
        currentProducts.push({
          id: `p${Math.max(93, maxProdNum + 1)}`,
          name: "Cheese Farali Bhel",
          price: 119,
          category: faraliCat.id,
          available: true,
          bogo: false,
          recipe: {}
        });
        productsUpdated = true;
      }
      // Auto-update Cheese Blast items to end with ' Burger'
      currentProducts.forEach(p => {
        if (p.name && p.name.toLowerCase().startsWith("cheese blast") && !p.name.toLowerCase().endsWith("burger")) {
          p.name = p.name + " Burger";
          productsUpdated = true;
        }
      });

      if (productsUpdated) {
        this.set("products", currentProducts);
      }
    }

    // Force clear old testing transactional data for live launch (preserving menu/catalog config)
    const cleanupKey = "cc_pos_live_cleanup_v1";
    if (!localStorage.getItem(cleanupKey)) {
      this.set("orders", []);
      this.set("expenses", []);
      this.set("purchases", []);
      this.set("orderCounter", 1000);
      localStorage.setItem(cleanupKey, "true");
      console.log("Crust & Chilly POS: Old testing transaction data wiped successfully.");
    }

    // Initialize Firebase
    try {
      const firebaseConfig = {
        apiKey: "AIzaSyCsVef4qZTTnzJXWFU_kpLWFYrtJiWEtYE",
        authDomain: "crust-chilly-pos.firebaseapp.com",
        projectId: "crust-chilly-pos",
        storageBucket: "crust-chilly-pos.firebasestorage.app",
        messagingSenderId: "458423437579",
        appId: "1:458423437579:web:e3e58c9bf3e2b0cd79fa0e"
      };

      if (typeof firebase !== "undefined") {
        if (!firebase.apps.length) {
          firebase.initializeApp(firebaseConfig);
        }
        this.fs = firebase.firestore();

        // Enable offline persistence
        this.fs.enablePersistence().catch(err => {
          console.warn("Firestore offline persistence warning:", err.code);
        });

        // Real-time synchronization of local keys with Firestore documents
        const SYNC_KEYS = ["users", "categories", "ingredients", "products", "settings", "permissions", "orders", "expenses", "purchases", "orderCounter"];
        SYNC_KEYS.forEach(key => {
          this.fs.collection("cc_pos").doc(key).onSnapshot(doc => {
            if (doc.exists) {
              const dataObj = doc.data();
              let val = null;
              if (key === "settings" || key === "permissions") {
                val = dataObj.data;
              } else if (key === "orderCounter") {
                val = dataObj.value;
              } else {
                val = dataObj.list;
              }

              const localStr = localStorage.getItem(DB_PREFIX + key);
              const remoteStr = JSON.stringify(val);
              if (localStr !== remoteStr) {
                localStorage.setItem(DB_PREFIX + key, remoteStr);
                window.dispatchEvent(new Event("db-update"));

                // Force view reload on updates to dynamically sync active UI states (e.g., dashboard, orders, KDS)
                if (window.app) {
                  const currentHash = window.location.hash.replace("#", "") || "dashboard";
                  if (currentHash === "orders" || currentHash === "dashboard" || currentHash === "pos") {
                    window.app.loadView(currentHash);
                  }
                }
              }
            } else {
              // If document is not in cloud, seed it using our local copy
              const localData = this.get(key);
              if (localData !== null) {
                this.syncToFirebase(key, localData);
              }
            }
          });
        });
      }
    } catch (e) {
      console.error("Firebase SDK initialization failed:", e);
    }
  },

  // Asynchronous backup sync to Cloud Firestore
  syncToFirebase(key, val) {
    if (!this.fs) return;
    let dataObj = {};
    if (key === "settings" || key === "permissions") {
      dataObj = { data: val };
    } else if (key === "orderCounter") {
      dataObj = { value: val };
    } else {
      dataObj = { list: val };
    }
    this.fs.collection("cc_pos").doc(key).set(dataObj).catch(err => {
      console.error(`Error syncing ${key} to Firebase:`, err);
    });
  },

  seedData() {
    // 1. Users Setup (Admin / Manager / Staff)
    const users = [
      { id: "u1", username: "sanketadmin", password: "Sanket@3901", role: "admin", name: "Sanket Barot (Admin)" },
      { id: "u2", username: "manager", password: "Crust&Chilly@2", role: "manager", name: "Crust & Chilly Manager" },
      { id: "u3", username: "staff", password: "Crust&Chilly@1", role: "staff", name: "Crust & Chilly Staff" }
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
      { id: "cat9", name: "Combo Meals", icon: "utensils" },
      { id: "cat10", name: "Cold Drinks & Water", icon: "glass-water" },
      { id: "cat11", name: "Farali", icon: "bowl-rice" }
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
      { id: "p14", name: "Cheese Blast Aloo Tikki Burger", price: 129, category: "cat1", available: true, bogo: true, recipe: { ing1: 1, ing2: 1, ing3: 2 } },
      { id: "p15", name: "Cheese Blast Peri Peri Burger", price: 139, category: "cat1", available: true, bogo: true, recipe: { ing1: 1, ing2: 1, ing3: 2, ing13: 20 } },
      { id: "p16", name: "Cheese Blast Tandoori Burger", price: 139, category: "cat1", available: true, bogo: true, recipe: { ing1: 1, ing2: 1, ing3: 2, ing13: 20 } },
      { id: "p17", name: "Cheese Blast Achari Masti Burger", price: 139, category: "cat1", available: true, bogo: true, recipe: { ing1: 1, ing2: 1, ing3: 2, ing13: 20 } },
      { id: "p18", name: "Cheese Blast Spicy Schezwan Burger", price: 149, category: "cat1", available: true, bogo: true, recipe: { ing1: 1, ing2: 1, ing3: 2, ing14: 20 } },
      { id: "p19", name: "Cheese Blast Hot & Spicy Chilli Garlic Burger", price: 149, category: "cat1", available: true, bogo: true, recipe: { ing1: 1, ing2: 1, ing3: 2, ing14: 25 } },
      { id: "p20", name: "Cheese Blast Crust &Chilly Special Burger", price: 159, category: "cat1", available: true, bogo: true, recipe: { ing1: 1, ing2: 1, ing3: 3, ing13: 30 } },

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
      { id: "p74", name: "Cheese Blast Maggi", price: 99, category: "cat7", available: true, bogo: false, recipe: { ing7: 1, ing3: 1 } },
      { id: "p75", name: "Cheese Blast Tadka Maggi", price: 109, category: "cat7", available: true, bogo: false, recipe: { ing7: 1, ing3: 1 } },
      { id: "p76", name: "Cheese Blast Veg Loaded Maggi", price: 119, category: "cat7", available: true, bogo: false, recipe: { ing7: 1, ing3: 1 } },

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
      { id: "p86", name: "Premium Tikka Pav + Fries + Mojito Combo", price: 249, category: "cat9", available: true, bogo: false, recipe: { ing1: 1, ing3: 1, ing6: 100, ing8: 15, ing9: 1, ing10: 250 } },

      // --- COLD DRINKS & WATER ---
      { id: "p87", name: "Cold Drink (Small)", price: 10, category: "cat10", available: true, bogo: false, recipe: {} },
      { id: "p88", name: "Cold Drink (Medium)", price: 20, category: "cat10", available: true, bogo: false, recipe: {} },
      { id: "p89", name: "Cold Drink (Large)", price: 30, category: "cat10", available: true, bogo: false, recipe: {} },
      { id: "p90", name: "Water Bottle (Small)", price: 10, category: "cat10", available: true, bogo: false, recipe: {} },
      { id: "p91", name: "Water Bottle (Large)", price: 20, category: "cat10", available: true, bogo: false, recipe: {} },

      // --- FARALI ---
      { id: "p92", name: "Farali Bhel", price: 89, category: "cat11", available: true, bogo: false, recipe: {} },
      { id: "p93", name: "Cheese Farali Bhel", price: 119, category: "cat11", available: true, bogo: false, recipe: {} }
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

    // 6. Initialize empty lists for transactions (clean start)
    this.set("orders", []);
    this.set("expenses", []);
    this.set("purchases", []);
    this.set("orderCounter", 1000);

    // 7. Initialize default permissions matrix
    const permissions = {
      admin: ["dashboard", "pos", "orders", "menu", "reports"],
      manager: ["dashboard", "pos", "orders", "menu"],
      staff: ["pos", "orders"]
    };
    this.set("permissions", permissions);
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
    return {
      available: true,
      issues: []
    };
  },

  // Transactional order submission
  createOrder(orderData, bypassStockCheck = false) {
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
    /*
    if (!bypassStockCheck) {
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
    }
    */

    if (stockIssues.length > 0) {
      return {
        success: false,
        message: "Insufficient raw materials in stock to complete this order.",
        details: stockIssues
      };
    }

    // 2. Deduct Stock (Bypassed - company has full stock)
    /*
    for (const [ingId, totalNeeded] of Object.entries(aggregatedIngredientsNeeded)) {
      const ingIndex = ingredients.findIndex(i => i.id === ingId);
      if (ingIndex !== -1) {
        ingredients[ingIndex].stock = Math.max(0, ingredients[ingIndex].stock - totalNeeded);
      }
    }
    this.set("ingredients", ingredients); // save updated ingredients back
    */

    // 3. Create the Order
    const orders = this.get("orders") || [];
    const nextCounter = (this.get("orderCounter") || 1000) + 1;
    this.set("orderCounter", nextCounter);

    // Calculate daily token number (starts from 1, resets daily based on IST)
    const getIstDateString = (dateObj) => {
      const date = dateObj || new Date();
      // IST is UTC + 5:30
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istDate = new Date(date.getTime() + istOffset);
      const yyyy = istDate.getUTCFullYear();
      const mm = String(istDate.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(istDate.getUTCDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    const now = new Date();
    const todayIstStr = getIstDateString(now);

    const todayOrders = orders.filter(o => {
      if (!o.createdAt) return false;
      const oDate = new Date(o.createdAt);
      return getIstDateString(oDate) === todayIstStr;
    });

    let maxTokenToday = 0;
    todayOrders.forEach(o => {
      if (o.tokenNumber && o.tokenNumber > maxTokenToday) {
        maxTokenToday = o.tokenNumber;
      }
    });
    const nextTokenNumber = maxTokenToday + 1;

    const newOrder = {
      id: `ORD-${nextCounter}`,
      orderNumber: nextCounter,
      tokenNumber: nextTokenNumber, // Save numeric token number
      customerName: orderData.customerName || "Walk-in Customer",
      customerPhone: orderData.customerPhone || "",
      items: orderData.items,
      subtotal: orderData.subtotal,
      discount: orderData.discount || 0,
      bogoDiscount: orderData.bogoDiscount || 0,
      tax: orderData.tax || 0,
      total: orderData.total,
      type: orderData.type || "Dine-in", // Dine-in or Takeaway
      tableNumber: orderData.tableNumber || "",
      notes: orderData.notes || "",
      paymentMethod: orderData.paymentMethod || "Cash", // Cash, UPI, Card
      status: "Pending", // Pending, Preparing, Ready, Completed, Cancelled
      createdAt: now.toISOString()
    };

    orders.unshift(newOrder); // Add to top
    this.set("orders", orders);
    if (window.updateSidebarSummary) window.updateSidebarSummary();

    return {
      success: true,
      order: newOrder
    };
  },

  // Update order status (Pending -> Preparing -> Ready -> Completed / Cancelled)
  updateOrderStatus(orderId, newStatus, customStartTime = null) {
    const orders = this.get("orders") || [];
    const index = orders.findIndex(o => o.id === orderId);

    if (index !== -1) {
      const oldStatus = orders[index].status;
      orders[index].status = newStatus;

      // Track when preparing started for timer countdown
      if (newStatus === "Preparing" && !orders[index].preparingStartedAt) {
        orders[index].preparingStartedAt = customStartTime || new Date().toISOString();
      }

      // If an order is Cancelled, should we refund the inventory?
      // Bypassed - stock is always full and not decremented on checkout.
      /*
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
      */

      this.set("orders", orders);
      if (window.updateSidebarSummary) window.updateSidebarSummary();
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
      // Find max ID number to prevent key conflicts after deletions
      const maxIdNum = categories.reduce((max, c) => {
        const num = parseInt(c.id.replace(/\D/g, ""), 10);
        return isNaN(num) ? max : Math.max(max, num);
      }, 0);
      const newCat = {
        id: `cat${maxIdNum + 1}`,
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
      // Find max ID number to prevent key conflicts after deletions
      const maxIdNum = products.reduce((max, p) => {
        const num = parseInt(p.id.replace(/\D/g, ""), 10);
        return isNaN(num) ? max : Math.max(max, num);
      }, 0);
      const newProd = {
        id: `p${maxIdNum + 1}`,
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
      // Find max ID number to prevent key conflicts after deletions
      const maxIdNum = ingredients.reduce((max, i) => {
        const num = parseInt(i.id.replace(/\D/g, ""), 10);
        return isNaN(num) ? max : Math.max(max, num);
      }, 0);
      const newIng = {
        id: `ing${maxIdNum + 1}`,
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
const TARGET_MENU_VERSION = "crust_chilly_v9";
if (localStorage.getItem("cc_pos_menu_version") !== TARGET_MENU_VERSION) {
  db.init(true); // Wipes old local storage key prefix & reseeds

  // Force sync all seeded keys to Firebase to overwrite old Firestore documents!
  if (db.fs) {
    const SYNC_KEYS = ["users", "categories", "ingredients", "products", "settings", "permissions", "orders", "expenses", "purchases", "orderCounter"];
    SYNC_KEYS.forEach(key => {
      db.syncToFirebase(key, db.get(key));
    });
  }

  localStorage.setItem("cc_pos_menu_version", TARGET_MENU_VERSION);
  console.log("Database reset: Crust & Chilly seed menu updated to version: " + TARGET_MENU_VERSION);
} else {
  db.init(); // Ordinary load
}
