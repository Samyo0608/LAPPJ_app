const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const http = require('http');
const process = require('process');

let win;

async function waitForFrontend(url, timeout = 15000) {
  const interval = 500; // 檢查間隔
  let elapsedTime = 0;

  return new Promise((resolve, reject) => {
    const checkFrontend = () => {
      http.get(url, () => {
        resolve(); // 等待前端啟動
      }).on('error', () => {
        elapsedTime += interval;
        if (elapsedTime >= timeout) {
          reject(new Error(`Frontend did not start within ${timeout / 1000} seconds.`));
        } else {
          setTimeout(checkFrontend, interval);
        }
      });
    };

    checkFrontend();
  });
}

async function createWindow() {
  win = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),  // 載入 preload script
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false
    },
    show: false, // 隱藏窗口直到前端準備好
  });

  try {
    // 等待前端启动
    await waitForFrontend('http://localhost:3000');
    win.loadURL('http://localhost:3000');
    win.show(); // 前端啟動後顯示窗口
  } catch (error) {
    console.error(error.message);
    win.loadFile('error.html'); // 前端未啟動時顯示錯誤頁面
    win.show();
  }

  win.on('closed', function () {
    win = null;
  });
}

app.whenReady().then(() => {
  console.log("Electron is ready");
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 關閉所有窗口時退出應用
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    process.exit(0);
  }
});

// 選擇文件夾對話框
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(win, {
    properties: ['openDirectory']
  });

  if (!result.canceled) {
    return result.filePaths[0]; // 返回選擇的文件夾路徑
  }
  return null;
});
