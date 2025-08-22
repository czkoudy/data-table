import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type PaginationState,
  type Column,
  getGroupedRowModel,
  getExpandedRowModel,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import React, { useImperativeHandle, forwardRef } from 'react';

import './DataTable.css';

// Column Filter Component
function ColumnFilter<T>({ column }: { column: Column<T, unknown> }) {
  const columnFilterValue = column.getFilterValue() as string[] | undefined;
  const [isOpen, setIsOpen] = React.useState(false);
  const sortedUniqueValues = React.useMemo(() => {
    const values = column.getFacetedUniqueValues();
    return Array.from(values.keys()).sort();
  }, [column]);

  const valueLabelMap: Record<string, string> | undefined =
    column.columnDef?.meta?.valueLabelMap;
  const filterValueExcludeList: string[] =
    column.columnDef?.meta?.filterValueExcludeList || [];
  const filterValueIncludeList: string[] =
    column.columnDef?.meta?.filterValueIncludeList || [];

  const filteredUniqueValues = React.useMemo(() => {
    if (filterValueIncludeList.length > 0) {
      return sortedUniqueValues.filter((value) =>
        filterValueIncludeList.includes(String(value))
      );
    }
    return sortedUniqueValues.filter(
      (value) => !filterValueExcludeList.includes(String(value))
    );
  }, [sortedUniqueValues, filterValueExcludeList, filterValueIncludeList]);

  const handleFilterChange = (value: string, checked: boolean) => {
    const currentFilters = columnFilterValue || [];
    let newFilters: string[];

    if (checked) {
      newFilters = [...currentFilters, value];
    } else {
      newFilters = currentFilters.filter((filter) => filter !== value);
    }

    column.setFilterValue(newFilters.length > 0 ? newFilters : undefined);
  };

  const handleSelectAll = () => {
    if (columnFilterValue?.length === filteredUniqueValues.length) {
      column.setFilterValue(undefined);
    } else {
      column.setFilterValue(filteredUniqueValues.map(String));
    }
  };

  const selectedCount = columnFilterValue?.length || 0;
  const totalCount = filteredUniqueValues.length;

  return (
    <div className="relative">
      <button
        className="DataTable-filterButton"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>
          {selectedCount === 0
            ? 'All'
            : selectedCount === totalCount
              ? 'All'
              : `${selectedCount} selected`}
        </span>
        <span style={{ marginLeft: 4 }}>▼</span>
      </button>

      {isOpen && (
        <>
          <div
            className="DataTable-filterBackdrop"
            onClick={() => setIsOpen(false)}
          />
          <div className="DataTable-filterDropdown">
            <div className="DataTable-filterDropdownHeader">
              <label className="DataTable-filterDropdownLabel">
                <input
                  checked={selectedCount === totalCount}
                  onChange={handleSelectAll}
                  style={{ marginRight: 8 }}
                  type="checkbox"
                />
                Select All
              </label>
            </div>
            {filteredUniqueValues.map((value) => (
              <label
                className="DataTable-filterDropdownOption"
                key={String(value)}
              >
                <input
                  checked={columnFilterValue?.includes(String(value)) || false}
                  onChange={(e) =>
                    handleFilterChange(String(value), e.target.checked)
                  }
                  style={{ marginRight: 8 }}
                  type="checkbox"
                />
                {valueLabelMap && valueLabelMap[String(value)]
                  ? valueLabelMap[String(value)]
                  : String(value)}
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export interface DataTableColumnMeta {
  align?: 'left' | 'center' | 'right';
  disableRowClick?: boolean;
  fallback?: string;
  filterValueExcludeList?: string[];
  filterValueIncludeList?: string[];
  type?: string;
  valueLabelMap?: Record<string, string>;
}

export interface DataTableProps<T> {
  className?: string;
  columns: ColumnDef<T, any, any>[];
  data: T[] | undefined | null;
  defaultColumnFilters?: { id: string; value: string[] }[];
  defaultSorting?: { id: string; desc?: boolean }[];
  emptyRows?: boolean;
  enableColumnFilters?: boolean;
  enableFiltering?: boolean;
  enablePagination?: boolean;
  enableSearch?: boolean;
  enableSorting?: boolean;
  getRowClassName?: (rowData: T, index: number) => string;
  grouping?: string[];
  loading?: boolean;
  noDataComponent?: React.ReactNode;
  onRowClick?: (rowData: T) => void;
  onSelectionChange?: (selectedRows: T[]) => void;
  pageSize?: number | 'all';
  showRowSelectors?: boolean;
  tableClassName?: string;
}

export interface DataTableRef {
  clearSelection: () => void;
}

const DataTableInner = <T,>(
  props: DataTableProps<T>,
  ref: React.Ref<DataTableRef>
) => {
  const {
    className = '',
    columns,
    data,
    defaultColumnFilters = [],
    defaultSorting = [],
    emptyRows = false,
    enableColumnFilters = false,
    enableFiltering = true,
    enablePagination = true,
    enableSearch = true,
    enableSorting = true,
    getRowClassName,
    grouping,
    loading = false,
    noDataComponent,
    onRowClick,
    onSelectionChange,
    pageSize = 10,
    showRowSelectors = false,
    tableClassName = '',
  } = props;

  const [sorting, setSorting] = React.useState<SortingState>(
    defaultSorting.map((sort) => ({ ...sort, desc: sort.desc ?? false }))
  );
  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>(defaultColumnFilters);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: pageSize === 'all' ? data?.length || 1000 : (pageSize as number),
  });
  const [groupingState, setGrouping] = React.useState<string[]>(grouping || []);
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  const [selectedRowIds, setSelectedRowIds] = React.useState<
    Record<string, boolean>
  >({});

  React.useEffect(() => {
    if (pageSize === 'all' && data?.length) {
      setPagination((prev) => ({
        ...prev,
        pageSize: data.length,
      }));
    }
  }, [data?.length, pageSize]);

  const table = useReactTable<T>({
    columns,
    data: data || [],
    getCoreRowModel: getCoreRowModel(),
    ...(enableSorting && {
      getSortedRowModel: getSortedRowModel(),
      onSortingChange: setSorting,
    }),
    ...(enableFiltering && {
      getFilteredRowModel: getFilteredRowModel(),
      onColumnFiltersChange: setColumnFilters,
    }),
    ...(grouping && {
      getGroupedRowModel: getGroupedRowModel(),
      onGroupingChange: setGrouping,
    }),
    getExpandedRowModel: getExpandedRowModel(),
    ...(enablePagination && {
      getPaginationRowModel: getPaginationRowModel(),
      onPaginationChange: setPagination,
    }),
    enableSortingRemoval: false,
    filterFns: {
      multiSelect: (row, columnId, filterValue) => {
        if (!filterValue || filterValue.length === 0) return true;
        const cellValue = String(row.getValue(columnId) ?? '');
        return filterValue.includes(cellValue);
      },
    },
    onExpandedChange: setExpanded,
    ...(enableColumnFilters && {
      defaultColumn: {
        filterFn: 'multiSelect',
      },
    }),
    ...(enableColumnFilters && {
      getFacetedUniqueValues: (table, columnId) => () => {
        const column = table.getColumn(columnId);
        if (!column) return new Map();

        const uniqueValues = new Map();
        table.getPreFilteredRowModel().rows.forEach((row) => {
          const value = row.getValue(columnId);
          const stringValue = String(value ?? '');
          if (
            stringValue !== '' &&
            stringValue !== 'null' &&
            stringValue !== 'undefined'
          ) {
            uniqueValues.set(
              stringValue,
              (uniqueValues.get(stringValue) || 0) + 1
            );
          }
        });
        return uniqueValues;
      },
    }),
    state: {
      ...(enableSorting && { sorting }),
      ...(enableFiltering && { columnFilters }),
      ...(enablePagination && { pagination }),
      ...(grouping && { grouping: groupingState }),
      expanded,
    },
  });

  const selectedRows = React.useMemo(() => {
    return table
      .getRowModel()
      .rows.filter((row) => selectedRowIds[row.id])
      .map((row) => row.original);
  }, [selectedRowIds, table]);

  React.useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedRows);
    }
  }, [selectedRows, onSelectionChange]);

  const allVisibleRows = table.getRowModel().rows;
  const allSelected =
    allVisibleRows.length > 0 &&
    allVisibleRows.every((row) => selectedRowIds[row.id]);
  const someSelected =
    allVisibleRows.some((row) => selectedRowIds[row.id]) && !allSelected;

  const handleSelectAll = (checked: boolean) => {
    const newSelected: Record<string, boolean> = { ...selectedRowIds };
    allVisibleRows.forEach((row) => {
      newSelected[row.id] = checked;
    });
    if (!checked) {
      allVisibleRows.forEach((row) => {
        delete newSelected[row.id];
      });
    }
    setSelectedRowIds(
      checked ? newSelected : { ...selectedRowIds, ...newSelected }
    );
    if (!checked)
      setSelectedRowIds((prev) => {
        const copy = { ...prev };
        allVisibleRows.forEach((row) => delete copy[row.id]);
        return copy;
      });
  };

  const handleSelectRow = (rowId: string, checked: boolean) => {
    setSelectedRowIds((prev) => {
      const copy = { ...prev };
      if (checked) {
        copy[rowId] = true;
      } else {
        delete copy[rowId];
      }
      return copy;
    });
  };

  useImperativeHandle(
    ref,
    () => ({
      clearSelection: () => setSelectedRowIds({}),
    }),
    []
  );

  return (
    <div className={`DataTable-wrapper ${className}`}>
      {loading && (
        <div className="DataTable-loadingOverlay">
          <div className="DataTable-loadingContent">
            <div className="DataTable-loadingSpinner"></div>
            <span className="DataTable-loadingText">Loading...</span>
          </div>
        </div>
      )}

      {enableSearch && (
        <div className="DataTable-globalFilterWrapper">
          <input
            className="DataTable-globalFilterInput"
            onChange={(e) => table.setGlobalFilter(e.target.value)}
            placeholder="Search all columns..."
            type="text"
          />
        </div>
      )}

      <table className={`DataTable-table ${tableClassName}`}>
        <thead>
          {table.getHeaderGroups().map((headerGroup, headerGroupIdx) => (
            <tr key={headerGroup.id}>
              {showRowSelectors && (
                <th
                  data-disable-row-click="true"
                  style={{ maxWidth: 36, minWidth: 36, width: 36 }}
                />
              )}
              {headerGroup.headers.map((header) => {
                const align =
                  (header.column.columnDef.meta as DataTableColumnMeta)
                    ?.align || 'left';
                let alignClass = '';
                let flexJustify = '';
                if (align === 'center') {
                  alignClass = 'DataTable-alignCenter';
                  flexJustify = 'DataTable-justifyCenter';
                } else if (align === 'right') {
                  alignClass = 'DataTable-alignRight';
                  flexJustify = 'DataTable-justifyEnd';
                } else {
                  alignClass = 'DataTable-alignLeft';
                  flexJustify = 'DataTable-justifyStart';
                }
                return (
                  <th
                    className={alignClass}
                    key={header.id}
                    style={{
                      maxWidth:
                        header.getSize() !== 150 ? header.getSize() : undefined,
                      minWidth:
                        header.getSize() !== 150 ? header.getSize() : undefined,
                      width:
                        header.getSize() !== 150 ? header.getSize() : undefined,
                    }}
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={`DataTable-headerCell ${flexJustify} ${
                          header.column.getCanSort()
                            ? 'DataTable-headerCellSortable'
                            : ''
                        }`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <span>
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </span>
                        {enableSorting && header.column.getCanSort() && (
                          <span className="DataTable-headerSortIcon">
                            {{
                              asc: ' 🔼',
                              desc: ' 🔽',
                            }[header.column.getIsSorted() as string] ?? ' ↕️'}
                          </span>
                        )}
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
          {enableColumnFilters && (
            <tr>
              {showRowSelectors && (
                <th
                  data-disable-row-click="true"
                  style={{ maxWidth: 36, minWidth: 36, width: 36 }}
                />
              )}
              {table.getHeaderGroups()[0]?.headers.map((header) => {
                return (
                  <th
                    className="DataTable-filterRowCell"
                    key={`filter-${header.id}`}
                  >
                    {header.column.getCanFilter() &&
                    header.column.columnDef.enableColumnFilter !== false ? (
                      <ColumnFilter column={header.column} />
                    ) : null}
                  </th>
                );
              })}
            </tr>
          )}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row, index) => {
            if (row.getIsGrouped()) {
              const groupValue = row.groupingColumnId
                ? row.getValue(row.groupingColumnId)
                : undefined;
              if (
                groupValue === undefined ||
                groupValue === null ||
                groupValue === ''
              ) {
                return row.subRows.map((subRow, subIdx) => (
                  <tr
                    className={`DataTable-row ${getRowClassName ? getRowClassName(subRow.original, subIdx) : ''}`}
                    key={subRow.id}
                    onClick={(e) => {
                      const cellElements = Array.from(
                        (e.currentTarget as HTMLTableRowElement).children
                      );
                      for (let i = 0; i < cellElements.length; i++) {
                        const cell = cellElements[i] as HTMLTableCellElement;
                        const colDef =
                          subRow.getVisibleCells()[i]?.column?.columnDef;
                        if (
                          (colDef?.meta as DataTableColumnMeta)?.disableRowClick
                        ) {
                          if (cell.contains(e.target as Node)) {
                            return;
                          }
                        }
                      }
                      onRowClick && onRowClick(subRow.original);
                    }}
                  >
                    {showRowSelectors && (
                      <td
                        data-disable-row-click="true"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectRow(
                            subRow.id,
                            !selectedRowIds[subRow.id]
                          );
                        }}
                        style={{ maxWidth: 36, minWidth: 36, width: 36 }}
                      >
                        <input
                          checked={!!selectedRowIds[subRow.id]}
                          onChange={(e) =>
                            handleSelectRow(subRow.id, e.target.checked)
                          }
                          onClick={(e) => e.stopPropagation()}
                          type="checkbox"
                        />
                      </td>
                    )}
                    {subRow.getVisibleCells().map((cell, cellIdx) => {
                      const colDef = cell.column.columnDef;
                      const valueLabelMap = (
                        colDef?.meta as DataTableColumnMeta
                      )?.valueLabelMap;
                      let displayValue = flexRender(
                        colDef.cell,
                        cell.getContext()
                      );
                      if (valueLabelMap) {
                        const rawValue = cell.getValue();
                        let key = String(rawValue);
                        if (
                          rawValue === undefined ||
                          rawValue === null ||
                          rawValue === ''
                        ) {
                        }
                        if (valueLabelMap[key] !== undefined) {
                          displayValue = valueLabelMap[key];
                        }
                      }
                      return (
                        <td
                          className="DataTable-cell"
                          key={cell.id}
                          style={{
                            maxWidth:
                              cell.column.getSize() !== 150
                                ? cell.column.getSize()
                                : undefined,
                            minWidth:
                              cell.column.getSize() !== 150
                                ? cell.column.getSize()
                                : undefined,
                            width:
                              cell.column.getSize() !== 150
                                ? cell.column.getSize()
                                : undefined,
                          }}
                          title={String(cell.getValue() || '')}
                        >
                          <span className="DataTable-cellText">
                            {displayValue}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ));
              }
              const isExpanded = row.getIsExpanded();
              return (
                <React.Fragment key={row.id}>
                  <tr
                    className="DataTable-row DataTable-groupedRow"
                    onClick={() => row.toggleExpanded()}
                  >
                    <td
                      className="DataTable-groupedRowCell"
                      colSpan={row.getVisibleCells().length + 1}
                    >
                      <span className="DataTable-groupedRowIcon">
                        {isExpanded ? '▼' : '▶'}
                      </span>
                      {row.groupingColumnId
                        ? `${row.groupingColumnId}: ${row.getValue(row.groupingColumnId)}`
                        : 'Group'}{' '}
                      ({row.subRows.length})
                    </td>
                  </tr>
                  {isExpanded &&
                    row.subRows.map((subRow, subIdx) =>
                      subRow.getIsGrouped() ? null : (
                        <tr
                          className={`DataTable-row ${getRowClassName ? getRowClassName(subRow.original, subIdx) : ''}`}
                          key={subRow.id}
                          onClick={(e) => {
                            const cellElements = Array.from(
                              (e.currentTarget as HTMLTableRowElement).children
                            );
                            for (let i = 0; i < cellElements.length; i++) {
                              const cell = cellElements[
                                i
                              ] as HTMLTableCellElement;
                              const colDef =
                                subRow.getVisibleCells()[i]?.column?.columnDef;
                              if (
                                (colDef?.meta as DataTableColumnMeta)
                                  ?.disableRowClick
                              ) {
                                if (cell.contains(e.target as Node)) {
                                  return;
                                }
                              }
                            }
                            onRowClick && onRowClick(subRow.original);
                          }}
                        >
                          {showRowSelectors && (
                            <td
                              data-disable-row-click="true"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectRow(
                                  subRow.id,
                                  !selectedRowIds[subRow.id]
                                );
                              }}
                              style={{ maxWidth: 36, minWidth: 36, width: 36 }}
                            >
                              <input
                                checked={!!selectedRowIds[subRow.id]}
                                onChange={(e) =>
                                  handleSelectRow(subRow.id, e.target.checked)
                                }
                                onClick={(e) => e.stopPropagation()}
                                type="checkbox"
                              />
                            </td>
                          )}
                          {subRow.getVisibleCells().map((cell, cellIdx) => {
                            const colDef = cell.column.columnDef;
                            const valueLabelMap = (
                              colDef?.meta as DataTableColumnMeta
                            )?.valueLabelMap;
                            let displayValue = flexRender(
                              colDef.cell,
                              cell.getContext()
                            );
                            if (valueLabelMap) {
                              const rawValue = cell.getValue();
                              let key = String(rawValue);
                              if (
                                rawValue === undefined ||
                                rawValue === null ||
                                rawValue === ''
                              ) {
                                key = 'falsy';
                              }
                              if (valueLabelMap[key] !== undefined) {
                                displayValue = valueLabelMap[key];
                              }
                            }
                            return (
                              <td
                                className="DataTable-cell"
                                key={cell.id}
                                style={{
                                  maxWidth:
                                    cell.column.getSize() !== 150
                                      ? cell.column.getSize()
                                      : undefined,
                                  minWidth:
                                    cell.column.getSize() !== 150
                                      ? cell.column.getSize()
                                      : undefined,
                                  width:
                                    cell.column.getSize() !== 150
                                      ? cell.column.getSize()
                                      : undefined,
                                }}
                                title={String(cell.getValue() || '')}
                              >
                                <span className="DataTable-cellText">
                                  {displayValue}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      )
                    )}
                </React.Fragment>
              );
            }
            return (
              <tr
                className={`DataTable-row ${selectedRowIds[row.id] ? 'DataTable-rowSelected' : ''} ${getRowClassName ? getRowClassName(row.original, index) : ''}`}
                key={row.id}
                onClick={(e) => {
                  const cellElements = Array.from(
                    (e.currentTarget as HTMLTableRowElement).children
                  );
                  for (let i = 0; i < cellElements.length; i++) {
                    const cell = cellElements[i] as HTMLTableCellElement;
                    let colDef;
                    if (i === 0) {
                      const firstCell = row.getVisibleCells()[0];
                      colDef = firstCell?.column?.columnDef;
                    } else {
                      colDef = row.getVisibleCells()[i]?.column?.columnDef;
                    }
                    if (
                      (colDef?.meta as DataTableColumnMeta)?.disableRowClick ||
                      cell.getAttribute('data-disable-row-click') === 'true'
                    ) {
                      if (cell.contains(e.target as Node)) {
                        return;
                      }
                    }
                  }
                  onRowClick && onRowClick(row.original);
                }}
              >
                {showRowSelectors && (
                  <td
                    data-disable-row-click="true"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectRow(row.id, !selectedRowIds[row.id]);
                    }}
                    style={{ maxWidth: 36, minWidth: 36, width: 36 }}
                  >
                    <input
                      checked={!!selectedRowIds[row.id]}
                      onChange={(e) =>
                        handleSelectRow(row.id, e.target.checked)
                      }
                      onClick={(e) => e.stopPropagation()}
                      type="checkbox"
                    />
                  </td>
                )}
                {row.getVisibleCells().map((cell, cellIdx) => {
                  const colDef = cell.column.columnDef;
                  const valueLabelMap = (colDef?.meta as DataTableColumnMeta)
                    ?.valueLabelMap;
                  let displayValue = flexRender(colDef.cell, cell.getContext());
                  if ((colDef?.meta as DataTableColumnMeta)?.type === 'date') {
                    const fallback =
                      (colDef?.meta as DataTableColumnMeta)?.fallback ?? '-';
                    const date = cell.getValue() as Date | string | null;
                    let dateObj: Date | null = null;
                    if (date instanceof Date) {
                      dateObj = date;
                    } else if (typeof date === 'string' && date) {
                      const parsed = new Date(date);
                      dateObj = isNaN(parsed.getTime()) ? null : parsed;
                    }
                    if (!dateObj || dateObj.getTime() === 0) {
                      displayValue = fallback;
                    } else if (
                      dateObj instanceof Date &&
                      !isNaN(dateObj.getTime())
                    ) {
                      const formattedDate = format(
                        dateObj,
                        'dd MMM yyyy, HH:mm'
                      );
                      displayValue =
                        formattedDate === '01 Jan 1970, 01:00'
                          ? fallback
                          : formattedDate;
                    } else {
                      displayValue = fallback;
                    }
                  } else if (valueLabelMap) {
                    const rawValue = cell.getValue();
                    let key = String(rawValue);
                    if (
                      rawValue === undefined ||
                      rawValue === null ||
                      rawValue === ''
                    ) {
                      key = 'falsy';
                    }
                    if (valueLabelMap[key] !== undefined) {
                      displayValue = valueLabelMap[key];
                    }
                  }
                  return (
                    <td
                      className="DataTable-cell"
                      key={cell.id}
                      style={{
                        maxWidth:
                          cell.column.getSize() !== 150
                            ? cell.column.getSize()
                            : undefined,
                        minWidth:
                          cell.column.getSize() !== 150
                            ? cell.column.getSize()
                            : undefined,
                        width:
                          cell.column.getSize() !== 150
                            ? cell.column.getSize()
                            : undefined,
                      }}
                      title={String(cell.getValue() || '')}
                    >
                      <span className="DataTable-cellText">{displayValue}</span>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      {table.getRowModel().rows.length === 0 && (
        <div className="DataTable-noDataMessage">
          {noDataComponent || 'No data available'}
        </div>
      )}

      {enablePagination && data && data.length > 0 && (
        <div className="DataTable-paginationWrapper">
          <div className="DataTable-paginationInfo">
            <span className="DataTable-paginationText">
              Showing{' '}
              {table.getState().pagination.pageIndex *
                table.getState().pagination.pageSize +
                1}{' '}
              to{' '}
              {Math.min(
                (table.getState().pagination.pageIndex + 1) *
                  table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length
              )}{' '}
              of {table.getFilteredRowModel().rows.length} results
            </span>
          </div>

          <div className="DataTable-paginationControls">
            <button
              className="DataTable-paginationButton"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.setPageIndex(0)}
            >
              {'<<'}
            </button>
            <button
              className="DataTable-paginationButton"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
            >
              {'<'}
            </button>
            <span className="DataTable-paginationPageInfo">
              <span className="DataTable-paginationText">Page</span>
              <strong className="DataTable-paginationText">
                {' '}
                {table.getState().pagination.pageIndex + 1} of{' '}
                {table.getPageCount()}
              </strong>
            </span>
            <button
              className="DataTable-paginationButton"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
            >
              {'>'}
            </button>
            <button
              className="DataTable-paginationButton"
              disabled={!table.getCanNextPage()}
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            >
              {'>>'}
            </button>
          </div>

          <select
            className="DataTable-paginationSelect"
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            value={table.getState().pagination.pageSize}
          >
            {[10, 20, 30, 40, 50].map((size) => (
              <option key={size} value={size}>
                Show {size}
              </option>
            ))}
            <option value={table.getPreFilteredRowModel().rows.length}>
              Show All
            </option>
          </select>
        </div>
      )}
    </div>
  );
};

const DataTable = forwardRef(DataTableInner) as <T>(
  p: DataTableProps<T> & { ref?: React.Ref<DataTableRef> }
) => React.ReactElement;

export default DataTable;
