export const TRACKS = [
  { config: "text", label: "Text", group: "CHAT" },
  { config: "text_style_control", label: "Text style", group: "CHAT" },
  { config: "text_factuality", label: "Text factuality", group: "CHAT" },
  { config: "vision", label: "Vision", group: "CHAT" },
  { config: "vision_style_control", label: "Vision style", group: "CHAT" },
  { config: "document", label: "Document", group: "CHAT" },
  { config: "document_style_control", label: "Document style", group: "CHAT" },
  { config: "search", label: "Search", group: "CHAT" },
  { config: "search_style_control", label: "Search style", group: "CHAT" },
  { config: "search_factuality", label: "Search factuality", group: "CHAT" },
  { config: "webdev", label: "WebDev", group: "CODE" },
  { config: "agent", label: "Agent", group: "AGENT" },
  { config: "agent_capability", label: "Agent capability", group: "AGENT" },
  { config: "agent_task_outcome", label: "Task outcome", group: "AGENT" },
  { config: "agent_task_outcome_explicit", label: "Explicit outcome", group: "AGENT" },
  { config: "agent_tool_efficiency", label: "Tool efficiency", group: "AGENT" },
  { config: "agent_tool_hallucination", label: "Tool accuracy", group: "AGENT" },
  { config: "agent_steerability", label: "Steerability", group: "AGENT" },
  { config: "agent_praise_complaint", label: "User sentiment", group: "AGENT" },
  { config: "agent_bash_reliability", label: "Bash reliability", group: "AGENT" },
  { config: "agent_bash_recovery_steps", label: "Bash recovery", group: "AGENT" },
  { config: "text_to_image", label: "Text to image", group: "MEDIA" },
  { config: "image_edit", label: "Image editing", group: "MEDIA" },
  { config: "text_to_video", label: "Text to video", group: "MEDIA" },
  { config: "image_to_video", label: "Image to video", group: "MEDIA" },
  { config: "video_edit", label: "Video editing", group: "MEDIA" },
];

const TRACK_LABELS = new Map(TRACKS.map((track) => [track.config, track.label]));
const TRACK_ORDER = new Map(TRACKS.map((track, index) => [track.config, index]));
const numberFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const compactFormatter = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

export function getTrackLabel(config) {
  return TRACK_LABELS.get(config) || String(config || "Unknown track").replaceAll("_", " ");
}

export function getCategoryLabel(category) {
  return String(category || "overall").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatArenaScore(value) {
  if (value === null || value === undefined || value === "") return "—";
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return number > -100 && number < 100
    ? new Intl.NumberFormat("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(number)
    : numberFormatter.format(number);
}

export function formatArenaCount(value) {
  if (value === null || value === undefined || value === "") return "—";
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? compactFormatter.format(number) : "—";
}

export function formatArenaDate(value) {
  if (!value) return "Awaiting first sync";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(date);
}

export function getModelKey(row) {
  return JSON.stringify([String(row.organization || "unlisted").trim().toLowerCase(), String(row.model_name || "").trim().toLowerCase()]);
}

export function getDefaultTrack(rows = []) {
  const available = new Set(rows.map((row) => row.source_config));
  if (available.has("text")) return "text";
  return TRACKS.find((track) => available.has(track.config))?.config || TRACKS[0].config;
}

export function buildModelDirectory(rows = []) {
  const models = new Map();
  const seenSourceRows = new Set();

  for (const row of rows) {
    if (!row?.model_name) continue;
    const key = getModelKey(row);
    if (!models.has(key)) {
      models.set(key, {
        key,
        modelName: row.model_name,
        organization: row.organization || "Organization not reported",
        license: row.license || "License not reported",
        trackRecords: [],
      });
    }

    const sourceKey = row.source_key || `${row.source_config}:${row.category}:${row.rank}`;
    if (seenSourceRows.has(`${key}:${sourceKey}`)) continue;
    seenSourceRows.add(`${key}:${sourceKey}`);
    models.get(key).trackRecords.push(row);
  }

  return [...models.values()]
    .map((model) => ({
      ...model,
      trackRecords: model.trackRecords.sort((first, second) => {
        const trackDifference = (TRACK_ORDER.get(first.source_config) ?? 100) - (TRACK_ORDER.get(second.source_config) ?? 100);
        return trackDifference || Number(first.rank) - Number(second.rank);
      }),
    }))
    .sort((first, second) => first.modelName.localeCompare(second.modelName));
}

export function buildProviderDirectory(rows = []) {
  const providerMap = new Map();
  const seenModels = new Set();

  for (const row of rows) {
    const organization = row.organization || "Organization not reported";
    const providerKey = organization.toLowerCase();
    if (!providerMap.has(providerKey)) {
      providerMap.set(providerKey, { key: providerKey, organization, models: new Set(), tracks: new Set(), topRank: null, topModel: null, topConfig: null });
    }
    const provider = providerMap.get(providerKey);
    const modelKey = getModelKey(row);
    if (!seenModels.has(modelKey)) {
      provider.models.add(modelKey);
      seenModels.add(modelKey);
    }
    provider.tracks.add(row.source_config);
    if (Number.isFinite(Number(row.rank)) && (!provider.topRank || Number(row.rank) < provider.topRank)) {
      provider.topRank = Number(row.rank);
      provider.topModel = row.model_name;
      provider.topConfig = row.source_config;
    }
  }

  return [...providerMap.values()]
    .map((provider) => ({
      ...provider,
      modelCount: provider.models.size,
      trackCount: provider.tracks.size,
      models: undefined,
      tracks: [...provider.tracks],
    }))
    .sort((first, second) => second.modelCount - first.modelCount || first.organization.localeCompare(second.organization));
}
