import { create } from "zustand";

export const useSplitStore = create((set) => ({
  step: "start", // start | items | allocate | summary | report
  receiptId: null,
  title: "",
  payerName: "",
  totalAmount: 0,
  taxAmount: 0,
  people: [],
  items: [],

  setReceipt: (receipt) =>
    set({
      receiptId: receipt.id,
      title: receipt.title,
      payerName: receipt.payerName,
      totalAmount: Number(receipt.totalAmount),
      taxAmount: Number(receipt.taxAmount || 0),
      people: receipt.people.map((p) => p.personName),
    }),
  setItems: (items) => set({ items }),
  setStep: (step) => set({ step }),
  reset: () =>
    set({
      step: "start",
      receiptId: null,
      title: "",
      payerName: "",
      totalAmount: 0,
      taxAmount: 0,
      people: [],
      items: [],
    }),
}));
