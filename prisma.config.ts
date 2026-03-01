import path from 'node:path';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  migrate: {
    async adapter() {
      const { createClient } = await import('@libsql/client');
      const { PrismaLibSQL } = await import('@prisma/adapter-libsql');
      const client = createClient({ url: `file:${path.join(__dirname, 'prisma', 'dev.db')}` });
      return new PrismaLibSQL(client);
    },
  },
});
