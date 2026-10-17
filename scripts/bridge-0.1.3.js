const MODULE_ID = "night-city-map-forien-quest-log-bridge";
const MAP_ID = "night-city-map";
const QUEST_LOG_ID = "forien-quest-log";
const SOCKET = `module.${MODULE_ID}`;
const LINK_FLAG = "nightCityGigId";
const WRAPPED_HANDLER_FLAG = "__nightCityQuestLogBridge";

console.info(`${MODULE_ID} | Runtime build 0.1.3 loaded.`);

const STATUS_MAP = {
  hidden: "inactive",
  offer: "available",
  active: "active",
  done: "completed",
  failed: "failed",
};
const GIG_ACTIONS = new Set([
  "gen-gig",
  "gen-gigs",
  "new-quest",
  "edit-quest",
  "quest-status",
  "take",
  "del-quest",
]);

let initialized = false;
let syncQueue = Promise.resolve();
let lastGigSignature = null;

function questLogDatabase() {
  return game.modules.get(QUEST_LOG_ID)?.public?.QuestAPI?.DB;
}

function activeGM() {
  return game.user?.isGM && game.user.id === game.users.activeGM?.id;
}

function gigSignature() {
  const gigs = game.settings.get(MAP_ID, "state")?.quests ?? [];
  return JSON.stringify(gigs.map((gig) => ({
    id: gig?.id,
    status: gig?.status,
    title: gig?.title,
    fixer: gig?.fixer,
    desc: gig?.desc,
    reward: gig?.reward,
    notes: gig?.notes,
  })));
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
  lastGigSignature = gigSignature();
  syncQueue = syncQueue
    .then(synchronize)
    .catch((error) => {
      console.error(`${MODULE_ID} | Gig synchronization failed.`, error);
    });
  return syncQueue;
}

function requestSynchronization() {
  if (!initialized || !game.user?.isGM) return;
  if (activeGM()) queueSynchronization();
  else game.socket.emit(SOCKET, { action: "sync" });
}

function wrapMapActions() {
  const mapUI = game.modules.get(MAP_ID)?.api?.ui;
  if (!mapUI || typeof mapUI.onClick !== "function" || mapUI.onClick[WRAPPED_HANDLER_FLAG]) return;

  const onClick = mapUI.onClick;
  const wrapped = async function (...args) {
    const action = args[0]?.target?.closest?.("[data-act]")?.dataset.act;
    try {
      return await onClick.apply(this, args);
    } finally {
      if (GIG_ACTIONS.has(action)) requestSynchronization();
    }
  };
  Object.defineProperty(wrapped, WRAPPED_HANDLER_FLAG, { value: true });
  mapUI.onClick = wrapped;
  if (mapUI.onClick !== wrapped) {
    console.error(`${MODULE_ID} | Could not attach the Night City Map gig action listener.`);
    return;
  }
  console.info(`${MODULE_ID} | Attached the Night City Map gig action listener.`);
}

Hooks.once("ForienQuestLog.Lifecycle.ready", () => {
  initialized = true;
  wrapMapActions();
  queueSynchronization();
});

Hooks.once("ready", wrapMapActions);

setInterval(() => {
  wrapMapActions();
  if (!initialized || !activeGM()) return;

  const signature = gigSignature();
  if (signature === lastGigSignature) return;
  lastGigSignature = signature;
  queueSynchronization();
}, 1000);

Hooks.once("ready", () => {
  game.socket.on(SOCKET, (data) => {
    if (data?.action === "sync" && activeGM()) queueSynchronization();
  });
  game.socket.on(`module.${MAP_ID}`, (data) => {
    if (activeGM() && data?.action === "op" && data.op === "take") {
      setTimeout(() => queueSynchronization(), 250);
    }
  });

  if (!game.modules.get(QUEST_LOG_ID)?.active) {
    console.warn(`${MODULE_ID} | Forien's Quest Log is not active; gig synchronization is disabled.`);
  }
});
