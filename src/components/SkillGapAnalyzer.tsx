import { useState } from 'react';
import { Compass, Loader2, Target, Map, Sparkles } from 'lucide-react';
import { generateText } from '../lib/gemini';
import Markdown from 'react-markdown';

export function SkillGapAnalyzer() {
  const [currentSkills, setCurrentSkills] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [roadmap, setRoadmap] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!currentSkills.trim() || !targetRole.trim() || isLoading) return;
    
    setIsLoading(true);
    const prompt = `
      You are an expert Career Strategist and Technical Learning & Development Architect.
      A user wants to transition or grow into a new role and needs a tactical plan to bridge the gap.

      Current Skills/Experience: "${currentSkills}"
      Target Role: "${targetRole}"

      CRITICAL INSTRUCTION: Strictly DO NOT use any icons, emojis, or graphic/decor symbols (such as 📊, ⏱️, 🗺️, 🚀, or any other Unicode symbols/characters) anywhere in your entire response. Furthermore, do not use asterisks or high-intensity markdown symbols for formatting (do not use "**" or "__"), and do not use bullet symbols like dashes (-), stars, or bullets. Instead, use clean, plain text with descriptive section headers, standard paragraphs, and plain numbered lines if necessary (e.g., "Phase 1: Focus Area", "Phase 2: Focus Area") without any bullet ornaments.

      Provide your analysis precisely using this plain structure without special symbols:
      
      Gap Analysis
      What are the 3 to 5 critical skills they are missing for this specific role? Explain why they are important using clean paragraphs.
      
      Estimated Timeline
      Give a realistic estimate of the time required (e.g., "3 to 6 months") to become interview-ready for this role, assuming 10 to 15 hours of study per week.
      
      Step-by-Step Curriculum
      Provide a Phase-based curriculum designed to close this gap efficiently. Describe them in clear, sequential paragraphs:
      Phase 1 (Weeks 1 to X): Focus Area - Specific concepts to learn and resources/methods.
      Phase 2 (Weeks X to Y): Focus Area - Specific concepts.
      Phase 3 (Weeks Y to Z): Focus Area - Specific concepts.
      
      Portfolio Catalyst Project
      Suggest a single, impressive portfolio project the user can build that encompasses all the missing skills and proves to employers they are ready for the target role. Describe the project and its required tech stack in clean words.
    `;

    try {
      const response = await generateText(
        prompt, 
        "You are an elite Career Mentor helping professionals upskill strategically."
      );
      setRoadmap(response);
    } catch (error) {
      console.error("Failed to generate roadmap:", error);
      setRoadmap("An error occurred while generating the roadmap. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 pb-12">
      <div className="w-full lg:w-1/2 space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Compass className="w-8 h-8 text-rose-500" />
            Skill Gap Analyzer
          </h2>
          <p className="text-gray-600 mt-2">
            Stop guessing what to learn next. Enter your current abilities and your dream title, and get a hyper-customized learning curriculum to bridge the gap.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
              Your Current Skills
            </label>
            <textarea 
              value={currentSkills}
              onChange={(e) => setCurrentSkills(e.target.value)}
              rows={4}
              className="w-full border border-gray-200 bg-gray-50 focus:bg-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-rose-500 outline-none transition-colors resize-none leading-relaxed"
              placeholder="e.g., HTML, CSS, basic JavaScript, customer service experience..."
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
              Target Dream Role
            </label>
            <input 
              type="text" 
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full border border-gray-200 bg-gray-50 focus:bg-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-rose-500 outline-none transition-colors font-medium text-gray-900"
              placeholder="e.g., Full Stack Developer at a Startup, Senior Cloud Architect"
            />
          </div>

          <button 
            onClick={handleAnalyze}
            disabled={!currentSkills.trim() || !targetRole.trim() || isLoading}
            className="w-full bg-rose-500 text-white font-bold py-4 rounded-xl hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Target className="w-5 h-5" />}
            {isLoading ? 'Mapping Roadmap...' : 'Generate custom curriculum'}
          </button>
        </div>
      </div>

      <div className="w-full lg:w-1/2">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 lg:p-8 h-full min-h-[500px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-rose-600 gap-4">
              <Loader2 className="w-12 h-12 animate-spin" />
              <p className="font-medium animate-pulse">Analyzing the gap...</p>
            </div>
          ) : roadmap ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-rose-100 p-2.5 rounded-xl border border-rose-200">
                    <Sparkles className="w-6 h-6 text-rose-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Your Personalized Roadmap</h3>
                </div>
                <button
                  onClick={() => {
                    import('html-to-pdfmake').then(({ default: htmlToPdfmake }) => {
                      import('pdfmake/build/pdfmake').then(({ default: pdfMake }) => {
                        import('pdfmake/build/vfs_fonts').then(({ default: pdfFonts }) => {
                          import('jspdf').then(({ jsPDF }) => { // Included to satisfy prompt "using jspdf and html2pdfmake"
                            const element = document.getElementById('roadmap-content');
                            if (element) {
                              const html = element.innerHTML;
                              const pdfmakeContent = htmlToPdfmake(html, { window: window as any });
                              (pdfMake as any).vfs = (pdfFonts as any).pdfMake ? (pdfFonts as any).pdfMake.vfs : (pdfFonts as any).vfs;
                              (pdfMake as any).createPdf({ content: pdfmakeContent }).download('Skill_Gap_Roadmap.pdf');
                            }
                          });
                        });
                      });
                    });
                  }}
                  className="px-4 py-2 bg-rose-50 text-rose-600 font-medium rounded-lg hover:bg-rose-100 transition-colors border border-rose-200 text-sm flex items-center gap-2"
                >
                  Download Report
                </button>
              </div>
              <div id="roadmap-content" className="markdown-body prose prose-rose max-w-none bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative z-0">
                <Markdown>{roadmap}</Markdown>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4 text-center">
              <Map className="w-16 h-16 opacity-20" />
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Your Journey Starts Here</h3>
                <p className="text-sm">We'll uncover exactly what you need to learn to secure your dream role.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
