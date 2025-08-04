import React, { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  getSortedRowModel,
} from "@tanstack/react-table";
import clsx from "clsx";

type SortingState = {
  id: string;
  desc: boolean;
}[];

const Table: React.FC<{ data: Record<string, any>[]; isSort?: boolean }> = ({
  data,
  isSort = false,
}) => {
  const columns = useMemo<ColumnDef<Record<string, any>>[]>(() => {
    if (!data || data.length === 0) return [];

    return Object.keys(data[0]).map((key) => ({
      accessorKey: key,
      header: key,
      cell: (info) => info.getValue(),
    }));
  }, [data]);
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // debugTable: true,
    enableSorting: isSort,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
  });

  const headerLength = table.getHeaderGroups()[0]?.headers.length || 0;
  const lastRowIndex = table.getRowModel().rows.length - 1;

  // max-h-[540px] 
  return (
    <div className="overflow-hidden w-[80%] max-w-[1600px] rounded-lg border border-neutral-100/10 flex flex-col relative">
      {/* table-fixed */}
      <div className="absolute top-0 w-full h-10.5 z-[5] backdrop-blur-sm" />
      <div className="overflow-auto flex-1 ">
        <table className="w-full border-spacing-0 text-center border-separate">
          <thead className="sticky top-0 z-10 backdrop-blur">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header, index) => (
                  <th
                    key={header.id}
                    className={clsx(
                      "p-2 border border-neutral-100/10 bg-neutral-100/5 text-white bg-clip-padding capitalize",
                      index === 0 && "rounded-tl-[7px]",
                      index === headerLength - 1 && "rounded-tr-[7px]"
                    )}
                    onClick={() => {
                      if (header.column.getCanSort()) {
                        header.column.toggleSorting(
                          header.column.getIsSorted() === "asc"
                        );
                      }
                    }}
                  >
                    {/* bg-neutral-950/30 */}
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, rowIndex) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell, cellIndex) => (
                  <td
                    key={cell.id}
                    className={clsx(
                      "p-2 border border-neutral-100/10 text-white",
                      rowIndex === lastRowIndex &&
                        cellIndex === 0 &&
                        "rounded-bl-[7px]",
                      rowIndex === lastRowIndex &&
                        cellIndex === headerLength - 1 &&
                        "rounded-br-[7px]"
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
