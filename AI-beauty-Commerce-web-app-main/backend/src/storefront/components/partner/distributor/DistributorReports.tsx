import React, { useEffect, useState } from 'react';
import { Download, FileText } from '../../common/SolidIcons';
import { apiFetch } from '../../../lib/owned-api';
function cell(value: unknown) { const text = String(value ?? ''); return `"${(/^[=+@-]/.test(text) ? "'" : '') + text.replace(/"/g, '""')}"`; }
export const DistributorReports: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  useEffect(() => { let cancelled = false; apiFetch<any>('/api/partner?kind=DISTRIBUTOR').then(value => { if (!cancelled) setData(value); }).catch(error => { if (!cancelled) setError(error.message); }); return () => { cancelled = true; }; }, []);
  const reports = data ? [
    { id: 'orders', title: 'Assigned orders', headers: ['Order','Status','Payment status','Total NGN','Created at'], rows: data.orders.map((row: any) => [row.orderNumber,row.status,row.paymentStatus,row.totalKobo / 100,row.createdAt]) },
    { id: 'inventory', title: 'Owned stock', headers: ['SKU','Product','Size','Pool','On hand','Reserved'], rows: data.inventory.map((row: any) => [row.sku,row.name,row.size,row.pool,row.onHand,row.reserved]) },
    { id: 'ledger', title: 'Wallet ledger entries', headers: ['Reference','Bucket','Amount NGN','Description','Created at'], rows: data.wallet.entries.map((row: any) => [row.id,row.bucket,row.amountKobo / 100,row.description,row.createdAt]) },
  ] : [];
  const download = (report: typeof reports[number]) => {
    const csv = [report.headers,...report.rows].map(row => row.map(cell).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a'); link.href = url; link.download = `desla-${report.id}-${new Date().toISOString().slice(0,10)}.csv`; link.click(); window.setTimeout(() => URL.revokeObjectURL(url),1000);
  };
  return <div className="space-y-6"><div className="border-b pb-2"><h1 className="font-heading text-2xl font-extrabold">Exportable Operational Reports</h1><p className="text-sm text-[#6B7280]">Exports contain the current records returned for your account.</p></div>{error && <p role="alert">{error}</p>}{!data && !error && <p role="status">Loading reports…</p>}<div className="grid gap-4 md:grid-cols-2">{reports.map(report => <article key={report.id} className="space-y-4 rounded-3xl border bg-white p-6"><FileText className="text-[#997A2E]" /><h2 className="font-bold">{report.title}</h2><p className="text-sm">{report.rows.length} records</p><button disabled={!report.rows.length} onClick={() => download(report)} className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm text-white disabled:opacity-40"><Download size={16} />Download CSV</button></article>)}</div></div>;
};
