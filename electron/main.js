const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const PORT = 9002;

let mainWindow;
let nextProcess;

function startNextServer() {
  const command = isDev ? 'dev' : 'start';
  const portFlag = isDev ? '--turbopack -p' : '-p';
  
  nextProcess = spawn('npm', ['run', command, portFlag, PORT.toString()], {
    shell: true,
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
    env: {
      ...process.env,
      PORT: PORT.toString(),
    },
  });

  nextProcess.on('close', () => {
    app.quit();
  });

  nextProcess.on('error', (err) => {
    console.error('Failed to start Next.js server:', err);
    app.quit();
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    icon: path.join(__dirname, '../src/app/favicon.png'),
    titleBarStyle: 'default',
    show: false,
    backgroundColor: '#000000',
  });

  const startUrl = `http://localhost:${PORT}`;

  // Wait a bit for server to be ready, then load
  const loadWindow = () => {
    mainWindow.loadURL(startUrl).catch((err) => {
      console.error('Failed to load URL:', err);
      // Retry after a delay
      setTimeout(loadWindow, 2000);
    });
  };

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Start loading after a short delay to ensure server is ready
  setTimeout(loadWindow, isDev ? 5000 : 3000);
}

app.whenReady().then(() => {
  // Start Next.js server first
  startNextServer();
  
  // Then create window
  setTimeout(() => {
    createWindow();
  }, isDev ? 3000 : 2000);
});

app.on('window-all-closed', () => {
  if (nextProcess) {
    nextProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  if (nextProcess) {
    nextProcess.kill();
  }
});

