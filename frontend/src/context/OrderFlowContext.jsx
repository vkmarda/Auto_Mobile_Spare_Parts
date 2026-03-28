import { createContext, useContext, useState } from 'react';

const OrderFlowContext = createContext(null);

export function OrderFlowProvider({ children }) {
  const [vehicleType, setVehicleType] = useState(null);
  const [brand,       setBrand]       = useState(null);
  const [model,       setModel]       = useState(null);
  const [category,    setCategory]    = useState(null);

  const resetFlow = () => {
    setVehicleType(null);
    setBrand(null);
    setModel(null);
    setCategory(null);
  };

  return (
    <OrderFlowContext.Provider value={{
      vehicleType, setVehicleType,
      brand, setBrand,
      model, setModel,
      category, setCategory,
      resetFlow,
    }}>
      {children}
    </OrderFlowContext.Provider>
  );
}

export const useOrderFlow = () => useContext(OrderFlowContext);
