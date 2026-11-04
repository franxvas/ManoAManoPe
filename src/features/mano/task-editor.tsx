import { Pressable, Text, TextInput, View } from 'react-native';

export function TaskEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const rows = value
    ? value.split('\n').map((line) => {
        const [title, amount] = line.split('|');
        return {
          title: title ?? '',
          amount: amount?.trim().replace(/^S\/\s*/i, '') ?? '',
        };
      })
    : [{ title: '', amount: '' }];
  function update(index: number, field: 'title' | 'amount', text: string) {
    onChange(
      rows
        .map((row, i) => {
          const next =
            i === index ? { ...row, [field]: text.replace(/[\n|]/g, '') } : row;
          return `${next.title}|${next.amount}`;
        })
        .join('\n'),
    );
  }
  return (
    <View style={{ marginVertical: 12 }}>
      <Text style={{ fontWeight: '700', color: '#0b2d5d' }}>
        Tareas del proyecto
      </Text>
      <Text style={{ color: '#6b7280', marginVertical: 6 }}>
        Cada tarea tendrá sus propias propuestas y una persona seleccionada.
      </Text>
      {rows.map((row, i) => (
        <View
          key={i}
          style={{
            padding: 12,
            borderWidth: 1,
            borderColor: '#d1d5db',
            borderRadius: 12,
            marginBottom: 10,
          }}
        >
          <Text>Tarea {i + 1}</Text>
          <TextInput
            accessibilityLabel={`Nombre de tarea ${i + 1}`}
            value={row.title}
            onChangeText={(text) => update(i, 'title', text)}
            placeholder="Ej. Fotografía"
            style={{ padding: 10, borderBottomWidth: 1, borderColor: '#ddd' }}
          />
          <TextInput
            accessibilityLabel={`Presupuesto de tarea ${i + 1}`}
            value={row.amount}
            onChangeText={(text) => update(i, 'amount', text)}
            placeholder="Presupuesto S/ (vacío: por cotizar)"
            keyboardType="decimal-pad"
            style={{ padding: 10 }}
          />
          {rows.length > 1 && (
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                onChange(
                  rows
                    .filter((_, j) => j !== i)
                    .map((r) => `${r.title}|${r.amount}`)
                    .join('\n'),
                )
              }
            >
              <Text style={{ color: '#b91c1c', padding: 8 }}>Quitar tarea</Text>
            </Pressable>
          )}
        </View>
      ))}
      {rows.length < 30 && (
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            onChange(
              rows
                .map((r) => `${r.title}|${r.amount}`)
                .concat('|')
                .join('\n'),
            )
          }
        >
          <Text style={{ color: '#0b2d5d', fontWeight: '700', padding: 10 }}>
            + Añadir tarea
          </Text>
        </Pressable>
      )}
    </View>
  );
}
