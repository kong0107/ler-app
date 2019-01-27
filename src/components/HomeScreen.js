import React, {
  PureComponent
} from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList
} from 'react-native';

import LawAPI from '../js/LawAPI';
import { createFilterFunction } from '../js/utility';

import styles from '../js/styles';

/**
 *
 */
export default class HomeScreen extends PureComponent {
  static navigationOptions = {
    title: '法規亦毒氣'
  };

  constructor(props) {
    super(props);
    this.state = {
      laws: [],
      query: ''
    };
  }

  componentDidMount() {
    LawAPI.loadCatalog()
    .then(laws => this.setState({
      laws: laws.sort((a, b) => b.lastUpdate - a.lastUpdate)
    }));

    // 設定按了 headerRight 的搜尋鈕時要做的事：聚焦到搜尋框
    this.props.navigation.setParams({search: () => {
      if(this.refSearchInput) this.refSearchInput.focus();
    }});
  }

  render() {
    const {query, laws} = this.state;
    const testFunc = createFilterFunction(query);
    return (
      <View style={styles.container}>
        <TextInput style={styles.searchInput}
          ref={ins => this.refSearchInput = ins}
          placeholder="搜尋"
          onChangeText={query => this.setState({query})}
        />
        <FlatList
          data={laws.filter(law => testFunc(law.name))}
          keyExtractor={law => law.pcode}
          renderItem={({item: law}) => <LawListItem law={law} navigation={this.props.navigation} />}
        />
      </View>
    );
  }
}

class LawListItem extends PureComponent {
  render() {
    const law = this.props.law;
    return (
      <View style={styles.lawListItem}>
        <Text style={styles.lawListItemName}
          onPress={() => this.props.navigation.navigate('Law', {pcode: law.pcode})}
        >{law.name}</Text>
        <Text style={styles.lawListItemDate}>{law.lastUpdate}</Text>
      </View>
    );
  }
}
