# 🛡️ Cybersecurity Incident Response Playbook Assistant

A comprehensive web-based training and simulation tool designed to guide cybersecurity analysts through mock ransomware attack scenarios. This application serves as an MVP for incident response training, featuring an interactive workflow system, role-based views, and comprehensive logging and reporting capabilities.

## 🚀 Features

### ✅ Phase 1 - MVP (Completed)
- **Analyst View**: Full hardcoded ransomware simulation flow
- **AI Assistant Panel**: Branching logic from local JSON playbook data
- **Alert Dashboard**: Simulated alerts with detailed information
- **Log Viewer**: Security event logs with filtering capabilities
- **Professional Report Generation**: Export to styled PDF, JSON, and TXT formats

### 🔄 Phase 2 - Growth (In Progress - ~80% Complete)
- **Role-Based Views**: Dynamic UI for Analyst, Manager, and Client roles
- **Backend System**: Express.js server with PostgreSQL database support
- **Enhanced Features**: Nearly complete with only authentication remaining

#### ✅ Completed Phase 2 Features:
- Express.js backend with comprehensive API routes
- PostgreSQL database integration with Drizzle ORM
- Complete Manager and Client views with dynamic business metrics
- File and database storage with full behavioral parity
- Additional playbook scenarios (phishing, credential compromise)
- Professional styled PDF report generation with role-specific layouts
- Real-time business impact tracking and metrics
- New simulation functionality with scenario switching
- Comprehensive workflow tracking system

#### 🚧 Phase 2 Remaining:
- JWT Authentication system (login, registration, protected routes)

### 📋 Phase 3 - Enterprise (Planned)
- Live API integrations (Microsoft Graph Security API)
- Visual playbook editor for admins
- Analytics dashboard with SOC metrics
- Team collaboration features

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript for type safety
- **Radix UI** components with shadcn/ui design system
- **Tailwind CSS** with custom cybersecurity theme
- **TanStack Query** for server state management
- **Wouter** for lightweight routing
- **React Hook Form** with Zod validation

### Backend
- **Express.js** server with TypeScript
- **PostgreSQL** database with Neon support
- **Drizzle ORM** for database operations
- **File-based storage** for mock data
- **RESTful API** structure

### Key Components
- **Workflow Engine**: Guided incident response workflows
- **MITRE ATT&CK Integration**: Technique mapping and visualization
- **Role-Based Access**: Different views for analysts, managers, and clients
- **Report Generation**: Automated post-incident reporting

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (or use the built-in Neon database)

### Installation

1. **Clone and install dependencies**:
```bash
npm install
```

2. **Set up the database**:
```bash
npm run db:push
```

3. **Start the development server**:
```bash
npm run dev
```

4. **Access the application**:
   - Open your browser to `http://localhost:5000`
   - The app will automatically load with sample incident data

## 📱 Usage

### Role-Based Views

**🔍 Analyst View**
- Complete access to technical details
- Interactive workflow progression
- AI assistant with recommended actions
- Detailed endpoint and log analysis
- Technical report generation

**👔 Manager View**
- Executive summary and business impact
- High-level incident overview
- Status tracking and metrics
- Executive reporting

**👤 Client View**
- Simplified status updates
- Impact on business operations
- Communication-focused interface
- Non-technical explanations

### Sample Workflows

1. **Start Investigation**: Click on any critical alert
2. **Follow AI Guidance**: Use the AI assistant panel for step-by-step recommendations
3. **Take Actions**: Isolate endpoints, lock accounts, analyze traffic
4. **Generate Reports**: Export incident reports in multiple formats
5. **Track Progress**: Monitor workflow phases and MITRE technique mapping

## 🗂️ Project Structure

```
├── client/src/           # Frontend React application
│   ├── components/       # Reusable UI components
│   ├── pages/           # Application pages
│   ├── hooks/           # Custom React hooks
│   └── lib/             # Utilities and configurations
├── server/              # Backend Express server
│   ├── data/           # Mock JSON data files
│   └── routes.ts       # API endpoint definitions
├── shared/             # Shared TypeScript schemas
└── replit.md           # Project documentation
```

## 🛠️ Available Scripts

```bash
npm run dev          # Start development server (frontend + backend)
npm run build        # Build for production
npm run db:push      # Sync database schema
npm run check        # Type checking
```

## 🧪 Testing

The application includes realistic cybersecurity scenarios:

- **Ransomware Detection**: File encryption alerts across multiple endpoints
- **PowerShell Exploitation**: Suspicious script execution patterns
- **Network Analysis**: Command & control communication detection
- **MITRE ATT&CK**: Technique mapping (T1486, T1059.001, etc.)

## 🔧 Configuration

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: Development/production environment

### Customization
- **Playbooks**: Modify `server/data/playbook.json` for custom workflows
- **Alerts**: Update `server/data/alerts.json` for different scenarios
- **Styling**: Customize colors in `client/src/index.css`

## 🔧 Next Development Priorities

### Phase 2 Completion
- **JWT Authentication System**: User registration, login, session management, and protected routes
- **Role Assignment**: Associate users with specific roles (Analyst, Manager, Client)

### Phase 3 Planning
- **Live API Integrations**: Microsoft Graph Security API for real security data
- **Visual Playbook Editor**: Admin interface for building custom response workflows
- **Analytics Dashboard**: SOC metrics tracking (MTTD, MTTR) and performance monitoring
- **Team Collaboration**: Incident assignment, commenting, and workflow coordination

## 🤝 Contributing

This is a training application designed to simulate cybersecurity incident response. Current development priorities:

1. **Authentication System**: JWT-based user registration, login, and role management
2. **Enterprise Features**: Live API integrations with security tools (Microsoft Graph, SIEM)
3. **Visual Playbook Editor**: Drag-and-drop interface for building custom response workflows
4. **Analytics & Collaboration**: SOC metrics dashboards and team collaboration features

## 📚 Learning Resources

This application demonstrates:
- **NIST Cybersecurity Framework**: Response procedures
- **MITRE ATT&CK**: Adversary technique mapping
- **Incident Response**: Industry-standard workflows
- **Modern Web Development**: React, TypeScript, Express.js

## 📄 License

This project is designed for educational and training purposes in cybersecurity incident response.

---

🛡️ **Built for cybersecurity training and education** 🛡️