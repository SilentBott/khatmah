import React from "react";

export default function Auth({ loginNameInput, setLoginNameInput, onLogin }) {
  return (
    <div className="w-full max-w-md bg-[#064e3b] p-10 rounded-[3rem] border-2 border-emerald-800 shadow-2xl animate-in zoom-in duration-500 relative z-10 transition-all">
      <div className="flex flex-col items-center">
        {/* أيقونة القمر */}
        {/* //! test [ID: 01] استخدام اللون الملكي الجديد `#ffb900` للأيقونة والعناوين بلملي */}
        <div className="text-[#ffb900] mb-4">
          <svg
            width="60"
            height="60"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        </div>

        <h1 className="text-4xl font-black text-[#ffb900] mb-2 font-serif tracking-tighter transition-all">
          نَسَق
        </h1>

        <p className="text-white opacity-90 text-sm font-bold leading-relaxed mb-10 px-4 transition-all">
          نَسَق: منصة ذكية لتنظيم خِتمتك، ومتابعة وردك اليومي، والمزامنة مع
          أصحابك بكل يسر.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault(); // عشان الصفحة متعملش ريفريش
            onLogin(); // الدالة اللي بتشغل زرار "ابدأ الآن"
          }}
          className="w-full space-y-4"
        >
          <input
            type="text"
            placeholder="اسمك الكريم..."
            className="w-full bg-[#042f24] border border-emerald-700 rounded-2xl px-6 py-5 text-white outline-none focus:border-[#ffb900] text-center font-black transition-all placeholder:opacity-30 text-lg"
            value={loginNameInput}
            onChange={(e) => setLoginNameInput(e.target.value)}
          />

          <button
            type="submit" // //! test لازم يكون submit عشان الفورم يحس بيه
            className="w-full bg-[#ffb900] hover:bg-amber-400 text-[#042f24] font-black py-5 rounded-2xl shadow-xl transition-all active:scale-95 text-xl"
          >
            ابدأ الآن
          </button>
        </form>
      </div>
    </div>
  );
}
