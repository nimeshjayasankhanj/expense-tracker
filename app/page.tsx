"use client";

import { useEffect, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "@heroicons/react/24/solid";

interface ExpenseRecord {
  id: number;
  description: string;
  amount: number;
  date: string;
}

export default function ExpenseListApp() {
  const todayISO = () => {
    const d = new Date();
    const offset = d.getTimezoneOffset();
    return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
  };

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [records, setRecords] = useState<ExpenseRecord[]>([]);
  const [open, setOpen] = useState(false); // mounted in the DOM
  const [visible, setVisible] = useState(false); // slid into view
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);

  // prevent background scroll on iOS when sheet open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
  }, [open]);

  const openSheet = () => {
    setOpen(true);
    // mount first, then flip the transform on the next frame so the
    // transition actually animates instead of snapping into place
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
  };

  const closeSheet = () => {
    setVisible(false);
    // wait for the slide-down transition to finish before unmounting
    window.setTimeout(() => setOpen(false), 300);
  };

  useEffect(() => {
    const stored = localStorage.getItem("expenseRecords");
    if (stored) setRecords(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem("expenseRecords", JSON.stringify(records));
  }, [records]);

  const addRecord = () => {
    if (!description || !amount || !date) return;
    setRecords([
      { id: Date.now(), description, amount: Number(amount), date },
      ...records,
    ]);
    setDescription("");
    setAmount("");
    setDate(todayISO());
    closeSheet();
    // jump the view back to the month the new expense belongs to
    setCurrentMonthIndex(0);
  };

  const deleteRecord = (id: number) => setRecords(records.filter((r) => r.id !== id));

  const groupedEntries = Object.entries(
    records.reduce<Record<string, ExpenseRecord[]>>((acc, cur) => {
      const ym = cur.date.slice(0, 7);
      acc[ym] = acc[ym] || [];
      acc[ym].push(cur);
      return acc;
    }, {})
  ).sort((a, b) => b[0].localeCompare(a[0]));

  const totalMonths = groupedEntries.length;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

  const formatAmount = (num: number) =>
    num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const formatMonthLabel = (ym: string) => {
    const [year, month] = ym.split("-");
    const d = new Date(Number(year), Number(month) - 1, 1);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "long" });
  };

  const prevMonth = () => setCurrentMonthIndex((i) => (i - 1 + totalMonths) % totalMonths);
  const nextMonth = () => setCurrentMonthIndex((i) => (i + 1) % totalMonths);

  const currentMonthRecords =
    totalMonths > 0
      ? [...groupedEntries[currentMonthIndex][1]].sort((a, b) => b.date.localeCompare(a.date))
      : [];

  const totalExpense = currentMonthRecords.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 p-4 flex flex-col items-center font-sans">
      <div className="w-full max-w-md">
        {/* Top Summary Card */}
        <div className="bg-gradient-to-r from-red-400 via-pink-400 to-purple-500 rounded-3xl shadow-xl p-6 mb-6 text-white">
          <div className="flex justify-between items-center mb-2">
            <button
              onClick={prevMonth}
              disabled={totalMonths === 0}
              className="p-2 rounded-full hover:bg-white/20 transition disabled:opacity-40"
            >
              <ChevronLeftIcon className="h-6 w-6 text-white" />
            </button>

            <p className="font-semibold">
              {totalMonths > 0 ? formatMonthLabel(groupedEntries[currentMonthIndex][0]) : "No Month"}
            </p>

            <button
              onClick={nextMonth}
              disabled={totalMonths === 0}
              className="p-2 rounded-full hover:bg-white/20 transition disabled:opacity-40"
            >
              <ChevronRightIcon className="h-6 w-6 text-white" />
            </button>
          </div>
          <h1 className="text-xl font-semibold mt-3 text-white/90">Total Spent</h1>
          <p className="text-3xl font-bold mt-1">Rs {formatAmount(totalExpense)}</p>
          <p className="text-sm text-white/80 mt-2">
            {currentMonthRecords.length} {currentMonthRecords.length === 1 ? "expense" : "expenses"}
          </p>
        </div>

        {/* Expense List */}
        <div className="space-y-3">
          {currentMonthRecords.length === 0 && (
            <div className="bg-white rounded-3xl shadow-lg p-6 text-center text-gray-500">
              No expenses added
            </div>
          )}

          {currentMonthRecords.map((r) => (
            <div
              key={r.id}
              className="flex justify-between items-center p-4 rounded-2xl shadow-sm bg-red-50"
            >
              <div>
                <p className="font-semibold text-gray-800">{r.description}</p>
                <p className="text-xs text-gray-500">{formatDate(r.date)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-red-500">- Rs {formatAmount(r.amount)}</span>
                <button
                  onClick={() => deleteRecord(r.id)}
                  className="text-gray-400 hover:text-red-500 transition"
                  aria-label="Delete expense"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Add Button */}
      <button
        onClick={openSheet}
        className="fixed bottom-6 right-6 bg-pink-500 text-white p-5 rounded-full shadow-2xl hover:bg-pink-600 transition flex items-center justify-center active:scale-95"
        aria-label="Add expense"
      >
        <PlusIcon className="h-6 w-6" />
      </button>

      {/* Add Expense Bottom Sheet */}
      {open && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            onClick={closeSheet}
            className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"
              }`}
          />

          {/* Sheet */}
          <div
            className={`absolute bottom-0 left-0 right-0 mx-auto w-full max-w-md bg-white rounded-t-3xl shadow-2xl p-6 pb-8 transition-transform duration-300 ease-out ${visible ? "translate-y-0" : "translate-y-full"
              }`}
          >
            {/* Drag handle */}
            <div className="flex justify-center mb-4">
              <div className="h-1.5 w-12 rounded-full bg-gray-300" />
            </div>

            <h2 className="text-xl font-bold mb-4 text-gray-800">Add Expense</h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border rounded-xl p-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
              <input
                type="number"
                placeholder="Amount (Rs)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border rounded-xl p-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border rounded-xl p-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={closeSheet} className="w-1/2 border rounded-xl py-2 shadow-sm">
                Cancel
              </button>
              <button
                onClick={addRecord}
                className="w-1/2 bg-pink-500 text-white rounded-xl py-2 hover:bg-pink-600 shadow-md transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}