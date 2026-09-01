import { useState } from 'react';
import { Star, Loader2, Sparkles, BookOpen } from 'lucide-react';
import { generateText } from '../lib/gemini';
import Markdown from 'react-markdown';

export function StoryVault() {
  const [question, setQuestion] = useState('Tell me about a time you had to overcome a significant challenge.');
  const [story, setStory] = useState('');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!story.trim() || isLoading) return;
    
    setIsLoading(true);
    const prompt = `
      You are an expert technical recruiter and behavioral interview coach from a top tech company.
      Analyze the following behavioral interview story using the STAR framework (Situation, Task, Action, Result).

      Interview Question: "${question}"
      Candidate's Story: "${story}"

      Provide your feedback in Markdown format with this exact structure:
      ## 🎯 Overall Rating (out of 10)
      
      ## ⭐️ STAR Breakdown
      For each section, provide a score out of 10 and a brief critique of how well the candidate established it.
      - **Situation:** (score/10) Critique...
      - **Task:** (score/10) Critique...
      - **Action:** (score/10) Critique...
      - **Result:** (score/10) Critique...
      
      ## 🛠️ Areas for Improvement
      List 2-3 specific things the candidate can do to make this story more impactful.
      
      ## ✨ The "Perfected" Story
      Rewrite the story to be polished, high-impact, and interview-ready, keeping the core facts intact but elevating the professional language and narrative structure.
    `;

    try {
      const response = await generateText(
        prompt, 
        "You are an elite executive coach helping candidates perfect their behavioral interview stories."
      );
      setAnalysis(response);
    } catch (error) {
      console.error("Failed to analyze story:", error);
      setAnalysis("An error occurred while analyzing the story. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 pb-12">
      <div className="w-full lg:w-1/2 space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Star className="w-8 h-8 text-amber-500" />
            STAR Story Vault
          </h2>
          <p className="text-gray-600 mt-2">
            Behavioral questions make or break interviews. Draft your experiences here, and let AI score them against the STAR framework and give you a polished version to memorize.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
              Behavioral Question
            </label>
            <input 
              type="text" 
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full border border-gray-200 bg-gray-50 focus:bg-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 outline-none transition-colors font-medium text-gray-900"
              placeholder="e.g., Tell me about a time you failed."
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
              Your Story Draft
            </label>
            <textarea 
              value={story}
              onChange={(e) => setStory(e.target.value)}
              rows={8}
              className="w-full border border-gray-200 bg-gray-50 focus:bg-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 outline-none transition-colors resize-none leading-relaxed"
              placeholder="I was working on a project and the deadline was moved up by two weeks..."
            />
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <BookOpen className="w-3 h-3" /> Don't worry about being perfect. Just get the facts down.
            </p>
          </div>

          <button 
            onClick={handleAnalyze}
            disabled={!story.trim() || isLoading}
            className="w-full bg-amber-500 text-white font-bold py-4 rounded-xl hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {isLoading ? 'Analyzing Story...' : 'Analyze & Perfect Story'}
          </button>
        </div>
      </div>

      <div className="w-full lg:w-1/2">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 lg:p-8 h-full min-h-[500px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-amber-600 gap-4">
              <Loader2 className="w-12 h-12 animate-spin" />
              <p className="font-medium animate-pulse">Evaluating your STAR methodology...</p>
            </div>
          ) : analysis ? (
            <div className="markdown-body prose prose-amber max-w-none">
              <Markdown>{analysis}</Markdown>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4 text-center">
              <Star className="w-16 h-16 opacity-20" />
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Awaiting Your Story</h3>
                <p className="text-sm">Write your story draft on the left. The AI will provide a score, breakdown, and a perfected version here.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
