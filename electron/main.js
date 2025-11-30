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
  
  const serverCommand = isDev 
    ? ['run', command, '--turbopack', '-p', PORT.toString()]
    : ['run', command, '-p', PORT.toString()];
  
  nextProcess = spawn('npm', serverCommand, {
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    cwd: path.join(__dirname, '..'),
    env: {
      ...process.env,
      PORT: PORT.toString(),
      NODE_ENV: isDev ? 'development' : 'production',
    },
  });

  nextProcess.stdout.on('data', (data) => {
    console.log(`Next.js: ${data}`);
    // Check if server is ready
    if (data.toString().includes('Ready') || data.toString().includes('started server')) {
      console.log('Next.js server is ready!');
    }
  });

  nextProcess.stderr.on('data', (data) => {
    console.error(`Next.js Error: ${data}`);
  });

  nextProcess.on('close', (code) => {
    console.log(`Next.js server exited with code ${code}`);
    if (code !== 0 && code !== null) {
      app.quit();
    }
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
    icon: path.join(__dirname, '../public/favicon.ico'),
    titleBarStyle: 'default',
    show: false,
    backgroundColor: '#000000',
  });

  const startUrl = `http://localhost:${PORT}`;

  // Function to check if server is ready
  const checkServerReady = (retries = 30) => {
    const http = require('http');
    const req = http.get(`http://localhost:${PORT}`, (res) => {
      console.log('Server is ready!');
      mainWindow.loadURL(startUrl).catch((err) => {
        console.error('Failed to load URL:', err);
      });
    });
    
    req.on('error', (err) => {
      if (retries > 0) {
        console.log(`Waiting for server... (${retries} retries left)`);
        setTimeout(() => checkServerReady(retries - 1), 1000);
      } else {
        console.error('Server failed to start after 30 seconds');
        mainWindow.loadURL(startUrl).catch((err) => {
          console.error('Failed to load URL:', err);
        });
      }
    });
    
    req.setTimeout(1000, () => {
      req.destroy();
      if (retries > 0) {
        setTimeout(() => checkServerReady(retries - 1), 1000);
      }
    });
  };

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
    
    // Start checking for server after window is ready
    setTimeout(() => checkServerReady(), 2000);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Start Next.js server first
  startNextServer();
  
  // Then create window immediately (it will wait for server)
  createWindow();
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

