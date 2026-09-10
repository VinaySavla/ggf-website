export function mergeSportStats(records) {
  const sports = new Map();
  for (const record of records) {
    const entry = sports.get(record.sport.id) || { id: record.sport.id, name: record.sport.name, totals: {}, events: [] };
    const stats = record.statsJson && typeof record.statsJson === "object" && !Array.isArray(record.statsJson) ? record.statsJson : {};
    for (const [key, value] of Object.entries(stats)) {
      const number = Number(value);
      if (Number.isFinite(number)) entry.totals[key] = (entry.totals[key] || 0) + number;
    }
    entry.events.push({ id: record.id, label: record.label || record.tournament?.event?.title || "Recorded stats", stats });
    sports.set(record.sport.id, entry);
  }
  return [...sports.values()].sort((a, b) => a.name.localeCompare(b.name));
}
