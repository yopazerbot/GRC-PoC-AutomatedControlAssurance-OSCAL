import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight } from "lucide-react";

const LANG_ACCENT: Record<string, string> = {
  python: "text-accent-indigo",
  json: "text-accent-cyan",
  yaml: "text-accent-amber",
  typescript: "text-accent-blue",
};

interface Snippet {
  title: string;
  language: string;
  lines: string[];
  inputs?: string[];
  outputs?: string[];
}

interface Props {
  snippet: Snippet;
}

export function CodeSnippet({ snippet }: Props) {
  const [open, setOpen] = useState(false);
  const accent = LANG_ACCENT[snippet.language] ?? "text-surface-muted";

  return (
    <div className="mt-3 rounded-md border border-surface-border bg-surface-700/60 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 px-3 py-1.5 hover:bg-surface-700 transition-colors text-left"
      >
        <span className="flex items-center gap-1.5 min-w-0">
          {open ? (
            <ChevronDown className="w-3 h-3 text-surface-muted" />
          ) : (
            <ChevronRight className="w-3 h-3 text-surface-muted" />
          )}
          <span className="text-[10px] uppercase tracking-wider text-surface-muted truncate">
            behind the scenes · {snippet.title}
          </span>
        </span>
        <span className={`text-[10px] font-mono uppercase ${accent}`}>
          {snippet.language}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden border-t border-surface-border"
          >
            <pre className="px-3 py-2 text-[11px] leading-snug font-mono text-surface-text overflow-x-auto">
              {snippet.lines.map((line, i) => (
                <code key={i} className="block whitespace-pre">
                  <span className="select-none text-surface-muted pr-3 inline-block w-6 text-right">
                    {i + 1}
                  </span>
                  <span className={accent}>{line}</span>
                </code>
              ))}
            </pre>
            {(snippet.inputs?.length || snippet.outputs?.length) ? (
              <div className="flex flex-wrap gap-1.5 px-3 py-2 border-t border-surface-border text-[10px]">
                {snippet.inputs?.map((inp) => (
                  <span key={inp} className="px-1.5 py-0.5 rounded bg-surface-600 text-surface-muted font-mono">
                    &larr; {inp}
                  </span>
                ))}
                {snippet.outputs?.map((out) => (
                  <span key={out} className="px-1.5 py-0.5 rounded bg-accent-cyan/10 text-accent-cyan font-mono">
                    &rarr; {out}
                  </span>
                ))}
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
