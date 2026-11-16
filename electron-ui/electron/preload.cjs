const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('uuprotect', {
  runK2: (args) => ipcRenderer.invoke('k2:run', args),
  onScanEvent: (callback) => {
    const handler = (_event, payload) => callback(payload);
    ipcRenderer.on('k2:scan-event', handler);
    return () => ipcRenderer.removeListener('k2:scan-event', handler);
  },
  startScan: (args) => ipcRenderer.send('k2:scan', args),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (patch) => ipcRenderer.invoke('settings:save', patch),
  getHistory: () => ipcRenderer.invoke('history:get'),
  addHistory: (entry) => ipcRenderer.invoke('history:add', entry),
  clearHistory: () => ipcRenderer.invoke('history:clear'),
});
