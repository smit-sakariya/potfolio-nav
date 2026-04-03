import { useEffect, useRef, useState } from 'react'
import axios from 'axios'

const API_BASE = 'http://localhost:3000';

// ─── Interfaces ────────────────────────────────────────────────────────────────

interface Holding {
  asset: string;
  quantity: number;
}

interface Alert {
  _id: string;
  asset: string;
  thresholdPrice: number;
  direction: string;
  status: string;
}

interface NavHistory {
  navValue: number;
  timestamp: string;
  assetDetails?: { asset: string; quantity: number; price: number; total: number }[];
}

// Each notification stores its message AND the exact timestamp it was received
interface Notification {
  id: number;
  message: string;
  timestamp: Date;
}

// ─── Official Shipfinex Logo (exact SVG from shipfinex.io) ─────────────────────
const ShipfinexLogo = () => (
  <svg preserveAspectRatio="xMidYMid meet" data-bbox="0 0.358 158.665 37.285" xmlns="http://www.w3.org/2000/svg" viewBox="0 0.358 158.665 37.285" height="36" width="158" role="presentation" aria-hidden="true">
    <g>
      <path fill="#0064FF" d="M56.136 13.682q-.183-1.545-1.479-2.398-1.295-.853-3.178-.853-1.377 0-2.41.447-1.022.447-1.6 1.23a2.95 2.95 0 0 0-.566 1.777q0 .833.395 1.433.405.588 1.032.985.628.385 1.316.64.69.243 1.266.396l2.105.569q.81.213 1.802.59 1.002.375 1.914 1.025.921.64 1.518 1.646.598 1.005.598 2.468 0 1.687-.881 3.048-.87 1.362-2.551 2.164-1.67.802-4.06.802-2.227 0-3.857-.72-1.62-.723-2.551-2.012-.921-1.29-1.043-2.997h2.592q.1 1.179.79 1.95.698.762 1.761 1.138a7.1 7.1 0 0 0 2.308.366q1.438 0 2.582-.467 1.143-.478 1.812-1.321.668-.854.668-1.991 0-1.036-.577-1.687-.577-.65-1.519-1.056a16 16 0 0 0-2.035-.711l-2.55-.732q-2.43-.7-3.847-2-1.418-1.301-1.418-3.404 0-1.747.942-3.048.951-1.31 2.55-2.031 1.61-.732 3.595-.732 2.004 0 3.563.721 1.56.712 2.47 1.95a4.87 4.87 0 0 1 .972 2.815z" />
      <path fill="#0064FF" d="M64.186 19.9v9.386h-2.389V8.48h2.39v7.639h.202a4.4 4.4 0 0 1 1.64-1.92q1.103-.72 2.936-.721 1.59 0 2.784.64 1.195.63 1.852 1.94.668 1.3.668 3.312v9.915H71.88v-9.753q0-1.858-.962-2.875-.951-1.026-2.642-1.026-1.174 0-2.105.498a3.63 3.63 0 0 0-1.458 1.453q-.527.956-.527 2.316" />
      <path fill="#0064FF" d="M77.785 29.286V13.682h2.39v15.604zM79 11.08q-.698 0-1.205-.477-.495-.477-.496-1.148 0-.67.496-1.148A1.7 1.7 0 0 1 79 7.83q.699 0 1.194.478.507.476.507 1.148 0 .67-.507 1.148A1.66 1.66 0 0 1 79 11.08" />
      <path fill="#0064FF" d="M83.695 35.137V13.682h2.308v2.479h.283q.264-.407.73-1.037.475-.64 1.356-1.137.89-.508 2.41-.508 1.963 0 3.462.985 1.498.985 2.338 2.794.84 1.808.84 4.267 0 2.478-.84 4.297-.84 1.808-2.328 2.803-1.489.986-3.432.986-1.5 0-2.4-.498-.9-.507-1.386-1.148a15 15 0 0 1-.75-1.077h-.202v8.25zm2.348-13.653q0 1.767.517 3.119.516 1.341 1.508 2.102.992.753 2.43.752 1.498 0 2.5-.792 1.012-.803 1.519-2.154.516-1.36.516-3.027 0-1.645-.506-2.967-.496-1.33-1.508-2.102-1.003-.783-2.521-.783-1.458 0-2.45.742-.992.732-1.498 2.052-.507 1.31-.507 3.058" />
      <path fill="#0064FF" d="M107.136 13.682v2.032h-8.382v-2.032zm-5.872 15.604V11.528q0-1.341.628-2.235a3.9 3.9 0 0 1 1.63-1.34 5.1 5.1 0 0 1 2.116-.448q.88 0 1.437.143.557.141.83.264l-.688 2.072q-.182-.06-.506-.152-.314-.092-.83-.092-1.185 0-1.711.6-.516.6-.516 1.757v17.189z" />
      <path fill="#0064FF" d="M109.629 29.286V13.682h2.389v15.604zm1.215-18.205q-.698 0-1.205-.477-.496-.477-.496-1.148t.496-1.148a1.7 1.7 0 0 1 1.205-.478q.699 0 1.194.478.507.476.507 1.148 0 .67-.507 1.148-.495.477-1.194.477" />
      <path fill="#0064FF" d="M117.928 19.9v9.386h-2.389V13.682h2.308v2.438h.203a4.44 4.44 0 0 1 1.66-1.91q1.114-.731 2.875-.731 1.58 0 2.764.65 1.183.64 1.842 1.95.658 1.3.658 3.292v9.915h-2.389v-9.753q0-1.838-.952-2.864-.951-1.037-2.612-1.037-1.144 0-2.044.498a3.56 3.56 0 0 0-1.408 1.453q-.516.956-.516 2.316" />
      <path fill="#0064FF" d="M137.879 29.61q-2.247 0-3.877-.995-1.62-1.006-2.501-2.803-.87-1.809-.87-4.206t.87-4.226q.881-1.839 2.45-2.865 1.58-1.035 3.685-1.036 1.215 0 2.399.406 1.185.406 2.157 1.32.972.906 1.549 2.398.577 1.494.577 3.678v1.016h-11.987v-2.073h9.557q0-1.32-.526-2.357a4 4 0 0 0-1.478-1.635q-.952-.6-2.248-.6-1.427 0-2.47.711a4.7 4.7 0 0 0-1.589 1.83 5.4 5.4 0 0 0-.557 2.417v1.381q0 1.768.607 2.997.618 1.22 1.711 1.86 1.094.63 2.541.63.942 0 1.701-.265a3.6 3.6 0 0 0 1.326-.813q.556-.549.861-1.36l2.308.65a5.15 5.15 0 0 1-1.225 2.072q-.86.884-2.126 1.381-1.266.488-2.845.488" />
      <path fill="#0064FF" d="m148.461 13.682 3.725 6.38 3.726-6.38h2.753l-5.021 7.802 5.021 7.802h-2.753l-3.726-6.055-3.725 6.055h-2.754l4.941-7.802-4.941-7.802z" />
      <path fill="#0064FF" d="M4.97 33.094a1.4 1.4 0 0 1 .57-1.924l15.028-8.121c1.532-.82 2.45-2.334 2.45-4.05 0-1.714-.91-3.22-2.442-4.041L5.525 6.718a1.41 1.41 0 0 1-.562-1.932 1.46 1.46 0 0 1 1.965-.552l15.028 8.226c2.458 1.32 3.938 3.758 3.938 6.525 0 2.766-1.48 5.212-3.945 6.532L6.928 33.638a1.45 1.45 0 0 1-1.957-.56z" />
      <path fill="#0064FF" d="M11.507 36.628c-.485 0-.956-.238-1.229-.678a1.41 1.41 0 0 1 .47-1.954l13.974-8.442c2.337-1.409 3.733-3.862 3.733-6.562s-1.396-5.145-3.733-6.562L10.75 3.996a1.403 1.403 0 0 1-.47-1.954c.416-.671 1.304-.872 1.987-.462l13.973 8.44c3.201 1.932 5.105 5.287 5.105 8.979 0 3.69-1.912 7.047-5.105 8.978l-13.974 8.441a1.45 1.45 0 0 1-.751.21z" />
      <path fill="#0064FF" d="M35.869 19c0 10.298-8.49 18.643-18.966 18.643-.273 0-.539 0-.812-.015l10.515-6.346c4.37-2.64 6.979-7.226 6.979-12.275 0-5.048-2.617-9.627-7.002-12.26L16 .38q.455-.022.91-.022C27.387.357 35.876 8.7 35.876 19z" />
      <path fill="#0064FF" d="M0 8.305v21.387c0 1.09 1.191 1.768 2.155 1.23l19.14-10.693a1.41 1.41 0 0 0 0-2.468L2.155 7.075C1.19 6.538 0 7.224 0 8.305" />
    </g>
  </svg>
);

// ─── Bell Icon (inline SVG — no extra dependency needed) ──────────────────────
const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

// ─── App ──────────────────────────────────────────────────────────────────────

function App() {
  const [activeUserId, setActiveUserId] = useState<string>('user_123');
  const [nav, setNav] = useState<number>(0);
  // Tracks direction of the last NAV change to show ▲ or ▼ on the LIVE badge
  const [navTrend, setNavTrend] = useState<'up' | 'down' | 'neutral'>('neutral');
  const prevNavRef = useRef<number>(0); // holds the previous NAV for comparison
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // Notification bell state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const notifPanelRef = useRef<HTMLDivElement>(null);
  const notifIdRef = useRef(0); // simple incrementing ID for keys

  // NAV history modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [navHistory, setNavHistory] = useState<NavHistory[]>([]);

  // Form state — each form has its OWN asset state to avoid cross-form interference
  const [holdingAsset, setHoldingAsset] = useState('BTC');
  const [holdingQty, setHoldingQty] = useState(1);
  const [alertThreshold, setAlertThreshold] = useState(50000);
  const [alertDirection, setAlertDirection] = useState('ABOVE');

  // ── Close notification panel when clicking outside ──────────────────────────
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifPanelRef.current && !notifPanelRef.current.contains(e.target as Node)) {
        setShowNotifPanel(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Fetch initial data ──────────────────────────────────────────────────────
  const fetchInitialData = async () => {
    try {
      const [navRes, holdRes, alertRes] = await Promise.all([
        axios.get(`${API_BASE}/portfolio/nav/${activeUserId}`),
        axios.get(`${API_BASE}/portfolio/holdings/${activeUserId}`),
        axios.get(`${API_BASE}/alert/${activeUserId}`)
      ]);
      setNav(navRes.data.currentNav || 0);
      setHoldings(holdRes.data);
      setAlerts(alertRes.data);
    } catch (e) {
      console.error('Failed to fetch initial data', e);
    }
  };

  // ── SSE stream — connects per active user ───────────────────────────────────
  useEffect(() => {
    fetchInitialData();
    const eventSource = new EventSource(`${API_BASE}/stream/${activeUserId}`);

    eventSource.onmessage = (event) => {
      const payload = JSON.parse(event.data);

      if (payload.type === 'NAV_UPDATE') {
        const newNav: number = payload.data.navValue;
        // Compare with the last known NAV to determine direction
        if (prevNavRef.current !== 0) {
          setNavTrend(newNav >= prevNavRef.current ? 'up' : 'down');
        }
        prevNavRef.current = newNav;
        setNav(newNav);

      } else if (payload.type === 'ALERT_TRIGGERED') {
        const data = payload.data;
        // Build one notification for the entire batch of alerts that fired together.
        // The backend now emits exactly ONE ALERT_TRIGGERED event per user per tick,
        // even if multiple NAV alert thresholds were crossed simultaneously.
        const alertSummary = data.triggeredAlerts
          .map((a: any) => `${a.direction === 'ABOVE' ? '↑' : '↓'} $${Number(a.threshold).toLocaleString()}`)
          .join(', ');
        const newNotif: Notification = {
          id: ++notifIdRef.current,
          message: `🚨 Portfolio NAV ($${Number(data.currentNavValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) triggered: ${alertSummary}`,
          timestamp: new Date(),
        };
        setNotifications(prev => [newNotif, ...prev].slice(0, 20));
        setShowNotifPanel(true);

        // Refresh the alert list to show TRIGGERED status
        axios.get(`${API_BASE}/alert/${activeUserId}`).then(res => setAlerts(res.data));
      }
    };

    return () => eventSource.close();
  }, [activeUserId]);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const unreadCount = notifications.length;

  const clearNotifications = () => setNotifications([]);

  const triggerHistoryModal = async () => {
    try {
      const res = await axios.get(`${API_BASE}/portfolio/nav/${activeUserId}/history`);
      setNavHistory(res.data);
      setShowHistoryModal(true);
    } catch (e) {
      console.error('Failed to fetch history');
    }
  };

  const handleAddHolding = async (e: React.FormEvent) => {
    e.preventDefault();
    await axios.post(`${API_BASE}/portfolio/holdings`, {
      userId: activeUserId,
      asset: holdingAsset,
      quantity: Number(holdingQty),
      averageBuyPrice: 0,
    });
    fetchInitialData();
  };

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    await axios.post(`${API_BASE}/alert`, {
      userId: activeUserId,
      // No asset field — this is a portfolio NAV alert, not an individual token alert
      thresholdPrice: Number(alertThreshold),
      direction: alertDirection,
    });
    fetchInitialData();
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav className="bg-white border-b border-slate-200 px-6 py-3 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center">

          {/* Official Shipfinex SVG logo */}
          <div className="flex items-center">
            <ShipfinexLogo />
            <span className="ml-3 text-slate-400 text-sm font-normal hidden sm:inline">Dashboard</span>
          </div>

          {/* Nav links */}
          <div className="hidden md:flex space-x-8 text-sm font-medium text-slate-500">
            <a href="#" className="hover:text-blue-600 transition-colors">Portfolio</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Marketplace</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Alerts</a>
          </div>

          {/* Right side: user switcher + notification bell */}
          <div className="flex items-center space-x-3">

            {/* Multi-User Switcher */}
            <select
              value={activeUserId}
              onChange={e => setActiveUserId(e.target.value)}
              className="bg-slate-50 text-slate-800 text-sm font-semibold border border-slate-200 px-3 py-2 rounded-lg shadow-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="user_123">John Doe (user_123)</option>
              <option value="alice_crypto">Alice Crypto (alice_crypto)</option>
              <option value="bob_whale">Bob Whale (bob_whale)</option>
            </select>

            {/* ── Notification Bell ─────────────────────────────────────── */}
            <div className="relative" ref={notifPanelRef}>
              <button
                onClick={() => setShowNotifPanel(prev => !prev)}
                className="relative p-2 rounded-full text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                aria-label="Notifications"
              >
                <BellIcon />
                {/* Unread badge */}
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* ── Notification Dropdown Panel ───────────────────────── */}
              {showNotifPanel && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50">
                  {/* Panel header */}
                  <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100 bg-slate-50">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 text-sm">Alert Notifications</span>
                      {unreadCount > 0 && (
                        <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    <button
                      onClick={clearNotifications}
                      className="text-xs text-slate-400 hover:text-slate-700 transition-colors font-medium"
                    >
                      Clear all
                    </button>
                  </div>

                  {/* Notification list */}
                  <ul className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                    {notifications.length === 0 ? (
                      <li className="px-4 py-8 text-center">
                        <div className="text-3xl mb-2">🔔</div>
                        <p className="text-slate-400 text-sm">No alerts triggered yet.</p>
                        <p className="text-slate-300 text-xs mt-1">Set a price target below to get started.</p>
                      </li>
                    ) : (
                      notifications.map(notif => (
                        <li key={notif.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                          {/* Red alert dot */}
                          <span className="mt-1 w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-800 font-medium leading-snug">
                              {notif.message}
                            </p>
                            {/* Exact timestamp of when the alert came in */}
                            <p className="text-xs text-slate-400 mt-0.5">
                              {notif.timestamp.toLocaleDateString(undefined, {
                                month: 'short', day: 'numeric', year: 'numeric'
                              })}
                              {' • '}
                              {notif.timestamp.toLocaleTimeString(undefined, {
                                hour: '2-digit', minute: '2-digit', second: '2-digit'
                              })}
                            </p>
                          </div>
                        </li>
                      ))
                    )}
                  </ul>

                  {/* Panel footer */}
                  {notifications.length > 0 && (
                    <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 text-center">
                      <p className="text-xs text-slate-400">
                        Showing last {notifications.length} alert{notifications.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* ── End Notification Bell ─────────────────────────────────── */}

          </div>
        </div>
      </nav>

      {/* ── Main Content ───────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-6 py-6">

        {/* Dynamic NAV Hero */}
        <div className="mb-6 text-center max-w-3xl mx-auto">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2 leading-tight">
            Track your ship value. <span className="text-blue-600">In real-time.</span>
          </h1>
          <p className="text-sm text-slate-500 mb-5">Fractional asset valuation driven by live market feeds.</p>

          <div className="bg-white rounded-2xl px-8 py-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 mx-auto inline-block hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-center space-x-2 mb-1">
              <span className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-sm">$</span>
              <p className="text-slate-500 font-medium text-sm tracking-wide">Portfolio Value (NAV)</p>
            </div>
            <div className="flex items-center justify-center gap-3 mt-2">
              <span className="text-4xl font-bold text-slate-900 tracking-tight">
                ${nav.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full animate-pulse ${
                navTrend === 'down'
                  ? 'bg-red-100 text-red-600'       // NAV declined — red ▼
                  : navTrend === 'up'
                    ? 'bg-green-100 text-green-700'  // NAV rose — green ▲
                    : 'bg-slate-100 text-slate-500'  // First load, no tick yet — neutral
              }`}>
                {navTrend === 'down' ? '▼' : '▲'} LIVE
              </span>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* ── Holdings Card ─────────────────────────────────────────────── */}
          <section className="bg-white rounded-2xl shadow-lg border border-slate-100 p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-900">Your Assets</h2>
              <span className="text-sm text-blue-600 font-semibold cursor-pointer">Manage &gt;</span>
            </div>

            <form onSubmit={handleAddHolding} className="flex gap-2 mb-5 bg-slate-50 p-2 rounded-xl border border-slate-200">
              <select
                value={holdingAsset}
                onChange={e => setHoldingAsset(e.target.value)}
                className="bg-white border-none rounded-lg px-3 py-2 w-24 text-sm text-slate-900 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
              >
                <option value="BTC">BTC</option>
                <option value="ETH">ETH</option>
                <option value="SOL">SOL</option>
                <option value="BNB">BNB</option>
                <option value="XRP">XRP</option>
              </select>
              <input
                type="number"
                value={holdingQty}
                onChange={e => setHoldingQty(Number(e.target.value))}
                className="bg-white border-none rounded-lg px-3 py-2 flex-grow text-sm text-slate-900 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                step="0.01"
              />
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white text-sm font-semibold transition-colors shadow-md">
                Add
              </button>
            </form>

            <ul className="space-y-2 max-h-52 overflow-y-auto">
              {holdings.map((h, i) => (
                <li key={i} className="flex justify-between items-center p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-bold">
                      {h.asset.charAt(0)}
                    </div>
                    <span className="font-bold text-slate-900">{h.asset}</span>
                  </div>
                  <span className="text-slate-600 font-mono text-sm">{h.quantity} Tokens</span>
                </li>
              ))}
              {holdings.length === 0 && (
                <p className="text-slate-400 text-center text-sm py-4">No assets configured.</p>
              )}
            </ul>
          </section>

          {/* ── Alerts Card ───────────────────────────────────────────────── */}
          <section className="bg-white rounded-2xl shadow-lg border border-slate-100 p-5">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Portfolio NAV Alerts</h2>
                <p className="text-xs text-slate-400 mt-0.5">Fires when your total portfolio value crosses the threshold</p>
              </div>
              <span
                className="text-sm text-blue-600 font-semibold cursor-pointer hover:underline"
                onClick={triggerHistoryModal}
              >
                View History &gt;
              </span>
            </div>

            <form onSubmit={handleCreateAlert} className="flex flex-wrap gap-2 mb-5 bg-slate-50 p-2 rounded-xl border border-slate-200">
              <select
                value={alertDirection}
                onChange={e => setAlertDirection(e.target.value)}
                className="bg-white rounded-lg px-3 py-2 text-sm text-slate-900 shadow-sm outline-none cursor-pointer"
              >
                <option value="ABOVE">NAV rises above</option>
                <option value="BELOW">NAV drops below</option>
              </select>
              <input
                type="number"
                value={alertThreshold}
                onChange={e => setAlertThreshold(Number(e.target.value))}
                className="bg-white rounded-lg px-3 py-2 flex-grow text-sm text-slate-900 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none min-w-[90px]"
                placeholder="NAV threshold ($)"
              />
              <button
                type="submit"
                className="bg-slate-900 hover:bg-slate-800 px-4 py-2 rounded-lg text-white text-sm font-semibold transition-colors shadow-md"
              >
                Set Alert
              </button>
            </form>

            <ul className="space-y-2 max-h-52 overflow-y-auto">
              {alerts.map((a, i) => (
                <li
                  key={i}
                  className={`flex justify-between items-center p-3 rounded-xl border ${
                    a.status === 'TRIGGERED' ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'
                  }`}
                >
                  <div>
                    {/* asset is always 'NAV' but we show it descriptively */}
                    <span className="font-bold text-slate-900 block">Portfolio NAV</span>
                    <span className="text-xs text-slate-500">
                      Target: {a.direction === 'ABOVE' ? '↑ rises above' : '↓ drops below'} ${a.thresholdPrice.toLocaleString()}
                    </span>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    a.status === 'TRIGGERED' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                  }`}>
                    {a.status}
                  </span>
                </li>
              ))}
            </ul>
          </section>

        </div>
      </main>

      {/* ── NAV History Modal ──────────────────────────────────────────────── */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-slate-900">NAV Timeline History</h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-slate-700 text-2xl leading-none"
              >
                &times;
              </button>
            </div>
            <div className="p-6">
              <ul className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {navHistory.length === 0 ? (
                  <p className="text-slate-500 text-center py-4">No snapshots saved yet.</p>
                ) : (
                  navHistory.map((h, i) => {
                    const dateInfo = new Date(h.timestamp);
                    return (
                      <li key={i} className="flex flex-col p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 text-lg">
                              ${h.navValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className="text-xs text-slate-400 font-medium tracking-wide">
                              {dateInfo.toLocaleDateString()} • {dateInfo.toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                            <span className="text-blue-500 text-xs font-black">NAV</span>
                          </div>
                        </div>
                        {h.assetDetails && h.assetDetails.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-100 space-y-1">
                            {h.assetDetails.map((asset, idx) => (
                              <div key={idx} className="flex justify-between text-xs text-slate-500">
                                <span>{asset.quantity} {asset.asset}</span>
                                <span>
                                  @ ${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  {' = '}
                                  <span className="text-slate-700 font-medium">
                                    ${asset.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </li>
                    );
                  })
                )}
              </ul>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="w-full mt-6 bg-slate-900 hover:bg-slate-800 py-3 rounded-xl text-white font-bold transition-colors"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
