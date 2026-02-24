import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Wallet, Banknote as CashIcon, CheckCircle2 } from 'lucide-react';
import { CartItem } from '../types';
import { useOrders } from '../hooks/useOrders';
import { useTable } from '../contexts/TableContext';
import { usePaymentMethods } from '../hooks/usePaymentMethods';

interface CheckoutProps {
  cartItems: CartItem[];
  totalPrice: number;
  onBack: () => void;
}

const Checkout: React.FC<CheckoutProps> = ({ cartItems, totalPrice, onBack }) => {
  const { createOrder, error } = useOrders();
  const { tableNumber, serviceType, resetSelection } = useTable();
  const { paymentMethods, loading: loadingMethods } = usePaymentMethods();

  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [uiNotice, setUiNotice] = useState<string | null>(null);
  const [selectedMethodId, setSelectedMethodId] = useState<string>('cash');

  // Order confirmation modal state
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  // Local submitting state to prevent double-click race condition
  const [submitting, setSubmitting] = useState(false);

  // Set default payment method once methods are loaded
  useEffect(() => {
    if (paymentMethods.length > 0 && !selectedMethodId) {
      const defaultMethod = paymentMethods.find(m => m.active) || paymentMethods[0];
      setSelectedMethodId(defaultMethod.id);
    }
  }, [paymentMethods, selectedMethodId]);

  const handleConfirmOrder = async () => {
    // Prevent double-click: if already submitting, do nothing
    if (submitting) return;
    setSubmitting(true);

    const selectedMethod = paymentMethods.find(m => m.id === selectedMethodId);

    // Persist order to database
    try {
      await createOrder({
        customerName,
        contactNumber: '', // Empty contact number
        serviceType: serviceType === 'takeout' ? 'pickup' : (serviceType || 'dine-in'),
        paymentMethod: selectedMethod?.name || 'Cash',
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

  const isDetailsValid = customerName && selectedMethodId;

  const currentMethod = paymentMethods.find(m => m.id === selectedMethodId);

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
          <div className="space-y-8">
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

            {/* Payment Method Selection */}
            <div className="bg-white border-2 border-black p-6">
              <h2 className="text-2xl font-sans font-black text-black mb-8 uppercase tracking-tighter">Payment Method</h2>

              {loadingMethods ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  <p className="text-sm text-gray-400 font-sans uppercase tracking-widest">Loading methods...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setSelectedMethodId(method.id)}
                        className={`flex items-center justify-between p-4 border-2 transition-all duration-200 ${selectedMethodId === method.id
                          ? 'border-black bg-black text-white'
                          : 'border-gray-200 hover:border-black text-black'
                          }`}
                      >
                        <div className="flex items-center space-x-3">
                          {method.id === 'cash' ? (
                            <CashIcon className="h-5 w-5" />
                          ) : (
                            <Wallet className="h-5 w-5" />
                          )}
                          <span className="font-sans font-bold uppercase tracking-tight">{method.name}</span>
                        </div>
                        {selectedMethodId === method.id && (
                          <CheckCircle2 className="h-5 w-5 text-white" />
                        )}
                      </button>
                    ))}
                  </div>

                  {currentMethod && currentMethod.id !== 'cash' && (
                    <div className="mt-6 p-6 border-2 border-dashed border-gray-300 bg-gray-50 space-y-4">
                      <div className="text-center">
                        <p className="text-xs text-gray-500 font-sans uppercase tracking-widest mb-1">Send payment to</p>
                        <h4 className="text-xl font-sans font-black text-black uppercase">{currentMethod.name}</h4>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 font-sans uppercase tracking-tight">Account Name:</span>
                          <span className="font-sans font-bold text-black uppercase">{currentMethod.account_name}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 font-sans uppercase tracking-tight">Account Number:</span>
                          <span className="font-sans font-bold text-black">{currentMethod.account_number}</span>
                        </div>
                      </div>

                      {currentMethod.qr_code_url && (
                        <div className="pt-4 flex flex-col items-center">
                          <p className="text-[10px] text-gray-400 font-sans uppercase tracking-widest mb-3">Scan QR Code to Pay</p>
                          <img
                            src={currentMethod.qr_code_url}
                            alt={`${currentMethod.name} QR Code`}
                            className="w-48 h-48 object-contain bg-white p-2 border border-gray-200"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white border-2 border-black p-6 h-fit">
            <h2 className="text-2xl font-sans font-black text-black mb-8 uppercase tracking-tighter">Order Summary</h2>

            <div className="space-y-4 mb-6">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-200">
                  <div className="pr-4">
                    <h4 className="font-bold text-black font-sans uppercase tracking-tight">{item.name}</h4>
                    {item.selectedVariation && (
                      <p className="text-[10px] text-gray-500 font-sans uppercase tracking-widest mt-1">Size: {item.selectedVariation.name}</p>
                    )}
                    {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                      <p className="text-[10px] text-gray-500 font-sans uppercase tracking-widest">
                        Add-ons: {item.selectedAddOns.map(addOn =>
                          addOn.quantity && addOn.quantity > 1
                            ? `${addOn.name} x${addOn.quantity}`
                            : addOn.name
                        ).join(', ')}
                      </p>
                    )}
                    <p className="text-xs text-gray-600 font-sans mt-1">₱{item.totalPrice} x {item.quantity}</p>
                  </div>
                  <span className="font-bold text-black font-sans">₱{item.totalPrice * item.quantity}</span>
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
                ? 'bg-gray-100 text-gray-300 cursor-not-allowed border-2 border-gray-100'
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
              <p className="text-sm text-[#FF0000] text-center mt-4 font-sans uppercase tracking-tight font-bold">{error}</p>
            )}

            <p className="mt-6 text-[10px] text-gray-400 font-sans text-center uppercase tracking-widest leading-relaxed">
              By placing this order, you agree to our terms of service and confirm that the information provided is accurate.
            </p>
          </div>
        </div>
      </div>

      {/* Order Confirmation Modal */}
      {showConfirmationModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-md w-full border-4 border-black shadow-[20px_20px_0px_0px_rgba(0,0,0,1)]">
            <div className="p-10 text-center">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-black flex items-center justify-center">
                  <CheckCircle2 className="h-12 w-12 text-white" />
                </div>
              </div>
              <h3 className="text-3xl font-sans font-black text-black mb-4 uppercase tracking-tighter">Order Confirmed</h3>
              <p className="text-black opacity-60 mb-6 font-sans uppercase text-xs tracking-widest font-bold leading-relaxed">
                Your order has been successfully placed and will be processed shortly. Thank you for choosing Kalye 11 Kafe!
              </p>

              {currentMethod && currentMethod.id !== 'cash' && (
                <div className="mb-8 p-6 bg-gray-50 border-2 border-dashed border-gray-300">
                  <p className="text-[10px] text-gray-500 font-sans uppercase tracking-widest mb-4">Payment Details</p>
                  <div className="space-y-2 mb-4 text-left">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-sans uppercase">Method:</span>
                      <span className="font-sans font-bold text-black uppercase">{currentMethod.name}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-sans uppercase">Account:</span>
                      <span className="font-sans font-bold text-black uppercase">{currentMethod.account_name}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-sans uppercase">Number:</span>
                      <span className="font-sans font-bold text-black">{currentMethod.account_number}</span>
                    </div>
                  </div>
                  {currentMethod.qr_code_url && (
                    <div className="flex flex-col items-center border-t border-gray-200 pt-4">
                      <img
                        src={currentMethod.qr_code_url}
                        alt="QR Code"
                        className="w-40 h-40 object-contain bg-white p-2 border border-gray-200"
                      />
                      <p className="text-[9px] text-gray-400 font-sans uppercase tracking-widest mt-2">Scan to pay now</p>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleModalOkay}
                className="w-full bg-black text-white py-4 rounded-none hover:bg-white hover:text-black border-2 border-black transition-all duration-300 font-sans font-black uppercase tracking-widest"
              >
                Return Home
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Checkout;
