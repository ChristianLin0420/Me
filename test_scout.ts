import { discoverPapers } from './lib/papers.js';

async function test() {
  try {
    console.log('Starting discovery with 1 query...');
    const papers = await discoverPapers(['reinforcement learning robotics']);
    console.log('Found:', papers.length, 'topic-relevant papers');
    papers.slice(0, 5).forEach((p, i) => {
      console.log(`#${i+1} [${p.citationCount} cites] [${p.venue || 'preprint'}] ${p.title.slice(0, 80)}`);
    });
  } catch (err) {
    console.error('Error:', err);
  }
}
test();
