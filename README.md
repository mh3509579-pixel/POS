# Hussain Son's Pharmacy POS

Professional Pharmacy Point of Sale and Management System.

## Tech Stack

- **Frontend**: TypeScript, Bootstrap 5, Axios, Chart.js, SweetAlert2, Day.js
- **Backend**: Node.js, TypeScript, Express
- **Database**: MySQL
- **Deployment**: Vercel

## Project Structure

```
├── apps/
│   ├── web/          # Frontend (Vite + TypeScript)
│   └── api/          # Backend (Express + TypeScript)
├── packages/
│   ├── shared/       # Shared utilities
│   └── types/        # Shared TypeScript types
├── database/
│   ├── migrations/
│   └── seeds/
├── docs/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- MySQL 8+

### Installation

```bash
npm install
```

### Environment Setup

```bash
cp .env.example .env
# Edit .env with your database credentials
```

### Development

```bash
npm run dev
```

This starts both the API (port 3001) and Frontend (port 5173).

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start both API and Frontend in dev mode |
| `npm run dev:api` | Start only the API server |
| `npm run dev:web` | Start only the Frontend dev server |
| `npm run build` | Build both applications |
| `npm run test` | Run all tests |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run typecheck` | Run TypeScript type checking |

## Architecture

- **Modular Monolith** with **Onion Architecture**
- Domain layer has no external dependencies
- Controllers remain thin
- Business logic lives in Application and Domain layers
- See `docs/architecture/` for details

## License

Private - Hussain Son's Pharmacy
