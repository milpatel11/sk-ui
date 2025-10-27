"use client";
import React from 'react';
import {useChat} from './ChatContext';
import {Avatar, Box, List, ListItemButton, ListSubheader, Stack, Tooltip, Typography} from '@mui/material';
import GroupIcon from '@mui/icons-material/Groups';
import PersonIcon from '@mui/icons-material/Person';

const initials = (name?: string | null) => (name || '?').substring(0, 1).toUpperCase();

export const ChatThreadList: React.FC = () => {
    const {threads, activeThreadId, setActiveThreadId, loadingThreads, users} = useChat();
    return (
        <List dense disablePadding
              subheader={<ListSubheader disableSticky sx={{bgcolor: 'transparent', px: 1}}>Chats</ListSubheader>}
              sx={{overflowY: 'auto', flexGrow: 1}}>
            {loadingThreads && <Typography variant="caption" sx={{px: 2, py: 1}}>Loading threads...</Typography>}
            {!loadingThreads && threads.map(t => {
                const isActive = t.thread_id === activeThreadId;
                const otherUserId = t.type === 'DIRECT' ? t.participant_user_ids.find(u => u !== users[0]?.user_id) : undefined;
                const group = t.group_id; // could enrich later
                const label = t.type === 'GROUP' ? `Group ${group || ''}` : (otherUserId || 'Direct');
                return (
                    <ListItemButton key={t.thread_id} selected={isActive} onClick={() => setActiveThreadId(t.thread_id)}
                                    sx={{alignItems: 'flex-start', py: 1}}>
                        <Stack direction="row" spacing={1} alignItems="center" width="100%">
                            <Avatar sx={{width: 32, height: 32}}>
                                {t.type === 'GROUP' ? <GroupIcon fontSize="small"/> : <PersonIcon fontSize="small"/>}
                            </Avatar>
                            <Box flexGrow={1} minWidth={0}>
                                <Typography variant="body2" noWrap fontWeight={500}>{label}</Typography>
                                <Typography variant="caption" color="text.secondary"
                                            noWrap>{t.last_message_preview || 'No messages yet'}</Typography>
                            </Box>
                            {t.last_message_at &&
                                <Tooltip title={new Date(t.last_message_at).toLocaleString()}><Typography
                                    variant="caption"
                                    color="text.secondary">{new Date(t.last_message_at).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}</Typography></Tooltip>}
                        </Stack>
                    </ListItemButton>
                );
            })}
            {!loadingThreads && !threads.length &&
                <Typography variant="caption" sx={{px: 2, py: 1}} color="text.secondary">No chats yet.</Typography>}
        </List>
    );
};
