import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data", "cofrinho.db");

function getDb() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS caixinhas (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      total_days  INTEGER NOT NULL CHECK (total_days >= 1),
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      status      TEXT    NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
      drawn_value INTEGER
    );
    CREATE TABLE IF NOT EXISTS deposits (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      caixinha_id  INTEGER NOT NULL REFERENCES caixinhas(id) ON DELETE CASCADE,
      value        INTEGER NOT NULL,
      deposited_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);
  return db;
}

const globalForDb = global as typeof global & { _db?: Database.Database };
export const db = globalForDb._db ?? (globalForDb._db = getDb());
