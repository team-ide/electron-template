/* eslint global-require: off, no-console: off, promise/always-return: off */

import { autoUpdater } from 'electron-updater';
import log from 'electron-log';

const toAppUpdater = async () => {
  log.transports.file.level = 'info';
  autoUpdater.logger = log;
  try {
    const res = await autoUpdater.checkForUpdatesAndNotify();
    console.log('checkForUpdatesAndNotify result:', res);
  } catch (e) {
    console.log('checkForUpdatesAndNotify error:', e);
  }
};
export default { toAppUpdater };
