# Signature Pad Attribute

## Overview

The Signature Pad module is part of the VIERLESS Attributes project. It provides an easy-to-implement signature drawing
functionality for web forms, utilizing HTML5 canvas and custom data attributes.

## Features

- Responsive canvas that adjusts to container size
- Clear button functionality
- Touch and mouse support
- Automatic conversion of signature to hidden input for form submission
- Throttled resize event handling for performance

## Usage

### HTML Structure

The script works by searching for all elements with the data-pad="wrapper" attribute followed by this HTML structure:

```html
<!-- Signature Pad Component -->
<div class="signature-pad_wrapper" data-pad="wrapper">
	<canvas
        class="signature-pad"
        id="mySignature"
		data-pad-color="#fff"
		data-pad-thickness="3"
		data-pad-line-join="round"
		data-pad-line-cap="round"
	></canvas>
	<input type="hidden" />
	<div class="signature-pad_controls">
		<button type="button" class="signature-pad_button" data-pad="clear">Clear</button>
	</div>
</div>
<!-- End Signature Pad Component -->
```

You can give the canvas a custom ID. The clear button requires the data-pad="clear" attribute in order to work. The
script supports multiple signature pad instances per page. The buttons can be moved but should stay inside of the
wrapper class to ensure the functionality.

### JavaScript Integration

Include the signature-pad.js script in your HTML:

```html
<script src="https://cdn.jsdelivr.net/gh/vierless/attributes@latest/signature-pad/src/script.js"></script>
```

The script automatically initializes signature pads for all elements with the data-pad="wrapper" attribute.

### Accessing Signature Data

The signature data is stored as a base64 encoded PNG in a hidden input field. The input field is automatically created
with the name signaturePad\_[canvas_id].

## Customization

### Styling

Embed the starter styles:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/vierless/attributes@latest/signature-pad/src/styles.css" />
```

Alternatively you can further customize the appearance of the signature pad by using these classes:

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

The following options are set in the JavaScript and can be modified using custom data attributes:

| Option     | Data Attribute       | Description                        | Example Value     |
| ---------- | -------------------- | ---------------------------------- | ----------------- |
| Line color | `data-pad-color`     | Sets the line color                | `#000000` (black) |
| Line width | `data-pad-thickness` | Sets the line width                | `3`               |
| Line join  | `data-pad-line-join` | Defines how lines join together    | `round`           |
| Line cap   | `data-pad-line-cap`  | Defines the style of the line ends | `round`           |

## Browser Support

This module supports modern browsers that implement the HTML5 canvas element.

## Known Issues

- The module currently doesn't support undo functionality.
- On some mobile devices, the signature may appear slightly delayed due to touch event handling.

## Contributing

Contributions to improve the Signature Pad module are welcome. Please ensure that your code adheres to the existing
style and includes appropriate tests.

## License

This module is part of the Attributes project and is licensed under the MIT License.
