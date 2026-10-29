import React from 'react';
import { ArrowLeft, CheckCircle2, AlertTriangle, ShieldCheck, User, Phone, RefreshCw } from 'lucide-react';
import { FormValues } from './Step1Details';
import { FullQuoteResult, ApiError } from '../services/api';

interface Step3Props {
  values: FormValues;
  quote: FullQuoteResult;
  submitting: boolean;
  submissionError: ApiError | null;
  submittedData: any | null;
  onSubmit: () => void;
  onBack: () => void;
  onReset: () => void;
}

export const Step3Confirm: React.FC<Step3Props> = ({
  values,
  quote,
  submitting,
  submissionError,
  submittedData,
  onSubmit,
  onBack,
  onReset,
}) => {
  const selectedScheme = quote.schemes.find((s) => s.planId === values.planId);

  // If submitted successfully, show clear success screen
  if (submittedData) {
    return (
      <div className="bg-white rounded-2xl p-6 sm:p-10 shadow-sm border border-slate-200 text-center">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Application Submitted!</h2>
        <p className="text-slate-500 text-sm mt-1">
          Your gold loan intake request has been registered and verified by the server.
        </p>

        {/* Application ID Badge */}
        <div className="my-6 inline-block bg-slate-900 text-white rounded-2xl px-6 py-4 shadow-lg shadow-slate-950/10">
          <span className="text-xs text-slate-400 block uppercase tracking-wider font-semibold">Application Reference ID</span>
          <span className="text-2xl sm:text-3xl font-mono font-bold text-amber-400">{submittedData.applicationId}</span>
          <span className="text-xs text-emerald-400 block mt-1">Status: {submittedData.status}</span>
        </div>

        {/* Summary Card */}
        <div className="max-w-md mx-auto text-left bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-3 text-sm">
          <div className="flex justify-between border-b border-slate-200/60 pb-2">
            <span className="text-slate-500">Applicant:</span>
            <span className="font-semibold text-slate-900">{submittedData.applicantName}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200/60 pb-2">
            <span className="text-slate-500">Registered Mobile:</span>
            <span className="font-mono font-semibold text-slate-900">{submittedData.maskedMobile}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200/60 pb-2">
            <span className="text-slate-500">Net Weight & Karat:</span>
            <span className="font-semibold text-slate-900">{submittedData.netWeightGrams}g ({submittedData.karat}K)</span>
          </div>
          <div className="flex justify-between border-b border-slate-200/60 pb-2">
            <span className="text-slate-500">Pure Gold Content:</span>
            <span className="font-semibold text-slate-900">{submittedData.pureGoldGrams}g</span>
          </div>
          <div className="flex justify-between border-b border-slate-200/60 pb-2">
            <span className="text-slate-500">Chosen Scheme:</span>
            <span className="font-semibold text-slate-900">{submittedData.planName}</span>
          </div>
          <div className="flex justify-between pt-1">
            <span className="text-slate-700 font-bold">Eligible Loan Amount:</span>
            <span className="text-lg font-bold text-emerald-700">₹{submittedData.eligibleLoan.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onReset}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-sm transition-all shadow-md shadow-amber-500/20"
          >
            Submit Another Application
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200">
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold mb-2">
          <span>Step 3 of 3</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Review & Confirm Application</h2>
        <p className="text-slate-500 text-sm mt-1">
          Please verify all details before submitting. Once submitted, duplicates for the same mobile are prevented for 7 days.
        </p>
      </div>

      {/* Friendly 409 Conflict Banner or API Error */}
      {submissionError && (
        <div className="mb-6 p-4 rounded-xl border bg-amber-50/70 border-amber-300 text-amber-950 text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-amber-900">
              {submissionError.code === 'DUPLICATE_APPLICATION' ? 'Existing Application Detected' : 'Application Submission Error'}
            </div>
            <div>{submissionError.message}</div>
            {submissionError.existingApplicationId && (
              <div className="text-xs text-amber-800 font-medium">
                Reference ID: <span className="font-mono font-bold">{submissionError.existingApplicationId}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Review Details Card */}
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white rounded-xl text-slate-600 shadow-2xs border border-slate-100">
              <User className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Applicant Name</span>
              <span className="font-bold text-slate-800">{values.applicantName}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white rounded-xl text-slate-600 shadow-2xs border border-slate-100">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Indian Mobile</span>
              <span className="font-bold text-slate-800 font-mono">
                {values.mobileNumber.slice(0, 4)}XXXX{values.mobileNumber.slice(-2)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-slate-200">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Gross / Net Weight</span>
            <span className="font-semibold text-slate-800">{values.grossWeightGrams}g gross / {values.netWeightGrams}g net</span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block font-medium">Purity</span>
            <span className="font-semibold text-slate-800">{values.karat} Karat ({quote.pureGoldGrams}g pure)</span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block font-medium">Market Value @ ₹{quote.rate24kPerGram}/g</span>
            <span className="font-semibold text-slate-800">₹{quote.goldValue.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Selected Plan Highlight */}
        {selectedScheme && (
          <div className="p-4 bg-white rounded-xl border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div>
              <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider block">Chosen Scheme</span>
              <h4 className="font-bold text-slate-900 text-base">{selectedScheme.name}</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedScheme.interestRate}% interest p.a. · {selectedScheme.tenureMonths} months tenure
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Sanctioned Loan</span>
              <span className="text-2xl font-extrabold text-emerald-700">₹{selectedScheme.eligibleLoan.toLocaleString('en-IN')}</span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Plans</span>
        </button>

        <button
          type="button"
          disabled={submitting}
          onClick={onSubmit}
          className="flex items-center gap-2 px-7 py-3 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
        >
          {submitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Submitting Application...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-5 h-5" />
              <span>Confirm & Submit Application</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
