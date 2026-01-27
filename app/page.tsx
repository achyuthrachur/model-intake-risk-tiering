'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Shield,
  FileCheck,
  Layers,
  User,
  ClipboardCheck,
  Bot,
  CheckCircle,
  AlertTriangle,
  Download,
  MessageSquare,
  History,
  BookOpen,
  ChevronDown,
  ChevronUp,
  GitBranch,
  Target,
  Workflow,
  Scale,
  Search,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { HelpTooltip } from '@/components/ui/help-tooltip';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function WelcomePage() {
  const [activeTab, setActiveTab] = useState('overview');

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
                  Intake, Risk Tiering & Validation Tracking
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-2xl mb-3">
              <Shield className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Model Use Case Governance Platform
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Structured intake and risk tiering for AI/ML model governance under SR 11-7, OCC 2011-12, and emerging AI frameworks.
            </p>
          </div>

          {/* Tabs for Overview vs About */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Get Started
              </TabsTrigger>
              <TabsTrigger value="about" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                About & README
              </TabsTrigger>
            </TabsList>

            {/* About Tab Content */}
            <TabsContent value="about" className="mt-6">
              <div className="bg-white rounded-xl border shadow-sm p-6 space-y-8">
                {/* Executive Summary */}
                <section>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Executive Summary
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    This Model Use Case Governance Platform is a comprehensive solution designed for Model Risk Management (MRM)
                    teams at financial institutions. It provides end-to-end workflow automation for model intake, risk tiering,
                    artifact management, validation tracking, and finding remediation - all aligned with SR 11-7, OCC 2011-12,
                    and emerging AI/ML governance frameworks.
                  </p>
                </section>

                {/* Who This Is For */}
                <section>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Who This Platform Is For
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                      <h4 className="font-semibold text-blue-900 mb-2">Model Risk Managers</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>- MRM Analysts and Senior Analysts</li>
                        <li>- Model Validation Officers</li>
                        <li>- Chief Model Risk Officers</li>
                        <li>- Compliance and Risk Leadership</li>
                      </ul>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                      <h4 className="font-semibold text-purple-900 mb-2">Model Owners & Developers</h4>
                      <ul className="text-sm text-purple-800 space-y-1">
                        <li>- Data Scientists and ML Engineers</li>
                        <li>- Business Analysts</li>
                        <li>- Product Managers</li>
                        <li>- Technology Teams deploying AI/ML</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Process Flows */}
                <section>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Workflow className="w-5 h-5 text-green-600" />
                    Process Flows
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">1. Intake Flow (Model Owner)</h4>
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <Badge variant="outline">Submit Use Case</Badge>
                          <ChevronDown className="w-4 h-4 text-gray-400 rotate-[-90deg]" />
                          <Badge variant="outline">AI/Form Intake</Badge>
                          <ChevronDown className="w-4 h-4 text-gray-400 rotate-[-90deg]" />
                          <Badge variant="outline">Auto Risk Tiering</Badge>
                          <ChevronDown className="w-4 h-4 text-gray-400 rotate-[-90deg]" />
                          <Badge variant="outline">Upload Artifacts</Badge>
                          <ChevronDown className="w-4 h-4 text-gray-400 rotate-[-90deg]" />
                          <Badge variant="outline">Submit for Review</Badge>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">2. Review Flow (MRM)</h4>
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <Badge variant="outline" className="bg-purple-50">Receive Submission</Badge>
                          <ChevronDown className="w-4 h-4 text-gray-400 rotate-[-90deg]" />
                          <Badge variant="outline" className="bg-purple-50">Review Tier Decision</Badge>
                          <ChevronDown className="w-4 h-4 text-gray-400 rotate-[-90deg]" />
                          <Badge variant="outline" className="bg-purple-50">Check Artifacts</Badge>
                          <ChevronDown className="w-4 h-4 text-gray-400 rotate-[-90deg]" />
                          <Badge variant="outline" className="bg-purple-50">Approve / Send Back</Badge>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">3. Inventory Lifecycle (MRM)</h4>
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <Badge variant="outline" className="bg-green-50">Add to Inventory</Badge>
                          <ChevronDown className="w-4 h-4 text-gray-400 rotate-[-90deg]" />
                          <Badge variant="outline" className="bg-green-50">Track Validations</Badge>
                          <ChevronDown className="w-4 h-4 text-gray-400 rotate-[-90deg]" />
                          <Badge variant="outline" className="bg-green-50">Log Findings</Badge>
                          <ChevronDown className="w-4 h-4 text-gray-400 rotate-[-90deg]" />
                          <Badge variant="outline" className="bg-green-50">Monitor Remediation</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Key Capabilities */}
                <section>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Scale className="w-5 h-5 text-amber-600" />
                    Key Capabilities
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900">Structured Intake</h5>
                          <p className="text-sm text-gray-600">40+ attributes captured via form wizard or AI chatbot. Supports all model types: Traditional ML, GenAI, RPA, Rules-based, Hybrid.</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Layers className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900">Policy-Driven Tiering</h5>
                          <p className="text-sm text-gray-600">Configurable rules engine assigns T1/T2/T3 based on usage type, customer impact, regulatory domain, data sensitivity, and more.</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileCheck className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900">Artifact Management</h5>
                          <p className="text-sm text-gray-600">Auto-generated artifact requirements by tier. Categories include Policy, Validation, GenAI, Monitoring, Vendor, and Privacy artifacts.</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Search className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900">Validation Tracking</h5>
                          <p className="text-sm text-gray-600">Track Initial, Periodic, Triggered, and Ad-hoc validations. Automatic due date calculation based on tier and policy frequency.</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900">Finding Remediation</h5>
                          <p className="text-sm text-gray-600">Log validation findings by severity and category. Track remediation status with MRM sign-off workflow.</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <GitBranch className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900">Policy Management</h5>
                          <p className="text-sm text-gray-600">Upload policy documents, AI-analyze changes, preview impact on existing inventory, and apply new validation frequencies.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Value Proposition */}
                <section className="bg-gradient-to-r from-primary/5 to-purple-50 rounded-lg p-5 border">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Why MRM Professionals Choose This Platform</h3>
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">40+</div>
                      <div className="text-sm text-gray-600">Intake Attributes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">3</div>
                      <div className="text-sm text-gray-600">Risk Tiers with Configurable Rules</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">100%</div>
                      <div className="text-sm text-gray-600">Audit Trail Coverage</div>
                    </div>
                  </div>
                  <ul className="mt-4 text-sm text-gray-700 space-y-1">
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Reduces intake inconsistency across business lines</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Automates tier assignment per policy requirements</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Provides exam-ready documentation and reports</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Scales from dozens to thousands of models</li>
                  </ul>
                </section>
              </div>
            </TabsContent>

            {/* Overview Tab Content (existing content) */}
            <TabsContent value="overview" className="mt-6">

          {/* Main Grid: Platform Info + Role Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Platform Overview - Left Side */}
            <div className="lg:col-span-2 space-y-5">
              {/* What This Platform Does */}
              <div className="bg-white rounded-xl p-5 shadow-sm border">
                <h3 className="font-semibold text-gray-900 mb-3">What This Platform Does</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Complete workflow from use case submission through risk tier assignment, artifact tracking,
                  validation management, and audit documentation.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Consistent intake across all model types</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Policy-driven risk tiering (T1/T2/T3)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Automatic artifact requirements by tier</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Validation lifecycle & finding remediation</span>
                  </div>
                </div>
              </div>

              {/* Core Capabilities */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Intake */}
                <div className="bg-white rounded-xl p-4 shadow-sm border">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                    </div>
                    <h4 className="font-medium text-gray-900">Intake Methods</h4>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-1 ml-10">
                    <li>Form-based wizard (40+ attributes)</li>
                    <li>AI conversational chatbot</li>
                    <li>Draft save & file attachments</li>
                  </ul>
                </div>

                {/* Risk Tiering */}
                <div className="bg-white rounded-xl p-4 shadow-sm border">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Layers className="w-4 h-4 text-amber-600" />
                    </div>
                    <h4 className="font-medium text-gray-900">Risk Tiering</h4>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-1 ml-10">
                    <li><Badge variant="outline" className="text-xs bg-green-50 text-green-700 py-0 px-1">T1</Badge> Low - 36mo validation</li>
                    <li><Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 py-0 px-1">T2</Badge> Medium - 24mo validation</li>
                    <li><Badge variant="outline" className="text-xs bg-red-50 text-red-700 py-0 px-1">T3</Badge> High - 12mo validation</li>
                  </ul>
                </div>

                {/* Artifacts */}
                <div className="bg-white rounded-xl p-4 shadow-sm border">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <FileCheck className="w-4 h-4 text-green-600" />
                    </div>
                    <h4 className="font-medium text-gray-900">Artifact Management</h4>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-1 ml-10">
                    <li>Auto-generated requirements by tier</li>
                    <li>Policy, Validation, GenAI, Monitoring</li>
                    <li>"What good looks like" guidance</li>
                  </ul>
                </div>

                {/* Validation */}
                <div className="bg-white rounded-xl p-4 shadow-sm border">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-purple-600" />
                    </div>
                    <h4 className="font-medium text-gray-900">Validation & Findings</h4>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-1 ml-10">
                    <li>Initial, Periodic, Triggered, Ad-hoc</li>
                    <li>Finding remediation workflow</li>
                    <li>MRM sign-off tracking</li>
                  </ul>
                </div>
              </div>

              {/* Additional Features Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm border">
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="w-5 h-5 text-blue-500" />
                    <h4 className="font-medium text-gray-900 text-sm">AI Features</h4>
                  </div>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>Conversational intake</li>
                    <li>Report analysis</li>
                    <li>Email & memo generation</li>
                  </ul>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm border">
                  <div className="flex items-center gap-2 mb-2">
                    <Download className="w-5 h-5 text-indigo-500" />
                    <h4 className="font-medium text-gray-900 text-sm">Export</h4>
                  </div>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>DOCX decision memos</li>
                    <li>HTML checklists</li>
                    <li>CSV inventory export</li>
                  </ul>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm border">
                  <div className="flex items-center gap-2 mb-2">
                    <History className="w-5 h-5 text-gray-500" />
                    <h4 className="font-medium text-gray-900 text-sm">Audit Trail</h4>
                  </div>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>All actions logged</li>
                    <li>Change tracking</li>
                    <li>SR 11-7 aligned</li>
                  </ul>
                </div>
              </div>

              {/* Model Types */}
              <div className="bg-slate-50 rounded-xl p-4 border">
                <h4 className="font-medium text-gray-900 mb-2 text-sm">Supported Model Types</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs">Traditional ML</Badge>
                  <Badge variant="secondary" className="text-xs">Generative AI</Badge>
                  <Badge variant="secondary" className="text-xs">RPA</Badge>
                  <Badge variant="secondary" className="text-xs">Rules-Based</Badge>
                  <Badge variant="secondary" className="text-xs">Hybrid</Badge>
                  <Badge variant="secondary" className="text-xs">Third-Party/Vendor</Badge>
                </div>
              </div>
            </div>

            {/* Role Selection Cards - Right Side */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 text-center mb-4">
                  Select Your Role
                </h3>

                {/* Model Owner Card */}
                <Link href="/owner/dashboard" className="block">
                  <Card className="hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer group">
                    <CardContent className="p-6 flex flex-col min-h-[240px]">
                      <div className="flex-1">
                        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:bg-blue-200 transition-colors">
                          <User className="w-8 h-8 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center inline-flex items-center justify-center gap-1.5 w-full">
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
                                  <li>Remediating validation findings</li>
                                </ul>
                                <p className="mt-2 text-xs">Typically: Data Scientists, ML Engineers, Business Analysts</p>
                              </div>
                            }
                          />
                        </h3>
                        <p className="text-sm text-gray-600 text-center">
                          Submit new use cases for review, track your submissions, and respond to feedback.
                        </p>
                      </div>
                      <Button className="w-full mt-4 group-hover:bg-primary/90">
                        Get Started
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                </Link>

                {/* Model Risk Manager Card */}
                <Link href="/manager/welcome" className="block">
                  <Card className="hover:shadow-lg hover:border-purple-500/50 transition-all cursor-pointer group">
                    <CardContent className="p-6 flex flex-col min-h-[240px]">
                      <div className="flex-1">
                        <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:bg-purple-200 transition-colors">
                          <ClipboardCheck className="w-8 h-8 text-purple-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center inline-flex items-center justify-center gap-1.5 w-full">
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
                                  <li>Managing the model inventory</li>
                                </ul>
                                <p className="mt-2 text-xs">Typically: MRM Analysts, Compliance Officers, Risk Managers</p>
                              </div>
                            }
                          />
                        </h3>
                        <p className="text-sm text-gray-600 text-center">
                          Review submitted intakes, approve or send back with notes, and manage demo data.
                        </p>
                      </div>
                      <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700 group-hover:bg-purple-700">
                        Get Started
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                </Link>

                <p className="text-center text-sm text-gray-500">
                  No account required. Select your role to get started.
                </p>
              </div>
            </div>
          </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex-shrink-0 border-t bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            Designed for SR 11-7, OCC 2011-12, and emerging AI governance frameworks
          </p>
        </div>
      </footer>
    </div>
  );
}
