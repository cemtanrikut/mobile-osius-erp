import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { useNavigation, NavigationProp, StackActions } from "@react-navigation/native";

export type RootStackParamList = {
    LoginScreen: undefined;
    MainTabs: undefined;
  };
  
export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    // const navigation = useNavigation();
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();


    const handleLogin = async () => {
        setLoading(true);
        Toast.hide();

        // 🔐 Admin shortcut
        if (email === "admin@osius.nl" && password === "admin") {
            await AsyncStorage.setItem("userType", "admin");
            await AsyncStorage.setItem("name", "Admin");
            await AsyncStorage.setItem("id", "ADMIN");
            console.log("Basariyla giris yapildi")
            // navigation.reset({
            //     index: 0,
            //     routes: [{ name: "MainTabs" as never }],
            //   });
            // navigation.navigate('DashboardScreen', { screen: 'MainTabs' });

            // @ts-ignore
            navigation.replace("MainTabs");




            return;
        }

        try {
            const response = await fetch("https://api-osius.up.railway.app/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Giriş başarısız!");
            }

            // 🔐 Bilgileri kaydet
            await AsyncStorage.setItem("userType", data.userType);
            await AsyncStorage.setItem("name", data.name);
            await AsyncStorage.setItem("id", data.id || "ADMIN");

            // @ts-ignore
            navigation.replace("MainTabs");

        } catch (err: any) {
            Toast.show({
                type: "error",
                text1: "Giriş Hatası",
                text2: err.message || "Bir sorun oluştu",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>🔐 Osius Login</Text>

            <TextInput
                placeholder="Email"
                style={styles.input}
                value={email}
                autoCapitalize="none"
                keyboardType="email-address"
                onChangeText={setEmail}
            />

            <TextInput
                placeholder="Password"
                style={styles.input}
                value={password}
                secureTextEntry
                onChangeText={setPassword}
            />

            <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Login</Text>
                )}
            </TouchableOpacity>

            <Toast />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#fff" },
    title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
    input: {
        borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, marginBottom: 12, backgroundColor: "#f9f9f9"
    },
    button: {
        backgroundColor: "#007AFF", padding: 14, borderRadius: 8, alignItems: "center",
    },
    buttonText: { color: "#fff", fontWeight: "bold" },
});
