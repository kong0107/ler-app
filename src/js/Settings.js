/**
 * 注意：
 * * config.defaultSettings 不要設計成巢狀，不然 Object.assign 會出錯
 * * AsyncStorage 都是存成字串，所以所有資料讀寫時一律要過 JSON.parse 或 JSON.stringify 。
 */

import {AsyncStorage} from 'react-native';
import config from '../js/config';

export const load = () =>
  AsyncStorage.multiGet(Object.keys(config.defaultSettings))
  .then(keyValuePairs =>
    keyValuePairs.reduce((acc, cur) => {
      const [key, value] = cur;
      if(value !== null) acc[key] = JSON.parse(value);
      return acc;
    }, Object.assign({}, config.defaultSettings))
  )
;

export const get = (key) =>
  AsyncStorage.getItem(key)
  .then(value =>
    (value !== null) ? JSON.parse(value) : config.defaultSettings[key]
  )
;

export const set = (key, value) =>
  AsyncStorage.setItem(key, JSON.stringify(value))
;

export default Settings = {load, get, set};
