"use client";

import { ChevronDown } from "lucide-react";
import {
  ColorPicker as AriaColorPicker,
  ColorArea,
  ColorField,
  ColorSlider,
  ColorSwatch,
  ColorSwatchPicker,
  ColorSwatchPickerItem,
  ColorThumb,
  I18nProvider,
  Input,
  SliderTrack,
} from "react-aria-components";

import { ActionTooltip } from "@/components/ActionTooltip";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  COLOR_AREA_LABEL,
  COLOR_HEX_LABEL,
  COLOR_HUE_LABEL,
  COLOR_PICKER_LOCALE,
  COLOR_SWATCHES,
  COLOR_SWATCHES_LABEL,
  CUSTOM_COLOR_LABEL,
  HEX_COLOR_FORMAT,
  type ColorOption,
} from "@/constants/color";
import { cn } from "@/lib/utils";

type ColorPickerProps = {
  value: string;
  onChange: (value: string) => void;
  swatches?: readonly ColorOption[];
};

const THUMB_CLASS =
  "data-focus-visible:ring-ring size-5 rounded-full border-2 border-white shadow-md ring-1 ring-black/30 data-dragging:size-6 data-focus-visible:size-6 data-focus-visible:ring-2";
const CONTROL_WIDTH_CLASS = "w-full max-w-xs";

function isSwatch(value: string, swatches: readonly ColorOption[]): boolean {
  return swatches.some(
    (swatch) => swatch.value.toLowerCase() === value.toLowerCase(),
  );
}

export function ColorPicker({
  value,
  onChange,
  swatches = COLOR_SWATCHES,
}: ColorPickerProps) {
  return (
    <I18nProvider locale={COLOR_PICKER_LOCALE}>
      <AriaColorPicker
        value={value}
        onChange={(color) => onChange(color.toString(HEX_COLOR_FORMAT))}
      >
        <div className="flex flex-col gap-2">
          <ColorSwatchPicker
            aria-label={COLOR_SWATCHES_LABEL}
            className="flex flex-wrap gap-2"
          >
            {swatches.map(({ value: swatch, label }) => (
              <ColorSwatchPickerItem
                key={swatch}
                color={swatch}
                className="data-focus-visible:ring-ring data-selected:ring-foreground ring-offset-background rounded-full ring-offset-2 outline-none data-focus-visible:ring-2 data-selected:ring-2"
              >
                <ActionTooltip
                  label={label}
                  render={<span className="block rounded-full" />}
                >
                  <ColorSwatch
                    colorName={label}
                    className="size-7 rounded-full"
                  />
                </ActionTooltip>
              </ColorSwatchPickerItem>
            ))}
          </ColorSwatchPicker>
          <Collapsible defaultOpen={!isSwatch(value, swatches)}>
            <CollapsibleTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="group/trigger w-fit px-2"
                />
              }
            >
              <ColorSwatch className="ring-foreground/20 size-4 rounded-sm ring-1" />
              {CUSTOM_COLOR_LABEL}
              <ChevronDown className="transition-transform group-data-panel-open/trigger:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="flex flex-col gap-3 pt-2">
              <ColorArea
                aria-label={COLOR_AREA_LABEL}
                colorSpace="hsb"
                xChannel="saturation"
                yChannel="brightness"
                className={cn("h-36 rounded-md", CONTROL_WIDTH_CLASS)}
              >
                <ColorThumb className={THUMB_CLASS} />
              </ColorArea>
              <ColorSlider
                aria-label={COLOR_HUE_LABEL}
                colorSpace="hsb"
                channel="hue"
                className={CONTROL_WIDTH_CLASS}
              >
                <SliderTrack className="h-5 rounded-md">
                  <ColorThumb className={cn(THUMB_CLASS, "top-1/2")} />
                </SliderTrack>
              </ColorSlider>
              <ColorField aria-label={COLOR_HEX_LABEL} className="w-32">
                <Input className="border-input focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 h-8 w-full rounded-lg border bg-transparent px-2.5 py-1 font-mono text-sm uppercase outline-none focus-visible:ring-3" />
              </ColorField>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </AriaColorPicker>
    </I18nProvider>
  );
}
