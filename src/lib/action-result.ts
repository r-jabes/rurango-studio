export type FieldErrors = Record<string, string[] | undefined>;

export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | {
      ok: false;
      message: string;
      fieldErrors?: FieldErrors;
    };

export function ok<T = undefined>(data?: T, message?: string): ActionResult<T> {
  return { ok: true, data, message };
}

export function fail(
  message: string,
  fieldErrors?: FieldErrors,
): ActionResult<never> {
  return { ok: false, message, fieldErrors };
}

export function formDataToObject(formData: FormData) {
  const result: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      result[key] = value;
    }
  }
  return result;
}
