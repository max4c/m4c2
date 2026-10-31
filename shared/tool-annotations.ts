export function toolAnnotations(name: string, readOnly: boolean) {
  return {
    readOnlyHint: readOnly,
    destructiveHint: name === "delete_entry",
    // All log_* tools and update_entry share these hints. Their optional
    // requestId provides retry protection; the unqualified operation may not.
    idempotentHint: readOnly || name === "delete_entry",
    openWorldHint: ["lookup_food", "upload_photo_url", "get_sleep"].includes(
      name,
    ),
  };
}
