# @czkoudy/data-table

A fully-featured, headless, and highly customizable React data table component built with [@tanstack/react-table](https://tanstack.com/table/v8) and styled using [Tailwind CSS](https://tailwindcss.com/). Supports sorting, filtering, grouping, pagination, row selection, and more.

## Features

- 🧩 **TypeScript** support
- 🎨 **Tailwind CSS** styling (no external CSS required)
- 🔍 **Column and global filtering**
- ↕️ **Sorting**
- 📊 **Grouping**
- ⏩ **Pagination**
- ✅ **Row selection**
- 🕹️ **Imperative API** (clear selection)
- 🗂️ **Custom cell rendering**
- 🏷️ **Value label mapping**
- 🕒 **Date formatting**
- ⚡ **Fast and lightweight**

## Installation

```bash
npm install @czkoudy/data-table @tanstack/react-table date-fns
# or
pnpm add @czkoudy/data-table @tanstack/react-table date-fns
```

> **Note:** `react`, `react-dom`, `@tanstack/react-table`, and `date-fns` are peer dependencies.

## Usage

```tsx
import DataTable, { DataTableProps, DataTableRef } from '@czkoudy/data-table';

const columns = [
  {
    accessorKey: 'name',
    header: 'Name',
    meta: { align: 'left' },
  },
  {
    accessorKey: 'createdAt',
    header: 'Created At',
    meta: { type: 'date', align: 'center', fallback: 'N/A' },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    meta: {
      valueLabelMap: {
        active: '🟢 Active',
        inactive: '🔴 Inactive',
        falsy: 'Unknown',
      },
      align: 'center',
    },
  },
];

const data = [
  { name: 'Alice', createdAt: '2024-06-01T10:00:00Z', status: 'active' },
  { name: 'Bob', createdAt: null, status: 'inactive' },
];

function App() {
  return (
    <DataTable
      columns={columns}
      data={data}
      enableSearch
      enableSorting
      enablePagination
      showRowSelectors
      pageSize={10}
      loading={false}
      onRowClick={(row) => alert(`Clicked: ${row.name}`)}
    />
  );
}
```

## Props

See [DataTableProps](./src/lib/DataTable.tsx) for full API.

| Prop               | Type                       | Description                   |
| ------------------ | -------------------------- | ----------------------------- |
| `columns`          | `ColumnDef<T, any, any>[]` | Table columns definition      |
| `data`             | `T[]`                      | Table data                    |
| `enableSearch`     | `boolean`                  | Show global search input      |
| `enableSorting`    | `boolean`                  | Enable sorting                |
| `enablePagination` | `boolean`                  | Enable pagination             |
| `showRowSelectors` | `boolean`                  | Show row selection checkboxes |
| `onRowClick`       | `(row: T) => void`         | Row click handler             |
| ...                | ...                        | See source for more options   |

## Column Meta

You can pass a `meta` object to each column for advanced features:

```ts
meta: {
  align: 'left' | 'center' | 'right',
  type: 'date', // enables date formatting
  fallback: '-', // fallback for invalid dates
  valueLabelMap: { [key: string]: string }, // custom value labels
  filterValueExcludeList: string[], // exclude values from filter
  filterValueIncludeList: string[], // include only these values in filter
  disableRowClick: boolean, // disables row click for this column
}
```

## Imperative API

You can use a ref to clear row selection:

```tsx
const tableRef = useRef<DataTableRef>(null);

<DataTable ref={tableRef} ... />

// Clear selection
tableRef.current?.clearSelection();
```

## License

MIT

## Contributing

PRs and issues welcome! See [GitHub repo](https://github.com/czkoudy/data-table).
