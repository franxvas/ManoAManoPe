import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

export default function AlquileresScreen() {
  const [objeto, setObjeto] = useState('');
  const [precio, setPrecio] = useState('');
  const [garantia, setGarantia] = useState('');
  const [condiciones, setCondiciones] = useState('');
  const [fotos, setFotos] = useState<string[]>([]);

  const handleAgregarFoto = () => {
    setFotos([...fotos, `foto_recurso_${fotos.length + 1}.jpg`]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Publicar Objeto para Alquilar</Text>
      <Text style={styles.subtitle}>Ofrece herramientas o vehículos de forma temporal y segura.</Text>

      <View style={styles.formCard}>
        <Text style={styles.label}>Objeto o vehículo</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej. Moto, proyector, taladro..."
          value={objeto}
          onChangeText={setObjeto}
        />

        <Text style={styles.label}>Fotografías (Estado y características reales)</Text>
        <TouchableOpacity style={styles.photoButton} onPress={handleAgregarFoto}>
          <Text style={styles.photoButtonText}>📷 Tomar foto o subir desde galería</Text>
        </TouchableOpacity>
        
        <Text style={styles.photoCount}>
          {fotos.length === 0 ? 'No hay fotos seleccionadas' : `${fotos.length} foto(s) adjuntada(s) correctamente`}
        </Text>

        <Text style={styles.label}>Precio y unidad (Ej. S/ 40 por día)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej. 40 por día"
          value={precio}
          onChangeText={setPrecio}
        />

        <Text style={styles.label}>Garantía solicitada (Monto por separado)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej. S/ 100 de garantía"
          value={garantia}
          onChangeText={setGarantia}
        />

        <Text style={styles.label}>Condiciones del dueño</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej. Presentar DNI, uso exclusivo en la zona..."
          value={condiciones}
          onChangeText={setCondiciones}
        />

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Publicar Alquiler</Text>
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
  photoButton: { borderWidth: 1, borderColor: '#1e3a8a', borderStyle: 'dashed', borderRadius: 8, padding: 14, alignItems: 'center', backgroundColor: '#eff6ff', marginTop: 4 },
  photoButtonText: { color: '#1e3a8a', fontWeight: '600', fontSize: 14 },
  photoCount: { fontSize: 12, color: '#6b7280', marginTop: 4, fontStyle: 'italic' },
  button: { backgroundColor: '#dc2626', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 }
});