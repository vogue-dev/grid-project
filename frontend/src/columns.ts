import type { DataRow } from "./types";

export type ColumnKind = "text" | "number" | "select";

export type GridColumn = {
  key: keyof DataRow;
  header: string;
  width: number;
  kind: ColumnKind;
  options?: string[];
};

const textCols: GridColumn[] = Array.from({ length: 8 }, (_, i) => ({
  key: `text_${i + 1}` as keyof DataRow,
  header: `Text ${i + 1}`,
  width: 180,
  kind: "text"
}));

const numCols: GridColumn[] = Array.from({ length: 8 }, (_, i) => ({
  key: `num_${i + 1}` as keyof DataRow,
  header: `Num ${i + 1}`,
  width: 110,
  kind: "number"
}));

export const columnsConfig: GridColumn[] = [
  { key: "id", header: "ID", width: 90, kind: "number" },
  { key: "title", header: "Title", width: 220, kind: "text" },
  { key: "budget", header: "Budget", width: 120, kind: "number" },
  {
    key: "status",
    header: "Status",
    width: 140,
    kind: "select",
    options: ["todo", "in_progress", "done", "blocked"]
  },
  ...textCols,
  ...numCols,
  { key: "category", header: "Category", width: 140, kind: "select", options: ["creative", "video", "image", "copy"] },
  { key: "channel", header: "Channel", width: 140, kind: "select", options: ["meta", "tiktok", "google", "x"] }
];

export const editableKeys = new Set<keyof DataRow>(
  columnsConfig.filter((c) => c.key !== "id").map((c) => c.key)
);
