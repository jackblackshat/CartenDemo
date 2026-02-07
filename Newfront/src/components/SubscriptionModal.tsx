import { X, Check, Zap, Camera, Bell, BarChart } from "lucide-react";

interface SubscriptionModalProps {
  onClose: () => void;
}

export default function SubscriptionModal({ onClose }: SubscriptionModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end z-50 overflow-y-auto">
      <div className="w-full bg-gradient-to-b from-white to-[#F5F1E8] rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#4A4F55]">Choose Your Plan</h2>
          <button onClick={onClose} className="text-[#8A8D91] hover:text-[#7FA98E] transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Free Plan */}
        <div className="bg-white rounded-2xl p-6 border-2 border-[#D3D5D7] mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-[#4A4F55]">Free</h3>
              <p className="text-3xl font-bold text-[#8A8D91] mt-1">$0<span className="text-base">/mo</span></p>
            </div>
            <div className="px-4 py-2 rounded-full bg-[#F5F1E8] border border-[#D3D5D7] text-[#8A8D91] text-sm">
              Current Plan
            </div>
          </div>

          <ul className="space-y-3">
            <li className="flex items-start gap-2 text-sm text-[#4A4F55]">
              <Check className="w-5 h-5 text-[#7FA98E] shrink-0 mt-0.5" />
              <span>Prediction data after 30 days of history</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-[#4A4F55]">
              <Check className="w-5 h-5 text-[#7FA98E] shrink-0 mt-0.5" />
              <span>"Likely available" labels</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-[#4A4F55]">
              <Check className="w-5 h-5 text-[#7FA98E] shrink-0 mt-0.5" />
              <span>Basic spot search</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-[#8A8D91]">
              <X className="w-5 h-5 shrink-0 mt-0.5" />
              <span>No real-time camera feeds</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-[#8A8D91]">
              <X className="w-5 h-5 shrink-0 mt-0.5" />
              <span>Standard notifications</span>
            </li>
          </ul>
        </div>

        {/* Pro Plan */}
        <div className="bg-gradient-to-br from-[#8B9D83] to-[#7FA98E] rounded-2xl p-1 mb-6 shadow-md">
          <div className="bg-white rounded-[14px] p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold text-[#4A4F55]">Pro</h3>
                  <div className="px-2 py-1 rounded-full bg-gradient-to-r from-[#8B9D83] to-[#7FA98E]">
                    <span className="text-xs font-bold text-white">POPULAR</span>
                  </div>
                </div>
                <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#8B9D83] to-[#7FA98E] mt-1">
                  $4.99<span className="text-base">/mo</span>
                </p>
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-2 text-sm text-[#4A4F55]">
                <div className="w-5 h-5 rounded-full bg-[#7FA98E]/20 border border-[#7FA98E] flex items-center justify-center shrink-0 mt-0.5">
                  <Zap className="w-3 h-3 text-[#7FA98E]" />
                </div>
                <span><strong>Real-time data always</strong> - No waiting period</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-[#4A4F55]">
                <div className="w-5 h-5 rounded-full bg-[#7FA98E]/20 border border-[#7FA98E] flex items-center justify-center shrink-0 mt-0.5">
                  <Camera className="w-3 h-3 text-[#7FA98E]" />
                </div>
                <span><strong>Live camera feeds</strong> - See spots in real-time</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-[#4A4F55]">
                <div className="w-5 h-5 rounded-full bg-[#7FA98E]/20 border border-[#7FA98E] flex items-center justify-center shrink-0 mt-0.5">
                  <Bell className="w-3 h-3 text-[#7FA98E]" />
                </div>
                <span><strong>Priority alerts</strong> - Get notified first</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-[#4A4F55]">
                <div className="w-5 h-5 rounded-full bg-[#7FA98E]/20 border border-[#7FA98E] flex items-center justify-center shrink-0 mt-0.5">
                  <BarChart className="w-3 h-3 text-[#7FA98E]" />
                </div>
                <span><strong>Advanced analytics</strong> - Detailed insights</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-[#4A4F55]">
                <Check className="w-5 h-5 text-[#7FA98E] shrink-0 mt-0.5" />
                <span>No advertisements</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-[#4A4F55]">
                <Check className="w-5 h-5 text-[#7FA98E] shrink-0 mt-0.5" />
                <span>Everything in Free plan</span>
              </li>
            </ul>

            <button className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#8B9D83] to-[#7FA98E] text-white font-bold text-lg shadow-md hover:shadow-lg transition-shadow">
              Start 7-Day Free Trial
            </button>
            <p className="text-xs text-[#8A8D91] text-center mt-2">
              Cancel anytime. $4.99/month after trial.
            </p>
          </div>
        </div>

        <p className="text-xs text-[#8A8D91] text-center">
          By subscribing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}