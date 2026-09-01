import { useState, useEffect } from 'react';
import { X, Key, CheckCircle2, AlertCircle, ExternalLink, HelpCircle } from 'lucide-react';

interface ApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ApiSettingsModal({ isOpen, onClose }: ApiSettingsModalProps) {
  const [hasServerKey, setHasServerKey] = useState<boolean | null>(null);
  const [localKey, setLocalKey] = useState("");
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Fetch server configuration status
      fetch('/api/config/status')
        .then(res => res.json())
        .then(data => setHasServerKey(!!data.hasServerKey))
        .catch(() => setHasServerKey(false));

      // Get key stored in localStorage
      const key = localStorage.getItem('user_gemini_api_key');
      setSavedKey(key);
      if (key) {
        setLocalKey(key);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!localKey.trim()) {
      setMessage({ type: 'error', text: 'Please enter a non-empty key.' });
      return;
    }
    
    localStorage.setItem('user_gemini_api_key', localKey.trim());
    setSavedKey(localKey.trim());
    setMessage({ 
      type: 'success', 
      text: 'API Key saved successfully! App logic will now use this override key instantly.' 
    });
    
    // Clear message after 3 seconds
    setTimeout(() => setMessage(null), 3000);
  };

  const handleClear = () => {
    localStorage.removeItem('user_gemini_api_key');
    setSavedKey(null);
    setLocalKey("");
    setMessage({ 
      type: 'success', 
      text: 'Custom API Key cleared. The app will now fallback to the server API Key.' 
    });
    setTimeout(() => setMessage(null), 3000);
  };

  const getStatus = () => {
    if (savedKey) {
      return {
        label: "Active (Custom User Key Override)",
        color: "bg-emerald-100 text-emerald-800 border-emerald-200",
        icon: CheckCircle2,
      };
    }
    if (hasServerKey === null) {
      return {
        label: "Checking Status...",
        color: "bg-gray-100 text-gray-500 border-gray-200 animate-pulse",
        icon: HelpCircle,
      };
    }
    if (hasServerKey) {
      return {
        label: "Active (Server Secret Key)",
        color: "bg-emerald-100 text-emerald-800 border-emerald-200",
        icon: CheckCircle2,
      };
    }
    return {
      label: "Key Needed (No valid API key detected)",
      color: "bg-amber-100 text-amber-800 border-amber-200",
      icon: AlertCircle,
    };
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-3xl border border-gray-100 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Gemini AI Configuration</h3>
              <p className="text-xs text-gray-500">Enable and customize intelligent features</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Explanation */}
          <p className="text-sm text-gray-600 leading-relaxed">
            PrepAI features like the <strong className="text-gray-900">AI Mentor, Interview Practice, and Resume Analyzer</strong> are fully powered by Google Gemini. For the application to function perfectly, a Gemini API Key is required.
          </p>

          {/* Connection Status Panel */}
          <div className={`p-4 rounded-2xl border ${status.color} flex items-start gap-3`}>
            <StatusIcon className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm">Status: {status.label}</h4>
              <p className="text-xs opacity-90 mt-1">
                {savedKey 
                  ? "The application is currently utilizing your browser session's local API key to power all intelligence modules." 
                  : hasServerKey 
                    ? "The application is active and utilizing the workspace server-wide pre-configured secret to power intelligence." 
                    : "No server-side key detected. Please add a valid Gemini key below to make all AI modules active and feasible."}
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-gray-700">Custom Gemini API Key Override</label>
            <div className="flex gap-2">
              <input
                type="password"
                value={localKey}
                onChange={e => setLocalKey(e.target.value)}
                placeholder="AIzaSy..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {savedKey && (
                <button
                  onClick={handleClear}
                  className="px-4 py-3 bg-red-50 text-red-600 border border-red-100 font-bold rounded-xl text-sm hover:bg-red-100 transition whitespace-nowrap"
                >
                  Clear Key
                </button>
              )}
              <button
                onClick={handleSave}
                className="px-5 py-3 bg-emerald-600 text-white font-bold rounded-xl text-sm hover:bg-emerald-700 transition shadow-md whitespace-nowrap"
              >
                Save Key
              </button>
            </div>
            <p className="text-xs text-gray-400">
              Your API key is processed in memory on our secure server proxies and is never stored permanently.
            </p>
          </div>

          {/* Feedback Messages */}
          {message && (
            <div className={`p-3 rounded-xl border text-sm font-medium ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'
            }`}>
              {message.text}
            </div>
          )}

          {/* Instruction on Getting Key */}
          <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 space-y-3">
            <h4 className="font-extrabold text-sm text-emerald-800 flex items-center gap-1.5">
              💡 How to get a gratis (free) Gemini API Key?
            </h4>
            <ol className="text-xs text-emerald-700 space-y-1.5 list-decimal list-inside leading-relaxed">
              <li>Click the Google AI Studio button below.</li>
              <li>Sign in with any standard Google (Gmail) account.</li>
              <li>Click <strong>"Get API Key"</strong> and create a new key in seconds.</li>
              <li>Paste it here, or configure it in your AI Studio Workspace secrets, and you are ready to build!</li>
            </ol>
            <div className="pt-2">
              <a 
                href="https://aistudio.google.com/" 
                target="_blank" 
                rel="noreferrer referrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
              >
                Get Gemini API Key <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl text-sm hover:bg-gray-50 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
