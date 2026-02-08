import React from 'react';
import { BrowserRouter as Router, Routes, Route, useSearchParams } from 'react-router-dom';
import { useCart } from './hooks/useCart';
import Header from './components/Header';
import Menu from './components/Menu';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import LandingPage from './components/LandingPage';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import ProtectedRoute from './components/ProtectedRoute';
import { useMenu } from './hooks/useMenu';
import { AuthProvider } from './contexts/AuthContext';
import { TableProvider, useTable } from './contexts/TableContext';

function MainAppContent() {
  const cart = useCart();
  const { menuItems } = useMenu();
  const { setTableNumber, serviceType, resetSelection } = useTable();
  const [searchParams] = useSearchParams();
  const [currentView, setCurrentView] = React.useState<'landing' | 'menu' | 'cart' | 'checkout'>('landing');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');

  // Initial view logic: if serviceType is already selected, go to menu
  React.useEffect(() => {
    if (serviceType) {
      setCurrentView('menu');
    } else {
      setCurrentView('landing');
    }
  }, [serviceType]);

  // Read table number from URL params
  React.useEffect(() => {
    const tableParam = searchParams.get('table');
    if (tableParam) {
      setTableNumber(tableParam);
    }
  }, [searchParams, setTableNumber]);

  const handleViewChange = (view: 'landing' | 'menu' | 'cart' | 'checkout') => {
    setCurrentView(view);
  };

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  // Filter menu items based on selected category
  const filteredMenuItems = selectedCategory === 'all'
    ? menuItems
    : menuItems.filter(item => item.category === selectedCategory);

  if (currentView === 'landing') {
    return <LandingPage onContinue={() => handleViewChange('menu')} />;
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      <Header
        cartItemsCount={cart.getTotalItems()}
        onCartClick={() => handleViewChange('cart')}
        onMenuClick={() => handleViewChange('menu')}
        onCategoryClick={handleCategoryClick}
        selectedCategory={selectedCategory}
      />

      {currentView === 'menu' && (
        <Menu
          menuItems={filteredMenuItems}
          addToCart={cart.addToCart}
          cartItems={cart.cartItems}
          updateQuantity={cart.updateQuantity}
        />
      )}

      {currentView === 'cart' && (
        <Cart
          cartItems={cart.cartItems}
          updateQuantity={cart.updateQuantity}
          removeFromCart={cart.removeFromCart}
          clearCart={cart.clearCart}
          getTotalPrice={cart.getTotalPrice}
          onContinueShopping={() => handleViewChange('menu')}
          onCheckout={() => handleViewChange('checkout')}
        />
      )}

      {currentView === 'checkout' && (
        <Checkout
          cartItems={cart.cartItems}
          totalPrice={cart.getTotalPrice()}
          onBack={() => handleViewChange('cart')}
        />
      )}

      {/* Hidden button for testing/resetting state if needed during dev */}
      {process.env.NODE_ENV === 'development' && (
        <button
          onClick={resetSelection}
          className="fixed bottom-4 right-4 text-[8px] text-gray-300 uppercase hover:text-black"
        >
          Reset Selection
        </button>
      )}
    </div>
  );
}

function MainApp() {
  return (
    <TableProvider>
      <MainAppContent />
    </TableProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<MainApp />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;