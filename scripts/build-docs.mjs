import fs from 'node:fs';
import MarkdownIt from 'markdown-it';
const md = new MarkdownIt({html:false,linkify:true,typographer:true});
const pages = [
 {source:'docs/architecture.md',output:'architecture.html',title:'The architecture of Tactile Agent',subtitle:'From a human demonstration to stage intent, object-relative interaction, and task-conditioned tactile supervision.'},
 {source:'docs/video-script.md',output:'video-script.html',title:'Tell the story of Tactile Agent',subtitle:'The 2:54 bottle-task film: English narration, a graph of video stages, genuine hand perception, a tactile primitive tree, and task-policy code.'}
];
for(const page of pages){
 let rendered=md.render(fs.readFileSync(page.source,'utf8'));
 rendered=rendered.replaceAll('href="claim-evidence.md"','href="docs/claim-evidence.md"').replaceAll('href="video-script.md"','href="video-script.html"').replaceAll('href="architecture.md"','href="architecture.html"').replaceAll('href="../assets/','href="assets/');
 fs.writeFileSync(page.output,`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${page.subtitle}"><meta name="theme-color" content="#f9faf7"><title>${page.title}</title><link rel="icon" href="favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="styles.css"></head><body class="doc-page"><a class="skip-link" href="#main">Skip to content</a><header class="site-header"><div class="nav-wrap"><a class="brand" href="./">Tactile <strong>Agent</strong><span class="brand-dot">.</span></a><nav aria-label="Main navigation"><a href="./#architecture">Architecture</a><a href="./#experiments">Experiments</a><a href="./#resources">Resources ↗</a></nav></div></header><main class="doc-shell" id="main"><a class="doc-back" href="./">← Back to the project</a><h1 class="doc-title">${page.title}</h1><p class="doc-subtitle">${page.subtitle}</p><a class="button secondary" href="${page.source}" download>Download Markdown ↓</a><article class="doc-content">${rendered}</article></main><footer class="site-footer wrap"><a class="brand" href="./">Tactile <strong>Agent</strong><span class="brand-dot">.</span></a><p>From a human demonstration to contact-aware action.</p><a href="https://github.com/iairplane/tactile_agent_page">Website source ↗</a></footer></body></html>\n`);
 console.log(`Rendered ${page.output}`);
}
