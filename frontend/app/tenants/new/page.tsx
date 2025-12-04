"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const  API =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "https://xeno-assignment-production-9fa6.up.railway.app";


export default function NewTenantPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [shopUrl, setShopUrl] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !shopUrl.trim() || !accessToken.trim()) {
      setError("Please fill all fields.");
      return;
    }

    try {
      setSaving(true);
      await axios.post(`${API}/api/tenants`, {
        name: name.trim(),
        shopUrl: shopUrl.trim(),
        accessToken: accessToken.trim(),
      });

      router.replace("/"); // back to dashboard
    } catch (err: any) {
      console.error("Create tenant error", err);
      setError(err?.message || "Failed to create tenant");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 24,
        background: "#020617",
        color: "#e5e7eb",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <button
        onClick={() => router.back()}
        style={{
          marginBottom: 16,
          padding: "6px 10px",
          borderRadius: 999,
          border: "1px solid #374151",
          backgroundColor: "transparent",
          color: "#e5e7eb",
          fontSize: 12,
          cursor: "pointer",
        }}
      >
        ← Back
      </button>

      <div
        style={{
          maxWidth: 600,
          borderRadius: 18,
          border: "1px solid #1f2933",
          padding: 24,
          background:
            "linear-gradient(135deg, rgba(17,24,39,1), rgba(15,23,42,1))",
          boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
        }}
      >
        <h1 style={{ fontSize: 22, marginBottom: 8 }}>Add Shopify tenant</h1>
        <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 20 }}>
          Configure a new store for this analytics dashboard. In production,
          these fields would come from the Shopify app install flow.
        </p>

        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>
            Store name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
              placeholder="Demo Store A"
            />
          </label>

          <label style={labelStyle}>
            Shopify shop URL
            <input
              value={shopUrl}
              onChange={(e) => setShopUrl(e.target.value)}
              style={inputStyle}
              placeholder="demo-store-a.myshopify.com"
            />
          </label>

          <label style={labelStyle}>
            Access token
            <input
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              style={inputStyle}
              placeholder="shpat_************************"
            />
          </label>

          {error && (
            <div
              style={{
                marginTop: 8,
                color: "#fca5a5",
                fontSize: 12,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            style={{
              marginTop: 16,
              padding: "10px 14px",
              borderRadius: 999,
              border: "none",
              background:
                "linear-gradient(135deg, #22c55e, #4f46e5)",
              color: "#f9fafb",
              fontWeight: 600,
              fontSize: 14,
              cursor: saving ? "default" : "pointer",
            }}
          >
            {saving ? "Saving…" : "Create tenant"}
          </button>
        </form>
      </div>
    </main>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  marginBottom: 10,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  marginTop: 4,
  marginBottom: 8,
  padding: "9px 11px",
  borderRadius: 10,
  border: "1px solid #4b5563",
  backgroundColor: "#020617",
  color: "#e5e7eb",
  fontSize: 14,
  outline: "none",
};
