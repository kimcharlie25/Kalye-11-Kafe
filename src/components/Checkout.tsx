import React, { useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { CartItem } from '../types';
import { useOrders } from '../hooks/useOrders';
import { useTable } from '../contexts/TableContext';

interface CheckoutProps {
  cartItems: CartItem[];
  totalPrice: number;
  onBack: () => void;
}

const Checkout: React.FC<CheckoutProps> = ({ cartItems, totalPrice, onBack }) => {
  const { createOrder, creating, error } = useOrders();
  const { tableNumber } = useTable();
  const [customerName, setCustomerName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [uiNotice, setUiNotice] = useState<string | null>(null);
  // Order confirmation modal state
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);


  const handleConfirmOrder = async () => {
    // Persist order to database
    try {
      const order = await createOrder({
        customerName,
        contactNumber,
        serviceType: 'dine-in', // Set to dine-in as requested
        paymentMethod: 'cash', // Default payment method
        notes: notes || undefined,
        total: totalPrice,
        items: cartItems,
        tableNumber: tableNumber ?? undefined,
      });
      
      // Show confirmation modal
      setShowConfirmationModal(true);
    } catch (e) {
      const raw = e instanceof Error ? e.message : '';
      if (/insufficient stock/i.test(raw)) {
        setUiNotice(raw);
        return;
      }
      if (/rate limit/i.test(raw)) {
        setUiNotice('Too many orders: Please wait 1 minute before placing another order.');
      } else if (/missing identifiers/i.test(raw)) {
        setUiNotice('Too many orders: Please wait 1 minute before placing another order.');
      } else {
        setUiNotice('Failed to create order. Please try again.');
      }
      return;
    }
  };

  const handleModalOkay = () => {
    // Refresh and redirect to landing page
    window.location.href = '/';
  };

  const isDetailsValid = customerName && contactNumber;

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-black transition-colors duration-200 font-sans"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Cart</span>
          </button>
          <h1 className="text-3xl font-sans font-bold text-[#FF0000] ml-8">Checkout</h1>
        </div>

        {uiNotice && (
          <div className="mb-4 rounded-lg border border-yellow-300 bg-yellow-50 text-yellow-800 p-4 text-sm font-sans">
            {uiNotice}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Customer Details Form */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-2xl font-sans font-bold text-[#FF0000] mb-6">Customer Information</h2>
            
            <form className="space-y-6">
              {/* Customer Information */}
              <div>
                <label className="block text-sm font-medium text-black mb-2 font-sans">Full Name *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 font-sans"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2 font-sans">Contact Number *</label>
                <input
                  type="tel"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 font-sans"
                  placeholder="09XX XXX XXXX"
                  required
                />
              </div>

              {/* Special Notes */}
              <div>
                <label className="block text-sm font-medium text-black mb-2 font-sans">Special Instructions</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 font-sans"
                  placeholder="Any special requests or notes..."
                  rows={3}
                />
              </div>

            </form>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-2xl font-sans font-bold text-[#FF0000] mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-6">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-200">
                  <div>
                    <h4 className="font-medium text-black font-sans">{item.name}</h4>
                    {item.selectedVariation && (
                      <p className="text-sm text-gray-600 font-sans">Size: {item.selectedVariation.name}</p>
                    )}
                    {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                      <p className="text-sm text-gray-600 font-sans">
                        Add-ons: {item.selectedAddOns.map(addOn => 
                          addOn.quantity && addOn.quantity > 1 
                            ? `${addOn.name} x${addOn.quantity}`
                            : addOn.name
                        ).join(', ')}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 font-sans">₱{item.totalPrice} x {item.quantity}</p>
                  </div>
                  <span className="font-semibold text-black font-sans">₱{item.totalPrice * item.quantity}</span>
                </div>
              ))}
            </div>
            
            <div className="border-t border-gray-200 pt-4 mb-6">
              <div className="flex items-center justify-between text-2xl font-sans font-bold text-[#FF0000]">
                <span>Total:</span>
                <span>₱{totalPrice}</span>
              </div>
            </div>

            <button
              onClick={handleConfirmOrder}
              disabled={!isDetailsValid || creating}
              className={`w-full py-4 rounded-lg font-sans font-medium text-lg transition-all duration-200 transform ${
                !isDetailsValid || creating
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-black text-white hover:bg-gray-800 hover:scale-[1.02]'
              }`}
            >
              {creating ? (
                <span className="flex items-center justify-center space-x-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Confirming Order...</span>
                </span>
              ) : (
                'Confirm Order'
              )}
            </button>
            {error && !uiNotice && (
              <p className="text-sm text-[#FF0000] text-center mt-2 font-sans">{error}</p>
            )}
          </div>
        </div>
      </div>

      {/* Order Confirmation Modal */}
      {showConfirmationModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-2xl font-sans font-bold text-[#FF0000] mb-4">Order Confirmed!</h3>
              <p className="text-gray-600 mb-6 font-sans">
                Your order has been successfully placed and will be processed shortly.
              </p>
              <button
                onClick={handleModalOkay}
                className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-all duration-200 font-sans font-medium"
              >
                Okay
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Checkout;
