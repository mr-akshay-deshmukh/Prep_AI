import { useState, useRef } from 'react';
import { Upload, FileText, Loader2, AlertCircle } from 'lucide-react';
import { analyzeResume } from '../lib/gemini';
import Markdown from 'react-markdown';

export function ResumeAnalyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (selected.type === 'application/pdf') {
        setFile(selected);
        setError(null);
      } else {
        setError("Please upload a PDF file.");
        setFile(null);
      }
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64data = (reader.result as string).split(',')[1];
          const analysis = await analyzeResume(base64data, file.type);
          setResult(analysis);
        } catch (err) {
          console.error(err);
          setError("Failed to analyze resume. Please try again.");
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setError("Failed to read file.");
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Resume Analyzer</h2>
        <p className="text-gray-600 mt-2">Upload your resume to get AI-powered job role suggestions and improvement tips.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Resume</h3>
            
            <div 
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
                file ? 'border-emerald-500 bg-emerald-50/50' : 'border-gray-200 hover:border-emerald-400 bg-gray-50'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf"
                className="hidden" 
              />
              
              {file ? (
                <div className="flex flex-col items-center">
                  <FileText className="w-10 h-10 text-emerald-500 mb-3" />
                  <p className="text-sm font-medium text-gray-900 truncate max-w-full">{file.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 text-xs text-emerald-600 font-bold hover:underline bg-emerald-100 px-3 py-1.5 rounded-full"
                  >
                    Change File
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-10 h-10 text-gray-400 mb-3" />
                  <p className="text-sm font-medium text-gray-900">Click to upload PDF</p>
                  <p className="text-xs text-gray-500 mt-1">Max file size: 5MB</p>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={!file || isLoading}
              className="w-full mt-6 bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Analyze Resume'
              )}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm min-h-[400px]">
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4 py-20">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
                <p>Our AI is analyzing your resume...</p>
              </div>
            ) : result ? (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6 border-b pb-4">Analysis Results</h3>
                <div className="markdown-body prose prose-emerald max-w-none">
                  <Markdown>{result}</Markdown>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4 py-20">
                <FileText className="w-16 h-16 opacity-20" />
                <p>Upload a resume and click analyze to see results here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
