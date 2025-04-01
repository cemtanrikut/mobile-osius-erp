import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from "@react-navigation/stack";
import { MaterialIcons } from '@expo/vector-icons';
import DashboardScreen from './index';
import TicketsScreen from './explore';
import ListScreen from './list';

const Tab = createBottomTabNavigator();

const tabIcons: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  Dashboard: "dashboard",
  Tickets: "assignment",
  List: "format-list-bulleted",
};

export type RootStackParamList = {
  DashboardScreen: undefined;
  ListScreen: { selectedTab: "todo" | "inProgress" | "done" };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          const iconName = tabIcons[route.name] || "help-outline";
          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        // Pure appbar gozuksun / gozukmesin
        headerShown: true,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      {/* <Tab.Screen name="Tickets" component={TicketsScreen} /> */}
      <Tab.Screen name="Tickets" component={ListScreen} />
    </Tab.Navigator>
  );
}
