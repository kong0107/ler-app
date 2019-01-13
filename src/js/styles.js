import { StyleSheet } from 'react-native';
import {Constants} from 'expo';

export default styles = StyleSheet.create({
  container: {
    padding: 8
  },

  // Home
  searchInput: {
    margin: 4
  },
  lawListItem: {
    padding: 4,
    margin: 4
  },
  lawListItemName: {
    fontSize: 20
  },
  LawListItemDate: {
    fontSize: 10
  },

  // Law
  lawTitle: {
    fontSize: 20
  },
  article: {
    padding: 4,
    marginBottom: 2,
    borderBottomWidth: 1
  },
  articleNumber: {
    fontWeight: 'bold'
  },
  articleItem: {
    marginBottom: 8,
    flexDirection: 'row'
  },
  articleItemOrdinal: {
    flex: 0,
    paddingRight: 4,
    lineHeight: 25
  },
  articleItemOrdinal0: {
    minWidth: 25,
    textAlign: 'center'
  },
  articleItemContent: {
    flex: 1
  },
  articleItemText: {
    lineHeight: 25
  },

  // Setting
  optionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  }
});
