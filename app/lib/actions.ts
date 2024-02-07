'use server';

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
    required_error: 'Please select a customer.',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Pleace select an invoice status',
    required_error: 'Pleace select an invoice status.',
  }),
  date: z.string(),
});

// Create invoice
const CreateInvoice = FormSchema.omit({ id: true, date: true });

const createInvoiceValidate = (object: unknown) =>
  CreateInvoice.safeParse(object);

export async function createInvoice(prevState: State, formData: FormData) {
  // esta es una forma de obtener los datos del formulario
  // const rawFormData = {
  //   customerId: formData.get('customerId'),
  //   amount: formData.get('amount'),
  //   status: formData.get('status'),
  //   wasi: formData.get("waso")
  // };

  const rawFormData = Object.fromEntries(formData.entries());

  const validatedFields = createInvoiceValidate(rawFormData);

  if (!validatedFields.success)
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to create.',
    };

  const { amount, customerId, status } = validatedFields.data;

  const amountInCent = amount * 100;

  const date = new Date().toISOString().split('T')[0];

  await sql`INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCent}, ${status}, ${date})`;

  revalidatePath('/dashboar/invoices');
  redirect('/dashboard/invoices');
}

// Update invoice
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

const updateInvoiceValidate = (object: unknown) =>
  UpdateInvoice.safeParse(object);

export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData,
) {
  const rawFormData = Object.fromEntries(formData.entries());

  const validatedFields = updateInvoiceValidate(rawFormData);

  if (!validatedFields.success)
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to update.',
    };

  const { amount, customerId, status } = validatedFields.data;

  const amountInCent = amount * 100;

  await sql`UPDATE invoices
  SET customer_id = ${customerId},  amount = ${amountInCent}, status = ${status}
  WHERE id = ${id}`;

  revalidatePath('/dashboard/invoices');

  redirect('/dashboard/invoices');
}

// Delete invoice
export async function deleteInvoice(id: string) {
  // throw new Error('Error intencional al borrar un invoice');

  try {
    await sql`DELETE FROM invoices WHERE id =${id}`;

    revalidatePath('/dashboard/invoices');
  } catch (error) {
    console.log('Ocurrio un error al borrar un invoice');
  }
}
