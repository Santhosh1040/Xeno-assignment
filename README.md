Shopify Analytics Dashboard(Xeno FDE-Assignment)

A full-stack analytics dashboard that ingests Shopify data, stores it in a multi-tenant DB, and visualizes insights such as revenue trends, orders per day, top customers, and top products.

🚀 Features Implemented
Backend (Node.js + Express + Prisma + PostgreSQL)

Multi-tenant database design

Ingestion API: reads products, orders & customers from Shopify

Summaries & analytics endpoints

Cron-based automatic syncing

Seed script generating demo tenants & mock Shopify-like data

Frontend (Next.js + React + Recharts)

Multi-tenant dashboard

Email-based lightweight login

Trend charts (Orders & Revenue)

Top customers & top products tables

“Sync now” button to trigger ingestion

“Add tenant” form (store name, shop URL, access token)
