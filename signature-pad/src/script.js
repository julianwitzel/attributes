// Function to create a signature pad instance
function createSignaturePad(wrapper) {
	const canvas = wrapper.querySelector('canvas');
	let hiddenInput = wrapper.querySelector('input[type="hidden"]');
	const clearButton = wrapper.querySelector('[data-pad="clear"]');
	const ctx = canvas.getContext('2d');
	let writingMode = false;
	let lastX, lastY;

	// Get customizable attributes from canvas
	const lineColor = canvas.dataset.padColor || 'black';
	const lineThickness = parseInt(canvas.dataset.padThickness) || 3;
	const lineJoin = canvas.dataset.padLineJoin || 'round';
	const lineCap = canvas.dataset.padLineCap || 'round';

	function resizeCanvas() {
		const tempCanvas = document.createElement('canvas');
		const tempCtx = tempCanvas.getContext('2d');
		tempCanvas.width = canvas.width;
		tempCanvas.height = canvas.height;
		tempCtx.drawImage(canvas, 0, 0);
		const rect = canvas.getBoundingClientRect();
		canvas.width = rect.width;
		canvas.height = rect.height;
		ctx.lineWidth = lineThickness;
		ctx.lineJoin = lineJoin;
		ctx.lineCap = lineCap;
		ctx.strokeStyle = lineColor;
		ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, canvas.width, canvas.height);
	}

	function clearPad() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		hiddenInput.value = '';
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
	}

	function handlePointerUp() {
		writingMode = false;
		const imageURL = canvas.toDataURL();
		if (!hiddenInput) {
			hiddenInput = document.createElement('input');
			hiddenInput.type = 'hidden';
			wrapper.appendChild(hiddenInput);
		}
		hiddenInput.name = 'signaturePad_' + canvas.id;
		hiddenInput.value = imageURL;
	}

	function handlePointerDown(event) {
		writingMode = true;
		[lastX, lastY] = getTargetPosition(event);
	}

	function preventDefault(event) {
		event.preventDefault();
	}

	// Initial setup
	resizeCanvas();

	// Event listeners
	window.addEventListener('resize', throttle(resizeCanvas, 250));
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

// Throttle function (unchanged)
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

// Initialize all signature pads
document.addEventListener('DOMContentLoaded', () => {
	const signaturePads = document.querySelectorAll('[data-pad="wrapper"]');
	signaturePads.forEach(createSignaturePad);
});
