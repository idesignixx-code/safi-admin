import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LogOut, Key, MapPin, Plus, Activity, LayoutDashboard, Package, Edit, Save } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'keys' | 'places' | 'products'>('keys');
  
  // Data States
  const [keys, setKeys] = useState<any[]>([]);
  const [places, setPlaces] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [newKey, setNewKey] = useState('');
  const [newPlace, setNewPlace] = useState({ name: '', type: 'restaurant', country: '', lat: '', lng: '' });
  const [editingProduct, setEditingProduct] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
      } else {
        fetchData();
      }
    };
    checkAuth();
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const keysRes = await fetch(`${API_URL}/api/keys`);
      const placesRes = await fetch(`${API_URL}/api/places`);
      if(keysRes.ok) setKeys(await keysRes.json());
      if(placesRes.ok) setPlaces(await placesRes.json());

      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (productsData) setProducts(productsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey) return;
    await fetch(`${API_URL}/api/keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: newKey })
    });
    setNewKey('');
    fetchData();
  };

  const handleAddPlace = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`${API_URL}/api/places`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name: newPlace.name, 
        place_type: newPlace.type, 
        country: newPlace.country,
        lat: parseFloat(newPlace.lat), 
        lng: parseFloat(newPlace.lng),
        description: '', address: '' 
      })
    });
    setNewPlace({ name: '', type: 'restaurant', country: '', lat: '', lng: '' });
    fetchData();
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    
    const { error } = await supabase
      .from('products')
      .upsert({
        barcode: editingProduct.barcode,
        product_name: editingProduct.product_name,
        image_url: editingProduct.image_url,
        originCountry: editingProduct.originCountry,
        status: editingProduct.status,
        health_score: editingProduct.health_score || 0,
        nutri_grade: editingProduct.nutri_grade || 'E',
        product_category: editingProduct.product_category || 'غير محدد',
        sub_category: editingProduct.sub_category || 'غير محدد',
        positives: editingProduct.positives || [],
        negatives: editingProduct.negatives || [],
        additives: editingProduct.additives || []
      }, { onConflict: 'barcode' });

    if (!error) {
      setEditingProduct(null);
      fetchData();
      alert("✅ تم الحفظ بنجاح!");
    } else {
      console.error("Supabase Error:", error);
      alert(`❌ حدث خطأ: ${error.message}`);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-sans">جاري التحميل...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans" dir="rtl">
      
      {/* القائمة الجانبية (Sidebar) */}
      <div className="w-64 bg-green-800 text-white flex flex-col shadow-xl">
        <div className="p-6 flex items-center gap-3 border-b border-green-700">
          <LayoutDashboard />
          <h1 className="text-xl font-bold">لوحة تحكم SAFI</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('keys')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'keys' ? 'bg-green-700' : 'hover:bg-green-700/50'}`}>
            <Key size={20} /> مفاتيح الذكاء الاصطناعي
          </button>
          
          <button onClick={() => setActiveTab('places')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'places' ? 'bg-green-700' : 'hover:bg-green-700/50'}`}>
            <MapPin size={20} /> المطاعم والمتاجر
          </button>

          <button onClick={() => setActiveTab('products')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'products' ? 'bg-green-700' : 'hover:bg-green-700/50'}`}>
            <Package size={20} /> إدارة المنتجات
          </button>
        </nav>

        <div className="p-4 border-t border-green-700">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-300 hover:bg-red-900/50 rounded-lg transition-colors">
            <LogOut size={20} /> تسجيل الخروج
          </button>
        </div>
      </div>

      {/* منطقة المحتوى (Main Content) */}
      <div className="flex-1 p-8 overflow-y-auto">
        
        {/* قسم المفاتيح */}
        {activeTab === 'keys' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Key className="text-green-600"/> إدارة مفاتيح Gemini</h2>
            <form onSubmit={handleAddKey} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex gap-4">
              <input type="text" required placeholder="أدخل مفتاح API جديد..." value={newKey} onChange={e => setNewKey(e.target.value)} className="flex-1 border border-gray-300 rounded-lg px-4 outline-none focus:border-green-500" dir="ltr" />
              <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 font-bold"><Plus size={20}/> إضافة</button>
            </form>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-right">
                <thead className="bg-gray-50 border-b border-gray-100 text-gray-600">
                  <tr><th className="p-4 font-semibold">المفتاح (API Key)</th><th className="p-4 font-semibold">مرات الاستخدام</th><th className="p-4 font-semibold">الحالة</th></tr>
                </thead>
                <tbody>
                  {keys.map((k, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="p-4 text-gray-500 font-mono text-sm" dir="ltr">{k.api_key.substring(0, 15)}...</td>
                      <td className="p-4 font-bold text-gray-700 flex items-center gap-2"><Activity size={16} className="text-blue-500"/> {k.usage_count}</td>
                      <td className="p-4"><span className={`px-3 py-1 rounded-full text-xs font-bold ${k.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{k.is_active ? 'نشط' : 'متوقف'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* قسم الأماكن */}
        {activeTab === 'places' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><MapPin className="text-green-600"/> المطاعم والمتاجر</h2>
            <form onSubmit={handleAddPlace} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4">
              <input type="text" required placeholder="اسم المكان" value={newPlace.name} onChange={e => setNewPlace({...newPlace, name: e.target.value})} className="border border-gray-300 rounded-lg p-3 outline-none focus:border-green-500" />
              <select value={newPlace.type} onChange={e => setNewPlace({...newPlace, type: e.target.value})} className="border border-gray-300 rounded-lg p-3 outline-none focus:border-green-500 bg-white">
                <option value="restaurant">مطعم</option><option value="supermarket">متجر / سوبرماركت</option>
              </select>
              <input type="text" required placeholder="الدولة (مثال: France)" value={newPlace.country} onChange={e => setNewPlace({...newPlace, country: e.target.value})} className="border border-gray-300 rounded-lg p-3 outline-none focus:border-green-500" />
              <input type="number" step="any" required placeholder="خط العرض (Latitude)" value={newPlace.lat} onChange={e => setNewPlace({...newPlace, lat: e.target.value})} className="border border-gray-300 rounded-lg p-3 outline-none focus:border-green-500" dir="ltr" />
              <input type="number" step="any" required placeholder="خط الطول (Longitude)" value={newPlace.lng} onChange={e => setNewPlace({...newPlace, lng: e.target.value})} className="border border-gray-300 rounded-lg p-3 outline-none focus:border-green-500" dir="ltr" />
              <button type="submit" className="bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold flex items-center justify-center gap-2 p-3"><Plus size={20}/> إضافة للخريطة</button>
            </form>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-right">
                <thead className="bg-gray-50 border-b border-gray-100 text-gray-600">
                  <tr><th className="p-4 font-semibold">الاسم</th><th className="p-4 font-semibold">النوع</th><th className="p-4 font-semibold">الدولة</th><th className="p-4 font-semibold">الإحداثيات</th></tr>
                </thead>
                <tbody>
                  {places.map((p, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="p-4 font-bold text-gray-800">{p.name}</td>
                      <td className="p-4 text-gray-600">{p.place_type === 'restaurant' ? '🍽️ مطعم' : '🛒 متجر'}</td>
                      <td className="p-4 text-gray-600">{p.country}</td>
                      <td className="p-4 text-gray-500 text-sm font-mono" dir="ltr">{p.lat.toFixed(4)}, {p.lng.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* قسم المنتجات */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Package className="text-green-600"/> المنتجات المسجلة</h2>
              <button onClick={() => setEditingProduct({ barcode: '', product_name: '', status: 'حلال', image_url: '', originCountry: '', health_score: 0, nutri_grade: 'E', product_category: 'غير محدد', sub_category: 'غير محدد'})} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2">
                <Plus size={20}/> إضافة منتج يدوي
              </button>
            </div>

            {editingProduct && (
              <form onSubmit={handleSaveProduct} className="bg-white p-6 rounded-xl shadow-md border border-green-100 grid grid-cols-2 gap-4 mb-6">
                <input type="text" placeholder="الباركود" required value={editingProduct.barcode} onChange={e => setEditingProduct({...editingProduct, barcode: e.target.value})} className="border p-2 rounded outline-none focus:border-green-500" dir="ltr" disabled={!!products.find(p => p.barcode === editingProduct.barcode)} />
                <input type="text" placeholder="اسم المنتج" required value={editingProduct.product_name || ''} onChange={e => setEditingProduct({...editingProduct, product_name: e.target.value})} className="border p-2 rounded outline-none focus:border-green-500" />
                <input type="text" placeholder="رابط الصورة (URL)" value={editingProduct.image_url || ''} onChange={e => setEditingProduct({...editingProduct, image_url: e.target.value})} className="border p-2 rounded outline-none focus:border-green-500" dir="ltr" />
                <input type="text" placeholder="بلد المنشأ" value={editingProduct.originCountry || ''} onChange={e => setEditingProduct({...editingProduct, originCountry: e.target.value})} className="border p-2 rounded outline-none focus:border-green-500" />
                <select value={editingProduct.status} onChange={e => setEditingProduct({...editingProduct, status: e.target.value})} className="border p-2 rounded outline-none focus:border-green-500 bg-white">
                  <option value="حلال">حلال</option>
                  <option value="حرام">حرام</option>
                  <option value="مشبوه">مشبوه</option>
                </select>
                <div className="flex gap-2">
                  <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded flex-1 flex justify-center items-center gap-2"><Save size={18}/> حفظ</button>
                  <button type="button" onClick={() => setEditingProduct(null)} className="bg-gray-300 text-gray-700 px-4 py-2 rounded">إلغاء</button>
                </div>
              </form>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-right">
                <thead className="bg-gray-50 text-gray-600 border-b border-gray-100">
                  <tr><th className="p-4">الصورة</th><th className="p-4">المنتج (الباركود)</th><th className="p-4">البلد</th><th className="p-4">الحالة</th><th className="p-4">إجراء</th></tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.barcode} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="p-4">{p.image_url ? <img src={p.image_url} alt="product" className="w-12 h-12 object-cover rounded-md" /> : <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center text-xs text-gray-500">لا صورة</div>}</td>
                      <td className="p-4 font-bold">{p.product_name || 'غير محدد'} <br/><span className="text-gray-400 text-sm font-mono" dir="ltr">{p.barcode}</span></td>
                      <td className="p-4 text-gray-600">{p.originCountry || '-'}</td>
                      <td className="p-4"><span className={`px-3 py-1 rounded-full text-xs font-bold ${p.status === 'حلال' ? 'bg-green-100 text-green-700' : p.status === 'حرام' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{p.status}</span></td>
                      <td className="p-4"><button onClick={() => setEditingProduct(p)} className="text-blue-500 hover:text-blue-700 bg-blue-50 p-2 rounded-lg transition-colors"><Edit size={18}/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {products.length === 0 && <div className="p-8 text-center text-gray-500">لا توجد منتجات مسجلة بعد.</div>}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}