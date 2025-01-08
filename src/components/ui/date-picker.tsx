import * as React from "react";
import { format } from "date-fns";

interface DatePickerProps {
  selected: Date;
  onChange: (date: Date) => void;
  maxDate?: Date;
  minDate?: Date;
}

export function DatePicker({ selected, onChange, maxDate, minDate }: DatePickerProps) {
  return (
    <input
      type="date"
      className="border rounded p-1"
      value={format(selected, "yyyy-MM-dd")}
      min={minDate ? format(minDate, "yyyy-MM-dd") : undefined}
      max={maxDate ? format(maxDate, "yyyy-MM-dd") : undefined}
      onChange={(e) => {
        const date = new Date(e.target.value);
        if (!isNaN(date.getTime())) {
          onChange(date);
        }
      }}
    />
  );
} 