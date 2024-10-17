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
	let points = [];

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
		speedSensitivity: parseFloat(canvas.dataset.padSpeedSensitivity) || 1,
	};

	const recentThicknesses = [];

	function setOptions(newOptions) {
		Object.assign(options, newOptions);

		Object.keys(options).forEach((key) => {
			canvas.dataset[`pad${key.charAt(0).toUpperCase() + key.slice(1)}`] = options[key];
		});

		initializePad();

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

		const adjustedSpeed = speed * options.speedSensitivity;

		const normalizedSpeed = Math.min(Math.max((adjustedSpeed - options.minSpeed) / (options.maxSpeed - options.minSpeed), 0), 1);
		const thicknessRange = options.maxThickness - options.minThickness;
		const targetThickness = options.maxThickness - normalizedSpeed * thicknessRange;

		recentThicknesses.push(targetThickness);
		if (recentThicknesses.length > options.smoothness) {
			recentThicknesses.shift();
		}

		const averageThickness = recentThicknesses.reduce((sum, thickness) => sum + thickness, 0) / recentThicknesses.length;

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
		console.log('Save format:', options.saveFormat);
		console.log('Number of points:', points.length);
		switch (options.saveFormat.toLowerCase()) {
			case 'jpg':
			case 'jpeg':
				// Create a new canvas
				const jpgCanvas = document.createElement('canvas');
				jpgCanvas.width = canvas.width;
				jpgCanvas.height = canvas.height;

				const jpgCtx = jpgCanvas.getContext('2d');
				jpgCtx.fillStyle = 'white';
				jpgCtx.fillRect(0, 0, jpgCanvas.width, jpgCanvas.height);
				jpgCtx.drawImage(canvas, 0, 0);

				return jpgCanvas.toDataURL('image/jpeg');
			case 'svg':
				return canvasToSVG(canvas, points);
			case 'png':
			default:
				return canvas.toDataURL('image/png');
		}
	}

	function canvasToSVG(canvas, points) {
		const svgNS = 'http://www.w3.org/2000/svg';
		const svg = document.createElementNS(svgNS, 'svg');
		svg.setAttribute('width', canvas.width);
		svg.setAttribute('height', canvas.height);
		svg.setAttribute('xmlns', svgNS);

		if (points.length < 2) return '';

		const path = document.createElementNS(svgNS, 'path');
		let pathData = '';

		// Helper function to calculate control points
		function getControlPoints(p0, p1, p2, t) {
			const d01 = Math.sqrt(Math.pow(p1.x - p0.x, 2) + Math.pow(p1.y - p0.y, 2));
			const d12 = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
			const fa = (t * d01) / (d01 + d12);
			const fb = (t * d12) / (d01 + d12);
			return {
				x1: p1.x - fa * (p2.x - p0.x),
				y1: p1.y - fa * (p2.y - p0.y),
				x2: p1.x + fb * (p2.x - p0.x),
				y2: p1.y + fb * (p2.y - p0.y),
			};
		}

		// Draw the outline
		for (let i = 0; i < points.length; i++) {
			const p = points[i];
			const halfThickness = p.thickness / 2;

			if (i === 0) {
				pathData += `M ${p.x - halfThickness},${p.y} `;
			} else if (i < points.length - 1) {
				const prev = points[i - 1];
				const next = points[i + 1];
				const cp = getControlPoints(prev, p, next, 0.5);

				pathData += `Q ${cp.x1},${cp.y1 - halfThickness} ${p.x},${p.y - halfThickness} `;
			} else {
				pathData += `L ${p.x},${p.y - halfThickness} `;
			}
		}

		// Complete the outline (bottom edge)
		for (let i = points.length - 1; i >= 0; i--) {
			const p = points[i];
			const halfThickness = p.thickness / 2;

			if (i === points.length - 1) {
				pathData += `L ${p.x},${p.y + halfThickness} `;
			} else if (i > 0) {
				const prev = points[i + 1];
				const next = points[i - 1];
				const cp = getControlPoints(prev, p, next, 0.5);

				pathData += `Q ${cp.x1},${cp.y1 + halfThickness} ${p.x},${p.y + halfThickness} `;
			} else {
				pathData += `L ${p.x},${p.y + halfThickness} Z`;
			}
		}

		path.setAttribute('d', pathData);
		path.setAttribute('fill', options.lineColor);
		path.setAttribute('stroke', 'none');

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
