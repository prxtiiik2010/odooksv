import pg from "pg";
const { Pool } = pg;

async function check() {
  const pool = new Pool({
    host: "localhost",
    port: 5432,
    database: "procurement",
    user: "postgres",
    password: "Pratikdave2010",
  });

  try {
    const res = await pool.query("SELECT version(), current_database() as db");
    console.log("PostgreSQL OK:", res.rows[0]);

    const vendorRes = await pool.query('SELECT * FROM "User" LIMIT 2');
    console.log("User table cols:", Object.keys(vendorRes.fields.reduce((a, f) => ({ ...a, [f.name]: 1 }), {})));

    await pool.end();
  } catch (e) {
    console.error("PG error:", e.message);
    await pool.end();
  }
}

check();
