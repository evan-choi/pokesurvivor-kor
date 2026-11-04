(() => {
  'use strict';

  const attributes = ['title', 'placeholder', 'aria-label', 'alt'];
  const excluded = 'script, style, code, pre, textarea, [contenteditable]:not([contenteditable="false"]), [translate="no"], [data-psko-ui]';
  const originals = new WeakMap();
  let enabled = false;
  let observer;
  let originalLang;
  let pendingLanguageButton;
  const isGame = () => document.querySelector('#tap-start, #scr-settings');

  function replaceValue(node, key, value, write) {
    let entries = originals.get(node);
    const previous = entries?.get(key);
    // Game rerenders always become the new original, even for reused nodes.
    const source = previous && value === previous.translated ? previous.source : value;
    const element = key === 'text' ? node.parentElement : node;
    const moveName = key === 'title'
      ? element.matches('.move-icons > span')
      : key === 'text' && (
        element.matches('#dex-detail > p > b.gold') ||
        element.matches('.bind-slot option, .ban-moves .chip') ||
        (element.closest('#cards .nm, #bond-cards .nm') && !element.closest('.type, .tag-chip')) ||
        element.matches('#over-stats > div > b[style*="font-size:15px"]')
      );
    const translate = moveName ? globalThis.PSKO.translateMove : globalThis.PSKO.translate;
    let translated = enabled ? translate(source) : source;
    if (enabled && key === 'text' && source.trim().toLowerCase() === 'normal') {
      if (node.parentElement.closest('#set-body [data-k="stick"]')) translated = source.replace(/normal/i, '보통');
      if (node.parentElement.closest('#dex-detail .seg [data-v="0"]')) translated = source.replace(/normal/i, '일반');
    }
    if (!entries) originals.set(node, entries = new Map());
    entries.set(key, { source, translated });
    if (value !== translated) write(translated);
  }

  function updateNode(node) {
    const element = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    if (!element || element.nodeType !== Node.ELEMENT_NODE || element.closest(excluded)) return;
    if (node.nodeType === Node.TEXT_NODE) {
      replaceValue(node, 'text', node.nodeValue, (text) => { node.nodeValue = text; });
    } else {
      for (const attr of attributes) {
        if (element.hasAttribute(attr)) {
          replaceValue(element, attr, element.getAttribute(attr), (text) => element.setAttribute(attr, text));
        }
      }
    }
  }

  function walk(root) {
    if (!root || !root.isConnected) return;
    updateNode(root);
    if (root.nodeType !== Node.ELEMENT_NODE || root.closest(excluded)) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return node.nodeType === Node.ELEMENT_NODE && node.matches(excluded)
          ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      },
    });
    while (walker.nextNode()) updateNode(walker.currentNode);
  }

  function saveEnabled(value) {
    document.dispatchEvent(new CustomEvent('psko:set-enabled', { detail: value }));
  }

  function addLanguageChoice() {
    // The game's language controls opt out of translation. Keep its own buttons usable.
    for (const english of document.querySelectorAll('#set-body [data-lang="en"], #settings-body [data-lang="en"], #scr-settings [data-lang="en"]')) {
      const container = english.parentElement;
      let korean = container.querySelector('[data-psko-language]');
      if (!korean) {
        korean = document.createElement('button');
        korean.type = 'button';
        korean.className = 'chip';
        korean.textContent = '한국어';
        korean.dataset.pskoLanguage = '';
        korean.dataset.pskoUi = '';
        korean.addEventListener('click', () => saveEnabled(true));
        container.append(korean);
        for (const button of container.querySelectorAll('[data-lang]')) {
          button.addEventListener('click', (event) => {
            if (!enabled) return;
            event.preventDefault();
            event.stopImmediatePropagation();
            pendingLanguageButton = button;
            saveEnabled(false);
          }, true);
        }
      }
      korean.classList.toggle('on', enabled);
      korean.setAttribute('aria-pressed', String(enabled));
      if (enabled) {
        for (const button of container.querySelectorAll('[data-lang]')) button.classList.remove('on');
      } else {
        let language = 'en';
        try { language = localStorage.getItem('ps.lang') || originalLang || 'en'; } catch { /* The game's default remains available. */ }
        for (const button of container.querySelectorAll('[data-lang]')) button.classList.toggle('on', button.dataset.lang === language);
      }
    }
  }

  function setEnabled(value) {
    enabled = value;
    if (!observer || !document.body || !isGame()) return;
    document.documentElement.classList.toggle('psko-enabled', enabled);
    // Only change the embedded game's language metadata, not the surrounding website.
    if (document.querySelector('#scr-settings, #tap-start')) {
      originalLang ??= document.documentElement.lang;
      document.documentElement.lang = enabled ? 'ko' : originalLang;
    }
    walk(document.body);
    addLanguageChoice();
  }

  function start() {
    if (!isGame()) return;
    observer = new MutationObserver((records) => {
      const roots = new Set();
      for (const record of records) {
        if (record.type === 'childList') record.addedNodes.forEach((node) => roots.add(node));
        else roots.add(record.target);
      }
      for (const root of roots) walk(root);
      addLanguageChoice();
    });
    observer.observe(document.body, {
      subtree: true, childList: true, characterData: true,
      attributes: true, attributeFilter: attributes,
    });
    setEnabled(enabled);
  }

  document.addEventListener('psko:settings', (event) => {
    if (typeof event.detail !== 'boolean') return;
    setEnabled(event.detail);
    if (!enabled && pendingLanguageButton) {
      const button = pendingLanguageButton;
      pendingLanguageButton = undefined;
      button.click();
    }
  });
  document.addEventListener('psko:storage-error', () => {
    pendingLanguageButton = undefined;
    window.alert('한국어 모드 설정을 저장하지 못했습니다. 확장 프로그램을 새로고침해 주세요.');
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
  document.dispatchEvent(new Event('psko:ready'));
})();
