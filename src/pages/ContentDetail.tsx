import { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { ContentDetail as ContentDetailType, ContentBlock } from '@/src/types';
import { highlightCode } from '@/src/lib/highlight';
import { LaTeX } from '@/src/components/LaTeX';

function RichText({ text }: { text: string }) {
  const parts = text.split(/(\$[^$]+\$)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
          const latex = part.slice(1, -1);
          return <LaTeX key={i} math={latex} />;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function BlockRenderer({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case 'heading':
      return (
        <h2 className="font-headline text-3xl font-semibold mb-6 mt-4">
          {block.text}
        </h2>
      );

    case 'paragraph':
      return (
        <p className="text-lg leading-[1.8] text-on-surface mb-8">
          <RichText text={block.text} />
        </p>
      );

    case 'equation':
      return (
        <div className="bg-surface-container py-12 px-8 my-10 flex flex-col items-center justify-center">
          <div className="text-2xl md:text-3xl text-primary mb-4">
            <LaTeX math={block.latex} display />
          </div>
          {block.caption && (
            <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
              {block.caption}
            </p>
          )}
        </div>
      );

    case 'image':
      return (
        <div className="my-10 bg-surface-container-low p-1 relative overflow-hidden">
          <img
            src={block.url}
            alt={block.alt || ''}
            className="w-full aspect-[21/9] object-cover opacity-90 mix-blend-multiply"
            referrerPolicy="no-referrer"
          />
          {block.caption && (
            <div className="absolute bottom-4 right-4 bg-surface/90 backdrop-blur-sm px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-on-surface-variant">
              {block.caption}
            </div>
          )}
        </div>
      );

    case 'code':
      return (
        <div className="my-10">
          <div className="bg-[#2a2926] text-[#c8bfb0] p-6 overflow-x-auto rounded-sm">
            {block.language && (
              <div className="font-mono text-[10px] uppercase tracking-widest text-[#6d6a60] mb-4 flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-[#c4a47c]/60"></span>
                {block.language}
              </div>
            )}
            <pre className="font-mono text-sm leading-relaxed whitespace-pre-wrap">
              <code dangerouslySetInnerHTML={{ __html: highlightCode(block.code, block.language) }} />
            </pre>
          </div>
          {block.caption && (
            <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
              {block.caption}
            </p>
          )}
        </div>
      );

    case 'metrics':
      return (
        <div className="grid grid-cols-2 gap-4 my-8">
          {block.items.map((metric, i) => (
            <div
              key={i}
              className="bg-surface-container-high aspect-square p-6 flex flex-col justify-end"
            >
              <span className="font-mono text-[10px] text-on-surface-variant mb-2">
                {metric.label}
              </span>
              <span className="font-headline text-4xl font-bold">
                {metric.value}
              </span>
              <span className="text-xs text-on-surface-variant mt-1">
                {metric.description}
              </span>
            </div>
          ))}
        </div>
      );

    default:
      return null;
  }
}

export function ContentDetail() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [content, setContent] = useState<ContentDetailType | null>(null);
  const [loading, setLoading] = useState(true);

  const contentType = location.pathname.startsWith('/publications')
    ? 'publication'
    : 'blog';
  const apiBase = contentType === 'publication' ? '/api/publications' : '/api/blogs';
  const listPath = contentType === 'publication' ? '/publications' : '/blogs';

  useEffect(() => {
    setLoading(true);
    fetch(`${apiBase}/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setContent(data);
        setLoading(false);
        window.scrollTo(0, 0);
      })
      .catch(() => setLoading(false));
  }, [apiBase, id]);

  if (loading) {
    return (
      <div className="pt-48 pb-24 flex justify-center">
        <div className="font-mono text-xs uppercase tracking-widest text-on-surface-variant animate-pulse">
          Loading...
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="pt-48 pb-24 text-center">
        <h1 className="font-headline text-4xl font-bold mb-4">Not Found</h1>
        <Link
          to={listPath}
          className="font-mono text-xs uppercase tracking-widest text-primary hover:underline"
        >
          Return to archive
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pt-32 pb-20 px-6 md:px-12 max-w-5xl mx-auto"
    >
      {/* Breadcrumb & Category */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          to={listPath}
          className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-2"
        >
          <ArrowLeft size={12} />
          {contentType === 'publication' ? 'Publications' : 'Blogs'}
        </Link>
        <span className="text-on-surface-variant/30">/</span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant bg-surface-container-low px-2 py-1">
          {content.category} {content.volume && `// ${content.volume}`}
        </span>
        <span className="font-mono text-[10px] text-on-surface-variant">
          {content.date}
        </span>
      </div>

      {/* Title Section */}
      <header className="mb-16">
        <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tight text-on-surface leading-[1.1] mb-8">
          {content.title}
        </h1>
        <div className="flex flex-wrap gap-8 items-start border-l border-outline-variant/30 pl-8">
          <div className="max-w-xs">
            <p className="font-mono text-xs uppercase tracking-tighter text-on-surface-variant mb-2">
              Author
            </p>
            <p className="font-headline font-medium text-lg">
              {content.author.name}
            </p>
            <p className="text-sm text-on-surface-variant">
              {content.author.role}
            </p>
          </div>
          {content.citations !== undefined && (
            <div className="max-w-xs">
              <p className="font-mono text-xs uppercase tracking-tighter text-on-surface-variant mb-2">
                Citations
              </p>
              <p className="font-mono text-lg font-medium">
                {content.citations} [Ref. Index A]
              </p>
            </div>
          )}
          <div className="max-w-xs">
            <p className="font-mono text-xs uppercase tracking-tighter text-on-surface-variant mb-2">
              Keywords
            </p>
            <p className="text-sm font-medium">
              {content.keywords.join(', ')}
            </p>
          </div>
        </div>
      </header>

      {/* Hero Image */}
      {content.heroImage && (
        <section className="mb-20">
          <div className="bg-surface-container-low p-1 relative overflow-hidden">
            <img
              alt={content.title}
              className="w-full aspect-[21/9] object-cover opacity-90 mix-blend-multiply"
              src={content.heroImage}
              referrerPolicy="no-referrer"
            />
            {content.heroCaption && (
              <div className="absolute bottom-4 right-4 bg-surface/90 backdrop-blur-sm px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-on-surface-variant">
                {content.heroCaption}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Content Area with Asymmetric Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start relative">
        {/* Left Metadata Sidebar */}
        <aside className="md:col-span-3 sticky top-24 space-y-12 hidden md:block">
          <div>
            <h4 className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant mb-4">
              Abstract
            </h4>
            <p className="text-xs leading-relaxed text-on-surface-variant italic">
              {content.abstract}
            </p>
          </div>
          {content.tools && content.tools.length > 0 && (
            <div className="border-t border-outline-variant/15 pt-6">
              <h4 className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant mb-4">
                Tools Used
              </h4>
              <ul className="font-mono text-[10px] space-y-2 uppercase">
                {content.tools.map((tool) => (
                  <li key={tool}>— {tool}</li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <article className="md:col-span-9 space-y-2">
          {/* Mobile-only abstract */}
          <div className="md:hidden mb-12 bg-surface-container-low p-6">
            <h4 className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant mb-3">
              Abstract
            </h4>
            <p className="text-sm leading-relaxed text-on-surface-variant italic">
              {content.abstract}
            </p>
          </div>

          {content.sections.map((block, i) => (
            <BlockRenderer key={i} block={block} />
          ))}
        </article>
      </div>

      {/* Footer CTA */}
      <div className="mt-20 border-t border-outline-variant/30 pt-20">
        <div className="flex flex-col md:flex-row justify-between items-end gap-12">
          <div className="max-w-md">
            <h3 className="font-headline text-2xl font-bold mb-4">
              {contentType === 'publication'
                ? 'Request Access to Full Dataset'
                : 'Continue the Conversation'}
            </h3>
            <p className="text-on-surface-variant text-sm mb-6">
              {contentType === 'publication'
                ? 'The raw data and reproducible scripts are available for verified academic researchers under the Open Archivist Protocol.'
                : 'Have thoughts on this research note? Reach out to discuss findings, methodology, or collaboration opportunities.'}
            </p>
            <Link
              to="/contact"
              className="inline-block bg-primary text-on-primary px-6 py-3 font-mono text-xs uppercase tracking-widest hover:bg-primary-dim transition-colors rounded-sm"
            >
              {contentType === 'publication' ? 'Request Dataset' : 'Get in Touch'}
            </Link>
          </div>
          {content.nextItem && (
            <div className="text-right">
              <Link
                to={`/${content.nextItem.contentType === 'publication' ? 'publications' : 'blogs'}/${content.nextItem.id}`}
                className="font-mono text-xs uppercase tracking-widest text-primary flex items-center justify-end group"
              >
                Next {content.nextItem.contentType === 'publication' ? 'Publication' : 'Post'}
                <ArrowRight
                  size={14}
                  className="ml-2 group-hover:translate-x-1 transition-transform"
                />
              </Link>
              <p className="font-headline font-bold text-xl mt-2 italic">
                {content.nextItem.title}
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
