import express, { Request, Response } from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import { supabaseAdmin } from './supabase';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Nodemailer transport setup
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'info@gaplytiq.com',
    pass: process.env.SMTP_PASS || 'Gaplytiq@2026',
  },
});

// Verify email transporter
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP connection error:', error);
  } else {
    console.log('SMTP server is ready to send messages');
  }
});

// Get all colleges
app.get('/api/colleges', async (req: Request, res: Response): Promise<any> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('colleges')
      .select('id, name, email, password, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("GET /api/colleges error:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
    return res.json({ success: true, data: data || [] });
  } catch (err: any) {
    console.error("Unexpected error in GET /api/colleges:", err);
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
    // 1. Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      console.error("Auth creation error:", authError);
      return res.status(500).json({ success: false, error: authError.message });
    }

    const userId = authData.user.id;

    // 2. Insert into colleges table
    const { error: dbError } = await supabaseAdmin
      .from('colleges')
      .insert([{ id: userId, name, email, password }]);

    if (dbError) {
      console.error("DB insert error:", dbError);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return res.status(500).json({ success: false, error: dbError.message });
    }
    return res.json({ success: true });
  } catch (err: any) {
    console.error("Unexpected error in POST /api/colleges:", err);
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
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.error("Auth validation error:", authError);
      return res.status(401).json({ success: false, error: authError.message });
    }

    const { data: dbData, error: dbError } = await supabaseAdmin
      .from('colleges')
      .select('id, name, email')
      .eq('id', authData.user.id)
      .single();

    if (dbError) {
      console.error("DB fetch error during validate:", dbError);
      return res.status(500).json({ success: false, error: dbError.message });
    }

    return res.json({ success: true, college: { id: dbData.id, name: dbData.name, email: dbData.email } });
  } catch (err: any) {
    console.error("Unexpected error in validate:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Get all judges (joining with colleges table to resolve name)
app.get('/api/judges', async (req: Request, res: Response): Promise<any> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('judges')
      .select('id, name, email, dept, college_id, colleges(name), created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("GET /api/judges error:", error);
      return res.status(500).json({ success: false, error: error.message });
    }

    // Map response to fit frontend structure
    const formattedData = (data || []).map((j: any) => ({
      id: j.id,
      name: j.name,
      email: j.email,
      dept: j.dept,
      college_name: j.colleges ? j.colleges.name : 'Unknown College',
      created_at: j.created_at
    }));

    return res.json({ success: true, data: formattedData });
  } catch (err: any) {
    console.error("Unexpected error in GET /api/judges:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Create a judge & send invite email
app.post('/api/judges', async (req: Request, res: Response): Promise<any> => {
  const { name, email, dept, college_id } = req.body;
  if (!name || !email || !dept || !college_id) {
    return res.status(400).json({ success: false, error: 'Missing fields' });
  }

  try {
    // 0. Fetch the college name for the invitation email
    const { data: collegeData, error: collegeError } = await supabaseAdmin
      .from('colleges')
      .select('name')
      .eq('id', college_id)
      .single();

    if (collegeError || !collegeData) {
      console.error("Failed to fetch college name:", collegeError);
      return res.status(400).json({ success: false, error: 'Invalid college_id' });
    }

    const collegeName = collegeData.name;

    // Generate a temporary secure password
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).toUpperCase().slice(-8) + "!1a";

    let userId;
    let isNewUser = true;

    // 1. Create auth user for the judge
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
    });

    if (authError) {
      if (authError.status === 422 || authError.message.includes('email_exists') || authError.code === 'email_exists') {
        console.log(`User ${email} already exists in Auth. Trying to fetch existing user...`);
        // User already exists, try to fetch them from auth.admin
        const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
        if (usersData && usersData.users) {
          const existingUser = usersData.users.find(u => u.email === email);
          if (existingUser) {
            userId = existingUser.id;
            isNewUser = false;
            // Update their password to the temp password so the link works seamlessly
            await supabaseAdmin.auth.admin.updateUserById(userId, { password: tempPassword });
          } else {
             return res.status(500).json({ success: false, error: 'User exists in Auth but could not be retrieved from listUsers.' });
          }
        } else {
          return res.status(500).json({ success: false, error: 'Could not fetch users to resolve email_exists.' });
        }
      } else {
        console.error("Auth creation error for judge:", authError);
        return res.status(500).json({ success: false, error: authError.message });
      }
    } else {
      userId = authData.user.id;
    }

    // 2. Upsert profile into judges table using college_id foreign key
    const { error: dbError } = await supabaseAdmin
      .from('judges')
      .upsert([{ id: userId, name, email, dept, college_id }], { onConflict: 'id' });

    if (dbError) {
      console.error("DB upsert error for judge:", dbError);
      // We only delete user if we just created it and it failed
      if (isNewUser) {
        await supabaseAdmin.auth.admin.deleteUser(userId);
      }
      return res.status(500).json({ success: false, error: dbError.message });
    }

    // 3. Generate invite/recovery link
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: isNewUser ? 'invite' : 'recovery',
      email,
      options: {
        redirectTo: 'http://localhost:3000/jury/reset-password'
      }
    });

    if (linkError) {
      console.error("Generate invite link error:", linkError);
      return res.status(500).json({ success: false, error: 'User created but invite link generation failed: ' + linkError.message });
    }

    const actionLink = linkData.properties.action_link;

    // 4. Send email invitation via Hostinger SMTP
    const mailOptions = {
      from: `"MarkUp Platform" <${process.env.FROM_EMAIL || 'info@gaplytiq.com'}>`,
      to: email,
      subject: 'Jury Appointment - MarkUp Platform',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; color: #333; max-width: 600px; border: 1px solid #E2E8F0; border-radius: 12px; margin: 0 auto;">
          <h2 style="color: #4F46E5; margin-bottom: 16px;">Jury Panel Selection</h2>
          <p>Hello <strong>${name}</strong>,</p>
          <p>You have been appointed to the Jury panel for the MarkUp contest by the administration at <strong>${collegeName}</strong>.</p>
          <div style="background-color: #F8FAFC; padding: 14px 18px; border-radius: 8px; margin: 18px 0; border-left: 4px solid #4F46E5;">
            <strong>Department:</strong> ${dept}<br/>
            <strong>Role:</strong> School of Business Faculty Jury
          </div>
          <p>To access the Jury Portal and score student campaign reels, please click the button below to set up your password and complete your registration:</p>
          <p style="margin: 28px 0; text-align: center;">
            <a href="${actionLink}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">
              Set Up Password & Access Portal
            </a>
          </p>
          <p style="font-size: 12px; color: #64748B; margin-top: 24px;">If the button above does not work, copy and paste this URL into your browser:</p>
          <p style="font-size: 12px; word-break: break-all; color: #4F46E5;">${actionLink}</p>
          <hr style="border: none; border-top: 1px solid #E2E8F0; margin-top: 30px;" />
          <p style="font-size: 11px; color: #94A3B8; text-align: center; margin: 0;">Powered by Gaplytiq · MarkUp Platform</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.json({ success: true, message: 'Judge appointed and invitation email sent' });
  } catch (err: any) {
    console.error("Unexpected error in POST /api/judges:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
