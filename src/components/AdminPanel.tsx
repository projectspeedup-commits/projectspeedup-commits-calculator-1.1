import { DEFAULT_STEEL_GRADES, formatInputValue, handleNumericInput, DEFAULT_ECONOMY_ITEMS, EconomyItem } from "../lib/constants";
import { Activity, LogOut, Plus, Trash2, Settings, Moon, Sun, Info, TrendingUp, Calculator, Wallet, Layers } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface AdminPanelProps {
  initialRawPrices: Record<string, string>;
  initialScrap: string;
  initialRemnant: string;
  initialCustomGrades: string[];
  initialRemnantPricing: Record<string, { round: string; hex: string }>;
  initialEconomyItems?: EconomyItem[];
  onSave: (
    rawPrices: Record<string, string>,
    scrap: string,
    remnant: string,
    customGrades: string[],
    remnantPricing: Record<string, { round: string; hex: string }>,
    economyItems: EconomyItem[]
  ) => Promise<void>;
  onLogout: () => void;
  isCloudActive: boolean;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export function AdminPanel({
  initialRawPrices,
  initialScrap,
  initialRemnant,
  initialCustomGrades,
  initialRemnantPricing,
  initialEconomyItems,
  onSave,
  onLogout,
  isCloudActive,
  isDarkMode,
  toggleTheme,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<"prices" | "economy" | "grades">("prices");
  const [rawPrices, setRawPrices] = useState(initialRawPrices);
  const [scrap, setScrap] = useState(initialScrap);
  const [remnant, setRemnant] = useState(initialRemnant);
  const [customGrades, setCustomGrades] = useState(initialCustomGrades || []);
  const [remnantPricing, setRemnantPricing] = useState<Record<string, { round: string; hex: string }>>(initialRemnantPricing || {});
  const [economyItems, setEconomyItems] = useState<EconomyItem[]>(initialEconomyItems && initialEconomyItems.length > 0 ? initialEconomyItems : DEFAULT_ECONOMY_ITEMS);

  const [newGrade, setNewGrade] = useState("");
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    setRawPrices(initialRawPrices);
    setScrap(initialScrap);
    setRemnant(initialRemnant);
    setCustomGrades(initialCustomGrades || []);
    setRemnantPricing(initialRemnantPricing || {});
    if (initialEconomyItems && initialEconomyItems.length > 0) {
      setEconomyItems(initialEconomyItems);
    }
  }, [initialRawPrices, initialScrap, initialRemnant, initialCustomGrades, initialRemnantPricing, initialEconomyItems]);

  const allGrades = [...DEFAULT_STEEL_GRADES, ...customGrades];

  const RemnantPricingTooltip = () => (
    <div className="group relative inline-block ml-1 align-middle">
      <Info className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 cursor-help" />
      <div className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 bg-[#1A1C19] dark:bg-slate-700 text-white text-[10px] rounded-xl shadow-2xl w-60 z-[100] transition-all normal-case font-normal text-left border border-slate-700">
        <div className="font-bold mb-1 border-b border-white/10 pb-1 text-[11px]">Типы остатков</div>
        <div className="space-y-2 opacity-95">
          <div>
            <span className="text-sky-300 font-bold uppercase tracking-tighter">Деловой остаток:</span>
            <p className="mt-0.5 leading-relaxed">Длинные куски (обычно &gt;2.5м), которые можно продать как полноценную заготовку по цене делового остатка.</p>
          </div>
          <div>
            <span className="text-red-400 font-bold uppercase tracking-tighter">По цене лома:</span>
            <p className="mt-0.5 leading-relaxed">Мелкие обрезки и технические концы, которые не имеют складской ценности и продаются по весу лома.</p>
          </div>
        </div>
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-[#1A1C19] dark:border-t-slate-700"></div>
      </div>
    </div>
  );

  const handlePriceChange = (grade: string, value: string) => {
    let val = value.replace(/\s/g, "").replace(/,/g, ".");
    if (val === "" || /^\d*\.?\d*$/.test(val)) {
      setRawPrices((prev) => ({ ...prev, [grade]: val }));
    }
  };

  const handlePricingChange = (grade: string, profile: "round" | "hex", value: string) => {
    setRemnantPricing((prev) => ({
      ...prev,
      [grade]: {
        ...(prev[grade] || { round: "remnant", hex: "remnant" }),
        [profile]: value,
      },
    }));
  };

  const handleAddGrade = () => {
    const grade = newGrade.trim();
    if (grade && !allGrades.includes(grade)) {
      setCustomGrades([...customGrades, grade]);
      setNewGrade("");
    }
  };

  const handleRemoveGrade = (gradeToRemove: string) => {
    setCustomGrades(customGrades.filter((g) => g !== gradeToRemove));
    const newPrices = { ...rawPrices };
    delete newPrices[gradeToRemove];
    setRawPrices(newPrices);

    const newPricing = { ...remnantPricing };
    delete newPricing[gradeToRemove];
    setRemnantPricing(newPricing);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError("");
    try {
      const savePromise = onSave(rawPrices, scrap, remnant, customGrades, remnantPricing, economyItems);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("CloudTimeout")), 5000)
      );

      await Promise.race([savePromise, timeoutPromise]);

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error("Ошибка сохранения:", e);
      setSaveError("Облако недоступно. Сохранено локально.");
      setTimeout(() => setSaveError(""), 4000);
    }
    setIsSaving(false);
  };

  const handleEconomyChange = (id: string, field: keyof EconomyItem, value: string) => {
    const val = value.replace(/\s/g, "").replace(/,/g, ".");
    if (val === "" || /^\d*\.?\d*$/.test(val)) {
      setEconomyItems(prev => prev.map(item => 
        item.id === id ? { ...item, [field]: val } : item
      ));
    }
  };

  const directItems = economyItems.filter(i => i.category === 'direct');
  const overheadItems = economyItems.filter(i => i.category === 'overhead');

  return (
    <div className="min-h-screen bg-[#F4F5F4] dark:bg-[#121411] flex flex-col md:flex-row transition-colors duration-300">
      {/* Mobile App Navigation Bar */}
      <div className="md:hidden fixed bottom-0 w-full bg-white/95 dark:bg-[#1A1C19]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex justify-between items-center h-16 px-2 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] print:hidden">
         <button 
           onClick={() => setActiveTab("prices")}
           className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${activeTab === 'prices' ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}
         >
           <div className={`px-4 py-1 rounded-full mb-1 transition-colors ${activeTab === 'prices' ? 'bg-slate-100 dark:bg-slate-800' : ''}`}>
             <Settings className="w-5 h-5" />
           </div>
           <span className="text-[10px] font-bold tracking-tight">Цены</span>
         </button>

         <button 
           onClick={() => setActiveTab("economy")}
           className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${activeTab === 'economy' ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}
         >
           <div className={`px-4 py-1 rounded-full mb-1 transition-colors ${activeTab === 'economy' ? 'bg-slate-100 dark:bg-slate-800' : ''}`}>
             <Calculator className="w-5 h-5" />
           </div>
           <span className="text-[10px] font-bold tracking-tight">Экономика</span>
         </button>

         <button 
           onClick={() => setActiveTab("grades")}
           className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${activeTab === 'grades' ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}
         >
           <div className={`px-4 py-1 rounded-full mb-1 transition-colors ${activeTab === 'grades' ? 'bg-slate-100 dark:bg-slate-800' : ''}`}>
             <Layers className="w-5 h-5" />
           </div>
           <span className="text-[10px] font-bold tracking-tight">Марки</span>
         </button>

         <div className="w-[1px] h-8 bg-slate-100 dark:bg-slate-800 mx-1"></div>

         <button onClick={toggleTheme} className="flex flex-col items-center justify-center flex-1 h-full py-1 text-slate-400 dark:text-slate-500 active:scale-95 transition-all">
           <div className="px-3 py-1 mb-1">
             {isDarkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
           </div>
           <span className="text-[10px] font-bold tracking-tight">Тема</span>
         </button>

         <button onClick={onLogout} className="flex flex-col items-center justify-center flex-1 h-full py-1 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-all">
           <div className="px-3 py-1 mb-1">
             <LogOut className="w-5 h-5" />
           </div>
           <span className="text-[10px] font-bold tracking-tight font-sans">Выйти</span>
         </button>
      </div>

      {/* Desktop Navigation Rail */}
      <aside className="hidden md:flex flex-col w-[88px] bg-slate-50 dark:bg-[#1A1C19] border-r border-slate-200 dark:border-slate-800 items-center py-6 sticky top-0 h-screen z-50 shrink-0 transition-colors duration-300">
        <div className="flex flex-col items-center mb-8">
           <div className="w-12 h-12 bg-slate-700 dark:bg-slate-600 rounded-xl flex items-center justify-center text-white mb-2 shadow-sm">
             <Calculator className="w-6 h-6" strokeWidth={1.5} />
           </div>
        </div>
        <div className="flex-1 flex flex-col gap-4 w-full px-3">
           <button 
             onClick={() => setActiveTab("prices")}
             className={`w-full flex flex-col items-center justify-center py-4 transition-all active:scale-95 group ${activeTab === 'prices' ? 'text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
           >
             <div className={`px-5 py-1.5 mb-1.5 rounded-full transition-colors ${activeTab === 'prices' ? 'bg-slate-200 dark:bg-slate-700' : 'group-hover:bg-slate-100 dark:group-hover:bg-slate-800'}`}>
               <Settings className="w-6 h-6" strokeWidth={2} />
             </div>
             <span className="text-[11px] font-medium tracking-wide">Цены</span>
           </button>

           <button 
             onClick={() => setActiveTab("economy")}
             className={`w-full flex flex-col items-center justify-center py-4 transition-all active:scale-95 group ${activeTab === 'economy' ? 'text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
           >
             <div className={`px-5 py-1.5 mb-1.5 rounded-full transition-colors ${activeTab === 'economy' ? 'bg-slate-200 dark:bg-slate-700' : 'group-hover:bg-slate-100 dark:group-hover:bg-slate-800'}`}>
               <Calculator className="w-6 h-6" strokeWidth={2} />
             </div>
             <span className="text-[11px] font-medium tracking-wide">Нормы</span>
           </button>

           <button 
             onClick={() => setActiveTab("grades")}
             className={`w-full flex flex-col items-center justify-center py-4 transition-all active:scale-95 group ${activeTab === 'grades' ? 'text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
           >
             <div className={`px-5 py-1.5 mb-1.5 rounded-full transition-colors ${activeTab === 'grades' ? 'bg-slate-200 dark:bg-slate-700' : 'group-hover:bg-slate-100 dark:group-hover:bg-slate-800'}`}>
               <Layers className="w-6 h-6" strokeWidth={2} />
             </div>
             <span className="text-[11px] font-medium tracking-wide">Марки</span>
           </button>

           <button onClick={toggleTheme} className="w-full flex flex-col items-center justify-center py-4 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95 group">
              <div className="px-5 py-1.5 mb-1.5 transition-colors group-hover:bg-slate-100 dark:group-hover:bg-slate-800 rounded-full">
                {isDarkMode ? <Sun className="w-6 h-6 text-amber-500" strokeWidth={2} /> : <Moon className="w-6 h-6" strokeWidth={2} />}
              </div>
              <span className="text-[11px] font-medium tracking-wide">{isDarkMode ? 'Светлая' : 'Темная'}</span>
           </button>
        </div>
        <div className="w-full px-3">
           <button onClick={onLogout} className="w-full flex flex-col items-center justify-center py-4 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors group">
             <div className="px-5 py-1.5 mb-1.5 transition-colors group-hover:bg-red-50 dark:group-hover:bg-red-900/10 rounded-full">
               <LogOut className="w-6 h-6 group-hover:text-red-500" strokeWidth={2} />
             </div>
             <span className="text-[11px] font-medium tracking-wide">Выйти</span>
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 pb-24 md:pb-8 pt-8 px-4 sm:px-8 w-full max-w-[1440px] mx-auto overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === "prices" ? (
            <motion.div
              key="prices"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-8">
                <h2 className="text-3xl font-normal tracking-tight text-[#1A1C19] dark:text-white">
                  Цена заготовки
                </h2>
                <p className="text-sm text-[#43483F] dark:text-slate-400 mt-2">
                  {isCloudActive
                    ? "Цены автоматически синхронизируются со всеми менеджерами компании."
                    : "Внимание: Облако недоступно. Сохраняется локально."}
                </p>
              </div>

              <div className="flex flex-col md:grid md:grid-cols-12 gap-6 w-full">
                {/* Main settings column */}
                <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
                  
                  {/* Pricing table */}
                  <div className="bg-white dark:bg-[#1A1C19] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col transition-colors">
                    <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                      <h3 className="text-base font-medium text-[#1A1C19] dark:text-white">
                        Цены и политика продажи
                      </h3>
                    </div>
                    <div className="overflow-x-auto p-0 m-0">
                      <div className="inline-block min-w-full align-middle">
                        <table className="w-full text-left whitespace-nowrap">
                          <thead className="text-[#43483F] dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-transparent">
                            <tr>
                              <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider">Марка стали</th>
                              <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-right">Цена (руб/тн) БЕЗ НДС</th>
                              <th className="px-4 py-3 w-12"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {allGrades.map((grade) => {
                              const isCustom = customGrades.includes(grade);

                              return (
                                <tr key={grade} className="bg-white dark:bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                  <td className="px-6 py-4 font-medium text-[#1A1C19] dark:text-slate-100 text-sm">
                                    {grade}
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="relative w-[140px] ml-auto">
                                      <input
                                        type="text"
                                        inputMode="decimal"
                                        placeholder="0"
                                        value={formatInputValue(rawPrices[grade] || "")}
                                        onChange={(e) => handlePriceChange(grade, e.target.value)}
                                        className="w-full bg-transparent border-b border-slate-300 dark:border-slate-700 focus:border-slate-800 dark:focus:border-slate-400 focus:outline-none text-right text-sm font-bold h-9 pl-3 pr-10 dark:text-white placeholder:text-slate-400"
                                      />
                                      <span className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 font-bold text-[11px] pointer-events-none">руб.</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 text-center align-middle">
                                    {isCustom ? (
                                      <button
                                        onClick={() => handleRemoveGrade(grade)}
                                        className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                                        title="Удалить марку"
                                      >
                                        <Trash2 className="w-5 h-5" />
                                      </button>
                                    ) : (
                                      <div className="w-9"></div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Secondary settings column */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                  
                  {/* Save actions block */}
                  <div className="bg-white dark:bg-[#1A1C19] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-4">
                    <h3 className="text-base font-medium text-[#1A1C19] dark:text-white">Сохранение изменений</h3>
                    
                    {saveError && (
                      <div className="text-red-500 dark:text-red-400 text-sm font-medium bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">
                        {saveError}
                      </div>
                    )}
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className={`w-full flex justify-center items-center gap-2 text-white rounded-full h-12 px-6 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        saved ? "bg-green-700 dark:bg-green-600 hover:bg-green-800 focus:ring-green-700" : "bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 focus:ring-slate-800"
                      } ${isSaving ? "opacity-70 pointer-events-none" : ""}`}
                    >
                      {isSaving ? "Сохранение..." : saved ? "✓ Сохранено" : "Сохранить настройки"}
                    </button>
                  </div>

                  {/* Scrap and Remnant */}
                  <div className="bg-white dark:bg-[#1A1C19] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-6">
                    <h3 className="text-base font-medium text-[#1A1C19] dark:text-white">Базовые цены</h3>
                    <div className="space-y-5">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-[#43483F] dark:text-slate-400">Цена лома (руб/тн) БЕЗ НДС</label>
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="20 000"
                            value={formatInputValue(scrap)}
                            onChange={(e) => handleNumericInput(e, setScrap)}
                            className="w-full bg-[#F0F4F4] dark:bg-slate-800/50 border-b border-slate-300 dark:border-slate-700 rounded-lg pl-3 pr-12 h-12 text-sm focus:border-slate-800 dark:focus:border-slate-200 focus:outline-none focus:ring-0 transition-colors dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-medium text-sm">руб</span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-[#43483F] dark:text-slate-400">Цена делового остатка (руб/тн) БЕЗ НДС</label>
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="35 000"
                            value={formatInputValue(remnant)}
                            onChange={(e) => handleNumericInput(e, setRemnant)}
                            className="w-full bg-[#F0F4F4] dark:bg-slate-800/50 border-b border-slate-300 dark:border-slate-700 rounded-t-lg pl-3 pr-12 h-12 text-sm focus:border-slate-800 dark:focus:border-slate-200 focus:outline-none focus:ring-0 transition-colors dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm">руб</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Add grade */}
                  <div className="bg-white dark:bg-[#1A1C19] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-4">
                    <h3 className="text-base font-medium text-[#1A1C19] dark:text-white">Новая марка стали</h3>
                    <div className="flex flex-col gap-3">
                      <input
                        type="text"
                        placeholder="Например: ст.50"
                        value={newGrade}
                        onChange={(e) => setNewGrade(e.target.value)}
                        className="w-full bg-[#F0F4F4] dark:bg-slate-800/50 border-b border-slate-300 dark:border-slate-700 rounded-t-lg px-4 h-12 text-sm focus:border-slate-800 dark:focus:border-slate-200 focus:outline-none focus:ring-0 transition-colors dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      />
                      <button
                        onClick={handleAddGrade}
                        disabled={!newGrade.trim()}
                        className="w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-white disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-800 flex items-center justify-center gap-2 rounded-full h-11 px-6 text-sm font-medium transition-colors border border-slate-200 dark:border-slate-600 shadow-sm"
                      >
                        <Plus className="w-5 h-5" />
                        <span>Добавить</span>
                      </button>
                    </div>
                  </div>
                  
                </div>
              </div>
            </motion.div>
          ) : activeTab === "economy" ? (
            <motion.div
              key="economy"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-8"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-normal tracking-tight text-[#1A1C19] dark:text-white">
                    Экономика производства
                  </h2>
                  <p className="text-sm text-[#43483F] dark:text-slate-400 mt-2 max-w-2xl">
                    Управление нормами ресурсов и накладными расходами. Эти данные используются для определения полной себестоимости продукции.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                   <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`flex items-center justify-center gap-2 px-6 h-12 rounded-2xl text-sm font-bold transition-all shadow-sm ${
                      saved ? "bg-emerald-500 text-white" : "bg-slate-900 dark:bg-slate-700 text-white hover:bg-slate-800"
                    } ${isSaving ? "opacity-70" : ""}`}
                  >
                    {isSaving ? "Сохранение..." : saved ? "✓ Сохранено" : "Сохранить всё"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8">
                {/* Direct Variable Costs */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 px-1">
                    <Calculator className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">Прямые затраты</h3>
                  </div>
                  <div className="bg-white dark:bg-[#1A1C19] rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left min-w-[300px]">
                        <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          <tr>
                            <th className="px-4 sm:px-6 py-4">Статья</th>
                            <th className="px-4 sm:px-6 py-4 text-right">Норма на тн (руб)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {directItems.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="px-4 sm:px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-200">{item.name}</td>
                              <td className="px-4 sm:px-6 py-4">
                                <div className="relative w-full max-w-[140px] sm:max-w-[192px] ml-auto">
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={item.norm}
                                    onChange={(e) => handleEconomyChange(item.id, 'norm', e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border-0 rounded-xl pl-3 pr-8 sm:pl-4 sm:pr-10 h-11 text-right text-sm font-bold focus:ring-2 focus:ring-slate-400 dark:text-white"
                                  />
                                  <span className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold text-xs pointer-events-none">₽</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/50 rounded-2xl p-6 flex flex-col sm:flex-row items-start gap-4">
                <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shrink-0 motion-safe:animate-pulse">
                   <Info className="w-6 h-6 text-white" />
                </div>
                <div className="flex flex-col gap-1">
                  <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300">Как это работает?</h4>
                  <p className="text-xs text-blue-800/70 dark:text-blue-400/70 leading-relaxed">
                    Для <b>Прямых затрат</b> укажите норму расхода (абсолютную стоимость) на 1 тонну готовой продукции. Калькулятор автоматически вычислит влияние этих цифр на рентабельность заказов при расчете в основном интерфейсе.
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="grades"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-8"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-normal tracking-tight text-[#1A1C19] dark:text-white">
                    Параметры марок
                  </h2>
                  <p className="text-sm text-[#43483F] dark:text-slate-400 mt-2 max-w-2xl">
                    Настройка политик учета остатков для каждой марки стали по типам профиля.
                  </p>
                </div>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`flex items-center justify-center gap-2 px-6 h-12 rounded-2xl text-sm font-bold transition-all shadow-sm ${
                    saved ? "bg-emerald-500 text-white" : "bg-slate-900 dark:bg-slate-700 text-white hover:bg-slate-800"
                  } ${isSaving ? "opacity-70" : ""}`}
                >
                  {isSaving ? "Сохранение..." : saved ? "✓ Сохранено" : "Сохранить всё"}
                </button>
              </div>

              <div className="flex flex-col gap-4 mt-4">
                <div className="flex items-center gap-2 px-1">
                  <Layers className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white">Параметры по маркам стали</h3>
                </div>
                <div className="bg-white dark:bg-[#1A1C19] rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[400px]">
                      <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        <tr>
                          <th className="px-4 sm:px-6 py-4">Марка стали</th>
                          <th className="px-4 sm:px-6 py-4 text-center">Политика (Круг) <RemnantPricingTooltip /></th>
                          <th className="px-4 sm:px-6 py-4 text-center">Политика (Ш-гр) <RemnantPricingTooltip /></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {allGrades.map(grade => {
                          const pricing = remnantPricing[grade] || { round: "remnant", hex: "remnant" };
                          return (
                            <tr key={grade} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="px-4 sm:px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">{grade}</td>
                              <td className="px-4 sm:px-6 py-4">
                                <select
                                  value={pricing.round}
                                  onChange={(e) => handlePricingChange(grade, "round", e.target.value)}
                                  className={`bg-slate-50 dark:bg-slate-800 text-xs font-bold rounded-xl px-2 sm:px-4 py-2.5 outline-none appearance-none cursor-pointer w-[120px] sm:w-[160px] mx-auto block border-0 focus:ring-2 focus:ring-slate-400 ${
                                    pricing.round === "scrap" ? "text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20" : "text-slate-900 dark:text-white"
                                  }`}
                                >
                                  <option value="remnant">Деловой остаток</option>
                                  <option value="scrap">По цене лома</option>
                                </select>
                              </td>
                              <td className="px-4 sm:px-6 py-4">
                                <select
                                  value={pricing.hex}
                                  onChange={(e) => handlePricingChange(grade, "hex", e.target.value)}
                                  className={`bg-slate-50 dark:bg-slate-800 text-xs font-bold rounded-xl px-2 sm:px-4 py-2.5 outline-none appearance-none cursor-pointer w-[120px] sm:w-[160px] mx-auto block border-0 focus:ring-2 focus:ring-slate-400 ${
                                    pricing.hex === "scrap" ? "text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20" : "text-slate-900 dark:text-white"
                                  }`}
                                >
                                  <option value="remnant">Деловой остаток</option>
                                  <option value="scrap">По цене лома</option>
                                </select>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
