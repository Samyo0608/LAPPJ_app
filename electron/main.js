const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const http = require('http');
const process = require('process');

let win;

// 等待前端伺服器啟動的函數
async function waitForFrontend(url, timeout = 20000) {
  const interval = 500; // 每 500 毫秒檢查一次
  let elapsedTime = 0;

  return new Promise((resolve, reject) => {
    const checkFrontend = () => {
      http.get(url, () => {
        resolve(); // 如果前端伺服器已啟動，繼續執行
      }).on('error', () => {
        elapsedTime += interval;
        if (elapsedTime >= timeout) {
          reject(new Error(`前端伺服器在 ${timeout / 1000} 秒內未啟動。`));
        } else {
          setTimeout(checkFrontend, interval);
        }
      });
    };
    checkFrontend();
  });
}

// 建立視窗的函數
async function createWindow() {
  win = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // 載入 preload 腳本
      contextIsolation: true, // 啟用上下文隔離，提升安全性
      enableRemoteModule: false, // 禁用 remote 模組
      nodeIntegration: false // 禁用 Node.js API，提升安全性
    },
    show: false, // 隱藏視窗，直到前端準備完成
  });

  try {
    // 等待前端伺服器啟動
    await waitForFrontend('http://localhost:3000');
    console.log("前端伺服器已啟動，正在載入...");
    await win.loadURL('http://localhost:3000'); // 載入前端頁面
    win.show(); // 顯示視窗
  } catch (error) {
    console.error("錯誤：", error.message);

    // 確認錯誤頁面存在
    const errorPagePath = path.join(__dirname, 'error.html');
    if (fs.existsSync(errorPagePath)) {
      await win.loadFile(errorPagePath); // 如果前端未啟動，載入錯誤頁面
    } else {
      console.error("錯誤頁面未找到：", errorPagePath);
    }
    win.show(); // 顯示錯誤頁面
  }

  // 當視窗被關閉時清理資源
  win.on('closed', function () {
    win = null;
  });
}

// 當 Electron 準備好時執行
app.whenReady().then(() => {
  console.log("Electron 已準備就緒");
  createWindow();

  // macOS 專屬邏輯：當應用程式被重新啟動時，重新建立視窗
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 當所有視窗關閉時退出應用程式
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit(); // 完全退出應用程式
  }
});

// 捕捉未捕捉的 Promise Rejection
process.on('unhandledRejection', (reason, promise) => {
  console.error('未捕捉的 Promise Rejection:', reason);
});

// IPC 處理：處理資料夾選擇的對話框
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(win, {
    properties: ['openDirectory']
  });

  if (!result.canceled) {
    return result.filePaths[0]; // 返回選擇的資料夾路徑
  }
  return null;
});
