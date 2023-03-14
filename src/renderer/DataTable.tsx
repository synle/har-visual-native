import { useMemo } from 'react';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { styled } from '@mui/material/styles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import {
  useFilters,
  useGlobalFilter,
  usePagination,
  useSortBy,
  useTable,
} from 'react-table';
import React, { useCallback, useRef, useState } from 'react';
import Table from '@mui/material/Table';
import TextField from '@mui/material/TextField';

export function GlobalFilter(props: any) {
  return (
    <TextField
      id={props.id}
      label="Search Table"
      size="small"
      variant="standard"
      sx={{ mb: 2 }}
      fullWidth
      onChange={(e) => props.onChange(e.target.value)}
    />
  );
}
// default filter (using text)
type SimpleColumnFilterProps = {
  column: {
    filterValue?: string;
    setFilter: (newFilterValue: string | undefined) => void;
  };
};

export function SimpleColumnFilter({
  column: { filterValue, setFilter },
}: SimpleColumnFilterProps) {
  return (
    <TextField
      size="small"
      placeholder="Filter"
      value={filterValue || ''}
      onChange={(e) => setFilter(e.target.value || undefined)}
    />
  );
}

export type DataTableProps = {
  columns: any[];
  data: any[];
  onRowClick?: (rowData: any) => void;
  rowContextOptions?: DropdownButtonOption[];
  searchInputId?: string;
  enableColumnFilter?: boolean;
};

export const ALL_PAGE_SIZE_OPTIONS: any[] = [
  { label: '10', value: 10 },
  { label: '25', value: 25 },
  { label: '50', value: 50 },
  { label: '100', value: 100 },
  { label: 'Show All', value: -1 },
];

export const DEFAULT_TABLE_PAGE_SIZE = 50;

function TableContainerWrapper(props: any) {
  return (
    <Paper square={true} variant="outlined">
      {props.children}
    </Paper>
  );
}
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.background.default,
    color: theme.palette.text.primary,
    fontWeight: 'bold',
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: '1rem',
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:last-child td, &:last-child th': {
    border: 0,
  },
  '&:hover': {
    backgroundColor: theme.palette.action.focus,
  },
}));

export default function DataTable(props: DataTableProps) {
  const { columns, data } = props;
  const [openContextMenuRowIdx, setOpenContextMenuRowIdx] = useState(-1);
  const anchorEl = useRef<HTMLElement | null>(null);

  const allRecordSize = data.length;
  let pageSizeToUse = DEFAULT_TABLE_PAGE_SIZE;
  if (pageSizeToUse === -1) {
    pageSizeToUse = allRecordSize;
  }

  const pageSizeOptions = ALL_PAGE_SIZE_OPTIONS.map((option) => ({
    ...option,
  }));
  pageSizeOptions[pageSizeOptions.length - 1].value = allRecordSize;

  const {
    getTableBodyProps,
    gotoPage,
    headerGroups,
    page,
    prepareRow,
    setPageSize,
    state,
    setGlobalFilter,
  } = useTable(
    {
      initialState: {
        pageSize: pageSizeToUse,
      },
      columns,
      data,
      // @ts-ignore
      defaultColumn: { Filter: SimpleColumnFilter },
    },
    useFilters,
    useGlobalFilter,
    useSortBy,
    usePagination
  );
  const { pageIndex, pageSize } = state;

  const onPageChange = useCallback(
    (e: React.MouseEvent<HTMLButtonElement> | null, page: number) => {
      gotoPage(page);
    },
    []
  );

  const onRowsPerPageChange = useCallback((e) => {
    setPageSize(e.target.value);
  }, []);

  const onRowContextMenuClick = (e: React.SyntheticEvent) => {
    const target = e.target as HTMLElement;
    const tr = target.closest('tr');
    const siblings = target.closest('tbody')?.children;
    if (siblings) {
      for (let rowIdx = 0; rowIdx < siblings.length; rowIdx++) {
        if (siblings[rowIdx] === tr) {
          e.preventDefault();
          setOpenContextMenuRowIdx(rowIdx);
          anchorEl.current = target;
          break;
        }
      }
    }
  };

  const targetRowContextOptions = (props.rowContextOptions || []).map(
    (rowContextOption) => ({
      ...rowContextOption,
      onClick: () =>
        rowContextOption.onClick &&
        rowContextOption.onClick(data[openContextMenuRowIdx]),
    })
  );

  return (
    <>
      {props.searchInputId && (
        <GlobalFilter id={props.searchInputId} onChange={setGlobalFilter} />
      )}
      <TableContainer component={TableContainerWrapper}>
        <Table sx={{ minWidth: 650 }} size="small">
          <TableHead sx={{ boxShadow: 4 }}>
            {headerGroups.map((headerGroup) => (
              <TableRow {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map((column, colIdx) => (
                  <StyledTableCell
                    {...column.getHeaderProps({
                      style: { minWidth: column.minWidth, width: column.width, verticalAlign: 'top' },
                    })}
                  >
                    <Box
                      {...column.getSortByToggleProps()}
                      sx={{ display: 'flex', alignItems: 'center' }}
                    >
                      <span>{column.render('Header')}</span>
                      {column.isSorted &&
                        (column.isSortedDesc ? (
                          <ArrowDropDownIcon fontSize="small" />
                        ) : (
                          <ArrowDropUpIcon fontSize="small" />
                        ))}
                    </Box>
                    {column.canFilter && (
                      <Box sx={{ mt: 1 }}>{column.render('Filter')}</Box>
                    )}
                  </StyledTableCell>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody
            {...getTableBodyProps()}
            onContextMenu={(e) => onRowContextMenuClick(e)}
          >
            {page.map((row, rowIdx) => {
              prepareRow(row);
              return (
                <StyledTableRow
                  {...row.getRowProps()}
                  onDoubleClick={(e) => {
                    e.preventDefault();
                    props.onRowClick && props.onRowClick(row.original);
                  }}
                  sx={{ cursor: props.onRowClick ? 'pointer' : '' }}
                >
                  {row.cells.map((cell, colIdx) => {
                    return (
                      <StyledTableCell
                        {...cell.getCellProps({
                          style: {
                            minWidth: cell.column.minWidth,
                            width: cell.column.width,
                            verticalAlign: 'top'
                          },
                        })}
                      >
                        {cell.render('Cell')}
                      </StyledTableCell>
                    );
                  })}
                </StyledTableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={data.length}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        page={pageIndex}
        rowsPerPage={pageSize}
        rowsPerPageOptions={pageSizeOptions}
        showFirstButton
        showLastButton
      />
    </>
  );
}
