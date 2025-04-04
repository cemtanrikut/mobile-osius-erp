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
    const messagesEndRef = useRef<FlatList>(null);
    const [ticketFiles, setTicketFiles] = useState<
        { name: string; uri: string; type: string }[]
    >([]);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [descExpanded, setDescExpanded] = useState(false);



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

            const formattedMessage = {
                text: msg.text,
                sender: msg.sender,
                time: new Date(msg.created_at || Date.now()).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: false,
                    timeZone: "Europe/Amsterdam",
                }),
                file: msg.file,
            };

            setMessages((prev) => {
                const ticketId = msg.ticket_id;
                const currentMessages = prev[ticketId] || [];
                return {
                    ...prev,
                    [ticketId]: [...currentMessages, formattedMessage],
                };
            });

            // Eğer açık olan ticket ile aynıysa scroll ve re-render
            if (selectedTask?.ticketId === msg.ticket_id) {
                setTimeout(() => {
                    messagesEndRef.current?.scrollToEnd({ animated: true });
                }, 300);
            }
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


    const fetchMessagesForTicket = async (ticketId: string) => {
        try {
            const response = await fetch(`https://api-osius.up.railway.app/messages/${ticketId}`);
            const data = await response.json();

            // Beklenen format: [{ text, sender, created_at }, ...]
            const formatted = data.map((msg: any) => ({
                text: msg.text,
                sender: msg.sender,
                time: new Date(msg.created_at || Date.now()).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: false, // 24 saat formatı istiyorsan bunu kullan
                    timeZone: "Europe/Amsterdam", // 🔥 burası önemli!
                }),
                file: msg.file || undefined, // dosya varsa ekle
            }));

            setMessages((prev) => ({
                ...prev,
                [ticketId]: formatted,
            }));
        } catch (error) {
            console.error("❌ Eski mesajlar alınamadı:", error);
        }
    };


    // 🟦 Görev detayını gösteren modalı aç
    const openModal = (task: Task) => {
        setSelectedTask(task);
        setModalVisible(true);
        fetchMessagesForTicket(task.ticketId);
        fetchTicketFiles(task.ticketId); // 🔥 Dosyaları getir
    };

    // 🔴 Görev detayını kapat
    const closeModal = () => {
        setModalVisible(false);
        setSelectedTask(null);
    };

    // 🟢 Mesaj gönder
    // const sendMessage = () => {
    //     if (!newMessage.trim() || !selectedTask) return;

    //     const messageData = {
    //         ticket_id: selectedTask.ticketId,
    //         sender: "You",
    //         text: newMessage,
    //         created_at: new Date().toISOString(),
    //     };

    //     if (ws && ws.readyState === WebSocket.OPEN) {
    //         ws.send(JSON.stringify(messageData));
    //     } else {
    //         Toast.show({
    //             type: "error",
    //             text1: "Bağlantı Hatası",
    //             text2: "WebSocket bağlantısı yok.",
    //         });
    //         return;
    //     }

    //     setMessages((prev) => ({
    //         ...prev,
    //         [selectedTask.ticketId]: [
    //             ...(prev[selectedTask.ticketId] || []),
    //             {
    //                 text: messageData.text,
    //                 sender: messageData.sender,
    //                 time: new Date(messageData.created_at || Date.now()).toLocaleTimeString("en-GB", {
    //                     hour: "2-digit",
    //                     minute: "2-digit",
    //                     second: "2-digit",
    //                     hour12: false, // 24 saat formatı istiyorsan bunu kullan
    //                     timeZone: "Europe/Amsterdam", // 🔥 burası önemli!
    //                 }),

    //             },
    //         ],
    //     }));

    //     setNewMessage("");

    //     setTimeout(() => {
    //         messagesEndRef.current?.scrollToEnd({ animated: true });
    //     }, 300);
    // };
    const sendMessage = () => {
        if (!newMessage.trim() || !selectedTask) return;

        const messageData = {
            ticket_id: selectedTask.ticketId, // dikkat! .ticketId olmalı
            sender: "You",
            text: newMessage,
            created_at: new Date().toISOString(),
        };

        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(messageData));
        } else {
            Toast.show({
                type: "error",
                text1: "WebSocket bağlantısı yok",
            });
            return;
        }

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
                        time: new Date(message.created_at || Date.now()).toLocaleTimeString("en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                            hour12: false, // 24 saat formatı istiyorsan bunu kullan
                            timeZone: "Europe/Amsterdam", // 🔥 burası önemli!
                        }),
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

    // En son mesasja odakla
    useEffect(() => {
        if (!modalVisible || !selectedTask?.ticketId) return;

        const ticketId = selectedTask.ticketId;
        const msgList = messages[ticketId];

        if (msgList && msgList.length > 0) {
            setTimeout(() => {
                messagesEndRef.current?.scrollToIndex({
                    index: msgList.length - 1,
                    animated: true,
                });
            }, 300);
        }
    }, [messages, modalVisible, selectedTask?.ticketId]);

    
    // Dosyalari serverdan cek
    const fetchTicketFiles = async (ticketId: string) => {
        try {
          const response = await fetch(`https://api-osius.up.railway.app/tickets/${ticketId}/files`);
          const data = await response.json();
      
          const formatted = data.map((file: any) => {
            let rawUrl = file.fileUrl || file.FileURL || file.url || file.uri || "";
      
            // 🔥 Eğer localhost ile başlıyorsa düzelt
            if (rawUrl.startsWith("http://localhost") || rawUrl.startsWith("https://localhost")) {
              rawUrl = rawUrl.replace("http://localhost:8080", "https://api-osius.up.railway.app");
              rawUrl = rawUrl.replace("https://localhost:8080", "https://api-osius.up.railway.app");
            }
      
            // 🔐 Boşlukları ve özel karakterleri encode et
            const encodedUri = encodeURI(rawUrl);
      
            const name = file?.Filename || file?.name || "Unnamed";
            const type =
              encodedUri.toLowerCase().endsWith(".jpg") ||
              encodedUri.toLowerCase().endsWith(".jpeg") ||
              encodedUri.toLowerCase().endsWith(".png")
                ? "image/jpeg"
                : "application/octet-stream";
      
            return { name, uri: encodedUri, type };
          });
      
          console.log("✅ Yüklenen dosyalar:", formatted);
          setTicketFiles(formatted);
        } catch (err) {
          console.error("❌ Dosyalar alınamadı:", err);
          Toast.show({ type: "error", text1: "Dosyalar yüklenemedi" });
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

                    {/* <Text style={styles.modalDescription}>{selectedTask?.description}</Text> */}
                    <View style={{ marginBottom: 8 }}>
  <Text
    style={styles.modalDescription2}
    numberOfLines={descExpanded ? undefined : 2}
  >
    {selectedTask?.description}
  </Text>
  {selectedTask?.description && selectedTask.description.length > 60 && (
    <TouchableOpacity onPress={() => setDescExpanded(!descExpanded)}>
      <Text style={{ color: "#007AFF", fontWeight: "500" }}>
        {descExpanded ? "Show less ▲" : "Read more ›"}
      </Text>
    </TouchableOpacity>
  )}
</View>

                    <Text style={styles.modalMeta}>
                        👤 {selectedTask?.assignedTo} • 📍 {selectedTask?.location} • 📅 {selectedTask?.date}
                    </Text>

                    {ticketFiles.length > 0 && (
                        <View style={{ marginVertical: 10 }}>
                            <Text style={{ fontWeight: "bold", marginBottom: 6 }}>📎 Attached Files</Text>
                            <FlatList
                                data={ticketFiles}
                                keyExtractor={(item, index) => index.toString()}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={{ marginRight: 10 }}
                                        onPress={() => {
                                            if (item.uri && item.type.startsWith("image/")) {
                                                setImagePreview(item.uri);
                                            } else if (item.uri) {
                                                openFile(item.uri, item.type);
                                            }
                                        }}
                                    >
                                        {item.type.startsWith("image/") ? (
                                            <Image
                                                source={{ uri: item.uri }}
                                                style={{
                                                    width: 80,
                                                    height: 80,
                                                    borderRadius: 6,
                                                    borderWidth: 1,
                                                    borderColor: "#ccc",
                                                }}
                                                onError={() => console.warn("🚫 Görsel yüklenemedi:", item.uri)}
                                            />
                                        ) : (
                                            <View
                                                style={{
                                                    width: 80,
                                                    height: 80,
                                                    backgroundColor: "#eee",
                                                    justifyContent: "center",
                                                    alignItems: "center",
                                                    borderRadius: 6,
                                                }}
                                            >
                                                <MaterialIcons name="insert-drive-file" size={32} color="#666" />
                                                <Text numberOfLines={1} style={{ fontSize: 10, textAlign: "center", paddingHorizontal: 4 }}>
                                                    {item.name}
                                                </Text>
                                            </View>
                                        )}
                                    </TouchableOpacity>

                                )}
                            />
                        </View>
                    )}

                    <Modal visible={!!imagePreview} transparent animationType="fade">
                        <View style={styles.fullscreenModal}>
                            <TouchableOpacity onPress={() => setImagePreview(null)} style={styles.closeButton}>
                                <MaterialIcons name="close" size={24} color="white" />
                            </TouchableOpacity>
                            {imagePreview && (
                                <Image
                                    source={{ uri: imagePreview }}
                                    style={styles.fullscreenImage}
                                    onError={() => {
                                        console.warn("🚫 Büyük görsel yüklenemedi:", imagePreview);
                                        setImagePreview(null);
                                    }}
                                />
                            )}
                        </View>
                    </Modal>




                    {/* 💬 Mesajlar */}
                    <View style={styles.messageBox}>
                        <FlatList
                            ref={messagesEndRef}
                            data={messages[selectedTask?.ticketId || ""] || []}
                            keyExtractor={(_, index) => index.toString()}
                            renderItem={({ item }) => (
                                <View
                                    style={[
                                        styles.messageBubble,
                                        item.sender === "You" ? styles.sentMessage : styles.receivedMessage,
                                    ]}
                                >
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
                            getItemLayout={(data, index) => ({
                                length: 100,
                                offset: 100 * index,
                                index,
                              })}
                              onScrollToIndexFailed={(info) => {
                                setTimeout(() => {
                                  messagesEndRef.current?.scrollToIndex({
                                    index: info.index,
                                    animated: true,
                                  });
                                }, 500);
                              }}
                            // 🔽 🔥 Buraya ekliyoruz:
                            onContentSizeChange={() =>
                                messagesEndRef.current?.scrollToEnd({ animated: true })
                            }
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
        marginBottom: 5,
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
    fullscreenModal: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.9)",
        justifyContent: "center",
        alignItems: "center",
    },
    fullscreenImage: {
        width: "90%",
        height: "80%",
        resizeMode: "contain",
    },
    closeButton: {
        position: "absolute",
        top: 40,
        right: 20,
        zIndex: 10,
    },
    modalDescription2: {
        fontSize: 14,
        color: "#444",
        marginBottom: 4,
        textAlign: "justify",
      },
      
});      