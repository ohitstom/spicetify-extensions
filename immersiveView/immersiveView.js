// NAME: Immersive View
// AUTHORS: OhItsTom
// DESCRIPTION: Button to hide uneccesary information, providing an immersive experience.

(function immersiveView() {
	if (!document.querySelector(".main-noConnection") || !Spicetify.Topbar || !Spicetify.Keyboard) {
		setTimeout(immersiveView, 10);
		return;
	}

	function applyImmersiveView(bool) {
		if (bool) {
			var styleElement = document.createElement("style");
			styleElement.className = "immersive-view";
			var css = `
      .Root__top-container {
        grid-template-columns: 0 1fr 0 !important;
      }
      .Root__nav-bar,
      .Root__now-playing-bar,
      .Root__right-sidebar {
        display: none !important;
      }
      .Root__top-container {
        padding: 8px !important;
        padding-top: calc(24px + var(--panel-gap)*2) !important;
        gap: 0 !important;
      }
      `;
			styleElement.textContent = css;
			document.head.appendChild(styleElement);
		} else {
			var styleSheet = document.querySelector("head > style.immersive-view");
			styleSheet.parentNode.removeChild(styleSheet);
		}
	}

	// Creation of button
	var state = false;
	const buttonLabel = () => (state ? "Exit Immersive View" : "Enter Immersive View");
	const buttonIcon = () => (state ? "minimize" : "fullscreen");

	const button = new Spicetify.Topbar.Button(
		buttonLabel(),
		buttonIcon(),
		() => {
			state = !state;
			button.label = buttonLabel();
			button.icon = buttonIcon();
			applyImmersiveView(state);
		},
		false,
		true
	);

	button.tippy.setProps({
		placement: "bottom"
	});

	// Keyboard shortcut
	Spicetify.Keyboard.registerShortcut({ key: "i", ctrl: true }, () => {
		button.element.click();
	});
	Spicetify.Keyboard.registerShortcut("esc", () => {
		if (state) {
			button.element.click();
		}
	});
})();
