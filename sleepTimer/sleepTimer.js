// NAME: Sleep Timer
// AUTHOR: OhItsTom
// DESCRIPTION: Pause playback after a certain amount of time.
// TODO: stop shifting (prob unfixable without LOADS of css) + figure out tray issue (prob unfixable)

(function sleepTimer() {
	if (!(Spicetify.Tippy && Spicetify.Player && Spicetify.React && Spicetify.ReactDOM && Spicetify.ReactComponent && Spicetify.showNotification)) {
		setTimeout(sleepTimer, 200);
		return;
	}

	// Global Variables
	// + Cached States Incase of DOM Change
	let time, setTime;
	let referenceTime, setReferenceTime;
	let stopMenuItem, setstopMenuItem;
	const timeIntervals = {
		"5 minutes": 300000,
		"10 minutes": 600000,
		"15 minutes": 900000,
		"30 minutes": 1800000,
		"45 minutes": 2700000,
		"1 hour": 3600000,
		"End of track": "EOT"
	};

	// Timer Menu
	const menuWrapper = Spicetify.React.memo(() => {
		return Spicetify.React.createElement(
			Spicetify.ReactComponent.Menu,
			null,
			Spicetify.React.createElement("div", {
				"data-popper-arrow": "",
				className: "main-popper-arrow",
				style: {
					bottom: "-8px",
					"--generic-tooltip-background-color": "var(--spice-card)"
				}
			}),
			Object.entries(timeIntervals)
				.map(([key, value], index) => {
					return Spicetify.React.createElement(
						Spicetify.ReactComponent.MenuItem,
						{
							key: index,
							onClick: e => {
								startTimer(value);
								Spicetify.showNotification(`Selected: ${key}`);
							}
						},
						key
					);
				})
				.concat(
					stopMenuItem
						? [
								Spicetify.React.createElement(
									Spicetify.ReactComponent.MenuItem,
									{
										divider: "before",
										key: "Turn off timer",
										onClick: e => {
											stopTimer(0, false, "Timer stopped");
										}
									},
									"Turn off timer"
								)
						  ]
						: []
				)
		);
	});

	// Timer Button
	const Timer = Spicetify.React.memo(() => {
		[time, setTime] = Spicetify.React.useState(time ?? false);
		[referenceTime, setReferenceTime] = Spicetify.React.useState(referenceTime ?? performance.now());
		[stopMenuItem, setstopMenuItem] = Spicetify.React.useState(stopMenuItem ?? false);

		Spicetify.React.useEffect(() => {
			let requestId;

			const countDown = () => {
				requestId = requestAnimationFrame(() => {
					setTime(prevTime => {
						const now = performance.now();
						const elapsed = now - referenceTime;
						setReferenceTime(now);
						return Math.max(prevTime - elapsed, 0);
					});
				});
			};

			if (time !== false && time !== "EOT") {
				time > 0 ? countDown() : stopTimer(1000);
			}

			return () => {
				cancelAnimationFrame(requestId);
			};
		}, [time]);

		stopTimer = (ms = 0, pause = true, message = "Timer finished!") => {
			console.log(performance.now());
			setTimeout(function () {
				setTime(false);
				setstopMenuItem(false);

				if (pause) Spicetify.Platform.PlayerAPI.pause(); // if restrictions are in place block until they arent
				Spicetify.showNotification(message);
			}, ms);
		};

		startTimer = ms => {
			console.log(performance.now());
			setReferenceTime(performance.now());
			setTime(ms);
			setstopMenuItem(true);
		};

		function formatTime(seconds) {
			if (!isFinite(seconds)) return "EOT";

			let remainingSeconds = Math.ceil(seconds / 1000);
			return [3600, 60, 1]
				.reduce((parts, divisor, index) => {
					const padding = parts.length === 0 ? 1 : 2;
					if (remainingSeconds >= divisor || parts.length > 0 || index === [1, 60, 3600].length - 2) {
						const quotient = Math.floor(remainingSeconds / divisor);
						remainingSeconds -= quotient * divisor;
						parts.push(quotient.toString().padStart(padding, "0"));
					}
					return parts;
				}, [])
				.join(":");
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
					className: "Button-sm-16-buttonTertiary-iconOnly-isUsingKeyboard-useBrowserDefaultFocusStyle Button-textSubdued-small-small-buttonTertiary-iconOnly-condensed-useBrowserDefaultFocusStyle",
					style: {
						overflowWrap: "normal",
						padding: "0",
						paddingInline: "8px"
					}
				},
				Spicetify.React.createElement(
					"span",
					{
						style: {
							display: "flex",
							paddingInline: time !== false && "0px 4px"
						}
					},
					Spicetify.React.createElement(
						"svg",
						{
							role: "img",
							height: 16,
							width: 16,
							viewBox: "0 0 16 16",
							"data-encore-id": "icon",
							style: {
								fill: time !== false ? "var(--text-bright-accent)" : "currentColor"
							}
						},
						Spicetify.React.createElement("path", {
							d:
								time !== false
									? "M5.2,0c-0.387,0 -0.7,0.336 -0.7,0.75s0.313,0.75 0.7,0.75h2.05v0.25a0.75,0.75 0,0 0,1.5 0L8.75,1.5h2.05c0.387,0 0.7,-0.336 0.7,-0.75S11.187,0 10.8,0L5.2,0ZM8,16A6.5,6.5 0,1 0,8 3a6.5,6.5 0,0 0,0 13ZM8.75,7v3a0.75,0.75 0,0 1,-1.5 0L7.25,7a0.75,0.75 0,0 1,1.5 0Z"
									: "M5.2,0c-0.387,0 -0.7,0.336 -0.7,0.75s0.313,0.75 0.7,0.75h2.05v0.25a0.75,0.75 0,0 0,1.5 0L8.75,1.5h2.05c0.387,0 0.7,-0.336 0.7,-0.75S11.187,0 10.8,0L5.2,0ZM8.75,7a0.75,0.75 0,0 0,-1.5 0v3a0.75,0.75 0,0 0,1.5 0L8.75,7Z"
						}),
						Spicetify.React.createElement("path", {
							d: "M1.5,9.5a6.5,6.5 0,1 1,13 0,6.5 6.5,0 0,1 -13,0ZM8,4.444a5.056,5.056 0,1 0,0 10.112A5.056,5.056 0,0 0,8 4.444Z"
						})
					)
				),
				time !== false && formatTime(time)
			)
		);
	});

	// DOM Manipulation
	function waitForWidgetMounted() {
		nowPlayingWidget = document.querySelector(".main-nowPlayingWidget-nowPlaying");
		heart = document.querySelector(".control-button-heart");
		if (!(nowPlayingWidget && heart)) {
			setTimeout(waitForWidgetMounted, 300);
			return;
		}

		const timerContainer = document.createElement("div");
		timerContainer.className = "sleepTimer-container";

		const timerElement = nowPlayingWidget.insertBefore(timerContainer, heart);
		Spicetify.ReactDOM.render(Spicetify.React.createElement(Timer), timerElement);

		hoverTip = Spicetify.Tippy(timerElement, {
			...Spicetify.TippyProps,
			content: "Sleep Timer"
		});
	}

	(function attachObserver() {
		const leftPlayer = document.querySelector(".main-nowPlayingBar-left");
		if (!leftPlayer) {
			setTimeout(attachObserver, 300);
			return;
		}
		waitForWidgetMounted();
		const observer = new MutationObserver(mutations => {
			mutations.forEach(mutation => {
				if (mutation.removedNodes.length > 0) {
					const removedNodes = Array.from(mutation.removedNodes);
					const isNowPlayingRemoved = removedNodes.some(node => node.classList && node.classList.contains("main-nowPlayingWidget-nowPlaying"));
					if (isNowPlayingRemoved) {
						waitForWidgetMounted();
					}
				}
			});
		});
		observer.observe(leftPlayer, { childList: true });
	})();

	// End of song Event listener
	Spicetify.Player.addEventListener("songchange", function (e) {
		if (typeof time === "string") {
			stopTimer(0, true);
		}
	});
})();
