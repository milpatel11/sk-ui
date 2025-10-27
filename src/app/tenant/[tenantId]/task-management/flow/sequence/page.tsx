"use client";
import dynamic from 'next/dynamic';
import {Box, Paper, Typography, CircularProgress} from '@mui/material';

const SequenceDiagram = dynamic(() => import('@/features/taskflow/SequenceDiagram'), {
  ssr: false,
  loading: () => (
    <Box display="flex" alignItems="center" justifyContent="center" minHeight={360}>
      <CircularProgress size={24} />
    </Box>
  ),
});

export default function FlowSequencePage() {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>Sequence Diagram</Typography>
      <Paper variant="outlined" sx={{ p: 2, minHeight: 600 }}>
        <SequenceDiagram />
      </Paper>
    </Box>
  );
}