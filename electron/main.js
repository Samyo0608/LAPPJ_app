const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),  // 設置預加載腳本
      contextIsolation: true,  // 確保 Context Isolation，安全性較高
      enableRemoteModule: false,  // 禁止 remote 模組，提高安全性
      nodeIntegration: false  // 禁止直接使用 Node.js API，防止安全風險
    },
  });

  // 在開發階段加載 React 的開發伺服器
  win.loadURL('http://localhost:3000');

  // 窗口關閉時清理引用
  win.on('closed', function () {
    win = null;
  });
}

app.whenReady().then(() => {
  console.log("Electron is ready");
  createWindow();

  // 在 macOS 上，當應用程式被點擊且沒有窗口時重新創建窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 在所有窗口都被關閉時退出應用
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC 事件：處理資料夾選擇請求
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(win, {
    properties: ['openDirectory']
  });

  if (!result.canceled) {
    return result.filePaths[0];  // 返回所選資料夾的絕對路徑
  }
  return null;
});
