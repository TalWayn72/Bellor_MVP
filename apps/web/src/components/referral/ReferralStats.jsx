import React from 'react';
import { Gift, Copy, Check } from 'lucide-react';

export default function ReferralStats({ referralCode, referrals, copied, onCopyCode }) {
  return (
    <div className="bg-gradient-to-br from-primary to-match rounded-2xl p-6 text-white">
      <div className="text-center mb-6">
        <Gift className="w-16 h-16 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Invite Friends, Get Rewards!</h2>
        <p className="text-sm opacity-90">
          Share Bellor with your friends and both of you get amazing rewards
        </p>
      </div>

      {/* Referral Code */}
      <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-4">
        <p className="text-xs opacity-90 mb-2">Your Referral Code</p>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold tracking-wider">{referralCode}</span>
          <button
            onClick={onCopyCode}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
          <div className="text-2xl font-bold">{referrals.length}</div>
          <div className="text-xs opacity-90">Friends Invited</div>
        </div>
        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
          <div className="text-2xl font-bold">
            {referrals.filter(r => r.status === 'rewarded').length}
          </div>
          <div className="text-xs opacity-90">Rewards Earned</div>
        </div>
      </div>
    </div>
  );
}
