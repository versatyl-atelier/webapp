"use client";

import {
  Dialog,
  DialogOverlay,
  DialogContent,
  DialogClose,
} from "@/components/ui/dialog";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PropsWithChildren } from "react";

export function Modal({ children }: PropsWithChildren) {
  const router = useRouter();

  const handleOpenChange = () => {
    router.back();
  };
  return (
    <Dialog defaultOpen={true} open={true} onOpenChange={handleOpenChange}>
      <DialogOverlay>
        <DialogContent className="">{children}</DialogContent>
      </DialogOverlay>
      <DialogClose>
        <Link href="">x</Link>
      </DialogClose>
    </Dialog>
  );
}
