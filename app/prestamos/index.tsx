import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

export default function PrestamosScreen() {
  const [objeto, setObjeto] = useState('');
  const [motivo, setMotivo] = useState('');
  const [zona, setZona] = useState('');

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Pedir Objeto Prestado</Text>
      <Text style={styles.subtitle}>Un préstamo es totalmente gratuito en nuestra comunidad.</Text>

      <View style={styles.formCard}>
        <Text style={styles.label}>¿Qué objeto necesitas?</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej. Escalera, taladro, carretilla..."
          value={objeto}
          onChangeText={setObjeto}
        />

        <Text style={styles.label}>¿Para qué lo necesitas?</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej. Para pintar la fachada el sábado..."
          value={motivo}
          onChangeText={setMotivo}
        />

        <Text style={styles.label}>Zona aproximada (Bagua)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej. Cerca del centro de Bagua"
          value={zona}
          onChangeText={setZona}
        />

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Publicar Solicitud de Préstamo</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f5', padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 20 },
  formCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 14, backgroundColor: '#fff' },
  button: { backgroundColor: '#dc2626', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 }
});