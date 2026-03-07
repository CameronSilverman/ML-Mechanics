const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Project `data` column stores the full canvas state as JSONB:
// {
//   blocks: [
//     {
//       id: "block-1",
//       type: "Conv2D",
//       label: "Conv2D",
//       icon: "⊞",
//       color: "#2563eb",
//       x: 120,
//       y: 200,
//       properties: { filters: 32, kernelSize: 3, activation: "relu", padding: "same" },
//       connectedOutputs: { out: [{ targetBlockId: "block-2", targetPort: "in" }] },
//       connectedInputs:  { in:  { sourceBlockId: "block-0", sourcePort: "out" } }
//     },
//     ...
//   ],
//   connections: [
//     { id: "conn-1234", fromBlockId: "block-1", fromPort: "out", toBlockId: "block-2", toPort: "in" },
//     ...
//   ]
// }

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            SERIAL PRIMARY KEY,
        email         VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at    TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS projects (
        id          SERIAL PRIMARY KEY,
        user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name        VARCHAR(255) NOT NULL,
        data        JSONB NOT NULL DEFAULT '{"blocks":[],"connections":[]}',
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        updated_at  TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);
    `);
    console.log("Database tables ready");
  } finally {
    client.release();
  }
}

module.exports = { pool, initDB };