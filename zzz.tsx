// 🔹 Gerekli importlar
import React, { useEffect, useRef, useState } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, Image, StyleSheet, Modal, ActivityIndicator } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useNavigation } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import * as WebBrowser from "expo-web-browser";

// 🧠 Ticket tipi
type Task = {
    id: string;
    ticketId: string;
    title: string;
    description: string;
    assignedTo: string;
    date: string;
    location: string;
    file?: { name: string; uri: string; type: string } | null;
    isNew: boolean;
    status: "todo" | "inProgress" | "done";
    notificationType: string;
};

// 🧱 Başlangıç görevleri (örnek veriler)
const initialTasks: Record<"todo" | "inProgress" | "done", Task[]> = {
    todo: [],
    inProgress: [],
    done: [],
};

export default function ListScreen() {
    const navigation = useNavigation();

    const [selectedTab, setSelectedTab] = useState<"todo" | "inProgress" | "done">("todo");
    const [tasks, setTasks] = useState(initialTasks);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [newMessage, setNewMessage] = useState("");
    const [messages, setMessages] = useState<Record<string, {
        text: string;
        sender: string;
        time: string;
        file?: { name: string; uri: string; type: string };
    }[]>>({});
    const [ws, setWs] = useState<WebSocket | null>(null);

    // 📦 Ticketları API'den çek
    useEffect(() => {
        const fetchTickets = async () => {
            try {
                const response = await fetch("https://api-osius.up.railway.app/tickets");
                const data = await response.json();

                const convert = (ticket: any): Task => ({
                    id: ticket.id,
                    ticketId: ticket.ticketId,
                    title: ticket.title,
                    description: ticket.description,
                    assignedTo: ticket.Customer || "",
                    date: ticket.date,
                    location: ticket.building || "",
                    file: null,
                    isNew: false,
                    status: ticket.status || "todo",
                    notificationType: ticket.notificationType || "",
                });

                const todo = data.filter((t: any) => t.status === "ToDo").map(convert);
                const inProgress = data.filter((t: any) => t.status === "inProgress").map(convert);
                const done = data.filter((t: any) => t.status === "done").map(convert);

                setTasks({ todo, inProgress, done });
            } catch (error) {
                console.error("Ticket verisi alınamadı", error);
                Toast.show({ type: "error", text1: "Ticketlar yüklenemedi" });
            }
        };

        fetchTickets();
    }, []);

    // 🌐 WebSocket bağlantısı
    useEffect(() => {
        const wsProtocol = "wss";
        const socket = new WebSocket(`${wsProtocol}://api-osius.up.railway.app/ws`);

        socket.onopen = () => {
            console.log("✅ WebSocket bağlı!");
            setWs(socket);
        };

        socket.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            console.log("📩 Gelen mesaj:", msg);

            setMessages((prev) => ({
                ...prev,
                [msg.ticket_id]: [
                    ...(prev[msg.ticket_id] || []),
                    {
                        text: msg.text,
                        sender: msg.sender,
                        time: new Date(msg.created_at).toLocaleTimeString(),
                    },
                ],
            }));
        };

        socket.onerror = (err) => {
            console.error("❌ WS Hatası:", err);
        };

        socket.onclose = () => {
            console.warn("🔌 WS kapandı. Yeniden bağlanıyor...");
            setTimeout(() => {
                setWs(new WebSocket(`${wsProtocol}://api-osius.up.railway.app/ws`));
            }, 3000);
        };

        return () => socket.close();
    }, []);

    // 🟦 Görev detayını gösteren modalı aç
    const openModal = (task: Task) => {
        setSelectedTask(task);
        setModalVisible(true);
    };

    // 🔴 Görev detayını kapat
    const closeModal = () => {
        setModalVisible(false);
        setSelectedTask(null);
    };

    // 🟢 Mesaj gönder
    const sendMessage = () => {
        if (!newMessage.trim() || !selectedTask) return;

        const messageData = {
            ticket_id: selectedTask.id,
            sender: "You",
            text: newMessage,
            created_at: new Date().toISOString(),
        };

        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(messageData));
        } else {
            Toast.show({
                type: "error",
                text1: "Bağlantı Hatası",
                text2: "WebSocket bağlantısı yok.",
            });
            return;
        }

        setMessages((prev) => ({
            ...prev,
            [selectedTask.id]: [
                ...(prev[selectedTask.id] || []),
                {
                    text: messageData.text,
                    sender: messageData.sender,
                    time: new Date(messageData.created_at).toLocaleTimeString(),
                },
            ],
        }));

        setNewMessage("");
    };

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({});
            if (result.canceled || !result.assets || !selectedTask) return;

            const pickedFile = {
                name: result.assets[0].name,
                uri: result.assets[0].uri,
                type: result.assets[0].mimeType || "unknown",
            };

            const message = {
                ticket_id: selectedTask.id,
                sender: "You",
                text: "📂 Sent a file",
                created_at: new Date().toISOString(),
                file: pickedFile,
            };

            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(message));
            } else {
                Toast.show({
                    type: "error",
                    text1: "WebSocket kapalı!",
                    text2: "Dosya gönderilemedi.",
                });
                return;
            }

            setMessages((prev) => ({
                ...prev,
                [selectedTask.id]: [
                    ...(prev[selectedTask.id] || []),
                    {
                        text: message.text,
                        sender: message.sender,
                        time: new Date(message.created_at).toLocaleTimeString(),
                        file: pickedFile,
                    },
                ],
            }));
        } catch (error) {
            console.error("📂 Dosya gönderme hatası:", error);
            Toast.show({
                type: "error",
                text1: "Dosya gönderilemedi",
            });
        }
    };

    const openFile = async (uri: string, type: string) => {
        if (type.startsWith("image/")) {
            // Resimleri önizlemede göstermek istiyorsan burada yap
            // Örn: bir modal açabilirsin
            console.log("Görsel gösterilecek:", uri);
        } else {
            try {
                await WebBrowser.openBrowserAsync(uri);
            } catch (error) {
                console.error("Dosya açılamadı:", error);
            }
        }
    };


    return (
        <View style={styles.container}>
            {/* 🔵 Sekme seçme */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tabButton, selectedTab === "todo" && styles.activeTab]}
                    onPress={() => setSelectedTab("todo")}
                >
                    <Text style={[styles.tabText, selectedTab === "todo" && styles.activeTabText]}>To Do</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabButton, selectedTab === "inProgress" && styles.activeTab]}
                    onPress={() => setSelectedTab("inProgress")}
                >
                    <Text style={[styles.tabText, selectedTab === "inProgress" && styles.activeTabText]}>In Progress</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabButton, selectedTab === "done" && styles.activeTab]}
                    onPress={() => setSelectedTab("done")}
                >
                    <Text style={[styles.tabText, selectedTab === "done" && styles.activeTabText]}>Done</Text>
                </TouchableOpacity>
            </View>

            {/* 📄 Görev Listesi */}
            <FlatList
                data={tasks[selectedTab]}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => openModal(item)} style={styles.taskItem}>
                        <View style={styles.taskInfo}>
                            <Text style={styles.taskTitle}>{item.title}</Text>
                            <Text style={styles.taskMeta}>👤 {item.assignedTo} • 📍 {item.location} • 📅 {item.date}</Text>
                            <Text numberOfLines={2} style={styles.taskDescription}>{item.description}</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color="#888" />
                    </TouchableOpacity>
                )}
            />

            {/* 🟣 Modal: Görev Detayı ve Mesajlar */}
            <Modal visible={modalVisible} animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{selectedTask?.title}</Text>
                        <TouchableOpacity onPress={closeModal}>
                            <MaterialIcons name="close" size={24} color="#000" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.modalDescription}>{selectedTask?.description}</Text>
                    <Text style={styles.modalMeta}>
                        👤 {selectedTask?.assignedTo} • 📍 {selectedTask?.location} • 📅 {selectedTask?.date}
                    </Text>

                    {/* 💬 Mesajlar */}
                    <View style={styles.messageBox}>
                        <FlatList
                            data={messages[selectedTask?.id || ""] || []}
                            keyExtractor={(_, index) => index.toString()}
                            renderItem={({ item }) => (
                                <View style={[
                                    styles.messageBubble,
                                    item.sender === "You" ? styles.sentMessage : styles.receivedMessage
                                ]}>
                                    <Text style={styles.messageSender}>{item.sender}</Text>
                                    <Text style={styles.messageText}>{item.text}</Text>
                                    {item.file?.uri && item.file?.type && (
                                        <TouchableOpacity onPress={() => openFile(item.file!.uri, item.file!.type)}>
                                            {item.file?.type.startsWith("image/") ? (
                                                <Image source={{ uri: item.file!.uri }} style={{ width: 150, height: 100, marginTop: 5, borderRadius: 8 }} />
                                            ) : (
                                                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 5 }}>
                                                    <MaterialIcons name="insert-drive-file" size={20} color="#333" />
                                                    <Text style={{ marginLeft: 5 }}>{item.file!.name}</Text>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    )}
                                    <Text style={styles.messageTime}>{item.time}</Text>
                                </View>
                            )}
                        />
                    </View>

                    {/* 📝 Mesaj Yaz */}
                    <View style={styles.inputArea}>
                        <TouchableOpacity onPress={pickDocument} style={{ marginRight: 8 }}>
                            <MaterialIcons name="attach-file" size={24} color="#007AFF" />
                        </TouchableOpacity>
                        <TextInput
                            style={styles.textInput}
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

            <Toast />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F4F4F4",
        paddingTop: 10,
    },

    // 🔷 Sekmeler
    tabContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginBottom: 10,
        paddingVertical: 10,
        backgroundColor: "#fff",
    },
    tabButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: "#e0e0e0",
    },
    activeTab: {
        backgroundColor: "#007AFF",
    },
    tabText: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#333",
    },
    activeTabText: {
        color: "#fff",
    },

    // 📋 Görevler
    taskItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        marginHorizontal: 10,
        marginBottom: 8,
        padding: 12,
        borderRadius: 10,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 2,
    },
    taskInfo: {
        flex: 1,
        marginRight: 10,
    },
    taskTitle: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 4,
    },
    taskDescription: {
        fontSize: 13,
        color: "#666",
    },
    taskMeta: {
        fontSize: 12,
        color: "#999",
        marginBottom: 4,
    },

    // 🔵 Modal
    modalContainer: {
        flex: 1,
        padding: 16,
        backgroundColor: "white",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
    },
    modalDescription: {
        fontSize: 14,
        color: "#444",
        marginBottom: 8,
    },
    modalMeta: {
        fontSize: 12,
        color: "#888",
        marginBottom: 16,
    },

    // 💬 Mesajlar
    messageBox: {
        flex: 1,
        backgroundColor: "#f1f1f1",
        borderRadius: 8,
        padding: 10,
    },
    messageBubble: {
        marginVertical: 4,
        padding: 10,
        borderRadius: 10,
        maxWidth: "80%",
    },
    sentMessage: {
        backgroundColor: "#007AFF",
        alignSelf: "flex-end",
    },
    receivedMessage: {
        backgroundColor: "#E5E5EA",
        alignSelf: "flex-start",
    },
    messageSender: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#fff",
        marginBottom: 2,
    },
    messageText: {
        fontSize: 14,
        color: "#fff",
    },
    messageTime: {
        fontSize: 10,
        color: "#ccc",
        marginTop: 4,
        alignSelf: "flex-end",
    },

    // 📝 Mesaj yazma alanı
    inputArea: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 10,
        borderTopWidth: 1,
        borderTopColor: "#ccc",
        paddingTop: 8,
    },
    textInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: "#fff",
        marginRight: 8,
    },
    sendButton: {
        backgroundColor: "#007AFF",
        padding: 10,
        borderRadius: 20,
    },
});      