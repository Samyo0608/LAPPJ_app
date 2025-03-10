const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const http = require('http');
const process = require('process');
const { exec } = require('child_process');
const fs = require('fs');

let mainWindow;
let backendProcess;
let loadingWindow;
const isDev = !app.isPackaged; // 是否為開發模式

function checkBackendReady(maxRetries = 60, interval = 1000) {
  return new Promise((resolve, reject) => {
    let retries = 0;

    const checkServer = () => {
      http.get('http://localhost:5555/health', (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          handleRetry();
        }
      }).on('error', () => {
        handleRetry();
      });
    };

    const handleRetry = () => {
      retries++;
      if (retries >= maxRetries) {
        reject(new Error('後端服務未能在指定時間內啟動'));
      } else {
        setTimeout(checkServer, interval);
      }
    };

    checkServer();
  });
}

function createLoadingWindow() {
  loadingWindow = new BrowserWindow({
    width: 400,
    height: 200,
    backgroundColor: '#f0f0f0',
    transparent: false,
    frame: false,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  loadingWindow.loadFile(path.join(__dirname, 'loading.html'));
  loadingWindow.center();
}

// 啟動 Flask 後端（僅在打包模式啟動）
function startBackend() {
  if (isDev) return;

  // 確保正確取得 `app.exe` 的路徑
  const backendPath = path.join(process.resourcesPath, 'backend', 'app.exe');
  console.log(`🔍 嘗試啟動 Flask 伺服器: ${backendPath}`);

  // 確保 Flask 正確執行
  backendProcess = exec(`"${backendPath}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Flask 伺服器啟動失敗: ${error.message}`);
      return;
    }
    console.log(`Flask 伺服器輸出: ${stdout}`);
  });

  backendProcess.stdout?.on('data', (data) => {
    console.log(`Flask: ${data}`);
  });

  backendProcess.stderr?.on('data', (data) => {
    console.error(`Flask 錯誤: ${data}`);
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

    console.log('React 應用程式應該在:', frontendPath);

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

  mainWindow.on('close', (e) => {
    e.preventDefault(); // 先阻止默認關閉
    
    const choice = dialog.showMessageBoxSync(mainWindow, {
      type: 'question',
      buttons: ['確認', '取消'],
      title: '確認',
      message: '請確認是否都將設備取消連線，再按確認離開',
      defaultId: 1, // 默認選擇「否」按鈕
      cancelId: 1   // 按 ESC 等同於點擊「否」
    });
    
    if (choice === 0) { // 用戶選擇「是」
      mainWindow.removeAllListeners('close'); // 移除所有 close 事件監聽器，避免再次觸發
      mainWindow.close(); // 關閉視窗
    }
  });

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
    console.log('Loading application...');

    if (!isDev) {
      createLoadingWindow();
      
      try {
        await checkBackendReady();
        loadingWindow.close(); // 關閉等待視窗
      } catch (error) {
        dialog.showErrorBox('啟動錯誤', `後端服務未能啟動: ${error.message}`);
        app.quit();
        return;
      }
    }

    const frontendPath = getFrontendPath();
    console.log(`載入前端: ${frontendPath}`);

    if (isDev) {
      await waitForFrontend(frontendPath);
    }

    await mainWindow.loadURL(frontendPath);
    mainWindow.webContents.on('did-finish-load', () => {
      mainWindow.setTitle('LAPPJ 控制系統');
    });

    mainWindow.show();
  } catch (error) {
    console.error('應用啟動失敗:', error);
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
  // 關閉 Flask 後端
  const killBackendProcess = () => {
    try {
      // 1. 首先嘗試通過 API 正常關閉
      const http = require('http');
      const options = {
        hostname: 'localhost',
        port: 5555,
        path: '/shutdown',
        method: 'POST',
        timeout: 2000  // 設置超時，避免卡住
      };

      console.log('🔍 嘗試通過 API 關閉 Flask...');
      const req = http.request(options);
      
      req.on('response', (res) => {
        console.log(`Flask 關閉請求狀態碼: ${res.statusCode}`);
      });

      req.on('error', () => {
        console.log('API 關閉失敗，嘗試其他方法...');
      });

      req.on('timeout', () => {
        console.log('API 關閉請求超時');
        req.destroy();
      });

      req.end();

      // 2. 無論 API 是否成功，都嘗試通過 PID 文件強制關閉
      setTimeout(() => {
        try {
          const fs = require('fs');
          const path = require('path');
          const os = require('os');
          
          // 尋找 PID 文件
          const pidFilePath = path.join(os.tmpdir(), 'lappj_flask_pid.txt');
          
          if (fs.existsSync(pidFilePath)) {
            const pid = fs.readFileSync(pidFilePath, 'utf8').trim();
            console.log(`從文件獲取到 Flask PID: ${pid}`);
            
            if (pid && !isNaN(pid)) {
              console.log(`🔥 嘗試強制終止 PID: ${pid}`);
              if (process.platform === 'win32') {
                exec(`taskkill /pid ${pid} /T /F`, (error) => {
                  if (error) {
                    console.error(`無法通過 PID 終止 Flask: ${error.message}`);
                  } else {
                    console.log('已通過 PID 終止 Flask');
                    // 嘗試刪除 PID 文件
                    try { fs.unlinkSync(pidFilePath); } catch (e) {}
                  }
                });
              } else {
                exec(`kill -9 ${pid}`);
              }
            }
          } else {
            console.log('找不到 PID 文件');
          }
        } catch (error) {
          console.error(`讀取 PID 文件時出錯: ${error.message}`);
        }
      }, 1000);

      // 3. 最後嘗試通過進程 ID 關閉 (如果 backendProcess 存在)
      if (backendProcess && backendProcess.pid) {
        setTimeout(() => {
          console.log(`最後嘗試通過進程 ID 終止: ${backendProcess.pid}`);
          if (process.platform === 'win32') {
            exec(`taskkill /pid ${backendProcess.pid} /T /F`);
          } else {
            backendProcess.kill('SIGKILL');
          }
        }, 1500);
      }

      // 4. 最後絕招：終止所有 app.exe 進程
      setTimeout(() => {
        if (process.platform === 'win32') {
          console.log('最後手段：終止所有 app.exe 進程');
          exec('taskkill /F /IM app.exe /T', (error) => {
            if (error) {
              console.error(`無法終止所有 app.exe: ${error.message}`);
            } else {
              console.log('✅ 已終止所有 app.exe 進程');
            }
          });
        }
      }, 2000);
    } catch (error) {
      console.error(`關閉 Flask 時出現錯誤: ${error.message}`);
    }
  };

  // 執行關閉程序
  killBackendProcess();
  
  if (process.platform !== 'darwin') {
    // 給終止程序一些時間，然後再退出
    setTimeout(() => {
      app.quit();
    }, 2500);
  }
});

// IPC 處理
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  return result.canceled ? null : result.filePaths[0];
});
