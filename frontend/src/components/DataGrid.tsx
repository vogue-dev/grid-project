import { useCallback, useMemo, useRef } from "react";
import { flexRender, getCoreRowModel, type ColumnDef, useReactTable } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { columnsConfig } from "../columns";
import { ROW_HEIGHT, SCROLL_FETCH_THRESHOLD } from "../constants/grid";
import { useRealtimeSync } from "../hooks/useRealtimeSync";
import { useRowsData } from "../hooks/useRowsData";
import type { DataRow } from "../types";
import { EditableCell } from "./EditableCell";
import { GridHeader } from "./GridHeader";
import { GridTopBar } from "./GridTopBar";

export const DataGrid = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { rows, totalCount, statusText, rowsQuery, setStatusText, commitCellUpdate, applyExternalUpdate } =
    useRowsData();

  useRealtimeSync({
    onMessage: applyExternalUpdate,
    onConnected: () => setStatusText("Connected"),
    onDisconnected: () => setStatusText("Reconnecting..."),
    onError: () => setStatusText("WebSocket error")
  });

  const tableColumns = useMemo<ColumnDef<DataRow>[]>(
    () =>
      columnsConfig.map((column) => ({
        id: String(column.key),
        accessorKey: column.key,
        header: () => column.header,
        cell: ({ row }) => (
          <EditableCell
            row={row.original}
            column={column}
            onCommit={(value) =>
              commitCellUpdate({
                id: row.original.id,
                column: column.key,
                value,
                baseVersion: row.original.version
              })
            }
          />
        ),
        size: column.width
      })),
    [commitCellUpdate]
  );

  const table = useReactTable({
    data: rows,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel()
  });

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12
  });

  const onScroll = useCallback(() => {
    const element = containerRef.current;
    if (!element || rowsQuery.isFetchingNextPage || !rowsQuery.hasNextPage) {
      return;
    }

    const distanceToBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
    if (distanceToBottom < SCROLL_FETCH_THRESHOLD) {
      rowsQuery.fetchNextPage();
    }
  }, [rowsQuery]);

  return (
    <div className="page">
      <GridTopBar statusText={statusText} loadedCount={rows.length} totalCount={totalCount} />

      <div ref={containerRef} className="grid-wrap" onScroll={onScroll}>
        <GridHeader />

        <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const row = table.getRowModel().rows[virtualRow.index];
            if (!row) return null;

            return (
              <div
                key={row.id}
                className="grid-row body-row"
                style={{ position: "absolute", transform: `translateY(${virtualRow.start}px)` }}
              >
                {row.getVisibleCells().map((cell) => (
                  <div key={cell.id} className="grid-cell" style={{ width: cell.column.getSize() }}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
