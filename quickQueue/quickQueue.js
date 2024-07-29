// NAME: Quick Queue
// AUTHOR: OhItsTom
// DESCRIPTION: Adds a button to the tracklist to add/remove a song from the queue.

(function quickQueue() {
	if (
		!(
			Spicetify.React &&
			Spicetify.ReactDOM &&
			Spicetify.SVGIcons &&
			Spicetify.showNotification &&
			Spicetify.Platform.PlayerAPI &&
			Spicetify.Tippy &&
			Spicetify.TippyProps &&
			Spicetify.Locale._dictionary &&
			Spicetify.Mousetrap
		)
	) {
		setTimeout(quickQueue, 10);
		return;
	}

	const QueueButton = Spicetify.React.memo(({ uri, classList }) => {
		const [isQueued, setIsQueued] = Spicetify.React.useState(Spicetify.Platform.PlayerAPI._queue._queueState.queued.some(item => item.uri === uri));
		const [tippyInstance, setTippyInstance] = Spicetify.React.useState(null);
		const [isShiftPressed, setIsShiftPressed] = Spicetify.React.useState(false);
		const buttonRef = Spicetify.React.useRef(null);

		// Functions
		const updateQueueState = event => setIsQueued(event.data.queued.some(item => item.uri === uri));
		const handleKeyDown = event => event.key === "Shift" && setIsShiftPressed(true);
		const handleKeyUp = event => event.key === "Shift" && setIsShiftPressed(false);

		const handleClick = async event => {
			if (isQueued && event.type === "contextmenu") return;

			if (!isQueued && (event.type === "contextmenu" || isShiftPressed)) {
				event.preventDefault();
				event.stopPropagation();
				await addToNext(uri);
				Spicetify.showNotification("Added to next in queue");
			} else {
				Spicetify.Platform.PlayerAPI[isQueued ? "removeFromQueue" : "addToQueue"]([{ uri }]);
				Spicetify.showNotification(isQueued ? "Removed from queue" : Spicetify.Locale._dictionary["queue.added-to-queue"] || "Added to queue");
			}
		};

		const getTooltipContent = () => {
			return isQueued
				? Spicetify.Locale._dictionary["contextmenu.remove-from-queue"] || "Remove from queue"
				: isShiftPressed
				? "Play next in queue"
				: Spicetify.Locale._dictionary["contextmenu.add-to-queue"] || "Add to queue";
		};

		Spicetify.React.useEffect(() => {
			Spicetify.Platform.PlayerAPI._queue._events.addListener("queue_update", updateQueueState);
			document.addEventListener("keydown", handleKeyDown);
			document.addEventListener("keyup", handleKeyUp);
		}, []);

		// Cleanup
		Spicetify.React.useEffect(() => {
			const intervalId = setInterval(function () {
				if (!document.contains(buttonRef.current)) {
					clearInterval(intervalId);
					tippyInstance?.destroy();
					document.removeEventListener("keydown", handleKeyDown);
					document.removeEventListener("keyup", handleKeyUp);
					Spicetify.Platform.PlayerAPI._queue._events.removeListener("queue_update", updateQueueState);
				}
			}, 1000);
		}, []);

		// Tooltip initialization and update
		Spicetify.React.useEffect(() => {
			if (buttonRef.current && !tippyInstance) {
				const instance = Spicetify.Tippy(buttonRef.current, {
					...Spicetify.TippyProps,
					hideOnClick: true,
					content: getTooltipContent()
				});
				setTippyInstance(instance);
			} else if (tippyInstance) {
				tippyInstance.setProps({ content: getTooltipContent() });
			}
		}, [isQueued, isShiftPressed, tippyInstance]);

		// Render
		return Spicetify.React.createElement(
			"button",
			{
				ref: buttonRef,
				className: classList,
				"aria-checked": isQueued,
				onClick: handleClick,
				onContextMenu: handleClick,
				style: {
					marginRight: "12px",
					opacity: isQueued ? "1" : undefined
				}
			},
			Spicetify.React.createElement(
				"span",
				{ className: "Wrapper-sm-only Wrapper-small-only" },
				Spicetify.React.createElement("svg", {
					role: "img",
					height: "16",
					width: "16",
					viewBox: "0 0 16 16",
					className: isQueued ? "Svg-img-icon-small-textBrightAccent" : "Svg-img-icon-small",
					style: {
						fill: isQueued ? "var(--text-bright-accent)" : "var(--text-subdued)"
					},
					dangerouslySetInnerHTML: {
						__html: isQueued
							? `<path d="M5.25 3v-.917C5.25.933 6.183 0 7.333 0h1.334c1.15 0 2.083.933 2.083 2.083V3h4.75v1.5h-.972l-1.257 9.544A2.25 2.25 0 0 1 11.041 16H4.96a2.25 2.25 0 0 1-2.23-1.956L1.472 4.5H.5V3h4.75zm1.5-.917V3h2.5v-.917a.583.583 0 0 0-.583-.583H7.333a.583.583 0 0 0-.583.583zM2.986 4.5l1.23 9.348a.75.75 0 0 0 .744.652h6.08a.75.75 0 0 0 .744-.652L13.015 4.5H2.985z"></path>`
							: `<path d="M16 15H2v-1.5h14V15zm0-4.5H2V9h14v1.5zm-8.034-6A5.484 5.484 0 0 1 7.187 6H13.5a2.5 2.5 0 0 0 0-5H7.966c.159.474.255.978.278 1.5H13.5a1 1 0 1 1 0 2H7.966zM2 2V0h1.5v2h2v1.5h-2v2H2v-2H0V2h2z"></path>`
					}
				})
			)
		);
	});

	// modified from github.com/daksh2k/Spicetify-stuff/blob/6edf2235f8b8ec514b27a10aca4607d38b2fbb87/Extensions/playNext.js#L131
	async function addToNext(uri) {
		const queue = await Spicetify.Platform.PlayerAPI.getQueue();
		if (!queue.queued.length > 0) return await Spicetify.addToQueue([{ uri }]);

		await Spicetify.Platform.PlayerAPI.insertIntoQueue([{ uri }], {
			before: {
				uri: queue.queued[0].uri,
				uid: queue.queued[0].uid
			}
		});
	}

	function findVal(object, key, max = 10) {
		if (object[key] !== undefined || !max) {
			return object[key];
		}

		for (const k in object) {
			if (object[k] && typeof object[k] === "object") {
				const value = findVal(object[k], key, --max);
				if (value !== undefined) {
					return value;
				}
			}
		}

		return undefined;
	}

	const observer = new MutationObserver(mutationList => {
		mutationList.forEach(mutation => {
			mutation.addedNodes.forEach(node => {
				const nodeMatch =
					node.attributes?.role?.value === "row"
						? node.firstChild?.lastChild
						: node.firstChild?.attributes?.role?.value === "row"
						? node.firstChild?.firstChild.lastChild
						: null;

				if (nodeMatch) {
					const entryPoint = nodeMatch.querySelector(":scope > button:not(:last-child):has([data-encore-id])");

					if (entryPoint) {
						const reactPropsKey = Object.keys(node).find(key => key.startsWith("__reactProps$"));
						const uri = findVal(node[reactPropsKey], "uri");

						const queueButtonWrapper = document.createElement("div");
						queueButtonWrapper.className = "queueControl-wrapper";
						queueButtonWrapper.style.display = "contents";
						queueButtonWrapper.style.marginRight = 0;

						const queueButtonElement = nodeMatch.insertBefore(queueButtonWrapper, entryPoint);
						Spicetify.ReactDOM.render(
							Spicetify.React.createElement(QueueButton, {
								uri,
								classList: entryPoint.classList
							}),
							queueButtonElement
						);
					}
				}
			});
		});
	});

	observer.observe(document, {
		subtree: true,
		childList: true
	});
})();
