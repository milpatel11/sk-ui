"use client";
import React from 'react';
import Link from 'next/link';
import {AppBar, Box, Button, Container, Stack, Toolbar, Typography,} from '@mui/material';

export default function Home() {

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