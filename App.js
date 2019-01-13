import {
  createStackNavigator,
  createAppContainer
} from 'react-navigation';
import HomeScreen from './src/components/HomeScreen';
import LawScreen from './src/components/LawScreen';
import SettingScreen from './src/components/SettingScreen';

export default createAppContainer(
  createStackNavigator(
    {
      Home: HomeScreen,
      Law: LawScreen,
      Setting: SettingScreen
    },
    {
      initialRouteName: 'Setting'
    }
  )
);
