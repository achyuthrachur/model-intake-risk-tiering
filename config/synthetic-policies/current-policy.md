# Model Risk Management Policy
## Version 1.0 - Current Active Policy

**Effective Date:** January 1, 2024
**Policy Owner:** Model Risk Management
**Approval Authority:** Chief Risk Officer

---

## 1. Purpose and Scope

This policy establishes the framework for identifying, assessing, and managing model risk in accordance with SR 11-7 (Supervisory Guidance on Model Risk Management) and OCC 2011-12. It applies to all quantitative models, AI/ML systems, and rule-based decision systems used across the organization.

---

## 2. Risk Tier Definitions

### Tier 3 - High Risk
**Description:** High materiality, regulated, or customer-impacting models requiring full validation.

**Validation Frequency:** Annual (every 12 months)

**Characteristics:**
- Models used for automated decisioning with customer impact
- Models subject to regulatory scrutiny (Fair Lending, BSA/AML)
- Customer-facing generative AI applications
- High financial materiality thresholds exceeded

**Required Controls:**
- Full independent validation before production
- Annual ongoing validation
- Comprehensive documentation package
- Executive committee approval required

### Tier 2 - Medium Risk
**Description:** Moderate impact, advisory models requiring enhanced monitoring.

**Validation Frequency:** Bi-annual (every 24 months)

**Characteristics:**
- Advisory models in regulated domains
- Internal GenAI tools
- Models processing PII or NPI
- Vendor/third-party models
- Models using sensitive attributes

**Required Controls:**
- Initial validation recommended
- Enhanced monitoring procedures
- Data privacy assessments where applicable
- Vendor due diligence for third-party models

### Tier 1 - Low Risk
**Description:** Low impact, internal productivity models with standard controls.

**Validation Frequency:** Tri-annual (every 36 months)

**Characteristics:**
- Internal automation with no customer impact
- Rules-based systems without model characteristics
- Internal productivity tools

**Required Controls:**
- Basic documentation
- Standard monitoring
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

---

## 4. Tier 2 Assignment Criteria

The following conditions assign a model to Tier 2 (unless elevated to T3 by other rules):

### 4.1 Advisory with Regulatory Domain
- **Trigger:** Usage type is "Advisory" AND regulatory domains is not empty
- **Required Artifacts:** Monitoring Plan, Usage Guidelines, Disclaimer Requirements
- **Risk Flags:** Regulatory Adjacent

### 4.2 PII Processing
- **Trigger:** Model processes personally identifiable information (PII)
- **Required Artifacts:** Data Privacy Impact Assessment, Data Retention Policy, Access Control Matrix
- **Risk Flags:** PII Handling, Privacy Risk

### 4.3 NPI Processing
- **Trigger:** Model processes non-public personal information (NPI)
- **Required Artifacts:** Data Privacy Impact Assessment, GLBA Compliance Review, Data Sharing Agreements
- **Risk Flags:** NPI Handling, GLBA Compliance

### 4.4 Sensitive Attributes Used
- **Trigger:** Model uses sensitive demographic or protected attributes
- **Required Artifacts:** Fairness Assessment, Bias Testing Results, Proxy Variable Analysis
- **Risk Flags:** Fairness Risk, Protected Attributes

### 4.5 Vendor Model
- **Trigger:** Third-party or vendor-provided model
- **Required Artifacts:** Vendor Due Diligence, Contract Review, SLA Documentation, Vendor Risk Assessment
- **Risk Flags:** Third Party Risk, Vendor Dependency

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
| T3   | 12 months (Annual)  | Required          | Continuous        |
| T2   | 24 months (Bi-annual) | Recommended     | Enhanced          |
| T1   | 36 months (Tri-annual) | Optional       | Standard          |

---

## 8. Effective Date and Review

This policy is effective as of January 1, 2024 and will be reviewed annually or upon significant regulatory changes.

**Document Control:**
- Version: 1.0
- Last Updated: January 1, 2024
- Next Review: January 1, 2025
