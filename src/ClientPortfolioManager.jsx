import React, { useEffect, useMemo, useState } from "react";
import { Search, Plus, Trash2, Pencil, X, Check, Users, Wallet, LogOut, SkipForward } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

/* ---------------------------------------------------------------
   Constants & helpers
--------------------------------------------------------------- */

const RISK_LEVELS = ["Conservative", "Balanced", "Growth", "Aggressive"];

const RISK_BADGE = {
  Conservative: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
  Balanced: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  Growth: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  Aggressive: "bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/30",
};

const HOLDING_CATEGORIES = ["US Equities", "Crypto"];

const CATEGORY_BADGE = {
  "US Equities": "bg-blue-500/10 text-blue-300 border-blue-500/30",
  "Cash": "bg-slate-500/10 text-slate-300 border-slate-500/30",
  "Crypto": "bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/30",
};

const CATEGORY_COLORS = {
  "US Equities": "#3b82f6",
  "Cash": "#94a3b8",
  "Crypto": "#d946ef",
};

const SLICE_COLORS = ["#fbbf24", "#22d3ee", "#34d399", "#e879f9", "#a78bfa", "#fb923c"];
const CASH_COLOR = "#94a3b8";

const CINEMATIC_LINES = [
  "Gotham's markets never sleep.",
  "By day, capital moves in plain sight.",
  "By night, one guardian keeps watch over every account.",
  "Somewhere, chaos is already placing its bets.",
  "Prepare to take your position.",
];

const BUILDINGS = [
  { x: 0, w: 60, h: 90 }, { x: 60, w: 40, h: 130 }, { x: 100, w: 70, h: 70 }, { x: 170, w: 50, h: 150 },
  { x: 220, w: 90, h: 100 }, { x: 310, w: 40, h: 180 }, { x: 350, w: 60, h: 120 }, { x: 410, w: 100, h: 80 },
  { x: 510, w: 50, h: 160 }, { x: 560, w: 70, h: 110 }, { x: 630, w: 45, h: 140 }, { x: 675, w: 85, h: 95 },
  { x: 760, w: 55, h: 170 }, { x: 815, w: 65, h: 105 }, { x: 880, w: 90, h: 130 }, { x: 970, w: 50, h: 80 },
  { x: 1020, w: 75, h: 150 }, { x: 1095, w: 60, h: 100 }, { x: 1155, w: 45, h: 120 },
];

const fmtUSD0 = (n) =>
  (n || 0).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const fmtUSD2 = (n) =>
  (n || 0).toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPct = (n) => `${n >= 0 ? "+" : ""}${(n || 0).toFixed(1)}%`;

let idSeq = 1000;
const nextId = (prefix) => `${prefix}-${idSeq++}`;

const initialClients = [
  {
    id: "c-1",
    name: "Eleanor Voss",
    since: 2019,
    risk: "Growth",
    cash: 24500,
    holdings: [
      { id: "h-1", ticker: "AAPL", name: "Apple Inc.", category: "US Equities", shares: 120, price: 227.5, cost: 165.3 },
      { id: "h-2", ticker: "MSFT", name: "Microsoft Corp.", category: "US Equities", shares: 60, price: 425.8, cost: 310.0 },
      { id: "h-3", ticker: "NVDA", name: "NVIDIA Corp.", category: "US Equities", shares: 80, price: 118.4, cost: 45.0 },
      { id: "h-4", ticker: "BTC", name: "Bitcoin", category: "Crypto", shares: 1.5, price: 62500, cost: 48000 },
      { id: "h-5", ticker: "ETH", name: "Ethereum", category: "Crypto", shares: 8, price: 3450, cost: 2600 },
    ],
  },
  {
    id: "c-2",
    name: "Marcus Chen",
    since: 2021,
    risk: "Balanced",
    cash: 52000,
    holdings: [
      { id: "h-6", ticker: "VOO", name: "Vanguard S&P 500 ETF", category: "US Equities", shares: 150, price: 545.2, cost: 480.0 },
      { id: "h-7", ticker: "JNJ", name: "Johnson & Johnson", category: "US Equities", shares: 90, price: 156.7, cost: 150.0 },
      { id: "h-8", ticker: "BTC", name: "Bitcoin", category: "Crypto", shares: 0.8, price: 62500, cost: 51000 },
      { id: "h-9", ticker: "SOL", name: "Solana", category: "Crypto", shares: 120, price: 145.0, cost: 95.0 },
    ],
  },
  {
    id: "c-3",
    name: "Priya Anand",
    since: 2023,
    risk: "Conservative",
    cash: 89000,
    holdings: [
      { id: "h-10", ticker: "SCHD", name: "Schwab US Dividend ETF", category: "US Equities", shares: 450, price: 28.4, cost: 26.5 },
      { id: "h-11", ticker: "VTI", name: "Vanguard Total Stock ETF", category: "US Equities", shares: 120, price: 285.1, cost: 250.0 },
      { id: "h-12", ticker: "ETH", name: "Ethereum", category: "Crypto", shares: 3.5, price: 3450, cost: 3100 },
    ],
  },
];

function computeHolding(h) {
  const category = h.category || "US Equities";
  const marketValue = h.shares * h.price;
  const costValue = h.shares * h.cost;
  const gain = marketValue - costValue;
  const gainPct = costValue ? (gain / costValue) * 100 : 0;
  return { ...h, category, marketValue, costValue, gain, gainPct };
}

function computeClient(c) {
  const holdings = c.holdings.map(computeHolding);
  const holdingsValue = holdings.reduce((s, h) => s + h.marketValue, 0);
  const costValue = holdings.reduce((s, h) => s + h.costValue, 0);
  const usEquitiesValue = holdings.filter((h) => h.category === "US Equities").reduce((s, h) => s + h.marketValue, 0);
  const cryptoValue = holdings.filter((h) => h.category === "Crypto").reduce((s, h) => s + h.marketValue, 0);
  const aum = holdingsValue + c.cash;
  const gain = holdingsValue - costValue;
  const gainPct = costValue ? (gain / costValue) * 100 : 0;
  return { ...c, holdings, holdingsValue, costValue, usEquitiesValue, cryptoValue, aum, gain, gainPct };
}

function getAssetClassAllocation(c) {
  if (!c) return [];
  const rows = [];
  if (c.usEquitiesValue > 0) {
    rows.push({ key: "US Equities", label: "US Equities", value: c.usEquitiesValue, color: CATEGORY_COLORS["US Equities"] });
  }
  if (c.cash > 0) {
    rows.push({ key: "Cash", label: "Cash", value: c.cash, color: CATEGORY_COLORS["Cash"] });
  }
  if (c.cryptoValue > 0) {
    rows.push({ key: "Crypto", label: "Crypto", value: c.cryptoValue, color: CATEGORY_COLORS["Crypto"] });
  }
  return rows.sort((a, b) => b.value - a.value);
}

function sliceColorFor(row, i) {
  return row.color || (row.key === "cash" ? CASH_COLOR : SLICE_COLORS[i % SLICE_COLORS.length]);
}

/* Bat = hero gains. Joker = the villain behind every downturn. */
function ImpactBadge({ value, pct, className = "" }) {
  const positive = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold ${positive ? "text-amber-400" : "text-fuchsia-400"} ${className}`}
    >
      <span aria-hidden="true">{positive ? "\u{1F987}" : "\u{1F0CF}"}</span>
      {fmtPct(pct)}
    </span>
  );
}

function GothamSkyline({ className = "" }) {
  return (
    <svg viewBox="0 0 1200 200" preserveAspectRatio="none" className={className} aria-hidden="true">
      {BUILDINGS.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={200 - b.h} width={b.w} height={b.h} fill="#020617" />
          {Array.from({ length: Math.max(2, Math.floor(b.w / 18)) }).map((_, wi) => {
            const wx = b.x + 6 + wi * 16;
            if (wx > b.x + b.w - 8) return null;
            const wy = 200 - b.h + 12 + ((i + wi) % 3) * 22;
            const lit = (i + wi) % 3 !== 0;
            return <rect key={wi} x={wx} y={wy} width="5" height="7" fill={lit ? "#fbbf24" : "#1e293b"} opacity={lit ? 0.75 : 0.4} />;
          })}
        </g>
      ))}
    </svg>
  );
}

/* ---------------------------------------------------------------
   Pre-game screens
--------------------------------------------------------------- */

function SplashScreen({ onBegin }) {
  return (
    <div className="relative flex flex-1 min-h-screen w-full flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-black" />
      <div
        className="absolute right-8 top-8 h-20 w-20 rounded-full bg-amber-100/90"
        style={{ boxShadow: "0 0 70px 25px rgba(253,230,138,.3)" }}
      />
      <GothamSkyline className="absolute bottom-0 left-0 h-1/2 w-full opacity-90" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent" />
      <div className="relative z-10 flex flex-col items-center gap-4 px-6 text-center">
        <span className="text-6xl">🦇</span>
        <h1 className="font-arcade title-glow text-xl text-amber-400 sm:text-3xl">WAYNE WEALTH ARCADE</h1>
        <p className="max-w-sm text-sm text-slate-400">A Gotham-styled trading arcade. Guard every portfolio after dark.</p>
        <button
          type="button"
          onClick={onBegin}
          className="mt-4 rounded-md border-2 border-amber-400 bg-amber-500 px-6 py-2.5 font-arcade text-[11px] text-slate-950 transition hover:bg-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >
          BEGIN GAME
        </button>
      </div>
    </div>
  );
}

function FlappingBat({ className = "", wingSpeed = "0.18s" }) {
  return (
    <div className={`pointer-events-none select-none ${className}`}>
      <svg
        viewBox="0 0 100 60"
        className="h-10 w-16 fill-current text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.85)]"
      >
        <g className="bat-wing-left" style={{ animationDuration: wingSpeed }}>
          <path d="M50 30 Q 30 2 5 14 Q 20 38 35 38 Q 45 42 50 30 Z" />
        </g>
        <g className="bat-wing-right" style={{ animationDuration: wingSpeed }}>
          <path d="M50 30 Q 70 2 95 14 Q 80 38 65 38 Q 55 42 50 30 Z" />
        </g>
        <path d="M46 22 L43 14 L48 18 L52 18 L57 14 L54 22 Q 56 30 50 34 Q 44 30 46 22 Z" />
        <circle cx="47.5" cy="22" r="1.2" fill="#ffffff" />
        <circle cx="52.5" cy="22" r="1.2" fill="#ffffff" />
      </svg>
    </div>
  );
}

function CinematicScreen({ elapsed, onSkip }) {
  const lineIndex = Math.min(CINEMATIC_LINES.length - 1, Math.floor(elapsed / (30 / CINEMATIC_LINES.length)));
  const pct = Math.min(100, (elapsed / 30) * 100);
  return (
    <div className="relative flex flex-1 min-h-screen w-full flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-black to-black" />
      <div aria-hidden="true" className="lightning-flash absolute inset-0 bg-slate-100" />
      <GothamSkyline className="absolute bottom-0 left-0 h-1/2 w-full opacity-70" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent" />
      <FlappingBat className="bat-fly absolute z-10" wingSpeed="0.16s" />
      <FlappingBat className="bat-fly-2 absolute z-10 scale-75 opacity-80" wingSpeed="0.22s" />
      <button
        type="button"
        onClick={onSkip}
        className="absolute right-5 top-5 z-20 flex items-center gap-1.5 rounded border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-amber-400/50 hover:bg-slate-800 hover:text-amber-400"
      >
        <span>Skip</span>
        <SkipForward size={13} className="shrink-0 text-amber-400" />
      </button>
      <div className="relative z-10 max-w-md px-6 text-center">
        <p key={lineIndex} className="fade-line font-arcade text-[12px] leading-relaxed text-amber-300 sm:text-sm">
          {CINEMATIC_LINES[lineIndex]}
        </p>
      </div>
      <div className="absolute bottom-6 left-1/2 h-1 w-56 -translate-x-1/2 overflow-hidden rounded-full bg-slate-800">
        <div className="h-full bg-amber-400" style={{ width: `${pct}%`, transition: "width 250ms linear" }} />
      </div>
    </div>
  );
}

function RoleSelectScreen({ onManager, onClient }) {
  return (
    <div className="relative flex flex-1 min-h-screen w-full flex-col items-center justify-center gap-8 overflow-hidden px-6 py-10 text-center">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 to-black" />
      <GothamSkyline className="absolute bottom-0 left-0 h-1/3 w-full opacity-60" />
      <div className="relative z-10 flex flex-col items-center gap-2">
        <h2 className="font-arcade text-sm text-amber-400 sm:text-base">CHOOSE YOUR ROLE</h2>
        <p className="text-sm text-slate-400">How will you play tonight?</p>
      </div>
      <div className="relative z-10 grid w-full max-w-2xl grid-cols-1 gap-5 sm:grid-cols-2">
        <button
          type="button"
          onClick={onManager}
          className="flex flex-col items-center gap-3 rounded-xl border-2 border-amber-400/60 bg-slate-900/70 p-6 transition hover:border-amber-400 hover:bg-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
        >
          <span className="text-4xl">🦇</span>
          <span className="font-arcade text-[11px] text-amber-400">PORTFOLIO MANAGER</span>
          <span className="text-xs text-slate-400">Manage every client. Add holdings, track performance, run the whole book.</span>
        </button>
        <button
          type="button"
          onClick={onClient}
          className="flex flex-col items-center gap-3 rounded-xl border-2 border-fuchsia-400/50 bg-slate-900/70 p-6 transition hover:border-fuchsia-400 hover:bg-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-300"
        >
          <span className="text-4xl">🕴️</span>
          <span className="font-arcade text-[11px] text-fuchsia-300">CLIENT</span>
          <span className="text-xs text-slate-400">View your own portfolio exactly as your manager sees it.</span>
        </button>
      </div>
    </div>
  );
}

function ClientSelectScreen({ clients, onPick, onBack }) {
  return (
    <div className="relative flex flex-1 min-h-screen w-full flex-col items-center gap-6 overflow-hidden px-6 py-10">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 to-black" />
      <div className="relative z-10 flex w-full max-w-3xl items-center justify-between">
        <button type="button" onClick={onBack} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200">
          <LogOut size={13} className="rotate-180" /> Back
        </button>
        <h2 className="font-arcade text-sm text-amber-400">SELECT YOUR ACCOUNT</h2>
        <span className="w-10" />
      </div>
      <div className="relative z-10 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
        {clients.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onPick(c.id)}
            className="flex flex-col items-center gap-2 rounded-xl border-2 border-slate-700 bg-slate-900/70 p-5 text-center transition hover:border-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          >
            <span className="text-3xl">🕴️</span>
            <span className="text-sm font-medium text-slate-100">{c.name}</span>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] ${RISK_BADGE[c.risk]}`}>{c.risk}</span>
            <span className="font-score text-lg text-slate-300">{fmtUSD0(c.aum)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ClientReadOnlyScreen({ client, onBack, onExit }) {
  const chartData = useMemo(() => getAssetClassAllocation(client), [client]);
  const chartTotal = chartData.reduce((s, r) => s + r.value, 0);

  if (!client) return null;

  return (
    <div className="p-5 flex-1 min-h-screen">
      <div className="mb-4 flex items-center justify-between">
        <button type="button" onClick={onBack} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200">
          <LogOut size={13} className="rotate-180" /> Switch account
        </button>
        <button type="button" onClick={onExit} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200">
          <LogOut size={13} /> Exit to menu
        </button>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-2.5">
            <h2 className="text-2xl font-semibold text-slate-100">{client.name}</h2>
            <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${RISK_BADGE[client.risk]}`}>{client.risk}</span>
          </div>
          <div className="mt-1 text-sm text-slate-500">Client since {client.since} — read-only view</div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-slate-700 bg-slate-700 sm:grid-cols-5">
        <div className="bg-slate-900 p-3.5">
          <div className="text-xs text-slate-500">Total AUM</div>
          <div className="font-score mt-1 text-2xl text-slate-100">{fmtUSD0(client.aum)}</div>
        </div>
        <div className="bg-slate-900 p-3.5">
          <div className="text-xs text-blue-400 font-medium">US Equities</div>
          <div className="font-score mt-1 text-2xl text-slate-100">{fmtUSD0(client.usEquitiesValue)}</div>
        </div>
        <div className="bg-slate-900 p-3.5">
          <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
            <Wallet size={12} /> Cash reserve
          </div>
          <div className="font-score mt-1 text-2xl text-slate-100">{fmtUSD0(client.cash)}</div>
        </div>
        <div className="bg-slate-900 p-3.5">
          <div className="text-xs text-fuchsia-400 font-medium">Crypto</div>
          <div className="font-score mt-1 text-2xl text-slate-100">{fmtUSD0(client.cryptoValue)}</div>
        </div>
        <div className="bg-slate-900 p-3.5 col-span-2 sm:col-span-1">
          <div className="text-xs text-slate-500">Unrealized gain / loss</div>
          <div className={`font-score mt-1 text-2xl ${client.gain >= 0 ? "text-amber-400" : "text-fuchsia-400"}`}>
            {fmtPct(client.gainPct)}
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h3 className="font-arcade mb-2 text-[11px] text-amber-400">HOLDINGS</h3>
          {client.holdings.length === 0 ? (
            <div className="rounded-md border border-dashed border-slate-700 p-6 text-center text-sm text-slate-500">
              No holdings on record.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border border-slate-700">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900 text-left text-xs text-slate-500">
                    <th className="px-3 py-2 font-medium">Ticker</th>
                    <th className="px-3 py-2 font-medium text-right">Shares</th>
                    <th className="px-3 py-2 font-medium text-right">Price</th>
                    <th className="px-3 py-2 font-medium text-right">Market value</th>
                    <th className="px-3 py-2 font-medium text-right">Weight</th>
                    <th className="px-3 py-2 font-medium text-right">Gain / loss</th>
                  </tr>
                </thead>
                <tbody>
                  {client.holdings.map((h) => {
                    const weight = client.holdingsValue ? (h.marketValue / client.holdingsValue) * 100 : 0;
                    return (
                      <tr key={h.id} className="border-b border-slate-800 bg-slate-900/40 last:border-b-0">
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="font-score text-base font-semibold text-slate-100">{h.ticker}</span>
                            <span className={`rounded-full border px-1.5 py-0.5 text-[10px] ${CATEGORY_BADGE[h.category]}`}>{h.category}</span>
                          </div>
                          <div className="text-xs text-slate-500">{h.name}</div>
                        </td>
                        <td className="px-3 py-2 text-right font-score text-base text-slate-200">{h.shares.toLocaleString("en-US")}</td>
                        <td className="px-3 py-2 text-right font-score text-base text-slate-200">{fmtUSD2(h.price)}</td>
                        <td className="px-3 py-2 text-right font-score text-base font-medium text-slate-100">{fmtUSD0(h.marketValue)}</td>
                        <td className="px-3 py-2 text-right font-score text-base text-slate-500">{weight.toFixed(1)}%</td>
                        <td className="px-3 py-2 text-right">
                          <ImpactBadge value={h.gain} pct={h.gainPct} className="justify-end" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div>
          <h3 className="font-arcade mb-2 text-[11px] text-amber-400">ALLOCATION</h3>
          <div className="rounded-md border border-slate-700 bg-slate-900 p-4">
            {chartData.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-500">No allocation data yet.</div>
            ) : (
              <>
                <div style={{ width: "100%", height: 200 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={chartData} dataKey="value" nameKey="label" innerRadius={55} outerRadius={85} paddingAngle={2}>
                        {chartData.map((row, i) => (
                          <Cell key={row.key} fill={sliceColorFor(row, i)} stroke="#020617" strokeWidth={1} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => fmtUSD0(value)} contentStyle={{ background: "#0f172a", border: "1px solid #334155", color: "#e2e8f0" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 flex flex-col gap-1.5">
                  {chartData.map((row, i) => (
                    <div key={row.key} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: sliceColorFor(row, i) }} />
                        <span className="text-slate-300">{row.label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-score text-base text-slate-400">{fmtUSD0(row.value)}</span>
                        <span className="font-score w-12 text-right text-base text-slate-500">
                          {chartTotal ? ((row.value / chartTotal) * 100).toFixed(0) : 0}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   Main component
--------------------------------------------------------------- */

export default function ClientPortfolioManager() {
  const [screen, setScreen] = useState("splash");
  const [clientViewId, setClientViewId] = useState(null);
  const [cinematicElapsed, setCinematicElapsed] = useState(0);

  const [clients, setClients] = useState(initialClients);
  const [selectedId, setSelectedId] = useState(initialClients[0]?.id ?? null);
  const [search, setSearch] = useState("");

  const [showAddClient, setShowAddClient] = useState(false);
  const [newClient, setNewClient] = useState({ name: "", since: new Date().getFullYear(), risk: "Balanced", cash: "" });

  const [showAddHolding, setShowAddHolding] = useState(false);
  const [newHolding, setNewHolding] = useState({ ticker: "", name: "", category: "US Equities", shares: "", price: "", cost: "" });

  const [pendingDeleteClient, setPendingDeleteClient] = useState(null);
  const [pendingDeleteHolding, setPendingDeleteHolding] = useState(null);

  const [editingHoldingId, setEditingHoldingId] = useState(null);
  const [editValues, setEditValues] = useState({ shares: "", price: "" });

  useEffect(() => {
    if (screen !== "cinematic") return undefined;
    setCinematicElapsed(0);
    const start = Date.now();
    const tick = setInterval(() => {
      setCinematicElapsed(Math.min(30, Math.round((Date.now() - start) / 1000)));
    }, 250);
    const done = setTimeout(() => setScreen("roleSelect"), 30000);
    return () => {
      clearInterval(tick);
      clearTimeout(done);
    };
  }, [screen]);

  const computedClients = useMemo(() => clients.map(computeClient), [clients]);
  const filteredClients = useMemo(
    () => computedClients.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())),
    [computedClients, search]
  );
  const selectedClient = computedClients.find((c) => c.id === selectedId) || null;
  const firmAUM = computedClients.reduce((s, c) => s + c.aum, 0);

  /* ---------------- client actions ---------------- */

  function submitNewClient() {
    if (!newClient.name.trim()) return;
    const client = {
      id: nextId("c"),
      name: newClient.name.trim(),
      since: Number(newClient.since) || new Date().getFullYear(),
      risk: newClient.risk,
      cash: Number(newClient.cash) || 0,
      holdings: [],
    };
    setClients((prev) => [...prev, client]);
    setSelectedId(client.id);
    setNewClient({ name: "", since: new Date().getFullYear(), risk: "Balanced", cash: "" });
    setShowAddClient(false);
  }

  function removeClient(id) {
    setClients((prev) => prev.filter((c) => c.id !== id));
    setPendingDeleteClient(null);
    if (selectedId === id) setSelectedId(null);
  }

  /* ---------------- holding actions ---------------- */

  function submitNewHolding() {
    if (!selectedClient || !newHolding.ticker.trim()) return;
    const holding = {
      id: nextId("h"),
      ticker: newHolding.ticker.trim().toUpperCase(),
      name: newHolding.name.trim() || newHolding.ticker.trim().toUpperCase(),
      category: newHolding.category || "US Equities",
      shares: Number(newHolding.shares) || 0,
      price: Number(newHolding.price) || 0,
      cost: Number(newHolding.cost) || Number(newHolding.price) || 0,
    };
    setClients((prev) =>
      prev.map((c) => (c.id === selectedClient.id ? { ...c, holdings: [...c.holdings, holding] } : c))
    );
    setNewHolding({ ticker: "", name: "", category: "US Equities", shares: "", price: "", cost: "" });
    setShowAddHolding(false);
  }

  function removeHolding(clientId, holdingId) {
    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, holdings: c.holdings.filter((h) => h.id !== holdingId) } : c))
    );
    setPendingDeleteHolding(null);
  }

  function startEdit(h) {
    setEditingHoldingId(h.id);
    setEditValues({ shares: String(h.shares), price: String(h.price) });
  }

  function saveEdit(clientId, holdingId) {
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? {
              ...c,
              holdings: c.holdings.map((h) =>
                h.id === holdingId
                  ? { ...h, shares: Number(editValues.shares) || 0, price: Number(editValues.price) || 0 }
                  : h
              ),
            }
          : c
      )
    );
    setEditingHoldingId(null);
  }

  /* ---------------- chart data (manager view) ---------------- */

  const chartData = useMemo(() => getAssetClassAllocation(selectedClient), [selectedClient]);

  const chartTotal = chartData.reduce((s, r) => s + r.value, 0);

  /* ---------------------------------------------------------------
     Render
  --------------------------------------------------------------- */

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
        .font-arcade { font-family: 'Press Start 2P', monospace; }
        .font-score { font-family: 'VT323', monospace; font-variant-numeric: tabular-nums; }
        .cabinet-frame {
          box-shadow: inset 0 0 80px rgba(0,0,0,.7);
        }
        .scanlines {
          background-image: repeating-linear-gradient(rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 1px, transparent 1px, transparent 3px);
        }
        .title-glow { text-shadow: 0 0 6px rgba(251,191,36,.9), 0 0 22px rgba(251,191,36,.45); }
        @keyframes blinker { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
        .blink-cursor { animation: blinker 1s steps(1) infinite; }
        @keyframes fadeline { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .fade-line { animation: fadeline 0.6s ease; }
        @keyframes lightningflash {
          0%, 92%, 100% { opacity: 0; }
          93% { opacity: 0.5; }
          94% { opacity: 0; }
          96% { opacity: 0.3; }
          97% { opacity: 0; }
        }
        .lightning-flash { animation: lightningflash 7s linear infinite; }
        @keyframes batSwoop {
          0% { transform: translate(-15vw, 42vh) scale(0.5) rotate(-14deg); opacity: 0; }
          12% { opacity: 0.95; }
          38% { transform: translate(32vw, 12vh) scale(0.9) rotate(12deg); }
          68% { transform: translate(68vw, 26vh) scale(1.2) rotate(-16deg); }
          88% { opacity: 0.95; }
          100% { transform: translate(118vw, 4vh) scale(1.65) rotate(20deg); opacity: 0; }
        }
        @keyframes batSwoop2 {
          0% { transform: translate(-20vw, 18vh) scale(0.35) rotate(16deg); opacity: 0; }
          15% { opacity: 0.85; }
          52% { transform: translate(48vw, 36vh) scale(0.65) rotate(-12deg); }
          84% { opacity: 0.85; }
          100% { transform: translate(112vw, 12vh) scale(0.95) rotate(14deg); opacity: 0; }
        }
        @keyframes wingFlapLeft {
          0% { transform: rotate(0deg) scaleY(1); }
          50% { transform: rotate(-36deg) scaleY(0.35); }
          100% { transform: rotate(18deg) scaleY(1.15); }
        }
        @keyframes wingFlapRight {
          0% { transform: rotate(0deg) scaleY(1); }
          50% { transform: rotate(36deg) scaleY(0.35); }
          100% { transform: rotate(-18deg) scaleY(1.15); }
        }
        .bat-wing-left {
          transform-origin: 50px 30px;
          animation: wingFlapLeft 0.18s ease-in-out infinite alternate;
        }
        .bat-wing-right {
          transform-origin: 50px 30px;
          animation: wingFlapRight 0.18s ease-in-out infinite alternate;
        }
        .bat-fly { animation: batSwoop 6.5s cubic-bezier(0.4, 0, 0.6, 1) infinite; top: 8%; left: 0; }
        .bat-fly-2 { animation: batSwoop2 8.8s cubic-bezier(0.45, 0, 0.55, 1) 2.2s infinite; top: 4%; left: 0; }
        @media (prefers-reduced-motion: reduce) {
          .lightning-flash, .bat-fly, .bat-fly-2 { animation: none !important; opacity: 0; }
          .blink-cursor { animation: none !important; opacity: 1; }
          .fade-line { animation: none !important; }
        }
      `}</style>

      <div className="relative w-full flex-1 min-h-screen overflow-hidden bg-slate-950 cabinet-frame flex flex-col">
        <div className="pointer-events-none absolute inset-0 z-20 scanlines" />

        {screen === "splash" && <SplashScreen onBegin={() => setScreen("cinematic")} />}

        {screen === "cinematic" && (
          <CinematicScreen elapsed={cinematicElapsed} onSkip={() => setScreen("roleSelect")} />
        )}

        {screen === "roleSelect" && (
          <RoleSelectScreen onManager={() => setScreen("manager")} onClient={() => setScreen("clientSelect")} />
        )}

        {screen === "clientSelect" && (
          <ClientSelectScreen
            clients={computedClients}
            onPick={(id) => {
              setClientViewId(id);
              setScreen("client");
            }}
            onBack={() => setScreen("roleSelect")}
          />
        )}

        {screen === "client" && (
          <ClientReadOnlyScreen
            client={computedClients.find((c) => c.id === clientViewId) || null}
            onBack={() => setScreen("clientSelect")}
            onExit={() => setScreen("roleSelect")}
          />
        )}

        {screen === "manager" && (
          <>
            {/* Top bar */}
            <div className="relative z-10 border-b border-amber-500/20 bg-slate-900/80">
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl" role="img" aria-label="Bat">🦇</span>
                    <span className="font-arcade title-glow text-[13px] text-amber-400 sm:text-base">WAYNE WEALTH ARCADE</span>
                  </div>
                  <div className="mt-1.5 text-xs text-slate-400">Portfolio manager: the Dark Knight himself, keeping Gotham's capital safe after dark.</div>
                </div>
                <div className="flex flex-wrap items-center gap-5">
                  <div className="flex items-center gap-1.5 text-sm text-slate-400">
                    <Users size={15} />
                    <span>{computedClients.length} clients</span>
                  </div>
                  <div className="text-sm text-slate-400">
                    Gotham AUM{" "}
                    <span className="font-score text-xl text-amber-400">{fmtUSD0(firmAUM)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddClient((v) => !v)}
                    className="flex items-center gap-1.5 rounded-md border-2 border-amber-400 bg-amber-500 px-3 py-1.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                  >
                    <Plus size={15} /> New client
                  </button>
                  <button
                    type="button"
                    onClick={() => setScreen("roleSelect")}
                    className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200"
                  >
                    <LogOut size={14} /> Switch role
                  </button>
                </div>
              </div>

              {showAddClient && (
                <div className="border-t border-amber-500/20 bg-slate-900 px-5 py-4">
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-slate-400">Client name</label>
                      <input
                        value={newClient.name}
                        onChange={(e) => setNewClient((v) => ({ ...v, name: e.target.value }))}
                        placeholder="Full name"
                        className="w-48 rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-slate-400">Client since</label>
                      <input
                        type="number"
                        value={newClient.since}
                        onChange={(e) => setNewClient((v) => ({ ...v, since: e.target.value }))}
                        className="font-score w-24 rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-base text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-slate-400">Risk profile</label>
                      <select
                        value={newClient.risk}
                        onChange={(e) => setNewClient((v) => ({ ...v, risk: e.target.value }))}
                        className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                      >
                        {RISK_LEVELS.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-slate-400">Starting cash</label>
                      <input
                        type="number"
                        value={newClient.cash}
                        onChange={(e) => setNewClient((v) => ({ ...v, cash: e.target.value }))}
                        placeholder="0"
                        className="font-score w-32 rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-base text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={submitNewClient}
                      className="rounded-md border-2 border-amber-400 bg-amber-500 px-3 py-1.5 text-sm font-semibold text-slate-950 hover:bg-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                    >
                      Add client
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddClient(false)}
                      className="rounded-md border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Body */}
            <div className="relative z-10 flex min-h-0 flex-1 flex-col md:flex-row">
              {/* Rail */}
              <div className="w-full border-b border-amber-500/10 bg-slate-900/50 md:flex md:w-72 md:flex-col md:border-b-0 md:border-r">
                <div className="p-3">
                  <div className="relative">
                    <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search clients"
                      className="w-full rounded-md border border-slate-700 bg-slate-950 py-1.5 pl-8 pr-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                    />
                  </div>
                </div>
                <div className="overflow-y-auto md:min-h-0 md:flex-1 md:max-h-none">
                  {filteredClients.length === 0 && (
                    <div className="px-4 py-6 text-sm text-slate-500">No clients match your search.</div>
                  )}
                  {filteredClients.map((c) => {
                    const active = c.id === selectedId;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedId(c.id)}
                        className={`flex w-full items-center justify-between gap-2 border-l-2 px-4 py-3 text-left transition focus:outline-none ${
                          active ? "border-amber-400 bg-amber-500/10" : "border-transparent hover:bg-slate-800/60"
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="truncate text-[15px] font-medium text-slate-100">{c.name}</div>
                          <div className="font-score text-base text-slate-400">{fmtUSD0(c.aum)}</div>
                        </div>
                        <ImpactBadge value={c.gain} pct={c.gainPct} className="shrink-0 text-xs" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Detail panel */}
              <div className="min-h-0 flex-1 overflow-y-auto p-5">
                {!selectedClient ? (
                  <div className="flex h-full min-h-[50vh] flex-col items-center justify-center gap-2 text-center">
                    <span className="text-4xl">🦇</span>
                    <p className="mt-2 text-slate-400">No client selected.</p>
                    <p className="text-slate-400">Choose a name from the roster, or recruit a new client to begin.</p>
                    <p className="font-arcade mt-4 text-[11px] text-amber-400">
                      PRESS START <span className="blink-cursor">▮</span>
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {/* Header */}
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-baseline gap-2.5">
                          <h2 className="text-2xl font-semibold text-slate-100">{selectedClient.name}</h2>
                          <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${RISK_BADGE[selectedClient.risk]}`}>
                            {selectedClient.risk}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-slate-500">Client since {selectedClient.since}</div>
                      </div>

                      {pendingDeleteClient === selectedClient.id ? (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-slate-400">Remove this client and all holdings?</span>
                          <button
                            type="button"
                            onClick={() => removeClient(selectedClient.id)}
                            className="rounded-md bg-fuchsia-600 px-2.5 py-1 text-white hover:bg-fuchsia-500"
                          >
                            Yes, remove
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDeleteClient(null)}
                            className="rounded-md border border-slate-600 px-2.5 py-1 text-slate-300 hover:bg-slate-800"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPendingDeleteClient(selectedClient.id)}
                          className="flex items-center gap-1 text-sm text-slate-500 hover:text-fuchsia-400"
                        >
                          <Trash2 size={14} /> Remove client
                        </button>
                      )}
                    </div>

                    {/* Summary strip */}
                    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-slate-700 bg-slate-700 sm:grid-cols-5">
                      <div className="bg-slate-900 p-3.5">
                        <div className="text-xs text-slate-500">Total AUM</div>
                        <div className="font-score mt-1 text-2xl text-slate-100">{fmtUSD0(selectedClient.aum)}</div>
                      </div>
                      <div className="bg-slate-900 p-3.5">
                        <div className="text-xs text-blue-400 font-medium">US Equities</div>
                        <div className="font-score mt-1 text-2xl text-slate-100">{fmtUSD0(selectedClient.usEquitiesValue)}</div>
                      </div>
                      <div className="bg-slate-900 p-3.5">
                        <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                          <Wallet size={12} /> Cash reserve
                        </div>
                        <div className="font-score mt-1 text-2xl text-slate-100">{fmtUSD0(selectedClient.cash)}</div>
                      </div>
                      <div className="bg-slate-900 p-3.5">
                        <div className="text-xs text-fuchsia-400 font-medium">Crypto</div>
                        <div className="font-score mt-1 text-2xl text-slate-100">{fmtUSD0(selectedClient.cryptoValue)}</div>
                      </div>
                      <div className="bg-slate-900 p-3.5 col-span-2 sm:col-span-1">
                        <div className="text-xs text-slate-500">Unrealized gain / loss</div>
                        <div className="mt-1 flex items-baseline gap-2">
                          <span className={`font-score text-2xl ${selectedClient.gain >= 0 ? "text-amber-400" : "text-fuchsia-400"}`}>
                            {fmtPct(selectedClient.gainPct)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Holdings + allocation */}
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                      {/* Holdings table */}
                      <div className="lg:col-span-2">
                        <div className="mb-2 flex items-center justify-between">
                          <h3 className="font-arcade text-[11px] text-amber-400">HOLDINGS</h3>
                          <button
                            type="button"
                            onClick={() => setShowAddHolding((v) => !v)}
                            className="flex items-center gap-1 rounded-md border border-amber-400 px-2.5 py-1 text-xs font-medium text-amber-400 hover:bg-amber-500/10"
                          >
                            <Plus size={13} /> Add holding
                          </button>
                        </div>

                        {showAddHolding && (
                          <div className="mb-3 flex flex-wrap items-end gap-2 rounded-md border border-slate-700 bg-slate-900 p-3">
                            <div className="flex flex-col gap-1">
                              <label className="text-xs text-slate-400">Ticker</label>
                              <input
                                value={newHolding.ticker}
                                onChange={(e) => setNewHolding((v) => ({ ...v, ticker: e.target.value }))}
                                className="w-20 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm uppercase text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs text-slate-400">Name</label>
                              <input
                                value={newHolding.name}
                                onChange={(e) => setNewHolding((v) => ({ ...v, name: e.target.value }))}
                                className="w-36 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs text-slate-400">Category</label>
                              <select
                                value={newHolding.category}
                                onChange={(e) => setNewHolding((v) => ({ ...v, category: e.target.value }))}
                                className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                              >
                                {HOLDING_CATEGORIES.map((cat) => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs text-slate-400">Shares</label>
                              <input
                                type="number"
                                value={newHolding.shares}
                                onChange={(e) => setNewHolding((v) => ({ ...v, shares: e.target.value }))}
                                className="font-score w-20 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-right text-base text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs text-slate-400">Price</label>
                              <input
                                type="number"
                                value={newHolding.price}
                                onChange={(e) => setNewHolding((v) => ({ ...v, price: e.target.value }))}
                                className="font-score w-24 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-right text-base text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs text-slate-400">Cost basis</label>
                              <input
                                type="number"
                                value={newHolding.cost}
                                onChange={(e) => setNewHolding((v) => ({ ...v, cost: e.target.value }))}
                                className="font-score w-24 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-right text-base text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={submitNewHolding}
                              className="rounded-md border-2 border-amber-400 bg-amber-500 px-3 py-1.5 text-sm font-semibold text-slate-950 hover:bg-amber-400"
                            >
                              Add
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowAddHolding(false)}
                              className="rounded-md border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
                            >
                              Cancel
                            </button>
                          </div>
                        )}

                        {selectedClient.holdings.length === 0 ? (
                          <div className="rounded-md border border-dashed border-slate-700 p-6 text-center text-sm text-slate-500">
                            No holdings yet. Add the first position for {selectedClient.name}.
                          </div>
                        ) : (
                          <div className="overflow-x-auto rounded-md border border-slate-700">
                            <table className="w-full min-w-[640px] text-sm">
                              <thead>
                                <tr className="border-b border-slate-700 bg-slate-900 text-left text-xs text-slate-500">
                                  <th className="px-3 py-2 font-medium">Ticker</th>
                                  <th className="px-3 py-2 font-medium text-right">Shares</th>
                                  <th className="px-3 py-2 font-medium text-right">Price</th>
                                  <th className="px-3 py-2 font-medium text-right">Cost basis</th>
                                  <th className="px-3 py-2 font-medium text-right">Market value</th>
                                  <th className="px-3 py-2 font-medium text-right">Weight</th>
                                  <th className="px-3 py-2 font-medium text-right">Gain / loss</th>
                                  <th className="px-3 py-2"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedClient.holdings.map((h) => {
                                  const editing = editingHoldingId === h.id;
                                  const shares = editing ? Number(editValues.shares) || 0 : h.shares;
                                  const price = editing ? Number(editValues.price) || 0 : h.price;
                                  const marketValue = shares * price;
                                  const costValue = shares * h.cost;
                                  const gain = marketValue - costValue;
                                  const gainPct = costValue ? (gain / costValue) * 100 : 0;
                                  const weight = selectedClient.holdingsValue ? (marketValue / selectedClient.holdingsValue) * 100 : 0;
                                  const confirming = pendingDeleteHolding === h.id;

                                  return (
                                    <tr key={h.id} className="border-b border-slate-800 bg-slate-900/40 last:border-b-0">
                                      <td className="px-3 py-2">
                                        <div className="flex items-center gap-2">
                                          <span className="font-score text-base font-semibold text-slate-100">{h.ticker}</span>
                                          <span className={`rounded-full border px-1.5 py-0.5 text-[10px] ${CATEGORY_BADGE[h.category]}`}>{h.category}</span>
                                        </div>
                                        <div className="text-xs text-slate-500">{h.name}</div>
                                      </td>
                                      <td className="px-3 py-2 text-right font-score text-base text-slate-200">
                                        {editing ? (
                                          <input
                                            type="number"
                                            value={editValues.shares}
                                            onChange={(e) => setEditValues((v) => ({ ...v, shares: e.target.value }))}
                                            className="w-20 rounded-md border border-slate-700 bg-slate-950 px-1.5 py-1 text-right text-sm text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                                          />
                                        ) : (
                                          h.shares.toLocaleString("en-US")
                                        )}
                                      </td>
                                      <td className="px-3 py-2 text-right font-score text-base text-slate-200">
                                        {editing ? (
                                          <input
                                            type="number"
                                            value={editValues.price}
                                            onChange={(e) => setEditValues((v) => ({ ...v, price: e.target.value }))}
                                            className="w-24 rounded-md border border-slate-700 bg-slate-950 px-1.5 py-1 text-right text-sm text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                                          />
                                        ) : (
                                          fmtUSD2(h.price)
                                        )}
                                      </td>
                                      <td className="px-3 py-2 text-right font-score text-base text-slate-500">{fmtUSD2(h.cost)}</td>
                                      <td className="px-3 py-2 text-right font-score text-base font-medium text-slate-100">{fmtUSD0(marketValue)}</td>
                                      <td className="px-3 py-2 text-right font-score text-base text-slate-500">{weight.toFixed(1)}%</td>
                                      <td className="px-3 py-2 text-right">
                                        <ImpactBadge value={gain} pct={gainPct} className="justify-end" />
                                      </td>
                                      <td className="px-3 py-2">
                                        {editing ? (
                                          <div className="flex items-center gap-1.5">
                                            <button
                                              type="button"
                                              aria-label="Save"
                                              onClick={() => saveEdit(selectedClient.id, h.id)}
                                              className="rounded p-1 text-amber-400 hover:bg-amber-500/10"
                                            >
                                              <Check size={15} />
                                            </button>
                                            <button
                                              type="button"
                                              aria-label="Cancel"
                                              onClick={() => setEditingHoldingId(null)}
                                              className="rounded p-1 text-slate-400 hover:bg-slate-800"
                                            >
                                              <X size={15} />
                                            </button>
                                          </div>
                                        ) : confirming ? (
                                          <div className="flex items-center gap-1 whitespace-nowrap text-xs">
                                            <button
                                              type="button"
                                              onClick={() => removeHolding(selectedClient.id, h.id)}
                                              className="rounded bg-fuchsia-600 px-2 py-1 text-white hover:bg-fuchsia-500"
                                            >
                                              Remove
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => setPendingDeleteHolding(null)}
                                              className="rounded border border-slate-600 px-2 py-1 text-slate-300 hover:bg-slate-800"
                                            >
                                              No
                                            </button>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-1.5">
                                            <button
                                              type="button"
                                              aria-label="Edit holding"
                                              onClick={() => startEdit(h)}
                                              className="rounded p-1 text-slate-400 hover:bg-slate-800"
                                            >
                                              <Pencil size={14} />
                                            </button>
                                            <button
                                              type="button"
                                              aria-label="Remove holding"
                                              onClick={() => setPendingDeleteHolding(h.id)}
                                              className="rounded p-1 text-slate-400 hover:bg-fuchsia-500/10 hover:text-fuchsia-400"
                                            >
                                              <Trash2 size={14} />
                                            </button>
                                          </div>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      {/* Allocation */}
                      <div>
                        <h3 className="font-arcade mb-2 text-[11px] text-amber-400">ALLOCATION</h3>
                        <div className="rounded-md border border-slate-700 bg-slate-900 p-4">
                          {chartData.length === 0 ? (
                            <div className="py-10 text-center text-sm text-slate-500">No allocation data yet.</div>
                          ) : (
                            <>
                              <div style={{ width: "100%", height: 200 }}>
                                <ResponsiveContainer>
                                  <PieChart>
                                    <Pie data={chartData} dataKey="value" nameKey="label" innerRadius={55} outerRadius={85} paddingAngle={2}>
                                      {chartData.map((row, i) => (
                                        <Cell key={row.key} fill={sliceColorFor(row, i)} stroke="#020617" strokeWidth={1} />
                                      ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => fmtUSD0(value)} contentStyle={{ background: "#0f172a", border: "1px solid #334155", color: "#e2e8f0" }} />
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>
                              <div className="mt-2 flex flex-col gap-1.5">
                                {chartData.map((row, i) => (
                                  <div key={row.key} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: sliceColorFor(row, i) }} />
                                      <span className="text-slate-300">{row.label}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className="font-score text-base text-slate-400">{fmtUSD0(row.value)}</span>
                                      <span className="font-score w-12 text-right text-base text-slate-500">
                                        {chartTotal ? ((row.value / chartTotal) * 100).toFixed(0) : 0}%
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
