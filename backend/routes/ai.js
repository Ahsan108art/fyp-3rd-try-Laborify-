const express = require('express');
const router = express.Router();
const axios = require('axios');
const Worker = require('../models/Worker');
const Job = require('../models/Job');

const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

router.post('/chat', async (req, res) => {
  try {
    const { prompt, history = [] } = req.body;

    // Prefer online workers; fall back to all workers if none online
    let workers = await Worker.find({ isOnline: true })
      .select('name skills rating chargePerHour jobsCompleted')
      .sort({ rating: -1 })
      .limit(8);

    if (workers.length === 0) {
      workers = await Worker.find()
        .select('name skills rating chargePerHour jobsCompleted')
        .sort({ rating: -1 })
        .limit(8);
    }

    const jobs = await Job.find({ status: 'open' })
      .select('title description category address')
      .limit(6);

    let context = '=== Live Laborify Database ===\n';

    if (workers.length > 0) {
      context += '\nAvailable Workers (sorted by rating):\n';
      workers.forEach(w => {
        const skills = w.skills?.filter(Boolean).join(', ') || 'General labour';
        const rating = w.rating ? `${w.rating.toFixed(1)}★` : 'New';
        const rate = w.chargePerHour ? `PKR ${w.chargePerHour}/hr` : 'rate TBD';
        const done = w.jobsCompleted ? ` | ${w.jobsCompleted} jobs done` : '';
        context += `• ${w.name} — ${skills} | ${rating} | ${rate}${done}\n`;
      });
    } else {
      context += '\nNo workers found yet.\n';
    }

    if (jobs.length > 0) {
      context += '\nOpen Job Postings:\n';
      jobs.forEach(j => {
        const loc = j.address ? ` in ${j.address}` : '';
        context += `• [${j.category || 'General'}] ${j.title}${loc}: ${j.description || ''}\n`;
      });
    }

    const systemPrompt = `You are the Laborify AI Assistant — a helpful, friendly assistant for a Pakistani labor marketplace app connecting clients with skilled workers (plumbers, electricians, carpenters, painters, cleaners, etc.).

Your role:
- Help clients find the right worker; name specific workers from the database when relevant
- Help laborers understand what jobs are available
- Answer questions about pricing, skills, and how Laborify works
- Give brief practical home-repair advice when asked
- Keep responses concise and mobile-friendly (2-4 short paragraphs max)
- If no workers match, suggest the client post a job

${context}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: prompt },
    ];

    try {
      const response = await axios.post(
        GROQ_URL,
        { model: GROQ_MODEL, messages, max_tokens: 512, temperature: 0.7 },
        {
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );

      const text = response.data.choices?.[0]?.message?.content;
      if (text) return res.json({ response: text.trim() });
      throw new Error('Empty response from Groq');

    } catch (apiErr) {
      const status = apiErr?.response?.status;
      const detail = apiErr?.response?.data?.error?.message || apiErr.message;
      console.error(`[AI] Groq error (${status}):`, detail);

      const top = workers[0];
      const skillText = top?.skills?.filter(Boolean).join(', ') || 'general labour';
      const fallback = top
        ? `I can't reach the AI right now, but here's what I know:\n\nWe have ${workers.length} worker(s) available. Top pick: ${top.name} — ${skillText} | PKR ${top.chargePerHour || '?'}/hr${top.rating ? ` | ${top.rating.toFixed(1)}★` : ''}.\n\nOpen the Find Worker screen to browse and book!`
        : "I can't reach the AI right now. Head to Find Worker to browse available workers, or post a job and workers will apply.";

      return res.json({ response: fallback });
    }

  } catch (err) {
    console.error('[AI] Route error:', err.message);
    res.json({ response: 'Something went wrong on my end. Please try again shortly.' });
  }
});

module.exports = router;
