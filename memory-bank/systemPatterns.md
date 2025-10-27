# System Patterns

## Architectural Patterns
- Provider pattern for global state: Auth and Tenant providers
- Routing guard pattern in ProtectedLayout to enforce tenant lock
- App Router composition with Root layout providing fonts and CSS baseline

## Design Patterns
- Context API for auth and tenant state
- Dialog-based confirmation for session refresh
- Breadcrumb generation from route segments

## Common Idioms
- LocalStorage persistence for lightweight client auth state
- React Query for API data fetching and caching