"use client";
import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

export default function CourierPage(){
  return (
    <Box>
      <Typography variant="h6" gutterBottom>Courier Operations</Typography>
      <Paper variant="outlined" sx={{ p:2 }}>
        <Typography variant="body2" color="text.secondary">
          Placeholder for courier/last‑mile routing, batch assignments, and live driver tracking.
        </Typography>
      </Paper>
    </Box>
  );
}
