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
  const { createOrder, error } = useOrders();
  const { tableNumber, serviceType, resetSelection } = useTable();
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [uiNotice, setUiNotice] = useState<string | null>(null);
  // Order confirmation modal state
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  // Local submitting state to prevent double-click race condition
  const [submitting, setSubmitting] = useState(false);


  const handleConfirmOrder = async () => {
    // Prevent double-click: if already submitting, do nothing
    if (submitting) return;
    setSubmitting(true);
    // Persist order to database
    try {
      await createOrder({
        customerName,
        contactNumber: '', // Empty contact number
        serviceType: serviceType === 'takeout' ? 'pickup' : (serviceType || 'dine-in'),
        paymentMethod: 'cash', // Default payment method
        notes: notes || undefined,
        total: totalPrice,
        items: cartItems,
        tableNumber: tableNumber ?? undefined,
      });

      // Show confirmation modal
      setShowConfirmationModal(true);
    } catch (e) {
      setSubmitting(false); // Reset on error to allow retry
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
    // Clear selection and refresh/redirect to landing page
    resetSelection();
    window.location.href = '/';
  };

  const isDetailsValid = customerName;

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
          <h1 className="text-4xl font-sans font-black text-black ml-8 uppercase tracking-tighter">Checkout</h1>
        </div>

        {uiNotice && (
          <div className="mb-4 rounded-lg border border-yellow-300 bg-yellow-50 text-yellow-800 p-4 text-sm font-sans">
            {uiNotice}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Customer Details Form */}
          <div className="bg-white border-2 border-black p-6">
            <h2 className="text-2xl font-sans font-black text-black mb-8 uppercase tracking-tighter">Customer Information</h2>

            <form className="space-y-6">
              {/* Customer Information */}
              <div>
                <label className="block text-sm font-medium text-black mb-2 font-sans">Full Name *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-black rounded-none focus:ring-0 focus:border-black transition-all duration-200 font-sans font-bold"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              {/* Special Notes */}
              <div>
                <label className="block text-sm font-medium text-black mb-2 font-sans">Special Instructions</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-black rounded-none focus:ring-0 focus:border-black transition-all duration-200 font-sans"
                  placeholder="Any special requests or notes..."
                  rows={3}
                />
              </div>

            </form>
          </div>

          {/* Order Summary */}
          <div className="bg-white border-2 border-black p-6">
            <h2 className="text-2xl font-sans font-black text-black mb-8 uppercase tracking-tighter">Order Summary</h2>

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

            <div className="border-t-2 border-black pt-4 mb-8">
              <div className="flex items-center justify-between text-3xl font-sans font-black text-black uppercase tracking-tighter">
                <span>Total:</span>
                <span>₱{totalPrice}</span>
              </div>
            </div>

            <button
              onClick={handleConfirmOrder}
              disabled={!isDetailsValid || submitting}
              className={`w-full py-5 rounded-none font-sans font-black text-xl uppercase tracking-widest transition-all duration-300 transform ${!isDetailsValid || submitting
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed border-2 border-gray-200'
                : 'bg-black text-white hover:bg-white hover:text-black border-2 border-black hover:scale-[1.02]'
                }`}
            >
              {submitting ? (
                <span className="flex items-center justify-center space-x-2">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Processing...</span>
                </span>
              ) : (
                'Place Order'
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
            <div className="p-10 text-center">
              <div className="text-7xl mb-6">✅</div>
              <h3 className="text-3xl font-sans font-black text-black mb-4 uppercase tracking-tighter">Order Confirmed</h3>
              <p className="text-black opacity-60 mb-10 font-sans uppercase text-xs tracking-widest font-bold">
                Your order has been successfully placed and will be processed shortly.
              </p>
              <button
                onClick={handleModalOkay}
                className="w-full bg-black text-white py-4 rounded-none hover:bg-white hover:text-black border-2 border-black transition-all duration-300 font-sans font-black uppercase tracking-widest"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Checkout;
