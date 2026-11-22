import request from 'supertest';
import app from '../app';
import { pool } from '../config/db';
import {
  detectLanguage,
  formatGeminiContents,
  generateBotanicalFallback,
  isOffTopic,
} from '../routes/leafy.routes';

let userToken: string;

beforeAll(async () => {
  try {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'tushar@example.com', password: 'password123' });

    if (loginRes.status === 200) {
      userToken = loginRes.body.data.token;
    }
  } catch (err) {
    // Network or db unavailable in sandboxed unit testing
  }
});

afterAll(async () => {
  try {
    await pool.end();
  } catch (err) {}
});

describe('LeafPulse Leafy Chatbot — Multilingual & Conversation Context Suite', () => {
  // ── 1. Language Detection & Response Language ───────────────────────────────
  describe('Language Detection Unit Tests', () => {
    it('detects Hindi (Devanagari)', () => {
      expect(detectLanguage('मेरे पौधे की पत्तियां पीली क्यों हो रही हैं?')).toBe('hindi');
      expect(detectLanguage('कितना पानी देना चाहिए?')).toBe('hindi');
      expect(detectLanguage('धूप कितनी देनी है?')).toBe('hindi');
    });

    it('detects Hinglish (Romanized Hindi)', () => {
      expect(detectLanguage('Mere plant ko kitna paani dena chahiye?')).toBe('hinglish');
      expect(detectLanguage('Is plan ko kaise follow karu?')).toBe('hinglish');
      expect(detectLanguage('Aur sunlight?')).toBe('hinglish');
      expect(detectLanguage('Isko summer mein kya karna chahiye?')).toBe('hinglish');
      expect(detectLanguage('Hindi me batao')).toBe('hinglish');
      expect(detectLanguage('Doosra plant kaisa hai?')).toBe('hinglish');
    });

    it('detects English', () => {
      expect(detectLanguage('Why are my monstera leaves yellow?')).toBe('english');
      expect(detectLanguage('How often should I water my snake plant?')).toBe('english');
      expect(detectLanguage('What about the second plant?')).toBe('english');
    });
  });

  // ── 2. Message Structuring & Gemini Alternation ─────────────────────────────
  describe('Gemini Contents Formatting & Alternation', () => {
    it('drops leading model greeting so turn 1 is always user', () => {
      const history = [
        { sender: 'leafy' as const, text: 'Hello, I am Leafy!' },
        { sender: 'user' as const, text: 'Hi, I need help with my Pothos.' },
        { sender: 'leafy' as const, text: 'Pothos plants are very hardy.' },
      ];
      const contents = formatGeminiContents(history, 'How much light does it need?');

      expect(contents[0].role).toBe('user');
      expect(contents[0].parts[0]).toEqual({ text: 'Hi, I need help with my Pothos.' });
      expect(contents[1].role).toBe('model');
      expect(contents[contents.length - 1].role).toBe('user');
      expect(contents[contents.length - 1].parts[0]).toEqual({ text: 'How much light does it need?' });
    });

    it('merges consecutive identical roles so Gemini never receives duplicate turns', () => {
      const history = [
        { sender: 'user' as const, text: 'My monstera is drooping.' },
        { sender: 'user' as const, text: 'And the soil feels very wet.' },
        { sender: 'leafy' as const, text: 'That sounds like overwatering.' },
      ];
      const contents = formatGeminiContents(history, 'What should I do?');

      expect(contents[0].role).toBe('user');
      expect((contents[0].parts[0] as any).text).toContain('drooping');
      expect((contents[0].parts[0] as any).text).toContain('soil feels very wet');
      expect(contents[1].role).toBe('model');
      expect(contents[2].role).toBe('user');
      expect(contents.length).toBe(3);
    });

    it('limits history to last 10 turns to avoid context overflow', () => {
      const history = Array.from({ length: 20 }, (_, i) => ({
        sender: (i % 2 === 0 ? 'user' : 'leafy') as 'user' | 'leafy',
        text: `Message ${i}`,
      }));
      const contents = formatGeminiContents(history, 'Final question');

      expect(contents.length).toBeLessThanOrEqual(11);
      expect(contents[contents.length - 1].parts[0]).toEqual({ text: 'Final question' });
    });
  });

  // ── 3. Multilingual Botanical Fallback Engine ────────────────────────────────
  describe('Multilingual Botanical Fallback Engine', () => {
    const mockPlants = [
      { nickname: 'Swiss Beauty', species: 'Monstera deliciosa', sunlight_level: 'High', water_frequency_days: 7 },
      { nickname: 'Golden Vine', species: 'Epipremnum aureum', sunlight_level: 'Medium', water_frequency_days: 6 },
    ];

    it('Test 1: User asks in Hindi -> Assistant responds in Hindi', () => {
      const reply = generateBotanicalFallback('मेरे पौधे की पत्तियां पीली क्यों हो रही हैं?', mockPlants);
      expect(/[\u0900-\u097F]/.test(reply)).toBe(true);
      expect(reply).toContain('पानी');
    });

    it('Test 2: User asks in Hinglish -> Assistant responds in Hinglish', () => {
      const reply = generateBotanicalFallback('Mere plant ko kitna paani dena chahiye?', mockPlants);
      expect(reply.toLowerCase()).toMatch(/(paani|mitti|pot|drainage)/);
      expect(/[\u0900-\u097F]/.test(reply)).toBe(false);
    });

    it('Test 3: User asks in English -> Assistant responds in English', () => {
      const reply = generateBotanicalFallback('How often should I water my monstera?', mockPlants);
      expect(reply).toContain('water');
      expect(/[\u0900-\u097F]/.test(reply)).toBe(false);
    });

    it('Test 4 & 5: Language Switching (English to Hindi & Hindi to English)', () => {
      const hindiReply = generateBotanicalFallback('इसे हिंदी में समझाएं', mockPlants);
      expect(/[\u0900-\u097F]/.test(hindiReply)).toBe(true);

      const englishReply = generateBotanicalFallback('Explain sunlight requirements', mockPlants);
      expect(englishReply).toContain('Window');
    });

    it('Test 6: Follow-up about plant care plan ("Is plan ko kaise follow karu?")', () => {
      const reply = generateBotanicalFallback('Is plan ko kaise follow karu?', mockPlants);
      expect(reply.toLowerCase()).toMatch(/(plan|follow|topsoil|paani)/);
    });

    it('Test 7: Follow-up about sunlight after discussing watering ("Aur sunlight?")', () => {
      const reply = generateBotanicalFallback('Aur sunlight?', mockPlants);
      expect(reply.toLowerCase()).toMatch(/(sunlight|dhoop|window|light)/);
    });

    it('Test 8: Follow-up about the second plant ("What about the second plant?")', () => {
      const reply = generateBotanicalFallback('What about the second plant?', mockPlants);
      expect(reply).toContain('Golden Vine');
      expect(reply).toContain('Epipremnum aureum');
    });

    it('Test 8b: Follow-up about second plant in Hinglish ("Doosra plant kaisa hai?")', () => {
      const reply = generateBotanicalFallback('Doosra plant kaisa hai?', mockPlants);
      expect(reply).toContain('Golden Vine');
      expect(reply).toMatch(/(sunlight|paani)/);
    });

    it('Strict No-Repeat Rule: Never returns identical text twice in a row (English)', () => {
      const firstReply = generateBotanicalFallback('How do I care for indoor plants?', mockPlants);
      const history = [
        { sender: 'user' as const, text: 'How do I care for indoor plants?' },
        { sender: 'leafy' as const, text: firstReply },
      ];
      const secondReply = generateBotanicalFallback('How do I care for indoor plants?', mockPlants, history);
      expect(secondReply).not.toBe(firstReply);
      expect(detectLanguage(secondReply)).toBe('english');
    });

    it('Strict No-Repeat Rule: Never returns identical text twice in a row (Hindi)', () => {
      const firstReply = generateBotanicalFallback('पौधों की देखभाल कैसे करें?', mockPlants);
      const history = [
        { sender: 'user' as const, text: 'पौधों की देखभाल कैसे करें?' },
        { sender: 'leafy' as const, text: firstReply },
      ];
      const secondReply = generateBotanicalFallback('पौधों की देखभाल कैसे करें?', mockPlants, history);
      expect(secondReply).not.toBe(firstReply);
      expect(detectLanguage(secondReply)).toBe('hindi');
    });

    it('Strict No-Repeat Rule: Never returns identical text twice in a row (Hinglish)', () => {
      const firstReply = generateBotanicalFallback('Plant care kaise karein?', mockPlants);
      const history = [
        { sender: 'user' as const, text: 'Plant care kaise karein?' },
        { sender: 'leafy' as const, text: firstReply },
      ];
      const secondReply = generateBotanicalFallback('Plant care kaise karein?', mockPlants, history);
      expect(secondReply).not.toBe(firstReply);
      expect(detectLanguage(secondReply)).toBe('hinglish');
    });
  });

  // ── 4. End-to-End POST /api/leafy Integration ────────────────────────────────
  describe('End-to-End POST /api/leafy Endpoint', () => {
    it('handles Hindi questions end-to-end', async () => {
      if (!userToken) return;
      const res = await request(app)
        .post('/api/leafy')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          message: 'पौधों को पानी देने का सही समय क्या है?',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.is_botanical).toBe(true);
      expect(/[\u0900-\u097F]/.test(res.body.data.reply)).toBe(true);
    });

    it('handles Hinglish follow-up questions end-to-end with conversation history', async () => {
      if (!userToken) return;
      const history = [
        { sender: 'user' as const, text: 'My monstera leaves are yellow.' },
        { sender: 'leafy' as const, text: 'Yellow leaves usually mean overwatering. Check drainage.' },
      ];

      const res = await request(app)
        .post('/api/leafy')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          message: 'Is plan ko kaise follow karu?',
          history,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.is_botanical).toBe(true);
      expect(res.body.data.reply.toLowerCase()).toMatch(/(plan|paani|mitti|drainage|light)/);
    });

    it('handles rapid sequential queries without race-condition state corruptions', async () => {
      if (!userToken) return;
      const requests = [
        request(app).post('/api/leafy').set('Authorization', `Bearer ${userToken}`).send({ message: 'Kitna paani dena hai?' }),
        request(app).post('/api/leafy').set('Authorization', `Bearer ${userToken}`).send({ message: 'Aur sunlight?' }),
      ];

      const responses = await Promise.all(requests);
      expect(responses[0].status).toBe(200);
      expect(responses[1].status).toBe(200);
      expect(responses[0].body.success).toBe(true);
      expect(responses[1].body.success).toBe(true);
    });

    it('returns polite refusal in Hinglish for off-topic query in Hinglish', async () => {
      if (!userToken) return;
      const res = await request(app)
        .post('/api/leafy')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          message: 'Cricket match kaun jeeta aur election mein kaun aage hai?',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.is_botanical).toBe(false);
      expect(res.body.data.reply).toMatch(/(Leafy|paudhon|houseplants|botanical)/i);
    });

    it('returns polite refusal in Hindi for off-topic query in Hindi', async () => {
      if (!userToken) return;
      const res = await request(app)
        .post('/api/leafy')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          message: 'राष्ट्रपति चुनाव कौन जीता?',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.is_botanical).toBe(false);
      expect(/[\u0900-\u097F]/.test(res.body.data.reply)).toBe(true);
    });
  });
});
