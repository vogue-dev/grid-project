import type { DataRow, RowsResponse } from "./types";

const API_BASE = "http://localhost:8080/api";

export const fetchRows = async (offset: number, limit: number): Promise<RowsResponse> => {
  const response = await fetch(`${API_BASE}/rows?offset=${offset}&limit=${limit}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch rows (${response.status})`);
  }
  return response.json();
};

export const patchCell = async (
  id: number,
  column: keyof DataRow,
  value: string | number,
  baseVersion: number
): Promise<{ id: number; version: number; value: string | number; updated_at: string }> => {
  const response = await fetch(`${API_BASE}/rows/${id}`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({ column, value, baseVersion })
  });

  if (!response.ok) {
    if (response.status === 409) {
      throw new Error("Version conflict");
    }
    throw new Error(`Failed to update cell (${response.status})`);
  }
  return response.json();
};
