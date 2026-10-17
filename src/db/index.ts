import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as {
  studioSql?: ReturnType<typeof postgres>;
  studioDb?: Db;
};

function createDb(): Db {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is required. Copy .env.example to .env.local and set a Postgres URL.",
    );
  }

  const sql =
    globalForDb.studioSql ??
    postgres(url, {
      max: 10,
      prepare: false,
    });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.studioSql = sql;
  }

  return drizzle(sql, { schema });
}

function getDb(): Db {
  if (!globalForDb.studioDb) {
    globalForDb.studioDb = createDb();
  }
  return globalForDb.studioDb;
}

/** Lazily connects so module import does not require DATABASE_URL until first use. */
export const db = new Proxy({} as Db, {
  get(_target, property, receiver) {
    const instance = getDb();
    const value = Reflect.get(instance, property, receiver);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export type Database = Db;
