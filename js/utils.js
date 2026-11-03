/**
 * Common Utility Functions for image-creations-iki
 */

// Format byte size to readable format (KB, MB)
export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Show Toast notification
export function showToast(message, type = 'info') {
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

  // Animate in
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  });

  // Animate out & remove
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Trigger browser download for Blob or DataURL
export function downloadFile(urlOrBlob, filename) {
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

// Load Image object from File or DataURL
export function loadImage(src) {
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
