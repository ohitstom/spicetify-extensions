// NAME: Playbar Clock
// AUTHOR: OhItsTom
// DESCRIPTION: Current system time on the playbar (display settings soon).

(function playbarClock() {
	if (!(Spicetify.React && Spicetify.ReactDOM)) {
		setTimeout(playbarClock, 200);
		return;
	}

	// Clock Button
	let time, setTime;
	const Clock = Spicetify.React.memo(() => {
		[time, setTime] = Spicetify.React.useState(new Date().toLocaleTimeString());

		return Spicetify.React.createElement(
			"button",
			{
				className: "Button-sm-16-buttonTertiary-iconOnly-isUsingKeyboard-useBrowserDefaultFocusStyle",
				style: {
					overflowWrap: "normal",
					padding: "0",
					paddingInline: "8px"
				}
			},
			time !== false && time
		);
	});

	// DOM Manipulation
	function waitForWidgetMounted() {
		extraControlsWidget = document.querySelector(".main-nowPlayingBar-extraControls");
		if (!extraControlsWidget) {
			setTimeout(waitForWidgetMounted, 300);
			return;
		}

		const clockContainer = document.createElement("div");
		clockContainer.className = "SystemClock-container";

		const clockElement = extraControlsWidget.insertBefore(clockContainer, extraControlsWidget.firstChild);
		Spicetify.ReactDOM.render(Spicetify.React.createElement(Clock), clockElement);

		hoverTip = Spicetify.Tippy(clockElement, {
			...Spicetify.TippyProps,
			content: "System Clock"
		});
	}

	(function attachObserver() {
		const rightBar = document.querySelector(".main-nowPlayingBar-right");
		if (!rightBar) {
			setTimeout(attachObserver, 300);
			return;
		}
		waitForWidgetMounted();
		const observer = new MutationObserver(mutations => {
			mutations.forEach(mutation => {
				if (mutation.removedNodes.length > 0) {
					const removedNodes = Array.from(mutation.removedNodes);
					const isControlsRemoved = removedNodes.some(node => node.classList && node.classList.contains("main-nowPlayingBar-extraControls"));
					if (isControlsRemoved) {
						waitForWidgetMounted();
					}
				}
			});
		});
		observer.observe(rightBar, { childList: true });
	})();

	// Start Clock Loop
	setInterval(() => setTime(new Date().toLocaleTimeString()), 300);
})();
