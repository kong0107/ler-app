import React from 'react';
import {
  View,
  ScrollView,
  Text,
  TextInput,
  FlatList,
  //Share
} from 'react-native';

import styles from '../js/styles';
import {
  numf,
  romanize,
  createFilterFunction
} from '../js/utility';
const lawtext2obj = require('../js/lawtext2obj');

import LawAPI from '../js/LawAPI';
import OptionButton from './OptionButton';


export default class LawScreen extends React.Component {
  static navigationOptions = ({navigation}) =>({
    title: navigation.getParam('title', ''),
    headerRight: <OptionButton navigation={navigation} />
  });

  constructor(props) {
    super(props);
    this.state = {
      pcode: '',
      law: {
        division: [],
        articles: []
      },
      query: ''
    };
  }

  componentDidMount() {
    const pcode = this.props.navigation.getParam('pcode', 'H0080067');
    this.setState({pcode});
    if(!pcode) return;
    LawAPI.getLaw(pcode).then(law => {
      this.props.navigation.setParams({title: law.title});
      law.articles.forEach(article =>
        article.arranged = lawtext2obj(article.content)
      );
      this.setState({law});
    });
  }

  render() {
    const {query, law} = this.state;
    const testFunc = createFilterFunction(query);
    return (
      <View style={styles.container}>
        <ScrollView>
          <TextInput style={styles.searchInput}
            placeholder="搜尋"
            onChangeText={query => this.setState({query})}
          />
          <View>
            <Text>{law.pcode}</Text>
            <Text>{law.lastUpdate}</Text>
          </View>
          <Text>{law.preamble}</Text>
          <FlatList
            data={law.articles.filter(article => testFunc(article.content))}
            keyExtractor={article => article.number.toString()}
            renderItem={({item: article}) => <Article law={law} article={article} />}
            ListEmptyComponent={<Text>讀取中</Text>}
          />
        </ScrollView>
      </View>
    );
  }
}

class Article extends React.Component {
  /*constructor(props) {
    super(props);
    this.share = this.share.bind(this);
  }

  share() {
    const law = this.props.law;
    const article = this.props.article;
    const numText = numf(article.number);
    const title = law.title + ` 第 ${numText} 條`;
    Share.share({
      message: article.content,
      title: title,
      url: `https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=${law.pcode}&flno=${numText}`
    }, {
      subject: title,
      dialogTitle: title
    });
  }*/

  render() {
    const article = this.props.article;
    return (
      <View style={styles.article}>
        <Text style={styles.articleNumber}>第 {numf(article.number)} 條</Text>
        <ParaList items={article.arranged} />
      </View>
    );
  }
}

class ParaList extends React.Component {
  render() {
    const list = this.props.items.map((item, index) => {
      let ordinal = '?', text = item.text;
      if(!item.stratum) {
        if(this.props.items.length === 1) ordinal = '';
        else ordinal = romanize(index + 1);
      }
      else {
        const match = text.match(/^[第（()]?[\d一二三四五六七八九十]+(類：|[)）、\.])?\s*/);
        if(match) {
          ordinal = match[0].trim();
          text = text.substring(match[0].length);
        }
      }
      text = text.replace(/([，；：。])/g, '$1\n').trim();

      return (
        <View key={index} style={styles.articleItem}>
          <Text style={[styles.articleItemOrdinal, styles[`articleItemOrdinal${item.stratum}`]]}>{ordinal}</Text>
          <View style={styles.articleItemContent}>
            <Text style={styles.articleItemText}>{text}</Text>
            {item.children && item.children.length ? <ParaList items={item.children} /> : null}
          </View>
        </View>
      );
    });
    return <View>{list}</View>;
  }
}
