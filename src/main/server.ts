
import { ipcMain } from 'electron';
import config from './config';
import { getRootPath, options } from './util';
import { onServerStart, onServerStop } from './window';
import { spawn, ChildProcess } from 'child_process';
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
    statting: true,
    hasServer: serverConfig != null && serverConfig.exec != null && serverConfig.exec != "",
}


export const restartServer = () => {
    stopServer()
    startServer()
}

export const startServer = () => {
    log.info("server start")
    serverStatus.error = ""
    serverStatus.isStopped = true
    serverStatus.statting = true
    try {
        if (serverProcessor != null) {
            return
        } else if (config.server == null) {
            log.info("没有服务配置")
            return
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

        if (serverProcessor.stdout != null) {
            serverProcessor.stdout.on('data', (data: any) => {
                if (data == null) {
                    return
                }
                let msg = data.toString()
                log.info("server processor stdout:", msg);
                if (msg.startsWith("event:serverUrl:")) {
                    let serverUrl = msg.substring("event:serverUrl:".length)
                    log.info("onServerStart:", serverUrl);
                    onServerStart(serverUrl)
                    return
                }
            });
        }
        if (serverProcessor.stderr != null) {
            serverProcessor.stderr.on('data', (data: any) => {
                serverStatus.error = data.toString()
                log.info('server processor stderr:', data.toString());
            });
        }
        serverStatus.isStopped = false
        serverProcessor.on('close', (code: any) => {
            serverProcessor = null;
            serverStatus.isStopped = true
            serverStatus.statting = false
            log.info(`server process close: ${code}`);
            if (options.isStopped) {
                serverStatus.error = ""
                log.info(`server is stopped`);
            } else {
                log.error(`server process closed: ${code}`);
                log.info("onServerStop");
                onServerStop()
            }
        });
    } catch (error: any) {
        serverStatus.error = error.toString()
    } finally {
        serverStatus.statting = false
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
        log.info("server call stop error,", error)
    }
    serverProcessor.kill()
    serverProcessor = null;
}