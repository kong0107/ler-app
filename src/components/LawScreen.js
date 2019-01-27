import React, {
  PureComponent
} from 'react';
import {
  View,
  ScrollView,
  Text,
  TextInput
} from 'react-native';
import cpi from 'chinese-parseint';

import LawAPI from '../js/LawAPI';
import Settings from '../js/Settings';
import {
  numf,
  romanize,
  createFilterFunction
} from '../js/utility';
import lawtext2obj from '../js/lawtext2obj';

import styles from '../js/styles';

/**
 * 顯示法律的元件。
 *
 * 因為想要快速跳至民法最後一條，所以不宜用 VirtualizedList （及其衍生的 FlatList 和 SectionList ），而應直接用 ScrollView 。
 * 但若一次渲染格式化後的全部條文，又太沒效率…
 */
export default class LawScreen extends PureComponent {
  static navigationOptions = ({navigation}) =>({
    title: navigation.getParam('title', '讀取中')
  });

  constructor(props) {
    super(props);
    this.state = {
      pcode: '',
      law: {
        divisions: [],
        articles: []
      },
      flatDivisions: [],
      query: '',
      searchInputVisibility: false
    };
    this.showSearchInput = this.showSearchInput.bind(this);
  }

  // 顯示搜尋框
  showSearchInput() {
    if(!this.refSearchInput) return;
    this.setState({
      searchInputVisibility: true
    });
    this.refSearchInput.focus();
  }

  componentDidMount() {
    const pcode = this.props.navigation.getParam('pcode', 'A0030154');//'A0030154');//'H0080067');

    // 設定按了 headerRight 的搜尋鈕時要做的事：顯示搜尋框
    this.props.navigation.setParams({search: this.showSearchInput});

    // 讀取資料並處理
    Promise.all([
      LawAPI.loadLaw(pcode),
      Settings.get('wrapArticleItemByPunctuation')
    ])
    .then(([law, wrap]) => {
      this.props.navigation.setParams({title: law.title});
      law.articles.forEach(article =>
        article.arranged = lawtext2obj(article.content)
      );

      /**
       * 只留下最底層的編章節。
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
       * 考量：
       * sticky 元件不方便相疊。很難同時讓「第一章」和「第一節」都 stick 在父元件頂部。
       * 故改成只留下最底層的編章節，但元素本身保留其祖先資料。
       */
      const flatDivisions = law.divisions.slice();
      for(let i = 0; i < flatDivisions.length;) {
        const div = flatDivisions[i];
        if(div.children) {
          const ancestors = div.ancestors || [];
          div.children.forEach(subDiv => subDiv.ancestors = [...ancestors, div]);
          flatDivisions.splice(i, 1, ...div.children);
        }
        else ++i;
      }

      this.setState({law, wrap, flatDivisions});
    });
  }

  render() {
    const {law} = this.state;
    const testFunc = createFilterFunction(this.state.query);

    // 整理出要顯示哪些條文
    const stickyHeaderIndices = [];
    const showing = law.articles.filter(a => testFunc(a.content));
    if(law.preamble && testFunc(law.preamble))
      showing.unshift({number: 0, arranged: [{text: law.preamble}]});

    // 把編章節塞進去
    this.state.flatDivisions.forEach(div => {
      // 找到第一個屬於這個編章節的條文。
      // 每次都從頭找有點沒效率，但為了在搜尋條文時只顯示必要的編章節，這樣程式碼比較精簡。
      const target = showing.findIndex(artOrDiv =>
        !artOrDiv.type //< 不能是前面塞進來過的編章節
        && artOrDiv.number >= div.start
        && artOrDiv.number <= div.end
      );
      if(target === -1) return;
      showing.splice(target, 0, div);
      stickyHeaderIndices.push(target);
    });

    const children = showing.map(item => item.type
      ? <DivisionHeader division={item} key={item.type + item.start} />
      : <Article article={item} key={item.number.toString()} navigation={this.props.navigation} wrap={this.state.wrap} />
    )

    return (
      <View style={styles.container}>
        <TextInput style={[styles.searchInput, this.state.searchInputVisibility || styles.none]}
          ref={ins => this.refSearchInput = ins}
          placeholder="搜尋"
          onChangeText={query => this.setState({query})}
        />
        <ScrollView
          ref={ins => this.refScrollView = ins}
          stickyHeaderIndices={stickyHeaderIndices}
        >{children}</ScrollView>
      </View>
    );
  }
}


class DivisionHeader extends React.PureComponent {
  renderPart(division) {
    if(!division.title) return null;
    return (
      <View style={styles.divisionHeaderPart} key={division.type + division.start}>
        <Text style={styles.divisionHeaderNumber}>第 {numf(division.number)} {division.type}</Text>
        <Text style={styles.divisionHeaderTitle}>{division.title}</Text>
      </View>
    );
  }

  render() {
    const division = this.props.division;
    const genealogy = (division.ancestors || []).concat(division);
    return (
      <View style={styles.divisionHeader}>
        {genealogy.map(this.renderPart)}
      </View>
    );
  }
}


class Article extends React.PureComponent {
  render() {
    const article = this.props.article;
    return (
      <View style={styles.article}>
        <Text style={styles.articleNumber}>
          {article.number ? `第 ${numf(article.number)} 條` : '前言'}
        </Text>
        <ParaList {...this.props} items={article.arranged} />
      </View>
    );
  }
}

class ParaList extends React.PureComponent {
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
            <ParaListItem {...this.props}>{text}</ParaListItem>
            {item.children && item.children.length ? <ParaList {...this.props} items={item.children} /> : null}
          </View>
        </View>
      );
    });
    return <View>{list}</View>;
  }
}

const reArtNum = /(第[一二三四五六七八九十百千]+[條項類款目](之[一二三四五六七八九十]+)?)+([、及與或至](第([一二三四五六七八九十百千]+)[條項類款目](之[一二三四五六七八九十]+)?)+)*/;
class ParaListItem extends React.PureComponent {
  render() {
    const text = this.props.children;
    if(typeof text !== 'string') return <Text>Error: string expected</Text>;

    return <Text style={styles.articleItemText}>{text}</Text>;

    const frags = [text];
    let counter = 0;

    // 在提及其他法律的地方切斷
    this.lawIndex.forEach(law => {
      for(let i = 0; i < frags.length; ++i) {
        if(typeof frags[i] !== 'string') continue;
        if(frags[i].length < law.name.length) continue;
        const pos = frags[i].indexOf(law.name);
        if(pos === -1) continue;

        // 刪掉原本的，替換成更小的碎片。
        frags.splice(i, 1,
          frags[i].substring(0, pos),
          <Text key={counter++} style={{color: 'blue'}}
            onPress={() => this.props.navigation.push('Law', {pcode: law.pcode})}
          >{law.name}</Text>,
          frags[i].substring(pos + law.name.length)
        );
      }
    });

    // 在提及其他法條的地方切斷
    for(let i = 0; i < frags.length; ++i) {
      if(typeof frags[i] !== 'string') continue;
      const match = reArtNum.exec(frags[i]);
      if(match) {
        const ranges = [];
        /**
         * 分析提到哪些條文
         * 最後如為 [307, 400, [1003, 1100]]
         * 則表示第三條之七、第四條、第十條之三至第十一條
         */
        // 分析提到哪些條文
        match[0].split(/[、及與或]/).forEach(s => {
          const re = /第([一二三四五六七八九十百千]+)條(之([一二三四五六七八九十]+))?/g;
          const mm = re.exec(s), mm2 = re.exec(s);
          if(!mm) return; // 沒有提到任何「條」
          const start = cpi(mm[1]) * 100 + cpi(mm[2] ? mm[3] : 0);
          if(!mm2) return ranges.push(start); // 只有提到一條
          const end = cpi(mm2[1]) * 100 + cpi(mm2[2] ? mm2[3] : 0);
          ranges.push([start, end]); // 提及一個範圍
        });

        frags.splice(i, 1,
          frags[i].substring(0, match.index),
          <Text key={counter++} style={{color: 'green'}}
            onPress={() => console.log(ranges)}
          >{match[0]}</Text>,
          frags[i].substring(match.index + match[0].length)
        );
        ++i;
      }
    }

    return <Text style={styles.articleItemText}>{frags}</Text>;
  }
}
