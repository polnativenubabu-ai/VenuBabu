import { removeBackground } from "https://cdn.jsdelivr.net/npm/@imgly/background-removal/+esm";

const input = document.getElementById("imageInput");
const preview = document.getElementById("preview");
const downloadBtn = document.getElementById("downloadBtn");
const status = document.getElementById("status");

let outputUrl = "";

input.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    status.innerHTML = "⏳ Background తొలగిస్తోంది... దయచేసి వేచి ఉండండి.";
    preview.innerHTML = "";
    downloadBtn.style.display = "none";
    document.body.style.cursor = "wait";

    try {
        const blob = await removeBackground(file);

        outputUrl = URL.createObjectURL(blob);

        preview.innerHTML = `
            <img src="${outputUrl}" alt="Result"
            style="width:100%;max-width:400px;border-radius:12px;
            border:2px solid #0d6efd;margin-top:15px;">
        `;

        downloadBtn.href = outputUrl;
        downloadBtn.download = "SARVATRA-Background-Removed.png";
        downloadBtn.style.display = "inline-block";

        status.innerHTML = "✅ Background విజయవంతంగా తొలగించబడింది.";

    } catch (err) {
        console.error(err);
        status.innerHTML = "❌ Background తొలగించడంలో సమస్య వచ్చింది.";
    } finally {
        document.body.style.cursor = "default";
    }
});
