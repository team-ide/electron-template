import { resolveHtmlPath, options, getAssetPath } from './util';
import path from 'path';
import { app, BrowserWindow, shell, Menu, screen } from 'electron';
import config from './config';
import { startServer, cacheData, listenEvents } from './server';
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
let windowCache: any = {}
let windowIndex = 0


// BrowserWindow option
// width整数（可选） - 窗口的宽度（以像素为单位）。默认是800。
// height整数（可选） - 窗口的高度（以像素为单位）。默认是600。
// x整数（可选）（如果使用y，则为必需） - 窗口的左偏移屏幕。默认是将窗口居中。
// y整数（可选）（如果使用x，则为必需） - 窗口与屏幕的偏移量。默认是将窗口居中。
// useContentSize布尔（可选） - width和height将用作网页的大小，这意味着实际窗口的大小将包括窗口框架的大小并略大。默认是false。
// center 布尔（可选） - 在屏幕中心显示窗口。
// minWidth整数（可选） - 窗口的最小宽度。默认是0。
// minHeight整数（可选） - 窗口的最小高度。默认是0。
// maxWidth整数（可选） - 窗口的最大宽度。默认是没有限制的。
// maxHeight整数（可选） - 窗口的最大高度。默认是没有限制的。
// resizable布尔（可选） - 窗口是否可调整大小。默认是true。
// movable布尔（可选） - 窗口是否可移动。这在Linux上没有实现。默认是true。
// minimizable布尔（可选） - 窗口是否可以最小化。这在Linux上没有实现。默认是true。
// maximizable布尔（可选） - 窗口是否可以最大化。这在Linux上没有实现。默认是true。
// closable布尔（可选） - 窗口是否可关闭。这在Linux上没有实现。默认是true。
// focusable布尔（可选） - 窗口是否可以聚焦。默认是true。在Windows上设置focusable: false也意味着设置skipTaskbar: true。在Linux设置下focusable: false，窗口停止与wm进行交互，所以窗口将始终保持在所有工作区的顶部。
// alwaysOnTop布尔（可选） - 窗口是否应始终保持在其他窗口之上。默认是false。
// fullscreen布尔（可选） - 窗口是否应以全屏显示。当明确设置为false全屏按钮时，将在macOS上隐藏或禁用。默认是false。
// fullscreenable布尔（可选） - 窗口是否可以进入全屏模式。在macOS上，最大化/缩放按钮是否应该切换全屏模式或最大化窗口。默认是true。
// skipTaskbar布尔（可选） - 是否在任务栏中显示窗口。默认是false。
// kiosk布尔（可选） - 自助服务终端模式。默认是false。
// title字符串（可选） - 默认窗口标题。默认是"Electron"。
// icon（NativeImage |字符串）（可选） - 窗口图标。在Windows上，建议使用ICO图标来获得最佳的视觉效果，您也可以将其保留为未定义的，以便使用可执行文件的图标。
// show布尔（可选） - 创建时是否显示窗口。默认是true。
// frame布尔（可选） - 指定false创建一个无框窗口。默认是true。
// parentBrowserWindow（可选） - 指定父窗口。默认是null。
// modal布尔（可选） - 是否是模态窗口。这只适用于窗口是子窗口的情况。默认是false。
// acceptFirstMouseBoolean（可选） - Web视图是否接受同时激活窗口的单个鼠标按下事件。默认是false。
// disableAutoHideCursor布尔（可选） - 是否在键入时隐藏光标。默认是false。
// autoHideMenuBar布尔（可选） - 除非Alt按下键，否则自动隐藏菜单栏。默认是false。
// enableLargerThanScreen布尔（可选） - 使窗口的调整大小大于屏幕。默认是false。
// backgroundColor字符串（可选） - 窗口的背景颜色为十六进制值，如#66CD00or #FFF或#80FFFFFF（支持alpha）。默认是#FFF（白色）。
// hasShadow布尔（可选） - 窗口是否应该有阴影。这只在macOS上实现。默认是true。
// darkTheme布尔（可选） - 强制使用黑暗主题作为窗口，仅适用于某些GTK + 3桌面环境。默认是false。
// transparent布尔（可选） - 使窗口透明。默认是false。
// type字符串（可选） - 窗口的类型，默认为正常窗口。请参阅下面的更多信息。
// titleBarStyle字符串（可选） - 窗口标题栏的样式。默认是default。可能的值是：
// default - 导致标准灰色不透明的Mac标题栏。
// hidden - 导致隐藏标题栏和全尺寸内容窗口，但标题栏仍然在左上角具有标准窗口控件（“交通信号灯”）。
// hidden-inset- 弃用，hiddenInset改为使用。
// hiddenInset - 在隐藏的标题栏中显示交通灯按钮稍微偏离窗口边缘的替代外观。
// customButtonsOnHover布尔（可选） - 在macOS无框窗口上绘制自定义关闭，最小化和全屏按钮。这些按钮不会显示，除非在窗口的左上角悬停。这些自定义按钮可防止与标准窗口工具栏按钮发生的鼠标事件相关的问题。注意：此选项目前是实验性的。

export const newWindow = (opt: any) => {
    windowIndex++
    let key = opt.key || windowIndex
    key = '' + key
    let cacheKey: any = null;
    if (opt.cacheKey && opt.cacheData) {
        cacheKey = opt.cacheKey
        log.info("cacheData set cacheKey:", cacheKey)
        cacheData[cacheKey] = opt.cacheData
    }
    let win = new BrowserWindow({
        show: true,
        title: opt.title || config.window.title,
        width: opt.width || config.window.width,
        height: opt.height || config.window.height,
        icon: opt.iconPath || options.iconPath,
        autoHideMenuBar: true,
        webPreferences: {
            preload: app.isPackaged
                ? path.join(__dirname, 'preload.js')
                : path.join(__dirname, '../../.erb/dll/preload.js'),
        },
    });
    if (opt.isMainChild) {
        win.setParentWindow(mainWindow)
    }
    if (opt.parentKey && windowCache[opt.parentKey]) {
        win.setParentWindow(windowCache[opt.parentKey])
    }
    windowCache[key] = win

    if (opt.url) {
        win.loadURL(opt.url);
    }

    win.on('ready-to-show', () => {
        if (!win) {
            throw new Error('"win" is not defined');
        }
        win.show()
    });

    win.on('close', (e) => {
        destroyWindow(key)
        if (cacheKey != null) {
            log.info("cacheData delete cacheKey:", cacheKey)
            delete cacheData[cacheKey]
        }
        if (opt.listenKeys) {
            opt.listenKeys.forEach((listenKey: any) => {
                log.info("listenData delete listenKey:", listenKey)
                let es = listenEvents[listenKey]
                delete listenEvents[listenKey]
                if (es) {
                    es.forEach((e: Electron.IpcMainEvent) => {
                        e.reply('ipc-example', ['on-listen', listenKey]);
                    })
                }
            })
        }
    });
    return key;
};
export const showWindow = (key: any) => {
    let win = getWindow(key)
    if (win != null) {
        win.show()
    }
};
export const getWindow = (key: any) => {
    let win: BrowserWindow = windowCache[key]
    if (win == null) {
        return null;
    }
    if (win.isDestroyed()) {
        delete windowCache[key]
        return null;
    }
    return win;
};
export const hideWindow = (key: any) => {
    let win = getWindow(key)
    if (win != null) {
        win.hide()
    }
};
export const destroyWindow = (key: any) => {
    let win = getWindow(key)
    if (win != null) {
        win.destroy()
    }
    delete windowCache[key];
};
let isAllWindowHide = false;
export const getAllWindows = () => {
    let viewWindowList = []
    for (let key in windowCache) {
        viewWindowList.push(windowCache[key])
    }
    return viewWindowList
};
export const allWindowShow = async () => {
    isAllWindowHide = false;
    startMainWindow();
    getAllWindows().forEach((one: BrowserWindow) => {
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
    getAllWindows().forEach((one: BrowserWindow) => {
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
    getAllWindows().forEach((one: BrowserWindow) => {
        if (!one.isDestroyed()) {
            one.destroy();
        }
    })
    windowCache = {};
};
export const checkWindowHideOrShow = () => {
    if (isAllWindowHide) {
        allWindowShow();
    } else {
        allWindowHide();
    }
}