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
import { toAppUpdater, updaterDestroy } from './updater';

import log from 'electron-log';

log.info("app start")

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
  log.info("on window all closed")
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (config.window.hideWhenStart || config.window.hideWhenClose) {
    return
  }
  if (process.platform !== 'darwin') {
    destroyAll()
  }
});

app
  .whenReady()
  .then(() => {
    log.info("on app ready")
    startMainWindow();
    app.on('activate', () => {
      log.info("on app activate")
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
  log.info("on app ready")
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
let willQuitApp = false;
// 只有显式调用quit才退出系统，区分MAC系统程序坞退出和点击X关闭退出
app.on('before-quit', () => {
  log.info('before-quit');
  willQuitApp = true;
  destroyAll();
});

export const destroyAll = () => {
  log.info("destroy all start")
  options.isStopped = true
  try {
    allWindowDestroy()
  } catch (error) {
    log.error("all window error:", error)
  }
  try {
    stopServer()
  } catch (error) {
    log.error("stop server error:", error)
  }
  try {
    if (tray != null) {
      tray.destroy()
    }
  } catch (error) {
    log.error("tray destroy error:", error)
  }
  try {
    updaterDestroy()
  } catch (error) {
    log.error("updater destroy error:", error)
  }

  try {
    if (app != null) {
      app.quit()
    }
  } catch (error) {
    log.error("app quit error:", error)
  }
  log.info("destroy all end")
}