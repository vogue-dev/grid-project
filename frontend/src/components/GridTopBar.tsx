type GridTopBarProps = {
  statusText: string;
  loadedCount: number;
  totalCount: number;
};

export const GridTopBar = ({ statusText, loadedCount, totalCount }: GridTopBarProps) => (
  <header className="topbar">
    <h1>Grid Project</h1>
    <div className="meta">
      <span>{statusText}</span>
      <span>
        Loaded {loadedCount.toLocaleString()} / {totalCount.toLocaleString()}
      </span>
    </div>
  </header>
);
