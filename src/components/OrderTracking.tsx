import React, { useState } from 'react';
import { ArrowLeft, Clock, CheckCircle, XCircle, RefreshCw, Package, MapPin, Phone, User, Calendar, DollarSign, FileText, Search, AlertCircle, CreditCard } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { usePaymentMethods, PaymentMethod } from '../hooks/usePaymentMethods';
import type { OrderWithItems } from '../hooks/useOrders';

interface OrderTrackingProps {
  onBack: () => void;
}

const OrderTracking: React.FC<OrderTrackingProps> = ({ onBack }) => {
  const [searchType, setSearchType] = useState<'orderId' | 'phone'>('orderId');
  const [searchValue, setSearchValue] = useState('');
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { paymentMethods } = usePaymentMethods();

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'preparing':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'ready':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock className="h-5 w-5" />;
      case 'confirmed':
        return <CheckCircle className="h-5 w-5" />;
      case 'preparing':
        return <RefreshCw className="h-5 w-5" />;
      case 'ready':
        return <Package className="h-5 w-5" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'Your order is pending confirmation.';
      case 'confirmed':
        return 'Your order has been confirmed!';
      case 'preparing':
        return 'Your order is being prepared.';
      case 'ready':
        return 'Your order is ready for pickup/delivery!';
      case 'completed':
        return 'Your order has been completed. Thank you!';
      case 'cancelled':
        return 'Your order has been cancelled.';
      default:
        return 'Processing your order...';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatServiceType = (serviceType: string) => {
    return serviceType.charAt(0).toUpperCase() + serviceType.slice(1).replace('-', ' ');
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchValue.trim()) {
      setError('Please enter a search value');
      return;
    }

    setLoading(true);
    setError(null);
    setOrder(null);

    try {
      if (searchType === 'orderId') {
        // Search by order ID using database function for UUID text matching
        const { data: orderData, error: orderError } = await supabase
          .rpc('search_order_by_id', { search_term: searchValue.trim() });

        if (orderError) {
          // Fallback to client-side filtering if function doesn't exist yet
          console.warn('Database function not found, using fallback method:', orderError);
          const { data, error: fetchError } = await supabase
            .from('orders')
            .select(`
              *,
              order_items (*)
            `)
            .order('created_at', { ascending: false })
            .limit(100);

          if (fetchError) throw fetchError;

          const searchValueUpper = searchValue.trim().toUpperCase();
          const matchingOrder = data?.find(order =>
            order.id.slice(-8).toUpperCase().includes(searchValueUpper) ||
            order.id.toUpperCase().includes(searchValueUpper)
          );

          if (matchingOrder) {
            setOrder(matchingOrder as OrderWithItems);
          } else {
            setError('No order found with this ID');
          }
        } else if (orderData && orderData.length > 0) {
          // Fetch order items separately
          const { data: items, error: itemsError } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', orderData[0].id);

          if (itemsError) throw itemsError;

          setOrder({
            ...orderData[0],
            order_items: items || []
          } as OrderWithItems);
        } else {
          setError('No order found with this ID');
        }
      } else {
        // Search by phone number
        const { data, error: fetchError } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (*)
          `)
          .eq('contact_number', searchValue.trim())
          .order('created_at', { ascending: false })
          .limit(1);

        if (fetchError) throw fetchError;

        if (data && data.length > 0) {
          setOrder(data[0] as OrderWithItems);
        } else {
          setError('No order found with this phone number');
        }
      }
    } catch (err) {
      console.error('Error searching for order:', err);
      setError('Failed to search for order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchValue('');
    setOrder(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-red-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-black transition-colors duration-200"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Menu</span>
              </button>
              <h1 className="text-2xl font-noto font-semibold text-black">Track Your Order</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Search Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-5 w-5 text-red-600" />
            <h2 className="text-lg font-semibold text-gray-900">Search Order</h2>
          </div>

          <form onSubmit={handleSearch} className="space-y-4">
            {/* Search Type Toggle */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSearchType('orderId')}
                className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${searchType === 'orderId'
                    ? 'border-red-600 bg-red-50 text-red-700 font-medium'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
              >
                Order ID
              </button>
              <button
                type="button"
                onClick={() => setSearchType('phone')}
                className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${searchType === 'phone'
                    ? 'border-red-600 bg-red-50 text-red-700 font-medium'
                    : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
              >
                Phone Number
              </button>
            </div>

            {/* Search Input */}
            <div className="flex gap-3">
              <input
                type={searchType === 'phone' ? 'tel' : 'text'}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={searchType === 'orderId' ? 'Enter Order ID (e.g., ABC12345)' : 'Enter phone number'}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium whitespace-nowrap"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Order Details */}
        {order && (
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Order Status</h2>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${getStatusColor(order.status)}`}>
                  {getStatusIcon(order.status)}
                  <span className="font-medium capitalize">{order.status}</span>
                </div>
              </div>
              <p className="text-gray-600">{getStatusMessage(order.status)}</p>
            </div>

            {/* Order Information */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-red-600" />
                Order Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-red-50 rounded-lg">
                    <Package className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Order ID</p>
                    <p className="font-semibold text-gray-900">#{order.id.slice(-8).toUpperCase()}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-red-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Order Date</p>
                    <p className="font-semibold text-gray-900">{formatDateTime(order.created_at)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-red-50 rounded-lg">
                    <User className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Customer Name</p>
                    <p className="font-semibold text-gray-900">{order.customer_name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-red-50 rounded-lg">
                    <Phone className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Contact Number</p>
                    <p className="font-semibold text-gray-900">{order.contact_number}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-red-50 rounded-lg">
                    <MapPin className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Service Type</p>
                    <p className="font-semibold text-gray-900">{formatServiceType(order.service_type)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-red-50 rounded-lg">
                    <DollarSign className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="font-semibold text-gray-900 text-xl">₱{order.total.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {order.address && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500 mb-1">Delivery Address</p>
                  <p className="text-gray-900">{order.address}</p>
                </div>
              )}

              {order.notes && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500 mb-1">Special Instructions</p>
                  <p className="text-gray-900">{order.notes}</p>
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-red-600" />
                Order Items
              </h3>
              <div className="space-y-3">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      {item.variation && (
                        <p className="text-sm text-gray-600">Size: {item.variation.name}</p>
                      )}
                      {item.add_ons && item.add_ons.length > 0 && (
                        <p className="text-sm text-gray-600">
                          Add-ons: {item.add_ons.map((addon: any) =>
                            addon.quantity > 1 ? `${addon.name} x${addon.quantity}` : addon.name
                          ).join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-gray-900">₱{item.unit_price.toFixed(2)} x {item.quantity}</p>
                      <p className="font-semibold text-red-600">₱{item.subtotal.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Information */}
            {order.payment_method.toLowerCase() !== 'cash' && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-red-600" />
                  Payment Information
                </h3>
                {(() => {
                  const methodDetails = paymentMethods.find(m => m.name.toLowerCase() === order.payment_method.toLowerCase());
                  if (!methodDetails) {
                    return <p className="text-sm text-gray-500 italic uppercase tracking-wider">Payment method details not available for {order.payment_method}</p>;
                  }
                  return (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-red-50 rounded-lg">
                            <CreditCard className="h-5 w-5 text-red-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Method</p>
                            <p className="font-semibold text-gray-900 uppercase">{methodDetails.name}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-red-50 rounded-lg">
                            <User className="h-5 w-5 text-red-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Account Name</p>
                            <p className="font-semibold text-gray-900 uppercase">{methodDetails.account_name}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-red-50 rounded-lg">
                            <Phone className="h-5 w-5 text-red-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Account Number</p>
                            <p className="font-semibold text-gray-900">{methodDetails.account_number}</p>
                          </div>
                        </div>
                      </div>

                      {methodDetails.qr_code_url && (
                        <div className="pt-4 flex flex-col items-center bg-gray-50 p-6 rounded-lg border border-dashed border-gray-300">
                          <p className="text-[10px] text-gray-400 font-sans uppercase tracking-widest mb-4">Scan QR Code to Pay</p>
                          <img
                            src={methodDetails.qr_code_url}
                            alt={`${methodDetails.name} QR Code`}
                            className="w-48 h-48 object-contain bg-white p-2 border border-gray-200"
                          />
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Search Again Button */}
            <div className="text-center">
              <button
                onClick={handleClearSearch}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Search Another Order
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderTracking;

