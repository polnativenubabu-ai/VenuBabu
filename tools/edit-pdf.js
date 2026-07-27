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
let history = [];

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
// =============================
// Render All Pages
// =============================

async function renderPages() {

    preview.innerHTML = "";

    for (let index = 0; index < allPages.length; index++) {

        const item = allPages[index];

        const page = await item.pdf.getPage(item.pageNumber);

        const viewport = page.getViewport({
            scale: 1.2,
            rotation: item.rotation
        });

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
            canvasContext: ctx,
            viewport: viewport
        }).promise;

        createPageCard(canvas, index);

    }

}
// =============================
// Create Page Card
// =============================

function createPageCard(canvas, index) {

    const card = document.createElement("div");
    card.className = "page-card";
    card.draggable = true;
card.dataset.index = index;

    card.innerHTML = `
        <div class="page-title">
            Page ${index + 1}
        </div>
    `;

    card.appendChild(canvas);

    const controls = document.createElement("div");

    controls.innerHTML = `
        <button class="deleteBtn">❌ Delete</button>
        <button class="rotateBtn">🔄 Rotate</button>
        <button class="upBtn">⬆️ Up</button>
        <button class="downBtn">⬇️ Down</button>
    `;

    card.appendChild(controls);

    controls.querySelector(".deleteBtn")
        .addEventListener("click", () => deletePage(index));

    controls.querySelector(".rotateBtn")
        .addEventListener("click", () => rotatePage(index));

    controls.querySelector(".upBtn")
        .addEventListener("click", () => moveUp(index));

    controls.querySelector(".downBtn")
        .addEventListener("click", () => moveDown(index));

card.addEventListener("dragstart", dragStart);
card.addEventListener("dragover", dragOver);
card.addEventListener("drop", dropPage);
    

    preview.appendChild(card);

}
// =============================
// Delete Page
// =============================

function deletePage(index) {

    saveHistory();

    if (!confirm("Delete this page?")) return;

    allPages.splice(index, 1);

    renderPages();

}

// =============================
// Rotate Page
// =============================

function rotatePage(index) {

    saveHistory();

    allPages[index].rotation += 90;

    if (allPages[index].rotation >= 360) {
        allPages[index].rotation = 0;
    }

    renderPages();

}

// =============================
// Move Page Up
// =============================

function moveUp(index) {

    if (index === 0) return;
    saveHistory();

    [allPages[index], allPages[index - 1]] =
    [allPages[index - 1], allPages[index]];

    renderPages();

}

// =============================
// Move Page Down
// =============================

function moveDown(index) {

    if (index === allPages.length - 1) return;
    saveHistory();

    [allPages[index], allPages[index + 1]] =
    [allPages[index + 1], allPages[index]];

    renderPages();

}
// =============================
// Save History
// =============================

function saveHistory() {

    history.push(
        JSON.stringify(
            allPages.map(page => ({
                pdf: page.pdf,
                pageNumber: page.pageNumber,
                rotation: page.rotation
            }))
        )
    );

    if (history.length > 20) {
        history.shift();
    }

}
// =============================
// Save Edited PDF
// =============================

saveBtn.addEventListener("click", savePDF);

async function savePDF() {

    if (allPages.length === 0) {
        alert("Please upload a PDF first.");
        return;
    }

    const newPdf = await PDFLib.PDFDocument.create();

    for (const item of allPages) {

        const originalBytes = await item.pdf.getData();

        const originalPdf = await PDFLib.PDFDocument.load(originalBytes);

        const [page] = await newPdf.copyPages(
            originalPdf,
            [item.pageNumber - 1]
        );

        page.setRotation(
            PDFLib.degrees(item.rotation)
        );

        newPdf.addPage(page);
    }

    const pdfBytes = await newPdf.save();

    const blob = new Blob(
        [pdfBytes],
        { type: "application/pdf" }
    );

    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);

    link.download = "Edited_PDF.pdf";

    link.click();

    URL.revokeObjectURL(link.href);

}
// =============================
// Save History
// =============================

function saveHistory() {

    history.push(
        allPages.map(page => ({
            pdf: page.pdf,
            pageNumber: page.pageNumber,
            rotation: page.rotation
        }))
    );

    if (history.length > 20) {
        history.shift();
    }

}
// =============================
// Drag & Drop Reorder
// =============================

let draggedIndex = null;

function dragStart(e) {

    draggedIndex = Number(e.currentTarget.dataset.index);

}

function dragOver(e) {

    e.preventDefault();

}

function dropPage(e) {

    e.preventDefault();

    const targetIndex = Number(e.currentTarget.dataset.index);

    if (draggedIndex === targetIndex) return;

    const movedPage = allPages.splice(draggedIndex, 1)[0];

    allPages.splice(targetIndex, 0, movedPage);

    renderPages();

}
function updatePageNumbers() {
    document.querySelectorAll(".page-card").forEach((card, index) => {
        card.dataset.index = index;
        card.querySelector(".page-title").textContent = `Page ${index + 1}`;
    });
}
