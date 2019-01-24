import React from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  SectionList
} from 'react-native';

import styles from '../js/styles';
import {
  numf,
  romanize,
  createFilterFunction
} from '../js/utility';
const lawtext2obj = require('../js/lawtext2obj');

import Settings from '../js/Settings';
import LawAPI from '../js/LawAPI';

export default class LawScreen extends React.Component {
  static navigationOptions = ({navigation}) =>({
    title: navigation.getParam('title', '')
  });

  constructor(props) {
    super(props);
    this.state = {
      pcode: '',
      law: {
        divisions: [],
        articles: []
      },
      query: '',
      searchInputVisibility: false
    };
    this.showSearchInput = this.showSearchInput.bind(this);
  }

  /**
   * 顯示搜尋框
   */
  showSearchInput() {
    const ref = this.refSearchInput;
    if(!ref) return;
    this.setState({
      searchInputVisibility: true
    })
    ref.focus();
  }

  componentDidMount() {
    const pcode = this.props.navigation.getParam('pcode', 'B0000001');//'H0080067');
    this.setState({pcode});
    if(!pcode) return;
    Promise.all([
      LawAPI.getLaw(pcode),
      Settings.get('wrapArticleItemByPunctuation')
    ])
    .then(([law, wrapArticleItemByPunctuation]) => {
      this.props.navigation.setParams({title: law.title});
      law.articles.forEach(article =>
        article.arranged = lawtext2obj(article.content)
      );
      this.setState({law, wrapArticleItemByPunctuation});
    });

    // 設定按了 headerRight 的搜尋鈕時要做的事：顯示搜尋框
    this.props.navigation.setParams({search: this.showSearchInput});
  }

  render() {
    const {query, law} = this.state;
    const testFunc = createFilterFunction(query);
    return (
      <View style={styles.container}>
        <TextInput style={[styles.searchInput, this.state.searchInputVisibility || styles.none]}
          ref={ins => this.refSearchInput = ins}
          placeholder="搜尋"
          onChangeText={query => this.setState({query})}
        />
        <View style={{flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between'}}>
          <Text>{law.pcode}</Text>
          <Text>{law.lastUpdate}</Text>
        </View>
        <SectionList style={styles.lawContent}
          sections={makeSections(law.divisions, law.articles.filter(article => testFunc(article.content)))}
          renderSectionHeader={({section}) => <DivisionHeader division={section} />}
          renderItem={({item}) => <Article article={item} wrap={this.state.wrapArticleItemByPunctuation} />}
          keyExtractor={article => article.number.toString()}
          stickySectionHeadersEnabled={true}
        />
      </View>
    );
  }
}


/**
 * 把巢狀編章節扁平化，然後弄成 SectionList 方便用的樣子。
 * 概要：只留下最底層的編章節，並追加 ancestors 屬性來記錄其祖先們。
 * 方法：把陣列底層中有子區塊的編章節，「替換」為其子區塊。
 * 例： [
 *  {a},
 *  {b, children: [{c}, {d}, {e}]},
 *  {f}
 * ]
 * 轉換後： [
 *  {a},
 *  {c, ancestors: [{b}]},
 *  {d, ancestors: [{b}]},
 *  {e, ancestors: [{b}]},
 *  {f}
 * ]
 *
 * 最後僅回傳內有條文的區塊，這是為了在搜尋法條時，略去顯示不需要的編章節。
 */
const makeSections = (divisions, articles) => {
  if(!divisions.length) return [{data: articles}];

  const result = divisions.slice();
  for(let i = 0; i < result.length;) {
    const section = result[i];
    if(section.children) {
      const ancestors = section.ancestors || [];
      section.children.forEach(subDiv => subDiv.ancestors = [...ancestors, section]);
      result.splice(i, 1, ...section.children);
    }
    else {
      section.data = articles.filter(a => a.number >= section.start && a.number <= section.end);
      ++i;
    }
  }
  return result.filter(section => section.data.length);
};


class DivisionHeader extends React.Component {
  renderPart(division) {
    if(!division.title) return null;
    return (
      <View style={styles.divisionHeaderPart}>
        <Text style={styles.divisionHeaderNumber}>第 {numf(division.number)} {division.type}</Text>
        <Text style={styles.divisionHeaderTitle}>{division.title}</Text>
      </View>
    );
  }

  render() {
    const division = this.props.division;
    return (
      <View style={styles.divisionHeader}>
        <FlatList style={styles.divisionHeaderAncestors}
          data={division.ancestors}
          renderItem={({item}) => this.renderPart(item)}
          keyExtractor={div => div.type + div.start}
        />
        {this.renderPart(division)}
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
        <ParaList items={article.arranged} wrap={this.props.wrap} />
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
      if(this.props.wrap)
        text = text.replace(/([；：。])/g, '$1\n').trim();

      return (
        <View key={index} style={styles.articleItem}>
          <Text style={[styles.articleItemOrdinal, styles[`articleItemOrdinal${item.stratum}`]]}>{ordinal}</Text>
          <View style={styles.articleItemContent}>
            <Text style={styles.articleItemText}>{text}</Text>
            {item.children && item.children.length ? <ParaList items={item.children} wrap={this.props.wrap} /> : null}
          </View>
        </View>
      );
    });
    return <View>{list}</View>;
  }
}
