import type { DataRow, RowsResponse } from "../types";

export type InfiniteRowsData = {
  pages: RowsResponse[];
  pageParams: unknown[];
};

export const flattenRows = (data?: InfiniteRowsData): DataRow[] =>
  data?.pages.flatMap((page) => page.rows) ?? [];

export const getTotalRows = (data?: InfiniteRowsData): number => data?.pages[0]?.total ?? 0;

export const updateRowInCache = (
  data: InfiniteRowsData | undefined,
  rowId: number,
  updateRow: (row: DataRow) => DataRow
): InfiniteRowsData | undefined => {
  if (!data) {
    return data;
  }

  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      rows: page.rows.map((row) => (row.id === rowId ? updateRow(row) : row))
    }))
  };
};
