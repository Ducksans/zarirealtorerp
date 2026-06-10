import { useToastStore, ToastType } from '@/store/toastStore';

export const toast = (message: string, type: ToastType = 'info') => {
  useToastStore.getState().addToast(message, type);
};

export const toastError = (message: string) => toast(message, 'error');
export const toastSuccess = (message: string) => toast(message, 'success');
export const toastInfo = (message: string) => toast(message, 'info');
