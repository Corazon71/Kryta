const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let apiProcess;

// Detect if we are in Dev Mode or Production
const isDev = !app.isPackaged; 

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    backgroundColor: '#09090b',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    // Hide default menu bar
    autoHideMenuBar: true,
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // Open DevTools in dev mode
    // mainWindow.webContents.openDevTools();
  } else {
    // UPDATED LINE: In production, main.js sits next to the 'dist' folder
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

function startBackend() {
  let script, args, cwd;

  if (isDev) {
    console.log("Starting Backend (Dev)...");
    script = 'uvicorn';
    args = ['app.main:app', '--port', '8000'];
    cwd = path.join(__dirname, '../backend');
  } else {
    console.log("Starting Backend (Prod)...");
    // Path to the bundled Python EXE
    // Electron Builder puts 'extraResources' next to the executable
    script = path.join(process.resourcesPath, 'api', 'api.exe');
    args = [];
    cwd = path.join(process.resourcesPath, 'api');
  }

  apiProcess = spawn(script, args, {
    cwd,
    shell: isDev, // Shell needed for dev (uvicorn command), not for exe
  });

  apiProcess.stdout.on('data', (data) => console.log(`Backend: ${data}`));
  apiProcess.stderr.on('data', (data) => console.error(`Backend Error: ${data}`));
}

app.on('ready', () => {
  startBackend();
  setTimeout(createWindow, 2000);
});

app.on('window-all-closed', () => {
  if (apiProcess) apiProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});