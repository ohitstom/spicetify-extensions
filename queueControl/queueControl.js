// NAME: Tracklist Queue Control
// AUTHOR: OhItsTom
// DESCRIPTION: Adds a button to the tracklist to add/remove a song from the queue.

(function queueControl() {
	if (
		!(
			Spicetify.React &&
			Spicetify.ReactDOM &&
			Spicetify.SVGIcons &&
			Spicetify.showNotification &&
			Spicetify.Platform.PlayerAPI &&
			Spicetify.Tippy &&
			Spicetify.TippyProps
		)
	) {
		setTimeout(queueControl, 200);
		return;
	}

	const QueueButton = Spicetify.React.memo(({ uri, tippy }) => {
		const [isQueued, setIsQueued] = Spicetify.React.useState(Spicetify.Platform.PlayerAPI.getQueue().queued.some(item => item.uri === uri));

		Spicetify.React.useEffect(() => {
			//Spicetify.Platform.PlayerAPI._queue._events.addListener("queue_update", e => console.log(uri, "signal receive"));
			return function cleanup() {
				console.log("exit");
			};
		}, [uri, tippy]);

		// Initialize
		tippy.setProps({ content: isQueued ? "Remove from queue" : "Add to queue" });

		// Functions
		const handleClick = function () {
			Spicetify.showNotification(isQueued ? "Removed from queue" : "Added to queue");
			Spicetify.Platform.PlayerAPI[isQueued ? "removeFromQueue" : "addToQueue"]([{ uri: uri }]);
			tippy.setProps({ content: isQueued ? "Remove from queue" : "Add to queue" });
			setIsQueued(!isQueued);
		};

		// Render
		return Spicetify.React.createElement(
			"button",
			{
				className:
					"Button-sm-16-buttonTertiary-iconOnly-isUsingKeyboard-useBrowserDefaultFocusStyle Button-textSubdued-small-small-buttonTertiary-iconOnly-condensed-isUsingKeyboard-useBrowserDefaultFocusStyle main-trackList-rowHeartButton",
				"aria-checked": false,
				onClick: handleClick
			},
			Spicetify.React.createElement(
				"span",
				{ className: "Wrapper-sm-only Wrapper-small-only" },
				Spicetify.React.createElement(
					"svg",
					{
						role: "img",
						height: "16",
						width: "16",
						viewBox: "0 0 16 16",
						className: "Svg-img-icon-small"
					},
					Spicetify.React.createElement("svg", {
						dangerouslySetInnerHTML: { __html: isQueued ? Spicetify.SVGIcons.block : Spicetify.SVGIcons.queue }
					})
				)
			)
		);
	});

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

	const observer = new MutationObserver(function (mutationList) {
		mutationList.forEach(mutation => {
			const node = mutation.addedNodes[0];
			if (node?.attributes?.role?.value === "row") {
				const lastRowSection = node.firstChild.lastChild;
				const heartButton = lastRowSection.firstChild;
				if (heartButton && heartButton.classList.contains("main-trackList-rowHeartButton")) {
					const reactProps = Object.keys(node).find(k => k.startsWith("__reactProps$"));
					const uri = findVal(node[reactProps], "uri");

					const queueButtonWrapper = document.createElement("div");
					queueButtonWrapper.className = "queueControl-wrapper";
					queueButtonWrapper.style.marginRight = 0;

					const queueButtonElement = lastRowSection.insertBefore(queueButtonWrapper, heartButton);
					const tippy = Spicetify.Tippy(queueButtonElement, {
						...Spicetify.TippyProps,
						hideOnClick: true
					});
					Spicetify.ReactDOM.render(Spicetify.React.createElement(QueueButton, { uri: uri, tippy: tippy }), queueButtonElement);
				}
			}
		});
	});

	observer.observe(document, {
		subtree: true,
		childList: true
	});
})();
