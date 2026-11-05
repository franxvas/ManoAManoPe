import { FavoriteButton } from '@/features/guardados/favorite-button';
import { readImage } from "@/services/images";
import { goBackOr } from "@/utils/navigation";
import { ScreenHeader } from "@/components/screen-header";
import { PeruLocationPicker } from "@/components/peru-location-picker";
import { errorMessage } from "@/utils/errors";
import { budgetLabel } from "./money";
import { nearby, type ApproximateArea } from "./area";
import { AreaPicker, NearbyFilter } from "./area-picker";
import { useCallback, useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/features/auth/auth-provider";
import { supabase } from "@/lib/supabase";
import * as api from "./api";
import { TaskEditor } from "./task-editor";
import { validateRequest } from "./validation";

const card = {
  backgroundColor: "#fff",
  padding: 16,
  borderRadius: 16,
  marginVertical: 8,
} as const;
const field = {
  borderColor: "#d1d5db",
  borderWidth: 1,
  borderRadius: 10,
  padding: 10,
  marginTop: 5,
  marginBottom: 10,
} as const;
function Button({ text, onPress }: { text: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: "#0b2d5d",
        borderRadius: 10,
        padding: 12,
        marginVertical: 4,
      }}
    >
      <Text style={{ color: "white", textAlign: "center", fontWeight: "700" }}>
        {text}
      </Text>
    </Pressable>
  );
}
function Field({
  label,
  value,
  set,
  placeholder,
  multiline = false,
}: {
  label: string;
  value: string;
  set: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <View>
      <Text style={{ fontWeight: "600", color: "#0b2d5d" }}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={set}
        placeholder={placeholder}
        multiline={multiline}
        style={[
          field,
          multiline ? { minHeight: 90, textAlignVertical: "top" } : {},
        ]}
      />
    </View>
  );
}
function Choice<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
        marginVertical: 8,
      }}
    >
      {options.map((x) => (
        <Pressable
          key={x}
          onPress={() => onChange(x)}
          style={{
            padding: 8,
            borderRadius: 12,
            backgroundColor: value === x ? "#0b2d5d" : "#eaf0f8",
          }}
        >
          <Text style={{ color: value === x ? "white" : "#0b2d5d" }}>
            {choiceLabel[x] ?? x}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
const choiceLabel: Record<string, string> = {
  all: "Todas",
  help: "Ayuda",
  repair: "Reparación",
  project: "Proyecto",
  home: "A domicilio",
  worker_location: "En el local",
  remote: "Remoto",
  diagnosis: "Diagnóstico",
  estimate: "Estimado",
  fixed: "Definido",
};
const labels = {
  help: "Ayuda",
  repair: "Reparación",
  project: "Proyecto",
} as const;
const states = {
  open: "Recibiendo propuestas",
  in_progress: "Trabajo en curso",
  completion_requested: "Esperando confirmación",
  completed: "Finalizada",
  cancelled: "Cancelada",
} as const;
function numberValue(v: string) {
  if (!v.trim()) return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) throw Error("Ingresa un importe válido.");
  return n;
}
function errorText(e: unknown) {
  return errorMessage(e);
}
export function ManoRemote() {
  const { requestId, taskId } = useLocalSearchParams<{
    requestId?: string;
    taskId?: string;
  }>();
  const { session } = useAuth();
  const [requestArea, SetRequestArea] = useState<ApproximateArea | null>(null);
  const [searchArea, SetSearchArea] = useState<ApproximateArea | null>(null);
  const [radius, SetRadius] = useState<number | null>(null);
  const user = session?.user.id;
  const [screen, show] = useState<"list" | "form" | "detail">("list");
  const [requests, setRequests] = useState<api.RequestRow[]>([]);
  const [current, setCurrent] = useState<api.RequestRow | null>(null);
  const [tasks, setTasks] = useState<api.TaskRow[]>([]);
  const [proposals, setProposals] = useState<api.ProposalRow[]>([]);
  const [task, setTask] = useState<api.TaskRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<"all" | api.Kind>("all");
  const [query, Q] = useState("");
  const [zone, Zone] = useState("");
  const [region, Region] = useState("");
  const [filterRegion, FilterRegion] = useState("");
  const [kind, K] = useState<api.Kind>("help");
  const [title, T] = useState("");
  const [category, C] = useState("");
  const [description, D] = useState("");
  const [min, Min] = useState("");
  const [max, Max] = useState("");
  const [deadline, Deadline] = useState("");
  const [modality, Mode] = useState<"home" | "worker_location" | "remote">(
    "home",
  );
  const [location, L] = useState("");
  const [item, I] = useState("");
  const [brand, B] = useState("");
  const [since, Since] = useState("");
  const [transport, Tr] = useState("");
  const [taskLines, TL] = useState("");
  const [photos, Photos] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [qkind, QK] = useState<api.QuoteKind>("fixed");
  const [qmin, QM] = useState("");
  const [qmax, QX] = useState("");
  const [scope, S] = useState("");
  const [duration, Du] = useState("");
  const [start, St] = useState("");
  const [materials, Ma] = useState("");
  const [inspection, Ins] = useState("");
  const [note, N] = useState("");
  const [revisions, SetRevisions] = useState<Record<string, api.RevisionRow[]>>(
    {},
  );
  const [messages, SetMessages] = useState<Record<string, api.MessageRow[]>>(
    {},
  );
  const [message, Message] = useState("");
  const [revision, Revision] = useState("");
  const [revisionScope, RevisionScope] = useState("");
  const [revisionMax, RevisionMax] = useState("");
  const [error, SetError] = useState("");
  const [rating, Rating] = useState("5");
  const [comment, Comment] = useState("");
  const run = useCallback(async (fn: () => Promise<void>) => {
    setBusy(true);
    SetError("");
    try {
      await fn();
    } catch (e) {
      SetError(errorText(e));
    } finally {
      setBusy(false);
    }
  }, []);
  const load = useCallback(
    async () => setRequests(await api.listRequests()),
    [],
  );
  useEffect(() => {
    let active = true;
    void api
      .listRequests()
      .then(async (rows) => {
        if (!active) return;
        setRequests(rows);
        const request = rows.find((r) => r.id === requestId);
        if (request) {
          const ts = await api.getTasks(request.id);
          const chosen = ts.find((t) => t.id === taskId) ?? ts[0] ?? null;
          const ps = chosen && user ? await api.getProposals(chosen.id) : [];
          if (active) {
            setCurrent(request);
            setTasks(ts);
            setTask(chosen);
            setProposals(ps);
            show("detail");
          }
        }
      })
      .catch((e) => SetError(errorText(e)));
    return () => {
      active = false;
    };
  }, [requestId, taskId, user]);
  async function details(r: api.RequestRow) {
    setCurrent(r);
    const ts = await api.getTasks(r.id);
    setTasks(ts);
    const chosen = ts.find((x) => x.id === task?.id) ?? ts[0] ?? null;
    setTask(chosen);
    setProposals(chosen && user ? await api.getProposals(chosen.id) : []);
    show("detail");
  }
  async function selectTask(t: api.TaskRow) {
    setTask(t);
    setProposals(user ? await api.getProposals(t.id) : []);
    SetRevisions({});
    SetMessages({});
  }
  async function create() {
    if (!user) throw Error("Inicia sesión para publicar.");
    if (
      !title.trim() ||
      !category.trim() ||
      !description.trim() ||
      !location.trim()
    )
      throw Error(
        "Completa título, categoría, descripción y ubicación aproximada.",
      );
    const lower = numberValue(min),
      upper = numberValue(max);
    if (lower !== null && upper !== null && lower > upper)
      throw Error("El máximo debe ser mayor o igual al mínimo.");
    const taskInputs =
      kind === "project"
        ? taskLines
            .split("\n")
            .map((x) => x.trim())
            .filter(Boolean)
            .map((x) => {
              const [name, budget] = x.split("|");
              return {
                title: name?.trim() || "",
                budget_min: numberValue(budget?.trim() || ""),
                budget_max: numberValue(budget?.trim() || ""),
              };
            })
        : [{ title: title.trim(), budget_min: lower, budget_max: upper }];
    if (!taskInputs.length || taskInputs.some((x) => !x.title))
      throw Error("Agrega al menos una tarea.");
    validateRequest(
      {
        kind,
        title,
        category,
        description,
        budget_min: lower,
        budget_max: upper,
        deadline: deadline || null,
        modality,
        approximate_location: location,
        repair_item: item,
        problem_since: since,
        transport,
        photos: photos.map((p) => p.uri),
      },
      taskInputs,
    );
    const paths: string[] = [];
    try {
      for (const photo of photos) {
        const {
          buffer: bytes,
          contentType,
          extension: ext,
        } = await readImage(photo.uri);
        const path = `${user}/mano/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error } = await supabase!.storage
          .from("listing-media")
          .upload(path, bytes, { contentType });
        if (error) throw error;
        paths.push(path);
      }
      const urls = paths.map(
        (path) =>
          supabase!.storage.from("listing-media").getPublicUrl(path).data
            .publicUrl,
      );
      await api.createRequest(
        {
          kind,
          title: title.trim(),
          category: category.trim(),
          description: description.trim(),
          budget_min: lower,
          budget_max: upper,
          deadline: deadline || null,
          modality,
          approximate_location: location.trim(),
          approximate_latitude: requestArea?.latitude ?? null,
          approximate_longitude: requestArea?.longitude ?? null,
          repair_item: item,
          brand_model: brand,
          problem_since: since,
          transport,
          photos: urls,
        },
        taskInputs,
      );
    } catch (e) {
      if (paths.length)
        await supabase!.storage.from("listing-media").remove(paths);
      throw e;
    }
    await load();
    T("");
    C("");
    D("");
    Min("");
    Max("");
    Deadline("");
    L("");
    I("");
    B("");
    Since("");
    Tr("");
    TL("");
    Photos([]);
    SetRequestArea(null);
    show("list");
  }
  async function submit() {
    if (!task) return;
    if (!scope.trim() || !duration.trim() || !start.trim() || !materials.trim())
      throw Error("Completa el alcance, tiempo, inicio y materiales.");
    const price = numberValue(qmin);
    if (price === null) throw Error("Ingresa el precio.");
    const maximum = numberValue(qmax);
    if (qkind === "estimate" && (maximum === null || maximum < price))
      throw Error("Indica un máximo válido para el rango.");
    await api.submitProposal(task.id, {
      quote_kind: qkind,
      amount_min: price,
      amount_max: qkind === "estimate" ? maximum : null,
      scope,
      duration,
      available_from: start,
      materials,
      inspection_cost: numberValue(inspection),
      note,
    });
    await selectTask(task);
    Alert.alert("Listo", "Propuesta enviada.");
  }
  async function loadExtras(p: api.ProposalRow) {
    const [r, m] = await Promise.all([
      api.listRevisions(p.id),
      api.listMessages(p.id),
    ]);
    SetRevisions((v) => ({ ...v, [p.id]: r }));
    SetMessages((v) => ({ ...v, [p.id]: m }));
  }
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f4f5f7" }}>
      <ScreenHeader title="Necesito una mano" showBack onBack={()=>screen === "list" ? goBackOr("/(tabs)/publish") : show("list")} />
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          maxWidth: 850,
          width: "100%",
          alignSelf: "center",
          paddingBottom: 70,
        }}
      >

        {busy && <Text>Procesando…</Text>}
        {!!error && (
          <Text
            accessibilityRole="alert"
            style={{ color: "#b91c1c", padding: 12 }}
          >
            {error}
          </Text>
        )}
        {screen === "list" && (
          <>
            <Field label="Buscar solicitud o categoría" value={query} set={Q} />
            <PeruLocationPicker
              region={filterRegion}
              city={zone}
              onChange={(r, c) => {
                FilterRegion(r);
                Zone(c);
              }}
            />
            <NearbyFilter
              origin={searchArea}
              onOrigin={SetSearchArea}
              radius={radius}
              onRadius={SetRadius}
            />
            <Button text="Crear solicitud" onPress={() => show("form")} />
            <Choice
              value={filter}
              options={["all", "help", "repair", "project"] as const}
              onChange={setFilter}
            />
            {nearby(requests, searchArea, radius)
              .filter(
                (r) =>
                  (filter === "all" || r.kind === filter) &&
                  (!query ||
                    [r.title, r.category, r.description]
                      .join(" ")
                      .toLowerCase()
                      .includes(query.toLowerCase())) &&
                  (!zone ||
                    r.approximate_location
                      .toLowerCase()
                      .includes(zone.toLowerCase())),
              )
              .map((r) => (
                <Pressable
                  key={r.id}
                  style={card}
                  onPress={() => void run(() => details(r))}
                >
                  <View style={{ position: "absolute", right: 12, top: 12, zIndex: 1 }}>
                    <FavoriteButton type="mano" id={r.id} size="sm" />
                  </View>
                  <Text style={{ color: "#d7192d" }}>
                    {labels[r.kind]} · {r.category}
                  </Text>
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: "700",
                      color: "#0b2d5d",
                    }}
                  >
                    {r.title}
                  </Text>
                  <Text>
                    {r.approximate_location}
                    {r.distance != null
                      ? ` · ${r.distance.toFixed(1)} km aprox.`
                      : ""}
                  </Text>
                </Pressable>
              ))}
          </>
        )}
        {screen === "form" && (
          <View style={card}>
            <Text>Tipo de solicitud</Text>
            <Choice
              value={kind}
              options={["help", "repair", "project"] as const}
              onChange={K}
            />
            <Field label="Título" value={title} set={T} />
            <Field label="Categoría" value={category} set={C} />
            <Field label="Descripción" value={description} set={D} />
            <Field
              label="Presupuesto mínimo (S/), opcional"
              value={min}
              set={Min}
            />
            <Field
              label="Presupuesto máximo (S/), opcional"
              value={max}
              set={Max}
            />
            <Field
              label="Fecha límite (AAAA-MM-DD), opcional"
              value={deadline}
              set={Deadline}
            />
            <AreaPicker value={requestArea} onChange={SetRequestArea} />
            <Text>Modalidad</Text>
            <Choice
              value={modality}
              options={["home", "worker_location", "remote"] as const}
              onChange={Mode}
            />
            <PeruLocationPicker
              region={region}
              city={location.split(",")[0] ?? ""}
              onChange={(r, c) => {
                Region(r);
                L(c ? `${c}, ${r}` : "");
              }}
            />
            {kind === "repair" && (
              <>
                <Field label="Qué reparar" value={item} set={I} />
                <Field label="Marca y modelo" value={brand} set={B} />
                <Field label="Desde cuándo ocurre" value={since} set={Since} />
                <Field
                  label="Traslado o domicilio"
                  value={transport}
                  set={Tr}
                />
              </>
            )}
            {kind === "project" && (
              <TaskEditor value={taskLines} onChange={TL} />
            )}
            <Button
              text="Añadir fotografías"
              onPress={() => {
                void ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ["images"],
                  allowsMultipleSelection: true,
                  quality: 0.7,
                }).then((result) => {
                  if (!result.canceled) Photos(result.assets.slice(0, 4));
                });
              }}
            />
            <Text>{photos.length} fotografía(s) seleccionadas</Text>
            <Button
              text={
                kind === "repair"
                  ? "Solicitar reparación"
                  : "Publicar solicitud"
              }
              onPress={() => {
                if (!busy) void run(create);
              }}
            />
          </View>
        )}
        {screen === "detail" && current && (
          <>
            <View style={card}>
              <Text style={{ color: "#d7192d" }}>
                {labels[current.kind]} · {current.category}
              </Text>
              <Text
                style={{ fontSize: 24, fontWeight: "700", color: "#0b2d5d" }}
              >
                {current.title}
              </Text>
              <Text>{current.description}</Text>
              <Text>
                Presupuesto disponible:{" "}
                {budgetLabel(current.budget_min, current.budget_max)}
              </Text>
              <Text>Ubicación aproximada: {current.approximate_location}</Text>
              {current.kind === "repair" && (
                <Text>
                  Objeto: {current.repair_item || "No indicado"} · Modelo:{" "}
                  {current.brand_model || "No indicado"} · Desde:{" "}
                  {current.problem_since || "No indicado"} · Traslado:{" "}
                  {current.transport || "No indicado"}
                </Text>
              )}
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {current.photos?.map((uri) => (
                  <Image
                    key={uri}
                    source={{ uri }}
                    style={{
                      width: 90,
                      height: 90,
                      margin: 4,
                      borderRadius: 8,
                    }}
                  />
                ))}
              </View>
            </View>
            <View style={card}>
              <Text style={{ fontWeight: "700" }}>Tareas y estado</Text>
              {tasks.map((t) => (
                <Pressable
                  key={t.id}
                  onPress={() => void run(() => selectTask(t))}
                >
                  <Text
                    style={{
                      padding: 8,
                      color: task?.id === t.id ? "#d7192d" : "#0b2d5d",
                    }}
                  >
                    {t.title} · {states[t.status]} ·{" "}
                    {budgetLabel(t.budget_min, t.budget_max)}
                  </Text>
                </Pressable>
              ))}
              {current.kind === "project" && (
                <Text>
                  {tasks.length > 0 &&
                  tasks.every(
                    (t) => t.status === "completed" || t.status === "cancelled",
                  )
                    ? "Proyecto terminado"
                    : "Proyecto en curso"}
                </Text>
              )}
            </View>
            {task &&
              user &&
              current.owner_id !== user &&
              task.status === "open" && (
                <View style={card}>
                  <Text style={{ fontWeight: "700" }}>
                    {current.kind === "repair"
                      ? "Enviar presupuesto"
                      : "Enviar propuesta"}
                  </Text>
                  {current.kind === "repair" && (
                    <Choice
                      value={qkind}
                      options={["diagnosis", "estimate", "fixed"] as const}
                      onChange={QK}
                    />
                  )}
                  <Text style={{ color: "#6b7280", marginBottom: 8 }}>
                    {qkind === "diagnosis"
                      ? "La revisión tiene su propio costo; el precio de reparación se confirma después."
                      : qkind === "estimate"
                        ? "El rango es estimado y está sujeto a revisión."
                        : "El precio definido incluye únicamente el alcance y los materiales indicados."}
                  </Text>
                  <Field label="Precio mínimo (S/)" value={qmin} set={QM} />
                  {qkind === "estimate" && (
                    <Field label="Precio máximo (S/)" value={qmax} set={QX} />
                  )}
                  <Field label="Qué incluye" value={scope} set={S} />
                  <Field label="Tiempo aproximado" value={duration} set={Du} />
                  <Field
                    label="Cuándo podrías empezar"
                    value={start}
                    set={St}
                  />
                  <Field
                    label="Materiales o repuestos"
                    value={materials}
                    set={Ma}
                  />
                  {current.kind === "repair" && (
                    <Field
                      label="Costo de revisión (S/), opcional"
                      value={inspection}
                      set={Ins}
                    />
                  )}
                  <Field label="Observación" value={note} set={N} />
                  <Button
                    text={
                      current.kind === "repair"
                        ? "Enviar presupuesto"
                        : "Enviar propuesta"
                    }
                    onPress={() => void run(submit)}
                  />
                </View>
              )}
            {task && (
              <View style={card}>
                <Text style={{ fontWeight: "700" }}>
                  Propuestas{" "}
                  {current.owner_id === user ? "recibidas" : "propias"}
                </Text>
                {!user && <Text>Inicia sesión para ver tus propuestas.</Text>}
                {proposals.map((p) => (
                  <View
                    key={p.id}
                    style={{
                      borderColor: "#ddd",
                      borderWidth: 1,
                      borderRadius: 10,
                      padding: 12,
                      marginTop: 10,
                    }}
                  >
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: "/profile/[id]",
                          params: { id: p.worker_id },
                        })
                      }
                    >
                      <Text style={{ fontWeight: "700" }}>
                        {p.profile?.display_name || "Trabajador"} ·{" "}
                        {p.profile?.profession || "Perfil"} ·{" "}
                        {p.profile?.rating_average ?? 0} ★ · Ver perfil
                      </Text>
                    </Pressable>
                    <Text>
                      {p.quote_kind === "diagnosis"
                        ? "Diagnóstico"
                        : p.quote_kind === "estimate"
                          ? "Estimado sujeto a revisión"
                          : "Definido"}
                      : S/ {p.amount_min}
                      {p.amount_max != null ? ` – ${p.amount_max}` : ""}
                    </Text>
                    <Text>Alcance: {p.scope}</Text>
                    <Text>
                      Tiempo: {p.duration} · Inicio: {p.available_from}
                    </Text>
                    <Text>
                      Materiales: {p.materials} · Revisión:{" "}
                      {p.inspection_cost == null
                        ? "No indicado"
                        : `S/ ${p.inspection_cost}`}
                    </Text>
                    <Text>{p.note}</Text>
                    <Text>Estado: {p.status}</Text>
                    {current.owner_id === user &&
                      p.status === "pending" &&
                      task.status === "open" && (
                        <>
                          <Button
                            text={
                              current.kind === "repair"
                                ? "Aceptar presupuesto"
                                : "Aceptar propuesta"
                            }
                            onPress={() =>
                              void run(async () => {
                                await api.acceptProposal(p.id);
                                await details(current);
                              })
                            }
                          />
                          <Button
                            text="Rechazar propuesta"
                            onPress={() =>
                              void run(async () => {
                                await api.rejectProposal(p.id);
                                await selectTask(task);
                              })
                            }
                          />
                        </>
                      )}
                    <>
                      {p.worker_id === user &&
                        p.status === "pending" &&
                        task.status === "open" && (
                          <Button
                            text="Editar mi propuesta"
                            onPress={() => {
                              QK(p.quote_kind);
                              QM(String(p.amount_min));
                              QX(
                                p.amount_max == null
                                  ? ""
                                  : String(p.amount_max),
                              );
                              S(p.scope);
                              Du(p.duration);
                              St(p.available_from);
                              Ma(p.materials);
                              Ins(
                                p.inspection_cost == null
                                  ? ""
                                  : String(p.inspection_cost),
                              );
                              N(p.note);
                              SetError(
                                "Edita los campos del formulario y envía para actualizar tu propuesta.",
                              );
                            }}
                          />
                        )}
                    </>
                    <Button
                      text="Ver conversación y actualizaciones"
                      onPress={() => void run(() => loadExtras(p))}
                    />
                    {messages[p.id] && (
                      <>
                        <Text style={{ fontWeight: "700" }}>
                          Conversación vinculada a esta solicitud
                        </Text>
                        {messages[p.id]?.map((m) => (
                          <Text key={m.id}>
                            {m.sender_id === user ? "Tú" : "Otra persona"}:{" "}
                            {m.body}
                          </Text>
                        ))}
                        <Field label="Mensaje" value={message} set={Message} />
                        <Button
                          text="Enviar mensaje"
                          onPress={() =>
                            void run(async () => {
                              if (!user || !message.trim()) return;
                              await api.sendMessage(p.id, user, message.trim());
                              Message("");
                              await loadExtras(p);
                            })
                          }
                        />
                      </>
                    )}
                    {revisions[p.id]?.map((r) => (
                      <View key={r.id}>
                        <Text>
                          Actualización: S/ {r.amount_min}{" "}
                          {r.amount_max != null ? `– ${r.amount_max}` : ""} ·{" "}
                          {r.scope} · {r.status}
                        </Text>
                        {current.owner_id === user &&
                          r.status === "pending" && (
                            <>
                              <Button
                                text="Aceptar actualización"
                                onPress={() =>
                                  void run(async () => {
                                    await api.respondRevision(r.id, true);
                                    await selectTask(task);
                                    await loadExtras(p);
                                  })
                                }
                              />
                              <Button
                                text="Rechazar actualización"
                                onPress={() =>
                                  void run(async () => {
                                    await api.respondRevision(r.id, false);
                                    await loadExtras(p);
                                  })
                                }
                              />
                            </>
                          )}
                      </View>
                    ))}
                    {p.worker_id === user &&
                      p.status === "accepted" &&
                      task.status === "in_progress" && (
                        <>
                          <Field
                            label="Nuevo precio propuesto (S/)"
                            value={revision}
                            set={Revision}
                          />
                          <Field
                            label="Nuevo precio máximo, si es estimado"
                            value={revisionMax}
                            set={RevisionMax}
                          />
                          <Field
                            label="Nuevo alcance y motivo del cambio"
                            value={revisionScope}
                            set={RevisionScope}
                          />
                          <Button
                            text="Solicitar actualización del presupuesto"
                            onPress={() =>
                              void run(async () => {
                                const amount = numberValue(revision);
                                if (amount === null)
                                  throw Error("Indica el nuevo precio");
                                if (!revisionScope.trim())
                                  throw Error(
                                    "Explica el alcance y motivo del cambio",
                                  );
                                await api.reviseQuote(
                                  p.id,
                                  amount,
                                  numberValue(revisionMax),
                                  revisionScope.trim(),
                                );
                                Revision("");
                                await loadExtras(p);
                              })
                            }
                          />
                          <Button
                            text="Solicitar confirmación de finalización"
                            onPress={() =>
                              void run(async () => {
                                await api.changeTask(
                                  task.id,
                                  "request_completion",
                                );
                                await details(current);
                              })
                            }
                          />
                        </>
                      )}
                    {current.owner_id === user &&
                      p.status === "accepted" &&
                      task.status === "completion_requested" && (
                        <Button
                          text="Confirmar finalización"
                          onPress={() =>
                            void run(async () => {
                              await api.changeTask(
                                task.id,
                                "confirm_completion",
                              );
                              await details(current);
                            })
                          }
                        />
                      )}
                  </View>
                ))}
              </View>
            )}
            {task && current.owner_id === user && task.status === "open" && (
              <Button
                text="Cancelar tarea"
                onPress={() =>
                  void run(async () => {
                    await api.changeTask(task.id, "cancel");
                    await details(current);
                  })
                }
              />
            )}{" "}
            {task &&
              current.owner_id === user &&
              task.status === "completed" && (
                <View style={card}>
                  <Text>Calificar trabajo</Text>
                  <Field
                    label="Calificación del 1 al 5"
                    value={rating}
                    set={Rating}
                  />
                  <Field label="Comentario" value={comment} set={Comment} />
                  <Button
                    text="Enviar calificación"
                    onPress={() =>
                      void run(async () => {
                        await api.submitReview(
                          task.id,
                          Number(rating),
                          comment,
                        );
                        Alert.alert("Gracias", "Calificación enviada.");
                      })
                    }
                  />
                </View>
              )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
