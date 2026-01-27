'use client';

import Link from 'next/link';
import { ArrowRight, BarChart3, Shield, Brain, FileCheck, Layers, User, ClipboardCheck, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { HelpTooltip, HelpCard } from '@/components/ui/help-tooltip';

export default function WelcomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-purple-50">
      {/* Header */}
      <header className="flex-shrink-0 border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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

            <Link href="/manager/dashboard" className="block">
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
    </div>
  );
}
