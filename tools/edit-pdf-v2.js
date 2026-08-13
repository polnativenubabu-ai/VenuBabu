// =============================
// SARVATRA PDF Editor V2
// Fast Version
// =============================

// =============================
// Variables
// =============================

const pdfInput = document.getElementById("pdfInput");
const uploadBtn = document.getElementById("uploadBtn");
const addBtn = document.getElementById("addBtn");
const preview = document.getElementById("preview");
const saveBtn = document.getElementById("saveBtn");

let allPages = [];

let deleteMode = false;
let selectedDeletePages = new Set();

let draggedIndex = null;


// =============================
// PDF.js Worker
// =============================

pdfjsLib.GlobalWorkerOptions.workerSrc =
"https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";


// =============================
// Upload PDF
// =============================

uploadBtn.addEventListener("click", () => {

    uploadBtn.dataset.mode = "new";

    pdfInput.click();

});


// =============================
// Add Multiple PDFs
// =============================

addBtn.addEventListener("click", () => {

    uploadBtn.dataset.mode = "add";

    pdfInput.click();

});


// =============================
// File Selection
// =============================

pdfInput.addEventListener("change", loadPDF);


async function loadPDF(e) {

    const files = Array.from(e.target.files);

    if (files.length === 0) return;


    // New upload
    if (uploadBtn.dataset.mode !== "add") {

        allPages = [];

        preview.innerHTML = "";

    }


    // Process every selected PDF
    for (const file of files) {

        const bytes = await file.arrayBuffer();

        const pdf =
            await pdfjsLib.getDocument({
                data: bytes
            }).promise;


        for (
            let pageNumber = 1;
            pageNumber <= pdf.numPages;
            pageNumber++
        ) {

            allPages.push({

                pdf: pdf,

                pageNumber: pageNumber,

                rotation: 0

            });

        }

    }


    deleteMode = false;
    selectedDeletePages.clear();

    renderAllPages();

}


// =============================
// Render All Pages
// Only used when necessary
// =============================

async function renderAllPages() {

    preview.innerHTML = "";

    for (
        let index = 0;
        index < allPages.length;
        index++
    ) {

        await renderPageCard(index);

    }

    updatePageNumbers();

}


// =============================
// Render Single Page Card
// =============================

async function renderPageCard(index) {

    const item = allPages[index];

    const page =
        await item.pdf.getPage(item.pageNumber);


    const viewport =
        page.getViewport({

            scale: 1.2,

            rotation: item.rotation

        });


    const canvas =
        document.createElement("canvas");

    const ctx =
        canvas.getContext("2d");


    canvas.width = viewport.width;

    canvas.height = viewport.height;


    await page.render({

        canvasContext: ctx,

        viewport: viewport

    }).promise;


    const card =
        createPageCard(canvas, index);


    preview.appendChild(card);

}


// =============================
// Create Page Card
// =============================

function createPageCard(canvas, index) {

    const card =
        document.createElement("div");

    card.className =
        "page-card";

    card.draggable = true;

    card.dataset.index = index;


    // Page title
    const title =
        document.createElement("div");

    title.className =
        "page-title";

    title.textContent =
        `Page ${index + 1}`;


    card.appendChild(title);


    // Canvas
    card.appendChild(canvas);


    // Delete selection
    if (deleteMode) {

        const selector =
            document.createElement("div");

        selector.className =
            "delete-selector";


        const checkbox =
            document.createElement("input");

        checkbox.type =
            "checkbox";

        checkbox.checked =
            selectedDeletePages.has(index);


        checkbox.addEventListener(
            "change",
            () => {

                if (checkbox.checked) {

                    selectedDeletePages.add(index);

                } else {

                    selectedDeletePages.delete(index);

                }

            }
        );


        const label =
            document.createElement("label");

        label.appendChild(checkbox);

        label.appendChild(
            document.createTextNode(
                " Select Page"
            )
        );


        selector.appendChild(label);

        card.appendChild(selector);

    }


    // Controls
    const controls =
        document.createElement("div");


    controls.innerHTML = `

        <button class="deleteBtn">
            ❌ Delete
        </button>

        <button class="rotateBtn">
            🔄 Rotate
        </button>

        <button class="upBtn">
            ⬆️ Up
        </button>

        <button class="downBtn">
            ⬇️ Down
        </button>

    `;


    card.appendChild(controls);


    // Delete
    controls
        .querySelector(".deleteBtn")
        .addEventListener(
            "click",
            () => startDeleteMode()
        );


    // Rotate
    controls
        .querySelector(".rotateBtn")
        .addEventListener(
            "click",
            () => rotatePage(index)
        );


    // Up
    controls
        .querySelector(".upBtn")
        .addEventListener(
            "click",
            () => moveUp(index)
        );


    // Down
    controls
        .querySelector(".downBtn")
        .addEventListener(
            "click",
            () => moveDown(index)
        );


    // Drag
    card.addEventListener(
        "dragstart",
        dragStart
    );

    card.addEventListener(
        "dragover",
        dragOver
    );

    card.addEventListener(
        "drop",
        dropPage
    );


    return card;

}


// =============================
// Delete Mode
// =============================

function startDeleteMode() {

    deleteMode = true;

    selectedDeletePages.clear();


    const bar =
        document.getElementById(
            "deleteSelectedBar"
        );


    if (bar) {

        bar.style.display =
            "block";

    }


    renderAllPages();

}


// =============================
// Bulk Delete
// =============================

async function deleteSelectedPages() {

    if (
        selectedDeletePages.size === 0
    ) {

        alert(
            "Please select at least one page to delete."
        );

        return;

    }


    if (
        selectedDeletePages.size >=
        allPages.length
    ) {

        alert(
            "At least one page must remain."
        );

        return;

    }


    if (
        !confirm(
            `Delete ${selectedDeletePages.size} selected page(s)?`
        )
    ) {

        return;

    }


    allPages =
        allPages.filter(
            (_, index) =>
                !selectedDeletePages.has(index)
        );


    selectedDeletePages.clear();

    deleteMode = false;


    const bar =
        document.getElementById(
            "deleteSelectedBar"
        );


    if (bar) {

        bar.style.display =
            "none";

    }


    // Only remaining cards are rebuilt
    await renderAllPages();

}


// =============================
// Rotate
// =============================

async function rotatePage(index) {

    if (!allPages[index]) return;


    allPages[index].rotation += 90;


    if (
        allPages[index].rotation >= 360
    ) {

        allPages[index].rotation = 0;

    }


    await refreshCard(index);

}


// =============================
// Refresh One Card
// =============================

async function refreshCard(index) {

    const oldCard =
        preview.querySelector(
            `.page-card[data-index="${index}"]`
        );


    if (!oldCard) {

        await renderAllPages();

        return;

    }


    const newContainer =
        document.createElement("div");


    const item =
        allPages[index];


    const page =
        await item.pdf.getPage(
            item.pageNumber
        );


    const viewport =
        page.getViewport({

            scale: 1.2,

            rotation: item.rotation

        });


    const canvas =
        document.createElement("canvas");


    const ctx =
        canvas.getContext("2d");


    canvas.width =
        viewport.width;

    canvas.height =
        viewport.height;


    await page.render({

        canvasContext: ctx,

        viewport: viewport

    }).promise;


    const newCard =
        createPageCard(
            canvas,
            index
        );


    oldCard.replaceWith(
        newCard
    );


    updatePageNumbers();

}


// =============================
// Move Up
// =============================

function moveUp(index) {

    if (index <= 0) return;


    [
        allPages[index],
        allPages[index - 1]
    ] =
    [
        allPages[index - 1],
        allPages[index]
    ];


    swapCards(
        index,
        index - 1
    );

}


// =============================
// Move Down
// =============================

function moveDown(index) {

    if (
        index >=
        allPages.length - 1
    ) return;


    [
        allPages[index],
        allPages[index + 1]
    ] =
    [
        allPages[index + 1],
        allPages[index]
    ];


    swapCards(
        index,
        index + 1
    );

}


// =============================
// Swap Cards
// =============================

function swapCards(index1, index2) {

    const cards =
        Array.from(
            preview.querySelectorAll(".page-card")
        );

    const card1 = cards[index1];
    const card2 = cards[index2];

    if (!card1 || !card2) return;

    if (index1 < index2) {

        preview.insertBefore(
            card2,
            card1
        );

    } else {

        preview.insertBefore(
            card1,
            card2
        );

    }

    updatePageNumbers();

}


// =============================
// Drag & Drop
// =============================

function dragStart(e) {

    draggedIndex =
        Number(
            e.currentTarget.dataset.index
        );

}


function dragOver(e) {

    e.preventDefault();

}


function dropPage(e) {

    e.preventDefault();


    const targetIndex =
        Number(
            e.currentTarget.dataset.index
        );


    if (
        draggedIndex === targetIndex
    ) return;


    const movedPage =
        allPages.splice(
            draggedIndex,
            1
        )[0];


    allPages.splice(
        targetIndex,
        0,
        movedPage
    );


    const cards =
        Array.from(
            preview.querySelectorAll(
                ".page-card"
            )
        );


    const movedCard =
        cards[draggedIndex];


    const targetCard =
        cards[targetIndex];


    if (
        draggedIndex < targetIndex
    ) {

        targetCard.after(
            movedCard
        );

    } else {

        targetCard.before(
            movedCard
        );

    }


    updatePageNumbers();

}


// =============================
// Update Page Numbers
// =============================

function updatePageNumbers() {

    const cards =
        preview.querySelectorAll(
            ".page-card"
        );


    cards.forEach(
        (card, index) => {

            card.dataset.index =
                index;


            const title =
                card.querySelector(
                    ".page-title"
                );


            if (title) {

                title.textContent =
                    `Page ${index + 1}`;

            }

        }
    );

}


// =============================
// Download PDF
// =============================

saveBtn.addEventListener(
    "click",
    savePDF
);


async function savePDF() {

    if (
        allPages.length === 0
    ) {

        alert(
            "Please upload a PDF first."
        );

        return;

    }


    const newPdf =
        await PDFLib.PDFDocument.create();


    for (
        const item of allPages
    ) {

        const originalBytes =
            await item.pdf.getData();


        const originalPdf =
            await PDFLib.PDFDocument.load(
                originalBytes
            );


        const [page] =
            await newPdf.copyPages(
                originalPdf,
                [
                    item.pageNumber - 1
                ]
            );


        page.setRotation(
            PDFLib.degrees(
                item.rotation
            )
        );


        newPdf.addPage(page);

    }


    const pdfBytes =
        await newPdf.save();


    const blob =
        new Blob(
            [pdfBytes],
            {
                type:
                    "application/pdf"
            }
        );


    const link =
        document.createElement("a");


    link.href =
        URL.createObjectURL(
            blob
        );


    link.download =
        "Edited_PDF_V2.pdf";


    link.click();


    setTimeout(
        () => {
            URL.revokeObjectURL(
                link.href
            );
        },
        1000
    );

}
