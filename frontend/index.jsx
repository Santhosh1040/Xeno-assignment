// frontend/pages/index.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [ordersByDate, setOrdersByDate] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // demo uses tenantId = 1
        const [s, ob] = await Promise.all([
          axios.get(`${API}/api/metrics/1/summary`),
          axios.get(`${API}/api/metrics/1/orders-by-date?days=30`),
        ]);
        setSummary(s.data);
        const chartData = (ob.data.data || []).map((r) => ({
          date: r.date?.slice(0, 10) || r.date,
          revenue: Number(r.revenue || 0),
          orders: Number(r.orders_count || 0),
        }));
        setOrdersByDate(chartData);
      } catch (err) {
        console.error("Failed to load metrics", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div style={{ padding: 28, fontFamily: "Inter, system-ui, Arial" }}>
      <h1 style={{ marginBottom: 12 }}>Xeno FDE — Dashboard (Demo)</h1>

      {loading ? (
        <p>Loading...</p>
      ) : !summary ? (
        <p>No data — make sure tenant 1 exists and you ran the ingest.</p>
      ) : (
        <>
          <div style={{ display: "flex", gap: 16 }}>
            <Card label="Total Orders" value={summary.totalOrders} />
            <Card label="Total Customers" value={summary.totalCustomers} />
            <Card
              label="Total Revenue"
              value={`₹${Number(summary.totalRevenue || 0).toFixed(2)}`}
            />
          </div>

          <section style={{ marginTop: 36 }}>
            <h2>Orders & Revenue (last 30 days)</h2>
            <div style={{ width: "100%", height: 360 }}>
              <ResponsiveContainer>
                <LineChart data={ordersByDate}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#8884d8"
                    name="Revenue"
                  />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke="#82ca9d"
                    name="Orders"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Card({ label, value }) {
  return (
    <div
      style={{
        padding: 16,
        border: "1px solid #e6e6e6",
        borderRadius: 8,
        minWidth: 180,
        textAlign: "center",
      }}
    >
      <div style={{ color: "#666", fontSize: 14 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6 }}>{value}</div>
    </div>
  );
}
