import React from 'react';

import './TableHeaderRow.styles.css';
// Types
interface DataTableColumnMeta {
  align?: 'left' | 'center' | 'right';
}

interface TableHeaderRowProps {
  allSelected?: boolean;
  enableSorting: boolean;
  flexRender: any; // Replace with your actual flexRender type
  handleSelectAll?: (checked: boolean) => void;
  headerGroup: any; // Replace with your actual header group type
  showRowSelectors: boolean;
  someSelected?: boolean;
}

// Constants
const DEFAULT_COLUMN_SIZE = 150;
const ROW_SELECTOR_WIDTH = 36;

const SORT_ICONS = {
  asc: '🔼',
  default: '↕️',
  desc: '🔽',
} as const;

// Utility functions
const getAlignmentClasses = (align: 'left' | 'center' | 'right' = 'left') => {
  const alignmentMap = {
    center: {
      alignClass: 'table-header__cell--align-center',
      flexJustify: 'table-header__content--justify-center',
    },
    left: {
      alignClass: 'table-header__cell--align-left',
      flexJustify: 'table-header__content--justify-start',
    },
    right: {
      alignClass: 'table-header__cell--align-right',
      flexJustify: 'table-header__content--justify-end',
    },
  };

  return alignmentMap[align];
};

const getColumnStyles = (
  size: number,
  defaultSize: number = DEFAULT_COLUMN_SIZE
) => {
  if (size === defaultSize) {
    return {};
  }

  return {
    maxWidth: size,
    minWidth: size,
    width: size,
  };
};

const getSortIcon = (sortDirection: string | false): string => {
  if (!sortDirection) return SORT_ICONS.default;
  return (
    SORT_ICONS[sortDirection as keyof typeof SORT_ICONS] || SORT_ICONS.default
  );
};

// Subcomponents
interface RowSelectorCellProps {
  allSelected?: boolean;
  handleSelectAll?: (checked: boolean) => void;
  someSelected?: boolean;
}

const RowSelectorCell: React.FC<RowSelectorCellProps> = ({
  allSelected = false,
  handleSelectAll,
  someSelected = false,
}) => (
  <th
    className="table-header__row-selector"
    data-disable-row-click="true"
    style={{
      maxWidth: ROW_SELECTOR_WIDTH,
      minWidth: ROW_SELECTOR_WIDTH,
      width: ROW_SELECTOR_WIDTH,
    }}
  >
    {handleSelectAll && (
      <input
        checked={allSelected}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          handleSelectAll(e.target.checked)
        }
        ref={(input: HTMLInputElement | null) => {
          if (input) {
            input.indeterminate = someSelected;
          }
        }}
        type="checkbox"
      />
    )}
  </th>
);

interface SortIndicatorProps {
  isVisible: boolean;
  sortDirection: string | false;
}

const SortIndicator: React.FC<SortIndicatorProps> = ({
  isVisible,
  sortDirection,
}) => {
  if (!isVisible) return null;

  return (
    <span className="table-header__sort-icon">
      {getSortIcon(sortDirection)}
    </span>
  );
};

interface HeaderCellContentProps {
  canSort: boolean;
  enableSorting: boolean;
  flexJustify: string;
  flexRender: any;
  header: any;
}

const HeaderCellContent: React.FC<HeaderCellContentProps> = ({
  canSort,
  enableSorting,
  flexJustify,
  flexRender,
  header,
}) => (
  <div
    className={`table-header__content ${flexJustify} ${
      canSort ? 'table-header__content--sortable' : ''
    }`}
    onClick={header.column.getToggleSortingHandler()}
  >
    <span className="table-header__text">
      {flexRender(header.column.columnDef.header, header.getContext())}
    </span>
    <SortIndicator
      isVisible={enableSorting && canSort}
      sortDirection={header.column.getIsSorted()}
    />
  </div>
);

interface HeaderCellProps {
  enableSorting: boolean;
  flexRender: any;
  header: any;
}

const HeaderCell: React.FC<HeaderCellProps> = ({
  enableSorting,
  flexRender,
  header,
}) => {
  if (header.isPlaceholder) {
    return (
      <th key={header.id} style={getColumnStyles(header.getSize())}>
        {/* Placeholder cell - no content */}
      </th>
    );
  }

  const align =
    (header.column.columnDef.meta as DataTableColumnMeta)?.align || 'left';
  const { alignClass, flexJustify } = getAlignmentClasses(align);
  const canSort = header.column.getCanSort();

  return (
    <th
      className={alignClass}
      key={header.id}
      style={getColumnStyles(header.getSize())}
    >
      <HeaderCellContent
        canSort={canSort}
        enableSorting={enableSorting}
        flexJustify={flexJustify}
        flexRender={flexRender}
        header={header}
      />
    </th>
  );
};

// Main component
const TableHeaderRow: React.FC<TableHeaderRowProps> = ({
  allSelected = false,
  enableSorting,
  flexRender,
  handleSelectAll,
  headerGroup,
  showRowSelectors,
  someSelected = false,
}) => {
  return (
    <tr className="table-header__row" key={headerGroup.id}>
      {showRowSelectors && (
        <RowSelectorCell
          allSelected={allSelected}
          handleSelectAll={handleSelectAll}
          someSelected={someSelected}
        />
      )}
      {headerGroup.headers.map((header: any) => (
        <HeaderCell
          enableSorting={enableSorting}
          flexRender={flexRender}
          header={header}
          key={header.id}
        />
      ))}
    </tr>
  );
};

export default TableHeaderRow;
