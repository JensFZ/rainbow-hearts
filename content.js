// 💙 (U+1F499) und 🩵 (U+1FA75), optional mit Variation Selector
const HEART = /(?:\u{1F499}|\u{1FA75})️?/gu;
const HAS_HEART = new RegExp(HEART.source, 'u');
const ONLY_HEART = new RegExp(`^${HEART.source}$`, 'u');
const SRC = chrome.runtime.getURL('heart.svg');
const SKIP = 'script,style,noscript,textarea,input,svg';

let enabled = false;

const skip = el => !el || el.isContentEditable || el.closest(SKIP);

function makeHeart(orig) {
  const img = document.createElement('img');
  img.src = SRC;
  img.alt = chrome.i18n.getMessage('heartAlt');
  img.dataset.rainbowHeart = orig;
  img.style.cssText = 'display:inline;height:1em;width:auto;vertical-align:-0.125em;margin:0 .05em';
  return img;
}

function replaceText(node) {
  const text = node.nodeValue;
  if (!HAS_HEART.test(text) || skip(node.parentElement)) return;
  const frag = document.createDocumentFragment();
  let last = 0;
  for (const m of text.matchAll(HEART)) {
    frag.append(text.slice(last, m.index), makeHeart(m[0]));
    last = m.index + m[0].length;
  }
  frag.append(text.slice(last));
  node.replaceWith(frag);
}

// Seiten wie X oder Discord zeigen Emoji als <img alt="💙">
function replaceImg(img) {
  if (img.src === SRC || !ONLY_HEART.test(img.alt) || skip(img)) return;
  img.dataset.rainbowSrc = img.getAttribute('src') ?? '';
  if (img.hasAttribute('srcset')) img.dataset.rainbowSrcset = img.getAttribute('srcset');
  img.removeAttribute('srcset');
  img.src = SRC;
}

function scan(root) {
  if (!enabled) return;
  if (root.nodeType === Node.TEXT_NODE) return replaceText(root);
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  if (root.tagName === 'IMG') return replaceImg(root);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const texts = [];
  while (walker.nextNode()) texts.push(walker.currentNode);
  texts.forEach(replaceText);
  root.querySelectorAll('img[alt]').forEach(replaceImg);
}

function restore() {
  document.querySelectorAll('img[data-rainbow-heart]').forEach(img => img.replaceWith(img.dataset.rainbowHeart));
  document.querySelectorAll('img[data-rainbow-src]').forEach(img => {
    img.setAttribute('src', img.dataset.rainbowSrc);
    if (img.dataset.rainbowSrcset) img.setAttribute('srcset', img.dataset.rainbowSrcset);
    delete img.dataset.rainbowSrc;
    delete img.dataset.rainbowSrcset;
  });
}

function setEnabled(on) {
  enabled = on;
  on ? scan(document.body) : restore();
}

if (document.body) {
  new MutationObserver(mutations => {
    for (const m of mutations) {
      if (m.type === 'childList') m.addedNodes.forEach(scan);
      else scan(m.target);
    }
  }).observe(document.body, {
    childList: true, subtree: true, characterData: true,
    attributes: true, attributeFilter: ['alt', 'src'],
  });
  chrome.storage.sync.get({ enabled: true }).then(s => setEnabled(s.enabled));
  chrome.storage.onChanged.addListener(changes => {
    if (changes.enabled) setEnabled(changes.enabled.newValue);
  });
}
