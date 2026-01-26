'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BarChart3, CheckCircle, AlertCircle, RefreshCw, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';

export default function AdminPage() {
  const { toast } = useToast();
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/config');
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load configuration', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="h-6 w-px bg-gray-200" />
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-lg font-semibold text-gray-900">Admin: Rules & Artifacts</h1>
              </div>
            </div>
            <Button variant="outline" onClick={fetchConfig}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Reload Config
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Validation Status */}
            <Card>
              <CardHeader>
                <CardTitle>Configuration Validation</CardTitle>
                <CardDescription>
                  Status of the loaded YAML configuration files
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-4 rounded-lg ${config?.validation?.rules?.valid ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className="flex items-center">
                      {config?.validation?.rules?.valid ? (
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                      )}
                      <span className="font-medium">rules.yaml</span>
                    </div>
                    {config?.validation?.rules?.errors?.length > 0 && (
                      <ul className="mt-2 text-sm text-red-600">
                        {config.validation.rules.errors.map((err: string, i: number) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className={`p-4 rounded-lg ${config?.validation?.artifacts?.valid ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className="flex items-center">
                      {config?.validation?.artifacts?.valid ? (
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                      )}
                      <span className="font-medium">artifacts.yaml</span>
                    </div>
                    {config?.validation?.artifacts?.errors?.length > 0 && (
                      <ul className="mt-2 text-sm text-red-600">
                        {config.validation.artifacts.errors.map((err: string, i: number) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  Last loaded: {config?.lastUpdated ? new Date(config.lastUpdated).toLocaleString() : 'Unknown'}
                </p>
              </CardContent>
            </Card>

            {/* Tiers */}
            <Card>
              <CardHeader>
                <CardTitle>Tier Definitions</CardTitle>
                <CardDescription>
                  Configured risk tiers and their properties
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {config?.rules?.tiers && Object.entries(config.rules.tiers).map(([key, tier]: [string, any]) => (
                    <div key={key} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-lg">{key}</span>
                        <Badge className={
                          key === 'T1' ? 'bg-green-100 text-green-800' :
                          key === 'T2' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                        }>
                          {tier.name}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{tier.description}</p>
                      <p className="text-xs text-gray-400 mt-2">Severity: {tier.severity}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Rules Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Rules Summary</CardTitle>
                <CardDescription>
                  {config?.rules?.rules?.length || 0} rules loaded
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {config?.rules?.rules?.map((rule: any) => (
                    <div key={rule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <Badge className={
                          rule.tier === 'T1' ? 'bg-green-100 text-green-800 mr-3' :
                          rule.tier === 'T2' ? 'bg-amber-100 text-amber-800 mr-3' : 'bg-red-100 text-red-800 mr-3'
                        }>
                          {rule.tier}
                        </Badge>
                        <div>
                          <div className="font-medium text-sm">{rule.name}</div>
                          <div className="text-xs text-gray-500">{rule.id}</div>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">
                        +{rule.effects?.addRequiredArtifacts?.length || 0} artifacts
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Artifacts Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Artifacts Summary</CardTitle>
                <CardDescription>
                  {Object.keys(config?.artifacts?.artifacts || {}).length} artifacts defined
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {config?.artifacts?.categories && Object.entries(config.artifacts.categories)
                    .sort(([, a]: any, [, b]: any) => a.order - b.order)
                    .map(([category, info]: [string, any]) => {
                      const count = Object.values(config.artifacts.artifacts || {})
                        .filter((a: any) => a.category === category).length;
                      return (
                        <div key={category} className="p-3 border rounded-lg">
                          <div className="font-medium text-sm">{category}</div>
                          <div className="text-xs text-gray-500">{count} artifacts</div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
