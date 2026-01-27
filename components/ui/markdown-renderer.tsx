'use client';

import ReactMarkdown from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  stripBold?: boolean;
}

// Pre-process content to strip bold/italic markers if desired
function preprocessContent(content: string, stripBold: boolean): string {
  if (!stripBold) return content;
  return content
    // Remove bold markers **text** -> text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    // Remove italic markers *text* -> text (but not lists)
    .replace(/(?<!\n)\*([^*\n]+)\*/g, '$1');
}

export function MarkdownRenderer({ content, className = '', stripBold = true }: MarkdownRendererProps) {
  const processedContent = preprocessContent(content, stripBold);

  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      <ReactMarkdown
        components={{
          // Style headings
          h1: ({ children }) => <h1 className="text-lg font-bold mt-4 mb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-base font-bold mt-3 mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-bold mt-2 mb-1">{children}</h3>,
          // Style paragraphs
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          // Style bold text
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          // Style lists
          ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
          li: ({ children }) => <li className="mb-1">{children}</li>,
          // Style code
          code: ({ children }) => (
            <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">{children}</code>
          ),
          // Style links
          a: ({ href, children }) => (
            <a href={href} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
