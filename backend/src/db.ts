import { Pool } from "pg";

const TARGET_ROWS = Number(process.env.SEED_ROWS ?? "50000");
const textCols = Array.from({ length: 8 }, (_, i) => `text_${i + 1}`);
const numCols = Array.from({ length: 8 }, (_, i) => `num_${i + 1}`);

export const editableColumns = [
  "title",
  "budget",
  "status",
  ...textCols,
  ...numCols,
  "category",
  "channel"
] as const;

export const pool = new Pool({
  host: process.env.POSTGRES_HOST ?? "postgres",
  port: Number(process.env.POSTGRES_PORT ?? 5432),
  user: process.env.POSTGRES_USER ?? "postgres",
  password: process.env.POSTGRES_PASSWORD ?? "postgres",
  database: process.env.POSTGRES_DB ?? "martech"
});

export const initDb = async () => {
  const textSchema = textCols.map((c) => `${c} TEXT NOT NULL`).join(",\n");
  const numSchema = numCols.map((c) => `${c} INTEGER NOT NULL DEFAULT 0`).join(",\n");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS creative_rows (
      id BIGSERIAL PRIMARY KEY,
      version INTEGER NOT NULL DEFAULT 1,
      title TEXT NOT NULL,
      budget NUMERIC(12,2) NOT NULL DEFAULT 0,
      status TEXT NOT NULL,
      ${textSchema},
      ${numSchema},
      category TEXT NOT NULL,
      channel TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  const total = await pool.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM creative_rows");
  const count = Number(total.rows[0]?.count ?? 0);
  if (count >= TARGET_ROWS) return;

  const textSelect = textCols.map((_, i) => `'txt_' || g || '_${i + 1}'`).join(",\n");
  const numSelect = numCols.map(() => "floor(random() * 1000)::int").join(",\n");
  const missing = TARGET_ROWS - count;

  await pool.query(
    `
      INSERT INTO creative_rows (
        title, budget, status, ${textCols.join(", ")}, ${numCols.join(", ")}, category, channel
      )
      SELECT
        'Creative #' || g,
        ((random() * 9000) + 100)::numeric(12,2),
        (ARRAY['todo','in_progress','done','blocked'])[floor(random() * 4 + 1)],
        ${textSelect},
        ${numSelect},
        (ARRAY['creative','video','image','copy'])[floor(random() * 4 + 1)],
        (ARRAY['meta','tiktok','google','x'])[floor(random() * 4 + 1)]
      FROM generate_series(1, $1) g;
    `,
    [missing]
  );
};

export const getRows = async (limit: number, offset: number) => {
  const [rows, total] = await Promise.all([
    pool.query("SELECT * FROM creative_rows ORDER BY id LIMIT $1 OFFSET $2", [limit, offset]),
    pool.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM creative_rows")
  ]);

  return {
    rows: rows.rows,
    total: Number(total.rows[0]?.count ?? 0)
  };
};

export const isEditableColumn = (column: string): column is (typeof editableColumns)[number] =>
  editableColumns.includes(column as (typeof editableColumns)[number]);
