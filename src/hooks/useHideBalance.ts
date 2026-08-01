"use client";

import { useEffect, useState } from "react";

const HIDE_BALANCE_KEY = "finance:hide-balance";

export function getHideBalancePref(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(HIDE_BALANCE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setHideBalancePref(value: boolean) {
  try {
    localStorage.setItem(HIDE_BALANCE_KEY, value ? "1" : "0");
    window.dispatchEvent(new Event("finance:hide-balance"));
  } catch {
    /* ignore */
  }
}

export function useHideBalance() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setHidden(getHideBalancePref());
    function sync() {
      setHidden(getHideBalancePref());
    }
    window.addEventListener("finance:hide-balance", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("finance:hide-balance", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  function setHide(value: boolean) {
    setHideBalancePref(value);
    setHidden(value);
  }

  return { hidden, setHidden: setHide, toggle: () => setHide(!hidden) };
}
