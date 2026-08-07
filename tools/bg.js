import { removeBackground } from "https://cdn.jsdelivr.net/npm/@imgly/background-removal/+esm";

const browseBtn = document.getElementById("browseBtn");
const imageInput = document.getElementById("imageInput");

const progressBox = document.getElementById("progressBox");
const progressText = document.getElementById("progressText");
const progressFill = document.getElementById("progressFill");
const progressStatus = document.getElementById("progressStatus");
const previewSection = document.getElementById("previewSection");

const originalImage = document.getElementById("originalImage");
const resultImage = document.getElementById("resultImage");

const removeBtn = document.getElementById("removeBtn");
const downloadBtn = document.getElementById("downloadBtn");

const colorButtons = document.querySelectorAll(".color-btn");
const customColor = document.getElementById("customColor");

// Custom Background Image
const backgroundImageInput =
    document.getElementById("backgroundImageInput");

const backgroundImageBtn =
    document.getElementById("backgroundImageBtn");

const backgroundImageName =
    document.getElementById("backgroundImageName");


function setProgress(percent, text) {

    progressBox.classList.remove("hidden");

    progressText.textContent = percent + "%";

    progressFill.style.width = percent + "%";

    progressStatus.textContent = text;

}


let selectedFile = null;

let outputBlob = null;
let outputURL = null;

let backgroundImage = null;
let backgroundImageURL = null;

let selectedColor = "transparent";


// ======================================================
// OPEN IMAGE FILE PICKER
// ======================================================

browseBtn.addEventListener("click", () => {
    imageInput.click();
});


// ======================================================
// IMAGE SELECTED
// ======================================================

imageInput.addEventListener("change", (e) => {

    selectedFile = e.target.files[0];

    if (!selectedFile) return;

    originalImage.src = URL.createObjectURL(selectedFile);

    previewSection.classList.remove("hidden");

    downloadBtn.disabled = true;

    if (outputURL) {
        URL.revokeObjectURL(outputURL);
        outputURL = null;
    }

    outputBlob = null;

    resultImage.removeAttribute("src");

    // Reset background
    selectedColor = "transparent";

    colorButtons.forEach(btn => {
        btn.classList.remove("active");
    });

    const transparentBtn = document.querySelector(
        '.color-btn[data-color="transparent"]'
    );

    if (transparentBtn) {
        transparentBtn.classList.add("active");
    }

    // Reset custom background
    backgroundImage = null;

    if (backgroundImageURL) {
        URL.revokeObjectURL(backgroundImageURL);
        backgroundImageURL = null;
    }

    backgroundImageName.textContent = "No background selected";

    resultImage.style.backgroundColor = "transparent";
    resultImage.style.backgroundImage = "none";
});


// ======================================================
// REMOVE BACKGROUND
// ======================================================

removeBtn.addEventListener("click", async () => {

    if (!selectedFile) {
        alert("Please choose an image first.");
        return;
    }

    setProgress(1, "Preparing image...");

    removeBtn.disabled = true;
    downloadBtn.disabled = true;

    try {

        setProgress(50, "Removing background...");

        const blob = await removeBackground(selectedFile);

        outputBlob = blob;

        if (outputURL) {
            URL.revokeObjectURL(outputURL);
        }

        outputURL = URL.createObjectURL(blob);

        resultImage.src = outputURL;

        setProgress(100, "Completed ✓");

        downloadBtn.disabled = false;

    } catch (err) {

        console.error(err);

        alert("Background removal failed.");

    } finally {


        removeBtn.disabled = false;
    }
});


// ======================================================
// COLOR BUTTONS
// ======================================================

colorButtons.forEach(button => {

    button.addEventListener("click", () => {

        if (!outputBlob) {
            alert("Please remove the background first.");
            return;
        }

        colorButtons.forEach(btn => {
            btn.classList.remove("active");
        });

        button.classList.add("active");

        selectedColor = button.dataset.color;

        // Remove custom background image
        backgroundImage = null;

        if (backgroundImageURL) {
            URL.revokeObjectURL(backgroundImageURL);
            backgroundImageURL = null;
        }

        backgroundImageName.textContent =
            "No background selected";

        updatePreview();
    });
});


// ======================================================
// CUSTOM COLOR
// ======================================================

customColor.addEventListener("input", () => {

    if (!outputBlob) return;

    colorButtons.forEach(btn => {
        btn.classList.remove("active");
    });

    selectedColor = customColor.value;

    // Remove custom image background
    backgroundImage = null;

    if (backgroundImageURL) {
        URL.revokeObjectURL(backgroundImageURL);
        backgroundImageURL = null;
    }

    backgroundImageName.textContent =
        "No background selected";

    updatePreview();
});


// ======================================================
// OPEN CUSTOM BACKGROUND IMAGE PICKER
// ======================================================

backgroundImageBtn.addEventListener("click", () => {

    if (!outputBlob) {
        alert("Please remove the background first.");
        return;
    }

    backgroundImageInput.click();
});


// ======================================================
// CUSTOM BACKGROUND IMAGE SELECTED
// ======================================================

backgroundImageInput.addEventListener("change", (e) => {

    const file = e.target.files[0];

    if (!file) return;

    if (!outputBlob) {
        alert("Please remove the background first.");
        return;
    }

    // Remove old URL
    if (backgroundImageURL) {
        URL.revokeObjectURL(backgroundImageURL);
    }

    backgroundImageURL = URL.createObjectURL(file);

    const img = new Image();

    img.onload = () => {

        backgroundImage = img;

        // Remove color selection
        selectedColor = "transparent";

        colorButtons.forEach(btn => {
            btn.classList.remove("active");
        });

        backgroundImageName.textContent = file.name;

        updatePreview();
    };

    img.onerror = () => {

        alert("Unable to load background image.");

        backgroundImage = null;
    };

    img.src = backgroundImageURL;
});


// ======================================================
// UPDATE PREVIEW
// ======================================================

function updatePreview() {

    if (!outputBlob) return;


    // ------------------------------------------
    // CUSTOM IMAGE BACKGROUND
    // ------------------------------------------

    if (backgroundImage) {

        resultImage.style.backgroundColor = "transparent";

        resultImage.style.backgroundImage =
            `url("${backgroundImageURL}")`;

        resultImage.style.backgroundSize = "cover";

        resultImage.style.backgroundPosition = "center";

        resultImage.style.backgroundRepeat = "no-repeat";

        return;
    }


    // ------------------------------------------
    // TRANSPARENT
    // ------------------------------------------

    if (selectedColor === "transparent") {

        resultImage.style.backgroundColor =
            "transparent";

        resultImage.style.backgroundImage =
            "none";

        return;
    }


    // ------------------------------------------
    // COLOR BACKGROUND
    // ------------------------------------------

    resultImage.style.backgroundColor =
        selectedColor;

    resultImage.style.backgroundImage =
        "none";
}


// ======================================================
// DOWNLOAD PNG
// ======================================================

downloadBtn.addEventListener("click", async () => {

    if (!outputBlob) return;

    try {

        const img = new Image();

        img.onload = () => {

            const canvas = document.createElement("canvas");

            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;

            const ctx = canvas.getContext("2d");


            // ==================================================
            // CUSTOM BACKGROUND IMAGE
            // ==================================================

            if (backgroundImage) {

                const bg = backgroundImage;

                const canvasRatio =
                    canvas.width / canvas.height;

                const bgRatio =
                    bg.naturalWidth / bg.naturalHeight;

                let drawWidth;
                let drawHeight;
                let offsetX;
                let offsetY;


                // Cover background
                if (bgRatio > canvasRatio) {

                    drawHeight = canvas.height;

                    drawWidth =
                        drawHeight * bgRatio;

                    offsetX =
                        (canvas.width - drawWidth) / 2;

                    offsetY = 0;

                } else {

                    drawWidth = canvas.width;

                    drawHeight =
                        drawWidth / bgRatio;

                    offsetX = 0;

                    offsetY =
                        (canvas.height - drawHeight) / 2;
                }


                ctx.drawImage(
                    bg,
                    offsetX,
                    offsetY,
                    drawWidth,
                    drawHeight
                );

            }


            // ==================================================
            // COLOR BACKGROUND
            // ==================================================

            else if (selectedColor !== "transparent") {

                ctx.fillStyle = selectedColor;

                ctx.fillRect(
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );
            }


            // ==================================================
            // TRANSPARENT BACKGROUND
            // ==================================================

            // Nothing needs to be drawn here.


            // ==================================================
            // DRAW REMOVED-BACKGROUND PERSON
            // ==================================================

            ctx.drawImage(
                img,
                0,
                0,
                canvas.width,
                canvas.height
            );


            // ==================================================
            // CREATE PNG
            // ==================================================

            canvas.toBlob((blob) => {

                if (!blob) {

                    alert("Download failed.");

                    return;
                }

                const url =
                    URL.createObjectURL(blob);

                const a =
                    document.createElement("a");

                a.href = url;


                // File name
                if (backgroundImage) {

                    a.download =
                        "SARVATRA-Custom-Background.png";

                } else if (
                    selectedColor === "transparent"
                ) {

                    a.download =
                        "SARVATRA-Background-Removed.png";

                } else {

                    a.download =
                        "SARVATRA-Background-" +
                        selectedColor.replace("#", "") +
                        ".png";
                }


                document.body.appendChild(a);

                a.click();

                document.body.removeChild(a);


                setTimeout(() => {

                    URL.revokeObjectURL(url);

                }, 1000);

            }, "image/png");

        };


        img.onerror = () => {

            alert("Unable to process image.");

        };


        img.src = outputURL;

    } catch (err) {

        console.error(err);

        alert("Download failed.");
    }

});
