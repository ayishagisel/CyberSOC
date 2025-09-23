# 🛡️ Cybersecurity Incident Response Training Platform

A comprehensive web-based training and simulation platform that guides cybersecurity professionals through realistic incident response scenarios. This application bridges the gap between theoretical knowledge and practical experience, featuring live security data integration, interactive workflow systems, and comprehensive reporting capabilities.

## 🚀 Features

### ✅ Phase 1 - MVP Foundation (Completed)
- **Interactive Workflow System**: Howard University Incident Response Playbook implementation
- **AI Assistant Panel**: Context-aware guidance with branching logic
- **Alert Dashboard**: Comprehensive security alert management
- **Professional Reporting**: Multi-format export (PDF, JSON, TXT) with role-specific layouts
- **MITRE ATT&CK Integration**: Technique mapping and adversary behavior analysis

### ✅ Phase 2 - Enterprise Backend (Completed)
- **Role-Based Access Control**: Dynamic UI for Analyst, Manager, and Client roles
- **Express.js Backend**: RESTful API with PostgreSQL database integration
- **Dual Storage System**: File-based and database storage with behavioral parity
- **Multiple Scenarios**: Ransomware, phishing, and credential compromise simulations
- **Real-time Metrics**: Business impact tracking and SOC performance monitoring
- **Workflow Persistence**: Session management with progress tracking

### ✅ Phase 3 - Live Data Integration (Completed)
- **Microsoft Graph Security API**: Real-time Microsoft Defender alert integration
- **Live Device Management**: Microsoft Intune device data with security status
- **Hybrid Data Sources**: Seamless switching between live and simulation data
- **Security Score Monitoring**: Microsoft Secure Score integration
- **Incident Correlation**: Real security incidents with training workflows

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
- **Microsoft Graph Security API** for live data
- **Dual storage system** (database + file-based)
- **RESTful API** structure

### Integrations
- **Microsoft Graph Security API**: Real-time alert and incident data
- **Microsoft Intune**: Device management and compliance status
- **Microsoft Secure Score**: Security posture monitoring
- **Azure Active Directory**: Identity and access management data

### Key Components
- **Live Data Engine**: Real-time security data ingestion and processing
- **Workflow Engine**: Howard University Incident Response Playbook implementation
- **MITRE ATT&CK Integration**: Technique mapping and adversary behavior analysis
- **Role-Based Access**: Different views for analysts, managers, and clients
- **Hybrid Data Sources**: Seamless switching between live and simulation data
- **Report Generation**: Automated post-incident reporting with live data correlation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (or use the built-in Neon database)
- Microsoft Azure account with appropriate Graph API permissions (optional for live data)

### Installation

1. **Clone and install dependencies**:
```bash
npm install
```

2. **Configure environment variables** (optional for Microsoft Graph integration):
```bash
# Create .env file with your Azure credentials
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
AZURE_TENANT_ID=your-tenant-id
```

3. **Set up the database**:
```bash
npm run db:push
```

4. **Start the development server**:
```bash
npm run dev
```

5. **Access the application**:
   - Open your browser to `http://localhost:5000`
   - The app will automatically load with simulation data
   - If Azure credentials are configured, live Microsoft Defender data will be available

## 📱 Usage

### Role-Based Views

**🔍 Analyst View**
- Complete access to technical details and live security data
- Interactive Howard University Incident Response workflow
- AI assistant with phase-specific recommendations
- Real-time endpoint and log analysis
- Live Microsoft Defender alert correlation
- Technical report generation with live data integration

**👔 Manager View**
- Executive summary with real-time business impact metrics
- High-level incident overview with live security posture
- Status tracking across multiple data sources
- Executive reporting with Microsoft Secure Score integration

**👤 Client View**
- Simplified status updates with live security health
- Impact on business operations with real-time metrics
- Communication-focused interface
- Non-technical explanations of live security events

### Data Sources

**Live Data Mode** (with Azure credentials configured):
- Real Microsoft Defender alerts and incidents
- Live device compliance and security status
- Microsoft Secure Score and security recommendations
- Real-time threat intelligence and indicators

**Training Mode** (default):
- Realistic simulated ransomware scenarios
- Mock phishing and credential compromise incidents
- Controlled training environment with predictable outcomes

### Sample Workflows

1. **Data Source Selection**: Choose between live Microsoft data or training simulations
2. **Start Investigation**: Click on any critical alert (live or simulated)
3. **Follow Guided Workflow**: Progress through the 6-phase Howard University playbook
4. **AI-Assisted Actions**: Get context-aware recommendations for each incident phase
5. **Take Response Actions**: Isolate endpoints, lock accounts, analyze traffic patterns
6. **Generate Reports**: Export comprehensive incident reports with live data correlation
7. **Track Progress**: Monitor workflow phases with MITRE ATT&CK technique mapping

## 🗂️ Project Structure

```
├── client/src/                    # Frontend React application
│   ├── components/                # Reusable UI components
│   │   ├── live-data-status.tsx  # Live data integration controls
│   │   └── ...                   # Other UI components
│   ├── pages/                    # Application pages
│   │   └── dashboard.tsx         # Main dashboard with role-based views
│   ├── hooks/                    # Custom React hooks
│   │   ├── use-workflow.tsx      # Howard University workflow management
│   │   ├── use-live-data.ts      # Microsoft Graph data integration
│   │   └── ...                   # Other custom hooks
│   └── lib/                      # Utilities and configurations
├── server/                       # Backend Express server
│   ├── data/                     # Mock JSON training data
│   ├── microsoft-graph-integration.ts  # Live Microsoft Graph API client
│   ├── routes.ts                 # API endpoint definitions
│   └── storage.ts                # Dual storage system (file + database)
├── shared/                       # Shared TypeScript schemas
│   └── schema.ts                 # Zod schemas for data validation
└── .env                          # Azure credentials (not in repo)
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

For detailed test coverage and reports, see `tests/README.md`.

## 🔧 Configuration

### Environment Variables

**Required for Database:**
- `DATABASE_URL`: PostgreSQL connection string (optional - uses file storage if not set)
- `NODE_ENV`: Development/production environment

**Optional for Live Microsoft Graph Integration:**
- `AZURE_CLIENT_ID`: Microsoft App Registration client ID
- `AZURE_CLIENT_SECRET`: Microsoft App Registration client secret
- `AZURE_TENANT_ID`: Azure Active Directory tenant ID

### Microsoft Graph API Setup

To enable live data integration:

1. **Create Azure App Registration**:
   - Go to Azure Portal → App Registrations → New Registration
   - Grant these API permissions:
     - `SecurityEvents.Read.All` (Application)
     - `Device.Read.All` (Application)
     - `SecurityAlert.Read.All` (Application)

2. **Configure Application**:
   - Create client secret
   - Note the Application (client) ID and Directory (tenant) ID
   - Add these to your `.env` file

3. **Grant Admin Consent**:
   - Admin must consent to the application permissions
   - Application will automatically detect and use live data when credentials are valid

### Customization
- **Playbooks**: Modify `server/data/playbook.json` for custom training workflows
- **Training Scenarios**: Update `server/data/alerts.json` for different simulation scenarios
- **Live Data Sources**: Configure Azure permissions for different Graph API endpoints
- **Styling**: Customize colors and themes in `client/src/index.css`

## 🔧 Future Development Opportunities

### Authentication & User Management
- **JWT Authentication System**: User registration, login, session management
- **Role Assignment**: Associate users with specific organizational roles
- **Multi-tenant Support**: Separate training environments for different organizations

### Advanced Enterprise Features
- **Visual Playbook Editor**: Drag-and-drop interface for building custom response workflows
- **Analytics Dashboard**: SOC metrics tracking (MTTD, MTTR, response effectiveness)
- **Team Collaboration**: Incident assignment, real-time commenting, and workflow coordination
- **Integration Marketplace**: Additional SIEM, SOAR, and security tool integrations
- **Custom Training Scenarios**: AI-generated incident scenarios based on organization threat profile

## 🤝 Contributing

This platform serves as a comprehensive cybersecurity incident response training solution with live security data integration. The system is production-ready and provides:

**Core Capabilities:**
- ✅ **Live Microsoft Security Data**: Real-time alerts, incidents, and device status
- ✅ **Training Simulations**: Controlled ransomware, phishing, and compromise scenarios
- ✅ **Howard University Playbook**: 6-phase incident response workflow implementation
- ✅ **Role-Based Access**: Analyst, Manager, and Client views with appropriate data access
- ✅ **Professional Reporting**: Multi-format export with live data correlation

**Enhancement Opportunities:**
- Authentication and user management system
- Visual playbook editor for custom workflows
- Advanced analytics and SOC metrics dashboards
- Multi-tenant support for organizational training programs
- Additional security tool integrations (SIEM, SOAR, etc.)

## 📚 Learning Resources

This application demonstrates industry-standard practices and frameworks:

- **Howard University Incident Response Playbook**: Academic-backed response methodology
- **NIST Cybersecurity Framework**: Industry-standard response procedures
- **MITRE ATT&CK Framework**: Adversary technique mapping and threat intelligence
- **Microsoft Graph Security API**: Enterprise security data integration patterns
- **Modern Web Architecture**: React, TypeScript, Express.js, and PostgreSQL

## 🎯 Use Cases

**Cybersecurity Education:**
- University cybersecurity programs and certification courses
- Corporate security awareness training
- SOC analyst onboarding and skill development

**Professional Training:**
- Incident response team exercises with live data
- Tabletop simulations with realistic scenarios
- Cross-functional team coordination training

**Enterprise Security:**
- Real-time incident response with integrated workflows
- Security posture monitoring and reporting
- Compliance demonstration and audit preparation

## 📄 License

This project is designed for educational and training purposes in cybersecurity incident response.

---

🛡️ **Production-ready cybersecurity training platform with live Microsoft security data integration** 🛡️