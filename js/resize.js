import { formatBytes, showToast, downloadFile, loadImage } from './utils.js';

let originalImage = null;
let originalFile = null;
let aspectRatio = 1;

export function initResizeModule() {
  const dropzone = document.getElementById('resize-dropzone');
  const fileInput = document.getElementById('resize-file-input');
  const configSection = document.getElementById('resize-config-section');
  const emptyState = document.getElementById('resize-empty-state');
  
  const widthInput = document.getElementById('resize-width');
  const heightInput = document.getElementById('resize-height');
  const lockAspect = document.getElementById('resize-lock-aspect');
  const percentButtons = document.querySelectorAll('.resize-pct-btn');
  const presetSelect = document.getElementById('resize-preset-select');
  const formatSelect = document.getElementById('resize-format');
  const qualitySlider = document.getElementById('resize-quality');
  const qualityVal = document.getElementById('resize-quality-val');
  const processBtn = document.getElementById('resize-process-btn');
  const previewImg = document.getElementById('resize-preview-img');
  const resetBtn = document.getElementById('resize-reset-btn');

  // Drag and drop events
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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  });

  async function handleFile(file) {
    if (!file.type.startsWith('image/')) {
      showToast('File harus berupa gambar (JPG, PNG, WebP)', 'error');
      return;
    }
    originalFile = file;
    try {
      originalImage = await loadImage(file);
      aspectRatio = originalImage.naturalWidth / originalImage.naturalHeight;

      // Update UI
      document.getElementById('resize-orig-dim').textContent = `${originalImage.naturalWidth} x ${originalImage.naturalHeight} px`;
      document.getElementById('resize-orig-size').textContent = formatBytes(file.size);
      document.getElementById('resize-orig-name').textContent = file.name;
      
      widthInput.value = originalImage.naturalWidth;
      heightInput.value = originalImage.naturalHeight;

      emptyState.classList.add('hidden');
      configSection.classList.remove('hidden');
      updatePreview();
      showToast('Gambar berhasil dimuat', 'success');
    } catch (err) {
      showToast('Gagal memuat gambar: ' + err.message, 'error');
    }
  }

  // Width & Height change handlers
  widthInput.addEventListener('input', () => {
    if (lockAspect.checked && originalImage) {
      const w = parseInt(widthInput.value) || 1;
      heightInput.value = Math.round(w / aspectRatio);
    }
    updatePreview();
  });

  heightInput.addEventListener('input', () => {
    if (lockAspect.checked && originalImage) {
      const h = parseInt(heightInput.value) || 1;
      widthInput.value = Math.round(h * aspectRatio);
    }
    updatePreview();
  });

  // Percentage quick buttons
  percentButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (!originalImage) return;
      const pct = parseFloat(btn.dataset.pct);
      widthInput.value = Math.round(originalImage.naturalWidth * pct);
      heightInput.value = Math.round(originalImage.naturalHeight * pct);
      updatePreview();
    });
  });

  // Presets
  presetSelect.addEventListener('change', (e) => {
    if (!e.target.value || !originalImage) return;
    const [w, h] = e.target.value.split('x').map(Number);
    widthInput.value = w;
    heightInput.value = h;
    lockAspect.checked = false;
    updatePreview();
  });

  // Quality Slider
  qualitySlider.addEventListener('input', (e) => {
    qualityVal.textContent = `${e.target.value}%`;
    updatePreview();
  });

  formatSelect.addEventListener('change', () => {
    // Quality only affects jpeg/webp
    const isJpegOrWebp = ['image/jpeg', 'image/webp'].includes(formatSelect.value);
    qualitySlider.disabled = !isJpegOrWebp;
    document.getElementById('resize-quality-container').style.opacity = isJpegOrWebp ? '1' : '0.5';
    updatePreview();
  });

  let previewDebounce = null;
  function updatePreview() {
    clearTimeout(previewDebounce);
    previewDebounce = setTimeout(() => {
      renderResizedCanvas((blob, dataUrl) => {
        previewImg.src = dataUrl;
        document.getElementById('resize-new-dim').textContent = `${widthInput.value} x ${heightInput.value} px`;
        document.getElementById('resize-new-size').textContent = formatBytes(blob.size);
      });
    }, 200);
  }

  // High quality step-down resize algorithm
  function renderResizedCanvas(callback) {
    if (!originalImage) return;
    const targetW = Math.max(1, parseInt(widthInput.value) || originalImage.naturalWidth);
    const targetH = Math.max(1, parseInt(heightInput.value) || originalImage.naturalHeight);

    let curW = originalImage.naturalWidth;
    let curH = originalImage.naturalHeight;

    // Use stepped downsampling for superior smoothness and clarity
    let canvas = document.createElement('canvas');
    canvas.width = curW;
    canvas.height = curH;
    let ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(originalImage, 0, 0, curW, curH);

    // If downscaling significantly, step down by halves
    while (curW * 0.5 > targetW && curH * 0.5 > targetH) {
      curW = Math.round(curW * 0.5);
      curH = Math.round(curH * 0.5);
      const stepCanvas = document.createElement('canvas');
      stepCanvas.width = curW;
      stepCanvas.height = curH;
      const stepCtx = stepCanvas.getContext('2d');
      stepCtx.imageSmoothingEnabled = true;
      stepCtx.imageSmoothingQuality = 'high';
      stepCtx.drawImage(canvas, 0, 0, curW, curH);
      canvas = stepCanvas;
    }

    // Final target canvas
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = targetW;
    finalCanvas.height = targetH;
    const finalCtx = finalCanvas.getContext('2d');
    finalCtx.imageSmoothingEnabled = true;
    finalCtx.imageSmoothingQuality = 'high';
    finalCtx.drawImage(canvas, 0, 0, targetW, targetH);

    const mime = formatSelect.value;
    const quality = parseFloat(qualitySlider.value) / 100;

    finalCanvas.toBlob((blob) => {
      const dataUrl = finalCanvas.toDataURL(mime, quality);
      callback(blob, dataUrl);
    }, mime, quality);
  }

  // Download Action
  processBtn.addEventListener('click', () => {
    if (!originalImage) return;
    processBtn.disabled = true;
    processBtn.innerHTML = `<span class="animate-spin inline-block mr-2">⏳</span> Memproses...`;

    renderResizedCanvas((blob) => {
      const ext = formatSelect.value.split('/')[1];
      const baseName = originalFile.name.substring(0, originalFile.name.lastIndexOf('.')) || 'image';
      const outputName = `${baseName}_resized_${widthInput.value}x${heightInput.value}.${ext}`;
      
      downloadFile(blob, outputName);
      showToast('Gambar berhasil di-resize dan diunduh!', 'success');

      processBtn.disabled = false;
      processBtn.innerHTML = `<i data-lucide="download" class="w-5 h-5 mr-2"></i> Unduh Hasil Resize`;
      if (window.lucide) window.lucide.createIcons({ root: processBtn });
    });
  });

  resetBtn.addEventListener('click', () => {
    originalImage = null;
    originalFile = null;
    fileInput.value = '';
    emptyState.classList.remove('hidden');
    configSection.classList.add('hidden');
  });
}
