# Product Context

SK UI is a React component library and example app aimed at shipping a responsive, accessible, and styling-agnostic set of components. It leverages @base-ui-components/react for primitives and uses Next.js (App Router) to host docs, demos, and a live playground.

## Overview

Provide a high-level overview of the project.

- Library: Export a set of responsive, accessible components (built atop Base UI where possible)
- Docs/Playground: Next.js app that showcases components with code samples
- Theming: Minimal theme tokens (colors, spacing, typography) via CSS variables first; TS theme type for DX
- Responsiveness: Consistent breakpoints and utilities (class-based and hook-based)

## Core Features

- [ ] Create responsive React component library package (exported from src/components)
- [ ] Ensure all components implement responsive props and sensible defaults
- [ ] Define theme tokens and theming API (CSS variables + TS type)
- [ ] Build docs pages and interactive examples
- [ ] Add unit tests for core behaviors (a11y, keyboard interactions)

# Base UI

This project uses the `@base-ui-components/react` package for unstyled, accessible primitives. We compose these into opinionated but styling-agnostic components. Our goal is to keep behavior and accessibility strong while leaving styling to consumers via CSS vars and utility classes.

## Overview

- [Quick start](https://base-ui.com/react/overview/quick-start.md): A quick guide to getting started with Base UI.
- [Accessibility](https://base-ui.com/react/overview/accessibility.md): Learn how to make the most of Base UI's accessibility features and guidelines.
- [Releases](https://base-ui.com/react/overview/releases.md): Changelogs for each Base UI release.
- [About Base UI](https://base-ui.com/react/overview/about.md): An overview of Base UI, providing information on its history, team, and goals.

## Handbook

- [Styling](https://base-ui.com/react/handbook/styling.md): Learn how to style Base UI components with your preferred styling engine.
- [Animation](https://base-ui.com/react/handbook/animation.md): A guide to animating Base UI components.
- [Composition](https://base-ui.com/react/handbook/composition.md): A guide to composing Base UI components with your own React components.

## Components

- [Accordion](https://base-ui.com/react/components/accordion.md): A high-quality, unstyled React accordion component that displays a set of collapsible panels with headings.
- [Alert Dialog](https://base-ui.com/react/components/alert-dialog.md): A high-quality, unstyled React alert dialog component that requires user response to proceed.
- [Autocomplete](https://base-ui.com/react/components/autocomplete.md): A high-quality, unstyled React autocomplete component that renders an input with a list of filtered options.
- [Avatar](https://base-ui.com/react/components/avatar.md): A high-quality, unstyled React avatar component that is easy to customize.
- [Checkbox](https://base-ui.com/react/components/checkbox.md): A high-quality, unstyled React checkbox component that is easy to customize.
- [Checkbox Group](https://base-ui.com/react/components/checkbox-group.md): A high-quality, unstyled React checkbox group component that provides a shared state for a series of checkboxes.
- [Collapsible](https://base-ui.com/react/components/collapsible.md): A high-quality, unstyled React collapsible component that displays a panel controlled by a button.
- [Combobox](https://base-ui.com/react/components/combobox.md): A high-quality, unstyled React combobox component that renders an input combined with a list of predefined items to select.
- [Context Menu](https://base-ui.com/react/components/context-menu.md): A high-quality, unstyled React context menu component that appears at the pointer on right click or long press.
- [Dialog](https://base-ui.com/react/components/dialog.md): A high-quality, unstyled React dialog component that opens on top of the entire page.
- [Field](https://base-ui.com/react/components/field.md): A high-quality, unstyled React field component that provides labelling and validation for form controls.
- [Fieldset](https://base-ui.com/react/components/fieldset.md): A high-quality, unstyled React fieldset component with an easily stylable legend.
- [Form](https://base-ui.com/react/components/form.md): A high-quality, unstyled React form component with consolidated error handling.
- [Input](https://base-ui.com/react/components/input.md): A high-quality, unstyled React input component.
- [Menu](https://base-ui.com/react/components/menu.md): A high-quality, unstyled React menu component that displays list of actions in a dropdown, enhanced with keyboard navigation.
- [Menubar](https://base-ui.com/react/components/menubar.md): A menu bar providing commands and options for your application.
- [Meter](https://base-ui.com/react/components/meter.md): A high-quality, unstyled React meter component that provides a graphical display of a numeric value.
- [Navigation Menu](https://base-ui.com/react/components/navigation-menu.md): A high-quality, unstyled React navigation menu component that displays a collection of links and menus for website navigation.
- [Number Field](https://base-ui.com/react/components/number-field.md): A high-quality, unstyled React number field component with increment and decrement buttons, and a scrub area.
- [Popover](https://base-ui.com/react/components/popover.md): A high-quality, unstyled React popover component that displays an accessible popup anchored to a button.
- [Preview Card](https://base-ui.com/react/components/preview-card.md): A high-quality, unstyled React preview card component that appears when a link is hovered, showing a preview for sighted users.
- [Progress](https://base-ui.com/react/components/progress.md): A high-quality, unstyled React progress bar component that displays the status of a task that takes a long time.
- [Radio](https://base-ui.com/react/components/radio.md): A high-quality, unstyled React radio button component that is easy to style.
- [Scroll Area](https://base-ui.com/react/components/scroll-area.md): A high-quality, unstyled React scroll area that provides a native scroll container with custom scrollbars.
- [Select](https://base-ui.com/react/components/select.md): A high-quality, unstyled React select component that allows you for choosing a predefined value in a dropdown menu.
- [Separator](https://base-ui.com/react/components/separator.md): A high-quality, unstyled React separator component that is accessible to screen readers.
- [Slider](https://base-ui.com/react/components/slider.md): A high-quality, unstyled React slider component that works like a range input and is easy to style.
- [Switch](https://base-ui.com/react/components/switch.md): A high-quality, unstyled React switch component that indicates whether a setting is on or off.
- [Tabs](https://base-ui.com/react/components/tabs.md): A high-quality, unstyled React scroll area that provides a native scroll container with custom scrollbars.
- [Toast](https://base-ui.com/react/components/toast.md): A high-quality, unstyled React toast component to generate notifications.
- [Toggle](https://base-ui.com/react/components/toggle.md): A high-quality, unstyled React toggle component that displays a two-state button that can be on or off.
- [Toggle Group](https://base-ui.com/react/components/toggle-group.md): A high-quality, unstyled React toggle group component that provides shared state to a series of toggle buttons.
- [Toolbar](https://base-ui.com/react/components/toolbar.md): A high-quality, unstyled React toolbar component that groups a set of buttons and controls.
- [Tooltip](https://base-ui.com/react/components/tooltip.md): A high-quality, unstyled React tooltip component that appears when an element is hovered or focused, showing a hint for sighted users.

## Utilities

- [Direction Provider](https://base-ui.com/react/utils/direction-provider.md): A direction provider component that enables RTL behavior for Base UI components.
- [useRender](https://base-ui.com/react/utils/use-render.md): Hook for enabling a render prop in custom components.

## Technical Stack

- Next.js 15 (App Router) with Turbopack
- React 19 / React DOM 19
- TypeScript 5
- ESLint 9 with next/core-web-vitals
- Base UI `@base-ui-components/react` (beta)
- CSS variables for theming, module CSS for example pages