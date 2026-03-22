import { createLowlight, common } from 'lowlight';

const lowlight = createLowlight(common);

export function highlightCode(code: string, language?: string): string {
  try {
    if (language && lowlight.registered(language)) {
      const tree = lowlight.highlight(language, code);
      return toHtml(tree);
    }
    const tree = lowlight.highlightAuto(code);
    return toHtml(tree);
  } catch {
    return escapeHtml(code);
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function toHtml(tree: any): string {
  if (!tree || !tree.children) return '';
  return tree.children.map(nodeToHtml).join('');
}

function nodeToHtml(node: any): string {
  if (node.type === 'text') {
    return escapeHtml(node.value);
  }
  if (node.type === 'element') {
    const className = node.properties?.className?.join(' ') || '';
    const inner = (node.children || []).map(nodeToHtml).join('');
    return className ? `<span class="${className}">${inner}</span>` : `<span>${inner}</span>`;
  }
  return '';
}
