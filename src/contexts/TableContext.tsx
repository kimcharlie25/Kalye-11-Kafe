import React, { createContext, useContext, useEffect, useState } from 'react';

interface TableContextType {
  tableNumber: string | null;
  serviceType: 'dine-in' | 'takeout' | null;
  setTableNumber: (table: string | null) => void;
  setServiceType: (type: 'dine-in' | 'takeout' | null) => void;
  clearTableNumber: () => void;
  resetSelection: () => void;
}

const TableContext = createContext<TableContextType | undefined>(undefined);

export const useTable = () => {
  const context = useContext(TableContext);
  if (context === undefined) {
    throw new Error('useTable must be used within a TableProvider');
  }
  return context;
};

interface TableProviderProps {
  children: React.ReactNode;
}

export const TableProvider: React.FC<TableProviderProps> = ({ children }) => {
  const [tableNumber, setTableNumberState] = useState<string | null>(null);
  const [serviceType, setServiceTypeState] = useState<'dine-in' | 'takeout' | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const storedTable = localStorage.getItem('tableNumber');
    if (storedTable) {
      setTableNumberState(storedTable);
    }
  }, []);

  // Save to localStorage whenever values change
  useEffect(() => {
    if (tableNumber !== null) {
      localStorage.setItem('tableNumber', tableNumber.toString());
    } else {
      localStorage.removeItem('tableNumber');
    }
  }, [tableNumber]);

  const setTableNumber = (table: string | null) => {
    setTableNumberState(table);
  };

  const setServiceType = (type: 'dine-in' | 'takeout' | null) => {
    setServiceTypeState(type);
  };

  const clearTableNumber = () => {
    setTableNumberState(null);
    localStorage.removeItem('tableNumber');
  };

  const resetSelection = () => {
    setTableNumberState(null);
    setServiceTypeState(null);
    localStorage.removeItem('tableNumber');
  };

  const value = {
    tableNumber,
    serviceType,
    setTableNumber,
    setServiceType,
    clearTableNumber,
    resetSelection,
  };

  return (
    <TableContext.Provider value={value}>
      {children}
    </TableContext.Provider>
  );
};

