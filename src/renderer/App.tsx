
import React from 'react';

import './App.css';

import Home from './Home';
import Server from './Server';
import Updater from './Updater';

export default class App extends React.Component<any, any> {
  state = {
    page: ""
  }
  onIpcExample = () => {
    // calling IPC exposed from preload script
    window.electron.ipcRenderer.once('ipc-example', (args: any) => {
      args = args || []
      if (args[0] == 'to-page' && args[1]) {
        if (args[1] != null && args[1] != "") {
          this.toPage(args[1])
        }
      }
    });
  }
  toPage = (page: string) => {
    if (this.state.page != "") {
      return
    }
    this.setState({
      page: page,
    })
  }
  componentDidMount() {
    this.onIpcExample()
  }
  render() {
    return (
      <div>
        {
          this.state.page == "/server" ?
            <Server></Server>
            :
            this.state.page == "/updater" ?
              <Updater></Updater>
              :
              <Home></Home>
        }
      </div>
    )
  }
}



