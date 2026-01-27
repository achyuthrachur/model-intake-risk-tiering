'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowLeft, BarChart3, ClipboardList, Database, AlertTriangle, CheckCircle, Clock, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface QuickStats {
  pendingIntakes: number;
  overdueValidations: number;
  totalInventory: number;
  openFindings: number;
}

export default function ManagerWelcomePage() {
  const [stats, setStats] = useState<QuickStats>({
    pendingIntakes: 0,
    overdueValidations: 0,
    totalInventory: 0,
    openFindings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch intake stats
        const intakeRes = await fetch('/api/usecases');
        if (intakeRes.ok) {
          const intakeData = await intakeRes.json();
          const pending = intakeData.useCases?.filter(
            (uc: { status: string }) => uc.status === 'Submitted' || uc.status === 'Under Review'
          ).length || 0;
          setStats(prev => ({ ...prev, pendingIntakes: pending }));
        }

        // Fetch inventory stats
        const inventoryRes = await fetch('/api/inventory/stats');
        if (inventoryRes.ok) {
          const inventoryData = await inventoryRes.json();
          setStats(prev => ({
            ...prev,
            overdueValidations: inventoryData.validationStatus?.overdue || 0,
            totalInventory: inventoryData.totalModels || 0,
            openFindings: inventoryData.openFindings || 0,
          }));
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-purple-50">
      {/* Header */}
      <header className="flex-shrink-0 border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Model Risk Management
                </h1>
                <p className="text-sm text-gray-500">
                  Governance & Oversight Portal
                </p>
              </div>
            </div>
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto w-full">
          {/* Welcome Section */}
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Welcome, Model Risk Manager
            </h2>
            <p className="text-lg text-gray-600">
              Choose how you'd like to proceed with your governance activities.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <div className="bg-white rounded-lg p-4 shadow-sm border text-center">
              <div className="text-2xl font-bold text-blue-600">
                {loading ? '...' : stats.pendingIntakes}
              </div>
              <div className="text-xs text-gray-500">Pending Intakes</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border text-center">
              <div className={`text-2xl font-bold ${stats.overdueValidations > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {loading ? '...' : stats.overdueValidations}
              </div>
              <div className="text-xs text-gray-500">Overdue Validations</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border text-center">
              <div className="text-2xl font-bold text-purple-600">
                {loading ? '...' : stats.totalInventory}
              </div>
              <div className="text-xs text-gray-500">Models in Inventory</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border text-center">
              <div className={`text-2xl font-bold ${stats.openFindings > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                {loading ? '...' : stats.openFindings}
              </div>
              <div className="text-xs text-gray-500">Open Findings</div>
            </div>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Review Intake Forms */}
            <Link href="/manager/dashboard" className="block">
              <Card className="h-full hover:shadow-lg hover:border-blue-500/50 transition-all cursor-pointer group">
                <CardContent className="p-8">
                  <div className="flex items-start space-x-4">
                    <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                      <ClipboardList className="w-7 h-7 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Review Intake Forms
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Review submitted model use cases, generate risk assessments, and approve or send back for revision.
                      </p>
                      <div className="flex items-center space-x-4 text-sm">
                        {stats.pendingIntakes > 0 ? (
                          <span className="inline-flex items-center text-blue-600 font-medium">
                            <Inbox className="w-4 h-4 mr-1" />
                            {stats.pendingIntakes} awaiting review
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-green-600">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            All caught up
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-6">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 group-hover:bg-blue-700">
                      Go to Intake Review
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* View Model Inventory */}
            <Link href="/manager/inventory" className="block">
              <Card className="h-full hover:shadow-lg hover:border-purple-500/50 transition-all cursor-pointer group">
                <CardContent className="p-8">
                  <div className="flex items-start space-x-4">
                    <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 transition-colors">
                      <Database className="w-7 h-7 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        View Model Inventory
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Manage approved models, track validation schedules, review findings, and oversee remediation efforts.
                      </p>
                      <div className="flex items-center space-x-4 text-sm">
                        {stats.overdueValidations > 0 ? (
                          <span className="inline-flex items-center text-red-600 font-medium">
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            {stats.overdueValidations} overdue validations
                          </span>
                        ) : stats.totalInventory > 0 ? (
                          <span className="inline-flex items-center text-purple-600">
                            <Clock className="w-4 h-4 mr-1" />
                            {stats.totalInventory} models tracked
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-gray-500">
                            <Database className="w-4 h-4 mr-1" />
                            No models yet
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-6">
                    <Button className="w-full bg-purple-600 hover:bg-purple-700 group-hover:bg-purple-700">
                      Go to Inventory
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Help Text */}
          <p className="mt-8 text-center text-sm text-gray-500">
            The Intake Review manages new model submissions. The Inventory tracks approved models through their lifecycle.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex-shrink-0 border-t bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            Model Risk Management Portal
          </p>
        </div>
      </footer>
    </div>
  );
}
