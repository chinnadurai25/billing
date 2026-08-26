import React from 'react';
import { 
  Receipt, ShieldCheck, ArrowRight, CheckCircle2, TrendingUp, 
  Sparkles, FileText, Lock, Users, Zap, Layers, BarChart3, ChevronRight
} from 'lucide-react';

export const LandingPage = ({ setCurrentView }) => {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-dark-950 text-slate-100 overflow-hidden bg-grid-pattern">
      
      {/* Ambient Floating Gradient Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-500/15 rounded-full blur-[140px] pointer-events-none animate-pulse-glow" />
      <div className="absolute top-10 left-10 w-96 h-96 bg-brand-accent/15 rounded-full blur-[120px] pointer-events-none animate-float-slow" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[150px] pointer-events-none animate-float-medium" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24 relative z-10">
        
        {/* Top Floating Badge */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-brand-500/30 text-slate-200 text-xs font-medium shadow-lg hover:border-brand-500/60 transition-all cursor-default">
            <Sparkles className="w-4 h-4 text-brand-accent animate-spin-slow" />
            <span>Next-Gen Tax SaaS Platform for Indian & International Businesses</span>
            <span className="bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded-full text-[10px] font-mono border border-brand-500/40">v2.4 GST Compliant</span>
          </div>
        </div>

        {/* Main Hero Copy */}
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white font-serif leading-[1.15] mb-6">
            Intelligent Tax Billing & <br className="hidden sm:inline" />
            <span className="gradient-text-indigo">SaaS Financial Governance</span>
          </h1>

          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto font-light leading-relaxed mb-10">
            Streamline customer billing, automated GST calculation (CGST/SGST/IGST), GSTR-1 filings, and real-time enterprise tax audit trails with unmatched elegance.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
            <button
              onClick={() => setCurrentView('user-register')}
              className="flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-accent hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all duration-300 transform hover:-translate-y-1"
            >
              Get Started Free <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCurrentView('user-login')}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl glass-card hover:bg-slate-800/80 border border-slate-700 text-slate-200 font-semibold text-sm transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <Users className="w-4 h-4 text-indigo-400" /> User Portal Login
            </button>

            <button
              onClick={() => setCurrentView('admin-login')}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl glass-card-gold hover:bg-amber-950/40 border border-amber-500/40 text-amber-300 font-semibold text-sm shadow-lg shadow-amber-500/10 transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" /> Admin Portal
            </button>
          </div>
        </div>

        {/* Interactive Preview Mockup Card */}
        <div className="relative max-w-5xl mx-auto rounded-3xl p-1 bg-gradient-to-b from-indigo-500/30 via-slate-800/40 to-transparent shadow-2xl">
          <div className="glass-card rounded-[22px] p-6 sm:p-8 overflow-hidden relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs text-slate-400 font-mono ml-2">app.taxpulse.io/dashboard</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Live GST Sync
                </span>
              </div>
            </div>

            {/* Mock Dashboard Hero Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-2xl bg-dark-900/80 border border-slate-800">
                <p className="text-xs text-slate-400 font-medium">Monthly Billed Revenue</p>
                <h3 className="text-2xl font-bold font-mono text-white mt-1">₹10,50,000</h3>
                <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" /> +18.4% vs last month
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-dark-900/80 border border-slate-800">
                <p className="text-xs text-slate-400 font-medium">Total GST Tax Collected</p>
                <h3 className="text-2xl font-bold font-mono text-indigo-300 mt-1">₹1,89,000</h3>
                <span className="text-[11px] text-slate-400 font-mono mt-1 block">CGST 9% + SGST 9%</span>
              </div>
              <div className="p-4 rounded-2xl bg-dark-900/80 border border-slate-800">
                <p className="text-xs text-slate-400 font-medium">Tax Invoices Generated</p>
                <h3 className="text-2xl font-bold font-mono text-white mt-1">84 Invoices</h3>
                <span className="text-[11px] text-emerald-400 font-mono mt-1 block">100% Tax Compliant</span>
              </div>
            </div>

            {/* Graphic Floating Elements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Acme Global Solutions</h4>
                    <p className="text-[10px] text-slate-400 font-mono">INV-2026-089 • GSTIN 29AABCA...</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">₹59,000 Paid</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Admin Security Access</h4>
                    <p className="text-[10px] text-slate-400 font-mono">256-bit SSL Audit Active</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">Gold Portal</span>
              </div>
            </div>

          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl glass-card glass-card-hover">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Automated GST Invoicing</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Instant tax calculation for intrastate (CGST+SGST) and interstate (IGST) invoices with customizable line items and HSN/SAC lookups.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-card glass-card-hover">
            <div className="w-12 h-12 rounded-xl bg-brand-accent/10 text-brand-accent border border-brand-accent/20 flex items-center justify-center mb-4">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Multi-Company Architecture</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Manage multiple company entities, distinct GSTIN numbers, state addresses, and tax certificates under one unified account.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass-card-gold glass-card-gold-hover">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-amber-200 mb-2">Dedicated Admin Console</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Powerful admin interface for managing system users, tracking nationwide tax collections, user plan limits, and immutable audit logs.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
