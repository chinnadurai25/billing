import React, { useState } from 'react';
import { 
  ChevronRight, ExternalLink, Download, Info, Play, 
  HelpCircle, CheckCircle, FileText, Calendar, PhoneCall, ShieldCheck, X
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const GstPortalHub = () => {
  const { addToast } = useToast();
  const [selectedDueTab, setSelectedDueTab] = useState('Monthly'); // 'Monthly', 'Quarterly', 'Other Due Dates'
  const [activeFaq, setActiveFaq] = useState(null);

  const newsItems = [
    {
      id: 1,
      title: 'Introduction of e-Invoicing Facility for Recipient Generated Self Invoices under Reverse Charge Mechanism for Domestic Supplies from Unregistered Persons (RCMDOM) and Import of Services (RCMIMP)',
      date: 'Oct 16th, 2026',
      tag: 'E-INVOICE',
      isHighlighted: false
    },
    {
      id: 2,
      title: 'Annual Returns in the form of GSTR-9/9C for FY 2025-26',
      date: 'Oct 13th, 2026',
      tag: 'RETURNS',
      isHighlighted: true
    },
    {
      id: 3,
      title: 'FAQs in relation to recommendations of the 57th GST Council Meeting',
      date: 'Oct 13th, 2026',
      tag: 'OTHERS',
      isHighlighted: false
    }
  ];

  const helpTopics = [
    {
      id: 1,
      question: 'How do I register with GST?',
      answer: 'Apply for registration on the GST portal under Services > Registration > New Registration. Complete Part A with PAN, email, mobile, and Part B with business address and bank details.'
    },
    {
      id: 2,
      question: 'How do I apply for refund?',
      answer: 'Navigate to Services > Refunds > Application for Refund. Select the refund reason (e.g., Export of Goods/Services, Accumulated ITC), fill Form GST RFD-01, and attach supporting invoices.'
    },
    {
      id: 3,
      question: 'How do I file returns?',
      answer: 'Access Services > Returns > Returns Dashboard. Choose Financial Year and Return Filing Period, prepare GSTR-1 (sales) and GSTR-3B (monthly summary), reconcile ITC and pay net tax.'
    },
    {
      id: 4,
      question: 'How can I use Returns Offline Tool?',
      answer: 'Download the JSON/Excel offline utility from Downloads > Offline Tools. Enter invoice data offline, generate the JSON file, and upload directly to your returns dashboard.'
    },
    {
      id: 5,
      question: 'How do I file an appeal?',
      answer: 'Go to Services > User Services > My Applications. Select Application Type as Appeal to Appellate Authority (Form GST APL-01), enter order number and upload appeal grounds.'
    },
    {
      id: 6,
      question: 'How do I file intimation about voluntary payment?',
      answer: 'Access Services > User Services > My Applications. Select Form GST DRC-03 for voluntary tax deposit, mention section under which payment is made, and generate challan.'
    }
  ];

  const handleDownloadPdf = () => {
    addToast('Downloading GST Compliance Due Dates Schedule (PDF)...', 'info', 'GST Calendar Download');
    // Generate text/file download
    const content = `GOVERNMENT OF INDIA - GOODS AND SERVICES TAX PORTAL\nUPCOMING STATUTORY GST DUE DATES - FY 2025-26\n\n1. GSTR-3B (Monthly): Due Oct 20th, 2026\n2. GSTR-3B (Quarterly Category 1): Due Oct 22nd, 2026\n3. GSTR-3B (Quarterly Category 2): Due Oct 24th, 2026\n4. GSTR-1 (Monthly Outward Supplies): Due Oct 11th, 2026\n5. GSTR-1 (QRMP Quarterly): Due Oct 13th, 2026\n6. GSTR-5 (Non-Resident Taxable Persons): Due Oct 13th, 2026\n7. GSTR-5A (OIDAR Services): Due Oct 20th, 2026\n8. GSTR-6 (Input Service Distributor): Due Oct 13th, 2026\n9. GSTR-7 (TDS Deductors): Due Oct 10th, 2026\n10. GSTR-8 (e-Commerce Operators TCS): Due Oct 10th, 2026\n\nHelpdesk Toll-free: 1800-103-4786 | Grievance: selfservice.gstsystem.in`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GST_Due_Dates_October_2026.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      
      {/* 2x2 Grid Exact Replica of Official GST Portal UI from Sample Image */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* 1. TOP-LEFT: NEWS AND UPDATES */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                News and Updates
              </h2>
              <button 
                onClick={() => addToast('Opening full GST Council official bulletin archive...', 'info')}
                className="text-xs font-bold text-[#1b4b8a] hover:text-[#0f294a] hover:underline uppercase tracking-wider flex items-center gap-1 cursor-pointer"
              >
                VIEW ALL
              </button>
            </div>

            <div className="space-y-1">
              {newsItems.map((item) => (
                <div 
                  key={item.id}
                  className={`p-3.5 rounded-lg transition-all ${
                    item.isHighlighted 
                      ? 'bg-[#eff6ff] border border-blue-200' 
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <h3 className="text-[13px] sm:text-sm font-bold text-[#1b4b8a] hover:underline cursor-pointer leading-snug">
                    {item.title}
                  </h3>
                  <div className="flex items-center justify-between mt-2 pt-1">
                    <span className="text-xs font-medium text-slate-700">
                      {item.date}
                    </span>
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-300 rounded-full px-2.5 py-0.5 tracking-wider uppercase font-mono">
                      {item.tag}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 2. TOP-RIGHT: POPULAR HELP TOPICS */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="pb-3 mb-2 border-b border-slate-100">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Popular Help Topics
              </h2>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
              {helpTopics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => setActiveFaq(topic)}
                  className="w-full flex items-center justify-between p-2.5 text-left text-xs sm:text-[13px] font-medium text-slate-800 hover:text-[#1b4b8a] hover:bg-slate-50 transition-colors cursor-pointer group"
                >
                  <span className="pr-2">{topic.question}</span>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-[#1b4b8a] shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Help Desk & Grievance Box matching sample screenshot */}
          <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-2 divide-x divide-slate-200 text-center items-center">
            <div className="pr-3">
              <p className="text-[11px] font-medium text-slate-600">Help Desk Number:</p>
              <p className="text-sm font-bold text-slate-900 font-mono tracking-tight mt-0.5">1800-103-4786</p>
            </div>
            <div className="pl-3">
              <p className="text-[11px] font-medium text-slate-600">Log/Track Your Issues here</p>
              <a 
                href="https://selfservice.gstsystem.in" 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#1b4b8a] hover:underline mt-0.5"
              >
                Grievance Redressal <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* 3. BOTTOM-LEFT: UPCOMING DUE DATES TABLE */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs p-6">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Upcoming Due Dates
            </h2>
            <button
              onClick={handleDownloadPdf}
              className="text-xs font-bold text-[#1b4b8a] hover:text-[#0f294a] hover:underline uppercase tracking-wider flex items-center gap-1 cursor-pointer"
            >
              DOWNLOAD PDF
            </button>
          </div>

          {/* Due Dates Table Structure identical to the sample image */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            {/* Table Header with 3 Columns */}
            <div className="grid grid-cols-12 bg-[#e0effe]/70 border-b border-slate-200 text-center font-bold text-xs sm:text-sm text-slate-900 divide-x divide-slate-200">
              <button 
                onClick={() => setSelectedDueTab('Monthly')}
                className={`col-span-4 py-2.5 hover:bg-[#d0e5fc] transition-colors cursor-pointer ${selectedDueTab === 'Monthly' ? 'bg-[#d0e5fc] font-extrabold text-[#0f294a]' : ''}`}
              >
                Monthly
              </button>
              <button 
                onClick={() => setSelectedDueTab('Quarterly')}
                className={`col-span-4 py-2.5 hover:bg-[#d0e5fc] transition-colors cursor-pointer ${selectedDueTab === 'Quarterly' ? 'bg-[#d0e5fc] font-extrabold text-[#0f294a]' : ''}`}
              >
                Quarterly
              </button>
              <button 
                onClick={() => setSelectedDueTab('Other Due Dates')}
                className={`col-span-4 py-2.5 hover:bg-[#d0e5fc] transition-colors cursor-pointer ${selectedDueTab === 'Other Due Dates' ? 'bg-[#d0e5fc] font-extrabold text-[#0f294a]' : ''}`}
              >
                Other Due Dates
              </button>
            </div>

            {/* Table Body Row 1 */}
            <div className="grid grid-cols-12 divide-x divide-slate-200 border-b border-slate-200 text-xs">
              <div className="col-span-4 p-3 bg-white">
                <p className="text-slate-600 font-medium">GSTR-3B (Sep, 2026)</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="font-bold text-slate-900">Oct 20th, 2026</span>
                  <Info className="w-3.5 h-3.5 text-slate-500 cursor-pointer hover:text-blue-700" title="Turnover > 5 Cr" />
                </div>
              </div>
              <div className="col-span-4 p-3 bg-white">
                <p className="text-slate-600 font-medium">GSTR-3B (Jul-Sep, 2026)</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="font-bold text-slate-900">Oct 22nd, 24th, 2026</span>
                  <Info className="w-3.5 h-3.5 text-slate-500 cursor-pointer hover:text-blue-700" title="State Category 1 & 2" />
                </div>
              </div>
              <div className="col-span-4 grid grid-cols-2 divide-x divide-slate-200 bg-white">
                <div className="p-3">
                  <p className="text-slate-600 font-medium">GSTR-5 (Sep, 2026)</p>
                  <p className="font-bold text-slate-900 mt-1">Oct 13th, 2026</p>
                </div>
                <div className="p-3">
                  <p className="text-slate-600 font-medium">GSTR-5A (Sep, 2026)</p>
                  <p className="font-bold text-slate-900 mt-1">Oct 20th, 2026</p>
                </div>
              </div>
            </div>

            {/* Table Body Row 2 */}
            <div className="grid grid-cols-12 divide-x divide-slate-200 text-xs">
              <div className="col-span-4 p-3 bg-white">
                <p className="text-slate-600 font-medium">GSTR-1 (Sep, 2026)</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="font-bold text-slate-900">Oct 11th, 2026</span>
                  <Info className="w-3.5 h-3.5 text-slate-500 cursor-pointer hover:text-blue-700" title="Monthly Outward Supplies" />
                </div>
              </div>
              <div className="col-span-4 p-3 bg-white">
                <p className="text-slate-600 font-medium">GSTR-1 (Jul-Sep, 2026)</p>
                <p className="font-bold text-slate-900 mt-1">Oct 13th, 2026</p>
              </div>
              <div className="col-span-4 grid grid-cols-2 divide-x divide-slate-200 bg-white">
                <div className="p-3">
                  <p className="text-slate-600 font-medium">GSTR-6 (Sep, 2026)</p>
                  <p className="font-bold text-slate-900 mt-1">Oct 13th, 2026</p>
                </div>
                <div className="p-3">
                  <p className="text-slate-600 font-medium">GSTR-7 (Sep, 2026)</p>
                  <p className="font-bold text-slate-900 mt-1">Oct 10th, 2026</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* 4. BOTTOM-RIGHT: GST MEDIA */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                GST Media
              </h2>
              <a 
                href="https://tutorial.gst.gov.in" 
                target="_blank" 
                rel="noreferrer"
                className="text-xs font-bold text-[#1b4b8a] hover:text-[#0f294a] hover:underline uppercase tracking-wider flex items-center gap-1"
              >
                VIEW ALL <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="space-y-3">
              {/* Media Card 1 */}
              <div className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-slate-50 transition-all cursor-pointer group">
                <div className="w-16 h-12 rounded-lg bg-[#0f294a] flex items-center justify-center shrink-0 text-white relative overflow-hidden shadow-xs">
                  <div className="absolute inset-0 bg-gradient-to-tr from-rose-600 to-red-500 opacity-90" />
                  <span className="relative z-10 text-[9px] font-bold font-mono uppercase text-center leading-tight">
                    GST<br />Video
                  </span>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#1b4b8a] group-hover:underline leading-snug">
                    Know more about Map-based Geocoding in the Registration process. Watch the video.
                  </h3>
                  <p className="text-[11px] text-slate-700 font-medium mt-1">
                    Uploaded On: Mar 1st, 2024
                  </p>
                </div>
              </div>

              {/* Media Card 2 */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#eff6ff] border border-blue-200 hover:border-blue-300 transition-all cursor-pointer group">
                <div className="w-16 h-12 rounded-lg bg-[#1b4b8a] flex items-center justify-center shrink-0 text-white relative overflow-hidden shadow-xs">
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-700 to-indigo-600 opacity-90" />
                  <span className="relative z-10 text-[9px] font-bold font-mono uppercase text-center leading-tight">
                    Digital<br />Sign
                  </span>
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#1b4b8a] group-hover:underline leading-snug">
                    How to validate Digital Signature affixed to the downloaded document from the GST Portal?
                  </h3>
                  <p className="text-[11px] text-slate-700 font-medium mt-1">
                    Uploaded On: Feb 27th, 2024
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Help Modal */}
      {activeFaq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2 text-[#1b4b8a]">
                <HelpCircle className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900">Help Topic Guide</h3>
              </div>
              <button 
                onClick={() => setActiveFaq(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-2">{activeFaq.question}</h4>
              <p className="text-xs leading-relaxed text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 font-medium">
                {activeFaq.answer}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveFaq(null)}
                className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold cursor-pointer"
              >
                Close Topic
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
