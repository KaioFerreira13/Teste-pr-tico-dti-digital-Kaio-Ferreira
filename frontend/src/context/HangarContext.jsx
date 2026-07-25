import React, { createContext, useState } from 'react';

export const HangarContext = createContext(null);

export const HangarProvider = ({ children }) => {
  const [selectedHangarId, setSelectedHangarState] = useState(() => localStorage.getItem('selectedHangarId') || '');

  const setSelectedHangarId = (hangarId) => {
    setSelectedHangarState(hangarId);
    if (hangarId) localStorage.setItem('selectedHangarId', hangarId);
    else localStorage.removeItem('selectedHangarId');
  };

  return (
    <HangarContext.Provider value={{ selectedHangarId, setSelectedHangarId }}>
      {children}
    </HangarContext.Provider>
  );
};
