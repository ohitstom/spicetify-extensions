// NAME: spotifyBackup
// AUTHOR: OhItsTom
// DESCRIPTION: Backup / restore application data (settings)

(async function spotifyBackup() {
	if (!(Spicetify.Platform && Spicetify.React && Spicetify.ReactDOM && Spicetify.Platform.History && Spicetify.Locale._dictionary)) {
		setTimeout(spotifyBackup, 100);
		return;
	}

	// Lazily get local storage size
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

	// Basic dialog component
	const Dialog = Spicetify.React.memo(props => {
		const [state, setState] = Spicetify.React.useState(true);
		const self = document.querySelector(".ReactModalPortal:last-of-type");

		return Spicetify.ReactComponent.ConfirmDialog({
			...props,
			isOpen: state,
			onClose: () => {
				setState(false);
				self.remove();
			},
			onConfirm: () => {
				setState(false);
				props.onConfirm();
				self.remove();
			}
		});
	});

	// Create our own row matching Spotify's
	const Row = Spicetify.React.memo(() => {
		const [localStorageSize, setLocalStorageSize] = Spicetify.React.useState("");

		Spicetify.React.useEffect(() => {
			getLocalStorageSize().then(size => setLocalStorageSize(size));
		}, []);

		return Spicetify.React.createElement(
			"div",
			{
				className: "x-settings-row",
				style: {
					gap: "8px 0px",
					gridTemplateColumns: "2fr auto"
				}
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
							className: "Button-small-buttonSecondary-useBrowserDefaultFocusStyle encore-text-body-small-bold x-settings-button",
							"data-encore-id": "buttonSecondary",
							style: {
								marginRight: "8px"
							},
							onClick: () => {
								Spicetify.Platform.ClipboardAPI.copy(localStorage)
									.then(() => {
										Spicetify.showNotification("Backup Data Copied");
									})
									.catch(() => {
										Spicetify.showNotification("Failed to backup data.", true);
									});
							}
						},
						"Backup"
					),
					Spicetify.React.createElement(
						"button",
						{
							className: "Button-small-buttonSecondary-useBrowserDefaultFocusStyle encore-text-body-small-bold x-settings-button",
							"data-encore-id": "buttonSecondary",
							onClick: async () => {
								Spicetify.ReactDOM.render(
									Spicetify.React.createElement(
										Spicetify.ReactComponent.RemoteConfigProvider,
										{ configuration: Spicetify.Platform.RemoteConfiguration },
										Spicetify.React.createElement(Dialog, {
											titleText: "Are you sure?",
											descriptionText: "This will overwrite all your current settings!",
											cancelText: "Cancel",
											confirmText: "Restore",
											onConfirm: async () => {
												let parsedBackupData;
												try {
													parsedBackupData = JSON.parse(await Spicetify.Platform.ClipboardAPI.paste());
												} catch {
													Spicetify.showNotification("Failed to restore data.", true);
													return;
												}

												localStorage.clear();

												for (let key in parsedBackupData) {
													if (parsedBackupData.hasOwnProperty(key)) {
														localStorage.setItem(key, parsedBackupData[key]);
													}
												}

												window.location.reload();
											}
										})
									),
									document.createElement("div")
								);
							}
						},
						"Restore"
					)
				])
			]
		);
	});

	// Function to insert our row into the library section of settings
	function insertOption(name) {
		if (name !== "/preferences") return;

		const checkHeaderInterval = setInterval(() => {
			const headers = document.querySelectorAll(".x-settings-section h2");

			headers.forEach(h2 => {
				if (h2.textContent === Spicetify.Locale._dictionary["desktop.settings.storage"]) {
					clearInterval(checkHeaderInterval);

					const rowContainer = document.createElement("div");
					Spicetify.ReactDOM.render(Spicetify.React.createElement(Row), rowContainer);
					h2.parentNode.insertBefore(rowContainer, h2.nextSibling);
				}
			});
		}, 1);
	}

	// Hotload useEffect
	Spicetify.ReactDOM.render(Spicetify.React.createElement(Row), document.createElement("div"));

	// Initialize + Listener
	insertOption(Spicetify.Platform.History.location?.pathname);
	Spicetify.Platform.History.listen(event => {
		insertOption(event.pathname);
	});
})();
