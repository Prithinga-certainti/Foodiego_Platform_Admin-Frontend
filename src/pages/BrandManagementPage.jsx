import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Check, X, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { getBrands, getPendingBrands, createBrand, approveBrand, rejectBrand, suspendBrand, reactivateBrand } from '../api/brands';

const STATUS_BADGE = {
  approved: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-700',
  suspended: 'bg-gray-100 text-gray-600',
};

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-lg text-white text-sm font-medium ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
      {msg}
    </div>
  );
}

function ConfirmModal({ title, message, confirmLabel, confirmClass, onConfirm, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-4">{message}</p>
        {children}
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={onConfirm} className={`flex-1 py-2 rounded-lg text-sm text-white font-medium ${confirmClass}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export default function BrandManagementPage() {
  const [tab, setTab] = useState('all');
  const [brands, setBrands] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', gst_number: '', owner_id: '' });
  const [actionData, setActionData] = useState({ reason: '', duration: '7days' });
  const LIMIT = 10;

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const loadBrands = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getBrands({ search, page, limit: LIMIT });
      setBrands(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch { showToast('Failed to load brands', 'error'); }
    finally { setLoading(false); }
  }, [search, page]);

  const loadPending = useCallback(async () => {
    try { const res = await getPendingBrands(); setPending(res.data || []); } catch {}
  }, []);

  useEffect(() => { if (tab === 'all') loadBrands(); else loadPending(); }, [tab, loadBrands, loadPending]);

  async function handleAction() {
    try {
      if (modal.type === 'approve') await approveBrand(modal.id);
      else if (modal.type === 'reject') await rejectBrand(modal.id, actionData.reason);
      else if (modal.type === 'suspend') await suspendBrand(modal.id, { reason: actionData.reason, duration: actionData.duration });
      else if (modal.type === 'reactivate') await reactivateBrand(modal.id);
      showToast(`Brand ${modal.type}d successfully`);
      setModal(null);
      setActionData({ reason: '', duration: '7days' });
      loadBrands(); loadPending();
    } catch (err) { showToast(err.response?.data?.message || 'Action failed', 'error'); }
  }

  async function handleCreate() {
    try {
      await createBrand(form);
      showToast('Brand created successfully');
      setShowCreate(false);
      setForm({ name: '', gst_number: '', owner_id: '' });
      loadBrands();
    } catch (err) { showToast(err.response?.data?.message || 'Failed to create', 'error'); }
  }

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="p-6">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Brand Management</h1>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> Add New Brand
        </button>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {['all','pending','suspended'].map(t => (
          <button key={t} onClick={() => { setTab(t); setPage(1); }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab === t ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'all' ? 'All Brands' : t === 'pending' ? `Pending (${pending.length})` : 'Suspended'}
          </button>
        ))}
      </div>

      {tab === 'all' && (
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search brands..." className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-72 focus:outline-none focus:ring-2 focus:ring-orange-500" />
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Brand Name','GST Number','Owner','Status','Created Date','Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>{[...Array(6)].map((_, j) => <td key={j} className="px-4 py-3"><div className="animate-pulse bg-gray-200 h-4 rounded" /></td>)}</tr>
              ))
            ) : (tab === 'all' ? brands : tab === 'pending' ? pending : brands.filter(b => !b.is_active)).map(b => (
              <tr key={b.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{b.name}</td>
                <td className="px-4 py-3 text-gray-500">{b.gst_number || '-'}</td>
                <td className="px-4 py-3 text-gray-500">{b.owner_name || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[b.status] || 'bg-gray-100 text-gray-600'}`}>{b.status?.toUpperCase()}</span>
                </td>
                <td className="px-4 py-3 text-gray-500">{new Date(b.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {b.status === 'pending' && <>
                      <button onClick={() => { setModal({ id: b.id, type: 'approve', name: b.name }); }} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200">Approve</button>
                      <button onClick={() => { setModal({ id: b.id, type: 'reject', name: b.name }); }} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200">Reject</button>
                    </>}
                    {b.status === 'approved' && b.is_active && (
                      <button onClick={() => setModal({ id: b.id, type: 'suspend', name: b.name })} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium hover:bg-gray-200">Suspend</button>
                    )}
                    {!b.is_active && b.status !== 'pending' && (
                      <button onClick={() => setModal({ id: b.id, type: 'reactivate', name: b.name })} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200">Reactivate</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && (tab === 'all' ? brands : pending).length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No brands found</td></tr>
            )}
          </tbody>
        </table>
        {tab === 'all' && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">Showing {(page-1)*LIMIT+1}–{Math.min(page*LIMIT,total)} of {total}</span>
            <div className="flex gap-2">
              <button disabled={page===1} onClick={() => setPage(p=>p-1)} className="p-1 rounded hover:bg-gray-100 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
              <button disabled={page===totalPages} onClick={() => setPage(p=>p+1)} className="p-1 rounded hover:bg-gray-100 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {modal && (
        <ConfirmModal
          title={`${modal.type.charAt(0).toUpperCase()+modal.type.slice(1)} "${modal.name}"?`}
          message={modal.type === 'approve' ? 'Brand will be approved and activated.' : modal.type === 'reactivate' ? 'Brand will be reactivated.' : ''}
          confirmLabel={modal.type.charAt(0).toUpperCase()+modal.type.slice(1)}
          confirmClass={modal.type === 'reject' || modal.type === 'suspend' ? 'bg-red-500 hover:bg-red-600' : 'bg-orange-500 hover:bg-orange-600'}
          onConfirm={handleAction}
          onClose={() => { setModal(null); setActionData({ reason: '', duration: '7days' }); }}
        >
          {(modal.type === 'reject' || modal.type === 'suspend') && (
            <textarea value={actionData.reason} onChange={e => setActionData(p=>({...p,reason:e.target.value}))} placeholder="Reason (required)" className="w-full border border-gray-300 rounded-lg p-2 text-sm mt-2 focus:outline-none focus:ring-2 focus:ring-orange-500" rows={3} />
          )}
          {modal.type === 'suspend' && (
            <select value={actionData.duration} onChange={e => setActionData(p=>({...p,duration:e.target.value}))} className="w-full border border-gray-300 rounded-lg p-2 text-sm mt-2 focus:outline-none">
              <option value="7days">7 Days</option>
              <option value="30days">30 Days</option>
              <option value="90days">90 Days</option>
              <option value="permanent">Permanent</option>
            </select>
          )}
        </ConfirmModal>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Brand</h3>
            <div className="space-y-3">
              <input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Brand Name *" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              <input value={form.gst_number} onChange={e=>setForm(p=>({...p,gst_number:e.target.value}))} placeholder="GST Number (optional)" maxLength={15} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={()=>setShowCreate(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">Cancel</button>
              <button onClick={handleCreate} disabled={!form.name} className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">Create Brand</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
