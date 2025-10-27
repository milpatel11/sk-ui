"use client";
import dynamic from 'next/dynamic';
import {Box, Paper, Typography, CircularProgress} from '@mui/material';

const FlowCanvas = dynamic(() => import('@/features/taskflow/FlowCanvas'), {
  ssr: false,
  loading: () => (
    <Box display="flex" alignItems="center" justifyContent="center" minHeight={360}>
      <CircularProgress size={24} />
    </Box>
  ),
});

export default function FlowDesignerPage() {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>Flow Designer</Typography>
      <Paper variant="outlined" sx={{ p: 1, height: 600 }}>
        <FlowCanvas />
      </Paper>
    </Box>
  );
}