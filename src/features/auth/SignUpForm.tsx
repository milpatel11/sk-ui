"use client";
import React, {useState} from 'react';
import {Button, Link, Stack, TextField, Typography} from '@mui/material';
import {apiClient} from '@/lib/apiClient';
import {useRouter} from 'next/navigation';
import {useAuth} from './AuthContext';

interface AuthResponse {
    accessToken?: string;
    expiresInSeconds?: number;
    userId?: string;
    token?: string;

    [k: string]: unknown;
}

interface ApiErrorShape {
    status: number;
    message: string;
    details?: unknown;
}

export const SignUpForm: React.FC = () => {
    const {setSession} = useAuth();
    const router = useRouter();
    // Switch to camelCase keys to match backend field names
    const [form, setForm] = useState({firstName: '', lastName: '', email: '', username: '', password: ''});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const clearFieldError = (k: string) => setFieldErrors(prev => {
        if (!prev[k]) return prev;
        const clone = {...prev};
        delete clone[k];
        return clone;
    });

    const onChange = (k: keyof typeof form, v: string) => {
        setForm(f => ({...f, [k]: v}));
        clearFieldError(k);
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setFieldErrors({});
        try {
            const payload = {...form, tenantId: undefined};
            const resp = await apiClient.post('/api/auth/signup', payload);
            const body: AuthResponse = (resp.data || {}) as AuthResponse;
            const {accessToken, expiresInSeconds, userId, token} = body;
            const effectiveToken = accessToken || token;
            const effectiveUserId = userId || form.username;
            if (effectiveToken) localStorage.setItem('authToken', effectiveToken);
            if (effectiveUserId) localStorage.setItem('userId', effectiveUserId);
            let expiresAtMs: number | null = null;
            if (expiresInSeconds) {
                if (expiresInSeconds > 24 * 3600) expiresAtMs = Number(expiresInSeconds) * 1000; else expiresAtMs = Date.now() + Number(expiresInSeconds) * 1000;
                localStorage.setItem('expiresAt', String(expiresAtMs));
            }
            setSession({token: effectiveToken || null, userId: effectiveUserId, expiresAt: expiresAtMs});
            router.push('/tenant/register');
        } catch (e: unknown) {
            const err = e as Partial<ApiErrorShape> | undefined;
            if (err && err.status === 400) {
                const details: any = err.details;
                let applied = false;
                if (details && typeof details === 'object') {
                    const structured = details.errors && typeof details.errors === 'object' && !Array.isArray(details.errors) ? details.errors : null;
                    if (structured) {
                        const fe: Record<string, string> = {};
                        Object.entries(structured).forEach(([k, v]) => {
                            if (typeof v === 'string') fe[k] = v;
                        });
                        if (Object.keys(fe).length) {
                            setFieldErrors(fe);
                            applied = true;
                        }
                    } else {
                        // If details is a flat map of field->message (but not nested in errors)
                        const possible: Record<string, string> = {};
                        Object.entries(details).forEach(([k, v]) => {
                            if (typeof v === 'string' && ['firstName', 'lastName', 'email', 'username', 'password'].includes(k)) possible[k] = v;
                        });
                        if (Object.keys(possible).length) {
                            setFieldErrors(possible);
                            applied = true;
                        }
                    }
                    if (!applied) {
                        const msg: string | undefined = details.message || err.message;
                        if (msg) {
                            const lower = msg.toLowerCase();
                            if (lower.includes('email')) {
                                setFieldErrors({email: msg});
                                applied = true;
                            } else if (lower.includes('username')) {
                                setFieldErrors({username: msg});
                                applied = true;
                            } else if (lower.includes('password')) {
                                setFieldErrors({password: msg});
                                applied = true;
                            }
                        }
                        if (!applied) setError(msg || 'Sign up failed');
                    }
                } else {
                    const msg = err.message;
                    if (msg) {
                        const lower = msg.toLowerCase();
                        if (lower.includes('email')) {
                            setFieldErrors({email: msg});
                            applied = true;
                        } else if (lower.includes('username')) {
                            setFieldErrors({username: msg});
                            applied = true;
                        } else if (lower.includes('password')) {
                            setFieldErrors({password: msg});
                            applied = true;
                        }
                    }
                    if (!applied) setError(err.message || 'Sign up failed');
                }
            } else {
                setError(err?.message || 'Sign up failed');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={submit} style={{width: '100%', maxWidth: 420}}>
            <Stack spacing={2}>
                <Typography variant="h6">Create Account</Typography>
                <Stack direction={{xs: 'column', sm: 'row'}} spacing={2}>
                    <TextField label="First Name" value={form.firstName}
                               onChange={e => onChange('firstName', e.target.value)} fullWidth size="small"
                               error={!!fieldErrors.firstName} helperText={fieldErrors.firstName || ''}/>
                    <TextField label="Last Name" value={form.lastName}
                               onChange={e => onChange('lastName', e.target.value)} fullWidth size="small"
                               error={!!fieldErrors.lastName} helperText={fieldErrors.lastName || ''}/>
                </Stack>
                <TextField label="Email" value={form.email} onChange={e => onChange('email', e.target.value)} fullWidth
                           size="small" error={!!fieldErrors.email} helperText={fieldErrors.email || ''}/>
                <TextField label="Username" value={form.username} onChange={e => onChange('username', e.target.value)}
                           fullWidth size="small" error={!!fieldErrors.username}
                           helperText={fieldErrors.username || ''}/>
                <TextField label="Password" type="password" value={form.password}
                           onChange={e => onChange('password', e.target.value)} fullWidth size="small"
                           error={!!fieldErrors.password} helperText={fieldErrors.password || ''}/>
                {error && <div style={{color: 'red', fontSize: 12}}>{error}</div>}
                <Button type="submit" variant="contained"
                        disabled={loading}>{loading ? 'Creating...' : 'Sign Up'}</Button>
                <Typography variant="body2" color="text.secondary">Already have an account? <Link component="button"
                                                                                                  onClick={() => router.push('/login')}>Sign
                    In</Link></Typography>
            </Stack>
        </form>
    );
};

export default SignUpForm;