// NAME: Spotify Backup
// AUTHOR: OhItsTom
// DESCRIPTION: Backup / restore application data (settings) + to the cloud (Gist).
// TODO: also backup/parse prefs + productstate + simplify overall code

(async function spotifyBackup() {
	if (!(Spicetify.Platform && Spicetify.React && Spicetify.ReactDOM && Spicetify.Platform.History && Spicetify.Locale._dictionary)) {
		setTimeout(spotifyBackup, 10);
		return;
	}

	// Settings Config
	let config = JSON.parse(localStorage.getItem("spotifyBackup:settings") || "{}");
	let gist = {
		data: null,
		lastUpdate: null
	};

	function getConfig(key) {
		return config[key] ?? null;
	}

	function setConfig(key, value, message) {
		if (value === getConfig(key)) return;
		console.debug(`[spotifyBackup-Config]: ${message ?? key + " ="}`, value);
		config[key] = value;
		localStorage.setItem("spotifyBackup:settings", JSON.stringify(config));
	}

	// Time related functions
	function timeSince(timestamp) {
		return new Date() - new Date(timestamp);
	}

	function setLastBackupTime(time) {
		setConfig("lastBackupTimestamp", time ?? new Date().toISOString(), "Last backup timestamp");
	}

	// Get the Gist data
	async function getGist(force = false) {
		// Return null if Gist Integration is disabled
		if (!getConfig("gistEnabled")) return { data: null, lastUpdate: null };
		// Return cached data if the last update was less than a minute ago
		if (timeSince(gist.lastUpdate) < 60 * 1000 && !force) return gist;

		const response = await fetch(`https://api.github.com/gists/${getConfig("gistId")}`, {
			headers: {
				Authorization: `token ${getConfig("gistToken")}`
			}
		});

		let parsedData = null,
			lastUpdate = null;
		if (response.ok) {
			const data = await response.json();
			lastUpdate = data.updated_at;
			parsedData = JSON.parse(data.files["spotify-backup.json"].content);
		} else {
			Spicetify.showNotification("Failed to retrieve Gist content", true);
			console.error("Gist API responded with status:", response.status);
		}
		if (parsedData) gist = { data: parsedData, lastUpdate };
		return gist;
	}

	async function backupData() {
		// A hacky way to remove the backup settings from the backup
		const data = JSON.stringify({ ...localStorage, "spotifyBackup:settings": undefined });
		if (getConfig("gistEnabled")) {
			// Check if the data is the same as the last backup
			gist = await getGist();
			if (data === JSON.stringify(gist.data)) {
				Spicetify.showNotification("There is nothing to backup");
				return;
			}
			try {
				const response = await fetch(`https://api.github.com/gists/${getConfig("gistId")}`, {
					method: "PATCH",
					headers: {
						Authorization: `token ${getConfig("gistToken")}`,
						"Content-Type": "application/json"
					},
					body: JSON.stringify({
						files: {
							"spotify-backup.json": {
								content: data
							}
						}
					})
				});
				if (response.ok) {
					Spicetify.showNotification("Backup to Gist successful");
					setLastBackupTime();
				} else {
					Spicetify.showNotification("Failed to backup to Gist", true);
					console.error("Gist API responded with status:", response.status);
				}
			} catch (error) {
				Spicetify.showNotification("Failed to backup to Gist", true);
				console.error("Error while backing up to Gist:", error);
			}
		} else {
			Spicetify.Platform.ClipboardAPI.copy(data)
				.then(() => {
					Spicetify.showNotification("Copied backup data to clipboard");
					setLastBackupTime();
				})
				.catch(error => {
					Spicetify.showNotification("Failed to backup data", true);
					console.error("Error while copying data:", error);
				});
		}
	}

	async function restoreData() {
		gist = await getGist();
		const data = getConfig("gistEnabled") ? gist.data : JSON.parse(await Spicetify.Platform.ClipboardAPI.paste());
		if (!data) {
			Spicetify.showNotification("No backup data found", true);
			return;
		}
		try {
			localStorage.clear();
			for (let key in data) {
				// Don't restore the backup settings
				if (key === "spotifyBackup:settings") continue;
				if (data.hasOwnProperty(key)) localStorage.setItem(key, data[key]);
			}
			Spicetify.showNotification("Data restored successfully");
			setLastBackupTime(gist.lastUpdate);
			window.location.reload();
		} catch (error) {
			Spicetify.showNotification("Failed to restore data.", true);
			console.error("Error while restoring data:", error);
		}
	}

	async function checkForNewBackup() {
		if (!getConfig("gistEnabled")) return false;
		gist = await getGist();
		const lastUpdate = new Date(gist.lastUpdate);
		const lastBackup = new Date(getConfig("lastBackupTimestamp"));
		return lastUpdate > lastBackup;
	}

	async function startupCheck() {
		const backupInterval = getConfig("backupInterval");
		if (backupInterval === "off" || !getConfig("gistEnabled")) return;

		const lastBackupTimestamp = getConfig("lastBackupTimestamp");

		if (
			backupInterval === "startup" ||
			(backupInterval === "daily" && (!lastBackupTimestamp || timeSince(lastBackupTimestamp) > 24 * 60 * 60 * 1000))
		) {
			if (await checkForNewBackup()) {
				// If the local data is older than the Gist data, restore it
				restoreData();
			} else {
				// If the local data is newer than the Gist data, back it up
				backupData();
			}
		}
	}

	// Basic dialog component
	const Dialog = Spicetify.React.memo(props => {
		const [state, setState] = Spicetify.React.useState(true);
		const self = document.querySelector(".ReactModalPortal:last-of-type");
		const ConfirmDialog = Spicetify.ReactComponent.ConfirmDialog;
		const isForwardRef = typeof ConfirmDialog === "function";
		const commonProps = {
			...props,
			isOpen: state,
			onClose: () => {
				setState(false);
				props.onClose?.();
				self.remove();
			},
			onConfirm: () => {
				setState(false);
				props.onConfirm?.();
				self.remove();
			}
		};

		Spicetify.React.useEffect(() => {
			if (state) props.onOpen?.();
		}, [state]);

		return isForwardRef ? ConfirmDialog(commonProps) : Spicetify.React.createElement(ConfirmDialog, commonProps);
	});

	function showDialog(props) {
		Spicetify.ReactDOM.render(
			Spicetify.React.createElement(
				Spicetify.ReactComponent.RemoteConfigProvider,
				{ configuration: Spicetify.Platform.RemoteConfiguration },
				Spicetify.React.createElement(Dialog, props)
			),
			document.createElement("div")
		);
	}

	// Create our own section matching Spotify's
	const Section = Spicetify.React.memo(() => {
		const [localStorageSize, setLocalStorageSize] = Spicetify.React.useState("");
		const [gistEnabled, setGistEnabled] = Spicetify.React.useState(getConfig("gistEnabled") ?? false);
		const [gistToken, setGistToken] = Spicetify.React.useState(getConfig("gistToken") ?? "");
		const [gistId, setGistId] = Spicetify.React.useState(getConfig("gistId") ?? "");
		const [backupInterval, setBackupInterval] = Spicetify.React.useState(getConfig("backupInterval") ?? "off");

		Spicetify.React.useEffect(() => {
			if (getConfig("gistEnabled") !== gistEnabled) setConfig("gistEnabled", gistEnabled);
			if (getConfig("gistToken") !== gistToken) setConfig("gistToken", gistToken);
			if (getConfig("gistId") !== gistId) setConfig("gistId", gistId);
			if (getConfig("backupInterval") !== backupInterval) setConfig("backupInterval", backupInterval);
		}, [gistEnabled, gistToken, gistId, backupInterval]);

		Spicetify.React.useEffect(() => {
			getLocalStorageSize().then(size => setLocalStorageSize(size));
		}, []);

		function getLocalStorageSize() {
			return new Promise(resolve => {
				requestIdleCallback(() => {
					let localStorageString = JSON.stringify(localStorage);
					let totalSizeBytes = new Blob([localStorageString]).size;

					const units = ["bytes", "KB", "MB", "GB"];
					let size = totalSizeBytes;
					let unitIndex = 0;

					while (size >= 1024 && unitIndex < units.length - 1) {
						size /= 1024;
						unitIndex++;
					}

					resolve(`${Math.trunc(size)} ${units[unitIndex]}`);
				});
			});
		}

		return [
			Spicetify.React.createElement(
				"h2",
				{
					"data-encore-id": "type",
					className: "encore-text encore-text-body-medium-bold encore-internal-color-text-base"
				},
				"Backup"
			),
			Spicetify.React.createElement(
				"div",
				{
					className: "x-settings-row"
				},
				[
					Spicetify.React.createElement("div", { className: "x-settings-firstColumn" }, [
						Spicetify.React.createElement("div", null, [
							Spicetify.React.createElement("div", null, [
								Spicetify.React.createElement(
									"label",
									{
										className: "encore-text encore-text-body-small encore-internal-color-text-base",
										"data-encore-id": "text"
									},
									`Application Data:`
								),
								Spicetify.React.createElement(
									"label",
									{
										className: "encore-text encore-text-body-small encore-internal-color-text-subdued",
										"data-encore-id": "text"
									},
									` ${localStorageSize}`
								)
							]),
							Spicetify.React.createElement(
								"label",
								{
									className: "encore-text encore-text-body-small encore-internal-color-text-subdued",
									"data-encore-id": "text"
								},
								`Content stored in the browser (local storage)`
							)
						])
					]),
					Spicetify.React.createElement("div", { className: "x-settings-secondColumn" }, [
						Spicetify.React.createElement(
							"button",
							{
								className:
									"Button-buttonSecondary-small-useBrowserDefaultFocusStyle Button-small-buttonSecondary-useBrowserDefaultFocusStyle Button-small-buttonSecondary-isUsingKeyboard-useBrowserDefaultFocusStyle Button-buttonSecondary-small-isUsingKeyboard-useBrowserDefaultFocusStyle encore-text-body-small-bold x-settings-button",
								"data-encore-id": "buttonSecondary",
								style: {
									marginRight: "8px"
								},
								onClick: async () => await backupData()
							},
							"Backup"
						),
						Spicetify.React.createElement(
							"button",
							{
								className:
									"Button-buttonSecondary-small-useBrowserDefaultFocusStyle Button-small-buttonSecondary-useBrowserDefaultFocusStyle Button-small-buttonSecondary-isUsingKeyboard-useBrowserDefaultFocusStyle Button-buttonSecondary-small-isUsingKeyboard-useBrowserDefaultFocusStyle encore-text-body-small-bold x-settings-button",
								"data-encore-id": "buttonSecondary",
								style: {
									marginRight: "8px"
								},
								onClick: async () => {
									showDialog({
										titleText: "Are you sure?",
										descriptionText: "This will overwrite all your current settings!",
										cancelText: "Cancel",
										confirmText: "Restore",
										onConfirm: async () => await restoreData()
									});
								}
							},
							"Restore"
						),
						Spicetify.React.createElement(
							"button",
							{
								className:
									"Button-buttonSecondary-small-useBrowserDefaultFocusStyle Button-small-buttonSecondary-useBrowserDefaultFocusStyle Button-small-buttonSecondary-isUsingKeyboard-useBrowserDefaultFocusStyle Button-buttonSecondary-small-isUsingKeyboard-useBrowserDefaultFocusStyle encore-text-body-small-bold x-settings-button",
								"data-encore-id": "buttonSecondary",
								disabled: !gistEnabled,
								onClick: async () => {
									if (await checkForNewBackup()) {
										showDialog({
											titleText: "New backup found!",
											descriptionText: "Would you like to restore the backup?\nThis will overwrite all your current settings!",
											cancelText: "Cancel",
											confirmText: "Restore",
											onConfirm: async () => await restoreData()
										});
									} else {
										showDialog({
											titleText: "No new backup found!",
											descriptionText: "Would you like to backup your current settings?",
											cancelText: "Cancel",
											confirmText: "Backup",
											onConfirm: async () => await backupData()
										});
									}
								}
							},
							"Check"
						)
					])
				]
			),
			Spicetify.React.createElement(
				"div",
				{
					className: "x-settings-row"
				},
				[
					Spicetify.React.createElement(
						"div",
						{ className: "x-settings-firstColumn" },
						Spicetify.React.createElement("div", null, [
							Spicetify.React.createElement(
								"div",
								null,
								Spicetify.React.createElement(
									"label",
									{ className: "encore-text encore-text-body-small encore-internal-color-text-base", "data-encore-id": "text" },
									"Gist Integration"
								)
							),

							Spicetify.React.createElement(
								"label",
								{
									className: "encore-text encore-text-body-small encore-internal-color-text-subdued",
									"data-encore-id": "text"
								},
								"Remote storage for your data (see README for more info)"
							)
						])
					),
					Spicetify.React.createElement(
						"div",
						{ className: "x-settings-secondColumn" },
						Spicetify.React.createElement(
							"label",
							{ className: "x-toggle-wrapper" },
							Spicetify.React.createElement("input", {
								id: "settings.canvasVideos",
								className: "x-toggle-input",
								type: "checkbox",
								checked: gistEnabled,
								onChange: () => setGistEnabled(!gistEnabled)
							}),
							Spicetify.React.createElement(
								"span",
								{ className: "x-toggle-indicatorWrapper" },
								Spicetify.React.createElement("span", { className: "x-toggle-indicator" })
							)
						)
					)
				]
			),
			gistEnabled && [
				Spicetify.React.createElement(
					"div",
					{
						className: "x-settings-row"
					},
					[
						Spicetify.React.createElement(
							"div",
							{ className: "x-settings-firstColumn" },

							Spicetify.React.createElement(
								"label",
								{ className: "encore-text encore-text-body-small encore-internal-color-text-subdued", "data-encore-id": "text" },
								"Check Interval"
							)
						),
						Spicetify.React.createElement(
							"div",
							{ className: "x-settings-secondColumn" },
							Spicetify.React.createElement(
								"span",
								null,
								Spicetify.React.createElement(
									"select",
									{
										className: "main-dropDown-dropDown",
										id: "desktop.settings.autostart",
										onChange: e => setBackupInterval(e.target.value),
										value: backupInterval
									},
									[
										Spicetify.React.createElement("option", { value: "off" }, "Off"),
										Spicetify.React.createElement("option", { value: "startup" }, "Startup"),
										Spicetify.React.createElement("option", { value: "daily" }, "Daily")
									]
								)
							)
						)
					]
				),
				Spicetify.React.createElement("div", { style: { marginTop: "10px" } }, [
					Spicetify.React.createElement("input", {
						type: "text",
						placeholder: "GitHub Token",
						value: gistToken,
						onChange: e => setGistToken(e.target.value),
						className: "x-settings-input",
						type: "password"
					}),
					Spicetify.React.createElement("input", {
						type: "text",
						placeholder: "Gist ID",
						value: gistId,
						onChange: e => setGistId(e.target.value),
						className: "x-settings-input",
						style: { marginTop: "5px" }
					})
				])
			]
		];
	});

	// Function to insert our section into the settings page
	function insertOption(name) {
		if (name !== "/preferences") return;

		const checkHeaderInterval = setInterval(() => {
			document.querySelectorAll(".x-settings-section").forEach(section => {
				if (section.firstChild.textContent !== Spicetify.Locale._dictionary["desktop.settings.storage"]) return;

				clearInterval(checkHeaderInterval);
				const sectionContainer = document.createElement("div");
				sectionContainer.className = "x-settings-section";
				Spicetify.ReactDOM.render(Spicetify.React.createElement(Section), sectionContainer);
				section.parentNode.insertBefore(sectionContainer, section.nextSibling);
			});
		}, 1);
	}

	// Hotload useEffect
	Spicetify.ReactDOM.render(Spicetify.React.createElement(Section), document.createElement("div"));

	// Init
	startupCheck();
	Spicetify.Platform.History.listen(event => {
		insertOption(event.pathname);
	});
})();
