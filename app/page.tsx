'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Shield,
  Brain,
  FileCheck,
  Layers,
  User,
  ClipboardCheck,
  Lightbulb,
  BookOpen,
  Bot,
  FileText,
  CheckCircle,
  AlertTriangle,
  Mail,
  LineChart,
  Upload,
  Download,
  MessageSquare,
  Sparkles,
  Settings,
  History,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { HelpTooltip, HelpCard } from '@/components/ui/help-tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export default function WelcomePage() {
  const [showReadme, setShowReadme] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-purple-50">
      {/* Header */}
      <header className="flex-shrink-0 border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Model Use Case Governance
                </h1>
                <p className="text-sm text-gray-500">
                  Model Intake & Risk Tiering
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowReadme(true)}
              className="flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              README
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-2xl mb-6">
              <Shield className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Model Governance Made Simple
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Streamline your model intake process with automated risk tiering,
              compliance tracking, and comprehensive governance workflows.
            </p>
          </div>

          {/* First Time User Help Card */}
          <HelpCard
            id="welcome-intro"
            title="Welcome to Model Use Case Governance"
            icon={<Lightbulb className="w-5 h-5" />}
            variant="tip"
            className="mb-8 text-left max-w-2xl mx-auto"
            content={
              <div className="space-y-2">
                <p>This platform helps your organization manage model risk through:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong>Intake:</strong> Submit new use cases for governance review</li>
                  <li><strong>Risk Assessment:</strong> Automatic tier assignment based on risk factors</li>
                  <li><strong>Artifact Tracking:</strong> Know exactly what documentation is required</li>
                  <li><strong>Audit Trail:</strong> Full history of all actions and decisions</li>
                </ul>
                <p className="text-xs mt-2">Select your role below to get started. You can dismiss this message.</p>
              </div>
            }
          />

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Brain className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 inline-flex items-center gap-1.5">
                Smart Intake
                <HelpTooltip
                  title="Intelligent Intake Process"
                  content="Choose between a traditional form or a chatbot that guides you through questions conversationally. The chatbot adapts based on your answers and asks follow-up questions as needed."
                />
              </h3>
              <p className="text-sm text-gray-600">
                Intelligent conversational intake that guides users through the submission process.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Layers className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 inline-flex items-center gap-1.5">
                Risk Tiering
                <HelpTooltip
                  title="Automated Risk Classification"
                  content={
                    <div>
                      <p className="mb-2">Uses cases are automatically assigned to risk tiers:</p>
                      <ul className="space-y-1">
                        <li><strong>T1 (Low):</strong> Internal tools, minimal impact</li>
                        <li><strong>T2 (Medium):</strong> Advisory systems, moderate oversight</li>
                        <li><strong>T3 (High):</strong> Decision-making, customer impact, regulated</li>
                      </ul>
                    </div>
                  }
                />
              </h3>
              <p className="text-sm text-gray-600">
                Automated risk assessment with configurable rules engine for consistent tiering.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <FileCheck className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 inline-flex items-center gap-1.5">
                Compliance
                <HelpTooltip
                  title="Artifact & Compliance Tracking"
                  content="Based on the risk tier, the system identifies required documentation (model cards, validation plans, fairness assessments, etc.) and tracks which artifacts have been provided vs. are still needed."
                />
              </h3>
              <p className="text-sm text-gray-600">
                Track required artifacts, audit trails, and regulatory alignment in one place.
              </p>
            </div>
          </div>

          {/* Role Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <Link href="/owner/dashboard" className="block">
              <Card className="h-full hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer group">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:bg-blue-200 transition-colors">
                    <User className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 inline-flex items-center justify-center gap-1.5">
                    I'm a Model Owner
                    <HelpTooltip
                      title="Model Owner Role"
                      content={
                        <div>
                          <p className="mb-2">As a Model Owner, you are responsible for:</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Submitting new use cases</li>
                            <li>Providing required documentation</li>
                            <li>Responding to MRM feedback</li>
                            <li>Maintaining model documentation</li>
                          </ul>
                          <p className="mt-2 text-xs">Typically: Data Scientists, ML Engineers, Business Analysts</p>
                        </div>
                      }
                    />
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Submit new use cases for review, track your submissions, and respond to feedback.
                  </p>
                  <Button className="w-full group-hover:bg-primary/90">
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </Link>

            <Link href="/manager/welcome" className="block">
              <Card className="h-full hover:shadow-lg hover:border-purple-500/50 transition-all cursor-pointer group">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:bg-purple-200 transition-colors">
                    <ClipboardCheck className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 inline-flex items-center justify-center gap-1.5">
                    I'm a Model Risk Manager
                    <HelpTooltip
                      title="Model Risk Manager Role"
                      content={
                        <div>
                          <p className="mb-2">As an MRM, you are responsible for:</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Reviewing submitted use cases</li>
                            <li>Generating risk tier decisions</li>
                            <li>Approving or sending back for revision</li>
                            <li>Ensuring compliance requirements are met</li>
                          </ul>
                          <p className="mt-2 text-xs">Typically: MRM Analysts, Compliance Officers, Risk Managers</p>
                        </div>
                      }
                    />
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Review submitted intakes, approve or send back with notes, and manage demo data.
                  </p>
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 group-hover:bg-purple-700">
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </div>
          <p className="mt-6 text-sm text-gray-500">
            No account required. Select your role to get started.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex-shrink-0 border-t bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            Built for enterprise model governance and model risk management
          </p>
        </div>
      </footer>

      {/* README Dialog */}
      <Dialog open={showReadme} onOpenChange={setShowReadme}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <BookOpen className="w-6 h-6 text-primary" />
              Model Use Case Governance Platform
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 pr-2 space-y-6">
            {/* Overview Section */}
            <section>
              <p className="text-gray-600 leading-relaxed">
                A comprehensive enterprise platform for managing AI/ML model risk through structured
                intake processes, automated risk assessment, validation tracking, and compliance documentation.
                Supports traditional ML, Generative AI, rules-based systems, and hybrid models.
              </p>
            </section>

            {/* Core Features */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Core Features
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Smart Intake */}
                <div className="border rounded-lg p-4 bg-blue-50/50">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                    </div>
                    <h4 className="font-medium text-gray-900">Smart Intake</h4>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-1 ml-10">
                    <li>Traditional form-based submission</li>
                    <li>AI-powered conversational chatbot</li>
                    <li>40+ data attributes captured</li>
                    <li>File attachment support</li>
                    <li>Draft save capability</li>
                  </ul>
                </div>

                {/* Risk Tiering */}
                <div className="border rounded-lg p-4 bg-amber-50/50">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Layers className="w-4 h-4 text-amber-600" />
                    </div>
                    <h4 className="font-medium text-gray-900">Automated Risk Tiering</h4>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-1 ml-10">
                    <li><Badge variant="outline" className="text-xs bg-green-50 text-green-700">T1</Badge> Low Risk - 36-month cycles</li>
                    <li><Badge variant="outline" className="text-xs bg-amber-50 text-amber-700">T2</Badge> Medium Risk - 24-month cycles</li>
                    <li><Badge variant="outline" className="text-xs bg-red-50 text-red-700">T3</Badge> High Risk - 12-month cycles</li>
                    <li>Policy-driven rules engine (YAML)</li>
                    <li>Model definition determination</li>
                  </ul>
                </div>

                {/* Artifact Tracking */}
                <div className="border rounded-lg p-4 bg-green-50/50">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                      <FileCheck className="w-4 h-4 text-green-600" />
                    </div>
                    <h4 className="font-medium text-gray-900">Artifact & Compliance Tracking</h4>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-1 ml-10">
                    <li>Auto-generated requirements by tier</li>
                    <li>Policy, Validation, GenAI artifacts</li>
                    <li>Monitoring & Controls tracking</li>
                    <li>"What good looks like" guidance</li>
                    <li>Owner role assignments</li>
                  </ul>
                </div>

                {/* Model Inventory */}
                <div className="border rounded-lg p-4 bg-purple-50/50">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Eye className="w-4 h-4 text-purple-600" />
                    </div>
                    <h4 className="font-medium text-gray-900">Model Inventory Management</h4>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-1 ml-10">
                    <li>Centralized model registry</li>
                    <li>Filter by tier, status, business line</li>
                    <li>Validation schedule tracking</li>
                    <li>Overdue validation alerts</li>
                    <li>Vendor vs internal classification</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Validation & Findings */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Validation & Finding Management
              </h3>

              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Validation Tracking</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li><CheckCircle className="w-3 h-3 inline mr-1 text-green-500" />Initial, Periodic, Triggered, Ad-hoc types</li>
                      <li><CheckCircle className="w-3 h-3 inline mr-1 text-green-500" />Upload validation reports (PDF, Word)</li>
                      <li><CheckCircle className="w-3 h-3 inline mr-1 text-green-500" />AI-powered report analysis</li>
                      <li><CheckCircle className="w-3 h-3 inline mr-1 text-green-500" />Validation history timeline</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Finding Remediation</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li><CheckCircle className="w-3 h-3 inline mr-1 text-green-500" />Severity levels: Critical, High, Medium, Low</li>
                      <li><CheckCircle className="w-3 h-3 inline mr-1 text-green-500" />Categories: Performance, Docs, Controls, Data</li>
                      <li><CheckCircle className="w-3 h-3 inline mr-1 text-green-500" />Remediation workflow with sign-off</li>
                      <li><CheckCircle className="w-3 h-3 inline mr-1 text-green-500" />AI-generated remediation memos</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* AI Features */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Bot className="w-5 h-5 text-blue-500" />
                AI-Powered Features
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="border rounded-lg p-3 text-center">
                  <Mail className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                  <p className="text-sm font-medium">Validation Emails</p>
                  <p className="text-xs text-gray-500">Auto-generate owner notifications</p>
                </div>
                <div className="border rounded-lg p-3 text-center">
                  <FileText className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                  <p className="text-sm font-medium">Remediation Memos</p>
                  <p className="text-xs text-gray-500">Formal documentation generation</p>
                </div>
                <div className="border rounded-lg p-3 text-center">
                  <Brain className="w-6 h-6 text-green-500 mx-auto mb-2" />
                  <p className="text-sm font-medium">Report Analysis</p>
                  <p className="text-xs text-gray-500">AI insights from validation reports</p>
                </div>
              </div>
            </section>

            {/* Export & Reporting */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <LineChart className="w-5 h-5 text-indigo-500" />
                Reporting & Export
              </h3>

              <div className="border rounded-lg p-4 bg-indigo-50/30">
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="outline" className="bg-white"><Download className="w-3 h-3 mr-1" />CSV Export</Badge>
                  <Badge variant="outline" className="bg-white"><Download className="w-3 h-3 mr-1" />DOCX Memos</Badge>
                  <Badge variant="outline" className="bg-white"><Download className="w-3 h-3 mr-1" />HTML Checklists</Badge>
                  <Badge variant="outline" className="bg-white"><Upload className="w-3 h-3 mr-1" />Report Upload</Badge>
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>Comprehensive analytics dashboard with risk distribution</li>
                  <li>Aging analysis and queue time tracking</li>
                  <li>Data sensitivity and regulatory exposure reports</li>
                  <li>High-risk items monitoring and alerts</li>
                </ul>
              </div>
            </section>

            {/* Audit Trail */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <History className="w-5 h-5 text-gray-500" />
                Complete Audit Trail
              </h3>
              <p className="text-sm text-gray-600">
                Every action is logged with timestamps and actors: submissions, reviews, decisions,
                approvals, exports, and changes. Full change tracking with diff summaries for
                regulatory compliance and audit readiness.
              </p>
            </section>

            {/* User Roles */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-500" />
                User Roles & Workflows
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-5 h-5 text-blue-600" />
                    <h4 className="font-medium">Model Owner</h4>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-1 ml-7">
                    <li>Submit new use cases (form or chat)</li>
                    <li>Track submission status</li>
                    <li>Provide required documentation</li>
                    <li>Respond to MRM feedback</li>
                    <li>Remediate validation findings</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ClipboardCheck className="w-5 h-5 text-purple-600" />
                    <h4 className="font-medium">Model Risk Manager</h4>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-1 ml-7">
                    <li>Review submitted intakes</li>
                    <li>Generate risk assessments</li>
                    <li>Approve or send back with notes</li>
                    <li>Manage model inventory</li>
                    <li>Sign-off on remediations</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Tech Stack */}
            <section className="pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Tech Stack</h3>
              <div className="flex flex-wrap gap-2">
                <Badge>Next.js 14</Badge>
                <Badge>TypeScript</Badge>
                <Badge>React</Badge>
                <Badge>Tailwind CSS</Badge>
                <Badge>Prisma ORM</Badge>
                <Badge>PostgreSQL</Badge>
                <Badge>OpenAI API</Badge>
                <Badge>shadcn/ui</Badge>
              </div>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
