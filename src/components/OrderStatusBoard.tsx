import React, { useMemo, useState, useEffect } from 'react';
import { ArrowLeft, ChefHat, CheckCircle } from 'lucide-react';
import { useOrders } from '../hooks/useOrders';

interface OrderStatusBoardProps {
    onBack: () => void;
}

const OrderStatusBoard: React.FC<OrderStatusBoardProps> = ({ onBack }) => {
    const { orders, loading } = useOrders();
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 30000);
        return () => clearInterval(timer);
    }, []);

    const preparingOrders = useMemo(() => {
        return orders
            .filter(order => order.status.toLowerCase() === 'preparing')
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }, [orders]);

    const readyOrders = useMemo(() => {
        return orders
            .filter(order => order.status.toLowerCase() === 'ready')
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }, [orders]);

    if (loading && orders.length === 0) {
        return (
            <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-gray-700 rounded-full transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5 text-gray-400" />
                    </button>
                    <h1 className="text-xl font-bold text-white tracking-wide">ORDER STATUS</h1>
                </div>
                <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse"></div>
                        <span className="text-sm font-medium text-gray-300">{preparingOrders.length} Preparing</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-sm font-medium text-gray-300">{readyOrders.length} Ready</span>
                    </div>
                    <span className="text-sm text-gray-500">
                        {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </div>

            {/* Two-column board */}
            <div className="flex-1 grid grid-cols-2 gap-0 overflow-hidden">
                {/* Preparing Column */}
                <div className="flex flex-col border-r border-gray-700 overflow-hidden">
                    <div className="bg-orange-600 px-6 py-4 flex items-center space-x-3 flex-shrink-0">
                        <ChefHat className="h-7 w-7 text-white" />
                        <span className="text-2xl font-black text-white uppercase tracking-widest">Preparing</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {preparingOrders.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <div className="text-6xl mb-4 opacity-30">🍳</div>
                                    <p className="text-gray-500 text-lg font-medium">No orders preparing</p>
                                </div>
                            </div>
                        ) : (
                            preparingOrders.map(order => (
                                <div
                                    key={order.id}
                                    className="bg-gray-800 border border-orange-500/30 rounded-xl px-5 py-4 flex items-center justify-between transition-all duration-300"
                                >
                                    <div className="flex items-center space-x-5">
                                        <div className="bg-orange-600 text-white font-black text-xl px-4 py-2 rounded-lg min-w-[80px] text-center">
                                            #{order.id.slice(-8).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-white text-lg font-bold">{order.customer_name}</p>
                                            <span className={`text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded ${order.service_type === 'dine-in'
                                                ? 'bg-white/10 text-white'
                                                : 'bg-orange-500/20 text-orange-300'
                                                }`}>
                                                {order.service_type === 'pickup' ? 'Takeout' : order.service_type.replace('-', ' ')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Ready Column */}
                <div className="flex flex-col overflow-hidden">
                    <div className="bg-green-600 px-6 py-4 flex items-center space-x-3 flex-shrink-0">
                        <CheckCircle className="h-7 w-7 text-white" />
                        <span className="text-2xl font-black text-white uppercase tracking-widest">Ready</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {readyOrders.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <div className="text-6xl mb-4 opacity-30">✅</div>
                                    <p className="text-gray-500 text-lg font-medium">No orders ready</p>
                                </div>
                            </div>
                        ) : (
                            readyOrders.map(order => (
                                <div
                                    key={order.id}
                                    className="bg-gray-800 border border-green-500/30 rounded-xl px-5 py-4 flex items-center justify-between animate-pulse-slow transition-all duration-300"
                                >
                                    <div className="flex items-center space-x-5">
                                        <div className="bg-green-600 text-white font-black text-xl px-4 py-2 rounded-lg min-w-[80px] text-center">
                                            #{order.id.slice(-8).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-white text-lg font-bold">{order.customer_name}</p>
                                            <span className={`text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded ${order.service_type === 'dine-in'
                                                ? 'bg-white/10 text-white'
                                                : 'bg-green-500/20 text-green-300'
                                                }`}>
                                                {order.service_type === 'pickup' ? 'Takeout' : order.service_type.replace('-', ' ')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderStatusBoard;
