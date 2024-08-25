
export default {
    tray: {
        toolTip: "Electron · Template",
    },
    window: {
        title: "Electron · Template",
        width: 1440,
        height: 900,
        // 首页地址 如：./assets/html/index.html 或 http://127.0.0.1:8080/xxx
        index: "",
        // 使用 服务输出的地址
        // 服务 控制台 输出 字符串 如：event:serverUrl:http://127.0.0.1:8080/xxx
        useServerUrl: true,
        // 开启 关闭窗口 最小化
        hideWhenClose: true,
        // 开启 启动最小化
        hideWhenStart: false,
    },
    // 服务配置
    server: {
        // 服务根目录
        dir: "./assets/server",
        // darwin 系统服务配置
        darwin: {
            amd64: {
                libDir: "",
                exec: "./server",
                args: ["-isElectron", "1"],
            },
            arm64: {
                libDir: "",
                exec: "./server",
                args: ["-isElectron", "1"],
            },
        },
        // linux 系统服务配置
        linux: {
            amd64: {
                libDir: "",
                exec: "./server",
                args: ["-isElectron", "1"],
            },
            arm64: {
                libDir: "",
                exec: "./server",
                args: ["-isElectron", "1"],
            },
        },
        // win 系统服务配置
        win: {
            amd64: {
                libDir: "",
                exec: "./server",
                args: ["-isElectron", "1"],
            },
            arm64: {
                libDir: "",
                exec: "./server",
                args: ["-isElectron", "1"],
            },
        }
    },
}