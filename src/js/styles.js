import { StyleSheet } from 'react-native';
import {Constants} from 'expo';

export default styles = StyleSheet.create({
  container: {
    padding: 8,
    flex: 1
  },
  none: {
    display: 'none'
  },
  headerRight: {
    flexDirection: 'row'
  },
  icon: {
    marginHorizontal: 8
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
  divisionHeader: {
    backgroundColor: '#ccc',
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  divisionHeaderPart: {
    marginEnd: 12,
    alignItems: 'flex-start'
  },
  divisionHeaderNumber: {
  },
  divisionHeaderTitle: {
    fontSize: 20,
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
  settingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc'
  },
  settingText: {
    flex: 1
  },
  settingDescription: {
    fontSize: 12,
    color: 'gray'
  },
  settingValue: {
    flex: 0
  },

  settingUpdate: {
    marginTop: 20
  },
  settingUpdateTitle: {
    fontSize: 16
  }
});
