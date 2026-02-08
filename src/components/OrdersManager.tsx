import React, { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle, Clock, XCircle, RefreshCw, ChevronDown, Search, Image as ImageIcon, Download, Calendar, DollarSign, Printer, Utensils, Bell } from 'lucide-react';
import { useOrders, OrderWithItems } from '../hooks/useOrders';

interface OrdersManagerProps {
  onBack: () => void;
}

const OrdersManager: React.FC<OrdersManagerProps> = ({ onBack }) => {
  const playNotificationSound = () => {
    const audio = new Audio('/notification.mp3');
    audio.play().catch(e => console.warn('Audio play failed:', e));
  };

  const { orders, loading, error, updateOrderStatus } = useOrders({
    onNewOrder: () => playNotificationSound()
  });
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'>('all');
  const [sortKey, setSortKey] = useState<'created_at' | 'total' | 'customer_name' | 'status'>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Set default date range to today
  const getTodayDateString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [dateFrom, setDateFrom] = useState(getTodayDateString());
  const [dateTo, setDateTo] = useState(getTodayDateString());
  const [exporting, setExporting] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'preparing':
        return 'bg-blue-100 text-blue-800';
      case 'ready':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'preparing':
        return <RefreshCw className="h-4 w-4" />;
      case 'ready':
        return <CheckCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      setUpdating(orderId);
      await updateOrderStatus(orderId, newStatus);
    } catch (err) {
      alert('Failed to update order status');
    } finally {
      setUpdating(null);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateTimeForCSV = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).replace(/,/g, ''); // Remove commas for CSV compatibility
  };

  const formatServiceType = (type: string) => {
    switch (type.toLowerCase()) {
      case 'dine-in': return 'Dine-In';
      case 'pickup': return 'Takeout';
      case 'delivery': return 'Delivery';
      default: return type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ');
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = statusFilter === 'all' ? orders : orders.filter(o => o.status.toLowerCase() === statusFilter);

    // Apply date filters
    let dateFiltered = base;
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      dateFiltered = dateFiltered.filter(o => new Date(o.created_at) >= fromDate);
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      dateFiltered = dateFiltered.filter(o => new Date(o.created_at) <= toDate);
    }

    const searched = q.length === 0
      ? dateFiltered
      : dateFiltered.filter(o =>
        o.customer_name.toLowerCase().includes(q) ||
        o.contact_number.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q) ||
        (o.address || '').toLowerCase().includes(q)
      );
    const sorted = [...searched].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      switch (sortKey) {
        case 'total':
          return (a.total - b.total) * dir;
        case 'customer_name':
          return a.customer_name.localeCompare(b.customer_name) * dir;
        case 'status':
          return a.status.localeCompare(b.status) * dir;
        case 'created_at':
        default:
          return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
      }
    });
    return sorted;
  }, [orders, query, statusFilter, sortKey, sortDir, dateFrom, dateTo]);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'created_at' ? 'desc' : 'asc');
    }
  };

  const exportToCSV = () => {
    setExporting(true);
    try {
      // Filter completed orders only
      const completedOrders = filtered.filter(o => o.status.toLowerCase() === 'completed');

      if (completedOrders.length === 0) {
        alert('No completed orders to export.');
        setExporting(false);
        return;
      }

      // CSV Headers - Exact order as specified
      const headers = [
        'OrderID',
        'CustName',
        'ContactNum',
        'Email',
        'TotalSpent',
        'OrderDateandTime',
        'ServiceType',
        'remarks'
      ];

      // CSV Rows - Exact order as specified
      const rows = completedOrders.map(order => {
        return [
          order.id.slice(-8).toUpperCase(),
          order.customer_name,
          order.contact_number,
          'N/A', // Email field not in database
          order.total.toFixed(2),
          formatDateTimeForCSV(order.created_at),
          formatServiceType(order.service_type),
          order.notes || 'N/A'
        ];
      });

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      const dateStr = new Date().toISOString().split('T')[0];
      link.setAttribute('href', url);
      link.setAttribute('download', `completed_orders_${dateStr}.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert(`Successfully exported ${completedOrders.length} completed order(s)!`);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export orders. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const clearDateFilters = () => {
    setDateFrom('');
    setDateTo('');
  };

  const printReceipt = (order: OrderWithItems) => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print receipts');
      return;
    }

    // Get table number from order data (stored when order was created from URL param)
    const tableNumber = order.table_number;

    // Format order date
    const orderDate = new Date(order.created_at);
    const formattedDate = orderDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Build receipt HTML optimized for thermal printers (80mm width)
    const receiptHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt - Order #${order.id.slice(-8).toUpperCase()}</title>
  <style>
    @media print {
      @page {
        size: 80mm auto;
        margin: 0;
      }
      body {
        margin: 0;
        padding: 10mm;
      }
    }
    body {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      width: 80mm;
      margin: 0 auto;
      padding: 10px;
      line-height: 1.4;
    }
    .header {
      text-align: center;
      border-bottom: 1px dashed #000;
      padding-bottom: 10px;
      margin-bottom: 10px;
    }
    .header h1 {
      font-size: 18px;
      font-weight: bold;
      margin: 5px 0;
      text-transform: uppercase;
    }
    .header p {
      font-size: 10px;
      margin: 2px 0;
    }
    .section {
      margin: 10px 0;
    }
    .section-title {
      font-weight: bold;
      text-transform: uppercase;
      border-bottom: 1px solid #000;
      padding-bottom: 3px;
      margin-bottom: 5px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      margin: 3px 0;
    }
    .row-label {
      font-weight: bold;
    }
    .items {
      margin: 10px 0;
    }
    .item {
      margin: 8px 0;
      padding-bottom: 5px;
      border-bottom: 1px dotted #ccc;
    }
    .item-name {
      font-weight: bold;
      margin-bottom: 2px;
    }
    .item-details {
      font-size: 10px;
      color: #666;
      margin-left: 5px;
    }
    .item-price {
      text-align: right;
      margin-top: 2px;
    }
    .divider {
      border-top: 1px dashed #000;
      margin: 10px 0;
    }
    .total {
      font-weight: bold;
      font-size: 14px;
      text-align: right;
      margin-top: 10px;
    }
    .footer {
      text-align: center;
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px dashed #000;
      font-size: 10px;
    }
    .order-id {
      font-weight: bold;
      font-size: 14px;
      text-align: center;
      margin: 10px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Kalye 11 Kafe</h1>
    <p>Order Receipt</p>
  </div>

  <div class="order-id">
    Order #${order.id.slice(-8).toUpperCase()}
  </div>

  <div class="section">
    <div class="section-title">Customer Information</div>
    <div class="row">
      <span class="row-label">Name:</span>
      <span>${order.customer_name}</span>
    </div>
    <div class="row">
      <span class="row-label">Contact:</span>
      <span>${order.contact_number}</span>
    </div>
    <div class="row">
      <span class="row-label">Service:</span>
      <span>${formatServiceType(order.service_type)}</span>
    </div>
    ${tableNumber ? `
    <div class="row">
      <span class="row-label">Table:</span>
      <span>${tableNumber}</span>
    </div>
    ` : ''}
    ${order.address ? `
    <div class="row">
      <span class="row-label">Address:</span>
      <span>${order.address}</span>
    </div>
    ` : ''}
    ${order.pickup_time ? `
    <div class="row">
      <span class="row-label">Pickup Time:</span>
      <span>${order.pickup_time}</span>
    </div>
    ` : ''}
    ${order.party_size ? `
    <div class="row">
      <span class="row-label">Party Size:</span>
      <span>${order.party_size} person${order.party_size !== 1 ? 's' : ''}</span>
    </div>
    ` : ''}
    ${order.dine_in_time ? `
    <div class="row">
      <span class="row-label">Dine-in Time:</span>
      <span>${formatDateTime(order.dine_in_time)}</span>
    </div>
    ` : ''}
  </div>

  <div class="divider"></div>

  <div class="section">
    <div class="section-title">Order Items</div>
    <div class="items">
      ${order.order_items.map(item => `
        <div class="item">
          <div class="item-name">${item.name} x${item.quantity}</div>
          ${item.variation ? `<div class="item-details">Size: ${item.variation.name}</div>` : ''}
          ${item.add_ons && item.add_ons.length > 0 ? `
            <div class="item-details">
              Add-ons: ${item.add_ons.map((addon: any) =>
      addon.quantity > 1 ? `${addon.name} x${addon.quantity}` : addon.name
    ).join(', ')}
            </div>
          ` : ''}
          <div class="item-price">
            ₱${item.unit_price.toFixed(2)} x ${item.quantity} = ₱${item.subtotal.toFixed(2)}
          </div>
        </div>
      `).join('')}
    </div>
  </div>

  <div class="divider"></div>

  <div class="section">
    ${order.reference_number ? `
    <div class="row">
      <span class="row-label">Reference #:</span>
      <span>${order.reference_number}</span>
    </div>
    ` : ''}
    ${order.notes ? `
    <div class="row">
      <span class="row-label">Notes:</span>
      <span>${order.notes}</span>
    </div>
    ` : ''}
  </div>

  <div class="divider"></div>

  <div class="total">
    TOTAL: ₱${order.total.toFixed(2)}
  </div>

  <div class="footer">
    <div>Date: ${formattedDate}</div>
    <div>Status: ${order.status.toUpperCase()}</div>
    <div style="margin-top: 10px;">Thank you for your order!</div>
  </div>
</body>
</html>
    `;

    printWindow.document.write(receiptHTML);
    printWindow.document.close();

    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      // Close window after printing (optional)
      // printWindow.close();
    }, 250);
  };

  // Calculate total sales from completed orders
  const totalSales = useMemo(() => {
    return filtered
      .filter(order => order.status.toLowerCase() === 'completed')
      .reduce((sum, order) => sum + order.total, 0);
  }, [filtered]);

  // Calculate number of completed orders
  const completedOrdersCount = useMemo(() => {
    return filtered.filter(order => order.status.toLowerCase() === 'completed').length;
  }, [filtered]);

  // Aggregate items from completed orders for summary
  const itemSummary = useMemo(() => {
    const summary: Record<string, { name: string, quantity: number, total: number }> = {};

    filtered
      .filter(order => order.status.toLowerCase() === 'completed')
      .forEach(order => {
        order.order_items.forEach(item => {
          const key = `${item.name}-${item.variation?.name || 'base'}`;
          if (!summary[key]) {
            summary[key] = {
              name: item.variation ? `${item.name} (${item.variation.name})` : item.name,
              quantity: 0,
              total: 0
            };
          }
          summary[key].quantity += item.quantity;
          summary[key].total += item.subtotal;
        });
      });

    return Object.values(summary).sort((a, b) => b.quantity - a.quantity);
  }, [filtered]);

  const [showSummaryModal, setShowSummaryModal] = useState(false);

  // Calculate pending orders for today
  const todayPendingCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return order.status.toLowerCase() === 'pending' &&
        orderDate >= today &&
        orderDate < tomorrow;
    }).length;
  }, [orders]);

  // Show a subtle indicator when orders are being auto-refreshed
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  React.useEffect(() => {
    // Monitor when orders change to show refresh indicator
    setIsRefreshing(true);
    const timer = setTimeout(() => setIsRefreshing(false), 1000);
    return () => clearTimeout(timer);
  }, [orders.length]);

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Orders</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={onBack}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-black transition-colors duration-200"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Dashboard</span>
              </button>
              <h1 className="text-2xl font-playfair font-semibold text-black">Orders Management</h1>
              {todayPendingCount > 0 && (
                <div className="relative inline-flex items-center">
                  <div className="flex items-center space-x-2 bg-yellow-100 text-yellow-800 px-3 py-1.5 rounded-lg border border-yellow-300">
                    <Bell className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {todayPendingCount} pending order{todayPendingCount !== 1 ? 's' : ''} today
                    </span>
                  </div>
                </div>
              )}
              {isRefreshing && (
                <div className="flex items-center space-x-2 text-green-600 text-sm">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Auto-refreshing...</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm">
                <div className={`h-2 w-2 rounded-full ${isRefreshing ? 'bg-green-500 animate-pulse' : 'bg-green-500'}`}></div>
                <span className="text-gray-500">Live updates active</span>
              </div>
              <div className="text-sm text-gray-500">
                {orders.length} order{orders.length !== 1 ? 's' : ''} total
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Controls */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-200">
          <div className="flex flex-col gap-4">
            {/* Search and Status Row */}
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              <div className="flex-1 relative">
                <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search orders by name, phone, ID, address"
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleSort('created_at')}
                    className={`px-3 py-2 rounded-lg border text-sm flex items-center gap-1 ${sortKey === 'created_at' ? 'border-blue-500 text-blue-700 bg-blue-50' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                  >
                    Date
                    <ChevronDown className={`h-4 w-4 transition-transform ${sortKey === 'created_at' && sortDir === 'asc' ? 'rotate-180' : ''}`} />
                  </button>
                  <button
                    onClick={() => toggleSort('total')}
                    className={`px-3 py-2 rounded-lg border text-sm flex items-center gap-1 ${sortKey === 'total' ? 'border-blue-500 text-blue-700 bg-blue-50' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                  >
                    Total
                    <ChevronDown className={`h-4 w-4 transition-transform ${sortKey === 'total' && sortDir === 'asc' ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Date Filter and Export Row */}
            <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between border-t border-gray-200 pt-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Date Range:</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="From"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="To"
                  />
                  {(dateFrom || dateTo) && (
                    <button
                      onClick={clearDateFilters}
                      className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => setShowSummaryModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <Utensils className="h-4 w-4" />
                  View Item Summary
                </button>
                <button
                  onClick={exportToCSV}
                  disabled={exporting || filtered.filter(o => o.status.toLowerCase() === 'completed').length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
                >
                  <Download className="h-4 w-4" />
                  {exporting ? 'Exporting...' : 'Export Completed Orders'}
                </button>
              </div>
            </div>

            {/* Results count */}
            {(dateFrom || dateTo) && (
              <div className="text-sm text-gray-600">
                Showing {filtered.length} order{filtered.length !== 1 ? 's' : ''}
                {dateFrom && ` from ${new Date(dateFrom).toLocaleDateString()}`}
                {dateTo && ` to ${new Date(dateTo).toLocaleDateString()}`}
              </div>
            )}
          </div>
        </div>

        {/* Sales Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium mb-1">Total Sales</p>
                <p className="text-3xl font-bold">₱{totalSales.toFixed(2)}</p>
                <p className="text-green-100 text-xs mt-1">
                  {completedOrdersCount} completed order{completedOrdersCount !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <DollarSign className="h-8 w-8" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">All Orders</p>
                <p className="text-3xl font-bold">{filtered.length}</p>
                <p className="text-blue-100 text-xs mt-1">
                  {statusFilter === 'all' ? 'All statuses' : statusFilter}
                </p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <Clock className="h-8 w-8" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium mb-1">Average Order</p>
                <p className="text-3xl font-bold">
                  ₱{completedOrdersCount > 0 ? (totalSales / completedOrdersCount).toFixed(2) : '0.00'}
                </p>
                <p className="text-purple-100 text-xs mt-1">
                  Per completed order
                </p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <CheckCircle className="h-8 w-8" />
              </div>
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Orders Yet</h2>
            <p className="text-gray-600">Orders will appear here when customers place them.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600 sticky top-0">
                    <tr>
                      <th className="px-5 py-3 text-left font-medium">Order</th>
                      <th className="px-5 py-3 text-left font-medium">Customer</th>
                      <th className="px-5 py-3 text-left font-medium">Service</th>
                      <th className="px-5 py-3 text-left font-medium">Table</th>
                      <th className="px-5 py-3 text-left font-medium">Total</th>
                      <th className="px-5 py-3 text-left font-medium">Status</th>
                      <th className="px-5 py-3 text-left font-medium">Placed</th>
                      <th className="px-5 py-3 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filtered.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-5 py-4">
                          <div className="font-medium text-gray-900">#{order.id.slice(-8).toUpperCase()}</div>
                          <div className="text-xs text-gray-500">{order.order_items.length} item(s)</div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-medium text-gray-900">{order.customer_name}</div>
                          <div className="text-xs text-gray-500">{order.contact_number}</div>
                        </td>
                        <td className="px-5 py-4 text-gray-700">{formatServiceType(order.service_type)}</td>
                        <td className="px-5 py-4">
                          {order.table_number ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-black text-white">
                              {order.table_number}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4 font-semibold text-gray-900">₱{order.total.toFixed(2)}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1 capitalize">{order.status}</span>
                          </span>
                        </td>
                        <td className="px-5 py-4 text-gray-700">{formatDateTime(order.created_at)}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700"
                            >
                              View
                            </button>
                            <button
                              onClick={() => printReceipt(order)}
                              className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700 flex items-center gap-1"
                              title="Print Receipt"
                            >
                              <Printer className="h-4 w-4" />
                              <span className="hidden lg:inline">Print</span>
                            </button>
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                              disabled={updating === order.id}
                              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="preparing">Preparing</option>
                              <option value="ready">Ready</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                            {updating === order.id && (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {filtered.map((order) => (
                <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-gray-900">#{order.id.slice(-8).toUpperCase()}</div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1 capitalize">{order.status}</span>
                      </span>
                    </div>
                    <div className="text-sm text-gray-700 mb-2">
                      <div className="font-medium">{order.customer_name}</div>
                      <div className="text-gray-500">{order.contact_number}</div>
                    </div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <div className="text-gray-600">{formatServiceType(order.service_type)}</div>
                      {order.table_number && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-black text-white">
                          Table #{order.table_number}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="text-gray-600">Total</div>
                      <div className="font-semibold text-gray-900">₱{order.total.toFixed(2)}</div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{formatDateTime(order.created_at)}</div>
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-100"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => printReceipt(order)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-100 flex items-center justify-center gap-1"
                        title="Print Receipt"
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                        disabled={updating === order.id}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm flex-1"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="preparing">Preparing</option>
                        <option value="ready">Ready</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-2xl">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Order #{selectedOrder.id.slice(-8).toUpperCase()}
                </h3>
                <p className="text-sm text-gray-500 mt-1">Complete order details</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => printReceipt(selectedOrder)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  title="Print Receipt"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                >
                  <XCircle className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Customer Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Name:</strong> {selectedOrder.customer_name}</p>
                    <p><strong>Contact:</strong> {selectedOrder.contact_number}</p>
                    <p><strong>Service Type:</strong> {formatServiceType(selectedOrder.service_type)}</p>
                    {selectedOrder.table_number && (
                      <p><strong>Table Number:</strong> #{selectedOrder.table_number}</p>
                    )}
                    <p><strong>Order Date:</strong> {formatDateTime(selectedOrder.created_at)}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Order Details</h4>
                  <div className="space-y-2 text-sm">
                    {selectedOrder.address && <p><strong>Address:</strong> {selectedOrder.address}</p>}
                    {selectedOrder.pickup_time && <p><strong>Pickup Time:</strong> {selectedOrder.pickup_time}</p>}
                    {selectedOrder.party_size && <p><strong>Party Size:</strong> {selectedOrder.party_size} person{selectedOrder.party_size !== 1 ? 's' : ''}</p>}
                    {selectedOrder.dine_in_time && <p><strong>Dine-in Time:</strong> {formatDateTime(selectedOrder.dine_in_time)}</p>}
                    {selectedOrder.notes && <p><strong>Notes:</strong> {selectedOrder.notes}</p>}
                    <p><strong>Total:</strong> ₱{selectedOrder.total.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Payment Receipt */}
              {selectedOrder.receipt_url && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <ImageIcon className="h-5 w-5 mr-2" />
                    Payment Receipt
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <a
                      href={selectedOrder.receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block group"
                    >
                      <img
                        src={selectedOrder.receipt_url}
                        alt="Payment Receipt"
                        className="w-full max-w-md mx-auto rounded-lg border-2 border-gray-300 group-hover:border-blue-500 transition-colors cursor-pointer"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="18" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EImage not available%3C/text%3E%3C/svg%3E';
                        }}
                      />
                      <p className="text-center text-sm text-blue-600 group-hover:text-blue-700 mt-2">
                        Click to view full size
                      </p>
                    </a>
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Order Items</h4>
                <div className="space-y-3">
                  {selectedOrder.order_items.map((item) => (
                    <div key={item.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{item.name}</div>
                          {item.variation && (
                            <div className="text-sm text-gray-600 mt-1">Size: {item.variation.name}</div>
                          )}
                          {item.add_ons && item.add_ons.length > 0 && (
                            <div className="text-sm text-gray-600 mt-1">
                              Add-ons: {item.add_ons.map((addon: any) =>
                                addon.quantity > 1 ? `${addon.name} x${addon.quantity}` : addon.name
                              ).join(', ')}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900">₱{item.unit_price.toFixed(2)} x {item.quantity}</div>
                          <div className="text-sm text-gray-600">₱{item.subtotal.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Item Summary Modal */}
      {showSummaryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                  <Utensils className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 border-none">Item Sales Summary</h3>
                  <p className="text-sm text-gray-500">
                    {dateFrom || dateTo
                      ? `From ${dateFrom || 'start'} to ${dateTo || 'now'}`
                      : 'All completed orders'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSummaryModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XCircle className="h-6 w-6 text-gray-400" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {itemSummary.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No completed items found for the selected period.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-12 text-xs font-bold text-gray-400 uppercase tracking-wider pb-2 border-b">
                    <div className="col-span-7">Item Name</div>
                    <div className="col-span-2 text-center">Qty</div>
                    <div className="col-span-3 text-right">Total Revenue</div>
                  </div>

                  {itemSummary.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 items-center py-3 border-b border-gray-50 last:border-0">
                      <div className="col-span-7 font-medium text-gray-900">{item.name}</div>
                      <div className="col-span-2 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          x{item.quantity}
                        </span>
                      </div>
                      <div className="col-span-3 text-right font-semibold text-gray-900">
                        ₱{item.total.toFixed(2)}
                      </div>
                    </div>
                  ))}

                  <div className="mt-6 pt-6 border-t-2 border-gray-100">
                    <div className="flex justify-between items-center px-2">
                      <span className="text-gray-500 font-medium">Grand Total Revenue</span>
                      <span className="text-2xl font-black text-green-600">
                        ₱{itemSummary.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-gray-50 rounded-b-2xl flex justify-end">
              <button
                onClick={() => setShowSummaryModal(false)}
                className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all active:scale-95"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersManager;
