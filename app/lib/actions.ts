'use server';

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

// Create invoice
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });

const createInvoiceValidate = (object: unknown) => CreateInvoice.parse(object);

export async function createInvoice(formData: FormData) {
  // esta es una forma de obtener los datos del formulario
  // const rawFormData = {
  //   customerId: formData.get('customerId'),
  //   amount: formData.get('amount'),
  //   status: formData.get('status'),
  //   wasi: formData.get("waso")
  // };

  const rawFormData = Object.fromEntries(formData.entries());

  const { amount, customerId, status } = createInvoiceValidate(rawFormData);

  const amountInCent = amount * 100;

  const date = new Date().toISOString().split('T')[0];

  await sql`INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCent}, ${status}, ${date})`;

  revalidatePath('/dashboar/invoices');
  redirect('/dashboard/invoices');
}

// Update invoice
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

const updateInvoiceValidate = (object: unknown) => UpdateInvoice.parse(object);

export async function updateInvoice(id: string, formData: FormData) {
  const rawFormData = Object.fromEntries(formData.entries());

  const { amount, customerId, status } = updateInvoiceValidate(rawFormData);

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
