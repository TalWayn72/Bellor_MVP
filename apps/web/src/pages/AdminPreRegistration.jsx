import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, MessageSquare } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LayoutAdmin from '../components/admin/LayoutAdmin';
import { ListSkeleton } from '@/components/states';
import PreRegTable from '@/components/admin/PreRegTable';
import { useToast } from '@/components/ui/use-toast';

export default function AdminPreRegistration() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [emailMessage, setEmailMessage] = useState('Hello! Your registration to Bellor has been received. We will update you when the app is available.');
  const [whatsappMessage, setWhatsappMessage] = useState('Hi! Your registration to Bellor has been received 🎉 We will update you soon!');

  const [localReferrals, setLocalReferrals] = useState([
    { id: '1', referred_email: 'user1@example.com', phone_number: '+1234567890', status: 'pending', email_sent: false, whatsapp_sent: false, created_date: new Date().toISOString() },
    { id: '2', referred_email: 'user2@example.com', phone_number: '+1987654321', status: 'signed_up', email_sent: true, whatsapp_sent: false, created_date: new Date(Date.now() - 86400000).toISOString() },
  ]);

  const { data: referrals = localReferrals, isLoading } = useQuery({
    queryKey: ['admin-referrals'],
    queryFn: async () => localReferrals,
  });

  const sendEmailMutation = useMutation({
    mutationFn: async ({ email, referralId }) => {
      // Email sending - backend integration pending
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
    if (!referral.phone_number) { toast({ title: 'Validation', description: 'No phone number for this user', variant: 'destructive' }); return; }
    const cleanPhone = referral.phone_number.replace(/\D/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(url, '_blank');
    setLocalReferrals(prev => prev.map(r => r.id === referral.id ? { ...r, whatsapp_sent: true } : r));
    queryClient.invalidateQueries({ queryKey: ['admin-referrals'] });
  };

  return (
    <LayoutAdmin>
      <div className="p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Pre-Registrations</h1>
          <p className="text-muted-foreground">Manage users who registered early</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card><CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4"><Mail className="w-5 h-5 text-info" /><h3 className="font-semibold text-foreground">Email Template</h3></div>
            <Textarea value={emailMessage} onChange={(e) => setEmailMessage(e.target.value)} rows={4} className="w-full" />
          </CardContent></Card>
          <Card><CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4"><MessageSquare className="w-5 h-5 text-success" /><h3 className="font-semibold text-foreground">WhatsApp Template</h3></div>
            <Textarea value={whatsappMessage} onChange={(e) => setWhatsappMessage(e.target.value)} rows={4} className="w-full" />
          </CardContent></Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground mb-1">Total Registrations</p><p className="text-3xl font-bold text-foreground">{referrals.length}</p></CardContent></Card>
          <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground mb-1">Email Sent</p><p className="text-3xl font-bold text-foreground">{referrals.filter(r => r.email_sent).length}</p></CardContent></Card>
          <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground mb-1">WhatsApp Sent</p><p className="text-3xl font-bold text-foreground">{referrals.filter(r => r.whatsapp_sent).length}</p></CardContent></Card>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border"><CardTitle>Registrants List</CardTitle></CardHeader>
          <CardContent className="p-0">
            {isLoading ? <ListSkeleton count={5} /> : (
              <PreRegTable referrals={referrals} isLoading={isLoading} onSendEmail={handleSendEmail} onOpenWhatsApp={handleOpenWhatsApp} sendEmailPending={sendEmailMutation.isPending} />
            )}
          </CardContent>
        </Card>
      </div>
    </LayoutAdmin>
  );
}
