import React from 'react';
import { SearchResult } from '../types/index.js';
import { 
  ExternalLink, 
  Star, 
  Calendar, 
  Sparkles, 
  BookOpen, 
  MessageSquare, 
  Globe, 
  Code2 
} from 'lucide-react';

interface ResultCardProps {
  result: SearchResult;
  index: number;
}

export const ResultCard: React.FC<ResultCardProps> = ({ result, index }) => {
  const getCategoryBadge = () => {
    switch (result.category) {
      case 'github':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <Code2 className="w-3 h-3" /> GitHub Repo
          </span>
        );
      case 'technical':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <BookOpen className="w-3 h-3" /> Technical Spec
          </span>
        );
      case 'community':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <MessageSquare className="w-3 h-3" /> Discussion
          </span>
        );
      case 'encyclopedia':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <BookOpen className="w-3 h-3" /> Encyclopedia
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Globe className="w-3 h-3" /> Web
          </span>
        );
    }
  };

  return (
    <article className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/50 rounded-2xl p-5 transition-all shadow-sm hover:shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-mono text-slate-400 dark:text-slate-500 font-bold">
            #{index + 1}
          </span>
          {getCategoryBadge()}
          <span className="font-mono text-slate-500 dark:text-slate-400">
            {result.domain}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {result.originalityScore !== undefined && (
            <span 
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                result.originalityScore >= 75
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
              title="Originality & Domain Independence Score"
            >
              Originality: {result.originalityScore}%
            </span>
          )}

          {result.relevanceScore !== undefined && (
            <span 
              className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
              title="Heuristic Query Relevance Score"
            >
              Relevance: {result.relevanceScore}%
            </span>
          )}
        </div>
      </div>

      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2">
        <a
          href={result.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 hover:underline"
        >
          <span>{result.title}</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0" />
        </a>
      </h3>

      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
        {result.snippet}
      </p>

      {(result.uniquenessReason || result.contribution) && (
        <div className="mb-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs">
          {result.uniquenessReason && (
            <div className="flex items-start gap-1.5 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 dark:text-slate-200">Why it's useful: </strong>
                <span className="text-slate-600 dark:text-slate-400">{result.uniquenessReason}</span>
              </div>
            </div>
          )}

          {result.contribution && (
            <div className="flex items-start gap-1.5">
              <div className="w-3.5 h-3.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5">
                +
              </div>
              <div>
                <strong className="text-slate-900 dark:text-slate-200">Contribution beyond standard search: </strong>
                <span className="text-slate-600 dark:text-slate-400">{result.contribution}</span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-3">
          {result.starsOrScore !== undefined && result.starsOrScore > 0 && (
            <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
              <Star className="w-3 h-3 fill-amber-500" />
              {result.starsOrScore.toLocaleString()} {result.category === 'github' ? 'stars' : 'points'}
            </span>
          )}

          {result.authorOrOwner && (
            <span>by <span className="font-medium text-slate-700 dark:text-slate-300">{result.authorOrOwner}</span></span>
          )}

          {result.publishedDate && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {result.publishedDate}
            </span>
          )}
        </div>

        <div className="text-[11px] text-slate-400 dark:text-slate-500">
          Source: <span className="capitalize font-medium text-slate-600 dark:text-slate-400">{result.provider}</span>
        </div>
      </div>
    </article>
  );
};
