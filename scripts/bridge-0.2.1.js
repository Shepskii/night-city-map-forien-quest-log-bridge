// The ?v= query busts the browser cache for this file on each release, like this file's versioned name.
import { STATUS_MAP, questData, gigSignature } from "./logic.js?v=0.2.1";

const MODULE_ID = "night-city-map-forien-quest-log-bridge";
const MAP_ID = "night-city-map";
const QUEST_LOG_ID = "forien-quest-log";
const LINK_FLAG = "nightCityGigId";

console.info(`${MODULE_ID} | Runtime build ${game.modules?.get?.(MODULE_ID)?.version} loaded.`);

let initialized = false;
let syncQueue = Promise.resolve();
let lastGigSignature = null;

function questLogDatabase() {
  return game.modules?.get?.(QUEST_LOG_ID)?.public?.QuestAPI?.DB;
}

function activeGM() {
  return game.user?.isGM && game.user.id === game.users.activeGM?.id;
}

function mapGigs() {
  return game.settings.get(MAP_ID, "state")?.quests ?? [];
}

function linkedJournalEntry(gigId) {
  return game.journal.contents.find(
    (entry) => entry.getFlag(MODULE_ID, LINK_FLAG) === gigId,
  );
}

async function syncGig(gig, database) {
  if (!gig?.id || !Object.hasOwn(STATUS_MAP, gig.status)) return;

  let entry = linkedJournalEntry(gig.id);
  let quest = entry ? database.getQuest(entry.id) : null;

  if (!entry) {
    quest = await database.createQuest({ data: questData(gig) });
    if (!quest?.entry) {
      throw new Error(`Forien's Quest Log did not create a quest for gig ${gig.id}.`);
    }
    entry = quest.entry;
    await entry.setFlag(MODULE_ID, LINK_FLAG, gig.id);
  }

  if (!quest) return;

  const data = questData(gig);
  let detailsChanged = false;
  for (const field of ["name", "giver", "giverName", "description", "gmnotes"]) {
    if (quest[field] !== data[field]) {
      quest[field] = data[field];
      detailsChanged = true;
    }
  }
  if (detailsChanged) await quest.save();

  if (quest.status !== data.status) await quest.setStatus(data.status);
}

// Remove the quest for a gig that no longer exists. Deleting the journal entry alone would leave a
// parent quest listing it and its subquests pointing at it, and the Quest Log's own delete is not in
// its public API, so this does what that delete does first: subquests move up to the quest's parent,
// and the parent lets go of it.
async function deleteQuestFor(entry, database) {
  const quest = database.getQuest(entry.id);
  if (quest) {
    const parent = quest.parent ? database.getQuest(quest.parent) : null;
    for (const childId of [...(quest.subquests ?? [])]) {
      const child = database.getQuest(childId);
      if (!child) continue;
      child.parent = parent?.id ?? null;
      await child.save();
      parent?.addSubquest(childId);
    }
    if (parent) {
      parent.removeSubquest(quest.id);
      await parent.save();
    }
  }
  await entry.delete();
}

async function synchronize() {
  if (!initialized || !activeGM()) return;

  const database = questLogDatabase();
  if (typeof database?.createQuest !== "function") {
    throw new Error("Forien's Quest Log public quest API is unavailable.");
  }

  const gigs = mapGigs();
  const gigIds = new Set(gigs.map((gig) => gig?.id).filter(Boolean));
  let failures = 0;
  for (const gig of gigs) {
    try {
      await syncGig(gig, database);
    } catch (error) {
      failures += 1;
      console.error(`${MODULE_ID} | Failed to synchronize gig ${gig?.id ?? "(unknown)"}.`, error);
    }
  }

  for (const entry of [...game.journal.contents]) {
    const gigId = entry.getFlag(MODULE_ID, LINK_FLAG);
    if (!gigId || gigIds.has(gigId)) continue;

    try {
      await deleteQuestFor(entry, database);
    } catch (error) {
      failures += 1;
      console.error(`${MODULE_ID} | Failed to delete quest for removed gig ${gigId}.`, error);
    }
  }

  if (failures) {
    ui.notifications.warn(
      `${MODULE_ID} | ${failures} Night City gig quest(s) could not be synchronized. See the console for details.`,
    );
  }
}

function queueSynchronization() {
  lastGigSignature = gigSignature(mapGigs());
  syncQueue = syncQueue
    .then(synchronize)
    .catch((error) => {
      console.error(`${MODULE_ID} | Gig synchronization failed.`, error);
    });
  return syncQueue;
}

// Every change to a gig is saved to the map's world setting, which fires this on every client. The
// map saves much more than gigs, so only a change to what the quests mirror starts a synchronization.
function onMapStateChanged(setting) {
  if (setting?.key !== `${MAP_ID}.state` || !initialized || !activeGM()) return;
  if (gigSignature(mapGigs()) !== lastGigSignature) queueSynchronization();
}

// The quests are reconciled with the map in full once the Quest Log is ready.
Hooks.once("ForienQuestLog.Lifecycle.ready", () => {
  initialized = true;
  if (activeGM()) queueSynchronization();
});

Hooks.on("updateSetting", onMapStateChanged);
// The very first save in a world creates the setting instead of updating it.
Hooks.on("createSetting", onMapStateChanged);

Hooks.once("ready", () => {
  if (!game.modules?.get?.(QUEST_LOG_ID)?.active) {
    console.warn(`${MODULE_ID} | Forien's Quest Log is not active; gig synchronization is disabled.`);
  }
});
