
import React from 'react';

import './App.css';

import Home from './Home';
import Server from './Server';
import Updater from './Updater';

export default class App extends React.Component<any, any> {
  state = {
    page: ""
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
    if (location.hash != null && location.hash != "") {
      this.toPage(location.hash.substring(1))
    }
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



