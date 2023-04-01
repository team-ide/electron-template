
import { ipcMain, MenuItem } from 'electron';
import config from './config';
import { getRootPath, options } from './util';
import { getMenuItemById } from './main';
import { onFindServerUrl, onServerStop } from './window';
import { spawn, ChildProcess } from 'child_process';
import { updaterStatus, updaterDownload, updaterQuitAndInstall } from './updater';
import log from 'electron-log';

let serverProcessor: ChildProcess | null = null

ipcMain.on('ipc-example', async (event, arg) => {
    if (arg == 'server-status') {
        event.reply('ipc-example', ['server-status', serverStatus]);
        return
    } else if (arg == 'server-start') {
        startServer()
        event.reply('ipc-example', ['server-start', serverStatus]);
        return
    } else if (arg == 'server-stop') {
        stopServer()
        event.reply('ipc-example', ['server-stop', serverStatus]);
        return
    } else if (arg == 'server-restart') {
        restartServer()
        event.reply('ipc-example', ['server-restart', serverStatus]);
        return
    } else if (arg == 'updater-status') {
        event.reply('ipc-example', ['updater-status', updaterStatus]);
        return
    } else if (arg == 'updater-download') {
        updaterDownload()
        event.reply('ipc-example', ['updater-status', updaterStatus]);
        return
    } else if (arg == 'updater-quit-and-install') {
        updaterQuitAndInstall()
        event.reply('ipc-example', ['updater-status', updaterStatus]);
        return
    }
});

let serverConfig = null
if (options.isWindows) {
    serverConfig = config.server.win;
} else if (options.isLinux) {
    serverConfig = config.server.linux;
} else if (options.isDarwin) {
    serverConfig = config.server.darwin;
}

export const serverStatus = {
    isStopped: true,
    error: "",
    isStarting: true,
    hasServer: serverConfig != null && serverConfig.exec != null && serverConfig.exec != "",
}

let onServerClosed: any = null


export const restartServer = () => {
    if (serverProcessor != null) {
        onServerClosed = () => {
            startServer()
        }
        stopServer()
    } else {
        stopServer()
        startServer()
    }
}

const onServerStarted = () => {
    serverStatus.isStopped = false
}
const onServerStoped = () => {
    serverStatus.isStopped = true
    serverStatus.isStarting = false
    if (options.isStopped || options.willQuitApp) {
        serverStatus.error = ""
        log.info(`server is stopped`);
    } else {
        log.info("onServerStop");
        onServerStop()
        let onC = onServerClosed
        onServerClosed = null
        if (onC != null) {
            onC()
        }
    }
}
const onServerError = (data: any) => {
    serverStatus.isStopped = true
    serverStatus.isStarting = false
    serverStatus.error = data.toString()
    log.error(`server start error:`, data.toString());
}

export const startServer = () => {
    log.info("server start")
    serverStatus.error = ""
    serverStatus.isStopped = true
    serverStatus.isStarting = true
    try {
        if (serverProcessor != null) {
            return
        } else if (config.server == null) {
            log.info("没有服务配置")
            return
        }
        let menuItem: MenuItem | null
        menuItem = getMenuItemById("startServerMenu")
        if (menuItem) {
            menuItem.visible = true
        }
        menuItem = getMenuItemById("stopServerMenu")
        if (menuItem) {
            menuItem.visible = true
        }
        menuItem = getMenuItemById("restartServerMenu")
        if (menuItem) {
            menuItem.visible = true
        }

        log.info("server config:", config.server)

        let serverDir = getRootPath(config.server.dir)
        let libDir = getRootPath(config.server.libDir)
        log.info("serverDir:", serverDir)
        log.info("libDir:", libDir)
        var cmdOptions = {
            cwd: serverDir,
            env: process.env,
        };

        let serverConfig = null
        if (options.isWindows) {
            serverConfig = config.server.win;
            cmdOptions.env.PATH += ";" + libDir;
            cmdOptions.env.LD_LIBRARY_PATH += ";" + libDir;
        } else if (options.isLinux) {
            serverConfig = config.server.linux;
            cmdOptions.env.PATH += ":" + libDir;
            cmdOptions.env.LD_LIBRARY_PATH += ":" + libDir;
        } else if (options.isDarwin) {
            serverConfig = config.server.darwin;
            cmdOptions.env.PATH += ":" + libDir;
            cmdOptions.env.LD_LIBRARY_PATH += ":" + libDir;
        }
        log.info("serverConfig:", serverConfig)
        if (serverConfig == null) {
            log.info("没有匹配的服务配置")
            return
        }
        if (serverConfig.exec == null || serverConfig.exec == "") {
            log.info("未配置服务启动命令")
            return
        }
        serverProcessor = spawn(
            serverConfig.exec,
            serverConfig.args || [],
            cmdOptions,
        );
        if (serverProcessor.stdout == null) {
            onServerError("服务启动失败")
        } else {
            onServerStarted()
        }
        if (serverProcessor.stdout != null) {
            serverProcessor.stdout.on('data', (data: any) => {
                if (data == null) {
                    return
                }
                let msg = data.toString()
                log.info("server processor stdout:", msg);
                if (msg.startsWith("event:serverUrl:")) {
                    if (config.window.useServerUrl) {
                        let serverUrl = msg.substring("event:serverUrl:".length)
                        log.info("onFindServerUrl:", serverUrl);
                        onFindServerUrl(serverUrl)
                    }
                    return
                }
            });
        }
        if (serverProcessor.stderr != null) {
            serverProcessor.stderr.on('data', (data: any) => {
                serverStatus.error = data.toString()
                log.error('server processor stderr:', data.toString());
            });
        }
        serverProcessor.on('close', (code: any) => {
            serverProcessor = null;
            log.info(`server process close: ${code}`);
            onServerStoped()
        });
        serverProcessor.on('error', (data: any) => {
            serverProcessor = null;
            onServerError(data)
        });
    } catch (error: any) {
        onServerError(error)
    } finally {
        serverStatus.isStarting = false
        log.info("server start end")
    }

}

export const stopServer = () => {
    log.info("server call stop")
    if (serverProcessor == null) {
        return
    }
    try {
        if (serverProcessor.stdin != null) {
            serverProcessor.stdin.write("event:call:stop")
        }
    } catch (error) {
        log.error("server call stop error,", error)
    }
    serverProcessor.kill()
}