import { DEFAULT_VON_AI_FIELDS } from "../store/preferencesStore";
import type { DefaultAiFieldDefinition } from "../types/vonAiFields";

// The catalog of default AI fields mirrors the default fields shown in the
// Fields tab (DEFAULT_VON_AI_FIELDS in preferencesStore.ts). Keeping a single
// source of truth means a change to the VonIQ defaults automatically
// propagates here — no risk of the two catalogs drifting apart.
//
// Each VonIQ field is mapped to a runnable AiField definition: one generated
// column per field, with `name` reused as both the stable identifier and the
// column name. `objectType` is "opportunity" because all current VonIQ
// defaults operate on opportunities.
//
// `name` is the stable identifier — that's how the frontend matches a
// materialized row back to its definition. Don't rename `name` without a
// backend migration; `displayName` and `description` are free to change.

// VonIQ fields that should NOT appear as default AI fields. "Is Available"
// is a meta/system field rather than an opportunity insight, so it's
// excluded here.
const EXCLUDED_VONIQ_NAMES = new Set<string>(["von_ai_is_available"]);

// The opportunity-scope filter every default field runs against. Mirrors
// `_DEFAULT_OPPORTUNITY_FILTER` on the backend so scheduled runs and the
// playground evaluate the same opportunity set. Stored on the materialized
// AiField row so the backend's default doesn't need to be applied implicitly.
const DEFAULT_OPPORTUNITY_FILTER =
  "isclosed = FALSE AND createddate >= NOW() - INTERVAL '2 years'";

export const DEFAULT_AI_FIELDS: DefaultAiFieldDefinition[] =
  DEFAULT_VON_AI_FIELDS.filter((f) => !EXCLUDED_VONIQ_NAMES.has(f.name)).map(
    (f) => ({
      name: f.name,
      displayName: f.sourceFieldDisplayName,
      description: f.sourceFieldDescription,
      objectType: "opportunity",
      prompt: f.prompt ?? "",
      columnsToGenerate: [
        {
          name: f.name,
          description: f.sourceFieldDescription,
          type: f.type,
        },
      ],
      sources: [],
      opportunityFilter: DEFAULT_OPPORTUNITY_FILTER,
    }),
  );
