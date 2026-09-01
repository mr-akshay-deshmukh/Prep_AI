import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, MessageSquare, Trash2 } from 'lucide-react';
import { sendChatMessage } from '../lib/gemini';
import Markdown from 'react-markdown';

interface Message {
  role: 'user' | 'model';
  content: string;
}

export function GeminiChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState('gemini-3-flash-preview');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const systemInstruction = "You are a Senior Director and Strategic Career Mentor. You help students and professionals with high-level career strategy, leadership development, and positioning themselves for impact. Be professional, direct, and insightful.";

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage(newMessages, systemInstruction, model);
      const modelMessage: Message = { role: 'model', content: response.text };
      setMessages(prev => [...prev, modelMessage]);
    } catch (error: any) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'model', content: "Sorry, I encountered an error. Please try again or check if you have reached a quota limit." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-4xl mx-auto bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-emerald-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Career Assistant</h2>
            <p className="text-xs text-emerald-700 font-medium uppercase tracking-wider">AI Powered Mentor</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <select 
            value={model} 
            onChange={(e) => setModel(e.target.value)}
            className="text-sm border border-emerald-200 rounded-lg px-3 py-1.5 bg-white text-emerald-800 outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
          >
            <option value="gemini-3-flash-preview">General (Flash)</option>
            <option value="gemini-3.1-pro-preview">Complex Model</option>
            <option value="gemini-3.1-flash-lite-preview">Fast (Lite)</option>
          </select>
          <button 
            onClick={clearChat}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            title="Clear Chat"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-60">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
              <Bot className="w-8 h-8" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">Hello! I'm your Executive Career Mentor.</p>
              <p className="text-gray-500 max-w-xs">Let's discuss your career strategy, leadership growth, or high-impact projects.</p>
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div 
              key={i} 
              className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                msg.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                {msg.role === 'user' ? <User className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
              </div>
              <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-emerald-600 text-white rounded-tr-none' 
                  : 'bg-gray-50 text-gray-800 rounded-tl-none border border-gray-100'
              }`}>
                <div className={`markdown-body prose prose-sm max-w-none ${msg.role === 'user' ? 'text-white' : ''}`}>
                  <Markdown>{msg.content}</Markdown>
                </div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center shrink-0 shadow-sm">
              <Bot className="w-6 h-6" />
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-6 border-t border-gray-100 bg-gray-50/50">
        <div className="relative flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message here..."
            className="flex-1 bg-white border border-gray-200 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-sm"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-emerald-600 text-white p-4 rounded-2xl hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-lg shadow-emerald-600/20 active:scale-95"
          >
            <Send className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
