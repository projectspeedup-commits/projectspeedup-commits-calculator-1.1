import { DEFAULT_RAW_PRICES, sanitizeKey, DEFAULT_ECONOMY_ITEMS } from "./lib/constants";
import { app as firebaseApp, auth, db } from "./lib/firebase";
import { onAuthStateChanged, signInAnonymously, signInWithCustomToken } from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { AdminPanel } from "./components/AdminPanel";
import { CalculatorApp } from "./components/CalculatorApp";
import { LoginScreen } from "./components/LoginScreen";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [view, setView] = useState<"login" | "manager" | "admin">("login");
  const [user, setUser] = useState<any>(null);
  const [isCloudActive, setIsCloudActive] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("arsenal_theme");
      return saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      window.localStorage.setItem("arsenal_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      window.localStorage.setItem("arsenal_theme", "light");
    }
  }, [isDarkMode]);

  // Global prices
  const [globalRawPrices, setGlobalRawPrices] = useState<Record<string, string>>(DEFAULT_RAW_PRICES);
  const [globalScrapPrice, setGlobalScrapPrice] = useState("20000");
  const [globalRemnantPrice, setGlobalRemnantPrice] = useState("30000");
  const [customGrades, setCustomGrades] = useState<string[]>([]);
  const [remnantPricing, setRemnantPricing] = useState<Record<string, { round: string; hex: string }>>({});
  const [economyItems, setEconomyItems] = useState<any[]>(DEFAULT_ECONOMY_ITEMS);

  useEffect(() => {
    if (!auth) {
      setUser({ uid: "local-user" });
      return;
    }
    const initAuth = async () => {
      try {
        const win = window as any;
        const loginToken = typeof window !== "undefined" && win.__initial_auth_token
            ? win.__initial_auth_token
            : null;
            
        if (loginToken) {
           await signInWithCustomToken(auth, loginToken);
        } else {
           await signInAnonymously(auth);
        }
      } catch (e) {
        console.warn("Auth failed or timed out, working offline", e);
        setUser({ uid: "local-user" });
        setIsCloudActive(false);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        setIsCloudActive(true);
      } else {
        setUser({ uid: "local-user" });
        setIsCloudActive(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    try {
      if (typeof window !== "undefined") {
        const savedRaw = window.localStorage.getItem("arsenal_raw_prices");
        const savedScrap = window.localStorage.getItem("arsenal_scrap_price");
        const savedRemnant = window.localStorage.getItem("arsenal_remnant_price");
        const savedCustomGrades = window.localStorage.getItem("arsenal_custom_grades");
        const savedRemnantPricing = window.localStorage.getItem("arsenal_remnant_pricing");
        const savedEconomy = window.localStorage.getItem("arsenal_economy_items");

        let loadedCustomGrades: string[] = [];
        if (savedCustomGrades) {
          loadedCustomGrades = JSON.parse(savedCustomGrades);
          setCustomGrades(loadedCustomGrades);
        }

        if (savedRemnantPricing) {
          setRemnantPricing(JSON.parse(savedRemnantPricing));
        }

        if (savedEconomy) {
          setEconomyItems(JSON.parse(savedEconomy));
        }

        if (savedRaw) {
          const parsed = JSON.parse(savedRaw);
          const loadedPrices = { ...DEFAULT_RAW_PRICES };
          const allG = [...Object.keys(DEFAULT_RAW_PRICES), ...loadedCustomGrades];
          allG.forEach((grade) => {
            if (parsed[grade] !== undefined) loadedPrices[grade] = parsed[grade];
          });
          setGlobalRawPrices(loadedPrices);
        }
        if (savedScrap) setGlobalScrapPrice(savedScrap);
        if (savedRemnant) setGlobalRemnantPrice(savedRemnant);
      }
    } catch (e) {}

    // @ts-ignore
    const appId = typeof window !== "undefined" && window.__app_id ? window.__app_id : "github-arsenal-app";
    if (db && appId && isCloudActive && user.uid !== "local-user") {
      const pricesDocRef = doc(db, "artifacts", appId, "public", "data", "settings", "prices");
      const unsubscribe = onSnapshot(
        pricesDocRef,
        { includeMetadataChanges: true },
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();

            let currentCustomGrades = customGrades;
            if (data.customGrades) {
              currentCustomGrades = data.customGrades;
              setCustomGrades(currentCustomGrades);
              if (typeof window !== "undefined") window.localStorage.setItem("arsenal_custom_grades", JSON.stringify(currentCustomGrades));
            }

            if (data.remnantPricing) {
              setRemnantPricing(data.remnantPricing);
              if (typeof window !== "undefined") window.localStorage.setItem("arsenal_remnant_pricing", JSON.stringify(data.remnantPricing));
            }

            if (data.economyItems) {
               setEconomyItems(data.economyItems);
               if (typeof window !== "undefined") window.localStorage.setItem("arsenal_economy_items", JSON.stringify(data.economyItems));
            }

            if (data.rawPrices) {
              const loadedPrices = { ...DEFAULT_RAW_PRICES };
              const allG = [...Object.keys(DEFAULT_RAW_PRICES), ...currentCustomGrades];
              allG.forEach((grade) => {
                const dbKey = sanitizeKey(grade);
                if (data.rawPrices[dbKey] !== undefined) {
                  loadedPrices[grade] = data.rawPrices[dbKey];
                }
              });
              setGlobalRawPrices(loadedPrices);
              if (typeof window !== "undefined") window.localStorage.setItem("arsenal_raw_prices", JSON.stringify(loadedPrices));
            }
            if (data.scrapPrice !== undefined) {
              setGlobalScrapPrice(data.scrapPrice);
              if (typeof window !== "undefined") window.localStorage.setItem("arsenal_scrap_price", data.scrapPrice);
            }
            if (data.remnantPrice !== undefined) {
              setGlobalRemnantPrice(data.remnantPrice);
              if (typeof window !== "undefined") window.localStorage.setItem("arsenal_remnant_price", data.remnantPrice);
            }
          }
        },
        (error) => {
          console.warn("Облако недоступно, работаем локально:", error);
          setIsCloudActive(false);
        }
      );
      return () => unsubscribe();
    }
  }, [user, isCloudActive]);

  const handleSaveGlobal = async (
    rawPricesObj: Record<string, string>,
    scrapStr: string,
    remnantStr: string,
    cGrades: string[],
    rPricing: Record<string, { round: string; hex: string }>,
    eItems?: any[]
  ) => {
    setGlobalRawPrices(rawPricesObj);
    setGlobalScrapPrice(scrapStr);
    setGlobalRemnantPrice(remnantStr);
    if (cGrades) setCustomGrades(cGrades);
    if (rPricing) setRemnantPricing(rPricing);
    if (eItems) setEconomyItems(eItems);

    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("arsenal_raw_prices", JSON.stringify(rawPricesObj));
        window.localStorage.setItem("arsenal_scrap_price", scrapStr);
        window.localStorage.setItem("arsenal_remnant_price", remnantStr);
        if (cGrades) window.localStorage.setItem("arsenal_custom_grades", JSON.stringify(cGrades));
        if (rPricing) window.localStorage.setItem("arsenal_remnant_pricing", JSON.stringify(rPricing));
        if (eItems) window.localStorage.setItem("arsenal_economy_items", JSON.stringify(eItems));
      }
    } catch (e) {}

    // @ts-ignore
    const appId = typeof window !== "undefined" && window.__app_id ? window.__app_id : "github-arsenal-app";
    if (db && user && appId && isCloudActive && user.uid !== "local-user") {
      const firestoreRawPrices: Record<string, string> = {};
      for (const [k, v] of Object.entries(rawPricesObj)) {
        firestoreRawPrices[sanitizeKey(k)] = v;
      }
      const payload: any = {
        rawPrices: firestoreRawPrices,
        scrapPrice: scrapStr,
        remnantPrice: remnantStr,
      };
      if (cGrades) payload.customGrades = cGrades;
      if (rPricing) payload.remnantPricing = rPricing;
      if (eItems) payload.economyItems = eItems;

      const pricesDocRef = doc(db, "artifacts", appId, "public", "data", "settings", "prices");
      await setDoc(pricesDocRef, payload, { merge: true });
    }
  };

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [view]);

  return (
    <div className="min-h-screen bg-[#F0F4F4] dark:bg-[#111310] flex flex-col font-sans">
      <AnimatePresence mode="wait">
        {view === "login" && (
          <motion.div 
            key="login"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col"
          >
            <LoginScreen 
              onManagerLogin={() => setView("manager")} 
              onAdminLogin={() => setView("admin")} 
              isCloudActive={isCloudActive}
              isDarkMode={isDarkMode}
              toggleTheme={toggleTheme}
            />
          </motion.div>
        )}

        {view === "admin" && (
          <motion.div 
            key="admin"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col"
          >
            <div className="flex-1 w-full max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-8">
              <AdminPanel
                initialRawPrices={globalRawPrices}
                initialScrap={globalScrapPrice}
                initialRemnant={globalRemnantPrice}
                initialCustomGrades={customGrades}
                initialRemnantPricing={remnantPricing}
                initialEconomyItems={economyItems}
                onSave={handleSaveGlobal}
                onLogout={() => setView("login")}
                isCloudActive={isCloudActive}
                isDarkMode={isDarkMode}
                toggleTheme={toggleTheme}
              />
            </div>
          </motion.div>
        )}

        {view === "manager" && (
          <motion.div 
            key="manager"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col"
          >
            <div className="flex-1 w-full max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-6 xl:px-8">
              <CalculatorApp
                adminRawPrices={globalRawPrices}
                adminScrapPrice={globalScrapPrice}
                adminRemnantPrice={globalRemnantPrice}
                customGrades={customGrades}
                remnantPricing={remnantPricing}
                economyItems={economyItems}
                onLogout={() => setView("login")}
                isCloudActive={isCloudActive}
                user={user}
                isDarkMode={isDarkMode}
                toggleTheme={toggleTheme}
                onAdminSwitch={() => setView("login")}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
