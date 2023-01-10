
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
        this.setState({
          checkTime: new Date(),
          checking: args[1].checking,
          error: args[1].error,
          hasNew: args[1].hasNew,
          downloadStatus: args[1].downloadStatus,
          cancelled: args[1].cancelled,
          progress: args[1].progress,
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
                        <div>下载更新</div>
                      )
                      :
                      this.state.downloadStatus == 1 ?
                        (
                          <div>
                            <div>下载中</div>
                            <div>
                              下载进度：{JSON.stringify(this.state.progress)}
                            </div>
                          </div>
                        )
                        :
                        (
                          <div>下载完成</div>
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
