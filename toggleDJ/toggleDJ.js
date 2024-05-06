// NAME: Toggle DJ
// AUTHORS: OhItsTom
// DESCRIPTION: Toggle "Your DJ" in the "Library" section of settings.

(async function toggleDJ() {
	if (
		!(
			Spicetify.Platform &&
			Spicetify.React &&
			Spicetify.ReactDOM &&
			Spicetify.Platform.History &&
			Spicetify.Locale._dictionary &&
			Spicetify.Platform.RootlistAPI
		)
	) {
		setTimeout(toggleDJ, 100);
		return;
	}

	// Function to interface with the DJ playlist
	async function interfaceDJ(toggle) {
		const rootlist = await Spicetify.Platform.RootlistAPI.getContents();
		const DJPlaylist = "spotify:playlist:37i9dQZF1EYkqdzj48dyYq";
		const isDJ = rootlist.items.some(item => item.type === "playlist" && item.uri === DJPlaylist);

		if (toggle !== undefined) {
			if (!isDJ && toggle) {
				await Spicetify.Platform.RootlistAPI.add([DJPlaylist], true);
			} else if (isDJ && !toggle) {
				await Spicetify.Platform.RootlistAPI.remove([{ uri: DJPlaylist }]);
			}
		}

		return isDJ;
	}

	// Create our own row matching Spotify's
	const Row = Spicetify.React.memo(() => {
		const [state, setState] = Spicetify.React.useState(false);

		Spicetify.React.useEffect(() => {
			const fetchData = async () => {
				const initialState = await interfaceDJ();
				setState(initialState);
			};

			fetchData();
		}, []);

		return Spicetify.React.createElement("div", { className: "x-settings-row" }, [
			Spicetify.React.createElement("div", { className: "x-settings-firstColumn" }, [
				Spicetify.React.createElement(
					"label",
					{
						htmlFor: "desktop.settings.selectLanguage",
						className: "TextElement-bodySmall-textSubdued-text encore-text-body-small",
						"data-encore-id": "type"
					},
					"Show Your DJ"
				)
			]),
			Spicetify.React.createElement("div", { className: "x-settings-secondColumn" }, [
				Spicetify.React.createElement("label", { className: "x-toggle-wrapper" }, [
					Spicetify.React.createElement("input", {
						className: "x-toggle-input",
						id: "global.settings.autoplayInfo",
						type: "checkbox"
					}),
					Spicetify.React.createElement(Spicetify.ReactComponent.Toggle, {
						value: state,
						disabled: false,
						onSelected: async () => {
							const newState = !state;
							await interfaceDJ(newState);
							setState(newState);
						}
					})
				])
			])
		]);
	});

	// Function to insert our row into the library section of settings
	function insertOption(name) {
		if (name !== "/preferences") return;

		const checkHeaderInterval = setInterval(() => {
			const headers = document.querySelectorAll(".x-settings-section h2");

			headers.forEach(h2 => {
				if (h2.textContent === Spicetify.Locale._dictionary["settings.library"]) {
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
