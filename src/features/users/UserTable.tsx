"use client";
import * as React from 'react';
import {DataGrid, GridColDef} from '@mui/x-data-grid';
import {GlobalUser} from '@/lib/types';

interface UserTableProps {
    rows: GlobalUser[];
    loading?: boolean;
}

const columns: GridColDef[] = [
    {field: 'username', headerName: 'Username', flex: 1, minWidth: 140},
    {field: 'email', headerName: 'Email', flex: 1, minWidth: 200},
    {field: 'first_name', headerName: 'First Name', flex: 1, minWidth: 120},
    {field: 'last_name', headerName: 'Last Name', flex: 1, minWidth: 120},
    {field: 'last_login', headerName: 'Last Login', flex: 1, minWidth: 180},
];

export const UserTable: React.FC<UserTableProps> = ({rows, loading}) => {
    return (
        <div style={{width: '100%', height: 500}}>
            <DataGrid
                rows={rows.map(r => ({id: r.user_id, ...r}))}
                columns={columns}
                loading={loading}
                disableRowSelectionOnClick
                pageSizeOptions={[25, 50, 100]}
                initialState={{pagination: {paginationModel: {pageSize: 25, page: 0}}}}
            />
        </div>
    );
};
