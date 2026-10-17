const MODULE_ID = "night-city-map-forien-quest-log-bridge";
const MAP_ID = "night-city-map";
const QUEST_LOG_ID = "forien-quest-log";
const LINK_FLAG = "nightCityGigId";

const STATUS_MAP = {
  hidden: "inactive",
  offer: "available",
  active: "active",
  done: "completed",
  failed: "failed",
};

let initialized = false;
let syncQueue = Promise.resolve();

function questLogDatabase() {
  return game.modules.get(QUEST_LOG_ID)?.public?.QuestAPI?.DB;
}

function activeGM() {
  return game.user?.isGM && game.user.id === game.users.activeGM?.id;
}

function questData(gig) {
  const details = [gig.desc, gig.reward ? `Reward: ${gig.reward}` : ""]
    .filter(Boolean)
    .join("\n\n");

  return {
    name: gig.title || "Untitled Night City gig",
    status: STATUS_MAP[gig.status] ?? "inactive",
    giver: "abstract",
    giverName: gig.fixer || "Night City Map",
    description: details,
    gmnotes: gig.notes || "",
    tasks: [],
    rewards: [],
  };
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
  if (quest.name !== data.name) {
    quest.name = data.name;
    detailsChanged = true;
  }
  if (quest.giver !== data.giver) {
    quest.giver = data.giver;
    detailsChanged = true;
  }
  if (quest.giverName !== data.giverName) {
    quest.giverName = data.giverName;
    detailsChanged = true;
  }
  if (quest.description !== data.description) {
    quest.description = data.description;
    detailsChanged = true;
  }
  if (quest.gmnotes !== data.gmnotes) {
    quest.gmnotes = data.gmnotes;
    detailsChanged = true;
  }
  if (detailsChanged) await quest.save();

  const targetStatus = STATUS_MAP[gig.status];
  if (quest.status !== targetStatus) await quest.setStatus(targetStatus);
}

async function synchronize() {
  if (!initialized || !activeGM()) return;

  const database = questLogDatabase();
  if (typeof database?.createQuest !== "function") {
    throw new Error("Forien's Quest Log public quest API is unavailable.");
  }

  const mapState = game.settings.get(MAP_ID, "state");
  const gigs = mapState?.quests ?? [];
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
      await entry.delete();
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
  syncQueue = syncQueue
    .then(synchronize)
    .catch((error) => {
      console.error(`${MODULE_ID} | Gig synchronization failed.`, error);
    });
  return syncQueue;
}

function onMapStateSettingChanged(setting) {
  if (setting.key !== `${MAP_ID}.state` || !initialized || !activeGM()) return;
  queueSynchronization();
}

Hooks.once("setup", () => {
  const settings = game.settings;
  const setSetting = settings.set;

  settings.set = async function (namespace, key, value, ...args) {
    const result = await setSetting.call(this, namespace, key, value, ...args);
    if (namespace === MAP_ID && key === "state" && initialized && activeGM()) {
      queueSynchronization();
    }
    return result;
  };
});

for (const hook of ["createSetting", "updateSetting"]) {
  Hooks.on(hook, onMapStateSettingChanged);
}

Hooks.once("ForienQuestLog.Lifecycle.ready", () => {
  initialized = true;
  queueSynchronization();
});

Hooks.once("ready", () => {
  if (!game.modules.get(QUEST_LOG_ID)?.active) {
    console.warn(`${MODULE_ID} | Forien's Quest Log is not active; gig synchronization is disabled.`);
  }
});
