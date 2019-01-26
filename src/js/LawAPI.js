/**
 * Note:
 * "By default, iOS will block any request that's not encrypted using SSL."
 * @see {@link https://facebook.github.io/react-native/docs/network#using-fetch }
 */

import { FileSystem as fs } from 'expo';
import config from './config';
import {
  errorHandler as eh,
  fetch2,
  wait
} from './utility';

// 建立本地端絕對路徑
const makeUri = path =>
  fs.documentDirectory + path
;

// 確認檔案是否存在
const exists = path =>
  fs.getInfoAsync(makeUri(path))
  .then(info => info.exists)
;

// 讀檔
const read = path =>
  fs.readAsStringAsync(makeUri(path))
;

// 從 CDN 下載檔案並存於同樣的路徑。
const download = path =>
  fs.downloadAsync(config.cdn + path, makeUri(path))
;

// 確認遠端的資料版本
export const remoteUpdateDate = () =>
  fetch2(config.cdn + 'UpdateDate.txt').then(res => res.text())
  .catch(reason => {eh(reason); return '';})
;

/**
 * UpdateDate.txt 和 index.json 要一起處理。
 */
export const localUpdateDate = () =>
  exists('UpdateDate.txt')
  .then(async fileExists => {
    if(!fileExists) await updateIndex();
    return read('UpdateDate.txt');
  })
;

let lawIndex = [];
export const getIndex = () =>
  lawIndex.length
  ? Promise.resolve(lawIndex)
  : exists('index.json')
    .then(async fileExists => {
      if(!fileExists) await updateIndex();
      return lawIndex = await read('index.json').then(JSON.parse);
    })
;
export const getIndexSync = () => lawIndex; // TODO: not a good solution

export const updateIndex = () =>
  Promise.all([
    download('index.json'),
    download('UpdateDate.txt'),
    exists('FalVMingLing').then(dirExists => {
      if(!dirExists) return fs.makeDirectoryAsync(makeUri('FalVMingLing'))
    })
  ]).then(async () => {
    lawIndex = await read('index.json').then(JSON.parse);
  });
;

/**
 * 抓取單一法律資料
 */
export const getLaw = pcode =>
  exists(`FalVMingLing/${pcode}.json`)
  .then(async fileExists => {
    if(!fileExists) await updateLaw(pcode);
    let law = await read(`FalVMingLing/${pcode}.json`).then(JSON.parse);

    // 如果既存檔案不夠新，那就更新。
    if(fileExists) {
      const lastUpdate = (await getIndex()).find(lawInfo => lawInfo.pcode === law.pcode).lastUpdate;
      if(law.lastUpdate < lastUpdate) {
        await updateLaw(pcode);
        law = await read(`FalVMingLing/${pcode}.json`).then(JSON.parse);

        // 如果單一法規的更新日期竟然比 UpdateDate.txt 還要新，那就表示 index.json 也該更新了。
        const indexUpdateDate = await localUpdateDate();
        if(law.lastUpdate > indexUpdateDate) updateIndex();
      }
    }

    return law;
  })
;

export const updateLaw = pcode =>
  download(`FalVMingLing/${pcode}.json`)
;


/**
 * 更新所有資料
 * @param {function} callback 每當有更新進度時就呼叫一次的函式
 */
/*export const updateAll = async (callback = () => {}) => {
  // 只下載需要更新的法規
  await updateIndex();
  await getIndex().then(async lawList => {
    const status = {
      amount: lawList.length,
      updated: 0, // 當法規重新下載後，加一。
      skip: 0 // 當法規不須重新下載時，加一。
    };
    callback(status);
    for(let i = 0; i < lawList.length; ++i) {
      const pcode = lawList[i].pcode;
      const path = `FalVMingLing/${pcode}.json`;
      const fileExists = await exists(path);

      let needDownload = !fileExists;
      if(fileExists) {
        const current = await getLaw(pcode);
        if(current.lastUpdate !== lawList[i].lastUpdate)
          needDownload = true;
      }

      if(needDownload) {
        await updateLaw(pcode);
        status.updated++;
      }
      else status.skip++;
      callback(status);
    }
  });
  return;
};*/

export default LawAPI = {
  remoteUpdateDate, localUpdateDate,
  getIndex, updateIndex, getIndexSync,
  getLaw, updateLaw
  //,updateAll
};
