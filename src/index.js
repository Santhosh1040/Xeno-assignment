import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import axios from "axios";
import cron from "node-cron";
import { PrismaClient } from "@prisma/client";
import cors from "cors";

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

/* ========================
   MIDDLEWARE
========================= */

// Allowed frontend origins
const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_ORIGIN, // e.g. https://xeno-assignment.vercel.app
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // allow curl/Postman

      const isAllowed = allowedOrigins.includes(origin);

      if (isAllowed) return callback(null, true);

      if (process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

app.use(bodyParser.json());

/* ========================
   ROOT ROUTE (FIXED)
========================= */
app.get("/", (req, res) => {
  res.send("✅ Xeno Assignment Backend is running successfully");
});

/* ========================
   1. HEALTH ENDPOINT
========================= */
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

/* ========================
   2. TENANT APIS
========================= */

app.get("/api/tenants", async (req, res) => {
  try {
    const tenants = await prisma.tenant.findMany({
      orderBy: { id: "asc" },
    });
    res.json(tenants);
  } catch (err) {
    console.error("GET /api/tenants error:", err);
    res.status(500).json({ error: "Failed to list tenants" });
  }
});

app.post("/api/tenants", async (req, res) => {
  try {
    const { name, shopUrl, accessToken } = req.body;

    if (!name || !shopUrl || !accessToken) {
      return res
        .status(400)
        .json({ error: "name, shopUrl and accessToken are required" });
    }

    const tenant = await prisma.tenant.create({
      data: { name, shopUrl, accessToken },
    });

    res.json(tenant);
  } catch (err) {
    console.error("POST /api/tenants error:", err);
    res.status(500).json({ error: "Failed to create tenant" });
  }
});

/* =====================================================
   3. FETCH SHOPIFY DATA
===================================================== */
async function fetchShopifyData(tenantId) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    console.warn("fetchShopifyData: tenant not found", { tenantId });
    return null;
  }

  const base = `https://${tenant.shopUrl}/admin/api/2024-01`;
  const headers = {
    "X-Shopify-Access-Token": tenant.accessToken,
    "Content-Type": "application/json",
  };

  try {
    const [productsRes, customersRes, ordersRes] = await Promise.all([
      axios.get(`${base}/products.json`, { headers }),
      axios.get(`${base}/customers.json`, { headers }),
      axios.get(`${base}/orders.json`, { headers }),
    ]);

    return {
      products: productsRes.data.products || [],
      customers: customersRes.data.customers || [],
      orders: ordersRes.data.orders || [],
    };
  } catch (err) {
    console.error("Shopify API Error:", err.response?.data || err);
    return null;
  }
}

/* ===============================================
   4. INGEST INTO DATABASE
=============================================== */
async function ingestShopifyData(tenantId, data) {
  if (!data) return;

  const { products, customers, orders } = data;

  for (const p of products) {
    try {
      await prisma.product.upsert({
        where: { shopifyId: String(p.id) },
        update: {
          title: p.title,
          price: Number(p.variants?.[0]?.price || 0),
        },
        create: {
          shopifyId: String(p.id),
          title: p.title,
          price: Number(p.variants?.[0]?.price || 0),
          tenantId,
        },
      });
    } catch (err) {
      console.error("ingest product error", p.id, err);
    }
  }

  for (const c of customers) {
    try {
      await prisma.customer.upsert({
        where: { shopifyId: String(c.id) },
        update: {
          email: c.email || "",
          firstName: c.first_name || "",
          lastName: c.last_name || "",
        },
        create: {
          shopifyId: String(c.id),
          email: c.email || "",
          firstName: c.first_name || "",
          lastName: c.last_name || "",
          createdAt: new Date(c.created_at),
          tenantId,
        },
      });
    } catch (err) {
      console.error("ingest customer error", c.id, err);
    }
  }

  for (const o of orders) {
    try {
      await prisma.order.upsert({
        where: { shopifyId: String(o.id) },
        update: {
          totalPrice: Number(o.total_price || 0),
          orderDate: new Date(o.created_at),
          customerId: o.customer ? o.customer.id : null,
        },
        create: {
          shopifyId: String(o.id),
          totalPrice: Number(o.total_price || 0),
          orderDate: new Date(o.created_at),
          customerId: o.customer ? o.customer.id : null,
          tenantId,
        },
      });
    } catch (err) {
      console.error("ingest order error", o.id, err);
    }
  }

  return true;
}

/* ===============================================
   5. MANUAL SYNC ENDPOINT
=============================================== */
app.post("/api/ingest/:tenantId/sync", async (req, res) => {
  try {
    const tenantId = Number(req.params.tenantId);

    const data = await fetchShopifyData(tenantId);
    await ingestShopifyData(tenantId, data);

    res.json({ ok: true });
  } catch (err) {
    console.error("POST /api/ingest/:tenantId/sync error:", err);
    res.status(500).json({ error: "Failed to ingest data" });
  }
});

/* ===============================================
   6. METRICS SUMMARY
=============================================== */
app.get("/api/metrics/:tenantId/summary", async (req, res) => {
  try {
    const tenantId = Number(req.params.tenantId);

    const customers = await prisma.customer.count({ where: { tenantId } });
    const products = await prisma.product.count({ where: { tenantId } });
    const orders = await prisma.order.count({ where: { tenantId } });

    const revenue = await prisma.order.aggregate({
      _sum: { totalPrice: true },
      where: { tenantId },
    });

    res.json({
      totalCustomers: customers,
      totalProducts: products,
      totalOrders: orders,
      totalRevenue: revenue._sum.totalPrice || 0,
    });
  } catch (err) {
    console.error("GET /api/metrics/:tenantId/summary error:", err);
    res.status(500).json({ error: "Failed to compute summary" });
  }
});

/* ===============================================
   CRON JOB (every 10 mins)
=============================================== */
cron.schedule("*/10 * * * *", async () => {
  try {
    const tenants = await prisma.tenant.findMany();
    for (const t of tenants) {
      const data = await fetchShopifyData(t.id);
      await ingestShopifyData(t.id, data);
    }
  } catch (err) {
    console.error("CRON sync error:", err);
  }
});

/* ===============================================
   GRACEFUL SHUTDOWN (IMPORTANT FOR RAILWAY)
=============================================== */
process.on("SIGTERM", async () => {
  console.log("SIGTERM received. Closing Prisma...");
  await prisma.$disconnect();
  process.exit(0);
});

/* ===============================================
   START SERVER
=============================================== */
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
