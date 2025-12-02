<h1 align="center"> Shopify Analytics Dashboard (Xeno FDE Assignment) </h1>

<p align="center">
A full-stack multi-tenant Shopify analytics dashboard built as part of the Xeno FDE Internship assignment.  
It ingests Shopify-like data, stores it in a multi-tenant DB, and visualizes insights such as revenue, orders, customers, and products.
</p>

<h2 id="technologies">🚀 Technologies</h2>

This project was developed using the following technologies:

<h3>Frontend</h3>

- Next.js  
- React.js  
- Recharts  
- Axios  
- CSS Modules  

<h3>Backend</h3>

- Node.js  
- Express.js  
- Prisma ORM  
- PostgreSQL  
- Node-Cron  

<h2>Features</h2>

- Multi-tenant database model  
- Add new Shopify tenants (store name, shop URL, access token)  
- Manual **Sync Now** button  
- Automatic cron-based syncing  
- KPI Metrics: Total Revenue, Orders, Customers, Products  
- Orders & Revenue Trend Chart  
- Top Customers Table  
- Top Products Table  
- Lightweight email-based login (demo authentication)  

---

<h2>Setup Instructions</h2>

<h3>Backend</h3>

<pre>
cd backend
npm install
npx prisma migrate dev
node prisma/seed.js
npm run dev
</pre>

<h3>Frontend</h3>

<pre>
cd frontend
npm install
npm run dev
</pre>


<h2>Architecture Diagram</h2>
                +------------------+
                |   Next.js App    |
                |  (Frontend UI)   |
                +---------+--------+
                          |
                          | Axios (API calls)
                          v
               +----------+-----------+
               |   Node.js + Express  |
               |      Backend API     |
               +----------+-----------+
                          |
                          | Prisma ORM
                          v
                 +--------+--------+
                 |   PostgreSQL    |
                 | Multi-Tenant DB |
                 +-----------------+



