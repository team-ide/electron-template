
import React from 'react';

export default class Server extends React.Component {
  state = {
    value: 'name',
    isStopped: true,
    error: "",
    isStarting: false,
    checkTime: new Date(),
    serverStatus: null,
  }

  handleClick = (e: React.MouseEvent, msg: string) => {
    console.log('hello class component', e, msg)
  }
  handleChangeName = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      value: e.target.value
    })
  }
  onIpcExample = () => {
    // calling IPC exposed from preload script
    window.electron.ipcRenderer.once('ipc-example', (args: any) => {
      args = args || []
      if (args[0] == 'server-status' && args[1]) {
        this.setState({
          isStopped: args[1].isStopped,
          error: args[1].error,
          isStarting: args[1].isStarting,
          checkTime: new Date(),
          serverStatus: args[1],
        })
        window.setTimeout(() => {
          this.checkServerStatus()
        }, 200)
      } else if (args[0] == 'script-execute-result' && args[1]) {
        alert(JSON.stringify(args[1]))
      }
      this.onIpcExample()
    });
  }

  checkServerStatus = () => {
    window.electron.ipcRenderer.sendMessage('ipc-example', ["server-status"]);
  }
  callServerStart = () => {
    window.electron.ipcRenderer.sendMessage('ipc-example', ["server-start"]);
  }
  callServerStop = () => {
    window.electron.ipcRenderer.sendMessage('ipc-example', ["server-stop"]);
  }
  callScriptExecute = () => {
  //   let script = `

  //  context.window.mainWindow.setAlwaysOnTop(true);
  //   `;
  //   window.electron.ipcRenderer.sendMessage('ipc-example', ["script-execute", script]);
  }
  callToServerUrl = () => {

  }

  //实现该生命周期的方法，react底层会自动在对应周期中调用该钩子方法
  componentDidMount() {
    this.onIpcExample()
    this.checkServerStatus()
    this.callScriptExecute()
    //直接赋值，不会重新渲染html。必须调用setState方法才会监听到html是否变化，然后react才再重新渲染。
    //并非直接的双向数据绑定
    //this.state.text = "byebye world";

  }
  render() {
    return (
      <div>
        <div>Server Status Check</div>
        {/* <div>{JSON.stringify(this.state)}</div> */}
        {
          this.state.isStopped ?
            (
              this.state.isStarting ?
                (
                  <div className="app-system-message-info">
                    服务启动中，请稍后~~~
                  </div>
                )
                :
                (
                  <div className="app-system-message-info">
                    服务已停止，
                    {this.state.error == '' ? '' : '异常：' + this.state.error + '，'}
                    <a onClick={this.callServerStart} className="reset-btn">点击启动</a>
                  </div>
                )
            )
            :
            (

              <div className="app-system-message-info">
                服务已启动，正在跳转首页，如未跳转，<a onClick={this.callToServerUrl} className="reset-btn">请点击跳转</a>
              </div>
            )
        }
      </div>
    )
  }
}
