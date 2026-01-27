# Model Use Case Governance Platform

A structured intake and risk tiering solution for organizations managing AI/ML model risk under SR 11-7, OCC 2011-12, and emerging AI governance frameworks.

---

## What This Platform Does

This platform provides a complete workflow for model governance—from initial use case submission through risk tier assignment, artifact tracking, validation management, and audit documentation. It's designed for organizations that need:

- **Consistent intake processes** across all model types (Traditional ML, GenAI, RPA, Rules-based, Hybrid, Third-party)
- **Policy-driven risk tiering** that removes subjectivity from tier assignments
- **Clear artifact requirements** automatically generated based on tier and model characteristics
- **Validation lifecycle tracking** with finding remediation workflows
- **Audit-ready documentation** exportable at any point

---

## For Model Owners

### Submit Use Cases Efficiently

Two intake methods are available:
- **Form-based wizard**: Step-by-step form capturing 40+ attributes across model details, data usage, deployment context, and regulatory applicability
- **Conversational chatbot**: AI-guided intake that asks contextual follow-up questions based on your responses

Both methods capture the same information—choose based on your preference.

### What You'll Provide

During intake, you'll document:
- Model type and methodology (statistical, ML, GenAI, rules-based, hybrid)
- Usage classification (Decisioning, Advisory, Automation)
- Data inputs, sensitivity levels, and PII handling
- Customer impact (Direct, Indirect, None)
- Financial materiality thresholds
- Vendor/third-party dependencies
- Regulatory applicability (BSA/AML, Fair Lending, UDAAP, etc.)
- Existing documentation and artifacts

### Track Your Submissions

- View submission status in real-time (Draft, Submitted, Under Review, Approved, Needs Revision)
- Receive clear feedback from MRM when revisions are needed
- See exactly which artifacts are required and which are still outstanding
- Respond to validation findings with documented remediation actions

### Draft and Resume

Save incomplete submissions as drafts. Return later to finish—no data loss.

---

## For Model Risk Managers

### Review Queue Management

- Filter submitted intakes by status, tier, model type, or business line
- See aging metrics and time-in-queue for prioritization
- Access complete submission details including all captured attributes
- Review any attached documentation from model owners

### Policy Management

Update MRM policies and automatically apply changes across the system:

1. **Load Policy Document**: Upload a new MRM policy or select a demo policy
2. **AI Analysis**: System extracts tiering rules, validation frequencies, and artifact requirements
3. **Review Changes**: See side-by-side comparison of current vs. new policy rules
4. **Preview Impact**: View which inventory models will be affected (tier changes, new due dates)
5. **Approve & Apply**: Confirm changes and automatically update all affected models

**What Gets Updated:**
- Validation frequencies (e.g., T3: 12 months -> 6 months)
- Tiering rules and elevation criteria
- Inventory model validation schedules
- Next validation due dates

**Demo Policies Included:**
- **Current Policy (v1.0)**: Matches existing rules (T3=12mo, T2=24mo, T1=36mo)
- **Updated Policy (v2.0)**: Stricter frequencies (T3=6mo, T2=12mo, T1=24mo) plus new T3 elevation rules for PII+Customer-facing and Vendor+Regulated scenarios

### Risk Tier Assignment

The rules engine evaluates each submission against your configured criteria and recommends a tier:

| Tier | Risk Level | Typical Validation Cycle | Characteristics |
|------|------------|--------------------------|-----------------|
| **T1** | Low | 36 months | Internal tools, advisory only, no customer impact, non-material |
| **T2** | Medium | 24 months | Moderate complexity, indirect customer impact, GenAI advisory |
| **T3** | High | 12 months | Decisioning, direct customer impact, high materiality, regulated use |

**What triggers higher tiers:**
- Automated decisioning with customer impact → T3
- Direct financial materiality above threshold → T3
- Fair lending, BSA/AML, or UDAAP applicability → T3
- GenAI with customer-facing output → T3
- Third-party models used in decisioning → T3
- GenAI internal advisory → T2

### Generate Risk Decisions

Click "Generate Decision" to produce:
- Assigned risk tier with rationale
- List of triggered rules and criteria
- Required artifacts based on tier and model type
- Risk flags identified (Materiality, Customer Impact, Fair Lending, BSA/AML, etc.)
- Model definition determination (does this meet the definition of a "model" per policy?)

### Approval Workflow

- **Approve**: Move use case to approved status, model enters inventory
- **Send Back**: Return to model owner with specific feedback and required changes
- **Request Additional Info**: Ask for clarification without rejecting

### Model Inventory Management

Once approved, models appear in the inventory with:
- Risk tier and validation cycle information
- Next validation due date
- Outstanding artifact requirements
- Validation history
- Finding status

---

## Artifact Management

### Automatic Requirements Generation

Based on tier and model characteristics, the system identifies required documentation:

**Policy & Governance**
- Model Risk Policy acknowledgment
- Business justification documentation
- Data governance attestation
- Change management documentation

**Validation & Testing**
- Validation plan
- Initial validation report
- Performance testing results
- Sensitivity analysis
- Champion-challenger analysis (where applicable)

**GenAI-Specific** (when applicable)
- Prompt documentation and versioning
- Hallucination testing results
- Content moderation controls
- Human-in-the-loop requirements
- Training data documentation

**Monitoring & Controls**
- Ongoing monitoring plan
- Performance thresholds and triggers
- Escalation procedures
- Model performance dashboards

### Artifact Tracking

For each artifact:
- Clear description of what's required
- "What good looks like" guidance
- Responsible owner role (Model Owner, MRM, IT, etc.)
- Status tracking (Required, Provided, Waived, N/A)
- File upload capability

---

## Validation Lifecycle

### Validation Types Supported

- **Initial**: First validation before production deployment
- **Periodic**: Scheduled validations based on tier (12/24/36 months)
- **Triggered**: Event-driven validations (material model change, performance degradation)
- **Ad-hoc**: Requested validations outside normal cycle

### Validation Workflow

1. Schedule validation with type and due date
2. Upload validation report (PDF, Word)
3. AI-assisted report analysis extracts key points (optional)
4. Log findings with severity and category
5. Track remediation actions
6. MRM sign-off on remediation completion

### Finding Management

Findings are categorized by:
- **Severity**: Critical, High, Medium, Low
- **Category**: Model Performance, Documentation, Controls, Data Quality, Methodology

Each finding tracks:
- Description and recommendation
- Remediation action plan
- Owner and due date
- Status (Open, In Progress, Remediated, Closed)
- MRM sign-off

---

## Reporting & Export

### Export Options

- **DOCX Memo**: Formatted risk decision memo suitable for committee review
- **HTML Checklist**: Interactive artifact checklist for tracking
- **CSV Inventory**: Full data export for external analysis or regulatory reporting

### Analytics Available

- Risk tier distribution across inventory
- Submission volume and processing time trends
- Overdue validation alerts
- Finding severity breakdown
- Data sensitivity exposure summary
- Regulatory applicability coverage

---

## Audit Trail

Every action is logged:
- Submission, update, and status change timestamps
- User actions (who did what, when)
- Review and decision records
- Approval and rejection history with rationale
- Export activity
- Change tracking with diff summaries

Designed to satisfy SR 11-7 documentation requirements and support internal audit and regulatory examination.

---

## Process Flows

### Model Owner Process Flow

```
1. ACCESS PORTAL
   |
   v
2. SELECT "Model Owner" ROLE
   |
   v
3. CHOOSE INTAKE METHOD
   |
   +---> Form Wizard (40+ structured fields)
   |           |
   |           v
   |     Complete step-by-step form
   |     - Model details & methodology
   |     - Data usage & sensitivity
   |     - Regulatory applicability
   |     - Deployment context
   |
   +---> AI Chatbot (conversational)
                 |
                 v
           Answer contextual questions
           AI guides based on responses
   |
   v
4. SAVE DRAFT OR SUBMIT
   |
   +---> Save Draft --> Return later to complete
   |
   +---> Submit --> Status: "Submitted"
   |
   v
5. TRACK STATUS ON DASHBOARD
   |
   +---> Approved --> Model enters inventory
   |                  Upload required artifacts
   |
   +---> Sent Back --> Review MRM feedback
                       Make requested changes
                       Resubmit
   |
   v
6. RESPOND TO VALIDATION FINDINGS
   |
   v
7. MONITOR MODEL IN INVENTORY
```

**Key Actions:**
- Create new intake (form or chat)
- Save/resume drafts
- Submit for MRM review
- View status and feedback
- Upload documentation artifacts
- Respond to validation findings

### Model Risk Manager Process Flow

```
1. ACCESS PORTAL
   |
   v
2. SELECT "Model Risk Manager" ROLE
   |
   v
3. CHOOSE ACTIVITY
   |
   +---> REVIEW INTAKES
   |           |
   |           v
   |     Filter queue by status/tier/type
   |           |
   |           v
   |     Select intake to review
   |           |
   |           v
   |     Generate risk decision (AI + rules engine)
   |           |
   |           v
   |     Review tier, artifacts, risk flags
   |           |
   |           +---> Approve --> Model enters inventory
   |           |
   |           +---> Send Back --> Provide feedback to owner
   |
   +---> MANAGE INVENTORY
   |           |
   |           v
   |     View all approved models
   |           |
   |           v
   |     Track validation schedules
   |           |
   |           v
   |     Log validation reports & findings
   |           |
   |           v
   |     Monitor remediation progress
   |           |
   |           v
   |     Sign off on completed findings
   |
   +---> UPDATE POLICIES
   |           |
   |           v
   |     Load new MRM policy document
   |     (or select demo policy)
   |           |
   |           v
   |     AI analyzes and extracts rules
   |           |
   |           v
   |     Review changes vs current config
   |     - Validation frequency changes
   |     - New/modified tiering rules
   |           |
   |           v
   |     Preview impact on inventory
   |     - Models affected
   |     - New due dates
   |           |
   |           v
   |     Approve and apply changes
   |           |
   |           v
   |     System updates all affected models
   |
   +---> GENERATE REPORTS
             |
             v
       Export decision memos (DOCX)
       Export artifact checklists (HTML)
       Export inventory data (CSV)
       View analytics dashboard
```

**Key Capabilities:**
1. **Intake Review**
   - Filter and prioritize submissions
   - Generate AI-enhanced risk decisions
   - Approve or send back with feedback
   - Export governance documentation

2. **Inventory Management**
   - Track model validation lifecycles
   - Log and manage validation findings
   - Monitor remediation status
   - Sign off on completed items

3. **Policy Updates**
   - Load updated MRM policy documents
   - AI extracts tiering rules automatically
   - Preview impact before applying
   - Bulk update inventory models

4. **Reporting & Export**
   - Generate formatted decision memos
   - Export artifact checklists
   - Produce inventory reports
   - Access analytics dashboard

---

## Rules Engine Configuration

Risk tiering rules are defined in YAML format and can be customized to your organization's policy:

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

Modify `config/rules.yaml` to align with your model risk policy.

---

## Model Types Supported

- **Traditional ML**: Regression, classification, clustering, time series
- **Generative AI**: LLMs, RAG systems, text/image generation
- **RPA**: Robotic process automation with decision logic
- **Rules-based**: Deterministic decision systems that may qualify as models
- **Hybrid**: Combinations of the above
- **Third-party/Vendor**: Models sourced from external providers

---

## Technical Details

### Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, React 18
- **UI**: Tailwind CSS, shadcn/ui components
- **Backend**: Next.js API Routes
- **Database**: Prisma ORM with PostgreSQL (SQLite for local dev)
- **AI Features**: OpenAI API integration
- **Document Generation**: docx library

### Local Development

```bash
# Clone and install
git clone https://github.com/achyuthrachur/model-intake-risk-tiering.git
cd model-intake-risk-tiering
npm install

# Set up database
npx prisma db push

# Start development server
npm run dev
```

Access at [http://localhost:3000](http://localhost:3000)

### Demo Data

Load 8 synthetic use cases from the Manager dashboard demonstrating different tiers, model types, and artifact requirements:

| Use Case | Type | Tier | Notes |
|----------|------|------|-------|
| AML Alert Narrative Summarizer | GenAI | T2 | Internal compliance advisory |
| Policy RAG Assistant | GenAI | T2 | Internal document retrieval |
| Credit Underwriting Model Refresh | Traditional ML | T3 | High materiality, fair lending |
| Vendor Fraud Score Integration | Third-party | T3 | External model, decisioning |
| Collections Prioritization Model | ML | T3 | Customer-facing, financial impact |
| Marketing Copy Assistant | GenAI | T1 | Low risk, internal creative |
| Call Center Agent Assist | GenAI | T3 | Customer-facing, real-time |
| Transaction Monitoring Optimization | ML | T3 | BSA/AML critical |

### Deployment

- **Vercel**: Recommended for demos (configure PostgreSQL for persistence)
- **Docker**: `docker build -t model-intake . && docker run -p 3000:3000 model-intake`
- **Self-hosted**: Any Node.js environment with database connection

---

## Regulatory Alignment

Designed with the following frameworks in mind:
- **SR 11-7**: Federal Reserve guidance on model risk management
- **OCC 2011-12**: OCC supervisory guidance on model risk
- **Emerging AI Governance**: Structured to accommodate evolving AI/ML oversight requirements

---

## License

MIT License
