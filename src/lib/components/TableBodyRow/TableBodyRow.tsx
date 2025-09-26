import { format } from 'date-fns';
import React from 'react';

import './TableBodyRow.styles.css';
// Types
interface DataTableColumnMeta {
  align?: 'left' | 'center' | 'right';
  dateFormat?: string;
  disableRowClick?: boolean;
  fallback?: string;
  type?: 'date' | string;
  valueLabelMap?: Record<string, any>;
}

interface TableBodyRowProps {
  flexRender: any;
  getRowClassName?: (original: any, index: number) => string;
  handleSelectRow: (rowId: string, selected: boolean) => void;
  index: number;
  onRowClick?: (original: any) => void;
  row: any;
  selectedRowIds: Record<string, boolean>;
  showRowSelectors: boolean;
}

// Constants
const DEFAULT_COLUMN_SIZE = 150;
const ROW_SELECTOR_WIDTH = 36;
const DEFAULT_DATE_FALLBACK = '-';
const EPOCH_DATE_FORMATTED = '01 Jan 1970, 01:00';
const DEFAULT_DATE_FORMAT = 'dd MMM yyyy, HH:mm';

// Utility functions
const getColumnStyles = (
  size: number,
  defaultSize: number = DEFAULT_COLUMN_SIZE
) => {
  if (size === defaultSize) return {};

  return {
    maxWidth: size,
    minWidth: size,
    width: size,
  };
};

const getValueLabelMapKey = (rawValue: any): string => {
  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return 'falsy';
  }
  return String(rawValue);
};

const formatDateValue = (
  value: Date | string | null,
  fallback: string = DEFAULT_DATE_FALLBACK,
  dateFormat: string = DEFAULT_DATE_FORMAT
): string => {
  if (!value) return fallback;

  let dateObj: Date | null = null;

  if (value instanceof Date) {
    dateObj = value;
  } else if (typeof value === 'string') {
    const parsed = new Date(value);
    dateObj = isNaN(parsed.getTime()) ? null : parsed;
  }

  if (!dateObj || dateObj.getTime() === 0 || isNaN(dateObj.getTime())) {
    return fallback;
  }

  const formattedDate = format(dateObj, dateFormat);
  return formattedDate === EPOCH_DATE_FORMATTED ? fallback : formattedDate;
};

const getAlignmentClass = (
  align: 'left' | 'center' | 'right' = 'left'
): string => {
  const alignmentMap = {
    center: 'table-body__cell--align-center',
    left: 'table-body__cell--align-left',
    right: 'table-body__cell--align-right',
  };

  return alignmentMap[align];
};

const getCellDisplayValue = (cell: any, colDef: any, flexRender: any): any => {
  const meta = colDef?.meta as DataTableColumnMeta;
  let displayValue = flexRender(colDef.cell, cell.getContext());

  if (meta?.type === 'date') {
    const fallback = meta.fallback ?? DEFAULT_DATE_FALLBACK;
    const dateFormat = meta.dateFormat ?? DEFAULT_DATE_FORMAT;
    displayValue = formatDateValue(cell.getValue(), fallback, dateFormat);
  } else if (meta?.valueLabelMap) {
    const rawValue = cell.getValue();
    const key = getValueLabelMapKey(rawValue);

    if (meta.valueLabelMap[key] !== undefined) {
      displayValue = meta.valueLabelMap[key];
    }
  }

  return displayValue;
};

const shouldDisableRowClick = (
  cellElements: HTMLTableCellElement[],
  visibleCells: any[],
  target: EventTarget | null
): boolean => {
  for (let i = 0; i < cellElements.length; i++) {
    const cell = cellElements[i];
    const colDef = visibleCells[i]?.column?.columnDef;
    const meta = colDef?.meta as DataTableColumnMeta;

    if (
      meta?.disableRowClick ||
      cell.getAttribute('data-disable-row-click') === 'true'
    ) {
      if (cell.contains(target as Node)) {
        return true;
      }
    }
  }
  return false;
};

// Subcomponents
interface RowSelectorCellProps {
  isSelected: boolean;
  onSelectRow: (rowId: string, selected: boolean) => void;
  rowId: string;
}

const RowSelectorCell: React.FC<RowSelectorCellProps> = ({
  isSelected,
  onSelectRow,
  rowId,
}) => (
  <td
    className="table-body__row-selector"
    data-disable-row-click="true"
    onClick={(e) => {
      e.stopPropagation();
      onSelectRow(rowId, !isSelected);
    }}
    style={{
      maxWidth: ROW_SELECTOR_WIDTH,
      minWidth: ROW_SELECTOR_WIDTH,
      width: ROW_SELECTOR_WIDTH,
    }}
  >
    <input
      checked={isSelected}
      className="table-body__checkbox"
      onChange={(e) => onSelectRow(rowId, e.target.checked)}
      onClick={(e) => e.stopPropagation()}
      type="checkbox"
    />
  </td>
);

interface DataCellProps {
  cell: any;
  flexRender: any;
}

const DataCell: React.FC<DataCellProps> = ({ cell, flexRender }) => {
  const colDef = cell.column.columnDef;
  const meta = colDef?.meta as DataTableColumnMeta;
  const displayValue = getCellDisplayValue(cell, colDef, flexRender);
  const align = meta?.align || 'left';
  const alignmentClass = getAlignmentClass(align);

  return (
    <td
      className={`table-body__cell ${alignmentClass}`}
      key={cell.id}
      style={getColumnStyles(cell.column.getSize())}
      title={String(cell.getValue() || '')}
    >
      <span className="table-body__cell-text">{displayValue}</span>
    </td>
  );
};

interface GroupHeaderRowProps {
  row: any;
  showRowSelectors: boolean;
}

const GroupHeaderRow: React.FC<GroupHeaderRowProps> = ({
  row,
  showRowSelectors,
}) => {
  const isExpanded = row.getIsExpanded();
  const groupValue = row.groupingColumnId
    ? row.getValue(row.groupingColumnId)
    : 'Group';
  const colSpan = row.getVisibleCells().length + (showRowSelectors ? 1 : 0);

  return (
    <tr
      className="table-body__row table-body__row--grouped"
      onClick={() => row.toggleExpanded()}
    >
      <td className="table-body__grouped-cell" colSpan={colSpan}>
        <span className="table-body__group-icon">
          {isExpanded ? '▼' : '▶'}
        </span>
        <span className="table-body__group-text">
          {row.groupingColumnId
            ? `${row.groupingColumnId}: ${groupValue}`
            : 'Group'}{' '}
          ({row.subRows.length})
        </span>
      </td>
    </tr>
  );
};

interface StandardRowProps {
  flexRender: any;
  getRowClassName?: (original: any, index: number) => string;
  handleSelectRow: (rowId: string, selected: boolean) => void;
  index: number;
  onRowClick?: (original: any) => void;
  row: any;
  selectedRowIds: Record<string, boolean>;
  showRowSelectors: boolean;
}

const StandardRow: React.FC<StandardRowProps> = ({
  flexRender,
  getRowClassName,
  handleSelectRow,
  index,
  onRowClick,
  row,
  selectedRowIds,
  showRowSelectors,
}) => {
  const isSelected = !!selectedRowIds[row.id];
  const customClassName = getRowClassName
    ? getRowClassName(row.original, index)
    : '';

  const handleRowClick = (e: React.MouseEvent<HTMLTableRowElement>) => {
    if (!onRowClick) return;

    const cellElements = Array.from(
      e.currentTarget.children
    ) as HTMLTableCellElement[];
    const visibleCells = row.getVisibleCells();

    if (shouldDisableRowClick(cellElements, visibleCells, e.target)) {
      return;
    }

    onRowClick(row.original);
  };

  return (
    <tr
      className={`table-body__row ${isSelected ? 'table-body__row--selected' : ''} ${customClassName}`}
      key={row.id}
      onClick={handleRowClick}
    >
      {showRowSelectors && (
        <RowSelectorCell
          isSelected={isSelected}
          onSelectRow={handleSelectRow}
          rowId={row.id}
        />
      )}
      {row.getVisibleCells().map((cell: any) => (
        <DataCell cell={cell} flexRender={flexRender} key={cell.id} />
      ))}
    </tr>
  );
};

interface GroupedRowsProps {
  flexRender: any;
  getRowClassName?: (original: any, index: number) => string;
  handleSelectRow: (rowId: string, selected: boolean) => void;
  onRowClick?: (original: any) => void;
  rows: any[];
  selectedRowIds: Record<string, boolean>;
  showRowSelectors: boolean;
}

const GroupedRows: React.FC<GroupedRowsProps> = ({
  flexRender,
  getRowClassName,
  handleSelectRow,
  onRowClick,
  rows,
  selectedRowIds,
  showRowSelectors,
}) => {
  return (
    <>
      {rows.map((subRow, subIdx) => (
        <StandardRow
          flexRender={flexRender}
          getRowClassName={getRowClassName}
          handleSelectRow={handleSelectRow}
          index={subIdx}
          key={subRow.id}
          onRowClick={onRowClick}
          row={subRow}
          selectedRowIds={selectedRowIds}
          showRowSelectors={showRowSelectors}
        />
      ))}
    </>
  );
};

// Main component
const TableBodyRow: React.FC<TableBodyRowProps> = ({
  flexRender,
  getRowClassName,
  handleSelectRow,
  index,
  onRowClick,
  row,
  selectedRowIds,
  showRowSelectors,
}) => {
  // Handle grouped rows
  if (row.getIsGrouped()) {
    const groupValue = row.groupingColumnId
      ? row.getValue(row.groupingColumnId)
      : undefined;

    // Handle empty/null group values - render sub-rows directly
    if (groupValue === undefined || groupValue === null || groupValue === '') {
      return (
        <GroupedRows
          flexRender={flexRender}
          getRowClassName={getRowClassName}
          handleSelectRow={handleSelectRow}
          onRowClick={onRowClick}
          rows={row.subRows}
          selectedRowIds={selectedRowIds}
          showRowSelectors={showRowSelectors}
        />
      );
    }

    // Handle normal grouped rows with expand/collapse
    const isExpanded = row.getIsExpanded();

    return (
      <React.Fragment key={row.id}>
        <GroupHeaderRow row={row} showRowSelectors={showRowSelectors} />
        {isExpanded && (
          <GroupedRows
            flexRender={flexRender}
            getRowClassName={getRowClassName}
            handleSelectRow={handleSelectRow}
            onRowClick={onRowClick}
            rows={row.subRows.filter((subRow: any) => !subRow.getIsGrouped())}
            selectedRowIds={selectedRowIds}
            showRowSelectors={showRowSelectors}
          />
        )}
      </React.Fragment>
    );
  }

  // Handle standard rows
  return (
    <StandardRow
      flexRender={flexRender}
      getRowClassName={getRowClassName}
      handleSelectRow={handleSelectRow}
      index={index}
      onRowClick={onRowClick}
      row={row}
      selectedRowIds={selectedRowIds}
      showRowSelectors={showRowSelectors}
    />
  );
};

export default TableBodyRow;
