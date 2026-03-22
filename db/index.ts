import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const DB_DIR = process.env.DB_DIR || path.join(process.cwd(), 'db');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
const DB_PATH = path.join(DB_DIR, 'archivist.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function initDb() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS publications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      journal TEXT NOT NULL,
      links TEXT NOT NULL DEFAULT '[]',
      category TEXT NOT NULL DEFAULT '',
      volume TEXT DEFAULT '',
      date TEXT NOT NULL DEFAULT '',
      author_name TEXT NOT NULL DEFAULT '',
      author_role TEXT NOT NULL DEFAULT '',
      citations INTEGER DEFAULT 0,
      keywords TEXT NOT NULL DEFAULT '[]',
      hero_image TEXT DEFAULT '',
      hero_caption TEXT DEFAULT '',
      abstract TEXT NOT NULL DEFAULT '',
      tools TEXT NOT NULL DEFAULT '[]',
      sections TEXT NOT NULL DEFAULT '[]',
      next_item_id INTEGER DEFAULT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS blogs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      id_tag TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '[]',
      title TEXT NOT NULL,
      excerpt TEXT NOT NULL DEFAULT '',
      equation TEXT DEFAULT '',
      image TEXT DEFAULT '',
      author_name TEXT DEFAULT '',
      author_role TEXT DEFAULT '',
      author_avatar TEXT DEFAULT '',
      category TEXT NOT NULL DEFAULT '',
      volume TEXT DEFAULT '',
      keywords TEXT NOT NULL DEFAULT '[]',
      hero_image TEXT DEFAULT '',
      hero_caption TEXT DEFAULT '',
      abstract TEXT NOT NULL DEFAULT '',
      tools TEXT NOT NULL DEFAULT '[]',
      sections TEXT NOT NULL DEFAULT '[]',
      next_item_id INTEGER DEFAULT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS gallery (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      url TEXT NOT NULL,
      span TEXT NOT NULL DEFAULT 'col-span-4',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      verified INTEGER NOT NULL DEFAULT 0,
      token TEXT NOT NULL,
      subscribed_at TEXT NOT NULL DEFAULT (datetime('now')),
      unsubscribed_at TEXT DEFAULT NULL
    );

    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      display_name TEXT NOT NULL DEFAULT '',
      role_title TEXT NOT NULL DEFAULT '',
      bio TEXT NOT NULL DEFAULT '',
      avatar_url TEXT NOT NULL DEFAULT '',
      location TEXT NOT NULL DEFAULT '',
      status_text TEXT NOT NULL DEFAULT '',
      contacts TEXT NOT NULL DEFAULT '[]',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const userCount = db.prepare('SELECT COUNT(*) as count FROM admin_users').get() as { count: number };
  if (userCount.count === 0) {
    const defaultPassword = process.env.ADMIN_PASSWORD || 'archivist2024';
    const hash = bcrypt.hashSync(defaultPassword, 10);
    db.prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)').run('admin', hash);
    console.log(`[DB] Default admin user created (username: admin, password: ${defaultPassword})`);
  }

  const profileCount = db.prepare('SELECT COUNT(*) as count FROM profile').get() as { count: number };
  if (profileCount.count === 0) {
    db.prepare(`
      INSERT INTO profile (id, display_name, role_title, bio, avatar_url, location, status_text, contacts)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'Dr. Elias Thorne',
      'Machine Learning Researcher',
      'Specializing in Transformer architectures and symbolic reasoning. Currently investigating the intersection of formal logic and neural networks.',
      'https://picsum.photos/seed/researcher/600/800',
      'Zürich, CH',
      'RESEARCHING ARTIFICIAL GENERAL INTELLIGENCE',
      JSON.stringify([
        { platform: 'GITHUB', url: 'https://github.com' },
        { platform: 'LINKEDIN', url: 'https://linkedin.com' },
        { platform: 'GOOGLE_SCHOLAR', url: 'https://scholar.google.com' },
        { platform: 'EMAIL', url: 'mailto:hello@archivist.dev' },
      ])
    );
  }

  return db;
}

export function seedDb() {
  const db = getDb();
  const pubCount = db.prepare('SELECT COUNT(*) as count FROM publications').get() as { count: number };
  if (pubCount.count > 0) return;

  console.log('[DB] Seeding database with initial data...');

  const insertPub = db.prepare(`
    INSERT INTO publications (year, type, title, journal, links, category, volume, date, author_name, author_role, citations, keywords, hero_image, hero_caption, abstract, tools, sections)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const pubs = [
    {
      year: "2024.08", type: "Journal Article",
      title: "Quantum Archiving: Preserving Volatile Digital Memories through Entangled States",
      journal: "The Journal of Digital Ontology, Vol 14, No 2.",
      links: [{ label: "PDF_FULLTEXT", icon: "FileText" }, { label: "DOI:10.1038/ARCH.2024", icon: "Link" }, { label: "CITE_BIBTEX", icon: "Quote" }],
      category: "Journal Article", volume: "Vol. 14", date: "2024.08.15",
      author_name: "Dr. Elias Thorne", author_role: "Senior Archivist, Digital Preservation Lab",
      citations: 142,
      keywords: ["Quantum States", "Data Persistence", "Entanglement", "Archival Theory"],
      hero_image: "https://picsum.photos/seed/quantum-arch/1200/500",
      hero_caption: "Fig 1.1: Visualization of quantum entanglement applied to distributed archival nodes.",
      abstract: "This paper proposes a novel framework for digital memory preservation using principles of quantum entanglement. By treating archival data as quantum states, we demonstrate that volatile memories can achieve persistence guarantees previously thought impossible under classical information theory.",
      tools: ["Python / Qiskit", "Tensor-Flow Quantum", "LaTeX 2e"],
      sections: [
        { type: "heading", text: "01. Theoretical Framework" },
        { type: "paragraph", text: "The preservation of digital memory is fundamentally bounded by the thermodynamic constraints of classical storage systems. As data volumes scale beyond petabyte thresholds, traditional redundancy models—RAID arrays, geographically distributed backups—begin to exhibit diminishing returns against the inexorable advance of bit rot and media degradation." },
        { type: "paragraph", text: "We propose a paradigm shift: treating each archival datum not as a classical bit, but as a quantum state capable of entanglement with verification nodes. This approach leverages the no-cloning theorem as a feature rather than a limitation, ensuring that archived data maintains provable authenticity through its quantum signature." },
        { type: "equation", latex: "\\hat{H}|\\psi\\rangle = E|\\psi\\rangle", caption: "Equation (1): Schrödinger eigenvalue problem applied to archival state vectors" },
        { type: "heading", text: "02. Entanglement Protocol Design" },
        { type: "paragraph", text: "Our protocol establishes entangled pairs between primary archival nodes and distributed verification satellites. When a datum is committed to the archive, its quantum state is entangled with a corresponding state at each verification point, creating an immutable chain of custody that is physically impossible to forge." },
        { type: "metrics", items: [{ label: "FIDELITY", value: "99.97%", description: "State preservation accuracy" }, { label: "COHERENCE", value: "48.2h", description: "Mean decoherence time" }] },
        { type: "paragraph", text: "Preliminary results from our testbed of 12 entangled nodes across three continents demonstrate that quantum-archived data maintains perfect fidelity for periods exceeding 48 hours of continuous verification cycles—a 340% improvement over classical checksumming approaches." },
        { type: "heading", text: "03. Implications for Long-Term Preservation" },
        { type: "paragraph", text: "The implications of quantum archiving extend far beyond mere data integrity. By embedding temporal metadata within the quantum state itself, we create archives that are not merely stored but are actively aware of their own age and provenance." },
        { type: "paragraph", text: "Future work will focus on scaling the protocol beyond laboratory conditions and investigating the economic feasibility of quantum archival infrastructure for national-level digital preservation programs." }
      ]
    },
    {
      year: "2023.11", type: "Conference Paper",
      title: "Algorithmic Erasure: The Ethics of Forgetting in the Age of Permanent Storage",
      journal: "Proceedings of the IEEE International Symposium on Digital Ethics (ISDE '23).",
      links: [{ label: "PDF_FULLTEXT", icon: "FileText" }, { label: "PRESENTATION_DECK", icon: "Presentation" }],
      category: "Conference Paper", volume: "ISDE '23", date: "2023.11.20",
      author_name: "Dr. Elias Thorne", author_role: "Senior Archivist, Digital Preservation Lab",
      citations: 87,
      keywords: ["Digital Ethics", "Right to Forget", "Algorithmic Bias", "Data Sovereignty"],
      hero_image: "https://picsum.photos/seed/erasure/1200/500",
      hero_caption: "Fig 1.1: Conceptual model of selective data erasure in distributed systems.",
      abstract: "As storage costs approach zero and data replication becomes ubiquitous, the ability to truly forget has become the most expensive operation in computing.",
      tools: ["Python / SciPy", "Neo4j Graph DB", "LaTeX 2e"],
      sections: [
        { type: "heading", text: "01. The Paradox of Infinite Memory" },
        { type: "paragraph", text: "Modern storage architectures are designed with a singular obsession: never lose a single bit. Yet this engineering triumph creates a profound ethical crisis." },
        { type: "heading", text: "02. A Framework for Graceful Forgetting" },
        { type: "paragraph", text: "Our proposed framework introduces 'temporal metadata tags' that encode intended lifespans for data objects." },
        { type: "equation", latex: "D(t) = D_0 \\cdot e^{-\\lambda t}", caption: "Equation (1): Exponential decay model for data accessibility over time" },
        { type: "metrics", items: [{ label: "COMPLIANCE", value: "94.1%", description: "Erasure verification rate" }, { label: "LATENCY", value: "-0.03s", description: "Avg. forgetting overhead" }] },
        { type: "heading", text: "03. Societal Implications" },
        { type: "paragraph", text: "The deployment of graceful forgetting protocols raises questions that extend far beyond computer science." }
      ]
    },
    {
      year: "2023.04", type: "Technical Report",
      title: "Distributed Ledger Protocols for Historical Manuscript Verification",
      journal: "Archival Sciences Institute Whitepaper Series, #TR-2023-012.",
      links: [{ label: "PDF_VERSION", icon: "FileText" }, { label: "REPRODUCIBLE_CODE", icon: "Code" }],
      category: "Technical Report", volume: "#TR-2023-012", date: "2023.04.08",
      author_name: "Dr. Elias Thorne", author_role: "Senior Archivist, Digital Preservation Lab",
      citations: 53,
      keywords: ["Blockchain", "Manuscript Verification", "Provenance", "Cryptographic Hashing"],
      hero_image: "https://picsum.photos/seed/ledger/1200/500",
      hero_caption: "Fig 1.1: Hash-chain verification of a 14th-century manuscript fragment.",
      abstract: "This report presents a practical protocol for leveraging distributed ledger technology to create tamper-proof provenance records for historical manuscripts.",
      tools: ["Solidity / Hardhat", "Python / OpenCV", "IPFS"],
      sections: [
        { type: "heading", text: "01. Provenance as a Computational Problem" },
        { type: "paragraph", text: "The verification of historical manuscript authenticity has traditionally relied on expert human judgment—paleographic analysis, carbon dating, and institutional chain-of-custody records." },
        { type: "code", code: "function verifyManuscript(bytes32 hash) public view returns (bool) {\n    return manuscripts[hash].verified && \n           block.timestamp - manuscripts[hash].timestamp < MAX_AGE;\n}", language: "solidity", caption: "Smart contract verification function" },
        { type: "heading", text: "02. Implementation & Results" },
        { type: "paragraph", text: "Our prototype system processed 217 digitized manuscripts from the British Library's medieval collection." },
        { type: "metrics", items: [{ label: "PROCESSED", value: "217", description: "Manuscripts verified" }, { label: "ACCURACY", value: "99.6%", description: "Hash collision avoidance" }] },
        { type: "heading", text: "03. Future Directions" },
        { type: "paragraph", text: "The next phase of this research will extend the protocol to support real-time verification of physical manuscripts using portable imaging devices." }
      ]
    }
  ];

  for (const p of pubs) {
    insertPub.run(
      p.year, p.type, p.title, p.journal, JSON.stringify(p.links),
      p.category, p.volume, p.date, p.author_name, p.author_role,
      p.citations, JSON.stringify(p.keywords), p.hero_image, p.hero_caption,
      p.abstract, JSON.stringify(p.tools), JSON.stringify(p.sections)
    );
  }

  const extraPubs = [
    {
      year: "2022.09", type: "Book Chapter",
      title: "The Archaeology of Digital Interfaces: A Material Culture Perspective",
      journal: "In: Digital Heritage and the Modern Archive, Springer Press, pp. 112-145.",
      links: [{ label: "PDF_CHAPTER", icon: "FileText" }, { label: "BOOK_INDEX", icon: "Book" }],
      category: "Book Chapter", volume: "Ch. 7", date: "2022.09.01",
      author_name: "Dr. Elias Thorne", author_role: "Senior Archivist, Digital Preservation Lab",
      citations: 34,
      keywords: ["Material Culture", "Digital Archaeology", "Interface Design", "Heritage"],
      hero_image: "https://picsum.photos/seed/archaeology/1200/500",
      hero_caption: "Fig 1.1: Stratigraphic layers of interface evolution.",
      abstract: "Applying archaeological methodology to the study of software interfaces, treating deprecated UI elements as cultural artifacts worthy of preservation and analysis.",
      tools: ["Figma Archive", "Wayback Machine", "LaTeX 2e"],
      sections: [
        { type: "heading", text: "01. Interfaces as Artifacts" },
        { type: "paragraph", text: "Software interfaces are among the most ephemeral cultural artifacts ever produced by human civilization. Unlike physical objects that degrade gradually, digital interfaces vanish completely when superseded." },
        { type: "heading", text: "02. A Stratigraphic Framework" },
        { type: "paragraph", text: "We propose a stratigraphic model for interface archaeology, where each major version of a software product represents a distinct layer of cultural production." },
        { type: "heading", text: "03. Preservation Strategies" },
        { type: "paragraph", text: "The chapter concludes with practical strategies for institutional preservation of digital interfaces." }
      ]
    },
    {
      year: "2024.03", type: "Journal Article",
      title: "Self-Healing Archives: Autonomous Error Correction in Distributed Storage Networks",
      journal: "IEEE Transactions on Knowledge and Data Engineering, Vol 36, No 4.",
      links: [{ label: "PDF_FULLTEXT", icon: "FileText" }, { label: "DOI:10.1109/TKDE.2024", icon: "Link" }],
      category: "Journal Article", volume: "Vol. 36", date: "2024.03.10",
      author_name: "Dr. Elias Thorne", author_role: "Senior Archivist, Digital Preservation Lab",
      citations: 28,
      keywords: ["Self-Healing", "Error Correction", "Distributed Systems", "Autonomy"],
      hero_image: "https://picsum.photos/seed/selfheal/1200/500",
      hero_caption: "Fig 1.1: Autonomous repair cascade in a 256-node storage cluster.",
      abstract: "Presenting a novel protocol where archival nodes independently detect and repair data corruption using consensus-based verification without human intervention.",
      tools: ["Rust / Tokio", "Protocol Buffers", "Kubernetes"],
      sections: [
        { type: "heading", text: "01. The Cost of Manual Intervention" },
        { type: "paragraph", text: "Current archival systems rely on periodic integrity checks initiated by human operators—a model that scales poorly as storage networks grow beyond thousands of nodes." },
        { type: "heading", text: "02. Autonomous Repair Protocol" },
        { type: "paragraph", text: "Our protocol enables each node to independently verify its data against a quorum of peers and initiate repair sequences without centralized coordination." },
        { type: "metrics", items: [{ label: "MTTR", value: "0.3s", description: "Mean time to repair" }, { label: "OVERHEAD", value: "2.1%", description: "Bandwidth cost" }] }
      ]
    },
    {
      year: "2023.07", type: "Conference Paper",
      title: "Temporal Graph Networks for Citation Pattern Analysis in Archival Literature",
      journal: "ACM SIGIR Conference on Research and Development in Information Retrieval (SIGIR '23).",
      links: [{ label: "PDF_FULLTEXT", icon: "FileText" }, { label: "SLIDES", icon: "Presentation" }, { label: "CODE", icon: "Code" }],
      category: "Conference Paper", volume: "SIGIR '23", date: "2023.07.18",
      author_name: "Dr. Elias Thorne", author_role: "Senior Archivist, Digital Preservation Lab",
      citations: 61,
      keywords: ["Graph Networks", "Citation Analysis", "Temporal Modeling", "Bibliometrics"],
      hero_image: "https://picsum.photos/seed/citegraph/1200/500",
      hero_caption: "Fig 1.1: Temporal citation graph of archival science publications 1990-2023.",
      abstract: "Using temporal graph neural networks to model and predict citation patterns in archival science literature, revealing hidden intellectual lineages.",
      tools: ["PyTorch Geometric", "Neo4j", "D3.js"],
      sections: [
        { type: "heading", text: "01. Beyond Static Citation Counts" },
        { type: "paragraph", text: "Traditional bibliometric analysis treats citations as static edges in a graph. We argue this fundamentally misrepresents the dynamic nature of scholarly influence." },
        { type: "heading", text: "02. Temporal Graph Architecture" },
        { type: "paragraph", text: "Our TGN architecture encodes both the content similarity and temporal ordering of citations." },
        { type: "heading", text: "03. Discovered Patterns" },
        { type: "paragraph", text: "The model identifies three distinct 'schools of thought' in archival science that were not previously recognized by domain experts." }
      ]
    },
    {
      year: "2022.03", type: "Technical Report",
      title: "Benchmarking Lossless Compression Algorithms for Historical Image Archives",
      journal: "Digital Preservation Coalition Technical Series, #DPC-TR-2022-007.",
      links: [{ label: "PDF_REPORT", icon: "FileText" }, { label: "BENCHMARK_DATA", icon: "Code" }],
      category: "Technical Report", volume: "#DPC-TR-2022-007", date: "2022.03.22",
      author_name: "Dr. Elias Thorne", author_role: "Senior Archivist, Digital Preservation Lab",
      citations: 19,
      keywords: ["Compression", "Lossless", "Image Archives", "Benchmarking"],
      hero_image: "https://picsum.photos/seed/compress/1200/500",
      hero_caption: "Fig 1.1: Compression ratio comparison across 14 algorithms.",
      abstract: "A systematic evaluation of 14 lossless compression algorithms applied to a corpus of 50,000 digitized historical photographs.",
      tools: ["C++ / zstd", "Python / Pillow", "ImageMagick"],
      sections: [
        { type: "heading", text: "01. Motivation" },
        { type: "paragraph", text: "Historical image archives face a storage paradox: digitization programs produce terabytes of data that must be preserved bit-perfectly for centuries." },
        { type: "heading", text: "02. Benchmark Results" },
        { type: "metrics", items: [{ label: "BEST RATIO", value: "3.2:1", description: "JPEG-XL lossless mode" }, { label: "FASTEST", value: "1.8GB/s", description: "LZ4 compression speed" }] },
        { type: "heading", text: "03. Recommendations" },
        { type: "paragraph", text: "For archival use cases, we recommend JPEG-XL in lossless mode as it achieves the best balance of compression ratio, decode speed, and format stability." }
      ]
    },
    {
      year: "2021.11", type: "Book Chapter",
      title: "Curating Silence: The Ethical Dimensions of Archival Gaps",
      journal: "In: Ethics of Information Organization, Oxford University Press, pp. 78-103.",
      links: [{ label: "PDF_CHAPTER", icon: "FileText" }],
      category: "Book Chapter", volume: "Ch. 4", date: "2021.11.15",
      author_name: "Dr. Elias Thorne", author_role: "Senior Archivist, Digital Preservation Lab",
      citations: 45,
      keywords: ["Ethics", "Archival Gaps", "Silence", "Power Structures"],
      hero_image: "https://picsum.photos/seed/silence/1200/500",
      hero_caption: "Fig 1.1: Visualization of missing records in colonial-era archives.",
      abstract: "Examining how the absence of records in historical archives constitutes a form of curated silence that perpetuates systemic power imbalances.",
      tools: ["Qualitative Analysis", "NVivo", "LaTeX 2e"],
      sections: [
        { type: "heading", text: "01. What Archives Don't Say" },
        { type: "paragraph", text: "Every archive is defined as much by what it excludes as by what it contains. The systematic absence of certain voices, perspectives, and experiences is not accidental." },
        { type: "heading", text: "02. Silence as Structure" },
        { type: "paragraph", text: "We identify four categories of archival silence: deliberate destruction, passive neglect, structural exclusion, and interpretive erasure." },
        { type: "heading", text: "03. Toward Inclusive Curation" },
        { type: "paragraph", text: "Concrete strategies for acknowledging and addressing archival gaps without fabricating historical records." }
      ]
    }
  ];

  for (const p of extraPubs) {
    insertPub.run(
      p.year, p.type, p.title, p.journal, JSON.stringify(p.links),
      p.category, p.volume, p.date, p.author_name, p.author_role,
      p.citations, JSON.stringify(p.keywords), p.hero_image, p.hero_caption,
      p.abstract, JSON.stringify(p.tools), JSON.stringify(p.sections)
    );
  }

  // Set next_item references (circular through first 3)
  db.prepare('UPDATE publications SET next_item_id = 2 WHERE id = 1').run();
  db.prepare('UPDATE publications SET next_item_id = 3 WHERE id = 2').run();
  db.prepare('UPDATE publications SET next_item_id = 4 WHERE id = 3').run();
  db.prepare('UPDATE publications SET next_item_id = 5 WHERE id = 4').run();
  db.prepare('UPDATE publications SET next_item_id = 1 WHERE id = 5').run();

  const insertBlog = db.prepare(`
    INSERT INTO blogs (date, id_tag, tags, title, excerpt, equation, image, author_name, author_role, author_avatar, category, volume, keywords, hero_image, hero_caption, abstract, tools, sections)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const blogs = [
    {
      date: "2024-05-12", id_tag: "NOTE_045", tags: ["ALGORITHMS", "RESEARCH"],
      title: "Entropy as a Measure of Archival Stability in Decentralized Networks",
      excerpt: "An investigation into the mathematical foundations of long-term data persistence. We explore how the structural integrity of digital artifacts can be modeled using the equation:",
      equation: "S = -k_B \\sum p_i \\ln p_i", image: "",
      author_name: "Dr. Elias Thorne", author_role: "Lead Researcher", author_avatar: "https://picsum.photos/seed/elias/100/100",
      category: "Research Note", volume: "NOTE_045",
      keywords: ["Entropy", "Stability", "Data Decay", "Semantic Preservation"],
      hero_image: "https://picsum.photos/seed/entropy/1200/500",
      hero_caption: "Fig 1.1: Visualization of Shannon entropy in fragmented archival systems.",
      abstract: "This paper investigates the correlation between information entropy and the long-term structural integrity of digital archives, proposing a new metric for 'Archival Half-life'.",
      tools: ["Python / SciPy", "Tensor-Flow", "LaTeX 2e"],
      sections: [
        { type: "heading", text: "01. Theoretical Framework" },
        { type: "paragraph", text: "The stability of a digital archive is not merely a function of its storage medium's physical durability, but rather the internal thermodynamic pressure of information entropy." },
        { type: "equation", latex: "S = -k_B \\sum p_i \\ln p_i", caption: "Equation (1): Information Entropy Expansion" },
        { type: "paragraph", text: "In the context of the Archivist Framework, p_i represents the probability of a specific semantic node maintaining its original pointer reference over a duration t." },
        { type: "heading", text: "02. Methodologies of Containment" },
        { type: "paragraph", text: "Our research suggests that by layering metadata in a non-linear 'Bento' structure, we can create semantic redundant cycles." },
        { type: "metrics", items: [{ label: "METRIC A", value: "99.2%", description: "Consistency Rate" }, { label: "DECAY B", value: "-0.04", description: "Entropy Delta" }] },
        { type: "heading", text: "03. Conclusive Findings" },
        { type: "paragraph", text: "The future of archival research lies in the intersection of mathematical precision and aesthetic clarity." }
      ]
    },
    {
      date: "2024-04-30", id_tag: "NOTE_042", tags: ["VISUALIZATION"],
      title: "Visualizing Latent Spaces in Historical Manuscripts",
      excerpt: "Using custom GAN architectures to reconstruct missing fragments of the 14th-century codex.",
      equation: "", image: "https://picsum.photos/seed/manuscript/800/600",
      author_name: "Dr. Elias Thorne", author_role: "Lead Researcher", author_avatar: "https://picsum.photos/seed/elias/100/100",
      category: "Research Note", volume: "NOTE_042",
      keywords: ["GAN", "Latent Space", "Manuscripts", "Reconstruction"],
      hero_image: "https://picsum.photos/seed/manuscript/1200/500",
      hero_caption: "Fig 1.1: GAN-reconstructed fragment overlay on original manuscript.",
      abstract: "Using custom GAN architectures to reconstruct missing fragments of the 14th-century codex, revealing hidden textual patterns invisible to the human eye.",
      tools: ["PyTorch", "StyleGAN3", "OpenCV"],
      sections: [
        { type: "heading", text: "01. The Missing Fragments Problem" },
        { type: "paragraph", text: "Medieval manuscripts rarely survive intact. Centuries of handling, environmental damage, and deliberate destruction have left most historical codices as fragmentary shadows of their original form." },
        { type: "image", url: "https://picsum.photos/seed/latent-space/800/400", caption: "Latent space interpolation between two manuscript styles", alt: "Latent space visualization" },
        { type: "heading", text: "02. Architecture & Training" },
        { type: "paragraph", text: "Our modified StyleGAN3 architecture was trained on 12,000 high-resolution scans of 13th-15th century manuscripts from the Bodleian Library digital collection." },
        { type: "code", code: "class PaleographicLoss(nn.Module):\n    def forward(self, generated, era_embedding):\n        style_features = self.encoder(generated)\n        era_features = self.era_proj(era_embedding)\n        return F.cosine_embedding_loss(\n            style_features, era_features,\n            torch.ones(generated.size(0))\n        )", language: "python", caption: "Custom paleographic consistency loss function" },
        { type: "heading", text: "03. Results & Observations" },
        { type: "paragraph", text: "The trained model successfully reconstructed 73% of deliberately obscured test fragments." },
        { type: "metrics", items: [{ label: "FIDELITY", value: "73%", description: "Expert-verified accuracy" }, { label: "CLUSTERS", value: "14", description: "Discovered scriptoria" }] }
      ]
    }
  ];

  for (const b of blogs) {
    insertBlog.run(
      b.date, b.id_tag, JSON.stringify(b.tags), b.title, b.excerpt,
      b.equation, b.image, b.author_name, b.author_role, b.author_avatar,
      b.category, b.volume, JSON.stringify(b.keywords), b.hero_image, b.hero_caption,
      b.abstract, JSON.stringify(b.tools), JSON.stringify(b.sections)
    );
  }

  db.prepare('UPDATE blogs SET next_item_id = 2 WHERE id = 1').run();
  db.prepare('UPDATE blogs SET next_item_id = 1 WHERE id = 2').run();

  const insertGallery = db.prepare('INSERT INTO gallery (title, date, url, span) VALUES (?, ?, ?, ?)');
  const galleryItems = [
    { title: "IMG_001.JPG / BRUTALIST_INFRA", date: "2024-03-12", url: "https://picsum.photos/seed/brutalist/1200/800", span: "col-span-8" },
    { title: "IMG_002.JPG / LIGHT_STUDY_04", date: "2024-03-10", url: "https://picsum.photos/seed/light/800/1200", span: "col-span-4" },
    { title: "IMG_003.JPG / URBAN_SILENCE", date: "2024-03-05", url: "https://picsum.photos/seed/urban/800/800", span: "col-span-4" },
    { title: "IMG_004.JPG / ORGANIC_DEPTH", date: "2024-02-28", url: "https://picsum.photos/seed/forest/800/800", span: "col-span-4" },
    { title: "IMG_005.JPG / STILL_HORIZON", date: "2024-02-15", url: "https://picsum.photos/seed/horizon/800/800", span: "col-span-4" },
    { title: "IMG_006.JPG / CONCRETE_VEIL", date: "2024-02-01", url: "https://picsum.photos/seed/concrete/1200/800", span: "col-span-8" },
    { title: "IMG_007.JPG / REFLECTED_GRID", date: "2024-01-28", url: "https://picsum.photos/seed/grid/800/800", span: "col-span-4" },
    { title: "IMG_008.JPG / SHADOW_ARCHIVE", date: "2024-01-15", url: "https://picsum.photos/seed/shadow/800/1000", span: "col-span-4" },
    { title: "IMG_009.JPG / TEMPORAL_DRIFT", date: "2024-01-10", url: "https://picsum.photos/seed/drift/800/600", span: "col-span-4" },
    { title: "IMG_010.JPG / MONO_STRUCTURE", date: "2023-12-20", url: "https://picsum.photos/seed/mono/1200/800", span: "col-span-8" },
    { title: "IMG_011.JPG / LIMINAL_PASSAGE", date: "2023-12-14", url: "https://picsum.photos/seed/liminal/800/800", span: "col-span-4" },
    { title: "IMG_012.JPG / GLASS_MEMBRANE", date: "2023-12-01", url: "https://picsum.photos/seed/glass/800/1000", span: "col-span-4" },
    { title: "IMG_013.JPG / VOID_GEOMETRY", date: "2023-11-22", url: "https://picsum.photos/seed/void/800/800", span: "col-span-4" },
    { title: "IMG_014.JPG / RUST_PATINA", date: "2023-11-10", url: "https://picsum.photos/seed/rust/1200/600", span: "col-span-8" },
    { title: "IMG_015.JPG / ARID_EXPANSE", date: "2023-10-30", url: "https://picsum.photos/seed/arid/800/800", span: "col-span-4" },
    { title: "IMG_016.JPG / NIGHT_SCHEMA", date: "2023-10-15", url: "https://picsum.photos/seed/nightschema/800/1200", span: "col-span-4" },
  ];

  for (const g of galleryItems) {
    insertGallery.run(g.title, g.date, g.url, g.span);
  }

  console.log('[DB] Seed complete.');
}
