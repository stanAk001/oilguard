import { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import {
  Activity, BarChart3, ChevronRight,
  CircleAlert, ClipboardList, FileSearch, Fuel, Gauge, LayoutDashboard,
  LogOut, Menu, Shield, ShieldCheck, Wallet
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";
import { api } from "./api";

const money = n =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(n || 0);

const chartData = [
  { month: "Jan", value: 18 }, { month: "Feb", value: 22 },
  { month: "Mar", value: 21 }, { month: "Apr", value: 31 },
  { month: "May", value: 29 }, { month: "Jun", value: 42 },
  { month: "Jul", value: 48 }, { month: "Aug", value: 54 },
  { month: "Sep", value: 63 }, { month: "Oct", value: 69 },
  { month: "Nov", value: 78 }, { month: "Dec", value: 86 }
];

const riskLabel = score =>
  score >= 90 ? "Critical" :
  score >= 70 ? "High" :
  score >= 40 ? "Medium" : "Low";


function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/auth/me")
      .then(r => setUser(r.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 3200);
      return () => clearTimeout(t);
    }
  }, [toast]);

  async function login(email, password) {
    // The free Render server sleeps when idle; the first request can fail with
    // no response or a 5xx while it (or the database) wakes up. Retry those,
    // but not real errors like a wrong password (401).
    let r;
    for (let attempt = 0; ; attempt++) {
      try {
        r = await api.post("/auth/login", { email, password });
        break;
      } catch (err) {
        const status = err.response?.status;
        const temporary = !err.response || status >= 500;
        if (!temporary || attempt >= 4) throw err;
        await new Promise(res => setTimeout(res, 3000));
      }
    }
    setUser(r.data.user);
    navigate(r.data.user.role === "ANALYST" ? "/analyst" : "/portal");
  }

  async function logout() {
    await api.post("/auth/logout");
    setUser(null);
    navigate("/");
  }

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<Landing user={user} />} />
        <Route path="/login" element={<Login onLogin={login} />} />
        <Route
          path="/portal"
          element={
            loading ? <div className="loading-screen" role="status" aria-live="polite">Checking your secure session…</div>
            : user?.role === "INVESTOR"
              ? <InvestorPortal user={user} onLogout={logout} />
              : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/analyst"
          element={
            loading ? <div className="loading-screen" role="status" aria-live="polite">Checking your secure session…</div>
            : user?.role === "ANALYST"
              ? <AnalystPortal user={user} onLogout={logout} notify={setToast} />
              : <Navigate to="/login" replace />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {toast && <div className="toast"><ShieldCheck size={17} />{toast}</div>}

      <footer className="global-footer">
       
      </footer>
    </div>
  );
}


function Landing({ user }) {
  return (
    <>
      <header className="site-header">
        <Link to="/" className="brand">
          <span className="brand-mark"><Fuel size={21} /></span>
          <span>REBOUNCE <small>CREW</small></span>
        </Link>

        <nav>
          <a href="#approach">Our approach</a>
          <a href="#operations">Operations</a>
        </nav>

        <div className="header-actions">
          <Link className="text-link" to={
            user
              ? user.role === "ANALYST" ? "/analyst" : "/portal"
              : "/login"
          }>
            {user ? "Open workspace" : "Investor sign in"} <ChevronRight size={15} />
          </Link>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-image"></div>
          <div className="hero-shade"></div>

          <div className="hero-content">
            <div className="eyebrow"><span></span> ENERGY • OPERATIONS • INDUSTRY</div>
            <h1>Powering the<br /><em>next horizon.</em></h1>

            <p>
            Driving innovation, advancing industrial excellence, and building the infrastructure that moves tomorrow forward
            </p>

            <div className="hero-buttons">
              <Link to="/login" className="button button-gold">
                Enter  portal <ChevronRight size={17} />
              </Link>

              <a href="#approach" className="button button-ghost">
                Explore the case study
              </a>
            </div>

            <div className="hero-footnote">
              <ShieldCheck size={15} />  FINANCIAL DATA
            </div>
          </div>

          
        </section>

        <section className="ticker">
          <span>UPSTREAM</span><i>✳</i>
          <span>MIDSTREAM</span><i>✳</i>
          <span>DOWNSTREAM</span><i>✳</i>
          <span>ENERGY SYSTEMS</span><i>✳</i>
          <span>SECURITY & TRUST</span>
        </section>

        <section id="approach" className="intro-section section-wrap">
          <div className="section-kicker">01 / THE CASE STUDY</div>

          <div className="intro-grid">
            <h2>Every financial claim<br />deserves <em>verification.</em></h2>

            <div>
              <p>
                How independent financial analysis uncovered inconsistencies in reported figures, revealing why evidence matters more than assumptions.
              </p>

              <p>
                Move between the investor workspace and the analyst console
                to see how a suspicious financial narrative can be examined
                from both sides.
              </p>
            </div>
          </div>
        </section>

        <section id="operations" className="operations">
          <div className="operation-photo"></div>

          <div className="operation-copy">
            <div className="section-kicker">02 / INDUSTRY CONTEXT</div>
            <h2>Energy is complex.<br /><em>Verification shouldn't be.</em></h2>

            <p>
              Oil and gas projects involve capital, infrastructure,
              operational risk and long time horizons. Extraordinary
              return claims and upfront release charges warrant careful
              independent scrutiny.
            </p>

           
          </div>
        </section>

        
      </main>
    </>
  );
}


function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      await onLogin(email, password);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <Link to="/" className="brand">
        <span className="brand-mark"><Fuel size={21} /></span>
        <span>REBOUNCE <small>CREW</small></span>
      </Link>

      <div className="login-card">
        t
        <h1>Welcome back.</h1>
        <p>Sign in to the  investor or analyst workspace.</p>

        <form onSubmit={submit}>
          <label>Email address</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          <button className="button button-gold full" disabled={busy}>
            {busy ? "Signing in…" : "Continue"} <ChevronRight size={17} />
          </button>

          {error && <div className="form-error">{error}</div>}
        </form>

       
      </div>

     
    </div>
  );
}


function Shell({ user, onLogout, active, children, analyst = false }) {
  const [open, setOpen] = useState(false);

  const links = analyst
    ? [
        { label: "Overview", icon: LayoutDashboard },
        { label: "Case investigations", icon: FileSearch },
        { label: "Activity log", icon: ClipboardList }
      ]
    : [
        { label: "Overview", icon: LayoutDashboard },
        { label: "Investment account", icon: Wallet },
        { label: "Activity", icon: Activity }
      ];

  return (
    <div className="workspace">
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <Link to="/" className="brand side-brand">
          <span className="brand-mark"><Fuel size={20} /></span>
          <span>REBOUNCE <small>CREW</small></span>
        </Link>

        <div className="side-label">
          {analyst ? "SECURITY OPERATIONS" : "INVESTOR WORKSPACE"}
        </div>

        {links.map((l, i) => (
          <div key={i} className={`side-link ${i === 0 ? "active" : ""}`}>
            <l.icon size={17} />{l.label}
            {i === 0 && <span className="side-dot" />}
          </div>
        ))}

        <div className="side-bottom">
          <div className="user-chip">
            <div className="avatar">
              {user.name.split(" ").map(x => x[0]).slice(0, 2).join("")}
            </div>

            <div>
              <strong>{user.name}</strong>
              <span>{analyst ? "Security analyst" : "Investor account"}</span>
            </div>
          </div>

          <button className="logout" onClick={onLogout}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      <main className="workspace-main">
        <header className="workspace-header">
          <button className="mobile-menu" onClick={() => setOpen(!open)}>
            <Menu />
          </button>

          <div><span className="crumb">REBOUNCE /</span> {active}</div>

          <div className="header-right">
            <span className="live-dot" /> 
            <div className="mini-avatar">{user.name[0]}</div>
          </div>
        </header>

        <div className="workspace-content">{children}</div>
      </main>
    </div>
  );
}


/* Standalone withdrawal notice screen */
function WithdrawalNotice({ onBack }) {
  return (
    <div style={{
      minHeight: "100vh",
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "32px 18px",
      boxSizing: "border-box",
      background: "#f3f5f2"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "520px",
        padding: "42px 36px",
        boxSizing: "border-box",
        background: "#ffffff",
        border: "1px solid #e5e9e4",
        borderRadius: "14px",
        boxShadow: "0 18px 55px rgba(24, 44, 37, 0.09)",
        textAlign: "center"
      }}>
        <div style={{
          width: "62px",
          height: "62px",
          margin: "0 auto 22px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          background: "#f4eee2",
          color: "#a17b3d"
        }}>
          <Wallet size={27} />
        </div>

        <div style={{
          color: "#a17b3d",
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "2px"
        }}>
          WITHDRAWAL NOTICE
        </div>

        <h1 style={{
          margin: "14px 0",
          color: "#1d332c",
          fontSize: "29px",
          lineHeight: 1.25
        }}>
          Withdrawal Processing Notice
        </h1>

      

        <div style={{
          margin: "28px 0 20px",
          padding: "25px 15px",
          background: "#f7f8f6",
          border: "1px solid #e8ece7",
          borderRadius: "10px"
        }}>
          <div style={{
            color: "#89938d",
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "1.5px"
          }}>
         
          </div>

          <div style={{
            color: "#263e34",
            fontSize: "37px",
            fontWeight: 700,
            marginTop: "10px"
          }}>
            $25,000
          </div>
        </div>

        <button
          type="button"
          disabled
          aria-disabled="true"
          title="Payments are disabled in this training simulation"
          style={{
            width: "100%",
            marginTop: "22px",
            padding: "15px 20px",
            border: "none",
            borderRadius: "7px",
            background: "#203d33",
            color: "#ffffff",
            fontSize: "14px",
            fontWeight: 600,
            opacity: 0.45,
            cursor: "not-allowed"
          }}
        >
          Pay
        </button>

        <button
          type="button"
          onClick={onBack}
          style={{
            width: "100%",
            marginTop: "12px",
            padding: "15px 20px",
            border: "1px solid #203d33",
            borderRadius: "7px",
            background: "transparent",
            color: "#203d33",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          Return to Dashboard
        </button>

        
      </div>
    </div>
  );
}


function InvestorPortal({ user, onLogout }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [demoNote, setDemoNote] = useState("");
  const [showWithdrawalNotice, setShowWithdrawalNotice] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadOverview() {
      for (let attempt = 0; ; attempt++) {
        try {
          const response = await api.get("/investor/overview");
          if (active) {
            setData(response.data);
            setError("");
          }
          return;
        } catch (err) {
          const status = err.response?.status;
          const temporary = !err.response || status >= 500;
          if (temporary && attempt < 4) {
            await new Promise(resolve => setTimeout(resolve, 3000));
            continue;
          }

          if (!active) return;
          const serverMessage = err.response?.data?.message;
          setError(status
            ? `Investor account request failed (HTTP ${status})${serverMessage ? `: ${serverMessage}` : "."}`
            : `Could not reach the investor API at ${api.defaults.baseURL}. Check the API connection.`
          );
          return;
        }
      }
    }

    loadOverview();
    return () => { active = false; };
  }, []);

  const account = data?.account;

  // Show the standalone notice instead of the dashboard.
  if (showWithdrawalNotice) {
    return (
      <WithdrawalNotice
        onBack={() => setShowWithdrawalNotice(false)}
      />
    );
  }

  return (
    <Shell user={user} onLogout={onLogout} active="Investor overview">
      <div className="page-heading">
        <div>
          <div className="section-kicker">INVESTOR PORTAL / OVERVIEW</div>
          <h1>Good afternoon, {user.name.split(" ")[0]}.</h1>
          <p>Here is the latest view of your  investment account.</p>
        </div>

        <span className="date-chip"> <span>●</span> ACTIVE</span>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="balance-grid">
        <div className="balance-card returns">
          <div className="balance-top">
            <span>
              YOUR RETURNS 
            </span>
            <span className="balance-icon"><BarChart3 size={18} /></span>
          </div>

          <div className="balance-amount">
            {account ? money(account.projectedReturns) : "—"}
          </div>

          <div className="balance-bottom">
            <span></span>

            <span className="card-actions">
              <span className="risk-pill">
                <button onClick={() => setShowWithdrawalNotice(true)}>
                  Withdraw
                </button>
              </span>

              <span className="risk-pill">
                <button disabled aria-disabled="true" title="Transfers are disabled" style={{ opacity: 0.45, cursor: "not-allowed" }}>
                  Transfer
                </button>
              </span>
            </span>
          </div>

          {demoNote && (
            <div className="demo-note">
              project – {demoNote.toLowerCase()} are disabled.
            </div>
          )}
        </div>
      </div>

      <div className="content-grid">
        <section className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">PORTFOLIO OVERVIEW</span>
              <h3>Illustrative performance</h3>
            </div>

            <span className="period-chip">12 MONTHS</span>
          </div>

          <div className="chart-legend">
            
          </div>

          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c7a56a" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#c7a56a" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid stroke="#e9ece8" vertical={false} />

                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#8a9698", fontSize: 11 }}
                />

                <YAxis hide />

                <Tooltip formatter={v => [`${v} index points`, "Simulation"]} />

                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#b18e54"
                  strokeWidth={2.5}
                  fill="url(#areaFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Corrected transaction table: exactly five columns in both header and rows. */}
      <section className="panel activity-panel">
        <div className="panel-heading">
          <div>
            <span className="section-kicker">ACCOUNT HISTORY</span>
            <h3>Transactions</h3>
          </div>

          
        </div>

        <div className="txn-table">
          <div className="txn-row txn-head txn-desktop">
            <span>Date</span><span>Activity</span><span>Status</span><span className="txn-amt">Amount</span>
          </div>

          {(data?.events || []).map(event => {
            return (
            <article className="txn-item" key={event.id}>
              <div className="txn-row txn-desktop">
              <time>{event.createdAt ? new Date(event.createdAt).toLocaleDateString("en-US") : "Date unavailable"}</time>

              <div className="txn-desc">
                <div><strong>{event.title}</strong><small>{event.description}</small></div>
              </div>

              <span
                className={`txn-status ${event.status.toLowerCase()}`}
                style={{
                  justifySelf: "center",
                  textAlign: "center"
                }}
              >
                {event.status}
              </span>

              <span
                className={`txn-amt ${Number(event.amount) > 0 ? "credit" : "debit"}`}
                style={{
                  justifySelf: "end",
                  textAlign: "right",
                  whiteSpace: "nowrap",
                  fontVariantNumeric: "tabular-nums"
                }}
              >
                {event.amount == null ? "Amount unavailable" : (Number(event.amount) > 0 ? "+" : "-") + money(Math.abs(Number(event.amount)))}
              </span>
              </div>
              <div className="txn-card">
                <div className="txn-card-top">
                  <div className="txn-card-title"><strong>{event.title}</strong><small>{event.description}</small></div>
                  <span className={`txn-status ${event.status.toLowerCase()}`}>{event.status}</span>
                </div>
                <div className="txn-card-bottom">
                  <time>{event.createdAt ? new Date(event.createdAt).toLocaleDateString("en-US") : "Date unavailable"}</time>
                  <strong className={`txn-amt ${Number(event.amount) > 0 ? "credit" : "debit"}`}>{event.amount == null ? "Amount unavailable" : `${Number(event.amount) > 0 ? "+" : "-"}${money(Math.abs(Number(event.amount)))}`}</strong>
                </div>
              </div>
            </article>
            );
          })}
        </div>
      </section>
    </Shell>
  );
}


function AnalystPortal({ user, onLogout, notify }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  async function refresh() {
    try {
      const r = await api.get("/analyst/overview");
      setData(r.data);
      setError("");
    } catch {
      setError("Could not load analyst data. Check the API and database.");
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function update(id, status) {
    try {
      await api.patch(`/analyst/events/${id}`, { status });
      await refresh();
      notify("Investigation status updated.");
    } catch {
      notify("Unable to update case status.");
    }
  }

  const metrics = data?.metrics || {};

  return (
    <Shell user={user} onLogout={onLogout} analyst>
      <div className="page-heading">
        <div>
          <div className="section-kicker">SECURITY OPERATIONS / CASE REVIEW</div>
          <h1>Investigation overview.</h1>

          <p>
            Review synthetic investor activity and identify indicators
            of advance-fee fraud.
          </p>
        </div>

        <span className="date-chip">CASE OG–026 <span>●</span> OPEN</span>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="analyst-banner">
        <div className="analyst-banner-icon"><ShieldCheck /></div>

        <div>
          <strong>Defensive analysis workspace</strong>
        
        </div>

        <span className="notice-tag">SYNTHETIC DATA</span>
      </div>

      <div className="metric-grid">
        <Metric
          icon={Wallet}
          label="Synthetic investors"
          value={metrics.investors ?? "—"}
          note="user accounts"
        />

        <Metric
          icon={Activity}
          label="Events recorded"
          value={metrics.events ?? "—"}
          note="Across the case dataset"
        />

        <Metric
          icon={CircleAlert}
          label="High / critical risk"
          value={metrics.highRisk ?? "—"}
          note="Risk score ≥ 80"
        />

        <Metric
          icon={FileSearch}
          label="Open investigations"
          value={metrics.openCases ?? "—"}
          note="Awaiting analyst review"
        />
      </div>

      <div className="analyst-grid">
        <section className="panel cases-panel">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">DETECTION QUEUE</span>
              <h3>Flagged activity</h3>
            </div>

            <span className="period-chip">RULE-BASED TRIAGE</span>
          </div>

          <div className="case-list">
            {(data?.events || []).map(e => (
              <article className="case-row" key={e.id}>
                <div className={`case-score ${e.riskScore >= 90 ? "critical" : e.riskScore >= 70 ? "high" : ""}`}>
                  {e.riskScore}<small>RISK</small>
                </div>

                <div className="case-main">
                  <div className="case-title-line">
                    <strong>{e.title}</strong>

                    <span className={`status status-${e.status.toLowerCase()}`}>
                      {e.status}
                    </span>
                  </div>

                  <p>{e.description}</p>

                  <div className="case-meta">
                    <span>{e.user?.name || "user subject"}</span>
                    <span>{e.type.replaceAll("_", " ")}</span>
                    <span>{new Date(e.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="case-action">
                  <select
                    aria-label="Update case status"
                    value={e.status}
                    onChange={ev => update(e.id, ev.target.value)}
                  >
                    <option value="OPEN">Open</option>
                    <option value="REVIEWED">Reviewed</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="panel findings-panel">
          <div className="section-kicker">ANALYST PLAYBOOK</div>
          <h3>Why this is suspicious</h3>

          <Finding
            number="01"
            title="Disproportionate returns"
            text="A $640,000 projection against $40,000 capital is extraordinary and requires independent evidence."
          />

          <Finding
            number="02"
            title="Upfront release fee"
            text="A demand for $25,000 before releasing supposed profits matches an advance-fee pattern."
          />

          <Finding
            number="03"
            title="Urgency & pressure"
            text="Pressure to pay quickly can suppress independent checks and informed decision-making."
          />

          <Finding
            number="04"
            title="Sensitive data requests"
            text="Requests for PINs, OTPs or card credentials should trigger immediate escalation."
          />

          <div className="risk-method">
            <Gauge size={16} />
          
          </div>
        </section>
      </div>

      <section className="panel activity-panel">
        <div className="panel-heading">
          <div>
            <span className="section-kicker">AUDIT TRAIL</span>
            <h3>Recent analyst and user activity</h3>
          </div>

          <span className="period-chip">LATEST 12</span>
        </div>

        <div className="activity-list">
          {(data?.logs || []).map(l => (
            <div className="activity-row" key={l.id}>
              <div className="activity-symbol"><ClipboardList size={17} /></div>

              <div className="activity-description">
                <strong>{l.action.replaceAll("_", " ")}</strong>
                <span>{l.detail} · {l.user?.name || "System"}</span>
              </div>

              <time>{new Date(l.createdAt).toLocaleString()}</time>
            </div>
          ))}
        </div>
      </section>
    </Shell>
  );
}


function Metric({ icon: Icon, label, value, note }) {
  return (
    <div className="metric-card">
      <div className="metric-icon"><Icon size={18} /></div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}


function Finding({ number, title, text }) {
  return (
    <div className="finding">
      <span>{number}</span>

      <div>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>
    </div>
  );
}

export default App;
