"use client";

import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const defaultTimeString = "00:00:00";

type ClockProps = {
  className?: string;
};

export default function Clock({ className }: ClockProps) {
  const [timeString, setTimeString] = useState(defaultTimeString);

  useEffect(() => {
    const updateTime = () => {
      setTimeString(getTimeString());
    };

    updateTime();
    const intervalId = setInterval(updateTime, 1000);

    return () => {
      return clearInterval(intervalId);
    };
  }, []);

  return (
    <div
      className={cn(
        "rounded-sm bg-black px-2 py-1 font-mono transition-colors",
        timeString === defaultTimeString ? "text-transparent" : "text-white",
        className,
      )}
    >
      {timeString}
    </div>
  );
}

function getTimeString() {
  const now = new Date();
  const timeString = now.toLocaleTimeString("fr-FR", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return timeString;
}
