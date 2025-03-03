import React, { useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, StatusBar, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";

const initialTasks = {
  todo: [
    { id: "1", code: "#T-001", title: "Design Login Page", description: "Create a login page UI", assignedTo: "Cem Tanrikut", date: "28-02-2025", location: "Amsterdam", isNew: false },
    { id: "2", code: "#T-002", title: "Fix Authentication Bug", description: "Debug login issues", assignedTo: "Ramazan", date: "28-02-2025", location: "Rotterdam", isNew: false },
    { id: "3", code: "#T-003", title: "Setup Database", description: "Configure MongoDB instance", assignedTo: "Abdullah Soyaslan", date: "27-02-2025", location: "Utrecht", isNew: false },
  ],
  inProgress: [
    { id: "4", code: "#T-004", title: "API Integration", description: "Connect frontend with backend", assignedTo: "Cem Tanrikut", date: "27-02-2025", location: "The Hague", isNew: true },
    { id: "5", code: "#T-005", title: "Dashboard Charts", description: "Implement analytics dashboard", assignedTo: "Jony Ive", date: "26-02-2025", location: "Eindhoven", isNew: true },
    { id: "6", code: "#T-006", title: "Refactor Codebase", description: "Optimize component structure", assignedTo: "Ramazan", date: "25-02-2025", location: "Groningen", isNew: false },
  ],
  done: [
    { id: "7", code: "#T-007", title: "Create UI Mockups", description: "Design wireframes for app", assignedTo: "Abdullah Soyaslan", date: "24-02-2025", location: "Haarlem", isNew: false },
    { id: "8", code: "#T-008", title: "Implement Dark Mode", description: "Add theme switching", assignedTo: "Cem Tanrikut", date: "23-02-2025", location: "Leiden", isNew: false },
    { id: "9", code: "#T-009", title: "Optimize Queries", description: "Improve database performance", assignedTo: "Jony Ive", date: "22-02-2025", location: "Maastricht", isNew: false },
    { id: "10", code: "#T-010", title: "Deploy to Production", description: "Push latest release", assignedTo: "Abdullah Soyaslan", date: "21-02-2025", location: "Delft", isNew: false },
  ],
};

export default function ListScreen() {
  const [selectedTab, setSelectedTab] = useState<"todo" | "inProgress" | "done">("todo");
  const tasks = initialTasks[selectedTab];

  return (
    <View style={styles.container}>
      {/* Filtre Butonları */}
      <View style={styles.filterContainer}>
        <TouchableOpacity style={[styles.filterButton, selectedTab === "todo" && styles.selected]} onPress={() => setSelectedTab("todo")}>
          <Text style={[styles.filterText, selectedTab === "todo" && styles.selectedText]}>To Do</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.filterButton, selectedTab === "inProgress" && styles.selected]} onPress={() => setSelectedTab("inProgress")}>
          <Text style={[styles.filterText, selectedTab === "inProgress" && styles.selectedText]}>In Progress</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>2</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.filterButton, selectedTab === "done" && styles.selected]} onPress={() => setSelectedTab("done")}>
          <Text style={[styles.filterText, selectedTab === "done" && styles.selectedText]}>Done</Text>
        </TouchableOpacity>
      </View>

      {/* Liste */}
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.taskItem}>
            {item.isNew && <View style={styles.newBadge}><Text style={styles.newBadgeText}>NEW</Text></View>}
            <View style={styles.taskInfo}>
              <Text style={styles.taskCode}>{item.code}</Text>
              <Text style={styles.taskTitle}>{item.title}</Text>
              <Text style={styles.taskDescription}>{item.description}</Text>
              <Text style={styles.taskMeta}>📍 {item.location} | 👤 {item.assignedTo} | 📅 {item.date}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#666" />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f4f4" },
  
  filterContainer: { flexDirection: "row", justifyContent: "space-around", padding: 10, backgroundColor: "white" },

  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: "#ddd",
    position: "relative",
  },
  
  filterText: { fontSize: 14, fontWeight: "bold", color: "#333" },

  selected: { backgroundColor: "#007AFF" },
  selectedText: { color: "white" },

  badge: {
    position: "absolute",
    top: -5,
    right: -10,
    backgroundColor: "red",
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  
  badgeText: { color: "white", fontSize: 12, fontWeight: "bold" },

  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 15,
    marginVertical: 5,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    position: "relative",
  },

  taskInfo: { flex: 1 },

  taskCode: { fontSize: 14, fontWeight: "bold", color: "#007AFF", marginBottom: 3 },
  taskTitle: { fontSize: 16, fontWeight: "bold" },
  taskDescription: { fontSize: 14, color: "#666" },
  taskMeta: { fontSize: 12, color: "#999", marginTop: 5 },

  newBadge: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "red",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
  },

  newBadgeText: { color: "white", fontSize: 10, fontWeight: "bold" },
});
