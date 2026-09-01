import { Pool } from "pg";

export type EliteCheckoutStatus = "pending" | "approved" | "rejected";

export type EliteCheckoutOrder = {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  mobile: string;
  paymentMethod: string;
  couponCode: string;
  basePrice: number;
  coachingHours: number;
  coachingMode: "" | "online" | "in-person";
  price: number;
  receiptName: string;
  receiptUrl: string;
  status: EliteCheckoutStatus;
  createdAt: string;
  approvedAt: string;
  approvedBy: string;
};

const memoryOrders: EliteCheckoutOrder[] = [];
let pool: Pool | null | undefined;
let tableReady = false;

function getPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;

  if (pool === undefined) {
    pool = new Pool({
      connectionString,
      ssl: connectionString.includes("localhost") ? undefined : { rejectUnauthorized: false },
    });
  }
  return pool;
}

async function ensureTable(client: Pool) {
  if (tableReady) return;
  await client.query(`
    CREATE TABLE IF NOT EXISTS elite_checkout_orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      mobile TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      coupon_code TEXT NOT NULL DEFAULT '',
      base_price INTEGER NOT NULL DEFAULT 0,
      coaching_hours INTEGER NOT NULL DEFAULT 0,
      coaching_mode TEXT NOT NULL DEFAULT '',
      price INTEGER NOT NULL,
      receipt_name TEXT NOT NULL,
      receipt_url TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      approved_at TIMESTAMPTZ,
      approved_by TEXT NOT NULL DEFAULT ''
    )
  `);
  await client.query(`ALTER TABLE elite_checkout_orders ADD COLUMN IF NOT EXISTS base_price INTEGER NOT NULL DEFAULT 0`);
  await client.query(`ALTER TABLE elite_checkout_orders ADD COLUMN IF NOT EXISTS coaching_hours INTEGER NOT NULL DEFAULT 0`);
  await client.query(`ALTER TABLE elite_checkout_orders ADD COLUMN IF NOT EXISTS coaching_mode TEXT NOT NULL DEFAULT ''`);
  await client.query(`
    CREATE INDEX IF NOT EXISTS elite_checkout_orders_status_created_idx
    ON elite_checkout_orders (status, created_at DESC)
  `);
  tableReady = true;
}

function mapRow(row: Record<string, unknown>): EliteCheckoutOrder {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    fullName: String(row.full_name),
    email: String(row.email).toLowerCase(),
    mobile: String(row.mobile),
    paymentMethod: String(row.payment_method),
    couponCode: String(row.coupon_code ?? ""),
    basePrice: Number(row.base_price || row.price),
    coachingHours: Number(row.coaching_hours ?? 0),
    coachingMode:
      row.coaching_mode === "in-person"
        ? "in-person"
        : Number(row.coaching_hours ?? 0) > 0
          ? "online"
          : "",
    price: Number(row.price),
    receiptName: String(row.receipt_name),
    receiptUrl: String(row.receipt_url),
    status: row.status === "approved" ? "approved" : row.status === "rejected" ? "rejected" : "pending",
    createdAt: new Date(String(row.created_at)).toISOString(),
    approvedAt: row.approved_at ? new Date(String(row.approved_at)).toISOString() : "",
    approvedBy: String(row.approved_by ?? ""),
  };
}

export async function createEliteCheckoutOrder(
  input: Omit<EliteCheckoutOrder, "id" | "status" | "createdAt" | "approvedAt" | "approvedBy">,
) {
  const order: EliteCheckoutOrder = {
    ...input,
    id: `elite-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    status: "pending",
    createdAt: new Date().toISOString(),
    approvedAt: "",
    approvedBy: "",
  };
  memoryOrders.unshift(order);

  const client = getPool();
  if (client) {
    try {
      await ensureTable(client);
      await client.query(
        `
        INSERT INTO elite_checkout_orders (
          id, user_id, full_name, email, mobile, payment_method, coupon_code,
          base_price, coaching_hours, coaching_mode, price, receipt_name, receipt_url, status, created_at, approved_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        `,
        [
          order.id,
          order.userId,
          order.fullName,
          order.email,
          order.mobile,
          order.paymentMethod,
          order.couponCode,
          order.basePrice,
          order.coachingHours,
          order.coachingMode,
          order.price,
          order.receiptName,
          order.receiptUrl,
          order.status,
          order.createdAt,
          order.approvedBy,
        ],
      );
    } catch (error) {
      const memoryIndex = memoryOrders.findIndex((item) => item.id === order.id);
      if (memoryIndex >= 0) memoryOrders.splice(memoryIndex, 1);
      console.error("Failed to persist Mastermind checkout", error);
      throw new Error("I couldn't save your payment submission. Please try again.");
    }
  }
  return order;
}

export async function listEliteCheckoutOrders() {
  const client = getPool();
  if (!client) return [...memoryOrders];

  await ensureTable(client);
  const result = await client.query(
    "SELECT * FROM elite_checkout_orders ORDER BY CASE WHEN status = 'pending' THEN 0 ELSE 1 END, created_at DESC",
  );
  return result.rows.map(mapRow);
}

export async function listEliteCheckoutOrdersForUser(userId: string) {
  const client = getPool();
  if (!client) return memoryOrders.filter((order) => order.userId === userId);

  await ensureTable(client);
  const result = await client.query(
    "SELECT * FROM elite_checkout_orders WHERE user_id = $1 ORDER BY created_at DESC",
    [userId],
  );
  return result.rows.map(mapRow);
}

export async function getEliteCheckoutOrder(orderId: string) {
  const client = getPool();
  if (!client) return memoryOrders.find((order) => order.id === orderId) ?? null;

  await ensureTable(client);
  const result = await client.query("SELECT * FROM elite_checkout_orders WHERE id = $1 LIMIT 1", [orderId]);
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function deleteEliteCheckoutOrder(orderId: string) {
  const memoryIndex = memoryOrders.findIndex((order) => order.id === orderId);
  const existing = memoryIndex >= 0 ? memoryOrders[memoryIndex] : null;
  if (memoryIndex >= 0) {
    memoryOrders.splice(memoryIndex, 1);
  }

  const client = getPool();
  if (client) {
    await ensureTable(client);
    const result = await client.query("DELETE FROM elite_checkout_orders WHERE id = $1 RETURNING *", [orderId]);
    return result.rows[0] ? mapRow(result.rows[0]) : existing;
  }

  return existing;
}

export async function approveEliteCheckoutOrder(orderId: string, approvedBy: string) {
  const approvedAt = new Date().toISOString();
  const memoryIndex = memoryOrders.findIndex((order) => order.id === orderId);
  if (memoryIndex >= 0) {
    memoryOrders[memoryIndex] = { ...memoryOrders[memoryIndex], status: "approved", approvedAt, approvedBy };
  }

  const client = getPool();
  if (client) {
    await ensureTable(client);
    const result = await client.query(
      `
      UPDATE elite_checkout_orders
      SET status = 'approved', approved_at = $2, approved_by = $3
      WHERE id = $1
      RETURNING *
      `,
      [orderId, approvedAt, approvedBy],
    );
    if (!result.rows[0]) throw new Error("Payment submission not found.");
    return mapRow(result.rows[0]);
  }

  if (memoryIndex < 0) throw new Error("Payment submission not found.");
  return memoryOrders[memoryIndex];
}

export async function rejectEliteCheckoutOrder(orderId: string, reviewedBy: string) {
  const approvedAt = new Date().toISOString();
  const memoryIndex = memoryOrders.findIndex((order) => order.id === orderId);
  if (memoryIndex >= 0) {
    memoryOrders[memoryIndex] = { ...memoryOrders[memoryIndex], status: "rejected", approvedAt, approvedBy: reviewedBy };
  }

  const client = getPool();
  if (client) {
    await ensureTable(client);
    const result = await client.query(
      `
      UPDATE elite_checkout_orders
      SET status = 'rejected', approved_at = $2, approved_by = $3
      WHERE id = $1
      RETURNING *
      `,
      [orderId, approvedAt, reviewedBy],
    );
    if (!result.rows[0]) throw new Error("Payment submission not found.");
    return mapRow(result.rows[0]);
  }

  if (memoryIndex < 0) throw new Error("Payment submission not found.");
  return memoryOrders[memoryIndex];
}

export async function approveEliteCheckoutOrdersForUser(userId: string, approvedBy: string) {
  const orders = (await listEliteCheckoutOrders()).filter(
    (order) => order.userId === userId && order.status === "pending",
  );
  for (const order of orders) {
    await approveEliteCheckoutOrder(order.id, approvedBy);
  }
  return orders.length;
}
