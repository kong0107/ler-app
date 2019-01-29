import React, {
  PureComponent
} from 'react';
import {
  View,
  ScrollView,
  Text,
  TextInput,
  Slider
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
 * 但若一次渲染格式化後的全部條文，又太沒效率，所以：
 * 1. 批次渲染後存起來（而非每次要顯示時才渲染）
 * 2. 用 setInterval 每次渲染少量條文就好（如10條）
 */
export default class LawScreen extends PureComponent {
  static navigationOptions = ({navigation}) =>({
    title: navigation.getParam('title', '讀取中')
  });

  constructor(props) {
    super(props);
    this.constructedTime = Date.now();
    this.renderSomeArticles = this.renderSomeArticles.bind(this);
    this.state = {
      catalog: [],
      law: {
        articles: [],
        divisions: [],
        flatDivisions: []
      },
      query: '',
      searchInputVisibility: false
    };

    // 設定按了 headerRight 的搜尋鈕時要做的事：顯示搜尋框
    this.props.navigation.setParams({
      search: () => {
        if(!this.refSearchInput) return;
        this.setState({
          searchInputVisibility: true
        });
        this.refSearchInput.focus();
      }
    });

    // 讀取資料並先處理一部分（因為 this.state 還未必可用）
    this.pCatalog = LawAPI.loadCatalog()
      .then(catalog => catalog.sort((a, b) => b.name.length - a.name.length));

    const pcode = this.props.navigation.getParam('pcode', 'B0000001');//'A0030154');//'H0080067');
    this.pLaw = LawAPI.loadLaw(pcode).then(law => {
      console.log(`Load JSON file after ${Date.now() - this.constructedTime} ms`);
      this.props.navigation.setParams({title: law.title});
      law.articles.forEach(article =>
        article.arranged = lawtext2obj(article.content)
      );

      /**
       * 編章節結構樹只留下葉子，方便讓 sticky 機制運作。
       * 例： [
       *  {a},
       *  {b, children: [{c}, {d}]},
       *  {e}
       * ]
       * 轉換後： [
       *  {a},
       *  {c, ancestors: [{b}]},
       *  {d, ancestors: [{b}]},
       *  {e}
       * ]
       */
      const flatDivisions = law.divisions.slice();
      for(let i = 0; i < flatDivisions.length;) {
        const div = flatDivisions[i];
        if(div.children) {
          // 如果有孩子，那就告訴孩子們祖先有誰，然後把自己替換成孩子們。索引值不變。
          const ancestors = div.ancestors || [];
          div.children.forEach(subDiv => subDiv.ancestors = [...ancestors, div]);
          flatDivisions.splice(i, 1, ...div.children);
        }
        else {
          // 如果沒有孩子，那就做出 React Element ，然後處理下一位。
          div.element = <DivisionHeader division={div} key={div.type + div.start} />;
          ++i;
        }
      }
      law.flatDivisions = flatDivisions;

      return law;
    });
  }

  componentDidMount() {

    // 讀取資料並處理
    Promise.all([
      this.pCatalog,
      this.pLaw,
      Settings.get('wrapArticleItemByPunctuation')
    ])
    .then(([catalog, law, wrap]) => {
      law.preambleElement = law.preamble &&
        <Article key="0"
          article={{
            number: 0,
            content: law.preamble,
            arranged: [{text: law.preamble}]
          }}
          navigation={this.props.navigation}
          catalog={catalog}
          wrap={wrap}
        />
      ;
      this.setState({catalog, law, wrap});
    });
  }

  /**
   * 渲染一些條文
   * @param {*} size 要渲染的條文數目
   * @returns {number} 實際渲染的條文數目
   */
  renderSomeArticles(size = 1) {
    const {law, wrap} = this.state;
    const start = law.articles.findIndex(a => !a.element); // 找到第一個還沒被渲染的
    if(start === -1) return 0;

    const end = Math.min(start + size, law.articles.length); // 每次渲染的條文數
    for(let i = start; i < end; ++i) {
      const target = law.articles[i];
      target.element = (
        <Article key={target.number.toString()}
          article={target}
          navigation={this.props.navigation}
          catalog={this.state.catalog}
          wrap={wrap}
        />
      );
    }
    this.setState({law: {...law}});
    return end - start;
  }

  componentDidUpdate() {
    const articles = this.state.law.articles;
    if(articles.length && !articles[0].element) {
      // 先渲染要先顯示的
      this.renderSomeArticles(10);

      // 接著非同步地渲染法條le
      const timer = setInterval(() => {
        const size = this.renderSomeArticles(50);
        if(!size) {
          clearInterval(timer);
          console.log(`rendered ${articles.length} articles in ${Date.now() - this.constructedTime} ms.`);
        }
      }, 200); // 每次渲染的間隔
    }
  }

  render() {
    const {law} = this.state;
    const testFunc = createFilterFunction(this.state.query);

    // 整理出要顯示哪些條文（包含前言）
    const stickyHeaderIndices = [];
    const showingItems = law.articles.filter(a => testFunc(a.content) && a.element);
    if(law.preamble && testFunc(law.preamble))
      showingItems.unshift(law.preambleElement);

    // 列表中要顯示的所有東西（包含編章節標頭）
    const showing = showingItems.slice();

    // 把編章節塞進去
    law.flatDivisions.forEach(div => {
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

    const children = showing.map(item => item.element);
    const showSlider = showingItems.length > 1 && law.articles.every(a => a.element);

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
          children={children}
        />
        <Slider
          style={showSlider || styles.none}
          step={1}
          minimumValue={0}
          maximumValue={showingItems.length - 1}
          onValueChange={index => {
            const target = showingItems[index];
            if(!target || !target.layout) return; // 測試時發現有可能滑超過範圍，或 onLayout 還沒好
            let offset = target.layout.y;

            // 如果有 sticky 的編章節標頭，要扣掉其高度，不然條文會被蓋到。
            const div = law.flatDivisions.find(div => div.start <= target.number && div.end >= target.number);
            if(div) offset -= div.layout.height;

            this.refScrollView.scrollTo({y: offset});
          }}
        />
      </View>
    );
  }
}


class DivisionHeader extends React.PureComponent {
  renderPart(division) {
    if(!division.title) return null;
    return (
      <View style={styles.divisionHeaderPart}
        key={division.type + division.start}
        onLayout={event => division.layout = event.nativeEvent.layout}
      >
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
      <View style={styles.article}
        onLayout={event => article.layout = event.nativeEvent.layout}
      >
        <Text style={styles.articleNumber}>
          {article.number ? `第 ${numf(article.number)} 條` : '前言'}
        </Text>
        { false
          ? <Text>{article.content}</Text>
          : <ParaList {...this.props} items={article.arranged} />
        }
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

    //return <Text style={styles.articleItemText}>{text}</Text>;

    const frags = [text];
    let counter = 0;

    // 在提及其他法律的地方切斷
    this.props.catalog.forEach(law => {
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

        const numberedText = match[0].replace(/[一二三四五六七八九十百千]+/g, cn => ` ${cpi(cn)} `);

        frags.splice(i, 1,
          frags[i].substring(0, match.index),
          <Text key={counter++} style={{color: 'green'}}
            onPress={() => console.log(ranges)}
          >{numberedText}</Text>,
          frags[i].substring(match.index + match[0].length)
        );
        ++i;
      }
    }

    return <Text style={styles.articleItemText}>{frags}</Text>;
  }
}
