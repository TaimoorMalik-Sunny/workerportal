# My Next.js App

A modern Next.js web application built with the App Router, TypeScript, and Tailwind CSS.

## Current Stack

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- Zustand
- React Hook Form + Zod
- Vitest + Playwright
- ESLint + Prettier + Husky

## Requirements

- Node.js 20+
- yarn
- Git

## Installation

```bash
yarn install
```

## Development

```bash
yarn dev
```

Open the local URL printed by Next.js.

## Validation

```bash
yarn check
```

## Production Build

```bash
yarn build
```

## Directory Overview

| Directory            | Purpose                                     |
| -------------------- | ------------------------------------------- |
| `src/app/`           | Routes, layouts, route handlers             |
| `src/components/`    | Shared React components                     |
| `src/components/ui/` | shadcn/ui primitives                        |
| `src/features/`      | Feature-specific domain code                |
| `src/lib/`           | Utilities, API client, query client, logger |
| `src/store/`         | Zustand client state                        |
| `src/config/`        | Typed application configuration             |
| `tests/`             | Unit, integration, and E2E tests            |
| `docs/`              | Project knowledge and decisions             |
| `.agents/skills/`    | Canonical agent skills                      |

## Agentic Development

This project is configured for OpenCode agentic coding.

- `AGENTS.md` — Primary instruction file for all coding agents
- `opencode.jsonc` — OpenCode configuration
- `.agents/skills/` — Reusable agent workflows (committed to Git)
- `docs/` — Project memory, architecture, and decisions

Project skills are committed to Git and are not reinstalled by `yarn install`.

## Security

Secrets belong in `.env.local` or the user environment and must not be committed.
See `.env.example` for documented variable names.

## Documentation

- [Project Memory](docs/PROJECT_MEMORY.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Decisions](docs/DECISIONS.md)
- [Features](docs/FEATURES.md)
- [Development Guide](docs/DEVELOPMENT.md)
- [MCP Setup](docs/MCP.md)
- [Skills](docs/SKILLS.md)
