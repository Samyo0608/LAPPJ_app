const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const http = require('http');
const process = require('process');
const { exec } = require('child_process');
const fs = require('fs');

const logFilePath = path.join(app.getPath('userData'), 'log.txt');

let mainWindow;
let backendProcess;
const isDev = !app.isPackaged; // 是否為開發模式

// 啟動 Flask 後端（僅在打包模式啟動）
function startBackend() {
  if (isDev) return; // 在開發模式下不啟動 Flask

  // 🔥 確保正確取得 `app.exe` 的路徑
  const backendPath = path.join(process.resourcesPath, 'backend', 'app.exe');
  console.log(`🔍 嘗試啟動 Flask 伺服器: ${backendPath}`);

  // 🔥 確保 Flask 正確執行
  backendProcess = exec(`"${backendPath}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Flask 伺服器啟動失敗: ${error.message}`);
      return;
    }
    console.log(`✅ Flask 伺服器輸出: ${stdout}`);
  });

  backendProcess.stdout?.on('data', (data) => {
    console.log(`📌 Flask: ${data}`);
  });

  backendProcess.stderr?.on('data', (data) => {
    console.error(`⚠️ Flask 錯誤: ${data}`);
  });
}

// 等待前端啟動（僅在開發模式啟動）
async function waitForFrontend(url, timeout = 30000) {
  if (!isDev) return; // 打包模式不等待前端
  const checkInterval = 1000;
  let elapsedTime = 0;

  return new Promise((resolve, reject) => {
    const checkServer = () => {
      http.get(url, (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          setTimeout(checkServer, checkInterval);
        }
      }).on('error', () => {
        elapsedTime += checkInterval;
        if (elapsedTime >= timeout) {
          reject(new Error(`前端服務器在 ${timeout / 1000} 秒內未啟動`));
        } else {
          setTimeout(checkServer, checkInterval);
        }
      });
    };
    checkServer();
  });
}

// 確保載入正確的前端
function getFrontendPath() {
  if (isDev) {
    return 'http://localhost:3000';
  } else {
    const frontendPath = path.join(process.resourcesPath, 'frontend', 'build', 'index.html');

    console.log('🔍 React 應用程式應該在:', frontendPath);

    return `file://${frontendPath.replace(/\\/g, '/')}`; // ✅ 修正 Windows file:// 路徑
  }
}

// 創建主視窗
async function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
      webviewTag: true,
      webSecurity: false
    },
    show: false,
    icon: path.join(__dirname, process.platform === 'win32' ? 'microchip-solid.ico' : 'microchip-solid.png'),
    frame: true,
    autoHideMenuBar: true,
    fullscreenable: true,
  });

  mainWindow.setMenu(null);
  mainWindow.setTitle('LAPPJ 控制系統');
  mainWindow.maximize();

  // 添加 F12 及其他開發者工具快捷鍵
  mainWindow.webContents.on('before-input-event', (event, input) => {
    // F12 開啟開發者工具
    if (input.key === 'F12') {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
    // Ctrl+R 重新載入頁面
    if (input.control && input.key === 'r') {
      mainWindow.reload();
      event.preventDefault();
    }
    // Ctrl+Shift+R 強制重新載入頁面
    if (input.control && input.shift && input.key === 'R') {
      mainWindow.webContents.reloadIgnoringCache();
      event.preventDefault();
    }
  });

  try {
    console.log('🔄 Loading application...');
    const frontendPath = getFrontendPath();
    console.log(`📂 載入前端: ${frontendPath}`);

    if (isDev) {
      await waitForFrontend(frontendPath); // 確保 React Dev Server 啟動
    }

    await mainWindow.loadURL(frontendPath);
    mainWindow.webContents.on('did-finish-load', () => {
      mainWindow.setTitle('LAPPJ 控制系統');
    });

    mainWindow.show();
  } catch (error) {
    console.error('❌ 應用啟動失敗:', error);
    dialog.showErrorBox('啟動錯誤', `應用程式啟動失敗: ${error.message}`);
    app.quit();
  }
}

// 應用程式啟動流程
app.whenReady().then(async () => {
  process.env.LANG = 'zh-TW'; // 設置語言
  startBackend(); // 啟動 Flask (僅限打包模式)
  await createMainWindow();
}).catch((error) => {
  console.error('❌ Failed to start application:', error);
  app.quit();
});

// 確保 Flask 也關閉
app.on('window-all-closed', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC 處理
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  return result.canceled ? null : result.filePaths[0];
});
