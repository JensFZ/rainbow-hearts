const box = document.getElementById('on');
document.getElementById('label').textContent = chrome.i18n.getMessage('toggleLabel');
chrome.storage.sync.get({ enabled: true }).then(s => { box.checked = s.enabled; });
box.onchange = () => chrome.storage.sync.set({ enabled: box.checked });
