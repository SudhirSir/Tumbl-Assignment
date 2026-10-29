import React from 'react';
import { ArrowLeft, ArrowRight, Check, Coins, Percent, Clock, AlertTriangle } from 'lucide-react';
import { FullQuoteResult } from '../services/api';

interface Step2Props {
  quote: FullQuoteResult | null;
  loading: boolean;
  error: string | null;
  selectedPlanId: string;
  onSelectPlan: (planId: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export const Step2Quote: React.FC<Step2Props> = ({
  quote,
  loading,
  error,
  selectedPlanId,
  onSelectPlan,
  onBack,
  onNext,
}) => {
  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200">
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold mb-2">
          <span>Step 2 of 3</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Live Valuation & Eligible Loan Plans</h2>
        <p className="text-slate-500 text-sm mt-1">
          Exact financial maths calculated by server. Choose the repayment plan that fits your needs.
        </p>
      </div>

      {loading && (
        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200/60 my-4">
          <div className="inline-block w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm font-medium text-slate-700">Calculating real-time valuation and loan eligibility...</p>
          <p className="text-xs text-slate-400 mt-1">Debouncing calculations at 300ms</p>
        </div>
      )}

      {error && !loading && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-start gap-3 my-4">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Calculation Error</div>
            <div>{error}</div>
          </div>
        </div>
      )}

      {quote && !loading && (
        <div className="space-y-6">
          {/* Gold Valuation Summary Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-2xs">
              <span className="text-xs text-slate-400 block font-medium">Net Weight & Karat</span>
              <span className="text-lg font-bold text-slate-800">
                {quote.netWeightGrams}g · {quote.karat}K
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">Gross: {quote.grossWeightGrams}g</span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-2xs">
              <span className="text-xs text-slate-400 block font-medium">Pure 24K Content</span>
              <span className="text-lg font-bold text-amber-700">
                {quote.pureGoldGrams} g
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Formula: {quote.netWeightGrams} × ({quote.karat}/24)
              </span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-2xs">
              <span className="text-xs text-slate-400 block font-medium">Market Valuation (24K)</span>
              <span className="text-lg font-bold text-emerald-700">
                ₹{quote.goldValue.toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Rate: ₹{quote.rate24kPerGram.toLocaleString('en-IN')}/g
              </span>
            </div>
          </div>

          {/* Selectable Scheme Cards */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
              Select Loan Repayment Scheme
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quote.schemes.map((scheme) => {
                const isSelected = selectedPlanId === scheme.planId;
                return (
                  <div
                    key={scheme.planId}
                    onClick={() => onSelectPlan(scheme.planId)}
                    className={`cursor-pointer rounded-2xl p-5 border-2 transition-all relative ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/50 shadow-md ring-2 ring-amber-400/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-xs">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    )}

                    <div className="flex items-center gap-2 mb-2">
                      <div className={`p-2 rounded-xl ${isSelected ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                        <Coins className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-slate-900">{scheme.name}</h4>
                        <span className="text-xs text-slate-500">{scheme.planId}</span>
                      </div>
                    </div>

                    <div className="my-4">
                      <span className="text-xs text-slate-500 font-medium block">Max Eligible Loan</span>
                      <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-baseline gap-1">
                        <span>₹{scheme.eligibleLoan.toLocaleString('en-IN')}</span>
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          {(scheme.effectiveLtv * 100).toFixed(0)}% LTV
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Percent className="w-3.5 h-3.5 text-amber-600" />
                        <span>{scheme.interestRate}% Interest p.a.</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>{scheme.tenureMonths} Months Tenure</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Footer */}
      <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm text-slate-700 hover:bg-slate-100 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Details</span>
        </button>

        <button
          type="button"
          disabled={!selectedPlanId || loading || Boolean(error)}
          onClick={onNext}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md ${
            selectedPlanId && !loading && !error
              ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/20 cursor-pointer'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
          }`}
        >
          <span>Review & Submit</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
