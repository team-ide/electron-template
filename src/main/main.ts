/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain, Menu, Tray, screen } from 'electron';
import { resolveHtmlPath } from './util';
const child_process = require('child_process');

let mainWindow: BrowserWindow | null = null;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

// if (isDebug) {
// require('electron-debug')();
// }

// const installExtensions = async () => {
//   const installer = require('electron-devtools-installer');
//   const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
//   const extensions = ['REACT_DEVELOPER_TOOLS'];

//   return installer
//     .default(
//       extensions.map((name) => installer[name]),
//       forceDownload
//     )
//     .catch(console.log);
// };

const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'assets')
  : path.join(__dirname, '../../assets');

const getAssetPath = (...paths: string[]): string => {
  return path.join(RESOURCES_PATH, ...paths);
};


const ROOT_PATH = app.isPackaged
  ? path.join(process.resourcesPath, '')
  : path.join(__dirname, '../../');


export const getRootPath = (...paths: string[]): string => {
  return path.join(ROOT_PATH, ...paths);
};

export const iconPath = getAssetPath('icon.png');
export const icon16Path = getAssetPath('icon-16.png');
export const icon32Path = getAssetPath('icon-32.png');
export const icon64Path = getAssetPath('icon-64.png');

let serverUrl = resolveHtmlPath('index.html')

const createWindow = async () => {
  // if (isDebug) {
  //   await installExtensions();
  // }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  //获取到屏幕的宽度和高度
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;


  let windowWidth = 1440;
  let windowHeight = 900;
  if (windowWidth > width) {
    windowWidth = (width - 40);
  }
  if (windowHeight > height) {
    windowHeight = (height - 40);
  }


  mainWindow = new BrowserWindow({
    show: false,
    width: windowWidth,
    height: windowHeight,
    icon: iconPath,
    autoHideMenuBar: true,
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(serverUrl);

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  Menu.setApplicationMenu(null);
  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);

let tray: Tray | null = null;
app.on('ready', async () => {
  if (process.platform === 'darwin') {
    tray = new Tray(icon16Path)
  } else {
    tray = new Tray(icon64Path)
  }
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '退出',
      click: function () {
        destroyAll()
      }
    }
  ])
  tray.setToolTip('Team · IDE')
  if (process.platform === `darwin`) {
    //显示程序页面
    tray.on('mouse-up', () => {
      if (isAllWindowHide) {
        allWindowShow();
      } else {
        allWindowHide();
      }
    })
  } else {
    //显示程序页面
    tray.on('click', () => {
      if (isAllWindowHide) {
        allWindowShow();
      } else {
        allWindowHide();
      }
    })
  }
  tray.setContextMenu(contextMenu)
})

let serverProcess: any = null;
let viewWindowList: BrowserWindow[] = [];
let isAllWindowHide = false;
let allWindowShow = async () => {
  isAllWindowHide = false;
  if (mainWindow != null && !mainWindow.isDestroyed()) {
    mainWindow.show();
  }
  viewWindowList.forEach((one: BrowserWindow) => {
    if (!one.isDestroyed()) {
      one.show();
    }
  })
};
let allWindowHide = () => {
  isAllWindowHide = true;
  if (mainWindow != null && !mainWindow.isDestroyed()) {
    mainWindow.hide();
  }
  viewWindowList.forEach((one: BrowserWindow) => {
    if (!one.isDestroyed()) {
      one.hide();
    }
  })

};
let allWindowDestroy = () => {
  if (mainWindow != null && !mainWindow.isDestroyed()) {
    mainWindow.destroy();
    mainWindow = null;
  }
  viewWindowList.forEach((one: BrowserWindow) => {
    if (!one.isDestroyed()) {
      one.destroy();
    }
  })
  viewWindowList.splice(0, viewWindowList.length)
};
let isStopped = false
let destroyAll = () => {
  isStopped = true
  try {
    allWindowDestroy()
  } catch (error) {

  }
  try {
    if (serverProcess != null) {
      serverProcess.kill();
    }
  } catch (error) {

  }
  try {
    if (tray != null) {
      tray.destroy()
    }
  } catch (error) {

  }
  try {
    if (app != null) {
      app.quit()
    }
  } catch (error) {

  }
}
