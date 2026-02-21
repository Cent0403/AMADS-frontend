import { createContext, useCallback, useContext, useState } from 'react';

export type ConfirmVariant = 'default' | 'danger';

type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
};

type ConfirmState = ConfirmOptions & {
  open: boolean;
  resolve: (value: boolean) => void;
};

type ConfirmContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConfirmState | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({
        ...options,
        open: true,
        resolve,
      });
    });
  }, []);

  const handleClose = useCallback(
    (result: boolean) => {
      state?.resolve(result);
      setState(null);
    },
    [state]
  );

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state?.open && (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          aria-describedby="confirm-desc"
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="confirm-title" className="text-lg font-semibold text-gray-900 mb-2">
              {state.title}
            </h2>
            <p id="confirm-desc" className="text-gray-600 text-sm mb-6">
              {state.message}
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => handleClose(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {state.cancelLabel ?? 'Cancelar'}
              </button>
              <button
                type="button"
                onClick={() => handleClose(true)}
                className={
                  state.variant === 'danger'
                    ? 'px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700'
                    : 'px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700'
                }
              >
                {state.confirmLabel ?? 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm debe usarse dentro de ConfirmProvider');
  return ctx;
}
