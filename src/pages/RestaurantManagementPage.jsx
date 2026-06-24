import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { getRestaurants, getPendingRestaurants, createRestaurant, approveRestaurant, rejectRestaurant, suspendRestaurant } from '../api/brands';
import { getBrands } from '../api/brands';

const STATUS_BADGE = {
  approved: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-700',
  suspended: 'bg-gray-100 text-gray-600',
};

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-lg text-white text-sm font-medium ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>{msg}</div>;
}

export default function RestaurantManagementPage() {
  const [tab, setTab] = useState('all');
  const [restaurants, setRestaurants] = useState([]);
  const [pending, setPending] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ brand_id: '', name: '', address: '', city: '', phone: '', email: '' });
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState('7days');
  const LIMIT = 10;

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const loadRestaurants = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getRestaurants({ search, brand_id: brandFilter, page, limit: LIMIT });
      setRestaurants(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch { showToast('Failed to load', 'error'); }
    finally { setLoading(false); }
  }, [search, brandFilter, page]);

  const loadPending = useCallback(async () => {
    try { const res = await getPendingRestaurants(); setPending(res.data || []); } catch {}
  }, []);

  useEffect(() => {
    getBrands({ limit: 100 }).then(r => setBrands(r.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => { if (tab === 'all') loadRestaurants(); else loadPending(); }, [tab, loadRestaurants, loadPending]);

  async function handleAction() {
    try {
      if (modal.type === 'approve') await approveRestaurant(modal.id);
      else if (modal.type === 'reject') await rejectRestaurant(modal.id, reason);
      else if (modal.type === 'suspend') await suspendRestaurant(modal.id, { reason, duration });
      showToast(`Restaurant ${modal.type}d`);
      setModal(null); setReason('');
      loadRestaurants(); loadPending();
    } catch (err) { showToast(err.response?.data?.message || 'Failed', 'error'); }
  }

  async function handleCreate() {
    try {
      await createRestaurant(form);
      showToast('Restaurant created');
      setShowCreate(false);
      setForm({ brand_id: '', name: '', address: '', city: '', phone: '', email: '' });
      loadRestaurants();
    } catch (err) { showToast(err.response?.data?.message || 'Failed', 'error'); }
  }

  const list = tab === 'all' ? restaurants : pending;
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="p-6">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">Restaurant Management</h1>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> Add Restaurant
        </button>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {[['all','All Restaurants'],['pending',`Pending (${pending.length})`]].map(([t,l]) => (
          <button key={t} onClick={() => { setTab(t); setPage(1); }} className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab===t ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>{l}</button>
        ))}
      </div>

      {tab === 'all' && (
        <div className="flex gap-3 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search restaurants..." className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <select value={brandFilter} onChange={e=>{setBrandFilter(e.target.value);setPage(1);}} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
            <option value="">All Brands</option>
            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Restaurant','Brand','City','Phone','Status','Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? [...Array(5)].map((_,i) => (
              <tr key={i}>{[...Array(6)].map((_,j) => <td key={j} className="px-4 py-3"><div className="animate-pulse bg-gray-200 h-4 rounded" /></td>)}</tr>
            )) : list.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{r.name}</td>
                <td className="px-4 py-3 text-gray-500">{r.brand_name || '-'}</td>
                <td className="px-4 py-3 text-gray-500">{r.city || '-'}</td>
                <td className="px-4 py-3 text-gray-500">{r.phone || '-'}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[r.status]||'bg-gray-100 text-gray-600'}`}>{r.status?.toUpperCase()}</span></td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {r.status==='pending' && <>
                      <button onClick={()=>setModal({id:r.id,type:'approve',name:r.name})} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200">Approve</button>
                      <button onClick={()=>setModal({id:r.id,type:'reject',name:r.name})} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200">Reject</button>
                    </>}
                    {r.status==='approved' && r.is_active && (
                      <button onClick={()=>setModal({id:r.id,type:'suspend',name:r.name})} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200">Suspend</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && list.length===0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No restaurants found</td></tr>}
          </tbody>
        </table>
        {tab==='all' && totalPages>1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">Showing {(page-1)*LIMIT+1}–{Math.min(page*LIMIT,total)} of {total}</span>
            <div className="flex gap-2">
              <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="p-1 rounded hover:bg-gray-100 disabled:opacity-40"><ChevronLeft className="w-4 h-4"/></button>
              <button disabled={page===totalPages} onClick={()=>setPage(p=>p+1)} className="p-1 rounded hover:bg-gray-100 disabled:opacity-40"><ChevronRight className="w-4 h-4"/></button>
            </div>
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{modal.type.charAt(0).toUpperCase()+modal.type.slice(1)} "{modal.name}"?</h3>
            {(modal.type==='reject'||modal.type==='suspend') && (
              <textarea value={reason} onChange={e=>setReason(e.target.value)} placeholder="Reason (required)" className="w-full border border-gray-300 rounded-lg p-2 text-sm mt-3 focus:outline-none focus:ring-2 focus:ring-orange-500" rows={3} />
            )}
            {modal.type==='suspend' && (
              <select value={duration} onChange={e=>setDuration(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 text-sm mt-2 focus:outline-none">
                <option value="7days">7 Days</option><option value="30days">30 Days</option><option value="90days">90 Days</option><option value="permanent">Permanent</option>
              </select>
            )}
            <div className="flex gap-3 mt-4">
              <button onClick={()=>{setModal(null);setReason('');}} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
              <button onClick={handleAction} className={`flex-1 py-2 rounded-lg text-sm text-white font-medium ${modal.type==='approve'?'bg-green-500 hover:bg-green-600':'bg-red-500 hover:bg-red-600'}`}>{modal.type.charAt(0).toUpperCase()+modal.type.slice(1)}</button>
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Restaurant</h3>
            <div className="space-y-3">
              <select value={form.brand_id} onChange={e=>setForm(p=>({...p,brand_id:e.target.value}))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="">Select Brand *</option>
                {brands.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              {['name','address','city','phone','email'].map(f=>(
                <input key={f} value={form[f]} onChange={e=>setForm(p=>({...p,[f]:e.target.value}))} placeholder={f.charAt(0).toUpperCase()+f.slice(1)+( f==='name'?' *':'')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              ))}
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={()=>setShowCreate(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
              <button onClick={handleCreate} disabled={!form.brand_id||!form.name} className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
