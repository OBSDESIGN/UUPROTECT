const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn, exec } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const K2_EXE = path.join(PROJECT_ROOT, '.venv', 'Scripts', 'k2.exe');
const DATA_DIR = path.join(app.getPath('userData'), 'uuprotect-data');
const SETTINGS_PATH = path.join(DATA_DIR, 'settings.json');
const HISTORY_PATH = path.join(DATA_DIR, 'history.json');
const TASK_NAME = 'UUPROTECT AutoScan';

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}
function defaultSettings() {
  return { firstRunCompleted: false, autoScanEnabled: false, autoScanFrequency: 'daily', autoScanTime: '02:00', autoScanTargets: ['C:\\\\'], autoScanDay: 1 };
}
function readJson(filePath, fallback) {
  try { ensureDataDir(); if (!fs.existsSync(filePath)) return fallback; return JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch { return fallback; }
}
function writeJson(filePath, data) {
  ensureDataDir(); fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8'); return true;
}
function getSettings() { return { ...defaultSettings(), ...readJson(SETTINGS_PATH, defaultSettings()) }; }
function saveSettings(patch) { const next = { ...getSettings(), ...(patch || {}) }; writeJson(SETTINGS_PATH, next); return next; }
function getHistory() { const h = readJson(HISTORY_PATH, []); return Array.isArray(h) ? h : []; }
function addHistory(entry) { const h = getHistory(); h.unshift({ id: Date.now(), date: new Date().toISOString(), ...entry }); writeJson(HISTORY_PATH, h.slice(0, 200)); return h[0]; }
function clearHistory() { writeJson(HISTORY_PATH, []); return []; }

function runCommand(cmd) {
  return new Promise((resolve) => exec(cmd, { windowsHide: true }, (err, stdout, stderr) => resolve({ ok: !err, err: err ? String(err) : '', stdout: stdout || '', stderr: stderr || '' })));
}

async function applyAutoScanSchedule(settings) {
  // remove existing first
  await runCommand(`schtasks /Delete /TN "${TASK_NAME}" /F`);
  if (!settings.autoScanEnabled) return { ok: true, scheduled: false };
  const targets = (settings.autoScanTargets && settings.autoScanTargets.length ? settings.autoScanTargets : ['C:\\\\']).map(t => `"${t}"`).join(' ');
  const tr = `"${K2_EXE}" ${targets} -r -I`;
  let cmd = `schtasks /Create /TN "${TASK_NAME}" /TR ${tr.replace(/"/g, '\\"')} /ST ${settings.autoScanTime || '02:00'} /F`;
  if (settings.autoScanFrequency === 'weekly') {
    const days = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
    const d = days[Math.max(0, Math.min(6, Number(settings.autoScanDay ?? 1)))] || 'MON';
    cmd += ` /SC WEEKLY /D ${d}`;
  } else {
    cmd += ` /SC DAILY`;
  }
  const res = await runCommand(cmd);
  return { ok: res.ok, scheduled: res.ok, details: res };
}

function runK2(args) {
  return new Promise((resolve) => {
    const child = spawn(K2_EXE, args, {
      cwd: PROJECT_ROOT,
      windowsHide: true,
      env: { ...process.env, UUPROTECT_FORCE_CLI: '1' },
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d.toString()));
    child.stderr.on('data', (d) => (stderr += d.toString()));
    child.on('close', (code) => resolve({ code, stdout, stderr }));
    child.on('error', (err) => resolve({ code: -1, stdout, stderr: stderr + String(err) }));
  });
}

function scanK2Stream(sender, args) {
  const child = spawn(K2_EXE, args, {
    cwd: PROJECT_ROOT,
    windowsHide: true,
    env: { ...process.env, UUPROTECT_FORCE_CLI: '1' },
  });
  child.stdout.on('data', (d) => sender.send('k2:scan-event', { type: 'stdout', data: d.toString() }));
  child.stderr.on('data', (d) => sender.send('k2:scan-event', { type: 'stderr', data: d.toString() }));
  child.on('close', (code) => sender.send('k2:scan-event', { type: 'close', code }));
  child.on('error', (err) => sender.send('k2:scan-event', { type: 'error', message: String(err) }));
}

function createWindow() {
  const iconPath = path.join(__dirname, '..', 'assets', 'logo-compact.png');
  const win = new BrowserWindow({
    width: 1100,
    height: 760,
    title: 'UUPROTECT',
    icon: iconPath,
    autoHideMenuBar: true,
    backgroundColor: '#FCE044',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.setMenuBarVisibility(false);
  win.once('ready-to-show', () => win.show());
  win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  app.setName('UUPROTECT');
  ensureDataDir();
  ipcMain.handle('k2:run', async (_e, args) => runK2(Array.isArray(args) ? args : []));
  ipcMain.on('k2:scan', (event, args) => scanK2Stream(event.sender, Array.isArray(args) ? args : []));
  ipcMain.handle('settings:get', async () => getSettings());
  ipcMain.handle('settings:save', async (_e, patch) => {
    const next = saveSettings(patch || {});
    let schedule = { ok: true, scheduled: false };
    try { schedule = await applyAutoScanSchedule(next); } catch (e) { schedule = { ok: false, error: String(e) }; }
    return { settings: next, schedule };
  });
  ipcMain.handle('history:get', async () => getHistory());
  ipcMain.handle('history:add', async (_e, entry) => addHistory(entry || {}));
  ipcMain.handle('history:clear', async () => clearHistory());
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
