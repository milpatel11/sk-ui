# System Patterns

## Architectural Patterns

- Composition-first UI: Build components by composing primitives; favor smaller, reusable parts.
- Docs as tests: Interactive examples double as smoke tests and usage guides.

## Design Patterns

- Props-driven responsiveness: size, variant, and layout props accept responsive values where sensible.
- Controlled/uncontrolled inputs: follow React conventions with `value`/`defaultValue` and `onChange`.
- Slots: expose subcomponents (e.g., `Button.Icon`) to enable composition without deep props.

## Common Idioms

- CSS variables for tokens: `--color-fg`, `--color-bg`, `--space-2`, etc., with dark-mode overrides.
- Breakpoints via media queries: `--bp-sm`, `--bp-md`, `--bp-lg` abstractions or utilities (planned).
- Accessibility-first: keyboard interactions and ARIA labels are required for interactive components.