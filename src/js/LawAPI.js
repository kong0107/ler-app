import { FileSystem as fs } from 'expo';
import config from './config';
import { fetch2 } from './utility';

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

/**
 * 從 CDN 下載檔案並存於同樣的路徑。
 * 注意 iOS 只允許 SSL 連線。
 * @see {@link https://facebook.github.io/react-native/docs/network#using-fetch }
 */
const download = path =>
  fs.downloadAsync(config.cdn + path, makeUri(path))
;

/**
 * 不給使用者直接存取的變數。
 * 其實應該弄成 private member variable ，不過先這樣吧。
 */
const data = {
  remoteUpdateDate: '',
  localUpdateDate: '',
  catalog: []
};

/**
 * 主程式
 */
const LawAPI = {

  loadCatalog: async () => {
    if(data.catalog.length) return data.catalog;
    const fileExists = await exists('index.json');
    if(!fileExists) await LawAPI.updateCatalog();
    const json = await read('index.json');
    return data.catalog = JSON.parse(json);
  },

  loadRemoteUpdateDate: async () => {
    if(data.remoteUpdateDate) return data.remoteUpdateDate;
    return data.remoteUpdateDate
      = await fetch2(config.cdn + 'UpdateDate.txt').then(res => res.text())
    ;
  },

  loadLocalUpdateDate: async () => {
    if(data.localUpdateDate) return data.localUpdateDate;
    const fileExists = await exists('UpdateDate.txt');
    if(!fileExists) await LawAPI.updateCatalog();
    return data.localUpdateDate = await read('UpdateDate.txt');
  },

  updateCatalog: async () => {
    await Promise.all([
      download('index.json'),
      download('UpdateDate.txt')
    ]);
    const json = await read('index.json');
    return data.catalog = JSON.parse(json);
  },

  loadLaw: async pcode => {
    const path = `FalVMingLing/${pcode}.json`;
    const fileExists = await exists(path);
    if(!fileExists) await LawAPI.updateLaw(pcode);
    let law = await read(path).then(JSON.parse);

    // 如果既存檔案不夠新，那就更新。
    if(fileExists) {
      const catalog = await LawAPI.loadCatalog();
      const knownUpdate = catalog.find(item => item.pcode === law.pcode).lastUpdate;
      if(law.lastUpdate < knownUpdate) {
        await LawAPI.updateLaw(pcode);
        law = await read(path).then(JSON.parse);

        // 如果單一法規的更新日期竟然比 UpdateDate.txt 還要新，那就表示 index.json 也該更新了。
        const catalogUpdateDate = await LawAPI.loadLocalUpdateDate();
        if(law.lastUpdate > catalogUpdateDate) updateCatalog();
      }
    }

    return law;
  },

  updateLaw: pcode => download(`FalVMingLing/${pcode}.json`)

};

LawAPI.ready = Promise.all([
  /*LawAPI.loadCatalog(),
  LawAPI.loadLocalUpdateDate(),
  LawAPI.loadRemoteUpdateDate(),*/
  exists('FalVMingLing').then(dirExists => {
    if(!dirExists) return fs.makeDirectoryAsync(makeUri('FalVMingLing'))
  })
]);

export default LawAPI;
