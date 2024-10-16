// Function to create a signature pad instance
function createSignaturePad(wrapper) {
	const canvas = wrapper.querySelector('canvas');
	let hiddenInput = wrapper.querySelector('input[type="hidden"]');
	const clearButton = wrapper.querySelector('[data-pad="clear"]');
	const ctx = canvas.getContext('2d');
	let writingMode = false;
	let lastX, lastY;
	let hasSignature = false;
	let initialWidth, initialHeight; // Store initial dimensions

	// Get customizable attributes from canvas
	const lineColor = canvas.dataset.padColor || 'black';
	const lineThickness = parseInt(canvas.dataset.padThickness) || 3;
	const lineJoin = canvas.dataset.padLineJoin || 'round';
	const lineCap = canvas.dataset.padLineCap || 'round';
	const padScale = parseFloat(canvas.dataset.padScale) || 2;
	const minThickness = parseFloat(canvas.dataset.padMinThickness) || lineThickness / 2;
	const maxThickness = parseFloat(canvas.dataset.padMaxThickness) || lineThickness * 2;
	const speedSensitivity = parseFloat(canvas.dataset.padSpeedSensitivity) || 1;
	const smoothFactor = parseFloat(canvas.dataset.padSmoothFactor) || 0.3;
	const minSpeed = parseFloat(canvas.dataset.padMinSpeed) || 0.5;
	const maxSpeed = parseFloat(canvas.dataset.padMaxSpeed) || 10;
	let lastTimestamp = 0;
	let lastThickness = maxThickness;

	let points = [];

	function resizeCanvas() {
		const tempCanvas = document.createElement('canvas');
		const tempCtx = tempCanvas.getContext('2d');
		tempCanvas.width = canvas.width;
		tempCanvas.height = canvas.height;
		tempCtx.drawImage(canvas, 0, 0);

		const rect = canvas.getBoundingClientRect();

		if (!initialWidth || !initialHeight) {
			// First-time setup: apply padScale
			canvas.width = rect.width * padScale;
			canvas.height = rect.height * padScale;
			initialWidth = rect.width; // Store the unscaled width
			initialHeight = rect.height; // Store the unscaled height
		} else {
			// Subsequent resizes: use initial dimensions without re-applying padScale
			canvas.width = initialWidth * padScale;
			canvas.height = initialHeight * padScale;
		}

		ctx.lineWidth = lineThickness * padScale;
		ctx.lineJoin = lineJoin;
		ctx.lineCap = lineCap;
		ctx.strokeStyle = lineColor;
		ctx.fillStyle = lineColor;
		ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, canvas.width, canvas.height);
	}

	function clearPad() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		hiddenInput.value = '';
		hasSignature = false;
		points = [];
		lastThickness = maxThickness;
	}

	function getTargetPosition(event) {
		const rect = canvas.getBoundingClientRect();
		const scaleX = canvas.width / rect.width;
		const scaleY = canvas.height / rect.height;
		return [(event.clientX - rect.left) * scaleX, (event.clientY - rect.top) * scaleY];
	}

	function getLineThickness(x, y, timestamp) {
		if (lastTimestamp === 0) {
			lastTimestamp = timestamp;
			return maxThickness;
		}

		const dx = x - lastX;
		const dy = y - lastY;
		const dt = timestamp - lastTimestamp;
		const speed = Math.sqrt(dx * dx + dy * dy) / dt;

		const normalizedSpeed = Math.min(Math.max((speed - minSpeed) / (maxSpeed - minSpeed), 0), 1);
		const thicknessRange = maxThickness - minThickness;
		const thicknessReduction = Math.pow(normalizedSpeed, speedSensitivity) * thicknessRange;
		const targetThickness = maxThickness - thicknessReduction;
		const newThickness = lastThickness + (targetThickness - lastThickness) * smoothFactor;

		lastThickness = newThickness;
		lastTimestamp = timestamp;
		return newThickness;
	}

	function handlePointerMove(event) {
		if (!writingMode) return;
		event.preventDefault();

		const [positionX, positionY] = getTargetPosition(event);
		const thickness = getLineThickness(positionX, positionY, event.timeStamp);

		points.push({ x: positionX, y: positionY, thickness: thickness });

		if (points.length > 2) {
			const xc = (points[points.length - 1].x + points[points.length - 2].x) / 2;
			const yc = (points[points.length - 1].y + points[points.length - 2].y) / 2;

			ctx.beginPath();
			ctx.moveTo(lastX, lastY);
			ctx.lineWidth = thickness;
			ctx.quadraticCurveTo(points[points.length - 2].x, points[points.length - 2].y, xc, yc);
			ctx.stroke();

			[lastX, lastY] = [xc, yc];
		} else {
			ctx.beginPath();
			ctx.lineWidth = thickness;
			ctx.moveTo(lastX, lastY);
			ctx.lineTo(positionX, positionY);
			ctx.stroke();
			[lastX, lastY] = [positionX, positionY];
		}

		hasSignature = true;
	}

	function handlePointerUp() {
		writingMode = false;
		if (hasSignature) {
			const imageURL = canvas.toDataURL();
			if (!hiddenInput) {
				hiddenInput = document.createElement('input');
				hiddenInput.type = 'hidden';
				wrapper.appendChild(hiddenInput);
			}
			hiddenInput.name = 'signaturePad_' + canvas.id;
			hiddenInput.value = imageURL;
		}
		points = [];
	}

	function handlePointerDown(event) {
		writingMode = true;
		points = [];
		[lastX, lastY] = getTargetPosition(event);
		lastTimestamp = event.timeStamp;
		lastThickness = maxThickness;

		// Draw a dot for single taps/clicks
		ctx.beginPath();
		ctx.arc(lastX, lastY, maxThickness / 2, 0, Math.PI * 2);
		ctx.fill();

		hasSignature = true;
	}

	function preventDefault(event) {
		event.preventDefault();
	}

	function initializePad() {
		if (isElementVisible(wrapper)) {
			resizeCanvas();
			attachEventListeners();
		}
	}

	function attachEventListeners() {
		clearButton.addEventListener('click', (event) => {
			event.preventDefault();
			clearPad();
		});
		canvas.addEventListener('pointerdown', handlePointerDown, { passive: false });
		canvas.addEventListener('pointerup', handlePointerUp, { passive: true });
		canvas.addEventListener('pointermove', handlePointerMove, { passive: false });
		canvas.addEventListener('pointercancel', handlePointerUp, { passive: true });
		canvas.addEventListener('pointerleave', handlePointerUp, { passive: true });
		canvas.addEventListener('touchstart', preventDefault, { passive: false });
		canvas.addEventListener('touchmove', preventDefault, { passive: false });
		canvas.addEventListener('touchend', preventDefault, { passive: false });
		canvas.addEventListener('touchcancel', preventDefault, { passive: false });
	}

	function isElementVisible(element) {
		return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
	}

	initializePad();
	wrapper.initializeSignaturePad = initializePad;

	window.addEventListener('resize', throttle(initializePad, 250));

	return initializePad;
}

// Throttle function
function throttle(func, limit) {
	let inThrottle;
	return function () {
		const args = arguments;
		const context = this;
		if (!inThrottle) {
			func.apply(context, args);
			inThrottle = true;
			setTimeout(() => (inThrottle = false), limit);
		}
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

// Initialize a specific signature pad
function initializeSignaturePad(wrapperId) {
	const wrapper = document.getElementById(wrapperId);
	if (wrapper && wrapper.initializeSignaturePad) {
		wrapper.initializeSignaturePad();
	}
}

window.initializeAllSignaturePads = initializeAllSignaturePads;
window.initializeSignaturePad = initializeSignaturePad;
