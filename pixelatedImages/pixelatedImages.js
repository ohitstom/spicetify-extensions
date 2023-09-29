// NAME: Pixelated Images
// AUTHORS: OhItsTom
// DESCRIPTION: Convert images into a pseudo pixel art.

(function pixelatedImages() {
	const svgNS = "http://www.w3.org/2000/svg";

	// Create SVG filter elements
	const filterElement = document.createElementNS(svgNS, "filter");
	filterElement.setAttribute("id", "pixelate");
	filterElement.innerHTML = `
      <feFlood x="0" y="0" height="2" width="2" />
      <feComposite width="10" height="10" />
      <feTile result="a" />
      <feComposite in="SourceGraphic" in2="a" operator="in" />
      <feMorphology operator="dilate" radius="5" />
  `;

	// Append SVG filter to body
	const svgElement = document.createElementNS(svgNS, "svg");
	svgElement.setAttribute("style", "height: 0;");
	svgElement.appendChild(filterElement);
	document.body.appendChild(svgElement);

	// Apply CSS style
	const cssStyleElement = document.createElement("style");
	cssStyleElement.textContent = `img { filter: url('#pixelate'); }`;
	document.head.appendChild(cssStyleElement);
})();
