"use client";
import React, { useEffect, useState } from 'react';
import { Box, Button, Paper, Typography, Stack, TextField } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { apiClient } from '@/lib/apiClient';
import { Role } from '@/lib/types';

export const RolesManager: React.FC<{ title?: string }> = ({ title = 'Roles Manager' }) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [scope, setScope] = useState<'GLOBAL' | 'TENANT' | 'APPLICATION'>('TENANT');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const resp = await apiClient.get('/roles');
      setRoles(Array.isArray(resp.data) ? resp.data : []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const resp = await apiClient.post('/roles', { name: name.trim(), scope });
      setName('');
      setScope('TENANT');
      await load();
    } finally { setSaving(false); }
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'scope', headerName: 'Scope', width: 140 }
  ];

  return (
    <Box>
      <Typography variant="h5" gutterBottom>{title}</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-end" mb={2}>
        <TextField label="Role Name" fullWidth size="small" value={name} onChange={e => setName(e.target.value)} required />
        <TextField select label="Scope" size="small" value={scope} onChange={e => setScope(e.target.value as any)} SelectProps={{ native: true }} sx={{ width: 160 }}>
          <option value="GLOBAL">GLOBAL</option>
          <option value="TENANT">TENANT</option>
          <option value="APPLICATION">APPLICATION</option>
        </TextField>
        <Button variant="contained" onClick={handleCreate} disabled={!name.trim() || saving}>Add Role</Button>
      </Stack>
      <Paper sx={{ height: 500, width: '100%' }}>
        <DataGrid
          rows={roles.map(r => ({ id: r.role_id || r.name, ...r }))}
          columns={columns}
          loading={loading}
          pageSizeOptions={[5, 10, 25]}
          initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
          disableRowSelectionOnClick
          pagination
        />
      </Paper>
    </Box>
  );
};

export default RolesManager;