Shopify Analytics Dashboard(Xeno FDE-Assignment)

A full-stack analytics application that ingests Shopify store data, stores it in a multi-tenant PostgreSQL database, and visualizes insights such as revenue trends, order analytics, top customers, and product performance.

🚀 Features Implemented
Backend (Node.js + Express + Prisma + PostgreSQL)

✔ Multi-tenant database design

✔ Ingestion API: fetches products, orders & customers per tenant

✔ Summary & analytics endpoints (revenue, customers, orders, products)

✔ Orders-by-date API powering trend charts

✔ Cron-based automatic syncing

✔ Manual “Sync now” trigger

✔ Prisma seed script generating 2 demo tenants with mock Shopify-style data

✔ Secure environment variable configuration

Frontend (Next.js + React + Recharts)

✔ Lightweight email-based login persisted using localStorage

✔ Multi-tenant dashboard (switch between stores)

✔ KPI cards: Total Revenue, Total Orders, Total Customers, Total Products

✔ Trend chart (Orders & Revenue over time)

✔ Top Customers & Top Products tables

✔ “Sync Now” to trigger ingestion

✔ Add Tenant page (store name, shop URL, access token)

✔ Fully responsive UI with modern dark theme
