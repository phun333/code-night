'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { fetchAPI } from '@/lib/utils';
import { Plus, Settings, Trash2 } from 'lucide-react';

interface Rule {
  id: string;
  condition: string;
  weight: number;
  isActive: boolean;
}

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);

  const fetchRules = async () => {
    try {
      const result = await fetchAPI<Rule[]>('/api/rules');
      setRules(result);
    } catch (error) {
      console.error('Error fetching rules:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleToggle = async (rule: Rule) => {
    try {
      await fetchAPI(`/api/rules/${rule.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !rule.isActive }),
      });
      fetchRules();
    } catch (error) {
      console.error('Error toggling rule:', error);
    }
  };

  const handleWeightChange = async (rule: Rule, newWeight: number) => {
    try {
      await fetchAPI(`/api/rules/${rule.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ weight: newWeight }),
      });
      fetchRules();
    } catch (error) {
      console.error('Error updating weight:', error);
    }
  };

  const handleDelete = async (ruleId: string) => {
    if (!confirm('Bu kurali silmek istediginizden emin misiniz?')) return;

    try {
      await fetchAPI(`/api/rules/${ruleId}`, {
        method: 'DELETE',
      });
      fetchRules();
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kural Yonetimi</h1>
          <p className="text-gray-500">
            Onceliklendirme kurallarini yapilandirin
          </p>
        </div>
        <Button onClick={() => setShowNewForm(true)} className="bg-[#ffc72c] text-black hover:bg-[#ffc72c]/90">
          <Plus className="w-4 h-4 mr-2" />
          Yeni Kural
        </Button>
      </div>

      {showNewForm && (
        <NewRuleForm
          onClose={() => setShowNewForm(false)}
          onSuccess={() => {
            setShowNewForm(false);
            fetchRules();
          }}
        />
      )}

      <div className="space-y-4">
        {rules.map((rule) => (
          <Card key={rule.id}>
            <CardContent className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-lg ${
                    rule.isActive ? 'bg-green-100' : 'bg-gray-100'
                  }`}
                >
                  <Settings
                    className={`w-6 h-6 ${
                      rule.isActive ? 'text-green-600' : 'text-gray-400'
                    }`}
                  />
                </div>

                <div>
                  <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                    {rule.condition}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={rule.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {rule.isActive ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Agirlik</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={rule.weight}
                      onChange={(e) =>
                        handleWeightChange(rule, parseInt(e.target.value))
                      }
                      className="w-32"
                    />
                    <span className="font-bold text-[#0065a1] w-8">
                      {rule.weight}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant={rule.isActive ? 'secondary' : 'default'}
                    size="sm"
                    onClick={() => handleToggle(rule)}
                  >
                    {rule.isActive ? 'Devre Disi Birak' : 'Aktif Et'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDelete(rule.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-100">
        <CardHeader>
          <CardTitle className="text-[#0065a1]">
            Kural Formati Hakkinda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-2">
            Kurallar asagidaki formatta yazilmalidir:
          </p>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>
              <code className="bg-white px-1 rounded">urgency == 'HIGH'</code> -
              Aciliyet yuksek ise
            </li>
            <li>
              <code className="bg-white px-1 rounded">
                service == 'Superonline'
              </code>{' '}
              - Servis Superonline ise
            </li>
            <li>
              <code className="bg-white px-1 rounded">
                request_type == 'CONNECTION_ISSUE'
              </code>{' '}
              - Talep turu baglanti sorunu ise
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function NewRuleForm({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    condition: '',
    weight: 10,
    isActive: true,
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
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Kosul</label>
              <input
                type="text"
                className="w-full border rounded-lg px-3 py-2 font-mono"
                placeholder="urgency == 'HIGH'"
                value={form.condition}
                onChange={(e) => setForm({ ...form, condition: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Agirlik: {form.weight}
              </label>
              <input
                type="range"
                min="0"
                max="100"
                className="w-full"
                value={form.weight}
                onChange={(e) =>
                  setForm({ ...form, weight: parseInt(e.target.value) })
                }
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              <label htmlFor="isActive" className="text-sm">
                Aktif olarak baslat
              </label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Iptal
              </Button>
              <Button type="submit" className="flex-1 bg-[#ffc72c] text-black hover:bg-[#ffc72c]/90">
                Olustur
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
