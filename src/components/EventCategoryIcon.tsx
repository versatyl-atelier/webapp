import { MapPin, Repeat } from "lucide-react";

import {
  EVENT_TYPE_EMOJIS,
  RECURRENT_CATEGORY,
  type EventCategory,
} from "@/constants/calendar";
import { cn } from "@/lib/utils";

type EventCategoryIconProps = {
  category: EventCategory;
  className?: string;
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
  const Icon = category === RECURRENT_CATEGORY ? Repeat : MapPin;
  return <Icon aria-hidden className={cn("size-3 shrink-0", className)} />;
}
