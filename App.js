import {
  createStackNavigator,
  createAppContainer
} from 'react-navigation';
import HomeScreen from './src/components/HomeScreen';
import LawScreen from './src/components/LawScreen';

export default createAppContainer(createStackNavigator(
  {
    Home: HomeScreen,
    Law: LawScreen
  },
  {
      initialRouteName: 'Home'
  }
));
