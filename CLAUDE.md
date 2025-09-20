# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
```bash
npm run dev          # Start development server (frontend + backend on port 5000)
npm run build        # Build for production
npm run start        # Start production server
npm run check        # TypeScript type checking
```

### Database Operations
```bash
npm run db:push      # Sync database schema with Drizzle
```

## Architecture Overview

This is a cybersecurity incident response training application with a full-stack TypeScript architecture:

### Tech Stack
- **Frontend**: React 18 + TypeScript, Radix UI/shadcn, Tailwind CSS, TanStack Query, Wouter routing
- **Backend**: Express.js + TypeScript, PostgreSQL + Drizzle ORM
- **Database**: PostgreSQL with Neon support, file-based fallback storage

### Project Structure
- `client/src/` - React frontend application
  - `components/` - Reusable UI components (shadcn/ui based)
  - `pages/` - Application pages with role-based views
  - `hooks/` - Custom React hooks (use-workflow, use-toast, etc.)
  - `lib/` - Utilities and configurations
- `server/` - Express.js backend
  - `data/` - Mock JSON data files (alerts.json, endpoints.json, logs.json, playbook.json)
  - `routes.ts` - API endpoint definitions
  - `storage.ts` - Data layer with dual file/database storage
  - `pdf-generator.ts` - Report generation with Puppeteer
- `shared/` - Shared TypeScript schemas and types (Zod + Drizzle)

### Key Components
- **Storage Layer**: Dual storage system supporting both PostgreSQL and file-based storage
- **Workflow Engine**: Interactive incident response workflows with guided AI assistance
- **Role-Based Views**: Different interfaces for Analyst, Manager, and Client roles
- **Simulation System**: Mock ransomware/phishing/credential compromise scenarios
- **Report Generation**: PDF, JSON, and TXT report exports using Puppeteer

### Database Schema
The application uses Drizzle ORM with PostgreSQL:
- `alerts` - Security alerts with MITRE ATT&CK mapping
- `endpoints` - Affected systems and their status
- `logs` - Security event logs
- `workflow_sessions` - Active incident response sessions
- `playbooks` - Incident response procedures
- `reports` - Generated incident reports

### API Routes (all `/api/*`)
- `/alerts` - Alert management and retrieval
- `/endpoints` - Endpoint status and isolation actions
- `/logs` - Security log filtering and search
- `/playbooks` - Incident response playbook data
- `/workflow-sessions` - Workflow state management
- `/actions/*` - Incident response actions (isolate, lock accounts, etc.)
- `/reports/generate` - Report generation in multiple formats

### Development Notes
- The application simulates cybersecurity scenarios for training purposes
- Mock data is stored in `server/data/` JSON files
- Database schema is defined in `shared/schema.ts` with Zod validation
- Frontend uses TanStack Query for server state management
- Role-based rendering controls what features are visible to different user types

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (falls back to file storage if not set)
- `NODE_ENV` - development/production environment
- `PORT` - Server port (defaults to 5000)