"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Gift, Loader2 } from "lucide-react";
import Link from "next/link";

function getUserRank(points: number): number {
  if (points >= 30000) return 1;
  if (points >= 28000) return 2;
  if (points >= 26000) return 3;
  if (points >= 24000) return 4;
  if (points >= 22000) return 5;
  if (points >= 20000) return 6;
  if (points >= 18500) return 7;
  if (points >= 16000) return 8;
  if (points >= 14000) return 9;
  if (points >= 12000) return 10;
  if (points >= 10000) return 14;
  if (points >= 8000) return 21;
  if (points >= 7000) return 35;
  if (points >= 5000) return 40;
  if (points >= 2000) return 60;
  if (points >= 1000) return 100;
  return 150;
}

function getPrizeDetails(points: number) {
  if (points >= 20000) return { name: "Ultimate Avurudu Jackpot!", desc: "Rs. 35,000 Cash + Family Trip Voucher + Luxury Gift Hamper", icon: "🏖️" };
  if (points >= 15000) return { name: "Grand Avurudu Champion Hamper", desc: "Full set of clothes for family + Kiribath set + Rs. 20,000 Cash", icon: "👑" };
  if (points >= 10000) return { name: "Special Avurudu Winner Pack", desc: "New Clothes + Gold Plated Lamp + Sweets + Rs. 15,000 Cash Voucher", icon: "🪔" };
  if (points >= 5000) return { name: "Family Avurudu Gift Pack", desc: "Sweets + Clothes for 2 + Cash Voucher Rs. 8,000", icon: "👨‍👩‍👧‍👦" };
  if (points >= 1000) return { name: "Avurudu Sweet Hamper", desc: "Kiribath, Kavum, Kokis, Banana + New Clothes - Worth Rs. 5,000", icon: "🍌" };
  return { name: "Basic Avurudu Gift", desc: "A special token of appreciation for participating!", icon: "🎁" };
}

function getRankSuffix(rank: number) {
  if (rank === 1) return "st";
  if (rank === 2) return "nd";
  if (rank === 3) return "rd";
  return "th";
}

export default function ClaimPrizePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);
  const [formData, setFormData] = useState({
    fullName: "",
    age: "",
    email: "",
    contactNumber: "",
    nic: "",
    deliveryAddress: "",
    confirmDetails: false,
  });

  useEffect(() => {
    const saved = localStorage.getItem("kreedaPoints");
    if (saved) {
      setTotalPoints(parseInt(saved, 10));
    }
  }, []);

  const rank = getUserRank(totalPoints);
  const prize = getPrizeDetails(totalPoints);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    // @ts-ignore
    const checked = type === "checkbox" ? e.target.checked : undefined;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Temporarily store data
    localStorage.setItem("prizeClaimForm", JSON.stringify(formData));
    
    setIsLoading(true);
    
    setTimeout(() => {
      router.push("/reveal-shock");
    }, 2800);
  };

  return (
    <main className="min-h-screen bg-avurudu-bg flex flex-col items-center p-6 overflow-x-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 bg-[url('/pattern.png')] bg-repeat" />

      {/* Header */}
      <header className="w-full max-w-md z-10 pt-4 mb-6 flex justify-center">
        <Link href="/" className="inline-block bg-avurudu-red border-2 border-avurudu-yellow px-4 py-1 rounded-full text-avurudu-yellow font-bold text-sm tracking-wider shadow-md">
          Avurudu Kreeda 2026
        </Link>
      </header>

      <div className="flex-1 w-full max-w-md z-10 flex flex-col items-center">
        
        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold text-avurudu-dark drop-shadow-sm mb-2 leading-tight">
            Congratulations Champion!
          </h1>
          
          <div className="bg-gradient-to-br from-white to-yellow-50 mt-6 p-6 rounded-3xl shadow-xl border-4 border-yellow-400 relative">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gradient-to-b from-yellow-300 to-yellow-500 w-16 h-16 rounded-full flex items-center justify-center shadow-lg border-4 border-white text-3xl">
              {prize.icon}
            </div>
            
            <p className="mt-4 text-base font-bold text-avurudu-dark/80">
              You are currently in <span className="text-avurudu-red text-xl font-black">{rank}{getRankSuffix(rank)} place</span> and have won:
            </p>
            
            <p className="mt-2 text-2xl font-black text-amber-600 leading-snug">
              {prize.name}
            </p>
            <p className="text-sm font-bold text-emerald-700 mt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
              {prize.desc}
            </p>
          </div>
        </div>

        {/* Claim Form */}
        <div className="w-full bg-white rounded-[2rem] p-6 sm:p-8 shadow-2xl border-2 border-avurudu-yellow relative mb-12">
          
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-avurudu-dark">Claim Your Prize</h2>
            <p className="text-sm text-avurudu-dark/60 mt-1">Please fill out your details to verify and arrange delivery.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label htmlFor="fullName" className="block text-sm font-bold text-avurudu-dark/80 mb-1 ml-1">Full Name</label>
              <input 
                type="text" 
                id="fullName" 
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-avurudu-yellow/50 bg-avurudu-bg/30 focus:outline-none focus:ring-2 focus:ring-avurudu-orange focus:bg-white transition-all text-avurudu-dark font-medium"
                placeholder="e.g. Kasun Perera"
              />
            </div>

            <div className="flex gap-4">
              <div className="w-1/3">
                <label htmlFor="age" className="block text-sm font-bold text-avurudu-dark/80 mb-1 ml-1">Age</label>
                <input 
                  type="number" 
                  id="age" 
                  name="age"
                  required
                  value={formData.age}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-avurudu-yellow/50 bg-avurudu-bg/30 focus:outline-none focus:ring-2 focus:ring-avurudu-orange focus:bg-white transition-all text-avurudu-dark font-medium"
                  placeholder="24"
                />
              </div>
              <div className="w-2/3">
                <label htmlFor="nic" className="block text-sm font-bold text-avurudu-dark/80 mb-1 ml-1">NIC Number</label>
                <input 
                  type="text" 
                  id="nic" 
                  name="nic"
                  required
                  value={formData.nic}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-avurudu-yellow/50 bg-avurudu-bg/30 focus:outline-none focus:ring-2 focus:ring-avurudu-orange focus:bg-white transition-all text-avurudu-dark font-medium"
                  placeholder="XXXXXXXXXV"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-bold text-avurudu-dark/80 mb-1 ml-1">Email Address</label>
              <input 
                type="email" 
                id="email" 
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-avurudu-yellow/50 bg-avurudu-bg/30 focus:outline-none focus:ring-2 focus:ring-avurudu-orange focus:bg-white transition-all text-avurudu-dark font-medium"
                placeholder="kasun@example.com"
              />
            </div>

            <div>
              <label htmlFor="contactNumber" className="block text-sm font-bold text-avurudu-dark/80 mb-1 ml-1">Contact Number / WhatsApp</label>
              <input 
                type="tel" 
                id="contactNumber" 
                name="contactNumber"
                required
                value={formData.contactNumber}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-avurudu-yellow/50 bg-avurudu-bg/30 focus:outline-none focus:ring-2 focus:ring-avurudu-orange focus:bg-white transition-all text-avurudu-dark font-medium"
                placeholder="07X XXX XXXX"
              />
            </div>

            <div>
              <label htmlFor="deliveryAddress" className="block text-sm font-bold text-avurudu-dark/80 mb-1 ml-1">Delivery Address</label>
              <textarea 
                id="deliveryAddress" 
                name="deliveryAddress"
                required
                rows={3}
                value={formData.deliveryAddress}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-avurudu-yellow/50 bg-avurudu-bg/30 focus:outline-none focus:ring-2 focus:ring-avurudu-orange focus:bg-white transition-all text-avurudu-dark font-medium resize-none"
                placeholder="No. 123, Main Street..."
              />
            </div>

            <div className="flex items-start gap-3 mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <input 
                type="checkbox" 
                id="confirmDetails" 
                name="confirmDetails"
                required
                checked={formData.confirmDetails}
                onChange={handleChange as any}
                className="mt-1 w-5 h-5 text-avurudu-red border-yellow-300 rounded focus:ring-avurudu-orange"
              />
              <label htmlFor="confirmDetails" className="text-sm font-bold text-yellow-900 leading-tight">
                I confirm all details are correct for prize delivery.
              </label>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full mt-6 bg-gradient-to-r from-yellow-500 via-amber-500 to-red-500 text-white py-4 rounded-[20px] font-black text-lg shadow-[0_0_20px_rgba(245,158,11,0.5)] border-2 border-white hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 overflow-hidden relative"
            >
              <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-black"></span>
              {isLoading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin relative z-10" />
                  <span className="relative z-10">Processing your claim...</span>
                </>
              ) : (
                <>
                  <Gift className="w-6 h-6 relative z-10" />
                  <span className="relative z-10">Submit & Claim My Prize Now</span>
                </>
              )}
            </button>
            
            <p className="text-center text-xs text-avurudu-dark/50 mt-4 font-medium flex items-center justify-center gap-1">
              <ShieldAlert className="w-3 h-3" /> Secure Claim Portal
            </p>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full text-center pb-6 z-10 flex flex-col items-center justify-center opacity-60">
        <div className="flex items-center gap-2 text-avurudu-dark/60 text-xs font-medium">
          <ShieldAlert className="w-3 h-3" />
          <span>This is part of a Cyber Security Awareness Project by Leo Club</span>
        </div>
      </footer>
    </main>
  );
}
