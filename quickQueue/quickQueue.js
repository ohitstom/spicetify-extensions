// NAME: Quick Queue (Refactored Vanilla DOM Edition)
// AUTHOR: OhItsTom, Refactored for 1.2.86
// DESCRIPTION: Adds a button to the tracklist to add/remove a song from the queue. Bypasses broken React hooks.

(function quickQueue() {
	if (
		!(
			Spicetify.Platform &&
			Spicetify.Platform.PlayerAPI &&
			Spicetify.showNotification
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
				}
			).register();
		}
	} catch (error) {}

	// Helper to insert next in queue
	async function addToNext(uri) {
		const queue = await Spicetify.Platform.PlayerAPI.getQueue();
		if (!queue.queued.length > 0) return await Spicetify.Platform.PlayerAPI.addToQueue([{ uri }]);

		await Spicetify.Platform.PlayerAPI.insertIntoQueue([{ uri }], {
			before: {
				uri: queue.queued[0].uri,
				uid: queue.queued[0].uid
			}
		});
	}

	// --- VANILLA DOM BUTTON GENERATOR ---
	function createVanillaButton(uri, nativeClasses) {
		const btn = document.createElement("button");
		btn.className = nativeClasses;
		btn.style.marginRight = "12px";

		const span = document.createElement("span");
		span.className = "Wrapper-sm-only Wrapper-small-only";

		const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svg.setAttribute("role", "img");
		svg.setAttribute("height", "16");
		svg.setAttribute("width", "16");
		svg.setAttribute("viewBox", "0 0 16 16");

		// Visual State Manager
		const updateVisuals = () => {
			const isQueued = Spicetify.Platform.PlayerAPI._queue._queueState.queued.some(item => item.uri === uri);
			
			svg.setAttribute("class", isQueued ? "Svg-img-icon-small-textBrightAccent" : "Svg-img-icon-small");
			svg.style.fill = isQueued ? "var(--text-bright-accent)" : "var(--text-subdued)";
			btn.style.opacity = isQueued ? "1" : "";
			btn.setAttribute("aria-checked", isQueued);

			svg.innerHTML = isQueued
				? `<path d="M5.25 3v-.917C5.25.933 6.183 0 7.333 0h1.334c1.15 0 2.083.933 2.083 2.083V3h4.75v1.5h-.972l-1.257 9.544A2.25 2.25 0 0 1 11.041 16H4.96a2.25 2.25 0 0 1-2.23-1.956L1.472 4.5H.5V3h4.75zm1.5-.917V3h2.5v-.917a.583.583 0 0 0-.583-.583H7.333a.583.583 0 0 0-.583.583zM2.986 4.5l1.23 9.348a.75.75 0 0 0 .744.652h6.08a.75.75 0 0 0 .744-.652L13.015 4.5H2.985z"></path>`
				: `<path d="M16 15H2v-1.5h14V15zm0-4.5H2V9h14v1.5zm-8.034-6A5.484 5.484 0 0 1 7.187 6H13.5a2.5 2.5 0 0 0 0-5H7.966c.159.474.255.978.278 1.5H13.5a1 1 0 1 1 0 2H7.966zM2 2V0h1.5v2h2v1.5h-2v2H2v-2H0V2h2z"></path>`;
		};

		// Initial render
		updateVisuals();

		// Subscribe to Spotify Queue API to auto-update icon
		const onQueueUpdate = () => updateVisuals();
		Spicetify.Platform.PlayerAPI._queue._events.addListener("queue_update", onQueueUpdate);

		// Native Event Listeners
		btn.addEventListener("click", async (e) => {
			e.preventDefault();
			e.stopPropagation();

			const isQueued = Spicetify.Platform.PlayerAPI._queue._queueState.queued.some(item => item.uri === uri);

			if (e.shiftKey && !isQueued) {
				await addToNext(uri);
				Spicetify.showNotification("Added to next in queue");
			} else {
				if (isQueued) {
					Spicetify.Platform.PlayerAPI.removeFromQueue([{ uri }]);
					Spicetify.showNotification("Removed from queue");
				} else {
					Spicetify.Platform.PlayerAPI.addToQueue([{ uri }]);
					Spicetify.showNotification("Added to queue");
				}
			}
		});

		// Tippy Tooltip Fallback
		if (Spicetify.Tippy) {
			Spicetify.Tippy(btn, {
				...Spicetify.TippyProps,
				content: () => {
					 const isQ = Spicetify.Platform.PlayerAPI._queue._queueState.queued.some(item => item.uri === uri);
					 return isQ ? "Remove from queue" : "Add to queue";
				}
			});
		}

		span.appendChild(svg);
		btn.appendChild(span);
		return btn;
	}

	// --- CORE INJECTION LOGIC ---
	function injectQueueButton(row) {
		if (row.nodeType !== 1 || row.classList.contains('main-yourLibraryX-listItem') || row.children.length === 0) return;

		let moreButton = row.querySelector('[data-testid="more-button"]');
		
		// If 'More' button is culled by hover state, anchor to the explicit track actions container
		const actionContainer = moreButton ? moreButton.parentElement : row.querySelector('.main-trackList-rowSectionEnd');
		if (!actionContainer || actionContainer.querySelector('.queueControl-wrapper')) return;

		// Extract URI using the mapped 1.2.86 Fiber Path
		let uri = undefined;
		const reactPropsKey = Object.keys(row).find(key => key.startsWith("__reactProps$"));
		if (reactPropsKey && row[reactPropsKey]) {
			uri = row[reactPropsKey]?.children?.props?.children?.props?.children?.props?.value?.item?.uri;
		}

		if (!uri || !uri.includes("spotify:track:")) return;

		let insertionParent = actionContainer;
		let referenceNode = moreButton;

		if (placeLeftSide) {
			const startCell = row.querySelector('.main-trackList-rowSectionStart[role="gridcell"]');
			if (startCell) {
				if (startCell.querySelector('.queueControl-wrapper')) return; 
				insertionParent = startCell;
				referenceNode = startCell.querySelector('img') || startCell.firstElementChild;
			}
		}

		// Build and inject custom UI wrapper
		const queueButtonWrapper = document.createElement("div");
		queueButtonWrapper.className = "queueControl-wrapper";
		queueButtonWrapper.style.display = "contents";

		insertionParent.insertBefore(queueButtonWrapper, referenceNode);

		// GENERATE AND APPEND VANILLA BUTTON (Stealing native button CSS from hardcoded classes to bypass missing hover state)
		const nativeClassString = "e-10180-legacy-button e-10180-legacy-button-tertiary e-10180-overflow-wrap-anywhere e-10180-button-tertiary--icon-only-small e-10180-button-tertiary--icon-only e-10180-button-tertiary--condensed e-10180-button-tertiary--text-subdued encore-internal-color-text-subdued";
		const nativeBtn = createVanillaButton(uri, moreButton ? moreButton.classList.value : nativeClassString);
		queueButtonWrapper.appendChild(nativeBtn);
	}

	// 1. INITIALIZATION: Sweep the DOM
	document.querySelectorAll('[role="row"]').forEach(injectQueueButton);

	// 2. OBSERVER: Watch for virtual DOM mutations
	const observer = new MutationObserver(mutationList => {
		for (const mutation of mutationList) {
			for (const node of mutation.addedNodes) {
				if (node.nodeType !== 1) continue;
				if (node.getAttribute("role") === "row") {
					injectQueueButton(node);
				} else {
					node.querySelectorAll('[role="row"]').forEach(injectQueueButton);
				}
			}
		}
	});

	observer.observe(document, { subtree: true, childList: true });
})();
