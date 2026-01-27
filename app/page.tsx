"use client";

import { useEffect, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "@heroicons/react/24/solid";

interface RecordType {
  id: number;
  title: string;
  amount: number;
  date: string;
  type: "income" | "expense";
}

export default function ExpenseListApp() {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [records, setRecords] = useState<RecordType[]>([]);
  const [open, setOpen] = useState(false);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);

  // prevent background scroll on iOS when modal open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
  }, [open]);

  useEffect(() => {
    const stored = localStorage.getItem("records");
    if (stored) setRecords(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem("records", JSON.stringify(records));
  }, [records]);

  const addRecord = () => {
    if (!title || !amount || !date) return;
    setRecords([
      { id: Date.now(), title, amount: Number(amount), date, type },
      ...records,
    ]);
    setTitle("");
    setAmount("");
    setDate("");
    setType("expense");
    setOpen(false);
  };

  const deleteRecord = (id: number) => setRecords(records.filter((r) => r.id !== id));

  const groupedEntries = Object.entries(
    records.reduce<Record<string, RecordType[]>>((acc, cur) => {
      const ym = cur.date.slice(0, 7);
      acc[ym] = acc[ym] || [];
      acc[ym].push(cur);
      return acc;
    }, {})
  ).sort((a, b) => b[0].localeCompare(a[0]));

  const totalMonths = groupedEntries.length;
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  const formatAmount = (num: number) => num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const prevMonth = () => setCurrentMonthIndex((i) => (i - 1 + totalMonths) % totalMonths);
  const nextMonth = () => setCurrentMonthIndex((i) => (i + 1) % totalMonths);

  const currentMonthRecords = totalMonths > 0 ? groupedEntries[currentMonthIndex][1] : [];

  const totalExpense = currentMonthRecords.filter((r) => r.type === "expense").reduce((s, r) => s + r.amount, 0);
  const totalIncome = currentMonthRecords.filter((r) => r.type === "income").reduce((s, r) => s + r.amount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 p-4 flex flex-col items-center font-sans">
      <div className="w-full max-w-md">
        {/* Top Summary Card */}
        <div className="bg-gradient-to-r from-red-400 via-pink-400 to-purple-500 rounded-3xl shadow-xl p-6 mb-6 text-white">
          <div className="flex justify-between items-center mb-2">
            <button onClick={prevMonth} className="p-2 rounded-full hover:bg-white/20 transition">
              <ChevronLeftIcon className="h-6 w-6 text-white" />
            </button>

            <p className="font-semibold">{totalMonths > 0 ? groupedEntries[currentMonthIndex][0] : "No Month"}</p>

            <button onClick={nextMonth} className="p-2 rounded-full hover:bg-white/20 transition">
              <ChevronRightIcon className="h-6 w-6 text-white" />
            </button>
          </div>
          <h1 className="text-3xl font-bold mt-3">Balance</h1>
          <p className="text-2xl font-bold mt-1">Rs {formatAmount(totalIncome - totalExpense)}</p>
          <div className="flex justify-between mt-4">
            <div className="text-green-200 font-semibold">Income Rs {formatAmount(totalIncome)}</div>
            <div className="text-red-200 font-semibold">(Expense Rs {formatAmount(totalExpense)})</div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="space-y-3">
          {currentMonthRecords.length === 0 && (
            <div className="bg-white rounded-3xl shadow-lg p-6 text-center text-gray-500">No records added</div>
          )}

          {currentMonthRecords.map((r) => (
            <div
              key={r.id}
              className={`flex justify-between items-center p-4 rounded-2xl shadow-sm ${r.type === "income" ? "bg-green-50" : "bg-red-50"
                }`}
            >
              <div>
                <p className="font-semibold text-gray-800">{r.title}</p>
                <p className="text-xs text-gray-500">{formatDate(r.date)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`font-bold ${r.type === "income" ? "text-green-600" : "text-red-500"}`}>
                  {r.type === "income" ? `+ Rs ${formatAmount(r.amount)}` : `- Rs ${formatAmount(r.amount)}`}
                </span>
                <button onClick={() => deleteRecord(r.id)} className="text-gray-400 hover:text-red-500 transition">
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Add Button with Icon */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 bg-pink-500 text-white p-5 rounded-full shadow-2xl hover:bg-pink-600 transition flex items-center justify-center"
      >
        <PlusIcon className="h-6 w-6" />
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-xl animate-slide-in overflow-hidden">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Add Record</h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
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
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setType("expense")}
                  className={`flex-1 py-2 rounded-xl ${type === "expense" ? "bg-red-500 text-white shadow-md" : "border text-gray-700"}`}
                >
                  Expense
                </button>
                <button
                  onClick={() => setType("income")}
                  className={`flex-1 py-2 rounded-xl ${type === "income" ? "bg-green-500 text-white shadow-md" : "border text-gray-700"}`}
                >
                  Income
                </button>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setOpen(false)} className="w-1/2 border rounded-xl py-2 shadow-sm">
                Cancel
              </button>
              <button onClick={addRecord} className="w-1/2 bg-pink-500 text-white rounded-xl py-2 hover:bg-pink-600 shadow-md transition">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}