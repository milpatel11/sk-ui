"use client";
import React, {useState} from 'react';
import {Alert, Box, Button, Paper, Stack, TextField, Typography} from '@mui/material';
import {apiClient} from '@/lib/apiClient';
import {useRouter} from 'next/navigation';
import type {GlobalUser} from '@/lib/types';

export default function ForgotPasswordRequestPage() {
    const [usernameOrEmail, setUsernameOrEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<{ status: 'idle' | 'ok' | 'error'; message?: string }>({status: 'idle'});
    const router = useRouter();

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setResult({status: 'idle'});
        try {
            const usersResp = await apiClient.get('/users');
            const list = (usersResp.data as GlobalUser[]) || [];
            const user = list.find((u) => u.username === usernameOrEmail || u.email === usernameOrEmail);
            if (!user) {
                setResult({status: 'error', message: 'User not found'});
            } else {
                const resp = await apiClient.post('/password-reset-requests', {user_id: user.user_id});
                if (resp.data) setResult({status: 'ok', message: 'Request submitted for admin approval.'});
            }
        } catch (err: unknown) {
            const message = err && typeof err === 'object' && 'message' in err ? String((err as any).message) : 'Failed to submit request';
            setResult({status: 'error', message});
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Box maxWidth={480} mx="auto" py={4}>
            <Paper sx={{p: 3}}>
                <Typography variant="h6" gutterBottom>Forgot Password</Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>Enter your username or email. An admin must
                    approve your reset request before you receive a token.</Typography>
                <form onSubmit={submit}>
                    <Stack spacing={2}>
                        <TextField
                            label="Username or Email"
                            size="small"
                            fullWidth
                            value={usernameOrEmail}
                            onChange={e => setUsernameOrEmail(e.target.value)}
                            required
                        />
                        <Stack direction={{xs: 'column', sm: 'row'}} spacing={1}>
                            <Button type="submit" variant="contained"
                                    disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Request'}</Button>
                            <Button variant="outlined" onClick={() => router.push('/login')}>Back to Sign In</Button>
                        </Stack>
                        {result.status === 'ok' && <Alert severity="success">{result.message}</Alert>}
                        {result.status === 'error' && <Alert severity="error">{result.message}</Alert>}
                    </Stack>
                </form>
            </Paper>
        </Box>
    );
}