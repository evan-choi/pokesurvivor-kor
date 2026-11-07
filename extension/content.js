(() => {
  'use strict';

  const attributes = ['title', 'placeholder', 'aria-label', 'alt'];
  const excluded = 'script, style, code, pre, textarea, [contenteditable]:not([contenteditable="false"]), [data-psko-ui]';
  const originals = new WeakMap();
  let enabled = false;
  let observer;
  let originalLang;
  let pendingLanguageButton;
  const isGame = () => document.querySelector('#tap-start, #scr-settings');

  function isProtected(element) {
    const owner = element.closest('[translate="no"]');
    if (!owner) return false;
    // These containers contain fixed game copy, not player-entered names or room codes.
    if (owner.matches('#news-body > .news-day, #rk-me > span, #scr-savenote > .box, #savenote-body')) return false;
    if (owner.matches('#over-sum > p.sub')) return false;
    if (owner.matches('#dex-detail .mon-extra > .mx-row:nth-child(-n+2) > b')) return false;
    if (owner.matches('#pull-results .pcard > .pmon, #mx-picker .chip > b')) return false;
    if (owner.matches('.mb-txt > b')) return false;
    if (owner.matches('#user-pill > span') && owner.parentElement.querySelector('.sync.guest')) return false;
    return true;
  }

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
        element.matches('#shop-body .upg-item b, #bag-body .upg-item b') ||
        element.matches('.bind-slot option, .ban-moves .chip') ||
        (element.closest('#cards .nm, #bond-cards .nm') && !element.closest('.type, .tag-chip')) ||
        element.matches('#over-stats > div > b[style*="font-size:15px"]') ||
        element.matches('#over-sum .sum-moves td:first-child')
      );
    const translate = moveName ? globalThis.PSKO.translateMove : globalThis.PSKO.translate;
    let translated = enabled ? translate(source) : source;
    if (enabled && key === 'text' && element.matches('#dex-detail .mon-extra > .mx-row:nth-child(-n+2) > b')) {
      const names = element.parentElement.matches(':first-child') ? globalThis.PSKO_NATURES : globalThis.PSKO_ABILITIES;
      translated = source.replace(/\S(?:[\s\S]*\S)?/, (name) => names?.[name] || name);
    }
    if (enabled && key === 'text' && element.closest('#pull-results .pcard > .pmon, #mx-picker .chip > b')) {
      // The card puts the nature before the separator and the ability in a child span.
      // Keep its whitespace, separator and hidden-ability styling intact.
      translated = source.replace(/[^·]+/g, part => part.replace(/\S(?:[\s\S]*\S)?/, name =>
        globalThis.PSKO_NATURES?.[name] ?? globalThis.PSKO_ABILITIES?.[name] ?? name));
    }
    if (enabled && key === 'text' && element.id === 'starter-info') {
      translated = source.split(/(\s*[·,]\s*)/).map((part, index) => (
        index === 0 ? globalThis.PSKO.translateMove(part) : globalThis.PSKO.translate(part)
      )).join('');
    }
    if (enabled && key === 'text' && element.matches('.bind-slot option[value=""]') && /^(Free|Libre)$/i.test(source.trim())) {
      translated = source.replace(/Free|Libre/i, '빈 슬롯');
    }
    if (enabled && key === 'text' && element.closest('button') && /^(Save|Guardar)$/i.test(source.trim())) {
      translated = source.replace(/Save|Guardar/i, '저장');
    }
    if (enabled && key === 'text' && element.closest('#set-body') && element.tagName !== 'KBD' && /^(o|or)$/i.test(source.trim())) {
      translated = source.replace(/o(?:r)?/i, '또는');
    }
    if (enabled && key === 'text' && element.matches('#scr-pause .kbd-hint') && node.previousSibling?.textContent.trim() === 'WASD' && /^(move|moverse) ·$/i.test(source.trim())) {
      translated = source.replace(/move(?:rse)?/i, '이동');
    }
    if (enabled && key === 'text' && element.id === 'lvl-wait') {
      const choosing = /^(?:Faltan por elegir:|Still choosing:)\s*(.+)$/.exec(source.trim());
      const waiting = /^(?:Esperando a|Waiting for)\s+(.+?)(?:…|\.\.\.)$/.exec(source.trim());
      const match = choosing || waiting;
      if (match) {
        const players = match[1].split(/,\s*| y /).map((name) => name === 'tú' ? '나' : name).join(', ');
        translated = choosing ? `아직 선택 중: ${players}` : `${players} 대기 중…`;
      }
    }
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
      if (isProtected(element)) return;
      replaceValue(node, 'text', node.nodeValue, (text) => { node.nodeValue = text; });
    } else {
      for (const attr of attributes) {
        if (element.hasAttribute(attr)) {
          if (isProtected(element)) {
            const source = originals.get(element)?.get(attr)?.source || element.getAttribute(attr);
            if (attr !== 'title' || !/^(Ver su (?:perfil|profile)|View (?:their|his|her) profile)$/i.test(source.trim())) continue;
          }
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
    if (globalThis.PSKO_NATIVE_LOCALE?.registered) return;
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
