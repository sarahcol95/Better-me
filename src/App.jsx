import { useState, useEffect, useRef, useCallback } from "react";

// ══════════════════════════════════════════════════════
// INDICE — cerca (Ctrl/Cmd+F) uno di questi marcatori "── ... ──" per saltare alla sezione:
//   DATI: temi giornalieri | Face Yoga | piano settimanale (DD) | nomi giorni/mesi
//   DATI: proteine | schede allenamento/yoga/rituali/note/ricette | skincare
//   HELPER UI di base (Lbl, Title, Card, SortableList, Sheet)
//   MODALI (aggiungi/rimuovi voci)
//   COMPONENTI: obiettivi | journaling | alimentazione | misure corporee | to-do | frase del giorno | routine
//   APP PRINCIPALE (stato globale + tab Oggi/Calendario/Rituali/Altro)
// ══════════════════════════════════════════════════════

const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Poppins:wght@300;400;500;600&display=swap";
document.head.appendChild(fontLink);
document.title = "Better Me";

const shimmerStyle = document.createElement("style");
shimmerStyle.textContent = `@keyframes plantShine{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}`;
document.head.appendChild(shimmerStyle);

const F={heading:"'Cormorant Garamond',serif",body:"'Poppins',sans-serif"};
const N={bg:"#F7F5F0",card:"#FFFFFF",border:"rgba(0,0,0,0.07)",text:"#1C1C1A",muted:"#8A8680",faint:"#F0EDE8"};

// ── Storage layer: tries window.storage first, falls back to localStorage ──
const storeGet = async (key) => {
  // Try window.storage first (Claude artifacts)
  if (typeof window.storage !== "undefined") {
    try {
      const r = await window.storage.get(key);
      return r ? JSON.parse(r.value) : null;
    } catch {}
  }
  // Fallback to localStorage
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : null;
  } catch { return null; }
};

const storeSet = async (key, val) => {
  const str = JSON.stringify(val);
  // Try window.storage first
  if (typeof window.storage !== "undefined") {
    try { await window.storage.set(key, str); } catch {}
  }
  // Also always save to localStorage as backup
  try { localStorage.setItem(key, str); } catch {}
};

// ── Icons ──
const Ic=({n,s=18,c="#1C1C1A",style={}})=>{
const p={
sun:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/><line x1="4.22" y1="4.22" x2="6.34" y2="6.34"/><line x1="17.66" y1="17.66" x2="19.78" y2="19.78"/><line x1="4.22" y1="19.78" x2="6.34" y2="17.66"/><line x1="17.66" y1="6.34" x2="19.78" y2="4.22"/></svg>,
moon:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
leaf:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><path d="M17 8C8 10 5.9 16.17 3.82 19.34A1 1 0 0 0 5 21C14 21 21 14 21 4A10 10 0 0 1 17 8Z"/><path d="M3.82 19.34C3.82 19.34 8 14 12 12"/></svg>,
drop:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><path d="M12 2L5.5 9.5A8 8 0 1 0 18.5 9.5Z"/></svg>,
walk:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><circle cx="13" cy="4" r="1.5"/><path d="M10 21l1.5-5.5-3-3L11 8"/><path d="M9 9l-3 1.5"/><path d="M14 21l-1-6"/><path d="M14.5 12L17 14l2 4"/></svg>,
fork:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="21" y1="15" x2="21" y2="22"/><path d="M21 2a5 5 0 0 1 0 10"/></svg>,
heart:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
book:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
openbook:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><path d="M2 4.5C2 4.5 7 3 12 5C17 3 22 4.5 22 4.5V19.5C22 19.5 17 18 12 20C7 18 2 19.5 2 19.5V4.5Z"/><line x1="12" y1="5" x2="12" y2="20"/></svg>,
align:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="8.5" r="5.5"/><circle cx="12" cy="15.5" r="5.5"/></svg>,
chart:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
plus:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
trash:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
chevron:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>,
check:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
edit:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
note:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
star:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
close:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
trend:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
flower:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2a3 3 0 0 1 3 3 3 3 0 0 1-3 3 3 3 0 0 1-3-3 3 3 0 0 1 3-3z" opacity=".6"/><path d="M22 12a3 3 0 0 1-3 3 3 3 0 0 1-3-3 3 3 0 0 1 3-3 3 3 0 0 1 3 3z" opacity=".6"/><path d="M12 22a3 3 0 0 1-3-3 3 3 0 0 1 3-3 3 3 0 0 1 3 3 3 3 0 0 1-3 3z" opacity=".6"/><path d="M2 12a3 3 0 0 1 3-3 3 3 0 0 1 3 3 3 3 0 0 1-3 3 3 3 0 0 1-3-3z" opacity=".6"/></svg>,
spark:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>,
tag:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
cal:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
ritual:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21 C8 21 5 18 5 14.5 C5 11 7 9 9 7.5 C9 10 10 11 11 11.5 C11 9 11.5 6 13 4 C13 7 15 9 15 12 C16 11 16.5 9.5 16.5 8 C18.5 10 19 12 19 14.5 C19 18 16 21 12 21 Z"/></svg>,
more:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>,
sunrise:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><path d="M5 12a7 7 0 0 1 14 0"/><circle cx="12" cy="12" r="3" fill={c} fillOpacity=".2"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="4.22" y1="5.22" x2="5.64" y2="6.64"/><line x1="19.78" y1="5.22" x2="18.36" y2="6.64"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="22" y1="12" x2="20" y2="12"/><line x1="3" y1="19" x2="21" y2="19"/></svg>,
fullsun:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="4" fill={c} fillOpacity=".2"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/><line x1="4.22" y1="4.22" x2="6.34" y2="6.34"/><line x1="17.66" y1="17.66" x2="19.78" y2="19.78"/><line x1="4.22" y1="19.78" x2="6.34" y2="17.66"/><line x1="17.66" y1="6.34" x2="19.78" y2="4.22"/></svg>,
sunset:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><path d="M5 12a7 7 0 0 1 14 0"/><circle cx="12" cy="12" r="3" fill={c} fillOpacity=".2"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="4.22" y1="5.22" x2="5.64" y2="6.64"/><line x1="19.78" y1="5.22" x2="18.36" y2="6.64"/><line x1="3" y1="19" x2="21" y2="19"/><polyline points="9 22 12 19 15 22"/></svg>,
back:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>,
dumbbell:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><line x1="6" y1="12" x2="18" y2="12"/><rect x="2" y="9" width="4" height="6" rx="1"/><rect x="18" y="9" width="4" height="6" rx="1"/><rect x="5" y="10" width="2" height="4" rx=".5"/><rect x="17" y="10" width="2" height="4" rx=".5"/></svg>,
yoga:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="4" r="1.5"/><path d="M12 6v5"/><path d="M8 9c1 1 2.5 2 4 2s3-1 4-2"/><path d="M9 15l-3 5"/><path d="M15 15l3 5"/><path d="M10 11l-1 4h6l-1-4"/></svg>,
sparkle:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/><circle cx="12" cy="12" r="3" fill={c} fillOpacity=".2"/></svg>,
face:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M9 10h.01M15 10h.01"/><path d="M9 14s1 2 3 2 3-2 3-2"/><path d="M12 3c-1 1.5-1 3 0 4"/></svg>,
car:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><rect x="1" y="8" width="22" height="10" rx="2"/><path d="M5 8V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>,
office:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
protein:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z"/><path d="M8 10c-3 1-5 3-5 6v2h18v-2c0-3-2-5-5-6"/></svg>,
drag:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="18" x2="16" y2="18"/></svg>,
body:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="4" r="2"/><path d="M9 9h6l-1 5-1 7h-2l-1-7-1-5z"/><path d="M7 9l-2 3 2 2"/><path d="M17 9l2 3-2 2"/></svg>,
fire:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><path d="M12 22C8 22 5 19 5 15.5c0-2.5 1.5-4.5 3-5.5 0 2 1 3 2 3.5 0-2 .5-5 2-7 0 3 2 5 2 7.5C14 12 16 10 16 8c2 2 3 4.5 3 7.5C19 19 16 22 12 22z"/></svg>,
ruler:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><path d="M3 9l18-6-6 18-3-7.5L3 9z"/><line x1="10.5" y1="10.5" x2="8" y2="13"/></svg>,
apple:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8.5c-3.3 0-6 2.6-6 6.8 0 3.6 2.3 6.7 4.6 6.7.9 0 1.2-.4 1.4-.4s.6.4 1.4.4c2.4 0 4.6-3.1 4.6-6.7 0-4.2-2.7-6.8-6-6.8z"/><path d="M12 8.5V6c0-1 .8-2 2-2.3"/><path d="M9.3 4.2c1.2 0 2.3.6 2.9 1.6"/></svg>,
avocado:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><path d="M12 3c3.5 1 5.5 5 5.5 9 0 5-2.5 9-5.5 9s-5.5-4-5.5-9c0-4 2-8 5.5-9z"/><circle cx="12" cy="14" r="3"/></svg>,
noAlcohol:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><path d="M7 3h10l-1.2 6.5a3.8 3.8 0 0 1-7.6 0z"/><line x1="12" y1="9.5" x2="12" y2="17"/><line x1="8.5" y1="17" x2="15.5" y2="17"/><line x1="8" y1="4" x2="16" y2="10"/><line x1="16" y1="4" x2="8" y2="10"/></svg>,
meditate:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="5" r="1.8"/><path d="M12 7v3"/><path d="M12 10c-2 0-3.5 1-4.5 2.5-.5.8-1.5 1-2.5.8"/><path d="M12 10c2 0 3.5 1 4.5 2.5.5.8 1.5 1 2.5.8"/><path d="M6 16c1.5 1.5 3.5 2 6 2s4.5-.5 6-2"/></svg>,
target:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5.5"/><circle cx="12" cy="12" r="2"/></svg>,
brain:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-1.5 5.5A3 3 0 0 0 6 18a3 3 0 0 0 3 2.5V4z"/><path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 1.5 5.5A3 3 0 0 1 18 18a3 3 0 0 1-3 2.5V4z"/></svg>,
smile:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M8 13.5c1 1.5 2.4 2.3 4 2.3s3-.8 4-2.3"/><line x1="8.5" y1="9.5" x2="8.5" y2="9.5"/><line x1="15.5" y1="9.5" x2="15.5" y2="9.5"/></svg>,
bed:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><path d="M3 18v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7"/><path d="M3 18v2"/><path d="M21 18v2"/><path d="M3 13V7a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v2"/><line x1="10" y1="13" x2="21" y2="13"/></svg>,
};
return <span style={{display:"inline-flex",alignItems:"center",flexShrink:0,...style}}>{p[n]||p.star}</span>;
};

// ── DATI: temi giornalieri (colori/gradiente per ogni giorno) ──
const TH={
boost:{name:"Monday Boost",grad:"linear-gradient(135deg,#F0FFF4,#C8F0D0)",pill:"#C8F0D0",pillText:"#1A6B35",accent:"#2ECC71",dark:"#1A6B35",blob:"rgba(46,204,113,0.15)",icon:"sparkle"},
forza_ret:{name:"Lower Body + Radiance",grad:"linear-gradient(135deg,#FFF4EE,#FFD5B8)",pill:"#FFD5B8",pillText:"#A04010",accent:"#E8733A",dark:"#A04010",blob:"rgba(232,115,58,0.15)",icon:"dumbbell"},
forza_idr:{name:"Lower Body + Hydration",grad:"linear-gradient(135deg,#FFF4EE,#FFD5B8)",pill:"#FFD5B8",pillText:"#A04010",accent:"#E8733A",dark:"#A04010",blob:"rgba(232,115,58,0.15)",icon:"dumbbell"},
mob_yoga:{name:"Yoga + Exfoliation",grad:"linear-gradient(135deg,#F2FAF0,#C8E8B8)",pill:"#C8E8B8",pillText:"#2A5A18",accent:"#5EA840",dark:"#2A5A18",blob:"rgba(160,210,120,0.18)",icon:"yoga"},
mob_face:{name:"Yoga + Hydration",grad:"linear-gradient(135deg,#F2FAF0,#C8E8B8)",pill:"#C8E8B8",pillText:"#2A5A18",accent:"#5EA840",dark:"#2A5A18",blob:"rgba(160,210,120,0.18)",icon:"yoga"},
sabato:{name:"Clean & Slow down",grad:"linear-gradient(135deg,#FDFAF2,#F0E4B8)",pill:"#F0E4B8",pillText:"#7A5C10",accent:"#C4980A",dark:"#7A5C10",blob:"rgba(196,152,10,0.15)",icon:"sparkle"},
domenica:{name:"Relax",grad:"linear-gradient(135deg,#FFF5EE,#FFD9B8)",pill:"#FFD9B8",pillText:"#A04A10",accent:"#E8834A",dark:"#A04A10",blob:"rgba(232,131,74,0.15)",icon:"moon"},
};

// ── DATI: esercizi di Face Yoga (mattina/sera/auto/ufficio) ──
const FY_M=[
{name:"Apertura Rubini",desc:"10 pompaggi sopra le clavicole"},
{name:"Forchetta",desc:"15 scivolamenti orecchie → collo → clavicole"},
{name:"Lift Perioculare",desc:"Scivolamento dall'interno verso la tempia"},
{name:"Grande O + Soffio",desc:"O lunga poi guance gonfie 10 sec × 3"},
{name:"Zigomi Alti",desc:"10 ripetizioni con ancoraggio alle tempie"},
];
const FY_C=[
{name:"Sblocco Mandibola",desc:"1 min — massaggi circolari a bocca socchiusa"},
{name:"Gancio Mascella",desc:"15 passaggi uncino dal mento al lobo"},
{name:"Pizzicotto Sopraccigliare",desc:"30 sec — pizzicotti lungo le sopracciglia"},
{name:"Distensione Perioculare",desc:"30 sec — sotto l'occhio verso la tempia 10×"},
{name:"Isolamento Fronte",desc:"10 rep — blocca la fronte e sgrana gli occhi"},
{name:"Cancellina Anti-Stress",desc:"30 sec — zig-zag verticali sulla fronte"},
{name:"Scarico Finale",desc:"30 sec — ascelle + 5 pressioni clavicole"},
];
const FY_AUTO=[
{name:"Mewing Dinamico",desc:"Appiattisci tutta la lingua al palato e spingi con forza per 5 secondi, poi rilascia. Ripeti 10 volte. Scolpisce il sottomento."},
{name:"Bacio al Volante",desc:"Allunga il collo verso l'alto e simula un bacio verso lo specchietto retrovisore. Distende il collo e la zona mandibolare."},
{name:"Reset delle Spalle",desc:"Ogni volta che ti fermi a un semaforo, ruota le spalle indietro e spingile verso il basso, lontano dalle orecchie."},
{name:"Occhio a Sorpresa",desc:"Spalanca gli occhi il più possibile per 5 secondi senza muovere minimamente la fronte. Ripeti 5 volte."},
];
const FY_OFFICE=[
{name:"Reset Posturale",desc:"Spalle basse, schiena staccata dallo schienale"},
{name:"Mewing Evoluto",desc:"Tutta la lingua appiattita contro il palato per 1 min"},
{name:"Baffo d'Aria",desc:"Bolla d'aria sotto il labbro superiore per 20 sec"},
{name:"Focus Visivo",desc:"Guarda un punto lontano 10 sec, spalanca gli occhi senza usare la fronte"},
{name:"Pompaggio Rapido",desc:"Se gli occhi sono stanchi: 3 scivolamenti verso le tempie + pressione clavicole"},
];

// ── DATI: piano settimanale (integratori, colazioni, DD = Day Data) ──
const SR="Bromelina + Multi Probiotico";
const SC="Vitamina D3 · Omega 3 · Biotina · Acido Folico · Diosmina + Esperidina";
const COLAZIONE={
std:"Yogurt Bowl: 125–150 g yogurt + Collagene 10 g + 150–200 g frutta + 2 tbsp chia pudding + 2 tsp semi misti + 1 tsp burro d'arachidi + Tè verde",
monday:"Yogurt Bowl: 125–150 g yogurt + 10 g Collagene + 150–200 g frutta (½ banana + 1 manciata mirtilli/fragole, o 1 mela piccola, o 2 kiwi, o mix) + 2 tbsp chia pudding + 2 tsp semi (lino tritati, zucca, canapa) + 2 tsp burro d'arachidi + Tè verde (o Green Smoothie Bowl)",
detox:"Tè verde + Collagene 10 g in acqua + 1 frutto (opzionale)",
};
const AG="linear-gradient(135deg,#FDFAF6,#EDE0CC)";
const AT="#6B4A2A";

const DD={
1:{th:TH.boost,colazione:"monday",mattina:["Nettalingua","Detersione viso","Probiotici + Bromelina","30 Calf Raises lenti – Vacuum 3×30″","Detox Yoga o Upper & Abs","Morning Skincare","Morning face yoga",`Supp. colazione: ${SC}`,"Brush teeth"],alimLabel:"DETOX — low carb & low sodium",alimGrad:AG,alimText:AT,spuntino:"Tisana + 1 arancia",pranzo:"150–200 g proteine + doppia verdura · low carb · low sodium",cena:"150–200 g proteine + verdura cotta · low carb · low sodium",sera:["Gentle Foam Roller","Dry Brush","Massaggio con crema","Skincare Sera A — Retinale 0,2%","Gambe al muro 10'","Magnesio + Potassio"],ufficio:["Oscillazioni tallone-punta","Ogni ora: 5 contrazioni glutei + Rotazione scapole","Ogni volta in bagno: 10 Squat + 20″ Shaking + 10 Wall Slides"],faceYoga:FY_M,fyLabel:"Face Yoga — Drenaggio & Scolpitura"},
2:{th:TH.forza_idr,colazione:"std",mattina:["Detersione viso","Nettalingua","Probiotici + Bromelina","30 Calf Raises lenti – Vacuum 3×30″","Focus Glutei con pesi","Morning Skincare","Morning face yoga",`Supp. colazione: ${SC}`,"Protein Shake","Brush teeth"],alimLabel:"Pro + Carbo + Veggies",alimGrad:AG,alimText:AT,spuntino:"Cappuccino veg + 1 arancia + 20 g frutta secca",pranzo:"70 g cereali + 130 g proteine + verdure + 1 cucchiaio EVO",cena:"150–200 g proteine + verdura + 30–40 g carbo",sera:["Dry Brush","Massaggio con crema","Skincare Sera C — Idratazione + Face Yoga completo","Gambe al muro 10'","Magnesio + Potassio"],ufficio:["Oscillazioni tallone-punta","Ogni ora: 5 contrazioni glutei + Rotazione scapole","Ogni volta in bagno: 10 Squat + 20″ Shaking + 10 Wall Slides"],faceYoga:FY_C,fyLabel:"Face Yoga Sera C — Completo"},
3:{th:TH.mob_yoga,colazione:"std",mattina:["Nettalingua","Detersione viso","Probiotici + Bromelina","30 Calf Raises lenti – Vacuum 3×30″","30' Yoga e/o Camminata","Morning Skincare","Morning face yoga",`Supp. colazione: ${SC}`,"Brush teeth"],alimLabel:"Pro + Carbo + Veggies",alimGrad:AG,alimText:AT,spuntino:"Cappuccino veg + 1 arancia + 10 g frutta secca",pranzo:"70 g cereali + 130 g proteine + verdure + 1 cucchiaio EVO",cena:"150–200 g proteine + verdura + 30–40 g carbo",sera:["Yoga class 18:15","Dry Brush + Doccia + Getto freddo gambe","Massaggio con crema","Skincare Sera B — Peeling AHA 30% + BHA 2% (max 10 min)","Gambe al muro 10'","Magnesio + Potassio"],ufficio:["Oscillazioni tallone-punta","Ogni ora: 5 contrazioni glutei + Rotazione scapole","Ogni volta in bagno: 10 Squat + 20″ Shaking + 10 Wall Slides"],faceYoga:null},
4:{th:TH.forza_ret,colazione:"std",mattina:["Detersione viso","Nettalingua","Probiotici + Bromelina","30 Calf Raises lenti – Vacuum 3×30″","Focus Glutei con pesi","Morning Skincare","Morning face yoga",`Supp. colazione: ${SC}`,"Protein Shake","Brush teeth"],alimLabel:"Pro + Carbo + Veggies",alimGrad:AG,alimText:AT,spuntino:"Cappuccino veg + 1 arancia + 20 g frutta secca",pranzo:"70 g cereali + 130 g proteine + verdure + 1 cucchiaio EVO",cena:"150–200 g proteine + verdura + 30–40 g carbo",sera:["Gentle Foam Roller","Dry Brush","Massaggio con crema","Skincare Sera A — Retinale 0,2%","Gambe al muro 10'","Magnesio + Potassio"],ufficio:["Oscillazioni tallone-punta","Ogni ora: 5 contrazioni glutei + Rotazione scapole","Ogni volta in bagno: 10 Squat + 20″ Shaking + 10 Wall Slides"],faceYoga:FY_M,fyLabel:"Face Yoga — Drenaggio & Scolpitura"},
5:{th:TH.mob_face,colazione:"std",mattina:["Nettalingua","Detersione viso","Probiotici + Bromelina","30 Calf Raises lenti – Vacuum 3×30″","30' Yoga e/o Camminata","Morning Skincare","Morning face yoga",`Supp. colazione: ${SC}`,"Brush teeth"],alimLabel:"Pro + Carbo + Veggies",alimGrad:AG,alimText:AT,spuntino:"Cappuccino veg + 1 arancia + 10 g frutta secca",pranzo:"70 g cereali + 130 g proteine + verdure + 1 cucchiaio EVO",cena:"150–200 g proteine + verdura + 30–40 g carbo",sera:["Yoga class 18:15","Dry Brush + Massaggio (opzionale)","Skincare Sera C — Idratazione + Face Yoga completo","Gambe al muro 10'","Magnesio + Potassio"],ufficio:["Oscillazioni tallone-punta","Ogni ora: 5 contrazioni glutei + Rotazione scapole","Ogni volta in bagno: 10 Squat + 20″ Shaking + 10 Wall Slides"],faceYoga:FY_C,fyLabel:"Face Yoga Sera C — Completo"},
6:{th:TH.sabato,colazione:"std",mattina:["Nettalingua","Detersione viso","Probiotici + Bromelina","30 Calf Raises lenti – Vacuum 3×30″","Dry Brush","Morning Skincare","Morning face yoga",`Supp. colazione: ${SC}`,"Pulizie di casa (9–11)","Yoga class 11:00","Brush teeth"],alimLabel:"Pranzo libero + aperitivo + serata",alimGrad:AG,alimText:AT,spuntino:null,aperitivo:"Spritz + snacks",pranzo:"Pasta sfiziosa + contorno veggies",cena:"Cena fuori o sfiziosa — NAC prima se alcolici",sera:["Dry Brush + Doccia + Getto freddo gambe","Massaggio con crema","Skincare essenziale: doppia detersione + sieri","Magnesio + Potassio"],ufficio:[],faceYoga:null},
0:{th:TH.domenica,colazione:"detox",mattina:["NO sveglia — riposo","Nettalingua","Detersione viso","Probiotici + Bromelina","30 Calf Raises lenti – Vacuum 3×30″","Dry Brush","Morning Skincare","Morning face yoga","Mattinata libera: relax, piante, lettura","11:00 — Bromelina","13:30 — Vitamina D3 + Acido Folico","Brush teeth"],alimLabel:"Giornata di relax + pinsa serale",alimGrad:AG,alimText:AT,spuntino:"Aperitivo o spuntino libero",aperitivo:null,pranzo:"Pasta sfiziosa + contorno veggies — 13:30",cena:"Pinsa + mozzarella light + birra analcolica",sera:["Gentle Foam Roller","Dry Brush","Massaggio con crema","Skincare Sera C — Idratazione + Face Yoga completo","Gambe al muro 10'","½ Bromelina + Magnesio + Potassio"],ufficio:[],faceYoga:FY_C,fyLabel:"Face Yoga Sera C — Completo"},
};

// ── DATI: nomi giorni/mesi in italiano ──
const DN=["domenica","lunedì","martedì","mercoledì","giovedì","venerdì","sabato"];
const DS=["Dom","Lun","Mar","Mer","Gio","Ven","Sab"];
const MN=["gennaio","febbraio","marzo","aprile","maggio","giugno","luglio","agosto","settembre","ottobre","novembre","dicembre"];

// ── DATI: tipi di proteine e limiti settimanali ──
const PROTEIN_TYPES=[
{id:"pollo",label:"Pollo/Tacchino",max:3,color:"#FFD5B8",tc:"#A04010",icon:"🍗"},
{id:"uova",label:"Uova",max:6,color:"#FFF6B8",tc:"#8A6A00",icon:"🥚",unit:"uova"},
{id:"tofu",label:"Tofu",max:4,color:"#D9F0CE",tc:"#2A5A18",icon:"🟩"},
{id:"legumi",label:"Legumi",max:4,color:"#E8D8FF",tc:"#6B3FA0",icon:"🫘"},
{id:"pesce_b",label:"Pesce bianco",max:4,color:"#B8E8FF",tc:"#0A4A7A",icon:"🐟"},
{id:"pesce_g",label:"Pesce grasso",max:1,color:"#FFD9B8",tc:"#A04A10",icon:"🐠"},
{id:"molluschi",label:"Molluschi/Crostacei",max:2,color:"#E8F8FF",tc:"#0A5A7A",icon:"🦐"},
{id:"latticini",label:"Latticini",max:2,color:"#FFF9E6",tc:"#8A6A00",icon:"🧀"},
];

// ── DATI: schede allenamento / yoga / face yoga / rituali / note / ricette (stato iniziale) ──
const INIT_WORKOUTS=[
{id:"w1",type:"glutei",name:"Scheda Focus Glutei & Gambe",freq:"2× a settimana · 48–72h di riposo",grad:"linear-gradient(135deg,#FFF4EE,#FFD5B8)",tc:"#A04010",sections:[{title:"Riscaldamento",items:["5–10 min mobilità articolare","5' Surya Namaskara"]},{title:"Attivazione",items:["20 Glute Bridge","15 × lato Clamshell","10 × lato Bird-Dog","20 Frog Pumps"]},{title:"Forza",items:["Hip Thrust: 4 × 10–12","Squat Bulgaro: 3 × 12","Stacchi Rumeni: 3 × 12"]},{title:"Defaticamento",items:["Gambe a muro 5'"]}],tips:["Visualizza il gluteo","Progressione settimanale","Senza scarpe"]},
{id:"w2",type:"upper",name:"Allenamento Upper & Core",freq:"1–2× a settimana",grad:"linear-gradient(135deg,#FFF4EE,#FFD5B8)",tc:"#A04010",sections:[{title:"Forza · 3 giri · 45\" pausa",items:["Around the World: 12","Bent-over Row: 15","Alzate Laterali: 12","Chest Opener: 12","Dead Bug: 10/gamba"]},{title:"Power Flow · 3 giri",items:["Down Dog → Dolphin: 5–10","Dolphin Push-ups: 10","Plank Knee-to-Elbow: 20","Plank Shoulder Taps: 10/lato","Ardha Navasana: 10 respiri","V-ups alternati: 10/lato","Low Navasana Hold: 30\""]},{title:"Compensazione",items:["Ginocchia al petto","Rolling like a ball","Malasana","Anahatasana","Bhujangasana","Supine Twist"]}],tips:["Rematore + Face Pull per postura","Vacuum addominale ogni mattina"]},
{id:"w3",type:"glutei",name:"Lower Body (Livello intermedio)",freq:"2× a settimana",grad:"linear-gradient(135deg,#FFF4EE,#FFD5B8)",tc:"#A04010",sections:[{title:"Esercizi · 8–10 ripetizioni",items:["8–10 RDL (Stacchi rumeni)","8–10 Squat","8–10 Step-up","8–10 Affondi laterali","8–10 Good mornings","8–10 Slanci"]}],tips:["Progressione graduale","Riposo 48–72h tra le sessioni"]},
{id:"w4",type:"upper",name:"Upper Body (Livello intermedio)",freq:"1–2× a settimana",grad:"linear-gradient(135deg,#FFF4EE,#FFD5B8)",tc:"#A04010",sections:[{title:"Esercizi · 8–10 ripetizioni",items:["8–10 Chest press (Spinte petto su pavimento o divano)","8–10 Piegamenti (Push-ups)","8–10 Superman Pulls (con manubri)","8–10 Shoulder press (in piedi o seduta)","8–10 Face pulls","8–10 W-Press con manubri leggeri"]}],tips:["Concentrati sulla postura","Mantieni le spalle basse e indietro"]},
{id:"w5",type:"upper",name:"Abs",freq:"2–3× a settimana",grad:"linear-gradient(135deg,#FFF4EE,#FFD5B8)",tc:"#A04010",sections:[{title:"Esercizi",items:["3×8 per gamba Deadbug + Weighted pullover","3×6–8 per lato Half kneeling Weight Chop & Lift","3×6–8 per lato Low plank w Banded Leg lifts"]}],tips:["Attiva il core prima di ogni esercizio","Respira in modo controllato"]},
];
const INIT_YOGA=[
{id:"y1",type:"yoga",name:"Detox Yoga",duration:"30–40 min",freq:"Post-weekend · giorni detox",grad:"linear-gradient(135deg,#F2FAF0,#C8E8B8)",tc:"#2A5A18",desc:"Sequenza drenante e digestiva.",sections:[{title:"Apertura",items:["Parivrtta Sukhasana","Cat-cow","Thread the needle"]},{title:"Flow",items:["3–5 Surya Namaskara","Utkatasana · Skandasana · Malasana","Twisted Runner Lunge","Twisted Wide Legged Fold"]},{title:"Chiusura",items:["Ananda Balasana — 2 min","Supta Baddha Konasana — 3 min","Jathara Parivartanasana — 2 min/lato","Viparita Karani — 5–10 min"]}],tips:["Bevi un bicchiere d'acqua subito dopo","Massaggia le gambe verso l'alto"]},
{id:"y2",type:"yoga",name:"Supine Yoga Rigenerativo",duration:"15–20 min",freq:"Sera · dopo pasti salati",grad:"linear-gradient(135deg,#F2FAF0,#C8E8B8)",tc:"#2A5A18",desc:"Ritorno linfatico e venoso delle gambe.",sections:[{title:"Sequenza",items:["Viparita Karani — 5–10 min","Supta Baddha Konasana — 3 min","Ananda Balasana — 2 min","Jathara Parivartanasana — 2 min/lato"]}],tips:["Abbina con getto freddo sulle gambe"]},
{id:"y3",type:"yoga",name:"Mobility & Flexibility Yoga",duration:"15 min",freq:"Mar · Ven mattina",grad:"linear-gradient(135deg,#F2FAF0,#C8E8B8)",tc:"#2A5A18",desc:"Mobilità articolare mattutina.",sections:[{title:"Sequenza",items:["Riscaldamento — 5 min","3–5 Surya Namaskara","Asana focus: fianchi, spalle, colonna","Flow con torsioni","Shaking finale 2 min"]}],tips:["A piedi nudi","Respira profondo"]},
];
const INIT_FACEYOGA=[
{id:"fy1",type:"faceyoga",name:"Face Yoga Mattina",duration:"5–8 min",freq:"Lun · Mar · Gio · Ven",grad:"linear-gradient(135deg,#FCDDE5,#FFB8CE)",tc:"#A03050",desc:"Drenaggio e scolpitura mattutina.",sections:[{title:"Drenaggio",items:["Apertura Rubini: 10 pompaggi clavicole","Forchetta: 15 scivolamenti orecchie→collo","Lift Perioculare: dall'interno verso la tempia"]},{title:"Scolpitura",items:["Grande O + Soffio: O lunga + guance gonfie 10sec×3","Zigomi Alti: 10 rip. con ancoraggio alle tempie"]}],tips:["Su pelle pulita o con siero fresco","Movimenti verso l'alto e l'esterno"]},
{id:"fy2",type:"faceyoga",name:"Face Yoga Sera C",duration:"8–10 min",freq:"Mar · Ven · Sab · Dom",grad:"linear-gradient(135deg,#FCDDE5,#FFB8CE)",tc:"#A03050",desc:"Scarico tensioni e nutrimento.",sections:[{title:"Scarico",items:["Sblocco Mandibola: 1 min circolari","Gancio Mascella: 15 passaggi"]},{title:"Occhi & Fronte",items:["Pizzicotto Sopraccigliare: 30 sec","Distensione Perioculare: 30 sec","Isolamento Fronte: 10 rep","Cancellina Anti-Stress: 30 sec"]},{title:"Chiusura",items:["Massaggio incavo ascelle","5 pressioni clavicole"]}],tips:["Dopo la crema sera","Termina sempre con pompaggio clavicole"]},
{id:"fy3",type:"faceyoga",name:"Face Yoga in Auto",duration:"5–10 min",freq:"Ogni giorno",grad:"linear-gradient(135deg,#EDE0FF,#D4C0FF)",tc:"#6B3FA0",desc:"Esercizi invisibili da fare ai semafori.",sections:[{title:"Al semaforo",items:["Mewing Dinamico: lingua al palato 5sec × 10","Bacio al Volante: collo su verso lo specchietto","Reset Spalle: ruota indietro e abbassa","Occhio a Sorpresa: spalanca 5sec × 5"]}],tips:["Solo quando l'auto è ferma","Il mewing si può fare anche mentre guidi"]},
{id:"fy4",type:"faceyoga",name:"Face Yoga in Ufficio",duration:"3–5 min",freq:"Ogni giorno al PC",grad:"linear-gradient(135deg,#EDE0FF,#D4C0FF)",tc:"#6B3FA0",desc:"Digital Detox alla scrivania.",sections:[{title:"Micro-pause",items:["Reset Posturale: spalle basse e indietro","Mewing: lingua al palato 1 min","Baffo d'Aria: 20 sec","Focus Visivo: punto lontano 10 sec","Pompaggio: 3 scivolamenti + pressione clavicole"]}],tips:["Ogni 2 ore","Invisibile — nessuno noterà nulla"]},
];
const INIT_STRATS=[
{id:"s1",title:"Productive Lunch Break",icon:"fork",grad:"linear-gradient(135deg,#F2FAF0,#C8E8B8)",tc:"#2A5A18",glow:"rgba(94,168,64,0.15)",steps:["Sigh Ciclico pre-pasto","Cibi sani + Slow eating","Podcast/audiobook/musica + Camminata 15+ min o Commissioni"],summary:"Respira → Mangia → Muoviti"},
{id:"s2",title:"Evening Self-Care",icon:"heart",grad:"linear-gradient(135deg,#FDFAF2,#F0E4B8)",tc:"#7A5C10",glow:"rgba(196,152,10,0.15)",steps:["Vestiti comodi","Detersione viso","6-10 Respiri consapevoli o 4 cicli 4-7-8","Crea l'atmosfera: metti un audiolibro/podcast/musica, accendi una candela","Prepara un drink analcolico","Sorseggia e cucina"],summary:"Mettiti comoda → Respira → Crea l'atmosfera → Drink analcolico → Cucina"},
{id:"s3",title:"Mindful Night",icon:"moon",grad:"linear-gradient(135deg,#FFF5EE,#FFD9B8)",tc:"#A04A10",glow:"rgba(232,131,74,0.15)",steps:["Mattina: Scegli una ricetta sana (Healthy scrolling)","Spesa sana","Evening self-care","Cena sul divano con candela","Checkpoint 60 sec: 6-10 Respiri consapevoli o 4 cicli 4-7-8","Timer 4 min: tisana + piatti","Crema mani (Sigillo)","Relax: libro, film, serie tv"],summary:"Healthy scrolling + Spesa sana → Evening self-care → Cena sul divano → Respiri → 4 min → Crema mani + Relax"},
];
const INIT_NOTES=[
{id:"n1",title:"Frutta — Primavera",color:"#D9F0CE",tc:"#2D6020",icon:"leaf",content:"Fragole · Ciliegie · Albicocche · Kiwi · Limoni · Arance (fino aprile) · Pompelmo"},
{id:"n2",title:"Verdure — Primavera",color:"#D9F0CE",tc:"#2D6020",icon:"leaf",content:"Asparagi · Piselli · Carciofi · Fave · Spinaci · Ravanelli · Cipollotti · Finocchi · Rucola"},
{id:"n3",title:"Frutta — Estate",color:"#F0E4B8",tc:"#7A5C10",icon:"leaf",content:"Pesche · Nettarine · Albicocche · Melone · Anguria · Fichi · More · Lamponi · Mirtilli"},
{id:"n4",title:"Verdure — Estate",color:"#F0E4B8",tc:"#7A5C10",icon:"leaf",content:"Zucchine · Peperoni · Melanzane · Pomodori · Cetrioli · Fagiolini · Basilico"},
{id:"n5",title:"Frutta — Autunno/Inverno",color:"#FFD5B8",tc:"#A04010",icon:"leaf",content:"Mele · Pere · Melograno · Kaki · Mandarini · Clementine · Arance · Kiwi · Castagne"},
{id:"n6",title:"Verdure — Autunno/Inverno",color:"#FFD5B8",tc:"#A04010",icon:"leaf",content:"Broccoli · Cavolfiore · Cavolo nero · Cime di rapa · Cicoria · Radicchio · Finocchi · Zucca"},
{id:"n7",title:"Retinolo — come usarlo",color:"#EDE0FF",tc:"#6B3FA0",icon:"flower",content:"Sera A (Lun+Gio): pelle asciutta dopo siero barriera. No contorno occhi. No AHA/BHA. SPF il mattino dopo."},
{id:"n8",title:"AHA/BHA — Peeling Sera B",color:"#EDE0FF",tc:"#6B3FA0",icon:"flower",content:"Mercoledì sera: pelle asciutta. AHA 30% + BHA 2% max 10 min. No Face Yoga. Poi siero calmante + CeraVe."},
{id:"n9",title:"Omega 3",color:"#FCDDE5",tc:"#A03050",icon:"spark",content:"Riduce infiammazione cutanea e fibrosi. Migliora elasticità. Prendi con il pasto."},
{id:"n10",title:"Bromelina",color:"#FCDDE5",tc:"#A03050",icon:"spark",content:"Lontano dai pasti. Dopo ogni sgarro: prendila subito. ½ dose domenica mattina."},
{id:"n11",title:"Rotazione proteine",color:"#F0E4B8",tc:"#7A5C10",icon:"tag",content:"Pollo: max 3×/sett · Uova: max 6/sett · Tofu: max 4×/sett · Legumi: max 4×/sett · Pesce bianco: max 4×/sett · Pesce grasso: max 1×/sett"},
];
const INIT_RIC=[
{id:"r1",cat:"Ricette",name:"Gingery Detox Bowl",kcal:595,pro:"63g",carbo:"57g",tag:"Detox",grad:"linear-gradient(135deg,#F2FAF0,#C8E8B8)",tc:"#2A5A18",ingredienti:["220 g petto di pollo","48 g riso basmati","150 g cavolini di Bruxelles","3 cm zenzero","Succo di ½ lime","1 cucchiaio EVO"]},
{id:"r2",cat:"Ricette",name:"Chicken & Guac Rainbow Bowl",kcal:680,pro:"64g",carbo:"52g",tag:"Post-workout",grad:"linear-gradient(135deg,#FFF4EE,#FFD5B8)",tc:"#A04010",ingredienti:["220 g petto di pollo","50 g riso integrale","cavolo viola · carota · spinacini","½ avocado","Succo di ½ lime","1 tsp EVO"]},
{id:"r3",cat:"Ricette",name:"Gamberi & Purè di Cavolfiore",kcal:315,pro:"36g",carbo:"16g",tag:"Leggero",grad:"linear-gradient(135deg,#FFF5EE,#FFD9B8)",tc:"#A04A10",ingredienti:["180 g gamberi sgusciati","350 g cavolfiore","1 mazzetto asparagi","Noce moscata","Scorza limone","1 tsp EVO"]},
{id:"r4",cat:"Ricette",name:"Dahl Curry & Verdure",kcal:295,pro:"16g",carbo:"31g",tag:"Vegan",grad:"linear-gradient(135deg,#FDFAF2,#F0E4B8)",tc:"#7A5C10",ingredienti:["150 g lenticchie rosse","100 ml latte cocco","½ cipolla rossa","2 spicchi aglio","½ tsp curcuma","olio cocco"]},
{id:"r5",cat:"Ricette",name:"Vegan Fajita Bowl",kcal:460,pro:"27g",carbo:"54g",tag:"Vegan",grad:"linear-gradient(135deg,#F2FAF0,#C8E8B8)",tc:"#2A5A18",ingredienti:["150 g tofu","60 g fagioli neri","40 g quinoa","1 peperone","½ cipolla","lime · peperoncino"]},
{id:"r6",cat:"Ricette",name:"Spicy Chicken & Broccoli",kcal:425,pro:"52g",carbo:"34g",tag:"Anti-infiamm.",grad:"linear-gradient(135deg,#FFF4EE,#FFD5B8)",tc:"#A04010",ingredienti:["200 g petto di pollo","300 g broccoli","40 g riso integrale","2 cm zenzero","tamari low sodium"]},
{id:"i1",cat:"Idee Pranzo/Cena",name:"Scaloppine di pollo al limone",kcal:null,pro:null,carbo:null,tag:"Carne",grad:"linear-gradient(135deg,#FFF4EE,#FFD5B8)",tc:"#A04010",ingredienti:["150–200 g petto di pollo","Farina integrale","Succo di limone","Salvia · EVO"]},
{id:"i2",cat:"Idee Pranzo/Cena",name:"Sovracosce al forno",kcal:null,pro:null,carbo:null,tag:"Carne",grad:"linear-gradient(135deg,#FFF4EE,#FFD5B8)",tc:"#A04010",ingredienti:["200 g sovracosce","Succo ½ limone","10 olive taggiasche","Salvia + rosmarino · EVO"]},
{id:"i3",cat:"Idee Pranzo/Cena",name:"Shakshuka",kcal:null,pro:null,carbo:null,tag:"Uova",grad:"linear-gradient(135deg,#FFF5EE,#FFD9B8)",tc:"#A04A10",ingredienti:["2–3 uova","200 g passata","½ cipolla · aglio","paprica · EVO"]},
{id:"i4",cat:"Idee Pranzo/Cena",name:"Tofu croccante con rucola",kcal:null,pro:null,carbo:null,tag:"Tofu",grad:"linear-gradient(135deg,#F2FAF0,#C8E8B8)",tc:"#2A5A18",ingredienti:["125–150 g tofu","amido di mais","rucola · pomodorini","curcuma · EVO"]},
{id:"i5",cat:"Idee Pranzo/Cena",name:"Fave e cicoria",kcal:null,pro:null,carbo:null,tag:"Legumi",grad:"linear-gradient(135deg,#F2FAF0,#C8E8B8)",tc:"#2A5A18",ingredienti:["120 g fave lessate","150 g cicoria","aglio · peperoncino · EVO"]},
{id:"i6",cat:"Idee Pranzo/Cena",name:"Orecchiette con cime di rapa",kcal:null,pro:null,carbo:null,tag:"Primi",grad:"linear-gradient(135deg,#FFF4EE,#FFD5B8)",tc:"#A04010",ingredienti:["70 g orecchiette","150 g cime di rapa","aglio · peperoncino · EVO"]},
{id:"i7",cat:"Idee Pranzo/Cena",name:"Filetto di salmone con broccoli",kcal:null,pro:null,carbo:null,tag:"Pesce",grad:"linear-gradient(135deg,#FFF5EE,#FFD9B8)",tc:"#A04A10",ingredienti:["130–150 g salmone","200 g broccoli","limone · EVO"]},
{id:"i8",cat:"Idee Pranzo/Cena",name:"Merluzzo al limone",kcal:null,pro:null,carbo:null,tag:"Pesce",grad:"linear-gradient(135deg,#FFF5EE,#FFD9B8)",tc:"#A04A10",ingredienti:["180–200 g merluzzo","Succo di limone","prezzemolo · EVO"]},

// ── Ricette nuove ──
{id:"r7",cat:"Ricette",name:"Orzo con Pesto di Rucola e Cardoncelli",kcal:410,pro:"14g",carbo:"62g",tag:"Primi",grad:"linear-gradient(135deg,#F2FAF0,#C8E8B8)",tc:"#2A5A18",ingredienti:["75 g orzo perlato","37 g rucola fresca","37 g funghi cardoncelli","10 g mandorle","10 g parmigiano","1 scalogno + 1 spicchio aglio","olio EVO · sale · pepe"]},
{id:"r8",cat:"Ricette",name:"Tofu Sandwich",kcal:415,pro:"24g",carbo:"40g",tag:"Tofu",grad:"linear-gradient(135deg,#F2FAF0,#C8E8B8)",tc:"#2A5A18",ingredienti:["2 fette pane integrale di segale (60 g)","120 g tofu a fette sottili","¼ avocado schiacciato","cetrioli a fette","germogli di soia o alfa-alfa"]},
{id:"r9",cat:"Ricette",name:"Golden Curry di Ceci",kcal:265,pro:"13g",carbo:"22g",tag:"Vegan",grad:"linear-gradient(135deg,#FDFAF2,#F0E4B8)",tc:"#7A5C10",ingredienti:["240 g ceci precotti (sgocciolati)","250 ml latte di soia senza zuccheri","1 cipolla rossa piccola","curry · paprika · cannella · coriandolo · pepe nero","1 cucchiaio olio EVO o cocco","succo di ½ lime"]},
{id:"r10",cat:"Ricette",name:"Red Lentil Soup",kcal:315,pro:"11g",carbo:"22g",tag:"Vegan",grad:"linear-gradient(135deg,#FDFAF2,#F0E4B8)",tc:"#7A5C10",ingredienti:["150 g lenticchie rosse","400 g pomodori pelati","400 ml latte di cocco intero","1 cipolla dorata · 2 spicchi aglio · 4 cm zenzero","curry · peperoncino","spicchi di lime per servire"]},
{id:"r11",cat:"Ricette",name:"Avocado & Cannellini Mash",kcal:278,pro:"8g",carbo:"17g",tag:"Vegan",grad:"linear-gradient(135deg,#F2FAF0,#C8E8B8)",tc:"#2A5A18",ingredienti:["240 g fagioli cannellini (sgocciolati)","2 avocado maturi","succo di 1 limone","olio EVO · pepe · peperoncino · aglio in polvere","opz: 1 cucchiaio lievito alimentare"]},
{id:"r12",cat:"Ricette",name:"Finocchi Brasati su Crema di Cannellini",kcal:315,pro:"16g",carbo:"36g",tag:"Vegan",grad:"linear-gradient(135deg,#F2FAF0,#C8E8B8)",tc:"#2A5A18",ingredienti:["2 finocchi grandi","250 g fagioli cannellini","succo di 2 arance bionde","olio EVO · sale · pepe · scorza di limone"]},
{id:"r13",cat:"Ricette",name:"Hummus di Cannellini & Verdure Fermentate",kcal:220,pro:"11g",carbo:"19g",tag:"Vegan",grad:"linear-gradient(135deg,#F2FAF0,#C8E8B8)",tc:"#2A5A18",ingredienti:["240 g cannellini","1 cucchiaio tahini","succo di 1 limone","1 spicchio aglio · cumino tostato","verdure fermentate (cavolo · carote · cavolfiore)"]},
{id:"r14",cat:"Ricette",name:"Hummus con Sedano Rapa & Zhoug",kcal:255,pro:"9g",carbo:"23g",tag:"Vegan",grad:"linear-gradient(135deg,#F2FAF0,#C8E8B8)",tc:"#2A5A18",ingredienti:["120 g cannellini","100 g sedano rapa cotto al forno","scorza di limone · lievito alimentare","prezzemolo · menta · peperoncino verde · cumino (per lo zhoug)","nocciole tostate"]},
{id:"r15",cat:"Ricette",name:"Super Fajita Protein Bowl",kcal:590,pro:"62g",carbo:"48g",tag:"Post-workout",grad:"linear-gradient(135deg,#FFF4EE,#FFD5B8)",tc:"#A04010",ingredienti:["220 g petto di pollo a straccetti","40 g riso basmati integrale","60 g fagioli neri","1 peperone rosso + 1 giallo","½ cipolla rossa","succo di lime · paprica · cumino · pepe","½ avocado"]},
{id:"r16",cat:"Ricette",name:"Grilled Chicken Fajita Bowl",kcal:515,pro:"48g",carbo:"42g",tag:"Post-workout",grad:"linear-gradient(135deg,#FFF4EE,#FFD5B8)",tc:"#A04010",ingredienti:["200 g petto di pollo a strisce","1 peperone rosso + 1 giallo","½ cipolla rossa","50 g riso integrale","½ avocado piccolo","succo di 1 lime · paprica · cumino · 1 tsp EVO"]},
{id:"r17",cat:"Ricette",name:"Totani al Forno con Zucchine e Pomodorini",kcal:345,pro:"38g",carbo:"19g",tag:"Pesce",grad:"linear-gradient(135deg,#FFF5EE,#FFD9B8)",tc:"#A04A10",ingredienti:["200 g anelli di totano","150 g zucchine","100 g pomodorini ciliegino","15 g pangrattato integrale","1 spicchio aglio · prezzemolo · olio EVO"]},
{id:"r18",cat:"Ricette",name:"Broccoli Salad — Fresh",kcal:165,pro:"7g",carbo:"16g",tag:"Leggero",grad:"linear-gradient(135deg,#F2FAF0,#C8E8B8)",tc:"#2A5A18",ingredienti:["200 g fiori di broccoli tritati","4 ravanelli","10 g uvetta · 5 g pinoli","cipolla rossa marinata nell'aceto di mele","dressing: tahini · limone · aglio"]},
{id:"r19",cat:"Ricette",name:"Broccoli Salad — Roasted",kcal:170,pro:"7g",carbo:"11g",tag:"Leggero",grad:"linear-gradient(135deg,#F2FAF0,#C8E8B8)",tc:"#2A5A18",ingredienti:["200 g broccoli","paprica affumicata · aglio · olio","salsa tahini (limone · acqua · sale)","fiocchi di peperoncino"]},

// ── Idee Pranzo/Cena nuove ──
{id:"i9",cat:"Idee Pranzo/Cena",name:"Avocado Egg Toast",kcal:null,pro:null,carbo:null,tag:"Uova",grad:"linear-gradient(135deg,#FFF5EE,#FFD9B8)",tc:"#A04A10",ingredienti:["2–3 uova (strapazzate o sode schiacciate)","½ avocado","1–2 fette pane integrale","succo di limone · pepe · EVO","contorno di stagione"]},
{id:"i10",cat:"Idee Pranzo/Cena",name:"Frittata con cipolle e spinaci",kcal:null,pro:null,carbo:null,tag:"Uova",grad:"linear-gradient(135deg,#FFF5EE,#FFD9B8)",tc:"#A04A10",ingredienti:["2–3 uova","½ cipolla","150 g spinaci o verdure saltate","EVO · sale · pepe"]},
{id:"i11",cat:"Idee Pranzo/Cena",name:"Shakshuka con bietole",kcal:null,pro:null,carbo:null,tag:"Uova",grad:"linear-gradient(135deg,#FFF5EE,#FFD9B8)",tc:"#A04A10",ingredienti:["2–3 uova","200 g passata o letto di bietole","½ cipolla · aglio","paprica · EVO"]},
{id:"i12",cat:"Idee Pranzo/Cena",name:"Omelette alle erbe fini",kcal:null,pro:null,carbo:null,tag:"Uova",grad:"linear-gradient(135deg,#FFF5EE,#FFD9B8)",tc:"#A04A10",ingredienti:["2–3 uova","prezzemolo + basilico","rucola per accompagnare","EVO · sale · pepe"]},
{id:"i13",cat:"Idee Pranzo/Cena",name:"Egg Salad alla Mediterranea",kcal:null,pro:null,carbo:null,tag:"Uova",grad:"linear-gradient(135deg,#FFF5EE,#FFD9B8)",tc:"#A04A10",ingredienti:["2–3 uova sode","sedano + cetriolo a pezzetti","cipollotto fresco · prezzemolo","limone · olio · sale · pepe"]},
{id:"i14",cat:"Idee Pranzo/Cena",name:"Uova sode, fagiolini e olive",kcal:null,pro:null,carbo:null,tag:"Uova",grad:"linear-gradient(135deg,#FFF5EE,#FFD9B8)",tc:"#A04A10",ingredienti:["2–3 uova sode","150 g fagiolini","pomodorini · olive taggiasche","EVO · limone"]},
{id:"i15",cat:"Idee Pranzo/Cena",name:"Tofu al Curry e Latte di Cocco",kcal:null,pro:null,carbo:null,tag:"Tofu",grad:"linear-gradient(135deg,#F2FAF0,#C8E8B8)",tc:"#2A5A18",ingredienti:["125–150 g tofu","curry · curcuma","goccio di latte di cocco","verdure di stagione · EVO"]},
{id:"i16",cat:"Idee Pranzo/Cena",name:"Tofu Strapazzato alla Curcuma",kcal:null,pro:null,carbo:null,tag:"Tofu",grad:"linear-gradient(135deg,#F2FAF0,#C8E8B8)",tc:"#2A5A18",ingredienti:["125–150 g tofu sbriciolato","porri · cipolla o zucchine","curcuma · pepe","EVO · sale"]},
{id:"i17",cat:"Idee Pranzo/Cena",name:"Spiedini di Tofu e Verdure",kcal:null,pro:null,carbo:null,tag:"Tofu",grad:"linear-gradient(135deg,#F2FAF0,#C8E8B8)",tc:"#2A5A18",ingredienti:["125–150 g tofu marinato in limone e zenzero","peperoni + zucchine (estate) o zucca (autunno)","EVO · sale · pepe"]},
{id:"i18",cat:"Idee Pranzo/Cena",name:"Sovracosce al forno con pomodorini",kcal:null,pro:null,carbo:null,tag:"Carne",grad:"linear-gradient(135deg,#FFF4EE,#FFD5B8)",tc:"#A04010",ingredienti:["200 g sovracosce","pomodorini · olive · patate (opz.)","EVO · erbe aromatiche"]},
{id:"i19",cat:"Idee Pranzo/Cena",name:"Bocconcini di pollo croccanti",kcal:null,pro:null,carbo:null,tag:"Carne",grad:"linear-gradient(135deg,#FFF4EE,#FFD5B8)",tc:"#A04010",ingredienti:["150–200 g petto di pollo","farina di mais","rucola o verdure cotte","EVO · limone"]},
{id:"i20",cat:"Idee Pranzo/Cena",name:"Straccetti di pollo con rucola",kcal:null,pro:null,carbo:null,tag:"Carne",grad:"linear-gradient(135deg,#FFF4EE,#FFD5B8)",tc:"#A04010",ingredienti:["150–200 g petto di pollo a strisce","rucola · pomodorini","succo di limone · EVO · pepe"]},
{id:"i21",cat:"Idee Pranzo/Cena",name:"Chicken Fajita Bowl",kcal:null,pro:null,carbo:null,tag:"Carne",grad:"linear-gradient(135deg,#FFF4EE,#FFD5B8)",tc:"#A04010",ingredienti:["150–200 g petto di pollo a strisce","peperoni · cipolla rossa","70 g riso integrale (opz.)","lime · paprica · cumino · EVO"]},
{id:"i22",cat:"Idee Pranzo/Cena",name:"Fegato alla veneziana",kcal:null,pro:null,carbo:null,tag:"Carne",grad:"linear-gradient(135deg,#FFF4EE,#FFD5B8)",tc:"#A04010",ingredienti:["150–200 g fegato di vitello","1 cipolla grande","EVO · sale · pepe · vino bianco (opz.)"]},
{id:"i23",cat:"Idee Pranzo/Cena",name:"Anelli di totano gratinati",kcal:null,pro:null,carbo:null,tag:"Pesce",grad:"linear-gradient(135deg,#FFF5EE,#FFD9B8)",tc:"#A04A10",ingredienti:["200 g anelli di totano","pomodorini ciliegino","15 g pangrattato integrale","aglio · prezzemolo · EVO"]},
{id:"i24",cat:"Idee Pranzo/Cena",name:"Gamberi su purea di cavolfiore",kcal:null,pro:null,carbo:null,tag:"Pesce",grad:"linear-gradient(135deg,#FFF5EE,#FFD9B8)",tc:"#A04A10",ingredienti:["180–200 g gamberi","350 g cavolfiore (per la purea)","scorza di limone · noce moscata","EVO · pepe"]},
{id:"i25",cat:"Idee Pranzo/Cena",name:"Gratin di finocchi o cavolfiori",kcal:null,pro:null,carbo:null,tag:"Latticini",grad:"linear-gradient(135deg,#FFF9E6,#FFE8A0)",tc:"#8A6A00",ingredienti:["300 g finocchi o cavolfiori","besciamella leggera (latte di soia o p. scremato)","parmigiano · noce moscata","EVO · sale"]},
{id:"i26",cat:"Idee Pranzo/Cena",name:"Crostini con mozzarella e verdure",kcal:null,pro:null,carbo:null,tag:"Latticini",grad:"linear-gradient(135deg,#FFF9E6,#FFE8A0)",tc:"#8A6A00",ingredienti:["2 fette pane integrale","mozzarella light o scamorza","zucchine · peperoni · funghi · cicoria (a stagione)","EVO · sale · pepe"]},
{id:"i27",cat:"Idee Pranzo/Cena",name:"Parmigiana leggera di zucchine",kcal:null,pro:null,carbo:null,tag:"Latticini",grad:"linear-gradient(135deg,#FFF9E6,#FFE8A0)",tc:"#8A6A00",ingredienti:["300 g zucchine o melanzane al forno","mozzarella light","passata di pomodoro · basilico","EVO · sale"]},
{id:"i28",cat:"Idee Pranzo/Cena",name:"Trofie con crema di ceci e zafferano",kcal:null,pro:null,carbo:null,tag:"Primi",grad:"linear-gradient(135deg,#FFF4EE,#FFD5B8)",tc:"#A04010",ingredienti:["70 g trofie","120 g ceci (da soli) o 60 g (+ carbo)","zafferano","rucola · pomodori secchi · mandorle · EVO"]},
{id:"i29",cat:"Idee Pranzo/Cena",name:"Pasta con tonno e rucola",kcal:null,pro:null,carbo:null,tag:"Primi",grad:"linear-gradient(135deg,#FFF4EE,#FFD5B8)",tc:"#A04010",ingredienti:["70 g pasta integrale","130 g tonno al naturale","pomodorini · rucola","limone · EVO · pepe"]},
{id:"i30",cat:"Idee Pranzo/Cena",name:"Pasta o Farro con Ricotta e verdure",kcal:null,pro:null,carbo:null,tag:"Primi",grad:"linear-gradient(135deg,#FFF4EE,#FFD5B8)",tc:"#A04010",ingredienti:["70 g pasta o farro","ricotta fresca","zucchine o pomodorini e rucola","EVO · sale · pepe"]},
{id:"i31",cat:"Idee Pranzo/Cena",name:"Farro con zucchine e piselli",kcal:null,pro:null,carbo:null,tag:"Primi",grad:"linear-gradient(135deg,#FDFAF2,#F0E4B8)",tc:"#7A5C10",ingredienti:["70 g farro","150 g zucchine + piselli","zenzero + peperoncino","EVO · sale"]},
{id:"i32",cat:"Idee Pranzo/Cena",name:"Farro o Orzo con crema di piselli",kcal:null,pro:null,carbo:null,tag:"Primi",grad:"linear-gradient(135deg,#FDFAF2,#F0E4B8)",tc:"#7A5C10",ingredienti:["70 g farro o orzo","piselli · cipolle caramellate","EVO · sale · pepe"]},
{id:"i33",cat:"Idee Pranzo/Cena",name:"Riso con zucca e rosmarino",kcal:null,pro:null,carbo:null,tag:"Primi",grad:"linear-gradient(135deg,#FDFAF2,#F0E4B8)",tc:"#7A5C10",ingredienti:["70 g riso integrale","200 g zucca (autunno) o zucchine e menta (estate)","rosmarino · EVO · sale"]},
{id:"i34",cat:"Idee Pranzo/Cena",name:"Hummus di Cannellini",kcal:null,pro:null,carbo:null,tag:"Legumi",grad:"linear-gradient(135deg,#F2FAF0,#C8E8B8)",tc:"#2A5A18",ingredienti:["240 g cannellini","1 cucchiaio tahini · aglio · cumino","succo di limone · EVO","verdure al piatto o in piadina integrale"]},
{id:"i35",cat:"Idee Pranzo/Cena",name:"Cannellini all'uccelletto",kcal:null,pro:null,carbo:null,tag:"Legumi",grad:"linear-gradient(135deg,#F2FAF0,#C8E8B8)",tc:"#2A5A18",ingredienti:["150 g cannellini","pomodoro · salvia · rosmarino","aglio · EVO · sale"]},
{id:"i36",cat:"Idee Pranzo/Cena",name:"Fagioli o lenticchie in umido",kcal:null,pro:null,carbo:null,tag:"Legumi",grad:"linear-gradient(135deg,#F2FAF0,#C8E8B8)",tc:"#2A5A18",ingredienti:["150 g fagioli o lenticchie","cipolla · pomodoro · aglio","erbe aromatiche · EVO · sale"]},

// ── Idee mancanti dal nuovo documento ──
{id:"i37",cat:"Idee Pranzo/Cena",name:"Dahl di lenticchie + verdure",kcal:null,pro:null,carbo:null,tag:"Legumi",grad:"linear-gradient(135deg,#F2FAF0,#C8E8B8)",tc:"#2A5A18",ingredienti:["150 g lenticchie rosse","verdure a foglia (spinaci · bietole · cicoria)","aglio · peperoncino · EVO"]},
{id:"i38",cat:"Idee Pranzo/Cena",name:"Cannellini con cipolla e pomodori",kcal:null,pro:null,carbo:null,tag:"Legumi",grad:"linear-gradient(135deg,#F2FAF0,#C8E8B8)",tc:"#2A5A18",ingredienti:["150 g cannellini","1 cipolla · 200 g pomodori o passata","aglio · EVO · sale · pepe"]},
{id:"i39",cat:"Idee Pranzo/Cena",name:"Uova sode e contorno di stagione",kcal:null,pro:null,carbo:null,tag:"Uova",grad:"linear-gradient(135deg,#FFF5EE,#FFD9B8)",tc:"#A04A10",ingredienti:["2–3 uova sode","200 g verdure di stagione cotte o crude","limone · EVO · sale · pepe"]},
{id:"i40",cat:"Idee Pranzo/Cena",name:"Petto alla piastra con insalata",kcal:null,pro:null,carbo:null,tag:"Carne",grad:"linear-gradient(135deg,#FFF4EE,#FFD5B8)",tc:"#A04010",ingredienti:["150–200 g petto di pollo o sovracosce","insalata greca senza feta o insalata mista","dadolata avocado · prezzemolo · lime","EVO · pepe"]},
{id:"i41",cat:"Idee Pranzo/Cena",name:"Farro/Riso con pesto, ceci e pomodorini",kcal:null,pro:null,carbo:null,tag:"Primi",grad:"linear-gradient(135deg,#FDFAF2,#F0E4B8)",tc:"#7A5C10",ingredienti:["70 g farro o riso integrale","60 g ceci o fagioli","pesto di basilico o rucola","pomodorini · cipolla · EVO"]},
{id:"i42",cat:"Idee Pranzo/Cena",name:"Riso o Pasta integrale al sugo",kcal:null,pro:null,carbo:null,tag:"Primi",grad:"linear-gradient(135deg,#FDFAF2,#F0E4B8)",tc:"#7A5C10",ingredienti:["70 g riso o pasta integrale","passata di pomodoro o pomodorini","aglio · peperoncino o basilico · EVO"]},
{id:"i43",cat:"Idee Pranzo/Cena",name:"Farro con crema di piselli e pomodorini",kcal:null,pro:null,carbo:null,tag:"Primi",grad:"linear-gradient(135deg,#FDFAF2,#F0E4B8)",tc:"#7A5C10",ingredienti:["70 g farro","150 g piselli (crema)","pomodorini · basilico · EVO"]},

// ── Ricette mancanti ──
{id:"r20",cat:"Ricette",name:"Gamberi & Asparagi con Purè di Cavolfiore",kcal:315,pro:"36g",carbo:"16g",tag:"Leggero",grad:"linear-gradient(135deg,#FFF5EE,#FFD9B8)",tc:"#A04A10",ingredienti:["180 g gamberi","1 mazzetto asparagi","350 g cavolfiore","noce moscata · scorza di limone","1 tsp EVO · pepe"]},
{id:"r21",cat:"Ricette",name:"Broccoli Salad — Aglio & Agrumi",kcal:190,pro:"9g",carbo:"15g",tag:"Leggero",grad:"linear-gradient(135deg,#F2FAF0,#C8E8B8)",tc:"#2A5A18",ingredienti:["200 g broccoli + 50 g fagiolini","lattuga croccante · ravanelli","3 spicchi aglio · 1 tsp tahini · limone (crema)","sesamo nero · olio infuso al limone"]},
{id:"r22",cat:"Ricette",name:"Cavolfiore Arrosto & Amba di Carote",kcal:205,pro:"8g",carbo:"17g",tag:"Vegan",grad:"linear-gradient(135deg,#F2FAF0,#C8E8B8)",tc:"#2A5A18",ingredienti:["300 g cavolfiore in cimette","2 carote (per l'amba fermentata)","curcuma · senape · pepe di Cayenna · fieno greco","olio · paprica · cumino · 10 g nocciole tostate"]},

// ── Colazioni, Snack e Dessert ──
{id:"s1",cat:"Colazioni & Snack",name:"Green Smoothie",kcal:215,pro:"23g",carbo:"19g",tag:"Colazione",grad:"linear-gradient(135deg,#F2FAF0,#C8E8B8)",tc:"#2A5A18",ingredienti:["½ banana","1 manciata spinaci freschi","100–150 ml bevanda soia non zuccherata","1 pezzetto zenzero fresco","1 tsp semi di chia","20 g proteine in polvere vaniglia","pizzico cannella + limone (opz.)"]},
{id:"s2",cat:"Colazioni & Snack",name:"Pasta di Curcuma (Golden Paste)",kcal:null,pro:null,carbo:null,tag:"Snack",grad:"linear-gradient(135deg,#FDFAF2,#F0E4B8)",tc:"#7A5C10",ingredienti:["20 g curcuma in polvere","90 ml acqua","25 g olio di cocco","½ tsp pepe nero","½ tsp zenzero in polvere","1 tsp cannella · noce moscata grattugiata","→ Si conserva in frigo 2 settimane · 1 tsp nel latte caldo"]},
{id:"s3",cat:"Colazioni & Snack",name:"Chia Pudding Cappuccino",kcal:195,pro:"18g",carbo:"9g",tag:"Colazione",grad:"linear-gradient(135deg,#F0E4B8,#E8C890)",tc:"#7A5C10",ingredienti:["150 g yogurt greco 0% (o soia)","15 g semi di chia","1 tazzina caffè espresso freddo","30 ml latte di mandorla senza zuccheri","stevia o vaniglia · cacao amaro per guarnire"]},
{id:"s4",cat:"Colazioni & Snack",name:"Bounty Chia Pudding",kcal:280,pro:"8g",carbo:"12g",tag:"Snack",grad:"linear-gradient(135deg,#FFF5EE,#FFD9B8)",tc:"#A04A10",ingredienti:["25 g semi di chia","150 ml latte di cocco leggero (o mandorla)","1 tsp cocco rapè essiccato","10 g cioccolato fondente 85% a scaglie","stevia per dolcificare"]},
];

// ── Skincare data ──
// ── DATI: routine skincare (mattina/sera A-B-C) ──
const SKINCARE_ROUTINES=[
{id:"sk_mattina",label:"Mattina",tag:"Wake-Up & Protect",tagColor:"#FFD5B8",tagTc:"#A04010",grad:"linear-gradient(135deg,#FFF8F0,#FFE8CC)",tc:"#A04010",icon:"sun",obiettivo:"Drenaggio linfatico, idratazione profonda e protezione.",steps:[
{n:"Detersione",desc:"Solo acqua tiepida o detergente delicato."},
{n:"Preparazione",desc:"Tonico al Cetriolo + The Ordinary Hyaluronic Acid 2 + B5 su pelle umida."},
{n:"Face Yoga — Drenaggio",desc:"Apertura Rubini: 10 pompaggi sopra le clavicole · Forchetta: 15 scivolamenti orecchie→collo→clavicole · Lift Perioculare: scivolamento dall'interno verso la tempia."},
{n:"Face Yoga — Scolpitura",desc:"Grande O + Soffio: O lunga con la bocca, guance gonfie d'aria 10 sec × 3 · Zigomi Alti: 10 ripetizioni con ancoraggio sulle tempie."},
{n:"Trattamento Attivo",desc:"Geek & Gorgeous aPAD su tutto il viso + The Ordinary Niacinamide 10% solo sulla zona T (naso/fronte)."},
{n:"Chiusura",desc:"Crema Idratante (CeraVe o Champs de Provence) + Siero Ciglia + SPF 50 Beauty of Joseon."},
]},
{id:"sk_seraA",label:"Sera A",tag:"Lunedì & Giovedì",tagColor:"#EDE0FF",tagTc:"#6B3FA0",grad:"linear-gradient(135deg,#F5F0FF,#E8D8FF)",tc:"#6B3FA0",icon:"moon",obiettivo:"Trattamento Retinale — rinnovamento cellulare.",steps:[
{n:"Detersione",desc:"Eventualmente doppia detersione."},
{n:"Protezione Barriera",desc:"Soothing & Barrier Support Serum (Siero Rosa) su tutto il viso prima del retinolo."},
{n:"Attivo",desc:"The Ordinary Retinale 0,2% su tutta la pelle — evita il contorno occhi."},
{n:"Chiusura",desc:"Crema Viso abbondante + Siero Ciglia."},
]},
{id:"sk_seraB",label:"Sera B",tag:"Mercoledì",tagColor:"#D9F0CE",tagTc:"#2A5A18",grad:"linear-gradient(135deg,#F0FAF0,#C8E8B8)",tc:"#2A5A18",icon:"sparkle",obiettivo:"Peeling chimico — rinnovo della texture.",steps:[
{n:"Detersione",desc:"Assicurati che la pelle sia completamente asciutta prima di applicare l'acido."},
{n:"Attivo",desc:"AHA 30% + BHA 2% — lascia in posa max 10 minuti, poi sciacqua bene."},
{n:"Riparazione",desc:"Soothing & Barrier Support Serum + CeraVe Moisturizing Lotion."},
{n:"Nota",desc:"Niente Face Yoga questa sera — la pelle è sensibilizzata dall'acido."},
]},
{id:"sk_seraC",label:"Sera C",tag:"Mar · Ven · Sab · Dom",tagColor:"#FCDDE5",tagTc:"#A03050",grad:"linear-gradient(135deg,#FFF0F5,#FFD0E0)",tc:"#A03050",icon:"flower",obiettivo:"Idratazione profonda, nutrimento e Face Yoga completo.",steps:[
{n:"Detersione",desc:"Doppia detersione — strucco + detergente delicato."},
{n:"Idratazione Base",desc:"Tonico al Cetriolo + Multi-Peptide + HA Serum su pelle umida."},
{n:"Riparazione",desc:"Soothing & Barrier Support Serum su tutto il viso."},
{n:"Occhi",desc:"Inkey List Retinol Eye Cream sul contorno occhi."},
{n:"Chiusura",desc:"Crema Viso abbondante."},
{n:"Face Yoga — Sblocco Mandibola",desc:"1 min: massaggi circolari con i palmi sui lati del viso a bocca socchiusa."},
{n:"Face Yoga — Il Gancio",desc:"15 passaggi: indice e medio a uncino dal mento al lobo dell'orecchio."},
{n:"Face Yoga — Pizzicotto Sopraccigliare",desc:"30 sec: piccoli pizzicotti lungo tutto l'arco delle sopracciglia per drenare la parte superiore dell'occhio."},
{n:"Face Yoga — Distensione Perioculare",desc:"30 sec: scivolamento con i polpastrelli sotto l'occhio fino alla tempia, 10 volte per distendere le zampe di gallina."},
{n:"Face Yoga — Isolamento Fronte",desc:"10 rep: blocca la fronte con le mani e prova a sgranare gli occhi."},
{n:"Face Yoga — Cancellina Anti-Stress",desc:"30 sec: movimenti a zig-zag verticali su tutta la fronte."},
{n:"Face Yoga — Scarico Finale",desc:"30 sec: massaggia brevemente l'incavo delle ascelle e fai 5 pressioni finali sopra le clavicole."},
]},
];

// ── DATI: "20+ piante a settimana" — categorie ispirate all'American Gut Project ──
// ── DATI: palette e icone condivise per tutti gli obiettivi (giornalieri ed extra settimanali) ──
// GOAL_COLORS: coppie [sfondo pastello, colore testo/accento] — riusate ovunque si scelga un colore per un obiettivo.
const GOAL_COLORS=[
["#D9F0CE","#2A5A18"],// verde salvia
["#F0E4B8","#7A5C10"],// giallo miele
["#FFD5B8","#A04010"],// pesca
["#FCDDE5","#A03050"],// rosa cipria
["#EDE0FF","#6B3FA0"],// lavanda
["#B8E8FF","#0A4A7A"],// azzurro cielo
["#D8E8FF","#2A4090"],// blu polvere
["#C8F0D0","#1A6B35"],// verde acqua
["#FFD9CC","#B04A2A"],// corallo tenue
["#E8E4DC","#6A6560"],// grigio perla (neutro)
];
// GOAL_ICONS: icone selezionabili per un obiettivo (giornaliero o settimanale).
const GOAL_ICONS=["star","heart","leaf","drop","walk","book","openbook","align","yoga","meditate","apple","avocado","noAlcohol","target","brain","smile","bed","flower","sparkle","sun","moon","dumbbell","fire","tag","cal"];

const PLANT_GOAL_BASE=20;
const PLANT_GOAL_GOLD=30;
const PLANT_CATEGORIES=[
{label:"Verdura",points:"1 punto",examples:"spinaci, broccoli, carote, cavolfiore, cipolla rossa",icon:"leaf",color:"#D9F0CE",tc:"#2D6020"},
{label:"Frutta",points:"1 punto",examples:"mele, banane, frutti di bosco, agrumi, kiwi",icon:"leaf",color:"#F0E4B8",tc:"#7A5C10"},
{label:"Cereali integrali",points:"1 punto",examples:"quinoa, riso integrale, avena, farro, orzo",icon:"leaf",color:"#FFD5B8",tc:"#A04010"},
{label:"Legumi",points:"1 punto",examples:"lenticchie, ceci, fagioli, piselli",icon:"leaf",color:"#E8D8FF",tc:"#6B3FA0"},
{label:"Semi oleosi e frutta secca",points:"1 punto",examples:"mandorle, noci, semi di lino, chia, girasole, zucca",icon:"leaf",color:"#B8E8FF",tc:"#0A4A7A"},
{label:"Erbe e spezie",points:"0,5 punti",examples:"basilico, prezzemolo, coriandolo, menta, rosmarino, curcuma",icon:"leaf",color:"#FCDDE5",tc:"#A03050"},
];
// normalizeText: minuscolo + rimozione accenti, per un confronto più robusto ("più"→"piu").
const normalizeText=(s)=>s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");

// PLANT_DB: database di alimenti vegetali riconosciuti automaticamente, con relativo valore in punti.
// name = nome mostrato nei suggerimenti; alt = forme alternative (singolare/plurale, sinonimi) su cui viene fatta la ricerca.
// 1 punto: frutta, verdura, cereali integrali, legumi, semi oleosi e frutta secca, funghi.
// 0,5 punti: erbe e spezie (quantità minime).
const PLANT_DB=[
// ── Frutta ──
{name:"Mele",points:1,alt:["mela"]},{name:"Pere",points:1,alt:["pera"]},{name:"Banane",points:1,alt:["banana"]},
{name:"Arance",points:1,alt:["arancia"]},{name:"Mandarini",points:1,alt:["mandarino"]},{name:"Clementine",points:1,alt:["clementina"]},
{name:"Limoni",points:1,alt:["limone"]},{name:"Pompelmo",points:1,alt:["pompelmi"]},{name:"Uva",points:1,alt:[]},
{name:"Uva passa",points:1,alt:["uvetta"]},{name:"Fragole",points:1,alt:["fragola"]},{name:"Mirtilli",points:1,alt:["mirtillo"]},
{name:"Lamponi",points:1,alt:["lampone"]},{name:"More",points:1,alt:["mora"]},{name:"Ribes",points:1,alt:[]},
{name:"Ciliegie",points:1,alt:["ciliegia"]},{name:"Pesche",points:1,alt:["pesca"]},{name:"Albicocche",points:1,alt:["albicocca"]},
{name:"Prugne",points:1,alt:["prugna","susine","susina"]},{name:"Kiwi",points:1,alt:[]},{name:"Ananas",points:1,alt:[]},
{name:"Mango",points:1,alt:[]},{name:"Papaya",points:1,alt:[]},{name:"Melone",points:1,alt:[]},
{name:"Anguria",points:1,alt:["cocomero"]},{name:"Fichi",points:1,alt:["fico"]},{name:"Cachi",points:1,alt:["kaki"]},
{name:"Melograno",points:1,alt:[]},{name:"Castagne",points:1,alt:["castagna"]},{name:"Avocado",points:1,alt:[]},
{name:"Datteri",points:1,alt:["dattero"]},{name:"Cocco",points:1,alt:[]},{name:"Nespole",points:1,alt:["nespola"]},
// ── Verdura ──
{name:"Pomodori",points:1,alt:["pomodoro"]},{name:"Cetrioli",points:1,alt:["cetriolo"]},{name:"Zucchine",points:1,alt:["zucchina"]},
{name:"Melanzane",points:1,alt:["melanzana"]},{name:"Peperoni",points:1,alt:["peperone"]},{name:"Carote",points:1,alt:["carota"]},
{name:"Patate",points:1,alt:["patata"]},{name:"Patate dolci",points:1,alt:["patata dolce","batata"]},{name:"Cipolle",points:1,alt:["cipolla"]},
{name:"Sedano",points:1,alt:[]},{name:"Finocchi",points:1,alt:["finocchio"]},{name:"Broccoli",points:1,alt:["broccolo"]},
{name:"Cavolfiore",points:1,alt:[]},{name:"Cavolo",points:1,alt:["cavoli"]},{name:"Cavolo nero",points:1,alt:[]},
{name:"Cavoletti di Bruxelles",points:1,alt:["cavolini"]},{name:"Verza",points:1,alt:[]},{name:"Spinaci",points:1,alt:["spinacio"]},
{name:"Bietole",points:1,alt:["bietola"]},{name:"Lattuga",points:1,alt:["insalata"]},{name:"Rucola",points:1,alt:[]},
{name:"Radicchio",points:1,alt:[]},{name:"Asparagi",points:1,alt:["asparago"]},{name:"Carciofi",points:1,alt:["carciofo"]},
{name:"Zucca",points:1,alt:[]},{name:"Barbabietola",points:1,alt:["barbabietole"]},{name:"Ravanelli",points:1,alt:["ravanello"]},
{name:"Piselli",points:1,alt:["pisello"]},{name:"Fave",points:1,alt:["fava"]},{name:"Fagiolini",points:1,alt:["fagiolino"]},
{name:"Porri",points:1,alt:["porro"]},{name:"Scalogno",points:1,alt:[]},{name:"Cicoria",points:1,alt:[]},
{name:"Cime di rapa",points:1,alt:[]},{name:"Funghi",points:1,alt:["fungo","champignon","porcini"]},
// ── Cereali integrali ──
{name:"Riso integrale",points:1,alt:["riso"]},{name:"Farro",points:1,alt:[]},{name:"Orzo",points:1,alt:[]},
{name:"Avena",points:1,alt:["fiocchi d'avena"]},{name:"Quinoa",points:1,alt:[]},{name:"Grano saraceno",points:1,alt:["saraceno"]},
{name:"Miglio",points:1,alt:[]},{name:"Segale",points:1,alt:[]},{name:"Mais",points:1,alt:["polenta"]},
{name:"Pane integrale",points:1,alt:[]},{name:"Pasta integrale",points:1,alt:[]},{name:"Amaranto",points:1,alt:[]},
// ── Legumi ──
{name:"Lenticchie",points:1,alt:["lenticchia"]},{name:"Ceci",points:1,alt:["cece"]},{name:"Fagioli",points:1,alt:["fagiolo","cannellini","borlotti"]},
{name:"Soia",points:1,alt:[]},{name:"Edamame",points:1,alt:[]},{name:"Tofu",points:1,alt:[]},{name:"Tempeh",points:1,alt:[]},
{name:"Arachidi",points:1,alt:["noccioline"]},
// ── Semi oleosi e frutta secca ──
{name:"Mandorle",points:1,alt:["mandorla"]},{name:"Noci",points:1,alt:["noce"]},{name:"Nocciole",points:1,alt:["nocciola"]},
{name:"Pistacchi",points:1,alt:["pistacchio"]},{name:"Anacardi",points:1,alt:["anacardio"]},{name:"Pinoli",points:1,alt:[]},
{name:"Semi di lino",points:1,alt:["lino"]},{name:"Semi di chia",points:1,alt:["chia"]},{name:"Semi di girasole",points:1,alt:[]},
{name:"Semi di zucca",points:1,alt:[]},{name:"Semi di sesamo",points:1,alt:["sesamo","tahin"]},{name:"Semi di canapa",points:1,alt:["canapa"]},
// ── Erbe e spezie (0,5 punti) ──
{name:"Basilico",points:0.5,alt:[]},{name:"Prezzemolo",points:0.5,alt:[]},{name:"Coriandolo",points:0.5,alt:[]},
{name:"Menta",points:0.5,alt:[]},{name:"Rosmarino",points:0.5,alt:[]},{name:"Timo",points:0.5,alt:[]},
{name:"Curcuma",points:0.5,alt:[]},{name:"Origano",points:0.5,alt:[]},{name:"Salvia",points:0.5,alt:[]},
{name:"Alloro",points:0.5,alt:[]},{name:"Cannella",points:0.5,alt:[]},{name:"Cumino",points:0.5,alt:[]},
{name:"Paprika",points:0.5,alt:[]},{name:"Zafferano",points:0.5,alt:[]},{name:"Aglio",points:0.5,alt:[]},
{name:"Peperoncino",points:0.5,alt:["peperoncini"]},{name:"Pepe",points:0.5,alt:[]},{name:"Chiodi di garofano",points:0.5,alt:["garofano"]},
{name:"Noce moscata",points:0.5,alt:[]},{name:"Cardamomo",points:0.5,alt:[]},{name:"Erba cipollina",points:0.5,alt:[]},
{name:"Dragoncello",points:0.5,alt:["estragone"]},{name:"Maggiorana",points:0.5,alt:[]},{name:"Anice",points:0.5,alt:[]},
{name:"Zenzero",points:0.5,alt:["ginger"]},{name:"Vaniglia",points:0.5,alt:[]},{name:"Senape",points:0.5,alt:[]},
{name:"Santoreggia",points:0.5,alt:[]},{name:"Curry",points:0.5,alt:[]},{name:"Semi di finocchio",points:0.5,alt:["finocchietto"]},
];
// searchPlantDb: suggerimenti mentre si digita — priorità alle voci che iniziano con il testo, poi quelle che lo contengono.
const searchPlantDb=(query,limit=6)=>{
  const q=normalizeText(query.trim());
  if(q.length<2)return[];
  const starts=[],contains=[];
  PLANT_DB.forEach(item=>{
    const forms=[item.name,...item.alt].map(normalizeText);
    if(forms.some(f=>f.startsWith(q)))starts.push(item);
    else if(forms.some(f=>f.includes(q)))contains.push(item);
  });
  return[...starts,...contains].slice(0,limit);
};
// findPlantExact: cerca una corrispondenza esatta (usata quando si preme "Aggiungi" senza scegliere un suggerimento).
const findPlantExact=(query)=>{
  const q=normalizeText(query.trim());
  if(!q)return null;
  return PLANT_DB.find(item=>[item.name,...item.alt].map(normalizeText).includes(q))||null;
};
// weekKeyOf: restituisce la data (lunedì) della settimana a cui appartiene una data qualsiasi,
// per raggruppare i "plant points" settimana per settimana (stessa logica di getWeekStart ma per date arbitrarie).
const weekKeyOf=(dateStr)=>{
  const d=new Date(dateStr+"T12:00:00");
  const day=d.getDay(); const diff=day===0?-6:1-day;
  d.setDate(d.getDate()+diff);
  return d.toISOString().slice(0,10);
};

// ── Helpers ──
// ── HELPER UI di base (etichette, titoli, card, liste ordinabili, bottom sheet) ──
const Lbl=({children,style={}})=><p style={{fontSize:10,fontWeight:600,color:N.muted,letterSpacing:.9,margin:"0 0 6px",fontFamily:F.body,...style}}>{children}</p>;
const Title=({children,size=22,style={}})=><p style={{fontFamily:F.heading,fontSize:size,fontWeight:600,color:N.text,margin:0,lineHeight:1.2,...style}}>{children}</p>;
const Card=({children,style={}})=><div style={{background:N.card,borderRadius:20,padding:"15px 16px",marginBottom:12,border:`0.5px solid ${N.border}`,boxShadow:"0 2px 10px rgba(0,0,0,0.04)",...style}}>{children}</div>;
// goalDone: legge lo stato "fatto/non fatto" di un obiettivo (fisso o extra) da una voce del progressLog.
// Unica fonte di verità: usata sia per lo storico a 14gg che per la barra dei giorni, evita di duplicare l'if/else.
const goalDone=(g,p)=>
  g.id==="water"?(p.goals?.water??false):
  g.id==="steps"?(p.goals?.steps??false):
  g.id==="read"?(p.goals?.read??false):
  g.id==="align"?(p.goals?.align??false):
  (p.goals?.extra?.[g.id]??false);

function SortableList({items, renderItem, onReorder}){
  const move=(from,to)=>{
    if(to<0||to>=items.length)return;
    const next=[...items];
    const [moved]=next.splice(from,1);
    next.splice(to,0,moved);
    onReorder(next);
  };
  return(
    <div>
      {items.map((item,i)=>(
        <div key={item.key||i}>
          {renderItem(item,i,false,
            i>0?()=>move(i,i-1):null,
            i<items.length-1?()=>move(i,i+1):null
          )}
        </div>
      ))}
    </div>
  );
}

function Sheet({onClose,children}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(28,28,26,0.45)",zIndex:300,display:"flex",alignItems:"flex-end"}} onClick={onClose}>
      <div style={{width:"100%",maxWidth:430,margin:"0 auto",background:"#fff",borderRadius:"24px 24px 0 0",maxHeight:"90vh",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:"16px 20px 8px",flexShrink:0}}><div style={{width:36,height:4,background:N.faint,borderRadius:99,margin:"0 auto 14px"}}/>{children[0]}</div>
        <div style={{overflowY:"auto",padding:"0 20px",flex:1}}>{children[1]}</div>
        <div style={{padding:"12px 20px 32px",flexShrink:0}}>{children[2]}</div>
      </div>
    </div>
  );
}

function FYSheet({steps,label,onClose,th}){
  return(<Sheet onClose={onClose}>
    <Title size={20}>{label}</Title>
    <div>{steps.map((s,i)=>(
      <div key={i} style={{display:"flex",gap:12,padding:"11px 0",borderBottom:i<steps.length-1?`0.5px solid ${N.faint}`:"none"}}>
        <div style={{width:26,height:26,borderRadius:9,background:th.grad||"#eee",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:600,color:th.dark||"#333",flexShrink:0,fontFamily:F.body}}>{i+1}</div>
        <div><p style={{fontSize:13,fontWeight:600,color:N.text,margin:"0 0 2px",fontFamily:F.body}}>{s.name}</p><p style={{fontSize:12,color:N.muted,margin:0,lineHeight:1.5,fontFamily:F.body}}>{s.desc}</p></div>
      </div>
    ))}</div>
    <button onClick={onClose} style={{width:"100%",padding:"13px",borderRadius:16,border:"none",background:th.grad||"#eee",color:th.dark||"#333",fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:F.body,marginTop:12}}>Chiudi</button>
  </Sheet>);
}

function ProteinTracker({weekProteins,onAdd,onUndo}){
  const [showAdd,setShowAdd]=useState(false);
  const [sel,setSel]=useState(null);
  const [meal,setMeal]=useState("pranzo");
  const [qty,setQty]=useState("1");
  const countMap={};
  PROTEIN_TYPES.forEach(pt=>{countMap[pt.id]=0;});
  weekProteins.forEach(e=>{if(countMap[e.type]!==undefined)countMap[e.type]+=(parseFloat(e.qty)||1);});
  return(
    <div style={{background:"#fff",borderRadius:20,border:`0.5px solid ${N.border}`,overflow:"hidden",marginBottom:12}}>
      <div style={{padding:"14px 16px 10px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><Title size={17}>Proteine settimana</Title><p style={{fontSize:11,color:N.muted,fontFamily:F.body,margin:"2px 0 0"}}>Lun–Dom · tap per registrare</p></div>
        <button onClick={()=>setShowAdd(s=>!s)} style={{width:32,height:32,borderRadius:10,border:`1px solid ${N.border}`,background:showAdd?N.text:"#fff",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>
          <Ic n="plus" s={16} c={showAdd?"#fff":N.muted}/>
        </button>
      </div>
      {showAdd&&(
        <div style={{padding:"0 16px 14px",borderTop:`0.5px solid ${N.faint}`}}>
          <p style={{fontSize:12,color:N.muted,fontFamily:F.body,margin:"10px 0 8px"}}>Che proteina hai mangiato?</p>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
            {PROTEIN_TYPES.map(pt=>(
              <button key={pt.id} onClick={()=>setSel(pt.id)} style={{padding:"5px 10px",borderRadius:20,border:`1px solid ${sel===pt.id?pt.tc:N.border}`,background:sel===pt.id?pt.color:"transparent",color:sel===pt.id?pt.tc:N.muted,fontSize:11,fontFamily:F.body,fontWeight:sel===pt.id?600:400,cursor:"pointer"}}>
                {pt.icon} {pt.label}
              </button>
            ))}
          </div>
          {sel&&(()=>{
            const pt=PROTEIN_TYPES.find(x=>x.id===sel);
            const isEgg=sel==="uova";
            return(
              <div>
                <div style={{display:"flex",gap:8,marginBottom:10}}>
                  {["pranzo","cena"].map(m=>(
                    <button key={m} onClick={()=>setMeal(m)} style={{flex:1,padding:"7px",borderRadius:10,border:`1px solid ${meal===m?N.text:N.border}`,background:meal===m?N.text:"transparent",color:meal===m?"#fff":N.muted,fontSize:12,fontFamily:F.body,cursor:"pointer",fontWeight:meal===m?600:400}}>{m.charAt(0).toUpperCase()+m.slice(1)}</button>
                  ))}
                </div>
                {isEgg&&(
                  <div>
                    <p style={{fontSize:11,color:N.muted,fontFamily:F.body,margin:"0 0 6px"}}>Quante uova?</p>
                    <div style={{display:"flex",gap:6,marginBottom:10}}>
                      {["1","2","3"].map(v=>(
                        <button key={v} onClick={()=>setQty(v)} style={{flex:1,padding:"7px",borderRadius:10,border:`1px solid ${qty===v?N.text:N.border}`,background:qty===v?N.text:"transparent",color:qty===v?"#fff":N.muted,fontSize:13,fontFamily:F.heading,fontWeight:600,cursor:"pointer"}}>{v}</button>
                      ))}
                    </div>
                  </div>
                )}
                <button onClick={()=>{onAdd({type:sel,meal,qty:isEgg?parseFloat(qty):1,date:new Date().toISOString().slice(0,10)});setShowAdd(false);setSel(null);setQty("1");}} style={{width:"100%",padding:"10px",borderRadius:12,border:"none",background:pt.color,color:pt.tc,fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:F.body}}>
                  Aggiungi {pt.icon}
                </button>
              </div>
            );
          })()}
        </div>
      )}
      <div style={{padding:"0 16px 16px"}}>
        {PROTEIN_TYPES.map(pt=>{
          const used=countMap[pt.id]; const pct=Math.min(used/pt.max,1); const isEgg=pt.id==="uova";
          const warn=pct>=0.75&&pct<1; const over=pct>=1;
          const barColor=over?"#C05050":warn?"#C4980A":pt.tc;
          return(
            <div key={pt.id} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                <span style={{fontSize:12,fontFamily:F.body,color:N.text,fontWeight:500}}>{pt.icon} {pt.label}</span>
                <span style={{fontSize:11,fontFamily:F.body,color:over?"#C05050":warn?"#C4980A":N.muted,fontWeight:over||warn?700:400}}>
                  {isEgg?`${used}/${pt.max} uova`:`${used}/${pt.max}×`}{over?" ⚠️ LIMITE":warn?" → quasi al limite":""}
                </span>
              </div>
              <div style={{height:5,background:N.faint,borderRadius:99,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${pct*100}%`,background:barColor,borderRadius:99,transition:"width .4s"}}/>
              </div>
            </div>
          );
        })}
        {weekProteins.length>0&&(
          <div style={{marginTop:10,borderTop:`0.5px solid ${N.faint}`,paddingTop:10}}>
            <p style={{fontSize:10,color:N.muted,fontFamily:F.body,margin:"0 0 6px",fontWeight:600,letterSpacing:.8}}>QUESTA SETTIMANA</p>
            <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
              {weekProteins.slice().reverse().map((e,i)=>{
                const pt=PROTEIN_TYPES.find(x=>x.id===e.type);
                return(<span key={i} style={{fontSize:10,padding:"2px 8px",borderRadius:99,background:pt?.color||N.faint,color:pt?.tc||N.muted,fontFamily:F.body}}>
                  {pt?.icon} {pt?.label} · {e.meal}{e.qty>1?` (${e.qty})`:""}
                </span>);
              })}
            </div>
            <button onClick={onUndo} style={{marginTop:8,fontSize:10,padding:"4px 10px",borderRadius:20,border:`1px solid ${N.border}`,background:"transparent",color:N.muted,cursor:"pointer",fontFamily:F.body}}>↩ annulla ultima</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── COMPONENTI: "20+ piante a settimana" (barra condivisa, info AGP, sezione completa) ──
// PlantProgressBar: barra a doppia soglia (20 = obiettivo base, 30 = gold standard).
// Usata sia nella card compatta in Home sia nella sezione completa in Altro.
function PlantProgressBar({score,compact=false}){
  const isGold=score>=PLANT_GOAL_GOLD;
  const isBase=score>=PLANT_GOAL_BASE;
  const pct=Math.min(Math.round(score/PLANT_GOAL_GOLD*100),100);
  const barBg=isGold?"linear-gradient(120deg,#E8C468,#FFF3D0,#FFD700,#FFF3D0,#E8C468)":isBase?"#4E8C40":"#5EA840";
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:6}}>
        <div style={{display:"flex",alignItems:"baseline",gap:4}}>
          <span style={{fontFamily:F.heading,fontSize:compact?24:30,fontWeight:600,color:isGold?"#A87A10":N.text}}>{score % 1===0?score:score.toFixed(1)}</span>
          <span style={{fontSize:compact?11:13,color:N.muted,fontFamily:F.body}}>/ {PLANT_GOAL_BASE}{!compact&&` (gold: ${PLANT_GOAL_GOLD})`}</span>
        </div>
        {isGold?<span style={{fontSize:10,padding:"3px 9px",borderRadius:99,background:"#FFF3D0",color:"#A87A10",fontFamily:F.body,fontWeight:700,display:"flex",alignItems:"center",gap:3}}><Ic n="sparkle" s={11} c="#A87A10"/>Gold standard</span>
        :isBase?<span style={{fontSize:10,padding:"3px 9px",borderRadius:99,background:"#D9F0CE",color:"#2A5A18",fontFamily:F.body,fontWeight:700}}>✓ Obiettivo raggiunto</span>
        :null}
      </div>
      <div style={{position:"relative",height:compact?8:10,background:N.faint,borderRadius:99,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${pct}%`,background:barBg,backgroundSize:isGold?"200% 100%":"100% 100%",animation:isGold?"plantShine 3s ease-in-out infinite":"none",borderRadius:99,transition:"width .4s"}}/>
        {/* marcatore alla soglia dei 20 punti (obiettivo base) */}
        <div style={{position:"absolute",top:0,bottom:0,left:`${PLANT_GOAL_BASE/PLANT_GOAL_GOLD*100}%`,width:1.5,background:"rgba(0,0,0,0.15)"}}/>
      </div>
    </div>
  );
}

// PlantQuickAdd: campo condiviso per aggiungere un alimento — mostra suggerimenti dal database mentre si digita
// (es. "mirt" → "Mirtilli (1)") e, se l'alimento non è riconosciuto, permette di scegliere il valore manualmente.
function PlantQuickAdd({onAdd,compact=false}){
  const[text,setText]=useState("");
  const[warn,setWarn]=useState(false);
  const[manualPick,setManualPick]=useState(false);
  const suggestions=searchPlantDb(text);
  const reset=()=>{setText("");setWarn(false);setManualPick(false);};
  const addWithPoints=(itemName,points)=>{
    const ok=onAdd(itemName,points);
    if(ok)reset(); else{setWarn(true);setManualPick(false);}
  };
  const handleAddClick=()=>{
    if(!text.trim())return;
    const match=findPlantExact(text);
    if(match)addWithPoints(text.trim(),match.points);
    else setManualPick(true);
  };
  return(
    <div>
      <div style={{display:"flex",gap:8}}>
        <div style={{flex:1,position:"relative"}}>
          <input value={text} onChange={e=>{setText(e.target.value);setWarn(false);setManualPick(false);}} onKeyDown={e=>{if(e.key==="Enter")handleAddClick();}} placeholder="Aggiungi un alimento…" style={{width:"100%",padding:compact?"9px 12px":"10px 12px",borderRadius:12,border:`1px solid ${N.border}`,fontFamily:F.body,fontSize:compact?12:13,color:N.text,background:N.faint,boxSizing:"border-box",outline:"none"}}/>
          {suggestions.length>0&&!manualPick&&(
            <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:"#fff",borderRadius:12,border:`0.5px solid ${N.border}`,boxShadow:"0 4px 16px rgba(0,0,0,0.1)",zIndex:20,overflow:"hidden"}}>
              {suggestions.map((s,i)=>(
                <div key={i} onClick={()=>addWithPoints(s.name,s.points)} style={{padding:"9px 12px",fontSize:12,fontFamily:F.body,color:N.text,cursor:"pointer",borderBottom:i<suggestions.length-1?`0.5px solid ${N.faint}`:"none",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span>{s.name}</span><span style={{color:s.points<1?"#A03050":"#4E8C40",fontWeight:700,fontSize:11}}>{s.points}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <button onClick={handleAddClick} style={{width:compact?38:42,borderRadius:12,border:"none",background:N.text,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}><Ic n="plus" s={compact?15:16} c="#fff"/></button>
      </div>
      {manualPick&&(
        <div style={{marginTop:8,padding:"10px 12px",borderRadius:12,background:N.faint}}>
          <p style={{fontSize:11,color:N.muted,fontFamily:F.body,margin:"0 0 8px"}}>"{text.trim()}" non è nel database — che valore ha?</p>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>addWithPoints(text.trim(),1)} style={{flex:1,padding:"8px",borderRadius:10,border:"none",background:"#D9F0CE",color:"#2A5A18",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:F.body}}>1 punto (alimento pieno)</button>
            <button onClick={()=>addWithPoints(text.trim(),0.5)} style={{flex:1,padding:"8px",borderRadius:10,border:"none",background:"#FCDDE5",color:"#A03050",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:F.body}}>0,5 (erba/spezia)</button>
          </div>
        </div>
      )}
      {warn&&<p style={{fontSize:11,color:"#C05050",fontFamily:F.body,margin:"6px 0 0"}}>Già registrato questa settimana.</p>}
    </div>
  );
}

// PlantInfoModal: spiegazione dell'American Gut Project + tabella delle categorie di alimenti vegetali.
function PlantInfoModal({onClose}){
  return(<Sheet onClose={onClose}>
    <Title size={20}>American Gut Project</Title>
    <div>
      <p style={{fontSize:12,color:N.muted,fontFamily:F.body,lineHeight:1.6,margin:"10px 0 14px"}}>
        Lo studio citizen-science dell'American Gut Project ha analizzato i campioni di oltre 10.000 partecipanti, trovando che chi mangia almeno 30 tipi diversi di alimenti vegetali a settimana ha un microbioma intestinale più diversificato rispetto a chi ne mangia meno di 10. Non conta la quantità, ma la varietà: 20 piante diverse è un buon obiettivo base, 30 è il "gold standard".
      </p>
      <Lbl>REGOLE DI CONTEGGIO</Lbl>
      <p style={{fontSize:12,color:N.text,fontFamily:F.body,lineHeight:1.6,margin:"0 0 14px"}}>
        Ogni alimento vegetale diverso conta una sola volta a settimana, anche se lo mangi più volte. Erbe e spezie valgono 0,5 punti perché si usano in quantità minime (in alcune fonti si usa 0,25, qui abbiamo scelto 0,5 per semplicità). Succhi e farine molto raffinate non contano, perché hanno perso la fibra. Mentre scrivi il nome di un alimento, l'app suggerisce automaticamente il valore corretto dal database; se un alimento non è ancora nel database, puoi indicarne tu il valore al momento dell'aggiunta.
      </p>
      <Lbl>LE CATEGORIE</Lbl>
      {PLANT_CATEGORIES.map((c,i)=>(
        <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"10px 0",borderBottom:i<PLANT_CATEGORIES.length-1?`0.5px solid ${N.faint}`:"none"}}>
          <div style={{width:30,height:30,borderRadius:9,background:c.color,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ic n={c.icon} s={14} c={c.tc}/></div>
          <div style={{flex:1}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
              <p style={{fontSize:13,fontWeight:600,color:N.text,margin:0,fontFamily:F.body}}>{c.label}</p>
              <span style={{fontSize:11,fontWeight:600,color:c.tc,fontFamily:F.body}}>{c.points}</span>
            </div>
            <p style={{fontSize:11,color:N.muted,margin:"2px 0 0",fontFamily:F.body,lineHeight:1.4}}>{c.examples}</p>
          </div>
        </div>
      ))}
    </div>
    <button onClick={onClose} style={{width:"100%",padding:"13px",borderRadius:16,border:"none",background:"#D9F0CE",color:"#2A5A18",fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:F.body,marginTop:12}}>Chiudi</button>
  </Sheet>);
}

// PlantsSection: sezione completa in Altro — aggiungi alimento, barra, riepilogo settimana, storico.
function PlantsSection({thisWeekPlants,plantScore,history,onAdd,onRemove}){
  const [openWeek,setOpenWeek]=useState(null);
  const [showInfo,setShowInfo]=useState(false);
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
        <p style={{fontSize:12,color:N.muted,fontFamily:F.body,margin:0,lineHeight:1.6,flex:1,paddingRight:10}}>Registra gli alimenti vegetali diversi che mangi questa settimana. Ogni alimento conta una volta sola.</p>
        <button onClick={()=>setShowInfo(true)} style={{width:26,height:26,borderRadius:"50%",border:`1px solid ${N.border}`,background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,fontFamily:F.heading,fontSize:13,fontWeight:600,color:N.muted}}>i</button>
      </div>

      <Card>
        <PlantProgressBar score={plantScore}/>
      </Card>

      <Card style={{overflow:"visible"}}>
        <Lbl>AGGIUNGI ALIMENTO</Lbl>
        <PlantQuickAdd onAdd={onAdd}/>
      </Card>

      {thisWeekPlants.length>0&&<Card>
        <Lbl>QUESTA SETTIMANA · {thisWeekPlants.length} alimenti</Lbl>
        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
          {thisWeekPlants.map(e=>(
            <span key={e.id} onClick={()=>onRemove(e.id)} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,padding:"4px 10px",borderRadius:99,background:e.points<1?"#FCDDE5":"#D9F0CE",color:e.points<1?"#A03050":"#2A5A18",fontFamily:F.body,cursor:"pointer"}}>
              {e.name} · {e.points} <Ic n="close" s={9} c={e.points<1?"#A03050":"#2A5A18"}/>
            </span>
          ))}
        </div>
      </Card>}

      {history.length>0&&<div style={{marginTop:4}}>
        <Title size={16} style={{marginBottom:8}}>Storico settimane</Title>
        {history.map(w=>{
          const wEnd=new Date(w.weekStart+"T12:00:00"); wEnd.setDate(wEnd.getDate()+6);
          const label=`${new Date(w.weekStart+"T12:00:00").toLocaleDateString("it-IT",{day:"numeric",month:"short"})} – ${wEnd.toLocaleDateString("it-IT",{day:"numeric",month:"short"})}`;
          const open=openWeek===w.weekStart;
          const gold=w.score>=PLANT_GOAL_GOLD, base=w.score>=PLANT_GOAL_BASE;
          return(<div key={w.weekStart} style={{background:"#fff",borderRadius:16,marginBottom:8,border:`0.5px solid ${N.border}`,overflow:"hidden"}}>
            <div onClick={()=>setOpenWeek(open?null:w.weekStart)} style={{padding:"12px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}>
              <div>
                <p style={{fontSize:12,fontWeight:600,color:N.text,margin:0,fontFamily:F.body}}>{label}</p>
                <p style={{fontSize:10,color:N.muted,margin:"2px 0 0",fontFamily:F.body}}>{w.entries.length} alimenti</p>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:14,fontWeight:600,fontFamily:F.heading,color:gold?"#A87A10":base?"#2A5A18":N.muted}}>{w.score % 1===0?w.score:w.score.toFixed(1)}</span>
                <span style={{transform:open?"rotate(90deg)":"none",transition:"transform .2s",display:"inline-flex"}}><Ic n="chevron" s={13} c={N.muted}/></span>
              </div>
            </div>
            {open&&<div style={{padding:"0 14px 12px",display:"flex",flexWrap:"wrap",gap:6}}>
              {w.entries.map(e=>(<span key={e.id} style={{fontSize:10,padding:"3px 9px",borderRadius:99,background:e.points<1?"#FCDDE5":"#D9F0CE",color:e.points<1?"#A03050":"#2A5A18",fontFamily:F.body}}>{e.name} · {e.points}</span>))}
            </div>}
          </div>);
        })}
      </div>}

      {showInfo&&<PlantInfoModal onClose={()=>setShowInfo(false)}/>}
    </div>
  );
}

// ── MODALI: aggiungi/rimuovi voci di routine, rituali, ricette, note, movimenti ──
function AddRoutineModal({onAdd,onClose,label}){
  const[text,setText]=useState(""); const[scope,setScope]=useState("today");
  return(<Sheet onClose={onClose}>
    <Title size={20}>Aggiungi voce</Title>
    <div>
      <p style={{fontSize:12,color:N.muted,fontFamily:F.body,margin:"8px 0 12px"}}>Sezione: <b>{label}</b></p>
      <input value={text} onChange={e=>setText(e.target.value)} placeholder="Es. Stretching 5'" style={{width:"100%",padding:"12px 14px",borderRadius:13,border:`1px solid ${N.border}`,fontFamily:F.body,fontSize:13,color:N.text,background:N.faint,boxSizing:"border-box",outline:"none",marginBottom:14}}/>
      {[["today","Solo oggi"],["always","Sempre (permanente)"]].map(([v,l])=>(
        <div key={v} onClick={()=>setScope(v)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:`0.5px solid ${N.faint}`,cursor:"pointer"}}>
          <div style={{width:18,height:18,borderRadius:"50%",border:`1.5px solid ${scope===v?N.text:N.border}`,background:scope===v?N.text:"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>
            {scope===v&&<div style={{width:7,height:7,borderRadius:"50%",background:"#fff"}}/>}
          </div>
          <p style={{fontSize:13,color:N.text,margin:0,fontFamily:F.body}}>{l}</p>
        </div>
      ))}
    </div>
    <button onClick={()=>{if(text.trim()){onAdd(text.trim(),scope);onClose();}}} style={{width:"100%",padding:"13px",borderRadius:16,border:"none",background:N.text,color:"#fff",fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:F.body,marginTop:12}}>Aggiungi</button>
  </Sheet>);
}

function DelRoutineModal({item,onDelete,onClose}){
  return(<Sheet onClose={onClose}>
    <Title size={20}>Rimuovi voce</Title>
    <div>
      <div style={{background:N.faint,borderRadius:12,padding:"12px 14px",margin:"8px 0 16px"}}><p style={{fontSize:13,color:N.text,margin:0,fontFamily:F.body}}>{item.text}</p></div>
      {item.permanent&&[["today","Rimuovi solo oggi"],["always","Rimuovi definitivamente"]].map(([v,l])=>(
        <div key={v} onClick={()=>{onDelete(v);onClose();}} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 0",borderBottom:`0.5px solid ${N.faint}`,cursor:"pointer"}}>
          <Ic n="trash" s={16} c={v==="always"?"#C05050":N.muted}/>
          <p style={{fontSize:13,color:v==="always"?"#C05050":N.text,margin:0,fontFamily:F.body}}>{l}</p>
        </div>
      ))}
      {!item.permanent&&<button onClick={()=>{onDelete("today");onClose();}} style={{width:"100%",padding:"12px",borderRadius:14,border:"none",background:"#FFF0F0",color:"#C05050",fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:F.body}}>Rimuovi</button>}
    </div>
    <button onClick={onClose} style={{width:"100%",padding:"12px",borderRadius:14,border:`0.5px solid ${N.border}`,background:"transparent",color:N.muted,fontSize:13,cursor:"pointer",fontFamily:F.body,marginTop:8}}>Annulla</button>
  </Sheet>);
}

function AddStratModal({onAdd,onClose}){
  const[title,setTitle]=useState(""); const[steps,setSteps]=useState([""]);
  const icons=["fork","heart","moon","leaf","star","book","drop","walk","flower","spark"]; const[si,setSi]=useState("star");
  const grads=[["linear-gradient(135deg,#F2FAF0,#C8E8B8)","#2A5A18"],["linear-gradient(135deg,#FFF4EE,#FFD5B8)","#A04010"],["linear-gradient(135deg,#FDFAF2,#F0E4B8)","#7A5C10"],["linear-gradient(135deg,#FFF5EE,#FFD9B8)","#A04A10"],["linear-gradient(135deg,#EDE0FF,#D4C0FF)","#6B3FA0"]]; const[gi,setGi]=useState(0);
  return(<Sheet onClose={onClose}>
    <Title size={20}>Nuovo rituale</Title>
    <div style={{paddingBottom:8}}>
      <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Nome rituale" style={{width:"100%",padding:"11px 14px",borderRadius:13,border:`1px solid ${N.border}`,fontFamily:F.body,fontSize:13,color:N.text,background:N.faint,boxSizing:"border-box",outline:"none",marginTop:8,marginBottom:12}}/>
      <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>{icons.map(ic=><div key={ic} onClick={()=>setSi(ic)} style={{width:36,height:36,borderRadius:10,background:si===ic?N.text:N.faint,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Ic n={ic} s={16} c={si===ic?"#fff":N.muted}/></div>)}</div>
      <div style={{display:"flex",gap:8,marginBottom:14}}>{grads.map(([g,tc],i)=><div key={i} onClick={()=>setGi(i)} style={{flex:1,height:28,borderRadius:8,background:g,border:`2px solid ${gi===i?grads[i][1]:"transparent"}`,cursor:"pointer"}}/>)}</div>
      <Lbl>PASSI</Lbl>
      {steps.map((s,i)=><input key={i} value={s} onChange={e=>{const x=[...steps];x[i]=e.target.value;setSteps(x);}} placeholder={`Passo ${i+1}`} style={{width:"100%",padding:"9px 12px",borderRadius:11,border:`1px solid ${N.border}`,fontFamily:F.body,fontSize:12,color:N.text,background:N.faint,boxSizing:"border-box",outline:"none",marginBottom:6}}/>)}
      <button onClick={()=>setSteps(p=>[...p,""])} style={{fontSize:12,padding:"5px 12px",borderRadius:20,border:`1px dashed ${N.border}`,background:"transparent",color:N.muted,cursor:"pointer",fontFamily:F.body}}>+ passo</button>
    </div>
    <button onClick={()=>{if(title.trim()){onAdd({id:"c"+Date.now(),title,icon:si,grad:grads[gi][0],tc:grads[gi][1],glow:"rgba(0,0,0,0.1)",steps:steps.filter(s=>s.trim()),summary:steps.filter(s=>s.trim()).slice(0,3).join(" → ")});onClose();}}} style={{width:"100%",padding:"13px",borderRadius:16,border:"none",background:N.text,color:"#fff",fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:F.body,marginTop:8}}>Salva</button>
  </Sheet>);
}

function AddRicModal({onAdd,onClose}){
  const[name,setName]=useState(""); const[kcal,setKcal]=useState(""); const[pro,setPro]=useState(""); const[carbo,setCarbo]=useState(""); const[tag,setTag]=useState(""); const[ing,setIng]=useState([""]);
  const[cat,setCat]=useState("Idee Pranzo/Cena");
  const grads=[["linear-gradient(135deg,#F2FAF0,#C8E8B8)","#2A5A18"],["linear-gradient(135deg,#FFF4EE,#FFD5B8)","#A04010"],["linear-gradient(135deg,#FDFAF2,#F0E4B8)","#7A5C10"],["linear-gradient(135deg,#FFF5EE,#FFD9B8)","#A04A10"],["linear-gradient(135deg,#EDE0FF,#D4C0FF)","#6B3FA0"]]; const[gi,setGi]=useState(0);
  return(<Sheet onClose={onClose}>
    <Title size={20}>Nuovo piatto</Title>
    <div style={{paddingBottom:8}}>
      <div style={{display:"flex",gap:8,margin:"8px 0 12px"}}>{["Ricette","Idee Pranzo/Cena"].map(c=><button key={c} onClick={()=>setCat(c)} style={{padding:"5px 14px",borderRadius:20,border:`1px solid ${cat===c?N.text:N.border}`,background:cat===c?N.text:"transparent",color:cat===c?"#fff":N.muted,fontSize:12,fontFamily:F.body,cursor:"pointer"}}>{c}</button>)}</div>
      {[["Nome",name,setName,"Es. Pollo al limone"],["Tag",tag,setTag,"Es. Carne"],["Kcal",kcal,setKcal,"595"],["Proteine",pro,setPro,"45g"],["Carbo",carbo,setCarbo,"30g"]].map(([ph,val,set,pl])=>(<input key={ph} value={val} onChange={e=>set(e.target.value)} placeholder={pl} style={{width:"100%",padding:"9px 12px",borderRadius:11,border:`1px solid ${N.border}`,fontFamily:F.body,fontSize:12,color:N.text,background:N.faint,boxSizing:"border-box",outline:"none",marginBottom:8}}/>))}
      <div style={{display:"flex",gap:8,marginBottom:12}}>{grads.map(([g,tc],i)=><div key={i} onClick={()=>setGi(i)} style={{flex:1,height:24,borderRadius:8,background:g,border:`2px solid ${gi===i?grads[i][1]:"transparent"}`,cursor:"pointer"}}/>)}</div>
      <Lbl>INGREDIENTI</Lbl>
      {ing.map((s,i)=><input key={i} value={s} onChange={e=>{const x=[...ing];x[i]=e.target.value;setIng(x);}} placeholder="Es. 150 g petto di pollo" style={{width:"100%",padding:"8px 12px",borderRadius:11,border:`1px solid ${N.border}`,fontFamily:F.body,fontSize:12,color:N.text,background:N.faint,boxSizing:"border-box",outline:"none",marginBottom:6}}/>)}
      <button onClick={()=>setIng(p=>[...p,""])} style={{fontSize:12,padding:"5px 12px",borderRadius:20,border:`1px dashed ${N.border}`,background:"transparent",color:N.muted,cursor:"pointer",fontFamily:F.body}}>+ ingrediente</button>
    </div>
    <button onClick={()=>{if(name.trim()){onAdd({id:"cr"+Date.now(),cat,name,kcal:kcal||null,pro:pro||null,carbo:carbo||null,tag,grad:grads[gi][0],tc:grads[gi][1],ingredienti:ing.filter(s=>s.trim())});onClose();}}} style={{width:"100%",padding:"13px",borderRadius:16,border:"none",background:N.text,color:"#fff",fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:F.body,marginTop:8}}>Salva piatto</button>
  </Sheet>);
}

function AddNoteModal({onAdd,onClose,editNote=null}){
  const[title,setTitle]=useState(editNote?.title||""); const[content,setContent]=useState(editNote?.content||"");
  const colors=[["#D9F0CE","#2D6020"],["#F0E4B8","#7A5C10"],["#FFD5B8","#A04010"],["#FCDDE5","#A03050"],["#EDE0FF","#6B3FA0"],["#F0EDE8","#5A5652"]];
  const icons=["leaf","flower","spark","tag","book","heart","note","fork"]; const[ci,setCi]=useState(editNote?colors.findIndex(([bg])=>bg===editNote.color):0); const[icon,setIcon]=useState(editNote?.icon||"note");
  return(<Sheet onClose={onClose}>
    <Title size={20}>{editNote?"Modifica nota":"Nuova nota"}</Title>
    <div style={{paddingBottom:8}}>
      <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Titolo" style={{width:"100%",padding:"11px 14px",borderRadius:13,border:`1px solid ${N.border}`,fontFamily:F.body,fontSize:13,color:N.text,background:N.faint,boxSizing:"border-box",outline:"none",marginTop:8,marginBottom:10}}/>
      <textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="Contenuto…" rows={4} style={{width:"100%",padding:"11px 14px",borderRadius:13,border:`1px solid ${N.border}`,fontFamily:F.body,fontSize:13,color:N.text,background:N.faint,boxSizing:"border-box",outline:"none",resize:"none",marginBottom:12}}/>
      <div style={{display:"flex",gap:8,marginBottom:10}}>{icons.map(ic=><div key={ic} onClick={()=>setIcon(ic)} style={{width:32,height:32,borderRadius:9,background:icon===ic?N.text:N.faint,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Ic n={ic} s={14} c={icon===ic?"#fff":N.muted}/></div>)}</div>
      <div style={{display:"flex",gap:8}}>{colors.map(([bg,tc],i)=><div key={i} onClick={()=>setCi(i)} style={{flex:1,height:24,borderRadius:8,background:bg,border:`2px solid ${ci===i?colors[i][1]:"transparent"}`,cursor:"pointer"}}/>)}</div>
    </div>
    <button onClick={()=>{if(title.trim()){if(editNote){onAdd({...editNote,title,content,color:colors[ci<0?0:ci][0],tc:colors[ci<0?0:ci][1],icon});}else{onAdd({id:"note"+Date.now(),title,content,color:colors[ci][0],tc:colors[ci][1],icon});}onClose();}}} style={{width:"100%",padding:"13px",borderRadius:16,border:"none",background:N.text,color:"#fff",fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:F.body,marginTop:12}}>{editNote?"Salva modifiche":"Salva"}</button>
  </Sheet>);
}

function AddMovimentoModal({onAdd,onClose}){
  const[tipo,setTipo]=useState("glutei"); const[name,setName]=useState(""); const[freq,setFreq]=useState(""); const[duration,setDuration]=useState(""); const[desc,setDesc]=useState(""); const[esercizi,setEsercizi]=useState([""]); const[tips,setTips]=useState([""]);
  const gradMap={glutei:"linear-gradient(135deg,#FFF4EE,#FFD5B8)",upper:"linear-gradient(135deg,#FFF4EE,#FFD5B8)",yoga:"linear-gradient(135deg,#F2FAF0,#C8E8B8)",faceyoga:"linear-gradient(135deg,#FCDDE5,#FFB8CE)"};
  const tcMap={glutei:"#A04010",upper:"#A04010",yoga:"#2A5A18",faceyoga:"#A03050"};
  return(<Sheet onClose={onClose}>
    <Title size={20}>Nuovo allenamento</Title>
    <div style={{paddingBottom:8}}>
      <div style={{display:"flex",gap:6,margin:"10px 0 14px",flexWrap:"wrap"}}>
        {[["glutei","Glutei","dumbbell"],["upper","Upper","dumbbell"],["yoga","Yoga","yoga"],["faceyoga","Face Yoga","face"]].map(([v,l,ic])=>(
          <button key={v} onClick={()=>setTipo(v)} style={{flex:1,minWidth:70,display:"flex",flexDirection:"column",alignItems:"center",gap:5,padding:"8px 4px",borderRadius:14,border:`1px solid ${tipo===v?tcMap[v]:N.border}`,background:tipo===v?gradMap[v]:"transparent",cursor:"pointer"}}>
            <Ic n={ic} s={18} c={tipo===v?tcMap[v]:N.muted}/><span style={{fontSize:10,fontFamily:F.body,fontWeight:600,color:tipo===v?tcMap[v]:N.muted}}>{l}</span>
          </button>
        ))}
      </div>
      {[["Nome",name,setName,"Es. Full Body"],["Frequenza",freq,setFreq,"Es. 2× a settimana"],["Durata",duration,setDuration,"Es. 15 min"]].map(([ph,val,set,pl])=>(<input key={ph} value={val} onChange={e=>set(e.target.value)} placeholder={pl} style={{width:"100%",padding:"9px 12px",borderRadius:11,border:`1px solid ${N.border}`,fontFamily:F.body,fontSize:12,color:N.text,background:N.faint,boxSizing:"border-box",outline:"none",marginBottom:8}}/>))}
      <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Descrizione breve" rows={2} style={{width:"100%",padding:"9px 12px",borderRadius:11,border:`1px solid ${N.border}`,fontFamily:F.body,fontSize:12,color:N.text,background:N.faint,boxSizing:"border-box",outline:"none",resize:"none",marginBottom:10}}/>
      <Lbl>ESERCIZI / PASSI</Lbl>
      {esercizi.map((s,i)=><input key={i} value={s} onChange={e=>{const x=[...esercizi];x[i]=e.target.value;setEsercizi(x);}} placeholder="Es. Hip Thrust: 4×12" style={{width:"100%",padding:"8px 12px",borderRadius:11,border:`1px solid ${N.border}`,fontFamily:F.body,fontSize:12,color:N.text,background:N.faint,boxSizing:"border-box",outline:"none",marginBottom:6}}/>)}
      <button onClick={()=>setEsercizi(p=>[...p,""])} style={{fontSize:11,padding:"4px 12px",borderRadius:20,border:`1px dashed ${N.border}`,background:"transparent",color:N.muted,cursor:"pointer",fontFamily:F.body,marginBottom:12}}>+ passo</button>
      <Lbl>CONSIGLI (opzionale)</Lbl>
      {tips.map((s,i)=><input key={i} value={s} onChange={e=>{const x=[...tips];x[i]=e.target.value;setTips(x);}} placeholder="Consiglio" style={{width:"100%",padding:"8px 12px",borderRadius:11,border:`1px solid ${N.border}`,fontFamily:F.body,fontSize:12,color:N.text,background:N.faint,boxSizing:"border-box",outline:"none",marginBottom:6}}/>)}
      <button onClick={()=>setTips(p=>[...p,""])} style={{fontSize:11,padding:"4px 12px",borderRadius:20,border:`1px dashed ${N.border}`,background:"transparent",color:N.muted,cursor:"pointer",fontFamily:F.body}}>+ consiglio</button>
    </div>
    <button onClick={()=>{if(!name.trim())return;onAdd({id:"m"+Date.now(),type:tipo,name,freq,duration,desc,grad:gradMap[tipo],tc:tcMap[tipo],sections:[{title:"Esercizi",items:esercizi.filter(s=>s.trim())}],tips:tips.filter(s=>s.trim())});onClose();}} style={{width:"100%",padding:"13px",borderRadius:16,border:"none",background:N.text,color:"#fff",fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:F.body,marginTop:8}}>Salva</button>
  </Sheet>);
}

// ── COMPONENTI: obiettivi giornalieri (fissi ed extra) ──
// GoalStylePicker: selettore icona + colore condiviso da tutte le schermate di modifica/aggiunta obiettivo.
function GoalStylePicker({icon,setIcon,colorIdx,setColorIdx}){
  return(
    <div>
      <Lbl style={{margin:"0 0 3px"}}>ICONA</Lbl>
      <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
        {GOAL_ICONS.map(ic=>(<div key={ic} onClick={()=>setIcon(ic)} style={{width:30,height:30,borderRadius:9,background:icon===ic?N.text:N.faint,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}><Ic n={ic} s={13} c={icon===ic?"#fff":N.muted}/></div>))}
      </div>
      <Lbl style={{margin:"0 0 3px"}}>COLORE</Lbl>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {GOAL_COLORS.map(([bg,tc],i)=>(<div key={i} onClick={()=>setColorIdx(i)} style={{width:26,height:26,borderRadius:8,background:bg,border:`2px solid ${colorIdx===i?tc:"transparent"}`,cursor:"pointer",flexShrink:0}}/>))}
      </div>
    </div>
  );
}

// GoalAddForm: form "+ nuovo" condiviso tra obiettivi del giorno e obiettivi settimanali extra.
function GoalAddForm({onSave,onCancel}){
  const[label,setLabel]=useState(""); const[unit,setUnit]=useState(""); const[target,setTarget]=useState("");
  const[icon,setIcon]=useState("star"); const[colorIdx,setColorIdx]=useState(0);
  return(
    <div style={{background:"#fff",borderRadius:18,padding:"14px 15px",marginBottom:12,border:`0.5px solid ${N.border}`}}>
      {[["Nome",label,setLabel,"Es. Meditazione"],["Unità",unit,setUnit,"min"],["Target",target,setTarget,"10"]].map(([ph,v,sv,pl])=>(<input key={ph} value={v} onChange={e=>sv(e.target.value)} placeholder={pl} style={{width:"100%",padding:"9px 12px",borderRadius:11,border:`1px solid ${N.border}`,fontFamily:F.body,fontSize:12,color:N.text,background:N.faint,boxSizing:"border-box",outline:"none",marginBottom:8}}/>))}
      <GoalStylePicker icon={icon} setIcon={setIcon} colorIdx={colorIdx} setColorIdx={setColorIdx}/>
      <div style={{display:"flex",gap:8,marginTop:12}}>
        <button onClick={onCancel} style={{flex:1,padding:"10px",borderRadius:12,border:`0.5px solid ${N.border}`,background:"transparent",color:N.muted,fontSize:12,cursor:"pointer",fontFamily:F.body}}>Annulla</button>
        <button onClick={()=>{if(label&&target){onSave({label,unit,target:+target,icon,color:GOAL_COLORS[colorIdx][0],tc:GOAL_COLORS[colorIdx][1]});}}} style={{flex:1,padding:"10px",borderRadius:12,border:"none",background:N.text,color:"#fff",fontSize:12,cursor:"pointer",fontFamily:F.body,fontWeight:600}}>Salva</button>
      </div>
    </div>
  );
}

function GoalCheck({done,setDone,icon,color,checkColor,label,subtitle,extraLink,onEdit,onDelete}){
  const[editing,setEditing]=useState(false);
  const[editLabel,setEditLabel]=useState(label);
  const[editSub,setEditSub]=useState(subtitle||"");
  const[editIcon,setEditIcon]=useState(icon);
  const colorIdxOf=(tc)=>{const i=GOAL_COLORS.findIndex(c=>c[1]===tc);return i>=0?i:0;};
  const[editColorIdx,setEditColorIdx]=useState(()=>colorIdxOf(checkColor));
  useEffect(()=>{setEditLabel(label);setEditSub(subtitle||"");setEditIcon(icon);setEditColorIdx(colorIdxOf(checkColor));},[label,subtitle,icon,checkColor]);
  return(
    <div style={{background:done?color:"#fff",borderRadius:18,padding:"13px 14px",border:`0.5px solid ${done?checkColor:N.border}`,transition:"all .3s"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
        <Ic n={icon} s={18} c={checkColor}/>
        <div style={{display:"flex",alignItems:"center",gap:4}}>
          {extraLink&&<a href={extraLink.href} style={{fontSize:9,padding:"2px 7px",borderRadius:99,background:checkColor+"22",color:checkColor,fontFamily:F.body,fontWeight:600,textDecoration:"none"}}>{extraLink.label}</a>}
          {done&&!editing&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:99,background:checkColor,color:"#fff",fontFamily:F.body,fontWeight:600}}>✓</span>}
          {onEdit&&<button onClick={()=>setEditing(e=>!e)} style={{background:"transparent",border:"none",cursor:"pointer",padding:2,opacity:.35}}><Ic n="edit" s={13} c={checkColor}/></button>}
          {onDelete&&<button onClick={onDelete} style={{background:"transparent",border:"none",cursor:"pointer",padding:2,opacity:.35}}><Ic n="trash" s={13} c={checkColor}/></button>}
        </div>
      </div>
      {editing&&onEdit?(
        <div>
          <Lbl style={{margin:"0 0 3px"}}>NOME</Lbl>
          <input value={editLabel} onChange={e=>setEditLabel(e.target.value)} style={{width:"100%",padding:"6px 8px",borderRadius:8,border:`1px solid ${N.border}`,fontFamily:F.body,fontSize:12,color:N.text,background:N.faint,outline:"none",boxSizing:"border-box",marginBottom:6}}/>
          <Lbl style={{margin:"0 0 3px"}}>SOTTOTITOLO</Lbl>
          <input value={editSub} onChange={e=>setEditSub(e.target.value)} style={{width:"100%",padding:"6px 8px",borderRadius:8,border:`1px solid ${N.border}`,fontFamily:F.body,fontSize:12,color:N.text,background:N.faint,outline:"none",boxSizing:"border-box",marginBottom:10}}/>
          <GoalStylePicker icon={editIcon} setIcon={setEditIcon} colorIdx={editColorIdx} setColorIdx={setEditColorIdx}/>
          <button onClick={()=>{onEdit({label:editLabel,sub:editSub,icon:editIcon,color:GOAL_COLORS[editColorIdx][0],tc:GOAL_COLORS[editColorIdx][1]});setEditing(false);}} style={{width:"100%",padding:"7px",borderRadius:10,border:"none",background:GOAL_COLORS[editColorIdx][1],color:"#fff",fontSize:11,cursor:"pointer",fontFamily:F.body,fontWeight:600,marginTop:10}}>Salva</button>
        </div>
      ):(
        <>
          <Lbl>{editLabel.toUpperCase()}</Lbl>
          {editSub&&<p style={{fontSize:12,color:N.muted,margin:"0 0 8px",fontFamily:F.body,lineHeight:1.4}}>{editSub}</p>}
          <div onClick={()=>setDone(s=>!s)} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",marginTop:editSub?0:8}}>
            <div style={{width:18,height:18,borderRadius:5,border:done?"none":`1.5px solid ${N.border}`,background:done?checkColor:"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s"}}>{done&&<Ic n="check" s={11} c="#fff"/>}</div>
            <span style={{fontSize:11,color:N.muted,fontFamily:F.body}}>Completato</span>
          </div>
        </>
      )}
    </div>
  );
}

function ExtraGoalCard({g,v,gd,gp,editGoalId,setEditGoalId,onUpdateGoal,onDeleteGoal,onDecrement,onIncrement}){
  const[lbl,setLbl]=useState(g.label);
  const[tgt,setTgt]=useState(String(g.target));
  const[unt,setUnt]=useState(g.unit||"");
  const[icn,setIcn]=useState(g.icon||"star");
  const colorIdxOf=(tc)=>{const i=GOAL_COLORS.findIndex(c=>c[1]===tc);return i>=0?i:0;};
  const[colorIdx,setColorIdx]=useState(()=>colorIdxOf(g.tc));
  const isEditing=editGoalId===g.id;
  useEffect(()=>{if(isEditing){setLbl(g.label);setTgt(String(g.target));setUnt(g.unit||"");setIcn(g.icon||"star");setColorIdx(colorIdxOf(g.tc));}},[isEditing]);
  return(
    <div style={{background:gd?g.color:"#fff",borderRadius:18,padding:"13px 14px",border:`0.5px solid ${gd?g.tc+"55":N.border}`,transition:"all .3s"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
        <Ic n={g.icon||"star"} s={18} c={g.tc}/>
        <div style={{display:"flex",gap:4,alignItems:"center"}}>
          {gd&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:99,background:g.tc,color:"#fff",fontFamily:F.body,fontWeight:600}}>✓</span>}
          <button onClick={()=>setEditGoalId(isEditing?null:g.id)} style={{background:"transparent",border:"none",cursor:"pointer",padding:2,opacity:.4}}><Ic n="edit" s={13} c={g.tc}/></button>
          <button onClick={()=>onDeleteGoal(g.id)} style={{background:"transparent",border:"none",cursor:"pointer",padding:2,opacity:.4}}><Ic n="trash" s={13} c={g.tc}/></button>
        </div>
      </div>
      {isEditing?(
        <div>
          {[["Nome",lbl,setLbl],["Target",tgt,setTgt],["Unità",unt,setUnt]].map(([label,val,setter])=>(
            <div key={label} style={{marginBottom:6}}>
              <Lbl style={{margin:"0 0 2px"}}>{label.toUpperCase()}</Lbl>
              <input value={val} onChange={e=>setter(e.target.value)} style={{width:"100%",padding:"6px 8px",borderRadius:8,border:`1px solid ${N.border}`,fontFamily:F.body,fontSize:12,color:N.text,background:"rgba(255,255,255,0.9)",outline:"none",boxSizing:"border-box"}}/>
            </div>
          ))}
          <div style={{marginBottom:6}}><GoalStylePicker icon={icn} setIcon={setIcn} colorIdx={colorIdx} setColorIdx={setColorIdx}/></div>
          <button onClick={()=>{onUpdateGoal(g.id,{label:lbl,target:+tgt||g.target,unit:unt,icon:icn,color:GOAL_COLORS[colorIdx][0],tc:GOAL_COLORS[colorIdx][1]});setEditGoalId(null);}} style={{width:"100%",padding:"8px",borderRadius:10,border:"none",background:GOAL_COLORS[colorIdx][1],color:"#fff",fontSize:11,cursor:"pointer",fontFamily:F.body,fontWeight:600,marginTop:4}}>Salva modifiche</button>
        </div>
      ):(
        <>
          <Lbl>{g.label.toUpperCase()}</Lbl>
          <p style={{fontFamily:F.heading,fontSize:24,fontWeight:600,color:N.text,margin:"0 0 6px",lineHeight:1}}>{v}<span style={{fontSize:13,color:N.muted}}>/{g.target} {g.unit}</span></p>
          <div style={{height:4,background:N.faint,borderRadius:99,marginBottom:8,overflow:"hidden"}}><div style={{height:"100%",width:`${gp}%`,background:g.tc,borderRadius:99,transition:"width .3s",opacity:.7}}/></div>
          <div style={{display:"flex",gap:6}}>
            <button onClick={onDecrement} style={{flex:1,padding:"5px 0",borderRadius:10,border:`0.5px solid ${N.border}`,background:"transparent",color:N.text,fontSize:15,cursor:"pointer"}}>−</button>
            <button onClick={onIncrement} style={{flex:1,padding:"5px 0",borderRadius:10,border:"none",background:g.color,color:g.tc,fontSize:15,cursor:"pointer",fontWeight:700}}>+</button>
          </div>
        </>
      )}
    </div>
  );
}

// ── COMPONENTI: journaling (voce singola + diario) ──
function JournalingCard({entry,onSave,dateKey}){
  const[editing,setEditing]=useState(false);
  const[text,setText]=useState(entry);
  useEffect(()=>{setText(entry);},[entry,dateKey]);
  return(
    <div style={{borderRadius:20,padding:"15px 16px",marginBottom:12,background:"radial-gradient(ellipse at 20% 20%, rgba(255,220,160,0.45) 0%, transparent 55%), radial-gradient(ellipse at 70% 35%, rgba(255,180,190,0.45) 0%, transparent 50%), radial-gradient(ellipse at 30% 70%, rgba(200,185,255,0.40) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(160,230,255,0.40) 0%, transparent 50%), #FFFFFF",border:"0.5px solid rgba(200,180,255,0.3)",boxShadow:"0 2px 20px rgba(200,180,255,0.12)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}><Ic n="note" s={16} c="#6B3FA0"/><Title size={16} style={{color:"#4A2880"}}>Journaling</Title></div>
        {!editing&&<button onClick={()=>setEditing(true)} style={{fontSize:10,padding:"4px 10px",borderRadius:20,border:"1px solid #C4A8FF",background:"rgba(255,255,255,0.9)",color:"#6B3FA0",cursor:"pointer",fontFamily:F.body,fontWeight:600}}>{entry?"Modifica ✎":"Scrivi…"}</button>}
      </div>
      {editing?(
        <div>
          <textarea autoFocus value={text} onChange={e=>setText(e.target.value)} placeholder="Come ti senti oggi? Cosa hai imparato? Cosa ti ha colpita?…" rows={5} style={{width:"100%",padding:"10px 12px",borderRadius:13,border:"1px solid rgba(180,160,255,0.3)",fontFamily:F.body,fontSize:13,color:N.text,background:"rgba(255,255,255,0.55)",backdropFilter:"blur(8px)",resize:"none",outline:"none",lineHeight:1.7,boxSizing:"border-box"}}/>
          <div style={{display:"flex",gap:8,marginTop:8}}>
            <button onClick={()=>{setText(entry);setEditing(false);}} style={{flex:1,padding:"10px",borderRadius:12,border:`0.5px solid ${N.border}`,background:"transparent",color:N.muted,fontSize:12,cursor:"pointer",fontFamily:F.body}}>Annulla</button>
            <button onClick={()=>{onSave(text);setEditing(false);}} style={{flex:2,padding:"10px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#C4A8FF,#9B6FCC)",color:"#fff",fontSize:12,cursor:"pointer",fontFamily:F.body,fontWeight:600}}>Salva</button>
          </div>
        </div>
      ):entry?(
        <p style={{fontSize:13,color:N.text,margin:0,fontFamily:F.body,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{entry}</p>
      ):(
        <p style={{fontSize:12,color:"#C4A8FF",margin:0,fontFamily:F.body,fontStyle:"italic"}}>Nessuna riflessione per oggi — tocca "Scrivi…" per iniziare.</p>
      )}
    </div>
  );
}

function JournalingDiary({journalEntries,onSave}){
  const[editingDate,setEditingDate]=useState(null);
  const[editText,setEditText]=useState("");
  const sorted=Object.entries(journalEntries).filter(([,v])=>v).sort((a,b)=>b[0].localeCompare(a[0]));
  return(
    <div>
      {sorted.length===0&&<div style={{textAlign:"center",padding:"48px 20px"}}><Ic n="note" s={40} c={N.faint} style={{display:"block",margin:"0 auto 14px"}}/><Title size={18} style={{color:N.muted,marginBottom:8}}>Diario vuoto</Title><p style={{fontSize:13,fontFamily:F.body,color:N.muted,lineHeight:1.6}}>Le riflessioni che scrivi nella scheda Journaling di ogni giornata appariranno qui.</p></div>}
      {sorted.map(([dateKey,text])=>{
        const isEditing=editingDate===dateKey;
        const d=new Date(dateKey+"T12:00:00");
        return(
          <div key={dateKey} style={{background:"#fff",borderRadius:20,marginBottom:12,border:`0.5px solid ${N.border}`,padding:"15px 16px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
              <div>
                <p style={{fontSize:11,color:N.muted,fontFamily:F.body,margin:0,fontWeight:600,letterSpacing:.5}}>{d.toLocaleDateString("it-IT",{weekday:"long"}).toUpperCase()}</p>
                <Title size={16}>{d.toLocaleDateString("it-IT",{day:"numeric",month:"long",year:"numeric"})}</Title>
              </div>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>{setEditingDate(dateKey);setEditText(text);}} style={{background:"transparent",border:"none",cursor:"pointer",padding:4,opacity:.4}}><Ic n="edit" s={14} c={N.text}/></button>
                <button onClick={()=>onSave(dateKey,"")} style={{background:"transparent",border:"none",cursor:"pointer",padding:4,opacity:.3}}><Ic n="trash" s={14} c={N.text}/></button>
              </div>
            </div>
            {isEditing?(
              <div>
                <textarea autoFocus value={editText} onChange={e=>setEditText(e.target.value)} rows={5} style={{width:"100%",padding:"10px 12px",borderRadius:13,border:`1px solid ${N.border}`,fontFamily:F.body,fontSize:13,color:N.text,background:N.faint,resize:"none",outline:"none",lineHeight:1.7,boxSizing:"border-box"}}/>
                <div style={{display:"flex",gap:8,marginTop:8}}>
                  <button onClick={()=>setEditingDate(null)} style={{flex:1,padding:"9px",borderRadius:12,border:`0.5px solid ${N.border}`,background:"transparent",color:N.muted,fontSize:12,cursor:"pointer",fontFamily:F.body}}>Annulla</button>
                  <button onClick={()=>{onSave(dateKey,editText);setEditingDate(null);}} style={{flex:2,padding:"9px",borderRadius:12,border:"none",background:"#6B3FA0",color:"#fff",fontSize:12,cursor:"pointer",fontFamily:F.body,fontWeight:600}}>Salva</button>
                </div>
              </div>
            ):<p style={{fontSize:13,color:N.text,margin:0,fontFamily:F.body,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{text}</p>}
          </div>
        );
      })}
    </div>
  );
}

// ── COMPONENTI: sezione alimentazione del giorno ──
function AlimentazioneSection({plan,viewDateKey,dow,alimNote,setAlimNote,alimEdit,setAlimEdit,alimOverrides,setAlimOverrides,th,onGoProteine}){
  const[editingField,setEditingField]=useState(null);
  const[editText,setEditText]=useState("");
  const[scopeModal,setScopeModal]=useState(null); // {field, text}
  const getVal=(field)=>{
    // Priority: today override > weekday override > plan default
    if(alimOverrides[viewDateKey]?.[field]!==undefined) return alimOverrides[viewDateKey][field];
    const wdKey="wd_"+dow+"_"+field;
    if(alimOverrides[wdKey]!==undefined) return alimOverrides[wdKey];
    if(field==="colazione") return COLAZIONE[plan.colazione]||COLAZIONE.std;
    return plan[field]||"";
  };
  const startEdit=(field)=>{setEditingField(field);setEditText(getVal(field));};
  const saveField=(field,text,scope)=>{
    if(scope==="today"){
      setAlimOverrides({...alimOverrides,[viewDateKey]:{...(alimOverrides[viewDateKey]||{}),[field]:text}});
    } else {
      const wdKey="wd_"+dow+"_"+field;
      setAlimOverrides({...alimOverrides,[wdKey]:text});
    }
    setEditingField(null);setScopeModal(null);
  };
  const fields=[
    {key:"colazione",label:"COLAZIONE"},
    ...(plan.spuntino||alimOverrides["wd_"+dow+"_spuntino"]?[{key:"spuntino",label:"SPUNTINO"}]:[]),
    ...(plan.aperitivo?[{key:"aperitivo",label:"APERITIVO"}]:[]),
    {key:"pranzo",label:"PRANZO"},
    {key:"cena",label:"CENA"},
  ];
  return(
    <div style={{borderRadius:20,padding:"15px 16px",marginBottom:12,background:plan.alimGrad,border:`0.5px solid ${N.border}`}}>
      {scopeModal&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setScopeModal(null)}>
        <div style={{background:"#fff",borderRadius:"20px 20px 0 0",padding:"20px 20px 36px",width:"100%",maxWidth:430}} onClick={e=>e.stopPropagation()}>
          <Title size={16} style={{marginBottom:6}}>Salva modifica per</Title>
          <p style={{fontSize:12,color:N.muted,fontFamily:F.body,margin:"0 0 16px"}}>Vuoi cambiare solo oggi o ogni {["domenica","lunedì","martedì","mercoledì","giovedì","venerdì","sabato"][scopeModal.dow]}?</p>
          <button onClick={()=>saveField(scopeModal.field,scopeModal.text,"today")} style={{width:"100%",padding:"13px",borderRadius:14,border:`0.5px solid ${N.border}`,background:"#fff",color:N.text,fontSize:13,cursor:"pointer",fontFamily:F.body,fontWeight:600,marginBottom:8}}>Solo oggi</button>
          <button onClick={()=>saveField(scopeModal.field,scopeModal.text,"weekday")} style={{width:"100%",padding:"13px",borderRadius:14,border:"none",background:N.text,color:"#fff",fontSize:13,cursor:"pointer",fontFamily:F.body,fontWeight:600}}>Ogni {["domenica","lunedì","martedì","mercoledì","giovedì","venerdì","sabato"][scopeModal.dow]}</button>
        </div>
      </div>}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <div style={{display:"flex",alignItems:"center",gap:7}}><Ic n="fork" s={15} c={plan.alimText}/><Title size={18} style={{color:plan.alimText}}>Alimentazione</Title></div>
        <div style={{display:"flex",gap:6}}>
          <a href="myfitnesspal://" style={{display:"flex",alignItems:"center",gap:4,fontSize:10,padding:"4px 10px",borderRadius:20,border:`1px solid ${plan.alimText}44`,background:"rgba(255,255,255,0.55)",color:plan.alimText,textDecoration:"none",fontFamily:F.body,fontWeight:600}}>MFP ›</a>
          <button onClick={onGoProteine} style={{display:"flex",alignItems:"center",gap:4,fontSize:10,padding:"4px 10px",borderRadius:20,border:`1px solid ${plan.alimText}44`,background:"rgba(255,255,255,0.55)",color:plan.alimText,cursor:"pointer",fontFamily:F.body,fontWeight:600}}><Ic n="protein" s={11} c={plan.alimText}/>Proteine ›</button>
        </div>
      </div>
      {fields.map(({key,label})=>{
        const val=getVal(key);
        const isEditing=editingField===key;
        const hasOverride=alimOverrides[viewDateKey]?.[key]!==undefined||alimOverrides["wd_"+dow+"_"+key]!==undefined;
        return(<div key={key} style={{background:"rgba(255,255,255,.6)",borderRadius:13,padding:"9px 12px",marginBottom:6}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:isEditing?6:2}}>
            <div style={{display:"flex",alignItems:"center",gap:5}}>
              <Lbl style={{margin:0}}>{label}</Lbl>
              {hasOverride&&<span style={{fontSize:8,padding:"1px 5px",borderRadius:99,background:plan.alimText+"22",color:plan.alimText,fontFamily:F.body,fontWeight:600}}>mod.</span>}
            </div>
            {!isEditing&&<button onClick={()=>startEdit(key)} style={{background:"transparent",border:"none",cursor:"pointer",padding:2,opacity:.4}}><Ic n="edit" s={13} c={plan.alimText}/></button>}
          </div>
          {isEditing?(
            <div>
              <textarea value={editText} onChange={e=>setEditText(e.target.value)} rows={3} style={{width:"100%",padding:"7px 8px",borderRadius:9,border:`1px solid ${N.border}`,fontFamily:F.body,fontSize:11,color:N.text,background:"rgba(255,255,255,0.9)",outline:"none",resize:"none",lineHeight:1.5,boxSizing:"border-box"}}/>
              <div style={{display:"flex",gap:6,marginTop:6}}>
                <button onClick={()=>setEditingField(null)} style={{flex:1,padding:"7px",borderRadius:10,border:`0.5px solid ${N.border}`,background:"transparent",color:N.muted,fontSize:11,cursor:"pointer",fontFamily:F.body}}>Annulla</button>
                <button onClick={()=>setScopeModal({field:key,text:editText,dow})} style={{flex:2,padding:"7px",borderRadius:10,border:"none",background:plan.alimText,color:"#fff",fontSize:11,cursor:"pointer",fontFamily:F.body,fontWeight:600}}>Salva…</button>
              </div>
            </div>
          ):<p style={{fontSize:11,color:N.text,margin:0,lineHeight:1.45,fontFamily:F.body}}>{val}</p>}
        </div>);
      })}
      <div style={{background:"rgba(255,255,255,.5)",borderRadius:13,padding:"10px 12px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}><Lbl style={{margin:0}}>NOTA DEL GIORNO</Lbl><button onClick={()=>setAlimEdit(e=>!e)} style={{background:"transparent",border:"none",cursor:"pointer",padding:0}}><Ic n={alimEdit?"check":"edit"} s={14} c={N.muted}/></button></div>
        {alimEdit?<textarea value={alimNote} onChange={e=>setAlimNote(e.target.value)} placeholder="Cosa hai mangiato oggi?" rows={3} style={{width:"100%",border:"none",background:"transparent",fontFamily:F.body,fontSize:12,color:N.text,resize:"none",outline:"none",lineHeight:1.6,boxSizing:"border-box"}}/>
          :<p style={{fontSize:12,color:alimNote?N.text:N.muted,margin:0,lineHeight:1.6,fontFamily:F.body,minHeight:36}}>{alimNote||"Tocca ✎ per aggiungere una nota..."}</p>}
      </div>
    </div>
  );
}

// ── COMPONENTI: misure corporee e BMI ──
function BodySection({bodyMeasurements,setBodyMeasurements}){
  const[editHeight,setEditHeight]=useState(false);
  const[heightInput,setHeightInput]=useState(String(bodyMeasurements.height));
  const[showAdd,setShowAdd]=useState(false);
  const[newEntry,setNewEntry]=useState({weight:"",chest:"",waist:"",hips:"",thigh:"",calf:"",wrist:""});
  const measureFields=[
    {key:"weight",label:"Peso",unit:"kg",icon:"body"},
    {key:"chest",label:"Petto",unit:"cm",icon:"ruler"},
    {key:"waist",label:"Vita",unit:"cm",icon:"ruler"},
    {key:"hips",label:"Fianchi",unit:"cm",icon:"ruler"},
    {key:"thigh",label:"Coscia",unit:"cm",icon:"ruler"},
    {key:"calf",label:"Polpaccio",unit:"cm",icon:"ruler"},
    {key:"wrist",label:"Polso",unit:"cm",icon:"ruler"},
  ];
  const latestEntry=bodyMeasurements.entries[bodyMeasurements.entries.length-1]||null;
  const prevEntry=bodyMeasurements.entries.length>1?bodyMeasurements.entries[bodyMeasurements.entries.length-2]:null;
  const calcBMI=(w,h)=>h>0?+(w/(h*h)).toFixed(1):null;
  const bmi=latestEntry?.weight&&bodyMeasurements.height?calcBMI(+latestEntry.weight,bodyMeasurements.height):null;
  const bmiColor=bmi<18.5?"#4E8C40":bmi<25?"#2A5A18":bmi<30?"#C4980A":"#E8733A";
  const bmiLabel=bmi?bmi<18.5?"Sottopeso":bmi<25?"Normopeso":bmi<30?"Sovrappeso":"Obesità":"—";
  const diff=(key)=>{if(!latestEntry||!prevEntry||!latestEntry[key]||!prevEntry[key])return null;const d=+(latestEntry[key]-prevEntry[key]).toFixed(1);return d;};
  return(
    <div>
      {/* Header altezza & BMI */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
        <div style={{background:"#fff",borderRadius:18,padding:"14px 15px",border:`0.5px solid ${N.border}`}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
            <Lbl style={{margin:0}}>ALTEZZA</Lbl>
            <button onClick={()=>{setEditHeight(true);setHeightInput(String(bodyMeasurements.height));}} style={{background:"transparent",border:"none",cursor:"pointer",padding:0,opacity:.4}}><Ic n="edit" s={13} c={N.text}/></button>
          </div>
          {editHeight?(
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <input autoFocus value={heightInput} onChange={e=>setHeightInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){setBodyMeasurements({...bodyMeasurements,height:+heightInput});setEditHeight(false);}}} style={{flex:1,padding:"4px 8px",borderRadius:8,border:`1px solid ${N.border}`,fontFamily:F.body,fontSize:13,color:N.text,outline:"none",width:60}} placeholder="1.70"/>
              <button onClick={()=>{setBodyMeasurements({...bodyMeasurements,height:+heightInput});setEditHeight(false);}} style={{width:28,height:28,borderRadius:8,border:"none",background:N.text,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Ic n="check" s={12} c="#fff"/></button>
            </div>
          ):<p style={{fontFamily:F.heading,fontSize:28,fontWeight:600,color:N.text,margin:0,lineHeight:1}}>{bodyMeasurements.height}<span style={{fontSize:13,color:N.muted}}> m</span></p>}
        </div>
        <div style={{background:bmi?"#D9F0CE":"#fff",borderRadius:18,padding:"14px 15px",border:`0.5px solid ${bmi?"#4E8C40":N.border}`}}>
          <Lbl style={{margin:"0 0 4px"}}>BMI</Lbl>
          <p style={{fontFamily:F.heading,fontSize:28,fontWeight:600,color:bmi?bmiColor:N.muted,margin:"0 0 2px",lineHeight:1}}>{bmi||"—"}</p>
          <p style={{fontSize:10,color:bmi?bmiColor:N.muted,margin:0,fontFamily:F.body,fontWeight:600}}>{bmiLabel}</p>
        </div>
      </div>
      {/* Latest measurements */}
      {latestEntry&&<div style={{background:"#fff",borderRadius:18,padding:"14px 15px",marginBottom:12,border:`0.5px solid ${N.border}`}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <Title size={15}>Ultima rilevazione</Title>
          <span style={{fontSize:10,color:N.muted,fontFamily:F.body}}>{new Date(latestEntry.date).toLocaleDateString("it-IT",{day:"numeric",month:"short"})}</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
          {measureFields.map(({key,label,unit})=>latestEntry[key]?(<div key={key} style={{padding:"8px 10px",borderRadius:12,background:N.faint}}>
            <Lbl style={{margin:"0 0 2px",fontSize:8}}>{label.toUpperCase()}</Lbl>
            <div style={{display:"flex",alignItems:"baseline",gap:4}}>
              <span style={{fontFamily:F.heading,fontSize:18,fontWeight:600,color:N.text}}>{latestEntry[key]}</span>
              <span style={{fontSize:10,color:N.muted,fontFamily:F.body}}>{unit}</span>
              {diff(key)!==null&&<span style={{fontSize:9,color:diff(key)<0?"#4E8C40":diff(key)>0?"#E8733A":N.muted,fontFamily:F.body,fontWeight:600}}>{diff(key)>0?"+":""}{diff(key)}</span>}
            </div>
          </div>):null)}
        </div>
      </div>}
      {/* Add new measurement */}
      <button onClick={()=>setShowAdd(s=>!s)} style={{width:"100%",padding:"12px",borderRadius:14,border:`1px dashed ${N.border}`,background:"transparent",color:N.muted,fontSize:12,cursor:"pointer",fontFamily:F.body,marginBottom:showAdd?12:0,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
        <Ic n="plus" s={14} c={N.muted}/>{showAdd?"Chiudi":"Aggiungi rilevazione"}
      </button>
      {showAdd&&<div style={{background:"#fff",borderRadius:18,padding:"14px 15px",border:`0.5px solid ${N.border}`,marginBottom:12}}>
        <Title size={15} style={{marginBottom:12}}>Nuova rilevazione</Title>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {measureFields.map(({key,label,unit})=>(<div key={key}>
            <Lbl style={{margin:"0 0 3px"}}>{label} ({unit})</Lbl>
            <input value={newEntry[key]} onChange={e=>setNewEntry(p=>({...p,[key]:e.target.value}))} placeholder="—" type="number" style={{width:"100%",padding:"8px 10px",borderRadius:10,border:`1px solid ${N.border}`,fontFamily:F.body,fontSize:12,color:N.text,background:N.faint,outline:"none",boxSizing:"border-box"}}/>
          </div>))}
        </div>
        <button onClick={()=>{
          const entry={date:new Date().toISOString().slice(0,10),...Object.fromEntries(Object.entries(newEntry).filter(([,v])=>v))};
          setBodyMeasurements(prev=>({...prev,entries:[...prev.entries,entry]}));
          setNewEntry({weight:"",chest:"",waist:"",hips:"",thigh:"",calf:"",wrist:""});
          setShowAdd(false);
        }} style={{width:"100%",padding:"12px",borderRadius:14,border:"none",background:N.text,color:"#fff",fontSize:13,cursor:"pointer",fontFamily:F.body,fontWeight:600,marginTop:12}}>Salva rilevazione</button>
      </div>}
      {/* History */}
      {bodyMeasurements.entries.length>1&&<div style={{marginTop:4}}>
        <Title size={15} style={{marginBottom:8}}>Storico</Title>
        {[...bodyMeasurements.entries].reverse().slice(0,10).map((entry,i)=>(
          <div key={i} style={{background:"#fff",borderRadius:14,padding:"10px 12px",marginBottom:6,border:`0.5px solid ${N.border}`}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
              <span style={{fontSize:11,fontFamily:F.body,fontWeight:600,color:N.text}}>{new Date(entry.date).toLocaleDateString("it-IT",{weekday:"short",day:"numeric",month:"short",year:"numeric"})}</span>
              <button onClick={()=>setBodyMeasurements(prev=>({...prev,entries:prev.entries.filter((_,j)=>prev.entries.length-1-j!==i)}))} style={{background:"transparent",border:"none",cursor:"pointer",padding:0,opacity:.3}}><Ic n="trash" s={13} c={N.text}/></button>
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {measureFields.map(({key,label,unit})=>entry[key]?(<span key={key} style={{fontSize:10,fontFamily:F.body,color:N.muted}}><span style={{fontWeight:600,color:N.text}}>{entry[key]}{unit}</span> {label}</span>):null)}
            </div>
          </div>
        ))}
      </div>}
    </div>
  );
}

const PASTEL_PALETTE=[
  {bg:"#D9F0CE",tc:"#2A5A18"},// verde
  {bg:"#FFD5B8",tc:"#A04010"},// arancio
  {bg:"#F0E4B8",tc:"#7A5C10"},// giallo
  {bg:"#EDE0FF",tc:"#6B3FA0"},// viola
  {bg:"#FFD9E8",tc:"#A03050"},// rosa
  {bg:"#BAE1FF",tc:"#1A4A80"},// azzurro
  {bg:"#FFDCE0",tc:"#8A2030"},// rosso pastello
  {bg:"#D4F5F0",tc:"#1A6050"},// turchese
];
let _paletteIdx=0;
const nextPastel=()=>{const c=PASTEL_PALETTE[_paletteIdx%PASTEL_PALETTE.length];_paletteIdx++;return c;};

// ── COMPONENTI: to-do list giornaliera ──
function DailyTodoList({todos,todoInput,setTodoInput,onAdd,onToggle,onDelete,onEdit,onToggleSubstep,rituals}){
  const[editingId,setEditingId]=useState(null);
  const[editingText,setEditingText]=useState("");
  const[showRitualPicker,setShowRitualPicker]=useState(false);
  return(
    <div style={{borderRadius:18,padding:"14px 15px",background:"#FFFFFF",border:`0.5px solid ${N.border}`,marginBottom:12,boxShadow:"0 2px 8px rgba(0,0,0,0.04)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <Ic n="check" s={16} c="#3A5FA0"/>
          <Title size={16} style={{color:"#2A4090"}}>Daily to-do list</Title>
        </div>
        <a href="calshow://" style={{display:"flex",alignItems:"center",gap:4,fontSize:10,padding:"4px 10px",borderRadius:20,border:"1px solid #3A5FA044",background:"#F0F4FF",color:"#2A4090",textDecoration:"none",fontFamily:F.body,fontWeight:600}}>
          <Ic n="cal" s={11} c="#2A4090"/>Calendario ›
        </a>
      </div>
      {todos.length===0&&<p style={{fontSize:12,color:N.muted,fontFamily:F.body,margin:"0 0 10px",fontStyle:"italic"}}>Nessun task per oggi — aggiungine uno!</p>}
      {todos.map((todo)=>{
        const bg=todo.color?.bg||"#F7F5F0";
        const tc=todo.color?.tc||N.text;
        return(
        <div key={todo.id} style={{borderRadius:12,marginBottom:6,background:bg,border:`0.5px solid ${tc}22`,overflow:"hidden"}}>
          <div style={{display:"flex",alignItems:"flex-start",gap:8,padding:"8px 10px"}}>
            <div onClick={()=>onToggle(todo.id)} style={{width:20,height:20,borderRadius:6,border:todo.done?"none":`1.5px solid ${tc}55`,background:todo.done?tc:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2,cursor:"pointer",transition:"all .2s"}}>
              {todo.done&&<Ic n="check" s={12} c="#fff"/>}
            </div>
            {editingId===todo.id?(
              <div style={{flex:1,display:"flex",gap:6,alignItems:"center"}}>
                <input autoFocus value={editingText} onChange={e=>setEditingText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&editingText.trim()){onEdit(todo.id,editingText.trim());setEditingId(null);}if(e.key==="Escape")setEditingId(null);}} style={{flex:1,padding:"4px 8px",borderRadius:8,border:`1px solid ${N.border}`,fontFamily:F.body,fontSize:13,color:N.text,background:"rgba(255,255,255,0.9)",outline:"none"}}/>
                <button onClick={()=>{if(editingText.trim()){onEdit(todo.id,editingText.trim());setEditingId(null);}}} style={{width:26,height:26,borderRadius:7,border:"none",background:tc,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}><Ic n="check" s={12} c="#fff"/></button>
                <button onClick={()=>setEditingId(null)} style={{width:26,height:26,borderRadius:7,border:`0.5px solid ${N.border}`,background:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}><Ic n="close" s={12} c={N.muted}/></button>
              </div>
            ):(
              <p onClick={()=>onToggle(todo.id)} style={{fontSize:13,color:todo.done?N.muted:tc,textDecoration:todo.done?"line-through":"none",margin:0,lineHeight:1.55,fontFamily:F.body,flex:1,cursor:"pointer",fontWeight:todo.substeps?600:500}}>{todo.text}</p>
            )}
            {editingId!==todo.id&&<div style={{display:"flex",gap:2,flexShrink:0}}>
              <div onClick={()=>{setEditingId(todo.id);setEditingText(todo.text);}} style={{padding:"2px 4px",cursor:"pointer",opacity:.4}}><Ic n="edit" s={13} c={tc}/></div>
              <div onClick={()=>onDelete(todo.id)} style={{padding:"2px 4px",cursor:"pointer",opacity:.4}}><Ic n="trash" s={13} c={tc}/></div>
            </div>}
          </div>
          {todo.substeps&&<div style={{borderTop:`0.5px solid ${tc}22`,padding:"4px 10px 6px 38px"}}>
            {todo.substeps.map((ss,si)=>(
              <div key={si} onClick={()=>onToggleSubstep(todo.id,si)} style={{display:"flex",alignItems:"flex-start",gap:7,padding:"3px 0",cursor:"pointer"}}>
                <div style={{width:14,height:14,borderRadius:3,border:ss.done?"none":`1.5px solid ${tc}55`,background:ss.done?tc:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2,transition:"all .2s"}}>
                  {ss.done&&<Ic n="check" s={8} c="#fff"/>}
                </div>
                <p style={{fontSize:11,color:ss.done?N.muted:tc,textDecoration:ss.done?"line-through":"none",margin:0,lineHeight:1.5,fontFamily:F.body,opacity:ss.done?.6:1}}>{si+1}. {ss.text}</p>
              </div>
            ))}
          </div>}
        </div>);
      })}
      <div style={{display:"flex",gap:8,marginTop:10}}>
        <input value={todoInput} onChange={e=>setTodoInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")onAdd();}} placeholder="Aggiungi task…" style={{flex:1,padding:"9px 12px",borderRadius:11,border:`1px solid ${N.border}`,fontFamily:F.body,fontSize:12,color:N.text,background:N.faint,outline:"none"}}/>
        <button onClick={onAdd} style={{width:36,height:36,borderRadius:11,border:"none",background:"#3A5FA0",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}><Ic n="plus" s={16} c="#fff"/></button>
      </div>
      {rituals&&rituals.length>0&&<>
        <button onClick={()=>setShowRitualPicker(s=>!s)} style={{marginTop:8,width:"100%",padding:"8px",borderRadius:11,border:"1px dashed #6B3FA044",background:"rgba(107,63,160,0.04)",color:"#6B3FA0",fontSize:11,cursor:"pointer",fontFamily:F.body,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
          <Ic n="ritual" s={13} c="#6B3FA0"/>{showRitualPicker?"Chiudi":"Aggiungi un rituale"}
        </button>
        {showRitualPicker&&<div style={{marginTop:8,display:"flex",flexDirection:"column",gap:6}}>
          {rituals.map(r=>(
            <button key={r.id} onClick={()=>{onAdd(null,r);setShowRitualPicker(false);}} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:13,border:`1px solid ${r.tc}22`,background:r.grad,cursor:"pointer",textAlign:"left"}}>
              <div style={{width:32,height:32,borderRadius:10,background:"rgba(255,255,255,0.6)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ic n={r.icon||"star"} s={16} c={r.tc}/></div>
              <div style={{flex:1}}>
                <p style={{fontSize:12,fontWeight:600,color:r.tc,margin:0,fontFamily:F.body}}>{r.title}</p>
                <p style={{fontSize:10,color:r.tc,opacity:.7,margin:0,fontFamily:F.body}}>{r.steps.length} passi · {r.summary}</p>
              </div>
              <Ic n="plus" s={14} c={r.tc}/>
            </button>
          ))}
        </div>}
      </>}
    </div>
  );
}
// ── COMPONENTI: frase motivazionale del giorno ──
function DailyPhrase({todayKey}){
  const key="bm_d_phrase_"+todayKey;
  const[phrase,setPhrase]=useState("");
  const[editing,setEditing]=useState(false);
  const[loaded,setLoaded]=useState(false);
  useEffect(()=>{storeGet(key).then(v=>{setPhrase(v||"");setLoaded(true);});},[key]);
  if(!loaded)return null;
  if(!editing&&!phrase)return(
    <button onClick={()=>setEditing(true)} style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:N.muted,background:"transparent",border:`0.5px dashed ${N.border}`,borderRadius:20,padding:"5px 14px",cursor:"pointer",fontFamily:F.body,marginBottom:14}}>
      <Ic n="sparkle" s={13} c={N.muted}/>Aggiungi la frase del giorno…
    </button>
  );
  if(editing)return(
    <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:14}}>
      <Ic n="sparkle" s={15} c={N.muted} style={{flexShrink:0}}/>
      <input autoFocus value={phrase} onChange={e=>setPhrase(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){storeSet(key,phrase);setEditing(false);}if(e.key==="Escape")setEditing(false);}} placeholder="La tua frase del giorno…" style={{flex:1,padding:"7px 12px",borderRadius:20,border:`1px solid ${N.border}`,fontFamily:F.body,fontSize:13,fontStyle:"italic",color:N.text,background:"rgba(255,255,255,0.7)",outline:"none"}}/>
      <button onClick={()=>{storeSet(key,phrase);setEditing(false);}} style={{width:30,height:30,borderRadius:10,border:"none",background:N.text,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}><Ic n="check" s={13} c="#fff"/></button>
      <button onClick={()=>{setPhrase("");storeSet(key,"");setEditing(false);}} style={{width:30,height:30,borderRadius:10,border:`0.5px solid ${N.border}`,background:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}><Ic n="close" s={13} c={N.muted}/></button>
    </div>
  );
  return(
    <div onClick={()=>setEditing(true)} style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:14,cursor:"pointer",padding:"8px 12px",borderRadius:16,background:"rgba(255,255,255,0.55)",border:`0.5px solid ${N.border}`}}>
      <Ic n="sparkle" s={14} c={N.muted} style={{flexShrink:0,marginTop:2}}/>
      <p style={{fontSize:13,fontStyle:"italic",color:N.text,margin:0,fontFamily:F.body,lineHeight:1.55,flex:1}}>{phrase}</p>
      <Ic n="edit" s={13} c={N.muted} style={{flexShrink:0,marginTop:2,opacity:.4}}/>
    </div>
  );
}

// ── COMPONENTI: sezione routine (mattina/sera/ufficio) con reorder ──
function RSection({list,type,gradStyle,checked,onToggle,onAdd,onDel,onEdit,onReorder,th,plan,onFYOpen}){
  const[editingKey,setEditingKey]=useState(null);
  const[editText,setEditText]=useState("");
  return(
    <div style={{borderRadius:18,padding:"14px 15px",background:gradStyle,border:`0.5px solid ${N.border}`,marginBottom:12}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
        <Ic n={type==="mattina"?"sun":"moon"} s={16} c={type==="mattina"?"#B8860B":"#3A5FA0"}/>
        <Title size={16} style={{color:type==="mattina"?"#8A5C00":"#2A4090"}}>{type==="mattina"?"Morning routine":"Night routine"}</Title>
      </div>
      <SortableList
        items={list}
        onReorder={onReorder}
        renderItem={(item,i,_isDragging,moveUp,moveDown)=>{
          const isFY=item.text.toLowerCase().includes("face yoga")&&plan.faceYoga;
          const isEditing=editingKey===item.key;
          return(
            <div>
              <div style={{display:"flex",alignItems:"flex-start",gap:8,padding:"7px 0",borderBottom:i<list.length-1?`0.5px solid rgba(0,0,0,0.05)`:"none"}}>
                <div style={{display:"flex",flexDirection:"column",gap:1,flexShrink:0,paddingTop:2}}>
                  <button onClick={moveUp} disabled={!moveUp} style={{width:18,height:18,border:"none",background:"transparent",cursor:moveUp?"pointer":"default",opacity:moveUp?.4:.15,padding:0,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:4}}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={N.text} strokeWidth="2.5" strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg>
                  </button>
                  <button onClick={moveDown} disabled={!moveDown} style={{width:18,height:18,border:"none",background:"transparent",cursor:moveDown?"pointer":"default",opacity:moveDown?.4:.15,padding:0,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:4}}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={N.text} strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                </div>
                <div onClick={()=>onToggle(item.key)} style={{width:20,height:20,borderRadius:6,border:checked[item.key]?"none":`1.5px solid ${N.border}`,background:checked[item.key]?N.text:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2,cursor:"pointer",transition:"all .2s"}}>
                  {checked[item.key]&&<Ic n="check" s={12} c="#fff"/>}
                </div>
                {isEditing?(
                  <div style={{flex:1,display:"flex",gap:6,alignItems:"center"}}>
                    <input autoFocus value={editText} onChange={e=>setEditText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&editText.trim()){onEdit(item,editText.trim(),type);setEditingKey(null);}if(e.key==="Escape")setEditingKey(null);}} style={{flex:1,padding:"4px 8px",borderRadius:8,border:`1px solid ${N.border}`,fontFamily:F.body,fontSize:13,color:N.text,background:"rgba(255,255,255,0.9)",outline:"none"}}/>
                    <button onClick={()=>{if(editText.trim()){onEdit(item,editText.trim(),type);setEditingKey(null);}}} style={{width:26,height:26,borderRadius:7,border:"none",background:N.text,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}><Ic n="check" s={12} c="#fff"/></button>
                    <button onClick={()=>setEditingKey(null)} style={{width:26,height:26,borderRadius:7,border:`0.5px solid ${N.border}`,background:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}><Ic n="close" s={12} c={N.muted}/></button>
                  </div>
                ):(
                  <p onClick={()=>onToggle(item.key)} style={{fontSize:13,color:checked[item.key]?N.muted:N.text,textDecoration:checked[item.key]?"line-through":"none",margin:0,lineHeight:1.55,fontFamily:F.body,flex:1,cursor:"pointer"}}>{item.text}</p>
                )}
                {!isEditing&&<div style={{display:"flex",gap:2,flexShrink:0}}>
                  <div onClick={()=>{setEditingKey(item.key);setEditText(item.text);}} style={{padding:"2px 4px",cursor:"pointer",opacity:.3}}><Ic n="edit" s={13} c={N.text}/></div>
                  <div onClick={()=>onDel(item,type)} style={{padding:"2px 4px",cursor:"pointer",opacity:.3}}><Ic n="trash" s={13} c={N.text}/></div>
                </div>}
              </div>
              {isFY&&<div style={{paddingBottom:6,paddingLeft:46}}><button onClick={onFYOpen} style={{fontSize:11,padding:"4px 12px",borderRadius:20,border:`1px solid ${th.dark}`,background:"transparent",color:th.dark,cursor:"pointer",fontFamily:F.body,fontWeight:600}}>Vedi i passi ›</button></div>}
            </div>
          );
        }}
      />
      <button onClick={()=>onAdd({type})} style={{marginTop:10,fontSize:11,padding:"5px 12px",borderRadius:20,border:`1px dashed ${N.border}`,background:"rgba(255,255,255,0.6)",color:N.muted,cursor:"pointer",fontFamily:F.body,fontWeight:500,display:"flex",alignItems:"center",gap:4}}>
        <Ic n="plus" s={12} c={N.muted}/>Aggiungi voce
      </button>
    </div>
  );
}

// ── Main App ──
// ══════════════════════════════════════════════════════
// APP PRINCIPALE: stato globale + tab (Oggi/Calendario/Rituali/Altro)
// ══════════════════════════════════════════════════════
export default function App(){
  const [now,setNow]=useState(()=>new Date());
  useEffect(()=>{
    const tick=()=>{
      const n=new Date();
      setNow(prev=>{
        const pk=prev.toISOString().slice(0,10);
        const nk=n.toISOString().slice(0,10);
        if(pk!==nk)return n; // only re-render on day change
        return prev;
      });
    };
    // Check every minute
    const id=setInterval(tick,60000);
    return()=>clearInterval(id);
  },[]);
  const hour=now.getHours();
  const todayKey=now.toISOString().slice(0,10);
  const [loaded,setLoaded]=useState(false);
  const [viewDateKey,setViewDateKey]=useState(()=>new Date().toISOString().slice(0,10));

  // Quando cambia il giorno (mezzanotte), porta viewDateKey su oggi se si stava vedendo oggi
  useEffect(()=>{
    setViewDateKey(prev=>{
      // Se stava vedendo "oggi" (giorno vecchio), aggiorna a nuovo oggi
      if(prev<todayKey) return todayKey;
      return prev;
    });
  },[todayKey]);

  // Calcola proprietà dal giorno visualizzato
  const viewDate=new Date(viewDateKey+"T12:00:00");
  const dow=viewDate.getDay();
  const plan=DD[dow]; const th=plan.th;
  const isToday=viewDateKey===todayKey;

  const [strats,setStrats]=useState(INIT_STRATS);
  const [ricette,setRicette]=useState(INIT_RIC);
  const [notes,setNotes]=useState(INIT_NOTES);
  const [progressLog,setProgressLog]=useState([]);
  const [workouts,setWorkouts]=useState(INIT_WORKOUTS);
  const [yogaPractices,setYogaPractices]=useState(INIT_YOGA);
  const [faceYogaPractices,setFaceYogaPractices]=useState(INIT_FACEYOGA);
  const [extraGoals,setExtraGoals]=useState([]);
  const [alwaysExtra,setAlwaysExtra]=useState({mattina:[],sera:[]});
  const [deleted,setDeleted]=useState({mattina:[],sera:[],mattina_extra:[],sera_extra:[]});
  const [routineOrder,setRoutineOrder]=useState({mattina:null,sera:null});
  const [weekProteins,setWeekProteins]=useState([]);
  const [plantFoods,setPlantFoods]=useState([]);

  const [checked,setChecked]=useState({});
  const [waterCount,setWaterCount]=useState(0);
  const [stepsReached,setStepsReached]=useState(false);
  const [stepsVal,setStepsVal]=useState("");
  const [goalVals,setGoalVals]=useState({});
  const [alimNote,setAlimNote]=useState("");
  const [todayExtra,setTodayExtra]=useState({mattina:[],sera:[]});
  const [hidden,setHidden]=useState({mattina:[],sera:[]});
  const [readDone,setReadDone]=useState(false);
  const [alignDone,setAlignDone]=useState(false);
  const [dailyTodos,setDailyTodos]=useState({});
  const [todoInput,setTodoInput]=useState("");
  const [bodyMeasurements,setBodyMeasurements]=useState({height:1.70,entries:[]});
  const [alimOverrides,setAlimOverrides]=useState({});
  const [journalEntries,setJournalEntries]=useState({});
  const [duranteChecked,setDuranteChecked]=useState({});
  const [readMeta,setReadMeta]=useState({label:"Lettura",sub:"Almeno 1 capitolo",icon:"openbook",color:"#F0E4B8",tc:"#7A5C10",hidden:false});
  const [alignMeta,setAlignMeta]=useState({label:"Alignment",sub:"",icon:"align",color:"#FFD9B8",tc:"#A04A10",hidden:false});
  const [weeklyGoals,setWeeklyGoals]=useState([]);
  const [weeklyGoalVals,setWeeklyGoalVals]=useState({});

  const getWeekStart=()=>{
    const d=new Date(now);
    const day=d.getDay(); const diff=day===0?-6:1-day;
    d.setDate(d.getDate()+diff); d.setHours(0,0,0,0);
    return d.toISOString().slice(0,10);
  };

  useEffect(()=>{
    (async()=>{
      const load=async(key,fb)=>{const v=await storeGet("bm_"+key);return v!==null?v:fb;};
      const loadDaily=async(key,fb)=>{
        const v=await storeGet("bm_d_"+key);
        // v can be {date, data} OR just the raw value (old format)
        if(v!==null){
          if(typeof v==="object"&&v!==null&&"date"in v&&"data"in v){
            if(v.date===todayKey) return v.data;
            return fb;
          }
          // Legacy: raw value without date wrapper — discard (stale)
          return fb;
        }
        return fb;
      };
      const savedStrats=await load("strats",INIT_STRATS);
      // Aggiorna sempre i rituali built-in (s1,s2,s3) mantenendo eventuali rituali custom
      const builtinIds=new Set(INIT_STRATS.map(s=>s.id));
      const merged=[...INIT_STRATS,...savedStrats.filter(s=>!builtinIds.has(s.id))];
      setStrats(merged);
      setRicette(await load("ricette",INIT_RIC));
      setNotes(await load("notes",INIT_NOTES));
      setProgressLog(await load("progressLog",[]));
      setWorkouts(await load("workouts",INIT_WORKOUTS));
      setYogaPractices(await load("yogaPractices",INIT_YOGA));
      setFaceYogaPractices(await load("faceYogaPractices",INIT_FACEYOGA));
      setExtraGoals(await load("extraGoals",[]));
      setReadMeta(await load("readMeta",{label:"Lettura",sub:"Almeno 1 capitolo",icon:"openbook",color:"#F0E4B8",tc:"#7A5C10",hidden:false}));
      setAlignMeta(await load("alignMeta",{label:"Alignment",sub:"",icon:"align",color:"#FFD9B8",tc:"#A04A10",hidden:false}));
      setWeeklyGoals(await load("weeklyGoals",[]));
      setWeeklyGoalVals(await load("weeklyGoalVals",{}));
      // Reset dei dati manuali che potrebbero interferire con le routine base
      // (alwaysExtra, routineOrder, deleted vengono azzerati per garantire la routine corretta)
      await storeSet("bm_alwaysExtra",{mattina:[],sera:[]});
      setAlwaysExtra({mattina:[],sera:[]});
      await storeSet("bm_deleted",{mattina:[],sera:[],mattina_extra:[],sera_extra:[]});
      setDeleted({mattina:[],sera:[],mattina_extra:[],sera_extra:[]});
      await storeSet("bm_routineOrder",{mattina:null,sera:null});
      setRoutineOrder({mattina:null,sera:null});
      const allP=await load("weekProteins",[]);
      const ws=getWeekStart();
      setWeekProteins(allP.filter(e=>e.date>=ws));
      setPlantFoods(await load("plantFoods",[]));
      setDailyTodos(await load("dailyTodos",{}));
      setBodyMeasurements(await load("bodyMeasurements",{height:1.70,entries:[]}));
      setAlimOverrides(await load("alimOverrides",{}));
      setJournalEntries(await load("journalEntries",{}));
      setChecked(await loadDaily("checked",{}));
      setWaterCount(await loadDaily("water",0));
      setStepsReached(await loadDaily("stepsReached",false));
      setStepsVal(await loadDaily("stepsVal",""));
      setGoalVals(await loadDaily("goalVals",{}));
      setAlimNote(await loadDaily("alimNote",""));
      setTodayExtra(await loadDaily("todayExtra",{mattina:[],sera:[]}));
      setHidden(await loadDaily("hidden",{mattina:[],sera:[]}));
      setReadDone(await loadDaily("readDone",false));
      setAlignDone(await loadDaily("alignDone",false));
      setLoaded(true);
    })();
  },[]);

  const loadedRef=useRef(false);
  useEffect(()=>{ loadedRef.current=loaded; },[loaded]);

  const persist=useCallback((key,val)=>{ storeSet("bm_"+key,val); },[]);

  // persistDaily salva per la data visualizzata
  const persistDaily=useCallback((key,val)=>{
    storeSet("bm_d_"+viewDateKey+"_"+key,{date:viewDateKey,data:val});
    // compatibilità: salva anche col vecchio formato per oggi
    if(viewDateKey===todayKey) storeSet("bm_d_"+key,{date:viewDateKey,data:val});
  },[viewDateKey,todayKey]);

  // Quando cambia il giorno visualizzato, carica i dati di quel giorno
  useEffect(()=>{
    if(!loaded) return;
    (async()=>{
      const loadDay=async(key,fb)=>{
        // Prova prima il nuovo formato per data specifica
        const v1=await storeGet("bm_d_"+viewDateKey+"_"+key);
        if(v1!==null&&typeof v1==="object"&&"data"in v1) return v1.data;
        // Fallback al vecchio formato (solo per oggi)
        if(viewDateKey===todayKey){
          const v2=await storeGet("bm_d_"+key);
          if(v2!==null&&typeof v2==="object"&&"date"in v2&&v2.date===viewDateKey) return v2.data;
        }
        return fb;
      };
      setChecked(await loadDay("checked",{}));
      setWaterCount(await loadDay("water",0));
      setStepsReached(await loadDay("stepsReached",false));
      setStepsVal(await loadDay("stepsVal",""));
      setGoalVals(await loadDay("goalVals",{}));
      setAlimNote(await loadDay("alimNote",""));
      setTodayExtra(await loadDay("todayExtra",{mattina:[],sera:[]}));
      setHidden(await loadDay("hidden",{mattina:[],sera:[]}));
      setReadDone(await loadDay("readDone",false));
      setAlignDone(await loadDay("alignDone",false));
      setDuranteChecked(await loadDay("duranteChecked",{}));
    })();
  },[viewDateKey,loaded]);

  const mkSet=(setter,key,daily=false)=>(upd)=>setter(prev=>{
    const next=typeof upd==="function"?upd(prev):upd;
    if(loadedRef.current){ daily?persistDaily(key,next):persist(key,next); }
    return next;
  });

  const S={
    strats:mkSet(setStrats,"strats"),
    ricette:mkSet(setRicette,"ricette"),
    notes:mkSet(setNotes,"notes"),
    progressLog:mkSet(setProgressLog,"progressLog"),
    workouts:mkSet(setWorkouts,"workouts"),
    yoga:mkSet(setYogaPractices,"yogaPractices"),
    faceYoga:mkSet(setFaceYogaPractices,"faceYogaPractices"),
    extraGoals:mkSet(setExtraGoals,"extraGoals"),
    readMeta:mkSet(setReadMeta,"readMeta"),
    alignMeta:mkSet(setAlignMeta,"alignMeta"),
    weeklyGoals:mkSet(setWeeklyGoals,"weeklyGoals"),
    weeklyGoalVals:mkSet(setWeeklyGoalVals,"weeklyGoalVals"),
    alwaysExtra:mkSet(setAlwaysExtra,"alwaysExtra"),
    deleted:mkSet(setDeleted,"deleted"),
    routineOrder:mkSet(setRoutineOrder,"routineOrder"),
    weekProteins:mkSet(setWeekProteins,"weekProteins"),
    plantFoods:mkSet(setPlantFoods,"plantFoods"),
    checked:mkSet(setChecked,"checked",true),
    water:mkSet(setWaterCount,"water",true),
    stepsReached:mkSet(setStepsReached,"stepsReached",true),
    stepsVal:mkSet(setStepsVal,"stepsVal",true),
    goalVals:mkSet(setGoalVals,"goalVals",true),
    alimNote:mkSet(setAlimNote,"alimNote",true),
    todayExtra:mkSet(setTodayExtra,"todayExtra",true),
    hidden:mkSet(setHidden,"hidden",true),
    readDone:mkSet(setReadDone,"readDone",true),
    alignDone:mkSet(setAlignDone,"alignDone",true),
    dailyTodos:mkSet(setDailyTodos,"dailyTodos"),
    bodyMeasurements:mkSet(setBodyMeasurements,"bodyMeasurements"),
    alimOverrides:mkSet(setAlimOverrides,"alimOverrides"),
    journalEntries:mkSet(setJournalEntries,"journalEntries"),
    duranteChecked:mkSet(setDuranteChecked,"duranteChecked",true),
  };

  const[editWater,setEditWater]=useState(false);
  const[waterTarget,setWaterTarget]=useState(8);
  const[editSteps,setEditSteps]=useState(false);
  const[stepsTarget,setStepsTarget]=useState(5000);
  const[showPlantInfo,setShowPlantInfo]=useState(false);
  const[tab,setTab]=useState("oggi");
  const[subTab,setSubTab]=useState(null);
  const[editGoalId,setEditGoalId]=useState(null);
  const[stratOpen,setStratOpen]=useState(null);
  const[ricOpen,setRicOpen]=useState(null);
  const[movOpen,setMovOpen]=useState(null);
  const[fyOpen,setFyOpen]=useState(false);
  const[fyAutoOpen,setFyAutoOpen]=useState(false);
  const[fyOfficeOpen,setFyOfficeOpen]=useState(false);
  const[weekOff,setWeekOff]=useState(0);
  const[selDay,setSelDay]=useState(null);
  const[showAddGoal,setShowAddGoal]=useState(false);
  const[addModal,setAddModal]=useState(null);
  const[delModal,setDelModal]=useState(null);
  const[alimEdit,setAlimEdit]=useState(false);
  const[showAddStrat,setShowAddStrat]=useState(false);
  const[showAddRic,setShowAddRic]=useState(false);
  const[ricFilter,setRicFilter]=useState("Tutti");
  const[showAddNote,setShowAddNote]=useState(false);
  const[editNote,setEditNote]=useState(null);
  const[noteOpen,setNoteOpen]=useState(null);
  const[showAddProg,setShowAddProg]=useState(false);
  const[newProg,setNewProg]=useState({date:todayKey,peso:"",energia:"3",umore:"3",note:""});
  const[showAddMov,setShowAddMov]=useState(false);
  const[movFilter,setMovFilter]=useState("tutti");
  const[showAddWeeklyGoal,setShowAddWeeklyGoal]=useState(false);
  const[editWeeklyGoalId,setEditWeeklyGoalId]=useState(null);

  const buildList=(type)=>{
    const base=plan[type].filter((_,i)=>!(deleted[type]||[]).includes(i));
    const awF=alwaysExtra[type].filter((_,i)=>!(deleted[`${type}_extra`]||[]).includes(i));
    const raw=[
      ...base.map((text,i)=>({text,key:`base_${type}_${i}`,permanent:true,baseIdx:plan[type].indexOf(text)})),
      ...awF.map((text,i)=>({text,key:`aw_${type}_${i}`,permanent:true,extraIdx:i})),
      ...todayExtra[type].map((text,i)=>({text,key:`td_${type}_${i}`,permanent:false}))
    ].filter(item=>!(hidden[type]||[]).includes(item.key));
    // Deduplica per testo: rimuove voci extra/today che replicano una voce base (confronto case-insensitive e trim)
    const baseTexts=new Set(base.map(t=>t.trim().toLowerCase()));
    const deduped=raw.filter(item=>{
      if(item.key.startsWith("base_")) return true;
      const t=item.text.trim().toLowerCase();
      if(baseTexts.has(t)) return false;
      for(const bt of baseTexts){
        if(t.startsWith(bt.slice(0,12))||bt.startsWith(t.slice(0,12))) return false;
      }
      return true;
    });
    // Regola anti-duplicati globale: rimuove qualsiasi voce con testo identico già vista (prima occorrenza vince)
    const seenTexts=new Set();
    const unique=deduped.filter(item=>{
      const t=item.text.trim().toLowerCase();
      if(seenTexts.has(t)) return false;
      seenTexts.add(t);
      return true;
    });
    const order=routineOrder[type];
    if(order&&order.length>0){
      const keySet=new Set(unique.map(x=>x.key));
      const ordered=order.filter(k=>keySet.has(k)).map(k=>unique.find(x=>x.key===k));
      const remaining=unique.filter(x=>!order.includes(x.key));
      return [...ordered,...remaining];
    }
    return unique;
  };
  const mList=buildList("mattina"); const sList=buildList("sera");
  const total=mList.length+sList.length;
  const doneCnt=[...mList,...sList].filter(item=>checked[item.key]).length;
  const pct=total>0?Math.round(doneCnt/total*100):0;

  useEffect(()=>{
    if(!loaded)return;
    setProgressLog(prev=>{
      const existing=prev.findIndex(p=>p.date===viewDateKey);
      const goalSnap={
        water:waterCount>=8,
        steps:stepsReached,
        read:readDone,
        align:alignDone,
        extra:extraGoals.reduce((acc,g)=>({...acc,[g.id]:(goalVals[g.id]||0)>=g.target}),{})
      };
      if(existing>=0){
        const next=[...prev];
        next[existing]={...next[existing],routine:pct,goals:goalSnap};
        storeSet("bm_progressLog",next);
        return next;
      } else {
        if(pct===0)return prev;
        const entry={id:"auto_"+viewDateKey,date:viewDateKey,routine:pct,energia:"3",umore:"3",peso:"",note:"",auto:true,goals:goalSnap};
        const next=[entry,...prev].sort((a,b)=>b.date.localeCompare(a.date));
        storeSet("bm_progressLog",next);
        return next;
      }
    });
  },[pct,waterCount,stepsReached,readDone,alignDone,goalVals,viewDateKey,loaded]);

  const greeting=hour<12?"Buongiorno":hour<18?"Buon pomeriggio":"Buona sera";
  const todayIcon=hour<6?"moon":hour<9?"sunrise":hour<19?"fullsun":(hour<20||(hour===20&&now.getMinutes()<=30))?"sunset":"moon";
  const todayStr=now.toDateString();
  const fmtS=d=>`${d.getDate()} ${MN[d.getMonth()].slice(0,3)}`;

  const getWeek=off=>{
    const d=new Date(now); d.setDate(now.getDate()+(now.getDay()===0?-6:1-now.getDay())+off*7);
    return Array.from({length:7},(_,i)=>{const x=new Date(d);x.setDate(d.getDate()+i);return x;});
  };

  const filtRic=ricFilter==="Tutti"?ricette:ricette.filter(r=>r.cat===ricFilter||r.tag===ricFilter);

  // ── "20+ piante a settimana": punteggio, elenco settimana corrente e storico settimane precedenti ──
  const plantWeekKey=weekKeyOf(todayKey);
  const thisWeekPlants=plantFoods.filter(e=>weekKeyOf(e.date)===plantWeekKey);
  const plantScore=thisWeekPlants.reduce((s,e)=>s+e.points,0);
  const plantHistory=(()=>{
    const byWeek={};
    plantFoods.forEach(e=>{
      const wk=weekKeyOf(e.date);
      if(wk===plantWeekKey)return;
      (byWeek[wk]=byWeek[wk]||[]).push(e);
    });
    return Object.entries(byWeek)
      .sort((a,b)=>b[0].localeCompare(a[0]))
      .map(([weekStart,entries])=>({weekStart,score:entries.reduce((s,e)=>s+e.points,0),entries:[...entries].sort((a,b)=>a.date.localeCompare(b.date))}));
  })();
  // addPlantFood: registra un alimento vegetale se non è già stato aggiunto questa settimana (conteggio 1×/settimana).
  // Il valore in punti arriva già risolto dal chiamante (da PLANT_DB se riconosciuto, oppure scelto manualmente per gli alimenti non in database).
  // Ritorna false (senza aggiungere) se l'alimento è un duplicato della settimana corrente.
  const addPlantFood=(name,points)=>{
    const clean=name.trim();
    if(!clean)return false;
    const dup=thisWeekPlants.some(e=>e.name.toLowerCase()===clean.toLowerCase());
    if(dup)return false;
    S.plantFoods(p=>[...p,{id:"pf"+Date.now(),name:clean,points,date:todayKey}]);
    return true;
  };
  const removePlantFood=(id)=>S.plantFoods(p=>p.filter(e=>e.id!==id));

  // ── Obiettivi settimanali extra: come gli obiettivi extra giornalieri, ma il contatore si azzera a inizio settimana ──
  const weeklyGoalCurrentVals=weeklyGoalVals[plantWeekKey]||{};
  const bumpWeeklyGoal=(id,delta)=>S.weeklyGoalVals(p=>{
    const cur=p[plantWeekKey]||{};
    const nv=Math.max(0,(cur[id]||0)+delta);
    return{...p,[plantWeekKey]:{...cur,[id]:nv}};
  });

  const allMov=[...workouts,...yogaPractices,...faceYogaPractices];
  const filtMov=movFilter==="tutti"?allMov:movFilter==="allenamento"?workouts:movFilter==="yoga"?yogaPractices:faceYogaPractices;

  if(!loaded)return(<div style={{maxWidth:430,margin:"0 auto",minHeight:"100vh",background:N.bg,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{textAlign:"center"}}><Ic n="sparkle" s={32} c={N.muted}/><p style={{fontFamily:F.body,fontSize:13,color:N.muted,marginTop:12}}>Caricamento…</p></div></div>);

  return(
    <div style={{maxWidth:430,margin:"0 auto",minHeight:"100vh",paddingBottom:90,background:N.bg,overflow:"hidden",position:"relative"}}>
      <div style={{position:"fixed",top:-80,right:-80,width:280,height:280,borderRadius:"50%",background:th.blob,filter:"blur(60px)",zIndex:0,pointerEvents:"none"}}/>
      <div style={{position:"fixed",bottom:100,left:-60,width:220,height:220,borderRadius:"50%",background:th.blob,filter:"blur(50px)",zIndex:0,pointerEvents:"none",opacity:.6}}/>

      {fyOpen&&plan.faceYoga&&<FYSheet steps={plan.faceYoga} label={plan.fyLabel||""} onClose={()=>setFyOpen(false)} th={th}/>}
      {fyAutoOpen&&<FYSheet steps={FY_AUTO} label="Face Yoga in Auto 🚗" onClose={()=>setFyAutoOpen(false)} th={{grad:"linear-gradient(135deg,#EDE0FF,#D4C0FF)",dark:"#6B3FA0"}}/>}
      {fyOfficeOpen&&<FYSheet steps={FY_OFFICE} label="Face Yoga in Ufficio 💻" onClose={()=>setFyOfficeOpen(false)} th={{grad:"linear-gradient(135deg,#EDE0FF,#D4C0FF)",dark:"#6B3FA0"}}/>}
      {showPlantInfo&&<PlantInfoModal onClose={()=>setShowPlantInfo(false)}/>}
      {addModal&&<AddRoutineModal label={addModal.type==="mattina"?"Routine mattina":"Night routine"} onAdd={(text,scope)=>{
        // Anti-duplicati: controlla che il testo non esista già nella lista corrente
        const currentList=buildList(addModal.type);
        const already=currentList.some(item=>item.text.trim().toLowerCase()===text.trim().toLowerCase());
        if(already) return; // ignora silenziosamente se già presente
        if(scope==="always")S.alwaysExtra(p=>({...p,[addModal.type]:[...p[addModal.type],text]}));
        else S.todayExtra(p=>({...p,[addModal.type]:[...p[addModal.type],text]}));
      }} onClose={()=>setAddModal(null)}/>}
      {delModal&&<DelRoutineModal item={delModal.item} onDelete={(scope)=>{if(scope==="today")S.hidden(p=>({...p,[delModal.type]:[...(p[delModal.type]||[]),delModal.item.key]}));else if(scope==="always"){if(delModal.item.key.startsWith("base_"))S.deleted(p=>({...p,[delModal.type]:[...(p[delModal.type]||[]),delModal.item.baseIdx]}));else S.deleted(p=>({...p,[`${delModal.type}_extra`]:[...(p[`${delModal.type}_extra`]||[]),delModal.item.extraIdx]}));}}} onClose={()=>setDelModal(null)}/>}
      {showAddStrat&&<AddStratModal onAdd={r=>S.strats(p=>[...p,r])} onClose={()=>setShowAddStrat(false)}/>}
      {showAddRic&&<AddRicModal onAdd={r=>S.ricette(p=>[...p,r])} onClose={()=>setShowAddRic(false)}/>}
      {showAddNote&&<AddNoteModal onAdd={n=>S.notes(p=>[...p,n])} onClose={()=>setShowAddNote(false)}/>}
      {editNote&&<AddNoteModal editNote={editNote} onAdd={updated=>S.notes(p=>p.map(x=>x.id===updated.id?updated:x))} onClose={()=>setEditNote(null)}/>}
      {showAddMov&&<AddMovimentoModal onAdd={item=>{if(item.type==="yoga")S.yoga(p=>[...p,item]);else if(item.type==="faceyoga")S.faceYoga(p=>[...p,item]);else S.workouts(p=>[...p,item]);}} onClose={()=>setShowAddMov(false)}/>}

      <div style={{position:"relative",zIndex:1}}>
        {/* Header */}
        <div style={{padding:"1.4rem 1.25rem .9rem",background:"rgba(247,245,240,0.92)",backdropFilter:"blur(20px)",borderBottom:`0.5px solid ${N.border}`}}>
          {tab==="oggi"&&<>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3}}>
              <Lbl style={{margin:0}}>{DN[dow].toUpperCase()} · {viewDate.getDate()} {MN[viewDate.getMonth()]}{!isToday&&<span style={{color:th.dark||N.muted}}> · passato</span>}</Lbl>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <button onClick={()=>{const d=new Date(viewDateKey+"T12:00:00");d.setDate(d.getDate()-1);setViewDateKey(d.toISOString().slice(0,10));}} style={{width:28,height:28,borderRadius:9,border:`0.5px solid ${N.border}`,background:"#fff",cursor:"pointer",fontSize:16,color:N.muted,display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
                <button onClick={()=>{if(viewDateKey>=todayKey)return;const d=new Date(viewDateKey+"T12:00:00");d.setDate(d.getDate()+1);setViewDateKey(d.toISOString().slice(0,10));}} style={{width:28,height:28,borderRadius:9,border:`0.5px solid ${N.border}`,background:viewDateKey>=todayKey?"#f5f5f5":"#fff",cursor:viewDateKey>=todayKey?"default":"pointer",fontSize:16,color:viewDateKey>=todayKey?N.faint:N.muted,display:"flex",alignItems:"center",justifyContent:"center"}}>›</button>
              </div>
            </div>
            <Title size={28} style={{fontWeight:500,marginBottom:14,letterSpacing:-.3}}>{isToday?greeting:th.name}</Title>
            {isToday&&<DailyPhrase todayKey={todayKey}/>}
            <div style={{borderRadius:22,padding:"16px 18px 14px",background:th.grad,border:`0.5px solid ${N.border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                <div><Lbl>GIORNATA</Lbl><Title size={19}>{th.name}</Title></div>
                <div style={{textAlign:"right"}}><p style={{fontFamily:F.heading,fontSize:36,fontWeight:600,color:N.text,margin:0,lineHeight:1}}>{doneCnt}<span style={{fontSize:17,color:N.muted}}>/{total}</span></p><Lbl style={{margin:0}}>COMPLETATE</Lbl></div>
              </div>
              <div style={{height:5,background:"rgba(255,255,255,.55)",borderRadius:99,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:th.dark,borderRadius:99,transition:"width .5s",opacity:.75}}/></div>
              <p style={{fontSize:11,color:th.dark,margin:"5px 0 0",fontFamily:F.body,fontWeight:500,opacity:.8}}>{pct}% completato</p>
            </div>
          </>}
          {tab==="cal"&&<Title size={28} style={{fontWeight:500}}>Calendario</Title>}
          {tab==="rituali"&&<Title size={28} style={{fontWeight:500}}>Rituali</Title>}
          {tab==="altro"&&<>
            <Title size={28} style={{fontWeight:500,marginBottom:subTab?14:0}}>{{ricette:"Ricette & Idee",note:"Note & Info",progressi:"Progressi",movimento:"Movimento",proteine:"Proteine",piante:"20+ piante a settimana",skincare:"Skincare"}[subTab]||"Libreria"}</Title>
            {subTab&&(<div style={{display:"flex",gap:6,overflowX:"auto",scrollbarWidth:"none"}}>
              {[["ricette","fork","Ricette"],["movimento","dumbbell","Movimento"],["proteine","protein","Proteine"],["piante","leaf","Piante"],["skincare","flower","Skincare"],["note","note","Note"],["progressi","chart","Progressi"]].map(([k,ic,l])=>(
                <button key={k} onClick={()=>setSubTab(k)} style={{flexShrink:0,display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:20,border:`1px solid ${subTab===k?N.text:N.border}`,background:subTab===k?N.text:"transparent",color:subTab===k?"#fff":N.muted,fontSize:11,fontFamily:F.body,fontWeight:subTab===k?600:400,cursor:"pointer"}}>
                  <Ic n={ic} s={12} c={subTab===k?"#fff":N.muted}/>{l}
                </button>
              ))}
            </div>)}
          </>}
        </div>

        <div style={{padding:"1rem 1.25rem"}}>

        {/* ── OGGI ── */}
        {tab==="oggi"&&<div>
          <div style={{marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <Title size={20}>Obiettivi del giorno</Title>
              <button onClick={()=>setShowAddGoal(s=>!s)} style={{fontSize:11,padding:"4px 10px",borderRadius:20,border:`1px dashed ${N.border}`,background:"transparent",color:N.muted,cursor:"pointer",fontFamily:F.body}}>+ nuovo</button>
            </div>
            {showAddGoal&&<GoalAddForm onSave={(goal)=>{S.extraGoals(p=>[...p,{id:"g"+Date.now(),...goal}]);setShowAddGoal(false);}} onCancel={()=>setShowAddGoal(false)}/>}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {/* ACQUA */}
              <div style={{background:waterCount>=waterTarget?"#D9F0CE":"#fff",borderRadius:18,padding:"13px 14px",border:`0.5px solid ${waterCount>=waterTarget?"#4E8C40":N.border}`,transition:"all .3s"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <Ic n="drop" s={18} c="#4E8C40"/>
                  <div style={{display:"flex",gap:4,alignItems:"center"}}>
                    {waterCount>=waterTarget&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:99,background:"#2A5A18",color:"#fff",fontFamily:F.body,fontWeight:600}}>✓</span>}
                    <button onClick={()=>setEditWater(e=>!e)} style={{background:"transparent",border:"none",cursor:"pointer",padding:2,opacity:.35}}><Ic n="edit" s={13} c="#4E8C40"/></button>
                  </div>
                </div>
                {editWater?(
                  <div>
                    <Lbl style={{margin:"0 0 4px"}}>OBIETTIVO (bicchieri)</Lbl>
                    <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:8}}>
                      <input type="number" value={waterTarget} onChange={e=>setWaterTarget(+e.target.value||8)} style={{flex:1,padding:"6px 8px",borderRadius:8,border:`1px solid ${N.border}`,fontFamily:F.body,fontSize:13,color:N.text,background:N.faint,outline:"none"}}/>
                      <button onClick={()=>setEditWater(false)} style={{width:30,height:30,borderRadius:9,border:"none",background:"#4E8C40",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Ic n="check" s={13} c="#fff"/></button>
                    </div>
                    <button onClick={()=>{S.water(()=>0);}} style={{width:"100%",padding:"6px",borderRadius:9,border:`0.5px solid ${N.border}`,background:"transparent",color:"#C05050",fontSize:11,cursor:"pointer",fontFamily:F.body}}>Azzera contatore</button>
                  </div>
                ):(
                  <>
                    <Lbl>ACQUA</Lbl>
                    <p style={{fontFamily:F.heading,fontSize:26,fontWeight:600,color:N.text,margin:"0 0 6px",lineHeight:1}}>{waterCount}<span style={{fontSize:14,color:N.muted}}>/{waterTarget}</span></p>
                    <div style={{height:4,background:N.faint,borderRadius:99,marginBottom:8,overflow:"hidden"}}><div style={{height:"100%",width:`${Math.min(Math.round(waterCount/waterTarget*100),100)}%`,background:"#4E8C40",borderRadius:99,transition:"width .3s",opacity:.7}}/></div>
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={()=>S.water(c=>Math.max(0,c-1))} style={{flex:1,padding:"5px 0",borderRadius:10,border:`0.5px solid ${N.border}`,background:"transparent",color:N.text,fontSize:15,cursor:"pointer"}}>−</button>
                      <button onClick={()=>S.water(c=>c+1)} style={{flex:1,padding:"5px 0",borderRadius:10,border:"none",background:"#D9F0CE",color:"#2A5A18",fontSize:15,cursor:"pointer",fontWeight:700}}>+</button>
                    </div>
                  </>
                )}
              </div>
              {/* PASSI */}
              <div style={{background:stepsReached?"#FFD5B8":"#fff",borderRadius:18,padding:"13px 14px",border:`0.5px solid ${stepsReached?"#E8733A":N.border}`,transition:"all .3s"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <Ic n="walk" s={18} c="#E8733A"/>
                  <div style={{display:"flex",alignItems:"center",gap:4}}>
                    {stepsReached&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:99,background:"#A04010",color:"#fff",fontFamily:F.body,fontWeight:600}}>✓</span>}
                    <a href="x-apple-health://" style={{fontSize:10,padding:"2px 8px",borderRadius:99,background:"rgba(232,115,58,0.12)",color:"#A04010",textDecoration:"none",fontFamily:F.body,fontWeight:600}}>Salute ›</a>
                    <button onClick={()=>setEditSteps(e=>!e)} style={{background:"transparent",border:"none",cursor:"pointer",padding:2,opacity:.35}}><Ic n="edit" s={13} c="#E8733A"/></button>
                  </div>
                </div>
                {editSteps?(
                  <div>
                    <Lbl style={{margin:"0 0 4px"}}>OBIETTIVO (passi)</Lbl>
                    <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:8}}>
                      <input type="number" value={stepsTarget} onChange={e=>setStepsTarget(+e.target.value||5000)} style={{flex:1,padding:"6px 8px",borderRadius:8,border:`1px solid ${N.border}`,fontFamily:F.body,fontSize:13,color:N.text,background:N.faint,outline:"none"}}/>
                      <button onClick={()=>setEditSteps(false)} style={{width:30,height:30,borderRadius:9,border:"none",background:"#E8733A",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Ic n="check" s={13} c="#fff"/></button>
                    </div>
                    <button onClick={()=>{S.stepsVal("");S.stepsReached(false);}} style={{width:"100%",padding:"6px",borderRadius:9,border:`0.5px solid ${N.border}`,background:"transparent",color:"#C05050",fontSize:11,cursor:"pointer",fontFamily:F.body}}>Azzera</button>
                  </div>
                ):(
                  <>
                    <Lbl>PASSI</Lbl>
                    <div style={{display:"flex",alignItems:"baseline",gap:4,marginBottom:6}}>
                      <input value={stepsVal} onChange={e=>{const v=e.target.value.replace(/\D/g,"");S.stepsVal(v);if((parseInt(v)||0)>=stepsTarget) S.stepsReached(true);}} placeholder="0" style={{fontFamily:F.heading,fontSize:22,fontWeight:600,color:N.text,background:"transparent",border:"none",outline:"none",width:"70px",padding:0}}/>
                      <span style={{fontSize:11,color:N.muted,fontFamily:F.body}}>/{stepsTarget.toLocaleString("it-IT")}</span>
                    </div>
                    <div style={{height:4,background:N.faint,borderRadius:99,marginBottom:8,overflow:"hidden"}}><div style={{height:"100%",width:`${Math.min(Math.round((parseInt(stepsVal)||0)/stepsTarget*100),100)}%`,background:"#E8733A",borderRadius:99,transition:"width .3s",opacity:.7}}/></div>
                    <div onClick={()=>S.stepsReached(s=>!s)} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>
                      <div style={{width:18,height:18,borderRadius:5,border:stepsReached?"none":`1.5px solid ${N.border}`,background:stepsReached?"#A04010":"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s"}}>{stepsReached&&<Ic n="check" s={11} c="#fff"/>}</div>
                      <span style={{fontSize:11,color:N.muted,fontFamily:F.body}}>Raggiunto</span>
                    </div>
                  </>
                )}
              </div>
              {!readMeta.hidden&&<GoalCheck done={readDone} setDone={S.readDone} icon={readMeta.icon} color={readMeta.color} checkColor={readMeta.tc} label={readMeta.label} subtitle={readMeta.sub} extraLink={{href:"mobilenotes://",label:"📝 Note"}} onEdit={(patch)=>S.readMeta(m=>({...m,...patch}))} onDelete={()=>S.readMeta(m=>({...m,hidden:true}))}/>}
              {!alignMeta.hidden&&<GoalCheck done={alignDone} setDone={S.alignDone} icon={alignMeta.icon} color={alignMeta.color} checkColor={alignMeta.tc} label={alignMeta.label} subtitle={alignMeta.sub} onEdit={(patch)=>S.alignMeta(m=>({...m,...patch}))} onDelete={()=>S.alignMeta(m=>({...m,hidden:true}))}/>}
              {extraGoals.map(g=>{const v=goalVals[g.id]||0;const gd=v>=g.target;const gp=Math.min(Math.round(v/g.target*100),100);return(<ExtraGoalCard key={g.id} g={g} v={v} gd={gd} gp={gp} editGoalId={editGoalId} setEditGoalId={setEditGoalId} onUpdateGoal={(id,patch)=>S.extraGoals(p=>p.map(x=>x.id===id?{...x,...patch}:x))} onDeleteGoal={(id)=>S.extraGoals(p=>p.filter(x=>x.id!==id))} onDecrement={()=>S.goalVals(p=>({...p,[g.id]:Math.max(0,(p[g.id]||0)-1)}))} onIncrement={()=>S.goalVals(p=>({...p,[g.id]:(p[g.id]||0)+1}))}/>);})}
            </div>
          </div>

          <div style={{marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <Title size={20}>Obiettivi settimanali</Title>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <button onClick={()=>setShowAddWeeklyGoal(s=>!s)} style={{fontSize:11,padding:"4px 10px",borderRadius:20,border:`1px dashed ${N.border}`,background:"transparent",color:N.muted,cursor:"pointer",fontFamily:F.body}}>+ nuovo</button>
                <button onClick={()=>setShowPlantInfo(true)} style={{width:24,height:24,borderRadius:"50%",border:`1px solid ${N.border}`,background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontFamily:F.heading,fontSize:12,fontWeight:600,color:N.muted}}>i</button>
              </div>
            </div>
            {showAddWeeklyGoal&&<GoalAddForm onSave={(goal)=>{S.weeklyGoals(p=>[...p,{id:"wg"+Date.now(),...goal}]);setShowAddWeeklyGoal(false);}} onCancel={()=>setShowAddWeeklyGoal(false)}/>}
            <Card style={{overflow:"visible"}}>
              <p style={{fontSize:12,fontWeight:600,color:N.muted,margin:"0 0 10px",fontFamily:F.body}}>🌿 20+ piante a settimana</p>
              <PlantProgressBar score={plantScore} compact/>
              <div style={{marginTop:12}}>
                <PlantQuickAdd onAdd={addPlantFood} compact/>
              </div>
            </Card>
            {weeklyGoals.length>0&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {weeklyGoals.map(g=>{const v=weeklyGoalCurrentVals[g.id]||0;const gd=v>=g.target;const gp=Math.min(Math.round(v/g.target*100),100);return(
                <ExtraGoalCard key={g.id} g={g} v={v} gd={gd} gp={gp} editGoalId={editWeeklyGoalId} setEditGoalId={setEditWeeklyGoalId} onUpdateGoal={(id,patch)=>S.weeklyGoals(p=>p.map(x=>x.id===id?{...x,...patch}:x))} onDeleteGoal={(id)=>S.weeklyGoals(p=>p.filter(x=>x.id!==id))} onDecrement={()=>bumpWeeklyGoal(g.id,-1)} onIncrement={()=>bumpWeeklyGoal(g.id,1)}/>
              );})}
            </div>}
          </div>

          <AlimentazioneSection
            plan={plan}
            viewDateKey={viewDateKey}
            dow={dow}
            alimNote={alimNote}
            setAlimNote={v=>S.alimNote(v)}
            alimEdit={alimEdit}
            setAlimEdit={setAlimEdit}
            alimOverrides={alimOverrides}
            setAlimOverrides={v=>S.alimOverrides(v)}
            th={th}
            onGoProteine={()=>{setTab("altro");setSubTab("proteine");}}
          />

          <RSection list={mList} type="mattina" gradStyle="linear-gradient(160deg,#FFFDF0 0%,#FFF6CC 55%,#FFFFFF 100%)" checked={checked} onToggle={k=>S.checked(p=>({...p,[k]:!p[k]}))} onAdd={setAddModal} onDel={(item,type)=>setDelModal({item,type})} onEdit={(item,newText,type)=>{
                if(item.key.startsWith("aw_")){
                  S.alwaysExtra(p=>({...p,[type]:p[type].map((t,i)=>i===item.extraIdx?newText:t)}));
                } else if(item.key.startsWith("td_")){
                  const tdIdx=parseInt(item.key.split("_")[2],10);
                  S.todayExtra(p=>({...p,[type]:p[type].map((t,i)=>i===tdIdx?newText:t)}));
                } else if(item.key.startsWith("base_")){
                  // Nascondi la voce base e aggiungila come alwaysExtra modificata
                  S.hidden(p=>({...p,[type]:[...(p[type]||[]),item.key]}));
                  S.alwaysExtra(p=>({...p,[type]:[...p[type],newText]}));
                }
              }} onReorder={nl=>S.routineOrder(p=>({...p,mattina:nl.map(x=>x.key)}))} th={th} plan={plan} onFYOpen={()=>setFyOpen(true)}/>

          {/* ── Daily To-do List ── */}
          <DailyTodoList
            todos={dailyTodos[viewDateKey]||[]}
            todoInput={todoInput}
            setTodoInput={setTodoInput}
            onAdd={(directText,ritual)=>{
              if(ritual){
                const item={id:"td"+Date.now(),text:ritual.title,done:false,substeps:ritual.steps.map(s=>({text:s,done:false})),ritualId:ritual.id,color:{bg:ritual.grad.includes("F2FAF0")?"#D9F0CE":ritual.grad.includes("FDFAF2")?"#F0E4B8":ritual.grad.includes("FFF5EE")?"#FFD9B8":ritual.grad.includes("EDE0FF")?"#EDE0FF":"#F0E4B8",tc:ritual.tc}};
                S.dailyTodos(prev=>({...prev,[viewDateKey]:[...(prev[viewDateKey]||[]),item]}));
              } else {
                const t=(directText||todoInput).trim();
                if(!t)return;
                const color=nextPastel();
                S.dailyTodos(prev=>({...prev,[viewDateKey]:[...(prev[viewDateKey]||[]),{id:"td"+Date.now(),text:t,done:false,color}]}));
                if(!directText)setTodoInput("");
              }
            }}
            onToggle={(id)=>S.dailyTodos(prev=>({...prev,[viewDateKey]:(prev[viewDateKey]||[]).map(t=>t.id===id?{...t,done:!t.done}:t)}))}
            onDelete={(id)=>S.dailyTodos(prev=>({...prev,[viewDateKey]:(prev[viewDateKey]||[]).filter(t=>t.id!==id)}))}
            onEdit={(id,newText)=>S.dailyTodos(prev=>({...prev,[viewDateKey]:(prev[viewDateKey]||[]).map(t=>t.id===id?{...t,text:newText}:t)}))}
            onToggleSubstep={(id,si)=>S.dailyTodos(prev=>({...prev,[viewDateKey]:(prev[viewDateKey]||[]).map(t=>t.id===id?{...t,substeps:t.substeps.map((ss,i)=>i===si?{...ss,done:!ss.done}:ss)}:t)}))}
            rituals={strats}
          />

          {/* ── Durante la giornata — solo feriali ── */}
          {dow>=1&&dow<=5&&<div style={{borderRadius:20,padding:"14px 15px",marginBottom:12,background:"linear-gradient(135deg,#F7F5F0,#EDE9E2)",border:`0.5px solid ${N.border}`}}>
            <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:12}}><Ic n="walk" s={15} c={N.muted}/><Title size={16}>Durante la giornata</Title></div>
            {plan.ufficio.length>0&&<>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}><Ic n="office" s={13} c="#5A5652"/><p style={{fontSize:12,fontWeight:600,color:"#5A5652",margin:0,fontFamily:F.body}}>In ufficio</p></div>
              {plan.ufficio.map((item,i)=>{
                const k="uff_"+i;
                const done=duranteChecked[k];
                return(<div key={i} onClick={()=>S.duranteChecked(p=>({...p,[k]:!p[k]}))} style={{display:"flex",gap:8,padding:"6px 0 6px 4px",borderBottom:i<plan.ufficio.length-1?`0.5px solid ${N.faint}`:"none",cursor:"pointer",alignItems:"flex-start"}}>
                  <div style={{width:18,height:18,borderRadius:5,border:done?"none":`1.5px solid ${N.border}`,background:done?th.dark:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2,transition:"all .2s"}}>{done&&<Ic n="check" s={11} c="#fff"/>}</div>
                  <p style={{fontSize:12,color:done?N.muted:N.text,textDecoration:done?"line-through":"none",margin:0,lineHeight:1.55,fontFamily:F.body}}>{item}</p>
                </div>);
              })}
              <div style={{height:"0.5px",background:N.faint,margin:"10px 0"}}/>
            </>}
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}><Ic n="car" s={13} c="#5A5652"/><p style={{fontSize:12,fontWeight:600,color:"#5A5652",margin:0,fontFamily:F.body}}>In auto</p></div>
            <p style={{fontSize:12,color:N.muted,margin:"0 0 8px 4px",fontFamily:F.body,lineHeight:1.5}}>Esercizi invisibili ai semafori — tieni premuto per i dettagli.</p>
            {FY_AUTO.map((ex,i)=>{
              const k="auto_"+i;
              const done=duranteChecked[k];
              return(<div key={i} onClick={()=>S.duranteChecked(p=>({...p,[k]:!p[k]}))} style={{display:"flex",gap:8,padding:"6px 0 6px 4px",borderBottom:i<FY_AUTO.length-1?`0.5px solid ${N.faint}`:"none",cursor:"pointer",alignItems:"flex-start"}}>
                <div style={{width:18,height:18,borderRadius:5,border:done?"none":`1.5px solid #6B3FA0`,background:done?"#6B3FA0":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2,transition:"all .2s"}}>{done&&<Ic n="check" s={11} c="#fff"/>}</div>
                <p style={{fontSize:12,color:done?N.muted:N.text,textDecoration:done?"line-through":"none",margin:0,lineHeight:1.55,fontFamily:F.body,fontWeight:500}}>{ex.name}</p>
              </div>);
            })}
            <div style={{marginTop:12,display:"flex",gap:8}}>
              <button onClick={()=>setFyAutoOpen(true)} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"9px 10px",borderRadius:14,border:`1px solid #9B6FCC`,background:"linear-gradient(135deg,#F5EFFF,#E8D8FF)",color:"#6B3FA0",cursor:"pointer",fontFamily:F.body,fontSize:11,fontWeight:600}}>
                <Ic n="car" s={13} c="#6B3FA0"/>Auto ›
              </button>
              <button onClick={()=>setFyOfficeOpen(true)} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"9px 10px",borderRadius:14,border:`1px solid #9B6FCC`,background:"linear-gradient(135deg,#F5EFFF,#E8D8FF)",color:"#6B3FA0",cursor:"pointer",fontFamily:F.body,fontSize:11,fontWeight:600}}>
                <Ic n="office" s={13} c="#6B3FA0"/>Ufficio ›
              </button>
            </div>
          </div>}

          {/* ── Sabato: pomeriggio rilassante ── */}
          {dow===6&&<div style={{borderRadius:20,padding:"14px 15px",marginBottom:12,background:"linear-gradient(135deg,#FDFAF2,#F0E4B8)",border:`0.5px solid ${N.border}`}}>
            <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:12}}><Ic n="sparkle" s={15} c="#7A5C10"/><Title size={16} style={{color:"#7A5C10"}}>Pomeriggio & Serata</Title></div>
            {[
              {ora:"09:00–11:00",label:"Pulizie di casa"},
              {ora:"11:00–12:00",label:"Yoga — lezione o pratica personale"},
              {ora:"13:00",label:"Pranzo: Pasta sfiziosa + contorno veggies"},
              {ora:"15:00–19:30",label:"Camminata · Yoga · Upper & Core (a scelta)"},
              {ora:"15:00–19:30",label:"Libro / film / serie tv"},
              {ora:"15:00–19:30",label:"Leg routine: Dry Brush + Doccia + Getto freddo gambe + Massaggio"},
              {ora:"15:00–19:30",label:"Capelli, make up e vestiti"},
              {ora:"Serata",label:"NAC (se alcolici) · Aperitivo Spritz + snacks · Cena fuori o sfiziosa"},
            ].map((item,i,arr)=>(
              <div key={i} style={{display:"flex",gap:10,padding:"7px 0",borderBottom:i<arr.length-1?`0.5px solid ${N.faint}`:"none"}}>
                <span style={{fontSize:10,color:"#C4980A",fontFamily:F.body,fontWeight:600,flexShrink:0,marginTop:2,minWidth:70}}>{item.ora}</span>
                <p style={{fontSize:12,color:N.text,margin:0,lineHeight:1.55,fontFamily:F.body}}>{item.label}</p>
              </div>
            ))}
          </div>}

          {/* ── Domenica: giornata rilassante ── */}
          {dow===0&&<div style={{borderRadius:20,padding:"14px 15px",marginBottom:12,background:"linear-gradient(135deg,#FFF5EE,#FFD9B8)",border:`0.5px solid ${N.border}`}}>
            <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:12}}><Ic n="moon" s={15} c="#A04A10"/><Title size={16} style={{color:"#A04A10"}}>Giornata Rigenerante</Title></div>
            {[
              {ora:"Mattina",label:"Mattinata libera — relax, piante, lettura"},
              {ora:"11:00",label:"Supplementi: Bromelina"},
              {ora:"13:30",label:"Pranzo: Pasta sfiziosa + contorno veggies · Vitamina D3 + Acido Folico"},
              {ora:"Pomeriggio",label:"Camminata in coppia (opz.) · Relax: film / serie tv / lettura · Yoga (opz.)"},
              {ora:"20:00–20:30",label:"Preparazione pinsa · Birra analcolica / Ginger Zero / Spritz + snacks"},
              {ora:"20:30–21:30",label:"Cena: Pinsa con passata + verdure + mozzarella light · Birra analcolica (NAC prima se alcolica)"},
            ].map((item,i,arr)=>(
              <div key={i} style={{display:"flex",gap:10,padding:"7px 0",borderBottom:i<arr.length-1?`0.5px solid ${N.faint}`:"none"}}>
                <span style={{fontSize:10,color:"#E8834A",fontFamily:F.body,fontWeight:600,flexShrink:0,marginTop:2,minWidth:70}}>{item.ora}</span>
                <p style={{fontSize:12,color:N.text,margin:0,lineHeight:1.55,fontFamily:F.body}}>{item.label}</p>
              </div>
            ))}
          </div>}

          <RSection list={sList} type="sera" gradStyle="linear-gradient(160deg,#EEF3FF 0%,#DCE8FF 55%,#FFFFFF 100%)" checked={checked} onToggle={k=>S.checked(p=>({...p,[k]:!p[k]}))} onAdd={setAddModal} onDel={(item,type)=>setDelModal({item,type})} onEdit={(item,newText,type)=>{
                if(item.key.startsWith("aw_")){
                  S.alwaysExtra(p=>({...p,[type]:p[type].map((t,i)=>i===item.extraIdx?newText:t)}));
                } else if(item.key.startsWith("td_")){
                  const tdIdx=parseInt(item.key.split("_")[2],10);
                  S.todayExtra(p=>({...p,[type]:p[type].map((t,i)=>i===tdIdx?newText:t)}));
                } else if(item.key.startsWith("base_")){
                  S.hidden(p=>({...p,[type]:[...(p[type]||[]),item.key]}));
                  S.alwaysExtra(p=>({...p,[type]:[...p[type],newText]}));
                }
              }} onReorder={nl=>S.routineOrder(p=>({...p,sera:nl.map(x=>x.key)}))} th={th} plan={plan} onFYOpen={()=>setFyOpen(true)}/>

          {/* ── Journaling — in fondo, dopo la night routine ── */}
          <JournalingCard
            entry={journalEntries[viewDateKey]||""}
            onSave={text=>S.journalEntries(prev=>({...prev,[viewDateKey]:text}))}
            dateKey={viewDateKey}
          />
        </div>}

        {/* ── CALENDARIO ── */}
        {tab==="cal"&&(()=>{
          const wdays=getWeek(weekOff); const selP=selDay?DD[selDay.getDay()]:null; const selTh=selP?.th;
          return(<div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <button onClick={()=>{setWeekOff(w=>w-1);setSelDay(null);}} style={{width:38,height:38,borderRadius:12,border:`0.5px solid ${N.border}`,background:"#fff",cursor:"pointer",fontSize:20,color:N.muted}}>‹</button>
              <p style={{fontFamily:F.body,fontSize:13,fontWeight:600,color:N.text,margin:0}}>{weekOff===0?"Questa settimana":weekOff===-1?"Scorsa":weekOff===1?"Prossima":`${fmtS(wdays[0])} – ${fmtS(wdays[6])}`}</p>
              <button onClick={()=>{setWeekOff(w=>w+1);setSelDay(null);}} style={{width:38,height:38,borderRadius:12,border:`0.5px solid ${N.border}`,background:"#fff",cursor:"pointer",fontSize:20,color:N.muted}}>›</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:16}}>
              {wdays.map((d,i)=>{const isT=d.toDateString()===todayStr,isS=selDay&&d.toDateString()===selDay.toDateString(),dp=DD[d.getDay()];return(<div key={i} onClick={()=>setSelDay(isS?null:d)} style={{cursor:"pointer",textAlign:"center",borderRadius:13,padding:"9px 2px",background:isS?dp.th.dark:isT?dp.th.grad:"#fff",border:`1px solid ${isT||isS?dp.th.dark:N.border}`,transition:"all .2s"}}><p style={{fontSize:9,color:isS?"rgba(255,255,255,.7)":isT?dp.th.dark:N.muted,margin:"0 0 3px",fontWeight:600,fontFamily:F.body}}>{DS[d.getDay()]}</p><p style={{fontFamily:F.heading,fontSize:16,fontWeight:600,color:isS?"#fff":isT?dp.th.dark:N.text,margin:0}}>{d.getDate()}</p></div>);})}
            </div>
            {!selDay?wdays.map((d,i)=>{const dp=DD[d.getDay()],isT=d.toDateString()===todayStr;return(<div key={i} onClick={()=>setSelDay(d)} style={{background:"#fff",borderRadius:18,padding:"13px 15px",marginBottom:8,border:`0.5px solid ${isT?dp.th.dark:N.border}`,cursor:"pointer",display:"flex",alignItems:"center",gap:12}}><div style={{width:40,height:40,borderRadius:13,background:dp.th.grad,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ic n={dp.th.icon} s={18} c={dp.th.dark}/></div><div style={{flex:1}}><Lbl style={{margin:"0 0 2px"}}>{DN[d.getDay()].toUpperCase()} {d.getDate()}</Lbl><Title size={14}>{dp.th.name}</Title></div>{isT&&<span style={{fontSize:10,padding:"3px 10px",borderRadius:99,background:dp.th.pill,color:dp.th.pillText,fontFamily:F.body,fontWeight:600}}>oggi</span>}<Ic n="chevron" s={16} c={N.muted}/></div>);}):(
              <div>
                <button onClick={()=>setSelDay(null)} style={{fontSize:12,padding:"7px 14px",borderRadius:12,border:`0.5px solid ${N.border}`,background:"#fff",cursor:"pointer",color:N.muted,marginBottom:12,fontFamily:F.body,display:"flex",alignItems:"center",gap:6}}><Ic n="back" s={14} c={N.muted}/>indietro</button>
                <div style={{borderRadius:20,padding:"15px 17px",marginBottom:12,background:selTh.grad,border:`0.5px solid ${N.border}`}}><Lbl>{DN[selDay.getDay()].toUpperCase()} {selDay.getDate()} {MN[selDay.getMonth()]}</Lbl><Title size={22}>{selTh.name}</Title></div>
                <div style={{borderRadius:18,padding:"13px 15px",marginBottom:10,background:plan.alimGrad,border:`0.5px solid ${N.border}`}}><Lbl>ALIMENTAZIONE</Lbl><Title size={15} style={{marginBottom:8}}>{selP.alimLabel}</Title><div style={{background:"rgba(255,255,255,.55)",borderRadius:11,padding:"8px 10px",marginBottom:6}}><Lbl style={{margin:"0 0 2px"}}>COLAZIONE</Lbl><p style={{fontSize:11,color:N.text,margin:0,fontFamily:F.body,lineHeight:1.5}}>{COLAZIONE[selP.colazione]||COLAZIONE.std}</p></div>{[["Spuntino",selP.spuntino],["Pranzo",selP.pranzo],["Cena",selP.cena]].map(([lbl,val])=>(<p key={lbl} style={{fontSize:12,color:N.text,margin:"4px 0",fontFamily:F.body}}><span style={{fontWeight:600}}>{lbl}:</span> {val}</p>))}</div>
                <Card><Title size={16} style={{marginBottom:10}}>Routine mattina</Title>{selP.mattina.map((item,i)=><p key={i} style={{fontSize:12,color:N.text,margin:"0 0 7px",paddingLeft:12,borderLeft:`2.5px solid ${selTh.accent}`,lineHeight:1.5,fontFamily:F.body}}>{item}</p>)}</Card>
                <Card><Title size={16} style={{marginBottom:10}}>Night routine</Title>{selP.sera.map((item,i)=><p key={i} style={{fontSize:12,color:N.text,margin:"0 0 7px",paddingLeft:12,borderLeft:`2.5px solid ${selTh.dark}`,lineHeight:1.5,fontFamily:F.body}}>{item}</p>)}{selP.faceYoga&&<div style={{marginTop:10,padding:"10px 12px",borderRadius:14,background:selTh.grad}}><Lbl style={{marginBottom:6}}>FACE YOGA</Lbl>{selP.faceYoga.map((s,i)=><p key={i} style={{fontSize:11,color:selTh.dark,margin:"3px 0",fontFamily:F.body}}>{i+1}. {s.name}</p>)}</div>}</Card>
              </div>
            )}
          </div>);
        })()}

        {/* ── RITUALI ── */}
        {tab==="rituali"&&<div>
          <div style={{display:"flex",justifyContent:"flex-end",marginBottom:14}}><button onClick={()=>setShowAddStrat(true)} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,padding:"5px 12px",borderRadius:20,border:`1px solid ${N.border}`,background:"#fff",color:N.muted,cursor:"pointer",fontFamily:F.body}}><Ic n="plus" s={12} c={N.muted}/>nuovo</button></div>
          {strats.map((s,i)=>(
            <div key={s.id} style={{background:"#fff",borderRadius:20,marginBottom:12,overflow:"hidden",border:`0.5px solid ${N.border}`,boxShadow:stratOpen===i?`0 6px 24px ${s.glow}`:"0 2px 8px rgba(0,0,0,0.04)",transition:"box-shadow .3s"}}>
              <div onClick={()=>setStratOpen(stratOpen===i?null:i)} style={{display:"flex",alignItems:"center",gap:12,padding:"15px 16px",cursor:"pointer"}}>
                <div style={{width:44,height:44,borderRadius:14,background:s.grad,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ic n={s.icon||"star"} s={20} c={s.tc}/></div>
                <div style={{flex:1}}><Title size={15}>{s.title}</Title><p style={{fontSize:11,color:N.muted,margin:0,fontFamily:F.body}}>{s.steps.length} passi</p></div>
                <span style={{transform:stratOpen===i?"rotate(90deg)":"none",transition:"transform .2s",display:"inline-flex"}}><Ic n="chevron" s={16} c={N.muted}/></span>
              </div>
              {stratOpen===i&&<div style={{borderTop:`0.5px solid ${N.faint}`,padding:"12px 16px 16px"}}>
                {s.steps.map((step,j)=>(<div key={j} style={{display:"flex",gap:12,padding:"8px 0",borderBottom:j<s.steps.length-1?`0.5px solid ${N.faint}`:"none"}}><div style={{width:24,height:24,borderRadius:8,background:s.grad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:600,color:s.tc,flexShrink:0,fontFamily:F.body}}>{j+1}</div><p style={{fontSize:13,color:N.text,margin:0,lineHeight:1.55,fontFamily:F.body}}>{step}</p></div>))}
                <div style={{marginTop:12,padding:"11px 14px",borderRadius:14,background:s.grad}}><Lbl>RIASSUNTO</Lbl><p style={{fontSize:12,color:s.tc,margin:0,fontFamily:F.body,fontWeight:500}}>{s.summary}</p></div>
              </div>}
            </div>
          ))}
        </div>}

        {/* ── ALTRO home ── */}
        {tab==="altro"&&!subTab&&(
          <div style={{paddingTop:8}}>
            {[
              {k:"ricette",icon:"fork",label:"Ricette & Idee",desc:`${ricette.length} piatti`,grad:"linear-gradient(135deg,#FDFAF2,#F0E4B8)",tc:"#7A5C10"},
              {k:"movimento",icon:"dumbbell",label:"Movimento",desc:`${workouts.length} allenamenti · ${yogaPractices.length} yoga · ${faceYogaPractices.length} face yoga`,grad:"linear-gradient(135deg,#FFF4EE,#FFD5B8)",tc:"#A04010"},
              {k:"proteine",icon:"protein",label:"Rotazione Proteine",desc:"Traccia i limiti settimanali",grad:"linear-gradient(135deg,#F2FAF0,#C8E8B8)",tc:"#2A5A18"},
              {k:"piante",icon:"leaf",label:"20+ piante a settimana",desc:`${Math.round(plantScore*10)/10} punti questa settimana`,grad:"linear-gradient(135deg,#D9F0CE,#B8E0A8)",tc:"#2A5A18"},
              {k:"skincare",icon:"flower",label:"Skincare",desc:"Mattina · Sera A/B/C · prodotti & passi",grad:"linear-gradient(135deg,#FFF0F5,#FFD0E0)",tc:"#A03050"},
              {k:"note",icon:"note",label:"Note & Info utili",desc:"Stagionalità, skincare, integratori",grad:"linear-gradient(135deg,#EDE0FF,#D4C0FF)",tc:"#6B3FA0"},
              {k:"progressi",icon:"chart",label:"Progressi",desc:"Costanza nelle routine",grad:"linear-gradient(135deg,#FFF5EE,#FFD9B8)",tc:"#A04A10"},
              {k:"corpo",icon:"body",label:"Corpo",desc:"Peso, misure & BMI",grad:"linear-gradient(135deg,#F0F5FF,#D8E8FF)",tc:"#2A4090"},
              {k:"journaling",icon:"note",label:"Journaling",desc:"Il tuo diario personale",grad:"linear-gradient(135deg,#F5F0FF,#E4D8FF)",tc:"#6B3FA0"},
            ].map(item=>(
              <div key={item.k} onClick={()=>setSubTab(item.k)} style={{borderRadius:20,padding:"18px 20px",marginBottom:12,background:item.grad,border:`0.5px solid ${N.border}`,cursor:"pointer",display:"flex",alignItems:"center",gap:16}}>
                <div style={{width:52,height:52,borderRadius:16,background:"rgba(255,255,255,0.7)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ic n={item.icon} s={24} c={item.tc}/></div>
                <div style={{flex:1}}><Title size={18} style={{color:item.tc,marginBottom:4}}>{item.label}</Title><p style={{fontSize:12,color:item.tc,opacity:.7,margin:0,fontFamily:F.body}}>{item.desc}</p></div>
                <Ic n="chevron" s={18} c={item.tc}/>
              </div>
            ))}
          </div>
        )}

        {tab==="altro"&&subTab==="proteine"&&<div>
          <p style={{fontSize:12,color:N.muted,fontFamily:F.body,margin:"0 0 14px",lineHeight:1.6}}>Registra le proteine che mangi a pranzo e cena. Le barre si aggiornano in tempo reale e ti avvisano quando ti avvicini al limite settimanale.</p>
          <ProteinTracker weekProteins={weekProteins} onAdd={entry=>S.weekProteins(p=>[...p,{...entry,date:todayKey}])} onUndo={()=>S.weekProteins(p=>p.slice(0,-1))}/>
        </div>}

        {tab==="altro"&&subTab==="piante"&&<PlantsSection thisWeekPlants={thisWeekPlants} plantScore={plantScore} history={plantHistory} onAdd={addPlantFood} onRemove={removePlantFood}/>}

        {tab==="altro"&&subTab==="ricette"&&<div>
          <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}><button onClick={()=>setShowAddRic(true)} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,padding:"5px 12px",borderRadius:20,border:`1px solid ${N.border}`,background:"#fff",color:N.muted,cursor:"pointer",fontFamily:F.body}}><Ic n="plus" s={12} c={N.muted}/>nuovo</button></div>
          <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:8,marginBottom:12,scrollbarWidth:"none"}}>
            {["Tutti","Ricette","Idee Pranzo/Cena","Colazioni & Snack","Carne","Pesce","Uova","Tofu","Legumi","Latticini","Primi","Vegan","Detox","Leggero","Anti-infiamm.","Post-workout","Colazione","Snack"].map(f=><button key={f} onClick={()=>setRicFilter(f)} style={{flexShrink:0,fontSize:11,padding:"5px 12px",borderRadius:20,border:`1px solid ${ricFilter===f?N.text:N.border}`,background:ricFilter===f?N.text:"#fff",color:ricFilter===f?"#fff":N.muted,cursor:"pointer",fontFamily:F.body,fontWeight:ricFilter===f?600:400,whiteSpace:"nowrap"}}>{f}</button>)}
          </div>
          {filtRic.map(r=>(<div key={r.id} style={{borderRadius:20,marginBottom:10,background:"#fff",border:`0.5px solid ${N.border}`,overflow:"hidden"}}>
            <div onClick={()=>setRicOpen(ricOpen===r.id?null:r.id)} style={{padding:"14px 16px",cursor:"pointer"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:r.kcal?8:0}}><Title size={14} style={{flex:1,paddingRight:8}}>{r.name}</Title><div style={{display:"flex",gap:6,alignItems:"center"}}>{r.tag&&<span style={{fontSize:10,padding:"3px 9px",borderRadius:99,background:r.grad,color:r.tc,fontWeight:600,fontFamily:F.body,whiteSpace:"nowrap"}}>{r.tag}</span>}<span style={{transform:ricOpen===r.id?"rotate(90deg)":"none",transition:"transform .2s",display:"inline-flex"}}><Ic n="chevron" s={14} c={N.muted}/></span></div></div>
              {r.kcal&&<div style={{display:"flex",gap:16}}>{[["KCAL",r.kcal],["PROT",r.pro],["CARBO",r.carbo]].map(([l,v])=><div key={l}><Lbl style={{margin:0}}>{l}</Lbl><p style={{fontFamily:F.heading,fontSize:20,fontWeight:600,color:r.tc,margin:0}}>{v}</p></div>)}</div>}
            </div>
            {ricOpen===r.id&&r.ingredienti?.length>0&&<div style={{borderTop:`0.5px solid ${N.faint}`,padding:"12px 16px",background:r.grad}}><Lbl>INGREDIENTI</Lbl>{r.ingredienti.map((ing,i)=>(<div key={i} style={{display:"flex",gap:8,padding:"5px 0",borderBottom:i<r.ingredienti.length-1?`0.5px solid rgba(0,0,0,0.05)`:"none"}}><span style={{color:r.tc,fontSize:11,flexShrink:0,marginTop:2}}>·</span><p style={{fontSize:12,color:N.text,margin:0,fontFamily:F.body,lineHeight:1.4}}>{ing}</p></div>))}</div>}
          </div>))}
        </div>}

        {tab==="altro"&&subTab==="movimento"&&<div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {[["tutti","Tutti"],["allenamento","Allenamenti"],["yoga","Yoga"],["faceyoga","Face Yoga"]].map(([v,l])=>(<button key={v} onClick={()=>setMovFilter(v)} style={{fontSize:11,padding:"5px 12px",borderRadius:20,border:`1px solid ${movFilter===v?N.text:N.border}`,background:movFilter===v?N.text:"#fff",color:movFilter===v?"#fff":N.muted,cursor:"pointer",fontFamily:F.body,fontWeight:movFilter===v?600:400}}>{l}</button>))}
            </div>
            <button onClick={()=>setShowAddMov(true)} style={{display:"flex",alignItems:"center",gap:4,fontSize:11,padding:"5px 12px",borderRadius:20,border:`1px solid ${N.border}`,background:"#fff",color:N.muted,cursor:"pointer",fontFamily:F.body,flexShrink:0}}><Ic n="plus" s={12} c={N.muted}/>nuovo</button>
          </div>
          {filtMov.map(item=>(<div key={item.id} style={{borderRadius:20,marginBottom:12,background:"#fff",border:`0.5px solid ${N.border}`,overflow:"hidden"}}>
            <div onClick={()=>setMovOpen(movOpen===item.id?null:item.id)} style={{padding:"14px 16px",cursor:"pointer",background:movOpen===item.id?item.grad:"#fff",transition:"background .2s"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,flex:1}}>
                  <div style={{width:36,height:36,borderRadius:11,background:item.grad,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ic n={item.type==="faceyoga"?"face":item.type==="yoga"?"yoga":"dumbbell"} s={18} c={item.tc}/></div>
                  <div style={{flex:1}}><Title size={14}>{item.name}</Title>{(item.freq||item.duration)&&<p style={{fontSize:11,color:N.muted,margin:"2px 0 0",fontFamily:F.body}}>{item.duration?`${item.duration} · `:""}{item.freq}</p>}</div>
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <button onClick={e=>{e.stopPropagation();if(item.type==="yoga")S.yoga(p=>p.filter(x=>x.id!==item.id));else if(item.type==="faceyoga")S.faceYoga(p=>p.filter(x=>x.id!==item.id));else S.workouts(p=>p.filter(x=>x.id!==item.id));}} style={{background:"transparent",border:"none",cursor:"pointer",padding:2,opacity:.35}}><Ic n="trash" s={14} c={N.text}/></button>
                  <span style={{transform:movOpen===item.id?"rotate(90deg)":"none",transition:"transform .2s",display:"inline-flex"}}><Ic n="chevron" s={16} c={N.muted}/></span>
                </div>
              </div>
            </div>
            {movOpen===item.id&&<div style={{borderTop:`0.5px solid ${N.faint}`,padding:"14px 16px"}}>
              {item.desc&&<p style={{fontSize:13,color:N.muted,margin:"0 0 14px",fontFamily:F.body,lineHeight:1.6,fontStyle:"italic"}}>{item.desc}</p>}
              {item.sections?.map((sec,si)=>(<div key={si} style={{marginBottom:14}}><Lbl>{sec.title.toUpperCase()}</Lbl>{sec.items.map((ex,ei)=>(<div key={ei} style={{display:"flex",gap:8,padding:"6px 0",borderBottom:ei<sec.items.length-1?`0.5px solid ${N.faint}`:"none"}}><div style={{width:20,height:20,borderRadius:6,background:item.grad,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}><span style={{fontSize:9,fontWeight:700,color:item.tc,fontFamily:F.body}}>{ei+1}</span></div><p style={{fontSize:12,color:N.text,margin:0,lineHeight:1.55,fontFamily:F.body}}>{ex}</p></div>))}</div>))}
              {item.tips?.length>0&&<div style={{background:item.grad,borderRadius:14,padding:"10px 12px",marginTop:8}}><Lbl style={{marginBottom:6}}>CONSIGLI</Lbl>{item.tips.map((t,i)=><p key={i} style={{fontSize:12,color:item.tc,margin:"0 0 4px",fontFamily:F.body,lineHeight:1.5}}>· {t}</p>)}</div>}
            </div>}
          </div>))}
        </div>}

        {tab==="altro"&&subTab==="skincare"&&<div>
          <p style={{fontSize:12,color:N.muted,fontFamily:F.body,margin:"0 0 16px",lineHeight:1.6}}>Le tue routine di skincare giornaliere — prodotti, passi e rotazione settimanale.</p>
          {SKINCARE_ROUTINES.map((r,ri)=>(
            <div key={r.id} style={{borderRadius:20,marginBottom:14,overflow:"hidden",border:`0.5px solid ${N.border}`,background:"#fff"}}>
              {/* Header */}
              <div style={{background:r.grad,padding:"14px 16px 12px"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                  <div style={{width:38,height:38,borderRadius:12,background:"rgba(255,255,255,0.7)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Ic n={r.icon} s={20} c={r.tc}/></div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3}}>
                      <Title size={18} style={{color:r.tc}}>{r.label}</Title>
                      <span style={{fontSize:9,padding:"2px 8px",borderRadius:99,background:r.tagColor,color:r.tagTc,fontFamily:F.body,fontWeight:700}}>{r.tag}</span>
                    </div>
                    <p style={{fontSize:11,color:r.tc,opacity:.75,margin:0,fontFamily:F.body,lineHeight:1.4}}>{r.obiettivo}</p>
                  </div>
                </div>
              </div>
              {/* Steps */}
              <div style={{padding:"4px 16px 14px"}}>
                {r.steps.map((step,si)=>(
                  <div key={si} style={{display:"flex",gap:12,padding:"10px 0",borderBottom:si<r.steps.length-1?`0.5px solid ${N.faint}`:"none"}}>
                    <div style={{width:24,height:24,borderRadius:8,background:r.grad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:r.tc,flexShrink:0,marginTop:1,fontFamily:F.body}}>{si+1}</div>
                    <div style={{flex:1}}>
                      <p style={{fontSize:13,fontWeight:600,color:N.text,margin:"0 0 2px",fontFamily:F.body}}>{step.n}</p>
                      <p style={{fontSize:12,color:N.muted,margin:0,lineHeight:1.55,fontFamily:F.body}}>{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {/* Rotazione badge */}
          <div style={{background:"linear-gradient(135deg,#FDFAF6,#EDE0CC)",borderRadius:18,padding:"14px 16px",marginBottom:14,border:`0.5px solid ${N.border}`}}>
            <Lbl style={{marginBottom:8}}>ROTAZIONE SETTIMANALE</Lbl>
            {[["Lunedì & Giovedì","Sera A — Retinale","#EDE0FF","#6B3FA0"],["Mercoledì","Sera B — Peeling AHA/BHA","#D9F0CE","#2A5A18"],["Mar · Ven · Sab · Dom","Sera C — Idratazione & Face Yoga","#FCDDE5","#A03050"]].map(([g,l,bg,tc])=>(
              <div key={g} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`0.5px solid ${N.faint}`}}>
                <span style={{fontSize:10,padding:"3px 9px",borderRadius:99,background:bg,color:tc,fontFamily:F.body,fontWeight:700,flexShrink:0,whiteSpace:"nowrap"}}>{g}</span>
                <p style={{fontSize:12,color:N.text,margin:0,fontFamily:F.body,fontWeight:500}}>{l}</p>
              </div>
            ))}
          </div>
        </div>}

        {tab==="altro"&&subTab==="note"&&<div>
          <div style={{display:"flex",justifyContent:"flex-end",marginBottom:14}}><button onClick={()=>setShowAddNote(true)} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,padding:"5px 12px",borderRadius:20,border:`1px solid ${N.border}`,background:"#fff",color:N.muted,cursor:"pointer",fontFamily:F.body}}><Ic n="plus" s={12} c={N.muted}/>nuova</button></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {notes.map(n=>(<div key={n.id} onClick={()=>setNoteOpen(noteOpen===n.id?null:n.id)} style={{background:n.color,borderRadius:18,padding:"14px 14px",cursor:"pointer",border:`0.5px solid ${n.tc}22`,gridColumn:noteOpen===n.id?"1 / -1":"auto",transition:"all .2s"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <Ic n={n.icon||"note"} s={18} c={n.tc}/>
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  <button onClick={e=>{e.stopPropagation();setEditNote(n);}} style={{background:"transparent",border:"none",cursor:"pointer",padding:0,opacity:.55}}><Ic n="edit" s={14} c={n.tc}/></button>
                  <button onClick={e=>{e.stopPropagation();S.notes(p=>p.filter(x=>x.id!==n.id));}} style={{background:"transparent",border:"none",cursor:"pointer",padding:0,opacity:.45}}><Ic n="close" s={14} c={n.tc}/></button>
                </div>
              </div>
              <p style={{fontSize:12,fontWeight:600,color:n.tc,margin:"0 0 4px",fontFamily:F.body,lineHeight:1.3}}>{n.title}</p>
              {noteOpen===n.id?<p style={{fontSize:12,color:N.text,margin:0,fontFamily:F.body,lineHeight:1.7}}>{n.content}</p>:<p style={{fontSize:11,color:n.tc,opacity:.7,margin:0,fontFamily:F.body,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{n.content}</p>}
            </div>))}
          </div>
        </div>}

        {tab==="altro"&&subTab==="journaling"&&<JournalingDiary journalEntries={journalEntries} onSave={(dateKey,text)=>S.journalEntries(prev=>({...prev,[dateKey]:text}))}/>}

        {tab==="altro"&&subTab==="corpo"&&<BodySection bodyMeasurements={bodyMeasurements} setBodyMeasurements={v=>S.bodyMeasurements(v)}/>}

        {tab==="altro"&&subTab==="progressi"&&<div>
          <div style={{display:"flex",justifyContent:"flex-end",marginBottom:14}}><button onClick={()=>setShowAddProg(s=>!s)} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,padding:"5px 12px",borderRadius:20,border:`1px solid ${N.border}`,background:"#fff",color:N.muted,cursor:"pointer",fontFamily:F.body}}><Ic n="edit" s={12} c={N.muted}/>Modifica oggi</button></div>

          {progressLog.length>0&&(()=>{
            const last7=progressLog.slice(0,7);
            const avgR=Math.round(last7.reduce((a,p)=>a+(p.routine||0),0)/last7.length);
            // Calcola streak globale: giorni consecutivi con routine ≥80% partendo da oggi
            const sortedLog=[...progressLog].sort((a,b)=>b.date.localeCompare(a.date));
            let streak=0;
            let checkDate=new Date(todayKey+"T12:00:00");
            for(let i=0;i<sortedLog.length;i++){
              const d=sortedLog[i].date;
              const cd=checkDate.toISOString().slice(0,10);
              if(d===cd&&(sortedLog[i].routine||0)>=80){streak++;checkDate.setDate(checkDate.getDate()-1);}
              else if(d<cd) break;
            }
            const totalGood=progressLog.filter(p=>(p.routine||0)>=80).length;
            return(<>
              {streak>0&&<div style={{background:"linear-gradient(135deg,#FFF8E8,#FFE8A0)",borderRadius:20,padding:"16px 18px",marginBottom:12,border:"0.5px solid #E8C840",display:"flex",alignItems:"center",gap:14}}>
                <div style={{fontSize:36,lineHeight:1}}>🔥</div>
                <div style={{flex:1}}>
                  <p style={{fontFamily:F.heading,fontSize:32,fontWeight:600,color:"#A07800",margin:0,lineHeight:1}}>{streak}<span style={{fontSize:14,fontWeight:400}}> {streak===1?"giorno":"giorni"}</span></p>
                  <p style={{fontFamily:F.body,fontSize:11,color:"#A07800",margin:0,opacity:.8}}>streak consecutivi ≥80%</p>
                </div>
                {streak>=7&&<div style={{background:"#A07800",borderRadius:12,padding:"6px 10px",textAlign:"center"}}><p style={{fontSize:10,color:"#FFE8A0",margin:0,fontFamily:F.body,fontWeight:600}}>🏆 {Math.floor(streak/7)}w</p></div>}
              </div>}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
                {[{label:"OGGI",val:`${pct}%`,color:"#FFD5B8",tc:"#A04010"},{label:"MEDIA 7gg",val:`${avgR}%`,color:"#D9F0CE",tc:"#2A5A18"},{label:"TOTALE ≥80%",val:totalGood,color:"#EDE0FF",tc:"#6B3FA0"}].map(x=>(<div key={x.label} style={{background:x.color,borderRadius:16,padding:"12px 12px"}}><Lbl style={{margin:"0 0 4px"}}>{x.label}</Lbl><p style={{fontFamily:F.heading,fontSize:24,fontWeight:600,color:x.tc,margin:0}}>{x.val}</p></div>))}
              </div>
            </>);
          })()}

          {showAddProg&&(
            <Card style={{marginBottom:16}}>
              <Title size={16} style={{marginBottom:12}}>Aggiorna giornata di oggi</Title>
              <Lbl>ENERGIA (1–5)</Lbl>
              <div style={{display:"flex",gap:8,marginBottom:10}}>{[1,2,3,4,5].map(v=><button key={v} onClick={()=>setNewProg(p=>({...p,energia:String(v)}))} style={{flex:1,padding:"8px 0",borderRadius:10,border:`1px solid ${newProg.energia===String(v)?N.text:N.border}`,background:newProg.energia===String(v)?N.text:"transparent",color:newProg.energia===String(v)?"#fff":N.muted,fontSize:13,cursor:"pointer",fontFamily:F.heading,fontWeight:600}}>{v}</button>)}</div>
              <Lbl>UMORE (1–5)</Lbl>
              <div style={{display:"flex",gap:8,marginBottom:10}}>{[1,2,3,4,5].map(v=><button key={v} onClick={()=>setNewProg(p=>({...p,umore:String(v)}))} style={{flex:1,padding:"8px 0",borderRadius:10,border:`1px solid ${newProg.umore===String(v)?N.text:N.border}`,background:newProg.umore===String(v)?N.text:"transparent",color:newProg.umore===String(v)?"#fff":N.muted,fontSize:13,cursor:"pointer",fontFamily:F.heading,fontWeight:600}}>{v}</button>)}</div>
              <Lbl>PESO (kg) — opzionale</Lbl>
              <input value={newProg.peso} onChange={e=>setNewProg(p=>({...p,peso:e.target.value}))} placeholder="Es. 58.5" style={{width:"100%",padding:"9px 12px",borderRadius:11,border:`1px solid ${N.border}`,fontFamily:F.body,fontSize:13,color:N.text,background:N.faint,boxSizing:"border-box",outline:"none",marginBottom:10}}/>
              <Lbl>NOTE</Lbl>
              <textarea value={newProg.note} onChange={e=>setNewProg(p=>({...p,note:e.target.value}))} placeholder="Come ti sei sentita oggi?" rows={2} style={{width:"100%",padding:"9px 12px",borderRadius:11,border:`1px solid ${N.border}`,fontFamily:F.body,fontSize:12,color:N.text,background:N.faint,boxSizing:"border-box",outline:"none",resize:"none",marginBottom:12}}/>
              <button onClick={()=>{
                S.progressLog(prev=>{
                  const idx=prev.findIndex(p=>p.date===todayKey);
                  if(idx>=0){const n=[...prev];n[idx]={...n[idx],...newProg,routine:pct,auto:false};return n;}
                  return [{...newProg,id:"p"+Date.now(),date:todayKey,routine:pct},...prev];
                });
                setShowAddProg(false);
              }} style={{width:"100%",padding:"12px",borderRadius:14,border:"none",background:N.text,color:"#fff",fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:F.body}}>Salva</button>
            </Card>
          )}

          {progressLog.length===0&&<div style={{textAlign:"center",padding:"48px 20px"}}><Ic n="trend" s={40} c={N.faint} style={{display:"block",margin:"0 auto 14px"}}/><Title size={18} style={{color:N.muted,marginBottom:8}}>Nessun dato ancora</Title><p style={{fontSize:13,fontFamily:F.body,color:N.muted,lineHeight:1.6}}>Inizia a spuntare le routine — i progressi si registrano automaticamente.</p></div>}

          {progressLog.length>1&&<Card style={{marginBottom:12}}>
            <Title size={16} style={{marginBottom:4}}>Costanza routine</Title>
            <p style={{fontSize:11,color:N.muted,fontFamily:F.body,margin:"0 0 10px"}}>% obiettivi completati per giorno</p>
            <div style={{display:"flex",alignItems:"flex-end",gap:3,height:72}}>
              {progressLog.slice(0,14).reverse().map((p,i)=>{const v=p.routine||0;const col=v>=80?"#5EA840":v>=50?"#C4980A":"#E8733A";return(<div key={i} style={{flex:1,height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end",gap:2}}><div style={{width:"100%",background:col,borderRadius:"3px 3px 0 0",height:`${v}%`,opacity:.85}}/><span style={{fontSize:8,color:N.muted,fontFamily:F.body}}>{new Date(p.date).getDate()}</span></div>);})}
            </div>
            <div style={{height:"0.5px",background:N.border,margin:"0 0 6px"}}/>
            <div style={{display:"flex",gap:12}}>{[["#5EA840","≥80%"],["#C4980A","≥50%"],["#E8733A","<50%"]].map(([c,l])=>(<div key={l} style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:8,height:8,borderRadius:2,background:c}}/><span style={{fontSize:10,color:N.muted,fontFamily:F.body}}>{l}</span></div>))}</div>
          </Card>}

          {progressLog.length>1&&(()=>{
            // Build list of tracked goals: fixed + extra
            const fixedGoals=[
              {id:"water",label:"Acqua",icon:"drop",color:"#4E8C40",bg:"#D9F0CE"},
              {id:"steps",label:"Passi",icon:"walk",color:"#E8733A",bg:"#FFD5B8"},
              ...(!readMeta.hidden?[{id:"read",label:readMeta.label,icon:readMeta.icon,color:readMeta.tc,bg:readMeta.color}]:[]),
              ...(!alignMeta.hidden?[{id:"align",label:alignMeta.label,icon:alignMeta.icon,color:alignMeta.tc,bg:alignMeta.color}]:[]),
            ];
            // Collect all extra goal ids that appear in any log entry
            const extraIds=new Set();
            progressLog.forEach(p=>{if(p.goals?.extra)Object.keys(p.goals.extra).forEach(k=>extraIds.add(k));});
            const extraGoalDefs=[...extraIds].map(id=>{
              const def=extraGoals.find(g=>g.id===id);
              return def?{id,label:def.label,icon:def.icon||"star",color:def.tc,bg:def.color}:{id,label:id,icon:"star",color:N.muted,bg:N.faint};
            });
            const allTracked=[...fixedGoals,...extraGoalDefs];
            const last14=progressLog.slice(0,14).reverse();
            return(<Card style={{marginBottom:12}}>
              <Title size={16} style={{marginBottom:4}}>Costanza obiettivi</Title>
              <p style={{fontSize:11,color:N.muted,fontFamily:F.body,margin:"0 0 14px"}}>Completamento giornaliero per obiettivo</p>
              {allTracked.map(g=>{
                const vals=last14.map(p=>goalDone(g,p));
                const streak=vals.filter(Boolean).length;
                const pct14=Math.round(streak/vals.length*100);
                return(<div key={g.id} style={{marginBottom:12}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:5}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <Ic n={g.icon} s={13} c={g.color}/>
                      <span style={{fontSize:12,fontFamily:F.body,fontWeight:600,color:N.text}}>{g.label}</span>
                    </div>
                    <span style={{fontSize:11,fontFamily:F.heading,fontWeight:600,color:g.color}}>{streak}/{vals.length} giorni</span>
                  </div>
                  <div style={{display:"flex",gap:3,height:28,alignItems:"flex-end"}}>
                    {last14.map((p,i)=>{
                      let done=goalDone(g,p);
                      return(<div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                        <div style={{width:"100%",height:18,borderRadius:3,background:done?g.color:N.faint,opacity:done?0.85:1,transition:"background .2s"}}/>
                        <span style={{fontSize:7,color:N.muted,fontFamily:F.body}}>{new Date(p.date).getDate()}</span>
                      </div>);
                    })}
                  </div>
                  <div style={{height:3,background:N.faint,borderRadius:99,marginTop:5,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${pct14}%`,background:g.color,borderRadius:99,opacity:.7,transition:"width .4s"}}/>
                  </div>
                </div>);
              })}
            </Card>);
          })()}

          {progressLog.map(p=>(<Card key={p.id||p.date} style={{marginBottom:8}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
              <div><Title size={14}>{new Date(p.date).toLocaleDateString("it-IT",{weekday:"long",day:"numeric",month:"long"})}</Title>{p.auto&&<span style={{fontSize:9,color:N.muted,fontFamily:F.body}}>aggiornamento automatico</span>}</div>
              {!p.auto&&<button onClick={()=>S.progressLog(l=>l.filter(x=>(x.id||x.date)!==(p.id||p.date)))} style={{background:"transparent",border:"none",cursor:"pointer",padding:0,opacity:.35}}><Ic n="trash" s={14} c={N.text}/></button>}
            </div>
            <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:p.note?8:0}}>
              {p.routine!==undefined&&<div><Lbl style={{margin:0}}>ROUTINE</Lbl><p style={{fontFamily:F.heading,fontSize:20,fontWeight:600,color:p.routine>=80?"#5EA840":p.routine>=50?"#C4980A":"#E8733A",margin:0}}>{p.routine}<span style={{fontSize:11,color:N.muted}}>%</span></p></div>}
              {p.energia&&!p.auto&&<div><Lbl style={{margin:0}}>ENERGIA</Lbl><p style={{fontFamily:F.heading,fontSize:20,fontWeight:600,color:"#A04010",margin:0}}>{p.energia}<span style={{fontSize:11,color:N.muted}}>/5</span></p></div>}
              {p.umore&&!p.auto&&<div><Lbl style={{margin:0}}>UMORE</Lbl><p style={{fontFamily:F.heading,fontSize:20,fontWeight:600,color:"#7A5C10",margin:0}}>{p.umore}<span style={{fontSize:11,color:N.muted}}>/5</span></p></div>}
              {p.peso&&<div><Lbl style={{margin:0}}>PESO</Lbl><p style={{fontFamily:F.heading,fontSize:20,fontWeight:600,color:N.text,margin:0}}>{p.peso}<span style={{fontSize:11,color:N.muted}}> kg</span></p></div>}
            </div>
            {p.note&&<p style={{fontSize:12,color:N.muted,margin:0,fontFamily:F.body,lineHeight:1.5,paddingTop:6,borderTop:`0.5px solid ${N.faint}`}}>{p.note}</p>}
          </Card>))}
        </div>}

        </div>
      </div>

      {/* ── BOTTOM NAV ── */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,maxWidth:430,margin:"0 auto",background:"rgba(247,245,240,0.96)",backdropFilter:"blur(24px)",borderTop:`0.5px solid ${N.border}`,zIndex:100}}>
        <div style={{height:3,background:N.faint,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:th.dark,transition:"width .5s",opacity:.6}}/></div>
        <div style={{display:"flex",padding:"8px 0 14px"}}>
          {[{id:"oggi",icon:todayIcon,label:"Oggi"},{id:"cal",icon:"cal",label:"Calendario"},{id:"rituali",icon:"ritual",label:"Rituali"},{id:"altro",icon:"more",label:"Altro"}].map(item=>{
            const active=tab===item.id;
            return(<button key={item.id} onClick={()=>{setTab(item.id);if(item.id!=="altro")setSubTab(null);}} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,background:"none",border:"none",cursor:"pointer",padding:"6px 0"}}>
              <div style={{width:44,height:36,borderRadius:12,background:active?th.grad:"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .25s",border:active?`0.5px solid ${th.dark}22`:"none"}}><Ic n={item.icon} s={20} c={active?th.dark:N.muted}/></div>
              <span style={{fontSize:9,fontWeight:active?700:400,color:active?th.dark:N.muted,fontFamily:F.body,letterSpacing:.4}}>{item.label.toUpperCase()}</span>
            </button>);
          })}
        </div>
      </div>
    </div>
  );
}
