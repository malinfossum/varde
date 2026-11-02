import type { FieldName, FieldValue } from "../schema/common.ts"
import { normaliseText, normaliseUrl, phoneDigits } from "../text/normalise.ts"

// The form two values are compared in, by the agreement gate and the scorer alike.
export function comparable(field: FieldName, value: FieldValue): string {
	if (typeof value === "boolean") return String(value)
	if (field === "phone") return phoneDigits(value)
	if (field === "website" || field === "chatUrl") return normaliseUrl(value)
	if (field === "email") return value.trim().toLowerCase()
	return normaliseText(value)
}
