// NAME: Immersive View
// AUTHORS: OhItsTom
// DESCRIPTION: Button to hide unnecessary information, providing an immersive experience.
// Append Styling To Head
(function initStyle() {
	const style = document.createElement("style");
	style.textContent = `
                #main.immersive-view-active.hideplaybar .Root__now-playing-bar {
                    display: none !important;
                }

                #main.immersive-view-active.hidelibrary .Root__nav-bar {
                    display: none !important;
                }

                #main.immersive-view-active.hidetopbar .Root__top-bar {
                    display: none !important;
                }

                #main.immersive-view-active.hiderightpanel .Root__right-sidebar {
                    display: none !important;
                }

                #main.immersive-view-active {
                    transition: grid-template-columns 0.3s ease, column-gap 0.3s ease, padding-bottom 0.3s ease;
                }

                .immersive-view-settings {
                    padding: 20px;
                    color: var(--spice-text);
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                    max-height: 400px;
                    overflow-y: auto;
                }

                .immersive-view-settings .setting-item {
                    display: grid;
                    grid-template-columns: 1fr auto;
                    align-items: center;
                    margin-bottom: 10px;
                }

                .immersive-view-settings .setting-item-special {
                    margin-top: 10px;
                    margin-bottom: 0px;
                }

                .immersive-view-settings .setting-item-special > span {
                    margin-inline-start: 10px;
                }

                .immersive-view-settings .setting-item-special > span ~ input {
                    width: 3em;
                    text-align: center;
                    background-color: var(--spice-highlight);
                    border-color: var(--spice-text);
                    margin-left: calc(100% - 21px);
                }

                .immersive-view-settings .setting-item span {
                    font-size: 16px;
                    line-height: 20px;
                }

                .immersive-view-settings button {
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 0;
                    margin: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 20px;
                }

                .immersive-view-settings button svg {
                    width: 20px;
                    height: 20px;
                    fill: var(--spice-text);
                    transition: fill 0.3s ease;
                }

                .immersive-view-settings button.active svg {
                    fill: var(--spice-highlight);
                }
            `;
	document.head.appendChild(style);
})();

(function immersiveView() {
	if (
		!(
			Spicetify.CosmosAsync &&
			Spicetify.Platform.UpdateAPI &&
			Spicetify.React &&
			Spicetify.Topbar &&
			Spicetify.PopupModal &&
			document.getElementById("main") &&
			Spicetify.Keyboard
		)
	) {
		setTimeout(immersiveView, 10);
		return;
	}

	// Default settings
	let state = false;
	let settings = {
		enableAtStartup: false,
		currentState: false,
		maintainStateOnRestart: false,
		hideControls: false,
		hideTopbar: true,
		hideLibrary: true,
		hideRightPanel: true,
		hidePlaybar: true
	};

	// Save settings to localStorage
	function saveSettings() {
		localStorage.setItem("immersiveViewSettings", JSON.stringify(settings));
	}

	// Load settings from localStorage
	function loadSettings() {
		const storedSettings = localStorage.getItem("immersiveViewSettings");
		if (storedSettings) {
			settings = JSON.parse(storedSettings);
		}
	}

	loadSettings();

	// Apply settings if enabled at startup
	if (settings.enableAtStartup || (settings.maintainStateOnRestart && settings.currentState)) {
		state = settings.currentState = true;
		updateClasses();
	}

	// Update classes based on current settings
	function updateClasses() {
		const mainElement = document.getElementById("main");
		if (!mainElement) return;
		settings.currentState = state;
		saveSettings();
		if (state) {
			mainElement.classList.add("immersive-view-active");
			Object.keys(settings).forEach(async key => {
				if (key.startsWith("hide")) {
					const className = key.toLowerCase();
					if (settings[key]) {
						mainElement.classList.add(className);
					} else {
						mainElement.classList.remove(className);
					}
				}

				if (key.includes("Controls")) {
					if (settings[key]) {
						// Override some theming of the html element
						const style = document.createElement("style");
						style.classList.add("immersive-view-controls");
						style.innerHTML = `
                html > body::after { display: none !important; }
                .Root__globalNav { padding-inline: 8px !important; padding-inline-end: 16px !important; }
                .Titlebar { display: none !important; } /* Hide the titlebar completely */
            `;
						document.head.appendChild(style);

						// Spotify functions >= 1.2.51
						if (Spicetify.Platform.UpdateAPI._updateUiClient?.updateTitlebarHeight) {
							Spicetify.Platform.UpdateAPI._updateUiClient.updateTitlebarHeight({
								height: 1
							});
						}

						if (Spicetify.Platform.UpdateAPI._updateUiClient?.setButtonsVisibility) {
							Spicetify.Platform.UpdateAPI._updateUiClient.setButtonsVisibility(false);
						}

						window.addEventListener("beforeunload", () => {
							if (Spicetify.Platform.UpdateAPI._updateUiClient?.setButtonsVisibility) {
								Spicetify.Platform.UpdateAPI._updateUiClient.setButtonsVisibility(true);
							}
						});

						// Spotify functions < 1.2.51
						await Spicetify.CosmosAsync.post("sp://messages/v1/container/control", {
							type: "update_titlebar",
							height: "1px"
						});

						// Now send a post request every X milliseconds to ensure the height stays at 1px
						const enforceHeight = () => {
							Spicetify.CosmosAsync.post("sp://messages/v1/container/control", {
								type: "update_titlebar",
								height: "1px"
							});
						};

						// Set an interval to periodically send the post request to enforce the height
						const intervalId = setInterval(enforceHeight, 100); // Every 100ms

						// Optionally, stop the interval after a certain period (e.g., 10 seconds)
						setTimeout(() => {
							clearInterval(intervalId); // Stop after 10 seconds if desired
						}, 10000); // Adjust time as necessary
					}
				}
			});
		} else {
			mainElement.classList.remove("immersive-view-active");
			Object.keys(settings).forEach(key => {
				if (key.startsWith("hide")) {
					const className = key.toLowerCase();
					mainElement.classList.remove(className);
				}
			});

			const styleElements = document.querySelectorAll(".immersive-view-controls");
			styleElements.forEach(styleElement => {
				styleElement.remove();
			});

			if (Spicetify.Platform.UpdateAPI._updateUiClient?.setButtonsVisibility) {
				Spicetify.Platform.UpdateAPI._updateUiClient.setButtonsVisibility({ showButtons: true });
			}

			if (Spicetify.Platform.UpdateAPI._updateUiClient?.updateTitlebarHeight) {
				Spicetify.Platform.UpdateAPI._updateUiClient.updateTitlebarHeight({
					height: settings.customHeight
				});
			}

			// Spotify functions < 1.2.51
			Spicetify.CosmosAsync.post("sp://messages/v1/container/control", {
				type: "update_titlebar",
				height: settings.customHeight
			});
		}
	}

	// Create the immersive view toggle button
	const buttonLabel = () => (state ? "Exit Immersive View" : "Enter Immersive View");
	const buttonIcon = () => (state ? "minimize" : "fullscreen");

	const button = new Spicetify.Topbar.Button(
		buttonLabel(),
		buttonIcon(),
		() => {
			state = !state;
			button.label = buttonLabel();
			button.icon = buttonIcon();
			updateClasses();
		},
		false,
		true
	);

	button.tippy.setProps({
		placement: "bottom"
	});

	// Keyboard shortcut
	Spicetify.Keyboard.registerShortcut({ key: "i", ctrl: true }, () => {
		button.element.querySelector("button").click();
	});
	Spicetify.Keyboard.registerShortcut("esc", () => {
		if (state) {
			button.element.querySelector("button").click();
		}
	});

	// Config Menu Component
	const SettingsContent = () => {
		const ToggleButton = ({ isActive, onClick }) => {
			return Spicetify.React.createElement(
				"button",
				{
					className: isActive ? "active" : "",
					onClick: e => {
						e.stopPropagation();
						onClick(e);
					}
				},
				Spicetify.React.createElement(
					"svg",
					{ viewBox: "0 0 24 24" },
					Spicetify.React.createElement("rect", {
						x: 3,
						y: 3,
						width: 18,
						height: 18,
						rx: 4,
						fill: "none",
						stroke: "currentColor",
						strokeWidth: 2
					}),
					isActive &&
						Spicetify.React.createElement("path", {
							d: "M8 12l2 2 4-4",
							stroke: "currentColor",
							strokeWidth: 2,
							fill: "none"
						})
				)
			);
		};

		const TextBox = ({ value, onChange }) => {
			return Spicetify.React.createElement("input", {
				type: "text",
				value: value,
				onChange: e => onChange(e.target.value)
			});
		};

		const [localSettings, setLocalSettings] = Spicetify.React.useState({ ...settings });

		const toggleSetting = key => {
			const updatedSettings = { ...localSettings, [key]: !localSettings[key] };
			setLocalSettings(updatedSettings);
			settings[key] = updatedSettings[key];
			saveSettings();
			if (key === "enableAtStartup" || key === "maintainStateOnRestart") return; // No immediate effect for these settings
			updateClasses();
		};

		return Spicetify.React.createElement(
			"div",
			{ className: "immersive-view-settings" },
			["enableAtStartup", "maintainStateOnRestart", "hideControls", "hideTopbar", "hideLibrary", "hideRightPanel", "hidePlaybar"].map(key => {
				// Check if the current setting is "hideControls"
				const isHideControls = key === "hideControls"; // This should be defined here

				return Spicetify.React.createElement(
					"div",
					{ className: "setting-item" },
					Spicetify.React.createElement(
						"span",
						null,
						key
							.replace("hide", "Hide ")
							.replace("enable", "Enable ")
							.replace("maintain", "Maintain ")
							.replace(/([A-Z])/g, " $1")
							.trim()
					),
					Spicetify.React.createElement(ToggleButton, {
						isActive: localSettings[key],
						onClick: () => toggleSetting(key)
					}),
					// If it's "hideControls", show the "Revert Height" option immediately after it
					isHideControls &&
						localSettings["hideControls"] &&
						Spicetify.React.createElement(
							"div",
							{ className: "setting-item setting-item-special" },
							Spicetify.React.createElement("span", null, "> Revert Height"),
							Spicetify.React.createElement(TextBox, {
								value: settings.customHeight, // Use customHeight instead of customCSS
								onChange: value => {
									settings.customHeight = value; // Update customHeight directly
									updateClasses();
								}
							})
						)
				);
			})
		);
	};

	// Config Modal trigger (Right click)
	button.element.oncontextmenu = event => {
		event.preventDefault();
		Spicetify.PopupModal.display({
			title: "Immersive View Settings",
			content: Spicetify.React.createElement(SettingsContent)
		});
	};
})();
