const { app, BrowserWindow, shell, dialog } = require("electron");
const { spawn } = require("child_process");
const crypto = require("crypto"), path = require("path"), http = require("http");
const { checkExternalUrl } = require("./urlpolicy");
const ROOT = path.join(__dirname, ".."), PORT = process.env.RB_PORT || "5057", BASE = `http://127.0.0.1:${PORT}`;
const TOKEN = crypto.randomBytes(24).toString("hex");   // one-time launch token, never leaves this machine
let py = null, win = null;
const up = () => new Promise(r => http.get(BASE + "/api/health", x => { x.resume(); r(true); }).on("error", () => r(false)));
async function ensureBackend() {
  if (await up()) throw new Error(`Port ${PORT} is already in use by another process. Close it or set RB_PORT.`);
  py = spawn(process.env.PYTHON || "python", ["app.py"], { cwd: ROOT, stdio: "inherit", env: { ...process.env, LAUNCH_TOKEN: TOKEN, NO_BROWSER: "1", PORT } });
  for (let i = 0; i < 60; i++) { if (await up()) return; await new Promise(r => setTimeout(r, 500)); }
  throw new Error("Flask backend did not start. Run 'python app.py' manually to see the error.");
}
async function openExternalSafely(raw) {
  const r = await checkExternalUrl(raw);
  if (!r.ok) { dialog.showMessageBoxSync(win, { type: "warning", message: "Blocked link", detail: `${r.reason}\n\n${String(raw).slice(0, 300)}` }); return; }
  const { response } = await dialog.showMessageBox(win, { type: "question", buttons: ["Open", "Cancel"], defaultId: 1, cancelId: 1, message: "Open this link in your default browser?", detail: r.url });
  if (response === 0) shell.openExternal(r.url);      // only ever called with the validated URL
}
async function create() {
  await ensureBackend();
  win = new BrowserWindow({ width: 1440, height: 900, backgroundColor: "#071321", title: "Robot Browser AI", autoHideMenuBar: true, webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, webviewTag: false } });
  win.webContents.session.setPermissionRequestHandler((wc, perm, cb) => cb(perm === "media" && wc.getURL().startsWith(BASE)));
  win.webContents.setWindowOpenHandler(({ url }) => { if (!url.startsWith(BASE)) openExternalSafely(url); return { action: "deny" }; });
  win.webContents.on("will-navigate", (e, url) => { if (!url.startsWith(BASE)) { e.preventDefault(); openExternalSafely(url); } });
  win.loadURL(`${BASE}/?token=${TOKEN}`);
}
app.whenReady().then(create).catch(e => { dialog.showErrorBox("Robot Browser AI", String(e.message || e)); app.quit(); });
app.on("window-all-closed", () => { if (py) py.kill(); app.quit(); });
