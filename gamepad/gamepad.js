// NAME: Gamepad
// AUTHOR: OhItsTom
// DESCRIPTION: Use any gamepad to control Spotify (minus text input).

(function gamepad() {
	if (!Spicetify.Platform.History) {
		setTimeout(gamepad, 10);
		return;
	}

	// Define gamepad button mappings and actions
	const buttons = {
		0: "A",
		1: "B",
		2: "X",
		3: "Y",
		4: "LB",
		5: "RB",
		6: "LT",
		7: "RT",
		8: "Back",
		9: "Start",
		10: "LStick",
		11: "RStick",
		12: "DPadUp",
		13: "DPadDown",
		14: "DPadLeft",
		15: "DPadRight"
	};

	const actions = {
		LT: () => Spicetify.Platform.History.goBack(),
		RT: () => Spicetify.Platform.History.goForward(),
		LB: () => emulateTab.backwards(),
		RB: () => emulateTab(),
		A: () => interactWithFocusedElement(),
		B: () => simulateKeyPress("Escape"),
		Y: () => toggleOverlay(),
		DPadUp: () => simulateKeyPress("ArrowUp"),
		DPadDown: () => simulateKeyPress("ArrowDown"),
		DPadLeft: () => simulateKeyPress("ArrowLeft"),
		DPadRight: () => simulateKeyPress("ArrowRight")
	};

	let overlayVisible = false;

	const interactWithFocusedElement = () => {
		const focusedElement = document.activeElement;
		if (focusedElement && focusedElement.tabIndex >= 0) {
			focusedElement.click();
		}
	};

	const simulateKeyPress = key => {
		const escapeEvent = new KeyboardEvent("keydown", {
			key: key,
			bubbles: true
		});
		document.activeElement.dispatchEvent(escapeEvent);
	};

	const Overlay = () => {
		const [controller, setController] = Spicetify.React.useState(navigator.getGamepads()[0]);

		Spicetify.React.useEffect(() => {
			window.addEventListener("gamepadconnected", () => {
				setController(true);

				const overlay = document.getElementById("gamepad-overlay");
				overlay.style.display = "block";
				setTimeout(() => {
					overlay.style.display = "none";
					overlayVisible = false;
				}, 10000);
			});
			window.addEventListener("gamepaddisconnected", () => {
				setController(false);

				const overlay = document.getElementById("gamepad-overlay");
				overlay.style.display = "block";
				setTimeout(() => {
					overlay.style.display = "none";
					overlayVisible = false;
				}, 10000);
			});
		}, []);

		return Spicetify.React.createElement(
			"div",
			{
				style: {
					position: "fixed",
					top: "48px",
					right: "16px",
					background: "rgba(var(--spice-rgb-main), 0.7)",
					color: "white",
					padding: "10px",
					fontSize: "12px",
					zIndex: "9999",
					borderRadius: "8px",
					pointerEvents: "none"
				}
			},
			controller
				? [
						Spicetify.React.createElement("strong", null, "Gamepad Controls"),
						Spicetify.React.createElement(
							"ul",
							null,
							Spicetify.React.createElement("li", null, "Y: Toggle Help"),
							Spicetify.React.createElement("li", null, "A: Interact"),
							Spicetify.React.createElement("li", null, "B: Escape"),
							Spicetify.React.createElement("li", null, "LT: Go Back"),
							Spicetify.React.createElement("li", null, "RT: Go Forward"),
							Spicetify.React.createElement("li", null, "LB: Previous Element"),
							Spicetify.React.createElement("li", null, "RB: Next Element"),
							Spicetify.React.createElement("li", null, "DPad: Simulate Arrow Keys")
						)
				  ]
				: [
						Spicetify.React.createElement("strong", null, "No Gamepad Connected!"),
						Spicetify.React.createElement(
							"ul",
							null,
							Spicetify.React.createElement("li", null, "Try moving the sticks or pressing buttons"),
							Spicetify.React.createElement("li", null, "Try restarting Spotify or reconnecting your gamepad")
						)
				  ]
		);
	};

	const createOverlay = () => {
		const overlay = document.createElement("div");
		overlay.id = "gamepad-overlay";
		container = document.body.appendChild(overlay);
		Spicetify.ReactDOM.render(Spicetify.React.createElement(Overlay), container);
		overlayVisible = true;
		setTimeout(() => {
			overlay.style.display = "none";
			overlayVisible = false;
		}, 10000);
	};

	const toggleOverlay = () => {
		const overlay = document.getElementById("gamepad-overlay");
		if (overlayVisible) {
			overlay.style.display = "none";
		} else {
			overlay.style.display = "block";
		}
		overlayVisible = !overlayVisible;
	};

	const updateGamepadStatus = () => {
		const gamepads = navigator.getGamepads();
		if (gamepads[0]) {
			const gamepad = gamepads[0];
			gamepad.buttons.forEach((button, index) => {
				if (button.pressed && actions[buttons[index]] && !button.prevPressed) {
					actions[buttons[index]]();
					button.prevPressed = true;
				} else if (!button.pressed) {
					button.prevPressed = false;
				}
			});
		}
		requestAnimationFrame(updateGamepadStatus);
	};

	let lastFocusedElement = null;
	function ensureFocusStyles() {
		const html = document.querySelector("html");
		if (html.classList.contains("no-focus-outline")) {
			html.classList.remove("no-focus-outline");
		}

		if (!navigator.getGamepads()[0]) {
			if (lastFocusedElement) {
				lastFocusedElement.style.outline = "none";
			}
		} else {
			var focusedElement = document.activeElement;
			if (focusedElement !== lastFocusedElement) {
				if (lastFocusedElement) {
					lastFocusedElement.style.outline = "none";
				}
				lastFocusedElement = focusedElement;
				if (focusedElement) {
					var computedStyle = window.getComputedStyle(focusedElement);
					var outlineStyle = computedStyle.getPropertyValue("outline-style");
					if (outlineStyle === "none") {
						focusedElement.style.outline = "auto";
					}
				}
			}
		}

		requestAnimationFrame(ensureFocusStyles);
	}

	// Initialize
	ensureFocusStyles();
	createOverlay();

	// Load emulate-tab + start gamepad status update loop
	var script = document.createElement("script");
	script.src = "https://cdn.jsdelivr.net/npm/emulate-tab@1.2.1/dist/bundles/emulate-tab.min.js";
	script.onload = function () {
		requestAnimationFrame(updateGamepadStatus);
	};
	document.head.appendChild(script);
})();
