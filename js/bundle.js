/**
 * ImageCreations Iki - Complete Client-Side Application Bundle
 * Runs 100% locally in browser (supports both file:// and https:// GitHub Pages)
 */

(function () {
  'use strict';

  // ==========================================
  // 1. UTILITY FUNCTIONS
  // ==========================================
  function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const bgColors = {
      info: 'bg-slate-800 border-indigo-500 text-indigo-200',
      success: 'bg-slate-800 border-emerald-500 text-emerald-200',
      error: 'bg-slate-800 border-rose-500 text-rose-200',
      warning: 'bg-slate-800 border-amber-500 text-amber-200'
    };

    const icons = {
      info: '<i data-lucide="info" class="w-5 h-5 text-indigo-400"></i>',
      success: '<i data-lucide="check-circle" class="w-5 h-5 text-emerald-400"></i>',
      error: '<i data-lucide="alert-circle" class="w-5 h-5 text-rose-400"></i>',
      warning: '<i data-lucide="alert-triangle" class="w-5 h-5 text-amber-400"></i>'
    };

    toast.className = `flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl transition-all duration-300 transform translate-y-2 opacity-0 pointer-events-auto ${bgColors[type] || bgColors.info}`;
    toast.innerHTML = `
      ${icons[type] || icons.info}
      <span class="text-sm font-medium text-slate-100">${message}</span>
    `;

    container.appendChild(toast);
    if (window.lucide) window.lucide.createIcons({ root: toast });

    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    });

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function downloadFile(urlOrBlob, filename) {
    const link = document.createElement('a');
    if (typeof urlOrBlob === 'string') {
      link.href = urlOrBlob;
    } else {
      link.href = URL.createObjectURL(urlOrBlob);
    }
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (typeof urlOrBlob !== 'string') {
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    }
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      if (typeof src === 'string') {
        img.src = src;
      } else {
        img.src = URL.createObjectURL(src);
      }
    });
  }

  // ==========================================
  // 2. RESIZE MODULE
  // ==========================================
  function initResizeModule() {
    let originalImage = null;
    let originalFile = null;
    let aspectRatio = 1;

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

    if (!dropzone) return;

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

    dropzone.addEventListener('click', (e) => {
      if (e.target !== fileInput) fileInput.click();
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

    percentButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        if (!originalImage) return;
        const pct = parseFloat(btn.dataset.pct);
        widthInput.value = Math.round(originalImage.naturalWidth * pct);
        heightInput.value = Math.round(originalImage.naturalHeight * pct);
        updatePreview();
      });
    });

    presetSelect.addEventListener('change', (e) => {
      if (!e.target.value || !originalImage) return;
      const [w, h] = e.target.value.split('x').map(Number);
      widthInput.value = w;
      heightInput.value = h;
      lockAspect.checked = false;
      updatePreview();
    });

    qualitySlider.addEventListener('input', (e) => {
      qualityVal.textContent = `${e.target.value}%`;
      updatePreview();
    });

    formatSelect.addEventListener('change', () => {
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

    function renderResizedCanvas(callback) {
      if (!originalImage) return;
      const targetW = Math.max(1, parseInt(widthInput.value) || originalImage.naturalWidth);
      const targetH = Math.max(1, parseInt(heightInput.value) || originalImage.naturalHeight);

      let curW = originalImage.naturalWidth;
      let curH = originalImage.naturalHeight;

      let canvas = document.createElement('canvas');
      canvas.width = curW;
      canvas.height = curH;
      let ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(originalImage, 0, 0, curW, curH);

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

  // ==========================================
  // 3. CROP / CUT MODULE
  // ==========================================
  function initCropModule() {
    let cropperInstance = null;
    let originalFile = null;
    let scaleX = 1;
    let scaleY = 1;

    const dropzone = document.getElementById('crop-dropzone');
    const fileInput = document.getElementById('crop-file-input');
    const emptyState = document.getElementById('crop-empty-state');
    const editorSection = document.getElementById('crop-editor-section');
    const imageElement = document.getElementById('crop-target-image');
    
    const ratioButtons = document.querySelectorAll('.crop-ratio-btn');
    const rotateLeftBtn = document.getElementById('crop-rotate-left');
    const rotateRightBtn = document.getElementById('crop-rotate-right');
    const flipHBtn = document.getElementById('crop-flip-h');
    const flipVBtn = document.getElementById('crop-flip-v');
    const resetCropBtn = document.getElementById('crop-reset-all');
    const downloadBtn = document.getElementById('crop-download-btn');
    const formatSelect = document.getElementById('crop-format');
    const dimBadge = document.getElementById('crop-dimension-badge');
    const cancelBtn = document.getElementById('crop-cancel-btn');

    if (!dropzone) return;

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

    dropzone.addEventListener('click', (e) => {
      if (e.target !== fileInput) fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0]);
      }
    });

    function handleFile(file) {
      if (!file.type.startsWith('image/')) {
        showToast('File harus berupa gambar (JPG, PNG, WebP)', 'error');
        return;
      }
      originalFile = file;

      const reader = new FileReader();
      reader.onload = (e) => {
        imageElement.src = e.target.result;
        emptyState.classList.add('hidden');
        editorSection.classList.remove('hidden');

        if (cropperInstance) {
          cropperInstance.destroy();
        }

        scaleX = 1;
        scaleY = 1;

        cropperInstance = new Cropper(imageElement, {
          viewMode: 1,
          dragMode: 'move',
          autoCropArea: 0.85,
          restore: false,
          guides: true,
          center: true,
          highlight: true,
          cropBoxMovable: true,
          cropBoxResizable: true,
          toggleDragModeOnDblclick: false,
          crop(event) {
            const w = Math.round(event.detail.width);
            const h = Math.round(event.detail.height);
            dimBadge.textContent = `${w} x ${h} px`;
          }
        });

        showToast('Gambar siap untuk dipotong (crop)', 'success');
      };
      reader.readAsDataURL(file);
    }

    ratioButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        if (!cropperInstance) return;
        ratioButtons.forEach(b => {
          b.classList.remove('bg-indigo-600', 'text-white');
          b.classList.add('bg-slate-800', 'text-slate-300');
        });
        btn.classList.remove('bg-slate-800', 'text-slate-300');
        btn.classList.add('bg-indigo-600', 'text-white');

        const ratio = btn.dataset.ratio;
        if (ratio === 'free') {
          cropperInstance.setAspectRatio(NaN);
        } else {
          const [w, h] = ratio.split(':').map(Number);
          cropperInstance.setAspectRatio(w / h);
        }
      });
    });

    rotateLeftBtn.addEventListener('click', () => {
      if (cropperInstance) cropperInstance.rotate(-90);
    });
    rotateRightBtn.addEventListener('click', () => {
      if (cropperInstance) cropperInstance.rotate(90);
    });

    flipHBtn.addEventListener('click', () => {
      if (!cropperInstance) return;
      scaleX = -scaleX;
      cropperInstance.scaleX(scaleX);
    });
    flipVBtn.addEventListener('click', () => {
      if (!cropperInstance) return;
      scaleY = -scaleY;
      cropperInstance.scaleY(scaleY);
    });

    resetCropBtn.addEventListener('click', () => {
      if (cropperInstance) {
        scaleX = 1;
        scaleY = 1;
        cropperInstance.reset();
      }
    });

    downloadBtn.addEventListener('click', () => {
      if (!cropperInstance) return;
      downloadBtn.disabled = true;
      downloadBtn.innerHTML = `<span class="animate-spin inline-block mr-2">⏳</span> Mengambil Hasil...`;

      const format = formatSelect.value;
      const quality = 0.92;

      const croppedCanvas = cropperInstance.getCroppedCanvas({
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high'
      });

      if (!croppedCanvas) {
        showToast('Gagal memotong gambar', 'error');
        downloadBtn.disabled = false;
        return;
      }

      croppedCanvas.toBlob((blob) => {
        const ext = format.split('/')[1];
        const baseName = originalFile.name.substring(0, originalFile.name.lastIndexOf('.')) || 'image';
        const outputName = `${baseName}_cropped_${croppedCanvas.width}x${croppedCanvas.height}.${ext}`;

        downloadFile(blob, outputName);
        showToast(`Hasil crop (${formatBytes(blob.size)}) berhasil diunduh!`, 'success');

        downloadBtn.disabled = false;
        downloadBtn.innerHTML = `<i data-lucide="download" class="w-5 h-5 mr-2"></i> Unduh Hasil Potong`;
        if (window.lucide) window.lucide.createIcons({ root: downloadBtn });
      }, format, quality);
    });

    cancelBtn.addEventListener('click', () => {
      if (cropperInstance) {
        cropperInstance.destroy();
        cropperInstance = null;
      }
      fileInput.value = '';
      originalFile = null;
      editorSection.classList.add('hidden');
      emptyState.classList.remove('hidden');
    });
  }

  // ==========================================
  // 4. UPSCALER MODULE
  // ==========================================
  function initUpscaleModule() {
    let originalImage = null;
    let originalFile = null;
    let upscaledBlob = null;
    let upscaledDataUrl = null;
    let upscaledCanvas = null;
    let currentScale = 2;

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

    const comparisonContainer = document.getElementById('upscale-comparison');
    const comparisonBefore = document.getElementById('upscale-comparison-before');
    const comparisonHandle = document.getElementById('upscale-handle');
    const beforeImg = document.getElementById('upscale-before-img');
    const afterImg = document.getElementById('upscale-after-img');

    if (!dropzone) return;

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

    dropzone.addEventListener('click', (e) => {
      if (e.target !== fileInput) fileInput.click();
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

        runUpscale();
      } catch (err) {
        showToast('Gagal memuat gambar: ' + err.message, 'error');
      }
    }

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

    function runUpscale() {
      if (!originalImage) return;

      processBtn.disabled = true;
      processBtn.innerHTML = `<span class="animate-spin inline-block mr-2">⚙️</span> Memproses Upscale...`;

      setTimeout(() => {
        const targetW = originalImage.naturalWidth * currentScale;
        const targetH = originalImage.naturalHeight * currentScale;

        let canvas = document.createElement('canvas');
        canvas.width = originalImage.naturalWidth;
        canvas.height = originalImage.naturalHeight;
        let ctx = canvas.getContext('2d');
        ctx.drawImage(originalImage, 0, 0);

        let curW = originalImage.naturalWidth;
        let curH = originalImage.naturalHeight;

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

        const sharpenStrength = parseFloat(sharpenSelect.value);
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

    function applyUnsharpMask(ctx, w, h, amount, applyDenoise) {
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;
      const buff = new Uint8ClampedArray(data);

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

    comparisonHandle.addEventListener('touchstart', () => { isDraggingSlider = true; });
    window.addEventListener('touchend', () => { isDraggingSlider = false; });
    window.addEventListener('touchmove', (e) => {
      if (isDraggingSlider && e.touches[0]) {
        updateSliderPosition(e.touches[0].clientX);
      }
    });

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

  // ==========================================
  // 5. JPG/PNG TO PDF MODULE
  // ==========================================
  function initPdfModule() {
    let imageQueue = [];

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

    if (!dropzone) return;

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

    dropzone.addEventListener('click', (e) => {
      if (e.target !== fileInput) fileInput.click();
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
        const pageSize = pageSizeSelect.value;
        const orientationSetting = orientationSelect.value;
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

          let pWidth = 210;
          let pHeight = 297;
          if (pageSize === 'letter') {
            pWidth = 215.9;
            pHeight = 279.4;
          } else if (pageSize === 'fit') {
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

  // ==========================================
  // 6. MAIN CONTROLLER & TAB SWITCHER
  // ==========================================
  document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) {
      window.lucide.createIcons();
    }

    const navTabs = document.querySelectorAll('.nav-tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    function switchTab(targetId) {
      navTabs.forEach(btn => {
        const isTarget = btn.dataset.tab === targetId;
        if (isTarget) {
          btn.classList.add('bg-indigo-600', 'text-white', 'shadow-lg', 'shadow-indigo-500/30');
          btn.classList.remove('text-slate-400', 'hover:text-slate-200', 'hover:bg-slate-800/60');
        } else {
          btn.classList.remove('bg-indigo-600', 'text-white', 'shadow-lg', 'shadow-indigo-500/30');
          btn.classList.add('text-slate-400', 'hover:text-slate-200', 'hover:bg-slate-800/60');
        }
      });

      tabContents.forEach(tab => {
        if (tab.id === targetId) {
          tab.classList.remove('hidden');
        } else {
          tab.classList.add('hidden');
        }
      });

      if (window.lucide) {
        window.lucide.createIcons();
      }
    }

    navTabs.forEach(btn => {
      btn.addEventListener('click', () => {
        switchTab(btn.dataset.tab);
      });
    });

    initResizeModule();
    initCropModule();
    initUpscaleModule();
    initPdfModule();
  });

})();
