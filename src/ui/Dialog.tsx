import React from 'react';
import * as DialogPrimitives from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './Button';

export const Dialog = DialogPrimitives.Root;
export const DialogTrigger = DialogPrimitives.Trigger;
export const DialogClose = DialogPrimitives.Close;

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitives.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitives.Content> & { title?: string; description?: string }
>(({ className, children, title, description, ...props }, ref) => (
  <DialogPrimitives.Portal>
    <DialogPrimitives.Overlay className="fixed inset-0 z-50 bg-navy-950/40 backdrop-blur-xs transition-opacity duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
    <DialogPrimitives.Content
      ref={ref}
      className={cn(
        'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 rounded-xl border border-hairline bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        className
      )}
      {...props}
    >
      {(title || description) && (
        <div className="flex flex-col space-y-1 text-left">
          {title && (
            <DialogPrimitives.Title className="font-serif text-xl font-semibold text-navy-900">
              {title}
            </DialogPrimitives.Title>
          )}
          {description && (
            <DialogPrimitives.Description className="text-sm text-ink-muted">
              {description}
            </DialogPrimitives.Description>
          )}
        </div>
      )}
      {children}
      <DialogPrimitives.Close className="absolute right-4 top-4 rounded-full p-1.5 text-ink-muted transition-colors hover:bg-paper-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500">
        <X className="h-4 w-4" />
        <span className="sr-only">Cerrar</span>
      </DialogPrimitives.Close>
    </DialogPrimitives.Content>
  </DialogPrimitives.Portal>
));

DialogContent.displayName = DialogPrimitives.Content.displayName;

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  children?: React.ReactNode;
  onConfirm: () => any;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  children,
  onConfirm,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={title} description={description} className="max-h-[90vh] overflow-y-auto">
        {children}
        <div className="mt-4 flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={async () => {
              const res = await onConfirm();
              if (res !== false) {
                onOpenChange(false);
              }
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
