// Run with: node --test spotifyBackup/spotifyBackup.settings.test.cjs
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { runInNewContext } = require("node:vm");

const source = readFileSync(join(__dirname, "spotifyBackup.js"), "utf8");

function settingsPage(pathname) {
	const sections = [];
	const timers = new Map();
	let listener;
	let inserted = 0;
	const storage = {
		firstChild: { textContent: "Storage" },
		parentNode: { insertBefore: () => inserted++ }
	};
	const context = {
		document: {
			querySelectorAll: () => sections,
			createElement: () => ({})
		},
		Spicetify: {
			Locale: { _dictionary: { "desktop.settings.storage": "Storage" } },
			ReactDOM: { render: () => {} },
			React: { createElement: () => ({}) },
			Platform: { History: { location: { pathname }, listen: fn => { listener = fn; } } }
		},
		Section: () => {},
		startupCheck: () => {},
		setInterval: fn => { const id = timers.size + 1; timers.set(id, fn); return id; },
		clearInterval: id => timers.delete(id)
	};
	// Exercise the extension's actual insertion and initialization code, without
	// running backup, restore, Gist requests, or real timers.
	runInNewContext(source.slice(source.indexOf("\tfunction insertOption("), source.lastIndexOf("})();")), context);
	return {
		mountStorage: () => sections.push(storage),
		tick: () => [...timers.values()].forEach(fn => fn()),
		navigate: path => listener({ pathname: path }),
		get inserted() { return inserted; },
		get pending() { return timers.size; }
	};
}

test("inserts Backup when Spotify starts on Settings, after Storage mounts", () => {
	const page = settingsPage("/preferences");
	page.tick();
	assert.equal(page.inserted, 0);
	page.mountStorage();
	page.tick();
	assert.equal(page.inserted, 1);
	assert.equal(page.pending, 0);
});

test("does not insert on Home and still inserts after navigation to Settings", () => {
	const page = settingsPage("/");
	page.mountStorage();
	page.tick();
	assert.equal(page.pending, 0);
	assert.equal(page.inserted, 0);
	page.navigate("/preferences");
	page.tick();
	assert.equal(page.inserted, 1);
});

test("the existing settings row carries Spotify's visibility marker", () => {
	assert.match(source, /className: "x-settings-row",\s*"data-settings-row": ""/);
});
