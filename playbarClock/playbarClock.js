// NAME: Playbar Clock
// AUTHOR: OhItsTom
// DESCRIPTION: Current system time on the playbar (display settings soon).

(function playbarClock() {
	if (!(Spicetify.React && Spicetify.ReactDOM && Spicetify.ReactComponent && Spicetify.Tippy && Spicetify.TippyProps)) {
		setTimeout(playbarClock, 10);
		return;
	}

	// Clock Menu
	const menuOptions = [
		{
			name: "Trim Hours",
			defaultVal: true
		},
		{
			name: "Show Seconds",
			defaultVal: true,
			divider: "after"
		},
		{
			name: "12H",
			defaultVal: true,
			children: [
				{
					name: "12:00 -> 00:00",
					defaultVal: false,
					divider: "after"
				}
			]
		},
		{
			name: "AM/PM",
			defaultVal: true
		}
	];

	// Settings Config
	let config = JSON.parse(localStorage.getItem("playbarClock:settings") || "{}");
	if (Object.keys(config).length === 0) {
		menuOptions.forEach(option => {
			config[option.name] = option.defaultVal;
		});
		localStorage.setItem("playbarClock:settings", JSON.stringify(config));
	}

	function getConfig(key) {
		return config[key] ?? null;
	}

	function setConfig(key, value, message) {
		if (value !== getConfig(key)) {
			console.debug(`[playbarClock-Config]: ${message ?? key + " ="}`, value);
			config[key] = value;
			localStorage.setItem("playbarClock:settings", JSON.stringify(config));
		}
	}

	const menuItem = Spicetify.React.memo(({ obj, state: propState, setState: propSetState }) => {
		const [state, setState] = propState !== undefined ? [propState, propSetState] : Spicetify.React.useState(getConfig(obj.name) ?? obj.defaultVal);

		Spicetify.React.useEffect(() => {
			setConfig(obj.name, state);
			if (obj.callback) {
				console.debug(`[playbarClock-Callback]: ${obj.name}`);
				callback({ state, setState, ...obj });
			}
		}, [state]);

		return Spicetify.React.createElement(
			Spicetify.ReactComponent.MenuItem,
			{
				onClick: () => {
					setState(prevState => !prevState);
				},
				role: "menuitemradio",
				"aria-checked": state,
				autoClose: false,
				...obj
			},
			obj.name
		);
	});

	const menuWrapper = Spicetify.React.memo(() => {
		return Spicetify.React.createElement(
			Spicetify.ReactComponent.RemoteConfigProvider,
			{ configuration: Spicetify.Platform.RemoteConfiguration },
			Spicetify.React.createElement(
				Spicetify.ReactComponent.Menu,
				null,
				Spicetify.React.createElement("div", {
					className: "main-popper-arrow",
					style: {
						bottom: "-8px",
						position: "absolute",
						left: "0px",
						backgroundColor: "var(--spice-card)",
						width: "12px",
						height: "12px",
						transform: "rotate(45deg) translate(52px, -54px)",
						zIndex: "-1"
					}
				}),
				menuOptions.map(option => {
					const [state, setState] = Spicetify.React.useState(getConfig(option.name) ?? option.defaultVal);
					return [
						Spicetify.React.createElement(menuItem, { obj: option, state: state, setState: setState }),
						option["children"] && state && option["children"].map(option => Spicetify.React.createElement(menuItem, { obj: option }))
					];
				})
			)
		);
	});

	// Clock Button
	const Clock = Spicetify.React.memo(() => {
		const [time, setTime] = Spicetify.React.useState(false);

		Spicetify.React.useEffect(() => {
			clockInterval = setInterval(() => {
				setTime(new Date());
			}, 300);
			return () => clearInterval(clockInterval);
		}, [setTime]);

		function formatTime(time) {
			let formattedTime = time.toLocaleTimeString(navigator.language || navigator.languages[0], {
				hourCycle: getConfig("12H") ? (getConfig("12:00 -> 00:00") ? "h11" : "h12") : "h23",
				hour: "2-digit",
				minute: "2-digit",
				second: getConfig("Show Seconds") ? "2-digit" : undefined
			});

			if (getConfig("Trim Hours")) formattedTime = formattedTime.replace(/^0(?=\d)/, "");
			if (!getConfig("12H")) formattedTime = formattedTime += time.getHours() >= 12 ? " PM" : " AM";
			if (!getConfig("AM/PM")) formattedTime = formattedTime.replace(/(am|pm)/i, "");

			return formattedTime;
		}

		return Spicetify.React.createElement(
			Spicetify.ReactComponent.ContextMenu,
			{
				offset: [0, 12],
				trigger: "click",
				placement: "top",
				menu: Spicetify.React.createElement(menuWrapper),
				onShow() {
					hoverTip.disable();
				},
				onHide() {
					hoverTip.enable();
				}
			},
			Spicetify.React.createElement(
				"button",
				{
					className:
						"Button-sm-16-buttonTertiary-iconOnly-useBrowserDefaultFocusStyle Button-small-small-buttonTertiary-iconOnly-useBrowserDefaultFocusStyle Button-small-small-buttonTertiary-iconOnly-isUsingKeyboard-useBrowserDefaultFocusStyle",
					style: {
						overflowWrap: "normal",
						padding: "0",
						paddingInline: "8px",
						fontWeight: "500"
					}
				},
				time !== false && formatTime(time)
			)
		);
	});

	// DOM Manipulation
	function waitForWidgetMounted() {
		const extraControlsWidget = document.querySelector(".main-nowPlayingBar-extraControls");
		if (!extraControlsWidget) {
			setTimeout(waitForWidgetMounted, 300);
			return;
		}

		// Append button
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
})();
