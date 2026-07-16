"use client";

import {
  Dialog,
  DialogOverlay,
  DialogContent,
  DialogClose,
} from "@/components/ui/dialog";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PropsWithChildren, useState } from "react";

type ModalProps = { path: string };

export function Modal({ children, path }: PropsWithChildren<ModalProps>) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(true);

  const handleClose = () => {
    setOpen(false);
    router.back();
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      handleClose();
    }
  };

  if (pathname !== path) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogOverlay className="border-2 border-red-500">
        <DialogContent className="max-h-96 border-2 border-amber-600">
          {children}
        </DialogContent>
      </DialogOverlay>
      <DialogClose>
        <Link href="">x</Link>
      </DialogClose>
    </Dialog>
  );
}
