/* eslint import/prefer-default-export: off */
import { URL } from 'url';
import path from 'path';
import { app } from 'electron';

export function resolveHtmlPath(htmlFileName: string) {
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT || 1212;
    const url = new URL(`http://localhost:${port}`);
    url.pathname = htmlFileName;
    return url.href;
  }
  return `file://${path.resolve(__dirname, '../renderer/', htmlFileName)}`;
}

export const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'assets')
  : path.join(__dirname, '../../assets');

export const getAssetPath = (...paths: string[]): string => {
  return path.join(RESOURCES_PATH, ...paths);
};


export const ROOT_PATH = app.isPackaged
  ? path.join(process.resourcesPath, '')
  : path.join(__dirname, '../../');


export const getRootPath = (...paths: string[]): string => {
  return path.join(ROOT_PATH, ...paths);
};

export const options = {
  isStopped: false,
  willQuitApp: false,
  screenWidth: 1440,
  screenHeight: 900,
  rootDir: getRootPath("./"),
  isDebug: process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true',
  isDarwin: process.platform === 'darwin',
  isWindows: process.platform === 'win32',
  isLinux: process.platform === 'linux',
  isAmd64: process.arch === 'x64',
  isArm64: process.arch === 'arm64',
  iconPath: getAssetPath('icons/icon.png'),
  icon16Path: getAssetPath('icons/icon-16.png'),
  icon32Path: getAssetPath('icons/icon-32.png'),
  icon64Path: getAssetPath('icons/icon-64.png'),
} 