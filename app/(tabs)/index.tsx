import React from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, StatusBar, Platform, SafeAreaView, TouchableOpacity } from 'react-native';
import { VictoryLine, VictoryBar, VictoryPie } from "victory-native";
import Svg from "react-native-svg";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const screenWidth = Dimensions.get('window').width;

export default function DashboardScreen() {
  const navigation = useNavigation();  // 📌 Navigasyon hook'u

  // Task verileri (Örnek)
  const totalTickets = 8;
  const toDoTickets = 5;
  const inProgressTickets = 1;
  const doneTickets = 2;

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
  
  
  // 📌 **Navigasyon Fonksiyonu**
  const navigateToList = (status: "todo" | "inProgress" | "done") => {
    // navigation.navigate("ListScreen", { selectedTab: status });
  };

  return (
    <View style={styles.container}>
      {/* <AppBar /> */}
      <ScrollView style={styles.container}>
        {/* 📌 **İstatistik Kartları** */}
        <View style={styles.statsContainer}>
          <TouchableOpacity style={styles.statCard} onPress={() => navigateToList("todo")}>
            <Text style={styles.statNumber}>{totalTickets}</Text>
            <Text style={styles.statLabel}>Total Tickets</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statCard} onPress={() => navigateToList("todo")}>
          <Text style={styles.statNumber}>{toDoTickets}</Text>
          <Text style={styles.statLabel}>To Do</Text>
          </TouchableOpacity>
        <TouchableOpacity style={styles.statCard} onPress={() => navigateToList("inProgress")}>
          <Text style={styles.statNumber}>{inProgressTickets}</Text>
          <Text style={styles.statLabel}>In Progress</Text>
          </TouchableOpacity>
        <TouchableOpacity style={styles.statCard} onPress={() => navigateToList("done")}>
          <Text style={styles.statNumber}>{doneTickets}</Text>
          <Text style={styles.statLabel}>Done</Text>
          </TouchableOpacity>
    </View>

        {/* Pasta Grafiği */ }
  <View style={styles.chartContainer}>
    <Text style={styles.chartTitle}>📊 Ticket Status</Text>
    <VictoryPie
      data={taskTypeData}
      colorScale={['#007AFF', '#FF3B30', '#FF9F43', '#32CD32']}
      labels={({ datum }) => `${datum.x}: ${datum.y}%`}
    />
  </View>
      </ScrollView >
    </View >
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

  // 🎯 **İstatistik Kartları**
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 15,
    paddingHorizontal: 10,
  },
  statCard: {
    backgroundColor: '#EAEAEA',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    minWidth: screenWidth * 0.22,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
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


