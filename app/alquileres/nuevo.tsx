import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Image, Alert, ActionSheetIOS, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { agregarAlquiler } from '../../src/features/recursos/recursosStore';

export default function NuevoAlquilerScreen() {
  const router = useRouter();
  const [objeto, setObjeto] = useState('');
  const [precio, setPrecio] = useState('');
  const [garantia, setGarantia] = useState('');
  const [condiciones, setCondiciones] = useState('');
  const [propietario, setPropietario] = useState('');
  const [fotoUri, setFotoUri] = useState<string>('');

  const limpiarFormulario = () => {
    setObjeto('');
    setPrecio('');
    setGarantia('');
    setCondiciones('');
    setPropietario('');
    setFotoUri('');
  };

  const handleVolver = () => {
    limpiarFormulario();
    router.back();
  };

  // Función para abrir la cámara
  const tomarFoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permiso requerido', 'Se necesitan permisos para acceder a la cámara.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Formato cuadrado estricto
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setFotoUri(result.assets[0].uri);
    }
  };

  // Función para abrir la galería
  const seleccionarDeGaleria = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permiso requerido', 'Se necesitan permisos para acceder a tus fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Formato cuadrado estricto sin exigir recorte forzoso
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setFotoUri(result.assets[0].uri);
    }
  };

  // Menú para elegir entre Cámara o Galería
  const elegirFuenteImagen = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancelar', 'Tomar foto', 'Elegir de la galería'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) tomarFoto();
          else if (buttonIndex === 2) seleccionarDeGaleria();
        }
      );
    } else {
      Alert.alert(
        'Agregar Fotografía',
        'Selecciona una opción',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Tomar foto', onPress: tomarFoto },
          { text: 'Elegir de la galería', onPress: seleccionarDeGaleria },
        ],
        { cancelable: true }
      );
    }
  };

  const handleGuardar = () => {
    if (!objeto || !propietario) {
      Alert.alert('Campos incompletos', 'Por favor ingresa al menos tu nombre y el objeto.');
      return;
    }

    agregarAlquiler({
      titulo: objeto,
      precio: precio ? `${precio} por día` : 'A tratar',
      garantia: garantia ? `${garantia} de garantía` : 'Sin garantía',
      condiciones: condiciones || 'Sin condiciones específicas',
      propietario,
      foto: fotoUri || 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400'
    });

    limpiarFormulario();
    router.back();
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleVolver} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1e3a8a" />
          <Text style={styles.backText}>Regresar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.cardWrapper}>
          <Text style={styles.title}>Nuevo Alquiler</Text>
          
          <Text style={styles.label}>Tu Nombre (Propietario)</Text>
          <TextInput style={styles.input} placeholder="Ej. Kelvin Smith" value={propietario} onChangeText={setPropietario} />

          <Text style={styles.label}>Objeto o vehículo</Text>
          <TextInput style={styles.input} placeholder="Ej. Taladro, Moto..." value={objeto} onChangeText={setObjeto} />

          <Text style={styles.label}>Fotografía (Formato Cuadrado)</Text>
          <TouchableOpacity style={styles.photoButton} onPress={elegirFuenteImagen}>
            {fotoUri ? (
              <Image source={{ uri: fotoUri }} style={styles.previewImage} />
            ) : (
              <>
                <Ionicons name="camera-outline" size={28} color="#1e3a8a" />
                <Text style={styles.photoButtonText}>Toca para tomar foto o elegir de galería</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.photoCount}>{fotoUri ? 'Imagen cuadrada cargada con éxito' : 'Sin foto seleccionada'}</Text>

          <Text style={styles.label}>Precio (por día)</Text>
          <TextInput style={styles.input} placeholder="Ej. 40" keyboardType="numeric" value={precio} onChangeText={setPrecio} />

          <Text style={styles.label}>Garantía</Text>
          <TextInput style={styles.input} placeholder="Ej. 100" keyboardType="numeric" value={garantia} onChangeText={setGarantia} />

          <Text style={styles.label}>Condiciones</Text>
          <TextInput style={styles.input} placeholder="Ej. Presentar DNI" value={condiciones} onChangeText={setCondiciones} />

          <TouchableOpacity style={styles.submitButton} onPress={handleGuardar}>
            <Text style={styles.submitButtonText}>Guardar y Publicar</Text>
          </TouchableOpacity>
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
  cardWrapper: { width: '100%', maxWidth: 500, backgroundColor: '#ffffff', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 16, textAlign: 'center' },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 12, fontSize: 14, backgroundColor: '#fff', color: '#111827' },
  photoButton: { borderWidth: 1.5, borderColor: '#1e3a8a', borderStyle: 'dashed', borderRadius: 10, width: '100%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#eff6ff', marginTop: 4, overflow: 'hidden' },
  photoButtonText: { color: '#1e3a8a', fontWeight: '600', fontSize: 13, marginTop: 8, textAlign: 'center', paddingHorizontal: 10 },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  photoCount: { fontSize: 12, color: '#6b7280', marginTop: 6, fontStyle: 'italic', textAlign: 'right' },
  submitButton: { backgroundColor: '#dc2626', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 24 },
  submitButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 }
});