// Pure decisions for the bridge: how a Night City Map gig looks as a Forien's Quest Log quest, and
// whether the map's gigs have changed. No Foundry globals, so it can be tested on its own.

export const STATUS_MAP = {
  hidden: "inactive",
  offer: "available",
  active: "active",
  done: "completed",
  failed: "failed",
};

export function escapeHtml(text) {
  return String(text ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
}

// The map's plain text as HTML, which is how the Quest Log shows a description: a blank line starts a
// paragraph and a single line break stays a line break.
export function textToHtml(text) {
  return String(text ?? "")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

// The quest fields the bridge owns for a gig.
export function questData(gig) {
  return {
    name: gig.title || "Untitled Night City gig",
    status: STATUS_MAP[gig.status] ?? "inactive",
    giver: "abstract",
    giverName: gig.fixer || "Night City Map",
    description: textToHtml([gig.desc, gig.reward ? `Reward: ${gig.reward}` : ""].filter(Boolean).join("\n\n")),
    gmnotes: textToHtml(gig.notes),
    tasks: [],
    rewards: [],
  };
}

// What the quests mirror from the gigs. The map saves much more than gigs (messages, markers, the
// clock), so a save that leaves this unchanged needs no synchronization.
export function gigSignature(gigs) {
  return JSON.stringify((gigs ?? []).map((gig) => [
    gig?.id, gig?.status, gig?.title, gig?.fixer, gig?.desc, gig?.reward, gig?.notes,
  ]));
}
