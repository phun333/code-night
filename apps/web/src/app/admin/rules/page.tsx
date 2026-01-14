'use client';

import {
  Activity,
  AlertTriangle,
  Clock,
  FileText,
  Plus,
  RotateCcw,
  Save,
  Server,
  Settings,
  Trash2,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useWebSocket } from '@/hooks/useWebSocket';
import { fetchAPI } from '@/lib/utils';

interface AllocationRule {
  id: string;
  name: string;
  category: string;
  key: string | null;
  condition: string | null;
  weight: number;
  isActive: boolean;
  description: string | null;
}

type TabType = 'urgency' | 'service' | 'request_type' | 'waiting_time' | 'custom';

const TABS = [
  { id: 'urgency' as TabType, label: 'Aciliyet', icon: AlertTriangle, color: 'text-red-500' },
  { id: 'service' as TabType, label: 'Servisler', icon: Server, color: 'text-blue-500' },
  {
    id: 'request_type' as TabType,
    label: 'Talep Turleri',
    icon: FileText,
    color: 'text-purple-500',
  },
  { id: 'waiting_time' as TabType, label: 'Bekleme Suresi', icon: Clock, color: 'text-orange-500' },
  { id: 'custom' as TabType, label: 'Ozel Kurallar', icon: Settings, color: 'text-green-500' },
];

const SERVICE_MAP: Record<string, string[]> = {
  Superonline: [
    'CONNECTION_ISSUE',
    'SPEED_COMPLAINT',
    'MODEM_PROBLEM',
    'INSTALLATION_REQUEST',
    'LINE_CUT',
    'IP_PROBLEM',
    'DNS_ISSUE',
    'FIBER_DAMAGE',
  ],
  Paycell: [
    'PAYMENT_PROBLEM',
    'TRANSACTION_FAILED',
    'REFUND_REQUEST',
    'CARD_ISSUE',
    'BALANCE_ERROR',
    'MERCHANT_PROBLEM',
  ],
  'TV+': [
    'STREAMING_ISSUE',
    'CHANNEL_MISSING',
    'SUBTITLE_PROBLEM',
    'APP_CRASH',
    'LOGIN_ISSUE',
    'QUALITY_PROBLEM',
  ],
};

export default function RulesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('urgency');
  const [rules, setRules] = useState<Record<string, AllocationRule[]>>({});
  const [loading, setLoading] = useState(true);
  const [showNewRuleForm, setShowNewRuleForm] = useState(false);
  const { subscribe } = useWebSocket();

  const fetchData = useCallback(async () => {
    try {
      const data = await fetchAPI<Record<string, AllocationRule[]>>('/api/rules/by-category');
      setRules(data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const unsub = subscribe('rules:updated', fetchData);
    return () => unsub();
  }, [fetchData, subscribe]);

  const handleRuleUpdate = async (id: string, data: { weight?: number; isActive?: boolean }) => {
    try {
      await fetchAPI(`/api/rules/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      fetchData();
    } catch (error) {
      console.error('Error updating rule:', error);
    }
  };

  const handleRuleDelete = async (id: string) => {
    if (!confirm('Bu kurali silmek istediginizden emin misiniz?')) return;
    try {
      await fetchAPI(`/api/rules/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Error deleting rule:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const renderRuleCard = (rule: AllocationRule, showDelete = false) => (
    <div
      key={rule.id}
      className={`flex items-center justify-between p-4 rounded-lg border ${
        rule.isActive ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'
      }`}
    >
      <div className="flex items-center gap-4">
        <Switch
          checked={rule.isActive}
          onCheckedChange={(checked) => handleRuleUpdate(rule.id, { isActive: checked })}
        />
        <div>
          <p className="font-medium">{rule.name}</p>
          {rule.key && <p className="text-sm text-gray-500">{rule.key}</p>}
          {rule.condition && (
            <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded mt-1">{rule.condition}</p>
          )}
          {rule.description && <p className="text-sm text-gray-400 mt-1">{rule.description}</p>}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="-50"
            max="100"
            value={rule.weight}
            onChange={(e) => handleRuleUpdate(rule.id, { weight: parseInt(e.target.value) })}
            className="w-32"
            disabled={!rule.isActive}
          />
          <span
            className={`font-bold w-12 text-right ${rule.weight > 0 ? 'text-green-600' : rule.weight < 0 ? 'text-red-600' : 'text-gray-500'}`}
          >
            {rule.weight > 0 ? '+' : ''}
            {rule.weight}
          </span>
        </div>
        {showDelete && (
          <Button variant="destructive" size="icon" onClick={() => handleRuleDelete(rule.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );

  const renderUrgencyTab = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Aciliyet Agirliklari</h3>
        <p className="text-sm text-gray-500">Talep aciliyetine gore temel oncelik puanlari</p>
      </div>
      <div className="space-y-2">
        {(rules['URGENCY'] || []).map((rule) => renderRuleCard(rule))}
      </div>
    </div>
  );

  const renderServiceTab = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Servis Agirliklari</h3>
        <p className="text-sm text-gray-500">Her servise ozel ek oncelik puanlari</p>
      </div>
      <div className="space-y-2">
        {(rules['SERVICE'] || []).map((rule) => renderRuleCard(rule))}
      </div>
    </div>
  );

  const renderRequestTypeTab = () => {
    const requestTypeRules = rules['REQUEST_TYPE'] || [];

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">Talep Turu Agirliklari</h3>
          <p className="text-sm text-gray-500">Her talep turune ozel ek oncelik puanlari</p>
        </div>

        {Object.entries(SERVICE_MAP).map(([service, types]) => (
          <Card key={service}>
            <CardHeader className="pb-2">
              <CardTitle className="text-md flex items-center gap-2">
                <Badge
                  variant={
                    service === 'Superonline'
                      ? 'default'
                      : service === 'Paycell'
                        ? 'secondary'
                        : 'outline'
                  }
                >
                  {service}
                </Badge>
                <span className="text-sm text-gray-500">({types.length} talep turu)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {requestTypeRules
                  .filter((r) => r.key && types.includes(r.key))
                  .map((rule) => renderRuleCard(rule))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderWaitingTimeTab = () => {
    const waitingRule = (rules['WAITING_TIME'] || [])[0];
    const bonusPerSecond = waitingRule?.weight || 2;

    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Bekleme Suresi Bonusu</h3>
          <p className="text-sm text-gray-500">
            Kuyrukta bekleme suresine gore otomatik artan oncelik
          </p>
        </div>

        {waitingRule && (
          <div className="p-4 rounded-lg border bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-green-100 rounded-lg">
                  <Clock className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">{waitingRule.name}</p>
                  <p className="text-sm text-gray-500">Her saniye bekleyen talebe bonus</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={waitingRule.weight}
                  onChange={(e) =>
                    handleRuleUpdate(waitingRule.id, { weight: parseInt(e.target.value) })
                  }
                  className="w-32"
                />
                <span className="font-bold text-2xl text-green-600 w-16 text-right">
                  +{waitingRule.weight}
                </span>
              </div>
            </div>
          </div>
        )}

        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2">
              <Activity className="w-5 h-5 text-blue-500 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Nasil Calisir?</p>
                <p className="mt-1">
                  Her saniye kuyrukta bekleyen talep +{bonusPerSecond} oncelik puani kazanir. Bu
                  sayede uzun suredir bekleyen talepler otomatik olarak one cikar.
                </p>
                <div className="mt-3 space-y-1">
                  <p>
                    <strong>5 saniye bekleyen:</strong> +{5 * bonusPerSecond} puan
                  </p>
                  <p>
                    <strong>10 saniye bekleyen:</strong> +{10 * bonusPerSecond} puan
                  </p>
                  <p>
                    <strong>30 saniye bekleyen:</strong> +{30 * bonusPerSecond} puan
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderCustomRulesTab = () => {
    const customRules = rules['CUSTOM'] || [];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Ozel Kurallar</h3>
            <p className="text-sm text-gray-500">
              Gelismis kosul tabanli onceliklendirme kurallari
            </p>
          </div>
          <Button
            onClick={() => setShowNewRuleForm(true)}
            className="bg-[#ffc72c] text-black hover:bg-[#ffc72c]/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Yeni Kural
          </Button>
        </div>

        {showNewRuleForm && (
          <NewRuleForm
            onClose={() => setShowNewRuleForm(false)}
            onSuccess={() => {
              setShowNewRuleForm(false);
              fetchData();
            }}
          />
        )}

        <div className="space-y-2">
          {customRules.length === 0 ? (
            <Card className="bg-gray-50">
              <CardContent className="py-8 text-center text-gray-500">
                <Settings className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Henuz ozel kural tanimlanmamis</p>
                <p className="text-sm">Yukaridaki butona tiklayarak yeni kural ekleyebilirsiniz</p>
              </CardContent>
            </Card>
          ) : (
            customRules.map((rule) => renderRuleCard(rule, true))
          )}
        </div>

        <Card className="bg-blue-50 border-blue-100">
          <CardHeader>
            <CardTitle className="text-[#0065a1] text-md">Kural Formati Hakkinda</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-2">Kurallar asagidaki formatta yazilmalidir:</p>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>
                <code className="bg-white px-1 rounded">urgency == 'HIGH'</code> - Aciliyet yuksek
                ise
              </li>
              <li>
                <code className="bg-white px-1 rounded">service == 'Superonline'</code> - Servis
                Superonline ise
              </li>
              <li>
                <code className="bg-white px-1 rounded">requestType == 'CONNECTION_ISSUE'</code> -
                Talep turu baglanti sorunu ise
              </li>
              <li>
                <code className="bg-white px-1 rounded">city == 'Istanbul'</code> - Sehir Istanbul
                ise
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'urgency':
        return renderUrgencyTab();
      case 'service':
        return renderServiceTab();
      case 'request_type':
        return renderRequestTypeTab();
      case 'waiting_time':
        return renderWaitingTimeTab();
      case 'custom':
        return renderCustomRulesTab();
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kural Yonetimi</h1>
          <p className="text-gray-500">
            Onceliklendirme kurallarini yapilandirin - degisiklikler aninda etkili olur
          </p>
        </div>
        <Button variant="outline" onClick={fetchData}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Yenile
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap border-b pb-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#0065a1] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-white' : tab.color}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">{renderTabContent()}</div>

      {/* Info Card */}
      <Card className="bg-yellow-50 border-yellow-100">
        <CardContent className="pt-4">
          <div className="flex items-start gap-2">
            <Zap className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Anlik Etki</p>
              <p className="mt-1">
                Yaptiginiz tum degisiklikler aninda veritabanina kaydedilir ve bir sonraki
                onceliklendirmede etkili olur.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function NewRuleForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    name: '',
    condition: '',
    weight: 10,
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchAPI('/api/rules', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      onSuccess();
    } catch (error) {
      console.error('Error creating rule:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Yeni Kural Olustur</CardTitle>
          <CardDescription>Gelismis kosul tabanli onceliklendirme kurali ekleyin</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Kural Adi *</Label>
              <input
                id="name"
                type="text"
                className="w-full border rounded-lg px-3 py-2 mt-1"
                placeholder="VIP Musteri Bonusu"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="condition">Kosul *</Label>
              <input
                id="condition"
                type="text"
                className="w-full border rounded-lg px-3 py-2 font-mono mt-1"
                placeholder="city == 'Istanbul'"
                value={form.condition}
                onChange={(e) => setForm({ ...form, condition: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Aciklama</Label>
              <input
                id="description"
                type="text"
                className="w-full border rounded-lg px-3 py-2 mt-1"
                placeholder="Bu kural ne yapar?"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div>
              <Label>
                Agirlik: {form.weight > 0 ? '+' : ''}
                {form.weight}
              </Label>
              <input
                type="range"
                min="-50"
                max="100"
                className="w-full mt-1"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: parseInt(e.target.value) })}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Iptal
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-[#ffc72c] text-black hover:bg-[#ffc72c]/90"
              >
                Olustur
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
