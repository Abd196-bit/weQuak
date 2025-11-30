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

  let serverReady = false;
  
  nextProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`Next.js: ${output}`);
    // Check if server is ready
    if (output.includes('Ready') || 
        output.includes('started server') || 
        output.includes('Local:') ||
        output.includes('compiled successfully')) {
      if (!serverReady) {
        serverReady = true;
        console.log('Next.js server is ready!');
      }
    }
  });

  nextProcess.stderr.on('data', (data) => {
    const error = data.toString();
    console.error(`Next.js Error: ${error}`);
    // Some Next.js messages go to stderr but aren't errors
    if (error.includes('Ready') || error.includes('started server')) {
      if (!serverReady) {
        serverReady = true;
        console.log('Next.js server is ready!');
      }
    }
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
  const checkServerReady = (retries = 60) => {
    const http = require('http');
    const req = http.get(`http://localhost:${PORT}`, (res) => {
      console.log(`Server responded with status: ${res.statusCode}`);
      if (res.statusCode === 200 || res.statusCode === 404) {
        console.log('Server is ready! Loading window...');
        mainWindow.loadURL(startUrl).catch((err) => {
          console.error('Failed to load URL:', err);
        });
      } else {
        // Server responded but with error, still try to load
        console.log('Server responded, attempting to load...');
        mainWindow.loadURL(startUrl).catch((err) => {
          console.error('Failed to load URL:', err);
        });
      }
    });
    
    req.on('error', (err) => {
      if (retries > 0) {
        console.log(`Waiting for server... (${retries} retries left)`);
        setTimeout(() => checkServerReady(retries - 1), 1000);
      } else {
        console.error('Server failed to start after 60 seconds');
        // Try to load anyway - might be a different error
        mainWindow.loadURL(startUrl).catch((err) => {
          console.error('Failed to load URL:', err);
          mainWindow.webContents.executeJavaScript(`
            document.body.innerHTML = '<div style="padding: 20px; text-align: center;">
              <h1>Server Error</h1>
              <p>Unable to connect to the server. Please check the console for errors.</p>
              <p>Port: ${PORT}</p>
            </div>';
          `);
        });
      }
    });
    
    req.setTimeout(2000, () => {
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

