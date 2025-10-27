"use client";
import React, {useState} from 'react';
import {useChat} from './ChatContext';
import {
    Avatar,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
    Paper,
    Stack,
    TextField,
    Tooltip,
    Typography
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import VideocamIcon from '@mui/icons-material/Videocam';
import CallIcon from '@mui/icons-material/Call';

export const ChatWindow: React.FC<{ currentUserId: string; onBack?: () => void; isMobile?: boolean }> = ({
                                                                                                             currentUserId,
                                                                                                             onBack,
                                                                                                             isMobile
                                                                                                         }) => {
    const {activeThreadId, messages, loadingMessages, sendMessage} = useChat();
    const [draft, setDraft] = useState('');
    const [callType, setCallType] = useState<'audio' | 'video' | null>(null);

    const handleSend = async () => {
        if (!activeThreadId) return;
        await sendMessage(activeThreadId, draft, currentUserId);
        setDraft('');
    };

    if (!activeThreadId) return <Box flexGrow={1} display="flex" alignItems="center" justifyContent="center"><Typography
        variant="body2" color="text.secondary">Select or start a chat.</Typography></Box>;

    return (
        <Paper sx={{display: 'flex', flexDirection: 'column', height: '100%'}} variant="outlined">
            <Stack direction="row" spacing={1} alignItems="center"
                   sx={{px: 1, py: 1, borderBottom: '1px solid', borderColor: 'divider'}}>
                {isMobile && onBack && (
                    <IconButton size="small" onClick={onBack} sx={{mr: 0.5}}
                                aria-label="Back to chats list">←</IconButton>
                )}
                <Avatar sx={{width: 32, height: 32}}>C</Avatar>
                <Typography variant="subtitle2" flexGrow={1}>Conversation</Typography>
                <Tooltip title="Start audio call"><span><IconButton size="small"
                                                                    onClick={() => setCallType('audio')}><CallIcon
                    fontSize="small"/></IconButton></span></Tooltip>
                <Tooltip title="Start video call"><span><IconButton size="small"
                                                                    onClick={() => setCallType('video')}><VideocamIcon
                    fontSize="small"/></IconButton></span></Tooltip>
            </Stack>
            <Box flexGrow={1} sx={{overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1}}>
                {loadingMessages &&
                    <Typography variant="caption" color="text.secondary">Loading messages...</Typography>}
                {!loadingMessages && messages.map(m => (
                    <Box key={m.message_id} alignSelf={m.sender_user_id === currentUserId ? 'flex-end' : 'flex-start'}
                         maxWidth="70%" bgcolor={m.sender_user_id === currentUserId ? 'primary.main' : 'grey.200'}
                         color={m.sender_user_id === currentUserId ? 'primary.contrastText' : 'text.primary'} px={1.5}
                         py={0.5} borderRadius={1.5}>
                        <Typography variant="caption" sx={{
                            display: 'block',
                            opacity: 0.7
                        }}>{new Date(m.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}</Typography>
                        <Typography variant="body2" whiteSpace="pre-wrap">{m.body}</Typography>
                    </Box>
                ))}
            </Box>
            <Stack direction="row" spacing={1} sx={{p: 1, borderTop: '1px solid', borderColor: 'divider'}}>
                <TextField size="small" fullWidth placeholder="Message" value={draft}
                           onChange={e => setDraft(e.target.value)} onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                    }
                }}/>
                <IconButton color="primary" onClick={handleSend} disabled={!draft.trim()}><SendIcon
                    fontSize="small"/></IconButton>
            </Stack>
            <Dialog open={!!callType} onClose={() => setCallType(null)} maxWidth="xs" fullWidth>
                <DialogTitle>{callType === 'audio' ? 'Start Audio Call' : 'Start Video Call'}</DialogTitle>
                <DialogContent>
                    <DialogContentText>Do you want to initiate a {callType} call from this app? (Mock
                        confirmation)</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCallType(null)}>No</Button>
                    <Button variant="contained" onClick={() => { /* integrate actual call signaling later */
                        setCallType(null);
                    }}>Yes</Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};
