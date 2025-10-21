"use client";
import React, { useEffect, useState } from 'react';
import { Box, Button, Paper, Typography, Stack, TextField } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { apiClient } from '@/lib/apiClient';
import { Permission } from '@/lib/types';

export const PermissionsManager: React.FC<{ title?: string }> = ({ title = 'Permissions Manager' }) => {
  const [items, setItems] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const resp = await apiClient.get('/permissions');
      setItems(Array.isArray(resp.data) ? resp.data : []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await apiClient.post('/permissions', { name: name.trim(), description: description.trim() || null });
      setName(''); setDescription('');
      await load();
    } finally { setSaving(false); }
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Permission', flex: 1 },
    { field: 'description', headerName: 'Description', flex: 2 }
  ];

  return (
    <Box>
      <Typography variant="h5" gutterBottom>{title}</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-end" mb={2}>
        <TextField label="Permission" fullWidth size="small" value={name} onChange={e => setName(e.target.value)} required />
        <TextField label="Description" fullWidth size="small" value={description} onChange={e => setDescription(e.target.value)} />
        <Button variant="contained" onClick={handleCreate} disabled={!name.trim() || saving}>Add</Button>
      </Stack>
      <Paper sx={{ height: 500, width: '100%' }}>
        <DataGrid
          rows={items.map(i => ({ id: i.permission_id || i.name, ...i }))}
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

export default PermissionsManager;