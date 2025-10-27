"use client";
import React, {useEffect, useState} from 'react';
import {Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField} from '@mui/material';
import {DataGrid, GridColDef} from '@mui/x-data-grid';
import {apiClient} from '@/lib/apiClient';
import {Group} from '@/lib/types';

export const GroupsManager: React.FC<{ open: boolean; onClose: () => void }> = ({open, onClose}) => {
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [saving, setSaving] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const resp = await apiClient.get('/groups');
            setGroups(resp.data || []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) load();
    }, [open]);

    const handleCreate = async () => {
        if (!name) return;
        setSaving(true);
        try {
            await apiClient.post('/groups', {group_name: name, group_description: description});
            setName('');
            setDescription('');
            await load();
        } finally {
            setSaving(false);
        }
    };

    const columns: GridColDef[] = [
        {field: 'group_name', headerName: 'Name', flex: 1},
        {field: 'group_description', headerName: 'Description', flex: 2}
    ];

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle>Manage Global Groups</DialogTitle>
            <DialogContent>
                {/* Input fields for new group */}
                <Stack spacing={2} mb={2}>
                    <TextField label="Group Name" fullWidth size="small" value={name}
                               onChange={e => setName(e.target.value)} required/>
                    <TextField label="Description" fullWidth size="small" multiline rows={2} value={description}
                               onChange={e => setDescription(e.target.value)}/>
                </Stack>
                {/* Add button */}
                <Box mb={2} textAlign="right">
                    <Button variant="contained" onClick={handleCreate} disabled={!name || saving}>Add Group</Button>
                </Box>
                {/* Groups table */}
                <Box sx={{height: 400}}>
                    <DataGrid
                        rows={groups.map((g, i) => ({id: i, ...g}))}
                        columns={columns}
                        loading={loading}
                        hideFooter
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={saving}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};
