"use client";
import React, {useMemo, useState} from 'react';
import {Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField} from '@mui/material';
import {z} from 'zod';
import {GlobalUser} from '@/lib/types';
import {apiClient} from '@/lib/apiClient';

const UserSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    first_name: z.string().optional().or(z.literal('')),
    last_name: z.string().optional().or(z.literal('')),
    tenant_id: z.string().optional().or(z.literal('')),
});

export interface UserUpsertDialogProps {
    open: boolean;
    onClose: () => void;
    onSaved?: (user: GlobalUser) => void;
    initial?: Partial<GlobalUser> | null;
}

export const UserUpsertDialog: React.FC<UserUpsertDialogProps> = ({open, onClose, onSaved, initial}) => {
    const isEdit = useMemo(() => Boolean(initial?.user_id), [initial]);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        username: initial?.username || '',
        email: initial?.email || '',
        first_name: initial?.first_name || '',
        last_name: initial?.last_name || '',
        tenant_id: initial?.tenant_id || '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    React.useEffect(() => {
        setForm({
            username: initial?.username || '',
            email: initial?.email || '',
            first_name: initial?.first_name || '',
            last_name: initial?.last_name || '',
            tenant_id: initial?.tenant_id || '',
        });
        setErrors({});
    }, [initial, open]);

    const handleChange = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(prev => ({...prev, [key]: e.target.value}));
    };

    const handleSubmit = async () => {
        setErrors({});
        const parsed = UserSchema.safeParse(form);
        if (!parsed.success) {
            const fieldErrors: Record<string, string> = {};
            parsed.error.issues.forEach(i => {
                const path = i.path[0] as string;
                fieldErrors[path] = i.message;
            });
            setErrors(fieldErrors);
            return;
        }

        setSubmitting(true);
        try {
            if (isEdit && initial?.user_id) {
                const resp = await apiClient.patch(`/users/${initial.user_id}`, parsed.data);
                const saved = (resp as any).data as GlobalUser;
                onSaved?.(saved);
            } else {
                const resp = await apiClient.post('/users', parsed.data);
                const saved = (resp as any).data as GlobalUser;
                onSaved?.(saved);
            }
            onClose();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{isEdit ? 'Edit User' : 'Create User'}</DialogTitle>
            <DialogContent>
                <Stack spacing={2} mt={1}>
                    <TextField label="Username" value={form.username} onChange={handleChange('username')} size="small"
                               required error={!!errors.username} helperText={errors.username}
                               inputProps={{autoComplete: 'off'}}/>
                    <TextField label="Email" value={form.email} onChange={handleChange('email')} size="small"
                               error={!!errors.email} helperText={errors.email}
                               inputProps={{autoComplete: 'off'}}/>
                    <Stack direction={{xs: 'column', sm: 'row'}} spacing={2}>
                        <TextField label="First Name" value={form.first_name} onChange={handleChange('first_name')}
                                   size="small" fullWidth/>
                        <TextField label="Last Name" value={form.last_name} onChange={handleChange('last_name')}
                                   size="small" fullWidth/>
                    </Stack>
                    <TextField label="Tenant Id" value={form.tenant_id} onChange={handleChange('tenant_id')}
                               size="small"/>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={submitting}>Cancel</Button>
                <Button onClick={handleSubmit} variant="contained"
                        disabled={submitting}>{isEdit ? 'Save' : 'Create'}</Button>
            </DialogActions>
        </Dialog>
    );
};

export default UserUpsertDialog;
