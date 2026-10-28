import { test } from "node:test";
import assert from "node:assert/strict";
import { STATUS_MAP, escapeHtml, textToHtml, questData, gigSignature } from "../scripts/logic.js";

test("every map status has a Quest Log status", () => {
  assert.deepEqual(STATUS_MAP, { hidden: "inactive", offer: "available", active: "active", done: "completed", failed: "failed" });
});

test("the map's text becomes paragraphs and line breaks, with nothing in it read as markup", () => {
  assert.equal(textToHtml("Meet the contact.\nGet the truck.\n\nReward: 200 eb"), "<p>Meet the contact.<br>Get the truck.</p><p>Reward: 200 eb</p>");
  assert.equal(textToHtml("Pay <b>double</b> & run"), "<p>Pay &lt;b&gt;double&lt;/b&gt; &amp; run</p>");
  assert.equal(textToHtml("  \n\n  "), "");
  assert.equal(textToHtml(undefined), "");
  assert.equal(escapeHtml(`"quoted" 'too'`), "&quot;quoted&quot; &#39;too&#39;");
});

test("a gig becomes a quest with its description, reward and GM notes", () => {
  const quest = questData({ id: "g1", status: "offer", title: "Courier", fixer: "Rogue", desc: "Deliver a case.\nQuietly.", reward: "500 eb", notes: "[NCI: ARA]" });
  assert.deepEqual(quest, {
    name: "Courier",
    status: "available",
    giver: "abstract",
    giverName: "Rogue",
    description: "<p>Deliver a case.<br>Quietly.</p><p>Reward: 500 eb</p>",
    gmnotes: "<p>[NCI: ARA]</p>",
    tasks: [],
    rewards: [],
  });
});

test("a bare gig still makes a sensible quest", () => {
  const quest = questData({ id: "g2", status: "mystery" });
  assert.deepEqual([quest.name, quest.status, quest.giverName, quest.description, quest.gmnotes], ["Untitled Night City gig", "inactive", "Night City Map", "", ""]);
});

test("the signature changes with what the quests mirror, and nothing else", () => {
  const gigs = [{ id: "a", status: "offer", title: "T", fixer: "F", desc: "D", reward: "R", notes: "N", x: 0.1, takenBy: "V" }];
  const same = [{ ...gigs[0], x: 0.9, takenBy: "Jackie" }];
  assert.equal(gigSignature(gigs), gigSignature(same), "a moved pin or a new taker does not change a quest");
  for (const field of ["status", "title", "fixer", "desc", "reward", "notes"]) {
    assert.notEqual(gigSignature(gigs), gigSignature([{ ...gigs[0], [field]: "changed" }]), field);
  }
  assert.notEqual(gigSignature(gigs), gigSignature([]), "a deleted gig");
  assert.equal(gigSignature(undefined), "[]");
});
