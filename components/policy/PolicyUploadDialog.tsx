'use client';

import { useState } from 'react';
import { Upload, FileText, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface SyntheticPolicy {
  id: string;
  name: string;
  description: string;
}

interface PolicyUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPolicyLoaded: (policyId: string) => void;
}

export function PolicyUploadDialog({
  open,
  onOpenChange,
  onPolicyLoaded,
}: PolicyUploadDialogProps) {
  const [activeTab, setActiveTab] = useState('synthetic');
  const [loading, setLoading] = useState(false);
  const [syntheticPolicies, setSyntheticPolicies] = useState<SyntheticPolicy[]>([
    {
      id: 'current',
      name: 'Current Policy (v1.0)',
      description: 'Current active policy matching existing tiering rules (T3=12mo, T2=24mo, T1=36mo)'
    },
    {
      id: 'updated',
      name: 'Updated Policy (v2.0)',
      description: 'Enhanced policy with stricter validation frequencies (T3=6mo, T2=12mo, T1=24mo) and new T3 elevation rules'
    }
  ]);
  const [selectedSynthetic, setSelectedSynthetic] = useState<string | null>(null);
  const [pastedContent, setPastedContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Fetch synthetic policies when dialog opens (uses preloaded defaults above)
  const fetchSyntheticPolicies = async () => {
    try {
      const res = await fetch('/api/policy/synthetic');
      if (res.ok) {
        const data = await res.json();
        if (data.policies && data.policies.length > 0) {
          setSyntheticPolicies(data.policies);
        }
      }
    } catch (err) {
      console.error('Failed to fetch synthetic policies:', err);
      // Keep using the default policies initialized above
    }
  };

  // Handle dialog open
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      fetchSyntheticPolicies();
    }
    setError(null);
    onOpenChange(newOpen);
  };

  // Load synthetic policy
  const handleLoadSynthetic = async () => {
    if (!selectedSynthetic) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/policy/synthetic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policyType: selectedSynthetic }),
      });

      if (!res.ok) {
        throw new Error('Failed to load policy');
      }

      const data = await res.json();
      onPolicyLoaded(data.policy.id);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load policy');
    } finally {
      setLoading(false);
    }
  };

  // Create policy from pasted content
  const handleCreateFromContent = async () => {
    if (!pastedContent.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Uploaded Policy',
          description: 'Policy created from uploaded content',
          documentContent: pastedContent,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to create policy');
      }

      const data = await res.json();
      onPolicyLoaded(data.policy.id);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create policy');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Load Policy Document
          </DialogTitle>
          <DialogDescription>
            Select a synthetic policy for demo or paste your own policy content.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="synthetic">
              <Sparkles className="h-4 w-4 mr-2" />
              Demo Policies
            </TabsTrigger>
            <TabsTrigger value="upload">
              <Upload className="h-4 w-4 mr-2" />
              Upload Content
            </TabsTrigger>
          </TabsList>

          <TabsContent value="synthetic" className="space-y-4 pt-4">
            <div className="space-y-3">
              {syntheticPolicies.map((policy) => (
                <div
                  key={policy.id}
                  onClick={() => setSelectedSynthetic(policy.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedSynthetic === policy.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">{policy.name}</div>
                  <div className="text-sm text-gray-600 mt-1">{policy.description}</div>
                </div>
              ))}
            </div>

            {selectedSynthetic === 'updated' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                <strong>Demo Note:</strong> The updated policy has stricter validation
                frequencies and new T3 elevation rules. Use this to demonstrate how policy
                changes affect your model inventory.
              </div>
            )}
          </TabsContent>

          <TabsContent value="upload" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="policy-content">Policy Content</Label>
              <Textarea
                id="policy-content"
                placeholder="Paste your Model Risk Management policy content here..."
                value={pastedContent}
                onChange={(e) => setPastedContent(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />
              <p className="text-xs text-gray-500">
                The policy should include risk tier definitions, validation frequencies,
                and tier assignment criteria in a structured format.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {activeTab === 'synthetic' ? (
            <Button
              onClick={handleLoadSynthetic}
              disabled={!selectedSynthetic || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load Policy'
              )}
            </Button>
          ) : (
            <Button
              onClick={handleCreateFromContent}
              disabled={!pastedContent.trim() || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Policy'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
