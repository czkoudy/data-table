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

import './index.css'; // Import your CSS styles

// Column Filter Component
function ColumnFilter<T>({ column }: { column: Column<T, unknown> }) {
  const columnFilterValue = column.getFilterValue() as string[] | undefined;
  const [isOpen, setIsOpen] = React.useState(false);
  const sortedUniqueValues = React.useMemo(() => {
    const values = column.getFacetedUniqueValues();
    return Array.from(values.keys()).sort();
  }, [column]);

  // Support valueLabelMap for custom labels
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
      // Deselect all - set to undefined to show all items
      column.setFilterValue(undefined);
    } else {
      // Select all - set to all available values
      column.setFilterValue(filteredUniqueValues.map(String));
    }
  };

  const selectedCount = columnFilterValue?.length || 0;
  const totalCount = filteredUniqueValues.length;

  return (
    <div className="relative">
      <button
        className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-left flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>
          {selectedCount === 0
            ? 'All'
            : selectedCount === totalCount
              ? 'All'
              : `${selectedCount} selected`}
        </span>
        <span className="ml-1">▼</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close dropdown when clicking outside */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto min-w-max">
            <div className="p-2 border-b border-gray-200">
              <label className="flex items-center text-xs font-medium whitespace-nowrap">
                <input
                  checked={selectedCount === totalCount}
                  className="mr-2"
                  onChange={handleSelectAll}
                  type="checkbox"
                />
                Select All
              </label>
            </div>
            {filteredUniqueValues.map((value) => (
              <label
                className="flex items-center p-2 text-xs hover:bg-gray-50 cursor-pointer whitespace-nowrap"
                key={String(value)}
              >
                <input
                  checked={columnFilterValue?.includes(String(value)) || false}
                  className="mr-2"
                  onChange={(e) =>
                    handleFilterChange(String(value), e.target.checked)
                  }
                  type="checkbox"
                />
                {/* Use custom label if available */}
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

  // Update page size when data changes and pageSize is 'all'
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
    // Enable toggle sorting only between asc and desc
    enableSortingRemoval: false,
    // Custom filter function for multiple selections
    filterFns: {
      multiSelect: (row, columnId, filterValue) => {
        if (!filterValue || filterValue.length === 0) return true;
        const cellValue = String(row.getValue(columnId) ?? '');
        return filterValue.includes(cellValue);
      },
    },
    onExpandedChange: setExpanded,
    // Set default filter function for column filters
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

  // Compute selected rows
  const selectedRows = React.useMemo(() => {
    return table
      .getRowModel()
      .rows.filter((row) => selectedRowIds[row.id])
      .map((row) => row.original);
  }, [selectedRowIds, table]);

  // Notify parent if callback provided
  React.useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedRows);
    }
  }, [selectedRows, onSelectionChange]);

  // Select all visible rows
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
      // Remove unselected
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
    <div className={`data-table-wrapper relative ${className}`}>
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <div className="flex flex-col items-center space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">Loading...</span>
          </div>
        </div>
      )}

      {/* Global Filter */}
      {enableSearch && (
        <div className="mb-4">
          <input
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => table.setGlobalFilter(e.target.value)}
            placeholder="Search all columns..."
            type="text"
          />
        </div>
      )}

      {/* Table */}
      <table className={`table table-sm ${tableClassName}`}>
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
                // Get alignment from column meta, default to left
                const align =
                  (header.column.columnDef.meta as DataTableColumnMeta)
                    ?.align || 'left';
                let alignClass = '';
                let flexJustify = '';
                if (align === 'center') {
                  alignClass = 'text-center';
                  flexJustify = 'justify-center';
                } else if (align === 'right') {
                  alignClass = 'text-right';
                  flexJustify = 'justify-end';
                } else {
                  alignClass = 'text-left';
                  flexJustify = 'justify-start';
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
                        className={`flex items-center space-x-1 ${flexJustify} ${
                          header.column.getCanSort()
                            ? 'cursor-pointer select-none'
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
                          <span className="text-gray-400">
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
          {/* Column Filters Row */}
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
                  <th className="p-2" key={`filter-${header.id}`}>
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
              // Only group if the group value is not undefined/null/empty string
              const groupValue = row.groupingColumnId
                ? row.getValue(row.groupingColumnId)
                : undefined;
              if (
                groupValue === undefined ||
                groupValue === null ||
                groupValue === ''
              ) {
                // Render subRows as normal rows (not grouped)
                return row.subRows.map((subRow, subIdx) => (
                  <tr
                    className={`hover:bg-gray-50 ${getRowClassName ? getRowClassName(subRow.original, subIdx) : ''}`}
                    key={subRow.id}
                    onClick={(e) => {
                      // Prevent row click if the event target is inside a cell with disableRowClick
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
                            return; // Do not fire row click
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
                          className="overflow-hidden text-ellipsis "
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
                          <span className="truncate text-sm">
                            {displayValue}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ));
              }
              // ...existing code for grouped row...
              const isExpanded = row.getIsExpanded();
              return (
                <React.Fragment key={row.id}>
                  <tr
                    className="bg-gray-100 font-bold cursor-pointer"
                    onClick={() => row.toggleExpanded()}
                  >
                    <td
                      className="pl-4"
                      colSpan={row.getVisibleCells().length + 1}
                    >
                      <span className="mr-2">{isExpanded ? '▼' : '▶'}</span>
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
                          className={`hover:bg-gray-50 ${getRowClassName ? getRowClassName(subRow.original, subIdx) : ''}`}
                          key={subRow.id}
                          onClick={(e) => {
                            // Prevent row click if the event target is inside a cell with disableRowClick
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
                                  return; // Do not fire row click
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
                                className="overflow-hidden text-ellipsis "
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
                                <span className="truncate text-sm">
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
            // ...existing code for normal rows...
            return (
              <tr
                className={`hover:bg-gray-50 ${selectedRowIds[row.id] ? 'bg-blue-50' : ''} ${getRowClassName ? getRowClassName(row.original, index) : ''}`}
                key={row.id}
                onClick={(e) => {
                  // Prevent row click if the event target is inside a cell with disableRowClick or the first cell (checkbox)
                  const cellElements = Array.from(
                    (e.currentTarget as HTMLTableRowElement).children
                  );
                  for (let i = 0; i < cellElements.length; i++) {
                    const cell = cellElements[i] as HTMLTableCellElement;
                    let colDef;
                    if (i === 0) {
                      // Always check the first visible cell's column meta for disableRowClick
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
                        return; // Do not fire row click
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
                  // --- Date formatting logic ---
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
                    // Always apply valueLabelMap if present
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
                      className="overflow-hidden text-ellipsis "
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
                      <span className="truncate text-sm">{displayValue}</span>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* No data message */}
      {table.getRowModel().rows.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {noDataComponent || 'No data available'}
        </div>
      )}

      {/* Pagination */}
      {enablePagination && data && data.length > 0 && (
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">
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

          <div className="flex items-center space-x-2">
            <button
              className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.setPageIndex(0)}
            >
              {'<<'}
            </button>
            <button
              className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
            >
              {'<'}
            </button>
            <span className="flex items-center space-x-1">
              <span className="text-sm">Page</span>
              <strong className="text-sm">
                {' '}
                {table.getState().pagination.pageIndex + 1} of{' '}
                {table.getPageCount()}
              </strong>
            </span>
            <button
              className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
            >
              {'>'}
            </button>
            <button
              className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              disabled={!table.getCanNextPage()}
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            >
              {'>>'}
            </button>
          </div>

          <select
            className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
