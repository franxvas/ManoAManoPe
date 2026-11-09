import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getRecursoById } from '../../src/features/recursos/recursosStore';

export default function DetalleAlquilerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const recurso = getRecursoById(id);

  if (!recurso) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.errorText}>No se encontró el recurso.</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Regresar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1e3a8a" />
          <Text style={styles.backText}>Regresar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.cardWrapper}>
          <Image source={{ uri: recurso.foto }} style={styles.image} />
          <View style={styles.body}>
            <Text style={styles.title}>{recurso.titulo}</Text>
            <Text style={styles.price}>{recurso.precio}</Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Propietario</Text>
              <Text style={styles.text}>{recurso.propietario}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Garantía Solicitada</Text>
              <Text style={styles.text}>{recurso.garantia || 'No especificada'}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Condiciones de Uso</Text>
              <Text style={styles.text}>{recurso.condiciones}</Text>
            </View>

            <TouchableOpacity style={styles.button} onPress={() => router.back()}>
              <Text style={styles.buttonText}>Regresar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f4f4f5' },
  topBar: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontSize: 15, fontWeight: '600', color: '#1e3a8a' },
  scrollContainer: { padding: 16, alignItems: 'center', justifyContent: 'center', paddingBottom: 40 },
  cardWrapper: { width: '100%', maxWidth: 500, backgroundColor: '#ffffff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  image: { width: '100%', height: 240, backgroundColor: '#e5e7eb' },
  body: { padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  price: { fontSize: 18, fontWeight: '600', color: '#059669', marginBottom: 16 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#374151', marginBottom: 4 },
  text: { fontSize: 14, color: '#4b5563' },
  errorText: { fontSize: 16, color: '#dc2626', textAlign: 'center', marginTop: 40, marginBottom: 20 },
  button: { backgroundColor: '#1e3a8a', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 24 },
  buttonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 }
});