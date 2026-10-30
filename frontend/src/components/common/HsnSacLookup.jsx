import React, { useEffect, useState } from 'react';
import { CheckCircle2, LoaderCircle, Search, XCircle } from 'lucide-react';
import { api } from '../../services/api';

const HsnSacLookup = ({ type, value, selectedRecord, onCodeChange, onSelect }) => {
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const query = String(value || '').trim();
    if (!query || query.length < 2 || selectedRecord?.code === query) {
      setResults([]);
      setStatus('idle');
      setMessage('');
      return undefined;
    }

    let isCurrent = true;
    const timer = setTimeout(async () => {
      setStatus('loading');
      setMessage('');
      setIsOpen(true);
      try {
        const response = await api.lookupHsnSac(type, query);
        if (!isCurrent) return;
        if (!response?.success) {
          setResults([]);
          setStatus('error');
          setMessage(response?.message || 'HSN/SAC lookup is currently unavailable.');
          return;
        }
        const matches = Array.isArray(response.data) ? response.data : [];
        setResults(matches);
        setStatus(matches.length ? 'results' : 'empty');
        setMessage(matches.length ? '' : 'No matching HSN/SAC code was found. Check the code or try another prefix.');
      } catch {
        if (!isCurrent) return;
        setResults([]);
        setStatus('error');
        setMessage('HSN/SAC lookup is currently unavailable. Please try again.');
      }
    }, 350);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [type, value, selectedRecord?.code]);

  const handleChange = (event) => {
    const nextCode = event.target.value.replace(/\D/g, '').slice(0, 8);
    onCodeChange(nextCode);
    setIsOpen(true);
  };

  const selectRecord = (record) => {
    onSelect(record);
    setResults([]);
    setStatus('idle');
    setMessage('');
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={value}
          onChange={handleChange}
          onFocus={() => { if (results.length) setIsOpen(true); }}
          placeholder={type === 'HSN' ? 'Enter HSN code (e.g. 847130)' : 'Enter SAC code (e.g. 998222)'}
          className="w-full px-3.5 py-2 pr-9 rounded-xl glass-input text-xs font-mono"
          aria-label={`${type} code`}
          aria-autocomplete="list"
          aria-expanded={isOpen && results.length > 0}
          aria-controls={`hsn-sac-${type}-suggestions`}
          required
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2">
          {selectedRecord?.code === value ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            : status === 'loading' ? <LoaderCircle className="w-4 h-4 text-cyan-300 animate-spin" />
              : <Search className="w-4 h-4 text-slate-500" />}
        </span>
      </div>

      {selectedRecord?.code === value ? (
        <div className="mt-1.5 box-border w-full min-w-0 max-w-full overflow-hidden break-words rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-3 py-2.5 text-sm leading-5">
          <span className="font-semibold text-emerald-300">Verified: {selectedRecord.name}</span>
          {selectedRecord.description && selectedRecord.description !== selectedRecord.name && (
            <span className="mt-1 block text-sm leading-6 text-slate-400">{selectedRecord.description}</span>
          )}
        </div>
      ) : null}

      {isOpen && results.length > 0 && (
        <div id={`hsn-sac-${type}-suggestions`} role="listbox" className="absolute z-[70] mt-1 max-h-80 w-[min(28rem,calc(100vw-2rem))] overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
          {results.map((record, index) => (
            <button
              key={`${record.code}-${index}`}
              type="button"
              role="option"
              aria-selected="false"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectRecord(record)}
              className="block w-full border-b border-slate-800 px-4 py-3.5 text-left last:border-0 hover:bg-slate-800 focus:bg-slate-800 focus:outline-none"
            >
              <span className="flex items-center justify-between gap-3">
                <span className="font-mono text-lg font-bold text-cyan-300">{record.code}</span>
                {record.gstRate !== null && record.gstRate !== undefined && <span className="shrink-0 text-xs text-emerald-300">GST {record.gstRate}%</span>}
              </span>
              <span className="mt-1 block text-sm font-semibold leading-5 text-white">{record.name}</span>
              {record.description && record.description !== record.name && <span className="mt-1 block text-xs leading-5 text-slate-400">{record.description}</span>}
            </button>
          ))}
        </div>
      )}

      {message && (status === 'empty' || status === 'error') && (
        <p role="status" className={`mt-1.5 flex items-start gap-1.5 text-[11px] ${status === 'empty' ? 'text-rose-300' : 'text-amber-300'}`}>
          <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{message}
        </p>
      )}
      {status === 'loading' && <p className="mt-1 text-[10px] text-slate-400">Searching verified {type} codes…</p>}
      {status === 'results' && !isOpen && <p className="mt-1 text-[10px] text-slate-400">Select a matching result to verify this code.</p>}
    </div>
  );
};

export default HsnSacLookup;
