'use client';

import Link from 'next/link';
import { ArrowRight, BarChart3, Shield, Brain, FileCheck, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
                AI Use Case Governance
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
              AI Governance Made Simple
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Streamline your AI/ML model intake process with automated risk tiering,
              compliance tracking, and comprehensive governance workflows.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Brain className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Smart Intake</h3>
              <p className="text-sm text-gray-600">
                AI-powered conversational intake that guides users through the submission process.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <Layers className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Risk Tiering</h3>
              <p className="text-sm text-gray-600">
                Automated risk assessment with configurable rules engine for consistent tiering.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <FileCheck className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Compliance</h3>
              <p className="text-sm text-gray-600">
                Track required artifacts, audit trails, and regulatory alignment in one place.
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <Link href="/dashboard">
            <Button size="lg" className="text-lg px-8 py-6">
              Get Started
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <p className="mt-4 text-sm text-gray-500">
            No account required. Start managing your AI use cases today.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex-shrink-0 border-t bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            Built for enterprise AI governance and model risk management
          </p>
        </div>
      </footer>
    </div>
  );
}
