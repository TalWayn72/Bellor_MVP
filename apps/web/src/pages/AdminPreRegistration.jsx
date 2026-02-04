import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, MessageSquare, Send, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import LayoutAdmin from '../components/admin/LayoutAdmin';
import { ListSkeleton, EmptyState } from '@/components/states';

export default function AdminPreRegistration() {
  const queryClient = useQueryClient();
  const [emailMessage, setEmailMessage] = useState('Hello! Your registration to Bellør has been received. We will update you when the app is available.');
  const [whatsappMessage, setWhatsappMessage] = useState('Hi! Your registration to Bellør has been received 🎉 We will update you soon!');

  // Demo referrals data
  const [localReferrals, setLocalReferrals] = useState([
    { id: '1', referred_email: 'user1@example.com', phone_number: '+1234567890', status: 'pending', email_sent: false, whatsapp_sent: false, created_date: new Date().toISOString() },
    { id: '2', referred_email: 'user2@example.com', phone_number: '+1987654321', status: 'signed_up', email_sent: true, whatsapp_sent: false, created_date: new Date(Date.now() - 86400000).toISOString() },
  ]);

  // Fetch all referrals (demo mode)
  const { data: referrals = localReferrals, isLoading } = useQuery({
    queryKey: ['admin-referrals'],
    queryFn: async () => {
      return localReferrals;
    },
  });

  // Send email mutation (demo mode)
  const sendEmailMutation = useMutation({
    mutationFn: async ({ email, referralId }) => {
      // Log email send (email service can be added in future)
      console.log('Email sent to:', email, 'Subject: Welcome to Bellør - Early Access');
      return { email, referralId };
    },
    onSuccess: ({ referralId }) => {
      setLocalReferrals(prev => prev.map(r => r.id === referralId ? { ...r, email_sent: true } : r));
      queryClient.invalidateQueries({ queryKey: ['admin-referrals'] });
    },
  });

  const handleSendEmail = (referral) => {
    if (window.confirm(`Send email to ${referral.referred_email}?`)) {
      sendEmailMutation.mutate({ email: referral.referred_email, referralId: referral.id });
    }
  };

  const handleOpenWhatsApp = (referral) => {
    if (!referral.phone_number) {
      alert('No phone number for this user');
      return;
    }
    const cleanPhone = referral.phone_number.replace(/\D/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(url, '_blank');

    // Mark as sent (demo mode)
    setLocalReferrals(prev => prev.map(r => r.id === referral.id ? { ...r, whatsapp_sent: true } : r));
    queryClient.invalidateQueries({ queryKey: ['admin-referrals'] });
  };

  return (
    <LayoutAdmin>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Pre-Registrations</h1>
          <p className="text-muted-foreground">Manage users who registered early</p>
        </div>

        {/* Message Templates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Mail className="w-5 h-5 text-info" />
                <h3 className="font-semibold text-foreground">Email Template</h3>
              </div>
              <Textarea
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                rows={4}
                className="w-full"
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-success" />
                <h3 className="font-semibold text-foreground">WhatsApp Template</h3>
              </div>
              <Textarea
                value={whatsappMessage}
                onChange={(e) => setWhatsappMessage(e.target.value)}
                rows={4}
                className="w-full"
              />
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-1">Total Registrations</p>
              <p className="text-3xl font-bold text-foreground">{referrals.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-1">Email Sent</p>
              <p className="text-3xl font-bold text-foreground">
                {referrals.filter(r => r.email_sent).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-1">WhatsApp Sent</p>
              <p className="text-3xl font-bold text-foreground">
                {referrals.filter(r => r.whatsapp_sent).length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Referrals List */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border">
            <CardTitle>Registrants List</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <ListSkeleton count={5} />
            ) : (
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
                              onClick={() => handleSendEmail(referral)}
                              disabled={sendEmailMutation.isPending || referral.email_sent}
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
                                onClick={() => handleOpenWhatsApp(referral)}
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
            )}
            {referrals.length === 0 && !isLoading && (
              <EmptyState
                variant="followers"
                title="No pre-registrations"
                description="No users have pre-registered yet."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </LayoutAdmin>
  );
}