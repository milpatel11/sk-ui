"use client";
import React, { useEffect, useState } from 'react';
import { Box, Button, Paper, TextField, Stack, Typography } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { apiClient } from '@/lib/apiClient';
import { Group } from '@/lib/types';

interface GroupCrudPanelProps {
  title?: string;
  filterScope?: 'GLOBAL' | 'TENANT' | 'APPLICATION' | null;
}

export const GroupCrudPanel: React.FC<GroupCrudPanelProps> = ({ title = 'Global Groups', filterScope = null }) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const resp = await apiClient.get('/groups');
      const raw = Array.isArray(resp.data) ? resp.data : [];
      const normalized: Group[] = raw.map((g: any) => ({
        group_id: g.group_id ?? g.groupId ?? g.id,
        group_name: g.group_name ?? g.groupName ?? g.name,
        group_description: g.group_description ?? g.groupDescription ?? g.description ?? null,
        tenant_id: g.tenant_id ?? g.tenantId ?? null,
      }));
      let data: Group[] = normalized;
      if (filterScope === 'GLOBAL') {
        data = data.filter(g => !g.tenant_id);
      }
      setGroups(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await apiClient.post('/groups', { group_name: name.trim(), group_description: description.trim() || null });
      setName(''); setDescription('');
      await load();
    } finally { setSaving(false); }
  };

  const columns: GridColDef[] = [
    { field: 'group_name', headerName: 'Group Name', flex: 1 },
    { field: 'group_description', headerName: 'Description', flex: 2 }
  ];

  return (
    <Box>
      <Typography variant="h5" gutterBottom>{title}</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-end" mb={2}>
        <TextField label="Group Name" fullWidth size="small" value={name} onChange={e => setName(e.target.value)} required />
        <TextField label="Description" fullWidth size="small" value={description} onChange={e => setDescription(e.target.value)} />
        <Button variant="contained" onClick={handleCreate} disabled={!name.trim() || saving}>Add Group</Button>
      </Stack>
      <Paper sx={{ height: 500, width: '100%' }}>
        <Box sx={{ width:'100%', minWidth:0 }}>
          <DataGrid
            rows={groups.map(g => ({ id: g.group_id, ...g }))}
            columns={columns}
            loading={loading}
            pageSizeOptions={[5, 10, 15]}
            initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
            disableRowSelectionOnClick
            pagination
          />
        </Box>
      </Paper>
    </Box>
  );
};