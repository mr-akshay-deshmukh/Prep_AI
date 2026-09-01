import { useState, useMemo } from 'react';
import { AlertCircle, Sparkles, Check, ChevronDown, ChevronUp } from 'lucide-react';

// Common resume and business document typos with their correct spellings
export const TYPO_DICTIONARY: Record<string, string> = {
  "experiance": "experience",
  "experianced": "experienced",
  "seperate": "separate",
  "seperated": "separated",
  "recieve": "receive",
  "recieved": "received",
  "definately": "definitely",
  "goverment": "government",
  "collegue": "colleague",
  "collegues": "colleagues",
  "enviornment": "environment",
  "enviornments": "environments",
  "developement": "development",
  "developements": "developments",
  "commited": "committed",
  "sucessful": "successful",
  "sucessfully": "successfully",
  "sucess": "success",
  "professionaly": "professionally",
  "impliment": "implement",
  "implimented": "implemented",
  "posibility": "possibility",
  "responsability": "responsibility",
  "responsabilities": "responsibilities",
  "achievment": "achievement",
  "achievments": "achievements",
  "knowlege": "knowledge",
  "teh": "the",
  "managment": "management",
  "softwear": "software",
  "curiculum": "curriculum",
  "certifcate": "certificate",
  "certifcates": "certificates",
  "collaorate": "collaborate",
  "colaborated": "collaborated",
  "involment": "involvement",
  "responsibe": "responsible",
  "analasis": "analysis",
  "analyis": "analysis",
  "stratagy": "strategy",
  "stratagies": "strategies",
  "tecnology": "technology",
  "tecnologies": "technologies",
  "programing": "programming",
  "datbase": "database",
  "datbases": "databases",
  "webiste": "website",
  "webistes": "websites",
  "responsibilites": "responsibilities",
  "leadship": "leadership",
  "comunication": "communication",
  "communiction": "communication",
  "orginizational": "organizational",
  "creativty": "creativity",
  "paticipated": "participated",
  "particpated": "participated",
  "preformance": "performance",
  "efficienty": "efficiently",
  "mainteance": "maintenance",
  "maintenence": "maintenance",
  "architectue": "architecture",
  "clent": "client",
  "clents": "clients",
  "servce": "service",
  "servces": "services",
  "appication": "application",
  "appications": "applications",
  "engneer": "engineer",
  "engneering": "engineering",
  "desgn": "design",
  "desgner": "designer",
  "sofware": "software",
  "develope": "develop",
  "develops": "develops",
  "uiversity": "university",
  "acadamic": "academic",
  "internshep": "internship",
  "internsheps": "internships",
  "certifaction": "certification",
  "certifactions": "certifications",
  "qualifcation": "qualification",
  "qualifcations": "qualifications",
  "workplace": "workplace",
  "collaoration": "collaboration",
  "bussiness": "business",
  "busines": "business",
  "finacial": "financial",
  "opertion": "operation",
  "opertions": "operations",
  "optmize": "optimize",
  "optmized": "optimized",
  "producitivity": "productivity",
  "automatation": "automation",
};

export interface SpellCheckError {
  word: string;
  suggestion: string;
  type: 'spelling' | 'duplicate';
}

interface SpellcheckTextAreaProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onFix: (fieldName: string, originalWord: string, replacement: string, type: 'spelling' | 'duplicate') => void;
  rows?: number;
  placeholder?: string;
}

export function SpellcheckTextArea({
  label,
  name,
  value,
  onChange,
  onFix,
  rows = 3,
  placeholder,
}: SpellcheckTextAreaProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Scan text for typos and duplicates
  const errors = useMemo((): SpellCheckError[] => {
    if (!value) return [];
    
    const detected: SpellCheckError[] = [];
    const checkedWords = new Set<string>();

    // 1. Detect duplicate words (e.g. "the the", "and and")
    const duplicateRegex = /\b([a-zA-Z]+)\s+\1\b/gi;
    let dupMatch;
    while ((dupMatch = duplicateRegex.exec(value)) !== null) {
      detected.push({
        word: `${dupMatch[1]} ${dupMatch[1]}`,
        suggestion: dupMatch[1],
        type: 'duplicate'
      });
    }

    // 2. Scan spelling typos using a clean regex boundary
    const words = value.match(/\b[a-zA-Z'-]+\b/g) || [];
    for (const word of words) {
      const lowerWord = word.toLowerCase();
      if (TYPO_DICTIONARY[lowerWord] && !checkedWords.has(lowerWord)) {
        checkedWords.add(lowerWord);
        // Match casing of the first character
        let correction = TYPO_DICTIONARY[lowerWord];
        if (word[0] === word[0].toUpperCase()) {
          correction = correction.charAt(0).toUpperCase() + correction.slice(1);
        }
        detected.push({
          word,
          suggestion: correction,
          type: 'spelling'
        });
      }
    }

    return detected;
  }, [value]);

  const hasErrors = errors.length > 0;

  return (
    <div className="space-y-1.5" id={`spellcheck-container-${name}`}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-750">{label}</label>
        
        {/* Real-time Status Indicator Badge */}
        <div className="flex items-center gap-1.5 select-none">
          {hasErrors ? (
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 shadow-sm transition-all animate-pulse"
              title="Click to view spelling suggestions"
              type="button"
            >
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>{errors.length} {errors.length === 1 ? 'correction' : 'corrections'} available</span>
              {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          ) : value.trim().length > 5 ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-150 transition-all">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Spelling Clean</span>
            </span>
          ) : null}
        </div>
      </div>

      <div className="relative">
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          rows={rows}
          className={`w-full border bg-gray-50 focus:bg-white rounded-xl px-4 py-3 focus:ring-2 outline-none transition-colors ${
            hasErrors 
              ? 'border-rose-200 focus:ring-rose-300' 
              : 'border-gray-200 focus:ring-emerald-500'
          }`}
          placeholder={placeholder}
          spellCheck="false" // Native spellcheck off so our custom overlay can provide high-fidelity corrections
        />
      </div>

      {/* Suggested corrections drawer overlay */}
      {hasErrors && isOpen && (
        <div 
          className="bg-rose-50/50 border border-rose-100 rounded-xl p-3 space-y-2 mt-1 animate-fadeIn"
          id={`corrections-drawer-${name}`}
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-800 border-b border-rose-100 pb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-rose-600" />
            <span>Spelling & Grammar Suggestions</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
            {errors.map((err, idx) => (
              <div 
                key={`${err.word}-${idx}`} 
                className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-rose-100 text-xs shadow-sm"
              >
                <div className="flex flex-col">
                  {err.type === 'duplicate' ? (
                    <>
                      <span className="line-through text-gray-400 font-medium">{err.word}</span>
                      <span className="text-gray-800 font-semibold">{err.suggestion} (Duplicate word)</span>
                    </>
                  ) : (
                    <>
                      <span className="line-through text-gray-450 font-medium">{err.word}</span>
                      <span className="text-emerald-700 font-bold">{err.suggestion}</span>
                    </>
                  )}
                </div>
                
                <button
                  onClick={() => onFix(name, err.word, err.suggestion, err.type)}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-md border border-emerald-200 transition-colors cursor-pointer"
                  type="button"
                >
                  Apply Fix
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
