// ── Stato ───────────────────────────────────────────
let prefixes = [];

// ── Elementi DOM ────────────────────────────────────
const prefixInput = document.getElementById("prefix-input");
const addPrefixBtn = document.getElementById("add-prefix-btn");
const prefixList = document.getElementById("prefix-list");
const prefixBadge = document.getElementById("prefix-badge");
const uploadJsonInput = document.getElementById("upload-json");
const downloadJsonBtn = document.getElementById("download-json-btn");

const qrInput = document.getElementById("qr-input");
const generateBtn = document.getElementById("generate-btn");
const qrGrid = document.getElementById("qr-grid");
const actionsDiv = document.getElementById("actions");
const downloadBtn = document.getElementById("download-btn");

// ══════════════════════════════════════════════════════
// ── GESTIONE PREFISSI ────────────────────────────────
// ══════════════════════════════════════════════════════

function updatePrefixUI() {
    // Aggiorna badge
    const n = prefixes.length;
    prefixBadge.textContent = n === 1 ? "1 prefix" : `${n} prefixes`;
    prefixBadge.classList.toggle("active", n > 0);

    // Abilita/disabilita download JSON
    downloadJsonBtn.disabled = n === 0;

    // Render chip
    prefixList.innerHTML = "";
    prefixes.forEach((p, i) => {
        const chip = document.createElement("div");
        chip.className = "prefix-chip";
        chip.innerHTML = `
            <span class="prefix-chip-text">${escapeHTML(p)}</span>
            <button class="prefix-chip-remove" type="button" title="Remove" data-index="${i}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        `;
        prefixList.appendChild(chip);
    });

    // Rigenera le card QR placeholder
    renderQRPlaceholders();
}

function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

function addPrefix(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    prefixes.push(trimmed);
    updatePrefixUI();
}

function removePrefix(index) {
    prefixes.splice(index, 1);
    updatePrefixUI();
}

// ── Aggiunta manuale ────────────────────────────────
addPrefixBtn.addEventListener("click", () => {
    addPrefix(prefixInput.value);
    prefixInput.value = "";
    prefixInput.focus();
});

prefixInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        addPrefix(prefixInput.value);
        prefixInput.value = "";
    }
});

// ── Rimozione chip ──────────────────────────────────
prefixList.addEventListener("click", (e) => {
    const btn = e.target.closest(".prefix-chip-remove");
    if (btn) {
        removePrefix(parseInt(btn.dataset.index));
    }
});

// ── Upload JSON ─────────────────────────────────────
uploadJsonInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const data = JSON.parse(ev.target.result);
            if (Array.isArray(data)) {
                prefixes = data.map(String);
            } else if (data.prefixes && Array.isArray(data.prefixes)) {
                prefixes = data.prefixes.map(String);
            } else {
                alert("Invalid JSON format. Expected an array or an object with a \"prefixes\" key.");
                return;
            }
            updatePrefixUI();
        } catch (err) {
            alert("Error reading JSON file:\n" + err.message);
        }
    };
    reader.readAsText(file);

    // Reset per permettere di ricaricare lo stesso file
    e.target.value = "";
});

// ── Download JSON ───────────────────────────────────
downloadJsonBtn.addEventListener("click", () => {
    if (prefixes.length === 0) return;

    const json = JSON.stringify({ prefixes: prefixes }, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const link = document.createElement("a");
    link.download = "qr_prefixes.json";
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
});

// ══════════════════════════════════════════════════════
// ── GENERAZIONE QR CODES ─────────────────────────────
// ══════════════════════════════════════════════════════

function renderQRPlaceholders() {
    qrGrid.innerHTML = "";
    actionsDiv.classList.add("hidden");

    // Aggiorna il numero di colonne in base al numero di prefissi
    const count = prefixes.length;
    if (count === 0) {
        qrGrid.innerHTML = '<p class="empty-state">Add at least one prefix to generate QR codes</p>';
        return;
    }

    // Adatta le colonne: max 4 per riga
    const cols = Math.min(count, 4);
    qrGrid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    prefixes.forEach((_, i) => {
        const card = document.createElement("div");
        card.className = "qr-card";
        card.id = `qr-card-${i}`;
        card.innerHTML = `
            <div class="qr-card-inner">
                <div class="qr-placeholder" id="qr-placeholder-${i}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <rect x="3" y="3" width="7" height="7" rx="1"/>
                        <rect x="14" y="3" width="7" height="7" rx="1"/>
                        <rect x="3" y="14" width="7" height="7" rx="1"/>
                        <circle cx="17.5" cy="17.5" r="2.5"/>
                    </svg>
                    <span>QR #${i + 1}</span>
                </div>
            </div>
            <div class="qr-label" id="qr-label-${i}">—</div>
        `;
        qrGrid.appendChild(card);
    });
}

function generateQRCodes() {
    const text = qrInput.value.trim();
    if (!text) {
        qrInput.focus();
        qrInput.style.outline = "2px solid #ec4899";
        setTimeout(() => (qrInput.style.outline = ""), 800);
        return;
    }

    if (prefixes.length === 0) {
        prefixInput.focus();
        prefixInput.style.outline = "2px solid #ec4899";
        setTimeout(() => (prefixInput.style.outline = ""), 800);
        return;
    }

    // Rigenera i placeholder prima (per pulire QR vecchi)
    renderQRPlaceholders();

    prefixes.forEach((prefix, i) => {
        const fullText = prefix + text;
        const cardInner = document.getElementById(`qr-card-${i}`).querySelector(".qr-card-inner");
        const placeholder = document.getElementById(`qr-placeholder-${i}`);
        const label = document.getElementById(`qr-label-${i}`);
        const card = document.getElementById(`qr-card-${i}`);

        // Nascondi il placeholder
        placeholder.style.display = "none";

        // Crea un wrapper per il QR
        const qrWrapper = document.createElement("div");
        qrWrapper.className = "qr-wrapper";
        cardInner.appendChild(qrWrapper);

        // Genera il QR code dentro il wrapper
        new QRCode(qrWrapper, {
            text: fullText,
            width: 300,
            height: 300,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.L,
        });

        // Aggiorna l'etichetta
        label.textContent = fullText;

        // Attiva lo stile della card con animazione
        card.classList.add("active");
        qrWrapper.classList.add("pop-in");
    });

    // Mostra il pulsante di download
    actionsDiv.classList.remove("hidden");
}

// ══════════════════════════════════════════════════════
// ── DOWNLOAD IMMAGINE COMBINATA ──────────────────────
// ══════════════════════════════════════════════════════

function downloadCombined() {
    const images = [];
    for (let i = 0; i < prefixes.length; i++) {
        const cardInner = document.getElementById(`qr-card-${i}`).querySelector(".qr-card-inner");
        const img = cardInner.querySelector(".qr-wrapper img");
        if (!img) return;
        images.push(img);
    }

    const padding = 40;
    const qrSize = 300;
    const count = images.length;
    const totalWidth = qrSize * count + padding * (count + 1);
    const totalHeight = qrSize + padding * 2;

    const combined = document.createElement("canvas");
    combined.width = totalWidth;
    combined.height = totalHeight;
    const ctx = combined.getContext("2d");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, totalWidth, totalHeight);

    images.forEach((img, i) => {
        const x = padding + i * (qrSize + padding);
        ctx.drawImage(img, x, padding, qrSize, qrSize);
    });

    const link = document.createElement("a");
    link.download = "qr_codes.png";
    link.href = combined.toDataURL("image/png");
    link.click();
}

// ══════════════════════════════════════════════════════
// ── EVENT LISTENERS & INIT ───────────────────────────
// ══════════════════════════════════════════════════════

generateBtn.addEventListener("click", generateQRCodes);
qrInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") generateQRCodes();
});
downloadBtn.addEventListener("click", downloadCombined);

// Init
updatePrefixUI();
