import React from 'react';
import {
  View,
  ScrollView,
  Text,
  FlatList,
  Share,
  Button
} from 'react-native';
import config from '../js/config';
import styles from '../js/styles';
import {numf} from '../js/utility';
const lawtext2obj = require('../js/lawtext2obj');


export default class LawScreen extends React.Component {
  static navigationOptions = ({ navigation }) => {
    return {
      title: navigation.getParam('title', ''),
      headerRight: (
        <Button
          title='回首頁'
          onPress={() => navigation.navigate('Home')}
        />
      )
    };
  };

  constructor(props) {
    super(props);
    this.state = {
      pcode: '',
      law: {
        division: [],
        articles: []
      }
    };
  }

  componentDidMount() {
    const pcode = this.props.navigation.getParam('pcode', '');
    this.setState({pcode});
    if(!pcode) return;
    fetch(`${config.cdn}/FalVMingLing/${pcode}.json`)
    .then(res => res.json())
    .then(law => {
      this.props.navigation.setParams({title: law.title});
      law.articles.forEach(article =>
        article.arranged = lawtext2obj(article.content)
      );
      this.setState({law});
    });
  }

  render() {
    const law = this.state.law;
    return (
      <View style={styles.container}>
        <ScrollView>
          <Text>{law.preamble}</Text>
          <FlatList
            data={law.articles}
            keyExtractor={article => article.number.toString()}
            renderItem={({item: article}) => <Article law={law} article={article} />}
          />
        </ScrollView>
      </View>
    );
  }
}

class Article extends React.Component {
  constructor(props) {
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
  }

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
    const list = this.props.items.map((item, index) =>
      <View key={index} style={styles.articleItem}>
        <Text style={styles.articleItemText}>{item.text}</Text>
        {item.children && item.children.length ? <ParaList items={item.children} /> : null}
      </View>
    );
    return <View>{list}</View>;
  }
}
