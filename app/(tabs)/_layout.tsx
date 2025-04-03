import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import DashboardScreen from './index';
import ListScreen from './list';
import LoginScreen from './login';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const tabIcons: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  Dashboard: "dashboard",
  Tickets: "assignment",
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          const iconName = tabIcons[route.name] || "help-outline";
          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        headerShown: true,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Tickets" component={ListScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const checkLogin = async () => {
      const userType = await AsyncStorage.getItem("userType");
      setIsLoggedIn(!!userType);
    };
    checkLogin();
  }, []);

  if (isLoggedIn === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen name="MainTabs" component={MainTabs} />
    </Stack.Navigator>
  );
  
}
