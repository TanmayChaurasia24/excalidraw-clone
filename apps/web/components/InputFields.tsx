import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useId } from "react";

export function InputField({
  label,
  placeholder,
  description,
  type = "text",
  onChange,
}: {
  label: string;
  placeholder: string;
  description?: string;
  type?: string;
  onChange: (e: any) => void;
}) {
  const generatedId = useId();
  return (
    <Field>
      <FieldLabel htmlFor={generatedId}>{label}</FieldLabel>
      <Input
        id={generatedId}
        type={type}
        placeholder={placeholder}
        onChange={onChange}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
    </Field>
  );
}
