// NAME: Pixelated Images
// AUTHORS: OhItsTom
// DESCRIPTION: Convert images into a pseudo pixel art.

(function pixelatedImages() {
	// Element creation + Attributes
	const svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	svgElement.setAttribute("style", "height: 0;");
	const filterElement = document.createElementNS("http://www.w3.org/2000/svg", "filter");
	filterElement.setAttribute("id", "pixelate");
	filterElement.setAttribute("x", "0");
	filterElement.setAttribute("y", "0");
	const feFloodElement = document.createElementNS("http://www.w3.org/2000/svg", "feFlood");
	feFloodElement.setAttribute("x", "0");
	feFloodElement.setAttribute("y", "0");
	feFloodElement.setAttribute("height", "2");
	feFloodElement.setAttribute("width", "2");
	const feCompositeElement = document.createElementNS("http://www.w3.org/2000/svg", "feComposite");
	feCompositeElement.setAttribute("width", "10");
	feCompositeElement.setAttribute("height", "10");
	const feTileElement = document.createElementNS("http://www.w3.org/2000/svg", "feTile");
	feTileElement.setAttribute("result", "a");
	const feCompositeElement2 = document.createElementNS("http://www.w3.org/2000/svg", "feComposite");
	feCompositeElement2.setAttribute("in", "SourceGraphic");
	feCompositeElement2.setAttribute("in2", "a");
	feCompositeElement2.setAttribute("operator", "in");
	const feMorphologyElement = document.createElementNS("http://www.w3.org/2000/svg", "feMorphology");
	feMorphologyElement.setAttribute("operator", "dilate");
	feMorphologyElement.setAttribute("radius", "5");

	// Append to body
	filterElement.append(feFloodElement, feCompositeElement, feTileElement, feCompositeElement2, feMorphologyElement);
	svgElement.appendChild(filterElement);
	document.body.appendChild(svgElement);

	// Stylesheet
	const cssStyleElement = document.createElement("style");
	cssStyleElement.textContent = `img { filter: url('#pixelate'); }`;
	document.head.appendChild(cssStyleElement);
})();
