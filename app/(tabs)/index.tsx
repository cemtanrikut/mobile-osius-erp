import React from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, StatusBar, Platform, SafeAreaView } from 'react-native';
import { VictoryLine, VictoryBar, VictoryPie } from "victory-native";
import Svg from "react-native-svg";
import { MaterialIcons } from "@expo/vector-icons";

const screenWidth = Dimensions.get('window').width;



export default function DashboardScreen() {
  // const AppBar = () => (
  //   <SafeAreaView style={styles.appBarContainer}>
  //     <View style={styles.appBar}>
  //       <Text style={styles.appBarTitle}>Dashboard</Text>
  //     </View>
  //   </SafeAreaView>
  // );

  const taskCompletionData = [
    { day: 'Mon', tasks: 3 },
    { day: 'Tue', tasks: 5 },
    { day: 'Wed', tasks: 7 },
    { day: 'Thu', tasks: 4 },
    { day: 'Fri', tasks: 6 },
  ];

  const taskStatusData = [
    { status: 'To Do', count: 5 },
    { status: 'In Progress', count: 3 },
    { status: 'Done', count: 7 },
  ];

  const taskTypeData = [
    { x: 'Vraag', y: 4 },
    { x: 'Klacht', y: 3 },
    { x: 'Comentaar', y: 5 },
    { x: 'Complimenten', y: 2 },
  ];

  return (
    <View style={styles.container}>
      {/* <AppBar /> */}
      <ScrollView style={styles.container}>

        {/* Pasta Grafiği */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>📊 Ticket Status</Text>
            <VictoryPie
              data={taskTypeData}
              colorScale={['#007AFF', '#FF3B30', '#FF9F43', '#32CD32']}
              labels={({ datum }) => `${datum.x}: ${datum.y}%`}
            />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f4f4f4', 
    padding: 0, 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginVertical: 10 
  },
  chartContainer: { 
    backgroundColor: 'white', 
    borderRadius: 10, 
    padding: 15, 
    marginBottom: 15, 
    elevation: 3 
  },
  chartTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 10, 
    textAlign: 'center' 
  },

  // // 🎯 **Dynamic Island için AYARLANMIŞ AppBar**
  // appBarContainer: { 
  //   backgroundColor: '#007AFF', 
  //   paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 30, 
  //   paddingBottom: 10, 
  //   width: '100%', 
  // },
  // appBar: { 
  //   flexDirection: 'row', 
  //   justifyContent: 'space-between', // 🔥 Sola hizalamak için
  //   alignItems: 'center', 
  //   paddingVertical: 15, 
  //   paddingHorizontal: 20, // 🎯 Kenar boşlukları eşitlemek için
  //   width: '100%', 
  // },
  // appBarTitle: { 
  //   color: 'white', 
  //   fontSize: 18, 
  //   fontWeight: 'bold',
  //   textAlign: 'left',  // 🎯 Solda hizalama
  // },
});


