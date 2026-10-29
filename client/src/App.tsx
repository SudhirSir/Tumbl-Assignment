import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Step1Details, FormValues, FormErrors } from './components/Step1Details';
import { Step2Quote } from './components/Step2Quote';
import { Step3Confirm } from './components/Step3Confirm';
import { ChatPanel } from './components/ChatPanel';
import { AdminTable } from './components/AdminTable';
import {
  fetchLoanSchemes,
  fetchGoldRate,
  calculateQuote,
  submitLead,
  LoanScheme,
  FullQuoteResult,
  ApiError,
} from './services/api';

export function App() {
  const [activeTab, setActiveTab] = useState<'apply' | 'agent' | 'admin'>('apply');
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Global Config / Master Data
  const [schemes, setSchemes] = useState<LoanScheme[]>([]);
  const [goldRate, setGoldRate] = useState<number>(7000);

  // Form State
  const [formValues, setFormValues] = useState<FormValues>({
    applicantName: '',
    mobileNumber: '',
    grossWeightGrams: '',
    netWeightGrams: '',
    karat: 22,
    planId: '',
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isStep1Valid, setIsStep1Valid] = useState<boolean>(false);

  // Quote State
  const [quote, setQuote] = useState<FullQuoteResult | null>(null);
  const [quoteLoading, setQuoteLoading] = useState<boolean>(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  // Submission State
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<ApiError | null>(null);
  const [submittedData, setSubmittedData] = useState<any | null>(null);

  // Initial Load: Schemes & Gold Rate
  useEffect(() => {
    fetchLoanSchemes()
      .then((data) => {
        setSchemes(data);
        if (data.length > 0 && !formValues.planId) {
          // Default to EMI plan if available
          const defaultPlan = data.find((s) => s.id === 'PLAN_EMI_01') || data[0];
          setFormValues((prev) => ({ ...prev, planId: defaultPlan.id }));
        }
      })
      .catch((err) => console.error('Failed to load schemes:', err));

    fetchGoldRate()
      .then((data) => setGoldRate(data.rate24kPerGram))
      .catch((err) => console.error('Failed to load gold rate:', err));
  }, []);

  // Validate Step 1 as user types
  useEffect(() => {
    const errors: FormErrors = {};
    const { applicantName, mobileNumber, grossWeightGrams, netWeightGrams } = formValues;

    if (applicantName) {
      if (applicantName.length < 2) {
        errors.applicantName = 'Name must be at least 2 characters';
      } else if (applicantName.length > 60) {
        errors.applicantName = 'Name cannot exceed 60 characters';
      } else if (!/^[a-zA-Z\s]+$/.test(applicantName)) {
        errors.applicantName = 'Name can only contain letters and spaces';
      }
    }

    if (mobileNumber) {
      if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
        errors.mobileNumber = 'Must be a valid 10-digit Indian mobile starting with 6-9';
      }
    }

    const gross = parseFloat(grossWeightGrams);
    const net = parseFloat(netWeightGrams);

    if (grossWeightGrams) {
      if (isNaN(gross) || gross <= 0) {
        errors.grossWeightGrams = 'Gross weight must be greater than 0';
      } else if (gross > 1000) {
        errors.grossWeightGrams = 'Gross weight cannot exceed 1000g';
      }
    }

    if (netWeightGrams) {
      if (isNaN(net) || net <= 0) {
        errors.netWeightGrams = 'Net weight must be greater than 0';
      } else if (net > 1000) {
        errors.netWeightGrams = 'Net weight cannot exceed 1000g';
      } else if (gross && net > gross) {
        errors.netWeightGrams = 'Net weight cannot exceed gross weight';
      }
    }

    setFormErrors(errors);

    const valid = Boolean(
      applicantName &&
        mobileNumber &&
        grossWeightGrams &&
        netWeightGrams &&
        Object.keys(errors).length === 0
    );

    setIsStep1Valid(valid);
  }, [formValues]);

  // Debounced Quote Calculation (~300 ms as specified)
  useEffect(() => {
    const gross = parseFloat(formValues.grossWeightGrams);
    const net = parseFloat(formValues.netWeightGrams);

    if (gross > 0 && net > 0 && net <= gross && gross <= 1000) {
      setQuoteLoading(true);
      setQuoteError(null);

      const handler = setTimeout(() => {
        calculateQuote({
          grossWeightGrams: gross,
          netWeightGrams: net,
          karat: formValues.karat,
        })
          .then((result) => {
            setQuote(result);
            setQuoteLoading(false);
          })
          .catch((err: any) => {
            setQuoteError(err.message || 'Failed to calculate quote');
            setQuoteLoading(false);
          });
      }, 300);

      return () => clearTimeout(handler);
    }
  }, [formValues.grossWeightGrams, formValues.netWeightGrams, formValues.karat]);

  const handleFieldChange = (field: keyof FormValues, val: any) => {
    setFormValues((prev) => ({ ...prev, [field]: val }));
    // Clear submission errors when editing
    setSubmissionError(null);
  };

  const handleSubmitApplication = async () => {
    setSubmitting(true);
    setSubmissionError(null);

    try {
      // Optional Idempotency key for safe retries
      const idempotencyKey = `web-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const result = await submitLead(
        {
          applicantName: formValues.applicantName.trim(),
          mobileNumber: formValues.mobileNumber.trim(),
          grossWeightGrams: parseFloat(formValues.grossWeightGrams),
          netWeightGrams: parseFloat(formValues.netWeightGrams),
          karat: formValues.karat,
          planId: formValues.planId,
          source: 'FORM',
        },
        idempotencyKey
      );

      setSubmittedData(result);
    } catch (err: any) {
      setSubmissionError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormValues({
      applicantName: '',
      mobileNumber: '',
      grossWeightGrams: '',
      netWeightGrams: '',
      karat: 22,
      planId: schemes[0]?.id || '',
    });
    setQuote(null);
    setSubmittedData(null);
    setSubmissionError(null);
    setCurrentStep(1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} goldRate={goldRate} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        {/* TAB 1: 3-Step Guided Form Application */}
        {activeTab === 'apply' && (
          <div className="space-y-6">
            {/* Step Breadcrumbs Progress Indicator */}
            {!submittedData && (
              <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200">
                <div className="flex items-center justify-between max-w-md mx-auto">
                  {/* Step 1 */}
                  <div
                    onClick={() => setCurrentStep(1)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        currentStep === 1
                          ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-400/20'
                          : currentStep > 1
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      1
                    </div>
                    <span className={`text-xs font-semibold ${currentStep === 1 ? 'text-slate-900' : 'text-slate-500'}`}>
                      Details
                    </span>
                  </div>

                  <div className={`h-0.5 w-12 sm:w-16 ${currentStep >= 2 ? 'bg-amber-500' : 'bg-slate-200'}`} />

                  {/* Step 2 */}
                  <div
                    onClick={() => isStep1Valid && setCurrentStep(2)}
                    className={`flex items-center gap-2 ${isStep1Valid ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        currentStep === 2
                          ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-400/20'
                          : currentStep > 2
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      2
                    </div>
                    <span className={`text-xs font-semibold ${currentStep === 2 ? 'text-slate-900' : 'text-slate-500'}`}>
                      Quote & Plans
                    </span>
                  </div>

                  <div className={`h-0.5 w-12 sm:w-16 ${currentStep >= 3 ? 'bg-amber-500' : 'bg-slate-200'}`} />

                  {/* Step 3 */}
                  <div
                    onClick={() => isStep1Valid && quote && setCurrentStep(3)}
                    className={`flex items-center gap-2 ${isStep1Valid && quote ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        currentStep === 3
                          ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-400/20'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      3
                    </div>
                    <span className={`text-xs font-semibold ${currentStep === 3 ? 'text-slate-900' : 'text-slate-500'}`}>
                      Confirm
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Step Components */}
            {currentStep === 1 && (
              <Step1Details
                values={formValues}
                errors={formErrors}
                onChange={handleFieldChange}
                onNext={() => setCurrentStep(2)}
                isValid={isStep1Valid}
              />
            )}

            {currentStep === 2 && (
              <Step2Quote
                quote={quote}
                loading={quoteLoading}
                error={quoteError}
                selectedPlanId={formValues.planId}
                onSelectPlan={(planId) => handleFieldChange('planId', planId)}
                onBack={() => setCurrentStep(1)}
                onNext={() => setCurrentStep(3)}
              />
            )}

            {currentStep === 3 && quote && (
              <Step3Confirm
                values={formValues}
                quote={quote}
                submitting={submitting}
                submissionError={submissionError}
                submittedData={submittedData}
                onSubmit={handleSubmitApplication}
                onBack={() => setCurrentStep(2)}
                onReset={handleReset}
              />
            )}
          </div>
        )}

        {/* TAB 2: AI Loan Assist Agent */}
        {activeTab === 'agent' && <ChatPanel />}

        {/* TAB 3: Admin Table */}
        {activeTab === 'admin' && <AdminTable schemes={schemes} />}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 TGlobal Gold Loan Intake Portal. Production-minded architecture.</span>
          <div className="flex items-center gap-3">
            <span className="text-amber-700 font-semibold">Strict 75% LTV Cap</span>
            <span>•</span>
            <span className="text-slate-600">7-Day Duplicate Defense</span>
            <span>•</span>
            <span className="text-slate-600">Masked PII Logs</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
