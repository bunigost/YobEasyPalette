// Get HTML elements
const imageUploader = document.getElementById('browseButton');
const canvas = document.getElementById('uploadCanvas');
const sliderContainer = document.getElementById('sliderContainer');
const scaleSlider = document.getElementById('scaleSlider');
const scaleValue = document.getElementById('scaleValue');
const selectColors = document.getElementById('selectColors');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const paletteDiv = document.getElementById('paletteContainer');
const outputSection = document.getElementById('outputSection');
const output = document.getElementById('output-text');
const copyToClipboardBtn = document.getElementById('ClickA');
const clearPaletteBtn = document.getElementById('ClickB');
const canvasInstructions = document.getElementById('select-colors');
const decreaseScaleBtn = document.getElementById('decreaseScale');
const increaseScaleBtn = document.getElementById('increaseScale');
const layers = [
    document.getElementById('layer1'),
    document.getElementById('layer2'),
    document.getElementById('layer3'),
    document.getElementById('layer4'),
];

// Initialise variables
let selectedColors = [];
let filename = "palette";
let scaleFactor = 100; // Default scale factor
let img = new Image();

// Function to convert RGB values to Game Boy format
const rgbToGameBoy = (r, g, b) => [Math.floor(r / 8), Math.floor(g / 8), Math.floor(b / 8)];

// Event listener for image upload
imageUploader.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        selectedColors = [];
        updatePalette();
        filename = file.name.replace(/\.[^/.]+$/, "");

        img = new Image();
        img.onload = () => {
            // Check if the image width exceeds the maximum width (520px)
            if (img.width > 520) {
                showModal('Image width exceeds the maximum allowed size of 520px.');
                return; // Prevent further processing of the image
            }
            canvas.style.display = 'block'; // Show the uploaded image canvas 
            sliderContainer.style.display = 'block'; // Show slider
            drawImage(); // Draw the image after it has loaded
            selectColors.style.display = 'inline-block'; // Show "3. Select four colors"

        };
        img.src = URL.createObjectURL(file);
    }
});

// Function to draw the uploaded image on the canvas
function drawImage() {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');

    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    tempCtx.drawImage(img, 0, 0);

    canvas.width = img.width * (scaleFactor / 100);
    canvas.height = img.height * (scaleFactor / 100);

    ctx.imageSmoothingEnabled = false; // Disable image smoothing
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(tempCanvas, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height);

}

// Function to update the color palette
function updatePalette() {
    paletteDiv.innerHTML = '';
    const gbPalette = selectedColors.map(([r, g, b]) => rgbToGameBoy(r, g, b));

    gbPalette.forEach(([r, g, b], index) => {
        const colorBox = document.createElement('div');
        colorBox.className = 'color-box';
        colorBox.style.backgroundColor = `rgb(${r * 8}, ${g * 8}, ${b * 8})`;
        colorBox.style.cursor = 'pointer';

        // Remove color from the palette
        colorBox.addEventListener('click', () => {
            selectedColors.splice(index, 1); // Remove color from the array
            updatePalette(); // Update the palette display
        });

        paletteDiv.appendChild(colorBox);
    });

    output.textContent = `${filename}=${gbPalette.flat().join(',')}`;
}




// Slider input events
scaleSlider.addEventListener('input', () => {
    scaleFactor = parseInt(scaleSlider.value);
    
    // Calculate the new width based on the scale factor
    const newWidth = img.width * (scaleFactor / 100);

    // Prevent scaling if it exceeds the max width (520px)
    if (newWidth <= 520) {
        scaleValue.textContent = `${scaleFactor}%`;
        drawImage();
    } else {
        // If it exceeds 520px, - 25 to scale value
        scaleSlider.value = scaleFactor - 25;  // - 25 to scale value
        showModal('Maximum width reached (520px).');
    }
});


// Color selection on canvas click
canvas.addEventListener('click', (event) => {
    if (selectedColors.length === 0) {
        paletteDiv.style.display = 'flex'; // Show the palette container
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = img.width / (canvas.width / (scaleFactor / 100));
    const scaleY = img.height / (canvas.height / (scaleFactor / 100));

    const x = Math.floor((event.clientX - rect.left) * scaleX);
    const y = Math.floor((event.clientY - rect.top) * scaleY);

    const pixel = ctx.getImageData(x, y, 1, 1).data; 
    const [r, g, b, a] = pixel;

    if (selectedColors.length < 4) {
        selectedColors.push([r, g, b]);

        document.getElementById('outputSection').style.display = "block"; // Show output section

        updatePalette();
    } else {
        showModal('Please select only 4 colors');
    }
});

// Event listeners for arrow buttons
decreaseScaleBtn.addEventListener('click', () => {
    if (scaleFactor > 25) {
        scaleFactor -= 25;
        scaleSlider.value = scaleFactor;
        scaleValue.textContent = `${scaleFactor}%`;
        drawImage();
    } else {
        showModal('Minimum scale reached.');
    }
});

increaseScaleBtn.addEventListener('click', () => {
    const newWidth = img.width * (scaleFactor + 25) / 100;
    
    // Prevent scaling if it exceeds the max width (520px)
    if (newWidth <= 520) {
        scaleFactor += 25;
        scaleSlider.value = scaleFactor;
        scaleValue.textContent = `${scaleFactor}%`;
        drawImage();
    } else {
        showModal('Maximum width reached (520px).');
    }
});


// Clear the palette
clearPaletteBtn.addEventListener('click', () => {
    selectedColors = [];
    updatePalette();

});

// Copy to clipboard functionality
copyToClipboardBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(output.textContent).then(() => {
        showModal("Palette copied to clipboard. Paste it below the palette section in _nds/gameyobds.ini");
    }).catch(err => {
        console.error('Error copying text: ', err);
    });
});

// Modal functions for alerts
function showModal(message) {
    const modal = document.getElementById('modal');
    const modalMessage = document.getElementById('modalMessage');
    modalMessage.textContent = message;
    modal.style.display = "block"; // Show the modal
}

document.getElementById('modalClose').onclick = function() {
    document.getElementById('modal').style.display = "none"; // Close the modal
};

document.getElementById('modalOkBtn').onclick = function() {
    document.getElementById('modal').style.display = "none"; // Close the modal on button click
};

// Close the modal when the user clicks outside of the modal-content
window.onclick = function(event) {
    const modal = document.getElementById('modal');
    if (event.target == modal) {
        modal.style.display = "none";
    }
};

// Automatic loading of images for the first preview
document.addEventListener("DOMContentLoaded", function() {
    const previewImages = document.querySelectorAll('.preview-folder');

    if (previewImages.length > 0) {
        loadImagesForPreview(previewImages[0].getAttribute('data-folder')); 
    }

    previewImages.forEach(image => {
        image.addEventListener('click', () => {
            const selectedPreview = image.getAttribute('data-folder');
            loadImagesForPreview(selectedPreview, () => {
                if (selectedColors.length === 4) {
                    generatePreview();
                }
            });
        });
    });
});

function loadLayerImage(layerId, imageUrl, callback) {
    const layer = document.getElementById(layerId);
    const layerImg = new Image();

    layerImg.onload = () => {
        layer.width = layerImg.width;
        layer.height = layerImg.height;
        const layerCtx = layer.getContext('2d');
        layerCtx.drawImage(layerImg, 0, 0);

        if (typeof callback === 'function') callback();
    };

    layerImg.onerror = () => {
        console.error(`Failed to load layer: ${layerId} from ${imageUrl}`);
    };

    layerImg.src = imageUrl;
}

function loadImagesForPreview(selectedPreview, callback) {
    const images = ['layer1.png', 'layer2.png', 'layer3.png', 'layer4.png'];
    let imagesLoaded = 0;

    images.forEach((layer, index) => {
        const imageUrl = `/YobEasyPalette/assets/preview_layers/${selectedPreview}/${layer}`;
        loadLayerImage(`layer${index + 1}`, imageUrl, () => {
            imagesLoaded++;
            if (imagesLoaded === images.length) {
                if (typeof callback === 'function') callback();
            }
        });
    });
}

// Function to generate a preview
function generatePreview() {
    if (selectedColors.length === 4) {
        layers.forEach((layer, index) => {
            const [r, g, b] = selectedColors[index];
            const ctx = layer.getContext('2d');
            const imageData = ctx.getImageData(0, 0, layer.width, layer.height);

            for (let i = 0; i < imageData.data.length; i += 4) {
                imageData.data[i] = r;
                imageData.data[i + 1] = g;
                imageData.data[i + 2] = b;
            }

            ctx.putImageData(imageData, 0, 0);
        });
    } else {
        showModal('Four colors needed to generate preview');
    }
}



// Add an event listener for mouse wheel scrolling
canvas.addEventListener('wheel', (event) => {
    event.preventDefault(); // Prevent default scrolling behavior

    const scaleChange = event.deltaY > 0 ? -100 : 100; // Scale factor increment/decrement
    const newScaleFactor = scaleFactor + scaleChange; // Calculate new scale factor

    // Calculate the new dimensions based on the new scale factor
    const newWidth = img.width * (newScaleFactor / 100);
    const newHeight = img.height * (newScaleFactor / 100);

    // Ensure the new dimensions are not less than 10px
    if (newWidth >= 100 && newHeight >= 100) {
        scaleFactor = newScaleFactor; // Update scale factor
        scaleSlider.value = scaleFactor; // Update the slider value
        scaleValue.textContent = `${scaleFactor}%`; // Update the displayed scale

        drawImage(); // Redraw the image with the new scale
    } else if (newWidth < 100 || newHeight < 100) {
;
    }
});

// The rest of your existing code...

