import { formatBytes, showToast, downloadFile, loadImage } from './utils.js';

let originalImage = null;
let originalFile = null;
let upscaledBlob = null;
let upscaledDataUrl = null;
let upscaledCanvas = null;

export function initUpscaleModule() {
  const dropzone = document.getElementById('upscale-dropzone');
  const fileInput = document.getElementById('upscale-file-input');
  const emptyState = document.getElementById('upscale-empty-state');
  const previewSection = document.getElementById('upscale-preview-section');
  
  const scale2xBtn = document.getElementById('upscale-2x-btn');
  const scale4xBtn = document.getElementById('upscale-4x-btn');
  const sharpenSelect = document.getElementById('upscale-sharpen-level');
  const denoiseToggle = document.getElementById('upscale-denoise');
  const processBtn = document.getElementById('upscale-process-btn');
  const downloadBtn = document.getElementById('upscale-download-btn');
  const resetBtn = document.getElementById('upscale-reset-btn');

  // Slider elements
  const comparisonContainer = document.getElementById('upscale-comparison');
  const comparisonBefore = document.getElementById('upscale-comparison-before');
  const comparisonHandle = document.getElementById('upscale-handle');
  const beforeImg = document.getElementById('upscale-before-img');
  const afterImg = document.getElementById('upscale-after-img');

  let currentScale = 2;

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
      document.getElementById('upscale-orig-dim').textContent = `${originalImage.naturalWidth} x ${originalImage.naturalHeight} px`;
      document.getElementById('upscale-orig-size').textContent = formatBytes(file.size);
      
      beforeImg.src = originalImage.src;
      
      emptyState.classList.add('hidden');
      previewSection.classList.remove('hidden');
      downloadBtn.classList.add('hidden');

      // Auto start upscaling with default 2x
      runUpscale();
    } catch (err) {
      showToast('Gagal memuat gambar: ' + err.message, 'error');
    }
  }

  // Scale buttons
  scale2xBtn.addEventListener('click', () => {
    currentScale = 2;
    scale2xBtn.classList.remove('bg-slate-800', 'text-slate-300');
    scale2xBtn.classList.add('bg-indigo-600', 'text-white');
    scale4xBtn.classList.remove('bg-indigo-600', 'text-white');
    scale4xBtn.classList.add('bg-slate-800', 'text-slate-300');
    runUpscale();
  });

  scale4xBtn.addEventListener('click', () => {
    currentScale = 4;
    scale4xBtn.classList.remove('bg-slate-800', 'text-slate-300');
    scale4xBtn.classList.add('bg-indigo-600', 'text-white');
    scale2xBtn.classList.remove('bg-indigo-600', 'text-white');
    scale2xBtn.classList.add('bg-slate-800', 'text-slate-300');
    runUpscale();
  });

  sharpenSelect.addEventListener('change', () => runUpscale());
  denoiseToggle.addEventListener('change', () => runUpscale());
  processBtn.addEventListener('click', () => runUpscale());

  // High fidelity upscale with Unsharp Mask & Multi-step convolution
  function runUpscale() {
    if (!originalImage) return;

    processBtn.disabled = true;
    processBtn.innerHTML = `<span class="animate-spin inline-block mr-2">⚙️</span> Memproses Upscale...`;

    setTimeout(() => {
      const targetW = originalImage.naturalWidth * currentScale;
      const targetH = originalImage.naturalHeight * currentScale;

      // 1. Multi-step progressive upscaling for smoother gradients
      let canvas = document.createElement('canvas');
      canvas.width = originalImage.naturalWidth;
      canvas.height = originalImage.naturalHeight;
      let ctx = canvas.getContext('2d');
      ctx.drawImage(originalImage, 0, 0);

      let curW = originalImage.naturalWidth;
      let curH = originalImage.naturalHeight;

      // Upscale in gentle factors of 1.5x - 2x
      while (curW < targetW) {
        let nextW = Math.min(Math.round(curW * 1.5), targetW);
        let nextH = Math.min(Math.round(curH * 1.5), targetH);
        
        let tempCanvas = document.createElement('canvas');
        tempCanvas.width = nextW;
        tempCanvas.height = nextH;
        let tempCtx = tempCanvas.getContext('2d');
        tempCtx.imageSmoothingEnabled = true;
        tempCtx.imageSmoothingQuality = 'high';
        tempCtx.drawImage(canvas, 0, 0, nextW, nextH);
        
        canvas = tempCanvas;
        curW = nextW;
        curH = nextH;
      }

      ctx = canvas.getContext('2d');

      // 2. Unsharp Masking Kernel
      const sharpenStrength = parseFloat(sharpenSelect.value); // 0, 0.4, 0.8, 1.2
      if (sharpenStrength > 0) {
        applyUnsharpMask(ctx, canvas.width, canvas.height, sharpenStrength, denoiseToggle.checked);
      }

      upscaledCanvas = canvas;
      upscaledDataUrl = canvas.toDataURL('image/png');

      canvas.toBlob((blob) => {
        upscaledBlob = blob;
        afterImg.src = upscaledDataUrl;
        
        document.getElementById('upscale-res-dim').textContent = `${targetW} x ${targetH} px (${currentScale}x)`;
        document.getElementById('upscale-res-size').textContent = formatBytes(blob.size);

        downloadBtn.classList.remove('hidden');
        processBtn.disabled = false;
        processBtn.innerHTML = `<i data-lucide="sparkles" class="w-5 h-5 mr-2"></i> Terapkan Ulang`;
        if (window.lucide) window.lucide.createIcons({ root: processBtn });

        showToast(`Upscale ${currentScale}x selesai! Resolusi baru: ${targetW}x${targetH}px`, 'success');
      }, 'image/png');

    }, 50);
  }

  // Unsharp mask convolution filter on ImageData
  function applyUnsharpMask(ctx, w, h, amount, applyDenoise) {
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    const buff = new Uint8ClampedArray(data);

    // 3x3 Sharpen Kernel:
    //  0   -a   0
    // -a 1+4a  -a
    //  0   -a   0
    const a = amount * 0.35;
    const center = 1 + (4 * a);

    for (let y = 1; y < h - 1; y++) {
      const yOffset = y * w * 4;
      const yPrev = (y - 1) * w * 4;
      const yNext = (y + 1) * w * 4;

      for (let x = 1; x < w - 1; x++) {
        const idx = yOffset + (x * 4);
        const idxL = yOffset + ((x - 1) * 4);
        const idxR = yOffset + ((x + 1) * 4);
        const idxT = yPrev + (x * 4);
        const idxB = yNext + (x * 4);

        for (let c = 0; c < 3; c++) {
          let val = (buff[idx + c] * center) - (
            (buff[idxL + c] + buff[idxR + c] + buff[idxT + c] + buff[idxB + c]) * a
          );

          if (applyDenoise) {
            // slight clamp on micro-contrast to prevent noise amplification
            const diff = val - buff[idx + c];
            if (Math.abs(diff) < 4) {
              val = buff[idx + c];
            }
          }

          data[idx + c] = Math.min(255, Math.max(0, val));
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }

  // Interactive Comparison Slider
  let isDraggingSlider = false;
  function updateSliderPosition(clientX) {
    const rect = comparisonContainer.getBoundingClientRect();
    let posX = clientX - rect.left;
    if (posX < 0) posX = 0;
    if (posX > rect.width) posX = rect.width;
    const pct = (posX / rect.width) * 100;
    comparisonBefore.style.width = `${pct}%`;
    comparisonHandle.style.left = `${pct}%`;
  }

  comparisonHandle.addEventListener('mousedown', () => { isDraggingSlider = true; });
  window.addEventListener('mouseup', () => { isDraggingSlider = false; });
  window.addEventListener('mousemove', (e) => {
    if (isDraggingSlider) {
      updateSliderPosition(e.clientX);
    }
  });

  // Touch support for mobile
  comparisonHandle.addEventListener('touchstart', () => { isDraggingSlider = true; });
  window.addEventListener('touchend', () => { isDraggingSlider = false; });
  window.addEventListener('touchmove', (e) => {
    if (isDraggingSlider && e.touches[0]) {
      updateSliderPosition(e.touches[0].clientX);
    }
  });

  // Download action
  downloadBtn.addEventListener('click', () => {
    if (!upscaledBlob) return;
    const baseName = originalFile.name.substring(0, originalFile.name.lastIndexOf('.')) || 'image';
    const outputName = `${baseName}_upscaled_${currentScale}x_${upscaledCanvas.width}x${upscaledCanvas.height}.png`;
    downloadFile(upscaledBlob, outputName);
    showToast('Foto resolusi tinggi berhasil diunduh!', 'success');
  });

  resetBtn.addEventListener('click', () => {
    originalImage = null;
    originalFile = null;
    upscaledBlob = null;
    upscaledDataUrl = null;
    fileInput.value = '';
    previewSection.classList.add('hidden');
    emptyState.classList.remove('hidden');
  });
}
