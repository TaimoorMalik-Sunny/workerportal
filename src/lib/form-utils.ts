import { zodResolver } from '@hookform/resolvers/zod';
import { type FieldValues, useForm, type UseFormProps } from 'react-hook-form';
import { z } from 'zod';

/**
 * Creates a typed form with Zod validation.
 * Use this hook instead of useForm directly to enforce validation boundaries.
 */
export function useZodForm<
  TOutput extends FieldValues = FieldValues,
  TInput extends FieldValues = TOutput,
>(
  schema: z.ZodType<TOutput, TInput>,
  options?: Omit<UseFormProps<TInput, unknown, TOutput>, 'resolver'>
) {
  return useForm<TInput, unknown, TOutput>({
    ...options,
    resolver: zodResolver(schema),
  });
}
