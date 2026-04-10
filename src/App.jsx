import { useState, useEffect, useCallback, useRef, createContext } from "react";
import { supabase } from "./lib/supabase";
import { SURAHS } from "./data/surahs";
import Auth from "./components/Auth";
import Dashboard from "./components/Dashboard";
import SurahCard from "./components/SurahCard";
import KhatmahModal from "./components/KhatmahModal";
import { ArrowRight, Info, Home, BookText } from "lucide-react";
import { FontContext } from "./FontContext";

export default function App() {
  //! test [ID: 01] تعريف الدالة المسببة للخطأ وتأمينها بلملي
  const getUniqueVersesCount = (surahLogs) => {
    if (!surahLogs || !Array.isArray(surahLogs)) return 0;
    const covered = new Set();
    surahLogs.forEach((l) => {
      if (l.verse_start && l.verse_end)
        for (let i = l.verse_start; i <= l.verse_end; i++) covered.add(i);
    });
    return covered.size;
  };

  const [userName, setUserName] = useState(
    () => localStorage.getItem("إسم_الحساب") || "",
  );
  const [view, setView] = useState("main");
  const [loginNameInput, setLoginNameInput] = useState("");
  const [fontSize, setFontSize] = useState(
    () => Number(localStorage.getItem("font-size")) || 18,
  );
  const [theme, setTheme] = useState(
    () => localStorage.getItem("nasaq-theme") || "dark",
  );
  const [streak, setStreak] = useState(
    () => Number(localStorage.getItem("nasaq-streak")) || 0,
  );
  const [riwaya, setRiwaya] = useState(
    () => localStorage.getItem("nasaq-riwaya") || "Hafs",
  );
  const [highlightMode, setHighlightMode] = useState(
    () => localStorage.getItem("nasaq-h-mode") || "row",
  );
  const [verseViewMode, setVerseViewMode] = useState(
    () => localStorage.getItem("nasaq-verse-mode") || "both",
  );

  const [quranData, setQuranData] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [currentGroup, setcurrentGroup] = useState(null);
  const [myKhatmats, setMyKhatmats] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [vRanges, setVRanges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [quickRegister, setQuickRegister] = useState(false);
  const [showHeader, setShowHeader] = useState(true);

  const riwayaAr = {
    Hafs: "حفص عن عاصم",
    Warsh: "ورش عن نافع",
    Qaloun: "قالون عن نافع",
    Douri: "الدوري عن أبي عمرو",
    Sousi: "السوسي عن أبي عمرو",
    Shuba: "شعبة عن عاصم",
  };

  useEffect(() => {
    async function loadQuran() {
      setDataLoading(true);
      try {
        const mod = await import(`./data/${riwaya}.json`);
        setQuranData(mod.default || []);
      } catch (e) {
        console.error(e);
      } finally {
        setDataLoading(false);
      }
    }
    loadQuran();
  }, [riwaya]);

  //! test [ID: 02] الخروج بـ Esc بلملي
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setSelected(null);
        setQuickRegister(false);
        if (view === "about") setView("main");
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [view]);

  const calculateGlobalProgress = () => {
    const total = 6236;
    const covered = new Set();
    (logs || []).forEach((l) => {
      if (l.verse_start && l.verse_end)
        for (let i = l.verse_start; i <= l.verse_end; i++)
          covered.add(`${l.surah_id}-${i}`);
    });
    return ((covered.size / total) * 100).toFixed(1);
  };

  const fetchData = useCallback(async () => {
    if (!userName) return;
    const { data: members } = await supabase
      .from("khatmah_members")
      .select("khatmah_id")
      .eq("user_name", userName);
    const ids = (members || []).map((m) => m.khatmah_id);
    const { data: khatmats } = await supabase
      .from("khatmats")
      .select("*")
      .or(
        `creator_name.eq."${userName}",id.in.(${ids.length ? ids.join(",") : "00000000-0000-0000-0000-000000000000"})`,
      );
    setMyKhatmats(khatmats || []);
    if (currentGroup) {
      const { data } = await supabase
        .from("khatmah_logs")
        .select("*")
        .eq("khatmah_id", currentGroup.id)
        .order("created_at", { ascending: true });
      setLogs(data || []);
    }
  }, [userName, currentGroup]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openModal = (surah, startAya = null) => {
    if (!surah) return;
    setSelected(surah);
    setQuickRegister(false);
    const occ = new Set();
    (logs || [])
      .filter((l) => l.surah_id === surah.id)
      .forEach((l) => {
        for (let i = l.verse_start; i <= l.verse_end; i++) occ.add(i);
      });
    if (startAya) {
      setVRanges([
        { id: null, start: startAya, end: 0, isActive: true, isSaved: false },
      ]);
      return;
    }
    const my = (logs || []).filter(
      (l) => l.surah_id === surah.id && l.user_name === userName,
    );
    if (my?.length > 0)
      setVRanges([
        ...my.map((l) => ({
          id: l.id,
          start: l.verse_start,
          end: l.verse_end,
          isActive: true,
          isSaved: true,
        })),
        { id: null, start: 0, end: 0, isActive: false, isSaved: false },
      ]);
    else {
      let f = 1;
      while (occ.has(f) && f <= (surah?.ayat || 0)) f++;
      setVRanges([
        {
          id: null,
          start: f <= (surah?.ayat || 0) ? f : 0,
          end: 0,
          isActive: true,
          isSaved: false,
        },
      ]);
    }
  };

  return (
    <FontContext.Provider
      value={{
        fontSize,
        setFontSize,
        theme,
        setTheme,
        streak,
        setStreak,
        verseViewMode,
        setVerseViewMode,
        riwaya,
        setRiwaya,
        highlightMode,
        setHighlightMode,
        quranData,
        dataLoading,
        getUniqueVersesCount,
      }}
    >
      <div
        dir="rtl"
        className={`min-h-screen transition-all ${theme === "dark" ? "bg-[#042f24] text-white" : "bg-emerald-50 text-slate-900"}`}
      >
        {!userName ? (
          <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center relative pb-24">
            <Auth
              loginNameInput={loginNameInput}
              setLoginNameInput={setLoginNameInput}
              onLogin={() => {
                if (loginNameInput) {
                  localStorage.setItem("إسم_الحساب", loginNameInput);
                  setUserName(loginNameInput);
                  fetchData();
                }
              }}
            />

            <footer className="absolute bottom-8 w-full text-center left-0 right-0">
              <button
                onClick={() => setView("about")}
                className="opacity-40 hover:opacity-100 font-black text-xs flex items-center gap-2 mx-auto"
              >
                <Info size={14} /> عن نَسَق
              </button>
            </footer>
            {/* //! test [ID: 05] إصلاح مودال (عن نسق) - تحسين الـ Blur والخلفية بلملي */}
            {view === "about" && (
              <div
                className="fixed inset-0 z-[300] bg-black/20 backdrop-blur-sm flex items-start justify-center overflow-y-auto px-4 py-12 sm:py-20"
                onClick={() => setView("main")}
              >
                <div className="w-full max-w-2xl my-auto">
                  <AboutView theme={theme} onClose={() => setView("main")} />
                </div>
              </div>
            )}
          </div>
        ) : !currentGroup ? (
          <div className="relative min-h-screen max-w-3xl mx-auto flex flex-col p-4 sm:p-8">
            <Dashboard
              userName={userName}
              myKhatmats={myKhatmats}
              setcurrentGroup={setcurrentGroup}
              onLogout={() => {}}
            />
            <footer className="text-center mt-auto">
              <button
                onClick={() => setView("about")}
                className="opacity-40 hover:opacity-100 font-black text-xs flex items-center gap-2 mx-auto"
              >
                <Info size={14} /> عن نَسَق
              </button>
            </footer>
            {/* //! test [ID: 06] إصلاح مودال (عن نسق) - تحسين الـ Blur والخلفية بلملي */}
            {view === "about" && (
              <div
                className="fixed inset-0 z-[300] bg-black/20 backdrop-blur-sm flex items-start justify-center overflow-y-auto px-4 py-12 sm:py-20"
                onClick={() => setView("main")}
              >
                <div className="w-full max-w-2xl my-auto">
                  <AboutView theme={theme} onClose={() => setView("main")} />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto flex flex-col min-h-screen p-4 sm:p-8">
            {/* //! test [ID: 04] هيدر المجموعة RTL: الاسم يمين والتقدم شمال بلملي صخر صخر */}
            <header
              className={`fixed top-0 left-0 right-0 z-[100] bg-[#042f24]/95 border-b border-emerald-800/20 py-4`}
            >
              <div className="max-w-3xl mx-auto flex flex-row items-center justify-between px-4">
                <div className="flex flex-row items-center gap-3">
                  <button
                    onClick={() => setcurrentGroup(null)}
                    className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500"
                  >
                    <ArrowRight size={22} />
                  </button>
                  <div className="flex flex-col text-right">
                    <h1 className="font-black text-[#ffb900] text-xl font-serif tracking-tight">
                      {currentGroup.name}
                    </h1>
                    <span className="opacity-60 font-bold text-[10px]">
                      رواية: {riwayaAr[riwaya]} • {userName}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="font-black text-emerald-500 text-sm">
                    {calculateGlobalProgress()}%
                  </div>
                </div>
              </div>
            </header>

            <main className="pt-20 pb-12 flex-grow">
              {view === "about" ? (
                <AboutView theme={theme} onClose={() => setView("main")} />
              ) : (
                <>
                  <div className="flex flex-col gap-6 mb-10">
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: "all", label: "كلّ" },
                        { id: "mine", label: "لم ننهها" },
                        { id: "remaining", label: "باقي" },
                        { id: "completed", label: "تمّت" },
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setFilter(t.id)}
                          className={`px-4 py-1.5 rounded-full font-black border transition-all ${filter === t.id ? "bg-[#ffb900] text-emerald-950 border-[#ffb900] shadow-lg scale-105" : "bg-emerald-900/10 border-emerald-800 text-emerald-500"}`}
                          style={{
                            fontSize: `${Math.max(10, fontSize - 6)}px`,
                          }}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setQuickRegister(true)}
                      className="font-black underline underline-offset-8 text-[#ffb900] active:scale-95 transition-all text-right"
                      style={{ fontSize: `${fontSize}px` }}
                    >
                      تسجيل سريع
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {SURAHS.map((s) => (
                      <SurahCard
                        key={s.id}
                        s={s}
                        logs={logs}
                        userName={userName}
                        onClick={openModal}
                      />
                    ))}
                  </div>
                </>
              )}
            </main>
            <footer className="py-4 text-center border-t border-emerald-500/5">
              <button
                onClick={() => setView("about")}
                className="opacity-40 hover:opacity-100 font-black text-xs flex items-center gap-2 mx-auto"
              >
                <Info size={14} /> عن نَسَق
              </button>
            </footer>
            <KhatmahModal
              selected={selected}
              setSelected={setSelected}
              quickRegister={quickRegister}
              setQuickRegister={setQuickRegister}
              logs={logs}
              userName={userName}
              vRanges={vRanges}
              setVRanges={setVRanges}
              loading={loading}
              onClaim={async () => {
                setLoading(true);
                const active = (vRanges || []).filter(
                  (r) => r.isActive && !r.isSaved && r.start > 0 && r.end > 0,
                );
                const inserts = active.map((r) => ({
                  surah_id: selected.id,
                  user_name: userName,
                  status: "reading",
                  verse_start: r.start,
                  verse_end: r.end,
                  khatmah_id: currentGroup.id,
                }));
                if (inserts.length > 0)
                  await supabase.from("khatmah_logs").insert(inserts);
                fetchData();
                setLoading(false);
                setSelected(null);
                setQuickRegister(false);
              }}
              onDeleteRange={async (id) => {
                await supabase.from("khatmah_logs").delete().eq("id", id);
                fetchData();
              }}
              onDeleteAll={async () => {
                if (window.confirm("حذف كل قراءاتك؟"))
                  await supabase
                    .from("khatmah_logs")
                    .delete()
                    .match({ surah_id: selected.id, user_name: userName });
                fetchData();
                setSelected(null);
              }}
              isCreator={currentGroup.creator_name === userName}
              getOccupiedVerses={(id) => {
                const occ = new Set();
                (logs || [])
                  .filter((l) => l.surah_id === id)
                  .forEach((log) => {
                    for (let i = log.verse_start; i <= log.verse_end; i++)
                      occ.add(i);
                  });
                return occ;
              }}
              openModal={openModal}
            />
          </div>
        )}
      </div>
    </FontContext.Provider>
  );
}
function AboutView({ theme, onClose }) {
  return (
    <>
      <style>{`
        .quran-scroll::-webkit-scrollbar { width: 4px; } 
        .quran-scroll::-webkit-scrollbar-track { background: transparent; margin: 48px 0; }
        .quran-scroll::-webkit-scrollbar-thumb { background: #ffb900; border-radius: 10px; } 
      `}</style>
      <div
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
        className="w-full h-fit max-h-[85vh] overflow-y-auto quran-scroll bg-gradient-to-b from-[#064e3b] to-[#022a1d] p-8 ps-10 sm:p-12 sm:ps-14 rounded-[3rem] border border-emerald-700/40 text-right shadow-2xl relative z-10"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -z-10"></div>

        <button
          onClick={onClose}
          className="absolute top-6 left-6 p-3 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 active:scale-95 transition-all z-20"
        >
          <Home size={22} />
        </button>

        <div className="flex flex-col items-center gap-4 mb-10 text-center relative z-10">
          <div className="p-5 bg-[#ffb900]/10 rounded-full border border-[#ffb900]/20 shadow-inner">
            <BookText size={48} className="text-[#ffb900]" />
          </div>
          <h2 className="text-4xl font-black font-serif text-[#ffb900] tracking-tighter">
            نَسَق
          </h2>
          <span className="text-emerald-400 font-mono text-xs tracking-widest uppercase font-bold bg-emerald-900/40 px-4 py-1.5 rounded-full border border-emerald-800/50">
            Nasaq Platform
          </span>
        </div>

        <div className="space-y-4 text-[16px] font-bold leading-[2.2] text-emerald-50 relative z-10">
          <div className="p-6 rounded-3xl bg-emerald-900/30 border border-emerald-500/10 shadow-sm hover:bg-emerald-900/40 transition-colors">
            <p>
              <span className="text-[#ffb900] text-lg font-black">«نَسَق»</span>{" "}
              هي منصة ذكية صُممت لتنظيم خِتمتك القرآنية، ومتابعة وردك اليومي
              بيسر وسهولة، سواء كنت تقرأ بمفردك أو ضمن مجموعة.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-emerald-900/30 border border-emerald-500/10 shadow-sm hover:bg-emerald-900/40 transition-colors">
            <p>
              يتيح لك النظام إنشاء مجموعات قراءة ومزامنة الإنجاز مع أصحابك{" "}
              <span className="text-amber-400 border-b border-dashed border-amber-400/50 pb-1">
                لحظياً
              </span>
              ، مما يعين على التنافس المحمود والالتزام المستمر.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-emerald-900/30 border border-emerald-500/10 shadow-sm hover:bg-emerald-900/40 transition-colors">
            <p>
              تتميز المنصة بواجهة خالية من المشتتات، مع دعم كامل لعدة روايات،
              وتوثيق دقيق للآيات المقروءة لضمان حفظ تقدمك وحمايته من الضياع.
            </p>
          </div>
        </div>

        <footer className="mt-12 pt-8 border-t border-emerald-700/30 text-center space-y-3 relative z-10">
          <p className="text-xs opacity-60 text-emerald-100 font-black">
            تم البحث عن الآيات بمساعدة ملفات
          </p>
          <a
            href="http://tanzil.net/"
            target="_blank"
            rel="noreferrer"
            className="inline-block text-[11px] text-[#ffb900] opacity-70 hover:opacity-100 transition-all font-black uppercase tracking-wider"
          >
            Tanzil - Quran Navigator
          </a>
          <p className="text-[9px] opacity-30 mt-6 font-black uppercase tracking-widest text-emerald-100">
            نَسَق - لخدمة كتاب الله © 2026
          </p>
        </footer>
      </div>
    </>
  );
}
