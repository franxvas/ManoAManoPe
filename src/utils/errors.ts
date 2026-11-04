export function errorMessage(error: unknown) {
  const message =
    error && typeof error === "object" && "message" in error
      ? String(error.message)
      : "";
  if (
    /schema cache|does not exist|could not find.*(table|function)/i.test(
      message,
    )
  )
    return "Esta sección necesita una actualización de la base de datos. Inténtalo cuando esté habilitada.";
  if (/fetch|network|offline/i.test(message))
    return "No pudimos conectarnos. Revisa tu conexión e inténtalo otra vez.";
  return message || "No se pudo completar la acción. Inténtalo otra vez.";
}
