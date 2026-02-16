import { Router } from "express";
import { getRows, isEditableColumn, pool } from "../db.js";
import { parseCellValue, toInt } from "../utils/parse.js";

const rowsRouter = Router();

rowsRouter.get("/", async (req, res) => {
  const limit = Math.min(3000, Math.max(100, toInt(req.query.limit) || 500));
  const offset = Math.max(0, toInt(req.query.offset) || 0);
  res.json(await getRows(limit, offset));
});

rowsRouter.patch("/:id", async (req, res) => {
  const id = toInt(req.params.id);
  const column = String(req.body?.column ?? "");
  const baseVersion = req.body?.baseVersion ? toInt(req.body.baseVersion) : undefined;

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid row id" });
  }

  if (!isEditableColumn(column)) {
    return res.status(400).json({ error: "Column is not editable" });
  }

  let parsedValue: string | number;

  try {
    parsedValue = parseCellValue(column, req.body?.value);
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : "Invalid value" });
  }

  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");

    const check = await client.query<{ version: number }>(
      "SELECT version FROM creative_rows WHERE id = $1 FOR UPDATE",
      [id]
    );

    if (!check.rowCount) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Row not found" });
    }

    const currentVersion = check.rows[0].version;
    if (baseVersion && baseVersion !== currentVersion) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "Version conflict", currentVersion });
    }

    const updated = await client.query(
      `UPDATE creative_rows
       SET "${column}" = $1, version = version + 1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, version, "${column}" AS value, updated_at`,
      [parsedValue, id]
    );

    const payload = { ...updated.rows[0], column };
    await client.query("SELECT pg_notify('row_updates', $1)", [JSON.stringify(payload)]);
    await client.query("COMMIT");

    return res.json(updated.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({ error: error instanceof Error ? error.message : "Unexpected error" });
  } finally {
    client.release();
  }
});

export { rowsRouter };
