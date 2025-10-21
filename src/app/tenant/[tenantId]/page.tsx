"use client";
import React from 'react';
import { ApplicationProvider } from '@/features/applications/ApplicationContext';
import { ApplicationGrid } from '@/features/applications/ApplicationGrid';
import { Typography } from '@mui/material';

export default function ApplicationsPage() {
  return (
    <ApplicationProvider>
      <Typography variant="h5" gutterBottom>Applications</Typography>
      <ApplicationGrid />
    </ApplicationProvider>
  );
}