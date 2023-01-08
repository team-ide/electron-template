/* eslint global-require: off, no-console: off, promise/always-return: off */

import { autoUpdater } from 'electron-updater';
import { MenuItem } from 'electron';
import { getMenuItemById } from './main';
import log from 'electron-log';

export const toAppUpdater = async () => {
  let updaterMenu: MenuItem | null
  updaterMenu = getMenuItemById("updaterMenu")
  autoUpdater.logger = log;
  //更新错误事件
  autoUpdater.on('error', function (error) {
    if (updaterMenu) {
      updaterMenu.label = "更新异常,点击重试"
      updaterMenu.enabled = true
    }
    log.info('autoUpdater error', error)
  });

  //检查事件
  autoUpdater.on('checking-for-update', function () {
    if (updaterMenu) {
      updaterMenu.label = "更新检查中..."
      updaterMenu.enabled = false
    }
    log.info('autoUpdater checking-for-update')
  });

  //发现新版本
  autoUpdater.on('update-available', function () {
    if (updaterMenu) {
      updaterMenu.label = "发现新版本"
      updaterMenu.enabled = false
    }
    log.info('autoUpdater update-available')
  });

  //当前版本为最新版本
  autoUpdater.on('update-not-available', function () {
    if (updaterMenu) {
      updaterMenu.label = "当前为最新版本"
      updaterMenu.enabled = false
    }
    log.info('autoUpdater update-not-available')
  });

  //更新下载进度事件
  autoUpdater.on('download-progress', function (progressObj) {
    if (updaterMenu) {
      updaterMenu.label = "正在下载"
      updaterMenu.enabled = false
    }
    log.info('autoUpdater download-progress', progressObj)
  });


  //下载完毕
  autoUpdater.on('update-downloaded', function () {
    if (updaterMenu) {
      updaterMenu.label = "下载完成"
      updaterMenu.enabled = false
    }
    log.info('autoUpdater update-downloaded')
  });

  //更新已取消
  autoUpdater.on('update-cancelled', function () {
    if (updaterMenu) {
      updaterMenu.label = "更新已取消"
      updaterMenu.enabled = true
    }
    log.info('autoUpdater update-cancelled')
  });

  //更新完成
  autoUpdater.on('appimage-filename-updated', function () {
    if (updaterMenu) {
      updaterMenu.label = "更新完成"
      updaterMenu.enabled = true
    }
    log.info('autoUpdater update-cancelled')
  });
  try {
    let res = await autoUpdater.checkForUpdatesAndNotify()
    log.info('autoUpdater checkForUpdatesAndNotify res:', res)
  } catch (error) {
    log.error('autoUpdater error', error)
  }
};
