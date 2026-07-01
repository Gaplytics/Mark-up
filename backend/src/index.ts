import express, { Request, Response } from 'express';
import cors from 'cors';
import { supabaseAdmin } from './supabase';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Get all colleges
app.get('/api/colleges', async (req: Request, res: Response): Promise<any> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('colleges')
      .select('id, name, email, password, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    return res.json({ success: true, data: data || [] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Create a college
app.post('/api/colleges', async (req: Request, res: Response): Promise<any> => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: 'Missing fields' });
  }

  try {
    const { error } = await supabaseAdmin
      .from('colleges')
      .insert([{ name, email, password }]);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Validate college login
app.post('/api/colleges/validate', async (req: Request, res: Response): Promise<any> => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Missing credentials' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('colleges')
      .select('name, email, password')
      .eq('email', email)
      .single();

    if (error) {
      return res.status(401).json({ success: false, error: error.message });
    }

    if (data && data.password === password) {
      return res.json({ success: true, college: { name: data.name, email: data.email } });
    }
    return res.status(401).json({ success: false, error: 'Invalid password' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
