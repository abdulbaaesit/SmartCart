'use client';

import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from 'react';

export type CartItem = {
  productId: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  size?: string;
};

type User = {
  user_id: number;
  email: string;
  name?: string;
};

type UserContextType = {
  user: User | null;
  setUser: (u: User | null) => void;

  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;

  wishlist: number[];
  setWishlist: React.Dispatch<React.SetStateAction<number[]>>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, _setUser] = useState<User | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        const parsed: User = JSON.parse(raw);
        _setUser(parsed);
      }
    } catch (e) {
      console.error('Failed to hydrate user from localStorage', e);
    }
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const setUser = (u: User | null) => {
    _setUser(u);
  };

  return (
    <UserContext.Provider
      value={{ user, setUser, cart, setCart, wishlist, setWishlist }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUserContext() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUserContext must be inside UserProvider');
  return ctx;
}
