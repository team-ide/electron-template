/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import { app, ipcMain, Menu, Tray } from 'electron';
import config from './config';
import { options } from './util';
import { startMainWindow, checkWindowHideOrShow, allWindowDestroy } from './window';
import { stopServer } from './server';


ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

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
  .catch(console.log);

let tray: Tray | null = null;
app.on('ready', async () => {
  if (process.platform === 'darwin') {
    tray = new Tray(options.icon16Path)
  } else {
    tray = new Tray(options.icon64Path)
  }
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '退出',
      click: function () {
        destroyAll()
      }
    }
  ])
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
    console.log(error)
  }
  try {
    stopServer()
  } catch (error) {
    console.log(error)
  }
  try {
    if (tray != null) {
      tray.destroy()
    }
  } catch (error) {
    console.log(error)
  }
  try {
    if (app != null) {
      app.quit()
    }
  } catch (error) {
    console.log(error)
  }
}
