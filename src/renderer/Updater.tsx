
import React from 'react';

export default class Updater extends React.Component {
  state = {
    checkTime: new Date(),
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
    updaterStatus: null,
  }
  onIpcExample = () => {
    // calling IPC exposed from preload script
    window.electron.ipcRenderer.once('ipc-example', (args: any) => {
      args = args || []
      if (args[0] == 'updater-status' && args[1]) {
        let progress = args[1].progress;
        if (progress == null) {
          progress = {
            bytesPerSecond: 0,
            delta: 0,
            percent: 0,
            total: 0,
            transferred: 0,
          }
        }
        if (progress.percent > 0) {
          progress.percent = progress.percent.toFixed(1)
        }
        this.setState({
          checkTime: new Date(),
          checking: args[1].checking,
          error: args[1].error,
          hasNew: args[1].hasNew,
          downloadStatus: args[1].downloadStatus,
          cancelled: args[1].cancelled,
          progress: progress,
          updaterStatus: args[1],
        })

        window.setTimeout(() => {
          this.checkUpdaterStatus()
        }, 200)
      }
      this.onIpcExample()
    });
  }

  checkUpdaterStatus = () => {
    window.electron.ipcRenderer.sendMessage('ipc-example', ["updater-status"]);
  }
  updaterDownload = () => {
    window.electron.ipcRenderer.sendMessage('ipc-example', ["updater-download"]);
  }
  updaterQuitAndInstall = () => {
    window.electron.ipcRenderer.sendMessage('ipc-example', ["updater-quit-and-install"]);
  }
  componentDidMount() {
    this.onIpcExample()
    this.checkUpdaterStatus()
  }
  render() {
    return (
      <div>
        <div>Updater Page</div>
        {
          this.state.error != "" ?
            (
              <div>检查更新异常：<span>{this.state.error}</span></div>
            )
            :
            (
              this.state.checking ?
                (
                  <div>检查更新中...</div>
                )
                :
                this.state.hasNew ?
                  (
                    this.state.downloadStatus == 0 ?
                      (
                        <div>有新版本，<a onClick={this.updaterDownload} className="updater-download-btn">下载更新</a></div>
                      )
                      :
                      this.state.downloadStatus == 1 ?
                        (
                          <div>
                            下载中，下载进度：<span className="">{this.state.progress.percent} %</span>
                          </div>
                        )
                        :
                        (
                          <div>下载完成，<a onClick={this.updaterQuitAndInstall} className="updater-quit-and-install-btn">立即安装</a></div>
                        )
                  ) :
                  (
                    <div>已经是最新版本</div>
                  )
            )
        }
      </div>
    )
  }
}
