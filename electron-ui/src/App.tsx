import { useEffect, useMemo, useRef, useState } from "react";
import type { DragEvent, ComponentType } from "react";
import { OrbitRotation } from "@/components/ui/orbit-rotation";
import { SCAN_STATUS_MESSAGES } from "@/scanStatusMessages";
import {
  FaFile, FaFileAlt, FaFileArchive, FaFileAudio, FaFileCode, FaFileExcel,
  FaFileImage, FaFilePdf, FaFilePowerpoint, FaFileVideo, FaFileWord, FaPlay
} from "react-icons/fa";
import { SiJavascript, SiPython, SiHtml5, SiCss, SiJson } from "react-icons/si";

type ScanEvent = { type: 'stdout' | 'stderr' | 'close' | 'error'; data?: string; code?: number; message?: string };
type Summary = { folders?: string; files?: string; packed?: string; infected?: string; suspect?: string; warnings?: string; identified?: string; io?: string; time?: string; raw: string };
type Settings = { firstRunCompleted: boolean; autoScanEnabled: boolean; autoScanFrequency: 'daily' | 'weekly'; autoScanTime: string; autoScanTargets: string[]; autoScanDay?: number };
type HistoryEntry = { id: number; date: string; targets: string[]; status: string; type: string; summary?: Summary | null; outputTail?: string };

declare global {
  interface Window {
    uuprotect?: {
      runK2: (args: string[]) => Promise<{ code: number; stdout: string; stderr: string }>;
      startScan: (args: string[]) => void;
      onScanEvent: (cb: (ev: ScanEvent) => void) => () => void;
      getSettings: () => Promise<Settings>;
      saveSettings: (patch: Partial<Settings>) => Promise<{ settings: Settings; schedule: any }>;
      getHistory: () => Promise<HistoryEntry[]>;
      addHistory: (entry: Partial<HistoryEntry>) => Promise<HistoryEntry>;
      clearHistory: () => Promise<HistoryEntry[]>;
    };
  }
}

type OrbitIcon = { Icon: ComponentType<{ className?: string }>; name?: string };

function iconForExt(ext: string): OrbitIcon {
  const e = String(ext || "").toLowerCase();
  if (["jpg","jpeg","png","gif","bmp","webp","svg","ico","tif","tiff"].includes(e)) return { Icon: FaFileImage, name: "Image" };
  if (["pdf"].includes(e)) return { Icon: FaFilePdf, name: "PDF" };
  if (["doc","docx","rtf","odt"].includes(e)) return { Icon: FaFileWord, name: "Document" };
  if (["xls","xlsx","csv","ods"].includes(e)) return { Icon: FaFileExcel, name: "Spreadsheet" };
  if (["ppt","pptx","odp"].includes(e)) return { Icon: FaFilePowerpoint, name: "Presentation" };
  if (["zip","rar","7z","tar","gz","bz2","xz","cab","iso"].includes(e)) return { Icon: FaFileArchive, name: "Archive" };
  if (["mp3","wav","flac","aac","ogg","m4a"].includes(e)) return { Icon: FaFileAudio, name: "Audio" };
  if (["mp4","avi","mkv","mov","wmv","webm"].includes(e)) return { Icon: FaFileVideo, name: "Video" };
  if (["js","jsx","ts","tsx"].includes(e)) return { Icon: SiJavascript, name: "JS/TS Code" };
  if (["py"].includes(e)) return { Icon: SiPython, name: "Python" };
  if (["html","htm"].includes(e)) return { Icon: SiHtml5, name: "HTML" };
  if (["css","scss"].includes(e)) return { Icon: SiCss, name: "CSS" };
  if (["json"].includes(e)) return { Icon: SiJson, name: "JSON" };
  if (["c","cpp","h","cs","java","go","rs","php","rb","sh","ps1","bat","cmd","sql","xml","yml","yaml","md"].includes(e)) return { Icon: FaFileCode, name: "Code" };
  if (["txt","log","ini","cfg","conf"].includes(e)) return { Icon: FaFileAlt, name: "Text" };
  return { Icon: FaFile, name: ext ? ext.toUpperCase() : "File" };
}

const DEFAULT_FILE_ICONS: OrbitIcon[] = [
  { Icon: FaFile, name: "File" }, { Icon: FaFileCode, name: "Code" }, { Icon: FaFileImage, name: "Image" },
  { Icon: FaFilePdf, name: "PDF" }, { Icon: FaFileArchive, name: "Archive" }, { Icon: FaFileWord, name: "Document" },
  { Icon: FaFileAlt, name: "Text" }, { Icon: FaFileAudio, name: "Audio" }, { Icon: FaFileVideo, name: "Video" },
];

function extractExts(text: string): string[] {
  const exts = new Set<string>();
  const re = /([A-Za-z]:\\[^\r\n]*?\.([A-Za-z0-9]{1,10}))\s{2,}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const ext = (m[2] || "").toLowerCase();
    if (ext && ext.length <= 10) exts.add(ext);
  }
  if (exts.size === 0) {
    const re2 = /\.([A-Za-z0-9]{1,8})(?=["'\s]|$)/g;
    while ((m = re2.exec(text)) !== null) exts.add((m[1] || "").toLowerCase());
  }
  return Array.from(exts);
}

type Preset = { id: string; label: string; paths: string[]; note?: string };
const PRESETS: Preset[] = [
  { id: "pc", label: "Full PC scan", paths: ["C:\\"], note: "Full PC scan (including ZIP files and archives). This may take a long time." },
  { id: "user", label: "User folder", paths: ["C:\\Users"], note: "Scan the Users folder (including archives)." },
  { id: "downloads", label: "Downloads", paths: ["C:\\Users"], note: "Scan common user locations (including archives)." },
  { id: "desktop", label: "Desktop", paths: ["C:\\Users"], note: "Scan common user locations (including archives)." },
];

function parseSummary(text: string): Summary | null {
  if (!/Results:/i.test(text)) return null;
  const get = (label: string) => text.match(new RegExp(label + "\\s*:\\s*([^\\r\\n]+)", "i"))?.[1]?.trim();
  return {
    folders: get("Folders"), files: get("Files"), packed: get("Packed"),
    infected: get("Infected files"), suspect: get("Suspect files"), warnings: get("Warnings"),
    identified: get("Identified viruses"), io: get("I\\/O errors") || get("I/O errors"), time: get("Scan time"),
    raw: text,
  };
}

function Indicator({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "good" | "bad" | "warn" }) {
  const toneCls = tone === "good" ? "border-[#20BBA3]/40 bg-[#20BBA3]/10 text-[#20BBA3]"
    : tone === "bad" ? "border-red-500/40 bg-red-500/10 text-red-300"
    : tone === "warn" ? "border-[#FCE044]/40 bg-[#FCE044]/10 text-[#FCE044]"
    : "border-border bg-zinc-950/70 text-zinc-200";
  return (
    <div className={`rounded-lg border px-3 py-2 ${toneCls}`}>
      <div className="text-[11px] uppercase tracking-wide opacity-80">{label}</div>
      <div className="text-lg font-semibold leading-tight">{value}</div>
    </div>
  );
}

const defaultSettings: Settings = { firstRunCompleted: false, autoScanEnabled: false, autoScanFrequency: 'daily', autoScanTime: '02:00', autoScanTargets: ['C:\\'], autoScanDay: 1 };

export default function App() {
  const [view, setView] = useState<'scan'|'history'|'settings'>('scan');
  const [scanPaths, setScanPaths] = useState<string[]>(["C:\\Users\\39388\\Desktop"]);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [output, setOutput] = useState("Welcome to UUPROTECT.\nChoose a preset scan or drag files/folders onto the center circle, then press Start.");
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState(SCAN_STATUS_MESSAGES[0]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [fileIcons, setFileIcons] = useState<OrbitIcon[]>(DEFAULT_FILE_ICONS);
  const [showFixModal, setShowFixModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [savingSettings, setSavingSettings] = useState(false);
  const outputRef = useRef("");
  const msgIndexRef = useRef(0);
  const foundExtsRef = useRef<Set<string>>(new Set());

  const targets = useMemo(() => (scanPaths.length ? scanPaths : ["C:\\Users"]).filter(Boolean), [scanPaths]);

  useEffect(() => { (async () => {
    try {
      const s = await window.uuprotect?.getSettings();
      if (s) { setSettings(s); setShowOnboarding(!s.firstRunCompleted); }
      const h = await window.uuprotect?.getHistory();
      if (Array.isArray(h)) setHistory(h);
    } catch {}
  })(); }, []);

  useEffect(() => {
    if (!running) return;
    const msgTimer = setInterval(() => { msgIndexRef.current = (msgIndexRef.current + 1) % SCAN_STATUS_MESSAGES.length; setStatusText(SCAN_STATUS_MESSAGES[msgIndexRef.current]); }, 700);
    const progTimer = setInterval(() => { setProgress((p) => (p < 96 ? p + Math.max(0.2, (96 - p) * 0.03) : p)); }, 300);
    return () => { clearInterval(msgTimer); clearInterval(progTimer); };
  }, [running]);

  function updateIconsFromText(text: string) {
    const exts = extractExts(text);
    if (!exts.length) return;
    let changed = false;
    exts.forEach((e) => { if (!foundExtsRef.current.has(e)) { foundExtsRef.current.add(e); changed = true; } });
    if (changed) { const icons = Array.from(foundExtsRef.current).slice(0, 15).map(iconForExt); if (icons.length) setFileIcons(icons); }
  }
  function setIconsFromPaths(paths: string[]) {
    const s = new Set<string>();
    paths.forEach((p) => { const m = p.match(/\.([A-Za-z0-9]{1,10})$/); if (m) s.add(m[1].toLowerCase()); });
    if (s.size) { foundExtsRef.current = s; setFileIcons(Array.from(s).slice(0, 15).map(iconForExt)); }
  }

  async function persistHistory(entry: Partial<HistoryEntry>) {
    try { const saved = await window.uuprotect?.addHistory(entry); if (saved) setHistory((h) => [saved as HistoryEntry, ...h].slice(0,200)); } catch {}
  }

  function runScanWithArgs(paths: string[], extraArgs: string[], intro: string, type: string) {
    const finalPaths = paths.filter(Boolean);
    if (!finalPaths.length) return;
    setIconsFromPaths(finalPaths);
    const finish = async (finalText: string, code: number) => {
      updateIconsFromText(finalText);
      const parsed = parseSummary(finalText);
      if (parsed) setSummary(parsed);
      const st = code === 0 ? "Completed" : `Finished (exit ${code})`;
      setStatus(st);
      await persistHistory({ targets: finalPaths, status: st, type, summary: parsed || null, outputTail: finalText.slice(-2000) });
    };
    if (!window.uuprotect?.startScan || !window.uuprotect?.onScanEvent) {
      void (async () => {
        if (!window.uuprotect?.runK2) return;
        setRunning(true); setProgress(10); setStatus("Operation in progress..."); setSummary(null);
        setOutput(`${intro}\nTarget:\n${finalPaths.map((p)=>`- ${p}`).join("\n")}\n\n`);
        const res = await window.uuprotect.runK2([...finalPaths, ...extraArgs]);
        const text = (res.stdout || "") + (res.stderr ? "\n[stderr]\n" + res.stderr : "");
        setOutput(text + `\n\n[exit ${res.code}]`); setProgress(100); setRunning(false);
        await finish(text, res.code);
      })();
      return;
    }
    setRunning(true); setProgress(2); setSummary(null); msgIndexRef.current = 0; setStatusText(SCAN_STATUS_MESSAGES[0]); setStatus("Operation in progress...");
    outputRef.current = `${intro}\nTarget:\n${finalPaths.map((p) => `- ${p}`).join("\n")}\n\n`; setOutput(outputRef.current);
    const off = window.uuprotect.onScanEvent((ev) => {
      if (ev.type === 'stdout' || ev.type === 'stderr') {
        const chunk = ev.data || '';
        outputRef.current += (ev.type === 'stderr' ? `\n[stderr] ${chunk}` : chunk);
        if (outputRef.current.length > 200000) outputRef.current = outputRef.current.slice(-200000);
        setOutput(outputRef.current); updateIconsFromText(chunk);
        const maybe = parseSummary(outputRef.current); if (maybe) setSummary(maybe);
      } else if (ev.type === 'error') {
        outputRef.current += `\n[errore] ${ev.message || 'errore sconosciuto'}\n`; setOutput(outputRef.current);
      } else if (ev.type === 'close') {
        setProgress(100); setRunning(false); off(); void finish(outputRef.current, ev.code ?? -1);
      }
    });
    window.uuprotect.startScan([...finalPaths, ...extraArgs]);
  }

  function runScan(paths: string[]) { runScanWithArgs(paths, ["-r", "-I"], "Starting full scan (including ZIP and other archives)...", "scan"); }
  function startScan() { runScan(targets); }
  function confirmFix() { setShowFixModal(false); runScanWithArgs(targets, ["-r", "-d", "-I"], "Starting issue remediation procedure (disinfection, including archives)...", "fix"); }

  function applyPreset(preset: Preset) {
    setScanPaths(preset.paths); setStatus(`Preset: ${preset.label}`);
    if (preset.note) setOutput(`${preset.label}\n${preset.note}\n\nPress the center button to start.`);
  }
  function onDragOver(e: DragEvent<HTMLDivElement>) { e.preventDefault(); e.stopPropagation(); setDragOver(true); }
  function onDragLeave(e: DragEvent<HTMLDivElement>) { e.preventDefault(); e.stopPropagation(); setDragOver(false); }
  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault(); e.stopPropagation(); setDragOver(false);
    const files = Array.from(e.dataTransfer.files || []);
    const paths = files.map((f: any) => f.path).filter((p: string) => !!p);
    if (paths.length) {
      setScanPaths(paths); setIconsFromPaths(paths); setStatus(`${paths.length} item(s) imported`);
      setOutput(`Items ready for scanning:\n${paths.map((p) => `- ${p}`).join("\n")}\n\nPress the center button to start.`);
    }
  }

  async function saveAppSettings(patch: Partial<Settings>, closeOnboarding = false) {
    setSavingSettings(true);
    try {
      const res = await window.uuprotect?.saveSettings(patch);
      if (res?.settings) setSettings(res.settings);
      if (closeOnboarding) setShowOnboarding(false);
    } finally { setSavingSettings(false); }
  }

  const infectedTone = summary?.infected && summary.infected !== "0" ? "bad" : "good";
  const suspectTone = summary?.suspect && summary.suspect !== "0" ? "warn" : "good";
  const warningTone = summary?.warnings && summary.warnings !== "0" ? "warn" : "good";
  const hasProblems = Boolean(summary && ((summary.infected && summary.infected !== "0") || (summary.suspect && summary.suspect !== "0") || (summary.warnings && summary.warnings !== "0") || (summary.identified && summary.identified !== "0")));

  const Onboarding = () => {
    const [local, setLocal] = useState<Settings>({ ...settings, firstRunCompleted: true, autoScanTargets: settings.autoScanTargets?.length ? settings.autoScanTargets : ['C:\\Users'] });
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
        <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-2xl">
          <h2 className="text-xl font-semibold">UUPROTECT Initial Setup</h2>
          <p className="mt-1 text-sm text-zinc-600">First run: configure the system and automatic scans for the full PC (including ZIP files and archives).</p>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 p-3">
              <div className="font-medium">Automatic scans</div>
              <label className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={local.autoScanEnabled} onChange={(e)=>setLocal({...local, autoScanEnabled:e.target.checked})} /> Enable automatic scans</label>
              <div className="mt-2 text-sm">Frequency
                <select className="mt-1 w-full rounded border border-zinc-300 p-2" value={local.autoScanFrequency} onChange={(e)=>setLocal({...local, autoScanFrequency:e.target.value as any})}>
                  <option value="daily">Daily</option><option value="weekly">Weekly</option>
                </select>
              </div>
              <div className="mt-2 text-sm">Time
                <input type="time" className="mt-1 w-full rounded border border-zinc-300 p-2" value={local.autoScanTime} onChange={(e)=>setLocal({...local, autoScanTime:e.target.value})} />
              </div>
              {local.autoScanFrequency === 'weekly' && (
                <div className="mt-2 text-sm">Day
                  <select className="mt-1 w-full rounded border border-zinc-300 p-2" value={local.autoScanDay ?? 1} onChange={(e)=>setLocal({...local, autoScanDay:Number(e.target.value)})}>
                    <option value={1}>Lunedì</option><option value={2}>Martedì</option><option value={3}>Mercoledì</option><option value={4}>Giovedì</option><option value={5}>Venerdì</option><option value={6}>Saturday</option><option value={0}>Sunday</option>
                  </select>
                </div>
              )}
            </div>
            <div className="rounded-xl border border-zinc-200 p-3">
              <div className="font-medium">Automatic scan targets</div>
              <p className="mt-1 text-xs text-zinc-500">One path per line</p>
              <textarea className="mt-2 h-36 w-full rounded border border-zinc-300 p-2 text-sm" value={local.autoScanTargets.join("\n")} onChange={(e)=>setLocal({...local, autoScanTargets:e.target.value.split(/\n|;/).map(s=>s.trim()).filter(Boolean)})} />
              <div className="mt-2 text-xs text-zinc-500">If enabled, a Windows scheduled task will be created/updated to run UUPROTECT in the background for full PC scans, including ZIP files and archives.</div>
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button className="rounded-lg border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100" onClick={()=>saveAppSettings({ firstRunCompleted: true }, true)}>Skip for now</button>
            <button disabled={savingSettings} className="rounded-lg bg-[#20BBA3] px-4 py-2 text-sm font-medium text-black hover:bg-[#1aa892] disabled:opacity-60" onClick={()=>saveAppSettings(local, true)}>Save setup</button>
          </div>
        </div>
      </div>
    );
  };

  const SettingsView = () => {
    const [local, setLocal] = useState<Settings>(settings);
    useEffect(()=>setLocal(settings), [settings]);
    return (
      <div className="h-full overflow-hidden flex flex-col">
        <h2 className="text-lg font-semibold">Settings</h2>
        <p className="text-sm text-zinc-600">System configuration and automatic scans.</p>
        <div className="mt-3 space-y-3 overflow-hidden">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={local.autoScanEnabled} onChange={(e)=>setLocal({...local, autoScanEnabled:e.target.checked})} /> Enable automatic scans in background</label>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-sm">Frequency<select className="mt-1 w-full rounded border border-zinc-300 p-2" value={local.autoScanFrequency} onChange={(e)=>setLocal({...local, autoScanFrequency:e.target.value as any})}><option value="daily">Daily</option><option value="weekly">Weekly</option></select></div>
            <div className="text-sm">Time<input type="time" className="mt-1 w-full rounded border border-zinc-300 p-2" value={local.autoScanTime} onChange={(e)=>setLocal({...local, autoScanTime:e.target.value})} /></div>
          </div>
          {local.autoScanFrequency === 'weekly' && (<div className="text-sm">Day<select className="mt-1 w-full rounded border border-zinc-300 p-2" value={local.autoScanDay ?? 1} onChange={(e)=>setLocal({...local, autoScanDay:Number(e.target.value)})}><option value={1}>Lunedì</option><option value={2}>Martedì</option><option value={3}>Mercoledì</option><option value={4}>Giovedì</option><option value={5}>Venerdì</option><option value={6}>Saturday</option><option value={0}>Sunday</option></select></div>)}
          <div className="text-sm">Automatic targets (one per line)<textarea className="mt-1 h-28 w-full rounded border border-zinc-300 p-2" value={(local.autoScanTargets||[]).join("\n")} onChange={(e)=>setLocal({...local, autoScanTargets:e.target.value.split(/\n|;/).map(s=>s.trim()).filter(Boolean)})} /></div>
          <button disabled={savingSettings} className="rounded-lg bg-[#20BBA3] px-4 py-2 text-sm font-medium text-black hover:bg-[#1aa892] disabled:opacity-60" onClick={()=>saveAppSettings(local)}>Save settings</button>
        </div>
      </div>
    );
  };

  const HistoryView = () => (
    <div className="h-full overflow-hidden flex flex-col">
      <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Scan history</h2><button className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100" onClick={async()=>{ const h=await window.uuprotect?.clearHistory(); setHistory(h||[]); }}>Clear</button></div>
      <div className="mt-2 flex-1 overflow-hidden">
        {history.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-3 text-xs text-zinc-500">No scans in history yet.</div>
        ) : (
          <div className="h-full overflow-hidden space-y-2 pr-1">
            {history.slice(0,12).map((h) => (
              <div key={h.id} className="rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-xs">
                <div className="flex justify-between gap-2"><span className="font-medium text-zinc-800">{h.type === 'fix' ? 'Remediation' : 'Scan'}</span><span className="text-zinc-500">{new Date(h.date).toLocaleString()}</span></div>
                <div className="text-zinc-600 truncate" title={(h.targets||[]).join('; ')}>Target: {(h.targets||[]).join('; ')}</div>
                <div className="text-zinc-700">Status: {h.status}</div>
                {h.summary && <div className="mt-1 grid grid-cols-3 gap-1">
                  <div className="rounded bg-white border border-zinc-200 px-1.5 py-1">Files: {h.summary.files ?? '-'}</div>
                  <div className="rounded bg-white border border-zinc-200 px-1.5 py-1">Infected: {h.summary.infected ?? '-'}</div>
                  <div className="rounded bg-white border border-zinc-200 px-1.5 py-1">Time: {h.summary.time ?? '-'}</div>
                </div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FCE044] text-zinc-900 p-6">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-[1fr_460px]">
        <div className={`relative flex h-[720px] w-full items-center justify-center overflow-hidden rounded-2xl border bg-[#FCE044] transition ${dragOver ? "border-[#20BBA3] ring-2 ring-[#20BBA3]/30" : "border-black/20"}`}
          onDragOver={onDragOver} onDragEnter={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
          <div className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-700 shadow-sm">Drag files or folders onto the circle to import them</div>
          <div className="relative flex h-[560px] w-[560px] items-center justify-center">
            <OrbitRotation icons={fileIcons} orbitCount={fileIcons.length > 10 ? 3 : 2} orbitGap={7} size="md" onCenterClick={startScan} centerDisabled={running} centerIcon={{ Icon: FaPlay, name: "Start" }} centerContent={<span className="flex h-full w-full items-center justify-center rounded-full bg-[#FCE044]/95 text-black"><FaPlay className="h-8 w-8 translate-x-[2px]" /></span>} className={running ? "opacity-90" : ""} />
          </div>
          <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between gap-3 text-xs text-zinc-600"><span className="font-medium text-zinc-800">{running ? "Progress status" : "Ready"}</span><span className="text-zinc-800">{Math.round(progress)}%</span></div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200"><div className="h-full rounded-full bg-[#20BBA3] transition-all duration-300" style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} /></div>
            <div className="mt-2 min-h-[20px] text-xs text-[#20BBA3] truncate" title={statusText}>{running ? statusText : "System idle. Select a target and start the scan."}</div>
          </div>
          {dragOver && (<div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#20BBA3]/10 text-[#20BBA3] font-medium">Drop to import and prepare the scan</div>)}
        </div>

        <div className="flex h-[720px] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 text-zinc-900">
          <img src="./logo-full.png" alt="UUPROTECT" className="h-8 w-auto max-w-[220px] object-contain" />
          <div className="mt-2 flex gap-2">
            {(['scan','history','settings'] as const).map((v) => (
              <button key={v} onClick={()=>setView(v)} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${view===v ? 'bg-[#20BBA3] text-black' : 'border border-zinc-300 text-zinc-700 hover:bg-zinc-100'}`}>{v==='scan'?'Scan':v==='history'?'History':'Settings'}</button>
            ))}
          </div>

          {view === 'scan' && (
            <div className="mt-3 min-h-0 flex-1 overflow-hidden flex flex-col">
              <p className="text-sm text-zinc-600">Preset scans and drag &amp; drop onto the circle.</p>
              <div className="mt-2"><div className="mb-2 text-sm font-medium text-zinc-700">Preset scans</div><div className="grid grid-cols-2 gap-2">{PRESETS.map((p) => (<button key={p.id} onClick={() => applyPreset(p)} disabled={running} className="rounded-lg border border-[#20BBA3] bg-[#20BBA3] px-2 py-2 text-left text-xs font-medium text-black hover:bg-[#1aa892] disabled:opacity-60">{p.label}</button>))}</div></div>
              <div className="mt-2 text-sm text-zinc-600">Status: <span className="font-medium text-zinc-900">{status}</span></div>
              <div className="mt-3 min-h-0 flex-1 overflow-hidden flex flex-col">
                <div className="mb-2 text-sm font-medium text-zinc-800">Summary indicators</div>
                {summary ? (<div className="grid grid-cols-3 gap-2"><Indicator label="Folders" value={summary.folders ?? "-"} /><Indicator label="Files" value={summary.files ?? "-"} /><Indicator label="Packed" value={summary.packed ?? "-"} /><Indicator label="Infected" value={summary.infected ?? "-"} tone={infectedTone as any} /><Indicator label="Suspect" value={summary.suspect ?? "-"} tone={suspectTone as any} /><Indicator label="Warnings" value={summary.warnings ?? "-"} tone={warningTone as any} /><Indicator label="Virus ID" value={summary.identified ?? "-"} tone={(summary.identified && summary.identified !== "0") ? "bad" : "good"} /><Indicator label="I/O Errors" value={summary.io ?? "-"} tone={(summary.io && summary.io !== "0") ? "warn" : "good"} /><Indicator label="Time" value={summary.time ?? "-"} /></div>) : (<div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-3 text-xs text-zinc-500">No summary available yet. Start a scan to see indicators.</div>)}
                <div className="mt-3 mb-1 text-sm font-medium text-zinc-800">Output details</div>
                <pre className="min-h-0 flex-1 overflow-hidden border border-[#808080] bg-black p-2 text-[11px] leading-snug text-[#c0c0c0] whitespace-pre-wrap break-words font-[Consolas,'Lucida_Console','Courier_New',monospace]">{output}</pre>
                <button onClick={() => setShowFixModal(true)} disabled={running || !targets.length} className="mt-3 w-full rounded-lg bg-[#20BBA3] px-3 py-2 text-sm font-medium text-black transition hover:bg-[#1aa892] disabled:opacity-50 disabled:cursor-not-allowed" title="Resolve detected issues">Resolve detected issues</button>
              </div>
            </div>
          )}
          {view === 'history' && <div className="mt-3 min-h-0 flex-1 overflow-hidden"><HistoryView /></div>}
          {view === 'settings' && <div className="mt-3 min-h-0 flex-1 overflow-hidden"><SettingsView /></div>}
        </div>
      </div>

      {showFixModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-zinc-950 p-5 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">Confirm issue remediation</h3>
            <p className="mt-2 text-sm text-zinc-300">The system will attempt to resolve detected issues by running a new analysis with the disinfection option (<code>-d</code>) on the selected targets:</p>
            <ul className="mt-2 list-disc pl-5 text-sm text-zinc-400 space-y-1">
              <li>UUPROTECT will run on: <span className="text-zinc-200 break-all">{targets.join("; ")}</span></li>
              <li>detected infected files may be <span className="text-zinc-200">disinfected</span> when supported by the engine/signatures</li>
              <li>the scan will show new output and a summary with the operation results</li>
              {!hasProblems && <li className="text-amber-300">No issues are currently shown in the summary; the operation will still run a scan with a disinfection attempt.</li>}
            </ul>
            <p className="mt-3 text-sm text-zinc-300">Do you want to proceed?</p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowFixModal(false)} className="rounded-lg border border-border px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800">Cancel</button>
              <button onClick={confirmFix} className="rounded-lg bg-[#20BBA3] px-4 py-2 text-sm font-medium text-black hover:bg-[#1aa892]">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {showOnboarding && <Onboarding />}
    </div>
  );
}
