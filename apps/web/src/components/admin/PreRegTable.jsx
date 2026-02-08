import React from 'react';
import { Mail, MessageSquare, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/states';

export default function PreRegTable({
  referrals,
  isLoading,
  onSendEmail,
  onOpenWhatsApp,
  sendEmailPending,
}) {
  if (referrals.length === 0 && !isLoading) {
    return (
      <EmptyState
        variant="followers"
        title="No pre-registrations"
        description="No users have pre-registered yet."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-muted border-b border-border">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Email</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Phone</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Registration Date</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {referrals.map((referral) => (
            <tr key={referral.id} className="hover:bg-muted/50">
              <td className="px-6 py-4 text-sm text-foreground">{referral.referred_email}</td>
              <td className="px-6 py-4 text-sm text-muted-foreground">
                {referral.phone_number || '-'}
              </td>
              <td className="px-6 py-4">
                <Badge variant={
                  referral.status === 'signed_up' ? 'success' :
                  referral.status === 'completed' ? 'info' :
                  'warning'
                }>
                  {referral.status}
                </Badge>
              </td>
              <td className="px-6 py-4 text-sm text-muted-foreground">
                {new Date(referral.created_date).toLocaleDateString('en-US')}
              </td>
              <td className="px-6 py-4">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSendEmail(referral)}
                    disabled={sendEmailPending || referral.email_sent}
                    className="text-info"
                  >
                    {referral.email_sent ? (
                      <Check className="w-4 h-4 ml-1" />
                    ) : (
                      <Mail className="w-4 h-4 ml-1" />
                    )}
                    Email
                  </Button>
                  {referral.phone_number && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onOpenWhatsApp(referral)}
                      className="text-success"
                    >
                      {referral.whatsapp_sent ? (
                        <Check className="w-4 h-4 ml-1" />
                      ) : (
                        <MessageSquare className="w-4 h-4 ml-1" />
                      )}
                      WhatsApp
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
