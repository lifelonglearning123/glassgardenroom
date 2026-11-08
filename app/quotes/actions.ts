'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { REMEMBER_DAYS, SESSION_COOKIE, signSession } from '@/lib/session';
import {
  createUser,
  ensureSeedUser,
  findUserByEmail,
  hashPassword,
  listUsers,
  requireSession,
  verifyPassword,
  type User,
} from '@/lib/users';
import * as store from '@/lib/store';
import { createQuote, deleteQuote, duplicateQuote, getQuote, reviseQuote } from '@/lib/quotes';

function safeNext(next: FormDataEntryValue | null): string {
  const n = typeof next === 'string' ? next : '';
  return n.startsWith('/') && !n.startsWith('//') ? n : '/quotes';
}

export async function login(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const remember = formData.get('remember') === 'on';
  const next = safeNext(formData.get('next'));

  await ensureSeedUser();
  const user = email && password ? await findUserByEmail(email) : null;
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    redirect(`/quotes/login?error=1&next=${encodeURIComponent(next)}`);
  }

  // "Keep me signed in" = 30-day cookie. Otherwise the cookie ends with the browser session.
  const maxAge = remember ? REMEMBER_DAYS * 86400 : 12 * 3600;
  const token = await signSession({ uid: user.id, email: user.email, name: user.name }, maxAge);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    ...(remember ? { maxAge } : {}),
  });
  redirect(next);
}

export async function logout() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect('/quotes/login');
}

export async function newQuote() {
  const s = await requireSession();
  const q = await createQuote(s.name);
  redirect(`/quotes/${q.id}`);
}

export async function reviseQuoteAction(formData: FormData) {
  await requireSession();
  const src = await getQuote(String(formData.get('id')));
  if (!src) redirect('/quotes');
  const q = await reviseQuote(src);
  redirect(`/quotes/${q.id}`);
}

export async function duplicateQuoteAction(formData: FormData) {
  const s = await requireSession();
  const src = await getQuote(String(formData.get('id')));
  if (!src) redirect('/quotes');
  const q = await duplicateQuote(src, s.name);
  redirect(`/quotes/${q.id}`);
}

export async function deleteQuoteAction(formData: FormData) {
  await requireSession();
  await deleteQuote(String(formData.get('id')));
  redirect('/quotes');
}

export async function changePassword(formData: FormData) {
  const s = await requireSession();
  const current = String(formData.get('current') ?? '');
  const next = String(formData.get('password') ?? '');
  const user = await store.get<User>('users', s.uid);
  if (!user || !(await verifyPassword(current, user.passwordHash))) redirect('/quotes/settings?msg=wrong-password');
  if (next.length < 8) redirect('/quotes/settings?msg=short-password');
  user.passwordHash = await hashPassword(next);
  await store.put('users', user);
  redirect('/quotes/settings?msg=password-changed');
}

export async function addUser(formData: FormData) {
  await requireSession();
  const email = String(formData.get('email') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  if (!email.includes('@')) redirect('/quotes/settings?msg=bad-email');
  if (password.length < 8) redirect('/quotes/settings?msg=short-password');
  if (await findUserByEmail(email)) redirect('/quotes/settings?msg=user-exists');
  await createUser(email, name, password);
  redirect('/quotes/settings?msg=user-added');
}

export async function removeUser(formData: FormData) {
  const s = await requireSession();
  const id = String(formData.get('id'));
  if (id === s.uid) redirect('/quotes/settings?msg=cannot-remove-self');
  if ((await listUsers()).length <= 1) redirect('/quotes/settings?msg=last-user');
  await store.remove('users', id);
  redirect('/quotes/settings?msg=user-removed');
}
