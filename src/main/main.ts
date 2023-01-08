/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import { app, Menu, Tray } from 'electron';
import config from './config';
import { options } from './util';
import { startMainWindow, checkWindowHideOrShow, allWindowDestroy, refreshMainWindow } from './window';
import { stopServer, serverStatus, restartServer } from './server';
import log from 'electron-log';



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

let tray: Tray | null = null;
app.on('ready', async () => {
  if (process.platform === 'darwin') {
    tray = new Tray(options.icon16Path)
  } else {
    tray = new Tray(options.icon64Path)
  }

  let menus = [];

  menus.push(
    {
      label: '刷新',
      click: function () {
        refreshMainWindow()
      }
    }
  )
  if (serverStatus.hasServer) {
    menus.push(
      {
        label: '关闭服务',
        click: function () {
          stopServer()
        }
      }
    )
    menus.push(
      {
        label: '重启服务',
        click: function () {
          restartServer()
        }
      }
    )
  }
  menus.push(
    {
      label: '退出',
      click: function () {
        destroyAll()
      }
    }
  )

  const contextMenu = Menu.buildFromTemplate(menus)
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



let destroyAll = () => {
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
