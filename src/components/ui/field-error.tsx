type FieldErrorProps = {
  errors?: string[] | undefined;
};

export function FieldError({ errors }: FieldErrorProps) {
  if (!errors?.length) return null;
  return <p className="mt-1 text-xs text-red-300">{errors[0]}</p>;
}
