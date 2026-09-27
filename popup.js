const box = document.getElementById('on');
chrome.storage.sync.get({ enabled: true }).then(s => { box.checked = s.enabled; });
box.onchange = () => chrome.storage.sync.set({ enabled: box.checked });
