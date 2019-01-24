import React from 'react';
import {
  createStackNavigator,
  createAppContainer
} from 'react-navigation';

import HomeScreen from './HomeScreen';
import LawScreen from './LawScreen';
import SettingScreen from './SettingScreen';
import HeaderRight from './HeaderRight';

export default createAppContainer(
  createStackNavigator(
    {
      Home: HomeScreen,
      Law: LawScreen,
      Setting: SettingScreen
    },
    {
      initialRouteName: 'Home',
      defaultNavigationOptions: ({navigation}) => ({
        headerRight: <HeaderRight navigation={navigation} />
      })
    }
  )
);
