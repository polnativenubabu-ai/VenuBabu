// =============================
// SARVATRA PDF Editor v2
// Part 1 - Variables & Setup
// =============================

const pdfInput = document.getElementById("pdfInput");
const uploadBtn = document.getElementById("uploadBtn");
const addBtn = document.getElementById("addBtn");
const preview = document.getElementById("preview");
const saveBtn = document.getElementById("saveBtn");

let allPages = [];
let selectedPage = null;

pdfjsLib.GlobalWorkerOptions.workerSrc =
'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

uploadBtn.addEventListener("click", () => {
    uploadBtn.dataset.mode = "new";
    pdfInput.click();
});

addBtn.addEventListener("click", () => {
    uploadBtn.dataset.mode = "add";
    pdfInput.click();
});

pdfInput.addEventListener("change", loadPDF);
async function loadPDF(e) {

    const file = e.target.files[0];
    if (!file) return;

    if (uploadBtn.dataset.mode !== "add") {
        allPages = [];
        preview.innerHTML = "";
    }

    const bytes = await file.arrayBuffer();

    const pdf = await pdfjsLib.getDocument({
        data: bytes
    }).promise;

    for (let i = 1; i <= pdf.numPages; i++) {

        allPages.push({
            pdf,
            pageNumber: i,
            rotation: 0
        });

    }

    renderPages();

}
