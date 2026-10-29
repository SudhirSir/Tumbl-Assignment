import React from 'react';
import { ShieldCheck, MessageSquare, Table, Sparkles, Coins } from 'lucide-react';

interface NavbarProps {
  activeTab: 'apply' | 'agent' | 'admin';
  setActiveTab: (tab: 'apply' | 'agent' | 'admin') => void;
  goldRate: number;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, goldRate }) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50 shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('apply')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/20">
              <Coins className="w-5 h-5 text-slate-900" />
            </div>
            <div>
              <div className="font-bold text-lg leading-tight flex items-center gap-2">
                <span>GoldLoan</span>
                <span className="text-xs bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded font-semibold tracking-wider uppercase">Pro</span>
              </div>
              <p className="text-xs text-slate-400">TGlobal Field Intake Portal</p>
            </div>
          </div>

          {/* 24K Gold Rate Badge */}
          <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700/80 px-2.5 py-1 rounded-full text-xs font-medium text-amber-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>24K Rate: ₹{goldRate.toLocaleString('en-IN')}/g</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 w-full sm:w-auto justify-center">
          <button
            onClick={() => setActiveTab('apply')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'apply'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Apply Portal</span>
          </button>

          <button
            onClick={() => setActiveTab('agent')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'agent'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>AI Assistant</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
              <Sparkles className="w-2.5 h-2.5" /> 3 Tools
            </span>
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'admin'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Admin Leads</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
