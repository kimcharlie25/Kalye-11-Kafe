import React, { useState } from 'react';
import { Plus, Minus, X, ShoppingCart } from 'lucide-react';
import { MenuItem, Variation, AddOn } from '../types';

interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem, quantity?: number, variation?: Variation, addOns?: AddOn[]) => void;
  quantity: number;
  cartItemId?: string;
  onUpdateQuantity: (id: string, quantity: number) => void;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({
  item,
  onAddToCart,
  quantity,
  cartItemId,
  onUpdateQuantity
}) => {
  const [showCustomization, setShowCustomization] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<Variation | undefined>(
    item.variations?.[0]
  );
  const [selectedAddOns, setSelectedAddOns] = useState<(AddOn & { quantity: number })[]>([]);

  // Determine discount display values
  const basePrice = item.basePrice;
  const effectivePrice = item.effectivePrice ?? basePrice;
  const hasExplicitDiscount = Boolean(item.isOnDiscount && item.discountPrice !== undefined);
  const hasImplicitDiscount = effectivePrice < basePrice;
  const showDiscount = hasExplicitDiscount || hasImplicitDiscount;
  const discountedPrice = hasExplicitDiscount
    ? (item.discountPrice as number)
    : (hasImplicitDiscount ? effectivePrice : undefined);

  const calculatePrice = () => {
    // If variation is selected, use variation price as the base (variation prices are total prices)
    // Otherwise, use effective price (discounted or regular) as base
    let price = selectedVariation ? selectedVariation.price : effectivePrice;
    // Add add-ons to the price
    selectedAddOns.forEach(addOn => {
      price += addOn.price * addOn.quantity;
    });
    return price;
  };

  const handleAddToCart = () => {
    if (item.variations?.length || item.addOns?.length) {
      setShowCustomization(true);
    } else {
      onAddToCart(item, 1);
    }
  };

  const handleCustomizedAddToCart = () => {
    // Convert selectedAddOns back to regular AddOn array for cart
    const addOnsForCart: AddOn[] = selectedAddOns.flatMap(addOn =>
      Array(addOn.quantity).fill({ ...addOn, quantity: undefined })
    );
    onAddToCart(item, 1, selectedVariation, addOnsForCart);
    setShowCustomization(false);
    setSelectedAddOns([]);
  };

  const handleIncrement = () => {
    if (!cartItemId) return;
    onUpdateQuantity(cartItemId, quantity + 1);
  };

  const handleDecrement = () => {
    if (quantity > 0 && cartItemId) {
      onUpdateQuantity(cartItemId, quantity - 1);
    }
  };

  const updateAddOnQuantity = (addOn: AddOn, quantity: number) => {
    setSelectedAddOns(prev => {
      const existingIndex = prev.findIndex(a => a.id === addOn.id);

      if (quantity === 0) {
        // Remove add-on if quantity is 0
        return prev.filter(a => a.id !== addOn.id);
      }

      if (existingIndex >= 0) {
        // Update existing add-on quantity
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], quantity };
        return updated;
      } else {
        // Add new add-on with quantity
        return [...prev, { ...addOn, quantity }];
      }
    });
  };

  const groupedAddOns = item.addOns?.reduce((groups, addOn) => {
    const category = addOn.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(addOn);
    return groups;
  }, {} as Record<string, AddOn[]>);

  return (
    <>
      <div className={`bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group animate-scale-in border border-gray-100 ${!item.available ? 'opacity-60' : ''}`}>
        {/* Image Container with Badges */}
        <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`absolute inset-0 flex items-center justify-center ${item.image ? 'hidden' : ''}`}>
            <div className="text-6xl opacity-20 text-gray-400">☕</div>
          </div>

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {item.isOnDiscount && item.discountPrice && (
              <div className="bg-black text-white text-[10px] font-black px-3 py-1.5 rounded-none shadow-lg tracking-widest uppercase">
                SALE
              </div>
            )}
            {item.popular && (
              <div className="bg-white text-black text-[10px] font-black px-3 py-1.5 rounded-none shadow-lg border border-black tracking-widest uppercase">
                POPULAR
              </div>
            )}
          </div>

          {!item.available && (
            <div className="absolute top-3 right-3 bg-gray-400 text-white text-[10px] font-black px-3 py-1.5 rounded-none shadow-lg tracking-widest uppercase">
              UNAVAILABLE
            </div>
          )}

          {/* Discount Percentage Badge */}
          {showDiscount && discountedPrice !== undefined && (
            <div className="absolute bottom-3 right-3 bg-black text-white text-[10px] font-black px-2 py-1 rounded-none shadow-lg border border-white tracking-widest">
              {Math.round(((basePrice - discountedPrice) / basePrice) * 100)}% OFF
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <h4 className="text-lg font-semibold text-gray-900 leading-tight flex-1 pr-2">{item.name}</h4>
            {item.variations && item.variations.length > 0 && (
              <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full whitespace-nowrap">
                {item.variations.length} sizes
              </div>
            )}
          </div>

          <p className={`text-sm mb-4 leading-relaxed ${!item.available ? 'text-gray-400' : 'text-gray-600'}`}>
            {!item.available ? 'Currently Unavailable' : item.description}
          </p>

          {/* Pricing Section */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              {showDiscount && discountedPrice !== undefined ? (
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl font-black text-black">
                      ₱{discountedPrice.toFixed(2)}
                    </span>
                    <span className="text-sm text-gray-400 line-through">
                      ₱{basePrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">
                    Save ₱{(basePrice - discountedPrice).toFixed(2)}
                  </div>
                </div>
              ) : (
                <div className="text-2xl font-black text-black">
                  ₱{basePrice.toFixed(2)}
                </div>
              )}

              {item.variations && item.variations.length > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  Starting price
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex-shrink-0">
              {!item.available ? (
                <button
                  disabled
                  className="bg-gray-200 text-gray-500 px-4 py-2.5 rounded-xl cursor-not-allowed font-medium text-sm"
                >
                  Unavailable
                </button>
              ) : quantity === 0 ? (
                <button
                  onClick={handleAddToCart}
                  className="bg-black text-white px-4 py-2 rounded-xl hover:bg-gray-800 transition-all duration-200 transform hover:scale-105 font-sans font-large text-lg shadow-lg hover:shadow-xl"
                >
                  {item.variations?.length || item.addOns?.length ? 'Customize' : '+'}
                </button>
              ) : (
                <div className="flex items-center space-x-2 bg-black rounded-none p-1 border border-black">
                  <button
                    onClick={handleDecrement}
                    className="p-2 hover:bg-gray-800 rounded-none transition-colors duration-200"
                  >
                    <Minus className="h-4 w-4 text-white" />
                  </button>
                  <span className="font-black text-white min-w-[28px] text-center text-sm">{quantity}</span>
                  <button
                    onClick={handleIncrement}
                    className="p-2 hover:bg-gray-800 rounded-none transition-colors duration-200"
                  >
                    <Plus className="h-4 w-4 text-white" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Stock indicator */}
          {item.trackInventory && item.stockQuantity !== null && item.stockQuantity !== undefined && (
            <div className="mt-3">
              {item.stockQuantity > (item.lowStockThreshold ?? 0) ? (
                <div className="flex items-center space-x-2 text-xs text-black border border-black px-3 py-2 rounded-none font-bold">
                  <span className="font-semibold">✓</span>
                  <span className="uppercase tracking-widest">{item.stockQuantity} in stock</span>
                </div>
              ) : item.stockQuantity > 0 ? (
                <div className="flex items-center space-x-2 text-xs text-white bg-black px-3 py-2 rounded-none border border-black animate-pulse font-bold">
                  <span className="font-semibold">⚠️</span>
                  <span className="uppercase tracking-widest">Only {item.stockQuantity} left!</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-xs text-gray-400 border border-gray-400 px-3 py-2 rounded-none font-bold">
                  <span className="font-semibold">✕</span>
                  <span className="uppercase tracking-widest">Out of stock</span>
                </div>
              )}
            </div>
          )}

          {/* Add-ons indicator */}
          {item.addOns && item.addOns.length > 0 && (
            <div className="flex items-center space-x-1 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg mt-2">
              <span>+</span>
              <span>{item.addOns.length} add-on{item.addOns.length > 1 ? 's' : ''} available</span>
            </div>
          )}
        </div>
      </div>

      {/* Customization Modal */}
      {showCustomization && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-2xl">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Customize {item.name}</h3>
                <p className="text-sm text-gray-500 mt-1">Choose your preferences</p>
              </div>
              <button
                onClick={() => setShowCustomization(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              {/* Stock indicator in modal */}
              {item.trackInventory && item.stockQuantity !== null && item.stockQuantity !== undefined && (
                <div className="mb-6">
                  {item.stockQuantity > (item.lowStockThreshold ?? 0) ? (
                    <div className="flex items-center space-x-2 text-sm text-black border-2 border-black px-4 py-3 rounded-none font-bold">
                      <span className="font-semibold">✓</span>
                      <span className="uppercase tracking-widest">{item.stockQuantity} available in stock</span>
                    </div>
                  ) : item.stockQuantity > 0 ? (
                    <div className="flex items-center space-x-2 text-sm text-white bg-black px-4 py-3 rounded-none border-2 border-black font-bold uppercase tracking-widest">
                      <span className="font-semibold">⚠️</span>
                      <span className="font-medium">Hurry! Only {item.stockQuantity} left in stock</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-sm text-gray-400 border-2 border-gray-400 px-4 py-3 rounded-none font-bold uppercase tracking-widest">
                      <span className="font-semibold">✕</span>
                      <span className="font-medium">Currently out of stock</span>
                    </div>
                  )}
                </div>
              )}

              {/* Size Variations */}
              {item.variations && item.variations.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Choose Size</h4>
                  <div className="space-y-3">
                    {item.variations.map((variation) => (
                      <label
                        key={variation.id}
                        className={`flex items-center justify-between p-4 border-2 transition-all duration-200 ${selectedVariation?.id === variation.id
                          ? 'border-black bg-black text-white'
                          : 'border-gray-200 hover:border-black hover:bg-gray-50 text-black'
                          }`}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name="variation"
                            checked={selectedVariation?.id === variation.id}
                            onChange={() => setSelectedVariation(variation)}
                            className="text-black focus:ring-black h-4 w-4"
                          />
                          <span className="font-bold uppercase text-xs tracking-widest">{variation.name}</span>
                        </div>
                        <span className="font-black">
                          ₱{variation.price.toFixed(2)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Add-ons */}
              {groupedAddOns && Object.keys(groupedAddOns).length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Add-ons</h4>
                  {Object.entries(groupedAddOns).map(([category, addOns]) => (
                    <div key={category} className="mb-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-3 capitalize">
                        {category.replace('-', ' ')}
                      </h5>
                      <div className="space-y-3">
                        {addOns.map((addOn) => (
                          <div
                            key={addOn.id}
                            className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
                          >
                            <div className="flex-1">
                              <span className="font-medium text-gray-900">{addOn.name}</span>
                              <div className="text-sm text-gray-600">
                                {addOn.price > 0 ? `₱${addOn.price.toFixed(2)} each` : 'Free'}
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              {selectedAddOns.find(a => a.id === addOn.id) ? (
                                <div className="flex items-center space-x-2 bg-black rounded-none p-1 border border-black">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const current = selectedAddOns.find(a => a.id === addOn.id);
                                      updateAddOnQuantity(addOn, (current?.quantity || 1) - 1);
                                    }}
                                    className="p-1.5 hover:bg-gray-800 rounded-none transition-colors duration-200"
                                  >
                                    <Minus className="h-3 w-3 text-white" />
                                  </button>
                                  <span className="font-black text-white min-w-[24px] text-center text-xs">
                                    {selectedAddOns.find(a => a.id === addOn.id)?.quantity || 0}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const current = selectedAddOns.find(a => a.id === addOn.id);
                                      updateAddOnQuantity(addOn, (current?.quantity || 0) + 1);
                                    }}
                                    className="p-1.5 hover:bg-gray-800 rounded-none transition-colors duration-200"
                                  >
                                    <Plus className="h-3 w-3 text-white" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => updateAddOnQuantity(addOn, 1)}
                                  className="flex items-center space-x-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all duration-200 text-sm font-sans font-medium shadow-lg"
                                >
                                  <Plus className="h-3 w-3" />
                                  <span>Add</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Price Summary */}
              <div className="border-t-2 border-black pt-4 mb-6">
                <div className="flex items-center justify-between text-2xl font-black text-black uppercase tracking-tighter">
                  <span>Total:</span>
                  <span>₱{calculatePrice().toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleCustomizedAddToCart}
                className="w-full bg-black text-white py-4 rounded-lg hover:bg-gray-800 transition-all duration-200 font-sans font-semibold flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <ShoppingCart className="h-5 w-5" />
                <span>Add to Cart - ₱{calculatePrice().toFixed(2)}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MenuItemCard;
