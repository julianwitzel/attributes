# Signature Pad Attribute

## Overview

The Signature Pad module is part of the VIERLESS Attributes project. It provides an easy-to-implement signature drawing functionality for web forms, utilizing HTML5 canvas and custom data attributes.

## Features

- Responsive canvas that adjusts to container size
- Clear button functionality
- Touch and mouse support
- Automatic conversion of signature to hidden input for form submission
- Throttled resize event handling for performance
- Dynamic line thickness based on drawing speed
- Multiple save formats (PNG, JPEG, SVG)
- Customizable options through data attributes or JavaScript

## Usage

### HTML Structure

The script works by searching for all elements with the data-pad="wrapper" attribute followed by this HTML structure:

```html
<!-- Signature Pad Component -->
<div class="signature-pad_wrapper" data-pad="wrapper">
	<canvas
		class="signature-pad"
		id="mySignature"
		data-pad-color="#000"
		data-pad-thickness="3"
		data-pad-line-join="round"
		data-pad-line-cap="round"
		data-pad-scale="2"
		data-pad-min-thickness="1.5"
		data-pad-max-thickness="6"
		data-pad-min-speed="0.5"
		data-pad-max-speed="10"
		data-pad-smoothness="10"
		data-pad-save-format="png"
		data-pad-speed-sensitivity="1"></canvas>
	<input type="hidden" />
	<div class="signature-pad_controls">
		<button type="button" class="signature-pad_button" data-pad="clear">Clear</button>
	</div>
</div>
<!-- End Signature Pad Component -->
```

You can give the canvas and its wrapper a custom ID. The clear button requires the data-pad="clear" attribute in order to work. The script supports multiple signature pad instances per page. The buttons can be moved but should stay inside of the wrapper class to ensure the functionality.

### JavaScript Integration

Include the signature-pad.js script in your HTML:

```html
<script src="https://cdn.jsdelivr.net/gh/vierless/attributes@latest/signature-pad/src/script.js"></script>
```

The script automatically initializes signature pads for all elements with the data-pad="wrapper" attribute.

### Accessing Signature Data

The signature data is stored in a hidden input field. The input field is automatically created with the name signaturePad\_[canvas_id]. The format of the stored data depends on the saveFormat option (PNG, JPEG, or SVG). Submitting a form with a signature pad inside would automatically make the data accessible in the payload.

## Customization

### Styling

Embed the starter styles:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/vierless/attributes@latest/signature-pad/src/styles.css" />
```

Alternatively, you can further customize the appearance of the signature pad by using these classes:

```css
.signature-pad_wrapper {
	/* your styles */
}
canvas.signature-pad {
	/* your styles */
}
.signature-pad_controls {
	/* your styles */
}
.signature-pad_button {
	/* your styles */
}
```

### JavaScript Options

The following options can be set using custom data attributes or via JavaScript:

| Option            | Data Attribute               | Description                                     | Default Value | Value Range               | Recommended                                            |
| ----------------- | ---------------------------- | ----------------------------------------------- | ------------- | ------------------------- | ------------------------------------------------------ |
| Line color        | `data-pad-color`             | Sets the line color                             | `'black'`     | Any valid CSS color       | Dark colors for visibility                             |
| Line thickness    | `data-pad-thickness`         | Sets the base line thickness                    | `3`           | > 0                       | 2-5 for most use cases                                 |
| Line join         | `data-pad-line-join`         | Defines how lines join together                 | `'round'`     | 'round', 'bevel', 'miter' | 'round' for smooth appearance                          |
| Line cap          | `data-pad-line-cap`          | Defines the style of the line ends              | `'round'`     | 'round', 'butt', 'square' | 'round' for smooth appearance                          |
| Pad scale         | `data-pad-scale`             | Sets the canvas scale for higher resolution     | `2`           | > 0                       | 2-4 for balance of quality and performance             |
| Min thickness     | `data-pad-min-thickness`     | Minimum line thickness                          | `1.5`         | > 0                       | 0.5-2 for most use cases                               |
| Max thickness     | `data-pad-max-thickness`     | Maximum line thickness                          | `6`           | > Min thickness           | 4-8 for most use cases                                 |
| Min speed         | `data-pad-min-speed`         | Minimum drawing speed for thickness calculation | `0.5`         | >= 0                      | 0.1-1 for responsive thickness changes                 |
| Max speed         | `data-pad-max-speed`         | Maximum drawing speed for thickness calculation | `10`          | > Min speed               | 5-15 for responsive thickness changes                  |
| Smoothness        | `data-pad-smoothness`        | Number of points used for smoothing             | `10`          | > 0                       | 8-12 for balance of smoothness and performance         |
| Save format       | `data-pad-save-format`       | Format for saving the signature                 | `'png'`       | 'png', 'jpg', 'svg'       | 'png' for lossless quality, 'svg' for scalability      |
| Speed sensitivity | `data-pad-speed-sensitivity` | Adjusts sensitivity of thickness to speed       | `1`           | > 0                       | 1-3 for natural feel, higher for more dramatic changes |

### Dynamically Updating Options

You can update options dynamically using JavaScript:

```javascript
const wrapper = document.querySelector('[data-pad="wrapper"]');
wrapper.setOptions({
	lineColor: 'blue',
	lineThickness: 5,
	saveFormat: 'svg',
	speedSensitivity: 2,
	// ... any other options you want to change
});
```

### Creating Custom Option Buttons

You can create custom buttons to change options on the fly. Here's an example of how to implement color change buttons:

```html
<div
	class="signature-pad_wrapper"
	data-pad="wrapper">
	<!-- ... existing signature pad HTML ... -->
	<div class="signature-pad_color-options">
		<button type="button" class="color-option" data-color="black">Black</button>
		<button type="button" class="color-option" data-color="blue">Blue</button>
		<button type="button" class="color-option" data-color="red">Red</button>
	</div>
</div>
```

```javascript
document.querySelectorAll('.color-option').forEach((button) => {
	button.addEventListener('click', function () {
		const color = this.dataset.color;
		const wrapper = this.closest('[data-pad="wrapper"]');
		wrapper.setOptions({ lineColor: color });
	});
});
```

This creates a set of buttons that, when clicked, will change the line color of the signature pad.

## Initializing Hidden Signature Pads

For signature pads that are not visible on page load (e.g., in modals or multi-step forms), you need to initialize them manually when they become visible. Here's how you can do this:

First, ensure that the signature pad wrapper has an ID:

```html
<div id="hidden-signature-pad" class="signature-pad_wrapper" data-pad="wrapper" style="display: none;">
	<!-- ... signature pad contents ... -->
</div>
```

Then, when the signature pad becomes visible (e.g., when opening a modal), call the initializeSignaturePad function:

```javascript
// When opening a modal or revealing a hidden step
document.getElementById('hidden-signature-pad').style.display = 'block';
initializeSignaturePad('hidden-signature-pad');
```

This will properly initialize the signature pad once it's visible. Note that for signature pads that are visible on page load, this manual initialization is not necessary as they are automatically initialized by the script.

## Browser Support

This module supports modern browsers that implement the HTML5 canvas element.

## Known Issues

- The module currently doesn't support undo functionality.
- On some mobile devices, the signature may appear slightly delayed due to touch event handling.

## Contributing

Contributions to improve the Signature Pad module are welcome. Please ensure that your code adheres to the existing style and includes appropriate tests.

## License

This module is part of the Attributes project and is licensed under the MIT License.
