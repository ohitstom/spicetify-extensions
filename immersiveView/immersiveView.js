// NAME: Immersive View
// AUTHORS: OhItsTom
// DESCRIPTION: Button to hide uneccesary information, providing an immersive experience.

(async function immersiveView() {
  if (!document.querySelector(".main-noConnection")) {
    setTimeout(immersiveView, 300);
    return;
  }
  await initImmersiveView();
})();

function initImmersiveView() {
  function applyImmersiveView(bool) {
    if (bool) {
      var styleElement = document.createElement("style");
      styleElement.className = "immersive-view";
      var css = `
      .Root__nav-bar,
      .Root__now-playing-bar,
      .Root__right-sidebar {
        display: none;
      }
      body.ylx .Root__top-container {
        padding: 0 8px 0 0 !important;
        padding-top: calc(24px + var(--panel-gap)*2) !important;
      }
      body:not(.ylx) .main-topBar-historyButtons {
        margin-left: 45px;
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
  const buttonLabel = () =>
    state ? "Exit Immersive View" : "Enter Immersive View";
  const buttonIcon = () =>
    state ? Spicetify.SVGIcons.minimize : Spicetify.SVGIcons.fullscreen;

  const button = document.createElement("button");
  const setButtonIcon = () => {
    button.innerHTML = `
      <svg role="img" height="16" width="16" viewBox="0 0 16 16" fill="currentColor">
        ${buttonIcon()}
      </svg>
    `;
  };
  const tippy = new Spicetify.Tippy(button, {
    ...Spicetify.TippyProps,
    content: buttonLabel(),
    placement: "bottom",
  });

  button.className =
    "immersive-view encore-over-media-set IAyWaeDamLJLjxuPeVKw";
  button.onclick = function () {
    state = !state;
    tippy.setContent(buttonLabel());
    setButtonIcon();
    applyImmersiveView(state);
  };

  setButtonIcon();

  const entryPoint = document.querySelector(".main-noConnection");
  entryPoint.after(button);
}
