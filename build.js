#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(process.cwd(), 'build.json');
const SRC_DIR = process.cwd();

const MARKER_RE = /<!--\s*\|\s*METADATA\s*\|\s*page:([a-zA-Z0-9_-]+)\s*-->/;
const TITLE_RE = /<title>.*?<\/title>\s*\n?/i;
const RESERVED = new Set(['title']);

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error(`[Build] Config not found at ${CONFIG_PATH}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
}

function escape(str) {
  return String(str).replace(/&/g, '&amp;').replace(/'/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function metaKey(tag) { return tag.name || tag.property; }

function baseData(head) {
  return {
    title: head.title,
    meta: head.meta || [],
    link: head.link || [],
    theme: head.theme || [],
    jsonld: head.jsonld || null,
  };
}

function mergeMeta(headMeta, pageBlock) {
  const merged = headMeta.map(tag => {
    const key = metaKey(tag);
    if (key && Object.prototype.hasOwnProperty.call(pageBlock, key) && pageBlock[key] !== undefined) {
      return { ...tag, content: pageBlock[key] };
    }
    return tag;
  });

  const existingKeys = new Set(headMeta.map(metaKey));
  for (const [key, value] of Object.entries(pageBlock)) {
    if (RESERVED.has(key) || existingKeys.has(key) || value === undefined) continue;
    const isProperty = key.includes(':');
    merged.push(isProperty ? { property: key, content: value } : { name: key, content: value });
  }

  return merged;
}

function applyPageUrl(mergedMeta, headMeta, pageBlock, pageName) {
  const baseUrl = headMeta.find(t => t.property === 'og:url')?.content || '';
  const pageUrl = baseUrl ? `${baseUrl.replace(/\/$/, '')}/${pageName}` : undefined;
  if (!pageUrl) return mergedMeta;

  return mergedMeta.map(tag => {
    const key = metaKey(tag);
    const explicitlySet = Object.prototype.hasOwnProperty.call(pageBlock, key);
    const isUrlTag = tag.property === 'og:url' || tag.property === 'twitter:url';
    return isUrlTag && !explicitlySet ? { ...tag, content: pageUrl } : tag;
  });
}

function mergeJsonLd(jsonld, pageBlock) {
  if (!jsonld) return null;

  const overrides = {};
  for (const key of Object.keys(jsonld)) {
    if (Object.prototype.hasOwnProperty.call(pageBlock, key)) {
      overrides[key] = pageBlock[key];
    }
  }
  return { ...jsonld, ...overrides };
}

function derivePageTitle(pageBlock, head, pageName) {
  if (pageBlock.title) return pageBlock.title;
  const siteName = head.title ? head.title.split(' - ')[0] : '';
  const label = pageName.charAt(0).toUpperCase() + pageName.slice(1);
  return `${siteName} - ${label}`;
}

function resolvePageData(config, pageName) {
  const head = config.head || {};

  if (pageName === 'index') {
    return baseData(head);
  }

  const pageBlock = (config.page && config.page[pageName]) || null;
  if (!pageBlock) {
    console.warn(`[Build] No config found for page:${pageName} — skipping override, using site defaults.`);
    return baseData(head);
  }

  const headMeta = head.meta || [];
  const merged = mergeMeta(headMeta, pageBlock);
  const finalMeta = applyPageUrl(merged, headMeta, pageBlock, pageName);

  return {
    title: derivePageTitle(pageBlock, head, pageName),
    meta: finalMeta,
    link: head.link || [],
    theme: head.theme || [],
    jsonld: mergeJsonLd(head.jsonld, pageBlock),
  };
}

function buildHeadBlock(data) {
  const lines = [];

  if (data.title) {
    lines.push(`<title>${escape(data.title)}</title>`);
  }

  for (const tag of data.meta || []) {
    const attr = tag.name ? `name='${escape(tag.name)}'` : `property='${escape(tag.property)}'`;
    lines.push(`<meta ${attr} content='${escape(tag.content)}' />`);
  }

  for (const link of data.link || []) {
    const attrs = Object.entries(link)
      .map(([k, v]) => `${k}='${escape(v)}'`)
      .join(' ');
    lines.push(`<link ${attrs} />`);
  }

  for (const theme of data.theme || []) {
    lines.push(`<meta name='theme-color' media='${escape(theme.media)}' content='${escape(theme.content)}' />`);
  }

  if (data.jsonld) {
    lines.push(`<script type='application/ld+json'>${JSON.stringify(data.jsonld)}</script>`);
  }

  return lines.join('\n    ');
}

function findHtmlFiles(dir) {
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.html'))
    .map(f => path.join(dir, f));
}

function processFile(file, config) {
  const original = fs.readFileSync(file, 'utf8');
  const match = original.match(MARKER_RE);
  if (!match) return false;

  const pageName = match[1];
  const data = resolvePageData(config, pageName);
  const headBlock = buildHeadBlock(data);

  const withoutOldTitle = original.replace(TITLE_RE, '');
  const updated = withoutOldTitle.replace(MARKER_RE, headBlock);

  fs.writeFileSync(file, updated, 'utf8');
  console.log(`[Build] Injected metadata for page:${pageName} -> ${path.basename(file)}`);
  return true;
}

function run() {
  const config = loadConfig();
  const files = findHtmlFiles(SRC_DIR);

  if (files.length === 0) {
    console.warn(`[Build] No .html files found in ${SRC_DIR}`);
    return;
  }

  const injectedCount = files.reduce((count, file) => count + (processFile(file, config) ? 1 : 0), 0);

  console.log(`[Build] Done. ${injectedCount} file(s) updated.`);
}

run();