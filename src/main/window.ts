import { resolveHtmlPath, options } from './util';
import path from 'path';
import { app, BrowserWindow, shell, Menu, screen } from 'electron';
import config from './config';
import { startServer } from './server';
import log from 'electron-log';

let serverUrl = resolveHtmlPath('index.html')

export let mainWindow: BrowserWindow | null = null;


if (options.isDebug) {
    // require('electron-debug')();
}
const installExtensions = async () => {
    const installer = require('electron-devtools-installer');
    const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
    const extensions = ['REACT_DEVELOPER_TOOLS'];

    return installer
        .default(
            extensions.map((name) => installer[name]),
            forceDownload
        )
        .catch(log.info);
};

export const onServerStart = (url: string) => {
    log.info("onServerStart to url:", url)
    if (url == null || url == "") {
        return
    }
    if (mainWindow != null && !mainWindow.isDestroyed()) {
        log.info("onServerStart to url:", url)
        mainWindow.loadURL(url);
    }
}

export const onServerStop = () => {
    if (mainWindow != null && !mainWindow.isDestroyed()) {
        let url = resolveHtmlPath('index.html')
        log.info("onServerStop to url:", url)
        mainWindow.loadURL(url);
    }
}
export const refreshMainWindow = () => {
    if (mainWindow != null && !mainWindow.isDestroyed()) {
        log.info("refresh main window")
        mainWindow.reload()
    }
}
var mainWindowReadyde = false

export const startMainWindow = async () => {
    if (mainWindow != null && !mainWindow.isDestroyed()) {
        mainWindow.show()
        return
    }
    // if (options.isDebug) {
    //     installExtensions();
    // }

    //获取到屏幕的宽度和高度
    const workAreaSize = screen.getPrimaryDisplay().workAreaSize
    options.screenWidth = workAreaSize.width;
    options.screenHeight = workAreaSize.height;


    if (options.windowWidth > options.screenWidth) {
        options.windowWidth = (options.screenWidth - 40);
    }
    if (options.windowHeight > options.screenHeight) {
        options.windowHeight = (options.screenHeight - 40);
    }


    mainWindow = new BrowserWindow({
        show: false,
        width: options.windowWidth,
        height: options.windowHeight,
        icon: options.iconPath,
        autoHideMenuBar: true,
        title: config.title,
        webPreferences: {
            preload: app.isPackaged
                ? path.join(__dirname, 'preload.js')
                : path.join(__dirname, '../../.erb/dll/preload.js'),
        },
    });

    mainWindow.loadURL(serverUrl);

    mainWindow.on('ready-to-show', () => {
        if (mainWindowReadyde) {
            return
        }
        if (!mainWindow) {
            throw new Error('"mainWindow" is not defined');
        }
        mainWindowReadyde = true
        if (config.openStartMinimized) {
            allWindowHide()
        } else {
            mainWindow.show();
        }
        startServer()
    });

    mainWindow.on('close', (e) => {
        e.preventDefault();

        // 如果 开启关闭最小化 则 隐藏窗口 
        if (config.openCloseWindowMinimize) {
            allWindowHide()
        } else {
            if (mainWindow != null && !mainWindow.isDestroyed) {
                mainWindow.hide()
            }
        }
    });

    Menu.setApplicationMenu(null);
    // Open urls in the user's browser
    mainWindow.webContents.setWindowOpenHandler((edata) => {
        shell.openExternal(edata.url);
        return { action: 'deny' };
    });
};

let viewWindowList: BrowserWindow[] = [];
let isAllWindowHide = false;
export const allWindowShow = async () => {
    isAllWindowHide = false;
    startMainWindow();
    viewWindowList.forEach((one: BrowserWindow) => {
        if (!one.isDestroyed()) {
            one.show();
        }
    })
};
export const allWindowHide = () => {
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
export const allWindowDestroy = () => {
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
export const checkWindowHideOrShow = () => {
    if (isAllWindowHide) {
        allWindowShow();
    } else {
        allWindowHide();
    }
}