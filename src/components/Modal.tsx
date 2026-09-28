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

import { cn } from "@/lib/utils";

type ModalProps = { path: string; className?: string };

export function Modal({
  children,
  path,
  className,
}: PropsWithChildren<ModalProps>) {
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
      <DialogOverlay>
        <DialogContent className={cn("max-h-96", className)}>
          {children}
        </DialogContent>
      </DialogOverlay>
      <DialogClose>
        <Link href="">x</Link>
      </DialogClose>
    </Dialog>
  );
}
