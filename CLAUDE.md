# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Tech Stack

- **Astro 5** - Modern web framework with static site generation
- **React 19** - UI library for interactive components
- **TypeScript 5** - Type-safe JavaScript
- **Tailwind CSS 4** - Utility-first CSS framework
- **Shadcn/ui** - Component library built on Radix UI
- **Supabase** - Backend services (database, authentication)

## Essential Commands

### Development

```bash
npm run dev          # Start dev server on port 3000
npm run build        # Build for production
npm run preview      # Preview production build
```

### Code Quality

```bash
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues automatically
npm run format       # Format code with Prettier
```

### Pre-commit Hooks

This project uses `husky` and `lint-staged` to automatically lint and format files before commits.

## Project Architecture

### Directory Structure

```
src/
├── layouts/           # Astro layouts
├── pages/             # Astro pages (file-based routing)
│   └── api/          # API endpoints (server-side)
├── components/        # UI components
│   ├── ui/           # Shadcn/ui components
│   └── hooks/        # Custom React hooks (if needed)
├── lib/              # Services and helpers
│   └── services/     # Business logic services (extracted from API routes)
├── middleware/       # Astro middleware (index.ts)
├── db/               # Supabase clients and types
├── types.ts          # Shared types (Entities, DTOs)
├── assets/           # Internal static assets
└── styles/           # Global CSS
```

### Configuration Files

- **astro.config.mjs**: Astro configuration with React, sitemap, and Tailwind integrations
- **tsconfig.json**: TypeScript config with `@/*` path alias pointing to `./src/*`
- **components.json**: Shadcn/ui configuration
- **.nvmrc**: Node v22.20.0

## Key Architectural Patterns

### Component Strategy

- **Astro components (.astro)**: Use for static content and layouts
- **React components (.tsx)**: Use ONLY when interactivity is needed
- **Never use** "use client" or Next.js directives (React is integrated via Astro)

### API Routes

- Place in `src/pages/api/`
- Use uppercase HTTP methods: `export async function GET()`, `export async function POST()`
- Add `export const prerender = false` for API routes
- Validate all inputs and API data with Zod schemas
- Extract business logic to services in `src/lib/services/` (keep API routes thin)

### Supabase Integration

- Access Supabase client from `context.locals` in Astro routes (NOT direct imports)
- Import `SupabaseClient` type from `src/db/supabase.client.ts`, not from `@supabase/supabase-js`
- Database schemas and types should live in `src/db/`
- Follow Supabase guidelines for security and performance
- Use Astro.cookies for server-side cookie management

### State Management

- Use Astro's View Transitions API for smooth page transitions (use ClientRouter)
- Leverage React hooks for component state
- Use `context.locals` for request-scoped data in Astro
- Use content collections with type safety for blog posts, documentation, etc.

### Environment Variables

- Access via `import.meta.env` in Astro/Vite
- Example file: `.env.example`

### Optimization

- Use image optimization with the Astro Image integration
- Implement hybrid rendering with server-side rendering where needed
- Use React.lazy() and Suspense for code-splitting and performance optimization

## Code Quality Guidelines

### Error Handling

- Use guard clauses and early returns for error conditions (avoid nested if statements)
- Place the happy path last for improved readability
- Implement proper error logging and user-friendly error messages
- Consider using custom error types or error factories for consistent error handling

### Styling

- Use Tailwind utilities with responsive (`sm:`, `md:`, `lg:`) and state variants (`hover:`, `focus-visible:`, `active:`)
- Use `@layer` directive for organizing styles into components, utilities, and base layers
- Use arbitrary values with square brackets for precise one-off designs: `w-[123px]`
- Implement the Tailwind configuration file for customizing theme, plugins, and variants
- Leverage the theme() function in CSS for accessing Tailwind theme values
- Implement dark mode with the `dark:` variant

### Accessibility

- Use semantic HTML over ARIA when possible
- Use ARIA landmarks (main, navigation, search) and roles for custom elements
- Use aria-label, aria-describedby, aria-expanded, aria-live as needed
- Avoid redundant ARIA that duplicates native HTML semantics

### React Best Practices

- Use functional components with hooks instead of class components
- Extract logic into custom hooks in `src/components/hooks/`
- Use React.memo(), useCallback, useMemo for performance optimization
- Use React.lazy() and Suspense for code-splitting
- Use useId() for accessibility, useOptimistic for forms, useTransition for non-urgent updates

## Path Aliases

TypeScript is configured with `@/*` alias pointing to `./src/*`:

```typescript
import { Button } from "@/components/ui/button";
import { myService } from "@/lib/services/myService";
```

## Shadcn/ui Components

This project uses @shadcn/ui for UI components. These are beautifully designed, accessible components that can be customized to your application.

### Finding Installed Components

- Components are available in `src/components/ui/` folder
- Style variant: "new-york" with "neutral" base color
- Uses CSS variables for theming (configured in `components.json`)

### Using Components

Import components using the configured `@/` alias:

```tsx
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
```

### Installing Additional Components

To install new components, use the shadcn CLI:

```bash
npx shadcn@latest add [component-name]
```

Example:

```bash
npx shadcn@latest add accordion
```

**Important**: `npx shadcn-ui@latest` has been deprecated, use `npx shadcn@latest`

For a full list of available components, visit https://ui.shadcn.com/

## Database Migrations

This project uses Supabase migrations provided by the Supabase CLI.

### Creating Migration Files

Migration files must follow this naming convention in `supabase/migrations/`:

Format: `YYYYMMDDHHmmss_short_description.sql` (UTC time)

Example: `20240906123045_create_profiles.sql`

### SQL Guidelines for Migrations

- Write Postgres-compatible SQL code in lowercase
- Include header comments with metadata about the migration
- Add thorough comments explaining each migration step
- Add copious comments for destructive SQL commands (truncating, dropping, column alterations)
- **Always enable Row Level Security (RLS)** when creating new tables
- Create granular RLS policies: one policy per operation (`select`, `insert`, `update`, `delete`) and per role (`anon`, `authenticated`)
- Include comments explaining the rationale and intended behavior of each security policy
- For public access tables, policies can simply return `true`

## Deployment

### Vercel Deployment

The project is configured with `@astrojs/vercel` adapter for serverless deployment.

```bash
npm install -g vercel
vercel -p
```

## TESTING

### Guidelines for UNIT

#### VITEST

- Leverage the `vi` object for test doubles - Use `vi.fn()` for function mocks, `vi.spyOn()` to monitor existing functions, and `vi.stubGlobal()` for global mocks. Prefer spies over mocks when you only need to verify interactions without changing behavior.
- Master `vi.mock()` factory patterns - Place mock factory functions at the top level of your test file, return typed mock implementations, and use `mockImplementation()` or `mockReturnValue()` for dynamic control during tests. Remember the factory runs before imports are processed.
- Create setup files for reusable configuration - Define global mocks, custom matchers, and environment setup in dedicated files referenced in your `vitest.config.ts`. This keeps your test files clean while ensuring consistent test environments.
- Use inline snapshots for readable assertions - Replace complex equality checks with `expect(value).toMatchInlineSnapshot()` to capture expected output directly in your test file, making changes more visible in code reviews.
- Monitor coverage with purpose and only when asked - Configure coverage thresholds in `vitest.config.ts` to ensure critical code paths are tested, but focus on meaningful tests rather than arbitrary coverage percentages.
- Make watch mode part of your workflow - Run `vitest --watch` during development for instant feedback as you modify code, filtering tests with `-t` to focus on specific areas under development.
- Explore UI mode for complex test suites - Use `vitest --ui` to visually navigate large test suites, inspect test results, and debug failures more efficiently during development.
- Handle optional dependencies with smart mocking - Use conditional mocking to test code with optional dependencies by implementing `vi.mock()` with the factory pattern for modules that might not be available in all environments.
- Configure jsdom for DOM testing - Set `environment: 'jsdom'` in your configuration for frontend component tests and combine with testing-library utilities for realistic user interaction simulation.
- Structure tests for maintainability - Group related tests with descriptive `describe` blocks, use explicit assertion messages, and follow the Arrange-Act-Assert pattern to make tests self-documenting.
- Leverage TypeScript type checking in tests - Enable strict typing in your tests to catch type errors early, use `expectTypeOf()` for type-level assertions, and ensure mocks preserve the original type signatures.


### Guidelines for E2E

#### PLAYWRIGHT

- Initialize configuration only with Chromium/Desktop Chrome browser
- Use browser contexts for isolating test environments
- Implement the Page Object Model for maintainable tests
- Use locators for resilient element selection
- Leverage API testing for backend validation
- Implement visual comparison with expect(page).toHaveScreenshot()
- Use the codegen tool for test recording
- Leverage trace viewer for debugging test failures
- Implement test hooks for setup and teardown
- Use expect assertions with specific matchers
- Leverage parallel execution for faster test runs