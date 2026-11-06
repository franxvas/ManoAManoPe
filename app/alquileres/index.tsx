import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { getAlquileres, Recurso } from '../../src/features/recursos/recursosStore';

export default function AlquileresScreen() {
  const router = useRouter();
  const [alquileres, setAlquileres] = useState<Recurso[]>([]);

  useFocusEffect(
    useCallback(() => {
      setAlquileres(getAlquileres());
    }, [])
  );

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Alquileres Disponibles</Text>
          <Text style={styles.subtitle}>Encuentra herramientas, vehículos y más.</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => router.push('/alquileres/nuevo')}>
          <Text style={styles.addButtonText}>+ Publicar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {alquileres.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={styles.card}
            onPress={() => router.push(`/alquileres/${item.id}`)}
          >
            <Image source={{ uri: item.foto }} style={styles.cardImage} />
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{item.titulo}</Text>
              <Text style={styles.cardPrice}>{item.precio}</Text>
              <Text style={styles.cardOwner}>Publicado por: {item.propietario}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f5', paddingHorizontal: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 12 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1e3a8a' },
  subtitle: { fontSize: 13, color: '#6b7280' },
  addButton: { backgroundColor: '#dc2626', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  addButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  scrollContent: { paddingBottom: 24 },
  card: { backgroundColor: '#ffffff', borderRadius: 12, marginBottom: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  cardImage: { width: '100%', height: 150, backgroundColor: '#e5e7eb' },
  cardBody: { padding: 16 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  cardPrice: { fontSize: 15, fontWeight: '600', color: '#059669', marginBottom: 4 },
  cardOwner: { fontSize: 12, color: '#6b7280' }
});