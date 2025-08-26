import React from 'react';

import './TablePagination.styles.css';
// Types
interface TablePaginationProps {
  pageSizeOptions?: number[];
  showNavigationInfo?: boolean;
  showPageInfo?: boolean;
  showPageSizeSelector?: boolean;
  table: any; // Replace with your actual table type
}

// Constants
const DEFAULT_PAGE_SIZES = [10, 20, 30, 40, 50];
const NAVIGATION_ICONS = {
  firstPage: '<<',
  lastPage: '>>',
  nextPage: '>',
  previousPage: '<',
} as const;

// Utility functions
const calculatePageRange = (
  pageIndex: number,
  pageSize: number,
  totalRows: number
): { start: number; end: number } => {
  const start = pageIndex * pageSize + 1;
  const end = Math.min((pageIndex + 1) * pageSize, totalRows);

  return { end, start };
};

const formatPaginationText = (
  start: number,
  end: number,
  total: number
): string => {
  if (total === 0) return 'No results';
  return `Showing ${start} to ${end} of ${total} results`;
};

// Subcomponents
interface PaginationInfoProps {
  pageIndex: number;
  pageSize: number;
  totalRows: number;
}

const PaginationInfo: React.FC<PaginationInfoProps> = ({
  pageIndex,
  pageSize,
  totalRows,
}) => {
  const { end, start } = calculatePageRange(pageIndex, pageSize, totalRows);
  const infoText = formatPaginationText(start, end, totalRows);

  return (
    <div className="table-pagination__info">
      <span className="table-pagination__text--info">{infoText}</span>
    </div>
  );
};

interface NavigationButtonProps {
  ariaLabel: string;
  className?: string;
  disabled: boolean;
  icon: string;
  onClick: () => void;
}

const NavigationButton: React.FC<NavigationButtonProps> = ({
  ariaLabel,
  className = '',
  disabled,
  icon,
  onClick,
}) => (
  <button
    aria-label={ariaLabel}
    className={`table-pagination__button ${className}`}
    disabled={disabled}
    onClick={onClick}
    type="button"
  >
    {icon}
  </button>
);

interface PageInfoProps {
  currentPage: number;
  totalPages: number;
}

const PageInfo: React.FC<PageInfoProps> = ({ currentPage, totalPages }) => (
  <span className="table-pagination__page-info">
    <span className="table-pagination__text">Page</span>
    <strong className="table-pagination__text table-pagination__text--bold">
      {currentPage} of {totalPages}
    </strong>
  </span>
);

interface NavigationControlsProps {
  showPageInfo: boolean;
  table: any;
}

const NavigationControls: React.FC<NavigationControlsProps> = ({
  showPageInfo,
  table,
}) => {
  const currentPage = table.getState().pagination.pageIndex + 1;
  const totalPages = table.getPageCount();
  const canPrevious = table.getCanPreviousPage();
  const canNext = table.getCanNextPage();

  const navigationActions = {
    firstPage: () => table.setPageIndex(0),
    lastPage: () => table.setPageIndex(table.getPageCount() - 1),
    nextPage: () => table.nextPage(),
    previousPage: () => table.previousPage(),
  };

  return (
    <div className="table-pagination__controls">
      <NavigationButton
        ariaLabel="Go to first page"
        className="table-pagination__button--first"
        disabled={!canPrevious}
        icon={NAVIGATION_ICONS.firstPage}
        onClick={navigationActions.firstPage}
      />

      <NavigationButton
        ariaLabel="Go to previous page"
        className="table-pagination__button--previous"
        disabled={!canPrevious}
        icon={NAVIGATION_ICONS.previousPage}
        onClick={navigationActions.previousPage}
      />

      {showPageInfo && (
        <PageInfo currentPage={currentPage} totalPages={totalPages} />
      )}

      <NavigationButton
        ariaLabel="Go to next page"
        className="table-pagination__button--next"
        disabled={!canNext}
        icon={NAVIGATION_ICONS.nextPage}
        onClick={navigationActions.nextPage}
      />

      <NavigationButton
        ariaLabel="Go to last page"
        className="table-pagination__button--last"
        disabled={!canNext}
        icon={NAVIGATION_ICONS.lastPage}
        onClick={navigationActions.lastPage}
      />
    </div>
  );
};

interface PageSizeSelectorProps {
  pageSizeOptions: number[];
  table: any;
}

const PageSizeSelector: React.FC<PageSizeSelectorProps> = ({
  pageSizeOptions,
  table,
}) => {
  const currentPageSize = table.getState().pagination.pageSize;
  const totalRows = table.getPreFilteredRowModel().rows.length;

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    table.setPageSize(Number(e.target.value));
  };

  return (
    <div className="table-pagination__page-size">
      {/* <label className="table-pagination__label" htmlFor="page-size-select">
        Rows per page:
      </label> */}
      <select
        aria-label="Select page size"
        className="table-pagination__select"
        id="page-size-select"
        onChange={handlePageSizeChange}
        value={currentPageSize}
      >
        {pageSizeOptions.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
        {totalRows > Math.max(...pageSizeOptions) && (
          <option value={totalRows}>All ({totalRows})</option>
        )}
      </select>
    </div>
  );
};

// Main component
const TablePagination: React.FC<TablePaginationProps> = ({
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  showNavigationInfo = true,
  showPageInfo = true,
  showPageSizeSelector = true,
  table,
}) => {
  const { pagination } = table.getState();
  const totalRows = table.getFilteredRowModel().rows.length;

  // Don't render pagination if there's only one page and no results
  if (totalRows === 0 && !showPageSizeSelector) {
    return null;
  }

  return (
    <div className="table-pagination">
      {showNavigationInfo && (
        <div className="table-pagination__section--left">
          <PaginationInfo
            pageIndex={pagination.pageIndex}
            pageSize={pagination.pageSize}
            totalRows={totalRows}
          />
        </div>
      )}

      <div className="table-pagination__section--center">
        <NavigationControls showPageInfo={showPageInfo} table={table} />
      </div>

      {showPageSizeSelector && (
        <div className="table-pagination__section--right">
          <PageSizeSelector pageSizeOptions={pageSizeOptions} table={table} />
        </div>
      )}
    </div>
  );
};

export default TablePagination;
