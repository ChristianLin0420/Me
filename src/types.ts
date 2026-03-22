export interface Publication {
  id: string;
  year: string;
  type: string;
  title: string;
  journal: string;
  links: { label: string; icon: string }[];
}

export interface BlogPost {
  id: string;
  date: string;
  id_tag: string;
  tags: string[];
  title: string;
  excerpt: string;
  equation?: string;
  image?: string;
  author?: {
    name: string;
    role: string;
    avatar: string;
  };
}

export interface GalleryItem {
  id: string;
  title: string;
  date: string;
  url: string;
  span: string;
}

export type ContentBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'equation'; latex: string; caption?: string }
  | { type: 'image'; url: string; caption?: string; alt?: string }
  | { type: 'code'; code: string; language?: string; caption?: string }
  | { type: 'metrics'; items: { label: string; value: string; description: string }[] };

export interface ContentDetail {
  id: string;
  contentType: 'publication' | 'blog';
  category: string;
  volume?: string;
  date: string;
  title: string;
  author: { name: string; role: string; avatar?: string };
  citations?: number;
  keywords: string[];
  heroImage?: string;
  heroCaption?: string;
  abstract: string;
  tools?: string[];
  sections: ContentBlock[];
  nextItem?: { id: string; title: string; contentType: 'publication' | 'blog' };
}
