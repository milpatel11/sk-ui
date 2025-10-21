"use client";
import { Box, Typography, Paper, Stack } from '@mui/material';

export default function ITDNDashboardPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Integrated Transportation & Delivery Network (ITDN)
      </Typography>
      <Typography variant="body1" paragraph>
        Unified platform concept combining ride‑hailing, courier parcel delivery, food & grocery delivery, and multi‑leg logistics orchestration. This is a placeholder dashboard; data services are not yet integrated.
      </Typography>
      <Stack spacing={2}>
        <Paper variant="outlined" sx={{ p:2 }}>
          <Typography variant="h6">Planned Modules</Typography>
          <ul style={{ marginTop: 8, paddingLeft: 20 }}>
            <li>Ride Dispatch & Driver Availability</li>
            <li>Courier / Last‑Mile Delivery Routing</li>
            <li>Food & Grocery Ordering Flow</li>
            <li>Multi-Hop Route Optimization & Batching</li>
            <li>Pricing & Surge Engine</li>
            <li>Real-Time Tracking & ETA Predictions</li>
            <li>Compliance & Safety Event Logging</li>
          </ul>
        </Paper>
        <Paper variant="outlined" sx={{ p:2 }}>
          <Typography variant="h6">Current Status</Typography>
          <Typography variant="body2">Scaffold only. Next steps: define domain types (Driver, Vehicle, FleetZone, Trip, DeliveryOrder), mock endpoints, then surface KPI tiles (active drivers, open trips, on-time %).</Typography>
        </Paper>
      </Stack>
    </Box>
  );
}
