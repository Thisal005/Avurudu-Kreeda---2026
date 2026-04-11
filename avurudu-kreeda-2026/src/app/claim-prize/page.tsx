"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Gift, Loader2, CheckCircle2, Trophy, ArrowLeft } from "lucide-react";
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
    }, 2500);
  };

  return (
    <main className="min-h-screen bg-avurudu-bg flex flex-col items-center p-6 overflow-x-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 bg-[url('/pattern.png')] bg-repeat" />

      {/* Header */}
      <header className="w-full max-w-md z-10 pt-4 mb-6 relative flex justify-center">
        <button 
          onClick={() => router.back()} 
          className="absolute left-0 top-4 flex items-center gap-1.5 text-avurudu-dark font-bold text-sm bg-white/80 hover:bg-white px-3 py-1.5 rounded-full transition-all border border-yellow-200 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <Link href="/" className="inline-block bg-avurudu-red border-2 border-avurudu-yellow px-4 py-1 rounded-full text-avurudu-yellow font-bold text-sm tracking-wider shadow-md">
          Avurudu Kreeda 2026
        </Link>
      </header>

      <div className="flex-1 w-full max-w-md z-10 flex flex-col items-center">
        
        {/* Title */}
        <div className="text-center mb-6 w-full">
          <h1 className="text-3xl md:text-4xl font-extrabold text-avurudu-dark drop-shadow-sm mb-3 leading-tight">
            Congratulations!<br className="hidden md:block"/> You are in the Winning Zone!
          </h1>
          <p className="text-[15px] font-bold text-avurudu-dark/80 px-2 leading-relaxed">
            Your performance in Avurudu Kreeda 2026 has qualified you for real cash prizes. 
            Complete your registration below to participate in the final prize draw.
          </p>
          
          <div className="bg-gradient-to-br from-yellow-100 to-white mt-8 p-6 rounded-3xl shadow-[0_0_25px_rgba(250,204,21,0.6)] border-4 border-yellow-400 relative">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gradient-to-b from-yellow-300 to-yellow-600 w-16 h-16 rounded-full flex items-center justify-center shadow-lg border-4 border-white text-white">
              <Trophy className="w-8 h-8 fill-yellow-200" />
            </div>
            
            <p className="mt-4 text-xl font-black text-avurudu-red mb-5 drop-shadow-sm">
              You are currently ranked #{rank} (Top 100)!
            </p>
            
            <div className="bg-white/90 p-4 rounded-2xl border border-yellow-300 text-left shadow-sm">
              <p className="text-base font-black text-avurudu-dark mb-3 border-b border-yellow-200 pb-2">Possible Prizes You Can Win:</p>
              <ul className="text-sm font-bold text-avurudu-dark/90 space-y-3">
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> Grand Prize: LKR 25,000</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> 1st Runner-up: LKR 15,000</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> 2nd Runner-up: LKR 10,000</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> Top 10: LKR 2,500</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> Top 100: Free Mobile Reload</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Claim Form */}
        <div className="w-full bg-white rounded-[2rem] p-6 sm:p-8 shadow-[0_15px_50px_rgba(250,204,21,0.25)] border-2 border-yellow-400 relative mb-12">
          
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-avurudu-dark">Register Your Details for Prize Draw</h2>
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
                className="w-full px-4 py-3 rounded-xl border-2 border-yellow-200 bg-yellow-50/30 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white transition-all text-avurudu-dark font-bold"
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
                  className="w-full px-4 py-3 rounded-xl border-2 border-yellow-200 bg-yellow-50/30 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white transition-all text-avurudu-dark font-bold"
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
                  className="w-full px-4 py-3 rounded-xl border-2 border-yellow-200 bg-yellow-50/30 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white transition-all text-avurudu-dark font-bold"
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
                className="w-full px-4 py-3 rounded-xl border-2 border-yellow-200 bg-yellow-50/30 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white transition-all text-avurudu-dark font-bold"
                placeholder="kasun@example.com"
              />
            </div>

            <div>
              <label htmlFor="contactNumber" className="block text-sm font-bold text-avurudu-dark/80 mb-1 ml-1">WhatsApp / Contact Number</label>
              <input 
                type="tel" 
                id="contactNumber" 
                name="contactNumber"
                required
                value={formData.contactNumber}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-yellow-200 bg-yellow-50/30 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white transition-all text-avurudu-dark font-bold"
                placeholder="07X XXX XXXX"
              />
            </div>

            <div>
              <label htmlFor="deliveryAddress" className="block text-sm font-bold text-avurudu-dark/80 mb-1 ml-1">Delivery Address (full address for prize delivery)</label>
              <textarea 
                id="deliveryAddress" 
                name="deliveryAddress"
                required
                rows={3}
                value={formData.deliveryAddress}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-yellow-200 bg-yellow-50/30 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white transition-all text-avurudu-dark font-bold resize-none"
                placeholder="No. 123, Main Street..."
              />
            </div>

            <div className="flex items-start gap-4 mt-6 p-4 bg-yellow-50/80 border-2 border-yellow-300 rounded-xl">
              <input 
                type="checkbox" 
                id="confirmDetails" 
                name="confirmDetails"
                required
                checked={formData.confirmDetails}
                onChange={handleChange as any}
                className="mt-1 w-5 h-5 text-avurudu-red border-yellow-400 rounded focus:ring-yellow-500 accent-avurudu-red"
              />
              <label htmlFor="confirmDetails" className="text-sm font-bold text-avurudu-dark/90 leading-snug cursor-pointer">
                I confirm that all information provided is correct and I agree to the terms & conditions.
              </label>
            </div>

            <div className="mt-8">
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600 text-white py-4 rounded-[20px] font-black text-lg shadow-[0_0_20px_rgba(250,204,21,0.6)] border-2 border-yellow-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 overflow-hidden relative group"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-500 ease-in-out"></div>
                {isLoading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin relative z-10" />
                    <span className="relative z-10">Processing Registration...</span>
                  </>
                ) : (
                  <>
                    <Gift className="w-6 h-6 relative z-10 drop-shadow-md" />
                    <span className="relative z-10 drop-shadow-md">Submit Registration for Prize Draw</span>
                  </>
                )}
              </button>
            </div>
            
            <p className="text-center text-xs text-avurudu-dark/80 mt-6 font-bold bg-gray-50 p-3 rounded-lg border border-gray-200">
              Your details will only be used to contact the winners after 17th April 2026.<br className="hidden sm:block"/> This is a real registration for the Avurudu Kreeda Championship prizes.
            </p>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full text-center pb-6 z-10 flex flex-col items-center justify-center opacity-60">
        <div className="flex items-center gap-2 text-avurudu-dark/60 text-xs font-medium">
          <ShieldAlert className="w-3 h-3" />
          <span>This is a real registration for the Avurudu Kreeda Championship prizes powerd by VERCEL</span>
        </div>
      </footer>
    </main>
  );
}
