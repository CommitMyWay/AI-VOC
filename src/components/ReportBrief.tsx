import React from "react";
import { ChevronRight } from "lucide-react";
import { AppState, CompanyData } from "../types";

interface ReportBriefProps {
  state: AppState;
  openDrawers: { [id: string]: boolean };
  toggleDrawer: (id: string) => void;
  executeChatCommand: (val: string) => void;
  chatInput: string;
  setChatInput: React.Dispatch<React.SetStateAction<string>>;
  handleChatSubmit: (e: React.FormEvent) => void;
  getCrawlLogsForCompanies: () => any[];
}

export const ReportBrief: React.FC<ReportBriefProps> = ({
  state,
  openDrawers,
  toggleDrawer,
  executeChatCommand,
  chatInput,
  setChatInput,
  handleChatSubmit,
  getCrawlLogsForCompanies
}) => {
  const getDynamicVerdict = () => {
    const mainCompany = state.companies[0] || "Target App";
    const mainRating = state.data[mainCompany]?.rating || 4.0;
    const peakComplaintShare = state.data[mainCompany]?.sentimentBreakdown?.neg || 30;
    
    if (mainCompany.toLowerCase().includes("momo")) {
      return (
        <>
          MoMo leads the market — but a worsening <em className="italic text-[#0b57d0] font-sans font-bold">OTP delivery crisis</em> is quietly becoming its biggest retention risk.
        </>
      );
    }
    
    return (
      <>
        {mainCompany} leads the sector with {mainRating.toFixed(1)}★ — but a worsening <em className="italic text-[#0b57d0] font-sans font-bold">{peakComplaintShare}% negative sentiment split</em> is impacting key user retention.
      </>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f4f5f7] relative min-w-0">
      
      {/* Scrollable central brief section */}
      <div className="flex-1 overflow-y-auto w-full flex flex-col items-center px-4 pt-6">
        <div className="brief w-full max-w-[760px] bg-white mb-7 p-8 md:p-14 border border-gray-200 rounded-2xl shadow-md space-y-8 select-text">
        
        <div className="brief-eyebrow flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-widest">
          <span>Intelligence Brief · {state.filters.dateRange === "30d" ? "30-day window" : state.filters.dateRange === "7d" ? "7-day window" : "90-day window"}</span>
          <div className="flex-1 h-[1px] bg-gray-200"></div>
        </div>

        {/* MAIN INTEL TITLE (Georgia styled verdict) */}
        <h1 className="verdict font-serif text-3xl font-medium text-slate-900 leading-tight">
          {getDynamicVerdict()}
        </h1>

        <div className="deck text-xs text-slate-500 pb-5 border-b-2 border-slate-900 flex items-center gap-2 flex-wrap">
          <span className="author font-bold text-slate-800 flex items-center gap-1">
            <span className="author-mark w-4.5 h-4.5 rounded-full bg-[#0b57d0] text-white flex items-center justify-center text-[10px]">✦</span>
            <span>Synthesised by Research Agent</span>
          </span>
          <span>·</span>
          <span>from {((Object.values(state.data) as CompanyData[])).reduce((acc: number, c: CompanyData) => acc + (c.reviewCount || 0), 0).toLocaleString()} reviews across {state.companies.length} apps</span>
          <span>·</span>
          <span>App Store &amp; Google Play</span>
        </div>

        {/* SECTION 1: THE SITUATION */}
        <div>
          <div className="sec-label text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">The Situation</div>
          {state.companies.map((company) => {
            const cData = state.data[company];
            if (!cData) return null;
            const ratingVal = cData.rating || 0.0;
            return (
              <p key={company} className="para text-base text-slate-800 leading-relaxed mb-4">
                {company} holds a verified store rating of{" "}
                <span className={`claim border-b-2 border-dotted border-blue-300 hover:bg-blue-50 text-blue-700 font-semibold cursor-pointer pb-0.5 rounded px-1 transition ${openDrawers[`ev-ratings-${company}`] ? "bg-blue-50" : ""}`} onClick={() => toggleDrawer(`ev-ratings-${company}`)}>
                  {ratingVal.toFixed(1)}★, based on {cData.reviewCount.toLocaleString()} reviews<span className="claim-mark ml-1 inline-block text-[9px]">▾</span>
                </span>.
                Analysis shows that fully{" "}
                <span className={`claim border-b-2 border-dotted border-blue-300 hover:bg-blue-50 text-blue-700 font-semibold cursor-pointer pb-0.5 rounded px-1 transition ${openDrawers[`ev-share-${company}`] ? "bg-blue-50" : ""}`} onClick={() => toggleDrawer(`ev-share-${company}`)}>
                  {cData.sentimentBreakdown.neg}% of customer reviews<span className="claim-mark ml-1 inline-block text-[9px]">▾</span>
                </span>{" "}
                reflect critical negative sentiment, which continues to{" "}
                <span className={`claim border-b-2 border-dotted border-blue-300 hover:bg-blue-50 text-blue-700 font-semibold cursor-pointer pb-0.5 rounded px-1 transition ${openDrawers[`ev-trend-${company}`] ? "bg-blue-50" : ""}`} onClick={() => toggleDrawer(`ev-trend-${company}`)}>
                  deviate dynamically across the analyzed timeframe<span className="claim-mark ml-1 inline-block text-[9px]">▾</span>
                </span>.
              </p>
            );
          })}

          {/* DRAWER: RATINGS DIAGNOSTIC */}
          {state.companies.map((company) => {
            const isOpen = openDrawers[`ev-ratings-${company}`];
            if (!isOpen) return null;
            return (
              <div key={`ratings-ev-${company}`} className="evidence bg-slate-50 border border-gray-200 rounded-xl p-4.5 my-4 border-l-4 border-l-blue-600 animate-slide-down">
                <div className="ev-head flex items-center justify-between mb-3">
                   <div className="flex items-center gap-1.5 flex-row">
                     <span className="text-sm">📊</span>
                     <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{company} Rating Benchmarks</span>
                   </div>
                   <span className="text-[10px] text-slate-400 font-semibold">Live ratings dataset</span>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-[100px_1fr_40px] items-center gap-3">
                    <span className="text-xs font-bold text-slate-700 truncate font-sans">Average Rating</span>
                    <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${(state.data[company]?.rating || 0) * 20}%` }} />
                    </div>
                    <span className="text-xs font-extrabold text-slate-800 text-right">{(state.data[company]?.rating || 0).toFixed(1)}★</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* DRAWER: CUSTOMER REVIEWS SAMPLES */}
          {state.companies.map((company) => {
            const isOpen = openDrawers[`ev-share-${company}`];
            if (!isOpen) return null;
            const negativeSamples = getCrawlLogsForCompanies().filter(log => log.company.toLowerCase() === company.toLowerCase() && log.stars <= 2);
            return (
              <div key={`reviews-ev-${company}`} className="evidence bg-slate-50 border border-gray-200 rounded-xl p-4.5 my-4 border-l-4 border-l-blue-600 animate-slide-down">
                <div className="ev-head flex items-center justify-between mb-3.5">
                   <div className="flex items-center gap-1.5 flex-row">
                     <span className="text-sm">📋</span>
                     <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{company} Verified Customer Scrapes</span>
                   </div>
                   <span className="text-[10px] text-slate-400 font-semibold">Anonymized logs</span>
                </div>
                <div className="space-y-2.5">
                  {negativeSamples.length === 0 ? (
                    <div className="text-xs text-slate-400 italic">No critical rating samples found in the active cache.</div>
                  ) : (
                    negativeSamples.slice(0, 2).map((log, idx) => (
                      <div key={idx} className="bg-white border border-gray-200 p-4 rounded-xl space-y-1.5 shadow-xs">
                        <div className="flex justify-between items-center text-[10px] text-slate-400">
                          <span className="text-amber-500">{"★".repeat(log.stars)}</span>
                          <span>{log.date}</span>
                        </div>
                        <p className="text-xs text-slate-700 italic font-serif leading-relaxed">"{log.text}"</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}

          {/* DRAWER: SENTIMENT TREND */}
          {state.companies.map((company) => {
            const isOpen = openDrawers[`ev-trend-${company}`];
            if (!isOpen) return null;
            const cData = state.data[company];
            if (!cData || !cData.trendData) return null;
            const points = cData.trendData.map((v, i) => `${(i / (cData.trendData.length - 1)) * 500},${120 - (v * 1.5)}`).join(" ");
            return (
              <div key={`trend-ev-${company}`} className="evidence bg-slate-50 border border-gray-200 rounded-xl p-4.5 my-4 border-l-4 border-l-blue-600 animate-slide-down">
                <div className="ev-head flex items-center justify-between mb-3">
                   <div className="flex items-center gap-1.5 flex-row font-sans">
                     <span className="text-sm">📈</span>
                     <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{company} Negativity Trend (30d)</span>
                   </div>
                </div>
                <div className="h-28 w-full mt-2">
                  <svg className="w-full h-full" viewBox="0 0 500 120" preserveAspectRatio="none">
                    <polyline fill="none" stroke="#ef4444" strokeWidth="2.5" points={points} />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>

        {/* SECTION 2: WHY IT'S HAPPENING */}
        {state.activeBlocks.includes("topic_bar") && (
          <div>
            <div className="sec-label text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Why it's happening</div>
            <p className="para text-base text-slate-800 leading-relaxed mb-4">
              Our dynamic analysis traces specific complaint metrics directly to product usability and operational factors. Throughout the tracked period, customer concerns are highly concentrated around core categories like transaction speed, design clutter, and verification.
            </p>
            
            {/* Topic Bar chart nested beautifully in the text flow */}
            <div className="border border-gray-200 rounded-xl p-5 bg-slate-50/50 space-y-4">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Topic Share Allocation</span>
              <div className="space-y-3.5">
                {state.companies.map((company) => {
                  const cData = state.data[company];
                  if (!cData || !cData.topicCounts) return null;
                  const topics = Object.keys(cData.topicCounts);
                  const totalSum = (Object.values(cData.topicCounts) as number[]).reduce((a: number, b: number) => a + b, 0) || 1;
                  return (
                    <div key={company} className="space-y-2">
                      <span className="text-xs font-bold text-slate-700 font-sans">{company} Category Splits</span>
                      <div className="space-y-2.5">
                        {topics.map((topic, offset) => {
                          const count = cData.topicCounts[topic] || 0;
                          const pct = Math.round((count / totalSum) * 100);
                          const fills = ["bg-blue-600", "bg-slate-600", "bg-emerald-600", "bg-rose-500"];
                          return (
                            <div key={topic} className="space-y-1">
                              <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                                <span className="font-sans">{topic}</span>
                                <span>{pct}%</span>
                              </div>
                              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div className={`h-full ${fills[offset % fills.length]} rounded-full`} style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: WHY IT'S URGENT */}
        {state.activeBlocks.includes("sentiment_pie") && (
          <div>
            <div className="sec-label text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Why it's urgent</div>
            <p className="para text-base text-slate-800 leading-relaxed mb-4">
              When customer experience lapses, loyalty drops at critical speed. Our cross-platform index exposes a head-to-head comparison in active product sentiment where competitor platforms currently secure a wider index of positive response.
            </p>
            
            {/* Sentiment splits side-by-side inside client */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {state.companies.map((company) => {
                const cData = state.data[company];
                if (!cData) return null;
                const { pos, neu, neg } = cData.sentimentBreakdown;
                return (
                  <div key={company} className="p-4 bg-slate-50 border border-gray-200 rounded-xl space-y-2">
                    <span className="text-xs font-bold text-slate-700 block font-sans">{company} Sat. Index</span>
                    <div className="flex gap-1.5 text-center text-[10px] font-bold font-mono">
                      <div className="flex-1 bg-white border border-gray-200 p-2 rounded">
                        <span className="block text-emerald-600">{pos}%</span>
                        <span className="text-gray-400 font-sans text-[8.5px]">POS</span>
                      </div>
                      <div className="flex-1 bg-white border border-gray-200 p-2 rounded">
                        <span className="block text-amber-500">{neu}%</span>
                        <span className="text-gray-400 font-sans text-[8.5px]">NEU</span>
                      </div>
                      <div className="flex-1 bg-white border border-gray-200 p-2 rounded">
                        <span className="block text-red-500">{neg}%</span>
                        <span className="text-gray-400 font-sans text-[8.5px]">NEG</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION 4: ACTIONS / WHAT WE'D DO */}
        {state.activeBlocks.includes("actions") && (
          <div className="rec-block p-6 bg-linear-to-br from-[#f0f6ff]/60 to-[#f5f3ff]/40 border border-[#d4e2fb] rounded-2xl">
            <div className="rec-title font-serif text-2xl font-bold text-slate-900 mb-1">What we'd do</div>
            <div className="rec-sub text-xs text-slate-500 mb-5">Tactical action prescriptions compiled from store feedback:</div>
            
            <div className="space-y-4">
              {state.companies.map((comp) => {
                const cData = state.data[comp];
                if (!cData || !cData.actions) return null;
                return (
                  <div key={comp} className="space-y-3">
                    <span className="text-[10px] font-bold text-blue-900 uppercase tracking-widest block font-sans">{comp} Recommendations:</span>
                    <div className="space-y-3 divide-y divide-blue-150">
                      {cData.actions.PO && cData.actions.PO.length > 0 && (
                        <div className="flex gap-4 pt-3 first:pt-0">
                          <div className="rec-num w-6 h-6 shrink-0 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">1</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="rec-item-title text-xs font-bold text-slate-800 font-sans">Operational Backup Failover</span>
                              <span className="rec-tag tag-now text-[8.5px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-red-100 text-red-800">Do now</span>
                            </div>
                            <p className="rec-item-text text-xs text-slate-600 leading-relaxed">{cData.actions.PO[0]}</p>
                          </div>
                        </div>
                      )}
                      {cData.actions.QA && cData.actions.QA.length > 0 && (
                        <div className="flex gap-4 pt-3">
                          <div className="rec-num w-6 h-6 shrink-0 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">2</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="rec-item-title text-xs font-bold text-slate-800 font-sans">Quality &amp; Network Diagnostics</span>
                              <span className="rec-tag tag-soon text-[8.5px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">This quarter</span>
                            </div>
                            <p className="rec-item-text text-xs text-slate-600 leading-relaxed">{cData.actions.QA[0]}</p>
                          </div>
                        </div>
                      )}
                      {cData.actions.Marketing && cData.actions.Marketing.length > 0 && (
                        <div className="flex gap-4 pt-3">
                          <div className="rec-num w-6 h-6 shrink-0 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">3</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="rec-item-title text-xs font-bold text-slate-800 font-sans">Customer Support Campaigns</span>
                              <span className="rec-tag tag-ongoing text-[8.5px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-sans">Ongoing</span>
                            </div>
                            <p className="rec-item-text text-xs text-slate-600 leading-relaxed">{cData.actions.Marketing[0]}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CUSTOM AI BLOCKS ON BRIEF */}
        {state.customBlocks && state.customBlocks.length > 0 && (
          <div className="space-y-4 pt-6 border-t border-gray-150">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Custom Analyst Modules</div>
            {state.customBlocks.map((block) => (
              <div key={block.id} className="p-5 bg-white border border-gray-200 rounded-xl space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-xs font-bold text-blue-650 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider text-[9px] font-sans">Custom AI</span>
                  <span className="text-xs font-bold text-slate-800">{block.title}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {state.companies.map((comp) => {
                    const bData = block.data[comp];
                    if (!bData) return null;
                    return (
                      <div key={comp} className="p-3.5 bg-gray-50 rounded-xl border border-gray-150 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-xs font-bold text-slate-705 font-sans">{comp}</span>
                          <span className="text-xs font-bold text-amber-500">{bData.rating?.toFixed(1) || "N/A"}★</span>
                        </div>
                        <p className="text-[11px] text-slate-600 italic leading-relaxed">"{bData.summary}"</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* THREE THREADS WORTH PULLING NEXT */}
        <div className="threads pt-6 border-t border-gray-150">
          <div className="threads-label font-serif italic text-lg text-slate-800 mb-3.5">Three threads worth pulling next…</div>
          <div className="grid grid-cols-1 gap-2.5 select-none no-print">
            <button className="thread flex items-center gap-3.5 p-4 rounded-xl border border-gray-200 bg-white hover:border-blue-650 hover:shadow-xs transition-colors cursor-pointer text-left w-full h-full" onClick={() => executeChatCommand("Why is andoid v76 of MoMo experiencing spiking memory crash complaints?")}>
              <div className="thread-icon w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold shrink-0">🎯</div>
              <div className="thread-body flex-1">
                <div className="thread-title text-xs font-bold text-slate-850 font-sans">Verify core Android v76 memory crash clusters</div>
                <div className="thread-note text-[11px] text-slate-400 font-sans">Diag shows spike on Viettel devices after recent store update.</div>
              </div>
              <div className="thread-arrow text-slate-400 text-sm">&#10142;</div>
            </button>

            <button className="thread flex items-center gap-3.5 p-4 rounded-xl border border-gray-200 bg-white hover:border-blue-650 hover:shadow-xs transition-colors cursor-pointer text-left w-full h-full" onClick={() => executeChatCommand("Which consumer segment is closest to churning?")}>
              <div className="thread-icon w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold shrink-0">⚠️</div>
              <div className="thread-body flex-1">
                <div className="thread-title text-xs font-bold text-slate-850 font-sans">Which tracked app consumer segment is closest to churning?</div>
                <div className="thread-note text-[11px] text-slate-400 font-sans">112 reviews signaling churn risks in daily active bill-payment tasks.</div>
              </div>
              <div className="thread-arrow text-slate-400 text-sm">&#10142;</div>
            </button>

            <button className="thread flex items-center gap-3.5 p-4 rounded-xl border border-gray-200 bg-white hover:border-blue-650 hover:shadow-xs transition-colors cursor-pointer text-left w-full h-full" onClick={() => executeChatCommand("What makes ZaloPay win the 18-24 consumer cohort?")}>
              <div className="thread-icon w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold shrink-0">💙</div>
              <div className="thread-body flex-1">
                <div className="thread-title text-xs font-bold text-slate-850 font-sans">What makes ZaloPay win the 18-24 consumer cohort?</div>
                <div className="thread-note text-[11px] text-slate-400 font-sans">Loyalty signals and UI ease indicators compared head-to-head.</div>
              </div>
              <div className="thread-arrow text-slate-400 text-sm">&#10142;</div>
            </button>
          </div>
        </div>
        </div>
      </div>

      {/* FIXED BOTTOM INTELLIGENCE BAR / COMMAND BAR */}
      <div className="w-full shrink-0 bg-[#f4f5f7] border-t border-gray-200/60 pt-3 pb-5 px-4 no-print flex flex-col items-center shadow-xs">
        <div className="w-full max-w-[760px]">
          <div className="cmd-inner flex items-center gap-3 bg-white border-2 border-gray-200 focus-within:border-blue-500 rounded-xl p-2.5 pl-4 shadow-sm">
            <span className="cmd-glyph text-xs text-slate-400 font-semibold">✦</span>
            <input 
              className="cmd-input flex-1 bg-transparent outline-none text-xs text-slate-805 placeholder-gray-400 font-sans"
              placeholder="Interrogate a claim or pull your own thread — e.g. 'Is MoMo losing Viettel users?'"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleChatSubmit(e);
                }
              }}
            />
            <button onClick={handleChatSubmit} disabled={!chatInput.trim()} className="cmd-send w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white border-none flex items-center justify-center cursor-pointer transition">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="cmd-hint text-center text-[10px] text-slate-400 mt-2 uppercase font-semibold font-sans">Every claim above is clickable · answers append or trigger the agent chat</div>
        </div>
      </div>
    </div>
  );
};
