import { csvResponse, jsonResponse, requireAdminApi } from '../../../../lib/operations-api';
import {
  createExpense,
  deleteExpenses,
  listExpenses,
  toCsv,
} from '../../../../lib/operations-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const err = await requireAdminApi(request);
  if (err) return err;

  const url = new URL(request.url);
  const expenses = await listExpenses({
    category: url.searchParams.get('category') || 'all',
    preset: url.searchParams.get('preset') || 'all',
    from: url.searchParams.get('from') || '',
    to: url.searchParams.get('to') || '',
  });

  if (url.searchParams.get('export') === 'csv') {
    const csv = toCsv(
      ['Title', 'Category', 'Amount (INR)', 'Payment Mode', 'Payee', 'Project', 'Date', 'Notes'],
      expenses.map((e) => [
        e.title,
        e.category,
        e.amount,
        e.paymentMode,
        e.payee,
        e.projectTitle,
        e.date,
        e.notes,
      ])
    );
    return csvResponse(csv, 'gsdd-expenses-report.csv');
  }

  return jsonResponse({ ok: true, expenses }, 200);
}

export async function POST(request) {
  const err = await requireAdminApi(request, { checkOrigin: true });
  if (err) return err;

  const ctype = (request.headers.get('content-type') || '').toLowerCase();
  let fields = {};
  let attachmentFile = null;

  if (ctype.includes('multipart/form-data')) {
    const fd = await request.formData();
    fields = {
      title: String(fd.get('title') || ''),
      category: String(fd.get('category') || ''),
      amount: fd.get('amount'),
      paymentMode: String(fd.get('paymentMode') || ''),
      payee: String(fd.get('payee') || ''),
      projectTitle: String(fd.get('projectTitle') || ''),
      date: String(fd.get('date') || ''),
      notes: String(fd.get('notes') || ''),
    };
    const file = fd.get('attachment');
    if (file && typeof file === 'object' && typeof file.arrayBuffer === 'function' && file.size > 0) {
      attachmentFile = {
        buffer: Buffer.from(await file.arrayBuffer()),
        filename: file.name || 'receipt.png',
        contentType: file.type || '',
      };
    }
  } else {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') return jsonResponse({ ok: false, error: 'invalid_json' }, 400);
    fields = body;
  }

  const res = await createExpense({ ...fields, attachmentFile });
  if (!res.ok) return jsonResponse({ ok: false, error: res.error }, res.status);
  return jsonResponse({ ok: true, expense: res.expense }, 201);
}

export async function DELETE(request) {
  const err = await requireAdminApi(request, { checkOrigin: true });
  if (err) return err;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return jsonResponse({ ok: false, error: 'invalid_json' }, 400);

  const res = await deleteExpenses(body.ids || body.id);
  if (!res.ok) return jsonResponse({ ok: false, error: res.error }, res.status);
  return jsonResponse({ ok: true, deletedCount: res.deletedCount }, 200);
}
