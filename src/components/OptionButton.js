import React from 'react';
import {Button} from 'react-native';
import config from '../js/config';
import styles from '../js/styles';

export default class OptionButton extends React.Component {
  render() {
    return (
      <Button
        title='選項'
        onPress={() => {this.props.navigation.navigate('Setting')}}
      />
    );
  }
}
