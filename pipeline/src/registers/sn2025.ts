// SN2025 codes whose units can be Varde services, from SSB's notat on how kommuner use the
// codes and KLASS classification 6 (my research notes, 28.10.2026). This list is a recall
// lever, not a gate: every unit still passes the five gates in PR 3.

// Service units (Brreg /underenheter) of a kommune or an organisation.
export const UNIT_CODES = [
	"88.995", // social office services: Nav, advice and guidance
	"88.991", // child welfare
	"88.992", // family counselling
	"88.994", // welfare services for vulnerable groups: rus, outreach
	"88.996", // other social services without housing: frivilligsentraler, activity
	"88.993", // work training and sheltered work
	"88.102", // day activity services
	"87.999", // other social housing services: krisesentre in practice
	"86.942", // helsestasjon and school health services
	"86.941", // health services at home: psykisk helse and rus teams
	"86.992", // preventive health work: frisklivssentraler
	"84.300", // administration of social security: Nav's state part
] as const

// Main units (Brreg /enheter) that are services themselves, mostly voluntary organisations.
export const ORGANISATION_CODES = ["88.996", "88.994", "88.995", "94.992"] as const

// Legevakt shares 86.210 with every GP practice (13,419 units), so it is found by name.
export const NAMED_UNITS = ["legevakt"] as const
