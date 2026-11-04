import { goBackOr } from '@/utils/navigation';
import { nearby, type ApproximateArea } from './area';
import { AreaPicker, NearbyFilter } from './area-picker';
import { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PreviewProposals } from '@/features/mano/preview-proposals';
import { TaskEditor } from '@/features/mano/task-editor';

type Kind = 'Ayuda' | 'Reparación' | 'Proyecto';
type Task = {
  id: string;
  title: string;
  budget: string;
  status: 'Recibiendo propuestas' | 'En curso' | 'Finalizada' | 'Cancelada';
};
type Request = {
  id: string;
  kind: Kind;
  title: string;
  category: string;
  description: string;
  budget: string;
  deadline: string;
  modality: string;
  location: string;
  item: string;
  brand: string;
  since: string;
  transport: string;
  photos?: string[];
  approximate_latitude?: number | null;
  approximate_longitude?: number | null;
  tasks: Task[];
};
const key = 'mano-preview-requests-v1';
const seed: Request[] = [
  {
    id: 'demo-1',
    kind: 'Ayuda',
    title: 'Pintar una habitación',
    category: 'Pintura',
    description: 'Busco a alguien que pinte una habitación esta semana.',
    budget: 'S/ 250',
    deadline: 'Esta semana',
    modality: 'A domicilio',
    location: 'Bagua',
    item: '',
    brand: '',
    since: '',
    transport: '',
    tasks: [],
  },
  {
    id: 'demo-2',
    kind: 'Reparación',
    title: 'Mi moto no enciende',
    category: 'Mecánica',
    description: 'Necesito revisar por qué mi moto no enciende.',
    budget: 'Hasta S/ 200',
    deadline: 'Por acordar',
    modality: 'A domicilio',
    location: 'Bagua',
    item: 'Motocicleta',
    brand: 'Por indicar',
    since: 'Una semana',
    transport: 'Necesito atención a domicilio',
    tasks: [],
  },
  {
    id: 'demo-3',
    kind: 'Proyecto',
    title: 'Organizar una feria',
    category: 'Eventos',
    description: 'Necesito fotografía, decoración y sonido para una feria.',
    budget: 'Por tarea',
    deadline: 'Por acordar',
    modality: 'Presencial',
    location: 'Bagua',
    item: '',
    brand: '',
    since: '',
    transport: '',
    tasks: [
      {
        id: '1',
        title: 'Fotografía',
        budget: 'S/ 200',
        status: 'Recibiendo propuestas',
      },
      { id: '2', title: 'Decoración', budget: 'S/ 150', status: 'En curso' },
      {
        id: '3',
        title: 'Sonido',
        budget: 'Por cotizar',
        status: 'Recibiendo propuestas',
      },
    ],
  },
];
const box = {
  backgroundColor: '#fff',
  borderRadius: 18,
  padding: 16,
  marginBottom: 12,
} as const;
const field = {
  borderWidth: 1,
  borderColor: '#d9dde5',
  borderRadius: 12,
  padding: 12,
  marginTop: 6,
  marginBottom: 14,
  backgroundColor: '#fff',
  color: '#172b4d',
} as const;
function Button({
  label,
  onPress,
  secondary = false,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: secondary ? '#eaf0f8' : '#d7192d',
        padding: 14,
        borderRadius: 12,
        marginVertical: 5,
        alignItems: 'center',
      }}
    >
      <Text
        style={{ color: secondary ? '#0b2d5d' : 'white', fontWeight: '700' }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
function Input({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <View>
      <Text style={{ color: '#0b2d5d', fontWeight: '600' }}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        multiline={multiline}
        style={[
          field,
          multiline ? { minHeight: 80, textAlignVertical: 'top' } : {},
        ]}
      />
    </View>
  );
}
export function ManoPreview() {
  const [items, setItems] = useState<Request[]>(seed);
  const [requestArea, SetRequestArea] = useState<ApproximateArea | null>(null);
  const [searchArea, SetSearchArea] = useState<ApproximateArea | null>(null);
  const [radius, SetRadius] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [filter, setFilter] = useState('Todas');
  const [screen, setScreen] = useState<'list' | 'choose' | 'form' | 'detail'>(
    'list',
  );
  const [kind, setKind] = useState<Kind>('Ayuda');
  const [selected, setSelected] = useState<Request | null>(null);
  const [title, S] = useState('');
  const [category, C] = useState('');
  const [description, D] = useState('');
  const [budget, B] = useState('');
  const [deadline, F] = useState('');
  const [modality, M] = useState('');
  const [location, L] = useState('');
  const [item, I] = useState('');
  const [brand, Br] = useState('');
  const [since, Si] = useState('');
  const [transport, Tr] = useState('');
  const [taskText, T] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [error, SetError] = useState('');
  const [search, Search] = useState('');
  const [zone, Zone] = useState('');
  useEffect(() => {
    AsyncStorage.getItem(key)
      .then((raw) => {
        if (raw) {
          try {
            setItems(JSON.parse(raw) as Request[]);
          } catch {}
        }
      })
      .finally(() => setReady(true));
  }, []);
  async function save() {
    SetError('');
    if (!ready) {
      SetError('Espera a que terminen de cargar tus solicitudes.');
      return;
    }
    if (title.trim().length < 5 || title.trim().length > 120) {
      SetError('El título debe tener entre 5 y 120 caracteres.');
      return;
    }
    if (
      kind === 'Reparación' &&
      (!item.trim() || !since.trim() || !transport.trim())
    ) {
      SetError('Indica qué reparar, desde cuándo ocurre y cómo se trasladará.');
      return;
    }
    if (
      !title.trim() ||
      !category.trim() ||
      !description.trim() ||
      !location.trim()
    ) {
      SetError(
        'Completa el título, la categoría, la descripción y la ubicación aproximada.',
      );
      return;
    }
    const tasks =
      kind === 'Proyecto'
        ? taskText
            .split('\n')
            .map((x) => x.trim())
            .filter(Boolean)
            .map((x, i) => {
              const [name, amount] = x.split('|');
              return {
                id: String(i),
                title: name?.trim() || '',
                budget: amount?.trim() ? 'S/ ' + amount.trim() : 'Por cotizar',
                status: 'Recibiendo propuestas' as const,
              };
            })
        : [];
    if (kind === 'Proyecto' && (!tasks.length || tasks.some((t) => !t.title))) {
      SetError('Completa el nombre de cada tarea del proyecto.');
      return;
    }
    const request: Request = {
      id: String(Date.now()),
      kind,
      title,
      category,
      description,
      budget: budget || 'Necesito una cotización',
      deadline: deadline || 'Por acordar',
      modality: modality || 'Por acordar',
      location,
      approximate_latitude: requestArea?.latitude ?? null,
      approximate_longitude: requestArea?.longitude ?? null,
      item,
      brand,
      since,
      transport,
      photos,
      tasks,
    };
    const next = [request, ...items];
    try {
      await AsyncStorage.setItem(key, JSON.stringify(next));
    } catch {
      SetError(
        'No se pudo guardar. El almacenamiento local puede estar lleno; intenta con menos fotos.',
      );
      return;
    }
    setItems(next);
    S('');
    C('');
    D('');
    B('');
    F('');
    M('');
    L('');
    I('');
    Br('');
    Si('');
    Tr('');
    T('');
    setPhotos([]);
    setSelected(request);
    setScreen('detail');
  }
  const visible = nearby(items, searchArea, radius).filter(
    (x) =>
      (filter === 'Todas' || x.kind === filter) &&
      (!search ||
        [x.title, x.category, x.description]
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase())) &&
      (!zone || x.location.toLowerCase().includes(zone.toLowerCase())),
  );
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f4f5f7' }}>
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          maxWidth: 850,
          width: '100%',
          alignSelf: 'center',
          paddingBottom: 60,
        }}
      >
        <Pressable
          onPress={() =>
            screen === 'list' ? goBackOr('/(tabs)/publish') : setScreen('list')
          }
        >
          <Text style={{ color: '#0b2d5d', fontSize: 16 }}>
            ‹ {screen === 'list' ? 'Volver' : 'Solicitudes'}
          </Text>
        </Pressable>
        {!!error && (
          <Text
            accessibilityRole="alert"
            style={{ color: '#b91c1c', paddingVertical: 10 }}
          >
            {error}
          </Text>
        )}
        <Text
          style={{
            fontSize: 30,
            fontWeight: '800',
            color: '#0b2d5d',
            marginTop: 14,
          }}
        >
          Necesito una mano
        </Text>
        <Text
          style={{
            color: '#735a00',
            backgroundColor: '#fff5cf',
            padding: 12,
            borderRadius: 12,
            marginVertical: 12,
          }}
        >
          Vista previa local: datos de ejemplo guardados solo en este
          dispositivo. Puedes simular los roles de solicitante y trabajador. Los
          datos no se envían a otros usuarios.
        </Text>
        {screen === 'list' && (
          <>
            <Text style={{ color: '#6b7280', marginBottom: 12 }}>
              Encuentra ayuda, solicita una reparación o divide tu proyecto en
              tareas.
            </Text>
            <Input
              label="Buscar solicitud o categoría"
              value={search}
              onChangeText={Search}
            />
            <Input label="Distrito o ciudad" value={zone} onChangeText={Zone} />
            <NearbyFilter
              origin={searchArea}
              onOrigin={SetSearchArea}
              radius={radius}
              onRadius={SetRadius}
            />
            <Button
              label="Crear solicitud"
              onPress={() => setScreen('choose')}
            />
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 8,
                marginVertical: 16,
              }}
            >
              {['Todas', 'Ayuda', 'Reparación', 'Proyecto'].map((x) => (
                <Pressable
                  key={x}
                  onPress={() => setFilter(x)}
                  style={{
                    padding: 9,
                    borderRadius: 20,
                    backgroundColor: filter === x ? '#0b2d5d' : 'white',
                  }}
                >
                  <Text style={{ color: filter === x ? 'white' : '#0b2d5d' }}>
                    {x}
                  </Text>
                </Pressable>
              ))}
            </View>
            {ready &&
              visible.map((r) => (
                <Pressable
                  key={r.id}
                  onPress={() => {
                    setSelected(r);
                    setScreen('detail');
                  }}
                  style={box}
                >
                  <Text style={{ color: '#d7192d', fontWeight: '700' }}>
                    {r.kind} · {r.category}
                  </Text>
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: '700',
                      color: '#0b2d5d',
                      marginVertical: 7,
                    }}
                  >
                    {r.title}
                  </Text>
                  <Text numberOfLines={2} style={{ color: '#596579' }}>
                    {r.description}
                  </Text>
                  <Text style={{ marginTop: 10, color: '#0b2d5d' }}>
                    Presupuesto: {r.budget} · {r.location}
                    {r.distance != null
                      ? ` · ${r.distance.toFixed(1)} km aprox.`
                      : ''}
                  </Text>
                </Pressable>
              ))}
          </>
        )}
        {screen === 'choose' && (
          <>
            {(['Ayuda', 'Reparación', 'Proyecto'] as Kind[]).map((k) => (
              <Button
                key={k}
                label={
                  k === 'Ayuda'
                    ? 'Pedir un servicio o ayuda'
                    : k === 'Reparación'
                      ? 'Solicitar una reparación'
                      : 'Organizar un proyecto con varias tareas'
                }
                secondary
                onPress={() => {
                  setKind(k);
                  setScreen('form');
                }}
              />
            ))}
          </>
        )}
        {screen === 'form' && (
          <View style={box}>
            <Text
              style={{
                fontSize: 22,
                color: '#0b2d5d',
                fontWeight: '700',
                marginBottom: 16,
              }}
            >
              {kind === 'Ayuda'
                ? 'Pedir servicio o ayuda'
                : kind === 'Reparación'
                  ? 'Solicitar reparación'
                  : 'Organizar proyecto'}
            </Text>
            <Input
              label="Título *"
              value={title}
              onChangeText={S}
              placeholder="¿Qué necesitas?"
            />
            <Input
              label="Categoría *"
              value={category}
              onChangeText={C}
              placeholder="Ej. tecnología, limpieza"
            />
            <Input
              label="Descripción *"
              value={description}
              onChangeText={D}
              multiline
              placeholder="Explica el trabajo y qué esperas"
            />
            <Input
              label="Presupuesto disponible"
              value={budget}
              onChangeText={B}
              placeholder="Monto, rango o necesito una cotización"
            />
            <Input
              label="Fecha o plazo"
              value={deadline}
              onChangeText={F}
              placeholder="Ej. esta semana"
            />
            <AreaPicker value={requestArea} onChange={SetRequestArea} />
            <Input
              label="Modalidad"
              value={modality}
              onChangeText={M}
              placeholder="A domicilio, en local o remoto"
            />
            <Input
              label="Ubicación aproximada *"
              value={location}
              onChangeText={L}
              placeholder="Distrito o ciudad, sin dirección exacta"
            />
            {kind === 'Reparación' && (
              <>
                <Input
                  label="¿Qué necesitas reparar?"
                  value={item}
                  onChangeText={I}
                />
                <Input label="Marca y modelo" value={brand} onChangeText={Br} />
                <Input
                  label="¿Desde cuándo ocurre?"
                  value={since}
                  onChangeText={Si}
                />
                <Input
                  label="Traslado o atención a domicilio"
                  value={transport}
                  onChangeText={Tr}
                />
              </>
            )}
            {kind === 'Proyecto' && (
              <TaskEditor value={taskText} onChange={T} />
            )}
            <Button
              label="Añadir fotografías"
              secondary
              onPress={() => {
                void ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ['images'],
                  allowsMultipleSelection: true,
                  quality: 0.7,
                  base64: true,
                }).then((result) => {
                  if (!result.canceled)
                    setPhotos(
                      result.assets
                        .slice(0, 4)
                        .map((asset) =>
                          asset.base64
                            ? 'data:' +
                              (asset.mimeType || 'image/jpeg') +
                              ';base64,' +
                              asset.base64
                            : asset.uri,
                        ),
                    );
                });
              }}
            />
            <Text style={{ color: '#6b7280', marginVertical: 8 }}>
              Hasta 4 fotos para esta vista previa. Se guardan solo en el
              navegador.
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {photos.map((uri) => (
                <Image
                  key={uri}
                  source={{ uri }}
                  style={{ width: 72, height: 72, borderRadius: 8 }}
                />
              ))}
            </View>
            <Button label="Guardar vista previa" onPress={save} />
          </View>
        )}
        {screen === 'detail' && selected && (
          <>
            <View style={box}>
              <Text style={{ color: '#d7192d', fontWeight: '700' }}>
                {selected.kind} · {selected.category}
              </Text>
              <Text
                style={{
                  fontSize: 24,
                  color: '#0b2d5d',
                  fontWeight: '800',
                  marginVertical: 10,
                }}
              >
                {selected.title}
              </Text>
              <Text style={{ color: '#374151', lineHeight: 22 }}>
                {selected.description}
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: 8,
                  marginTop: 10,
                }}
              >
                {selected.photos?.map((uri) => (
                  <Image
                    key={uri}
                    source={{ uri }}
                    style={{ width: 90, height: 90, borderRadius: 8 }}
                  />
                ))}
              </View>
              <Text style={{ marginTop: 14, color: '#0b2d5d' }}>
                Presupuesto disponible: {selected.budget}
              </Text>
              <Text style={{ marginTop: 6 }}>Plazo: {selected.deadline}</Text>
              <Text style={{ marginTop: 6 }}>
                Modalidad: {selected.modality}
              </Text>
              <Text style={{ marginTop: 6 }}>
                Ubicación aproximada: {selected.location}
              </Text>
              {selected.kind === 'Reparación' && (
                <Text style={{ marginTop: 12 }}>
                  Objeto: {selected.item || 'No indicado'}
                  {'\n'}Marca y modelo: {selected.brand || 'No indicado'}
                  {'\n'}Desde cuándo: {selected.since || 'No indicado'}
                  {'\n'}Traslado: {selected.transport || 'No indicado'}
                </Text>
              )}
            </View>
            {selected.tasks.length > 0 && (
              <View style={box}>
                <Text
                  style={{
                    fontSize: 19,
                    fontWeight: '700',
                    color: '#0b2d5d',
                    marginBottom: 8,
                  }}
                >
                  Tareas del proyecto
                </Text>
                {selected.tasks.map((t) => (
                  <Text key={t.id} style={{ paddingVertical: 8 }}>
                    {t.title} · {t.budget}
                  </Text>
                ))}
              </View>
            )}
            <PreviewProposals
              key={selected.id}
              requestId={selected.id}
              isRepair={selected.kind === 'Reparación'}
              tasks={selected.tasks}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
