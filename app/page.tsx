'use client';

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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { HelpTooltip } from '@/components/ui/help-tooltip';
import { Badge } from '@/components/ui/badge';

export default function WelcomePage() {
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
          <div className="text-center mb-8">
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
