"use client";
import React, { useEffect, useState } from 'react';
import { Box, Button, Paper, Typography, Stack } from '@mui/material';
import { apiClient } from '@/lib/apiClient';
import { GlobalUser } from '@/lib/types';
import { UserTable } from '@/features/users/UserTable';
import UserUpsertDialog from '@/features/users/UserUpsertDialog';

export const UsersManager: React.FC<{ title?: string }> = ({ title = 'User Manager' }) => {
  const [users, setUsers] = useState<GlobalUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState<GlobalUser | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const resp = await apiClient.get('/users');
      setUsers(Array.isArray(resp.data) ? resp.data : []);
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const handleCreate = () => {
    setEditing(null);
    setOpenDialog(true);
  };

  const handleEdit = (user: GlobalUser) => {
    setEditing(user);
    setOpenDialog(true);
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">{title}</Typography>
        <Button variant="contained" onClick={handleCreate}>Create User</Button>
      </Stack>

      <Paper sx={{ p: 2 }}>
        <UserTable rows={users} loading={loading} />
      </Paper>

      <UserUpsertDialog
        open={openDialog}
        onClose={() => { setOpenDialog(false); setEditing(null); }}
        initial={editing}
        onSaved={() => { setOpenDialog(false); setEditing(null); void load(); }}
      />
    </Box>
  );
};

export default UsersManager;