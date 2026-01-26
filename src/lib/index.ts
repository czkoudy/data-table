import { ColumnDef as TanstackColumnDef } from '@tanstack/react-table';

import DataTable from './DataTable';
export type {
  DataTableProps,
  DataTableRef,
  DataTableColumnMeta,
} from './DataTable';
export default DataTable;

export type ColumnDef<TData, TValue = any> = TanstackColumnDef<TData, TValue>;
