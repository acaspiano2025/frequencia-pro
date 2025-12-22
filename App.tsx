import 'react-native-gesture-handler';
import * as WebBrowser from 'expo-web-browser';

import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { UserProvider } from './src/contexts/UserContext';
import RootNavigator from './src/navigation/RootNavigator';

WebBrowser.maybeCompleteAuthSession();

export default function App() {
  return (
    <SafeAreaProvider>
      <UserProvider>
        <NavigationContainer>
          <RootNavigator />
          <StatusBar style="light" />
        </NavigationContainer>
      </UserProvider>
    </SafeAreaProvider>
  );
}
