import { useState, useEffect } from 'react';
import { X, Mail, Plus, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface EmailModalProps {
  projectId: string;
  userEmail: string;
  onClose: () => void;
}

export default function EmailModal({ projectId, userEmail, onClose }: EmailModalProps) {
  const [sendToSelf, setSendToSelf] = useState(true);
  const [extraEmails, setExtraEmails] = useState<string[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [inputError, setInputError] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [successCount, setSuccessCount] = useState(0);

  useEffect(() => {
    if (status === 'success') {
      const t = setTimeout(onClose, 3000);
      return () => clearTimeout(t);
    }
  }, [status, onClose]);

  function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  function addEmail() {
    const val = inputVal.trim();
    if (!val) return;
    if (!isValidEmail(val)) { setInputError('Enter a valid email address.'); return; }
    if (extraEmails.includes(val) || val === userEmail) { setInputError('Already added.'); return; }
    setExtraEmails(prev => [...prev, val]);
    setInputVal('');
    setInputError('');
  }

  function removeEmail(email: string) {
    setExtraEmails(prev => prev.filter(e => e !== email));
  }

  async function handleSend() {
    const recipients = [...(sendToSelf ? [userEmail] : []), ...extraEmails];
    if (recipients.length === 0) { setErrorMsg('Add at least one recipient.'); return; }
    setStatus('sending');
    setErrorMsg('');
    try {
      const { data, error } = await supabase.functions.invoke('send-brief-email', {
        body: { to: recipients, projectId, userEmail, note: note.trim() || undefined },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setSuccessCount(recipients.length);
      setStatus('success');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to send email.');
      setStatus('error');
    }
  }

  const totalRecipients = (sendToSelf ? 1 : 0) + extraEmails.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(3,7,18,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: '#0D1829', border: '1px solid rgba(0,229,255,0.15)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.2)' }}>
              <Mail className="w-3.5 h-3.5" style={{ color: '#00E5FF' }} />
            </div>
            <span className="font-semibold text-text-primary text-sm">Email Intelligence Brief</span>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
            style={{ color: '#9CAEC4' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {status === 'success' ? (
          <div className="px-6 py-12 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
              style={{ background: 'rgba(0,245,160,0.1)', border: '1px solid rgba(0,245,160,0.3)' }}>
              <CheckCircle className="w-7 h-7" style={{ color: '#00F5A0' }} />
            </div>
            <p className="text-text-primary font-semibold mb-1">Brief sent successfully</p>
            <p className="text-text-muted text-sm">Delivered to {successCount} recipient{successCount !== 1 ? 's' : ''}. Closing in 3s…</p>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-5">
            {/* Send to self */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative" onClick={() => setSendToSelf(v => !v)}>
                  <div className="w-4 h-4 rounded flex items-center justify-center transition-all"
                    style={{ background: sendToSelf ? '#00E5FF' : 'transparent', border: `2px solid ${sendToSelf ? '#00E5FF' : 'rgba(255,255,255,0.2)'}` }}>
                    {sendToSelf && (
                      <svg className="w-2.5 h-2.5" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="#030712" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-text-primary">Send to me</span>
                  <span className="text-xs text-text-muted ml-2">{userEmail}</span>
                </div>
              </label>
            </div>

            {/* Additional recipients */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Additional Recipients</div>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={inputVal}
                  onChange={e => { setInputVal(e.target.value); setInputError(''); }}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addEmail(); } }}
                  placeholder="Enter email address"
                  className="flex-1 px-3 py-2 rounded-lg text-sm outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#F5F9FF' }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.4)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                />
                <button onClick={addEmail}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                  style={{ background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.25)', color: '#00E5FF' }}>
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
              {inputError && <p className="text-xs mt-1.5" style={{ color: '#FF4D6D' }}>{inputError}</p>}
              {extraEmails.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {extraEmails.map(email => (
                    <span key={email} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
                      style={{ background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)', color: '#00E5FF' }}>
                      {email}
                      <button onClick={() => removeEmail(email)} className="hover:opacity-70 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Note */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                Add a Note <span className="normal-case font-normal">(optional)</span>
              </div>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={3}
                placeholder="e.g. Please review before the pre-bid meeting on [date]"
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all resize-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#F5F9FF' }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.4)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
              />
            </div>

            {/* Error */}
            {(status === 'error' || errorMsg) && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg text-xs"
                style={{ background: 'rgba(255,77,109,0.08)', border: '1px solid rgba(255,77,109,0.25)', color: '#FF4D6D' }}>
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                {errorMsg}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-1">
              <button onClick={handleSend}
                disabled={status === 'sending' || totalRecipients === 0}
                className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #00E5FF, #00B8CC)', color: '#030712' }}>
                {status === 'sending'
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Sending…</>
                  : <><Mail className="w-4 h-4" />Send Brief{totalRecipients > 0 ? ` to ${totalRecipients} recipient${totalRecipients !== 1 ? 's' : ''}` : ''}</>}
              </button>
              <button onClick={onClose}
                className="w-full py-2.5 rounded-lg text-sm font-medium text-text-muted transition-colors hover:text-text-primary"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
