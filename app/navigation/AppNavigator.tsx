import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/LoginScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">  {/* 👈 LoginScreen'i başlangıç olarak ayarlıyoruz */}
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ title: 'Giriş Yap' }}  
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
