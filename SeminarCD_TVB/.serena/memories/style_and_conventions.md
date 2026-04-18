# Code Style and Conventions

## Frontend (React)
- **Framework**: React 19 with functional components and hooks
- **File structure**: Each component in its own folder: `ComponentName/ComponentName.jsx` + `ComponentName/ComponentName.css`
- **Component naming**: PascalCase for files and component functions
- **Routing**: React Router v7 (declared in App.jsx)
- **Animation**: Framer Motion for scroll/enter animations
- **Icons**: react-icons library
- **Skeleton loading**: react-loading-skeleton for loading states
- **Testing**: Vitest + React Testing Library; test files co-located as `Component.test.jsx`
- **Linting**: ESLint 9 with react-hooks and react-refresh plugins
- **Module type**: ESM (`"type": "module"` in package.json)
- **No TypeScript** — plain JSX

## Backend (Strapi)
- **Framework**: Strapi 5 with auto-generated REST API
- **Database**: SQLite by default (better-sqlite3)
- **Language**: JavaScript (CommonJS for Strapi config files)
- **Testing**: Jest; test files in `__tests__` or alongside source
- **API structure**: Each content type has controllers/, services/, routes/ subdirectories

## General
- **No TypeScript** in either frontend or backend
- **CSS**: Plain CSS per component (no CSS modules, no Tailwind)
- **Environment variables**: prefixed with `VITE_` on frontend, plain on backend
- **i18n**: Handled via Strapi's built-in localization (`?locale=vi/en/zh`)
