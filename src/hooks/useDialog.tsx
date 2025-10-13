import { useState, useCallback } from 'react';
import { DialogType } from '../components/ui/Dialog';

interface DialogConfig {
  title: string;
  message: string;
  type?: DialogType;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

interface DialogState extends DialogConfig {
  isOpen: boolean;
  onConfirm?: () => void;
}

export const useDialog = () => {
  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });

  const showDialog = useCallback((config: DialogConfig & { onConfirm?: () => void }) => {
    setDialogState({
      isOpen: true,
      ...config,
    });
  }, []);

  const hideDialog = useCallback(() => {
    setDialogState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const showAlert = useCallback((title: string, message: string, type: DialogType = 'info') => {
    return new Promise<void>((resolve) => {
      setDialogState({
        isOpen: true,
        title,
        message,
        type,
        confirmText: 'OK',
        showCancel: false,
        onConfirm: () => {
          hideDialog();
          resolve();
        },
      });
    });
  }, [hideDialog]);

  const showConfirm = useCallback((title: string, message: string) => {
    return new Promise<boolean>((resolve) => {
      setDialogState({
        isOpen: true,
        title,
        message,
        type: 'confirm',
        confirmText: 'Confirmer',
        cancelText: 'Annuler',
        showCancel: true,
        onConfirm: () => {
          hideDialog();
          resolve(true);
        },
      });

      // Override onClose to resolve with false
      const originalOnClose = hideDialog;
      setDialogState(prev => ({
        ...prev,
        onConfirm: () => {
          originalOnClose();
          resolve(true);
        },
      }));
    });
  }, [hideDialog]);

  const handleClose = useCallback(() => {
    hideDialog();
  }, [hideDialog]);

  const handleConfirm = useCallback(() => {
    if (dialogState.onConfirm) {
      dialogState.onConfirm();
    } else {
      hideDialog();
    }
  }, [dialogState, hideDialog]);

  return {
    dialogState,
    showDialog,
    hideDialog,
    showAlert,
    showConfirm,
    handleClose,
    handleConfirm,
  };
};
