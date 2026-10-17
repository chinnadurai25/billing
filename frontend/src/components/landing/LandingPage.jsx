import React from 'react';
import { 
  Receipt, ShieldCheck, ArrowRight, CheckCircle2, TrendingUp, 
  Sparkles, FileText, Lock, Users, Zap, Layers, BarChart3, ChevronRight, Building2, Check
} from 'lucide-react';

export const LandingPage = ({ setCurrentView }) => {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-[#f8fafc] text-slate-900 overflow-hidden bg-grid-pattern">
      
      {/* Subtle Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-100/60 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24 relative z-10">
        
        {/* Top Floating Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-blue-200 text-slate-800 text-xs font-semibold shadow-xs">
            <Sparkles className="w-4 h-4 text-blue-700" />
            <span>Official GST Billing & Tax SaaS Platform</span>
            <span className="bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold">GST Compliant</span>
          </div>
        </div>

        {/* Main Hero Copy */}
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-900 font-serif leading-[1.18] mb-6">
            Intelligent Tax Billing & <br className="hidden sm:inline" />
            <span className="text-[#1b4b8a]">Enterprise Financial Portal</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-700 max-w-2xl mx-auto font-medium leading-relaxed mb-10">
            Streamline customer billing, automated GST calculation (CGST/SGST/IGST), GSTR-1 filings, and real-time enterprise tax audit trails with high accuracy.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
            <button
              onClick={() => setCurrentView('user-register')}
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm shadow-md shadow-blue-700/25 transition-all duration-200 transform hover:-translate-y-0.5 cursor-pointer"
            >
              Get Started Free <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCurrentView('user-login')}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-sm shadow-xs transition-all duration-200 transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Users className="w-4 h-4 text-blue-700" /> User Portal Login
            </button>
          </div>
        </div>

        {/* Interactive Preview Mockup Card */}
        <div className="relative max-w-5xl mx-auto rounded-2xl p-1 bg-gradient-to-b from-blue-200/50 via-slate-200 to-transparent shadow-xl">
          <div className="bg-white rounded-xl p-6 sm:p-8 border border-slate-200 overflow-hidden relative shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="text-xs text-slate-600 font-mono ml-2 font-semibold">app.billson.io/dashboard</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-mono font-bold border border-emerald-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span> Live GST Sync Active
                </span>
              </div>
            </div>

            {/* Mock Dashboard Hero Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-600 font-bold">Monthly Billed Revenue</p>
                <h3 className="text-2xl font-bold font-mono text-slate-900 mt-1">₹10,50,000</h3>
                <span className="text-[11px] text-emerald-700 font-bold font-mono flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3.5 h-3.5" /> +18.4% vs last month
                </span>
              </div>
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-600 font-bold">Total GST Tax Collected</p>
                <h3 className="text-2xl font-bold font-mono text-blue-900 mt-1">₹1,89,000</h3>
                <span className="text-[11px] text-slate-600 font-bold font-mono mt-1 block">CGST 9% + SGST 9%</span>
              </div>
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-600 font-bold">Tax Invoices Generated</p>
                <h3 className="text-2xl font-bold font-mono text-slate-900 mt-1">84 Invoices</h3>
                <span className="text-[11px] text-emerald-700 font-bold font-mono mt-1 block">100% Tax Compliant</span>
              </div>
            </div>

            {/* Graphic Floating Elements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Acme Global Solutions</h4>
                    <p className="text-[11px] text-slate-600 font-mono">INV-2026-089 • GSTIN 29AABCA...</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">₹59,000 Paid</span>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Enterprise Security Access</h4>
                    <p className="text-[11px] text-slate-600 font-mono">256-bit SSL Audit Active</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">Verified</span>
              </div>
            </div>

          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-blue-300 transition-all">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Automated GST Invoicing</h3>
            <p className="text-xs font-medium text-slate-600 leading-relaxed">
              Instant tax calculation for intrastate (CGST+SGST) and interstate (IGST) invoices with customizable line items and HSN/SAC lookups.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-blue-300 transition-all">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center mb-4">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Multi-Company Architecture</h3>
            <p className="text-xs font-medium text-slate-600 leading-relaxed">
              Manage multiple company entities, distinct GSTIN numbers, state addresses, and tax certificates under one unified account.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs hover:border-amber-300 transition-all">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Dedicated Admin Console</h3>
            <p className="text-xs font-medium text-slate-600 leading-relaxed">
              Powerful admin interface for managing system users, tracking nationwide tax collections, user plan limits, and immutable audit logs.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
