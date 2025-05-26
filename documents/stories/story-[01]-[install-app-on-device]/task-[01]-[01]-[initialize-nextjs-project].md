# Task [01]-[01]: Initialize Next.js 15 project with TypeScript

## Parent Story

Story [01]: Install App on Device

## Task Description

Set up the foundational Next.js 15 project with TypeScript configuration, establishing the basic
project structure and ensuring the development server runs successfully. This task creates the
foundation for the Romanian ID Processing PWA with React 19 support and enhanced performance
features.

## Implementation Details

### Files to Modify

- Create `package.json` with Next.js 15, TypeScript dependencies, and comprehensive scripts
- Create `next.config.ts` with TypeScript configuration (Next.js 15+ style)
- Create `tsconfig.json` with strict TypeScript configuration
- Create `tailwind.config.js` for styling framework
- Create `app/layout.tsx` - Root layout component
- Create `app/page.tsx` - Home page component
- Create `app/globals.css` - Global styles
- Create `.gitignore` - Git ignore patterns
- Create `.eslintrc.js` - ESLint configuration with TypeScript rules
- Create `.prettierrc.json` - Prettier configuration
- Create `.prettierignore` - Prettier ignore patterns
- Create `README.md` - Project documentation with script usage

### Required Components

- Next.js 15 with App Router and React 19 support
- TypeScript 5.x with strict mode
- Tailwind CSS for styling
- ESLint with TypeScript-specific rules and Next.js recommended config
- Prettier for code formatting with TypeScript support
- Comprehensive package.json scripts for development workflow

### Technical Considerations

- Use App Router (not Pages Router) for modern Next.js architecture
- Configure TypeScript strict mode with incremental compilation for better type safety
- Set up Tailwind CSS with proper purging for production builds
- Configure ESLint with Next.js recommended rules and TypeScript-specific linting
- Set up Prettier with consistent formatting rules and TypeScript support
- Create comprehensive scripts for type-checking, linting, and formatting
- Use `next.config.ts` for type-safe Next.js configuration (Next.js 15+ style)
- Configure explicit caching behavior (Next.js 15 no longer caches by default)
- Ensure compatibility with PWA requirements and React 19 features
- Configure `tsc --noEmit` for type-checking without compilation
- Set up Turbopack for faster development builds (stable in Next.js 15)
- Configure ES Modules support for better tree-shaking

## Acceptance Criteria

- [ ] Next.js 15 project created with App Router architecture and React 19 support
- [ ] TypeScript properly configured with strict mode and incremental compilation
- [ ] Tailwind CSS integrated and working
- [ ] Basic project structure established with app directory
- [ ] Development server runs successfully on `npm run dev`
- [ ] ESLint configured with TypeScript rules and Next.js recommended config
- [ ] Prettier configured with TypeScript support and consistent formatting
- [ ] Comprehensive package.json scripts created:
  - [ ] `check` - Runs type-check, ESLint, and Prettier checks
  - [ ] `type-check` - TypeScript type checking without compilation
  - [ ] `lint` - ESLint checking with TypeScript rules
  - [ ] `lint:fix` - ESLint with automatic fixing
  - [ ] `format` - Prettier formatting
  - [ ] `format:check` - Prettier format checking
- [ ] All scripts run successfully without errors
- [ ] Git repository initialized with proper .gitignore

## Testing Approach

- Verify `npm run dev` starts development server without errors
- Run `npm run type-check` to ensure TypeScript compilation works without warnings
- Run `npm run lint` to validate ESLint rules are enforced
- Run `npm run format:check` to ensure Prettier formatting is correct
- Run `npm run check` to verify all checks pass together
- Confirm Tailwind CSS classes are applied correctly
- Test hot reload functionality works
- Verify all scripts complete successfully in CI/CD environment

## Dependencies

- None (This is the foundational task)

## Package.json Scripts Implementation

The following scripts should be added to package.json:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "type-check": "tsc --noEmit",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "check": "npm run type-check && npm run lint && npm run format:check"
  }
}
```

### Script Descriptions

- **`type-check`**: Runs TypeScript compiler in check mode without emitting files
- **`lint`**: Runs ESLint with Next.js and TypeScript rules
- **`lint:fix`**: Runs ESLint with automatic fixing of fixable issues
- **`format`**: Formats all files using Prettier
- **`format:check`**: Checks if files are properly formatted without changing them
- **`check`**: Comprehensive check running type-check, lint, and format checks sequentially

### Dependencies to Install

```bash
npm install --save-dev @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-config-prettier prettier
```

## Estimated Completion Time

2 hours
