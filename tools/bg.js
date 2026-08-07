import { removeBackground } from "https://cdn.jsdelivr.net/npm/@imgly/background-removal/+esm";

const browseBtn = document.getElementById("browseBtn");
const imageInput = document.getElementById("imageInput");

const loading = document.getElementById("loading");
const previewSection = document.getElementById("previewSection");

const originalImage = document.getElementById("originalImage");
const resultImage = document.getElementById("resultImage");

const removeBtn = document.getElementById("removeBtn");
const downloadBtn = document.getElementById("downloadBtn");

const colorButtons = document.querySelectorAll(".color-btn");
const customColor = document.getElementById("customColor");

let selectedFile = null;
let outputBlob = null;
let outputURL = null;

let selectedColor = "transparent";


// ===============================
// OPEN FILE PICKER
// ===============================

browseBtn.addEventListener("click", () => {
    imageInput.click();
});


// ===============================
// IMAGE SELECTED
// ===============================

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

    resultImage.style.backgroundColor = "transparent";
});


// ===============================
// REMOVE BACKGROUND
// ===============================

removeBtn.addEventListener("click", async () => {

    if (!selectedFile) {
        alert("Please choose an image first.");
        return;
    }

    loading.classList.remove("hidden");
    removeBtn.disabled = true;
    downloadBtn.disabled = true;

    try {

        const blob = await removeBackground(selectedFile);

        outputBlob = blob;

        if (outputURL) {
            URL.revokeObjectURL(outputURL);
        }

        outputURL = URL.createObjectURL(blob);

        resultImage.src = outputURL;

        downloadBtn.disabled = false;

    } catch (err) {

        console.error(err);

        alert("Background removal failed.");

    } finally {

        loading.classList.add("hidden");
        removeBtn.disabled = false;

    }
});


// ===============================
// COLOR BUTTONS
// ===============================

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

        updatePreview();

    });

});


// ===============================
// CUSTOM COLOR
// ===============================

customColor.addEventListener("input", () => {

    if (!outputBlob) {
        return;
    }

    colorButtons.forEach(btn => {
        btn.classList.remove("active");
    });

    selectedColor = customColor.value;

    updatePreview();

});


// ===============================
// UPDATE IMAGE PREVIEW
// ===============================

function updatePreview() {

    if (!outputBlob) return;

    if (selectedColor === "transparent") {

        resultImage.style.backgroundColor = "transparent";

    } else {

        resultImage.style.backgroundColor = selectedColor;

    }
}


// ===============================
// DOWNLOAD IMAGE
// ===============================

downloadBtn.addEventListener("click", async () => {

    if (!outputBlob) return;

    try {

        // Transparent PNG
        if (selectedColor === "transparent") {

            const a = document.createElement("a");

            a.href = outputURL;
            a.download = "SARVATRA-Background-Removed.png";

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            return;
        }


        // Load transparent image
        const img = new Image();

        img.onload = () => {

            const canvas = document.createElement("canvas");

            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;

            const ctx = canvas.getContext("2d");

            // Background color
            ctx.fillStyle = selectedColor;

            ctx.fillRect(
                0,
                0,
                canvas.width,
                canvas.height
            );

            // Transparent image on top
            ctx.drawImage(
                img,
                0,
                0,
                canvas.width,
                canvas.height
            );

            // Create final PNG
            canvas.toBlob((blob) => {

                if (!blob) {
                    alert("Download failed.");
                    return;
                }

                const url = URL.createObjectURL(blob);

                const a = document.createElement("a");

                a.href = url;
                a.download = "SARVATRA-Background-" +
                    selectedColor.replace("#", "") +
                    ".png";

                document.body.appendChild(a);

                a.click();

                document.body.removeChild(a);

                setTimeout(() => {
                    URL.revokeObjectURL(url);
                }, 1000);

            }, "image/png");

        };

        img.src = outputURL;

    } catch (err) {

        console.error(err);

        alert("Download failed.");

    }

});
