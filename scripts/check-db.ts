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
    const schemaRes = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'Vendor' ORDER BY ordinal_position`,
    );
    console.log(
      "Vendor columns:",
      schemaRes.rows.map((r) => r.column_name),
    );

    const sampleRes = await pool.query('SELECT * FROM "Vendor" LIMIT 2');
    console.log("Vendor sample:", JSON.stringify(sampleRes.rows[0], null, 2));

    const rfqJunction = await pool.query(`SELECT * FROM "RFQVendor" LIMIT 2`);
    console.log(
      "RFQVendor junction sample:",
      JSON.stringify(rfqJunction.rows[0], null, 2),
    );

    await pool.end();
  } catch (e) {
    console.error("Error:", e.message);
    await pool.end();
  }
}

check();
