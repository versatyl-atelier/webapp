import { Lock, MapPin, Repeat, Tag, type LucideIcon } from "lucide-react";

import {
  EVENT_TYPE_EMOJIS,
  RECURRENT_CATEGORY,
  type EventCategory,
} from "@/constants/calendar";
import { CalendarEventType } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

type EventCategoryIconProps = {
  category: EventCategory;
  className?: string;
};

const CATEGORY_ICONS: Partial<Record<EventCategory, LucideIcon>> = {
  [RECURRENT_CATEGORY]: Repeat,
  [CalendarEventType.divers]: Tag,
  [CalendarEventType.personnel]: Lock,
};

export function EventCategoryIcon({
  category,
  className,
}: EventCategoryIconProps) {
  const emoji = EVENT_TYPE_EMOJIS[category];
  if (emoji) {
    return (
      <span aria-hidden className={cn("leading-none", className)}>
        {emoji}
      </span>
    );
  }
  const Icon = CATEGORY_ICONS[category] ?? MapPin;
  return <Icon aria-hidden className={cn("size-3 shrink-0", className)} />;
}
