import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    katex?: {
      renderToString: (tex: string, options?: any) => string;
    };
  }
}

export function LaTeX({ math, display = false, className = '' }: { math: string; display?: boolean; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [html, setHtml] = useState('');

  useEffect(() => {
    function tryRender() {
      if (window.katex) {
        try {
          const rendered = window.katex.renderToString(math, {
            displayMode: display,
            throwOnError: false,
            output: 'html',
          });
          setHtml(rendered);
        } catch {
          setHtml(math);
        }
      } else {
        setTimeout(tryRender, 100);
      }
    }
    tryRender();
  }, [math, display]);

  if (!html) {
    return <span className={`font-mono ${className}`}>{math}</span>;
  }

  return <span ref={ref} className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
