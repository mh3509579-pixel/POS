import './styles/main.css';
import { initApp } from './app';
import { medicineStore } from './stores/medicine.store';

document.addEventListener('DOMContentLoaded', async () => {
  medicineStore.loadMedicines().catch(() => {
    console.warn('Failed to load medicines, continuing without them');
  });
  initApp();
});
