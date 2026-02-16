import { useEffect, useState } from "react";
import { editableKeys, type GridColumn } from "../columns";
import type { DataRow } from "../types";
import { normalizeCellValue } from "../utils/cell";

type EditableCellProps = {
	row: DataRow;
	column: GridColumn;
	onCommit: (value: string | number) => void;
};

export const EditableCell = ({ row, column, onCommit }: EditableCellProps) => {
	const value = row[column.key];
	const isEditable = editableKeys.has(column.key);
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState(String(value));

	useEffect(() => {
		setDraft(String(value));
	}, [value]);

	const closeEditor = () => setEditing(false);

	const commit = () => {
		const nextValue = normalizeCellValue(column.kind, draft, value);
		if (nextValue === null) {
			setDraft(String(value));
			closeEditor();
			return;
		}

		onCommit(nextValue);
		closeEditor();
	};

	if (!isEditable) {
		return <div className="cell cell-readonly">{String(value)}</div>;
	}

	if (editing && column.kind === "select" && column.options) {
		return (
			<select
				className="cell-input"
				value={draft}
				onChange={(event) => {
					setDraft(event.target.value);
					onCommit(event.target.value);
					closeEditor();
				}}
				onBlur={closeEditor}
				autoFocus
			>
				{column.options.map((option) => (
					<option value={option} key={option}>
						{option}
					</option>
				))}
			</select>
		);
	}

	if (editing) {
		return (
			<input
				className="cell-input"
				type={column.kind === "number" ? "number" : "text"}
				value={draft}
				onChange={(event) => setDraft(event.target.value)}
				onBlur={commit}
				onKeyDown={(event) => {
					if (event.key === "Enter") {
						commit();
					}
					if (event.key === "Escape") {
						setDraft(String(value));
						closeEditor();
					}
				}}
				autoFocus
			/>
		);
	}

	return (
		<button className="cell cell-button" onDoubleClick={() => setEditing(true)}>
			{String(value)}
		</button>
	);
};
