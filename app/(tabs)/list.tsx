import React, { useState, useEffect, useRef } from "react";
import { Image } from "react-native";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, Button, TextInput, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useNavigation } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import * as WebBrowser from "expo-web-browser";
import RNPickerSelect from "react-native-picker-select";



// Task için TypeScript tipi belirliyoruz
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
    status: "todo" | "inProgress" | "done"; // ✅ `status` alanını ekledik!
};


// Task listesini güncelliyoruz
const initialTasks: Record<"todo" | "inProgress" | "done", Task[]> = {
    todo: [
        { id: "1", ticketId: "#T-001", title: "Design Login Page", description: "Create a login page UI", assignedTo: "Cem Tanrikut", date: "28-02-2025", location: "Amsterdam", isNew: false, status: "todo" },
        { id: "2", ticketId: "#T-002", title: "Fix Authentication Bug", description: "Debug login issues", assignedTo: "Ramazan", date: "28-02-2025", location: "Rotterdam", isNew: false, status: "todo" },
        { id: "3", ticketId: "#T-003", title: "Setup Database", description: "Configure MongoDB instance", assignedTo: "Abdullah Soyaslan", date: "27-02-2025", location: "Utrecht", isNew: false, status: "todo" },
    ],
    inProgress: [
        { id: "4", ticketId: "#T-004", title: "API Integration", description: "Connect frontend with backend", assignedTo: "Cem Tanrikut", date: "27-02-2025", location: "The Hague", isNew: true, status: "inProgress" },
        { id: "5", ticketId: "#T-005", title: "Dashboard Charts", description: "Implement analytics dashboard", assignedTo: "Jony Ive", date: "26-02-2025", location: "Eindhoven", isNew: true, status: "inProgress" },
        { id: "6", ticketId: "#T-006", title: "Refactor Codebase", description: "Optimize component structure", assignedTo: "Ramazan", date: "25-02-2025", location: "Groningen", isNew: false, status: "inProgress" },
    ],
    done: [
        { id: "7", ticketId: "#T-007", title: "Create UI Mockups", description: "Design wireframes for app", assignedTo: "Abdullah Soyaslan", date: "24-02-2025", location: "Haarlem", isNew: false, status: "done" },
        { id: "8", ticketId: "#T-008", title: "Implement Dark Mode", description: "Add theme switching", assignedTo: "Cem Tanrikut", date: "23-02-2025", location: "Leiden", isNew: false, status: "done" },
        { id: "9", ticketId: "#T-009", title: "Optimize Queries", description: "Improve database performance", assignedTo: "Jony Ive", date: "22-02-2025", location: "Maastricht", isNew: false, status: "done" },
        { id: "10", ticketId: "#T-010", title: "Deploy to Production", description: "Push latest release", assignedTo: "Abdullah Soyaslan", date: "21-02-2025", location: "Delft", isNew: false, status: "done" },
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
    const [newDate, setNewDate] = useState("");
    const [newFile, setNewFile] = useState<{ name: string; uri: string; type: string } | null>(null);
    const [newLocation, setNewLocation] = useState("");
    const [newCustomer, setNewCustomer] = useState("");
    const [newAssignedTo, setNewAssignedTo] = useState(""); // 📌 Seçilen worker buraya gelecek
    const [workers, setWorkers] = useState<{ label: string; value: string }[]>([]);
    const [loading, setLoading] = useState(false);

    const [buildings, setBuildings] = useState<{ label: string; value: string }[]>([]);
    const [loadingBuildings, setLoadingBuildings] = useState(false);

    const [customers, setCustomers] = useState<{ label: string; value: string }[]>([]);
    const [loadingCustomers, setLoadingCustomers] = useState(false);

    const [previewImage, setPreviewImage] = useState(null);
    const [ws, setWs] = useState<WebSocket | null>(null);




    // 📌 **Müşteri listesini API’den çekme fonksiyonu**
    const fetchCustomers = async () => {
        try {
            setLoadingCustomers(true);
            const response = await fetch("https://api-osius.up.railway.app/customers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}) // API'nin boş request desteklediğini varsayıyoruz
            });

            if (!response.ok) {
                throw new Error(`Sunucu hatası: ${response.status}`);
            }

            const data = await response.json();

            if (!Array.isArray(data) || data.length === 0) {
                // setCustomers([{ label: "Müşteri bulunamadı", value: "" }]);
                return;
            }

            const formattedCustomers = data.map(customer => ({
                label: customer.name, // API'den gelen müşteri ismi
                value: customer.id, // API'den gelen müşteri ID’si
            }));

            setCustomers(formattedCustomers);
        } catch (error) {
            console.error("Müşteri listesini çekerken hata:", error);
            Toast.show({
                type: "error",
                text1: "Hata!",
                text2: "Müşteri listesi alınamadı.",
            });
            setCustomers([{ label: "Bağlantı hatası", value: "" }]);
        } finally {
            setLoadingCustomers(false);
        }
    };

    // 📌 **Bina listesini API’den çekme fonksiyonu**
    const fetchBuildings = async () => {
        try {
            setLoadingBuildings(true);
            const response = await fetch("https://api-osius.up.railway.app/buildings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}) // 📌 Eğer API boş request destekliyorsa
            });

            if (!response.ok) {
                throw new Error(`Sunucu hatası: ${response.status}`);
            }

            const data = await response.json();

            if (!Array.isArray(data) || data.length === 0) {
                // setBuildings([{ label: "Bina bulunamadı", value: "" }]);
                return;
            }

            const formattedBuildings = data.map(building => ({
                label: building.name, // API'den gelen bina ismi
                value: building.id, // API'den gelen bina ID’si
            }));

            setBuildings(formattedBuildings);
        } catch (error) {
            console.error("Bina listesini çekerken hata:", error);
            Toast.show({
                type: "error",
                text1: "Hata!",
                text2: "Bina listesi alınamadı.",
            });
            setBuildings([{ label: "Bağlantı hatası", value: "" }]);
        } finally {
            setLoadingBuildings(false);
        }
    };

    // 📌 **Sayfa açıldığında binaları çek**
    useEffect(() => {
        fetchBuildings();
        fetchCustomers();
        fetchWorkers();
    }, []);

    // 📌 **API'den Workers Listesini Çek**
    const fetchWorkers = async () => {
        try {
            setLoading(true);
            const response = await fetch("https://api-osius.up.railway.app/workers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}) // 📌 **Boş body gönderiyoruz!**
            });

            if (!response.ok) {
                throw new Error(`Sunucu hatası: ${response.status}`);
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(`API Hatası: ${data.error}`);
            }

            if (!Array.isArray(data) || data.length === 0) {
                // setWorkers([{ label: "Çalışan bulunamadı", value: "" }]);
                return;
            }

            const formattedWorkers = data.map(worker => ({
                label: worker.name,
                value: worker.name,
            }));
            setWorkers(formattedWorkers);
        } catch (error) {
            console.error("Worker listesini çekerken hata:", error);
            Toast.show({
                type: "error",
                text1: "Hata!",
                text2: "Çalışan listesi alınamadı.",
            });
            setWorkers([{ label: "Bağlantı hatası", value: "" }]);
        } finally {
            setLoading(false);
        }
    };

    // 📌 **Ticket Tipi**
    type Ticket = {
        id: string;
        ticketId: string;
        code: string;
        title: string;
        description: string;
        assignedTo: string;
        date: string;
        location: string;
        status: "ToDo" | "inProgress" | "done"; // Sadece bu 3 durum olabilir
    };

    // 📌 **Backend'den Ticket'ları Çekme**
    useEffect(() => {
        const fetchTickets = async () => {
            setLoading(true);
            try {
                const response = await fetch("https://api-osius.up.railway.app/tickets");

                if (!response.ok) {
                    throw new Error(`Failed to fetch tickets, status: ${response.status}`);
                }

                const tickets: Ticket[] = await response.json(); // ✅ Ticket tipini belirttik

                console.log("Fetched Tickets from API:", tickets); // 🔥 API çıktısını kontrol et

                // 🎯 **Ticket'ları Task formatına dönüştür**
                const convertToTask = (ticket: Ticket): Task => ({
                    id: ticket.id,
                    ticketId: ticket.ticketId || ticket.code, // Eğer `ticketId` yoksa, `code` kullan
                    title: ticket.title,
                    description: ticket.description,
                    assignedTo: ticket.assignedTo,
                    date: ticket.date,
                    location: ticket.location,
                    file: null, // API'den gelen veride yoksa null olarak ekleyelim
                    isNew: false, // ✅ Yeni olmadığını belirtelim
                    status: ticket.status as "todo" | "inProgress" | "done", // ✅ **Eksik status alanını ekledik!**
                });



                // **Statüye göre kategorilere ayır**
                const todo = tickets.filter((ticket) => ticket.status === "ToDo").map(convertToTask);
                const inProgress = tickets.filter((ticket) => ticket.status === "inProgress").map(convertToTask);
                const done = tickets.filter((ticket) => ticket.status === "done").map(convertToTask);

                console.log("ToDo:", todo);
                console.log("InProgress:", inProgress);
                console.log("Done:", done);


                // ✅ **State'i güncelle**
                setTasks({ todo, inProgress, done });

            } catch (error) {
                console.error("Error fetching tickets:", error);
                Toast.show({
                    type: "error",
                    text1: "Hata!",
                    text2: "Ticket listesi yüklenemedi.",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchTickets();
    }, []);




    // // 📂 **Dosya Seçme Fonksiyonu**
    // const pickDocument = async () => {
    //     try {
    //         const result = await DocumentPicker.getDocumentAsync({});

    //         if (result.canceled) {
    //             console.log("User cancelled file picker");
    //             return;
    //         }

    //         if (result.assets && result.assets.length > 0) {
    //             setNewFile({
    //                 name: result.assets[0].name,
    //                 uri: result.assets[0].uri,
    //                 type: result.assets[0].mimeType || "unknown",
    //             });
    //         }

    //     } catch (error) {
    //         console.error("Dosya seçme hatası:", error);
    //     }
    // };



    const closeAddModal = () => {
        setAddModalVisible(false);
        setNewTitle("");
        setNewDescription("");
        setNewAssignedTo("");
        setNewDate("");
        setNewLocation("");
        setNewCustomer("");
        setNewFile(null);
    };

    const addNewTicket = async () => {
        if (!newTitle || !newDescription || !newAssignedTo || !newDate || !newLocation || !newCustomer) {
            Toast.show({
                type: "error",
                text1: "Missing Fields!",
                text2: "Please fill all fields before adding a ticket.",
            });
            return;
        }

        setLoading(true); // 🎯 Yükleme durumu başlat

        try {
            const response = await fetch("https://api-osius.up.railway.app/tickets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: newTitle,
                    description: newDescription,
                    workerId: newAssignedTo, // Seçilen çalışan
                    customerId: newCustomer, // Seçilen müşteri
                    buildingId: newLocation, // Seçilen bina
                    notificationType: "email", // (Gerekirse) Bildirim tipi, şimdilik default
                    date: newDate, // Bugünün tarihi
                    status: "ToDo", // Varsayılan olarak "To Do"
                    creatorId: "1", // ✅ Geçici olarak admin user ID
                    createdBy: "Admin", // ✅ Geçici olarak admin
                }),
            });

            if (!response.ok) {
                throw new Error(`Sunucu hatası: ${response.status}`);
            }

            const data = await response.json();

            // 🎯 Başarı mesajı göster
            Toast.show({
                type: "success",
                text1: "Ticket Created!",
                text2: `"${newTitle}" added successfully.`,
            });

            // Yeni eklenen ticket'ı listeye ekleyelim
            const newTask: Task = {
                id: data.id.toString(), // API'den dönen ID
                ticketId: data.ticketId.toString(),
                title: newTitle,
                description: newDescription,
                assignedTo: newAssignedTo,
                date: newDate,
                location: newLocation,
                file: newFile ? { ...newFile } : null,
                isNew: true,
                status: "todo"
            };

            setTasks((prevTasks) => ({
                ...prevTasks,
                todo: [newTask, ...prevTasks.todo], // **Yeni ticket'ı "To Do" listesine ekle**
            }));

            closeAddModal(); // 🎯 Modal'ı kapat ve inputları temizle
        } catch (error) {
            console.error("Ticket eklerken hata:", error);
            Toast.show({
                type: "error",
                text1: "Hata!",
                text2: "Ticket eklenemedi, tekrar deneyin.",
            });
        } finally {
            setLoading(false); // 🎯 Yükleme durumunu kapat
        }
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

    const moveTask = async (newStatus: "todo" | "inProgress" | "done") => {
        if (!selectedTask) return;

        try {
            // **Veritabanındaki ticket'ın status'ünü güncelle**
            const response = await fetch(`https://api-osius.up.railway.app/tickets/${selectedTask.ticketId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }), // ✅ Yeni statüyü API'ye gönderiyoruz
            });

            if (!response.ok) {
                throw new Error(`Ticket status update failed: ${response.status}`);
            }

            setTasks((prevTasks) => {
                const updatedTasks = { ...prevTasks };

                // **Eski statüden ticket'ı kaldır**
                updatedTasks[selectedTab] = updatedTasks[selectedTab].filter((task) => task.id !== selectedTask.id);

                // **Yeni statüye ekle**
                updatedTasks[newStatus] = [...updatedTasks[newStatus], { ...selectedTask, status: newStatus }];

                return updatedTasks;
            });

            // **Başarı mesajı göster**
            Toast.show({
                type: "success",
                text1: "Status Updated",
                text2: `${selectedTask.title} moved to ${newStatus.toUpperCase()}`,
                position: "bottom",
            });

            setSelectedTab(newStatus); // ✅ **Yeni sekmeye otomatik geçiş yap**
            closeModal(); // ✅ **Modal'ı kapat**
        } catch (error) {
            console.error("❌ Error updating ticket status:", error);
            Toast.show({
                type: "error",
                text1: "Update Failed!",
                text2: "Ticket status could not be updated.",
            });
        }
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


    // const sendMessage = () => {
    //     if (!newMessage.trim() && !newFile) return; // Eğer mesaj veya dosya yoksa, gönderme

    //     if (!selectedTask) return;

    //     const newMsg = {
    //         text: newMessage || "", // Eğer sadece dosya gönderiliyorsa, text boş olabilir
    //         sender: "You",
    //         time: new Date().toLocaleTimeString(),
    //         file: newFile ? { ...newFile } : null, // Dosya varsa ekleyelim
    //     };

    //     setMessages((prev) => ({
    //         ...prev,
    //         [selectedTask.id]: [...(prev[selectedTask.id] || []), newMsg],
    //     }));

    //     setNewMessage("");
    //     setNewFile(null); // Dosya eklediysek sıfırlayalım
    // };


    // const openFile = async (uri: string, type: string) => {
    //     if (type.startsWith("image/")) {
    //         setImagePreview(uri); // 📂 Resimleri modal içinde göstereceğiz
    //     } else {
    //         await WebBrowser.openBrowserAsync(uri); // 📜 PDF ve diğer dosyalar için
    //     }
    // };


    useEffect(() => {
        if (modalVisible && messagesEndRef.current) {
            setTimeout(() => {
                messagesEndRef.current?.scrollToEnd({ animated: true });
            }, 100); // Biraz gecikme vererek düzgün çalışmasını sağlıyoruz
        }
    }, [modalVisible, messages]);


    // 📌 **WebSocket Bağlantısını Aç**
    useEffect(() => {
        const wsProtocol = "wss"; // Eğer localhost'ta çalışıyorsan "ws" kullan
        const wsUrl = `${wsProtocol}://api-osius.up.railway.app/ws`;

        const socket = new WebSocket(wsUrl);

        socket.onopen = () => {
            console.log("✅ WebSocket bağlantısı kuruldu!");
            setWs(socket);
        };

        socket.onmessage = (event) => {
            const receivedMessage = JSON.parse(event.data);
            console.log("📩 Gelen WebSocket Mesajı:", receivedMessage);

            setMessages((prev) => ({
                ...prev,
                [receivedMessage.ticket_id]: [
                    ...(prev[receivedMessage.ticket_id] || []),
                    receivedMessage,
                ],
            }));
        };

        socket.onerror = (error) => {
            console.error("❌ WebSocket Hatası:", error);
        };

        socket.onclose = () => {
            console.log("❌ WebSocket bağlantısı kapatıldı. Yeniden bağlanıyor...");
            setTimeout(() => {
                setWs(new WebSocket(wsUrl));
            }, 3000);
        };

        return () => {
            socket.close();
        };
    }, []);

    // 📌 **Mesaj Gönderme Fonksiyonu**
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
            console.error("❌ WebSocket bağlantısı kapalı!");
            Toast.show({
                type: "error",
                text1: "Bağlantı Hatası!",
                text2: "WebSocket bağlantısı koptu, tekrar bağlanılıyor...",
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
                    time: new Date(messageData.created_at).toLocaleTimeString(), // 🔥 `created_at` → `time`
                },
            ],
        }));

        setNewMessage("");
    };

    // 📌 **Dosya Seçme ve Gönderme**
    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({});
            if (result.canceled || !result.assets) return;

            const pickedFile = {
                name: result.assets[0].name,
                uri: result.assets[0].uri,
                type: result.assets[0].mimeType || "unknown",
            };

            const fileMessage = {
                ticket_id: selectedTask?.id,
                sender: "You",
                text: "📂 Sent a file",
                created_at: new Date().toISOString(),
                file: pickedFile,
            };

            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(fileMessage));
            } else {
                console.error("❌ WebSocket bağlantısı kapalı!");
                return;
            }

            if (!selectedTask) return; // 🛑 Eğer `selectedTask` yoksa işlemi durdur

            setMessages((prev) => ({
                ...prev,
                [selectedTask.id]: [
                    ...(prev[selectedTask.id] || []),
                    {
                        text: fileMessage.text, // ✅ Mesaj içeriği
                        sender: fileMessage.sender, // ✅ Kim gönderdi
                        time: new Date(fileMessage.created_at).toLocaleTimeString(), // ✅ `created_at` → `time`
                        file: fileMessage.file ? { ...fileMessage.file } : undefined, // ✅ Dosya varsa ekle, yoksa `undefined`
                    },
                ],
            }));
        } catch (error) {
            console.error("❌ Dosya seçme hatası:", error);
        }
    };


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

    const openFile = async (uri: string, type: string) => {
        if (type.startsWith("image/")) {
            setImagePreview(uri); // 📂 Eğer resimse, modalda göster
        } else {
            try {
                await WebBrowser.openBrowserAsync(uri); // 📜 PDF ve diğer dosyalar için aç
            } catch (error) {
                console.error("Dosya açılırken hata oluştu:", error);
            }
        }
    };


    return (
        <View style={styles.container}>
            {/* Başlık ve + Butonu */}
            {/* <View style={styles.header}>
        <Text style={styles.headerTitle}>List</Text>
        <TouchableOpacity onPress={openAddModal} style={styles.addButton}>
          <MaterialIcons name="add" size={28} color="white" />
        </TouchableOpacity>
      </View> */}
            <View style={styles.filterContainer}>
                <TouchableOpacity style={[styles.filterButton, selectedTab === "todo" && styles.selected]} onPress={() => setSelectedTab("todo")}>
                    <Text style={[styles.filterText, selectedTab === "todo" && styles.selectedText]}>To Do</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.filterButton, selectedTab === "inProgress" && styles.selected]} onPress={() => setSelectedTab("inProgress")}>
                    <Text style={[styles.filterText, selectedTab === "inProgress" && styles.selectedText]}>In Progress</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.filterButton, selectedTab === "done" && styles.selected]} onPress={() => setSelectedTab("done")}>
                    <Text style={[styles.filterText, selectedTab === "done" && styles.selectedText]}>Done</Text>
                </TouchableOpacity>
            </View>


            {/* Liste */}
            {loading ? (
                <ActivityIndicator size="large" color="#007AFF" />
            ) : (
                <FlatList
                    data={tasks[selectedTab]}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => openModal(item)}>
                            <View style={styles.taskItem}>
                                {item.isNew && <View style={styles.newBadge}><Text style={styles.newBadgeText}>NEW</Text></View>}
                                <View style={styles.taskInfo}>
                                    <Text style={styles.taskCode}>{item.ticketId}</Text>
                                    <Text style={styles.taskTitle}>{item.title}</Text>
                                    <Text style={styles.taskDescription}>{item.description}</Text>
                                    <Text style={styles.taskMeta}>📍 {item.location} | 👤 {item.assignedTo} | 📅 {item.date}</Text>
                                </View>
                                <MaterialIcons name="chevron-right" size={24} color="#666" />
                            </View>
                        </TouchableOpacity>
                    )}
                />
            )}

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
                                {selectedTask.status === "todo" && (
                                    <TouchableOpacity style={[styles.moveButton, styles.orangeButton]} onPress={() => moveTask("inProgress")}>
                                        <Text style={styles.moveButtonText}>Move to In Progress</Text>
                                    </TouchableOpacity>
                                )}

                                {selectedTask.status === "inProgress" && (
                                    <>
                                        <TouchableOpacity style={[styles.moveButton, styles.blueButton]} onPress={() => moveTask("todo")}>
                                            <Text style={styles.moveButtonText}>Move to To Do</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[styles.moveButton, styles.greenButton]} onPress={() => moveTask("done")}>
                                            <Text style={styles.moveButtonText}>Move to Done</Text>
                                        </TouchableOpacity>
                                    </>
                                )}

                                {selectedTask.status === "done" && (
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
                        {/* <TextInput
                placeholder="Assigned To"
                style={styles.input}
                value={newAssignedTo}
                onChangeText={setNewAssignedTo}
            /> */}
                        {/* 📌 **Assigned To (Dropdown)** */}
                        {loading ? (
                            <ActivityIndicator size="small" color="#007AFF" />
                        ) : (
                            <RNPickerSelect
                                onValueChange={(value) => setNewAssignedTo(value)}
                                items={workers}
                                placeholder={{ label: "Assinged to", value: null }}
                                style={pickerSelectStyles}
                            />
                        )}

                        {/* 🎯 **Tarih Alanı (Değiştirilemez) **
                        <TextInput placeholder="Date" style={[styles.input, styles.disabledInput]} value={newDate} editable={false} /> */}

                        {/* 📂 **Dosya Seçme Butonu** */}
                        <TouchableOpacity style={[styles.moveButton, styles.blueButton]} onPress={pickDocument}>
                            <Text style={styles.moveButtonText}>📄 Upload a File</Text>
                        </TouchableOpacity>
                        {newFile && <Text style={styles.selectedFile}>📄 {newFile.name}</Text>}

                        {/* <TextInput
                            placeholder="Location"
                            style={styles.input}
                            value={newLocation}
                            onChangeText={setNewLocation}
                        /> */}
                        <RNPickerSelect
                            onValueChange={(value) => setNewLocation(value)}
                            items={buildings}
                            style={pickerSelectStyles}
                            placeholder={{ label: "Building", value: "" }}
                            disabled={loadingBuildings} // 📌 Yükleme sırasında disable
                        />

                        {/* <TextInput
                            placeholder="Customer"
                            style={styles.input}
                            value={newCustomer}
                            onChangeText={setNewCustomer}
                        /> */}

                        <RNPickerSelect
                            onValueChange={(value) => setNewCustomer(value)}
                            items={customers}
                            style={pickerSelectStyles}
                            placeholder={{ label: "Customer", value: "" }}
                            disabled={loadingCustomers} // 📌 Yükleme sırasında disable
                        />

                        {/* Ticket ekleme butonu */}
                        <TouchableOpacity style={[styles.moveButton, styles.greenButton]} onPress={addNewTicket} disabled={loading}>
                            {loading ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.moveButtonText}>Add Ticket</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Toast Message */}
            <Toast />
        </View>
    );
}

// 🎯 **Picker Select için Özel Stiller**
const pickerSelectStyles = StyleSheet.create({
    inputIOS: { fontSize: 16, padding: 10, borderWidth: 1, borderColor: "#ddd", borderRadius: 5, color: "black", marginTop: 10 },
    inputAndroid: { fontSize: 16, padding: 10, borderWidth: 1, borderColor: "#ddd", borderRadius: 5, color: "black", marginTop: 10 },
});

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
