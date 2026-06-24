import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { getUsers, createUser, blockUser, unblockUser, resetPassword, deleteUser } from '../api/users';
import { getRestaurants } from '../api/brands';

const ROLE_BADGE = {
  brand_owner: 'bg-purple-100 text-purple-700',
  branch_manager: 'bg-blue-100 text-blue-700',
  menu_manager: 'bg-orange-100 text-orange-700',
  restaurant_operator: 'bg-green-100 text-green-700',
  support_staff: 'bg-gray-100 text-gray-600',
};

const ROLES = ['brand_owner','branch_manager','menu_manager','restaurant_operator','support_staff'];

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-lg text-white text-sm font-medium ${type==='success'?'bg-green-500':'bg-red-500'}`}>{msg}</div>;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name:'', email:'', role:'', restaurant_id:'', branch_id:'', password:'', autoPassword: true });
  const [createdUser, setCreatedUser] = useState(null);
  const LIMIT = 10;

  const showToast = (msg, type='success') => setToast({msg,type});

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUsers({ search, role: roleFilter, page, limit: LIMIT });
      setUsers(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch { showToast('Failed to load users','error'); }
    finally { setLoading(false); }
  }, [search, roleFilter, page]);

  useEffect(() => { loadUsers(); }, [loadUsers]);
  useEffect(() => { getRestaurants({limit:100}).then(r=>setRestaurants(r.data.data||[])).catch(()=>{}); }, []);

  async function handleAction() {
    try {
      if (modal.type==='block') await blockUser(modal.id);
      else if (modal.type==='unblock') await unblockUser(modal.id);
      else if (modal.type==='reset') {
        const res = await resetPassword(modal.id);
        showToast(`New password: ${res.data.newPassword}`);
        setModal(null); loadUsers(); return;
      }
      else if (modal.type==='delete') await deleteUser(modal.id);
      showToast(`User ${modal.type}ed`);
      setModal(null); loadUsers();
    } catch (err) { showToast(err.response?.data?.message||'Failed','error'); }
  }

  async function handleCreate() {
    try {
      const { autoPassword, ...rest } = form;
      const payload = { ...rest, password: autoPassword ? undefined : form.password, restaurant_id: form.restaurant_id || undefined, branch_id: form.branch_id || undefined };
      const res = await createUser(payload);
      setCreatedUser(res.data);
      loadUsers();
    } catch (err) { showToast(err.response?.data?.message||'Failed to create','error'); }
  }

  function resetCreate() { setShowCreate(false); setStep(1); setForm({name:'',email:'',role:'',restaurant_id:'',branch_id:'',password:'',autoPassword:true}); setCreatedUser(null); }

  const totalPages = Math.ceil(total/LIMIT);

  const needsRestaurant = ['branch_manager','menu_manager','restaurant_operator','support_staff'].includes(form.role);

  return (
    <div className="p-6">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)} />}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">User Management</h1>
        <button onClick={()=>setShowCreate(true)} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> Create User
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search users..." className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-orange-500" />
        </div>
        <select value={roleFilter} onChange={e=>{setRoleFilter(e.target.value);setPage(1);}} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
          <option value="">All Roles</option>
          {ROLES.map(r=><option key={r} value={r}>{r.replace('_',' ').replace(/w/g,l=>l.toUpperCase())}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>{['Name','Email','Role','Restaurant','Status','Created','Actions'].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? [...Array(5)].map((_,i)=>(
              <tr key={i}>{[...Array(7)].map((_,j)=><td key={j} className="px-4 py-3"><div className="animate-pulse bg-gray-200 h-4 rounded"/></td>)}</tr>
            )) : users.map(u=>(
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{u.name}</td>
                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE[u.role]||'bg-gray-100 text-gray-600'}`}>{u.role?.replace(/_/g,' ').replace(/w/g,l=>l.toUpperCase())}</span></td>
                <td className="px-4 py-3 text-gray-500">{u.restaurant_name||'-'}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.is_active?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{u.is_active?'Active':'Blocked'}</span></td>
                <td className="px-4 py-3 text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {u.is_active
                      ? <button onClick={()=>setModal({id:u.id,type:'block',name:u.name})} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200">Block</button>
                      : <button onClick={()=>setModal({id:u.id,type:'unblock',name:u.name})} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200">Unblock</button>
                    }
                    <button onClick={()=>setModal({id:u.id,type:'reset',name:u.name})} className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs hover:bg-orange-200">Reset PW</button>
                    <button onClick={()=>setModal({id:u.id,type:'delete',name:u.name})} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && users.length===0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No users found</td></tr>}
          </tbody>
        </table>
        {totalPages>1 && (
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
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {modal.type==='block'?'Block':modal.type==='unblock'?'Unblock':modal.type==='reset'?'Reset Password':'Delete'} "{modal.name}"?
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {modal.type==='block'?'User will not be able to login.':modal.type==='reset'?'New password will be generated and shown.':'This action cannot be undone.'}
            </p>
            <div className="flex gap-3">
              <button onClick={()=>setModal(null)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
              <button onClick={handleAction} className={`flex-1 py-2 rounded-lg text-sm text-white font-medium ${modal.type==='unblock'?'bg-green-500 hover:bg-green-600':modal.type==='reset'?'bg-orange-500 hover:bg-orange-600':'bg-red-500 hover:bg-red-600'}`}>
                {modal.type==='block'?'Block':modal.type==='unblock'?'Unblock':modal.type==='reset'?'Reset':'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            {createdUser ? (
              <>
                <div className="text-center mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3"><span className="text-green-600 text-xl">✓</span></div>
                  <h3 className="text-lg font-semibold text-gray-800">User Created!</h3>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-medium">{createdUser.name}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-medium">{createdUser.email}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Role</span><span className="font-medium">{createdUser.role}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Password</span><span className="font-mono font-bold text-orange-600">{createdUser.generatedPassword}</span></div>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">Save this password — it won't be shown again</p>
                <button onClick={resetCreate} className="w-full mt-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium">Done</button>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Create User</h3>
                  <span className="text-xs text-gray-400">Step {step} of 4</span>
                </div>
                <div className="flex gap-1 mb-5">{[1,2,3,4].map(s=><div key={s} className={`flex-1 h-1 rounded-full ${s<=step?'bg-orange-500':'bg-gray-200'}`}/>)}</div>

                {step===1 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700">Basic Info</h4>
                    <input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Full Name *" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                    <input value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} placeholder="Email Address *" type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                  </div>
                )}
                {step===2 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Select Role</h4>
                    <div className="space-y-2">
                      {ROLES.map(r=>(
                        <label key={r} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${form.role===r?'border-orange-500 bg-orange-50':'border-gray-200 hover:bg-gray-50'}`}>
                          <input type="radio" name="role" value={r} checked={form.role===r} onChange={e=>setForm(p=>({...p,role:e.target.value}))} className="accent-orange-500"/>
                          <span className="text-sm text-gray-700">{r.replace(/_/g,' ').replace(/w/g,l=>l.toUpperCase())}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                {step===3 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Assignment</h4>
                    {needsRestaurant ? (
                      <select value={form.restaurant_id} onChange={e=>setForm(p=>({...p,restaurant_id:e.target.value}))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                        <option value="">Select Restaurant</option>
                        {restaurants.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                    ) : <p className="text-sm text-gray-400 text-center py-4">No assignment needed for this role.</p>}
                  </div>
                )}
                {step===4 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Password</h4>
                    <div className="space-y-2 mb-3">
                      {[true,false].map(auto=>(
                        <label key={String(auto)} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${form.autoPassword===auto?'border-orange-500 bg-orange-50':'border-gray-200 hover:bg-gray-50'}`}>
                          <input type="radio" checked={form.autoPassword===auto} onChange={()=>setForm(p=>({...p,autoPassword:auto}))} className="accent-orange-500"/>
                          <span className="text-sm text-gray-700">{auto?'Auto generate password':'Set manually'}</span>
                        </label>
                      ))}
                    </div>
                    {!form.autoPassword && <input value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} type="password" placeholder="Enter password" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"/>}
                    <p className="text-xs text-gray-400 mt-2">Credentials will be shown after creation.</p>
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <button onClick={step===1?resetCreate:()=>setStep(s=>s-1)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">{step===1?'Cancel':'Back'}</button>
                  {step<4
                    ? <button onClick={()=>setStep(s=>s+1)} disabled={step===1&&(!form.name||!form.email)||step===2&&!form.role} className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">Next</button>
                    : <button onClick={handleCreate} className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium">Create User</button>
                  }
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
