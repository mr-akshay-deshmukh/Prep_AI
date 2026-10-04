import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, Sparkles, CheckCircle, AlertCircle, BarChart, Quote, Zap, AlertTriangle, Star, MessageSquare, History, Plus, ArrowLeft, Mic, Square, Video, VideoOff, Lightbulb } from 'lucide-react';
import { sendChatMessage, generateStructuredFeedback } from '../lib/gemini';
import { auth } from '../lib/firebase';
import { recordTaskCompletion } from '../lib/streak';
import Markdown from 'react-markdown';

import { FLASHCARDS } from '../data/flashcards';
import { PERSONAS } from '../data/personas';

interface FeedbackData {
  content: {
    analysis: string;
    strengths: string[];
    improvements: string[];
  };
  tone: {
    analysis: string;
    advice: string;
  };
  clarity: {
    score: number;
    analysis: string;
  };
  fillerWords?: {
    count: number;
    examples: string[];
    analysis: string;
  };
  starMethod?: {
    used: boolean;
    analysis: string;
  };
  examples?: {
    clarity: string;
    advice: string;
  };
  actionableTip: string;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  feedback?: string | FeedbackData;
  isAnalyzing?: boolean;
  showFeedback?: boolean;
  mediaUrl?: string; // For later review
  isVideo?: boolean;
}

interface PracticeSession {
  id: string;
  date: number;
  persona: string;
  messages: Message[];
  totalQuestions: number;
}

export function InterviewPractice() {
  const [persona, setPersona] = useState('Hiring Manager');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      text: "Hello! I'm your AI interviewer. I've set my persona to **Hiring Manager**. I'll be asking questions from a management perspective, focusing on your strategic thinking, leadership, and problem-solving. \n\nWhich role are we interviewing for today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [totalQuestions, setTotalQuestions] = useState(5);
  const questionsAsked = Math.max(0, Math.floor((messages.length - 1) / 2));
  
  // History State
  const [history, setHistory] = useState<PracticeSession[]>([]);
  const [viewingSessionId, setViewingSessionId] = useState<string | null>(null);
  const [showHistoryList, setShowHistoryList] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<'coach' | 'flashcards'>('coach');

  // Flashcards State
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const nextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCardIndex((prev) => (prev + 1) % FLASHCARDS.length);
    }, 150);
  };

  const prevCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCardIndex((prev) => (prev - 1 + FLASHCARDS.length) % FLASHCARDS.length);
    }, 150);
  };

  // STAR Prompt State
  const [isStarPromptActive, setIsStarPromptActive] = useState(false);
  const [initialResponseText, setInitialResponseText] = useState('');
  const [starData, setStarData] = useState({ situation: '', task: '', action: '', result: '' });

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [recordingTimeLeft, setRecordingTimeLeft] = useState(120);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const speechRecognitionRef = useRef<any>(null);
  const currentMediaUrl = useRef<string | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      speechRecognitionRef.current = new SpeechRecognition();
      speechRecognitionRef.current.continuous = true;
      speechRecognitionRef.current.interimResults = true;
      
      speechRecognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
           setInput(prev => prev + (prev.endsWith(' ') || prev.length === 0 ? '' : ' ') + finalTranscript.trim());
        }
      };
    }
  }, []);

  useEffect(() => {
    let timer: number;
    if (isRecording && recordingTimeLeft > 0) {
      timer = window.setInterval(() => {
        setRecordingTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isRecording && recordingTimeLeft === 0) {
      stopRecording();
    }
    return () => clearInterval(timer);
  }, [isRecording, recordingTimeLeft]);

  const toggleRecording = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: isVideoEnabled });
      
      if (isVideoEnabled && videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const mediaBlob = new Blob(audioChunksRef.current, { type: isVideoEnabled ? 'video/webm' : 'audio/webm' });
        currentMediaUrl.current = URL.createObjectURL(mediaBlob);
        stream.getTracks().forEach(track => track.stop());
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = null;
        }
      };

      mediaRecorderRef.current.start();
      speechRecognitionRef.current?.start();
      setRecordingTimeLeft(120);
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing media devices:", err);
      alert("Microphone/Camera access is required for recording.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      speechRecognitionRef.current?.stop();
      setIsRecording(false);
    }
  };

  useEffect(() => {
    const savedHistory = localStorage.getItem('prep_ai_interview_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  const saveToHistory = () => {
    if (messages.length <= 1) return; // Don't save empty sessions
    
    const newSession: PracticeSession = {
      id: Date.now().toString(),
      date: Date.now(),
      persona,
      messages: [...messages],
      totalQuestions,
    };
    
    const newHistory = [newSession, ...history];
    setHistory(newHistory);
    localStorage.setItem('prep_ai_interview_history', JSON.stringify(newHistory));
  };

  const startNewSession = () => {
    saveToHistory();
    setMessages([
      {
        id: Date.now().toString(),
        role: 'model',
        text: `Let's start a new session. I'm your AI interviewer with the **${persona}** persona. \n\nWhich role are we interviewing for today?`
      }
    ]);
    setViewingSessionId(null);
    setShowHistoryList(false);
    setIsStarPromptActive(false);
    setStarData({ situation: '', task: '', action: '', result: '' });
    setInitialResponseText('');
    setInput('');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, viewingSessionId, showHistoryList]);

  const handleSend = async () => {
    if ((!input.trim() && !isStarPromptActive) || isLoading) return;

    if (!isStarPromptActive && messages.length >= 3) {
      setInitialResponseText(input.trim());
      setIsStarPromptActive(true);
      return;
    }

    const personaInstruction = PERSONAS[persona as keyof typeof PERSONAS] || PERSONAS['Standard'];
    const systemInstruction = `${personaInstruction} You are conducting an interview with a total of ${totalQuestions} questions. You have asked ${questionsAsked} questions so far (not counting the initial role inquiry). Ask one question at a time. Wait for the user's response. After they respond, provide constructive feedback on their answer, and then ask the next question. If you have reached ${totalQuestions} questions, conclude the interview and offer a final summary.`;

    let userMessage = input.trim();
    if (isStarPromptActive) {
      const isStarFilled = Object.values(starData).some(val => val.trim().length > 0);
      if (isStarFilled) {
        userMessage = `Initial thought: ${initialResponseText}\n\nStructured using STAR method:\nSituation: ${starData.situation}\nTask: ${starData.task}\nAction: ${starData.action}\nResult: ${starData.result}`;
      } else {
        userMessage = initialResponseText;
      }
      setIsStarPromptActive(false);
      setStarData({ situation: '', task: '', action: '', result: '' });
      setInitialResponseText('');
      setInput('');
    } else {
      setInput('');
    }

    const userMsgId = Date.now().toString();
    const newUserMsg: Message = { 
      id: userMsgId, 
      role: 'user', 
      text: userMessage,
      mediaUrl: currentMediaUrl.current || undefined,
      isVideo: isVideoEnabled && currentMediaUrl.current ? true : undefined
    };
    currentMediaUrl.current = null;
    const newMessagesList = [...messages, newUserMsg];
    setMessages(newMessagesList);
    setIsLoading(true);

    try {
      // Map to Gemini chat format
      const geminiMessages = newMessagesList.map(m => ({ role: m.role, content: m.text }));
      const result = await sendChatMessage(geminiMessages, systemInstruction);
      
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        text: result.text 
      }]);

      // Record daily streak engagement
      recordTaskCompletion('interview_prep', auth.currentUser).catch(console.error);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        text: "I'm sorry, I encountered an error. Please try again." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const getFeedback = async (messageId: string, userText: string, index: number) => {
    // Context is the previous message (the question)
    const activeMessages = viewingSessionId ? history.find(h => h.id === viewingSessionId)?.messages || [] : messages;
    const contextText = index > 0 ? activeMessages[index - 1].text : "Initial introduction";
    
    const updateMessages = (updater: (prev: Message[]) => Message[]) => {
      if (viewingSessionId) {
        setHistory(prev => {
          const newHistory = prev.map(h => {
             if (h.id === viewingSessionId) {
               return { ...h, messages: updater(h.messages) };
             }
             return h;
          });
          localStorage.setItem('prep_ai_interview_history', JSON.stringify(newHistory));
          return newHistory;
        });
      } else {
        setMessages(updater);
      }
    };
    
    updateMessages(prev => prev.map(m => m.id === messageId ? { ...m, isAnalyzing: true, showFeedback: true } : m));
    
    try {
      const prompt = `Context: The interviewer asked: "${contextText}"\nUser's Response: "${userText}"`;
      const feedback = await generateStructuredFeedback(prompt);
      updateMessages(prev => prev.map(m => m.id === messageId ? { ...m, feedback, isAnalyzing: false } : m));
    } catch (error) {
      console.error("Error getting feedback:", error);
      updateMessages(prev => prev.map(m => m.id === messageId ? { ...m, isAnalyzing: false } : m));
    }
  };

  const toggleFeedback = (messageId: string) => {
    if (viewingSessionId) {
       setHistory(prev => {
          const newHistory = prev.map(h => {
             if (h.id === viewingSessionId) {
               return { ...h, messages: h.messages.map(m => m.id === messageId ? { ...m, showFeedback: !m.showFeedback } : m) };
             }
             return h;
          });
          localStorage.setItem('prep_ai_interview_history', JSON.stringify(newHistory));
          return newHistory;
       });
    } else {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, showFeedback: !m.showFeedback } : m));
    }
  };
  
  const activeMessages = viewingSessionId ? history.find(h => h.id === viewingSessionId)?.messages || [] : messages;
  const activeQuestionsAsked = viewingSessionId ? Math.max(0, Math.floor((activeMessages.length - 1) / 2)) : questionsAsked;
  const activeTotalQuestions = viewingSessionId ? history.find(h => h.id === viewingSessionId)?.totalQuestions || 5 : totalQuestions;

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-4rem)] flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden relative">
      <div className="p-6 border-b border-gray-200 bg-gray-50 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-2.5 rounded-xl border border-emerald-200">
              <Lightbulb className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {showHistoryList ? 'Interview History' : (viewingSessionId ? 'Past Interview Session' : 'Interview Practice')}
              </h2>
              <p className="text-gray-600 mt-1 hover:text-emerald-600 transition-colors">
                {showHistoryList ? 'Review your previous practice sessions and feedback.' : 'Chat with our AI to improve your interview skills.'}
              </p>
            </div>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('coach')}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                activeTab === 'coach' 
                  ? 'bg-white text-emerald-700 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
              }`}
            >
              AI Coach
            </button>
            <button
              onClick={() => setActiveTab('flashcards')}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                activeTab === 'flashcards' 
                  ? 'bg-white text-emerald-700 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
              }`}
            >
              Flashcards
            </button>
          </div>

          <div className="flex items-center gap-2">
            {!showHistoryList && !viewingSessionId && (
              <>
                <button 
                  onClick={() => setShowHistoryList(true)}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
                >
                  <History className="w-4 h-4" /> History
                </button>
                <button 
                  onClick={startNewSession}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Plus className="w-4 h-4" /> New Session
                </button>
              </>
            )}
            
            {(showHistoryList || viewingSessionId) && (
              <button 
                onClick={() => {
                   setShowHistoryList(false);
                   setViewingSessionId(null);
                }}
                className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Current
              </button>
            )}
            
            {!showHistoryList && !viewingSessionId && (
              <>
                <div className="flex flex-col items-end ml-4">
                  <label className="text-xs font-black text-emerald-900 uppercase tracking-widest mb-1.5">Questions:</label>
                  <select 
                    value={totalQuestions}
                    onChange={(e) => setTotalQuestions(Number(e.target.value))}
                    className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  >
                    <option value={3}>3 Questions</option>
                    <option value={5}>5 Questions</option>
                    <option value={10}>10 Questions</option>
                  </select>
                </div>
                <div className="flex flex-col items-end">
                  <label className="text-xs font-black text-emerald-900 uppercase tracking-widest mb-1.5">Persona:</label>
                  <select 
                    value={persona}
                    onChange={(e) => {
                      setPersona(e.target.value);
                      setMessages([{
                        id: Date.now().toString(),
                        role: 'model',
                        text: `I've switched my persona to **${e.target.value}**. Let's continue or start a new session. What role are we focusing on?`
                      }]);
                    }}
                    className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  >
                    {Object.keys(PERSONAS).map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Progress Bar - Only show when not in history list and activeTab is coach */}
        {!showHistoryList && activeTab === 'coach' && (
          <div className="w-full bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-xs font-bold text-gray-600 mb-2 uppercase tracking-wide">
                <span>Interview Progress</span>
                <span className="text-emerald-600">{Math.min(activeQuestionsAsked, activeTotalQuestions)} / {activeTotalQuestions} Questions</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200/50">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-700 ease-out relative overflow-hidden"
                  style={{ width: `${(Math.min(activeQuestionsAsked, activeTotalQuestions) / activeTotalQuestions) * 100}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 w-full" />
                </div>
              </div>
            </div>
            {activeQuestionsAsked >= activeTotalQuestions && (
              <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Complete</span>
              </div>
            )}
          </div>
        )}
      </div>

      {activeTab === 'flashcards' ? (
        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center bg-gray-50/50">
          <div className="w-full max-w-2xl [perspective:1000px]">
            <div 
              className={`relative w-full h-[350px] transition-all duration-500 [transform-style:preserve-3d] cursor-pointer ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
              onClick={() => setIsFlipped(!isFlipped)}
            >
              {/* Front */}
              <div className="absolute w-full h-full [backface-visibility:hidden] bg-white border-2 border-gray-200 rounded-3xl p-8 shadow-xl flex flex-col justify-center items-center text-center hover:border-emerald-300 transition-colors">
                <span className="absolute top-6 left-6 text-xs font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">{FLASHCARDS[currentCardIndex].category}</span>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{FLASHCARDS[currentCardIndex].question}</h3>
                <p className="absolute bottom-6 left-0 right-0 text-gray-400 text-sm font-medium animate-pulse">Click to flip</p>
              </div>
              
              {/* Back */}
              <div className="absolute w-full h-full [backface-visibility:hidden] bg-gradient-to-br from-emerald-600 to-teal-700 border-2 border-emerald-600 rounded-3xl p-8 shadow-xl flex flex-col justify-center items-center text-center [transform:rotateY(180deg)]">
                <span className="absolute top-6 left-6 text-xs font-black uppercase tracking-widest text-white bg-white/20 px-3 py-1 rounded-full">{FLASHCARDS[currentCardIndex].category}</span>
                <p className="text-lg sm:text-xl font-medium text-white leading-relaxed">{FLASHCARDS[currentCardIndex].answer}</p>
                <p className="absolute bottom-6 left-0 right-0 text-emerald-200 text-sm font-medium">Click to flip back</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6 mt-8">
            <button 
              onClick={(e) => { e.stopPropagation(); prevCard(); }}
              className="p-3 bg-white border-2 border-gray-200 rounded-full hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-600 transition-all shadow-sm active:scale-95"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <span className="text-sm font-bold text-gray-500 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
              {currentCardIndex + 1} / {FLASHCARDS.length}
            </span>
            <button 
              onClick={(e) => { e.stopPropagation(); nextCard(); }}
              className="p-3 bg-white border-2 border-gray-200 rounded-full hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-600 transition-all shadow-sm active:scale-95"
            >
              <ArrowLeft className="w-6 h-6 rotate-180" />
            </button>
          </div>
        </div>
      ) : showHistoryList ? (
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <History className="w-12 h-12 mb-4 text-gray-300" />
              <p>No past practice sessions found.</p>
            </div>
          ) : (
            history.map((session) => (
               <div 
                 key={session.id} 
                 className="p-4 border border-gray-200 rounded-xl hover:border-emerald-500 hover:shadow-md cursor-pointer transition-all flex items-center justify-between group"
                 onClick={() => {
                   setViewingSessionId(session.id);
                   setShowHistoryList(false);
                 }}
               >
                 <div>
                   <h3 className="font-bold text-gray-900 flex items-center gap-2">
                     <span className="text-emerald-600">{session.persona}</span>
                     <span className="bg-gray-100 px-2 py-0.5 rounded-md text-xs text-gray-600">
                       {session.totalQuestions} Questions
                     </span>
                   </h3>
                   <p className="text-sm text-gray-500 mt-1">
                     {new Date(session.date).toLocaleString()}
                   </p>
                 </div>
                 <div className="text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                   <span className="text-sm font-semibold">Review Session</span>
                   <ArrowLeft className="w-5 h-5 rotate-180" />
                 </div>
               </div>
            ))
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeMessages.map((msg, index) => (
            <div key={msg.id} className="space-y-2">
              <div className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'user' ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-100 text-emerald-600'
                }`}>
                  {msg.role === 'user' ? <User className="w-5 h-5" /> : <Lightbulb className="w-5 h-5" />}
                </div>
                <div className={`max-w-[80%] rounded-2xl p-4 ${
                  msg.role === 'user' 
                    ? 'bg-emerald-600 text-white rounded-tr-none shadow-md shadow-emerald-600/20' 
                    : 'bg-white border border-gray-100 shadow-sm text-gray-900 rounded-tl-none'
                }`}>
                  {msg.role === 'user' ? (
                    <div className="space-y-3">
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                      {msg.mediaUrl && (
                        <div className="mt-2 text-white bg-emerald-700/50 p-2 rounded-xl border border-emerald-500/30 overflow-hidden">
                          {msg.isVideo ? (
                            <video controls src={msg.mediaUrl} className="w-full max-h-48 rounded-lg" />
                          ) : (
                            <audio controls src={msg.mediaUrl} className="w-full h-8" />
                          )}
                        </div>
                      )}
                      <button 
                        onClick={() => msg.feedback ? toggleFeedback(msg.id) : getFeedback(msg.id, msg.text, index)}
                        className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider bg-white/20 hover:bg-white/30 px-2 py-1 rounded-md transition-colors w-fit"
                      >
                        <Sparkles className="w-3 h-3" />
                        {msg.feedback ? (msg.showFeedback ? 'Hide Feedback' : 'Show Feedback') : 'Analyze Response'}
                      </button>
                    </div>
                  ) : (
                    <div className="markdown-body prose prose-sm max-w-none">
                      <Markdown>{msg.text}</Markdown>
                    </div>
                  )}
                </div>
              </div>

              {msg.role === 'user' && msg.showFeedback && (
                <div className="flex flex-row-reverse gap-4">
                  <div className="w-10 shrink-0" /> {/* Spacer for avatar */}
                  <div className="max-w-[85%] w-full bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-xl space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="bg-emerald-100 p-2 rounded-xl">
                          <Sparkles className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Response Analysis</span>
                      </div>
                      {msg.isAnalyzing && (
                        <div className="flex items-center gap-2 text-emerald-600">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-xs font-bold animate-pulse">Processing...</span>
                        </div>
                      )}
                    </div>
                    
                    {msg.isAnalyzing ? (
                      <div className="space-y-4 py-4">
                        <div className="h-4 bg-slate-200 rounded-full w-3/4 animate-pulse" />
                        <div className="h-4 bg-slate-200 rounded-full w-1/2 animate-pulse" />
                      </div>
                    ) : msg.feedback && typeof msg.feedback === 'object' ? (
                      <div className="space-y-8">
                        {/* Detailed Categories */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Content */}
                          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                            <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider">
                              <Quote className="w-4 h-4" />
                              Content
                            </div>
                            <p className="text-xs leading-relaxed text-slate-600">{(msg.feedback as FeedbackData).content.analysis}</p>
                            <div className="space-y-2">
                              {(msg.feedback as FeedbackData).content.strengths.slice(0, 2).map((s, i) => (
                                <div key={i} className="flex items-center gap-2 text-[10px] text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md font-medium">
                                  <CheckCircle className="w-3 h-3" />
                                  {s}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Tone */}
                          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                            <div className="flex items-center gap-2 text-purple-600 font-bold text-xs uppercase tracking-wider">
                              <Zap className="w-4 h-4" />
                              Tone
                            </div>
                            <p className="text-xs leading-relaxed text-slate-600">{(msg.feedback as FeedbackData).tone.analysis}</p>
                            <div className="p-2 bg-purple-50 rounded-lg text-[10px] text-purple-700 italic border border-purple-100">
                              {(msg.feedback as FeedbackData).tone.advice}
                            </div>
                          </div>

                          {/* Clarity */}
                          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-amber-600 font-bold text-xs uppercase tracking-wider">
                                <BarChart className="w-4 h-4" />
                                Clarity
                              </div>
                              <span className="text-xs font-black text-amber-600">{(msg.feedback as FeedbackData).clarity.score}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-amber-500 h-full transition-all duration-1000" 
                                style={{ width: `${(msg.feedback as FeedbackData).clarity.score}%` }} 
                              />
                            </div>
                            <p className="text-xs leading-relaxed text-slate-600">{(msg.feedback as FeedbackData).clarity.analysis}</p>
                          </div>
                        </div>

                        {/* Granular Feedback */}
                        {((msg.feedback as FeedbackData).fillerWords || (msg.feedback as FeedbackData).starMethod || (msg.feedback as FeedbackData).examples) && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                            {/* Filler Words */}
                            {(msg.feedback as FeedbackData).fillerWords && (
                              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-rose-600 font-bold text-xs uppercase tracking-wider">
                                    <AlertTriangle className="w-4 h-4" />
                                    Filler Words
                                  </div>
                                  <span className={`text-xs font-black px-2 py-1 rounded-md ${(msg.feedback as FeedbackData).fillerWords!.count > 3 ? 'bg-rose-100 text-rose-700' : 'bg-green-100 text-green-700'}`}>
                                    Count: {(msg.feedback as FeedbackData).fillerWords!.count}
                                  </span>
                                </div>
                                <p className="text-xs leading-relaxed text-slate-600">{(msg.feedback as FeedbackData).fillerWords!.analysis}</p>
                                {(msg.feedback as FeedbackData).fillerWords!.examples.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {(msg.feedback as FeedbackData).fillerWords!.examples.map((fw, i) => (
                                      <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                                        {fw}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* STAR Method */}
                            {(msg.feedback as FeedbackData).starMethod && (
                              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
                                    <Star className="w-4 h-4" />
                                    STAR Method
                                  </div>
                                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${(msg.feedback as FeedbackData).starMethod!.used ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                                    {(msg.feedback as FeedbackData).starMethod!.used ? 'Used' : 'Not Used'}
                                  </span>
                                </div>
                                <p className="text-xs leading-relaxed text-slate-600">{(msg.feedback as FeedbackData).starMethod!.analysis}</p>
                              </div>
                            )}

                            {/* Examples */}
                            {(msg.feedback as FeedbackData).examples && (
                              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                                <div className="flex items-center gap-2 text-teal-600 font-bold text-xs uppercase tracking-wider">
                                  <MessageSquare className="w-4 h-4" />
                                  Example Quality
                                </div>
                                <p className="text-xs leading-relaxed text-slate-600">{(msg.feedback as FeedbackData).examples!.clarity}</p>
                                <div className="p-2 bg-teal-50 rounded-lg text-[10px] text-teal-700 border border-teal-100 font-medium">
                                  👉 {(msg.feedback as FeedbackData).examples!.advice}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Actionable Tip */}
                        <div className="bg-emerald-600 p-4 rounded-2xl text-white shadow-lg shadow-emerald-600/20 group hover:scale-[1.02] transition-transform duration-300">
                          <div className="flex items-start gap-4">
                            <div className="bg-white/20 p-2 rounded-xl group-hover:rotate-12 transition-transform">
                              <Zap className="w-5 h-5 text-white shadow-glow" />
                            </div>
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Expert Tip for Next Time</span>
                              <p className="text-sm font-bold mt-1 text-emerald-50 leading-snug">
                                {(msg.feedback as FeedbackData).actionableTip}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : typeof msg.feedback === 'string' ? (
                      <div className="markdown-body prose prose-sm prose-emerald max-w-none">
                        <Markdown>{msg.feedback as string}</Markdown>
                      </div>
                    ) : (
                      <p className="text-sm text-red-500 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Failed to generate analysis.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <Lightbulb className="w-5 h-5" />
              </div>
              <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-none p-4 flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                <span className="text-gray-500 text-sm">AI is typing...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input area, only show if not viewing history list or old session and activeTab is coach */}
      {!showHistoryList && !viewingSessionId && activeTab === 'coach' && (
        <div className="p-4 border-t border-gray-200 bg-white relative">
          {/* Video Preview Overlay */}
          <div 
            className={`absolute bottom-full mb-4 right-4 bg-gray-900 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 transform origin-bottom-right ${
              isRecording && isVideoEnabled ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
            }`}
            style={{ width: '240px', height: '180px' }}
          >
            <video 
              ref={videoPreviewRef} 
              autoPlay 
              muted 
              playsInline 
              className="w-full h-full object-cover" 
            />
            <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-rose-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              {Math.floor(recordingTimeLeft / 60).toString().padStart(2, '0')}:{(recordingTimeLeft % 60).toString().padStart(2, '0')}
            </div>
          </div>

          {isStarPromptActive ? (
            <div className="max-w-4xl mx-auto bg-emerald-50 p-6 rounded-2xl border border-emerald-100 shadow-lg shadow-emerald-900/5 space-y-5 mb-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                <Star className="w-48 h-48 text-emerald-900" />
              </div>
              <div className="relative z-10 space-y-5">
                <div>
                  <h3 className="text-lg font-black text-emerald-900 flex items-center gap-2">
                    <Star className="w-5 h-5 text-emerald-600 fill-emerald-600" /> Structure Your Answer
                  </h3>
                  <p className="text-sm text-emerald-700 mt-1">You submitted: <span className="italic block mt-1 p-2 bg-white/50 rounded-lg border border-emerald-200">"{initialResponseText}"</span></p>
                  <p className="text-sm text-emerald-800 mt-3 font-medium">Use the STAR method to make your answer stronger, or submit it as-is.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center justify-between">
                      Situation
                      <span className="text-[10px] text-emerald-600/70 lowercase font-medium tracking-normal">Set the scene</span>
                    </label>
                    <textarea 
                      value={starData.situation}
                      onChange={(e) => setStarData({...starData, situation: e.target.value})}
                      placeholder="e.g., During my time at Company X..."
                      className="w-full bg-white border border-emerald-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-gray-400"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center justify-between">
                      Task
                      <span className="text-[10px] text-emerald-600/70 lowercase font-medium tracking-normal">Your responsibility</span>
                    </label>
                    <textarea 
                      value={starData.task}
                      onChange={(e) => setStarData({...starData, task: e.target.value})}
                      placeholder="e.g., I was responsible for..."
                      className="w-full bg-white border border-emerald-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-gray-400"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center justify-between">
                      Action
                      <span className="text-[10px] text-emerald-600/70 lowercase font-medium tracking-normal">Steps you took</span>
                    </label>
                    <textarea 
                      value={starData.action}
                      onChange={(e) => setStarData({...starData, action: e.target.value})}
                      placeholder="e.g., I implemented a new system by..."
                      className="w-full bg-white border border-emerald-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-gray-400"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center justify-between">
                      Result
                      <span className="text-[10px] text-emerald-600/70 lowercase font-medium tracking-normal">Impact & metrics</span>
                    </label>
                    <textarea 
                      value={starData.result}
                      onChange={(e) => setStarData({...starData, result: e.target.value})}
                      placeholder="e.g., This led to a 20% increase in..."
                      className="w-full bg-white border border-emerald-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-gray-400"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button 
                    onClick={() => { setIsStarPromptActive(false); setInput(initialResponseText); setInitialResponseText(''); }}
                    className="px-5 py-2.5 text-sm font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-xl transition-colors border border-emerald-200/50"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSend}
                    className="px-5 py-2.5 text-sm font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-600/20 flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Submit Final Answer
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-w-4xl mx-auto">
              <div className="flex items-center gap-2">
              <button
                onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                disabled={isRecording}
                className={`p-3 rounded-xl transition-colors flex items-center justify-center shrink-0 border border-gray-200 ${
                  isVideoEnabled 
                    ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' 
                    : 'bg-white text-gray-400 hover:bg-gray-50'
                } disabled:opacity-50`}
                title={isVideoEnabled ? "Video enabled" : "Video disabled"}
              >
                {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>

              <button
                onClick={toggleRecording}
                className={`p-3 rounded-xl transition-colors flex items-center justify-center shrink-0 border border-transparent ${
                  isRecording 
                    ? 'bg-rose-100 text-rose-600 hover:bg-rose-200 animate-pulse border-rose-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200'
                }`}
                title={isRecording ? "Stop Recording" : "Start Voice Dictation"}
              >
                {isRecording ? <Square className="w-5 h-5 fill-current" /> : <Mic className="w-5 h-5" />}
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={isRecording ? "Listening..." : "Type your response or use the microphone/camera..."}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="bg-emerald-600 text-white p-3 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            {isRecording && (
                <div className="flex items-center gap-2 justify-center mt-2">
                  <div className="text-xs text-rose-600 bg-rose-50 px-2 py-1 rounded-md font-bold font-mono tracking-wider">
                    {Math.floor(recordingTimeLeft / 60).toString().padStart(2, '0')}:{(recordingTimeLeft % 60).toString().padStart(2, '0')}
                  </div>
                  <div className="text-xs text-gray-500 animate-pulse font-medium">
                    Recording {isVideoEnabled ? 'video and audio' : 'audio'}... Speak clearly. Press stop when finished.
                  </div>
                </div>
            )}
          </div>
          )}
        </div>
      )}
    </div>
  );
}
