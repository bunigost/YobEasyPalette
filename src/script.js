const imageUploader = document.getElementById('imageUploader');
const scaleSlider = document.getElementById('scaleSlider');
const scaleValue = document.getElementById('scaleValue');
const canvas = document.getElementById('imageCanvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const paletteDiv = document.getElementById('palette');
const output = document.getElementById('output');
const clearPaletteBtn = document.getElementById('clearPaletteBtn');
const copyToClipboardBtn = document.getElementById('copyToClipboardBtn');
const canvasInstructions = document.getElementById('canvasInstructions');
const layers = [
    document.getElementById('layer1'),
    document.getElementById('layer2'),
    document.getElementById('layer3'),
    document.getElementById('layer4'),
];

let selectedColors = [];
let filename = "palette";
let scaleFactor = 100; // Default scale factor (initially set to 100%)
let img = new Image();

const decreaseScaleBtn = document.getElementById('decreaseScale');
const increaseScaleBtn = document.getElementById('increaseScale');

// Function to convert RGB values to Game Boy format
function rgbToGameBoy(r, g, b) {
    return [Math.floor(r / 8), Math.floor(g / 8), Math.floor(b / 8)];
}

// Function to update the color palette
function updatePalette() {
    paletteDiv.innerHTML = ''; // Clear the existing palette
    const gbPalette = selectedColors.map(([r, g, b]) => rgbToGameBoy(r, g, b));

    gbPalette.forEach(([r, g, b], index) => {
        const colorBox = document.createElement('div');
        colorBox.className = 'color-box';
        colorBox.style.backgroundColor = `rgb(${r * 8}, ${g * 8}, ${b * 8})`;
        colorBox.style.cursor = 'pointer'; // Change cursor to pointer

        // Add click event to color box to remove color from the palette
        colorBox.addEventListener('click', () => {
            selectedColors.splice(index, 1); // Remove color from the array
            updatePalette(); // Update the palette display
        });

        paletteDiv.appendChild(colorBox);
    });

    const flatPalette = gbPalette.flat();
    output.textContent = `${filename}=${flatPalette.join(',')}`;
}

// Function to draw the uploaded image on the canvas
function drawImage() {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');

    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    tempCtx.drawImage(img, 0, 0);

    // Set the canvas dimensions according to scale factor
    canvas.width = img.width * (scaleFactor / 100);
    canvas.height = img.height * (scaleFactor / 100);

    ctx.imageSmoothingEnabled = false; // Disable image smoothing
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous image
    ctx.drawImage(tempCanvas, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height);
}

// Event listener for image upload
imageUploader.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        selectedColors = [];
        updatePalette();
        filename = file.name.replace(/\.[^/.]+$/, "");

        img = new Image();
        img.onload = () => {
            drawImage(); // Draw the image after it has loaded

            // Display the canvas and instructions after image upload
            canvas.style.display = 'block';
            canvasInstructions.style.display = 'block';

            // Show the scale section
            document.querySelector('.slider-container').style.display = 'block'; // Show the scale controls
        };
        img.src = URL.createObjectURL(file);
    }
});

// Slider input events
scaleSlider.addEventListener('touchstart', (event) => {
    event.stopPropagation();
});

scaleSlider.addEventListener('touchmove', (event) => {
    event.stopPropagation();
});

scaleSlider.addEventListener('input', () => {
    scaleFactor = parseInt(scaleSlider.value);
    scaleValue.textContent = `${scaleFactor}%`; // Update displayed value
    if (img.src) {
        drawImage(); // Redraw the image on scale change
    }
});

// Color selection on canvas click
canvas.addEventListener('click', (event) => {
    if (selectedColors.length === 0) { // When first color is selected
        paletteDiv.style.display = 'flex'; // Show the palette container
        output.parentElement.style.display = 'block'; // Show output container
        clearPaletteBtn.parentElement.style.display = 'block'; // Show button container
        copyToClipboardBtn.parentElement.style.display = 'block'; // Show copy button
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = img.width / (canvas.width / (scaleFactor / 100));
    const scaleY = img.height / (canvas.height / (scaleFactor / 100));

    const x = Math.floor((event.clientX - rect.left) * scaleX);
    const y = Math.floor((event.clientY - rect.top) * scaleY);

    const pixel = ctx.getImageData(x, y, 1, 1).data; // Get image data
    const [r, g, b, a] = pixel;

    if (selectedColors.length < 4) { // Limit to 4 colors
        selectedColors.push([r, g, b]);
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
        drawImage(); // Redraw image with new scale
    } else {
        showModal('Minimum scale reached.');
    }
});

increaseScaleBtn.addEventListener('click', () => {
    if (scaleFactor < 1000) {
        scaleFactor += 25;
        scaleSlider.value = scaleFactor;
        scaleValue.textContent = `${scaleFactor}%`;
        drawImage(); // Redraw image with new scale
    } else {
        showModal('Maximum scale reached.');
    }
});

// Clear the palette
clearPaletteBtn.addEventListener('click', () => {
    selectedColors = [];
    updatePalette(); // Clear color selections
    paletteDiv.style.display = 'none'; // Hide the color palette
    output.parentElement.style.display = 'none'; // Hide the output container
    clearPaletteBtn.parentElement.style.display = 'none'; // Hide the button container
    copyToClipboardBtn.parentElement.style.display = 'none'; // Hide the copy button
});

// Copy to clipboard functionality
copyToClipboardBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(output.textContent).then(() => {
        showModal("Palette copied to clipboard. Paste it below the palette section in _nds/gameyobds.ini");
    }).catch(err => {
        console.error('Error copying text: ', err);
    });
});

function loadLayerImage(layerId, imageUrl, callback) {
    const layer = document.getElementById(layerId);
    const layerImg = new Image();

    // Log the layer ID and source being loaded
    console.debug(`Loading layer image for: ${layerId} from ${imageUrl}`);

    layerImg.onload = () => {
        console.info(`Successfully loaded layer: ${layerId} from ${imageUrl}`);

        // Set canvas dimensions according to the loaded image
        layer.width = layerImg.width;
        layer.height = layerImg.height;
        const layerCtx = layer.getContext('2d');
        layerCtx.drawImage(layerImg, 0, 0); // Draw the image

        // Check if callback is a function before calling
        if (typeof callback === 'function') {
            callback(); // Call the callback function after loading
        }
    };

    layerImg.onerror = () => {
        console.error(`Failed to load layer: ${layerId} from ${imageUrl}`);
    };

    // Use the correct path for the preview images
    layerImg.src = imageUrl;
}


function loadImagesForPreview(selectedPreview, callback) {
    console.debug(`Loading images for preview: ${selectedPreview}`);

    const images = ['layer1.png', 'layer2.png', 'layer3.png', 'layer4.png'];
    let imagesLoaded = 0; // Count loaded images

    images.forEach((layer, index) => {
        const imageUrl = `src/assets/preview/${selectedPreview}/${layer}`;
        console.debug(`Initiating load for layer${index + 1} from: ${imageUrl}`);
        
        loadLayerImage(`layer${index + 1}`, imageUrl, () => {
            imagesLoaded++;
            console.debug(`Loaded ${imagesLoaded}/${images.length} images for preview: ${selectedPreview}`);

            // Check if all images are loaded
            if (imagesLoaded === images.length) {
                console.info(`All layers loaded for preview: ${selectedPreview}`);
                
                // Check if callback is a function and call it
                if (typeof callback === 'function') {
                    callback(); // Invoke callback to indicate that all layers are loaded
                }
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

            // Replace colors based on selected palette
            for (let i = 0; i < imageData.data.length; i += 4) {
                imageData.data[i] = r; // Red channel
                imageData.data[i + 1] = g; // Green channel
                imageData.data[i + 2] = b; // Blue channel
            }

            ctx.putImageData(imageData, 0, 0); // Update canvas with new image data
        });
    } else {
        showModal('Four colors need to generate preview');
    }
}

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

// Close the modal when the user clicks anywhere outside of the modal-content
window.onclick = function(event) {
    const modal = document.getElementById('modal');
    if (event.target == modal) {
        modal.style.display = "none";
    }
};


// Automatic loading of images for the first preview
document.addEventListener("DOMContentLoaded", function() {
    const previewImages = document.querySelectorAll('.preview-folder'); // Ensure to select your preview icons

    if (previewImages.length > 0) {
        // Load default images for the first preview icon (Mario)
        loadImagesForPreview(previewImages[0].getAttribute('data-folder')); 
    }

    previewImages.forEach(image => {
        image.addEventListener('click', () => {
            const selectedPreview = image.getAttribute('data-folder'); // Get folder from data attribute
            loadImagesForPreview(selectedPreview, () => {
                // Only generate a preview after layers are loaded
                if (selectedColors.length === 4) {
                    generatePreview();
                }
            });
        });
    });
});
