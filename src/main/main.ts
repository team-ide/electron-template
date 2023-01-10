/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import { app, Menu, Tray, MenuItem } from 'electron';
import config from './config';
import { options } from './util';
import { startMainWindow, checkWindowHideOrShow, allWindowDestroy, refreshMainWindow } from './window';
import { stopServer, restartServer } from './server';
import { toAppUpdater } from './updater';

import log from 'electron-log';

// 忽略https证书相关错误，加在electron相关js文件里，有app的地方
app.commandLine.appendSwitch('ignore-certificate-errors')

// if (process.env.NODE_ENV === 'production') {
//   const sourceMapSupport = require('source-map-support');
//   sourceMapSupport.install();
// }


// if (isDebug) {
// require('electron-debug')();
// }



/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (config.openStartMinimized || config.openCloseWindowMinimize) {
    return
  }
  if (process.platform !== 'darwin') {
    destroyAll()
  }
});

app
  .whenReady()
  .then(() => {
    startMainWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      startMainWindow();
    });
  })
  .catch(log.info);


export let tray: Tray | null = null;

export const appMenu: any = {
  refreshMenu: {
    id: "refreshMenu",
    label: '刷新',
    visible: true,
    enabled: true,
    click: function () {
      refreshMainWindow()
    },
  },
  stopServerMenu: {
    id: "stopServerMenu",
    label: '关闭服务',
    visible: false,
    enabled: true,
    click: function () {
      stopServer()
    },
  },
  startServerMenu: {
    id: "startServerMenu",
    label: '启动服务',
    visible: false,
    enabled: true,
    click: function () {
      restartServer()
    },
  },
  restartServerMenu: {
    id: "restartServerMenu",
    label: '重启服务',
    visible: false,
    enabled: true,
    click: function () {
      restartServer()
    },
  },
  updaterMenu: {
    id: "updaterMenu",
    label: '检查更新',
    visible: true,
    enabled: true,
    click: function () {
      toAppUpdater()
    },
  },
  quitMenu: {
    id: "quitMenu",
    label: '退出',
    visible: true,
    enabled: true,
    click: function () {
      destroyAll()
    },
  },
}

let trayImage: string = ""
if (process.platform === 'darwin') {
  trayImage = (options.icon16Path)
} else {
  trayImage = (options.icon64Path)
}

let menus = [];
menus.push(appMenu.refreshMenu)
menus.push(appMenu.startServerMenu)
menus.push(appMenu.stopServerMenu)
menus.push(appMenu.restartServerMenu)
menus.push(appMenu.updaterMenu)
menus.push(appMenu.quitMenu)

export const contextMenu = Menu.buildFromTemplate(menus)

export const getMenuItemById = (id: string): MenuItem | null => {
  if (contextMenu == null) {
    return null
  }
  let find = null
  contextMenu.items.forEach((one) => {
    if (one.id == id) {
      find = one
    }
  })
  return find
}



app.on('ready', async () => {
  tray = new Tray(trayImage)

  tray.setToolTip(config.tray.toolTip)
  if (process.platform === `darwin`) {
    //显示程序页面
    tray.on('mouse-up', checkWindowHideOrShow)
  } else {
    //显示程序页面
    tray.on('click', checkWindowHideOrShow)
  }


  tray.setContextMenu(contextMenu)

})



export const destroyAll = () => {
  options.isStopped = true
  try {
    allWindowDestroy()
  } catch (error) {
    log.info(error)
  }
  try {
    stopServer()
  } catch (error) {
    log.info(error)
  }
  try {
    if (tray != null) {
      tray.destroy()
    }
  } catch (error) {
    log.info(error)
  }
  try {
    if (app != null) {
      app.quit()
    }
  } catch (error) {
    log.info(error)
  }
}