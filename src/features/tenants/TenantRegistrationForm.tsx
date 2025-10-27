"use client";
import React, {useState} from 'react';
import {Box, Button, Checkbox, Divider, FormControlLabel, Paper, Stack, TextField, Typography} from '@mui/material';
import {useRouter} from 'next/navigation';
import {useTenants} from './TenantContext';

export const TenantRegistrationForm: React.FC = () => {
    const router = useRouter();
    const {addTenant} = useTenants();
    const [form, setForm] = useState({
        tenant_name: '',
        tenant_description: '',
        billing_address_line1: '',
        billing_address_line2: '',
        billing_city: '',
        billing_state: '',
        billing_postal_code: '',
        billing_country: '',
        shipping_address_line1: '',
        shipping_address_line2: '',
        shipping_city: '',
        shipping_state: '',
        shipping_postal_code: '',
        shipping_country: '',
    });
    const [sameShipping, setSameShipping] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onChange = (k: string, v: string) => setForm(f => ({...f, [k]: v}));

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const payload = sameShipping ? {
                ...form,
                shipping_address_line1: form.billing_address_line1,
                shipping_address_line2: form.billing_address_line2,
                shipping_city: form.billing_city,
                shipping_state: form.billing_state,
                shipping_postal_code: form.billing_postal_code,
                shipping_country: form.billing_country,
            } : form;
            // Call Next.js API route to register tenant
            const res = await fetch('/api/tenants', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                let msg = `Failed (${res.status})`;
                try {
                    const errJson = await res.json();
                    msg = errJson?.message || msg;
                } catch {
                }
                throw new Error(msg);
            }
            const data = await res.json();
            addTenant(data);
            router.push(`/tenant/${data.tenant_id}`);
        } catch (err: any) {
            setError(err.message || 'Tenant registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Paper elevation={0} sx={{
            p: 3,
            pt: 3.5,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            maxWidth: 900,
            width: '100%',
            background: (t) => t.palette.mode === 'light' ? '#fff' : t.palette.background.paper
        }}>
            <form onSubmit={submit}>
                <Stack spacing={3}>
                    <Box>
                        <Typography variant="h5" fontWeight={600} sx={{fontSize: {xs: 22, md: 26}}}>Create a New
                            Tenant</Typography>
                        <Typography variant="body2" color="text.secondary" mt={0.5}>Provide basic details and billing
                            address. You can refine settings later.</Typography>
                    </Box>
                    <Box display="grid" gap={2} gridTemplateColumns={{xs: '1fr', md: '1fr 1fr'}}>
                        <TextField label="Tenant Name" value={form.tenant_name}
                                   onChange={e => onChange('tenant_name', e.target.value)} fullWidth size="small"
                                   required/>
                        <TextField label="Description" value={form.tenant_description}
                                   onChange={e => onChange('tenant_description', e.target.value)} fullWidth
                                   size="small"/>
                    </Box>
                    <Box>
                        <Typography variant="subtitle2" fontWeight={600} mb={1}>Billing Address</Typography>
                        <Box display="grid" gap={2} gridTemplateColumns={{xs: '1fr', md: 'repeat(2, 1fr)'}}>
                            <TextField label="Address Line 1" value={form.billing_address_line1}
                                       onChange={e => onChange('billing_address_line1', e.target.value)} fullWidth
                                       size="small" required/>
                            <TextField label="Address Line 2" value={form.billing_address_line2}
                                       onChange={e => onChange('billing_address_line2', e.target.value)} fullWidth
                                       size="small"/>
                        </Box>
                        <Box mt={2} display="grid" gap={2}
                             gridTemplateColumns={{xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)'}}>
                            <TextField label="City" value={form.billing_city}
                                       onChange={e => onChange('billing_city', e.target.value)} fullWidth size="small"
                                       required/>
                            <TextField label="State" value={form.billing_state}
                                       onChange={e => onChange('billing_state', e.target.value)} fullWidth size="small"
                                       required/>
                            <TextField label="Postal Code" value={form.billing_postal_code}
                                       onChange={e => onChange('billing_postal_code', e.target.value)} fullWidth
                                       size="small" required/>
                            <TextField label="Country" value={form.billing_country}
                                       onChange={e => onChange('billing_country', e.target.value)} fullWidth
                                       size="small" required/>
                        </Box>
                        <FormControlLabel sx={{mt: 1.5}} control={<Checkbox checked={sameShipping}
                                                                            onChange={(e) => setSameShipping(e.target.checked)}/>}
                                          label={<Typography variant="body2">Shipping address same as
                                              billing</Typography>}/>
                    </Box>
                    {!sameShipping && (
                        <Box>
                            <Typography variant="subtitle2" fontWeight={600} mb={1}>Shipping Address</Typography>
                            <Box display="grid" gap={2} gridTemplateColumns={{xs: '1fr', md: 'repeat(2, 1fr)'}}>
                                <TextField label="Address Line 1" value={form.shipping_address_line1}
                                           onChange={e => onChange('shipping_address_line1', e.target.value)} fullWidth
                                           size="small" required/>
                                <TextField label="Address Line 2" value={form.shipping_address_line2}
                                           onChange={e => onChange('shipping_address_line2', e.target.value)} fullWidth
                                           size="small"/>
                            </Box>
                            <Box mt={2} display="grid" gap={2}
                                 gridTemplateColumns={{xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)'}}>
                                <TextField label="City" value={form.shipping_city}
                                           onChange={e => onChange('shipping_city', e.target.value)} fullWidth
                                           size="small" required/>
                                <TextField label="State" value={form.shipping_state}
                                           onChange={e => onChange('shipping_state', e.target.value)} fullWidth
                                           size="small" required/>
                                <TextField label="Postal Code" value={form.shipping_postal_code}
                                           onChange={e => onChange('shipping_postal_code', e.target.value)} fullWidth
                                           size="small" required/>
                                <TextField label="Country" value={form.shipping_country}
                                           onChange={e => onChange('shipping_country', e.target.value)} fullWidth
                                           size="small" required/>
                            </Box>
                        </Box>
                    )}
                    {error && <Typography color="error" variant="body2">{error}</Typography>}
                    <Divider/>
                    <Stack direction="row" justifyContent="flex-end" spacing={2}>
                        <Button type="submit" variant="contained" size="medium"
                                disabled={loading || !form.tenant_name.trim() || !form.billing_address_line1.trim()}
                                sx={{textTransform: 'none', px: 3}}>
                            {loading ? 'Saving...' : 'Create Tenant'}
                        </Button>
                    </Stack>
                </Stack>
            </form>
        </Paper>
    );
};

export default TenantRegistrationForm;