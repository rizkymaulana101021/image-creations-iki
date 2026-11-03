import { formatBytes, showToast, downloadFile, loadImage } from './utils.js';

let cropperInstance = null;
let originalFile = null;
let originalImage = null;
let scaleX = 1;
let scaleY = 1;

export function initCropModule() {
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

      // Initialize Cropper.js
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

  // Aspect ratio handlers
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

  // Rotation
  rotateLeftBtn.addEventListener('click', () => {
    if (cropperInstance) cropperInstance.rotate(-90);
  });
  rotateRightBtn.addEventListener('click', () => {
    if (cropperInstance) cropperInstance.rotate(90);
  });

  // Flip
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

  // Reset
  resetCropBtn.addEventListener('click', () => {
    if (cropperInstance) {
      scaleX = 1;
      scaleY = 1;
      cropperInstance.reset();
    }
  });

  // Download Cropped
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
