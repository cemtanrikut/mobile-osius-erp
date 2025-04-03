import React, { useEffect, useState, useLayoutEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, StatusBar, Platform, SafeAreaView, TouchableOpacity } from 'react-native';
import { VictoryLine, VictoryBar, VictoryPie } from "victory-native";
import Svg from "react-native-svg";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, NavigationProp, StackActions } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LoginScreen from './login';

const screenWidth = Dimensions.get('window').width;

export type RootStackParamList = {
  LoginScreen: undefined;
  MainTabs: undefined;
};


export default function DashboardScreen() {
  // const navigation = useNavigation();  // 📌 Navigasyon hook'u
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [totalTickets, setTotalTickets] = useState(0);
  const [toDoTickets, setToDoTickets] = useState(0);
  const [inProgressTickets, setInProgressTickets] = useState(0);
  const [doneTickets, setDoneTickets] = useState(0);
  const [notificationChartData, setNotificationChartData] = useState<{ x: string; y: number }[]>([]);

  const notificationTypes = {
    Complimenten: "bg-green-300 text-green-800",
    Comentaar: "bg-blue-300 text-blue-800",
    Vraag: "bg-yellow-300 text-yellow-800",
    Klacht: "bg-red-300 text-red-800",
    Melding: "bg-gray-300 text-gray-800",
    "Extra Werk": "bg-purple-300 text-purple-800",
    Ongegrond: "bg-orange-300 text-orange-800",
    Unknown: "bg-slate-300 text-gray-700", // 🆕 bilinmeyen veya boş değerler için
  };

  useEffect(() => {
    const fetchName = async () => {
      try {
        const name = await AsyncStorage.getItem("name");
        console.log("✅ Kullanıcı Adı:", name);
      } catch (error) {
        console.error("❌ Hata:", error);
      }
    };

    fetchName();
  }, []);

  //Logout
  const [userName, setUserName] = useState("");
  const [showMenu, setShowMenu] = useState(false);

  useLayoutEffect(() => {
    const loadUser = async () => {
      const name = await AsyncStorage.getItem("name");
      if (name) setUserName(name);
    };
    loadUser();

    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginRight: 12 }}>
          <TouchableOpacity
            style={styles.userButton}
            onPress={() => setShowMenu(!showMenu)}
          >
            <MaterialIcons name="person" size={18} color="#fff" />
            <Text style={styles.userName}>{userName}</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, userName, showMenu]);

  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  const handleLogout = async () => {
    await AsyncStorage.clear();
    // Bu logout sonrası App.tsx'teki isLoggedIn kontrolünü tetikleyecek
    // @ts-ignore
    navigation.replace("LoginScreen");
  };
  




  // Ticket sayilari
  useEffect(() => {
    const fetchTicketStats = async () => {
      try {
        const response = await fetch("https://api-osius.up.railway.app/tickets");
        const data = await response.json();

        // ❗️ Sadece silinmemiş ticketlar (deletedAt değeri boş olanlar)
        const activeTickets = data.filter((t: any) => !t.DeletedAt || t.DeletedAt === "");
        console.log("🔍 notificationType gelen:", JSON.stringify(activeTickets));


        const total = activeTickets.length;
        const todo = activeTickets.filter((t: any) => t.status === "ToDo").length;
        const inProgress = activeTickets.filter((t: any) => t.status === "inProgress").length;
        const done = activeTickets.filter((t: any) => t.status === "done").length;

        setTotalTickets(total);
        setToDoTickets(todo);
        setInProgressTickets(inProgress);
        setDoneTickets(done);
      } catch (error) {
        console.error("❌ Dashboard verileri çekilemedi:", error);
      }
    };

    fetchTicketStats();
  }, []);


  // Chart Degerleri
  useEffect(() => {
    const fetchTicketStats = async () => {
      try {
        const response = await fetch("https://api-osius.up.railway.app/tickets");
        const data = await response.json();

        const total = data.length || 1;

        // Bildirim tiplerine göre gruplama
        const counts: Record<string, number> = {};

        data.forEach((ticket: any) => {
          const type = ticket.notificationType || "Unknown";
          console.log("🔍 notificationType gelen:", JSON.stringify(ticket.notificationType));

          counts[type] = (counts[type] || 0) + 1;
        });

        // VictoryPie için data dönüştür
        const chartData = Object.entries(counts).map(([type, count]) => ({
          x: type,
          y: Math.round((count / total) * 100),
        }));

        setNotificationChartData(chartData);
      } catch (error) {
        console.error("❌ Bildirim tipi verileri çekilemedi:", error);
      }
    };

    fetchTicketStats();
  }, []);

  // 📌 **Navigasyon Fonksiyonu**
  const navigateToList = (status: "todo" | "inProgress" | "done") => {
    // navigation.navigate("ListScreen", { selectedTab: status });
  };

  return (
    <View style={styles.container}>
      {/* <AppBar /> */}
      {showMenu && (
        <View style={styles.logoutMenu}>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <MaterialIcons name="logout" size={18} color="#FF3B30" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      )}

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

        {/* Pasta Grafiği */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>📊 Ticket Notification Types</Text>
          <VictoryPie
            data={notificationChartData}
            labels={({ datum }) => `${datum.x}: ${datum.y}%`}
            padding={{ top: 20, bottom: 40, left: 60, right: 60 }}
            colorScale={[
              "#4ADE80", // Complimenten
              "#60A5FA", // Comentaar
              "#FACC15", // Vraag
              "#F87171", // Klacht
              "#D1D5DB", // Melding
              "#C084FC", // Extra Werk
              "#FDBA74", // Ongegrond
              "#94A3B8", // Bilinmiyor
            ]}
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
    margin: 10,
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
  userButton: {
    flexDirection: "row",
    backgroundColor: "#007AFF",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignItems: "center",
  },
  userName: {
    color: "#fff",
    marginLeft: 6,
    fontWeight: "600",
  },
  logoutMenu: {
    position: "absolute",
    right: 20,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    zIndex: 999,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoutText: {
    color: "#FF3B30",
    marginLeft: 6,
    fontWeight: "bold",
  },
});


