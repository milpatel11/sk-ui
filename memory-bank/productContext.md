# Product Context

## Overview

Identity Suite is a Next.js app that provides a tenant-aware portal. Auth is managed via a client-side context, with session refresh and expiry prompts. A Tenant context loads available tenants post-auth and locks navigation to the active tenant. A protected layout enforces tenant lock and renders breadcrumbs.

## Core Features

- Authentication context with token storage, expiry handling, and refresh prompt
- Tenant context: fetch tenants, set and persist active tenant, auto-select default
- Protected layout: AppBar with title, logout; automatic breadcrumbs for tenant-scoped routes
- Routing structure: public login/signup, tenant-scoped app pages under `/tenant/[tenantId]/...`
- UI foundation: MUI 7 + Emotion, React Query for data fetching, Leaflet and XYFlow available for features

## Technical Stack

- Next.js 15 (App Router), TypeScript 5
- React 19
- MUI 7, Emotion, @mui/material-nextjs integration
- @tanstack/react-query for server state
- dayjs, zod, axios utilities
- Leaflet/react-leaflet, mermaid, @xyflow/react (for future pages)

## Project Description

Finance workbench supports journal entries, assets/liabilities, vendors, rules, import/export, and projections.



## Architecture

Next.js 15 App Router with React and MUI 7; finance module backed by apiClient endpoints; Mermaid for diagrams.



## Technologies

- Next.js
- React
- TypeScript
- MUI 7
- Mermaid



## Libraries and Dependencies

- @mui/material
- mermaid

