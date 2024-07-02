// NAME: Immersive View
// AUTHORS: OhItsTom
// DESCRIPTION: Button to hide unnecessary information, providing an immersive experience.
// TODO: make the transition smooth with an animation

// Append Styling To Head
(function initStyle() {
	var style = document.createElement("style");
	style.textContent = `
		#main.immersive-view-active .Root__top-container {
			grid-template-columns: 0 1fr 0;
			column-gap: 0px;
			padding-bottom: 0px;
		}
		
		#main.immersive-view-active .Root__top-container > *:not(.Root__main-view):not(.Root__globalNav) {
			display: none
		}
	`;
	document.head.appendChild(style);
})();

(function immersiveView() {
	if (!((document.querySelector(".main-noConnection") || document.querySelector(".main-actionButtons")) && Spicetify.Topbar && Spicetify.Keyboard)) {
		setTimeout(immersiveView, 10);
		return;
	}

	function applyImmersiveView(bool) {
		var mainElement = document.getElementById("main");
		if (bool) {
			mainElement.classList.add("immersive-view-active");
		} else {
			mainElement.classList.remove("immersive-view-active");
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
