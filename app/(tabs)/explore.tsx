import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, StatusBar, TouchableOpacity } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;
const columnWidth = screenWidth * 0.8;

const initialColumns = [
  {
    id: 'todo',
    title: 'To Do',
    tasks: [
      { id: "T-001", title: "Add new feature", assignedTo: "Cem Tanrikut", date: "27-02-2025 14:20", type: "Vraag", location: "Utrecht", file: "feature_doc.pdf" },
      { id: "T-002", title: "Bug fix", assignedTo: "Ramazan", date: "26-02-2025", type: "Klacht", location: "Osius Amsterdam Office", file: null }
    ],
    color: '#007AFF'
  },
  {
    id: 'inProgress',
    title: 'In Progress',
    tasks: [
      { id: "T-003", title: "Database integration", assignedTo: "Abdullah Soyaslan", date: "25-02-2025 17:55", type: "Comentaar", location: "Amsterdam", file: "db_schema.png" },
      { id: "T-005", title: "Mobile development with React Native", assignedTo: "Cem Tanrikut", date: "25-02-2025 15:33", type: "Comentaar", location: "Amsterdam", file: "react_native.jsx" }
    ],
    color: '#FFA500'
  },
  {
    id: 'done',
    title: 'Done',
    tasks: [
      { id: "T-004", title: "Update for UI", assignedTo: "Jony Ive", date: "24-02-2025 11:09", type: "Complimenten", location: "Apple, California", file: "design_final.jpg" }
    ],
    color: '#32CD32'
  }
];

const AppBar = () => (
  <SafeAreaView style={styles.appBarContainer}>
    <View style={styles.appBar}>
      <Text style={styles.appBarTitle}>Tickets</Text>
      <TouchableOpacity style={styles.addButton} onPress={() => console.log('Add Task') }>
        <MaterialIcons name="add" size={24} color="white" />
      </TouchableOpacity>
    </View>
  </SafeAreaView>
);

const getTypeColor = (type: string): string => {
  switch (type) {
    case "Vraag": return "#007AFF";
    case "Klacht": return "#FF3B30";
    case "Comentaar": return "#FF9F43";
    case "Complimenten": return "#32CD32";
    default: return "#666";
  }
};

export default function TicketsScreen() {
  const [columns, setColumns] = useState(initialColumns);

  const renderItem = ({ item, drag, index }: { item: any; drag: () => void; index: number }) => (
    <View style={[styles.card, index === 0 ? styles.firstCardSpacing : styles.normalCardSpacing]} onTouchStart={drag}>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardSubtitle}>👤 {item.assignedTo}</Text>
      <Text style={styles.cardDate}>📅 {item.date}</Text>
      <Text style={styles.cardLocation}><MaterialIcons name="location-on" size={16} color="#666" /> {item.location}</Text>
      {item.file && <Text style={styles.cardFile}><MaterialIcons name="attach-file" size={16} color="#666" /> {item.file}</Text>}
      <View style={[styles.typeBadge, { backgroundColor: getTypeColor(item.type) }]}>
        <Text style={styles.typeText}>{item.type}</Text>
      </View>
    </View>
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      <AppBar />
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.scrollView}>
        {columns.map((column, index) => (
          <View key={column.id} style={[styles.column, { marginLeft: index === 0 ? 20 : 0 }]}> 
            <View style={[styles.columnTitleContainer, { backgroundColor: column.color }]}> 
              <Text style={styles.columnTitle}>{column.title}</Text>
            </View>
            <DraggableFlatList
              data={column.tasks}
              renderItem={(props) => renderItem(props)}
              keyExtractor={(item) => item.id}
              onDragEnd={({ data }) => {
                setColumns(prevColumns =>
                  prevColumns.map(col =>
                    col.id === column.id ? { ...col, tasks: [...data] } : col
                  )
                );
              }}
            />
          </View>
        ))}
      </ScrollView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4' },
  appBarContainer: { backgroundColor: '#007AFF', paddingTop: StatusBar.currentHeight || 30 },
  appBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10 },
  appBarTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  addButton: { padding: 8, borderRadius: 20, backgroundColor: '#005BBB' },
  scrollView: { flexGrow: 1 },
  column: { width: columnWidth, marginRight: 20, marginTop: 10, marginBottom: 10, backgroundColor: '#fff', borderRadius: 10, padding: 10 },
  columnTitleContainer: { padding: 10, borderTopLeftRadius: 10, borderTopRightRadius: 10, alignItems: 'center', justifyContent: 'center', width: '100%' },
  columnTitle: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  card: { padding: 15, backgroundColor: '#ffffff', borderRadius: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3, marginBottom: 10 },
  firstCardSpacing: { marginTop: 10, marginBottom: 5 },
  normalCardSpacing: { marginBottom: 5 },
  cardTitle: { fontSize: 16, fontWeight: 'bold' },
  cardSubtitle: { fontSize: 14, color: '#666' },
  cardDate: { fontSize: 12, color: '#666', marginTop: 3 },
  cardLocation: { fontSize: 12, color: '#666', marginTop: 3 },
  cardFile: { fontSize: 12, color: '#666', marginTop: 3 },
  typeBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, alignSelf: 'flex-start', marginTop: 8 },
  typeText: { fontSize: 12, fontWeight: 'bold', color: '#fff' }
});
