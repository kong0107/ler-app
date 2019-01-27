import React, {
  PureComponent
} from 'react';
import {
  View,
  Text,
  Switch,
  Button
} from 'react-native';

import LawAPI from '../js/LawAPI';
import Settings from '../js/Settings';
import { errorHandler as eh } from '../js/utility';

import styles from '../js/styles';

/**
 *
 */
export default class SettingScreen extends PureComponent {
  static navigationOptions = {
    title: '設定',
    headerRight: null
  };

  constructor(props) {
    super(props);
    this.state = {
      updateProgress: '',
      updateButtonText: '檢查更新中',
      updateButtonDisabled: true
    };
    this.updateLawIndex = this.updateLawIndex.bind(this);
  }

  componentWillMount() {
    Promise.all([
      Settings.load(),
      LawAPI.loadRemoteUpdateDate(),
      LawAPI.loadLocalUpdateDate()
    ]).then(([settings, remoteUpdateDate, localUpdateDate]) => {
      const updatable = (remoteUpdateDate > localUpdateDate);
      this.setState({
        ...settings,
        remoteUpdateDate,
        localUpdateDate,
        updateButtonText: (updatable ? '更新至' : '已是最新列表').concat(' ', remoteUpdateDate),
        updateButtonDisabled: false//!updatable
      });
    }).catch(eh);
  }

  setSetting(key, value) {
    const state = {};
    state[key] = value;
    Settings.set(key, value)
    .then(() => this.setState(state))
    .catch(eh);
  }

  updateLawIndex() {
    this.setState({
      updateButtonText: '更新中',
      updateButtonDisabled: true
    });
    LawAPI.updateCatalog()
    .then(LawAPI.loadLocalUpdateDate)
    .then(ud => this.setState({
      localUpdateDate: ud,
      remoteUpdateDate: ud,
      updateButtonText: `已更新至 ${ud}`
    }));
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.settingContainer}>
          <View style={styles.settingText}>
            <Text style={styles.settingName}>在斷句處換行</Text>
            <Text style={styles.settingDescription}>在句號、分號、冒號處換行，以利閱讀。</Text>
          </View>
          <View style={styles.settingValue}>
            <Switch
              value={this.state.wrapArticleItemByPunctuation}
              onValueChange={newValue =>
                this.setSetting('wrapArticleItemByPunctuation', newValue)
              }
            />
          </View>
        </View>
        {/*<View style={styles.settingContainer}>
          <View style={styles.settingText}>
            <Text style={styles.settingName}>自動更新資料</Text>
            <Text style={styles.settingDescription}>
              即使關閉自動更新，仍會在瀏覽未下載的法規時自動下載。
            </Text>
          </View>
          <View style={styles.settingValue}>
            <Switch
              value={this.state.wrapArticleItemByPunctuation}
              onValueChange={newValue =>
                this.setSetting('wrapArticleItemByPunctuation', newValue)
              }
            />
          </View>
        </View>*/}

        <View style={styles.settingUpdate}>
          <Text style={styles.settingUpdateTitle}>法規列表</Text>
          <Text>僅包含法規的基本資料（名稱與更新日期），但不包含法規內文。</Text>
          <Button
            title={this.state.updateButtonText}
            disabled={this.state.updateButtonDisabled}
            onPress={this.updateLawIndex}
          />
        </View>
      </View>
    );
  }
}
