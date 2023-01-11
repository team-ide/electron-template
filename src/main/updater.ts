/* eslint global-require: off, no-console: off, promise/always-return: off */

import { autoUpdater } from 'electron-updater';
import { app, MenuItem, BrowserWindow } from 'electron';
import { getMenuItemById, destroyAll } from './main';
import { options } from './util';
import { getPageUrl } from './window';
import path from 'path';
import log from 'electron-log';


export const updaterStatus = {
  checking: false,
  error: "",
  hasNew: false,
  downloadStatus: 0, // 0 默认 1 下载中 2 下载成功
  cancelled: false,
  progress: {
    bytesPerSecond: 0,
    delta: 0,
    percent: 0,
    total: 0,
    transferred: 0,
  },
}

export let updaterWindow: BrowserWindow | null = null;
export const startUpdaterWindow = async () => {
  if (updaterWindow != null && !updaterWindow.isDestroyed()) {
    updaterWindow.show()
    return
  }

  updaterWindow = new BrowserWindow({
    show: true,
    width: 700,
    height: 300,
    icon: options.iconPath,
    autoHideMenuBar: true,
    // skipTaskbar: true,
    title: "检查更新",
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });


  updaterWindow.loadURL(getPageUrl('/updater'));

  updaterWindow.on('ready-to-show', () => {
    if (!updaterWindow) {
      throw new Error('"updaterWindow" is not defined');
    }
  });

  updaterWindow.on('close', (e) => {
    if (updaterDoing) {
      e.preventDefault();
      return
    }
  });

};
let updaterDoing = false
let onStart = () => {
  updaterDoing = true
  startUpdaterWindow()
}
let onEnd = () => {
  updaterDoing = false
}

export const updaterDownload = () => {
  updaterStatus.downloadStatus = 1
  autoUpdater.downloadUpdate()
}

export const updaterQuitAndInstall = () => {
  if (updaterWindow != null && !updaterWindow.isDestroyed()) {
    updaterWindow.destroy()
  }
  // 加载更新程序
  autoUpdater.quitAndInstall()
  // 关闭当前electron
  destroyAll()
}
export const updaterDestroy = () => {
  if (updaterWindow != null && !updaterWindow.isDestroyed()) {
    updaterWindow.destroy()
  }
}
export const toAppUpdater = async () => {
  if (updaterDoing) {
    return
  }
  if (updaterStatus.downloadStatus > 0) {
    startUpdaterWindow()
    return
  }
  onStart()
  updaterStatus.checking = true
  let updaterMenu: MenuItem | null
  updaterMenu = getMenuItemById("updaterMenu")
  autoUpdater.logger = log;
  // 允许 没有签名验证 的 Web安装程序文件 
  autoUpdater.disableWebInstaller = false
  // 设置是否自动下载，默认是true,当点击检测到新版本时，会自动下载安装包，所以设置为false
  autoUpdater.autoDownload = false
  //更新错误事件
  autoUpdater.on('error', (error) => {
    updaterStatus.error = error.toString()
    updaterStatus.downloadStatus = 0
    log.error('autoUpdater on error', error)
    onEnd()
  });

  //检查事件
  autoUpdater.on('checking-for-update', () => {
    updaterStatus.checking = true
    log.info('autoUpdater on checking-for-update')
  });

  //发现新版本
  autoUpdater.on('update-available', () => {
    updaterStatus.checking = false
    updaterStatus.hasNew = true
    log.info('autoUpdater on update-available')
    onEnd()
  });

  //当前版本为最新版本
  autoUpdater.on('update-not-available', () => {
    updaterStatus.checking = false
    updaterStatus.hasNew = false
    log.info('autoUpdater on update-not-available')
    onEnd()
  });

  //更新下载进度事件
  autoUpdater.on('download-progress', function (progressObj) {
    updaterStatus.progress = progressObj
    updaterStatus.downloadStatus = 1
    log.info('autoUpdater on download-progress', progressObj)
  });


  //下载完毕
  autoUpdater.on('update-downloaded', function () {
    updaterStatus.downloadStatus = 2
    log.info('autoUpdater on update-downloaded')
    onEnd()
  });

  //更新已取消
  autoUpdater.on('update-cancelled', function () {
    updaterStatus.downloadStatus = 0
    updaterStatus.cancelled = true
    log.info('autoUpdater on update-cancelled')
    onEnd()
  });

  //更新完成
  autoUpdater.on('appimage-filename-updated', function () {
    log.info('autoUpdater on update-cancelled')
    onEnd()
  });
  try {
    let res = await autoUpdater.checkForUpdatesAndNotify()
    if (res == null) {
      onEnd()
    }
    log.info('autoUpdater checkForUpdatesAndNotify res:', res)
  } catch (error) {
    log.error('autoUpdater error', error)
    onEnd()
  }
};
