import { Toaster as SonnerToaster, toast } from 'sonner';

export const Toaster = () => {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        className:
          '!bg-white !text-ink !border-hairline !shadow-lg !font-sans !rounded-lg',
      }}
    />
  );
};

export { toast };
