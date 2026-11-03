import { formatBytes, showToast, downloadFile, loadImage } from './utils.js';

let imageQueue = []; // array of { id, file, imgObj, dataUrl, width, height }

export function initPdfModule() {
  const dropzone = document.getElementById('pdf-dropzone');
  const fileInput = document.getElementById('pdf-file-input');
  const addMoreInput = document.getElementById('pdf-add-more-input');
  const emptyState = document.getElementById('pdf-empty-state');
  const editorSection = document.getElementById('pdf-editor-section');
  const itemsContainer = document.getElementById('pdf-items-container');
  const countBadge = document.getElementById('pdf-count-badge');
  const clearAllBtn = document.getElementById('pdf-clear-all-btn');
  const generateBtn = document.getElementById('pdf-generate-btn');

  const pageSizeSelect = document.getElementById('pdf-page-size');
  const orientationSelect = document.getElementById('pdf-orientation');
  const marginSelect = document.getElementById('pdf-margin');
  const fileNameInput = document.getElementById('pdf-filename');

  // Drag and drop setup
  ['dragenter', 'dragover'].forEach(name => {
    dropzone.addEventListener(name, (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(name => {
    dropzone.addEventListener(name, (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  });

  addMoreInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  });

  async function handleFiles(files) {
    const validFiles = files.filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      showToast('Silakan pilih file gambar (JPG, PNG, WebP)', 'error');
      return;
    }

    showToast(`Memuat ${validFiles.length} gambar...`, 'info');

    for (const file of validFiles) {
      try {
        const imgObj = await loadImage(file);
        const reader = new FileReader();
        await new Promise((resolve) => {
          reader.onload = (e) => {
            imageQueue.push({
              id: 'img_' + Math.random().toString(36).substr(2, 9),
              file: file,
              imgObj: imgObj,
              dataUrl: e.target.result,
              width: imgObj.naturalWidth,
              height: imgObj.naturalHeight
            });
            resolve();
          };
          reader.readAsDataURL(file);
        });
      } catch (err) {
        console.error('Error loading image', err);
      }
    }

    renderImageList();
    showToast(`${imageQueue.length} gambar siap dikonversi ke PDF`, 'success');
  }

  function renderImageList() {
    if (imageQueue.length === 0) {
      emptyState.classList.remove('hidden');
      editorSection.classList.add('hidden');
      return;
    }

    emptyState.classList.add('hidden');
    editorSection.classList.remove('hidden');
    countBadge.textContent = `${imageQueue.length} Foto`;

    itemsContainer.innerHTML = '';
    imageQueue.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'flex items-center gap-4 p-3 bg-slate-900/60 rounded-xl border border-slate-700/60 hover:border-indigo-500/50 transition-all';
      card.innerHTML = `
        <span class="flex-shrink-0 w-7 h-7 flex items-center justify-center bg-indigo-900/60 text-indigo-300 text-xs font-bold rounded-lg border border-indigo-700/50">
          ${index + 1}
        </span>
        <img src="${item.dataUrl}" alt="Preview" class="w-14 h-14 object-cover rounded-lg border border-slate-700">
        <div class="flex-grow min-w-0">
          <p class="text-sm font-semibold text-slate-200 truncate">${item.file.name}</p>
          <p class="text-xs text-slate-400">${item.width} x ${item.height} px • ${formatBytes(item.file.size)}</p>
        </div>
        <div class="flex items-center gap-1">
          <button data-action="up" data-index="${index}" ${index === 0 ? 'disabled' : ''} class="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none rounded hover:bg-slate-800 transition">
            <i data-lucide="arrow-up" class="w-4 h-4"></i>
          </button>
          <button data-action="down" data-index="${index}" ${index === imageQueue.length - 1 ? 'disabled' : ''} class="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none rounded hover:bg-slate-800 transition">
            <i data-lucide="arrow-down" class="w-4 h-4"></i>
          </button>
          <button data-action="delete" data-index="${index}" class="p-1.5 text-rose-400 hover:text-rose-300 rounded hover:bg-rose-950/40 transition">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>
      `;
      itemsContainer.appendChild(card);
    });

    if (window.lucide) window.lucide.createIcons({ root: itemsContainer });
  }

  // Handle reorder & delete clicks
  itemsContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const index = parseInt(btn.dataset.index);

    if (action === 'up' && index > 0) {
      const temp = imageQueue[index];
      imageQueue[index] = imageQueue[index - 1];
      imageQueue[index - 1] = temp;
      renderImageList();
    } else if (action === 'down' && index < imageQueue.length - 1) {
      const temp = imageQueue[index];
      imageQueue[index] = imageQueue[index + 1];
      imageQueue[index + 1] = temp;
      renderImageList();
    } else if (action === 'delete') {
      imageQueue.splice(index, 1);
      renderImageList();
    }
  });

  clearAllBtn.addEventListener('click', () => {
    imageQueue = [];
    fileInput.value = '';
    addMoreInput.value = '';
    renderImageList();
  });

  // Generate PDF via jsPDF
  generateBtn.addEventListener('click', async () => {
    if (imageQueue.length === 0) {
      showToast('Belum ada gambar yang dimasukkan', 'warning');
      return;
    }

    if (!window.jspdf || !window.jspdf.jsPDF) {
      showToast('Pustaka jsPDF belum siap dimuat', 'error');
      return;
    }

    generateBtn.disabled = true;
    generateBtn.innerHTML = `<span class="animate-spin inline-block mr-2">⏳</span> Mengonversi ke PDF...`;

    try {
      const pageSize = pageSizeSelect.value; // 'a4', 'letter', 'fit'
      const orientationSetting = orientationSelect.value; // 'auto', 'p', 'l'
      const marginMm = parseInt(marginSelect.value) || 0;
      const { jsPDF } = window.jspdf;

      let doc = null;

      for (let i = 0; i < imageQueue.length; i++) {
        const item = imageQueue[i];
        const isLandscape = item.width > item.height;

        let pageOrient = 'p';
        if (orientationSetting === 'auto') {
          pageOrient = isLandscape ? 'l' : 'p';
        } else {
          pageOrient = orientationSetting;
        }

        // Standard Page dimensions in mm
        let pWidth = 210;
        let pHeight = 297;
        if (pageSize === 'letter') {
          pWidth = 215.9;
          pHeight = 279.4;
        } else if (pageSize === 'fit') {
          // 1px approx 0.264583 mm
          pWidth = Math.round(item.width * 0.264583);
          pHeight = Math.round(item.height * 0.264583);
          pageOrient = isLandscape ? 'l' : 'p';
        }

        if (pageSize !== 'fit') {
          if (pageOrient === 'l') {
            const temp = pWidth;
            pWidth = pHeight;
            pHeight = temp;
          }
        }

        if (i === 0) {
          doc = new jsPDF({
            orientation: pageOrient,
            unit: 'mm',
            format: pageSize === 'fit' ? [pWidth, pHeight] : pageSize
          });
        } else {
          doc.addPage(pageSize === 'fit' ? [pWidth, pHeight] : pageSize, pageOrient);
        }

        // Calculate image placement with margins
        const availWidth = Math.max(10, pWidth - (marginMm * 2));
        const availHeight = Math.max(10, pHeight - (marginMm * 2));

        const imgRatio = item.width / item.height;
        const availRatio = availWidth / availHeight;

        let finalW = availWidth;
        let finalH = availHeight;

        if (imgRatio > availRatio) {
          finalW = availWidth;
          finalH = availWidth / imgRatio;
        } else {
          finalH = availHeight;
          finalW = availHeight * imgRatio;
        }

        const posX = marginMm + ((availWidth - finalW) / 2);
        const posY = marginMm + ((availHeight - finalH) / 2);

        // Add image to PDF
        const format = item.file.type.includes('png') ? 'PNG' : 'JPEG';
        doc.addImage(item.dataUrl, format, posX, posY, finalW, finalH);
      }

      const outName = (fileNameInput.value.trim() || 'dokumen_gambar') + '.pdf';
      doc.save(outName);

      if (window.confetti) {
        window.confetti({ particleCount: 75, spread: 60, origin: { y: 0.8 } });
      }

      showToast(`File PDF berhasil dibuat: ${outName}`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Terjadi kesalahan saat membuat PDF: ' + err.message, 'error');
    } finally {
      generateBtn.disabled = false;
      generateBtn.innerHTML = `<i data-lucide="file-check-2" class="w-5 h-5 mr-2"></i> Konversi & Unduh PDF`;
      if (window.lucide) window.lucide.createIcons({ root: generateBtn });
    }
  });
}
