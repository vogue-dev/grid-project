import type { ColumnKind } from "../columns";

export const normalizeCellValue = (
  kind: ColumnKind,
  draftValue: string,
  fallbackValue: string | number
): string | number | null => {
  if (kind !== "number") {
    return draftValue;
  }

  const parsed = Number(draftValue);
  if (Number.isNaN(parsed)) {
    return null;
  }

  if (parsed === fallbackValue) {
    return fallbackValue;
  }

  return parsed;
};
