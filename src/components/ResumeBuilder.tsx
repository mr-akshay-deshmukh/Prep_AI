import { useState, useRef, useEffect } from 'react';
import { Loader2, Download, Copy, Check, FileDown } from 'lucide-react';
import { generateText } from '../lib/gemini';
import Markdown from 'react-markdown';
import pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import htmlToPdfmake from 'html-to-pdfmake';
import { marked } from 'marked';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { SpellcheckTextArea } from './SpellcheckTextArea';

const fonts = (pdfFonts as any).default || pdfFonts;
(pdfMake as any).vfs = fonts?.pdfMake?.vfs || fonts?.vfs || (window as any).pdfMake?.vfs;

export function ResumeBuilder() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    summary: '',
    experience: '',
    education: '',
    skills: '',
    projects: '',
    template: 'Standard Professional'
  });
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error' | 'restoring'>('idle');

  // Monitor auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setCurrentUser(usr);
    });
    return () => unsubscribe();
  }, []);

  // Restore draft from cloud / local storage
  useEffect(() => {
    let active = true;
    
    async function initDraft() {
      if (currentUser) {
        setSaveStatus('restoring');
        try {
          const docRef = doc(db, 'resumes', currentUser.uid);
          const snap = await getDoc(docRef);
          if (snap.exists() && active) {
            const data = snap.data();
            setFormData({
              name: data.name || '',
              email: data.email || '',
              phone: data.phone || '',
              summary: data.summary || '',
              experience: data.experience || '',
              education: data.education || '',
              skills: data.skills || '',
              projects: data.projects || '',
              template: data.template || 'Standard Professional'
            });
            if (data.result) {
              setResult(data.result);
            }
            setSaveStatus('saved');
          } else if (active) {
            // Restore from local storage fallback
            const cached = localStorage.getItem('prepai_resume_draft');
            if (cached) {
              try {
                const parsed = JSON.parse(cached);
                if (parsed.formData) setFormData(parsed.formData);
                if (parsed.result) setResult(parsed.result);
              } catch (_) {}
            }
            setSaveStatus('saved');
          }
        } catch (err) {
          console.error("Failed to restore cloud draft:", err);
          if (active) {
            const cached = localStorage.getItem('prepai_resume_draft');
            if (cached) {
              try {
                const parsed = JSON.parse(cached);
                if (parsed.formData) setFormData(parsed.formData);
                if (parsed.result) setResult(parsed.result);
              } catch (_) {}
            }
            setSaveStatus('error');
          }
        }
      } else {
        // Guest user local draft
        setSaveStatus('restoring');
        const cached = localStorage.getItem('prepai_resume_draft');
        if (cached && active) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed.formData) setFormData(parsed.formData);
            if (parsed.result) setResult(parsed.result);
          } catch (_) {}
        }
        if (active) setSaveStatus('saved');
      }
      
      if (active) {
        setIsInitialized(true);
      }
    }

    initDraft();
    return () => {
      active = false;
    };
  }, [currentUser]);

  // Debounced autosave
  useEffect(() => {
    if (!isInitialized) return;

    const timer = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        if (currentUser) {
          const docRef = doc(db, 'resumes', currentUser.uid);
          const payload = {
            userId: currentUser.uid,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            summary: formData.summary,
            experience: formData.experience,
            education: formData.education,
            skills: formData.skills,
            projects: formData.projects,
            template: formData.template,
            result: result || '',
            updatedAt: new Date().toISOString()
          };
          await setDoc(docRef, payload, { merge: true });
        }
        
        // Always save to local storage as fallback/guest save
        localStorage.setItem('prepai_resume_draft', JSON.stringify({ formData, result }));
        setSaveStatus('saved');
      } catch (err) {
        console.error("Autosave failed:", err);
        try {
          handleFirestoreError(err, OperationType.WRITE, `resumes/${currentUser?.uid}`);
        } catch (_) {}
        setSaveStatus('error');
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [formData, result, currentUser, isInitialized]);

  const templates = [
    { id: 'Standard Professional', name: 'Standard Professional', description: 'Traditional structure, best for corporate roles.' },
    { id: 'Modern Creative', name: 'Modern Creative', description: 'Focus on impact and design, great for startups/design.' },
    { id: 'Technical IT', name: 'Technical / IT', description: 'Emphasizes tech stack and complex projects.' },
    { id: 'Academic CV', name: 'Academic & Research', description: 'Focus on education, research, and publications.' }
  ];
  
  const resumeRef = useRef<HTMLDivElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSaveStatus('idle');
  };

  const handleFixSpell = (fieldName: string, originalWord: string, replacement: string, type: 'spelling' | 'duplicate') => {
    const currentText = formData[fieldName as keyof typeof formData];
    if (typeof currentText !== 'string') return;

    let newText = currentText;
    if (type === 'duplicate') {
      const regex = new RegExp(`\\b${originalWord}\\b`, 'gi');
      newText = currentText.replace(regex, replacement);
    } else {
      const regex = new RegExp(`\\b${originalWord}\\b`, 'g');
      newText = currentText.replace(regex, replacement);
    }

    setFormData({ ...formData, [fieldName]: newText });
    setSaveStatus('idle');
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    
    const prompt = `
      Create a professional, ATS-friendly resume using the following details. 
      The user wants the resume formatted in a "${formData.template}" style. Adapt the tone, section ordering, and emphasis for this template.
      Format it clearly using Markdown. Use strong action verbs and quantify achievements where possible (even if you have to suggest placeholders like [X]%).
      
      Name: ${formData.name}
      Email: ${formData.email}
      Phone: ${formData.phone}
      
      Professional Summary:
      ${formData.summary}
      
      Experience:
      ${formData.experience}
      
      Education:
      ${formData.education}
      
      Skills:
      ${formData.skills}
      
      Projects:
      ${formData.projects}
    `;

    try {
      const generatedResume = await generateText(
        prompt, 
        "You are an expert resume writer. Your goal is to take raw user input and format it into a highly professional, ATS-optimized resume in Markdown format. Ensure clear headings, bullet points, and professional language."
      );
      setResult(generatedResume);
    } catch (error) {
      console.error(error);
      alert("Failed to generate resume.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadPdf = async () => {
    if (!result || !resumeRef.current) return;
    setIsDownloading(true);
    
    try {
      // Force preview styles to settle
      await new Promise(resolve => setTimeout(resolve, 150));

      const element = resumeRef.current;
      
      // Get dimensions of the preview element
      const width = element.offsetWidth;
      const height = element.offsetHeight;

      // Render the styled HTML element to an image
      const imgData = await toPng(element, {
        quality: 1.0,
        pixelRatio: 2, // Ultra-sharp print resolution
        backgroundColor: '#ffffff',
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
        }
      });
      
      // Generate a high-fidelity PDF with standard padding page format
      const pdf = new jsPDF({
        orientation: height > width ? 'portrait' : 'landscape',
        unit: 'px',
        format: [width + 30, height + 40]
      });
      
      pdf.addImage(imgData, 'PNG', 15, 20, width, height);

      const filename = `${formData.name ? formData.name.replace(/\s+/g, '_') : 'resume'}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error("High-fidelity PDF generation failed, falling back to basic pdfmake", error);
      try {
        // Fallback to basic pdfmake
        const htmlText = await marked.parse(result);
        const val = htmlToPdfmake(htmlText, { window: window as any });
        
        const docDefinition = {
          content: val,
          defaultStyle: {
            fontSize: 10,
            color: '#333333'
          }
        };
        
        const filename = `${formData.name ? formData.name.replace(/\s+/g, '_') : 'resume'}.pdf`;
        pdfMake.createPdf(docDefinition).download(filename);
      } catch (innerError) {
        console.error("Fallback PDF generation failed too", innerError);
        alert("Failed to export PDF. Please copy the text or use standard page print (Ctrl+P/Cmd+P).");
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleBrowserPrint = () => {
    if (!result) return;
    document.body.classList.add('printing-resume');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-resume');
    }, 500);
  };

  const renderSaveIndicator = () => {
    switch (saveStatus) {
      case 'restoring':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-xl border border-blue-100 font-medium shadow-sm transition-all">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
            Restoring your draft...
          </span>
        );
      case 'saving':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-100 font-medium shadow-sm transition-all">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
            Saving changes...
          </span>
        );
      case 'saved':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-100 font-bold shadow-sm transition-all">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            {currentUser ? 'Saved to Cloud' : 'Saved Locally (Guest)'}
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-red-600 bg-red-50 px-2.5 py-1.5 rounded-xl border border-red-100 font-medium shadow-sm transition-all">
            Error saving draft
          </span>
        );
      case 'idle':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 px-2.5 py-1.5 rounded-xl border border-gray-200 font-medium shadow-sm transition-all">
            Unsaved changes
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Resume Builder</h2>
          <p className="text-gray-600 mt-2">Fill in your details and let AI generate an ATS-friendly resume for you.</p>
        </div>
        <div className="flex items-center">
          {renderSaveIndicator()}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4 h-[calc(100vh-12rem)] overflow-y-auto">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 sticky top-0 bg-white py-2 border-b">Your Details</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Resume Template</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {templates.map((tpl) => (
                <div 
                  key={tpl.id}
                  onClick={() => {
                    setFormData({ ...formData, template: tpl.id });
                    setSaveStatus('idle');
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${formData.template === tpl.id ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'}`}
                >
                  <div className="font-semibold text-sm text-gray-900">{tpl.name}</div>
                  <div className="text-xs text-gray-500 mt-1 leading-snug">{tpl.description}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full border border-gray-200 bg-gray-50 focus:bg-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-colors" placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border border-gray-200 bg-gray-50 focus:bg-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-colors" placeholder="john@example.com" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full border border-gray-200 bg-gray-50 focus:bg-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-colors" placeholder="+1 234 567 8900" />
          </div>

          <SpellcheckTextArea
            label="Professional Summary"
            name="summary"
            value={formData.summary}
            onChange={handleChange}
            onFix={handleFixSpell}
            rows={3}
            placeholder="Brief overview of your career and goals..."
          />

          <SpellcheckTextArea
            label="Experience"
            name="experience"
            value={formData.experience}
            onChange={handleChange}
            onFix={handleFixSpell}
            rows={4}
            placeholder="Company, Role, Dates, Responsibilities..."
          />

          <SpellcheckTextArea
            label="Education"
            name="education"
            value={formData.education}
            onChange={handleChange}
            onFix={handleFixSpell}
            rows={3}
            placeholder="University, Degree, Year..."
          />

          <SpellcheckTextArea
            label="Skills"
            name="skills"
            value={formData.skills}
            onChange={handleChange}
            onFix={handleFixSpell}
            rows={2}
            placeholder="React, Node.js, Python, Project Management..."
          />

          <SpellcheckTextArea
            label="Projects"
            name="projects"
            value={formData.projects}
            onChange={handleChange}
            onFix={handleFixSpell}
            rows={4}
            placeholder="Project Name, Tech Stack, Description..."
          />

          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-6 shadow-lg shadow-emerald-600/20"
          >
            {isLoading ? <><Loader2 className="w-5 h-5 animate-spin text-emerald-200 animate-pulse" /> Generating...</> : 'Generate ATS Resume'}
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm h-[calc(100vh-12rem)] flex flex-col no-print">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-2 border-b">
            <h3 className="text-xl font-semibold text-gray-900">Generated Resume</h3>
            {result && (
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={handleBrowserPrint}
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold border border-emerald-100 cursor-pointer"
                  title="Print or Save as PDF via Browser (Highest Quality Text for ATS)"
                >
                  <FileDown className="w-4 h-4" />
                  Print / Save PDF
                </button>
                <button 
                  onClick={handleDownloadPdf} 
                  disabled={isDownloading}
                  className="px-3 py-1.5 bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold border border-gray-200 cursor-pointer" 
                  title="Download directly as high-fidelity PDF file"
                >
                  {isDownloading ? <Loader2 className="w-4 h-4 animate-spin text-emerald-600" /> : <Download className="w-4 h-4" />}
                  Download PDF (Image)
                </button>
                <button 
                  onClick={handleCopy} 
                  className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer" 
                  title="Copy Markdown"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span className="text-xs font-medium">Copy</span>
                </button>
              </div>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mb-4" />
                <p>Crafting your perfect resume...</p>
              </div>
            ) : result ? (
              <div ref={resumeRef} className="printable-resume-area markdown-body prose prose-sm max-w-none p-4 bg-white">
                <Markdown>{result}</Markdown>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <p>Fill in your details and click generate to see your resume here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
