function createSignaturePad(wrapper) {
	const canvas = wrapper.querySelector('canvas');
	let hiddenInput = wrapper.querySelector('input[type="hidden"]');
	const clearButton = wrapper.querySelector('[data-pad="clear"]');
	const ctx = canvas.getContext('2d');
	let writingMode = false;
	let lastX, lastY;
	let hasSignature = false;
	let initialWidth, initialHeight;
	let lastTimestamp = 0;
	let activePointers = 0;
	let initialPointerId = null;
	let lastThickness;
	let points = [];

	// Options object to store all configurable settings
	let options = {
		lineColor: canvas.dataset.padColor || 'black',
		lineThickness: parseInt(canvas.dataset.padThickness) || 3,
		lineJoin: canvas.dataset.padLineJoin || 'round',
		lineCap: canvas.dataset.padLineCap || 'round',
		padScale: parseFloat(canvas.dataset.padScale) || 2,
		minThickness: parseFloat(canvas.dataset.padMinThickness) || 1.5,
		maxThickness: parseFloat(canvas.dataset.padMaxThickness) || 6,
		minSpeed: parseFloat(canvas.dataset.padMinSpeed) || 0.5,
		maxSpeed: parseFloat(canvas.dataset.padMaxSpeed) || 10,
		smoothness: parseInt(canvas.dataset.padSmoothness) || 10,
		saveFormat: canvas.dataset.padSaveFormat || 'png',
	};

	const recentThicknesses = [];

	function setOptions(newOptions) {
		Object.assign(options, newOptions);

		// Update canvas attributes
		Object.keys(options).forEach((key) => {
			canvas.dataset[`pad${key.charAt(0).toUpperCase() + key.slice(1)}`] = options[key];
		});

		// Reinitialize the pad with new settings
		initializePad();

		// If there's an existing signature, redraw it with new settings
		if (hasSignature) {
			redrawSignature();
		}
	}

	function redrawSignature() {
		const tempCanvas = document.createElement('canvas');
		const tempCtx = tempCanvas.getContext('2d');
		tempCanvas.width = canvas.width;
		tempCanvas.height = canvas.height;
		tempCtx.drawImage(canvas, 0, 0);

		clearPad();

		ctx.drawImage(tempCanvas, 0, 0);
	}

	function resizeCanvas() {
		const tempCanvas = document.createElement('canvas');
		const tempCtx = tempCanvas.getContext('2d');
		tempCanvas.width = canvas.width;
		tempCanvas.height = canvas.height;
		tempCtx.drawImage(canvas, 0, 0);

		const rect = canvas.getBoundingClientRect();

		if (!initialWidth || !initialHeight) {
			canvas.width = rect.width * options.padScale;
			canvas.height = rect.height * options.padScale;
			initialWidth = rect.width;
			initialHeight = rect.height;
		} else {
			canvas.width = initialWidth * options.padScale;
			canvas.height = initialHeight * options.padScale;
		}

		ctx.lineWidth = options.lineThickness * options.padScale;
		ctx.lineJoin = options.lineJoin;
		ctx.lineCap = options.lineCap;
		ctx.strokeStyle = options.lineColor;
		ctx.fillStyle = options.lineColor;
		ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, canvas.width, canvas.height);
	}

	function clearPad() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		hiddenInput.value = '';
		hasSignature = false;
		points = [];
		lastThickness = options.maxThickness;
		recentThicknesses.length = 0;
		activePointers = 0;
		initialPointerId = null;
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
			return options.maxThickness;
		}

		const dx = x - lastX;
		const dy = y - lastY;
		const dt = timestamp - lastTimestamp;
		const speed = Math.sqrt(dx * dx + dy * dy) / dt;

		const normalizedSpeed = Math.min(Math.max((speed - options.minSpeed) / (options.maxSpeed - options.minSpeed), 0), 1);
		const thicknessRange = options.maxThickness - options.minThickness;
		const targetThickness = options.maxThickness - normalizedSpeed * thicknessRange;

		recentThicknesses.push(targetThickness);
		if (recentThicknesses.length > options.smoothness) {
			recentThicknesses.shift();
		}

		const averageThickness = recentThicknesses.reduce((sum, thickness) => sum + thickness, 0) / recentThicknesses.length;

		lastThickness = averageThickness;
		lastTimestamp = timestamp;
		return averageThickness;
	}

	function handlePointerMove(event) {
		if (!writingMode || event.pointerId !== initialPointerId) return;
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

	function handlePointerUp(event) {
		activePointers = Math.max(0, activePointers - 1);
		if (event.pointerId === initialPointerId) {
			writingMode = false;
			canvas.classList.remove('signing');
			if (hasSignature) {
				const imageURL = getImageDataURL();
				if (!hiddenInput) {
					hiddenInput = document.createElement('input');
					hiddenInput.type = 'hidden';
					wrapper.appendChild(hiddenInput);
				}
				hiddenInput.name = 'signaturePad_' + canvas.id;
				hiddenInput.value = imageURL;
			}
			points = [];
			initialPointerId = null;
		}
	}

	function handlePointerDown(event) {
		activePointers++;
		if (activePointers === 1) {
			initialPointerId = event.pointerId;
			writingMode = true;
			points = [];
			recentThicknesses.length = 0;
			[lastX, lastY] = getTargetPosition(event);
			lastTimestamp = event.timeStamp;
			lastThickness = options.maxThickness;

			ctx.beginPath();
			ctx.arc(lastX, lastY, options.maxThickness / 2, 0, Math.PI * 2);
			ctx.fill();

			hasSignature = true;
			canvas.classList.add('signing');
		}
	}

	function preventDefault(event) {
		event.preventDefault();
	}

	function getImageDataURL() {
		switch (options.saveFormat.toLowerCase()) {
			case 'jpg':
			case 'jpeg':
				return canvas.toDataURL('image/jpeg');
			case 'svg':
				return canvasToSVG(canvas);
			case 'png':
			default:
				return canvas.toDataURL('image/png');
		}
	}

	function canvasToSVG(canvas) {
		const svgNS = 'http://www.w3.org/2000/svg';
		const svg = document.createElementNS(svgNS, 'svg');
		svg.setAttribute('width', canvas.width);
		svg.setAttribute('height', canvas.height);

		const path = document.createElementNS(svgNS, 'path');
		path.setAttribute('fill', 'none');
		path.setAttribute('stroke', options.lineColor);
		path.setAttribute('stroke-width', options.lineThickness);
		path.setAttribute('stroke-linecap', options.lineCap);
		path.setAttribute('stroke-linejoin', options.lineJoin);

		let d = '';
		points.forEach((point, index) => {
			if (index === 0) {
				d += `M${point.x},${point.y}`;
			} else {
				d += `L${point.x},${point.y}`;
			}
		});

		path.setAttribute('d', d);
		svg.appendChild(path);

		return 'data:image/svg+xml;base64,' + btoa(new XMLSerializer().serializeToString(svg));
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
		canvas.addEventListener('pointercancel', handlePointerUp, { passive: true });
		canvas.addEventListener('pointermove', handlePointerMove, { passive: false });
		canvas.addEventListener(
			'pointerleave',
			(event) => {
				if (event.pointerId === initialPointerId) {
					handlePointerUp(event);
				}
			},
			{ passive: true }
		);

		canvas.addEventListener('touchstart', preventDefault, { passive: false });
		canvas.addEventListener('touchmove', preventDefault, { passive: false });
		canvas.addEventListener('touchend', preventDefault, { passive: false });
		canvas.addEventListener('touchcancel', preventDefault, { passive: false });
	}

	function isElementVisible(element) {
		return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
	}

	wrapper.setOptions = setOptions;
	wrapper.initializeSignaturePad = initializePad;

	initializePad();

	window.addEventListener('resize', throttle(initializePad, 250));

	return initializePad;
}

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

function initializeSignaturePad(wrapperId) {
	const wrapper = document.getElementById(wrapperId);
	if (wrapper && wrapper.initializeSignaturePad) {
		wrapper.initializeSignaturePad();
	}
}

window.initializeAllSignaturePads = initializeAllSignaturePads;
window.initializeSignaturePad = initializeSignaturePad;
