import { columnsConfig } from "../columns";

export const GridHeader = () => (
  <div className="grid-header">
    <div className="grid-row">
      {columnsConfig.map((column) => (
        <div key={String(column.key)} className="grid-head-cell" style={{ width: column.width }}>
          {column.header}
        </div>
      ))}
    </div>
  </div>
);
