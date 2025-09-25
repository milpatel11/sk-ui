# Architecture

## Overview
SK UI is a monorepo-lite single package that ships a React component library alongside a Next.js app used for docs and playground. The library composes Base UI primitives into opinionated components while remaining styling-agnostic. The docs app renders interactive examples that double as test surfaces.

## Modules
- Library (planned): `src/components/*` exports
- Docs/Playground: Next.js App Router under `src/app/*`
- Theming: CSS variables defined at `:root` (light/dark), TS types for tokens

## Data Flow
- Components are controlled/uncontrolled based on props, emitting events via standard React patterns
- Responsive behavior through props + CSS media queries + small hook utilities (planned)

## Accessibility
- Rely on Base UI for keyboard interactions and ARIA semantics
- Additional a11y testing via unit tests and manual checks

## Architectural Decisions
1. Next.js App Router for docs: simplifies routing, SSR/SSG of docs, and colocated examples.
2. Styling-agnostic approach: ship minimal default styles; expose CSS variables and class hooks.
3. Theme via CSS variables first: maximize framework compatibility; provide TS type for tokens.
4. Composition over inheritance: build components by composing Base UI primitives.
5. Turbopack for dev/build: keep defaults unless build issues require fallback.

