"use client";

import { useState, useEffect } from "react";

export interface SavedProperty {
  id: string;
  title: string;
  slug: string;
  address: string;
  price: number;
  image: string;
}

export function useWishlist() {
  const [wishlist, setWishlist] = useState<SavedProperty[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load from local storage
    const loadWishlist = () => {
      const saved = localStorage.getItem("elite_wishlist");
      if (saved) {
        try {
          setWishlist(JSON.parse(saved));
        } catch {}
      }
    };
    
    loadWishlist();
    setIsLoaded(true);

    const handleWishlistUpdate = () => {
      setTimeout(() => loadWishlist(), 0);
    };

    window.addEventListener("wishlist_updated", handleWishlistUpdate);
    return () => window.removeEventListener("wishlist_updated", handleWishlistUpdate);
  }, []);

  const toggleWishlist = (property: SavedProperty) => {
    if (!isLoaded) return;

    setWishlist((current) => {
      const exists = current.some((p) => p.id === property.id);
      const next = exists ? current.filter((p) => p.id !== property.id) : [...current, property];
      localStorage.setItem("elite_wishlist", JSON.stringify(next));
      window.dispatchEvent(new Event("wishlist_updated"));
      return next;
    });
  };

  const isInWishlist = (id: string) => {
    return wishlist.some((p) => p.id === id);
  };

  return { wishlist, isLoaded, toggleWishlist, isInWishlist };
}
