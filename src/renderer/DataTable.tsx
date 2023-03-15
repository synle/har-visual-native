import React, { useMemo } from 'react';
import { useTable, useFilters } from 'react-table';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TextField,
} from '@mui/material';
import TextField from '@mui/material/TextField';

// default filter (using text)
export function SimpleColumnFilter({
  column: { filterValue, setFilter },
}: {
  column: {
    filterValue?: string;
    setFilter: (newFilterValue: string | undefined) => void;
  };
}) {
  return (
    <TextField
      size="small"
      placeholder="Filter"
      value={filterValue || ''}
      onChange={(e) => setFilter(e.target.value || undefined)}
    />
  );
}

const TableWithReactTableAndColumnFilter: React.FC = (props: any) => {
  const { columns, data } = props;

  const tableInstance = useTable(
    {
      columns,
      data,
      defaultColumn: { Filter: SimpleColumnFilter },
    },
    useFilters
  );

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    tableInstance;

  return (
    <>
      <TableContainer>
        <Table {...getTableProps()}>
          <TableHead>
            {headerGroups.map((headerGroup) => (
              <TableRow {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map((column) => (
                  <TableCell {...column.getHeaderProps()}>
                    {column.render('Header')}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            <TableRow>
              {headerGroups.map((headerGroup) =>
                headerGroup.headers.map((column) => (
                  <TableCell {...column.getHeaderProps()}>
                    {column.canFilter ? column.render('Filter') : null}
                  </TableCell>
                ))
              )}
            </TableRow>
          </TableHead>
          <TableBody {...getTableBodyProps()}>
            {rows.map((row) => {
              prepareRow(row);
              return (
                <TableRow {...row.getRowProps()}>
                  {row.cells.map((cell) => {
                    return (
                      <TableCell {...cell.getCellProps()}>
                        {cell.render('Cell')}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

export default TableWithReactTableAndColumnFilter;
