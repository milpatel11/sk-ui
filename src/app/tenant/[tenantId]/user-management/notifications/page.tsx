"use client";
import React from 'react';
import {Box, Chip, Paper, Stack, Typography} from '@mui/material';

// Placeholder mock notifications
const notifications = [
    {id: 'n1', type: 'INFO', message: 'Welcome to the portal.'},
    {id: 'n2', type: 'TASK', message: 'Complete your profile information.'},
    {id: 'n3', type: 'SECURITY', message: 'Password will expire in 10 days.'}
];

export default function NotificationsPage() {
    return (
        <Box maxWidth={900} mx="auto" py={2}>
            <Typography variant="h5" gutterBottom>Notifications</Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>Central inbox of system & application
                notifications (placeholder).</Typography>
            <Stack spacing={2}>
                {notifications.map(n => (
                    <Paper key={n.id} sx={{p: 2, display: 'flex', alignItems: 'center', gap: 2}}>
                        <Chip label={n.type} size="small"
                              color={n.type === 'SECURITY' ? 'error' : n.type === 'TASK' ? 'warning' : 'default'}/>
                        <Typography variant="body2" flexGrow={1}>{n.message}</Typography>
                        <Typography variant="caption" color="text.secondary">#{n.id}</Typography>
                    </Paper>
                ))}
                {!notifications.length &&
                    <Typography variant="caption" color="text.secondary">No notifications.</Typography>}
            </Stack>
        </Box>
    );
}
