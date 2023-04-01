import { resolveHtmlPath, options, getAssetPath } from './util';
import path from 'path';
import { app, BrowserWindow, shell, Menu, screen } from 'electron';
import config from './config';
import { startServer } from './server';
import { destroyAll } from './main';
import log from 'electron-log';


export let getRendererUrl = (page: string): string => {
    let pageUrl = resolveHtmlPath('index.html')
    if (page != null && page != "") {
        pageUrl += "#" + page
    }
    return pageUrl
}


export let getPageUrl = (page: string): string => {
    let pageUrl = null
    if (page == null || page == "") {
        pageUrl = getRendererUrl("")
    } else {
        if (page.indexOf("http") == 0) {
            pageUrl = page
        } else {
            pageUrl = `file://${getAssetPath(page)}`
        }
    }

    return pageUrl
}



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

export const onFindServerUrl = (url: string) => {
    log.info("onFindServerUrl to url:", url)
    if (url == null || url == "") {
        return
    }
    if (mainWindow != null && !mainWindow.isDestroyed()) {
        log.info("onFindServerUrl to url:", url)
        mainWindow.loadURL(url);
    }
}

export const onServerStop = () => {
    if (mainWindow != null && !mainWindow.isDestroyed()) {
        let url = getRendererUrl("/server")
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

export let mainWindow: BrowserWindow | null = null;
export const startMainWindow = async () => {
    if (mainWindow != null && !mainWindow.isDestroyed()) {
        mainWindow.show()
        return
    }
    log.info("start main window")
    // if (options.isDebug) {
    //     installExtensions();
    // }

    //获取到屏幕的宽度和高度
    const workAreaSize = screen.getPrimaryDisplay().workAreaSize
    options.screenWidth = workAreaSize.width;
    options.screenHeight = workAreaSize.height;


    if (config.window.width > options.screenWidth) {
        config.window.width = (options.screenWidth - 40);
    }
    if (config.window.height > options.screenHeight) {
        config.window.height = (options.screenHeight - 40);
    }


    mainWindow = new BrowserWindow({
        show: false,
        title: config.window.title,
        width: config.window.width,
        height: config.window.height,
        icon: options.iconPath,
        autoHideMenuBar: true,
        webPreferences: {
            preload: app.isPackaged
                ? path.join(__dirname, 'preload.js')
                : path.join(__dirname, '../../.erb/dll/preload.js'),
        },
    });

    let toPageUrl = ""

    if (config.window.useServerUrl) {
        toPageUrl = getRendererUrl("/server")
    } else {
        toPageUrl = getPageUrl(config.window.index)
    }
    mainWindow.loadURL(toPageUrl);

    mainWindow.on('ready-to-show', () => {
        log.info("main window ready-to-show")
        if (mainWindowReadyde) {
            return
        }
        if (!mainWindow) {
            throw new Error('"mainWindow" is not defined');
        }
        mainWindowReadyde = true
        if (config.window.hideWhenStart) {
            log.info("main window hide when start")
            allWindowHide()
        } else {
            mainWindow.show();
        }
        startServer()
    });

    mainWindow.on('close', (e) => {
        if (options.willQuitApp) {
            return
        }
        e.preventDefault();
        log.info("main window close")

        // 如果 开启关闭最小化 则 隐藏窗口 
        if (config.window.hideWhenClose) {
            log.info("main window hide when close")
            allWindowHide()
        } else {
            log.info("main window close destroy all")
            destroyAll()
        }
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