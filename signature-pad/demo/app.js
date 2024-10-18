document.addEventListener('DOMContentLoaded', function () {
	const wrapper = document.querySelector('[data-pad="wrapper"]');
	const saveButton = document.getElementById('saveButton');
	const signatureImage = document.getElementById('signatureImage');

	// Function to update options
	function updateOptions() {
		const options = {
			lineColor: document.getElementById('lineColor').value,
			lineJoin: document.getElementById('lineJoin').value,
			lineCap: document.getElementById('lineCap').value,
			padScale: parseFloat(document.getElementById('padScale').value),
			minThickness: parseFloat(document.getElementById('minThickness').value),
			maxThickness: parseFloat(document.getElementById('maxThickness').value),
			minSpeed: parseFloat(document.getElementById('minSpeed').value),
			maxSpeed: parseFloat(document.getElementById('maxSpeed').value),
			smoothness: parseInt(document.getElementById('smoothness').value),
			speedSensitivity: parseFloat(document.getElementById('speedSensitivity').value),
			saveFormat: document.getElementById('saveFormat').value,
		};
		wrapper.setOptions(options);
	}

	// Add event listeners to all inputs
	document.querySelectorAll('.options-grid input, .options-grid select').forEach((input) => {
		input.addEventListener('change', updateOptions);
	});

	saveButton.addEventListener('click', function () {
		const signatureData = document.getElementById('signatureInput').value;
		if (signatureData) {
			signatureImage.src = signatureData;
			signatureImage.style.display = 'block';
		} else {
			alert('Please sign before saving.');
		}
	});

	// Initial update
	updateOptions();
});
