"use client";
import React, {useState} from 'react';
import {Button, Link, Stack, TextField, Typography} from '@mui/material';
import {apiClient} from '@/lib/apiClient';
import {useRouter} from 'next/navigation';
import {useTenants} from '@/features/tenants/TenantContext';
import {TenantSelector} from '@/features/tenants/TenantSelector';
import {useAuth} from './AuthContext';

export const LoginForm: React.FC = () => {
    const {setSession} = useAuth();
    const {tenants, activeTenantId} = useTenants();
    const router = useRouter();
    const [stage, setStage] = useState<'credentials' | 'tenant'>('credentials');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setFieldErrors({});
        try {
            const identifier = username.trim();
            const payload = identifier.includes('@')
                ? {email: identifier, password}
                : {username: identifier, password};
            // Call new auth service endpoint (separate base path)
            const resp = await apiClient.post('/auth/login', payload);
            // Read tokens from response body
            const {accessToken, refreshToken, expiresInSeconds, token} = (resp.data || {}) as any;
            const effectiveToken = accessToken || token;
            if (effectiveToken) localStorage.setItem('authToken', effectiveToken);
            if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('userId', identifier);
            let expiresAtMs: number | null = null;
            if (expiresInSeconds) {
                if (expiresInSeconds > 24 * 3600) {
                    expiresAtMs = Number(expiresInSeconds) * 1000; // treat as epoch seconds
                } else {
                    expiresAtMs = Date.now() + Number(expiresInSeconds) * 1000; // treat as relative seconds
                }
                localStorage.setItem('expiresAt', String(expiresAtMs));
            }
            setSession({token: effectiveToken || null, userId: identifier, expiresAt: expiresAtMs});
            if (tenants.length > 1) {
                setStage('tenant');
            } else {
                const onlyTenant = tenants[0];
                if (onlyTenant) {
                    localStorage.setItem('tenantId', onlyTenant.tenant_id);
                    router.push(`/tenant/${onlyTenant.tenant_id}`);
                } else {
                    router.push('/login');
                }
            }
        } catch (err: any) {
            // apiClient rejects with ApiError { status, message, details }
            if (err && err.status === 400) {
                const source = (err.details && typeof err.details === 'object' && !Array.isArray(err.details)) ? err.details : undefined;
                if (source) {
                    const fe: Record<string, string> = {};
                    Object.entries(source as Record<string, unknown>).forEach(([k, v]) => {
                        if (typeof v === 'string') fe[k] = v;
                    });
                    if (Object.keys(fe).length) {
                        setFieldErrors(fe);
                    } else {
                        setError(err.message || 'Login failed');
                    }
                } else {
                    setError(err.message || 'Login failed');
                }
            } else {
                setError(err?.message || 'Login failed');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{width: '100%', maxWidth: 380}}>
            {stage === 'credentials' && (
                <form onSubmit={submit}>
                    <Stack spacing={2}>
                        <Typography variant="h6">Sign In</Typography>
                        <TextField label="Username or Email" value={username}
                                   onChange={e => setUsername(e.target.value)} fullWidth size="small"
                                   error={!!(fieldErrors.username || fieldErrors.email)}
                                   helperText={fieldErrors.username || fieldErrors.email || ''}/>
                        <TextField label="Password" type="password" value={password}
                                   onChange={e => setPassword(e.target.value)} fullWidth size="small"
                                   error={!!fieldErrors.password} helperText={fieldErrors.password || ''}/>
                        {error && <div style={{color: 'red', fontSize: 12}}>{error}</div>}
                        <Button type="submit" onClick={submit} variant="contained" disabled={loading}>
                            {loading ? 'Logging in...' : 'Continue'}
                        </Button>
                        <Typography variant="body2" color="text.secondary">No account? <Link component="button"
                                                                                             onClick={() => router.push('/signup')}>Sign
                            Up</Link></Typography>
                        <Typography variant="caption" color="text.secondary">Forgot password? <Link component="button"
                                                                                                    onClick={() => router.push('/forgot-password')}>Request
                            reset</Link></Typography>
                    </Stack>
                </form>
            )}
            {stage === 'tenant' && (
                <Stack spacing={2}>
                    <Typography variant="h6">Select Tenant</Typography>
                    <TenantSelector fullWidth autoFocus/>
                    <Button
                        variant="contained"
                        disabled={!activeTenantId}
                        onClick={() => {
                            if (activeTenantId) {
                                localStorage.setItem('tenantId', activeTenantId);
                                router.push(`/tenant/${activeTenantId}`);
                            }
                        }}
                    >
                        Continue
                    </Button>
                </Stack>
            )}
        </div>
    );
};