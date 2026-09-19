import Swal from 'sweetalert2';

export async function confirmAction(title: string, text: string, confirmText = 'Yes, do it!'): Promise<boolean> {
  const result = await Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#198754',
    cancelButtonColor: '#6c757d',
    confirmButtonText: confirmText,
    reverseButtons: true,
  });
  return result.isConfirmed;
}

export function successToast(message: string): void {
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'success',
    title: message,
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  });
}

export function errorToast(message: string): void {
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'error',
    title: message,
    showConfirmButton: false,
    timer: 4000,
    timerProgressBar: true,
  });
}

export function infoToast(message: string): void {
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: 'info',
    title: message,
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  });
}

export async function confirmDelete(entityName: string): Promise<boolean> {
  return confirmAction(
    `Delete ${entityName}?`,
    `This action cannot be undone. The ${entityName} will be permanently deleted.`,
    'Yes, delete it!'
  );
}
