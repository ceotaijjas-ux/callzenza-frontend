"use client";
import Button from "./Button.jsx";
import { CheckIcon } from "./Icons.jsx";

export default function FloatingSave({ onDiscard, onSave }) {
  return (
    <div className="sticky bottom-0 -mx-6 sm:-mx-10 lg:-mx-16 px-6 sm:px-10 lg:px-16 mt-2 py-4 flex justify-end gap-2.5 bg-bg-app/95 backdrop-blur-[8px] border-t border-border z-10">
      <Button variant="secondary" onClick={onDiscard}>
        Discard
      </Button>
      <Button variant="primary" icon={CheckIcon} onClick={onSave}>
        Save Changes
      </Button>
    </div>
  );
}
