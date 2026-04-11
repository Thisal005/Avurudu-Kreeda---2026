// ──────────────────────────────────────────────────────────────
// useFirecrackerInventory.ts — Manages Kreeda Points balance,
// firecracker inventory, active item selection and localStorage
// persistence. All localStorage access is try-caught.
// ──────────────────────────────────────────────────────────────

import { useCallback, useEffect, useState } from 'react';
import {
  FirecrackerType,
  LS_KEY_INVENTORY,
  LS_KEY_POINTS,
} from '../GiniUthsawayaConfig';

export interface InventoryManager {
  totalPoints: number;
  inventory: Record<string, number>;
  activeItemId: string | null;
  setActiveItemId: React.Dispatch<React.SetStateAction<string | null>>;
  ownedItems: string[];
  buyItem: (item: FirecrackerType, qty?: number) => void;
  consumeItem: (id: string) => void;
}

// ── Helpers ──────────────────────────────────────────────────

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (err) {
    console.warn(`[Inventory] localStorage.getItem("${key}") failed:`, err);
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    console.warn(`[Inventory] localStorage.setItem("${key}") failed:`, err);
  }
}

function ownedKeys(inv: Record<string, number>): string[] {
  return Object.keys(inv).filter((k) => inv[k] > 0);
}

// ── Hook ─────────────────────────────────────────────────────

export function useFirecrackerInventory(): InventoryManager {
  const [totalPoints, setTotalPoints] = useState(0);
  const [inventory, setInventory] = useState<Record<string, number>>({});
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  // Derived
  const ownedItems = ownedKeys(inventory);

  // ── Load from localStorage on mount ────────────────────────
  useEffect(() => {
    const savedPoints = safeGetItem(LS_KEY_POINTS);
    if (savedPoints) {
      const parsed = parseInt(savedPoints, 10);
      if (!Number.isNaN(parsed)) setTotalPoints(parsed);
    }

    const savedInventory = safeGetItem(LS_KEY_INVENTORY);
    if (savedInventory) {
      try {
        const parsed: Record<string, number> = JSON.parse(savedInventory);
        setInventory(parsed);
        const items = ownedKeys(parsed);
        if (items.length > 0) setActiveItemId(items[0]);
      } catch (err) {
        console.warn('[Inventory] Failed to parse saved inventory:', err);
      }
    }
  }, []);

  // ── Auto-select when inventory changes ─────────────────────
  useEffect(() => {
    if (activeItemId && inventory[activeItemId] === 0) {
      const items = ownedKeys(inventory);
      setActiveItemId(items.length > 0 ? items[0] : null);
    } else if (!activeItemId && ownedKeys(inventory).length > 0) {
      setActiveItemId(ownedKeys(inventory)[0]);
    }
  }, [inventory, activeItemId]);

  // ── Buy ────────────────────────────────────────────────────
  const buyItem = useCallback(
    (item: FirecrackerType, qty = 1) => {
      const cost = item.price * qty;
      if (totalPoints < cost) {
        alert('Not enough Kreeda Points!');
        return;
      }

      const newTotal = totalPoints - cost;
      setTotalPoints(newTotal);
      safeSetItem(LS_KEY_POINTS, newTotal.toString());

      setInventory((prev) => {
        const next = { ...prev, [item.id]: (prev[item.id] || 0) + qty };
        safeSetItem(LS_KEY_INVENTORY, JSON.stringify(next));
        return next;
      });
    },
    [totalPoints],
  );

  // ── Consume (use 1 during ignition) ────────────────────────
  const consumeItem = useCallback((id: string) => {
    setInventory((prev) => {
      const next = { ...prev, [id]: Math.max(0, (prev[id] || 0) - 1) };
      safeSetItem(LS_KEY_INVENTORY, JSON.stringify(next));
      return next;
    });
  }, []);

  return {
    totalPoints,
    inventory,
    activeItemId,
    setActiveItemId,
    ownedItems,
    buyItem,
    consumeItem,
  };
}
