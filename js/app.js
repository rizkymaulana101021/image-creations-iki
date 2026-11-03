import { initResizeModule } from './resize.js';
import { initCropModule } from './crop.js';
import { initUpscaleModule } from './upscale.js';
import { initPdfModule } from './pdf.js';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Tab switching logic
  const navTabs = document.querySelectorAll('.nav-tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  function switchTab(targetId) {
    // Update button styles
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

    // Toggle panels
    tabContents.forEach(tab => {
      if (tab.id === targetId) {
        tab.classList.remove('hidden');
        tab.classList.add('animate-fadeIn');
      } else {
        tab.classList.add('hidden');
      }
    });

    // Refresh lucide icons in the visible tab if needed
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  navTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab);
    });
  });

  // Initialize all features
  initResizeModule();
  initCropModule();
  initUpscaleModule();
  initPdfModule();
});
