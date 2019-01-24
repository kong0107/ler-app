import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default class HeaderRight extends React.Component {
  render() {
    const search = this.props.navigation.getParam('search');
    return (
      <View style={styles.headerRight}>
        <Ionicons style={[styles.icon, search || styles.none]}
          size={32}
          name="md-search"
          onPress={search}
        />
        <Ionicons style={styles.icon}
          size={32}
          name="md-settings"
          onPress={() => this.props.navigation.navigate('Setting')}
        />
      </View>
    );
  }
}
