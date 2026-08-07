import { removeBackground } from "https://cdn.jsdelivr.net/npm/@imgly/background-removal/+esm";

const browseBtn = document.getElementById("browseBtn");
const imageInput = document.getElementById("imageInput");

const loading = document.getElementById("loading");
const previewSection = document.getElementById("previewSection");

const originalImage = document.getElementById("originalImage");
const resultImage = document.getElementById("resultImage");

const removeBtn = document.getElementById("removeBtn");
const downloadBtn = document.getElementById("downloadBtn");

let selectedFile = null;
let outputURL = null;

// Open file picker
browseBtn.addEventListener("click", () => {
    imageInput.click();
});

// Image selected
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

    resultImage.removeAttribute("src");
});

// Remove background
removeBtn.addEventListener("click", async () => {
    if (!selectedFile) {
        alert("Please choose an image first.");
        return;
    }

    loading.classList.remove("hidden");
    removeBtn.disabled = true;

    try {
        const blob = await removeBackground(selectedFile);

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

// Download image
downloadBtn.addEventListener("click", () => {
    if (!outputURL) return;

    const a = document.createElement("a");
    a.href = outputURL;
    a.download = "SARVATRA-Background-Removed.png";
    a.click();
});
