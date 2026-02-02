import React, { useMemo, useState, useEffect } from 'react';
import { ArrowLeft, Clock, CheckCircle, Flame, Utensils } from 'lucide-react';
import { useOrders } from '../hooks/useOrders';

interface KitchenDisplayProps {
  onBack: () => void;
}

const KitchenDisplay: React.FC<KitchenDisplayProps> = ({ onBack }) => {
  const playNotificationSound = () => {
    const audio = new Audio('/notification.mp3');
    audio.play().catch(e => console.warn('Audio play failed:', e));
  };

  const { orders, loading, updateOrderStatus } = useOrders({
    onNewOrder: () => playNotificationSound()
  });
  const [now, setNow] = useState(new Date());

  // Update clock every minute for elapsed time
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const kitchenOrders = useMemo(() => {
    return orders.filter(order =>
      ['confirmed', 'preparing'].includes(order.status.toLowerCase())
    ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [orders]);

  const getTimeElapsed = (createdAt: string) => {
    const start = new Date(createdAt);
    const diff = Math.floor((now.getTime() - start.getTime()) / 60000); // Diff in minutes

    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    return `${hours}h ${mins}m ago`;
  };

  const getUrgencyColor = (createdAt: string) => {
    const diff = Math.floor((now.getTime() - new Date(createdAt).getTime()) / 60000);
    if (diff > 20) return 'text-red-600 bg-red-50 border-red-200';
    if (diff > 10) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const handleStatusUpdate = async (orderId: string, currentStatus: string) => {
    const nextStatus = currentStatus.toLowerCase() === 'confirmed' ? 'preparing' : 'ready';
    try {
      await updateOrderStatus(orderId, nextStatus);
    } catch (err) {
      alert('Failed to update status');
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-12">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="h-6 w-6 text-gray-600" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Utensils className="h-6 w-6 mr-2 text-orange-600" />
                Kitchen Display
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {kitchenOrders.length} Active Order{kitchenOrders.length !== 1 ? 's' : ''}
              </div>
              <div className="text-sm text-gray-400">
                Last updated: {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {kitchenOrders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-dashed border-gray-300">
            <div className="text-6xl mb-4">👨‍🍳</div>
            <h2 className="text-xl font-medium text-gray-900">No active orders in the kitchen</h2>
            <p className="text-gray-500 mt-2">New orders will appear here once confirmed.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kitchenOrders.map((order) => (
              <div
                key={order.id}
                className={`flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden border-2 h-full transition-all duration-300 ${order.status === 'preparing' ? 'border-orange-500' : 'border-gray-100'
                  }`}
              >
                {/* Card Header */}
                <div className={`p-4 border-b ${order.status === 'preparing' ? 'bg-orange-50' : 'bg-gray-50'
                  }`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Order</span>
                      <h3 className="text-lg font-black text-gray-900">#{order.id.slice(-8).toUpperCase()}</h3>
                    </div>
                    <div className={`flex items-center px-3 py-1 rounded-full border text-xs font-bold ${getUrgencyColor(order.created_at)}`}>
                      <Clock className="h-3 w-3 mr-1" />
                      {getTimeElapsed(order.created_at)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500">Customer</span>
                      <span className="font-bold text-gray-900">{order.customer_name}</span>
                    </div>
                    {order.table_number && (
                      <div className="bg-black text-white px-3 py-1 rounded-lg text-center">
                        <span className="text-[10px] block leading-none opacity-70">TABLE</span>
                        <span className="text-lg font-black leading-none">{order.table_number}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Content - Items */}
                <div className="p-4 flex-1">
                  <div className="space-y-4">
                    {order.order_items.map((item, idx) => (
                      <div key={idx} className="flex flex-col pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                        <div className="flex justify-between items-start">
                          <div className="flex items-start">
                            <span className="inline-flex items-center justify-center h-6 w-6 rounded bg-gray-900 text-white font-bold text-lg mr-3 mt-0.5">
                              {item.quantity}
                            </span>
                            <div>
                              <p className="font-bold text-gray-900 leading-tight">{item.name}</p>
                              {item.variation && (
                                <p className="text-xs font-bold text-orange-600 mt-1 uppercase">
                                  {item.variation.name}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        {item.add_ons && item.add_ons.length > 0 && (
                          <div className="ml-9 mt-2 p-2 bg-gray-50 rounded-lg">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-1">Add-ons:</p>
                            <ul className="text-xs space-y-1">
                              {item.add_ons.map((addon: any, aidx: number) => (
                                <li key={aidx} className="flex items-center text-gray-700">
                                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300 mr-2"></span>
                                  {addon.quantity > 1 ? `${addon.name} x${addon.quantity}` : addon.name}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {order.notes && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded-xl">
                      <p className="text-[10px] font-bold text-yellow-600 uppercase mb-1">Kitchen Notes:</p>
                      <p className="text-sm text-yellow-800 font-medium">{order.notes}</p>
                    </div>
                  )}
                </div>

                {/* Card Footer - Actions */}
                <div className="p-4 bg-gray-50 border-t">
                  <button
                    onClick={() => handleStatusUpdate(order.id, order.status)}
                    className={`w-full py-4 rounded-xl flex items-center justify-center font-black uppercase tracking-widest transition-all duration-200 ${order.status === 'confirmed'
                      ? 'bg-orange-600 text-white shadow-lg shadow-orange-200 hover:bg-orange-700 active:scale-95'
                      : 'bg-green-600 text-white shadow-lg shadow-green-200 hover:bg-green-700 active:scale-95'
                      }`}
                  >
                    {order.status === 'confirmed' ? (
                      <>
                        <Flame className="h-5 w-5 mr-2" />
                        Start Preparing
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Mark as Ready
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default KitchenDisplay;
