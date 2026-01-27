# Model Risk Management Policy
## Version 2.0 - Enhanced Governance Framework

**Effective Date:** January 1, 2025
**Policy Owner:** Model Risk Management
**Approval Authority:** Chief Risk Officer

---

## 1. Purpose and Scope

This policy establishes an enhanced framework for identifying, assessing, and managing model risk in accordance with SR 11-7 (Supervisory Guidance on Model Risk Management), OCC 2011-12, and emerging AI governance requirements. It reflects increased regulatory expectations and lessons learned from recent model risk events.

**Key Changes from Version 1.0:**
- Increased validation frequencies across all tiers
- New elevated risk criteria for data privacy and vendor models
- Enhanced GenAI governance requirements
- Stricter controls for customer-facing applications

---

## 2. Risk Tier Definitions

### Tier 3 - Critical Risk
**Description:** Mission-critical, highly regulated, or significant customer-impacting models requiring intensive oversight.

**Validation Frequency:** Semi-annual (every 6 months) [CHANGED from 12 months]

**Characteristics:**
- Models used for automated decisioning with customer impact
- Models subject to regulatory scrutiny (Fair Lending, BSA/AML)
- Customer-facing generative AI applications
- High financial materiality thresholds exceeded
- **NEW:** Customer-facing applications processing PII
- **NEW:** Vendor models in regulated domains

**Required Controls:**
- Full independent validation before production
- Semi-annual ongoing validation
- Comprehensive documentation package
- Executive committee approval required
- Continuous monitoring with automated alerts

### Tier 2 - Elevated Risk
**Description:** Material impact, regulatory-adjacent models requiring proactive monitoring.

**Validation Frequency:** Annual (every 12 months) [CHANGED from 24 months]

**Characteristics:**
- Advisory models in regulated domains
- Internal GenAI tools
- Models processing PII (internal deployment only)
- Vendor models in non-regulated domains
- Models using sensitive attributes

**Required Controls:**
- Initial validation required (upgraded from recommended)
- Enhanced monitoring procedures
- Data privacy assessments
- Vendor due diligence for third-party models

### Tier 1 - Standard Risk
**Description:** Limited impact, internal models with baseline controls.

**Validation Frequency:** Bi-annual (every 24 months) [CHANGED from 36 months]

**Characteristics:**
- Internal automation with no customer impact
- Rules-based systems without model characteristics
- Internal productivity tools

**Required Controls:**
- Basic documentation
- Standard monitoring with periodic review
- Inventory registration

---

## 3. Tier 3 Assignment Criteria

The following conditions automatically assign a model to Tier 3:

### 3.1 Automated Decisioning with Customer Impact
- **Trigger:** Usage type is "Decisioning" AND customer impact is "Direct" or "Indirect"
- **Required Artifacts:** Validation Plan, Monitoring Plan, Model Card, Change Log, Approvals Memo, Fairness Assessment
- **Risk Flags:** Materiality, Customer Impact

### 3.2 No Human-in-the-Loop for Decisioning
- **Trigger:** Usage type is "Decisioning" AND human-in-loop is "None"
- **Required Artifacts:** Human Oversight Justification, Fallback Procedure, Escalation Process
- **Risk Flags:** No Human Oversight, Automated Decisions

### 3.3 GenAI Customer Facing
- **Trigger:** AI type is "GenAI" or "Hybrid" AND deployment is "Customer-facing"
- **Required Artifacts:** LLM Evaluation Suite, Guardrails Design, Hallucination Test Results, Prompt Injection Tests, Content Filtering Plan
- **Risk Flags:** GenAI Risk, Hallucination Risk, Customer Exposure

### 3.4 Lending or Credit Decisions
- **Trigger:** Business line is Credit/Lending/Underwriting/Retail Banking OR regulatory domain includes "Lending"
- **Required Artifacts:** Fair Lending Analysis, Adverse Action Process, Model Risk Assessment, SR 11-7 Compliance
- **Risk Flags:** Regulatory Compliance, Fair Lending, ECOA

### 3.5 AML/BSA Critical
- **Trigger:** Business line is "AML" OR regulatory domain includes "AML"
- **Required Artifacts:** BSA Compliance Review, SAR Filing Process, Alert Tuning Documentation, Threshold Calibration
- **Risk Flags:** BSA Compliance, Regulatory Exam Risk

### 3.6 [NEW] PII with Customer-Facing Deployment
- **Trigger:** Model processes PII AND deployment is "Customer-facing"
- **Required Artifacts:** Data Privacy Impact Assessment, Data Retention Policy, Access Control Matrix, Customer Data Protection Plan, Breach Response Procedure
- **Risk Flags:** PII Handling, Privacy Risk, Customer Data Exposure
- **Rationale:** Customer-facing applications with PII present elevated privacy breach risk and regulatory exposure

### 3.7 [NEW] Vendor Model in Regulated Domain
- **Trigger:** Vendor/third-party model AND regulatory domains is not empty
- **Required Artifacts:** Vendor Due Diligence, Contract Review, SLA Documentation, Vendor Risk Assessment, Regulatory Compliance Attestation, Audit Rights Documentation
- **Risk Flags:** Third Party Risk, Vendor Dependency, Regulatory Compliance
- **Rationale:** Third-party models in regulated spaces require enhanced oversight due to limited visibility and control

### 3.8 [NEW] High-Volume Customer Transactions
- **Trigger:** Usage type is "Automation" AND deployment is "Customer-facing" AND customer impact is "Direct" or "Indirect"
- **Required Artifacts:** Volume Monitoring Plan, Transaction Audit Trail, Revert Procedure, Capacity Planning
- **Risk Flags:** High Volume Risk, Transaction Integrity, Customer Impact

---

## 4. Tier 2 Assignment Criteria

The following conditions assign a model to Tier 2 (unless elevated to T3 by other rules):

### 4.1 Advisory with Regulatory Domain
- **Trigger:** Usage type is "Advisory" AND regulatory domains is not empty
- **Required Artifacts:** Monitoring Plan, Usage Guidelines, Disclaimer Requirements
- **Risk Flags:** Regulatory Adjacent

### 4.2 PII Processing (Internal Only)
- **Trigger:** Model processes PII AND deployment is NOT "Customer-facing"
- **Required Artifacts:** Data Privacy Impact Assessment, Data Retention Policy, Access Control Matrix
- **Risk Flags:** PII Handling, Privacy Risk
- **Note:** If deployment is Customer-facing, see T3 rule 3.6

### 4.3 NPI Processing
- **Trigger:** Model processes non-public personal information (NPI)
- **Required Artifacts:** Data Privacy Impact Assessment, GLBA Compliance Review, Data Sharing Agreements
- **Risk Flags:** NPI Handling, GLBA Compliance

### 4.4 Sensitive Attributes Used
- **Trigger:** Model uses sensitive demographic or protected attributes
- **Required Artifacts:** Fairness Assessment, Bias Testing Results, Proxy Variable Analysis
- **Risk Flags:** Fairness Risk, Protected Attributes

### 4.5 Vendor Model (Non-Regulated)
- **Trigger:** Third-party or vendor-provided model AND regulatory domains is empty
- **Required Artifacts:** Vendor Due Diligence, Contract Review, SLA Documentation, Vendor Risk Assessment
- **Risk Flags:** Third Party Risk, Vendor Dependency
- **Note:** If regulatory domains apply, see T3 rule 3.7

### 4.6 GenAI Internal Use
- **Trigger:** AI type is "GenAI" or "Hybrid" AND deployment is "Internal tool"
- **Required Artifacts:** Acceptable Usage Policy, Prompt Guidelines, Output Review Process
- **Risk Flags:** GenAI Risk, Content Generation

### 4.7 No Fallback Plan
- **Trigger:** No fallback plan defined AND usage type is "Decisioning" or "Advisory"
- **Required Artifacts:** Fallback Procedure, Business Continuity Plan
- **Risk Flags:** Operational Risk, No Fallback

---

## 5. Tier 1 Assignment Criteria

The following conditions allow a model to remain at Tier 1:

### 5.1 Internal Automation
- **Trigger:** Usage type is "Automation" AND customer impact is "None" AND deployment is "Internal tool"
- **Required Artifacts:** Use Case Inventory Entry, Basic Monitoring Plan

### 5.2 Rules-Based System
- **Trigger:** AI type is "Rules" AND model definition trigger is false
- **Required Artifacts:** Use Case Inventory Entry, Rules Documentation

---

## 6. Model Definition Criteria

A system is considered a "model" under this policy if ANY of the following apply:

1. **Influences Decisions:** Output directly influences business decisions
2. **Quantitative Method:** Uses statistical, mathematical, or ML methods (Traditional ML, GenAI, Hybrid)
3. **Decisioning Use:** Used for automated decisioning
4. **Produces Scores:** Produces scores, rankings, or classifications (Decisioning or Advisory, non-Rules)

Systems meeting none of these criteria are classified as "Not a Model" and exempt from MRM governance.

---

## 7. Validation Requirements Summary

| Tier | Validation Frequency | Initial Validation | Ongoing Monitoring |
|------|---------------------|-------------------|-------------------|
| T3   | 6 months (Semi-annual) | Required       | Continuous        |
| T2   | 12 months (Annual)  | Required          | Enhanced          |
| T1   | 24 months (Bi-annual) | Recommended    | Standard          |

**Changes from v1.0:**
- T3: 12 months -> 6 months
- T2: 24 months -> 12 months
- T1: 36 months -> 24 months

---

## 8. Summary of Policy Changes (v1.0 to v2.0)

### Validation Frequency Changes
| Tier | Previous | New | Change |
|------|----------|-----|--------|
| T3 | 12 months | 6 months | -6 months |
| T2 | 24 months | 12 months | -12 months |
| T1 | 36 months | 24 months | -12 months |

### New Tier 3 Elevation Rules
1. **PII + Customer-Facing:** Models processing PII with customer-facing deployment elevated from T2 to T3
2. **Vendor + Regulated:** Vendor models in regulated domains elevated from T2 to T3
3. **High-Volume Customer Transactions:** Automation with customer-facing deployment and customer impact elevated to T3

### Enhanced Requirements
- T2 initial validation upgraded from "Recommended" to "Required"
- Additional artifacts for new T3 rules
- Strengthened vendor oversight requirements

---

## 9. Effective Date and Review

This policy is effective as of January 1, 2025 and will be reviewed semi-annually or upon significant regulatory changes.

**Document Control:**
- Version: 2.0
- Last Updated: January 1, 2025
- Supersedes: Version 1.0 (January 1, 2024)
- Next Review: July 1, 2025
