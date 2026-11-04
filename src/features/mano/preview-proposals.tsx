import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { parsePriceRange } from './money';
import {
  advanceProgress,
  isProjectFinished,
  type WorkProgress,
} from './progress';

type Quote = {
  id: string;
  task: string;
  worker: string;
  price: string;
  kind: string;
  scope: string;
  duration: string;
  start: string;
  materials: string;
  inspection: string;
  note: string;
  status: 'Pendiente' | 'Aceptada' | 'Rechazada';
  revision?: {
    price: string;
    scope: string;
    status: 'Pendiente' | 'Aceptada' | 'Rechazada';
  };
  messages: string[];
  progress?: WorkProgress;
  rating?: number;
  review?: string;
};
type Task = { id: string; title: string; status: string };
const button = {
  backgroundColor: '#0b2d5d',
  padding: 10,
  borderRadius: 9,
  marginTop: 8,
} as const;
const input = {
  borderWidth: 1,
  borderColor: '#d1d5db',
  borderRadius: 8,
  padding: 9,
  marginTop: 6,
} as const;
function Btn({ text, onPress }: { text: string; onPress: () => void }) {
  return (
    <Pressable style={button} onPress={onPress}>
      <Text style={{ color: 'white', textAlign: 'center' }}>{text}</Text>
    </Pressable>
  );
}
function Field({
  label,
  value,
  change,
}: {
  label: string;
  value: string;
  change: (s: string) => void;
}) {
  return (
    <View style={{ marginTop: 8 }}>
      <Text>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        style={input}
        value={value}
        onChangeText={change}
      />
    </View>
  );
}
export function PreviewProposals({
  requestId,
  isRepair,
  tasks,
}: {
  requestId: string;
  isRepair: boolean;
  tasks: Task[];
}) {
  const key = `mano-preview-quotes-${requestId}`;
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [selected, setSelected] = useState(tasks[0]?.id ?? 'main');
  const [role, setRole] = useState<'Solicitante' | 'Trabajador'>('Trabajador');
  const [worker, W] = useState('Trabajador demo');
  const [price, P] = useState('');
  const [kind, K] = useState('Presupuesto definido');
  const [scope, S] = useState('');
  const [duration, D] = useState('');
  const [start, A] = useState('');
  const [materials, M] = useState('');
  const [inspection, I] = useState('');
  const [note, N] = useState('');
  const [revision, R] = useState('');
  const [revisionScope, RS] = useState('');
  const [message, G] = useState('');
  const [feedback, Feedback] = useState('');
  const [rating, Rating] = useState('5');
  const [review, Review] = useState('');
  const [cancelled, Cancelled] = useState<string[]>([]);
  useEffect(() => {
    void AsyncStorage.getItem(key + '-cancelled').then((raw) => {
      if (raw) {
        try {
          Cancelled(JSON.parse(raw) as string[]);
        } catch {}
      }
    });
  }, [key]);
  useEffect(() => {
    void AsyncStorage.getItem(key).then((raw) => {
      if (raw) {
        try {
          setQuotes(JSON.parse(raw) as Quote[]);
        } catch {}
      }
    });
  }, [key]);
  const save = (next: Quote[]) => {
    setQuotes(next);
    void AsyncStorage.setItem(key, JSON.stringify(next));
  };
  const shown = quotes.filter((q) => q.task === selected);
  const accepted = shown.find((q) => q.status === 'Aceptada');
  function submit() {
    try {
      const amount = parsePriceRange(price);
      if (kind === 'Presupuesto estimado' && amount.max === null)
        throw Error('Indica un rango para el presupuesto estimado.');
      if (inspection.trim()) parsePriceRange(inspection);
    } catch (e) {
      Feedback(e instanceof Error ? e.message : 'Precio inválido');
      return;
    }
    if (cancelled.includes(selected)) {
      Feedback('La tarea está cancelada.');
      return;
    }
    if (
      !worker.trim() ||
      !price.trim() ||
      !scope.trim() ||
      !duration.trim() ||
      !start.trim() ||
      !materials.trim()
    ) {
      Feedback(
        'Completa trabajador, precio, alcance, tiempo, inicio y materiales.',
      );
      return;
    }
    if (accepted) {
      Feedback('Esta tarea ya no recibe propuestas.');
      return;
    }
    const existing = shown.find(
      (q) => q.worker.trim().toLowerCase() === worker.trim().toLowerCase(),
    );
    if (existing && existing.status !== 'Pendiente') {
      Feedback('Esta propuesta ya fue rechazada o aceptada.');
      return;
    }
    const q: Quote = {
      id: existing?.id ?? String(Date.now()),
      task: selected,
      worker,
      price,
      kind,
      scope,
      duration,
      start,
      materials,
      inspection,
      note,
      status: 'Pendiente',
      messages: existing?.messages ?? [],
    };
    save([...quotes.filter((x) => x.id !== q.id), q]);
    Feedback('Propuesta guardada en este navegador.');
  }
  function accept(id: string) {
    if (role !== 'Solicitante' || cancelled.includes(selected) || accepted) {
      Feedback('La tarea ya no recibe propuestas.');
      return;
    }
    save(
      quotes.map((q) =>
        q.task !== selected || q.status !== 'Pendiente'
          ? q
          : {
              ...q,
              status: q.id === id ? 'Aceptada' : 'Rechazada',
              progress: q.id === id ? 'in_progress' : q.progress,
            },
      ),
    );
  }
  function finish(
    id: string,
    action: 'request_completion' | 'confirm_completion',
  ) {
    try {
      save(
        quotes.map((q) =>
          q.id === id
            ? {
                ...q,
                progress: advanceProgress(
                  q.progress ?? 'in_progress',
                  action,
                  role,
                  q.revision?.status === 'Pendiente',
                ),
              }
            : q,
        ),
      );
      Feedback('Estado actualizado.');
    } catch (e) {
      Feedback(e instanceof Error ? e.message : 'No se pudo actualizar.');
    }
  }
  const progressLabels: Record<WorkProgress, string> = {
    open: 'Recibiendo propuestas',
    in_progress: 'Trabajo en curso',
    completion_requested: 'Esperando confirmación del solicitante',
    completed: 'Finalizada',
    cancelled: 'Cancelada',
  };
  return (
    <View
      style={{
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 18,
        marginBottom: 12,
      }}
    >
      <Text style={{ fontSize: 20, fontWeight: '700', color: '#0b2d5d' }}>
        Propuestas · demostración
      </Text>
      <Text
        accessibilityRole="alert"
        style={{ color: '#b91c1c', marginVertical: 6 }}
      >
        {feedback}
      </Text>
      <Text style={{ color: '#6b7280', marginTop: 6 }}>
        Simula ambos roles en este dispositivo. Los datos no se envían a otros
        usuarios.
      </Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {(['Trabajador', 'Solicitante'] as const).map((r) => (
          <Pressable
            key={r}
            onPress={() => setRole(r)}
            style={{
              padding: 9,
              marginTop: 8,
              borderRadius: 10,
              backgroundColor: role === r ? '#0b2d5d' : '#edf1f7',
            }}
          >
            <Text style={{ color: role === r ? 'white' : '#0b2d5d' }}>{r}</Text>
          </Pressable>
        ))}
      </View>
      {tasks.length > 0 && (
        <View style={{ marginTop: 10 }}>
          <Text>Tarea seleccionada:</Text>
          {tasks.map((t) => (
            <Pressable key={t.id} onPress={() => setSelected(t.id)}>
              <Text
                style={{
                  padding: 8,
                  color: selected === t.id ? '#d7192d' : '#0b2d5d',
                }}
              >
                {selected === t.id ? '●' : '○'} {t.title}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
      <View style={{ marginTop: 12 }}>
        {tasks.map((t) => {
          const q = quotes.find(
            (x) => x.task === t.id && x.status === 'Aceptada',
          );
          return (
            <Text key={t.id}>
              {t.title}:{' '}
              {
                progressLabels[
                  cancelled.includes(t.id)
                    ? 'cancelled'
                    : (q?.progress ?? (q ? 'in_progress' : 'open'))
                ]
              }
            </Text>
          );
        })}
        {tasks.length > 1 && (
          <Text style={{ fontWeight: '700' }}>
            Proyecto:{' '}
            {isProjectFinished(
              tasks.map((t) => {
                const q = quotes.find(
                  (x) => x.task === t.id && x.status === 'Aceptada',
                );
                return cancelled.includes(t.id)
                  ? 'cancelled'
                  : (q?.progress ?? (q ? 'in_progress' : 'open'));
              }),
            )
              ? 'Finalizado'
              : 'Pendiente de finalizar todas sus tareas'}
          </Text>
        )}
      </View>
      {role === 'Solicitante' && !accepted && !cancelled.includes(selected) && (
        <Btn
          text="Cancelar esta tarea"
          onPress={() => {
            const next = [...cancelled, selected];
            Cancelled(next);
            void AsyncStorage.setItem(key + '-cancelled', JSON.stringify(next));
          }}
        />
      )}
      {role === 'Trabajador' && !accepted && !cancelled.includes(selected) && (
        <View>
          <Field label="Nombre del trabajador demo" value={worker} change={W} />
          {isRepair && (
            <View style={{ marginTop: 10 }}>
              <Text>Tipo de presupuesto:</Text>
              {[
                'Revisión o diagnóstico',
                'Presupuesto estimado',
                'Presupuesto definido',
              ].map((x) => (
                <Pressable key={x} onPress={() => K(x)}>
                  <Text
                    style={{
                      padding: 6,
                      color: kind === x ? '#d7192d' : '#0b2d5d',
                    }}
                  >
                    {kind === x ? '●' : '○'} {x}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
          <Field label="Precio o rango (S/)" value={price} change={P} />
          <Field label="Qué incluye el trabajo" value={scope} change={S} />
          <Field label="Tiempo aproximado" value={duration} change={D} />
          <Field label="Cuándo podría empezar" value={start} change={A} />
          <Field
            label="Materiales o repuestos incluidos"
            value={materials}
            change={M}
          />
          {isRepair && (
            <Field
              label="Costo de revisión, si corresponde"
              value={inspection}
              change={I}
            />
          )}
          <Field label="Observación adicional" value={note} change={N} />
          <Btn
            text={isRepair ? 'Enviar presupuesto' : 'Enviar propuesta'}
            onPress={submit}
          />
        </View>
      )}
      {shown
        .filter(
          (q) =>
            role === 'Solicitante' ||
            q.worker.trim().toLowerCase() === worker.trim().toLowerCase(),
        )
        .map((q) => (
          <View
            key={q.id}
            style={{
              borderWidth: 1,
              borderColor: '#e5e7eb',
              padding: 12,
              borderRadius: 12,
              marginTop: 12,
            }}
          >
            <Text style={{ fontWeight: '700', color: '#0b2d5d' }}>
              {q.worker} · {q.status}
            </Text>
            <Text>
              {q.kind}: {q.price}
            </Text>
            <Text>Alcance: {q.scope}</Text>
            <Text>
              Tiempo: {q.duration} · Inicio: {q.start}
            </Text>
            <Text>Materiales: {q.materials}</Text>
            {!!q.inspection && <Text>Revisión: {q.inspection}</Text>}
            {!!q.note && <Text>Observación: {q.note}</Text>}
            {role === 'Solicitante' &&
              !cancelled.includes(selected) &&
              q.status === 'Pendiente' && (
                <>
                  <Btn
                    text={
                      isRepair ? 'Aceptar presupuesto' : 'Aceptar propuesta'
                    }
                    onPress={() => accept(q.id)}
                  />
                  <Btn
                    text="Rechazar"
                    onPress={() =>
                      save(
                        quotes.map((x) =>
                          x.id === q.id ? { ...x, status: 'Rechazada' } : x,
                        ),
                      )
                    }
                  />
                </>
              )}
            {role === 'Trabajador' &&
              q.status === 'Pendiente' &&
              !cancelled.includes(selected) && (
                <Btn
                  text="Editar mi propuesta"
                  onPress={() => {
                    W(q.worker);
                    P(q.price);
                    K(q.kind);
                    S(q.scope);
                    D(q.duration);
                    A(q.start);
                    M(q.materials);
                    I(q.inspection);
                    N(q.note);
                    Feedback(
                      'Edita los campos y vuelve a enviar para actualizar tu propuesta.',
                    );
                  }}
                />
              )}
            {q.status === 'Aceptada' && (
              <>
                {role === 'Trabajador' &&
                  (q.progress ?? 'in_progress') === 'in_progress' && (
                    <>
                      <Field
                        label="Nuevo precio o rango (S/)"
                        value={revision}
                        change={R}
                      />
                      <Field
                        label="Nuevo alcance y motivo del cambio"
                        value={revisionScope}
                        change={RS}
                      />
                      <Btn
                        text="Solicitar actualización del presupuesto"
                        onPress={() => {
                          if (q.revision?.status === 'Pendiente') {
                            Feedback(
                              'Resuelve primero la actualización pendiente.',
                            );
                            return;
                          }
                          try {
                            parsePriceRange(revision);
                            if (!revisionScope.trim())
                              throw Error(
                                'Explica el alcance y el motivo del cambio.',
                              );
                          } catch (e) {
                            Feedback(
                              e instanceof Error
                                ? e.message
                                : 'Datos inválidos',
                            );
                            return;
                          }
                          save(
                            quotes.map((x) =>
                              x.id === q.id
                                ? {
                                    ...x,
                                    revision: {
                                      price: revision,
                                      scope: revisionScope,
                                      status: 'Pendiente',
                                    },
                                  }
                                : x,
                            ),
                          );
                          R('');
                        }}
                      />
                    </>
                  )}
                {q.revision && (
                  <>
                    <Text style={{ marginTop: 8 }}>
                      Actualización: {q.revision.price} · {q.revision.scope} ·{' '}
                      {q.revision.status}
                    </Text>
                    {role === 'Solicitante' &&
                      q.revision.status === 'Pendiente' && (
                        <>
                          <Btn
                            text="Aceptar actualización"
                            onPress={() =>
                              save(
                                quotes.map((x) =>
                                  x.id === q.id && x.revision
                                    ? {
                                        ...x,
                                        price: x.revision.price,
                                        scope: x.revision.scope,
                                        revision: {
                                          ...x.revision,
                                          status: 'Aceptada',
                                        },
                                      }
                                    : x,
                                ),
                              )
                            }
                          />
                          <Btn
                            text="Rechazar actualización"
                            onPress={() =>
                              save(
                                quotes.map((x) =>
                                  x.id === q.id && x.revision
                                    ? {
                                        ...x,
                                        revision: {
                                          ...x.revision,
                                          status: 'Rechazada',
                                        },
                                      }
                                    : x,
                                ),
                              )
                            }
                          />
                        </>
                      )}
                  </>
                )}
                <Text style={{ marginTop: 10, fontWeight: '700' }}>
                  {progressLabels[q.progress ?? 'in_progress']}
                </Text>
                {role === 'Trabajador' &&
                  (q.progress ?? 'in_progress') === 'in_progress' && (
                    <Btn
                      text="Solicitar confirmación de finalización"
                      onPress={() => finish(q.id, 'request_completion')}
                    />
                  )}{' '}
                {role === 'Solicitante' &&
                  q.progress === 'completion_requested' && (
                    <Btn
                      text="Confirmar finalización"
                      onPress={() => finish(q.id, 'confirm_completion')}
                    />
                  )}{' '}
                {role === 'Solicitante' &&
                  q.progress === 'completed' &&
                  !q.rating && (
                    <>
                      <Field
                        label="Calificación (1 al 5)"
                        value={rating}
                        change={Rating}
                      />
                      <Field
                        label="Comentario del trabajo"
                        value={review}
                        change={Review}
                      />
                      <Btn
                        text="Guardar calificación"
                        onPress={() => {
                          const n = Number(rating);
                          if (!Number.isInteger(n) || n < 1 || n > 5) {
                            Feedback('La calificación debe estar entre 1 y 5.');
                            return;
                          }
                          save(
                            quotes.map((x) =>
                              x.id === q.id ? { ...x, rating: n, review } : x,
                            ),
                          );
                        }}
                      />
                    </>
                  )}{' '}
                {!!q.rating && (
                  <Text>
                    Calificación: {q.rating}/5 · {q.review}
                  </Text>
                )}
                <Text style={{ fontWeight: '700', marginTop: 10 }}>
                  Conversación vinculada
                </Text>
                {q.messages.map((m, i) => (
                  <Text key={i}>{m}</Text>
                ))}
                <Field
                  label="Mensaje de demostración"
                  value={message}
                  change={G}
                />
                <Btn
                  text="Enviar mensaje"
                  onPress={() => {
                    if (!message.trim()) return;
                    save(
                      quotes.map((x) =>
                        x.id === q.id
                          ? {
                              ...x,
                              messages: [...x.messages, `${role}: ${message}`],
                            }
                          : x,
                      ),
                    );
                    G('');
                  }}
                />
              </>
            )}
          </View>
        ))}
    </View>
  );
}
