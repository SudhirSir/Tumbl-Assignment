import React from 'react';
import { User, Phone, Scale, Gem, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export interface FormValues {
  applicantName: string;
  mobileNumber: string;
  grossWeightGrams: string;
  netWeightGrams: string;
  karat: number;
  planId: string;
}

export interface FormErrors {
  applicantName?: string;
  mobileNumber?: string;
  grossWeightGrams?: string;
  netWeightGrams?: string;
}

interface Step1Props {
  values: FormValues;
  errors: FormErrors;
  onChange: (field: keyof FormValues, val: any) => void;
  onNext: () => void;
  isValid: boolean;
}

export const Step1Details: React.FC<Step1Props> = ({
  values,
  errors,
  onChange,
  onNext,
  isValid,
}) => {
  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200">
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold mb-2">
          <span>Step 1 of 3</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Borrower & Jewellery Details</h2>
        <p className="text-slate-500 text-sm mt-1">
          Enter applicant information and physical appraisal weights with inline validation.
        </p>
      </div>

      <div className="space-y-5">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Applicant Full Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={values.applicantName}
              onChange={(e) => onChange('applicantName', e.target.value)}
              placeholder="e.g. Rahul Sharma"
              maxLength={60}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                errors.applicantName
                  ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200 bg-rose-50/20'
                  : values.applicantName.length >= 2
                  ? 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-200 bg-white'
                  : 'border-slate-300 focus:border-amber-500 focus:ring-amber-200 bg-white'
              }`}
            />
          </div>
          {errors.applicantName && (
            <p className="flex items-center gap-1 text-xs text-rose-600 mt-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errors.applicantName}</span>
            </p>
          )}
        </div>

        {/* Mobile Number */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Indian Mobile Number <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Phone className="w-4 h-4" />
            </div>
            <input
              type="tel"
              inputMode="numeric"
              pattern="[6-9][0-9]{9}"
              maxLength={10}
              value={values.mobileNumber}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
                onChange('mobileNumber', cleaned);
              }}
              placeholder="10-digit mobile (e.g. 9876543210)"
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                errors.mobileNumber
                  ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200 bg-rose-50/20'
                  : values.mobileNumber.length === 10
                  ? 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-200 bg-white'
                  : 'border-slate-300 focus:border-amber-500 focus:ring-amber-200 bg-white'
              }`}
            />
          </div>
          {errors.mobileNumber ? (
            <p className="flex items-center gap-1 text-xs text-rose-600 mt-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errors.mobileNumber}</span>
            </p>
          ) : (
            <p className="text-[11px] text-slate-400 mt-1">
              Must be 10 digits starting with 6, 7, 8, or 9.
            </p>
          )}
        </div>

        {/* Weights: Gross & Net */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Gross Weight (grams) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Scale className="w-4 h-4" />
              </div>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                max="1000"
                value={values.grossWeightGrams}
                onChange={(e) => onChange('grossWeightGrams', e.target.value)}
                placeholder="Total jewellery weight"
                className={`w-full pl-10 pr-8 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                  errors.grossWeightGrams
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200 bg-rose-50/20'
                    : 'border-slate-300 focus:border-amber-500 focus:ring-amber-200 bg-white'
                }`}
              />
              <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400">g</span>
            </div>
            {errors.grossWeightGrams && (
              <p className="flex items-center gap-1 text-xs text-rose-600 mt-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.grossWeightGrams}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Net Gold Weight (grams) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Scale className="w-4 h-4" />
              </div>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                max="1000"
                value={values.netWeightGrams}
                onChange={(e) => onChange('netWeightGrams', e.target.value)}
                placeholder="Excluding stones/wax"
                className={`w-full pl-10 pr-8 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                  errors.netWeightGrams
                    ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200 bg-rose-50/20'
                    : 'border-slate-300 focus:border-amber-500 focus:ring-amber-200 bg-white'
                }`}
              />
              <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400">g</span>
            </div>
            {errors.netWeightGrams && (
              <p className="flex items-center gap-1 text-xs text-rose-600 mt-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.netWeightGrams}</span>
              </p>
            )}
          </div>
        </div>

        {/* Karat Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Gold Karat Purity <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[18, 22, 24].map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => onChange('karat', k)}
                className={`py-3 px-4 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                  values.karat === k
                    ? 'border-amber-500 bg-amber-50/70 text-amber-950 ring-2 ring-amber-400/30 font-bold shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/60 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1">
                  <Gem className={`w-4 h-4 ${values.karat === k ? 'text-amber-600' : 'text-slate-400'}`} />
                  <span className="text-base">{k} Karat</span>
                </div>
                <span className="text-[11px] font-normal text-slate-500">
                  {k === 24 ? '99.9% Purity' : k === 22 ? '91.67% Purity' : '75.0% Purity'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between">
        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Server-side recalculation & duplicate protection enabled</span>
        </div>
        <button
          type="button"
          disabled={!isValid}
          onClick={onNext}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md ${
            isValid
              ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/20 cursor-pointer'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
          }`}
        >
          <span>Calculate Quotes</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
