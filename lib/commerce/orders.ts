import { DatabaseSync } from "node:sqlite";
import { chmodSync, existsSync, lstatSync, mkdirSync, realpathSync, statSync } from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { randomUUID } from "node:crypto";
import type { CheckoutProductId } from "../catalog.ts";

export type Order = {
  nsu: string; request_key: string; bundle_id: CheckoutProductId; quantity: number;
  amount: number; handle: string; state: "pending" | "paid";
  checkout_url: string | null; lease_until: number; created_at: string;
  transaction_nsu: string | null; invoice_slug: string | null;
  paid_amount: number | null; capture_method: string | null; paid_at: string | null;
};
function inside(path: string, parent: string) {
  const rel = relative(parent, path);
  return rel === "" || (!rel.startsWith(".." + sep) && rel !== ".." && !isAbsolute(rel));
}
export function validDataDir(value: string | undefined, production: boolean) {
  if (!value || !isAbsolute(value)) return false;
  const dir = resolve(value);
  if (dir === sep || dir.split(sep).some(part => ["public", "public_html", ".next"].includes(part))) return false;
  return !production || !inside(dir, process.cwd());
}

// A private SQLite file outside the deployed checkout survives new releases.
// SQL reservations work across Node workers; no network operation holds a transaction.
export class OrderStore {
  private db: DatabaseSync;
  constructor(directory: string, production = false) {
    if (!validDataDir(directory, production)) throw new Error("Invalid private order directory");
    // Windows does not expose POSIX privacy bits. Permit local development,
    // while production keeps requiring the Linux/POSIX storage checks below.
    if (process.platform === "win32" && production)
      throw new Error("Production order storage requires POSIX file permissions");
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    const actual = realpathSync(directory);
    if (!validDataDir(actual, production)) throw new Error("Unsafe order directory");
    if (process.platform !== "win32" && (statSync(actual).mode & 0o077))
      throw new Error("Order directory must be private (0700)");
    const filename = join(actual, "orders.sqlite");
    if (existsSync(filename) && !lstatSync(filename).isFile()) throw new Error("Unsafe database file");
    this.db = new DatabaseSync(filename);
    if (process.platform !== "win32") chmodSync(filename, 0o600);
    this.db.exec(`PRAGMA busy_timeout=1000; PRAGMA journal_mode=WAL;
      CREATE TABLE IF NOT EXISTS orders (
        nsu TEXT PRIMARY KEY, request_key TEXT NOT NULL UNIQUE,
        bundle_id TEXT NOT NULL, quantity INTEGER NOT NULL, amount INTEGER NOT NULL,
        handle TEXT NOT NULL, state TEXT NOT NULL DEFAULT 'pending', checkout_url TEXT,
        lease_until INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL,
        transaction_nsu TEXT UNIQUE, invoice_slug TEXT, paid_amount INTEGER,
        capture_method TEXT, paid_at TEXT
      ) STRICT;`);
  }
  get(nsu: string): Order | undefined {
    return this.db.prepare("SELECT * FROM orders WHERE nsu = ?").get(nsu) as Order | undefined;
  }
  reserve(requestKey: string, bundle: { id: CheckoutProductId; quantity: number; priceCents: number }, handle: string) {
    this.db.prepare(`INSERT OR IGNORE INTO orders
      (nsu, request_key, bundle_id, quantity, amount, handle, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run("BDH-" + randomUUID(), requestKey, bundle.id, bundle.quantity, bundle.priceCents, handle, new Date().toISOString());
    const order = this.db.prepare("SELECT * FROM orders WHERE request_key = ?").get(requestKey) as Order;
    if (order.handle !== handle || order.amount !== bundle.priceCents) throw new Error("Order configuration changed");
    const claimed = !order.checkout_url && order.state !== "paid" && Boolean(this.db.prepare(
      "UPDATE orders SET lease_until = ? WHERE nsu = ? AND checkout_url IS NULL AND state = 'pending' AND lease_until < ?"
    ).run(Date.now() + 60000, order.nsu, Date.now()).changes);
    return { order, claimed };
  }
  saveCheckout(nsu: string, url: string) {
    this.db.prepare("UPDATE orders SET checkout_url = ?, lease_until = 0 WHERE nsu = ?").run(url, nsu);
  }
  release(nsu: string) {
    this.db.prepare("UPDATE orders SET lease_until = 0 WHERE nsu = ?").run(nsu);
  }
  confirm(nsu: string, payment: { transaction: string; slug: string; paidAmount: number; method: string }) {
    const result = this.db.prepare(`UPDATE orders SET state = 'paid', transaction_nsu = ?,
      invoice_slug = ?, paid_amount = ?, capture_method = ?, paid_at = ?
      WHERE nsu = ? AND state = 'pending'`)
      .run(payment.transaction, payment.slug, payment.paidAmount, payment.method, new Date().toISOString(), nsu);
    const order = this.get(nsu);
    if (!result.changes && order?.transaction_nsu !== payment.transaction) throw new Error("Conflicting payment");
    return order!;
  }
  close() { this.db.close(); }
}
