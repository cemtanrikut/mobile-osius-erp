import React from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';

const LoginScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Osius ERP</Text>
      <TextInput style={styles.input} placeholder="E-posta" keyboardType="email-address" />
      <TextInput style={styles.input} placeholder="Şifre" secureTextEntry />
      <Button title="Giriş Yap" onPress={() => alert('Giriş başarılı!')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: { width: '100%', borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 5 },
});

export default LoginScreen;
