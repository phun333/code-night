import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
const PORT = process.env.PORT || 3002;
const API_URL = process.env.API_URL || 'http://localhost:3001';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY environment variable is required');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'gemini-service' });
});

// Mevcut kuralları API'den al
async function fetchCurrentRules() {
  try {
    const response = await fetch(`${API_URL}/api/rules/by-category`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching rules:', error);
    throw error;
  }
}

// Gemini system prompt oluştur
function buildSystemPrompt(rules: Record<string, any[]>) {
  const urgencyRules = rules.URGENCY || [];
  const serviceRules = rules.SERVICE || [];
  const requestTypeRules = rules.REQUEST_TYPE || [];
  const waitingTimeRules = rules.WAITING_TIME || [];
  const customRules = rules.CUSTOM || [];

  return `Sen Turkcell Smart Allocation sistemi için bir kural yönetim asistanısın.
Kullanıcı doğal dilde bir komut verecek ve sen bu komutu analiz edip hangi kuralların nasıl değişeceğini belirleyeceksin.

MEVCUT KURALLAR:

1. ACİLİYET KURALLARI (URGENCY):
${urgencyRules.map(r => `   - ${r.name} (key: ${r.key}, id: ${r.id}): weight=${r.weight}, active=${r.isActive}`).join('\n')}

2. SERVİS KURALLARI (SERVICE):
${serviceRules.map(r => `   - ${r.name} (key: ${r.key}, id: ${r.id}): weight=${r.weight}, active=${r.isActive}`).join('\n')}

3. TALEP TÜRÜ KURALLARI (REQUEST_TYPE):
${requestTypeRules.map(r => `   - ${r.name} (key: ${r.key}, id: ${r.id}): weight=${r.weight}, active=${r.isActive}`).join('\n')}

4. BEKLEME SÜRESİ KURALLARI (WAITING_TIME):
${waitingTimeRules.map(r => `   - ${r.name} (key: ${r.key}, id: ${r.id}): weight=${r.weight} (saniye başına bonus puan), active=${r.isActive}`).join('\n')}

5. ÖZEL KURALLAR (CUSTOM):
${customRules.length > 0 ? customRules.map(r => `   - ${r.name} (id: ${r.id}): condition="${r.condition}", weight=${r.weight}, active=${r.isActive}`).join('\n') : '   (Henüz özel kural yok)'}

KURALLAR:
- weight değeri -50 ile 100 arasında olmalı
- isActive true/false olabilir (kuralı açıp kapatır)
- Özel kurallar için condition formatı: "city == 'Istanbul'" veya "service == 'Superonline'" gibi

GÖREV:
Kullanıcının isteğini analiz et ve aşağıdaki JSON formatında yanıt ver:

{
  "interpretation": "Kullanıcının ne istediğinin kısa açıklaması",
  "changes": [
    {
      "action": "update" | "create" | "delete",
      "ruleId": "mevcut kural id'si (update/delete için)",
      "category": "URGENCY | SERVICE | REQUEST_TYPE | WAITING_TIME | CUSTOM",
      "field": "weight | isActive",
      "oldValue": "eski değer",
      "newValue": "yeni değer",
      "description": "Bu değişikliğin Türkçe açıklaması",
      "name": "yeni kural adı (create için)",
      "condition": "koşul (create için, sadece CUSTOM)"
    }
  ]
}

ÖNEMLİ:
- Sadece JSON döndür, başka bir şey yazma
- Geçerli rule id'lerini kullan
- Mantıklı weight değerleri öner (çok yüksek yaparsan sistem dengesiz olur)
- Eğer istek belirsizse veya yapılamayacak bir şeyse, changes dizisini boş bırak ve interpretation'da açıkla`;
}

// Ana endpoint: Prompt işle
app.post('/api/ai/process-prompt', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Prompt gerekli'
      });
    }

    // Mevcut kuralları al
    const currentRules = await fetchCurrentRules();

    // System prompt oluştur
    const systemPrompt = buildSystemPrompt(currentRules);

    // Gemini'ye gönder
    const result = await model.generateContent([
      { text: systemPrompt },
      { text: `Kullanıcı isteği: ${prompt}` }
    ]);

    const response = result.response;
    const text = response.text();

    // JSON parse et
    let parsedResponse;
    try {
      // JSON'u temizle (bazen markdown code block içinde gelebilir)
      const cleanJson = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedResponse = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error('JSON parse error:', text);
      return res.status(500).json({
        success: false,
        error: 'AI yanıtı parse edilemedi',
        rawResponse: text
      });
    }

    res.json({
      success: true,
      ...parsedResponse
    });

  } catch (error) {
    console.error('Error processing prompt:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
});

// Değişiklikleri uygula endpoint'i
app.post('/api/ai/apply-changes', async (req, res) => {
  try {
    const { changes } = req.body;

    if (!changes || !Array.isArray(changes)) {
      return res.status(400).json({
        success: false,
        error: 'Changes array gerekli'
      });
    }

    const results = [];

    for (const change of changes) {
      try {
        if (change.action === 'update' && change.ruleId) {
          // Mevcut kuralı güncelle
          const updateData: Record<string, any> = {};
          if (change.field === 'weight') {
            updateData.weight = Number(change.newValue);
          } else if (change.field === 'isActive') {
            updateData.isActive = change.newValue === true || change.newValue === 'true';
          }

          const response = await fetch(`${API_URL}/api/rules/${change.ruleId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
          });

          if (!response.ok) {
            throw new Error(`Update failed: ${response.status}`);
          }

          results.push({
            ...change,
            success: true
          });

        } else if (change.action === 'create' && change.category === 'CUSTOM') {
          // Yeni özel kural oluştur
          const response = await fetch(`${API_URL}/api/rules`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: change.name,
              condition: change.condition,
              weight: Number(change.newValue || change.weight || 10),
              description: change.description
            })
          });

          if (!response.ok) {
            throw new Error(`Create failed: ${response.status}`);
          }

          results.push({
            ...change,
            success: true
          });

        } else if (change.action === 'delete' && change.ruleId) {
          // Kuralı sil (sadece CUSTOM kurallar silinebilir)
          const response = await fetch(`${API_URL}/api/rules/${change.ruleId}`, {
            method: 'DELETE'
          });

          if (!response.ok) {
            throw new Error(`Delete failed: ${response.status}`);
          }

          results.push({
            ...change,
            success: true
          });
        }

      } catch (changeError) {
        results.push({
          ...change,
          success: false,
          error: changeError instanceof Error ? changeError.message : 'Hata'
        });
      }
    }

    res.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('Error applying changes:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Gemini service running on port ${PORT}`);
  console.log(`API URL: ${API_URL}`);
});
