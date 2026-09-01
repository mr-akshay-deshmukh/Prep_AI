import { useState } from 'react';
import { Send, Linkedin, DollarSign, Sparkles, Loader2, Copy, Check, Search, Users } from 'lucide-react';
import { generateText } from '../lib/gemini';
import Markdown from 'react-markdown';

type ToolType = 'outreach' | 'negotiation' | 'linkedin' | 'culture';

export function CareerTools() {
  const [activeTool, setActiveTool] = useState<ToolType>('outreach');
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleAction = async () => {
    if (!input.trim() || isLoading) return;
    setIsLoading(true);
    setResult('');

    let systemInstructions = "";
    switch(activeTool) {
      case 'outreach':
        systemInstructions = "You are a networking expert. Generate a highly personalized, professional, and non-spammy LinkedIn connection request or cold email. Focus on building a genuine connection based on the provided context.";
        break;
      case 'negotiation':
        systemInstructions = "You are a professional salary negotiator. Role-play or provide a script for a salary negotiation. Help the user articulate their value and handle tough HR questions about compensation.";
        break;
      case 'linkedin':
        systemInstructions = "You are a LinkedIn Profile Optimizer. Analyze the provided profile text or experience and suggest an SEO-optimized headline, a compelling 'About' section, and tips to improve visibility to recruiters.";
        break;
      case 'culture':
        systemInstructions = "You are a Company Culture Expert. Based on the company name or description provided, explain their likely interview style, core values, and how the candidate should adapt their persona (e.g., more technical, more collaborative, more leadership-focused) to fit in.";
        break;
    }

    try {
      const response = await generateText(input, systemInstructions, "gemini-3-flash-preview");
      setResult(response || '');
    } catch (error) {
      console.error("Tool error:", error);
      setResult("Failed to generate content. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toolConfig = {
    outreach: {
      title: 'Networking Context',
      desc: 'Paste a job description, a recruiter profile, or explain who you want to connect with.',
      placeholder: 'e.g., I want to message a Senior Engineer at Google who works on Cloud...',
      icon: Linkedin,
      label: 'Outreach Assistant'
    },
    negotiation: {
      title: 'Negotiation Scenario',
      desc: 'Enter the job offer details, your target salary, and any specific concerns you have.',
      placeholder: 'e.g., I received an offer for $80k but I want $95k because...',
      icon: DollarSign,
      label: 'Salary Negotiator'
    },
    linkedin: {
      title: 'Profile Content',
      desc: 'Paste your current LinkedIn bio, headline, or a summary of your experience.',
      placeholder: 'e.g., I am a Full Stack Developer with 2 years of experience in React and Node...',
      icon: Search,
      label: 'LinkedIn Optimizer'
    },
    culture: {
      title: 'Company Details',
      desc: 'Enter the name of the company or a description of their work culture.',
      placeholder: 'e.g., Netflix - known for its high-performance culture and radical candor...',
      icon: Users,
      label: 'Culture Fit'
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="text-center space-y-4">
        <h2 className="text-4xl font-black text-gray-900 tracking-tight">Advanced Career Suite</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Go beyond the interview. Master the art of networking, profile optimization, and negotiation to secure your dream role.
        </p>
      </header>

      {/* Tool Selector */}
      <div className="flex flex-wrap justify-center gap-4">
        {(Object.keys(toolConfig) as ToolType[]).map((key) => {
          const config = toolConfig[key];
          const Icon = config.icon;
          return (
            <button
              key={key}
              onClick={() => { setActiveTool(key); setResult(''); setInput(''); }}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${
                activeTool === key 
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                  : 'bg-white text-gray-600 hover:bg-emerald-50 border border-gray-100'
              }`}
            >
              <Icon className="w-5 h-5" />
              {config.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Area */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-gray-900">
              {toolConfig[activeTool].title}
            </h3>
            <p className="text-sm text-gray-500">
              {toolConfig[activeTool].desc}
            </p>
          </div>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={toolConfig[activeTool].placeholder}
            className="w-full h-64 bg-gray-50 border border-gray-200 rounded-2xl p-6 outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all resize-none"
          />

          <button
            onClick={handleAction}
            disabled={!input.trim() || isLoading}
            className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-600/20 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
            {isLoading ? 'Generating...' : `Run ${toolConfig[activeTool].label}`}
          </button>
        </div>

        {/* Output Area */}
        <div className="bg-emerald-900 rounded-[2.5rem] p-1 shadow-2xl min-h-[500px] flex flex-col">
          <div className="bg-white rounded-[2.4rem] p-8 flex-1 flex flex-col relative overflow-hidden">
            {result ? (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h4 className="font-black text-emerald-900 uppercase tracking-widest text-sm">AI Strategy</h4>
                  <button 
                    onClick={copyToClipboard}
                    className="p-2 hover:bg-emerald-50 rounded-lg transition-colors text-emerald-600"
                  >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
                <div className="markdown-body prose prose-emerald max-w-none overflow-y-auto pr-4 flex-1">
                  <Markdown>{result}</Markdown>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                <Sparkles className="w-16 h-16 text-emerald-600" />
                <p className="font-bold text-gray-400">Your AI-generated strategy will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
