import { createContext, useContext } from "react";

const ProfileContext = createContext(null);

export const ProfileProvider = ({ value, children }) => {
  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => useContext(ProfileContext);
