import React from 'react';
import {
  View,
  Text,
  Switch
} from 'react-native';
import config from '../js/config';
import styles from '../js/styles';

export default class SettingScreen extends React.Component {
  static navigationOptions = {
    title: '選項'
  };

  constructor(props) {
    super(props);
    this.state = {
    };
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.optionContainer}>
          <Text>句讀換行</Text>
          <Switch
            value={true}
            onValueChange={() => {}}
          />
        </View>
      </View>
    );
  }
}
