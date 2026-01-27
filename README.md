# Model Intake & Risk Tiering

A production-style web application for model use case governance that implements structured intake, policy-driven deployment decisions, risk detection, and audit-ready documentation. This platform supports all model types including traditional statistical models, machine learning, GenAI, RPA, and other automated decision systems.

## Features

- **Intake Wizard**: Guided multi-step form for capturing use case details
- **Rules-Based Tiering**: Deterministic risk tier assignment based on configurable rules
- **Artifact Requirements**: Automatically generated checklist of required documentation
- **Missing Evidence Detection**: Identifies gaps in compliance evidence
- **Export Capabilities**: Generate DOCX memo, HTML checklist, and CSV inventory
- **Audit Trail**: Complete history of all actions and changes
- **Admin Dashboard**: View and validate configuration

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: SQLite with Prisma ORM
- **Document Generation**: docx library for Word documents
- **Configuration**: YAML-based rules and artifacts

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/achyuthrachur/model-intake-risk-tiering.git
cd model-intake-risk-tiering
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
npx prisma db push
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Loading Demo Data

Click the "Load Demo Data" button on the dashboard to populate the database with 8 synthetic use cases that demonstrate different risk tiers and artifact requirements.

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── usecases/     # Use case CRUD operations
│   │   ├── config/       # Configuration endpoint
│   │   ├── audit/        # Audit trail endpoint
│   │   └── admin/        # Admin operations
│   ├── intake/           # Intake wizard page
│   ├── usecase/          # Use case detail view
│   └── admin/            # Admin dashboard
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── config/               # YAML configuration files
│   ├── rules.yaml       # Risk tiering rules
│   └── artifacts.yaml   # Artifact definitions
├── lib/                  # Shared utilities
│   ├── db.ts            # Prisma client
│   ├── types.ts         # TypeScript types
│   ├── config-loader.ts # YAML configuration loader
│   ├── rules-engine.ts  # Risk evaluation engine
│   ├── docgen.ts        # Document generation
│   └── utils.ts         # Helper functions
├── prisma/              # Database schema
└── scripts/             # Utility scripts
```

## Configuration

### Rules Configuration (`config/rules.yaml`)

The rules engine uses a YAML configuration file to define:

- **Tiers**: T1 (Low), T2 (Medium), T3 (High) risk levels
- **Rules**: Conditions that trigger tier assignments
- **Effects**: Required artifacts and risk flags for each rule

Example rule:
```yaml
- id: "R_DECISIONING_CUSTOMER_IMPACT"
  name: "Automated Decisioning with Customer Impact"
  tier: "T3"
  conditions:
    all:
      - field: "usageType"
        operator: "eq"
        value: "Decisioning"
      - field: "customerImpact"
        operator: "in"
        value: ["Direct", "Indirect"]
  effects:
    addRequiredArtifacts:
      - "ValidationPlan"
      - "MonitoringPlan"
    addRiskFlags:
      - "Materiality"
      - "CustomerImpact"
    triggeredCriteria: "Automated decisioning with customer impact"
```

### Artifacts Configuration (`config/artifacts.yaml`)

Defines all possible artifacts with:
- Name and description
- Category (Policy, Validation, GenAI, Monitoring, etc.)
- Owner role
- Required tiers

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/usecases` | List all use cases with stats |
| POST | `/api/usecases` | Create new use case |
| GET | `/api/usecases/[id]` | Get use case details |
| PUT | `/api/usecases/[id]` | Update use case |
| POST | `/api/usecases/[id]/submit` | Submit for review |
| POST | `/api/usecases/[id]/decision` | Generate risk decision |
| GET | `/api/usecases/[id]/export/memo` | Export DOCX memo |
| GET | `/api/usecases/[id]/export/checklist` | Export HTML checklist |
| GET | `/api/usecases/[id]/export/inventory` | Export CSV inventory |
| GET | `/api/config` | Get configuration |
| GET | `/api/audit/[usecaseId]` | Get audit trail |
| POST | `/api/admin/seed` | Seed demo data |

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Deploy (Vercel will automatically detect Next.js)

Note: SQLite database will be ephemeral on Vercel. For production, configure a persistent database like PostgreSQL.

### Docker

```bash
docker build -t model-intake .
docker run -p 3000:3000 model-intake
```

## Demo Use Cases

The seed data includes 8 synthetic use cases:

1. **AML Alert Narrative Summarizer** (T2) - GenAI advisory for compliance
2. **Policy RAG Assistant** (T2) - Internal GenAI tool
3. **Credit Underwriting Model Refresh** (T3) - High-risk lending model
4. **Vendor Fraud Score Integration** (T3) - Third-party decisioning
5. **Collections Prioritization Model** (T3) - Customer-facing ML
6. **Marketing Copy Assistant** (T1) - Low-risk GenAI
7. **Call Center Agent Assist** (T3) - Customer-facing GenAI
8. **Transaction Monitoring Optimization** (T3) - AML/BSA critical

## Key Governance Concepts

This application demonstrates:

- **Structured Intake**: Guided data collection for governance review
- **Policy-Driven Deployment**: Consistent decisions based on defined rules
- **Risk Detection Upfront**: Identify issues before deployment
- **Audit-Ready Documentation**: Exportable compliance artifacts

## License

MIT
