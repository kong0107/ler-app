import React from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList
} from 'react-native';

import config from '../js/config';
import styles from '../js/styles';
import LawAPI from '../js/LawAPI';
import { createFilterFunction } from '../js/utility';

import OptionButton from './OptionButton';

export default class HomeScreen extends React.Component {
  static navigationOptions = ({navigation}) =>({
    title: '法規亦毒氣',
    headerRight: <OptionButton navigation={navigation} />
  });

  constructor(props) {
    super(props);
    this.state = {
      laws: [],
      query: ''
    };
  }

  componentDidMount() {
    LawAPI.getIndex()
    .then(laws => this.setState({
      laws: laws.sort((a, b) => b.lastUpdate - a.lastUpdate)
    }));
  }

  render() {
    const {query, laws} = this.state;
    const testFunc = createFilterFunction(query);
    return (
      <View style={styles.container}>
        <TextInput style={styles.searchInput}
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

class LawListItem extends React.Component {
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
