<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md - Team Draw (Next.js + TypeScript)

## 1. Purpose

- This file is the operating guide for AI coding agents in this repository.
- Goal: produce clean, maintainable, and consistent code that follows the existing project patterns.
- Prefer small, focused changes over large refactors.

## 2. Stack and Commands

- Stack: Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, Magic UI, Zustand, React Hook Form, Zod.
- Package manager: `yarn`.

Core commands:

- Install: `yarn install`
- Dev server: `yarn dev`
- Build: `yarn build`
- Lint: `yarn lint`
- Lint and fix: `yarn lint:fix`
- Format: `yarn format`

## 3. Project Map

- `src/app/*`: routes, layouts, providers, and global styles.
- `src/components/*`: reusable UI and feature components.
- `src/components/forms/*`: React Hook Form + Zod forms.
- `src/hooks/*`: reusable React hooks.
- `src/store/*`: Zustand stores.
- `src/lib/*`: business logic and shared utilities.
- `src/types/*`: shared TypeScript types.
- `src/assets/*`: static assets.

## 4. Non-Negotiable Quality Rules

### TypeScript correctness

- Do not use `any`.
- Prefer existing types before creating new ones.
- Add explicit types for public APIs, component props, hooks, and shared utilities.
- Handle nullable values safely.

### UI consistency

- The application is **mobile-first**.
- Reuse existing components before creating new ones.
- Prefer shadcn/ui primitives whenever possible.
- Use Tailwind utilities instead of custom CSS whenever possible.

### Forms

- All forms must use React Hook Form + Zod.
- Every form must follow this structure:

```
components/forms/player-form/
├── index.tsx
└── schema.ts
```

- Schema naming convention:

```ts
export const playerFormSchema = ...
export type IPlayerFormSchema = z.infer<typeof playerFormSchema>;
```

## 5. Architecture Rules

- Components should focus on rendering.
- Keep business logic inside `src/lib/*`.
- Keep state management inside `src/store/*`.
- Keep utility functions pure whenever possible.
- Persist application state using Local Storage through the store layer.

## 6. Project Conventions

- Components: `PascalCase`
- Folders: `kebab-case`
- Hooks: `useCamelCase`
- Functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Interfaces: prefix with `I`
- Form schemas: `<name>FormSchema`
- Form schema types: `I<Name>FormSchema`

Follow the existing project patterns instead of introducing new conventions.

## 7. Agent Workflow

1. Inspect existing implementations before making changes.
2. Follow the existing project patterns.
3. Implement the smallest change necessary.
4. Run formatting and linting when applicable.
5. Clearly communicate assumptions or potential follow-up work.

## 8. Avoid

- Unrequested dependencies.
- Large refactors without explicit request.
- Business logic inside UI components.
- Duplicating existing components or utilities.
- Introducing new patterns when an existing one already solves the problem.
- Using `any`.