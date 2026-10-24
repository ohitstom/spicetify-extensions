// NAME: Quick Queue
// AUTHOR: OhItsTom
// DESCRIPTION: Adds a button to the tracklist to add/remove a song from the queue.

(function quickQueue() {
	if (
		!(
			Spicetify.React &&
			Spicetify.ReactDOM &&
			Spicetify.showNotification &&
			Spicetify.Platform?.PlayerAPI &&
			Spicetify.Tippy &&
			Spicetify.TippyProps
		)
	) {
		setTimeout(quickQueue, 10);
		return;
	}

	// Settings
	const STORAGE_KEY_PLACE_LEFT = "quickQueue.placeLeftSide";
	let placeLeftSide = Spicetify.LocalStorage.get(STORAGE_KEY_PLACE_LEFT) === "1";

	try {
		if (Spicetify.Menu?.Item) {
			new Spicetify.Menu.Item(
				"Quick Queue: Button on the left",
				placeLeftSide,
				self => {
					placeLeftSide = !placeLeftSide;
					self.setState(placeLeftSide);
					Spicetify.LocalStorage.set(STORAGE_KEY_PLACE_LEFT, placeLeftSide ? "1" : "0");
					Spicetify.showNotification(`Quick Queue placement is now ${placeLeftSide ? "on the left" : "in the right column"}`);

					// Re-place the buttons of rows that are already rendered
					refreshAll();
				}
			).register();
		}
	} catch (error) {
		// no-op: menu might not be available in all environments
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
				Spicetify.showNotification(isQueued ? "Removed from queue" : Spicetify.Locale?._dictionary?.["queue.added-to-queue"] || "Added to queue");
			}
		};

		const getTooltipContent = () => {
			return isQueued
				? Spicetify.Locale?._dictionary?.["contextmenu.remove-from-queue"] || "Remove from queue"
				: isShiftPressed
				? "Play next in queue"
				: Spicetify.Locale?._dictionary?.["contextmenu.add-to-queue"] || "Add to queue";
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
				{
					style: { display: "flex" }
				},
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

	// ---------------------------------------------------------------------
	// Track URI lookup
	// ---------------------------------------------------------------------

	const isTrackUri = uri => typeof uri === "string" && /^spotify:(track|episode|local):/.test(uri);

	// Reads a track URI out of a props-like object, checking the known shapes.
	function uriFromProps(props) {
		if (!props || typeof props !== "object") return null;
		const candidates = [props.uri, props.item?.uri, props.track?.uri, props.value?.item?.uri, props.value?.uri];
		return candidates.find(isTrackUri) || null;
	}

	// Recursive fallback: walks `children` / `props` looking for a track URI.
	function findUriDeep(obj, seen = new WeakSet()) {
		if (!obj || typeof obj !== "object" || seen.has(obj)) return null;
		seen.add(obj);

		const direct = uriFromProps(obj);
		if (direct) return direct;

		const children = obj.children || obj.props?.children;
		if (children) {
			for (const child of Array.isArray(children) ? children : [children]) {
				const result = findUriDeep(child?.props || child, seen);
				if (result) return result;
			}
		}

		if (obj.props && obj.props !== obj) return findUriDeep(obj.props, seen);

		return null;
	}

	// Row class names are hashed and change between Spotify releases, so the URI
	// is read from the React fiber attached to the row element instead.
	function getRowUri(row) {
		const elements = [row, row.firstElementChild, row.firstElementChild?.firstElementChild].filter(Boolean);
		const getFiber = el => {
			const key = Object.keys(el).find(k => k.startsWith("__reactFiber$"));
			return key ? el[key] : null;
		};

		// 1. Walk up the fiber tree and check the props at every level
		for (const el of elements) {
			let fiber = getFiber(el);
			for (let depth = 0; fiber && depth < 20; depth++, fiber = fiber.return) {
				const uri = uriFromProps(fiber.memoizedProps) || uriFromProps(fiber.pendingProps);
				if (uri) return uri;
			}
		}

		// 2. Fallback: deep search through the props of the first fiber found
		for (const el of elements) {
			const props = getFiber(el)?.memoizedProps;
			const uri = props && findUriDeep({ props });
			if (uri) return uri;
		}

		return null;
	}

	// ---------------------------------------------------------------------
	// Button placement
	// ---------------------------------------------------------------------

	function removeWrapper(wrapper) {
		Spicetify.ReactDOM.unmountComponentAtNode?.(wrapper);
		wrapper.remove();
	}

	// Removes every injected button and queues all rows to be processed again
	function refreshAll() {
		document.querySelectorAll(".queueControl-wrapper").forEach(removeWrapper);
		document.querySelectorAll('[role="row"]').forEach(scheduleRow);
	}

	// A tracklist row is a grid of cells:
	// [index | title (cover + text) | album | ... | actions (like, duration, more)]
	// Returns where the button should be inserted for the current setting.
	function getPlacement(row, actionsCell, likeButton) {
		if (placeLeftSide) {
			const titleCell = row.firstElementChild?.querySelector(':scope > [role="gridcell"][aria-colindex="2"]');
			if (titleCell) {
				// Insert before the cover image. Views without covers (e.g. albums) get it at the start of the cell.
				const cover = titleCell.querySelector(":scope > img");
				return { parent: titleCell, before: cover || titleCell.firstElementChild, side: "left" };
			}
			// The view has no title cell: fall back to the right side
		}

		return { parent: actionsCell, before: likeButton, side: "right" };
	}

	// Idempotent: safe to call any number of times for the same row
	function processRow(row) {
		const actionsCell = row.firstElementChild?.lastElementChild;
		if (!actionsCell) return;

		// The like button is always needed, its classes are reused for the queue button
		const likeButton = actionsCell.querySelector(":scope > button:not(:last-child):has([data-encore-id])");
		if (!likeButton) return; // Row is still rendering, it will be processed again on the next mutation

		const uri = getRowUri(row);
		if (!uri) return;

		const { parent, before, side } = getPlacement(row, actionsCell, likeButton);

		let wrapper = row.querySelector(".queueControl-wrapper");

		// The setting changed or React moved the cell: rebuild in the right place
		if (wrapper && (wrapper.dataset.side !== side || wrapper.parentElement !== parent)) {
			removeWrapper(wrapper);
			wrapper = null;
		}

		if (wrapper && wrapper.dataset.uri === uri) return; // Already up to date

		if (!wrapper) {
			wrapper = document.createElement("div");
			wrapper.className = "queueControl-wrapper";
			wrapper.style.display = "contents";
			wrapper.dataset.side = side;
			parent.insertBefore(wrapper, before?.parentNode === parent ? before : parent.firstChild);
		}
		wrapper.dataset.uri = uri;

		// Rows are virtualized and recycled for other tracks, so the key remounts
		// the button whenever the URI changes
		Spicetify.ReactDOM.render(
			Spicetify.React.createElement(QueueButton, {
				key: uri,
				uri,
				classList: likeButton.classList
			}),
			wrapper
		);
	}

	// ---------------------------------------------------------------------
	// Row observer
	// ---------------------------------------------------------------------

	// Rows are inserted empty and filled in afterwards, so they are re-checked
	// on every change inside them. Work is batched to one pass per frame.
	const pendingRows = new Set();
	let flushScheduled = false;

	function scheduleRow(row) {
		pendingRows.add(row);
		if (flushScheduled) return;
		flushScheduled = true;
		requestAnimationFrame(() => {
			flushScheduled = false;
			const rows = [...pendingRows];
			pendingRows.clear();
			rows.forEach(row => row.isConnected && processRow(row));
		});
	}

	const observer = new MutationObserver(mutations => {
		for (const mutation of mutations) {
			for (const node of [mutation.target, ...mutation.addedNodes]) {
				if (node.nodeType !== 1) continue;
				const parentRow = node.closest?.('[role="row"]');
				if (parentRow) scheduleRow(parentRow);
				else node.querySelectorAll?.('[role="row"]').forEach(scheduleRow);
			}
		}
	});

	observer.observe(document, {
		subtree: true,
		childList: true,
		attributes: true,
		attributeFilter: ["aria-rowindex"] // Detects recycled rows while scrolling
	});

	// Rows that were already rendered before the extension loaded
	document.querySelectorAll('[role="row"]').forEach(scheduleRow);
})();