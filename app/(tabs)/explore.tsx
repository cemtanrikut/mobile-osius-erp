import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import DraggableFlatList from 'react-native-draggable-flatlist';

type Task = { id: string; title: string; columnId: string };
type Column = { id: string; title: string };

const initialColumns: Column[] = [
  { id: 'todo', title: 'To Do' },
  { id: 'inProgress', title: 'In Progress' },
  { id: 'done', title: 'Done' }
];

const initialTasks: Task[] = [
  { id: '1', title: 'Task 1', columnId: 'todo' },
  { id: '2', title: 'Task 2', columnId: 'todo' },
  { id: '3', title: 'Task 3', columnId: 'inProgress' },
  { id: '4', title: 'Task 4', columnId: 'done' }
];

const TicketsScreen = () => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const renderItem = ({ item, drag, isActive }: { 
    item: Task; 
    drag: () => void; 
    isActive: boolean; 
  }) => (
    <Pressable onLongPress={drag} style={[styles.card, isActive && styles.activeCard]}>
      <Text style={styles.cardText}>{item.title}</Text>
    </Pressable>
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.board}>
        {initialColumns.map((column, columnIndex) => (
          <View key={column.id} style={styles.column}>
            <Text style={styles.columnTitle}>{column.title}</Text>
            <DraggableFlatList
              data={tasks.filter(task => task.columnId === column.id)} // Sütuna göre filtrele
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              onDragEnd={({ data, from, to }) => {
                const movedTask = data[to];
                const newColumnIndex = Math.min(Math.max(Math.round((to / data.length) * initialColumns.length), 0), initialColumns.length - 1);
                const newColumnId = initialColumns[newColumnIndex].id;

                setTasks(prevTasks =>
                  prevTasks.map(task =>
                    task.id === movedTask.id ? { ...task, columnId: newColumnId } : task
                  )
                );
              }}
            />
          </View>
        ))}
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#f4f4f4' },
  board: { flexDirection: 'row', justifyContent: 'space-between' },
  column: { flex: 1, margin: 5, backgroundColor: '#fff', borderRadius: 10, padding: 10 },
  columnTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  card: { padding: 15, marginBottom: 10, backgroundColor: '#ddd', borderRadius: 5 },
  activeCard: { backgroundColor: '#ccc' },
  cardText: { fontSize: 14 },
});

export default TicketsScreen;
