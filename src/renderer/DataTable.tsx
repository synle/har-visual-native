import React, { useState, useEffect, useMemo } from 'react';
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
import { Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import { Checkbox, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";

function ShowVisibleColumnsDialog(props: {
  columns: string[],
  visibleColumns: string[],
}) {
  const {columns} = props;
  const [open, setOpen] = useState(false);

  const [visibleColumns, setVisibleColumns] = useState(props.visibleColumns || []);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);

    // update it in localStorage - this trigger data updates
    window.localStorage.setItem('networkTable.hiddenColumnNames', columns.filter(column => visibleColumns.indexOf(column) === -1).join(','));
  };

  const handleToggleVisibleColumn = (value) =>  {
    let newVisibleColumns = visibleColumns;

    if(visibleColumns.indexOf(value) === -1){
      // this new column is not visible, let's add it
      newVisibleColumns = [...newVisibleColumns, value]
    } else {
      // else, remove it
      newVisibleColumns = newVisibleColumns.filter(column => column !== value)
    }

    setVisibleColumns(newVisibleColumns);
  };


  return (
    <div>
      <Button variant="outlined" color="primary" onClick={handleClickOpen}>
        Show / Hide Columns
      </Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Visible Columns</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <div>This is a list of all available columns</div>
            <div>
              <List sx={{ width: "100%", maxWidth: 360, bgcolor: "background.paper" }}>
                {columns.map((columnName) => {
                  const labelId = `checkbox-list-label-${columnName}`;

                  return (
                    <ListItem
                      key={columnName}
                      disablePadding
                    >
                      <ListItemButton onClick={() => handleToggleVisibleColumn(columnName)}>
                        <ListItemIcon>
                          <Checkbox
                            edge="start"
                            checked={visibleColumns.indexOf(columnName) >= 0}
                            tabIndex={-1}
                            disableRipple
                            inputProps={{ "aria-labelledby": labelId }}
                          />
                        </ListItemIcon>
                        <ListItemText id={labelId} primary={columnName} />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>

            </div>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

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
  let { columns, data } = props;

  const hiddenColumns = useMemo(() => {
    return (window.localStorage.getItem('networkTable.hiddenColumnNames') || '').split(',')
  }, [(window.localStorage.getItem('networkTable.hiddenColumnNames') || '')]);

  const visibleColumns = useMemo(() => {
    return columns.filter(column => hiddenColumns.indexOf(column.Header) === -1)
  }, [JSON.stringify(columns), JSON.stringify(hiddenColumns)])

  const allAvailableColumns = useMemo(() => {
    return columns.map(column => column.Header)
  }, [JSON.stringify(columns)])

  const tableInstance = useTable(
    {
      columns: visibleColumns,
      data,
      defaultColumn: { Filter: SimpleColumnFilter },
    },
    useFilters
  );

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    tableInstance;

  return (
    <>
      <ShowVisibleColumnsDialog columns={allAvailableColumns} visibleColumns={visibleColumns.map(column => column.Header)} />
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
