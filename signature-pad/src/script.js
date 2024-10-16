// Function to create a signature pad instance
function createSignaturePad(wrapper) {
	const canvas = wrapper.querySelector('canvas');
	let hiddenInput = wrapper.querySelector('input[type="hidden"]');
	const clearButton = wrapper.querySelector('[data-pad="clear"]');
	const ctx = canvas.getContext('2d');
	let writingMode = false;
	let lastX, lastY;
	let hasSignature = false; // New variable to track if actual drawing has occurred
	let lastWidth = 0;
	let lastHeight = 0;

	// Get customizable attributes from canvas
	const lineColor = canvas.dataset.padColor || 'black';
	const lineThickness = parseInt(canvas.dataset.padThickness) || 3;
	const lineJoin = canvas.dataset.padLineJoin || 'round';
	const lineCap = canvas.dataset.padLineCap || 'round';

	function resizeCanvas() {
		const rect = canvas.getBoundingClientRect();
		const newWidth = rect.width;
		const newHeight = rect.height;

		// Only resize if the dimensions have changed significantly
		if (Math.abs(newWidth - lastWidth) > 1 || Math.abs(newHeight - lastHeight) > 1) {
			const tempCanvas = document.createElement('canvas');
			const tempCtx = tempCanvas.getContext('2d');
			tempCanvas.width = canvas.width;
			tempCanvas.height = canvas.height;
			tempCtx.drawImage(canvas, 0, 0);

			canvas.width = newWidth;
			canvas.height = newHeight;

			ctx.lineWidth = lineThickness;
			ctx.lineJoin = lineJoin;
			ctx.lineCap = lineCap;
			ctx.strokeStyle = lineColor;
			ctx.fillStyle = lineColor;

			// Maintain aspect ratio when redrawing
			const scale = Math.min(newWidth / lastWidth, newHeight / lastHeight);
			const offsetX = (newWidth - lastWidth * scale) / 2;
			const offsetY = (newHeight - lastHeight * scale) / 2;

			ctx.drawImage(tempCanvas, 0, 0, lastWidth, lastHeight, offsetX, offsetY, lastWidth * scale, lastHeight * scale);

			lastWidth = newWidth;
			lastHeight = newHeight;
		}
	}

	function clearPad() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		hiddenInput.value = '';
		hasSignature = false; // Reset hasSignature when clearing
	}

	function getTargetPosition(event) {
		const rect = canvas.getBoundingClientRect();
		const scaleX = canvas.width / rect.width;
		const scaleY = canvas.height / rect.height;
		return [(event.clientX - rect.left) * scaleX, (event.clientY - rect.top) * scaleY];
	}

	function handlePointerMove(event) {
		if (!writingMode) return;
		const [positionX, positionY] = getTargetPosition(event);
		ctx.beginPath();
		ctx.moveTo(lastX, lastY);
		ctx.lineTo(positionX, positionY);
		ctx.stroke();
		[lastX, lastY] = [positionX, positionY];
		hasSignature = true; // Set hasSignature to true when drawing
	}

	function handlePointerUp() {
		writingMode = false;
		if (hasSignature) {
			// Only update hidden input if there's a signature
			const imageURL = canvas.toDataURL();
			if (!hiddenInput) {
				hiddenInput = document.createElement('input');
				hiddenInput.type = 'hidden';
				wrapper.appendChild(hiddenInput);
			}
			hiddenInput.name = 'signaturePad_' + canvas.id;
			hiddenInput.value = imageURL;
		}
	}

	function handlePointerDown(event) {
		writingMode = true;
		[lastX, lastY] = getTargetPosition(event);

		// Draw a dot for single taps/clicks
		ctx.beginPath();
		ctx.arc(lastX, lastY, lineThickness / 2, 0, Math.PI * 2);
		ctx.fill();
		hasSignature = true; // Set hasSignature to true when drawing a dot
	}

	function preventDefault(event) {
		event.preventDefault();
	}

	function initializePad() {
		if (isElementVisible(wrapper)) {
			const rect = canvas.getBoundingClientRect();
			lastWidth = rect.width;
			lastHeight = rect.height;
			resizeCanvas();
			attachEventListeners();
		}
	}

	function attachEventListeners() {
		clearButton.addEventListener('click', (event) => {
			event.preventDefault();
			clearPad();
		});
		canvas.addEventListener('pointerdown', handlePointerDown, { passive: true });
		canvas.addEventListener('pointerup', handlePointerUp, { passive: true });
		canvas.addEventListener('pointermove', handlePointerMove, { passive: true });
		canvas.addEventListener('pointercancel', handlePointerUp, { passive: true });
		canvas.addEventListener('pointerleave', handlePointerUp, { passive: true });
		canvas.addEventListener('touchstart', preventDefault, { passive: false });
		canvas.addEventListener('touchmove', preventDefault, { passive: false });
		canvas.addEventListener('touchend', preventDefault, { passive: false });
		canvas.addEventListener('touchcancel', preventDefault, { passive: false });
	}

	// Check if an element is visible
	function isElementVisible(element) {
		return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
	}

	// Initial setup
	initializePad();

	// Expose initializePad function
	wrapper.initializeSignaturePad = initializePad;

	// Event listener for window resize with debounce
	window.addEventListener(
		'resize',
		debounce(() => {
			if (isElementVisible(wrapper)) {
				resizeCanvas();
			}
		}, 250)
	);

	// Return the initialize function for external use
	return initializePad;
}

// Debounce function
function debounce(func, wait) {
	let timeout;
	return function executedFunction(...args) {
		const later = () => {
			clearTimeout(timeout);
			func(...args);
		};
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
	};
}

function initializeAllSignaturePads() {
	const signaturePads = document.querySelectorAll('[data-pad="wrapper"]');
	signaturePads.forEach(createSignaturePad);
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initializeAllSignaturePads);
} else {
	window.addEventListener('load', initializeAllSignaturePads);
}

// initialize a specific signature pad
function initializeSignaturePad(wrapperId) {
	const wrapper = document.getElementById(wrapperId);
	if (wrapper && wrapper.initializeSignaturePad) {
		wrapper.initializeSignaturePad();
	}
}

window.initializeAllSignaturePads = initializeAllSignaturePads;
window.initializeSignaturePad = initializeSignaturePad;
