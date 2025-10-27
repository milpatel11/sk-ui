"use client";
import React, {useState} from 'react';
import Link from 'next/link';
import {
    AppBar,
    Toolbar,
    Button,
    Container,
    Box,
    Typography,
    Stack,
    Paper,
    TextField,
    Alert,
} from '@mui/material';

export default function Home() {
    // Inquiry form state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const onSubmitInquiry = async (e: React.FormEvent) => {
        e.preventDefault();
        setResult(null);
        if (!name.trim() || !email.trim() || !message.trim()) {
            setResult({type: 'error', text: 'Please fill out name, email, and your message.'});
            return;
        }
        setSubmitting(true);
        try {
            const resp = await fetch('/api/inquiry', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({name, email, message}),
            });
            if (!resp.ok) {
                const data = await resp.json().catch(() => ({}));
                throw new Error(data?.message || 'Failed to send inquiry');
            }
            setResult({type: 'success', text: 'Thanks! Your inquiry has been sent.'});
            setName(''); setEmail(''); setMessage('');
        } catch (err: any) {
            setResult({type: 'error', text: err?.message || 'Something went wrong.'});
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Box>
            {/* Header */}
            <AppBar position="sticky" color="transparent" elevation={0} sx={{backdropFilter: 'blur(6px)'}}>
                <Toolbar sx={{justifyContent: 'space-between', px: {xs: 1, sm: 2, md: 3}, flexWrap: 'wrap', rowGap: 1}}> 
                    <Typography
                        variant="h6"
                        fontWeight={700}
                        noWrap
                        sx={{
                            fontSize: {xs: 15, sm: 18},
                            maxWidth: {xs: '60%', sm: '70%'},
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}
                    >
                        Shree Krupa Enterprise Inc.
                    </Typography>
                    <Stack direction="row" spacing={{xs: 0.5, sm: 1}} sx={{flexShrink: 0}}>
                        <Button component={Link} href="/login" variant="text" size="small">Login</Button>
                        <Button component={Link} href="/signup" variant="contained" size="small">Sign Up</Button>
                    </Stack>
                </Toolbar>
            </AppBar>

            {/* Hero */}
            <Box sx={{bgcolor: 'background.paper', py: {xs: 4, md: 10}}}>
                <Container maxWidth="md">
                    <Stack direction={{xs: 'column', md: 'row'}} spacing={{xs: 2.5, md: 4}} alignItems="center">
                        <Box sx={{flex: 1}}>
                            <Typography variant="h3" fontWeight={800} gutterBottom sx={{textAlign: {xs: 'center', md: 'left'}, fontSize: {xs: 24, sm: 30, md: 40}, lineHeight: {xs: 1.2, md: 1.25}}}>
                                Build, Secure, and Scale Your Business
                            </Typography>
                            <Typography variant="h6" color="text.secondary" paragraph sx={{textAlign: {xs: 'center', md: 'left'}, fontSize: {xs: 15, sm: 17, md: 20}}}>
                                We provide an integrated suite of identity, finance, and reporting tools so you can focus on growth.
                            </Typography>
                            <Stack direction={{xs: 'column', sm: 'row'}} spacing={1.5} mt={2} sx={{alignItems: {xs: 'stretch', sm: 'center'}, justifyContent: {xs: 'center', md: 'flex-start'}}}>
                                <Button component={Link} href="mailto:info@shreekrupa.com" variant="contained" size="large" sx={{width: {xs: '100%', sm: 'auto'}, py: {xs: 1.1, sm: 1.2}}}>Send Inquiry</Button>
                            </Stack>
                        </Box>
                    </Stack>
                </Container>
            </Box>

            



            {/* Footer */}
            <Box component="footer" sx={{py: 4}}>
                <Container maxWidth="lg">
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                        © {new Date().getFullYear()} Shree Krupa Enterprise Inc. All rights reserved.
                    </Typography>
                </Container>
            </Box>
        </Box>
    );
}