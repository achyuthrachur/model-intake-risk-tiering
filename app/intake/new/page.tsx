'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Save, Send, Check, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import {
  BUSINESS_LINES,
  REGULATORY_DOMAINS,
  type UseCaseFormData,
} from '@/lib/types';

const steps = [
  { id: 1, name: 'Overview', description: 'Basic information' },
  { id: 2, name: 'Use & Impact', description: 'Usage type and customer impact' },
  { id: 3, name: 'AI/Model Details', description: 'Technical details' },
  { id: 4, name: 'Data & Privacy', description: 'Data handling' },
  { id: 5, name: 'Controls', description: 'Monitoring and controls' },
  { id: 6, name: 'Review', description: 'Review and submit' },
];

const defaultFormData: UseCaseFormData = {
  title: '',
  businessLine: '',
  description: '',
  intendedUsers: '',
  usageType: 'Advisory',
  customerImpact: 'None',
  humanInLoop: 'Optional',
  downstreamDecisions: '',
  aiType: 'Traditional ML',
  deployment: 'Internal tool',
  vendorInvolved: false,
  vendorName: '',
  modelDefinitionTrigger: false,
  explainabilityRequired: false,
  changeFrequency: 'Quarterly',
  retraining: false,
  overridesAllowed: true,
  fallbackPlanDefined: false,
  containsPii: false,
  containsNpi: false,
  sensitiveAttributesUsed: false,
  trainingDataSource: 'Internal',
  retentionPolicyDefined: false,
  loggingRequired: false,
  accessControlsDefined: false,
  regulatoryDomains: [],
  monitoringCadence: 'Monthly',
  humanReviewProcess: '',
  incidentResponseContact: '',
};

export default function NewIntakePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<UseCaseFormData>(defaultFormData);
  const [saving, setSaving] = useState(false);

  const updateForm = (field: keyof UseCaseFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleRegulatoryDomain = (domain: string) => {
    setFormData((prev) => ({
      ...prev,
      regulatoryDomains: prev.regulatoryDomains.includes(domain)
        ? prev.regulatoryDomains.filter((d) => d !== domain)
        : [...prev.regulatoryDomains, domain],
    }));
  };

  const saveAsDraft = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/usecases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save');

      const useCase = await response.json();
      toast({ title: 'Saved', description: 'Use case saved as draft' });
      router.push(`/usecase/${useCase.id}`);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save use case', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const submitForReview = async () => {
    try {
      setSaving(true);

      // First create the use case
      const createResponse = await fetch('/api/usecases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!createResponse.ok) throw new Error('Failed to create');

      const useCase = await createResponse.json();

      // Then submit it
      const submitResponse = await fetch(`/api/usecases/${useCase.id}/submit`, {
        method: 'POST',
      });

      if (!submitResponse.ok) throw new Error('Failed to submit');

      toast({ title: 'Submitted', description: 'Use case submitted for review' });
      router.push(`/usecase/${useCase.id}`);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to submit use case', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.title && formData.businessLine && formData.description;
      case 2:
        return formData.usageType && formData.customerImpact && formData.humanInLoop;
      case 3:
        return formData.aiType && formData.deployment;
      default:
        return true;
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
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-lg font-semibold text-gray-900">New Intake</h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={saveAsDraft} disabled={saving || !formData.title}>
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Stepper sidebar */}
          <div className="w-64 flex-shrink-0">
            <nav className="space-y-1">
              {steps.map((step) => {
                const isActive = step.id === currentStep;
                const isCompleted = step.id < currentStep;

                return (
                  <button
                    key={step.id}
                    onClick={() => setCurrentStep(step.id)}
                    className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : isCompleted
                        ? 'text-gray-700 hover:bg-gray-100'
                        : 'text-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    <span
                      className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium mr-3 ${
                        isActive
                          ? 'bg-primary text-white'
                          : isCompleted
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {isCompleted ? <Check className="w-4 h-4" /> : step.id}
                    </span>
                    <div>
                      <div className="font-medium text-sm">{step.name}</div>
                      <div className="text-xs text-gray-500">{step.description}</div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Form content */}
          <div className="flex-1">
            <Card>
              <CardHeader>
                <CardTitle>{steps[currentStep - 1].name}</CardTitle>
                <CardDescription>{steps[currentStep - 1].description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Step 1: Overview */}
                {currentStep === 1 && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        placeholder="Enter a descriptive title for this use case"
                        value={formData.title}
                        onChange={(e) => updateForm('title', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="businessLine">Business Line *</Label>
                      <Select
                        value={formData.businessLine}
                        onValueChange={(value) => updateForm('businessLine', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select business line" />
                        </SelectTrigger>
                        <SelectContent>
                          {BUSINESS_LINES.map((line) => (
                            <SelectItem key={line} value={line}>
                              {line}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe the use case, its purpose, and expected outcomes"
                        rows={4}
                        value={formData.description}
                        onChange={(e) => updateForm('description', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="intendedUsers">Intended Users</Label>
                      <Input
                        id="intendedUsers"
                        placeholder="Who will use this system?"
                        value={formData.intendedUsers || ''}
                        onChange={(e) => updateForm('intendedUsers', e.target.value)}
                      />
                    </div>
                  </>
                )}

                {/* Step 2: Use & Impact */}
                {currentStep === 2 && (
                  <>
                    <div className="space-y-3">
                      <Label>Usage Type *</Label>
                      <RadioGroup
                        value={formData.usageType}
                        onValueChange={(value) => updateForm('usageType', value)}
                      >
                        <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                          <RadioGroupItem value="Decisioning" id="decisioning" />
                          <div>
                            <Label htmlFor="decisioning" className="font-medium">Decisioning</Label>
                            <p className="text-sm text-gray-500">Automated decisions affecting customers or operations</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                          <RadioGroupItem value="Advisory" id="advisory" />
                          <div>
                            <Label htmlFor="advisory" className="font-medium">Advisory</Label>
                            <p className="text-sm text-gray-500">Recommendations reviewed by humans before action</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                          <RadioGroupItem value="Automation" id="automation" />
                          <div>
                            <Label htmlFor="automation" className="font-medium">Automation</Label>
                            <p className="text-sm text-gray-500">Process automation without decision-making impact</p>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-3">
                      <Label>Customer Impact *</Label>
                      <RadioGroup
                        value={formData.customerImpact}
                        onValueChange={(value) => updateForm('customerImpact', value)}
                      >
                        <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                          <RadioGroupItem value="Direct" id="direct" />
                          <Label htmlFor="direct">Direct - Customers directly affected by outputs</Label>
                        </div>
                        <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                          <RadioGroupItem value="Indirect" id="indirect" />
                          <Label htmlFor="indirect">Indirect - Influences decisions that affect customers</Label>
                        </div>
                        <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                          <RadioGroupItem value="None" id="none" />
                          <Label htmlFor="none">None - Internal operations only</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-3">
                      <Label>Human-in-the-Loop *</Label>
                      <RadioGroup
                        value={formData.humanInLoop}
                        onValueChange={(value) => updateForm('humanInLoop', value)}
                      >
                        <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                          <RadioGroupItem value="Required" id="hitl-required" />
                          <Label htmlFor="hitl-required">Required - Human review before any action</Label>
                        </div>
                        <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                          <RadioGroupItem value="Optional" id="hitl-optional" />
                          <Label htmlFor="hitl-optional">Optional - Human can review/override if needed</Label>
                        </div>
                        <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                          <RadioGroupItem value="None" id="hitl-none" />
                          <Label htmlFor="hitl-none">None - Fully automated</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="downstreamDecisions">Downstream Decisions Affected</Label>
                      <Textarea
                        id="downstreamDecisions"
                        placeholder="What business decisions or processes are affected by this use case?"
                        value={formData.downstreamDecisions || ''}
                        onChange={(e) => updateForm('downstreamDecisions', e.target.value)}
                      />
                    </div>
                  </>
                )}

                {/* Step 3: AI/Model Details */}
                {currentStep === 3 && (
                  <>
                    <div className="space-y-3">
                      <Label>AI/ML Type *</Label>
                      <RadioGroup
                        value={formData.aiType}
                        onValueChange={(value) => updateForm('aiType', value)}
                      >
                        <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                          <RadioGroupItem value="Traditional ML" id="ml" />
                          <div>
                            <Label htmlFor="ml" className="font-medium">Traditional ML</Label>
                            <p className="text-sm text-gray-500">Statistical/machine learning models (regression, classification, etc.)</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                          <RadioGroupItem value="GenAI" id="genai" />
                          <div>
                            <Label htmlFor="genai" className="font-medium">GenAI</Label>
                            <p className="text-sm text-gray-500">Large language models, generative AI systems</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                          <RadioGroupItem value="Hybrid" id="hybrid" />
                          <div>
                            <Label htmlFor="hybrid" className="font-medium">Hybrid</Label>
                            <p className="text-sm text-gray-500">Combination of ML and GenAI components</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                          <RadioGroupItem value="Rules" id="rules" />
                          <div>
                            <Label htmlFor="rules" className="font-medium">Rules-Based</Label>
                            <p className="text-sm text-gray-500">Deterministic rules without ML/AI</p>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="space-y-2">
                      <Label>Deployment *</Label>
                      <Select
                        value={formData.deployment}
                        onValueChange={(value) => updateForm('deployment', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Internal tool">Internal tool</SelectItem>
                          <SelectItem value="Customer-facing">Customer-facing</SelectItem>
                          <SelectItem value="3rd-party">3rd-party integration</SelectItem>
                          <SelectItem value="Embedded">Embedded in product</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label>Vendor/3rd Party Involved</Label>
                        <p className="text-sm text-gray-500">Is this model provided by or depends on a third-party vendor?</p>
                      </div>
                      <Switch
                        checked={formData.vendorInvolved}
                        onCheckedChange={(checked) => updateForm('vendorInvolved', checked)}
                      />
                    </div>

                    {formData.vendorInvolved && (
                      <div className="space-y-2">
                        <Label htmlFor="vendorName">Vendor Name</Label>
                        <Input
                          id="vendorName"
                          placeholder="Enter vendor name"
                          value={formData.vendorName || ''}
                          onChange={(e) => updateForm('vendorName', e.target.value)}
                        />
                      </div>
                    )}

                    <div className="space-y-4 pt-4 border-t">
                      <h4 className="font-medium">Model Characteristics</h4>

                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <Label>Influences Business Decisions</Label>
                          <p className="text-sm text-gray-500">Does the output directly influence business decisions?</p>
                        </div>
                        <Switch
                          checked={formData.modelDefinitionTrigger}
                          onCheckedChange={(checked) => updateForm('modelDefinitionTrigger', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <Label>Explainability Required</Label>
                          <p className="text-sm text-gray-500">Is model explainability a business or regulatory requirement?</p>
                        </div>
                        <Switch
                          checked={formData.explainabilityRequired}
                          onCheckedChange={(checked) => updateForm('explainabilityRequired', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <Label>Fallback Plan Defined</Label>
                          <p className="text-sm text-gray-500">Is there a documented fallback if the model fails?</p>
                        </div>
                        <Switch
                          checked={formData.fallbackPlanDefined}
                          onCheckedChange={(checked) => updateForm('fallbackPlanDefined', checked)}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Step 4: Data & Privacy */}
                {currentStep === 4 && (
                  <>
                    <div className="space-y-4">
                      <h4 className="font-medium">Data Sensitivity</h4>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <Label>Contains PII</Label>
                          <p className="text-sm text-gray-500">Personally Identifiable Information (name, SSN, address, etc.)</p>
                        </div>
                        <Switch
                          checked={formData.containsPii}
                          onCheckedChange={(checked) => updateForm('containsPii', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <Label>Contains NPI</Label>
                          <p className="text-sm text-gray-500">Non-Public Personal Information (financial data, account numbers)</p>
                        </div>
                        <Switch
                          checked={formData.containsNpi}
                          onCheckedChange={(checked) => updateForm('containsNpi', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <Label>Sensitive Attributes Used</Label>
                          <p className="text-sm text-gray-500">Age, gender, race, ethnicity, or other protected characteristics</p>
                        </div>
                        <Switch
                          checked={formData.sensitiveAttributesUsed}
                          onCheckedChange={(checked) => updateForm('sensitiveAttributesUsed', checked)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Training Data Source</Label>
                      <Select
                        value={formData.trainingDataSource || ''}
                        onValueChange={(value) => updateForm('trainingDataSource', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select data source" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Internal">Internal</SelectItem>
                          <SelectItem value="Vendor">Vendor-provided</SelectItem>
                          <SelectItem value="Public">Public datasets</SelectItem>
                          <SelectItem value="Unknown">Unknown</SelectItem>
                          <SelectItem value="N/A">N/A</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                      <h4 className="font-medium">Data Controls</h4>

                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <Label>Retention Policy Defined</Label>
                        <Switch
                          checked={formData.retentionPolicyDefined}
                          onCheckedChange={(checked) => updateForm('retentionPolicyDefined', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <Label>Logging Required</Label>
                        <Switch
                          checked={formData.loggingRequired}
                          onCheckedChange={(checked) => updateForm('loggingRequired', checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <Label>Access Controls Defined</Label>
                        <Switch
                          checked={formData.accessControlsDefined}
                          onCheckedChange={(checked) => updateForm('accessControlsDefined', checked)}
                        />
                      </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t">
                      <Label>Regulatory Domains</Label>
                      <p className="text-sm text-gray-500">Select all applicable regulatory domains</p>
                      <div className="grid grid-cols-2 gap-2">
                        {REGULATORY_DOMAINS.map((domain) => (
                          <div
                            key={domain}
                            className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50"
                          >
                            <Checkbox
                              id={domain}
                              checked={formData.regulatoryDomains.includes(domain)}
                              onCheckedChange={() => toggleRegulatoryDomain(domain)}
                            />
                            <Label htmlFor={domain} className="text-sm cursor-pointer">
                              {domain}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Step 5: Controls & Monitoring */}
                {currentStep === 5 && (
                  <>
                    <div className="space-y-2">
                      <Label>Monitoring Cadence</Label>
                      <Select
                        value={formData.monitoringCadence || ''}
                        onValueChange={(value) => updateForm('monitoringCadence', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select monitoring frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Daily">Daily</SelectItem>
                          <SelectItem value="Weekly">Weekly</SelectItem>
                          <SelectItem value="Monthly">Monthly</SelectItem>
                          <SelectItem value="Quarterly">Quarterly</SelectItem>
                          <SelectItem value="None">None</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="humanReviewProcess">Human Review Process</Label>
                      <Textarea
                        id="humanReviewProcess"
                        placeholder="Describe the human review process for model outputs"
                        value={formData.humanReviewProcess || ''}
                        onChange={(e) => updateForm('humanReviewProcess', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="incidentResponseContact">Incident Response Contact</Label>
                      <Input
                        id="incidentResponseContact"
                        placeholder="Email or contact for incidents"
                        value={formData.incidentResponseContact || ''}
                        onChange={(e) => updateForm('incidentResponseContact', e.target.value)}
                      />
                    </div>
                  </>
                )}

                {/* Step 6: Review */}
                {currentStep === 6 && (
                  <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">Ready to Submit</h4>
                      <p className="text-sm text-blue-800">
                        Review the information below. Once submitted, the system will analyze your use case
                        and generate a risk tier assignment with required artifacts.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="border rounded-lg p-4">
                        <h5 className="font-medium text-gray-700 mb-2">Overview</h5>
                        <dl className="grid grid-cols-2 gap-2 text-sm">
                          <dt className="text-gray-500">Title:</dt>
                          <dd>{formData.title}</dd>
                          <dt className="text-gray-500">Business Line:</dt>
                          <dd>{formData.businessLine}</dd>
                          <dt className="text-gray-500">Description:</dt>
                          <dd className="col-span-2">{formData.description}</dd>
                        </dl>
                      </div>

                      <div className="border rounded-lg p-4">
                        <h5 className="font-medium text-gray-700 mb-2">Use & Impact</h5>
                        <dl className="grid grid-cols-2 gap-2 text-sm">
                          <dt className="text-gray-500">Usage Type:</dt>
                          <dd>{formData.usageType}</dd>
                          <dt className="text-gray-500">Customer Impact:</dt>
                          <dd>{formData.customerImpact}</dd>
                          <dt className="text-gray-500">Human-in-Loop:</dt>
                          <dd>{formData.humanInLoop}</dd>
                        </dl>
                      </div>

                      <div className="border rounded-lg p-4">
                        <h5 className="font-medium text-gray-700 mb-2">AI/Model Details</h5>
                        <dl className="grid grid-cols-2 gap-2 text-sm">
                          <dt className="text-gray-500">AI Type:</dt>
                          <dd>{formData.aiType}</dd>
                          <dt className="text-gray-500">Deployment:</dt>
                          <dd>{formData.deployment}</dd>
                          <dt className="text-gray-500">Vendor Involved:</dt>
                          <dd>{formData.vendorInvolved ? `Yes - ${formData.vendorName}` : 'No'}</dd>
                        </dl>
                      </div>

                      <div className="border rounded-lg p-4">
                        <h5 className="font-medium text-gray-700 mb-2">Data & Privacy</h5>
                        <dl className="grid grid-cols-2 gap-2 text-sm">
                          <dt className="text-gray-500">Contains PII:</dt>
                          <dd>{formData.containsPii ? 'Yes' : 'No'}</dd>
                          <dt className="text-gray-500">Contains NPI:</dt>
                          <dd>{formData.containsNpi ? 'Yes' : 'No'}</dd>
                          <dt className="text-gray-500">Sensitive Attributes:</dt>
                          <dd>{formData.sensitiveAttributesUsed ? 'Yes' : 'No'}</dd>
                          <dt className="text-gray-500">Regulatory Domains:</dt>
                          <dd>{formData.regulatoryDomains.join(', ') || 'None'}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                    disabled={currentStep === 1}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>

                  {currentStep < 6 ? (
                    <Button
                      onClick={() => setCurrentStep((prev) => Math.min(6, prev + 1))}
                      disabled={!canProceed()}
                    >
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button onClick={submitForReview} disabled={saving}>
                      <Send className="w-4 h-4 mr-2" />
                      Submit for Review
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
