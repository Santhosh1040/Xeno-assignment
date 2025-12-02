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

<h2 id="api">API Endpoints</h2>

<p>This project exposes the following backend API endpoints:</p>

<h3>Tenants</h3>
<ul>
  <li><code>POST /api/tenants</code> — Create a new tenant (store name, URL, access token)</li>
  <li><code>GET /api/tenants</code> — List all tenants</li>
</ul>

<h3>Ingestion APIs</h3>
<ul>
  <li><code>POST /api/ingest/:tenantId/sync</code> — Trigger manual sync for orders, customers, products</li>
</ul>

<h3>Metrics & Analytics</h3>
<ul>
  <li><code>GET /api/metrics/:tenantId/summary</code> — Total customers, orders, revenue, products</li>
  <li><code>GET /api/metrics/:tenantId/orders-by-date</code> — Orders & revenue trend (date-wise)</li>
  <li><code>GET /api/metrics/:tenantId/top-customers</code> — Top customers ranked by revenue</li>
  <li><code>GET /api/metrics/:tenantId/top-products</code> — Top products ranked by price/value</li>
</ul>

<h2 id="schema">Database Schema</h2>

<p>The system uses a <strong>multi-tenant PostgreSQL schema</strong> where every record is linked to a <code>tenantId</code>.  
Below is the simplified Prisma schema for the project:</p>

<pre>

<code>
// Tenant stores Shopify store credentials
model Tenant {
  id          Int      @id @default(autoincrement())
  name        String
  shopUrl     String
  accessToken String
  createdAt   DateTime @default(now())

  products Product[]
  customers Customer[]
  orders   Order[]
}

// Product catalog imported from Shopify
model Product {
  id        Int      @id @default(autoincrement())
  tenantId  Int
  title     String
  price     Float
  imageUrl  String?
  Tenant    Tenant   @relation(fields: [tenantId], references: [id])
}

// Customers belonging to a tenant
model Customer {
  id        Int      @id @default(autoincrement())
  tenantId  Int
  name      String
  email     String?
  Tenant    Tenant   @relation(fields: [tenantId], references: [id])
  orders    Order[]
}

// Orders placed by customers
model Order {
  id         Int      @id @default(autoincrement())
  tenantId   Int
  customerId Int
  date       DateTime
  totalPrice Float
  Tenant     Tenant   @relation(fields: [tenantId], references: [id])
  customer   Customer @relation(fields: [customerId], references: [id])
}
</code>

</pre>

<p><strong>Key relationships:</strong></p>

<ul>
  <li>Each <code>Tenant</code> has multiple <code>Products</code>, <code>Customers</code>, and <code>Orders</code>.</li>
  <li>Each <code>Order</code> belongs to one <code>Customer</code> and one <code>Tenant</code>.</li>
  <li>All tables include <code>tenantId</code> ensuring strict data separation.</li>
</ul>



<h2 id="limitations">Known Limitations / Assumptions</h2>

<ul>
  <li>This project uses <strong>mock Shopify data</strong> (via seed script) since real Shopify API access requires partner app permissions.</li>

  <li>Email authentication is implemented in a <strong>lightweight demo mode</strong> (any email is accepted). No password or verification is implemented.</li>

  <li>Syncing is simulated. Real Shopify OAuth & webhooks are not implemented in this prototype.</li>

  <li>The dashboard UI is optimized for desktop — mobile responsiveness is partial.</li>

  <li>CRON sync runs locally using <code>node-cron</code>; it is not persisted in Vercel deployment (cron jobs need a server).</li>

  <li>No role-based access control (RBAC). Any authenticated email sees the same tenants.</li>

  <li>Error handling is minimal in the prototype (limited retry logic for API failures).</li>
</ul>




