/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/**
 * log RUM if part of the sample.
 * @param {string} checkpoint identifies the checkpoint in funnel
 * @param {Object} data additional data for RUM sample
 */

 export function sampleRUM(checkpoint, data = {}) {
    try {
      window.hlx = window.hlx || {};
      if (!window.hlx.rum) {
        const usp = new URLSearchParams(window.location.search);
        const weight = (usp.get('rum') === 'on') ? 1 : 100; // with parameter, weight is 1. Defaults to 100.
        // eslint-disable-next-line no-bitwise
        const hashCode = (s) => s.split('').reduce((a, b) => (((a << 5) - a) + b.charCodeAt(0)) | 0, 0);
        const id = `${hashCode(window.location.href)}-${new Date().getTime()}-${Math.random().toString(16).substr(2, 14)}`;
        const random = Math.random();
        const isSelected = (random * weight < 1);
        // eslint-disable-next-line object-curly-newline
        window.hlx.rum = { weight, id, random, isSelected };
      }
      const { random, weight, id } = window.hlx.rum;
      if (random && (random * weight < 1)) {
        const sendPing = () => {
          // eslint-disable-next-line object-curly-newline, max-len, no-use-before-define
          const body = JSON.stringify({ weight, id, referer: window.location.href, generation: RUM_GENERATION, checkpoint, ...data });
          const url = `https://rum.hlx3.page/.rum/${weight}`;
          // eslint-disable-next-line no-unused-expressions
          navigator.sendBeacon(url, body);
        };
        sendPing();
        // special case CWV
        if (checkpoint === 'cwv') {
          // eslint-disable-next-line import/no-unresolved
          import('./web-vitals-module-2-1-2.js').then((mod) => {
            const storeCWV = (measurement) => {
              data.cwv = {};
              data.cwv[measurement.name] = measurement.value;
              sendPing();
            };
            mod.getCLS(storeCWV);
            mod.getFID(storeCWV);
            mod.getLCP(storeCWV);
          });
        }
      }
    } catch (e) {
      // something went wrong
    }
  }
  
  /**
   * Loads a CSS file.
   * @param {string} href The path to the CSS file
   */
  export function loadStyle(href, callback) {
    if (!document.querySelector(`head > link[href="${href}"]`)) {
      const link = document.createElement('link');
      link.setAttribute('rel', 'stylesheet');
      link.setAttribute('href', href);
      if (typeof callback === 'function') {
        link.onload = (e) => callback(e.type);
        link.onerror = (e) => callback(e.type);
      }
      document.head.appendChild(link);
    } else if (typeof callback === 'function') {
      callback('noop');
    }
  }
  
  /**
   * Retrieves the content of a metadata tag.
   * @param {string} name The metadata name (or property)
   * @returns {string} The metadata value
   */
  export function getMetadata(name) {
    const attr = name && name.includes(':') ? 'property' : 'name';
    const $meta = document.head.querySelector(`meta[${attr}="${name}"]`);
    return $meta && $meta.content;
  }
  
  /**
   * Adds one or more URLs to the dependencies for publishing.
   * @param {string|[string]} url The URL(s) to add as dependencies
   */
  export function addPublishDependencies(url) {
    const urls = Array.isArray(url) ? url : [url];
    window.hlx = window.hlx || {};
    if (window.hlx.dependencies && Array.isArray(window.hlx.dependencies)) {
      window.hlx.dependencies = window.hlx.dependencies.concat(urls);
    } else {
      window.hlx.dependencies = urls;
    }
  }
  
  /**
   * Sanitizes a name for use as class name.
   * @param {*} name The unsanitized name
   * @returns {string} The class name
   */
  export function toClassName(name) {
    return name && typeof name === 'string'
      ? name.toLowerCase().replace(/[^0-9a-z]/gi, '-')
      : '';
  }
  
  /**
   * Wraps each section in an additional {@code div}.
   * @param {[Element]} $sections The sections
   */
  function wrapSections($sections) {
    $sections.forEach(($div) => {
      if ($div.childNodes.length === 0) {
        // remove empty sections
        $div.remove();
      } else if (!$div.id) {
        const $wrapper = document.createElement('div');
        $wrapper.className = 'section-wrapper';
        $div.parentNode.appendChild($wrapper);
        $wrapper.appendChild($div);
      }
    });
  }
  
  /**
   * Decorates a block.
   * @param {Element} block The block element
   */
  export function decorateBlock(block) {
    const trimDashes = (str) => str.replace(/(^\s*-)|(-\s*$)/g, '');
    const classes = Array.from(block.classList.values());
    const blockName = classes[0];
    if (!blockName) return;
    const section = block.closest('.section-wrapper');
    if (section) {
      section.classList.add(`${blockName}-container`.replace(/--/g, '-'));
    }
    const blockWithVariants = blockName.split('--');
    const shortBlockName = trimDashes(blockWithVariants.shift());
    const variants = blockWithVariants.map((v) => trimDashes(v));
    block.classList.add(shortBlockName);
    block.classList.add(...variants);
  
    block.classList.add('block');
    block.setAttribute('data-block-name', shortBlockName);
    block.setAttribute('data-block-status', 'initialized');
  }
  
  /**
   * Decorates all sections in a container element.
   * @param {Element} mainEl The container element
   */
  export function decorateSections(mainEl) {
    wrapSections(mainEl.querySelectorAll(':scope > div'));
    mainEl.querySelectorAll(':scope > div.section-wrapper').forEach((section) => {
      section.setAttribute('data-section-status', 'initialized');
    });
  }
  
  /**
   * Updates all section status in a container element.
   * @param {Element} mainEl The container element
   */
  export function updateSectionsStatus(mainEl) {
    const sections = [...mainEl.querySelectorAll(':scope > div.section-wrapper')];
    for (let i = 0; i < sections.length; i += 1) {
      const section = sections[i];
      const status = section.getAttribute('data-section-status');
      if (status !== 'loaded') {
        const loadingBlock = section.querySelector('.block[data-block-status="initialized"], .block[data-block-status="loading"]');
        if (loadingBlock) {
          section.setAttribute('data-section-status', 'loading');
          break;
        } else {
          section.setAttribute('data-section-status', 'loaded');
        }
      }
    }
  }
  
  /**
   * Decorates all blocks in a container element.
   * @param {Element} mainEl The container element
   */
  export function decorateBlocks(mainEl) {
    mainEl
      .querySelectorAll('div.section-wrapper > div div')
      .forEach((blockEl) => decorateBlock(blockEl));
  }
  
  /**
   * Builds a block DOM Element from a two dimensional array
   * @param {string} blockName name of the block
   * @param {any} content two dimensional array or string or object of content
   */
  function buildBlock(blockName, content) {
    const table = Array.isArray(content) ? content : [[content]];
    const blockEl = document.createElement('div');
    // build image block nested div structure
    blockEl.classList.add(blockName);
    table.forEach((row) => {
      const rowEl = document.createElement('div');
      row.forEach((col) => {
        const colEl = document.createElement('div');
        const vals = col.elems ? col.elems : [col];
        vals.forEach((val) => {
          if (val) {
            if (typeof val === 'string') {
              colEl.innerHTML += val;
            } else {
              colEl.appendChild(val);
            }
          }
        });
        rowEl.appendChild(colEl);
      });
      blockEl.appendChild(rowEl);
    });
    return (blockEl);
  }
  
  /**
   * Loads JS and CSS for a block.
   * @param {Element} blockEl The block element
   */
  export async function loadBlock(block, eager = false) {
    if (!(block.getAttribute('data-block-status') === 'loading' || block.getAttribute('data-block-status') === 'loaded')) {
      block.setAttribute('data-block-status', 'loading');
      const blockName = block.getAttribute('data-block-name');
      try {
        const cssLoaded = new Promise((resolve) => {
          loadStyle(`${window.hlx.codeBasePath}/blocks/${blockName}/${blockName}.css`, resolve);
        });
        const decorationComplete = new Promise((resolve) => {
          (async () => {
            try {
              const mod = await import(`../blocks/${blockName}/${blockName}.js`);
              if (mod.default) {
                await mod.default(block, blockName, document, eager);
              }
            } catch (err) {
              // eslint-disable-next-line no-console
              console.log(`failed to load module for ${blockName}`, err);
            }
            resolve();
          })();
        });
        await Promise.all([cssLoaded, decorationComplete]);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.log(`failed to load block ${blockName}`, err);
      }
      block.setAttribute('data-block-status', 'loaded');
    }
  }
  
  /**
   * Loads JS and CSS for all blocks in a container element.
   * @param {Element} mainEl The container element
   */
  export async function loadBlocks(mainEl) {
    updateSectionsStatus(mainEl);
    const blocks = [...mainEl.querySelectorAll('div.block')];
    for (let i = 0; i < blocks.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await loadBlock(blocks[i]);
      updateSectionsStatus(mainEl);
    }
  }
  
  /**
   * Adds the favicon.
   * @param {string} href The favicon URL
   */
  export function addFavIcon(href) {
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/svg+xml';
    link.href = href;
    const existingLink = document.querySelector('head link[rel="icon"]');
    if (existingLink) {
      existingLink.parentElement.replaceChild(link, existingLink);
    } else {
      document.getElementsByTagName('head')[0].appendChild(link);
    }
  }
  
  /**
   * load LCP block and/or wait for LCP in default content.
   */
  async function waitForLCP() {
    // eslint-disable-next-line no-use-before-define
    const lcpBlocks = LCP_BLOCKS;
    const block = document.querySelector('.block');
    const hasLCPBlock = (block && lcpBlocks.includes(block.getAttribute('data-block-name')));
    if (hasLCPBlock) await loadBlock(block, true);
  
    document.querySelector('body').classList.add('appear');
    const lcpCandidate = document.querySelector('main img');
    await new Promise((resolve) => {
      if (lcpCandidate && !lcpCandidate.complete) {
        lcpCandidate.addEventListener('load', () => resolve());
        lcpCandidate.addEventListener('error', () => resolve());
      } else {
        resolve();
      }
    });
  }
  
  /**
   * Decorates the page.
   */
  async function loadPage(doc) {
    // eslint-disable-next-line no-use-before-define
    await loadEager(doc);
    // eslint-disable-next-line no-use-before-define
    await loadLazy(doc);
    // eslint-disable-next-line no-use-before-define
    loadDelayed(doc);
  }
  
  export function initHlx() {
    window.hlx = window.hlx || {};
    window.hlx.lighthouse = new URLSearchParams(window.location.search).get('lighthouse') === 'on';
    window.hlx.codeBasePath = '';
  
    const scriptEl = document.querySelector('script[src$="/scripts/scripts.js"]');
    if (scriptEl) {
      try {
        [window.hlx.codeBasePath] = new URL(scriptEl.src).pathname.split('/scripts/scripts.js');
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log(e);
      }
    }
  }
  
  initHlx();
  
  /*
   * ------------------------------------------------------------
   * Edit above at your own risk
   * ------------------------------------------------------------
   */
  
  const LCP_BLOCKS = ['marquee']; // add your LCP blocks to the list
  const RUM_GENERATION = 'consonant'; // add your RUM generation information here
  
  const LIVE_ORIGIN = 'https://main--consonant--adobecom.hlx.live';
  
  sampleRUM('top');
  window.addEventListener('load', () => sampleRUM('load'));
  document.addEventListener('click', () => sampleRUM('click'));
  
  loadPage(document);
  
  export function makeRelative(anchor) {
    const { href, textContent } = anchor;
    const url = new URL(href);
    const host = url.hostname;
    if (host.endsWith('consonant--adobecom.hlx3.page') ||
        host.endsWith('consonant--adobecom.hlx.live')) {
          const relative = `${url.pathname}${url.search}${url.hash}`;
          anchor.setAttribute('href', relative);
          return relative;
    }
    // external link
    anchor.target = '_blank';
    return href;
  }
  
  export function setSVG(anchor) {
    const { textContent } = anchor;
    const href = anchor.getAttribute('href');
    const ext = textContent.substr(textContent.lastIndexOf('.') + 1);
    if (ext !== 'svg') return;
    const img = document.createElement('img');
    img.src = textContent;
    if (textContent === href) {
      anchor.parentElement.append(img);
      anchor.remove();
    } else {
      anchor.textContent = '';
      anchor.append(img);
    }
  }
  
  export function forceDownload(anchor) {
    const { href } = anchor;
    const filename = href.split('/').pop();
    const ext = filename.split('.')[1];
    if (ext && ['crx'].includes(ext)) {
      anchor.setAttribute('download', filename);
    }
  }
  
  export function decorateAnchors(element) {
    const anchors = element.getElementsByTagName('a');
    return Array.from(anchors).map((anchor) => {
      makeRelative(anchor);
      setSVG(anchor);
      forceDownload(anchor);
      return anchor;
    });
  }
  
  export function loadScript(url, callback, type) {
    const script = document.createElement('script');
    script.onload = callback;
    script.setAttribute('src', url);
    if (type) { script.setAttribute('type', type); }
    document.head.append(script);
    return script;
  }
  
  export function setTemplate() {
    const template = getMetadata('template');
    if (!template) return;
    document.body.classList.add(`${template}-template`);
  }
  
  /**
   * Clean up variant classes
   * Ex: marquee--small--contained- -> marquee small contained
   * @param {HTMLElement} parent
   */
  export function cleanVariations(parent) {
    const variantBlocks = parent.querySelectorAll('[class$="-"]');
    return Array.from(variantBlocks).map((variant) => {
      const { className } = variant;
      const classNameClipped = className.slice(0, -1);
      variant.classList.remove(className);
      const classNames = classNameClipped.split('--');
      variant.classList.add(...classNames);
      return variant;
    });
  }
  
  function buildEmbeds() {
    const embeds = [...document.querySelectorAll('a[href^="https://www.youtube.com"], a[href^="https://gist.github.com"]')];
    embeds.forEach((embed) => {
      embed.replaceWith(buildBlock('embed', embed.outerHTML));
    });
  }
  
  function buildHeader() {
    const header = document.querySelector('header');
    header.append(buildBlock('header', ''));
  }
  /**
   * Builds all synthetic blocks in a container element.
   * @param {Element} main The container element
   */
  export function buildAutoBlocks(main) {
    try {
      buildHeader();
      buildEmbeds(main);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Auto Blocking failed', error);
    }
  }
  
  /**
   * Decorates the main element.
   * @param {Element} main The main element
   */
  export function decorateMain(main) {
    // forward compatible pictures redecoration
    decorateAnchors(main);
    buildAutoBlocks(main);
    decorateBlocks(main);
  }
  
  /**
   * loads everything needed to get to LCP.
   */
  async function loadEager(doc) {
    const main = doc.querySelector('main');
    if (main) {
      setTemplate();
      decorateMain(main);
      await waitForLCP();
    }
  }
  
  /**
   * loads everything that doesn't need to be delayed.
   */
  async function loadLazy(doc) {
    const main = doc.querySelector('main');
    const header = doc.querySelector('header > div');
  
    loadBlocks(main);
  
    decorateBlock(header);
    loadBlock(header);
  
    loadStyle('/fonts/fonts.css');
    addFavIcon(`${window.hlx.codeBasePath}/img/icon.svg`);
  }
  
  /**
   * loads everything that happens a lot later, without impacting
   * the user experience.
   */
  function loadDelayed() {
    // load anything that can be postponed to the latest here
  }