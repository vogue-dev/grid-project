type Idx = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
type TextCols = `text_${Idx}`;
type NumCols = `num_${Idx}`;

export type DataRow = {
  id: number;
  version: number;
  title: string;
  budget: number;
  status: "todo" | "in_progress" | "done" | "blocked";
  category: "creative" | "video" | "image" | "copy";
  channel: "meta" | "tiktok" | "google" | "x";
  updated_at: string;
} & Record<TextCols, string> & Record<NumCols, number>;

export type RowsResponse = {
  rows: DataRow[];
  total: number;
};

export type CellUpdateMessage = {
  id: number;
  version: number;
  column: keyof DataRow;
  value: string | number;
  updated_at: string;
};
