const { PDFDocument } = PDFLib;

let selectedFiles = [];
let reorderedFiles = [];

document.getElementById("uploadBox").addEventListener("click", () => {
    document.getElementById("fileInput").click();
});

document.getElementById("fileInput").addEventListener("change", handleFileSelect);
document.getElementById("convertButton").addEventListener("click", convertToPDF);

// Enable drag-and-drop functionality
const uploadBox = document.getElementById("uploadBox");
uploadBox.addEventListener("dragover", handleDragOver);
uploadBox.addEventListener("dragleave", handleDragLeave);
uploadBox.addEventListener("drop", handleFileDrop);

function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    uploadBox.classList.add("dragging");
}

function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    uploadBox.classList.remove("dragging");
}

function handleFileDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    uploadBox.classList.remove("dragging");

    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
        handleFileSelect({ target: { files } });
    }
}

// Pre-create empty boxes inside the grid when the page loads
function createEmptyBoxes() {
    const imageGrid = document.getElementById("imageGrid");

    const numberOfBoxes = 4;

    for (let i = 0; i < numberOfBoxes; i++) {
        const imageItem = document.createElement("div");
        imageItem.classList.add("image-item");
        imageItem.setAttribute("data-index", i);

        const placeholderText = document.createElement("span");
        placeholderText.textContent = "No Image";
        placeholderText.style.color = "#f0cefab9";
        placeholderText.style.fontSize = "14px";
        imageItem.style.display = "flex";
        imageItem.style.justifyContent = "center";
        imageItem.style.alignItems = "center";
      

        imageItem.appendChild(placeholderText);

        imageGrid.appendChild(imageItem);
    }

    new Sortable(imageGrid, {
        onEnd() {
            updateReorderedFiles();
        }
    });
}

function handleFileSelect(event) {
    const files = event.target.files || event.dataTransfer?.files;
    const imageGrid = document.getElementById("imageGrid");

    selectedFiles = Array.from(files).filter(file => file.type.startsWith('image/'));

    if (selectedFiles.length > 0) {
        imageGrid.innerHTML = "";

        selectedFiles.forEach((file, index) => {
            const imageItem = document.createElement("div");
            imageItem.classList.add("image-item");
            imageItem.setAttribute("data-index", index);

            const img = document.createElement("img");
            img.src = URL.createObjectURL(file);
            img.style.width = "90px";
            img.style.height = "90px";
            img.style.objectFit = "cover";

            imageItem.appendChild(img);
            imageGrid.appendChild(imageItem);
        });

        updateReorderedFiles();
    }
}

function updateReorderedFiles() {
    const imageGrid = document.getElementById("imageGrid");
    const reorderedElements = Array.from(imageGrid.children);

    reorderedFiles = reorderedElements.map(imageItem => {
        const index = parseInt(imageItem.getAttribute("data-index"), 10);
        return selectedFiles[index];
    });

    console.log("Reordered Files: ", reorderedFiles);
}

async function convertToPDF() {
    if (reorderedFiles.length === 0) {
        alert("Please select at least one image file.");
        return;
    }

    console.log("Converting the following images to PDF: ", reorderedFiles);

    const loadingOverlay = document.getElementById("loadingOverlay");
    if (loadingOverlay) loadingOverlay.style.display = "flex";

    const thankYouOverlay = document.getElementById("thankYouOverlay");
    const downloadButton = document.getElementById("downloadButton");
    const convertMoreButton = document.getElementById("convertMoreButton");

    const pdfName = document.querySelector(".metadata-form .input[placeholder='Document name']").value || "Converted PDF";
    const authorName = document.querySelector(".metadata-form .input[placeholder='Author name']").value || "";
    const subject = document.querySelector(".metadata-form .input[placeholder='Subject']").value || "";
    const keywords = document.querySelector(".metadata-form .input[placeholder='Keywords']").value || "";

    const pdfDoc = await PDFDocument.create();

    pdfDoc.setTitle(pdfName);
    pdfDoc.setAuthor(authorName);
    pdfDoc.setSubject(subject);
    pdfDoc.setKeywords([keywords]);

    for (const file of reorderedFiles) {
        const fileData = await fileToBase64(file);

        let img;
        if (file.type === "image/png") {
            img = await pdfDoc.embedPng(fileData);
        } else if (file.type === "image/jpeg" || file.type === "image/jpg") {
            img = await pdfDoc.embedJpg(fileData);
        } else {
            alert(`Unsupported image format: ${file.type}`);
            continue;
        }

        const imgWidth = img.width;
        const imgHeight = img.height;

        const pageWidth = 595.28; // A4 page width in points
        const scaledHeight = (pageWidth * imgHeight) / imgWidth;

        const page = pdfDoc.addPage([pageWidth, scaledHeight]);
        page.drawImage(img, {
            x: 0,
            y: 0,
            width: pageWidth,
            height: scaledHeight
        });
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });

    setTimeout(() => {
        if (loadingOverlay) loadingOverlay.style.display = "none";
        thankYouOverlay.style.display = "flex";

        downloadButton.addEventListener("click", () => {
            const downloadLink = document.createElement("a");
            downloadLink.href = URL.createObjectURL(blob);
            downloadLink.download = `${pdfName}.pdf`;
            downloadLink.click();
        });

        convertMoreButton.addEventListener("click", () => {
            thankYouOverlay.style.display = "none";
            window.location.reload();
        });
    }, 2000);
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = () => reject(new Error("Failed to convert file to Base64"));
        reader.readAsDataURL(file);
    });
}

const thankYouSlide = document.getElementById('thankYouOverlay');
const convertMoreButton = document.getElementById('convertMoreButton');

thankYouSlide.addEventListener('click', () => {
    convertMoreButton.click();
})
const hamburgerMenu = document.querySelector('.hamburger-menu');
const dropdownMenu = document.querySelector('.dropdown-menu');

hamburgerMenu.addEventListener('click', () => {
    dropdownMenu.classList.toggle('show');
});
createEmptyBoxes();
