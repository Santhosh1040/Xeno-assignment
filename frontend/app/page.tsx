"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
const API = process.env.NEXT_PUBLIC_BACKEND_URL;



type Summary = {
  totalCustomers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number | string; // Prisma Decimal can come back as string
};

type OrdersByDatePoint = {
  date: string;
  orders: number;
  revenue: number;
};

type TopCustomer = {
  id: number;
  name: string;
  email: string | null;
  orders: number;
  revenue: number;
};

type TopProduct = {
  id: number;
  title: string;
  price: number;
  imageUrl: string | null;
};

type Status =
  | { loading: true }
  | { loading: false; error: string }
  | { loading: false; error?: undefined; summary: Summary };

type Tenant = {
  id: number;
  name: string;
  shopUrl: string;
};

export default function Page() {
  const router = useRouter();

  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);

  const [state, setState] = useState<Status>({ loading: true });
  const [ordersSeries, setOrdersSeries] = useState<OrdersByDatePoint[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [syncing, setSyncing] = useState(false);

  // Lightweight email auth
  useEffect(() => {
    const email =
      typeof window !== "undefined"
        ? window.localStorage.getItem("xfde-email")
        : null;

    if (!email) {
      router.replace("/login");
    } else {
      setUserEmail(email);
    }
  }, [router]);

  // Load tenants then metrics
  useEffect(() => {
    if (!userEmail) return;

    (async () => {
      try {
        const res = await axios.get<Tenant[]>(`${API}/api/tenants`, {
          timeout: 5000,
        });
        const list = res.data;
        setTenants(list);

        if (list.length > 0) {
          const firstId = list[0].id;
          setSelectedTenantId(firstId);
          await loadMetrics(firstId);
        } else {
          setState({
            loading: false,
            error: "No tenants found. Please create one first.",
          });
        }
      } catch (err: any) {
        console.error("Error loading tenants", err);
        setState({
          loading: false,
          error: err.message || "Failed to load tenants",
        });
      }
    })();
  }, [userEmail]);

  async function loadMetrics(tenantId: number) {
    try {
      setState({ loading: true });

      const [summaryRes, seriesRes, topCustomersRes, topProductsRes] =
        await Promise.all([
          axios.get<Summary>(`${API}/api/metrics/${tenantId}/summary`, {
            timeout: 6000,
          }),
          axios.get<OrdersByDatePoint[]>(
            `${API}/api/metrics/${tenantId}/orders-by-date`,
            { timeout: 6000 }
          ),
          axios.get<TopCustomer[]>(
            `${API}/api/metrics/${tenantId}/top-customers`,
            { timeout: 6000 }
          ),
          axios.get<TopProduct[]>(
            `${API}/api/metrics/${tenantId}/top-products`,
            { timeout: 6000 }
          ),
        ]);

      setState({ loading: false, summary: summaryRes.data });
      setOrdersSeries(seriesRes.data);
      setTopCustomers(topCustomersRes.data);
      setTopProducts(topProductsRes.data);
    } catch (err: any) {
      console.error("Error fetching metrics", err);
      setState({
        loading: false,
        error: err.message || "Failed to load metrics",
      });
    }
  }

  async function handleTenantChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = Number(e.target.value);
    setSelectedTenantId(id);
    await loadMetrics(id);
  }

  async function handleSyncNow() {
    if (!selectedTenantId) return;
    try {
      setSyncing(true);
      await axios.post(`${API}/api/ingest/${selectedTenantId}/sync`);
      await loadMetrics(selectedTenantId);
    } catch (err) {
      console.error("Sync error", err);
      alert("Sync failed. Check backend logs.");
    } finally {
      setSyncing(false);
    }
  }

  function handleLogout() {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("xfde-email");
    }
    router.replace("/login");
  }

  // If auth not checked yet, show nothing (avoid flicker)
  if (!userEmail) {
    return null;
  }

  if (state.loading) {
    return (
      <main
        style={{
          padding: 24,
          fontFamily: "Inter, system-ui, sans-serif",
          color: "#fff",
        }}
      >
        <Header
          tenants={tenants}
          selectedTenantId={selectedTenantId}
          onTenantChange={handleTenantChange}
          userEmail={userEmail}
          syncing={syncing}
          onSync={handleSyncNow}
          onLogout={handleLogout}
        />
        <p style={{ marginTop: 24 }}>Loading metrics…</p>
      </main>
    );
  }

  if ("error" in state && state.error) {
    return (
      <main
        style={{
          padding: 24,
          fontFamily: "Inter, system-ui, sans-serif",
          color: "#fff",
        }}
      >
        <Header
          tenants={tenants}
          selectedTenantId={selectedTenantId}
          onTenantChange={handleTenantChange}
          userEmail={userEmail}
          syncing={syncing}
          onSync={handleSyncNow}
          onLogout={handleLogout}
        />
        <p style={{ color: "salmon", marginTop: 24 }}>
          Error: {state.error}
        </p>
        <p style={{ marginTop: 8, color: "#bbb", fontSize: 13 }}>
          Make sure backend is running on <code>{API}</code> and Docker DB is
          running.
        </p>
      </main>
    );
  }

  if (!("summary" in state)) return null;
  const summary = state.summary;

  const currentTenant = tenants.find((t) => t.id === selectedTenantId);

  // 🔥 FIX: ensure totalRevenue is a proper number before using toFixed
  const totalRevenueNumber =
    typeof summary.totalRevenue === "number"
      ? summary.totalRevenue
      : Number(summary.totalRevenue || 0);

  return (
    <main
      style={{
        padding: 24,
        fontFamily: "Inter, system-ui, sans-serif",
        color: "#fff",
      }}
    >
      <Header
        tenants={tenants}
        selectedTenantId={selectedTenantId}
        onTenantChange={handleTenantChange}
        userEmail={userEmail}
        syncing={syncing}
        onSync={handleSyncNow}
        onLogout={handleLogout}
      />

      <p style={{ marginBottom: 24, color: "#ccc", fontSize: 14 }}>
        Tenant:{" "}
        <strong>
          {currentTenant ? currentTenant.name : "Unknown"} (ID:{" "}
          {selectedTenantId ?? "?"})
        </strong>
      </p>

      {/* KPI CARDS */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <Card
          label="Total Revenue"
          value={`₹${totalRevenueNumber.toFixed(2)}`}
        />
        <Card label="Total Orders" value={summary.totalOrders} />
        <Card label="Total Customers" value={summary.totalCustomers} />
        <Card label="Total Products" value={summary.totalProducts} />
      </section>

      {/* ORDERS & REVENUE CHART */}
      <section style={{ marginTop: 32, marginBottom: 32 }}>
        <h2 style={{ marginBottom: 12, fontSize: 18 }}>
          Orders &amp; Revenue over Time
        </h2>

        {ordersSeries.length === 0 ? (
          <p style={{ color: "#aaa", fontSize: 14 }}>
            No order data yet. Once we sync from a real Shopify store, this
            chart will show orders and revenue by date.
          </p>
        ) : (
          <div
            style={{
              width: "100%",
              height: 360,
              borderRadius: 16,
              border: "1px solid #27272a",
              padding: 16,
              background:
                "radial-gradient(circle at top, rgba(255,255,255,0.03), rgba(15,23,42,1))",
            }}
          >
            <ResponsiveContainer>
              <LineChart data={ordersSeries}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke="#a5b4fc"
                  name="Orders"
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#34d399"
                  name="Revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* TOP CUSTOMERS */}
      <section style={{ marginTop: 16, marginBottom: 32 }}>
        <h2 style={{ marginBottom: 12, fontSize: 18 }}>Top Customers</h2>

        {topCustomers.length === 0 ? (
          <p style={{ color: "#aaa", fontSize: 14 }}>
            No customer data yet. After syncing from Shopify, this table will
            show your best customers by revenue.
          </p>
        ) : (
          <TableWrapper>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 14,
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "rgba(255,255,255,0.02)" }}>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Orders</th>
                  <th style={thStyle}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topCustomers.map((c, idx) => (
                  <tr key={c.id} style={{ borderTop: "1px solid #333" }}>
                    <td style={tdStyle}>{idx + 1}</td>
                    <td style={tdStyle}>{c.name}</td>
                    <td style={tdStyle}>{c.email || "—"}</td>
                    <td style={tdStyle}>{c.orders}</td>
                    <td style={tdStyle}>₹{c.revenue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrapper>
        )}
      </section>

      {/* TOP PRODUCTS */}
      <section style={{ marginTop: 16 }}>
        <h2 style={{ marginBottom: 12, fontSize: 18 }}>Top Products</h2>

        {topProducts.length === 0 ? (
          <p style={{ color: "#aaa", fontSize: 14 }}>
            No product data yet. After syncing from Shopify, this section will
            show your best-selling or highest-value products.
          </p>
        ) : (
          <TableWrapper>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 14,
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "rgba(255,255,255,0.02)" }}>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>Product</th>
                  <th style={thStyle}>Price</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, idx) => (
                  <tr key={p.id} style={{ borderTop: "1px solid #333" }}>
                    <td style={tdStyle}>{idx + 1}</td>
                    <td style={tdStyle}>{p.title}</td>
                    <td style={tdStyle}>₹{p.price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrapper>
        )}
      </section>

      <p style={{ color: "#aaa", fontSize: 13, marginTop: 24 }}>
        Next: we’ll connect a real Shopify dev store, persist a tenant in the
        DB, run a manual sync, and watch these widgets fill with real data.
      </p>
    </main>
  );
}

/* ---------- small UI components ---------- */

function Header(props: {
  tenants: Tenant[];
  selectedTenantId: number | null;
  onTenantChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  userEmail: string;
  syncing: boolean;
  onSync: () => void;
  onLogout: () => void;
}) {
  const {
    tenants,
    selectedTenantId,
    onTenantChange,
    userEmail,
    syncing,
    onSync,
    onLogout,
  } = props;

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
      }}
    >
      <div>
        <h1 style={{ marginBottom: 4, fontSize: 24 }}>
          Xeno FDE — Shopify Analytics Dashboard
        </h1>
        <span style={{ fontSize: 13, color: "#9ca3af" }}>
          Multi-tenant view of Shopify stores
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Tenant selector */}
        <label style={{ fontSize: 13, color: "#ccc" }}>
          Tenant:{" "}
          <select
            value={selectedTenantId ?? ""}
            onChange={onTenantChange}
            style={{
              marginLeft: 4,
              padding: "6px 10px",
              borderRadius: 999,
              border: "1px solid #444",
              backgroundColor: "#020617",
              color: "#e5e7eb",
            }}
          >
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} (ID: {t.id})
              </option>
            ))}
          </select>
        </label>

        <button
          onClick={onSync}
          disabled={syncing || !selectedTenantId}
          style={{
            padding: "6px 12px",
            borderRadius: 999,
            border: "1px solid #22c55e",
            backgroundColor: syncing ? "#064e3b" : "#022c22",
            color: "#bbf7d0",
            fontSize: 13,
            cursor: syncing ? "default" : "pointer",
          }}
        >
          {syncing ? "Syncing…" : "Sync now"}
        </button>

        <button
          onClick={() => (window.location.href = "/tenants/new")}
          style={{
            padding: "6px 12px",
            borderRadius: 999,
            border: "1px solid #4f46e5",
            backgroundColor: "#020617",
            color: "#c7d2fe",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          + Add tenant
        </button>

        <div
          style={{
            padding: "6px 10px",
            borderRadius: 999,
            border: "1px solid #374151",
            backgroundColor: "#020617",
            fontSize: 12,
            color: "#e5e7eb",
          }}
        >
          {userEmail}
        </div>

        <button
          onClick={onLogout}
          style={{
            padding: "6px 10px",
            borderRadius: 999,
            border: "1px solid #b91c1c",
            backgroundColor: "#450a0a",
            color: "#fecaca",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>
    </header>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 12px",
  fontWeight: 600,
  color: "#ddd",
};

const tdStyle: React.CSSProperties = {
  padding: "8px 12px",
  color: "#eee",
};

type CardProps = {
  label: string;
  value: string | number;
};

function Card({ label, value }: CardProps) {
  return (
    <div
      style={{
        padding: 18,
        borderRadius: 16,
        border: "1px solid #27272a",
        background:
          "linear-gradient(135deg, rgba(39,39,42,0.9), rgba(17,24,39,1))",
        boxShadow: "0 18px 40px rgba(0,0,0,0.55)",
      }}
    >
      <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function TableWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        overflowX: "auto",
        borderRadius: 16,
        border: "1px solid #333",
        background:
          "linear-gradient(135deg, rgba(24,24,27,0.95), rgba(9,9,11,1))",
      }}
    >
      {children}
    </div>
  );
}
