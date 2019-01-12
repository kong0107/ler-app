import React from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList
} from 'react-native';
import config from '../js/config';
import styles from '../js/styles';

export default class HomeScreen extends React.Component {
  static navigationOptions = {
    title: '法規亦毒氣',
  };

  constructor(props) {
    super(props);
    this.state = {
      laws: [],
      query: ''
    };
  }

  componentDidMount() {
    fetch(`${config.cdn}/index.json`)
    .then(res => res.json())
    .then(laws => this.setState({laws}));
  }

  render() {
    const {query: q, laws} = this.state;
    const matchedLaw = q ? laws.filter(law => law.name.indexOf(q) !== -1) : laws;
    matchedLaw.sort((a, b) => b.lastUpdate - a.lastUpdate);
    return (
      <View style={styles.container}>
        <TextInput style={styles.searchInput}
          placeholder="搜尋"
          onChangeText={query => this.setState({query})}
        />
        <FlatList
          data={matchedLaw}
          keyExtractor={law => law.PCode}
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
        <Text
          style={styles.lawListItemName}
          onPress={() => this.props.navigation.navigate('Law', {pcode: law.PCode})}
        >{law.name}</Text>
        <Text style={styles.lawListItemDate}>{law.lastUpdate}</Text>
      </View>
    );
  }
}
