import React, { useEffect, useState, useMemo } from 'react';
import {
  ArrowLeft, Plus, Trash2, Search, Minus, AlertTriangle,
  Edit, Save, X, RefreshCw, Package, ShoppingCart, Users as UsersIcon, ChefHat
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// ── Types ────────────────────────────────────────────
type Material = {
  id: string; name: string; category: string; unit: string;
  unitCost: number; stockQuantity: number; lowStockThreshold: number;
};
type Supplier = {
  id: string; item_name: string; category: string;
  supplier_name: string; contact: string;
};
type Purchase = {
  id: string; material_id: string | null; item_name: string;
  quantity: number; price_per_unit: number; total_paid: number;
  purchase_date: string;
};
type Recipe = {
  id: string; menu_item_id: string; material_id: string;
  quantity_used: number; material?: Material;
};
type MenuItemBasic = { id: string; name: string; basePrice: number; };
type Tab = 'inventory' | 'purchases' | 'suppliers' | 'costing';
type Props = { onBack: () => void; };

// ── Component ────────────────────────────────────────
const InventoryManager: React.FC<Props> = ({ onBack }) => {
  const [tab, setTab] = useState<Tab>('inventory');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemBasic[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  // ── Material form ──
  const [showMatForm, setShowMatForm] = useState(false);
  const [editMatId, setEditMatId] = useState<string | null>(null);
  const emptyMat = { name: '', category: '', unit: 'pc', unitCost: 0, stockQuantity: 0, lowStockThreshold: 5 };
  const [matForm, setMatForm] = useState(emptyMat);

  // ── Supplier form ──
  const [showSupForm, setShowSupForm] = useState(false);
  const [editSupId, setEditSupId] = useState<string | null>(null);
  const emptySup = { item_name: '', category: '', supplier_name: '', contact: '' };
  const [supForm, setSupForm] = useState(emptySup);

  // ── Purchase form ──
  const [showPurForm, setShowPurForm] = useState(false);
  const emptyPur = { material_id: '', item_name: '', quantity: 0, price_per_unit: 0, total_paid: 0, purchase_date: new Date().toISOString().slice(0, 10) };
  const [purForm, setPurForm] = useState(emptyPur);

  // ── Recipe state ──
  const [selectedMenuItem, setSelectedMenuItem] = useState('');
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [recipeForm, setRecipeForm] = useState({ material_id: '', quantity_used: 0 });

  // ── Fetch all data ──
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [matRes, supRes, purRes, menuRes] = await Promise.all([
        supabase.from('materials').select('*').order('name'),
        supabase.from('suppliers').select('*').order('item_name'),
        supabase.from('purchases').select('*').order('purchase_date', { ascending: false }),
        supabase.from('menu_items').select('id, name, base_price').order('name'),
      ]);
      setMaterials((matRes.data || []).map((m: any) => ({
        id: m.id, name: m.name, category: m.category || '', unit: m.unit || 'pc',
        unitCost: m.unit_cost ?? 0, stockQuantity: m.stock_quantity ?? 0,
        lowStockThreshold: m.low_stock_threshold ?? 5,
      })));
      setSuppliers((supRes.data || []).map((s: any) => ({
        id: s.id, item_name: s.item_name, category: s.category || '',
        supplier_name: s.supplier_name, contact: s.contact || '',
      })));
      setPurchases((purRes.data || []).map((p: any) => ({
        id: p.id, material_id: p.material_id, item_name: p.item_name,
        quantity: Number(p.quantity), price_per_unit: Number(p.price_per_unit),
        total_paid: Number(p.total_paid), purchase_date: p.purchase_date,
      })));
      setMenuItems((menuRes.data || []).map((mi: any) => ({
        id: mi.id, name: mi.name, basePrice: Number(mi.base_price),
      })));
    } catch (err) { console.error('Fetch error:', err); }
    setLoading(false);
  };

  const fetchRecipes = async (menuItemId: string) => {
    if (!menuItemId) { setRecipes([]); return; }
    const { data } = await supabase.from('recipes').select('*').eq('menu_item_id', menuItemId);
    setRecipes((data || []).map((r: any) => ({
      id: r.id, menu_item_id: r.menu_item_id, material_id: r.material_id,
      quantity_used: Number(r.quantity_used),
      material: materials.find(m => m.id === r.material_id),
    })));
  };

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { if (selectedMenuItem) fetchRecipes(selectedMenuItem); }, [selectedMenuItem, materials]);

  // ── Filters ──
  const filtered = useMemo(() => {
    const t = query.trim().toLowerCase();
    if (!t) return materials;
    return materials.filter(m => m.name.toLowerCase().includes(t) || m.category.toLowerCase().includes(t));
  }, [materials, query]);

  // ── Stats ──
  const totalValue = materials.reduce((s, m) => s + m.unitCost * m.stockQuantity, 0);
  const lowCount = materials.filter(m => m.stockQuantity > 0 && m.stockQuantity <= m.lowStockThreshold).length;
  const outCount = materials.filter(m => m.stockQuantity <= 0).length;
  const totalPurchases = purchases.reduce((s, p) => s + p.total_paid, 0);

  // ── Material CRUD ──
  const openAddMat = () => { setEditMatId(null); setMatForm({ ...emptyMat }); setShowMatForm(true); };
  const openEditMat = (m: Material) => {
    setEditMatId(m.id);
    setMatForm({ name: m.name, category: m.category, unit: m.unit, unitCost: m.unitCost, stockQuantity: m.stockQuantity, lowStockThreshold: m.lowStockThreshold });
    setShowMatForm(true);
  };
  const saveMat = async () => {
    if (!matForm.name.trim()) { alert('Enter a name.'); return; }
    setProcessingId(editMatId || 'new');
    const payload = { name: matForm.name.trim(), category: matForm.category.trim(), unit: matForm.unit, unit_cost: matForm.unitCost, stock_quantity: matForm.stockQuantity, low_stock_threshold: matForm.lowStockThreshold, updated_at: new Date().toISOString() };
    try {
      if (editMatId) { await supabase.from('materials').update(payload).eq('id', editMatId); }
      else { await supabase.from('materials').insert(payload); }
      setShowMatForm(false); await fetchAll();
    } catch (err) { alert('Failed to save.'); }
    setProcessingId(null);
  };
  const deleteMat = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    setProcessingId(id);
    await supabase.from('materials').delete().eq('id', id);
    await fetchAll(); setProcessingId(null);
  };
  const adjustStock = async (m: Material, delta: number) => {
    const next = Math.max(0, m.stockQuantity + delta);
    setProcessingId(m.id);
    await supabase.from('materials').update({ stock_quantity: next, updated_at: new Date().toISOString() }).eq('id', m.id);
    await fetchAll(); setProcessingId(null);
  };
  const getStatus = (m: Material) => {
    if (m.stockQuantity <= 0) return { label: 'Out of stock', cls: 'bg-red-100 text-red-800' };
    if (m.stockQuantity <= m.lowStockThreshold) return { label: 'Low stock', cls: 'bg-yellow-100 text-yellow-800' };
    return { label: 'In stock', cls: 'bg-green-100 text-green-800' };
  };

  // ── Supplier CRUD ──
  const openAddSup = () => { setEditSupId(null); setSupForm({ ...emptySup }); setShowSupForm(true); };
  const openEditSup = (s: Supplier) => {
    setEditSupId(s.id);
    setSupForm({ item_name: s.item_name, category: s.category, supplier_name: s.supplier_name, contact: s.contact });
    setShowSupForm(true);
  };
  const saveSup = async () => {
    if (!supForm.item_name.trim() || !supForm.supplier_name.trim()) { alert('Fill required fields.'); return; }
    setProcessingId(editSupId || 'new');
    const payload = { item_name: supForm.item_name.trim(), category: supForm.category.trim(), supplier_name: supForm.supplier_name.trim(), contact: supForm.contact.trim(), updated_at: new Date().toISOString() };
    try {
      if (editSupId) { await supabase.from('suppliers').update(payload).eq('id', editSupId); }
      else { await supabase.from('suppliers').insert(payload); }
      setShowSupForm(false); await fetchAll();
    } catch (err) { alert('Failed to save supplier.'); }
    setProcessingId(null);
  };
  const deleteSup = async (id: string, name: string) => {
    if (!confirm(`Delete supplier "${name}"?`)) return;
    setProcessingId(id);
    await supabase.from('suppliers').delete().eq('id', id);
    await fetchAll(); setProcessingId(null);
  };

  // ── Purchase CRUD ──
  const openAddPur = () => { setPurForm({ ...emptyPur, purchase_date: new Date().toISOString().slice(0, 10) }); setShowPurForm(true); };
  const savePur = async () => {
    if (!purForm.item_name.trim()) { alert('Select an item.'); return; }
    setProcessingId('new');
    const payload = {
      material_id: purForm.material_id || null, item_name: purForm.item_name.trim(),
      quantity: purForm.quantity, price_per_unit: purForm.price_per_unit,
      total_paid: purForm.quantity * purForm.price_per_unit,
      purchase_date: purForm.purchase_date,
    };
    try {
      await supabase.from('purchases').insert(payload);
      // Auto-update stock
      if (purForm.material_id) {
        const mat = materials.find(m => m.id === purForm.material_id);
        if (mat) {
          await supabase.from('materials').update({
            stock_quantity: mat.stockQuantity + purForm.quantity,
            unit_cost: purForm.price_per_unit,
            updated_at: new Date().toISOString(),
          }).eq('id', purForm.material_id);
        }
      }
      setShowPurForm(false); await fetchAll();
    } catch (err) { alert('Failed to save purchase.'); }
    setProcessingId(null);
  };
  const deletePur = async (id: string) => {
    if (!confirm('Delete this purchase record?')) return;
    setProcessingId(id);
    await supabase.from('purchases').delete().eq('id', id);
    await fetchAll(); setProcessingId(null);
  };

  // ── Recipe CRUD ──
  const saveRecipe = async () => {
    if (!recipeForm.material_id || !selectedMenuItem) return;
    setProcessingId('new');
    await supabase.from('recipes').insert({
      menu_item_id: selectedMenuItem, material_id: recipeForm.material_id,
      quantity_used: recipeForm.quantity_used,
    });
    setShowRecipeForm(false); setRecipeForm({ material_id: '', quantity_used: 0 });
    await fetchRecipes(selectedMenuItem);
    setProcessingId(null);
  };
  const deleteRecipe = async (id: string) => {
    if (!confirm('Remove this ingredient?')) return;
    setProcessingId(id);
    await supabase.from('recipes').delete().eq('id', id);
    await fetchRecipes(selectedMenuItem);
    setProcessingId(null);
  };

  // ── Cost Per Serving calc ──
  const totalCostPerServing = recipes.reduce((sum, r) => {
    const mat = materials.find(m => m.id === r.material_id);
    return sum + (mat ? mat.unitCost * r.quantity_used : 0);
  }, 0);
  const selectedMenuPrice = menuItems.find(mi => mi.id === selectedMenuItem)?.basePrice || 0;
  const profit = selectedMenuPrice - totalCostPerServing;

  // ── Shared header ──
  const unitOptions = ['pc', 'g', 'kg', 'ml', 'L', 'oz', 'tbsp', 'tsp', 'cup', 'pack', 'box', 'bag', 'bottle', 'can', 'roll'];

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'inventory', label: 'Main Inventory', icon: <Package className="h-4 w-4" /> },
    { key: 'purchases', label: 'Purchases', icon: <ShoppingCart className="h-4 w-4" /> },
    { key: 'suppliers', label: 'Suppliers', icon: <UsersIcon className="h-4 w-4" /> },
    { key: 'costing', label: 'Cost Per Serving', icon: <ChefHat className="h-4 w-4" /> },
  ];

  // ── RENDER ──
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button onClick={onBack} className="flex items-center space-x-2 text-gray-600 hover:text-black transition-colors">
                <ArrowLeft className="h-5 w-5" /><span>Dashboard</span>
              </button>
              <h1 className="text-2xl font-noto font-semibold text-black">Inventory Management</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto py-2">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${tab === t.key ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}>
                {t.icon}<span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* ════════════ TAB 1: MAIN INVENTORY ════════════ */}
        {tab === 'inventory' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-sm p-4 border"><p className="text-xs font-medium text-gray-500 uppercase">Total Items</p><p className="text-2xl font-bold">{materials.length}</p></div>
              <div className="bg-white rounded-xl shadow-sm p-4 border"><p className="text-xs font-medium text-gray-500 uppercase">Low Stock</p><p className="text-2xl font-bold text-yellow-600">{lowCount}</p></div>
              <div className="bg-white rounded-xl shadow-sm p-4 border"><p className="text-xs font-medium text-gray-500 uppercase">Out of Stock</p><p className="text-2xl font-bold text-red-600">{outCount}</p></div>
              <div className="bg-white rounded-xl shadow-sm p-4 border"><p className="text-xs font-medium text-gray-500 uppercase">Total Value</p><p className="text-2xl font-bold">₱{totalValue.toFixed(2)}</p></div>
            </div>

            {/* Search + Add */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search items..." className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
              </div>
              <button onClick={openAddMat} className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition-colors">
                <Plus className="h-4 w-4" /><span>Add Item</span>
              </button>
            </div>

            {/* Add/Edit Material Form */}
            {showMatForm && (
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border-2 border-green-500">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{editMatId ? 'Edit Item' : 'Add New Item'}</h3>
                  <button onClick={() => setShowMatForm(false)} className="p-1 hover:bg-gray-100 rounded"><X className="h-5 w-5 text-gray-500" /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label><input type="text" value={matForm.name} onChange={e => setMatForm({ ...matForm, name: e.target.value })} placeholder="e.g. Coffee Beans" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Category</label><input type="text" value={matForm.category} onChange={e => setMatForm({ ...matForm, category: e.target.value })} placeholder="e.g. Beans, Syrup, Milk" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    <select value={matForm.unit} onChange={e => setMatForm({ ...matForm, unit: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                      {unitOptions.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Price per Unit (₱)</label><input type="number" min={0} step={0.01} value={matForm.unitCost} onChange={e => setMatForm({ ...matForm, unitCost: Number(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Current Stock</label><input type="number" min={0} value={matForm.stockQuantity} onChange={e => setMatForm({ ...matForm, stockQuantity: Number(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label><input type="number" min={0} value={matForm.lowStockThreshold} onChange={e => setMatForm({ ...matForm, lowStockThreshold: Number(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" /></div>
                </div>
                <div className="flex items-center space-x-3 mt-4">
                  <button onClick={saveMat} disabled={processingId !== null} className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"><Save className="h-4 w-4" /><span>{editMatId ? 'Update' : 'Add'}</span></button>
                  <button onClick={() => setShowMatForm(false)} className="flex items-center space-x-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"><X className="h-4 w-4" /><span>Cancel</span></button>
                </div>
              </div>
            )}

            {/* Materials Table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Cost</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filtered.map(m => {
                      const st = getStatus(m); const busy = processingId === m.id;
                      return (
                        <tr key={m.id} className={m.stockQuantity <= m.lowStockThreshold ? 'bg-red-50/40' : undefined}>
                          <td className="px-6 py-4 whitespace-nowrap"><span className="text-sm font-medium text-gray-900">{m.name}</span><br /><span className="text-xs text-gray-500">{m.unit}</span></td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{m.category || '—'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₱{m.unitCost.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <button type="button" onClick={() => adjustStock(m, -1)} disabled={busy || m.stockQuantity <= 0} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40"><Minus className="h-3.5 w-3.5" /></button>
                              <span className="w-12 text-center text-sm font-medium">{m.stockQuantity}</span>
                              <button type="button" onClick={() => adjustStock(m, 1)} disabled={busy} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40"><Plus className="h-3.5 w-3.5" /></button>
                              {busy && <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₱{(m.unitCost * m.stockQuantity).toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>{st.label}</span>{m.stockQuantity > 0 && m.stockQuantity <= m.lowStockThreshold && <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 ml-1 inline" />}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <button onClick={() => openEditMat(m)} disabled={busy} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"><Edit className="h-4 w-4" /></button>
                              <button onClick={() => deleteMat(m.id, m.name)} disabled={busy} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {!filtered.length && !loading && <tr><td colSpan={7} className="px-6 py-10 text-center text-gray-500">{materials.length ? 'No items match your search.' : 'No items yet. Click "Add Item" to start.'}</td></tr>}
                    {loading && <tr><td colSpan={7} className="px-6 py-10 text-center text-gray-500">Loading...</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ════════════ TAB 2: PURCHASES ════════════ */}
        {tab === 'purchases' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Purchase History</h2>
                <p className="text-sm text-gray-500">Total Spent: <span className="font-bold text-gray-900">₱{totalPurchases.toFixed(2)}</span></p>
              </div>
              <button onClick={openAddPur} className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition-colors">
                <Plus className="h-4 w-4" /><span>Log Purchase</span>
              </button>
            </div>

            {showPurForm && (
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border-2 border-green-500">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Log Purchase</h3>
                  <button onClick={() => setShowPurForm(false)} className="p-1 hover:bg-gray-100 rounded"><X className="h-5 w-5 text-gray-500" /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Item *</label>
                    <select value={purForm.material_id} onChange={e => {
                      const mat = materials.find(m => m.id === e.target.value);
                      setPurForm({ ...purForm, material_id: e.target.value, item_name: mat?.name || '' });
                    }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                      <option value="">Select item...</option>
                      {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
                    </select>
                  </div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label><input type="number" min={0} step={0.01} value={purForm.quantity} onChange={e => setPurForm({ ...purForm, quantity: Number(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Price per Unit (₱)</label><input type="number" min={0} step={0.01} value={purForm.price_per_unit} onChange={e => setPurForm({ ...purForm, price_per_unit: Number(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label><input type="date" value={purForm.purchase_date} onChange={e => setPurForm({ ...purForm, purchase_date: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" /></div>
                  <div className="flex items-end"><p className="text-sm text-gray-600">Total: <span className="font-bold text-lg text-gray-900">₱{(purForm.quantity * purForm.price_per_unit).toFixed(2)}</span></p></div>
                </div>
                <div className="flex items-center space-x-3 mt-4">
                  <button onClick={savePur} disabled={processingId !== null} className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"><Save className="h-4 w-4" /><span>Save Purchase</span></button>
                  <button onClick={() => setShowPurForm(false)} className="flex items-center space-x-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"><X className="h-4 w-4" /><span>Cancel</span></button>
                </div>
                <p className="text-xs text-gray-500 mt-2">* Logging a purchase automatically adds to the item's stock quantity and updates its unit cost.</p>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price/Unit</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Paid</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {purchases.map(p => (
                      <tr key={p.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{p.purchase_date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.item_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₱{p.price_per_unit.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₱{p.total_paid.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button onClick={() => deletePur(p.id)} disabled={processingId === p.id} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
                        </td>
                      </tr>
                    ))}
                    {!purchases.length && !loading && <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-500">No purchases logged yet.</td></tr>}
                    {loading && <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-500">Loading...</td></tr>}
                  </tbody>
                  {purchases.length > 0 && (
                    <tfoot className="bg-gray-50">
                      <tr><td colSpan={4} className="px-6 py-3 text-right text-sm font-bold text-gray-700">Grand Total</td><td className="px-6 py-3 text-sm font-bold text-gray-900">₱{totalPurchases.toFixed(2)}</td><td></td></tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </>
        )}

        {/* ════════════ TAB 3: SUPPLIERS ════════════ */}
        {tab === 'suppliers' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Suppliers Directory</h2>
              <button onClick={openAddSup} className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition-colors">
                <Plus className="h-4 w-4" /><span>Add Supplier</span>
              </button>
            </div>

            {showSupForm && (
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border-2 border-green-500">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{editSupId ? 'Edit Supplier' : 'Add Supplier'}</h3>
                  <button onClick={() => setShowSupForm(false)} className="p-1 hover:bg-gray-100 rounded"><X className="h-5 w-5 text-gray-500" /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label><input type="text" value={supForm.item_name} onChange={e => setSupForm({ ...supForm, item_name: e.target.value })} placeholder="e.g. Caramel Syrup" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Category</label><input type="text" value={supForm.category} onChange={e => setSupForm({ ...supForm, category: e.target.value })} placeholder="e.g. Syrup, Beans, Milk" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name *</label><input type="text" value={supForm.supplier_name} onChange={e => setSupForm({ ...supForm, supplier_name: e.target.value })} placeholder="e.g. Fabbles" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Contact</label><input type="text" value={supForm.contact} onChange={e => setSupForm({ ...supForm, contact: e.target.value })} placeholder="e.g. 0968-211-0364" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" /></div>
                </div>
                <div className="flex items-center space-x-3 mt-4">
                  <button onClick={saveSup} disabled={processingId !== null} className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"><Save className="h-4 w-4" /><span>{editSupId ? 'Update' : 'Add'}</span></button>
                  <button onClick={() => setShowSupForm(false)} className="flex items-center space-x-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"><X className="h-4 w-4" /><span>Cancel</span></button>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {suppliers.map(s => (
                      <tr key={s.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{s.item_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{s.category || '—'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.supplier_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{s.contact || '—'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <button onClick={() => openEditSup(s)} disabled={processingId === s.id} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"><Edit className="h-4 w-4" /></button>
                            <button onClick={() => deleteSup(s.id, s.supplier_name)} disabled={processingId === s.id} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!suppliers.length && !loading && <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">No suppliers yet. Click "Add Supplier" to start.</td></tr>}
                    {loading && <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">Loading...</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ════════════ TAB 4: COST PER SERVING ════════════ */}
        {tab === 'costing' && (
          <>
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Cost Per Serving Calculator</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Menu Item</label>
                  <select value={selectedMenuItem} onChange={e => setSelectedMenuItem(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                    <option value="">Choose a menu item...</option>
                    {menuItems.map(mi => <option key={mi.id} value={mi.id}>{mi.name} (₱{mi.basePrice.toFixed(2)})</option>)}
                  </select>
                </div>
                {selectedMenuItem && (
                  <div className="flex items-end">
                    <button onClick={() => { setRecipeForm({ material_id: '', quantity_used: 0 }); setShowRecipeForm(true); }} className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"><Plus className="h-4 w-4" /><span>Add Ingredient</span></button>
                  </div>
                )}
              </div>

              {/* Formula Reference */}
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 mb-4">
                <p className="font-medium text-gray-800 mb-1">How it works:</p>
                <p>• <strong>Coffee cost</strong> = (Unit cost of bag ÷ grams in bag) × Grams used in recipe</p>
                <p>• <strong>Liquid cost</strong> = (Unit cost of carton ÷ ml in carton) × ml used in drink</p>
                <p>• <strong>Consumables</strong> = Paper cups, lids, sugar, filters etc.</p>
                <p className="mt-1 font-medium">Total Cost Per Serving = Sum of all ingredient costs</p>
              </div>
            </div>

            {/* Add Ingredient Form */}
            {showRecipeForm && selectedMenuItem && (
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border-2 border-green-500">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Add Ingredient</h3>
                  <button onClick={() => setShowRecipeForm(false)} className="p-1 hover:bg-gray-100 rounded"><X className="h-5 w-5 text-gray-500" /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Material *</label>
                    <select value={recipeForm.material_id} onChange={e => setRecipeForm({ ...recipeForm, material_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                      <option value="">Select material...</option>
                      {materials.map(m => <option key={m.id} value={m.id}>{m.name} (₱{m.unitCost.toFixed(2)} / {m.unit})</option>)}
                    </select>
                  </div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Quantity Used (per serving)</label><input type="number" min={0} step={0.01} value={recipeForm.quantity_used} onChange={e => setRecipeForm({ ...recipeForm, quantity_used: Number(e.target.value) || 0 })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" /></div>
                </div>
                <div className="flex items-center space-x-3 mt-4">
                  <button onClick={saveRecipe} disabled={processingId !== null || !recipeForm.material_id} className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"><Save className="h-4 w-4" /><span>Add</span></button>
                  <button onClick={() => setShowRecipeForm(false)} className="flex items-center space-x-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"><X className="h-4 w-4" /><span>Cancel</span></button>
                </div>
              </div>
            )}

            {/* Recipe Ingredients Table */}
            {selectedMenuItem && (
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ingredient</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Cost</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty Used</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {recipes.map(r => {
                        const mat = materials.find(m => m.id === r.material_id);
                        const cost = mat ? mat.unitCost * r.quantity_used : 0;
                        return (
                          <tr key={r.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{mat?.name || 'Unknown'} <span className="text-xs text-gray-500">({mat?.unit})</span></td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">₱{mat?.unitCost.toFixed(2) || '0.00'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.quantity_used}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">₱{cost.toFixed(2)}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button onClick={() => deleteRecipe(r.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4" /></button>
                            </td>
                          </tr>
                        );
                      })}
                      {!recipes.length && <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">No ingredients added yet. Click "Add Ingredient" above.</td></tr>}
                    </tbody>
                    {recipes.length > 0 && (
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan={3} className="px-6 py-3 text-right text-sm font-bold text-gray-700">Total Cost Per Serving</td>
                          <td className="px-6 py-3 text-sm font-bold text-gray-900">₱{totalCostPerServing.toFixed(2)}</td>
                          <td></td>
                        </tr>
                        <tr>
                          <td colSpan={3} className="px-6 py-2 text-right text-sm font-medium text-gray-600">Selling Price</td>
                          <td className="px-6 py-2 text-sm font-medium text-gray-900">₱{selectedMenuPrice.toFixed(2)}</td>
                          <td></td>
                        </tr>
                        <tr>
                          <td colSpan={3} className="px-6 py-2 text-right text-sm font-bold text-gray-700">Profit Per Serving</td>
                          <td className={`px-6 py-2 text-sm font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>₱{profit.toFixed(2)}</td>
                          <td></td>
                        </tr>
                        {selectedMenuPrice > 0 && (
                          <tr>
                            <td colSpan={3} className="px-6 py-2 text-right text-sm font-medium text-gray-600">Margin</td>
                            <td className="px-6 py-2 text-sm font-medium text-gray-900">{((profit / selectedMenuPrice) * 100).toFixed(1)}%</td>
                            <td></td>
                          </tr>
                        )}
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            )}

            {!selectedMenuItem && (
              <div className="bg-white rounded-xl shadow-sm border p-10 text-center">
                <ChefHat className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Select a menu item above to view or set up its recipe cost breakdown.</p>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
};

export default InventoryManager;
