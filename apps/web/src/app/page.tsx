'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fetchAPI } from '@/lib/utils';
import { Zap, Send, CheckCircle, Clock, Wifi, CreditCard, Tv, ChevronRight } from 'lucide-react';

interface User {
  id: string;
  name: string;
  city: string;
}

export default function UserPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [form, setForm] = useState({
    service: 'Superonline',
    requestType: 'CONNECTION_ISSUE',
    urgency: 'MEDIUM',
  });
  const [submitted, setSubmitted] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAPI<User[]>('/api/auth/users').then((data) => {
      const normalUsers = data.filter((u: any) => u.role !== 'ADMIN');
      setUsers(normalUsers);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setLoading(true);
    try {
      const result = await fetchAPI('/api/requests', {
        method: 'POST',
        body: JSON.stringify({
          userId: selectedUser.id,
          service: form.service,
          requestType: form.requestType,
          urgency: form.urgency,
        }),
      });
      setSubmittedRequest(result);
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting request:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setSubmittedRequest(null);
    setSelectedUser(null);
    setForm({
      service: 'Superonline',
      requestType: 'CONNECTION_ISSUE',
      urgency: 'MEDIUM',
    });
  };

  const services = [
    { id: 'Superonline', label: 'Superonline', icon: Wifi, color: 'text-blue-500' },
    { id: 'Paycell', label: 'Paycell', icon: CreditCard, color: 'text-purple-500' },
    { id: 'TV+', label: 'TV+', icon: Tv, color: 'text-red-500' },
  ];

  const requestTypes = [
    { id: 'CONNECTION_ISSUE', label: 'Baglanti Sorunu' },
    { id: 'SPEED_COMPLAINT', label: 'Hiz Sikayeti' },
    { id: 'PAYMENT_PROBLEM', label: 'Odeme Sorunu' },
    { id: 'STREAMING_ISSUE', label: 'Yayin Sorunu' },
  ];

  const urgencies = [
    { id: 'LOW', label: 'Dusuk', color: 'bg-green-500' },
    { id: 'MEDIUM', label: 'Normal', color: 'bg-yellow-500' },
    { id: 'HIGH', label: 'Acil', color: 'bg-red-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0065a1] via-[#004d7a] to-[#003354]">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#ffc72c] rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-[#0065a1]" />
            </div>
            <div>
              <h1 className="font-bold text-white text-lg">Turkcell Destek</h1>
              <p className="text-white/60 text-xs">Sikayet ve Talep Sistemi</p>
            </div>
          </div>
          <a
            href="/admin"
            className="flex items-center gap-1 text-white/60 hover:text-white text-sm transition-colors"
          >
            Admin Paneli
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {!submitted ? (
          <>
            {/* User Selection */}
            {!selectedUser ? (
              <Card className="border-0 shadow-2xl">
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-2xl">Hosgeldiniz</CardTitle>
                  <CardDescription>Devam etmek icin hesabinizi secin</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {users.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => setSelectedUser(user)}
                        className="group p-4 border-2 border-muted rounded-xl hover:border-[#0065a1] hover:bg-blue-50 transition-all text-left"
                      >
                        <div className="w-14 h-14 bg-gradient-to-br from-[#0065a1] to-[#004d7a] rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <span className="text-white font-bold text-xl">
                            {user.name.charAt(0)}
                          </span>
                        </div>
                        <p className="font-semibold">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.city}</p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Selected User Badge */}
                <div className="flex items-center justify-between mb-6 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#ffc72c] rounded-full flex items-center justify-center">
                      <span className="text-[#0065a1] font-bold text-xl">
                        {selectedUser.name.charAt(0)}
                      </span>
                    </div>
                    <div className="text-white">
                      <p className="font-semibold text-lg">{selectedUser.name}</p>
                      <p className="text-white/60 text-sm">{selectedUser.city}</p>
                    </div>
                  </div>
                  <Button variant="ghost" onClick={() => setSelectedUser(null)} className="text-white hover:bg-white/10">
                    Degistir
                  </Button>
                </div>

                {/* Request Form */}
                <Card className="border-0 shadow-2xl">
                  <CardHeader>
                    <CardTitle>Yeni Talep Olustur</CardTitle>
                    <CardDescription>Sorununuzu bildirin, en kisa surede size donelim</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-8">
                      {/* Service Selection */}
                      <div>
                        <label className="block text-sm font-medium mb-3">Hangi hizmetle ilgili?</label>
                        <div className="grid grid-cols-3 gap-3">
                          {services.map((service) => {
                            const Icon = service.icon;
                            return (
                              <button
                                key={service.id}
                                type="button"
                                onClick={() => setForm({ ...form, service: service.id })}
                                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                                  form.service === service.id
                                    ? 'border-[#0065a1] bg-blue-50 shadow-md'
                                    : 'border-muted hover:border-muted-foreground'
                                }`}
                              >
                                <Icon className={`w-8 h-8 ${service.color}`} />
                                <span className="font-medium">{service.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Request Type */}
                      <div>
                        <label className="block text-sm font-medium mb-3">Sorun turu</label>
                        <div className="grid grid-cols-2 gap-3">
                          {requestTypes.map((type) => (
                            <button
                              key={type.id}
                              type="button"
                              onClick={() => setForm({ ...form, requestType: type.id })}
                              className={`p-3 rounded-xl border-2 transition-all text-left ${
                                form.requestType === type.id
                                  ? 'border-[#0065a1] bg-blue-50'
                                  : 'border-muted hover:border-muted-foreground'
                              }`}
                            >
                              <span className="font-medium">{type.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Urgency */}
                      <div>
                        <label className="block text-sm font-medium mb-3">Aciliyet durumu</label>
                        <div className="grid grid-cols-3 gap-3">
                          {urgencies.map((urgency) => (
                            <button
                              key={urgency.id}
                              type="button"
                              onClick={() => setForm({ ...form, urgency: urgency.id })}
                              className={`p-4 rounded-xl border-2 transition-all ${
                                form.urgency === urgency.id
                                  ? 'border-[#0065a1] shadow-md'
                                  : 'border-muted hover:border-muted-foreground'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded-full ${urgency.color} mx-auto mb-2`} />
                              <span className="font-medium">{urgency.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Submit */}
                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full py-6 text-lg bg-[#ffc72c] text-black hover:bg-[#ffc72c]/90"
                      >
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                            Gonderiliyor...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Send className="w-5 h-5" />
                            Talep Olustur
                          </span>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </>
            )}
          </>
        ) : (
          /* Success Screen */
          <Card className="border-0 shadow-2xl">
            <CardContent className="pt-12 pb-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Talebiniz Alindi!</h2>
              <p className="text-muted-foreground mb-8">En kisa surede sizinle iletisime gececegiz</p>

              <div className="bg-muted rounded-xl p-6 mb-8 text-left max-w-md mx-auto space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Talep No</span>
                  <span className="font-mono font-bold text-sm">{submittedRequest?.id?.slice(0, 12)}...</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Servis</span>
                  <span className="font-medium">{submittedRequest?.service}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Oncelik Skoru</span>
                  <span className="font-bold text-2xl text-[#0065a1]">{submittedRequest?.priorityScore}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Durum</span>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Bekliyor
                  </Badge>
                </div>
              </div>

              <Button onClick={resetForm} variant="outline" size="lg">
                Yeni Talep Olustur
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
