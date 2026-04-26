import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Camera, Clock, Package, MapPin } from 'lucide-react';
import { getVendors } from '../../api/vendors.api';
import { placePhotoOrder } from '../../api/orders.api';
import { toWebP, uploadPhoto } from '../../utils/uploadPhoto';
import { getVehicleTypes, getBrands, getModels } from '../../api/vehicles.api';

const CUR_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CUR_YEAR - 1999 }, (_, i) => String(CUR_YEAR - i));

export default function PhotoOrderPage() {
  const navigate              = useNavigate();
  const fileRef               = useRef(null);
  const [preview, setPreview] = useState(null);
  const [webpBlob, setWebpBlob] = useState(null);
  const [note, setNote]       = useState('');
  const [vendors, setVendors] = useState([]);
  const [vendorId, setVendorId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError]     = useState('');
  const [placedOrder, setPlacedOrder] = useState(null);

  // Structured vehicle fields
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [vehicleType, setVehicleType]   = useState('');
  const [brands, setBrands]             = useState([]);
  const [brand, setBrand]               = useState('');
  const [models, setModels]             = useState([]);
  const [model, setModel]               = useState('');
  const [year, setYear]                 = useState('');
  const [quantity, setQuantity]         = useState(1);

  useEffect(() => {
    getVendors().then(setVendors).catch(() => setError('Could not load vendors'));
    getVehicleTypes().then(setVehicleTypes).catch(() => {});
  }, []);

  useEffect(() => {
    if (!vehicleType) { setBrands([]); setBrand(''); return; }
    getBrands(vehicleType).then((data) => setBrands(data.map((b) => b.name))).catch(() => setBrands([]));
    setBrand(''); setModel('');
  }, [vehicleType]);

  useEffect(() => {
    if (!brand) { setModels([]); setModel(''); return; }
    getModels(brand, vehicleType).then((data) => setModels(data.map((m) => m.model_name))).catch(() => setModels([]));
    setModel('');
  }, [brand]);

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) { setError('Please select an image file'); return; }
    setError('');
    const blob = await toWebP(file);
    setWebpBlob(blob);
    setPreview(URL.createObjectURL(blob));
  };

  const handlePlace = async () => {
    if (!webpBlob)    { setError('Please add a photo'); return; }
    if (!vehicleType) { setError('Please select a vehicle type'); return; }
    if (!brand)       { setError('Please select a brand'); return; }
    if (!model)       { setError('Please select a model'); return; }
    if (!year)        { setError('Please select year of manufacture'); return; }
    if (!vendorId)    { setError('Please select a vendor'); return; }
    setError('');
    setUploading(true);
    try {
      const photoUrl = await uploadPhoto(webpBlob, 'orders');
      const result   = await placePhotoOrder({
        vendor_id: vendorId,
        items: [{
          photo_url:        photoUrl,
          vehicle_brand:    brand,
          vehicle_model:    model,
          manufacture_year: year,
          quantity,
          note:             note.trim() || null,
        }],
      });
      setPlacedOrder(result.orders[0]);
    } catch (err) {
      setError(err.message?.includes('Upload') ? err.message : err.response?.data?.error || 'Failed to place order');
    } finally { setUploading(false); }
  };

  /* ── Done ── */
  if (placedOrder) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 max-w-sm w-full">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={30} className="text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Order Placed!</h2>
          <p className="font-mono font-bold text-gray-800 mb-5">{placedOrder?.order_number}</p>
          <div className="space-y-3 text-left mb-6">
            {[
              { icon: Camera,       cls: 'text-blue-500',  label: 'Photo shared with supplier' },
              { icon: Clock,        cls: 'text-indigo-500',label: 'Supplier will confirm shortly' },
              { icon: Package,      cls: 'text-gray-400',  label: 'Parts will be ready for pickup' },
            ].map(({ icon: Icon, cls, label }) => (
              <div key={label} className="flex items-center gap-3 text-sm text-gray-600">
                <Icon size={16} className={cls} /><span>{label}</span>
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/orders')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-sm">
            Track My Orders
          </button>
        </div>
      </div>
    );
  }

  const selectedVendor = vendors.find((v) => String(v.id) === String(vendorId));
  const canPlace = webpBlob && vehicleType && brand && model && year && vendorId;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-lg mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-7">
          <button onClick={() => navigate('/retailer')} className="text-gray-400 hover:text-gray-600 text-sm font-medium">← Back</button>
          <h1 className="text-xl font-bold text-gray-900">Photo Order</h1>
        </div>

        <div className="space-y-5">
          {/* Photo upload */}
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 shadow-sm overflow-hidden"
            onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
            onDragOver={(e) => e.preventDefault()}>
            {preview ? (
              <div className="relative">
                <img src={preview} alt="Part" className="w-full max-h-72 object-contain bg-gray-100" />
                <button onClick={() => { setPreview(null); setWebpBlob(null); }}
                  className="absolute top-2 right-2 bg-white/90 hover:bg-white border border-gray-200 text-gray-600 rounded-full w-8 h-8 flex items-center justify-center text-sm shadow">✕</button>
                <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                  <p className="text-xs text-gray-400">WebP · {webpBlob ? `${(webpBlob.size / 1024).toFixed(0)} KB` : ''}</p>
                </div>
              </div>
            ) : (
              <button className="w-full p-10 text-center" onClick={() => fileRef.current?.click()}>
                <Camera size={48} className="mx-auto mb-3 text-gray-400" />
                <p className="text-base font-semibold text-gray-700 mb-1">Upload a photo of the part</p>
                <p className="text-sm text-gray-400">Tap to select · or drag and drop</p>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => handleFile(e.target.files[0])} />
          </div>

          {/* Vehicle details */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
            <p className="text-sm font-semibold text-gray-700">Vehicle Details</p>

            {/* Vehicle type */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Vehicle Type</label>
              <div className="flex flex-wrap gap-2">
                {vehicleTypes.map((t) => (
                  <button key={t.name} type="button" onClick={() => setVehicleType(t.name)}
                    className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                      vehicleType === t.name ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-blue-300'
                    }`}>
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Brand */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Brand</label>
              <select value={brand} onChange={(e) => setBrand(e.target.value)} disabled={!vehicleType}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40">
                <option value="">Select brand…</option>
                {brands.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            {/* Model */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Model</label>
              <select value={model} onChange={(e) => setModel(e.target.value)} disabled={!brand}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40">
                <option value="">Select model…</option>
                {models.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Year + Quantity */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Year of Manufacture</label>
                <select value={year} onChange={(e) => setYear(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select year…</option>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Quantity</label>
                <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

          {/* Optional note */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Additional Notes <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="Any specific requirement or details…"
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          {/* Vendor selector */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Select Vendor</label>
            {vendors.length === 0 ? (
              <p className="text-sm text-gray-400">Loading vendors…</p>
            ) : (
              <div className="space-y-2">
                {vendors.map((v) => (
                  <button key={v.id} onClick={() => setVendorId(String(v.id))}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                      String(vendorId) === String(v.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-blue-300 hover:bg-gray-50'
                    }`}>
                    <p className="text-sm font-semibold text-gray-900">{v.name}</p>
                    {(v.city || v.state) && <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><MapPin size={11} />{[v.city, v.state].filter(Boolean).join(', ')}</p>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-red-500 text-sm px-1">{error}</p>}

          <button onClick={handlePlace} disabled={uploading || !canPlace}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl text-sm transition-colors flex items-center justify-center gap-2 shadow-sm">
            {uploading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {uploading ? 'Uploading photo…' : `Place Order${selectedVendor ? ` → ${selectedVendor.name}` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
