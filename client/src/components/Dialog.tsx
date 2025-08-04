import * as RadixDialog from "@radix-ui/react-dialog";
import React from "react";

const Dialog: React.FC<
  React.PropsWithChildren<{
    required?: boolean;
    open?: boolean;
    setOpen?: (open: boolean) => void;
    title?: string;
    description?: string;
    trigger?: React.ReactNode;
    close?: React.ReactNode;
  }>
> = ({
  children,
  required = false,
  open = false,
  setOpen = () => {},
  trigger = null,
  title,
  description,
  close = null,
}) => {
  return (
    <RadixDialog.Root
      open={open}
      onOpenChange={(isOpen) => {
        if (!required) {
          setOpen(isOpen);
        }
      }}
    >
      {trigger && <RadixDialog.Trigger asChild>{trigger}</RadixDialog.Trigger>}
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 bg-black/20 z-100 backdrop-blur-md" />
        <RadixDialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-300/10 p-4 rounded-xl shadow-xl w-[90vw] max-w-md z-100 backdrop-blur-md">
          {title && (
            <RadixDialog.Title className="text-xl leading-none">
              {title}
            </RadixDialog.Title>
          )}
          {description && (
            <RadixDialog.Description>{description}</RadixDialog.Description>
          )}
          {children}
          {close && <RadixDialog.Close asChild>{close}</RadixDialog.Close>}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
};

export default Dialog;
