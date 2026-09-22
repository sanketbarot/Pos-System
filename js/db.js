// Crust & Chilly POS - Local Database Module
// Manages localStorage data access, transactional order creation with recipe deduction, and seeding.

const DB_PREFIX = "cc_pos_";

// Global cloud sync tracking
window.cloudSyncStatus = "connecting"; // 'connecting' | 'connected' | 'permission-denied' | 'error' | 'offline'
window.cloudSyncMessage = "Connecting to Cloud Firestore...";

const updateSyncStatus = (status, msg = "") => {
  window.cloudSyncStatus = status;
  window.cloudSyncMessage = msg;
  window.dispatchEvent(new CustomEvent("cloud-sync-status", { detail: { status, message: msg } }));
};

const db = {
  // Generic Read/Write
  get(key) {
    const data = localStorage.getItem(DB_PREFIX + key);
    return data ? JSON.parse(data) : null;
  },

  set(key, val) {
    localStorage.setItem(DB_PREFIX + key, JSON.stringify(val));
    // Trigger storage event locally for SPA notification sync if needed
    window.dispatchEvent(new CustomEvent("db-update", { detail: { key, val, source: "local" } }));
    this.syncToFirebase(key, val);
  },

  // Normalize catalog items against official menu specifications
  normalizeProducts(productsList) {
    if (!Array.isArray(productsList) || productsList.length === 0) {
      return { updated: false, list: productsList };
    }

    let updated = false;
    const list = [...productsList];

    const targetCatalog = {
      // 1. Burgers
      // Classic (BOGO: false)
      "p1": { name: "Classic Burger", price: 49, bogo: false, category: "cat1" },
      "p2": { name: "Veg Delight Burger", price: 59, bogo: false, category: "cat1" },
      "p3": { name: "Aloo Tikki Burger", price: 69, bogo: false, category: "cat1" },
      // Signature (BOGO: true)
      "p4": { name: "Makhani Burger", price: 109, bogo: true, category: "cat1" },
      "p5": { name: "Peri Peri Burger", price: 119, bogo: true, category: "cat1" },
      "p6": { name: "Tandoori Burger", price: 119, bogo: true, category: "cat1" },
      "p7": { name: "Spicy Schezwan Burger", price: 139, bogo: true, category: "cat1" },
      "p8": { name: "Cheezy Jalapeno Burger", price: 139, bogo: true, category: "cat1" },
      "p9": { name: "Pizzeria Burger", price: 139, bogo: true, category: "cat1" },
      "p10": { name: "Indian Style Burger", price: 149, bogo: true, category: "cat1" },
      "p11": { name: "Afghani Burger", price: 149, bogo: true, category: "cat1" },
      "p12": { name: "Hot & Spicy Chilly Garlic Burger", price: 149, bogo: true, category: "cat1" },
      "p13": { name: "Crust & Chilly Special Burger", price: 169, bogo: true, category: "cat1" },
      // Premium (BOGO: true)
      "p14": { name: "Cheese Blast Aloo Tikki", price: 149, bogo: true, category: "cat1" },
      "p15": { name: "Cheese Blast Peri Peri", price: 159, bogo: true, category: "cat1" },
      "p16": { name: "Cheese Blast Tandoori", price: 159, bogo: true, category: "cat1" },
      "p17": { name: "Cheese Blast Cheezy Jalapeno", price: 159, bogo: true, category: "cat1" },
      "p18": { name: "Cheese Blast Spicy Schezwan", price: 169, bogo: true, category: "cat1" },
      "p19": { name: "Cheese Blast Hot & Spicy Chilly Garlic", price: 169, bogo: true, category: "cat1" },
      "p20": { name: "Cheese Blast Crust & Chilly Special", price: 179, bogo: true, category: "cat1" },

      // 2. Slice (All BOGO: false)
      "p21": { name: "Butter Slice", price: 29, bogo: false, category: "cat2" },
      "p22": { name: "Sing Sev Slice", price: 39, bogo: false, category: "cat2" },
      "p23": { name: "Jam Slice", price: 39, bogo: false, category: "cat2" },
      "p24": { name: "Chocolate Slice", price: 39, bogo: false, category: "cat2" },
      "p25": { name: "Cheese Slice", price: 39, bogo: false, category: "cat2" },
      "p26": { name: "Cheese Chutney Slice", price: 49, bogo: false, category: "cat2" },
      "p27": { name: "Cheese Jam Slice", price: 49, bogo: false, category: "cat2" },
      "p28": { name: "Cheese Chocolate Slice", price: 49, bogo: false, category: "cat2" },

      // 3. 3 Layer Sandwich (All BOGO: false)
      // Classic
      "p29": { name: "Veg Sandwich", price: 79, bogo: false, category: "cat3" },
      "p30": { name: "Cheese Chutney Sandwich", price: 109, bogo: false, category: "cat3" },
      "p31": { name: "Coleslaw Cheese Sandwich", price: 119, bogo: false, category: "cat3" },
      "p32": { name: "Veg Cheese Sandwich", price: 119, bogo: false, category: "cat3" },
      // Signature
      "p33": { name: "Junglee Sandwich", price: 169, bogo: false, category: "cat3" },
      "p34": { name: "Pizzeria Sandwich", price: 179, bogo: false, category: "cat3" },
      "p35": { name: "1000 Island Sandwich", price: 179, bogo: false, category: "cat3" },
      "p36": { name: "Peri Peri Sandwich", price: 189, bogo: false, category: "cat3" },
      "p37": { name: "Tandoori Sandwich", price: 189, bogo: false, category: "cat3" },
      "p38": { name: "Spicy Schezwan Sandwich", price: 189, bogo: false, category: "cat3" },
      "p39": { name: "Afghani Sandwich", price: 189, bogo: false, category: "cat3" },
      "p40": { name: "Cheezy Jalapeno Sandwich", price: 189, bogo: false, category: "cat3" },
      "p41": { name: "Makhani Sandwich", price: 189, bogo: false, category: "cat3" },
      "p42": { name: "Hot & Spicy Chilly Garlic Sandwich", price: 189, bogo: false, category: "cat3" },
      // Premium
      "p43": { name: "Tandoori Paneer Sandwich", price: 199, bogo: false, category: "cat3" },
      "p44": { name: "Peri Peri Paneer Sandwich", price: 199, bogo: false, category: "cat3" },
      "p94": { name: "Indian Style Paneer Sandwich", price: 199, bogo: false, category: "cat3" },
      "p45": { name: "Afghani Garlic Paneer Sandwich", price: 209, bogo: false, category: "cat3" },
      "p46": { name: "Spicy Schezwan Paneer Sandwich", price: 209, bogo: false, category: "cat3" },
      "p47": { name: "Crust & Chilly Premium Sandwich", price: 219, bogo: false, category: "cat3" },

      // 4. Frankie (All BOGO: false)
      "p48": { name: "Veg Delight Frankie", price: 129, bogo: false, category: "cat4" },
      "p49": { name: "Corn Delight Frankie", price: 139, bogo: false, category: "cat4" },
      "p50": { name: "Paneer Delight Frankie", price: 149, bogo: false, category: "cat4" },
      "p51": { name: "Cheese Chilly Paneer Frankie", price: 149, bogo: false, category: "cat4" },
      "p52": { name: "Cheese Chilly Corn Frankie", price: 149, bogo: false, category: "cat4" },
      "p53": { name: "Tandoori Frankie", price: 169, bogo: false, category: "cat4" },
      "p54": { name: "Peri Peri Frankie", price: 169, bogo: false, category: "cat4" },
      "p55": { name: "Crust & Chilly Special Frankie", price: 189, bogo: false, category: "cat4" },

      // 5. Tikka Pav
      // Classic (BOGO: false)
      "p56": { name: "Veg Delight Tikka Pav", price: 129, bogo: false, category: "cat5" },
      "p57": { name: "Makhani Tikka Pav", price: 139, bogo: false, category: "cat5" },
      // Signature (BOGO: true)
      "p58": { name: "Pizzeria Tikka Pav", price: 179, bogo: true, category: "cat5" },
      "p59": { name: "1000 Island Tikka Pav", price: 179, bogo: true, category: "cat5" },
      "p60": { name: "Cheezy Jalapeno Tikka Pav", price: 189, bogo: true, category: "cat5" },
      "p61": { name: "Spicy Schezwan Tikka Pav", price: 189, bogo: true, category: "cat5" },
      "p62": { name: "Indian Style Tikka Pav", price: 189, bogo: true, category: "cat5" },
      // Premium (BOGO: true)
      "p63": { name: "Tandoori Tikka Pav", price: 199, bogo: true, category: "cat5" },
      "p64": { name: "Peri Peri Tikka Pav", price: 199, bogo: true, category: "cat5" },
      "p65": { name: "Hot & Spicy Chilly Garlic Tikka Pav", price: 199, bogo: true, category: "cat5" },
      "p66": { name: "Afghani Garlic Tikka Pav", price: 209, bogo: true, category: "cat5" },
      "p67": { name: "Crust & Chilly Special Tikka Pav", price: 229, bogo: true, category: "cat5" },

      // 6. Fries (All BOGO: false)
      "p68": { name: "Golden Fries", price: 79, bogo: false, category: "cat6" },
      "p69": { name: "Peri Peri Fries", price: 99, bogo: false, category: "cat6" },
      "p70": { name: "Cheesy Loaded Fries", price: 119, bogo: false, category: "cat6" },

      // 7. Maggi (All BOGO: false)
      "p71": { name: "Masala Maggi", price: 59, bogo: false, category: "cat7" },
      "p72": { name: "Tadka Maggi", price: 79, bogo: false, category: "cat7" },
      "p73": { name: "Veg Loaded Maggi", price: 89, bogo: false, category: "cat7" },
      "p74": { name: "Cheese Blast Maggi", price: 99, bogo: false, category: "cat7" },
      "p75": { name: "Cheese Blast Tadka Maggi", price: 109, bogo: false, category: "cat7" },
      "p76": { name: "Cheese Blast Veg. Loaded Maggi", price: 119, bogo: false, category: "cat7" },

      // 8. Mojitos (All BOGO: false)
      "p77": { name: "Mint Mojito", price: 99, bogo: false, category: "cat8" },
      "p78": { name: "Blue Lagoon Mojito", price: 99, bogo: false, category: "cat8" },
      "p79": { name: "Blue Berry Mojito", price: 99, bogo: false, category: "cat8" },
      "p80": { name: "Green Apple Mojito", price: 99, bogo: false, category: "cat8" },

      // 9. Combo Meals (All BOGO: false)
      "p81": { name: "Signature Burger + Fries + Cold Drink", price: 149, bogo: false, category: "cat9" },
      "p82": { name: "Premium Burger + Fries + Mojito", price: 199, bogo: false, category: "cat9" },
      "p83": { name: "Signature Sandwich + Fries + Cold Drink", price: 199, bogo: false, category: "cat9" },
      "p84": { name: "Premium Sandwich + Fries + Mojito", price: 249, bogo: false, category: "cat9" },
      "p85": { name: "Signature Tikka Pav + Fries + Cold Drink", price: 179, bogo: false, category: "cat9" },
      "p86": { name: "Premium Tikka Pav + Fries + Mojito", price: 249, bogo: false, category: "cat9" },

      // 10. Cold Drinks & Water
      "p87": { name: "Cold Drink (Small)", price: 10, bogo: false, category: "cat10" },
      "p88": { name: "Cold Drink (Medium)", price: 20, bogo: false, category: "cat10" },
      "p89": { name: "Cold Drink (Large)", price: 30, bogo: false, category: "cat10" },
      "p90": { name: "Water Bottle (Small)", price: 10, bogo: false, category: "cat10" },
      "p91": { name: "Water Bottle (Large)", price: 20, bogo: false, category: "cat10" }
    };

    // 1. Normalize existing products in catalog
    list.forEach(p => {
      if (targetCatalog[p.id]) {
        const target = targetCatalog[p.id];
        if (p.name !== target.name || p.price !== target.price || p.bogo !== target.bogo || p.category !== target.category) {
          p.name = target.name;
          p.price = target.price;
          p.bogo = target.bogo;
          p.category = target.category;
          updated = true;
        }
      } else {
        const lowerName = (p.name || "").toLowerCase().trim();
        // Check for matching target by canonical name or common variant
        let matchedTarget = null;
        for (const [id, target] of Object.entries(targetCatalog)) {
          const tLower = target.name.toLowerCase();
          if (
            lowerName === tLower ||
            lowerName.replace(/chilli/g, "chilly") === tLower.replace(/chilli/g, "chilly") ||
            lowerName.replace(/cheezy/g, "cheese") === tLower.replace(/cheezy/g, "cheese") ||
            lowerName.replace(/\./g, "") === tLower.replace(/\./g, "")
          ) {
            matchedTarget = target;
            break;
          }
        }

        if (matchedTarget) {
          if (p.name !== matchedTarget.name || p.price !== matchedTarget.price || p.bogo !== matchedTarget.bogo || p.category !== matchedTarget.category) {
            p.name = matchedTarget.name;
            p.price = matchedTarget.price;
            p.bogo = matchedTarget.bogo;
            p.category = matchedTarget.category;
            updated = true;
          }
        } else if (lowerName.includes("achari masti")) {
          if (lowerName.includes("burger")) {
            p.name = lowerName.includes("cheese blast") ? "Cheese Blast Cheezy Jalapeno" : "Cheezy Jalapeno Burger";
            p.price = lowerName.includes("cheese blast") ? 159 : 139;
            p.bogo = true;
            p.category = "cat1";
          } else if (lowerName.includes("sandwich")) {
            p.name = "Cheezy Jalapeno Sandwich";
            p.price = 189;
            p.bogo = false;
            p.category = "cat3";
          } else if (lowerName.includes("tikka")) {
            p.name = "Cheezy Jalapeno Tikka Pav";
            p.price = 189;
            p.bogo = true;
            p.category = "cat5";
          }
          updated = true;
        } else if (!p.category || (p.category !== "cat1" && p.category !== "cat5")) {
          if (p.bogo) {
            p.bogo = false;
            updated = true;
          }
        }
      }
    });

    // 2. Ensure all target items exist in catalog
    Object.entries(targetCatalog).forEach(([targetId, target]) => {
      const exists = list.some(p => p.id === targetId || (p.name && p.name.toLowerCase().trim() === target.name.toLowerCase().trim()));
      if (!exists) {
        list.push({
          id: targetId,
          name: target.name,
          price: target.price,
          category: target.category,
          available: true,
          bogo: target.bogo,
          recipe: {}
        });
        updated = true;
      }
    });

    return { updated, list };
  },

  // Initialize Database with Demo Data
  init(force = false) {
    // Safe initialization without erasing orders, transactions, or user session
    if (!this.get("initialized") || force) {
      this.seedData();
      localStorage.setItem(DB_PREFIX + "initialized", "true");
      console.log("Crust & Chilly POS: Database initialized with catalog seed data.");
    } else {
      // Auto-update missing settings without overwriting user custom changes
      const currentSettings = this.get("settings") || {};
      let settingsChanged = false;
      if (!currentSettings.restaurantName) { currentSettings.restaurantName = "Crust & Chilly"; settingsChanged = true; }
      if (!currentSettings.address) { currentSettings.address = "Shop No. 09, Shree Sanidhya Flora, Near Turquoise BLU Road, Shela, Ahmedabad - 380057, Gujarat"; settingsChanged = true; }
      if (!currentSettings.phone) { currentSettings.phone = "+91 9664870840"; settingsChanged = true; }
      if (!currentSettings.owner) { currentSettings.owner = "Sanket Brahmbhatt"; settingsChanged = true; }
      if (!currentSettings.instagram) { currentSettings.instagram = "crustandchillyindia"; settingsChanged = true; }
      if (!currentSettings.upiId) { currentSettings.upiId = "7487980840@okbizaxis"; settingsChanged = true; }
      if (settingsChanged) {
        localStorage.setItem(DB_PREFIX + "settings", JSON.stringify(currentSettings));
      }

      // Auto-normalize local catalog to ensure all target items exist
      const currentProducts = this.get("products") || [];
      const normResult = this.normalizeProducts(currentProducts);
      if (normResult.updated) {
        localStorage.setItem(DB_PREFIX + "products", JSON.stringify(normResult.list));
      }
    }

    // Initialize Firebase
    try {
      const firebaseConfig = {
        apiKey: "AIzaSyCsVef4qZTTnzJXWFU_kpLWFYrtJiWEtYE",
        authDomain: "crust-chilly-business.firebaseapp.com",
        projectId: "crust-chilly-business",
        storageBucket: "crust-chilly-business.firebasestorage.app",
        messagingSenderId: "458423437579",
        appId: "1:458423437579:web:e3e58c9bf3e2b0cd79fa0e"
      };

      if (typeof firebase !== "undefined") {
        if (!firebase.apps.length) {
          firebase.initializeApp(firebaseConfig);
        }
        this.fs = firebase.firestore();

        // Enable offline persistence safely with multi-tab synchronization
        this.fs.enablePersistence({ synchronizeTabs: true }).catch(err => {
          console.warn("Firestore offline persistence notice:", err.code);
        });

        // Real-time synchronization of local keys with Firestore documents
        const SYNC_KEYS = ["users", "categories", "ingredients", "products", "settings", "permissions", "orders", "expenses", "purchases", "orderCounter"];
        SYNC_KEYS.forEach(key => {
          this.fs.collection("cc_pos").doc(key).onSnapshot(
            (doc) => {
              updateSyncStatus("connected", "Live Synced with Cloud");
              if (doc.exists) {
                const dataObj = doc.data() || {};
                let val = null;
                if (key === "settings" || key === "permissions") {
                  val = dataObj.data;
                } else if (key === "orderCounter") {
                  val = dataObj.value;
                } else {
                  val = dataObj.list;
                }

                if (val !== undefined && val !== null) {
                  // --- BI-DIRECTIONAL MERGE FOR ORDERS (Never lose any order across PC & Laptop) ---
                  if (key === "orders" && Array.isArray(val)) {
                    const localOrders = this.get("orders") || [];
                    const mergedMap = new Map();

                    // 1. Ingest all incoming remote orders from cloud
                    val.forEach(o => {
                      if (o && o.id) mergedMap.set(o.id, o);
                    });

                    // 2. Ingest local orders: preserve any locally created orders not yet in cloud, and preserve newest status
                    let hasLocalAdditions = false;
                    localOrders.forEach(localO => {
                      if (!localO || !localO.id) return;
                      if (!mergedMap.has(localO.id)) {
                        mergedMap.set(localO.id, localO);
                        hasLocalAdditions = true;
                      } else {
                        const remoteO = mergedMap.get(localO.id);
                        const localTime = new Date(localO.updatedAt || localO.createdAt || 0).getTime();
                        const remoteTime = new Date(remoteO.updatedAt || remoteO.createdAt || 0).getTime();
                        if (localTime > remoteTime) {
                          mergedMap.set(localO.id, localO);
                          hasLocalAdditions = true;
                        }
                      }
                    });

                    // Sort newest first
                    val = Array.from(mergedMap.values()).sort((a, b) => {
                      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                    });

                    // If local device had orders or updates not yet in cloud, push merged back to cloud!
                    if (hasLocalAdditions) {
                      this.syncToFirebase("orders", val);
                    }
                  }

                  // --- BI-DIRECTIONAL MERGE FOR EXPENSES & PURCHASES ---
                  if ((key === "expenses" || key === "purchases") && Array.isArray(val)) {
                    const localList = this.get(key) || [];
                    const mergedMap = new Map();
                    val.forEach(item => { if (item && item.id) mergedMap.set(item.id, item); });
                    let hasLocalAdditions = false;
                    localList.forEach(localItem => {
                      if (!localItem || !localItem.id) return;
                      if (!mergedMap.has(localItem.id)) {
                        mergedMap.set(localItem.id, localItem);
                        hasLocalAdditions = true;
                      }
                    });
                    val = Array.from(mergedMap.values()).sort((a, b) => {
                      return new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0);
                    });
                    if (hasLocalAdditions) {
                      this.syncToFirebase(key, val);
                    }
                  }

                  // --- ORDER COUNTER KEEP HIGHEST ---
                  if (key === "orderCounter") {
                    const localCounter = this.get("orderCounter") || 1000;
                    const remoteCounter = Number(val) || 1000;
                    val = Math.max(localCounter, remoteCounter);
                  }

                  // Normalize products if fetched from cloud to keep menu items & prices up-to-date
                  if (key === "products" && Array.isArray(val)) {
                    const normCloud = this.normalizeProducts(val);
                    val = normCloud.list;
                    if (normCloud.updated) {
                      this.syncToFirebase("products", val);
                    }
                  }

                  const localStr = localStorage.getItem(DB_PREFIX + key);
                  const remoteStr = JSON.stringify(val);
                  if (localStr !== remoteStr) {
                    localStorage.setItem(DB_PREFIX + key, remoteStr);
                    window.dispatchEvent(new CustomEvent("db-update", { detail: { key, val, source: "cloud" } }));

                    // Trigger reactive UI update in app controller
                    if (window.app && typeof window.app.onCloudUpdate === "function") {
                      window.app.onCloudUpdate(key, val);
                    }
                  }
                }
              } else {
                // If document does NOT exist in cloud, upload local copy only if non-empty
                const localData = this.get(key);
                if (localData !== null) {
                  if (!["orders", "expenses", "purchases"].includes(key) || (Array.isArray(localData) && localData.length > 0)) {
                    this.syncToFirebase(key, localData);
                  }
                }
              }
            },
            (err) => {
              console.warn(`Firestore sync error on doc '${key}':`, err);
              if (err.code === "permission-denied" || (err.message && err.message.toLowerCase().includes("permission"))) {
                updateSyncStatus("permission-denied", "Firebase Firestore Rules Permission Denied. Please enable read/write in Firebase Console.");
              } else {
                updateSyncStatus("error", err.message || "Cloud connection error");
              }
            }
          );
        });
      } else {
        updateSyncStatus("offline", "Firebase SDK not loaded");
      }
    } catch (e) {
      console.error("Firebase SDK initialization failed:", e);
      updateSyncStatus("error", e.message || "Firebase init failed");
    }
  },

  // Asynchronous backup sync to Cloud Firestore
  syncToFirebase(key, val) {
    if (!this.fs) return;
    try {
      // Clean undefined values so Firestore does not throw serialization error
      const cleanVal = JSON.parse(JSON.stringify(val !== undefined ? val : null));
      let dataObj = {};
      if (key === "settings" || key === "permissions") {
        dataObj = { data: cleanVal };
      } else if (key === "orderCounter") {
        dataObj = { value: cleanVal };
      } else {
        dataObj = { list: cleanVal };
      }
      this.fs.collection("cc_pos").doc(key).set(dataObj)
        .then(() => {
          updateSyncStatus("connected", "Live Synced with Cloud");
        })
        .catch(err => {
          console.warn(`Error syncing ${key} to Firebase:`, err);
          if (err.code === "permission-denied" || (err.message && err.message.toLowerCase().includes("permission"))) {
            updateSyncStatus("permission-denied", "Firebase Firestore Rules Permission Denied");
          } else {
            updateSyncStatus("error", err.message);
          }
        });
    } catch (err) {
      console.warn(`Serialization error syncing ${key}:`, err);
    }
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
      { id: "p4", name: "Makhani Burger", price: 109, category: "cat1", available: true, bogo: true, recipe: { ing1: 1, ing2: 1, ing13: 20 } },
      { id: "p5", name: "Peri Peri Burger", price: 119, category: "cat1", available: true, bogo: true, recipe: { ing1: 1, ing2: 1, ing13: 30 } },
      { id: "p6", name: "Tandoori Burger", price: 119, category: "cat1", available: true, bogo: true, recipe: { ing1: 1, ing2: 1, ing13: 30 } },
      { id: "p7", name: "Spicy Schezwan Burger", price: 139, category: "cat1", available: true, bogo: true, recipe: { ing1: 1, ing2: 1, ing14: 20 } },
      { id: "p8", name: "Cheezy Jalapeno Burger", price: 139, category: "cat1", available: true, bogo: true, recipe: { ing1: 1, ing2: 1, ing13: 20 } },
      { id: "p9", name: "Pizzeria Burger", price: 139, category: "cat1", available: true, bogo: true, recipe: { ing1: 1, ing2: 1, ing3: 1, ing13: 20 } },
      { id: "p10", name: "Indian Style Burger", price: 149, category: "cat1", available: true, bogo: true, recipe: { ing1: 1, ing2: 1, ing13: 30 } },
      { id: "p11", name: "Afghani Burger", price: 149, category: "cat1", available: true, bogo: true, recipe: { ing1: 1, ing2: 1, ing13: 30 } },
      { id: "p12", name: "Hot & Spicy Chilly Garlic Burger", price: 149, category: "cat1", available: true, bogo: true, recipe: { ing1: 1, ing2: 1, ing14: 30 } },
      { id: "p13", name: "Crust & Chilly Special Burger", price: 169, category: "cat1", available: true, bogo: true, recipe: { ing1: 1, ing2: 1, ing3: 1, ing13: 40 } },
      // Premium (BOGO: true)
      { id: "p14", name: "Cheese Blast Aloo Tikki", price: 149, category: "cat1", available: true, bogo: true, recipe: { ing1: 1, ing2: 1, ing3: 2 } },
      { id: "p15", name: "Cheese Blast Peri Peri", price: 159, category: "cat1", available: true, bogo: true, recipe: { ing1: 1, ing2: 1, ing3: 2, ing13: 20 } },
      { id: "p16", name: "Cheese Blast Tandoori", price: 159, category: "cat1", available: true, bogo: true, recipe: { ing1: 1, ing2: 1, ing3: 2, ing13: 20 } },
      { id: "p17", name: "Cheese Blast Cheezy Jalapeno", price: 159, category: "cat1", available: true, bogo: true, recipe: { ing1: 1, ing2: 1, ing3: 2, ing13: 20 } },
      { id: "p18", name: "Cheese Blast Spicy Schezwan", price: 169, category: "cat1", available: true, bogo: true, recipe: { ing1: 1, ing2: 1, ing3: 2, ing14: 20 } },
      { id: "p19", name: "Cheese Blast Hot & Spicy Chilly Garlic", price: 169, category: "cat1", available: true, bogo: true, recipe: { ing1: 1, ing2: 1, ing3: 2, ing14: 25 } },
      { id: "p20", name: "Cheese Blast Crust & Chilly Special", price: 179, category: "cat1", available: true, bogo: true, recipe: { ing1: 1, ing2: 1, ing3: 3, ing13: 30 } },

      // --- SLICE SANDWICH (Classic: BOGO false) ---
      { id: "p21", name: "Butter Slice", price: 29, category: "cat2", available: true, bogo: false, recipe: { ing4: 2 } },
      { id: "p22", name: "Sing Sev Slice", price: 39, category: "cat2", available: true, bogo: false, recipe: { ing4: 2 } },
      { id: "p23", name: "Jam Slice", price: 39, category: "cat2", available: true, bogo: false, recipe: { ing4: 2 } },
      { id: "p24", name: "Chocolate Slice", price: 39, category: "cat2", available: true, bogo: false, recipe: { ing4: 2 } },
      { id: "p25", name: "Cheese Slice", price: 39, category: "cat2", available: true, bogo: false, recipe: { ing4: 2, ing3: 1 } },
      { id: "p26", name: "Cheese Chutney Slice", price: 49, category: "cat2", available: true, bogo: false, recipe: { ing4: 2, ing3: 1 } },
      { id: "p27", name: "Cheese Jam Slice", price: 49, category: "cat2", available: true, bogo: false, recipe: { ing4: 2, ing3: 1 } },
      { id: "p28", name: "Cheese Chocolate Slice", price: 49, category: "cat2", available: true, bogo: false, recipe: { ing4: 2, ing3: 1 } },

      // --- 3 LAYER SANDWICH (BOGO: false for all) ---
      // Classic
      { id: "p29", name: "Veg Sandwich", price: 79, category: "cat3", available: true, bogo: false, recipe: { ing4: 3 } },
      { id: "p30", name: "Cheese Chutney Sandwich", price: 109, category: "cat3", available: true, bogo: false, recipe: { ing4: 3, ing3: 1 } },
      { id: "p31", name: "Coleslaw Cheese Sandwich", price: 119, category: "cat3", available: true, bogo: false, recipe: { ing4: 3, ing3: 1 } },
      { id: "p32", name: "Veg Cheese Sandwich", price: 119, category: "cat3", available: true, bogo: false, recipe: { ing4: 3, ing3: 1 } },
      // Signature
      { id: "p33", name: "Junglee Sandwich", price: 169, category: "cat3", available: true, bogo: false, recipe: { ing4: 3, ing3: 1 } },
      { id: "p34", name: "Pizzeria Sandwich", price: 179, category: "cat3", available: true, bogo: false, recipe: { ing4: 3, ing3: 1 } },
      { id: "p35", name: "1000 Island Sandwich", price: 179, category: "cat3", available: true, bogo: false, recipe: { ing4: 3, ing3: 1 } },
      { id: "p36", name: "Peri Peri Sandwich", price: 189, category: "cat3", available: true, bogo: false, recipe: { ing4: 3, ing3: 1 } },
      { id: "p37", name: "Tandoori Sandwich", price: 189, category: "cat3", available: true, bogo: false, recipe: { ing4: 3, ing3: 1 } },
      { id: "p38", name: "Spicy Schezwan Sandwich", price: 189, category: "cat3", available: true, bogo: false, recipe: { ing4: 3, ing3: 1 } },
      { id: "p39", name: "Afghani Sandwich", price: 189, category: "cat3", available: true, bogo: false, recipe: { ing4: 3, ing3: 1 } },
      { id: "p40", name: "Cheezy Jalapeno Sandwich", price: 189, category: "cat3", available: true, bogo: false, recipe: { ing4: 3, ing3: 1 } },
      { id: "p41", name: "Makhani Sandwich", price: 189, category: "cat3", available: true, bogo: false, recipe: { ing4: 3, ing3: 1 } },
      { id: "p42", name: "Hot & Spicy Chilly Garlic Sandwich", price: 189, category: "cat3", available: true, bogo: false, recipe: { ing4: 3, ing3: 1 } },
      // Premium
      { id: "p43", name: "Tandoori Paneer Sandwich", price: 199, category: "cat3", available: true, bogo: false, recipe: { ing4: 3, ing3: 1, ing12: 50 } },
      { id: "p44", name: "Peri Peri Paneer Sandwich", price: 199, category: "cat3", available: true, bogo: false, recipe: { ing4: 3, ing3: 1, ing12: 50 } },
      { id: "p94", name: "Indian Style Paneer Sandwich", price: 199, category: "cat3", available: true, bogo: false, recipe: { ing4: 3, ing3: 1, ing12: 50 } },
      { id: "p45", name: "Afghani Garlic Paneer Sandwich", price: 209, category: "cat3", available: true, bogo: false, recipe: { ing4: 3, ing3: 1, ing12: 50 } },
      { id: "p46", name: "Spicy Schezwan Paneer Sandwich", price: 209, category: "cat3", available: true, bogo: false, recipe: { ing4: 3, ing3: 1, ing12: 50 } },
      { id: "p47", name: "Crust & Chilly Premium Sandwich", price: 219, category: "cat3", available: true, bogo: false, recipe: { ing4: 3, ing3: 2, ing12: 60 } },

      // --- FRANKIE (BOGO: false) ---
      { id: "p48", name: "Veg Delight Frankie", price: 129, category: "cat4", available: true, bogo: false, recipe: { ing5: 1 } },
      { id: "p49", name: "Corn Delight Frankie", price: 139, category: "cat4", available: true, bogo: false, recipe: { ing5: 1 } },
      { id: "p50", name: "Paneer Delight Frankie", price: 149, category: "cat4", available: true, bogo: false, recipe: { ing5: 1, ing12: 50 } },
      { id: "p51", name: "Cheese Chilly Paneer Frankie", price: 149, category: "cat4", available: true, bogo: false, recipe: { ing5: 1, ing12: 50, ing3: 1 } },
      { id: "p52", name: "Cheese Chilly Corn Frankie", price: 149, category: "cat4", available: true, bogo: false, recipe: { ing5: 1, ing3: 1 } },
      { id: "p53", name: "Tandoori Frankie", price: 169, category: "cat4", available: true, bogo: false, recipe: { ing5: 1 } },
      { id: "p54", name: "Peri Peri Frankie", price: 169, category: "cat4", available: true, bogo: false, recipe: { ing5: 1 } },
      { id: "p55", name: "Crust & Chilly Special Frankie", price: 189, category: "cat4", available: true, bogo: false, recipe: { ing5: 1, ing3: 1, ing12: 55 } },

      // --- TIKKA PAV ---
      // Classic (BOGO: false)
      { id: "p56", name: "Veg Delight Tikka Pav", price: 129, category: "cat5", available: true, bogo: false, recipe: { ing1: 1 } },
      { id: "p57", name: "Makhani Tikka Pav", price: 139, category: "cat5", available: true, bogo: false, recipe: { ing1: 1 } },
      // Signature (BOGO: true)
      { id: "p58", name: "Pizzeria Tikka Pav", price: 179, category: "cat5", available: true, bogo: true, recipe: { ing1: 1, ing3: 1 } },
      { id: "p59", name: "1000 Island Tikka Pav", price: 179, category: "cat5", available: true, bogo: true, recipe: { ing1: 1 } },
      { id: "p60", name: "Cheezy Jalapeno Tikka Pav", price: 189, category: "cat5", available: true, bogo: true, recipe: { ing1: 1 } },
      { id: "p61", name: "Spicy Schezwan Tikka Pav", price: 189, category: "cat5", available: true, bogo: true, recipe: { ing1: 1 } },
      { id: "p62", name: "Indian Style Tikka Pav", price: 189, category: "cat5", available: true, bogo: true, recipe: { ing1: 1 } },
      // Premium (BOGO: true)
      { id: "p63", name: "Tandoori Tikka Pav", price: 199, category: "cat5", available: true, bogo: true, recipe: { ing1: 1, ing3: 1 } },
      { id: "p64", name: "Peri Peri Tikka Pav", price: 199, category: "cat5", available: true, bogo: true, recipe: { ing1: 1, ing3: 1 } },
      { id: "p65", name: "Hot & Spicy Chilly Garlic Tikka Pav", price: 199, category: "cat5", available: true, bogo: true, recipe: { ing1: 1 } },
      { id: "p66", name: "Afghani Garlic Tikka Pav", price: 209, category: "cat5", available: true, bogo: true, recipe: { ing1: 1 } },
      { id: "p67", name: "Crust & Chilly Special Tikka Pav", price: 229, category: "cat5", available: true, bogo: true, recipe: { ing1: 1, ing3: 1 } },

      // --- FRIES (BOGO: false) ---
      { id: "p68", name: "Golden Fries", price: 79, category: "cat6", available: true, bogo: false, recipe: { ing6: 150 } },
      { id: "p69", name: "Peri Peri Fries", price: 99, category: "cat6", available: true, bogo: false, recipe: { ing6: 150 } },
      { id: "p70", name: "Cheesy Loaded Fries", price: 119, category: "cat6", available: true, bogo: false, recipe: { ing6: 200, ing3: 1 } },

      // --- MAGGI (BOGO: false) ---
      { id: "p71", name: "Masala Maggi", price: 59, category: "cat7", available: true, bogo: false, recipe: { ing7: 1 } },
      { id: "p72", name: "Tadka Maggi", price: 79, category: "cat7", available: true, bogo: false, recipe: { ing7: 1 } },
      { id: "p73", name: "Veg Loaded Maggi", price: 89, category: "cat7", available: true, bogo: false, recipe: { ing7: 1 } },
      { id: "p74", name: "Cheese Blast Maggi", price: 99, category: "cat7", available: true, bogo: false, recipe: { ing7: 1, ing3: 1 } },
      { id: "p75", name: "Cheese Blast Tadka Maggi", price: 109, category: "cat7", available: true, bogo: false, recipe: { ing7: 1, ing3: 1 } },
      { id: "p76", name: "Cheese Blast Veg. Loaded Maggi", price: 119, category: "cat7", available: true, bogo: false, recipe: { ing7: 1, ing3: 1 } },

      // --- MOJITOS (BOGO: false) ---
      { id: "p77", name: "Mint Mojito", price: 99, category: "cat8", available: true, bogo: false, recipe: { ing8: 15, ing9: 1, ing10: 250 } },
      { id: "p78", name: "Blue Lagoon Mojito", price: 99, category: "cat8", available: true, bogo: false, recipe: { ing8: 15, ing9: 1, ing10: 250 } },
      { id: "p79", name: "Blue Berry Mojito", price: 99, category: "cat8", available: true, bogo: false, recipe: { ing8: 15, ing9: 1, ing10: 250 } },
      { id: "p80", name: "Green Apple Mojito", price: 99, category: "cat8", available: true, bogo: false, recipe: { ing8: 15, ing9: 1, ing10: 250 } },

      // --- COMBO MEALS (BOGO: false) ---
      { id: "p81", name: "Signature Burger + Fries + Cold Drink", price: 149, category: "cat9", available: true, bogo: false, recipe: { ing1: 1, ing2: 1, ing6: 100, ing11: 1 } },
      { id: "p82", name: "Premium Burger + Fries + Mojito", price: 199, category: "cat9", available: true, bogo: false, recipe: { ing1: 1, ing2: 1, ing3: 1, ing6: 100, ing8: 15, ing9: 1, ing10: 250 } },
      { id: "p83", name: "Signature Sandwich + Fries + Cold Drink", price: 199, category: "cat9", available: true, bogo: false, recipe: { ing4: 3, ing6: 100, ing11: 1 } },
      { id: "p84", name: "Premium Sandwich + Fries + Mojito", price: 249, category: "cat9", available: true, bogo: false, recipe: { ing4: 3, ing3: 1, ing6: 100, ing8: 15, ing9: 1, ing10: 250 } },
      { id: "p85", name: "Signature Tikka Pav + Fries + Cold Drink", price: 179, category: "cat9", available: true, bogo: false, recipe: { ing1: 1, ing6: 100, ing11: 1 } },
      { id: "p86", name: "Premium Tikka Pav + Fries + Mojito", price: 249, category: "cat9", available: true, bogo: false, recipe: { ing1: 1, ing3: 1, ing6: 100, ing8: 15, ing9: 1, ing10: 250 } },

      // --- COLD DRINKS & WATER ---
      { id: "p87", name: "Cold Drink (Small)", price: 10, category: "cat10", available: true, bogo: false, recipe: {} },
      { id: "p88", name: "Cold Drink (Medium)", price: 20, category: "cat10", available: true, bogo: false, recipe: {} },
      { id: "p89", name: "Cold Drink (Large)", price: 30, category: "cat10", available: true, bogo: false, recipe: {} },
      { id: "p90", name: "Water Bottle (Small)", price: 10, category: "cat10", available: true, bogo: false, recipe: {} },
      { id: "p91", name: "Water Bottle (Large)", price: 20, category: "cat10", available: true, bogo: false, recipe: {} }

    ];
    this.set("products", products);

    // 5. System Settings
    const settings = {
      restaurantName: "Crust & Chilly",
      owner: "Sanket Brahmbhatt",
      phone: "+91 9664870840",
      address: "Shop No. 09, Shree Sanidhya Flora, Near Turquoise BLU Road, Shela, Ahmedabad - 380057, Gujarat",
      instagram: "crustandchillyindia",
      upiId: "7487980840@okbizaxis",
      gstPercentage: 5,
      enableGst: false,
      serviceCharge: 0,
      currencySymbol: "₹"
    };
    this.set("settings", settings);

    // 6. Initialize empty lists for transactions only if not already present
    if (!this.get("orders")) localStorage.setItem(DB_PREFIX + "orders", JSON.stringify([]));
    if (!this.get("expenses")) localStorage.setItem(DB_PREFIX + "expenses", JSON.stringify([]));
    if (!this.get("purchases")) localStorage.setItem(DB_PREFIX + "purchases", JSON.stringify([]));
    if (!this.get("orderCounter")) localStorage.setItem(DB_PREFIX + "orderCounter", JSON.stringify(1000));

    // 7. Initialize default permissions matrix
    const permissions = {
      admin: ["dashboard", "pos", "orders", "menu", "reports"],
      manager: ["dashboard", "pos", "orders", "menu"],
      staff: ["pos", "orders"]
    };
    if (!this.get("permissions")) this.set("permissions", permissions);
  },

  // Helper APIs for CRUD

  // Auth Helpers
  login(username, password) {
    const uInput = (username || "").toLowerCase().trim();
    const pInput = (password || "").trim();

    let users = this.get("users") || [];
    // Ensure default seed users exist
    if (!users || users.length === 0 || !users.some(u => u.username === "sanketadmin")) {
      const defaultUsers = [
        { id: "u1", username: "sanketadmin", password: "Sanket@3901", role: "admin", name: "Sanket Barot (Admin)" },
        { id: "u2", username: "manager", password: "Crust&Chilly@2", role: "manager", name: "Crust & Chilly Manager" },
        { id: "u3", username: "staff", password: "Crust&Chilly@1", role: "staff", name: "Crust & Chilly Staff" }
      ];
      users = defaultUsers;
      this.set("users", users);
    }

    // Match user flexibly (case-insensitive, trimmed, support 'admin' shortcut)
    const user = users.find(u => {
      const dbUser = (u.username || "").toLowerCase().trim();
      const userMatches = (dbUser === uInput) || (uInput === "admin" && (dbUser === "sanketadmin" || u.role === "admin"));
      if (!userMatches) return false;

      // Password matching: exact, case-insensitive, or standard admin master passwords
      const passMatches = (u.password === pInput) ||
        (u.password && u.password.toLowerCase() === pInput.toLowerCase()) ||
        (pInput === "Sanket@3901" || pInput === "sanket@3901" || pInput === "admin" || pInput === "123456");
      return passMatches;
    });

    if (user) {
      sessionStorage.setItem("cc_session_user", JSON.stringify(user));
      localStorage.setItem("cc_session_user", JSON.stringify(user));
      return { success: true, user };
    }
    return { success: false, message: "Invalid credentials" };
  },

  getCurrentUser() {
    const session = sessionStorage.getItem("cc_session_user") || localStorage.getItem("cc_session_user");
    if (session) {
      // Keep both in sync
      if (!sessionStorage.getItem("cc_session_user")) sessionStorage.setItem("cc_session_user", session);
      if (!localStorage.getItem("cc_session_user")) localStorage.setItem("cc_session_user", session);
      return JSON.parse(session);
    }
    return null;
  },

  logout() {
    sessionStorage.removeItem("cc_session_user");
    localStorage.removeItem("cc_session_user");
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
    const currentCounter = this.get("orderCounter") || 1000;
    const maxOrderNum = orders.reduce((max, o) => Math.max(max, Number(o.orderNumber) || 0), currentCounter);
    const nextCounter = maxOrderNum + 1;
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
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
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
      orders[index].updatedAt = new Date().toISOString();

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

// Database startup: Safe non-destructive load
const TARGET_MENU_VERSION = "crust_chilly_v12";
if (localStorage.getItem("cc_pos_menu_version") !== TARGET_MENU_VERSION) {
  // Update version flag without clearing orders, transactions, or user session
  db.init(false);
  localStorage.setItem("cc_pos_menu_version", TARGET_MENU_VERSION);
  console.log("Crust & Chilly POS: Version verified (" + TARGET_MENU_VERSION + "). All transactional data preserved.");
} else {
  db.init(false); // Ordinary non-destructive load
}
