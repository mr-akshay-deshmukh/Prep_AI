import { useState, useEffect, useRef } from 'react';
import { Loader2, Code2, Sparkles } from 'lucide-react';
import { generateText } from '../lib/gemini';
import Markdown from 'react-markdown';
import mermaid from 'mermaid';

mermaid.initialize({ startOnLoad: false, theme: 'base', themeVariables: { primaryColor: '#10b981', primaryTextColor: '#064e3b', primaryBorderColor: '#059669', lineColor: '#059669', secondaryColor: '#a7f3d0', tertiaryColor: '#ecfdf5' } });

function MermaidChart({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && chart) {
      const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
      mermaid.render(id, chart).then((result) => {
        if (ref.current) {
          ref.current.innerHTML = result.svg;
        }
      }).catch((e) => {
        console.error("Mermaid rendering error", e);
      });
    }
  }, [chart]);

  return <div ref={ref} className="flex justify-center my-8 overflow-x-auto bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100" />;
}

export function ProjectBuilder() {
  const [idea, setIdea] = useState('');
  const [difficulty, setDifficulty] = useState('Beginner');
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!idea.trim()) return;
    
    setIsLoading(true);
    
    const prompt = `
      I want to build the following software project: "${idea}"
      My current skill level allows me to build this at a "${difficulty}" level.
      
      Please provide a comprehensive guide tailored to a ${difficulty} developer, including:
      1. Recommended Tech Stack (Frontend, Backend, Database, Deployment) with reasons, appropriately scoped for the ${difficulty} level.
      2. Languages and Frameworks I need to learn.
      3. A step-by-step learning path and development roadmap to build this project.
      4. Potential challenges and how to overcome them.
      5. A high-level system architecture diagram using Mermaid.js syntax. Enclose the Mermaid code in a markdown code block with the language set to "mermaid" (e.g., \`\`\`mermaid ... \`\`\`). Use a flowchart (graph TD or LR) to show how the frontend, backend, database, and external services interact.
    `;

    try {
      const response = await generateText(
        prompt, 
        "You are an expert software architect and mentor. Your goal is to help students plan their engineering projects. Provide clear, modern, and practical tech stack recommendations, a structured learning path, and a Mermaid.js architecture diagram."
      );
      setResult(response);
    } catch (error) {
      console.error(error);
      alert("Failed to generate project plan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-8 text-center">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
          <Code2 className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Project Builder</h2>
        <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
          Have an idea for an engineering project? Describe it below, and AI will suggest the best languages, frameworks, a step-by-step roadmap, and an architecture diagram to build it.
        </p>
      </header>

      <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center mb-8 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-transparent transition-all">
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-medium text-gray-700 w-full sm:w-auto"
          disabled={isLoading}
        >
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </select>
        <input
          type="text"
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          placeholder="e.g., An e-commerce website for selling custom sneakers..."
          className="flex-1 px-4 py-3 outline-none text-gray-900 bg-transparent w-full"
          disabled={isLoading}
        />
        <button
          onClick={handleGenerate}
          disabled={!idea.trim() || isLoading}
          className="bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 w-full sm:w-auto shrink-0"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          Generate Plan
        </button>
      </div>

      {isLoading && (
        <div className="bg-white p-12 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-gray-500">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mb-4" />
          <p className="text-lg">Architecting your project...</p>
        </div>
      )}

      {result && !isLoading && (
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
          <div className="markdown-body prose prose-emerald max-w-none">
            <Markdown
              components={{
                code(props) {
                  const { children, className, node, ...rest } = props;
                  const match = /language-(\w+)/.exec(className || '');
                  if (match && match[1] === 'mermaid') {
                    return <MermaidChart chart={String(children).replace(/\n$/, '')} />;
                  }
                  return (
                    <code {...rest} className={className}>
                      {children}
                    </code>
                  );
                }
              }}
            >
              {result}
            </Markdown>
          </div>
        </div>
      )}
    </div>
  );
}
