"use client";
import React from 'react';
import { Box, Typography, FormControl, InputLabel, Select, MenuItem, Chip, Paper, Button, Stack } from '@mui/material';
import { Application, ApplicationUser, GlobalUser, Role } from '@/lib/types';
import { apiClient } from '@/lib/apiClient';

interface ApplicationUserRolesPanelProps {
  applications: Application[];
  users: GlobalUser[];
  roles: Role[]; // all roles, will filter to scope==='APPLICATION'
}

export const ApplicationUserRolesPanel: React.FC<ApplicationUserRolesPanelProps> = ({ applications, users, roles }) => {
  const appRoles = React.useMemo(() => roles.filter(r => r.scope === 'APPLICATION'), [roles]);
  const [mappings, setMappings] = React.useState<ApplicationUser[]>([]);
  const [selectedApp, setSelectedApp] = React.useState<string>('');
  const [selectedUser, setSelectedUser] = React.useState<string>('');
  const [selectedRoleIds, setSelectedRoleIds] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const loadMappings = React.useCallback(async () => {
    setLoading(true);
    try {
      const resp = await apiClient.get('/application-users');
      setMappings(resp.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { loadMappings(); }, [loadMappings]);

  React.useEffect(() => {
    if (selectedApp && selectedUser) {
      const entry = mappings.find(m => m.application_id === selectedApp && m.user_id === selectedUser);
      setSelectedRoleIds(entry ? entry.role_ids : []);
    } else {
      setSelectedRoleIds([]);
    }
  }, [selectedApp, selectedUser, mappings]);

  const handleSave = async () => {
    if (!selectedApp || !selectedUser) return;
    setSaving(true);
    try {
      await apiClient.put(`/application-users/${selectedApp}/${selectedUser}`, { role_ids: selectedRoleIds });
      await loadMappings();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle1" gutterBottom>Application User Role Management</Typography>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={2}>
        <FormControl fullWidth size="small">
          <InputLabel id="app-select-label">Application</InputLabel>
          <Select labelId="app-select-label" label="Application" value={selectedApp} onChange={e => setSelectedApp(e.target.value)}>
            {applications.map(a => <MenuItem key={a.application_id} value={a.application_id}>{a.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl fullWidth size="small" disabled={!selectedApp}>
          <InputLabel id="user-select-label">User</InputLabel>
          <Select labelId="user-select-label" label="User" value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
            {users.map(u => <MenuItem key={u.user_id} value={u.user_id}>{u.username || u.email || u.user_id}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl fullWidth size="small" disabled={!selectedApp || !selectedUser}>
          <InputLabel id="roles-select-label">Roles</InputLabel>
          <Select
            multiple
            labelId="roles-select-label"
            label="Roles"
            value={selectedRoleIds}
            onChange={e => setSelectedRoleIds(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {(selected as string[]).map(id => {
                  const r = appRoles.find(ar => ar.role_id === id);
                  return <Chip key={id} label={r?.name || id} size="small" />;
                })}
              </Box>
            )}
          >
            {appRoles.map(r => <MenuItem key={r.role_id} value={r.role_id}>{r.name}</MenuItem>)}
          </Select>
        </FormControl>
      </Stack>
      <Box display="flex" gap={2}>
        <Button variant="contained" size="small" disabled={!selectedApp || !selectedUser || saving} onClick={handleSave}>Save</Button>
        <Button variant="text" size="small" disabled={!selectedApp || !selectedUser || saving} onClick={() => loadMappings()}>Refresh</Button>
        {loading && <Typography variant="caption" color="text.secondary">Loading...</Typography>}
        {saving && <Typography variant="caption" color="text.secondary">Saving...</Typography>}
      </Box>
    </Paper>
  );
};
