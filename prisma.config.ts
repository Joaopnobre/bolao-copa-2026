import "dotenv/config";
import { defineConfig } from "prisma/config";

const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";

// Auto-seleciona o schema baseado no DATABASE_URL:
// - file:  → SQLite local (schema.dev.prisma)
// - postgres(ql): → PostgreSQL produção (schema.prisma)
const isPostgres = url.startsWith("postgresql://") || url.startsWith("postgres://");
const schema = isPostgres ? "prisma/schema.prisma" : "prisma/schema.dev.prisma";

export default defineConfig({
  schema,
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url,
  },
});
