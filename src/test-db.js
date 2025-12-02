const { PrismaClient } = require('@prisma/client');

const p = new PrismaClient();

p.$connect()
  .then(() => console.log('DB OK'))
  .catch(e => console.error('DB ERROR', e))
  .finally(() => p.$disconnect());
