import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedTenant({
  id,
  name,
  shopUrl,
  baseDate, // Date object
}) {
  const tenant = await prisma.tenant.upsert({
    where: { id },
    update: {
      name,
      shopUrl,
    },
    create: {
      id,
      name,
      shopUrl,
      accessToken: `dummy-token-${id}`,
    },
  });

  console.log(`Seeded tenant ${id}: ${tenant.name}`);

  // 1) Customers (8 per tenant)
  const customers = [];
  for (let i = 1; i <= 8; i++) {
    const cust = await prisma.customer.upsert({
      where: { shopifyId: `T${id}_C${i}` },
      update: {},
      create: {
        shopifyId: `T${id}_C${i}`,
        email: `customer${i}_t${id}@example.com`,
        firstName: `Customer${i}`,
        lastName: `Tenant${id}`,
        createdAt: new Date(
          baseDate.getFullYear(),
          baseDate.getMonth(),
          baseDate.getDate() + i
        ),
        tenantId: tenant.id,
      },
    });
    customers.push(cust);
  }

  console.log(`  Customers for tenant ${id}: ${customers.length}`);

  // 2) Products (4 per tenant)
  const productTitles = [
    "Running Shoes",
    "Sports T-Shirt",
    "Water Bottle",
    "Fitness Tracker",
  ];

  const products = [];
  for (let i = 0; i < productTitles.length; i++) {
    const priceBase = 1000 + id * 200 + i * 150;
    const prod = await prisma.product.upsert({
      where: { shopifyId: `T${id}_P${i + 1}` },
      update: {},
      create: {
        shopifyId: `T${id}_P${i + 1}`,
        title: `${productTitles[i]} (Store ${id})`,
        price: priceBase,
        tenantId: tenant.id,
      },
    });
    products.push(prod);
  }

  console.log(`  Products for tenant ${id}: ${products.length}`);

  // 3) Orders (10 per tenant)
  for (let i = 1; i <= 10; i++) {
    const customer = customers[(i - 1) % customers.length];
    const product = products[(i - 1) % products.length];

    const orderDate = new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate() + 10 + i // spread across days
    );

    const totalPrice = product.price + 100 * ((i + id) % 3); // vary a bit

    await prisma.order.upsert({
      where: { shopifyId: `T${id}_O${i}` },
      update: {},
      create: {
        shopifyId: `T${id}_O${i}`,
        totalPrice,
        orderDate,
        customerId: customer.id,
        tenantId: tenant.id,
      },
    });
  }

  console.log(`  Orders for tenant ${id}: 10`);
}

async function main() {
  // Choose different base dates per tenant so charts look different
  const base = new Date(2025, 1, 1); // Feb 1 2025

  await seedTenant({
    id: 1,
    name: "Demo Store A",
    shopUrl: "demo-a.myshopify.com",
    baseDate: new Date(base),
  });

  await seedTenant({
    id: 2,
    name: "Demo Store B",
    shopUrl: "demo-b.myshopify.com",
    baseDate: new Date(2025, 2, 1), // March
  });

  await seedTenant({
    id: 3,
    name: "Demo Store C",
    shopUrl: "demo-c.myshopify.com",
    baseDate: new Date(2025, 3, 1), // April
  });

  await seedTenant({
    id: 4,
    name: "Demo Store D",
    shopUrl: "demo-d.myshopify.com",
    baseDate: new Date(2025, 4, 1), // May
  });

  console.log("✅ Seed data inserted for 4 tenants");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
