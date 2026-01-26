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
  type ExpandedState,
  getGroupedRowModel,
  getExpandedRowModel,
} from '@tanstack/react-table';

import './DataTable.css';
import React, { useImperativeHandle } from 'react';

import TableBodyRow from './components/TableBodyRow/TableBodyRow';
import TableHeaderRow from './components/TableHeaderRow/TableHeaderRow';
import TablePagination from './components/TablePagination/TablePagination';

// Column Filter Component
function ColumnFilter<T>({ column }: { column: Column<T, unknown> }) {
  const columnFilterValue = column.getFilterValue() as string[] | undefined;
  const [isOpen, setIsOpen] = React.useState(false);
  const sortedUniqueValues = React.useMemo(() => {
    const values = column.getFacetedUniqueValues();
    return Array.from(values.keys()).sort();
  }, [column]);

  const valueLabelMap: Record<string, string> | undefined = (
    column.columnDef?.meta as DataTableColumnMeta | undefined
  )?.valueLabelMap;
  const filterValueExcludeList: string[] =
    (column.columnDef?.meta as DataTableColumnMeta | undefined)
      ?.filterValueExcludeList || [];
  const filterValueIncludeList: string[] =
    (column.columnDef?.meta as DataTableColumnMeta | undefined)
      ?.filterValueIncludeList || [];

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
    <div
      style={{
        display: 'inline-block',
        paddingRight: '2rem',
        position: 'relative',
        width: '100%',
      }}
    >
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

interface DataTableColumnMeta {
  align?: 'left' | 'center' | 'right';
  disableRowClick?: boolean;
  fallback?: string;
  filterValueExcludeList?: string[];
  filterValueIncludeList?: string[];
  type?: string;
  valueLabelMap?: Record<string, string>;
}

interface DataTableProps<T> {
  actionButton?: (
    selectedRows: T[],
    clearSelection: () => void
  ) => React.ReactNode;
  className?: string;
  columns: ColumnDef<T, any>[];
  data: T[] | undefined | null;
  defaultColumnFilters?: { id: string; value: string[] }[];
  defaultSorting?: { id: string; desc?: boolean }[];
  emptyRows?: boolean;
  enableAutoResetPageIndex?: boolean;
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

interface DataTableRef {
  clearSelection: () => void;
}

const DataTableInner = <T,>(
  props: DataTableProps<T>,
  ref: React.Ref<DataTableRef>
): React.ReactElement => {
  const {
    actionButton,
    className = '',
    columns,
    data,
    defaultColumnFilters = [],
    defaultSorting = [],
    emptyRows = false,
    enableAutoResetPageIndex = false,
    enableColumnFilters = false,
    enableFiltering = true,
    enablePagination = true,
    enableSearch = false,
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
  const [expanded, setExpanded] = React.useState<ExpandedState>({});
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
    autoResetPageIndex: enableAutoResetPageIndex,
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
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue || filterValue.length === 0) return true;
          const cellValue = String(row.getValue(columnId) ?? '');
          return filterValue.includes(cellValue);
        },
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
      {showRowSelectors && actionButton && selectedRows.length > 0 && (
        <div className="DataTable-actionToolbar">
          <div className="DataTable-actionToolbarText">
            {selectedRows.length} row(s) selected
          </div>
          {actionButton(selectedRows, () => setSelectedRowIds({}))}
        </div>
      )}
      <table className={`DataTable-table ${tableClassName}`}>
        <thead>
          {table.getHeaderGroups().map((headerGroup, headerGroupIdx) => (
            <TableHeaderRow
              allSelected={allSelected}
              enableSorting={enableSorting}
              flexRender={flexRender}
              handleSelectAll={handleSelectAll}
              headerGroup={headerGroup}
              key={headerGroup.id}
              showRowSelectors={showRowSelectors && headerGroupIdx === 0}
              someSelected={someSelected}
            />
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
                    header.column.columnDef.enableColumnFilter === true ? (
                      <ColumnFilter column={header.column} />
                    ) : null}
                  </th>
                );
              })}
            </tr>
          )}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row, index) => (
            <TableBodyRow
              flexRender={flexRender}
              getRowClassName={getRowClassName}
              handleSelectRow={handleSelectRow}
              index={index}
              key={row.id}
              onRowClick={onRowClick}
              row={row}
              selectedRowIds={selectedRowIds}
              showRowSelectors={showRowSelectors}
            />
          ))}
        </tbody>
      </table>
      {table.getRowModel().rows.length === 0 && (
        <div className="DataTable-noDataMessage">
          {noDataComponent || 'No data available'}
        </div>
      )}
      {enablePagination && data && data.length > 0 && (
        <TablePagination table={table} />
      )}
    </div>
  );
};

function createForwardRefComponent() {
  return React.forwardRef(DataTableInner) as <T>(
    props: DataTableProps<T> & { ref?: React.Ref<DataTableRef> }
  ) => React.ReactElement;
}

const DataTable = createForwardRefComponent();
// const DataTable = React.forwardRef(DataTableInner);

export default DataTable;
export type { DataTableProps, DataTableRef, DataTableColumnMeta, ColumnDef };
