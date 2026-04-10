import { useContext, useState, useRef, useMemo, useEffect } from "react";
import { FontContext } from "../FontContext";
import {
  X,
  Trash2,
  BookOpen,
  Book,
  Search,
  Loader2,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import simpleQuran from "../data/quran-simple-clean.json";
import { SURAHS } from "../data/surahs";

const VerseSelect = ({
  value,
  onChange,
  disabled,
  surahId,
  ayatCount,
  occupied,
  label,
  theme,
  verseViewMode,
  fontSize,
  startLimit,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);
  const isMobile = window.innerWidth < 640;

  const filtered = useMemo(
    () =>
      Array.from({ length: ayatCount || 0 }, (_, i) => i + 1).filter((n) => {
        const txt =
          simpleQuran.find((v) => v.sura === surahId && v.aya === n)?.text ||
          "";
        const matchesSearch =
          n.toString().includes(query) || txt.includes(query);
        const satisfiesLimit = startLimit ? n >= startLimit : true;
        return matchesSearch && satisfiesLimit;
      }),
    [surahId, ayatCount, query, startLimit],
  );

  useEffect(() => {
    const out = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", out);
    return () => document.removeEventListener("mousedown", out);
  }, []);

  return (
    <div className="relative flex-1 overflow-visible" ref={ref}>
      {!isOpen ? (
        <button
          disabled={disabled}
          onClick={() => setIsOpen(true)}
          style={{
            fontSize: `${isMobile ? fontSize - 5 : fontSize}px`,
            fontWeight: "900",
          }}
          className={`w-full rounded-2xl p-4 text-center border transition-all ${theme === "dark" ? "bg-[#004030] border-emerald-800 text-emerald-300" : "bg-white border-slate-800 shadow-sm"}`}
        >
          {value === 0
            ? label
            : value === 1
              ? "أول آية"
              : value === ayatCount
                ? `آخـر (${value})`
                : value}
        </button>
      ) : (
        <div
          className={`w-full flex items-center ${theme === "dark" ? "bg-[#004030]" : "bg-slate-100"} border-2 border-amber-500 rounded-2xl px-3 shadow-xl`}
        >
          <Search size={16} className="text-amber-500" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="رقم.."
            className={`w-full p-4 bg-transparent outline-none ${theme === "dark" ? "text-white" : "text-slate-900"} font-black text-sm`}
          />
        </div>
      )}
      {isOpen && (
        <div
          className={`absolute bottom-full mb-3 left-0 right-0 z-[1100] rounded-3xl border-2 ${theme === "dark" ? "bg-[#004030] border-emerald-800" : "bg-white border-slate-300"} shadow-2xl overflow-hidden opacity-100`}
        >
          <div className="max-h-[400px] overflow-y-auto quran-scroll bg-inherit">
            {(filtered || []).map((n) => (
              <button
                key={n}
                disabled={occupied.has(n)}
                onClick={() => {
                  onChange(n);
                  setIsOpen(false);
                  setQuery("");
                }}
                className={`w-full p-5 text-right border-b ${theme === "dark" ? "border-emerald-800 hover:bg-[#ffb900]/15" : "border-slate-100 hover:bg-slate-50"} last:border-0 flex justify-between items-center gap-3 ${occupied.has(n) ? "opacity-30 grayscale" : ""}`}
              >
                <span className="font-black text-[#ffb900] text-xs">
                  آية {n}
                </span>
                <span
                  className={`truncate opacity-100 font-serif text-[13px] font-bold ${theme === "dark" ? "text-emerald-50" : "text-slate-900"}`}
                >
                  {simpleQuran
                    .find((v) => v.sura === surahId && v.aya === n)
                    ?.text.split(" ")
                    .slice(0, 3)
                    .join(" ")}
                  ..
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function KhatmahModal({
  selected,
  setSelected,
  quickRegister,
  setQuickRegister,
  logs,
  userName,
  vRanges,
  setVRanges,
  loading,
  onClaim,
  onDeleteRange,
  onDeleteAll,
  onFullReset,
  isCreator,
  getOccupiedVerses,
  openModal,
}) {
  const { fontSize, theme, quranData, dataLoading } = useContext(FontContext);
  const [showFullQuran, setShowFullQuran] = useState(false);
  const [continuousReading, setContinuousReading] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [verseMenu, setVerseMenu] = useState(null);
  const [qSearch, setQSearch] = useState("");

  const isMobile = window.innerWidth < 640;
  const surahPages = useMemo(() => {
    if (!selected || dataLoading) return [];
    const pages = [
      ...new Set(
        quranData?.filter((v) => v.sura === selected.id).map((v) => v.page),
      ),
    ];
    return pages.sort((a, b) => a - b);
  }, [selected, quranData, dataLoading]);

  const quickResults = useMemo(() => {
    if (!quickRegister || qSearch.length < 2) return null;
    const suras = SURAHS.filter((s) => s.name_ar.includes(qSearch));
    const ayas = simpleQuran
      .filter((v) => v.text.includes(qSearch))
      .slice(0, 15);
    return { suras, ayas };
  }, [qSearch, quickRegister]);

  useEffect(() => {
    if (selected) setVerseMenu(null);
  }, [selected]);

  if (!selected && !quickRegister) return null;
  const occupied = selected ? getOccupiedVerses(selected.id) : new Set();

  const toggleVerseMenu = (aya, e) => {
    if (occupied.has(aya)) return;
    if (verseMenu?.aya === aya) setVerseMenu(null);
    else setVerseMenu({ aya, x: e.clientX, y: e.clientY });
  };

  const setVerseRangeTouch = (type, aya) => {
    if (!vRanges || vRanges.length === 0) return;
    const r = [...vRanges];
    const lastIdx = r.length - 1;
    if (type === "from") {
      r[lastIdx].start = aya;
      r[lastIdx].end = 0;
      r[lastIdx].isActive = true;
    } else {
      r[lastIdx].end = aya;
      r[lastIdx].isActive = true;
    }
    setVRanges(r);
    setVerseMenu(null);
  };

  if (dataLoading && selected)
    return (
      <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center">
        <Loader2 className="animate-spin text-[#ffb900] w-12 h-12" />
      </div>
    );

  return (
    <>
      <style>{` .quran-scroll::-webkit-scrollbar { width: 3px; } .quran-scroll::-webkit-scrollbar-thumb { background: #ffb900; border-radius: 10px; } `}</style>
      <div
        className="fixed inset-0 z-[200] bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-md"
        onClick={() => {
          setSelected(null);
          setQuickRegister(false);
        }}
      >
        <div
          className={`w-full transition-all duration-500 ease-in-out ${showFullQuran || quickRegister ? "max-w-4xl h-[65vh] sm:h-auto" : "max-w-xl h-auto"} ${theme === "dark" ? "bg-[#042f24] border-emerald-800 shadow-2xl" : "bg-white border-slate-200 shadow-xl"} rounded-t-[3.5rem] sm:rounded-[3.5rem] p-5 sm:p-10 shadow-2xl overflow-y-auto overflow-x-hidden quran-scroll text-right`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-10 px-2">
            <button
              onClick={() => {
                setSelected(null);
                setQuickRegister(false);
              }}
              className={`p-3 rounded-full transition-all ${theme === "dark" ? "bg-emerald-900/40 text-emerald-300" : "bg-slate-100 text-slate-400"}`}
            >
              <X size={24} />
            </button>
            {selected && (
              <button
                onClick={() => setShowFullQuran(!showFullQuran)}
                className="text-[#ffb900] transition-all active:scale-90"
              >
                <BookOpen size={36} className="fill-[#ffb90015]" />
              </button>
            )}
            <h2
              className={`text-3xl font-black font-serif tracking-tighter ${theme === "dark" ? "text-[#ffb900]" : "text-black"}`}
            >
              {selected ? selected.name_ar : "البحث السريع"}
            </h2>
          </div>

          {quickRegister && !selected && (
            <div className="flex flex-col-reverse px-2">
              <div
                className={`flex items-center gap-4 p-6 rounded-[2.5rem] border-2 mt-8 ${theme === "dark" ? "bg-[#004030] border-emerald-800" : "bg-slate-50 border-slate-100"}`}
              >
                <Search className="text-slate-400" />
                <input
                  autoFocus
                  placeholder="سورة أو آية..."
                  className={`bg-transparent w-full outline-none font-black font-serif text-2xl ${theme === "dark" ? "text-white" : "text-slate-900"}`}
                  onChange={(e) => setQSearch(e.target.value)}
                />
              </div>
              {quickResults && (
                <div
                  className="space-y-10 max-h-[40vh] overflow-y-auto quran-scroll p-1"
                  dir="rtl"
                >
                  {quickResults.suras?.map((s, i) => (
                    <button
                      key={s.id}
                      onClick={() => openModal(s)}
                      className={`p-6 rounded-[2rem] border-2 font-black text-right dark:bg-[#004030] bg-slate-50 text-white transition-all ${i === quickResults.suras.length - 1 && quickResults.suras.length % 2 !== 0 ? "col-span-2" : ""}`}
                    >
                      سورة - {s.name_ar}
                    </button>
                  ))}
                  {quickResults.ayas?.map((a, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        const s = SURAHS.find((sr) => sr.id === a.sura);
                        if (s) openModal(s, a.aya);
                      }}
                      className="w-full p-6 rounded-[2rem] border-2 text-right flex justify-between items-center dark:bg-[#004030] bg-slate-50 mb-3 text-white"
                    >
                      <span className="font-black text-[#ffb900] bg-[#ffb900]/5 px-4 py-1.5 rounded-full text-xs shrink-0">
                        آية - {SURAHS.find((s) => s.id === a.sura)?.name_ar} :{" "}
                        {a.aya}
                      </span>
                      <span className="truncate opacity-90 font-serif text-xl font-bold">
                        {a.text}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {selected && (
            <>
              {showFullQuran && (
                <div className="mb-10 w-full animate-in fade-in duration-500">
                  <div className="flex justify-between items-center mb-8 px-6 sm:px-12">
                    <button
                      onClick={() => setContinuousReading(!continuousReading)}
                      className={`text-[10px] px-4 py-2 rounded-xl border-2 font-black ${theme === "dark" ? "bg-emerald-800 text-emerald-300" : "bg-emerald-600 text-white"} active:scale-95`}
                    >
                      {continuousReading ? "عرض الصفحات" : "قراءة متواصلة"}
                    </button>
                    {!continuousReading && (
                      <div className="flex items-center gap-6">
                        <button
                          onClick={() =>
                            setCurrentPageIndex((p) => Math.max(0, p - 1))
                          }
                          className="p-3 bg-emerald-500/10 rounded-xl hover:bg-emerald-500/20 active:scale-95"
                        >
                          <ArrowRight size={26} />
                        </button>
                        <span
                          className={`text-sm font-black opacity-80 ${theme === "dark" ? "text-emerald-50" : "text-slate-900"}`}
                        >
                          صـ {surahPages[currentPageIndex]}
                        </span>
                        <button
                          onClick={() =>
                            setCurrentPageIndex((p) =>
                              Math.min(surahPages.length - 1, p + 1),
                            )
                          }
                          className="p-3 bg-emerald-500/10 rounded-xl hover:bg-emerald-500/20 active:scale-95"
                        >
                          <ArrowLeft size={26} />
                        </button>
                      </div>
                    )}
                  </div>
                  {/* //! test [ID: 02] ثبات مسافات الأسطر بلملي: leading-[4] و py-12 صخر صخر */}
                  <div
                    className={`w-full ${isMobile ? "w-full px-0" : ""} py-12 px-6 sm:px-12 ${theme === "dark" ? "bg-[#004030] border-emerald-900 shadow-inner" : "bg-[#fffdf5] border-amber-100 shadow-sm"} border-y-4 rounded-3xl overflow-hidden`}
                  >
                    <div
                      style={{
                        fontSize: `${isMobile ? fontSize / 2 + 6 : fontSize * 1.5 + 4}px`,
                        fontWeight: "900",
                      }}
                      className={`text-justify font-serif leading-[4] ${theme === "dark" ? "text-white" : "text-slate-800"} transition-all`}
                    >
                      {quranData
                        ?.filter(
                          (v) =>
                            v.sura === selected.id &&
                            (continuousReading
                              ? true
                              : v.page === surahPages[currentPageIndex]),
                        )
                        .map((v, i) => {
                          const isSel = vRanges?.some(
                            (r) =>
                              r.isActive &&
                              !r.isSaved &&
                              v.aya >= r.start &&
                              (r.end ? v.aya <= r.end : v.aya === r.start),
                          );
                          const isOcc = occupied.has(v.aya);
                          /* //! test [ID: 03] تأثير الـ Feather الشفاف للهايلايت بلملي بنفس درجة يوسف */
                          const featheredStyle = {
                            backgroundImage: `linear-gradient(to bottom, #fbbf2400 0%, #fbbf24ff 1px, #fbbf24ff calc(100% - 1px), #fbbf2400 100%)`,
                            color: "#fff",
                            textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                          };
                          return (
                            <span
                              key={i}
                              onClick={(e) => toggleVerseMenu(v.aya, e)}
                              className={`inline transition-all duration-200 cursor-pointer ${isOcc ? "opacity-30 grayscale pointer-events-none" : ""} ${isSel ? "font-black block w-full text-center py-2" : ""}`}
                              style={isSel ? featheredStyle : {}}
                            >
                              {v.text}{" "}
                              <span
                                className={`text-[#ffb900] opacity-100 text-[26px] sm:text-[30px] font-sans inline-block px-1 ml-1`}
                              >
                                ({v.aya})
                              </span>
                            </span>
                          );
                        })}
                    </div>
                  </div>
                </div>
              )}
              <div className="space-y-6 mb-10 px-2 mt-10">
                {(vRanges || []).map((range, index) => (
                  <div key={index} className="flex flex-row items-center gap-1">
                    <VerseSelect
                      value={range.start}
                      onChange={(v) => {
                        const r = [...vRanges];
                        r[index].start = v;
                        r[index].isActive = true;
                        setVRanges(r);
                      }}
                      surahId={selected?.id}
                      ayatCount={selected?.ayat}
                      occupied={occupied}
                      label="مِن"
                      theme={theme}
                      fontSize={fontSize}
                    />
                    <span className="text-slate-300 font-black px-1">:</span>
                    <div className="flex-1 relative flex flex-col items-start min-w-[120px]">
                      <VerseSelect
                        value={range.end}
                        onChange={(v) => {
                          const r = [...vRanges];
                          r[index].end = v;
                          r[index].isActive = true;
                          if (
                            index === vRanges.length - 1 &&
                            v < (selected?.ayat || 0)
                          ) {
                            let n = v + 1;
                            while (occupied.has(n)) n++;
                            if (n <= (selected?.ayat || 0))
                              r.push({
                                id: null,
                                start: n,
                                end: 0,
                                isActive: false,
                                isSaved: false,
                              });
                          }
                          setVRanges(r);
                        }}
                        surahId={selected?.id}
                        ayatCount={selected?.ayat}
                        occupied={occupied}
                        label="إلي الآيه"
                        theme={theme}
                        fontSize={fontSize}
                        startLimit={range.start}
                      />
                      {index === vRanges.length - 1 && (
                        <button
                          onClick={() => {
                            const r = [...vRanges];
                            r[index].end = selected?.ayat;
                            r[index].isActive = true;
                            setVRanges(r);
                          }}
                          className={`absolute top-full mt-1 text-[10px] font-black underline text-left px-2 whitespace-nowrap ${theme === "dark" ? "text-white" : "text-slate-500"}`}
                        >
                          إلى آخر السورة
                        </button>
                      )}
                    </div>
                    <span className="text-slate-300 font-black px-1">=</span>
                    <div
                      className={`w-12 h-10 ${theme === "dark" ? "bg-[#ffb900]/10 border-[#ffb900]/20" : "bg-amber-50 border-amber-200"} border rounded-2xl flex items-center justify-center shadow-inner mx-2`}
                    >
                      <span className="text-[#ffb900] font-black text-sm">
                        {range.end ? range.end - range.start + 1 : 0}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        if (range.isSaved) onDeleteRange(range.id);
                        setVRanges(vRanges.filter((_, i) => i !== index));
                      }}
                      className={`p-2.5 transition-all active:scale-90 ml-1 ${theme === "dark" ? "text-red-500" : "text-red-400"}`}
                    >
                      <Trash2 size={22} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 pt-6">
                <button
                  onClick={onClaim}
                  className="flex-1 bg-emerald-600 text-white font-black py-7 rounded-[3rem] shadow-xl active:scale-95 transition-all text-2xl flex items-center justify-center gap-3"
                >
                  <BookOpen size={32} /> حجز وتأكيد التلاوة
                </button>
                <button
                  onClick={onDeleteAll}
                  className={`p-6 rounded-[2.5rem] border-2 transition-all dark:bg-red-500/10 bg-red-50 border-inherit text-red-500 active:scale-90`}
                >
                  <Trash2 size={32} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
