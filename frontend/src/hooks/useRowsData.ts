import { useCallback, useMemo, useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchRows, patchCell } from "../api";
import { PAGE_SIZE } from "../constants/grid";
import type { CellUpdateMessage, DataRow } from "../types";
import { flattenRows, getTotalRows, type InfiniteRowsData, updateRowInCache } from "../utils/rows";

type CellMutationPayload = {
  id: number;
  column: keyof DataRow;
  value: string | number;
  baseVersion: number;
};

type CellMutationContext = {
  previous: InfiniteRowsData | undefined;
};

export const useRowsData = () => {
  const queryClient = useQueryClient();
  const [statusText, setStatusText] = useState("Connected");

  const updateCachedRow = useCallback(
    (rowId: number, updater: (row: DataRow) => DataRow) => {
      queryClient.setQueryData<InfiniteRowsData>(["rows"], (oldData) =>
        updateRowInCache(oldData, rowId, updater)
      );
    },
    [queryClient]
  );

  const rowsQuery = useInfiniteQuery({
    queryKey: ["rows"],
    queryFn: ({ pageParam = 0 }) => fetchRows(pageParam, PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.reduce((total, page) => total + page.rows.length, 0);
      return loadedCount < lastPage.total ? loadedCount : undefined;
    },
    staleTime: 30_000
  });

  const rows = useMemo(() => flattenRows(rowsQuery.data), [rowsQuery.data]);
  const totalCount = useMemo(() => getTotalRows(rowsQuery.data), [rowsQuery.data]);

  const updateCellMutation = useMutation({
    mutationFn: ({ id, column, value, baseVersion }: CellMutationPayload) =>
      patchCell(id, column, value, baseVersion),
    onMutate: (payload): CellMutationContext => {
      queryClient.cancelQueries({ queryKey: ["rows"] });
      const previous = queryClient.getQueryData<InfiniteRowsData>(["rows"]);

      updateCachedRow(payload.id, (row) => ({
        ...row,
        [payload.column]: payload.value,
        version: row.version + 1
      }));
      setStatusText("Saving...");

      return { previous };
    },
    onSuccess: (result, payload) => {
      updateCachedRow(payload.id, (row) => ({
        ...row,
        [payload.column]: result.value,
        version: result.version,
        updated_at: result.updated_at
      }));
      setStatusText("Connected");
    },
    onError: (_error, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["rows"], context.previous);
      }

      setStatusText("Update failed, reverted");
      setTimeout(() => setStatusText("Connected"), 1500);
    }
  });

  const commitCellUpdate = useCallback(
    (payload: CellMutationPayload) => {
      updateCellMutation.mutate(payload);
    },
    [updateCellMutation]
  );

  const applyExternalUpdate = useCallback(
    (message: CellUpdateMessage) => {
      updateCachedRow(message.id, (row) => ({
        ...row,
        [message.column]: message.value,
        version: message.version,
        updated_at: message.updated_at
      }));
    },
    [updateCachedRow]
  );

  return {
    rows,
    totalCount,
    statusText,
    rowsQuery,
    setStatusText,
    commitCellUpdate,
    applyExternalUpdate
  };
};
