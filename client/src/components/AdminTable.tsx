import React, { useState, useEffect } from 'react';
import { RefreshCw, Filter, ShieldCheck, CheckCircle, Clock, XCircle, Search } from 'lucide-react';
import { fetchLeads, updateLeadStatus, LeadItem, LoanScheme } from '../services/api';

interface AdminTableProps {
  schemes: LoanScheme[];
}

export const AdminTable: React.FC<AdminTableProps> = ({ schemes }) => {
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [planFilter, setPlanFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadLeads = async () => {
    setLoading(true);
    try {
      const data = await fetchLeads(planFilter || undefined);
      setLeads(data);
    } catch (err) {
      console.error('Failed to load leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, [planFilter]);

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    setUpdatingId(leadId);
    try {
      await updateLeadStatus(leadId, newStatus);
      await loadLeads();
    } catch (err: any) {
      alert(`Status update failed: ${err.message || 'Server error'}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesStatus = statusFilter ? lead.status === statusFilter : true;
    const matchesSearch = searchQuery
      ? lead.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.applicationId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.maskedMobile.includes(searchQuery)
      : true;
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle className="w-3 h-3 text-emerald-600" /> Approved
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3 text-amber-600" /> Under Review
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
            <XCircle className="w-3 h-3 text-rose-600" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            <ShieldCheck className="w-3 h-3 text-blue-600" /> Submitted
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <span>Admin Leads Management</span>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
              {filteredLeads.length} Total
            </span>
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Borrower applications submitted via portal and AI agent. Mobile numbers are securely masked.
          </p>
        </div>

        <button
          onClick={loadLeads}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, name, mobile..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-400/50"
          />
        </div>

        {/* Plan Filter */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="w-full bg-transparent focus:outline-none text-slate-700 cursor-pointer"
          >
            <option value="">All Loan Plans</option>
            {schemes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.id})
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-transparent focus:outline-none text-slate-700 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <th className="py-3 px-4">Application ID</th>
              <th className="py-3 px-4">Applicant</th>
              <th className="py-3 px-4">Masked Mobile</th>
              <th className="py-3 px-4">Gold Details</th>
              <th className="py-3 px-4">Sanctioned Loan</th>
              <th className="py-3 px-4">Plan</th>
              <th className="py-3 px-4">Status & Workflow</th>
              <th className="py-3 px-4">Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">
                  {loading ? 'Loading leads...' : 'No applications found matching your criteria.'}
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead) => (
                <tr key={lead.applicationId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{lead.applicationId}</td>
                  <td className="py-3 px-4 font-medium text-slate-800">{lead.applicantName}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{lead.maskedMobile}</td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-800">{lead.netWeightGrams}g</span>
                    <span className="text-slate-500"> ({lead.karat}K)</span>
                    <div className="text-[10px] text-slate-400">Pure: {lead.pureGoldGrams}g</div>
                  </td>
                  <td className="py-3 px-4 font-bold text-emerald-700">₹{lead.eligibleLoan.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 text-slate-700 font-medium">{lead.planName}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(lead.status)}
                      <select
                        disabled={updatingId === lead.applicationId}
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.applicationId, e.target.value)}
                        className="bg-slate-100 border border-slate-300 rounded px-1.5 py-0.5 text-[11px] text-slate-700 cursor-pointer"
                      >
                        <option value="SUBMITTED">Submitted</option>
                        <option value="UNDER_REVIEW">Under Review</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        lead.source === 'AI_AGENT'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {lead.source}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
