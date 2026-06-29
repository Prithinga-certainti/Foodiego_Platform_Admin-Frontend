import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ClipboardList, CheckCircle, XCircle, Clock, Upload, Plus, ChevronDown, ChevronUp, Check, X, AlertCircle, FileText } from 'lucide-react';
import { getMenuStats, getMenuRequests, getMenuItems, submitMenuRequest, approveMenuItem, rejectMenuItem, bulkApproveMenu, bulkRejectMenu } from '../api/menu';
import { getBrands, getRestaurants } from '../api/brands';

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-xl text-white text-sm font-medium flex items-center gap-2 ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
      {type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      {msg}
    </div>
  );
}

const STATUS_BADGE = {
  pending:  'bg-yellow-100 text-yellow-700 border border-yellow-200',
  approved: 'bg-green-100 text-green-700 border border-green-200',
  rejected: 'bg-red-100 text-red-700 border border-red-200',
  partial:  'bg-blue-100 text-blue-700 border border-blue-200',
};
const ITEM_BADGE = {
  pending:  'bg-yellow-50 text-yellow-600',
  approved: 'bg-green-50 text-green-600',
  rejected: 'bg-red-50 text-red-600',
};

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value ?? '—'}</p>
      </div>
    </div>
  );
}

function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] ?? ''; });
    return obj;
  }).filter(r => r.item_name);
}

const MANUAL_EMPTY = {
  item_name: '', category: '', sub_category: '', description: '', price: '', discount_price: '',
  tax_percentage: '5', image_url: '', food_type: 'Veg', spice_level: 'Mild', calories: '',
  allergens: '', packaging_charge: '0', display_order: '', is_featured: false, is_bestseller: false, is_customizable: false,
};

export default function MenuApprovalPage() {
  const [stats, setStats] = useState({});
  const [requests, setRequests] = useState([]);
  const [tab, setTab] = useState('pending');
  const [expandedId, setExpandedId] = useState(null);
  const [itemsMap, setItemsMap] = useState({});
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [brands, setBrands] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const fileRef = useRef();

  // Submit form state
  const [form, setForm] = useState({ brand_id: '', restaurant_id: '', submitted_by: '', upload_type: 'bulk', notes: '' });
  const [csvItems, setCsvItems] = useState([]);
  const [manualItems, setManualItems] = useState([{ ...MANUAL_EMPTY }]);
  const [csvError, setCsvError] = useState('');
  const [submitTab, setSubmitTab] = useState('bulk');

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const loadStats = useCallback(async () => {
    try { const r = await getMenuStats(); setStats(r.data || {}); } catch {}
  }, []);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getMenuRequests({ status: tab });
      setRequests(r.data || []);
    } catch { showToast('Failed to load menu requests', 'error'); }
    finally { setLoading(false); }
  }, [tab]);

  const loadBrands = useCallback(async () => {
    try {
      const r = await getBrands({ limit: 100 });
      setBrands(r.data?.data || r.data || []);
    } catch {}
  }, []);

  const loadRestaurants = useCallback(async () => {
    try {
      const r = await getRestaurants({ limit: 100 });
      setRestaurants(r.data?.data || r.data || []);
    } catch {}
  }, []);

  useEffect(() => { loadStats(); loadBrands(); loadRestaurants(); }, [loadStats, loadBrands, loadRestaurants]);
  useEffect(() => { loadRequests(); }, [loadRequests]);

  const toggleExpand = async (id) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    if (!itemsMap[id]) {
      try {
        const r = await getMenuItems(id);
        setItemsMap(prev => ({ ...prev, [id]: r.data || [] }));
      } catch { showToast('Failed to load items', 'error'); }
    }
  };

  const refreshItems = async (id) => {
    try {
      const r = await getMenuItems(id);
      setItemsMap(prev => ({ ...prev, [id]: r.data || [] }));
    } catch {}
    loadStats();
    loadRequests();
  };

  const handleApproveItem = async (itemId, requestId) => {
    try {
      await approveMenuItem(itemId);
      showToast('Item approved');
      await refreshItems(requestId);
    } catch { showToast('Failed to approve item', 'error'); }
  };

  const handleRejectItem = async (itemId, requestId) => {
    setRejectModal({ itemId, requestId, mode: 'item' });
    setRejectReason('');
  };

  const handleBulkApprove = async (id) => {
    try {
      await bulkApproveMenu(id);
      showToast('All items approved');
      await refreshItems(id);
    } catch { showToast('Failed to bulk approve', 'error'); }
  };

  const handleBulkReject = (id) => {
    setRejectModal({ requestId: id, mode: 'bulk' });
    setRejectReason('');
  };

  const confirmReject = async () => {
    try {
      if (rejectModal.mode === 'item') {
        await rejectMenuItem(rejectModal.itemId, rejectReason);
        showToast('Item rejected');
        await refreshItems(rejectModal.requestId);
      } else {
        await bulkRejectMenu(rejectModal.requestId, rejectReason);
        showToast('All pending items rejected');
        await refreshItems(rejectModal.requestId);
      }
      setRejectModal(null);
    } catch { showToast('Failed to reject', 'error'); }
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvError('');
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const items = parseCSV(ev.target.result);
        if (!items.length) { setCsvError('No valid rows found in CSV'); return; }
        setCsvItems(items);
      } catch { setCsvError('Failed to parse CSV. Check the file format.'); }
    };
    reader.readAsText(file);
  };

  const addManualRow = () => setManualItems(prev => [...prev, { ...MANUAL_EMPTY }]);
  const removeManualRow = (i) => setManualItems(prev => prev.filter((_, idx) => idx !== i));
  const updateManualRow = (i, field, value) => {
    setManualItems(prev => prev.map((row, idx) => idx === i ? { ...row, [field]: value } : row));
  };

  const handleSubmit = async () => {
    if (!form.brand_id) { showToast('Please select a brand', 'error'); return; }
    const items = submitTab === 'bulk' ? csvItems : manualItems.filter(r => r.item_name.trim());
    if (!items.length) { showToast('No items to submit', 'error'); return; }
    try {
      await submitMenuRequest({
        brand_id: form.brand_id,
        restaurant_id: form.restaurant_id || null,
        submitted_by: form.submitted_by || null,
        upload_type: submitTab,
        notes: form.notes,
        items,
      });
      showToast(`Menu request submitted with ${items.length} items`);
      setShowSubmit(false);
      setCsvItems([]);
      setManualItems([{ ...MANUAL_EMPTY }]);
      setForm({ brand_id: '', restaurant_id: '', submitted_by: '', upload_type: 'bulk', notes: '' });
      loadRequests();
      loadStats();
    } catch { showToast('Failed to submit menu request', 'error'); }
  };

  const filteredRestaurants = form.brand_id
    ? restaurants.filter(r => String(r.brand_id) === String(form.brand_id))
    : restaurants;

  return (
    <div className="p-6 space-y-6">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Menu Approval</h1>
          <p className="text-sm text-gray-500 mt-0.5">Review and approve menu submissions from brand owners and menu managers</p>
        </div>
        <button onClick={() => setShowSubmit(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition shadow-sm">
          <Plus className="w-4 h-4" /> Submit Menu Request
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={Clock} label="Pending Requests" value={stats.pending_requests} color="bg-yellow-500" />
        <StatCard icon={ClipboardList} label="Pending Items" value={stats.pending_items} color="bg-orange-500" />
        <StatCard icon={CheckCircle} label="Approved Today" value={stats.approved_today} color="bg-green-500" />
        <StatCard icon={FileText} label="Total Requests" value={stats.total_requests} color="bg-blue-500" />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex border-b border-gray-100">
          {['pending', 'approved', 'rejected', 'partial', 'all'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-3.5 text-sm font-medium capitalize transition border-b-2 ${tab === t ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t === 'all' ? 'All Requests' : t === 'partial' ? 'Partial' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Request list */}
        <div className="divide-y divide-gray-50">
          {loading && (
            <div className="p-10 text-center text-gray-400 text-sm">Loading...</div>
          )}
          {!loading && requests.length === 0 && (
            <div className="p-10 text-center text-gray-400 text-sm">No {tab} menu requests</div>
          )}
          {!loading && requests.map(req => (
            <div key={req.id} className="p-5">
              {/* Request row */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-semibold text-gray-800">{req.brand_name || `Brand #${req.brand_id}`}</span>
                    {req.restaurant_name && <span className="text-gray-400 text-sm">· {req.restaurant_name}</span>}
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_BADGE[req.status] || STATUS_BADGE.pending}`}>
                      {req.status}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">
                      {req.upload_type} upload
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-400">
                    <span>Submitted by: <span className="text-gray-600 font-medium">{req.submitted_by_name || '—'}</span> ({req.submitted_by_role || '—'})</span>
                    <span>Items: <span className="text-gray-600 font-medium">{req.total_items}</span></span>
                    <span>{new Date(req.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {req.notes && <p className="text-xs text-gray-400 mt-1 italic">"{req.notes}"</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {req.status === 'pending' && (
                    <>
                      <button onClick={() => handleBulkApprove(req.id)}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm">
                        <CheckCircle className="w-3.5 h-3.5" /> Accept Request
                      </button>
                      <button onClick={() => handleBulkReject(req.id)}
                        className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition">
                        <XCircle className="w-3.5 h-3.5" /> Decline
                      </button>
                    </>
                  )}
                  {req.status === 'approved' && (
                    <span className="px-3 py-1.5 bg-green-50 text-green-600 border border-green-200 rounded-lg text-xs font-medium flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5" /> Accepted
                    </span>
                  )}
                  {req.status === 'rejected' && (
                    <span className="px-3 py-1.5 bg-red-50 text-red-500 border border-red-200 rounded-lg text-xs font-medium flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5" /> Declined
                    </span>
                  )}
                  <button onClick={() => toggleExpand(req.id)}
                    className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition">
                    {expandedId === req.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {expandedId === req.id ? 'Hide' : 'Review'} Items
                  </button>
                </div>
              </div>

              {/* Expanded items */}
              {expandedId === req.id && (
                <div className="mt-4 rounded-xl border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 text-gray-500">
                        <tr>
                          <th className="px-4 py-2.5 text-left font-medium">Item Name</th>
                          <th className="px-4 py-2.5 text-left font-medium">Category</th>
                          <th className="px-4 py-2.5 text-left font-medium">Type</th>
                          <th className="px-4 py-2.5 text-left font-medium">Spice</th>
                          <th className="px-4 py-2.5 text-right font-medium">Price</th>
                          <th className="px-4 py-2.5 text-right font-medium">Disc. Price</th>
                          <th className="px-4 py-2.5 text-center font-medium">Featured</th>
                          <th className="px-4 py-2.5 text-center font-medium">Bestseller</th>
                          <th className="px-4 py-2.5 text-center font-medium">Status</th>
                          <th className="px-4 py-2.5 text-center font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {(itemsMap[req.id] || []).map(item => (
                          <tr key={item.id} className="hover:bg-gray-50/50">
                            <td className="px-4 py-2.5">
                              <div className="font-medium text-gray-800">{item.item_name}</div>
                              {item.description && <div className="text-gray-400 truncate max-w-[180px]">{item.description}</div>}
                            </td>
                            <td className="px-4 py-2.5 text-gray-600">
                              <div>{item.category}</div>
                              {item.sub_category && <div className="text-gray-400">{item.sub_category}</div>}
                            </td>
                            <td className="px-4 py-2.5">
                              <span className={`px-2 py-0.5 rounded-full text-xs ${item.food_type === 'Veg' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                                {item.food_type}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-gray-600">{item.spice_level}</td>
                            <td className="px-4 py-2.5 text-right text-gray-800 font-medium">₹{item.price}</td>
                            <td className="px-4 py-2.5 text-right text-gray-500">₹{item.discount_price}</td>
                            <td className="px-4 py-2.5 text-center">{item.is_featured ? '⭐' : '—'}</td>
                            <td className="px-4 py-2.5 text-center">{item.is_bestseller ? '🔥' : '—'}</td>
                            <td className="px-4 py-2.5 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ITEM_BADGE[item.approval_status]}`}>
                                {item.approval_status}
                              </span>
                              {item.rejection_reason && (
                                <div className="text-red-400 text-xs mt-0.5 truncate max-w-[100px]" title={item.rejection_reason}>
                                  {item.rejection_reason}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              {item.approval_status === 'pending' ? (
                                <div className="flex items-center justify-center gap-1.5">
                                  <button onClick={() => handleApproveItem(item.id, req.id)}
                                    title="Accept item"
                                    className="px-2 py-1 rounded bg-green-500 hover:bg-green-600 text-white text-xs font-medium flex items-center gap-1 transition">
                                    <Check className="w-3 h-3" /> Accept
                                  </button>
                                  <button onClick={() => handleRejectItem(item.id, req.id)}
                                    title="Decline item"
                                    className="px-2 py-1 rounded bg-red-50 hover:bg-red-100 text-red-500 border border-red-200 text-xs font-medium flex items-center gap-1 transition">
                                    <X className="w-3 h-3" /> Decline
                                  </button>
                                </div>
                              ) : item.approval_status === 'approved' ? (
                                <span className="text-green-500 text-xs font-medium">✓ Accepted</span>
                              ) : (
                                <span className="text-red-400 text-xs font-medium">✗ Declined</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Decline {rejectModal.mode === 'bulk' ? 'Entire Request' : 'Menu Item'}</h3>
            <p className="text-sm text-gray-500 mb-4">Provide a reason for declining (optional — shown to brand owner)</p>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-red-200" />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setRejectModal(null)}
                className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={confirmReject}
                className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium">Confirm Decline</button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Menu Request modal */}
      {showSubmit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Submit Menu Request</h2>
                <p className="text-sm text-gray-500 mt-0.5">Upload bulk CSV or add items manually</p>
              </div>
              <button onClick={() => setShowSubmit(false)} className="text-gray-400 hover:text-gray-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {/* Meta fields */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand <span className="text-red-500">*</span></label>
                  <select value={form.brand_id} onChange={e => setForm(f => ({ ...f, brand_id: e.target.value, restaurant_id: '' }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200">
                    <option value="">Select brand</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant (optional)</label>
                  <select value={form.restaurant_id} onChange={e => setForm(f => ({ ...f, restaurant_id: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200">
                    <option value="">All restaurants</option>
                    {filteredRestaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Optional notes..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200" />
                </div>
              </div>

              {/* Upload type tabs */}
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
                {['bulk', 'manual'].map(t => (
                  <button key={t} onClick={() => setSubmitTab(t)}
                    className={`px-5 py-2 rounded-md text-sm font-medium transition capitalize ${submitTab === t ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
                    {t === 'bulk' ? '📂 Bulk CSV Upload' : '✏️ Manual Entry'}
                  </button>
                ))}
              </div>

              {submitTab === 'bulk' && (
                <div className="space-y-4">
                  <div
                    onClick={() => fileRef.current.click()}
                    className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-orange-300 hover:bg-orange-50/30 transition">
                    <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">Click to upload CSV file</p>
                    <p className="text-gray-400 text-sm mt-1">Columns: item_name, category, sub_category, description, price, discount_price, food_type, spice_level, is_featured, is_bestseller...</p>
                    <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
                  </div>
                  {csvError && <p className="text-red-500 text-sm">{csvError}</p>}
                  {csvItems.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-700">{csvItems.length} items parsed</p>
                        <button onClick={() => { setCsvItems([]); fileRef.current.value = ''; }} className="text-xs text-red-400 hover:text-red-600">Clear</button>
                      </div>
                      <div className="max-h-60 overflow-auto rounded-xl border border-gray-100">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-50 text-gray-500 sticky top-0">
                            <tr>
                              <th className="px-3 py-2 text-left">#</th>
                              <th className="px-3 py-2 text-left">Item Name</th>
                              <th className="px-3 py-2 text-left">Category</th>
                              <th className="px-3 py-2 text-left">Type</th>
                              <th className="px-3 py-2 text-right">Price</th>
                              <th className="px-3 py-2 text-right">Disc. Price</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {csvItems.map((item, i) => (
                              <tr key={i} className="hover:bg-gray-50/50">
                                <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                                <td className="px-3 py-2 font-medium text-gray-700">{item.item_name}</td>
                                <td className="px-3 py-2 text-gray-500">{item.category} {item.sub_category && `/ ${item.sub_category}`}</td>
                                <td className="px-3 py-2">
                                  <span className={`px-2 py-0.5 rounded-full ${item.food_type === 'Veg' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                                    {item.food_type}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-right text-gray-700">₹{item.price}</td>
                                <td className="px-3 py-2 text-right text-gray-500">₹{item.discount_price}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {submitTab === 'manual' && (
                <div className="space-y-3">
                  <div className="max-h-80 overflow-y-auto space-y-3">
                    {manualItems.map((item, i) => (
                      <div key={i} className="border border-gray-100 rounded-xl p-4 bg-gray-50/30 relative">
                        <div className="absolute top-3 right-3">
                          {manualItems.length > 1 && (
                            <button onClick={() => removeManualRow(i)} className="text-red-400 hover:text-red-600">
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                          <div className="col-span-2">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Item Name *</label>
                            <input value={item.item_name} onChange={e => updateManualRow(i, 'item_name', e.target.value)}
                              placeholder="e.g. Chicken Biryani"
                              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-200" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                            <input value={item.category} onChange={e => updateManualRow(i, 'category', e.target.value)}
                              placeholder="Main Course"
                              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-200" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Sub Category</label>
                            <input value={item.sub_category} onChange={e => updateManualRow(i, 'sub_category', e.target.value)}
                              placeholder="Chicken"
                              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-200" />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                            <input value={item.description} onChange={e => updateManualRow(i, 'description', e.target.value)}
                              placeholder="Item description..."
                              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-200" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Price (₹)</label>
                            <input type="number" value={item.price} onChange={e => updateManualRow(i, 'price', e.target.value)}
                              placeholder="250"
                              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-200" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Discount Price (₹)</label>
                            <input type="number" value={item.discount_price} onChange={e => updateManualRow(i, 'discount_price', e.target.value)}
                              placeholder="220"
                              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-200" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Food Type</label>
                            <select value={item.food_type} onChange={e => updateManualRow(i, 'food_type', e.target.value)}
                              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-200">
                              <option>Veg</option>
                              <option>Non-Veg</option>
                              <option>Egg</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Spice Level</label>
                            <select value={item.spice_level} onChange={e => updateManualRow(i, 'spice_level', e.target.value)}
                              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-200">
                              <option>Mild</option>
                              <option>Medium</option>
                              <option>Hot</option>
                              <option>Extra Hot</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Allergens</label>
                            <input value={item.allergens} onChange={e => updateManualRow(i, 'allergens', e.target.value)}
                              placeholder="Dairy, Gluten..."
                              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-200" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Calories</label>
                            <input type="number" value={item.calories} onChange={e => updateManualRow(i, 'calories', e.target.value)}
                              placeholder="350"
                              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-200" />
                          </div>
                          <div className="flex items-center gap-4 col-span-2 mt-1">
                            {[['is_featured', '⭐ Featured'], ['is_bestseller', '🔥 Bestseller'], ['is_customizable', '⚙️ Customizable']].map(([field, label]) => (
                              <label key={field} className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                                <input type="checkbox" checked={item[field]} onChange={e => updateManualRow(i, field, e.target.checked)}
                                  className="w-3.5 h-3.5 accent-orange-500" />
                                {label}
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={addManualRow}
                    className="flex items-center gap-2 text-sm text-orange-500 hover:text-orange-600 font-medium transition">
                    <Plus className="w-4 h-4" /> Add Another Item
                  </button>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={() => setShowSubmit(false)}
                className="px-5 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSubmit}
                className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium shadow-sm transition">
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
