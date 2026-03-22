import { useState, useEffect } from 'react';
import { Plus, Trash2, GripVertical, ChevronUp, ChevronDown, Type, AlignLeft, Code, Calculator, ImageIcon, BarChart3, AlertTriangle, Check } from 'lucide-react';
import { ContentBlock } from '@/src/types';

declare global {
  interface Window {
    katex?: {
      renderToString: (tex: string, options?: any) => string;
    };
  }
}

function LatexPreview({ latex, display = true }: { latex: string; display?: boolean }) {
  const [html, setHtml] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!latex.trim()) { setHtml(''); setError(''); return; }
    function tryRender() {
      if (!window.katex) { setTimeout(tryRender, 100); return; }
      try {
        const rendered = window.katex.renderToString(latex, { displayMode: display, throwOnError: true, output: 'html' });
        setHtml(rendered);
        setError('');
      } catch (e: any) {
        setHtml('');
        setError(e?.message || 'Invalid LaTeX');
      }
    }
    tryRender();
  }, [latex, display]);

  if (!latex.trim()) return null;

  return (
    <div className="mt-2">
      {error ? (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded p-3 text-xs">
          <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-mono font-semibold text-red-600">LaTeX Error: </span>
            <span className="text-red-500">{error}</span>
          </div>
        </div>
      ) : (
        <div className="bg-surface-container-low border border-outline-variant/10 rounded p-4">
          <div className="flex items-center gap-2 mb-2">
            <Check size={12} className="text-green-600" />
            <span className="font-mono text-[9px] uppercase tracking-widest text-on-surface-variant">Preview</span>
          </div>
          <div className="flex justify-center" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      )}
    </div>
  );
}

const BLOCK_TYPES = [
  { type: 'heading', label: 'Heading', icon: Type },
  { type: 'paragraph', label: 'Paragraph', icon: AlignLeft },
  { type: 'equation', label: 'Equation', icon: Calculator },
  { type: 'image', label: 'Image', icon: ImageIcon },
  { type: 'code', label: 'Code Block', icon: Code },
  { type: 'metrics', label: 'Metrics', icon: BarChart3 },
] as const;

function createEmptyBlock(type: ContentBlock['type']): ContentBlock {
  switch (type) {
    case 'heading': return { type: 'heading', text: '' };
    case 'paragraph': return { type: 'paragraph', text: '' };
    case 'equation': return { type: 'equation', latex: '', caption: '' };
    case 'image': return { type: 'image', url: '', caption: '', alt: '' };
    case 'code': return { type: 'code', code: '', language: '', caption: '' };
    case 'metrics': return { type: 'metrics', items: [{ label: '', value: '', description: '' }] };
  }
}

function BlockInput({
  block,
  onChange,
  onUploadImage,
}: {
  block: ContentBlock;
  onChange: (block: ContentBlock) => void;
  onUploadImage?: (file: File) => Promise<string>;
}) {
  switch (block.type) {
    case 'heading':
      return (
        <input
          type="text"
          value={block.text}
          onChange={e => onChange({ ...block, text: e.target.value })}
          placeholder="Section heading (e.g. 01. Theoretical Framework)"
          className="w-full bg-transparent border-0 border-b border-outline-variant/20 focus:ring-0 focus:border-primary py-2 font-headline text-xl font-semibold"
        />
      );

    case 'paragraph':
      return (
        <div className="space-y-1">
          <textarea
            value={block.text}
            onChange={e => onChange({ ...block, text: e.target.value })}
            placeholder="Write your paragraph content... Use $...$ for inline LaTeX (e.g. $E = mc^2$)"
            rows={4}
            className="w-full bg-transparent border border-outline-variant/15 focus:ring-0 focus:border-primary p-3 text-sm leading-relaxed resize-y"
          />
          <p className="font-mono text-[9px] text-on-surface-variant/50 tracking-wider">
            TIP: Wrap LaTeX in dollar signs for inline math — e.g. <code className="bg-surface-container-high px-1">$\alpha + \beta$</code> renders as inline equation
          </p>
        </div>
      );

    case 'equation':
      return (
        <div className="space-y-3">
          <input
            type="text"
            value={block.latex}
            onChange={e => onChange({ ...block, latex: e.target.value })}
            placeholder="LaTeX equation (e.g. S = -k_B \sum p_i \ln p_i)"
            className="w-full bg-surface-container-low border-0 border-b border-outline-variant/20 focus:ring-0 focus:border-primary py-3 px-3 font-mono text-sm"
          />
          <LatexPreview latex={block.latex} display />
          <input
            type="text"
            value={block.caption || ''}
            onChange={e => onChange({ ...block, caption: e.target.value })}
            placeholder="Caption (e.g. Equation (1): Description)"
            className="w-full bg-transparent border-0 border-b border-outline-variant/10 focus:ring-0 focus:border-primary py-1 font-mono text-[10px] uppercase tracking-wider"
          />
        </div>
      );

    case 'image':
      return (
        <div className="space-y-3">
          <div className="flex gap-3">
            <input
              type="text"
              value={block.url}
              onChange={e => onChange({ ...block, url: e.target.value })}
              placeholder="Image URL"
              className="flex-grow bg-transparent border-0 border-b border-outline-variant/20 focus:ring-0 focus:border-primary py-2 font-mono text-xs"
            />
            {onUploadImage && (
              <label className="shrink-0 bg-surface-container-highest px-4 py-2 font-mono text-[10px] uppercase tracking-widest cursor-pointer hover:bg-surface-container-high transition-colors flex items-center gap-2">
                <ImageIcon size={12} />
                Upload
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = await onUploadImage(file);
                      onChange({ ...block, url });
                    }
                  }}
                />
              </label>
            )}
          </div>
          {block.url && (
            <img src={block.url} alt={block.alt} className="max-h-48 object-cover opacity-80" referrerPolicy="no-referrer" />
          )}
          <input
            type="text"
            value={block.caption || ''}
            onChange={e => onChange({ ...block, caption: e.target.value })}
            placeholder="Image caption"
            className="w-full bg-transparent border-0 border-b border-outline-variant/10 focus:ring-0 focus:border-primary py-1 font-mono text-[10px]"
          />
          <input
            type="text"
            value={block.alt || ''}
            onChange={e => onChange({ ...block, alt: e.target.value })}
            placeholder="Alt text for accessibility"
            className="w-full bg-transparent border-0 border-b border-outline-variant/10 focus:ring-0 focus:border-primary py-1 text-xs text-on-surface-variant"
          />
        </div>
      );

    case 'code':
      return (
        <div className="space-y-3">
          <div className="flex gap-3 items-center">
            <input
              type="text"
              value={block.language || ''}
              onChange={e => onChange({ ...block, language: e.target.value })}
              placeholder="Language (python, solidity, etc.)"
              className="w-48 bg-transparent border-0 border-b border-outline-variant/20 focus:ring-0 focus:border-primary py-1 font-mono text-[10px] uppercase"
            />
          </div>
          <textarea
            value={block.code}
            onChange={e => onChange({ ...block, code: e.target.value })}
            placeholder="Paste your code here..."
            rows={8}
            className="w-full bg-[#2d2d2d] text-[#f8f8f2] border-0 focus:ring-0 p-4 font-mono text-xs leading-relaxed resize-y"
          />
          <input
            type="text"
            value={block.caption || ''}
            onChange={e => onChange({ ...block, caption: e.target.value })}
            placeholder="Code caption"
            className="w-full bg-transparent border-0 border-b border-outline-variant/10 focus:ring-0 focus:border-primary py-1 font-mono text-[10px]"
          />
        </div>
      );

    case 'metrics':
      return (
        <div className="space-y-4">
          {block.items.map((item, i) => (
            <div key={i} className="flex gap-3 items-start bg-surface-container-low p-3">
              <input
                type="text"
                value={item.label}
                onChange={e => {
                  const items = [...block.items];
                  items[i] = { ...items[i], label: e.target.value };
                  onChange({ ...block, items });
                }}
                placeholder="LABEL"
                className="w-32 bg-transparent border-0 border-b border-outline-variant/20 focus:ring-0 focus:border-primary py-1 font-mono text-[10px] uppercase"
              />
              <input
                type="text"
                value={item.value}
                onChange={e => {
                  const items = [...block.items];
                  items[i] = { ...items[i], value: e.target.value };
                  onChange({ ...block, items });
                }}
                placeholder="99.9%"
                className="w-32 bg-transparent border-0 border-b border-outline-variant/20 focus:ring-0 focus:border-primary py-1 font-headline text-lg font-bold"
              />
              <input
                type="text"
                value={item.description}
                onChange={e => {
                  const items = [...block.items];
                  items[i] = { ...items[i], description: e.target.value };
                  onChange({ ...block, items });
                }}
                placeholder="Description"
                className="flex-grow bg-transparent border-0 border-b border-outline-variant/20 focus:ring-0 focus:border-primary py-1 text-xs"
              />
              <button
                onClick={() => {
                  const items = block.items.filter((_, j) => j !== i);
                  onChange({ ...block, items: items.length ? items : [{ label: '', value: '', description: '' }] });
                }}
                className="text-on-surface-variant hover:text-red-500 transition-colors pt-1"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          <button
            onClick={() => onChange({ ...block, items: [...block.items, { label: '', value: '', description: '' }] })}
            className="font-mono text-[10px] uppercase tracking-widest text-primary hover:underline"
          >
            + Add Metric
          </button>
        </div>
      );
  }
}

export function BlockEditor({
  blocks,
  onChange,
  onUploadImage,
}: {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
  onUploadImage?: (file: File) => Promise<string>;
}) {
  const [showAddMenu, setShowAddMenu] = useState<number | null>(null);

  const addBlock = (type: ContentBlock['type'], atIndex: number) => {
    const newBlocks = [...blocks];
    newBlocks.splice(atIndex, 0, createEmptyBlock(type));
    onChange(newBlocks);
    setShowAddMenu(null);
  };

  const updateBlock = (index: number, block: ContentBlock) => {
    const newBlocks = [...blocks];
    newBlocks[index] = block;
    onChange(newBlocks);
  };

  const removeBlock = (index: number) => {
    onChange(blocks.filter((_, i) => i !== index));
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[target]] = [newBlocks[target], newBlocks[index]];
    onChange(newBlocks);
  };

  return (
    <div className="space-y-4">
      <div className="font-mono text-[10px] tracking-widest uppercase text-on-surface-variant mb-2">
        Content Sections ({blocks.length} blocks)
      </div>

      {blocks.map((block, i) => (
        <div key={i} className="group relative bg-surface-container-lowest border border-outline-variant/10 p-4">
          <div className="flex items-center gap-3 mb-3">
            <GripVertical size={14} className="text-on-surface-variant/30" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant bg-surface-container-high px-2 py-0.5">
              {block.type}
            </span>
            <div className="flex-grow" />
            <button onClick={() => moveBlock(i, -1)} disabled={i === 0} className="text-on-surface-variant/50 hover:text-on-surface disabled:opacity-20 transition-colors">
              <ChevronUp size={14} />
            </button>
            <button onClick={() => moveBlock(i, 1)} disabled={i === blocks.length - 1} className="text-on-surface-variant/50 hover:text-on-surface disabled:opacity-20 transition-colors">
              <ChevronDown size={14} />
            </button>
            <button onClick={() => removeBlock(i)} className="text-on-surface-variant/50 hover:text-red-500 transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
          <BlockInput block={block} onChange={b => updateBlock(i, b)} onUploadImage={onUploadImage} />
        </div>
      ))}

      {/* Add Block */}
      <div className="relative">
        <button
          onClick={() => setShowAddMenu(showAddMenu === blocks.length ? null : blocks.length)}
          className="w-full border-2 border-dashed border-outline-variant/20 py-4 flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
        >
          <Plus size={14} />
          Add Content Block
        </button>

        {showAddMenu === blocks.length && (
          <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-surface-container-lowest border border-outline-variant/20 shadow-lg grid grid-cols-3 gap-1 p-2">
            {BLOCK_TYPES.map(bt => (
              <button
                key={bt.type}
                onClick={() => addBlock(bt.type, blocks.length)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-mono uppercase hover:bg-surface-container-high transition-colors"
              >
                <bt.icon size={14} />
                {bt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
