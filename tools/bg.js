import { removeBackground } from "https://cdn.jsdelivr.net/npm/@imgly/background-removal/+esm";

const input = document.getElementById("imageInput");

input.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
        document.body.style.cursor = "wait";

        const blob = await removeBackground(file);

        const url = URL.createObjectURL(blob);

        document.querySelector(".container").innerHTML += `
            <h2>Preview</h2>
            <img src="${url}" style="max-width:100%;margin-top:20px;">
            <br><br>
            <a href="${url}" download="background-removed.png">
                <button>⬇️ Download PNG</button>
            </a>
        `;

        document.body.style.cursor = "default";

    } catch (err) {
        alert("Background removal failed.");
        console.error(err);
        document.body.style.cursor = "default";
    }
});
