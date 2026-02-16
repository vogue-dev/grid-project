export const toInt = (value: unknown) => Number.parseInt(String(value ?? ""), 10);

const toNumber = (value: unknown) => (typeof value === "number" ? value : Number(value));

export const parseCellValue = (column: string, raw: unknown) => {
  if (column === "budget") {
    const value = toNumber(raw);

    if (Number.isNaN(value)) {
      throw new Error("Budget must be a number");
    }

    return value;
  }

  if (column.startsWith("num_")) {
    const value = toNumber(raw);
    
    if (!Number.isInteger(value)) {
      throw new Error(`${column} must be integer`);
    }

    return value;
  }

  return String(raw ?? "");
};
