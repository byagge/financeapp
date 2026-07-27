export type TxItem = {
  id: string;
  name: string;
  income: number;
  expense: number;
  currency: string;
  exchangeRate: number;
  note: string;
  date: string;
  createdAt: string;
  personId: string | null;
  categoryId: string | null;
  personName: string | null;
  personColor: string | null;
  categoryName: string | null;
};

export type TxResponse = {
  items: TxItem[];
  summary: { income: number; expense: number; total: number };
};

export type PersonItem = {
  id: string;
  name: string;
  avatarColor: string;
  income: number;
  expense: number;
  total: number;
};

export type CategoryItem = {
  id: string;
  name: string;
};

export type RatesResponse = {
  base: string;
  date: string;
  rates: Record<string, number>;
  source: string;
};

export function buildTxQuery(params: Record<string, string | undefined | null>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) sp.set(k, v);
  });
  const qs = sp.toString();
  return `/api/transactions${qs ? `?${qs}` : ""}`;
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}
