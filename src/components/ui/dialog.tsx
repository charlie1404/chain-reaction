import { Dialog as ChakraDialog, Portal } from '@chakra-ui/react';
import * as React from 'react';

export interface DialogRootProps extends ChakraDialog.RootProps {
  portalled?: boolean;
  portalRef?: React.RefObject<HTMLElement | null>;
}

export const DialogRoot = (props: DialogRootProps) => {
  const { portalled = true, portalRef, children, ...rest } = props;
  return (
    <ChakraDialog.Root {...rest}>
      <Portal disabled={!portalled} container={portalRef}>
        {children}
      </Portal>
    </ChakraDialog.Root>
  );
};

export const DialogBackdrop = ChakraDialog.Backdrop;
export const DialogPositioner = ChakraDialog.Positioner;
export const DialogContent = ChakraDialog.Content;
export const DialogHeader = ChakraDialog.Header;
export const DialogTitle = ChakraDialog.Title;
export const DialogDescription = ChakraDialog.Description;
export const DialogBody = ChakraDialog.Body;
export const DialogFooter = ChakraDialog.Footer;
export const DialogCloseTrigger = ChakraDialog.CloseTrigger;
export const DialogTrigger = ChakraDialog.Trigger;
export const DialogActionTrigger = ChakraDialog.ActionTrigger;
