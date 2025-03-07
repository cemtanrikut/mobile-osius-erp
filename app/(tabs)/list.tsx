import React, { useState, useEffect, useRef } from "react";
import { Image } from "react-native";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, Button, TextInput } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useNavigation } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import * as WebBrowser from "expo-web-browser";


// Task için TypeScript tipi belirliyoruz
type Task = {
  id: string;
  code: string;
  title: string;
  description: string;
  assignedTo: string;
  date: string;
  location: string;
  file?: { name: string; uri: string; type: string } | null; // ✅ Artık nesne olabilir
  isNew: boolean;
};

// Task listesini güncelliyoruz
const initialTasks: Record<"todo" | "inProgress" | "done", Task[]> = {
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
  const navigation = useNavigation();
  const [selectedTab, setSelectedTab] = useState<"todo" | "inProgress" | "done">("todo");
  const [tasks, setTasks] = useState(initialTasks);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const messagesEndRef = useRef<FlatList>(null);  // 📌 FlatList için referans oluşturduk
  const [imagePreview, setImagePreview] = useState<string | null>(null);


  // Yeni ticket için state değişkenleri
    const [newTitle, setNewTitle] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [newAssignedTo, setNewAssignedTo] = useState("");
    const [newDate, setNewDate] = useState("");
    const [newFile, setNewFile] = useState<{ name: string; uri: string; type: string } | null>(null);
    const [newLocation, setNewLocation] = useState("");

    // 🎯 **Bugünün Tarihini Al ve Değiştirilemez Yap**
    useEffect(() => {
        const today = new Date();
        const formattedDate = today.toLocaleDateString("en-GB"); // "DD-MM-YYYY" formatında
        setNewDate(formattedDate);
    }, []);

      // 📂 **Dosya Seçme Fonksiyonu**
      const pickDocument = async () => {
        try {
          const result = await DocumentPicker.getDocumentAsync({});
      
          if (result.canceled) {
            console.log("User cancelled file picker");
            return;
          }
      
          if (result.assets && result.assets.length > 0) {
            setNewFile({
              name: result.assets[0].name,
              uri: result.assets[0].uri,
              type: result.assets[0].mimeType || "unknown",
            });
          }
          
        } catch (error) {
          console.error("Dosya seçme hatası:", error);
        }
      };
      


    const closeAddModal = () => {
        setAddModalVisible(false);
        setNewTitle("");
        setNewDescription("");
        setNewAssignedTo("");
        setNewDate("");
        setNewLocation("");
        setNewFile(null);
      };

    const addNewTicket = () => {
        if (!newTitle || !newDescription || !newAssignedTo || !newDate || !newLocation) {
          Toast.show({
            type: "error",
            text1: "Missing Fields!",
            text2: "Please fill all fields before adding a ticket.",
          });
          return;
        }
      
        // Yeni task objesini oluştur
        const newTask: Task = {
          id: Date.now().toString(), // Benzersiz ID oluştur
          code: `#T-${Math.floor(Math.random() * 900) + 100}`, // Random Task Kodu
          title: newTitle,
          description: newDescription,
          assignedTo: newAssignedTo,
          date: newDate,
          location: newLocation,
          file: newFile ? { ...newFile } : null,
          isNew: true,
        };
      
        // Seçili kategoriye göre **EN ÜSTE EKLEMEK** için değişiklik yaptık (başa ekleme)
        setTasks((prevTasks) => ({
            ...prevTasks,
            [selectedTab]: [newTask, ...prevTasks[selectedTab]], // **En üste ekleme**
        }));
      
        // Toast mesajı göster
        Toast.show({
          type: "success",
          text1: "Task Added!",
          text2: `"${newTitle}" added to ${selectedTab}.`,
        });
      
        // Modal'ı kapat ve inputları temizle
        closeAddModal();
        setNewTitle("");
        setNewDescription("");
        setNewAssignedTo("");
        setNewDate("");
        setNewLocation("");
      };

  const openAddModal = () => {
    setAddModalVisible(true);
  };

//   const closeAddModal = () => {
//     setAddModalVisible(false);
//   };

  const openModal = (task: Task) => {
    setSelectedTask(task);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedTask(null);
  };

  const moveTask = (newStatus: "todo" | "inProgress" | "done") => {
    if (!selectedTask) return;

    setTasks((prevTasks) => {
      const updatedTasks = { ...prevTasks };

      // Eski konumdan kaldır
      updatedTasks[selectedTab] = updatedTasks[selectedTab].filter(task => task.id !== selectedTask.id);
      // Yeni konuma ekle
      updatedTasks[newStatus] = [...updatedTasks[newStatus], selectedTask];

      return updatedTasks;
    });

    // **Başarı mesajı göstermek için Toast ekliyoruz**
    Toast.show({
        type: "success",
        text1: "Task Moved!",
        text2: `${selectedTask.title} moved to ${newStatus}`,
        position: "bottom",
        visibilityTime: 3000, // 3 saniye sonra kapanacak
      });

    closeModal();
  };

  const [messages, setMessages] = useState<Record<string, { text: string; sender: string; time: string }[]>>({});
  const [newMessage, setNewMessage] = useState("");

  const pickDocumentMsg = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({});
    
      if (result.canceled) {
        console.log("User cancelled file picker");
        return;
      }
    
      if (result.assets && result.assets.length > 0 && selectedTask) {
        const pickedFile = {
          name: result.assets[0].name,
          uri: result.assets[0].uri,
          type: result.assets[0].mimeType || "unknown",
        };
  
        const fileMessage = {
          text: "", // Eğer sadece dosya gönderiliyorsa, metin boş kalabilir
          sender: "You",
          time: new Date().toLocaleTimeString(),
          file: pickedFile,
        };
  
        setMessages((prev) => ({
          ...prev,
          [selectedTask.id]: [...(prev[selectedTask.id] || []), fileMessage],
        }));
      }
    } catch (error) {
      console.error("Dosya seçme hatası:", error);
    }
  };
  

  const sendMessage = () => {
    if (!newMessage.trim() && !newFile) return; // Eğer mesaj veya dosya yoksa, gönderme
  
    if (!selectedTask) return;
  
    const newMsg = {
      text: newMessage || "", // Eğer sadece dosya gönderiliyorsa, text boş olabilir
      sender: "You",
      time: new Date().toLocaleTimeString(),
      file: newFile ? { ...newFile } : null, // Dosya varsa ekleyelim
    };
  
    setMessages((prev) => ({
      ...prev,
      [selectedTask.id]: [...(prev[selectedTask.id] || []), newMsg],
    }));
  
    setNewMessage("");
    setNewFile(null); // Dosya eklediysek sıfırlayalım
  };
  

  const openFile = async (uri: string, type: string) => {
    if (type.startsWith("image/")) {
      setImagePreview(uri); // 📂 Resimleri modal içinde göstereceğiz
    } else {
      await WebBrowser.openBrowserAsync(uri); // 📜 PDF ve diğer dosyalar için
    }
  };
  

  useEffect(() => {
    if (modalVisible && messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollToEnd({ animated: true });
      }, 100); // Biraz gecikme vererek düzgün çalışmasını sağlıyoruz
    }
  }, [modalVisible, messages]);
  
  
  

  // **+ Butonunu Expo AppBar'a ekledik**
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={openAddModal} style={{ marginRight: 15 }}>
          <MaterialIcons name="add" size={28} color="black" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  return (
    <View style={styles.container}>
       {/* Başlık ve + Butonu */}
      {/* <View style={styles.header}>
        <Text style={styles.headerTitle}>List</Text>
        <TouchableOpacity onPress={openAddModal} style={styles.addButton}>
          <MaterialIcons name="add" size={28} color="white" />
        </TouchableOpacity>
      </View> */}
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
        data={tasks[selectedTab]}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => openModal(item)}>
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
          </TouchableOpacity>
        )}
      />

      {/* 📌 **Task Detay Modalı (Tam Ekran) + Mesajlaşma Alanı** */}
<Modal visible={modalVisible} transparent animationType="slide">
  <View style={styles.fullScreenModal}>
    <View style={styles.fullScreenHeader}>
      <Text style={styles.fullScreenTitle}>{selectedTask?.title}</Text>
      <TouchableOpacity onPress={closeModal}>
        <MaterialIcons name="close" size={30} color="white" />
      </TouchableOpacity>
    </View>

    <View style={styles.fullScreenContent}>
      {selectedTask && (
        <>
          <Text style={styles.modalDescription}>{selectedTask.description}</Text>
          <Text style={styles.modalMeta}>📍 {selectedTask.location} | 👤 {selectedTask.assignedTo} | 📅 {selectedTask.date}</Text>

          {/* 🎯 **Durum Değiştirme Butonları** */}
          {selectedTab === "todo" && (
            <TouchableOpacity style={[styles.moveButton, styles.orangeButton]} onPress={() => moveTask("inProgress")}>
              <Text style={styles.moveButtonText}>Move to In Progress</Text>
            </TouchableOpacity>
          )}

          {selectedTab === "inProgress" && (
            <>
              <TouchableOpacity style={[styles.moveButton, styles.blueButton]} onPress={() => moveTask("todo")}>
                <Text style={styles.moveButtonText}>Move to To Do</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.moveButton, styles.greenButton]} onPress={() => moveTask("done")}>
                <Text style={styles.moveButtonText}>Move to Done</Text>
              </TouchableOpacity>
            </>
          )}

          {selectedTab === "done" && (
            <TouchableOpacity style={[styles.moveButton, styles.orangeButton]} onPress={() => moveTask("inProgress")}>
              <Text style={styles.moveButtonText}>Move to In Progress</Text>
            </TouchableOpacity>
          )}

          {/* 🟢 **Mesajlaşma Alanı** */}
          <View style={styles.messagesContainer}>
            <Text style={styles.messagesTitle}>Messages</Text>
            <FlatList
                ref={messagesEndRef}
                data={messages[selectedTask.id] || []}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                    <View style={[styles.messageBubble, item.sender === "You" ? styles.sentMessage : styles.receivedMessage]}>
                    <Text style={styles.messageSender}>{item.sender}</Text>
                    
                    {item.text && <Text style={styles.messageText}>{item.text}</Text>}

                    {/* 🎯 Dosya Önizlemesi */}
                    {item.file && (
                        <TouchableOpacity onPress={() => openFile(item.file.uri, item.file.type)}>
                        {item.file.type.startsWith("image/") ? (
                            <Image source={{ uri: item.file.uri }} style={styles.imagePreview} />
                        ) : (
                            <View style={styles.filePreview}>
                            <MaterialIcons name="attach-file" size={24} color="black" />
                            <Text>{item.file.name}</Text>
                            </View>
                        )}
                        </TouchableOpacity>
                    )}

                    <Text style={styles.messageTime}>{item.time}</Text>
                    </View>
                )}
                />

          </View>
        </>
      )}
    </View>

    {/* 🟢 **Mesaj Gönderme Alanı** */}
    <View style={styles.inputContainer}>
      <TouchableOpacity onPress={pickDocumentMsg} style={styles.attachButton}>
        <MaterialIcons name="attach-file" size={24} color="#007AFF" />
      </TouchableOpacity>
      <TextInput
        style={styles.messageInput}
        placeholder="Type a message..."
        value={newMessage}
        onChangeText={setNewMessage}
      />
      <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
        <MaterialIcons name="send" size={24} color="white" />
      </TouchableOpacity>
    </View>
  </View>
</Modal>

<Modal visible={!!imagePreview} transparent animationType="fade">
  <View style={styles.fullscreenModal}>
    <TouchableOpacity onPress={() => setImagePreview(null)} style={styles.closeButton}>
      <MaterialIcons name="close" size={24} color="white" />
    </TouchableOpacity>
    {imagePreview && (
      <Image source={{ uri: imagePreview }} style={styles.fullscreenImage} />
    )}
  </View>
</Modal>


    
      {/* Yeni Ticket Ekleme Modalı */}
        <Modal visible={addModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
            <TouchableOpacity onPress={closeAddModal} style={styles.closeButton}>
                <MaterialIcons name="close" size={24} color="black" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add New Ticket</Text>

            {/* Kullanıcıdan giriş alacağımız alanlar */}
            <TextInput
                placeholder="Title"
                style={styles.input}
                value={newTitle}
                onChangeText={setNewTitle}
            />
            <TextInput
                placeholder="Description"
                style={styles.input}
                value={newDescription}
                onChangeText={setNewDescription}
                multiline
            />
            <TextInput
                placeholder="Assigned To"
                style={styles.input}
                value={newAssignedTo}
                onChangeText={setNewAssignedTo}
            />
            
            {/* 🎯 **Tarih Alanı (Değiştirilemez) ** */}
            <TextInput placeholder="Date" style={[styles.input, styles.disabledInput]} value={newDate} editable={false} />

            {/* 📂 **Dosya Seçme Butonu** */}
            <TouchableOpacity style={[styles.moveButton, styles.blueButton]} onPress={pickDocument}>
              <Text style={styles.moveButtonText}>📄 Upload a File</Text>
            </TouchableOpacity>
            {newFile && <Text style={styles.selectedFile}>📄 {newFile.name}</Text>}

            <TextInput
                placeholder="Location"
                style={styles.input}
                value={newLocation}
                onChangeText={setNewLocation}
            />

            {/* Ticket ekleme butonu */}
            <TouchableOpacity style={[styles.moveButton, styles.greenButton]} onPress={addNewTicket}>
                <Text style={styles.moveButtonText}>Add Ticket</Text>
            </TouchableOpacity>
            </View>
        </View>
        </Modal>

      {/* Toast Message */}
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f4f4" },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 15, backgroundColor: "#007AFF" },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "white" },
  addButton: { padding: 5, backgroundColor: "#005BBB", borderRadius: 5 },

  filterContainer: { flexDirection: "row", justifyContent: "space-around", padding: 10, backgroundColor: "white" },
  filterButton: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 20, backgroundColor: "#ddd" },
  filterText: { fontSize: 14, fontWeight: "bold", color: "#333" },
  selected: { backgroundColor: "#007AFF" },
  selectedText: { color: "white" },
  taskItem: { flexDirection: "row", alignItems: "center", backgroundColor: "white", padding: 15, marginVertical: 5, borderRadius: 8 },
  taskInfo: { flex: 1 },
  taskCode: { fontSize: 14, fontWeight: "bold", color: "#007AFF", marginBottom: 3 },
  taskTitle: { fontSize: 16, fontWeight: "bold" },
  taskDescription: { fontSize: 14, color: "#666" },
  taskMeta: { fontSize: 12, color: "#999", marginTop: 5 },
  newBadge: { position: "absolute", top: 5, right: 5, backgroundColor: "red", paddingVertical: 2, paddingHorizontal: 8, borderRadius: 10 },
  newBadgeText: { color: "white", fontSize: 10, fontWeight: "bold" },
  badge: { position: "absolute", top: -5, right: -10, backgroundColor: "red", width: 20, height: 20, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  badgeText: { color: "white", fontSize: 12, fontWeight: "bold" },
  
  // Modal Stilleri
  modalContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalContent: { width: "80%", backgroundColor: "white", padding: 20, borderRadius: 10 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  modalDescription: { fontSize: 14, color: "#666", marginBottom: 10 },
  modalMeta: { fontSize: 12, color: "#999", marginBottom: 20 },

//   addButton: { position: "absolute", top: 10, right: 15, zIndex: 10 },
  closeButton: { position: "absolute", top: 10, right: 10 },

  input: { borderWidth: 1, borderColor: "#ddd", padding: 10, marginVertical: 5, width: "100%", borderRadius: 5 },

  moveButton: { padding: 10, borderRadius: 5, alignItems: "center", marginTop: 10 },
  moveButtonText: { color: "white", fontSize: 14, fontWeight: "bold" },
  
  orangeButton: { backgroundColor: "#FFA500" },
  blueButton: { backgroundColor: "#007AFF" },
  greenButton: { backgroundColor: "#32CD32" },

  disabledInput: { backgroundColor: "#e0e0e0", color: "#666" },
  selectedFile: { marginTop: 5, fontSize: 14, color: "#333" },

  // Messages area
  fullScreenModal: { flex: 1, backgroundColor: "white" },
  fullScreenHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 15, backgroundColor: "#007AFF" },
  fullScreenTitle: { fontSize: 20, fontWeight: "bold", color: "white" },
  fullScreenContent: { flex: 1, padding: 15 },
  messagesContainer: { flex: 1, backgroundColor: "#F4F4F4", borderRadius: 10, padding: 10, marginTop: 20 },
  messagesTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
  messageBubble: { padding: 8, borderRadius: 10, marginVertical: 4 },
  sentMessage: { alignSelf: "flex-end", backgroundColor: "#007AFF", padding: 10, borderRadius: 10 },
  receivedMessage: { alignSelf: "flex-start", backgroundColor: "#E5E5EA", padding: 10, borderRadius: 10 },
  messageSender: { fontSize: 12, fontWeight: "bold", color: "#fff", marginBottom: 2 },
  messageText: { fontSize: 14, color: "#fff" },
  messageTime: { fontSize: 10, color: "#ccc", marginTop: 2, alignSelf: "flex-end" },
  inputContainer: { flexDirection: "row", alignItems: "center", padding: 10, backgroundColor: "white", borderTopWidth: 1, borderColor: "#ddd" },
  attachButton: { padding: 10 },
  messageInput: { flex: 1, borderWidth: 1, borderColor: "#ddd", padding: 10, borderRadius: 5, marginHorizontal: 10 },
  sendButton: { backgroundColor: "#007AFF", padding: 10, borderRadius: 5 },

  imagePreview: {
    width: 150,
    height: 100,
    borderRadius: 8,
    marginTop: 5,
  },
  
  filePreview: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#eee",
    borderRadius: 5,
    marginTop: 5,
  },
  
  fullscreenModal: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  
  fullscreenImage: {
    width: "90%",
    height: "80%",
    resizeMode: "contain",
  },

});
