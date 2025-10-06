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
│   └── services/     # Business logic services
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
- **.nvmrc**: Node v22.14.0

## Key Architectural Patterns

### Component Strategy

- **Astro components (.astro)**: Use for static content and layouts
- **React components (.tsx)**: Use ONLY when interactivity is needed (implement framework components in React only when interactivity is needed)
- **Never use** "use client" or Next.js directives (React is integrated via Astro)

### API Routes

- Place in `src/pages/api/`
- Use uppercase HTTP methods: `export async function GET()`, `export async function POST()`
- Add `export const prerender = false` for API routes
- Validate inputs with Zod schemas
- Extract business logic to services in `src/lib/services/`
- Use Zod schemas to validate data exchanged with the backend

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

### Linting and Feedback

- Use feedback from linters to improve the code when making changes

### Error Handling

- Prioritize error handling and edge cases
- Handle errors and edge cases at the beginning of functions
- Use early returns for error conditions to avoid deeply nested if statements
- Place the happy path last in functions for improved readability
- Avoid unnecessary `else` statements (use if-return pattern)
- Use guard clauses to handle preconditions and invalid states early
- Implement proper error logging and user-friendly error messages
- Consider using custom error types or error factories for consistent error handling

### Styling

- Use Tailwind utilities with responsive (`sm:`, `md:`, `lg:`) and state variants (`hover:`, `focus-visible:`, `active:`)
- Use `@layer` directive for organizing styles into components, utilities, and base layers
- Use arbitrary values with square brackets for precise one-off designs: `w-[123px]`
- Implement the Tailwind configuration file for customizing theme, plugins, and variants
- Leverage the theme() function in CSS for accessing Tailwind theme values
- Implement dark mode with the `dark:` variant
- Import path alias: `@/` maps to `./src/`

### Accessibility

- Use semantic HTML over ARIA when possible
- Apply ARIA landmarks to identify regions of the page (main, navigation, search, etc.)
- Apply appropriate ARIA roles to custom interface elements that lack semantic HTML equivalents
- Set `aria-expanded` and `aria-controls` for expandable content like accordions and dropdowns
- Use `aria-live` regions with appropriate politeness settings for dynamic content updates
- Implement `aria-hidden` to hide decorative or duplicative content from screen readers
- Apply `aria-label` or `aria-labelledby` for elements without visible text labels
- Use `aria-describedby` to associate descriptive text with form inputs or complex elements
- Implement `aria-current` for indicating the current item in a set, navigation, or process
- Avoid redundant ARIA that duplicates the semantics of native HTML elements

### React Best Practices

- Use functional components with hooks instead of class components
- Extract logic into custom hooks in `src/components/hooks/`
- Implement `React.memo()` for expensive components that render often with the same props
- Use the `useCallback` hook for event handlers passed to child components to prevent unnecessary re-renders
- Prefer `useMemo` for expensive calculations to avoid recomputation on every render
- Implement `useId()` for generating unique IDs for accessibility attributes
- Consider using the new `useOptimistic` hook for optimistic UI updates in forms
- Use `useTransition` for non-urgent state updates to keep the UI responsive

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

Project uses Azure Static Web Apps with GitHub Actions workflow at `.github/workflows/azure-staticwebapp.yml`.
