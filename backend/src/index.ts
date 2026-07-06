import express, { Request, Response } from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import { supabaseAdmin } from './supabase';
import fs from 'fs';
import path from 'path';

const TEAMS_FILE = path.join(__dirname, 'teams.json');

function getTeamsData(): Record<string, string> {
  try {
    if (!fs.existsSync(TEAMS_FILE)) {
      return {};
    }
    const content = fs.readFileSync(TEAMS_FILE, 'utf-8');
    return JSON.parse(content || '{}');
  } catch (err) {
    console.error("Error reading teams.json:", err);
    return {};
  }
}

function saveTeamsData(data: Record<string, string>) {
  try {
    fs.writeFileSync(TEAMS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error("Error writing teams.json:", err);
  }
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Set up Nodemailer transporter using Hostinger SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
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
      .maybeSingle();

    if (dbError) {
      console.error("DB fetch error during validate:", dbError);
      return res.status(500).json({ success: false, error: dbError.message });
    }

    if (!dbData) {
      return res.status(403).json({ success: false, error: 'Access denied: This login portal is restricted to college administrators.' });
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

// Delete a judge
app.delete('/api/judges/:id', async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  try {
    // Delete the user from auth.users (this will cascade to the judges table due to foreign key)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id as string);

    if (error) {
      console.error("DELETE /api/judges/:id error:", error);
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, message: 'Judge removed successfully' });
  } catch (err: any) {
    console.error("Unexpected error in DELETE /api/judges/:id:", err);
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
    // 0. Check if judge email already exists in the judges table
    const { data: existingJudge } = await supabaseAdmin
      .from('judges')
      .select('id')
      .eq('email', email)
      .maybeSingle();
      
    if (existingJudge) {
      return res.status(400).json({ success: false, error: 'A judge with this email already exists on the panel.' });
    }

    // 0.5 Fetch the college name for the invitation email
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
    // We must use 'recovery' because 'invite' attempts to CREATE the user, but we already created them above!
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: 'http://localhost:3000/jury/reset-password'
      }
    });

    if (linkError) {
      console.error("Generate invite link error:", linkError);
      return res.status(500).json({ success: false, error: 'User created but invite link generation failed: ' + linkError.message });
    }

    let actionLink = linkData.properties.action_link;

    // Fix: Supabase sometimes generates links with 'localhost' if its internal SITE_URL is misconfigured.
    // We rewrite the link to use our configured SUPABASE_URL from the .env file.
    const supabaseUrl = process.env.SUPABASE_URL;
    if (supabaseUrl && actionLink.includes('localhost')) {
      try {
        const parsedLink = new URL(actionLink);
        const parsedSupabase = new URL(supabaseUrl);
        parsedLink.protocol = parsedSupabase.protocol;
        parsedLink.host = parsedSupabase.host;
        actionLink = parsedLink.toString();
      } catch (e) {
        console.error("Could not parse actionLink for rewriting:", e);
      }
    }

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

// =====================================
app.post('/api/jury/login', async (req: Request, res: Response): Promise<any> => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password required' });
  }

  try {
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const { data: judgeData, error: dbError } = await supabaseAdmin
      .from('judges')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (dbError || !judgeData) {
      return res.status(401).json({ success: false, error: 'Access denied: User is not recognized as a judge.' });
    }

    return res.json({ success: true, judge: judgeData });
  } catch (err: any) {
    console.error("Unexpected error in POST /api/jury/login:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

const activeOtps = new Map<string, string>();

// Send OTP to student email
app.post('/api/student/send-otp', async (req: Request, res: Response): Promise<any> => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required' });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    
    // Check if student exists in the database
    const { data: student, error } = await supabaseAdmin
      .from('students')
      .select('*, teams:teams!students_team_id_fkey(leader_id)')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (error || !student) {
      return res.status(400).json({ success: false, error: 'This email is not registered as a student. Contact your College Admin.' });
    }

    // Check college settings - if Round 1 is closed, only leaders can login/request OTP
    const { data: settings } = await supabaseAdmin
      .from('college_settings')
      .select('round1_status')
      .eq('college_id', student.college_id)
      .maybeSingle();

    const round1Status = settings ? settings.round1_status : 'not-started';
    if (round1Status === 'closed') {
      const isLeader = student.teams && (Array.isArray(student.teams) ? student.teams[0]?.leader_id === student.id : (student.teams as any)?.leader_id === student.id);
      if (!isLeader) {
        return res.status(403).json({
          success: false,
          error: 'Round 1 is completed. Only Team Leaders are authorized to log in for subsequent rounds.'
        });
      }
    }

    const otpCode = String(Math.floor(1000 + Math.random() * 9000));
    activeOtps.set(normalizedEmail, otpCode);

    // Send email via nodemailer
    const mailOptions = {
      from: `"MarkUp Platform" <${process.env.SMTP_USER}>`,
      to: normalizedEmail,
      subject: 'Your MarkUp Student Verification OTP',
      text: `Your OTP is ${otpCode}. It is valid for 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; max-width: 500px; border-radius: 8px;">
          <h2 style="color: #FF5A5F; margin-bottom: 20px;">MarkUp Verification</h2>
          <p>Hello,</p>
          <p>Your one-time verification code to sign in is:</p>
          <div style="background: #f4f4f4; padding: 12px; font-size: 24px; font-weight: bold; letter-spacing: 4px; text-align: center; border-radius: 4px; margin: 20px 0; color: #333;">
            ${otpCode}
          </div>
          <p>Please enter this code on the verification screen to proceed.</p>
          <p style="font-size: 12px; color: #777; margin-top: 30px;">This code is valid for 10 minutes. If you did not request this, please ignore this email.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return res.json({ success: true, message: 'OTP sent successfully' });
  } catch (err: any) {
    console.error("Error in send-otp:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Verify OTP and return student profile
app.post('/api/student/verify-otp', async (req: Request, res: Response): Promise<any> => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ success: false, error: 'Email and OTP code are required' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const storedOtp = activeOtps.get(normalizedEmail);

  if (!storedOtp || storedOtp !== code.trim()) {
    return res.status(400).json({ success: false, error: 'Invalid or expired OTP.' });
  }

  // Clear OTP on successful verification
  activeOtps.delete(normalizedEmail);

  try {
    const { data: student, error } = await supabaseAdmin
      .from('students')
      .select('*, teams:teams!students_team_id_fkey(id, name, leader_id)')
      .eq('email', normalizedEmail)
      .single();

    if (error || !student) {
      return res.status(400).json({ success: false, error: 'Student profile not found.' });
    }

    // Check college settings - if Round 1 is closed, only leaders can login/verify OTP
    const { data: settings } = await supabaseAdmin
      .from('college_settings')
      .select('round1_status')
      .eq('college_id', student.college_id)
      .maybeSingle();

    const round1Status = settings ? settings.round1_status : 'not-started';
    if (round1Status === 'closed') {
      const isLeader = student.teams && (Array.isArray(student.teams) ? student.teams[0]?.leader_id === student.id : (student.teams as any)?.leader_id === student.id);
      if (!isLeader) {
        return res.status(403).json({
          success: false,
          error: 'Round 1 is completed. Only Team Leaders are authorized to log in for subsequent rounds.'
        });
      }
    }

    // Resolve college name if possible
    let collegeName = "Unknown College";
    const { data: college } = await supabaseAdmin
      .from('colleges')
      .select('name')
      .eq('id', student.college_id)
      .maybeSingle();
      
    if (college) {
      collegeName = college.name;
    }

    return res.json({
      success: true,
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        collegeId: student.college_id,
        college: collegeName,
        slotId: student.slot_id,
        teamId: student.team_id || null,
        team: student.teams ? {
          id: student.teams.id,
          name: student.teams.name,
          leaderId: student.teams.leader_id
        } : null,
        round1Status: student.round1_status || "not-started",
        r1Score: student.r1_score,
        round2: {
          status: student.round2_status || "not-submitted",
          link: student.r2_link || "",
          note: student.r2_note || "",
          juryScore: student.r2_score
        },
        round3: {
          status: student.round3_status || "not-submitted",
          link: student.r3_link || "",
          note: student.r3_note || "",
          juryScore: student.r3_score
        }
      }
    });
  } catch (err: any) {
    console.error("Error in verify-otp:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// STUDENTS
// =====================================

async function sendSlotSelectionEmail(studentId: string, email: string, name: string) {
  const selectUrl = `http://localhost:3000/student/select-slot?id=${studentId}`;
  const mailOptions = {
    from: `"MarkUp Platform" <${process.env.SMTP_USER}>`,
    to: email.trim().toLowerCase(),
    subject: 'Select Your MarkUp Test Slot',
    text: `Hello ${name},\n\nPlease select your test slot for MarkUp by visiting this link: ${selectUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; max-width: 500px; border-radius: 8px;">
        <h2 style="color: #FF5A5F; margin-bottom: 20px;">Welcome to MarkUp!</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your college admin has registered you for the MarkUp competition. To get started, please select your testing slot:</p>
        <div style="text-align: center; margin: 25px 0;">
          <a href="${selectUrl}" style="background-color: #FF5A5F; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Select Testing Slot</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; font-size: 13px; color: #555;"><a href="${selectUrl}">${selectUrl}</a></p>
        <p style="font-size: 12px; color: #777; margin-top: 30px;">If you have any questions, please contact your College Admin.</p>
      </div>
    `
  };
  await transporter.sendMail(mailOptions);
}

// Get student details by ID
app.get('/api/students/:id', async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  try {
    const { data: student, error } = await supabaseAdmin
      .from('students')
      .select('*, teams:teams!students_team_id_fkey(id, name, leader_id)')
      .eq('id', id)
      .maybeSingle();

    if (error || !student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    let collegeName = "Unknown College";
    const { data: college } = await supabaseAdmin
      .from('colleges')
      .select('name')
      .eq('id', student.college_id)
      .maybeSingle();
      
    if (college) {
      collegeName = college.name;
    }

    return res.json({
      success: true,
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        college: collegeName,
        slotId: student.slot_id,
        teamId: student.team_id || null,
        team: student.teams ? {
          id: student.teams.id,
          name: student.teams.name,
          leaderId: student.teams.leader_id
        } : null
      }
    });
  } catch (err: any) {
    console.error("GET /api/students/:id error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Get all slots with capacity info
app.get('/api/slots', async (req: Request, res: Response): Promise<any> => {
  try {
    const { data: slots, error: slotsError } = await supabaseAdmin
      .from('slots')
      .select('*')
      .order('id');
      
    if (slotsError) {
      return res.status(500).json({ success: false, error: slotsError.message });
    }

    const { data: students, error: studentsError } = await supabaseAdmin
      .from('students')
      .select('slot_id');

    if (studentsError) {
      return res.status(500).json({ success: false, error: studentsError.message });
    }

    const slotCounts = (students || []).reduce((acc: any, curr: any) => {
      if (curr.slot_id) {
        acc[curr.slot_id] = (acc[curr.slot_id] || 0) + 1;
      }
      return acc;
    }, {});

    const slotsWithAvailability = (slots || []).map((s: any) => ({
      id: s.id,
      label: s.label,
      capacity: s.capacity,
      filled: slotCounts[s.id] || 0
    }));

    return res.json({ success: true, data: slotsWithAvailability });
  } catch (err: any) {
    console.error("GET /api/slots error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Update student slot selection
app.post('/api/students/:id/select-slot', async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const { slotId } = req.body;

  if (!slotId) {
    return res.status(400).json({ success: false, error: 'slotId is required' });
  }

  try {
    // Check if the student already has a slot
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('slot_id, email, name')
      .eq('id', id)
      .single();

    if (studentError || !student) {
      return res.status(404).json({ success: false, error: 'Student not found.' });
    }

    if (student.slot_id) {
      return res.status(400).json({ success: false, error: 'You have already selected a slot. You cannot change it.' });
    }

    // Get the slot label for the email
    const { data: slotData, error: slotError } = await supabaseAdmin
      .from('slots')
      .select('label')
      .eq('id', slotId)
      .single();

    if (slotError || !slotData) {
      return res.status(404).json({ success: false, error: 'Slot not found.' });
    }

    const { data, error } = await supabaseAdmin.rpc('assign_student_slot', {
      p_student_id: id,
      p_slot_id: slotId
    });

    if (error) {
      console.error("Update slot error:", error);
      return res.status(400).json({ success: false, error: 'Failed to update slot: ' + error.message });
    }

    if (data && !data.success) {
      return res.status(400).json({ success: false, error: data.error });
    }

    // Auto-assign to incomplete group if groups already exist for this slot
    try {
      const { data: slotStudents } = await supabaseAdmin
        .from('students')
        .select('id, team_id')
        .eq('slot_id', slotId)
        .not('id', 'eq', id);

      if (slotStudents && slotStudents.length > 0) {
        // Check if any groups have been formed
        const groupCounts: Record<string, number> = {};
        slotStudents.forEach((s: any) => {
          if (s.team_id) {
            groupCounts[s.team_id] = (groupCounts[s.team_id] || 0) + 1;
          }
        });

        // If groups exist, find one with < 5 members
        if (Object.keys(groupCounts).length > 0) {
          const incompleteGroup = Object.entries(groupCounts).find(([, count]) => count < 5);
          if (incompleteGroup) {
            await supabaseAdmin
              .from('students')
              .update({ team_id: incompleteGroup[0] })
              .eq('id', id);
          }
          // If no incomplete group, student stays ungrouped (all 6 groups are full = slot is full)
        }
      }
    } catch (autoGroupErr) {
      console.error("Auto-group assignment failed (non-critical):", autoGroupErr);
    }

    // Send confirmation email
    try {
      const mailOptions = {
        from: `"MarkUp Platform" <${process.env.SMTP_USER}>`,
        to: student.email,
        subject: 'MarkUp Test Slot Confirmed',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; max-width: 500px; border-radius: 8px;">
            <h2 style="color: #FF5A5F; margin-bottom: 20px;">Slot Confirmed!</h2>
            <p>Hello <strong>${student.name}</strong>,</p>
            <p>Your test slot for the MarkUp competition has been successfully confirmed.</p>
            <div style="background: #f4f4f4; padding: 16px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <div style="font-size: 12px; color: #555; text-transform: uppercase; font-weight: bold; margin-bottom: 8px;">Your Slot</div>
              <div style="font-size: 20px; color: #333; font-weight: bold;">${slotData.label}</div>
            </div>
            <p style="font-size: 14px; color: #333;">Please ensure you are available during this time.</p>
            <p style="font-size: 12px; color: #777; margin-top: 30px;">If you have any questions, please contact your College Admin.</p>
          </div>
        `
      };
      await transporter.sendMail(mailOptions);
    } catch (mailErr) {
      console.error("Failed to send slot confirmation email:", mailErr);
    }

    return res.json({ success: true, message: data?.message });
  } catch (err: any) {
    console.error("POST /api/students/:id/select-slot error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Get students by college id
app.get('/api/students', async (req: Request, res: Response): Promise<any> => {
  const college_id = req.query.college_id as string;
  if (!college_id) {
    return res.status(400).json({ success: false, error: 'Missing college_id' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('students')
      .select('*, teams:teams!students_team_id_fkey(id, name, leader_id)')
      .eq('college_id', college_id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error("GET /api/students error:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
    const withTeams = (data || []).map((s: any) => ({
      ...s,
      team: s.teams ? {
        id: s.teams.id,
        name: s.teams.name,
        leaderId: s.teams.leader_id
      } : null
    }));
    return res.json({ success: true, data: withTeams });
  } catch (err: any) {
    console.error("Unexpected error in GET /api/students:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Assign a list of students to a team name (or clear team assignment)
app.post('/api/students/assign-team', async (req: Request, res: Response): Promise<any> => {
  const { studentIds, teamName } = req.body;
  if (!studentIds || !Array.isArray(studentIds)) {
    return res.status(400).json({ success: false, error: 'studentIds array is required' });
  }

  const cleanupEmptyTeams = async (collegeId: string) => {
    try {
      const { data: teams } = await supabaseAdmin
        .from('teams')
        .select('id, name')
        .eq('college_id', collegeId);

      if (teams && teams.length > 0) {
        for (const t of teams) {
          const { count } = await supabaseAdmin
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('team_id', t.id);

          if (count === 0 && !t.name.endsWith(' (Individual)')) {
            await supabaseAdmin.from('teams').delete().eq('id', t.id);
            console.log(`Deleted empty competitive team: ${t.name}`);
          }
        }
      }
    } catch (err) {
      console.error("Cleanup empty teams error:", err);
    }
  };

  try {
    if (!teamName) {
      const { data: studentsData, error: sErr } = await supabaseAdmin
        .from('students')
        .select('id, name, college_id')
        .in('id', studentIds);
      if (sErr || !studentsData || studentsData.length === 0) throw new Error("Could not fetch students");
      const collegeId = studentsData[0].college_id;

      for (const student of studentsData) {
        const expectedName = `${student.name} (Individual)`;
        const { data: existingTeam } = await supabaseAdmin
          .from('teams')
          .select('id')
          .eq('college_id', student.college_id)
          .eq('name', expectedName)
          .maybeSingle();

        let targetTeamId;
        if (existingTeam) {
          targetTeamId = existingTeam.id;
        } else {
          const { data: newTeam, error: teamErr } = await supabaseAdmin
            .from('teams')
            .insert([{ name: expectedName, college_id: student.college_id, leader_id: student.id }])
            .select()
            .single();
          if (teamErr || !newTeam) {
            console.error(`Failed to recreate default team for ${student.name}:`, teamErr);
            continue;
          }
          targetTeamId = newTeam.id;
        }

        await supabaseAdmin
          .from('students')
          .update({ team_id: targetTeamId })
          .eq('id', student.id);
      }

      await cleanupEmptyTeams(collegeId);
      return res.json({ success: true });
    }

    const trimmedName = teamName.trim();
    // 1. Fetch details of all incoming students
    const { data: studentsData, error: sErr } = await supabaseAdmin
      .from('students')
      .select('id, name, college_id, slot_id')
      .in('id', studentIds);

    if (sErr || !studentsData || studentsData.length === 0) {
      return res.status(400).json({ success: false, error: 'Could not retrieve student records.' });
    }

    const collegeId = studentsData[0].college_id;
    const targetSlotId = studentsData[0].slot_id;

    // Validate that all students have selected a slot
    const slotlessStudent = studentsData.find(s => !s.slot_id);
    if (slotlessStudent) {
      return res.status(400).json({ success: false, error: `Student "${slotlessStudent.name}" must select a slot before they can be assigned to a team.` });
    }

    // Validate that all students share the same slot
    const mismatchedStudent = studentsData.find(s => s.slot_id !== targetSlotId);
    if (mismatchedStudent) {
      return res.status(400).json({ success: false, error: 'All team members must belong to the same slot.' });
    }

    // 2. Check if team exists for this college
    let teamId;
    const { data: teamData } = await supabaseAdmin
      .from('teams')
      .select('id, leader_id')
      .eq('college_id', collegeId)
      .eq('name', trimmedName)
      .maybeSingle();

    if (teamData) {
      teamId = teamData.id;

      // Verify that existing members of this team belong to the same slot
      const { data: existingMembers } = await supabaseAdmin
        .from('students')
        .select('slot_id, name')
        .eq('team_id', teamId);

      if (existingMembers && existingMembers.length > 0) {
        const differentSlotMember = existingMembers.find(m => m.slot_id !== targetSlotId);
        if (differentSlotMember) {
          return res.status(400).json({
            success: false,
            error: `Cannot add students to team "${trimmedName}" because member "${differentSlotMember.name}" belongs to a different slot.`
          });
        }
      }

      // If team exists but has no leader, assign one randomly from the incoming batch
      if (!teamData.leader_id && studentIds.length > 0) {
        const randomLeaderId = studentIds[Math.floor(Math.random() * studentIds.length)];
        await supabaseAdmin.from('teams').update({ leader_id: randomLeaderId }).eq('id', teamId);
      }
    } else {
      // Create new team, appointing a team leader randomly
      const randomLeaderId = studentIds[Math.floor(Math.random() * studentIds.length)];
      const { data: newTeam, error: tErr } = await supabaseAdmin
        .from('teams')
        .insert([{ name: trimmedName, college_id: collegeId, leader_id: randomLeaderId }])
        .select()
        .single();
      if (tErr) throw tErr;
      teamId = newTeam.id;
    }

    // 3. Update students
    const { error: updErr } = await supabaseAdmin
      .from('students')
      .update({ team_id: teamId })
      .in('id', studentIds);
    if (updErr) throw updErr;

    await cleanupEmptyTeams(collegeId);
    return res.json({ success: true });
  } catch (err: any) {
    console.error("Error in assign-team:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Add a single student
app.post('/api/students', async (req: Request, res: Response): Promise<any> => {
  const student = req.body;
  if (!student.name || !student.phone || !student.collegeId || !student.email) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  if (!student.email.includes('@')) {
    return res.status(400).json({ success: false, error: 'Invalid email address' });
  }

  if (!/^\d{10}$/.test(student.phone)) {
    return res.status(400).json({ success: false, error: 'Mobile number must be exactly 10 digits' });
  }

  try {
    // 1. Create auth user
    const tempPassword = Math.random().toString(36).substring(2, 10) + "Ab1!";
    let userId;
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: student.email,
      password: tempPassword,
      email_confirm: true,
    });

    if (authError) {
      if (authError.status === 422 || authError.message.includes('email_exists') || authError.code === 'email_exists') {
        console.log(`User ${student.email} already exists in Auth. Trying to fetch existing user...`);
        const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
        if (usersData && usersData.users) {
          const existingUser = usersData.users.find(u => u.email === student.email);
          if (existingUser) {
            userId = existingUser.id;
            // Optionally update password if needed: await supabaseAdmin.auth.admin.updateUserById(userId, { password: tempPassword });
          } else {
            return res.status(500).json({ success: false, error: 'Could not fetch users to resolve email_exists.' });
          }
        } else {
          return res.status(500).json({ success: false, error: 'Could not fetch users to resolve email_exists.' });
        }
      } else {
        console.error("Auth creation error for student:", authError);
        return res.status(500).json({ success: false, error: authError.message });
      }
    } else {
      userId = authData.user.id;
    }

    // 2. Insert student record first with team_id = null to resolve foreign key constraint chicken-and-egg problem
    const { data, error: dbError } = await supabaseAdmin
      .from('students')
      .insert([{
        id: userId,
        name: student.name,
        email: student.email,
        phone: student.phone,
        college_id: student.collegeId,
        slot_id: student.slotId,
        round1_status: student.round1Status,
        r1_score: student.r1Score,
        team_id: null
      }])
      .select();

    if (dbError) {
      console.error("POST /api/students DB error:", dbError);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return res.status(500).json({ success: false, error: dbError.message });
    }

    const dbStudent = data ? data[0] : null;
    if (!dbStudent) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return res.status(500).json({ success: false, error: "Failed to retrieve created student record." });
    }

    // 3. Create default individual team for the student (referencing the newly created student ID as leader)
    const teamName = `${student.name} (Individual)`;
    let teamId;
    const { data: existingTeam } = await supabaseAdmin
      .from('teams')
      .select('id')
      .eq('college_id', student.collegeId)
      .eq('name', teamName)
      .maybeSingle();

    if (existingTeam) {
      teamId = existingTeam.id;
    } else {
      const { data: newTeam, error: teamErr } = await supabaseAdmin
        .from('teams')
        .insert([{ name: teamName, college_id: student.collegeId, leader_id: userId }])
        .select()
        .single();

      if (teamErr || !newTeam) {
        console.error("Failed to create default individual team:", teamErr);
        await supabaseAdmin.from('students').delete().eq('id', userId);
        await supabaseAdmin.auth.admin.deleteUser(userId);
        return res.status(500).json({ success: false, error: teamErr?.message || "Failed to create individual team." });
      }
      teamId = newTeam.id;
    }

    // 4. Update the student record to link it to the newly created team ID
    const { error: updateErr } = await supabaseAdmin
      .from('students')
      .update({ team_id: teamId })
      .eq('id', userId);

    if (updateErr) {
      console.error("Failed to update student with team_id:", updateErr);
      await supabaseAdmin.from('teams').delete().eq('id', teamId);
      await supabaseAdmin.from('students').delete().eq('id', userId);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return res.status(500).json({ success: false, error: updateErr.message });
    }

    dbStudent.team_id = teamId;

    if (dbStudent) {
      try {
        await sendSlotSelectionEmail(dbStudent.id, dbStudent.email, dbStudent.name);
      } catch (mailErr) {
        console.error("Failed to send slot selection email:", mailErr);
      }
    }

    return res.json({ success: true, data: dbStudent });
  } catch (err: any) {
    console.error("Unexpected error in POST /api/students:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Add multiple students
app.post('/api/students/bulk', async (req: Request, res: Response): Promise<any> => {
  const { students } = req.body;
  if (!students || !Array.isArray(students)) {
    return res.status(400).json({ success: false, error: 'Invalid students array' });
  }

  try {
    const createdStudents = [];
    
    for (const s of students) {
      if (!s.email || !s.email.includes('@')) {
        return res.status(400).json({ success: false, error: `Invalid email address for ${s.name || 'student'}` });
      }
      if (!/^\d{10}$/.test(s.phone)) {
        return res.status(400).json({ success: false, error: `Mobile number must be exactly 10 digits for ${s.name || 'student'}` });
      }

      try {
        const tempPassword = Math.random().toString(36).substring(2, 10) + "Ab1!";
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: s.email,
          password: tempPassword,
          email_confirm: true,
        });

        let userId;
        if (authError) {
          if (authError.status === 422 || authError.message.includes('email_exists') || authError.code === 'email_exists') {
            console.log(`User ${s.email} already exists in Auth. Trying to fetch existing user...`);
            const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
            if (usersData && usersData.users) {
              const existingUser = usersData.users.find(u => u.email === s.email);
              if (existingUser) {
                userId = existingUser.id;
              } else {
                throw new Error(`Could not fetch users to resolve email_exists for ${s.email}.`);
              }
            } else {
              throw new Error(`Could not fetch users to resolve email_exists for ${s.email}.`);
            }
          } else {
            throw new Error(`Auth error for ${s.email}: ${authError.message}`);
          }
        } else {
          userId = authData.user.id;
        }

        createdStudents.push({
          id: userId,
          name: s.name,
          email: s.email,
          phone: s.phone,
          college_id: s.collegeId,
          slot_id: s.slotId,
          round1_status: s.round1Status,
          r1_score: s.r1Score,
        });
      } catch (err: any) {
        // Clean up previously created auth users in this batch
        for (const created of createdStudents) {
          await supabaseAdmin.auth.admin.deleteUser(created.id);
        }
        return res.status(500).json({ success: false, error: err.message });
      }
    }

    // 2. Insert student records with team_id = null first to satisfy foreign key constraints
    const studentsToInsert = createdStudents.map((s: any) => ({
      ...s,
      team_id: null
    }));

    const { data: insertedStudents, error: dbError } = await supabaseAdmin
      .from('students')
      .insert(studentsToInsert)
      .select();

    if (dbError) {
      console.error("POST /api/students/bulk DB error:", dbError);
      for (const created of createdStudents) {
        await supabaseAdmin.auth.admin.deleteUser(created.id);
      }
      return res.status(500).json({ success: false, error: dbError.message });
    }

    // 3. Bulk create default individual teams for each student in the batch
    const teamsToCreate = (insertedStudents || []).map((s: any) => ({
      name: `${s.name} (Individual)`,
      college_id: s.college_id,
      leader_id: s.id
    }));

    const { data: createdTeams, error: teamsError } = await supabaseAdmin
      .from('teams')
      .insert(teamsToCreate)
      .select();

    if (teamsError) {
      console.error("POST /api/students/bulk teams creation error:", teamsError);
      const studentIds = (insertedStudents || []).map((s: any) => s.id);
      await supabaseAdmin.from('students').delete().in('id', studentIds);
      for (const created of createdStudents) {
        await supabaseAdmin.auth.admin.deleteUser(created.id);
      }
      return res.status(500).json({ success: false, error: teamsError.message });
    }

    // 4. Update student records with their respective default team IDs
    for (const team of (createdTeams || [])) {
      await supabaseAdmin
        .from('students')
        .update({ team_id: team.id })
        .eq('id', team.leader_id);

      const match = (insertedStudents || []).find((s: any) => s.id === team.leader_id);
      if (match) {
        match.team_id = team.id;
      }
    }

    if (insertedStudents && Array.isArray(insertedStudents)) {
      for (const dbStudent of insertedStudents) {
        try {
          await sendSlotSelectionEmail(dbStudent.id, dbStudent.email, dbStudent.name);
        } catch (mailErr) {
          console.error(`Failed to send bulk slot email to ${dbStudent.email}:`, mailErr);
        }
      }
    }

    return res.json({ success: true, data: insertedStudents });
  } catch (err: any) {
    console.error("Unexpected error in POST /api/students/bulk:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/students/bulk-delete', async (req: Request, res: Response): Promise<any> => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, error: 'Missing or invalid student IDs array' });
  }

  try {
    const { error: dbError } = await supabaseAdmin
      .from('students')
      .delete()
      .in('id', ids);

    if (dbError) {
      console.error("POST /api/students/bulk-delete DB error:", dbError);
      return res.status(500).json({ success: false, error: dbError.message });
    }

    // Delete from Supabase Auth sequentially
    for (const id of ids) {
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
      if (authError) {
        console.error(`DELETE Auth error for ${id}:`, authError);
      }
    }

    return res.json({ success: true });
  } catch (err: any) {
    console.error("Unexpected error in POST /api/students/bulk-delete:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Delete a student
app.delete('/api/students/:id', async (req: Request, res: Response): Promise<any> => {
  const id = req.params.id as string;
  if (!id) {
    return res.status(400).json({ success: false, error: 'Missing student ID' });
  }

  try {
    const { error: dbError } = await supabaseAdmin
      .from('students')
      .delete()
      .eq('id', id);

    if (dbError) {
      console.error("DELETE /api/students DB error:", dbError);
      return res.status(500).json({ success: false, error: dbError.message });
    }

    // Delete from Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (authError) {
      console.error("DELETE /api/students Auth error:", authError);
    }

    return res.json({ success: true });
  } catch (err: any) {
    console.error("Unexpected error in DELETE /api/students:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Send team notification emails to all members in a slot
app.post('/api/teams/notify', async (req: Request, res: Response): Promise<any> => {
  const { slotId } = req.body;
  if (!slotId) {
    return res.status(400).json({ success: false, error: 'slotId is required' });
  }

  try {
    // Get the slot label
    const { data: slotData, error: slotError } = await supabaseAdmin
      .from('slots')
      .select('label')
      .eq('id', slotId)
      .single();

    if (slotError || !slotData) {
      return res.status(404).json({ success: false, error: 'Slot not found.' });
    }

    // Get all students in this slot
    const { data: slotStudents, error: studentsError } = await supabaseAdmin
      .from('students')
      .select('id, name, email, phone, teams:teams!students_team_id_fkey(id, name, leader_id)')
      .eq('slot_id', slotId);

    if (studentsError) {
      return res.status(500).json({ success: false, error: studentsError.message });
    }

    if (!slotStudents || slotStudents.length === 0) {
      return res.status(400).json({ success: false, error: 'No students in this slot.' });
    }

    // Group students by team name
    const groups: Record<string, typeof slotStudents> = {};
    slotStudents.forEach((s: any) => {
      if (s.teams && s.teams.name) {
        const teamName = s.teams.name;
        if (!groups[teamName]) groups[teamName] = [];
        groups[teamName].push(s);
      }
    });

    if (Object.keys(groups).length === 0) {
      return res.status(400).json({ success: false, error: 'No groups formed yet in this slot.' });
    }

    let sent = 0;
    let failed = 0;

    // Send email to each member with ONLY their group's details
    for (const [groupName, members] of Object.entries(groups)) {
      const teamsData: any = members[0]?.teams;
      const leaderId = Array.isArray(teamsData) ? teamsData[0]?.leader_id : teamsData?.leader_id;
      
      let leaderName = "To be assigned";
      if (leaderId) {
        const leader = members.find((m: any) => m.id === leaderId);
        if (leader) {
          leaderName = leader.name;
        } else {
          // Fallback: Fetch directly from Supabase if not in current slot members
          const { data: leaderData } = await supabaseAdmin
            .from('students')
            .select('name')
            .eq('id', leaderId)
            .maybeSingle();
          if (leaderData) {
            leaderName = leaderData.name;
          }
        }
      }

      const membersHtml = members.map((m: any) => {
        const isLeader = m.id === leaderId;
        return `<tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 14px; font-weight: ${isLeader ? 'bold' : 'normal'};">
            ${m.name} ${isLeader ? '<span style="color: #FF5A5F; font-size: 11px; margin-left: 6px; padding: 2px 6px; background: #FFF0F0; border-radius: 4px; border: 1px solid #FFE0E0;">(Leader)</span>' : ''}
          </td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 14px; color: #555;">${m.email}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 14px; color: #555;">${m.phone}</td>
        </tr>`;
      }).join('');

      for (const member of members) {
        try {
          const isYouLeader = member.id === leaderId;
          const leaderStatusHtml = isYouLeader
            ? `<div style="background: #FFF9F9; border: 1px solid #FFEAEA; border-radius: 8px; padding: 12px; margin-bottom: 20px; font-size: 14px; color: #D9393E;">
                ⭐ <strong>You are the designated Team Leader!</strong> You are responsible for submitting the video links for Round 2 and Round 3 in the student portal.
              </div>`
            : `<div style="background: #F9FBFC; border: 1px solid #EAF2F8; border-radius: 8px; padding: 12px; margin-bottom: 20px; font-size: 14px; color: #2E5A88;">
                👤 <strong>Team Leader:</strong> <strong>${leaderName}</strong> has been appointed as your Team Leader. Only they can submit video links for your team.
              </div>`;

          const mailOptions = {
            from: `"MarkUp Platform" <${process.env.SMTP_USER}>`,
            to: (member as any).email,
            subject: `MarkUp – You're in ${groupName}!`,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 24px; border: 1px solid #ddd; max-width: 600px; border-radius: 10px; background: #fff;">
                <h2 style="color: #FF5A5F; margin-bottom: 6px;">Your Group is Ready! 🎉</h2>
                <p style="color: #333; font-size: 15px; margin-bottom: 20px;">
                  Hello <strong>${(member as any).name}</strong>, you have been assigned to a group for the MarkUp competition.
                </p>

                ${leaderStatusHtml}

                <div style="background: #f8f8f8; border: 1px solid #eee; border-radius: 10px; padding: 16px; margin-bottom: 20px;">
                  <div style="display: flex; justify-content: space-between;">
                    <div>
                      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #888; font-weight: 700;">Your Group</div>
                      <div style="font-size: 22px; font-weight: bold; color: #1a1a2e; margin-top: 4px;">${groupName}</div>
                    </div>
                    <div style="text-align: right;">
                      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #888; font-weight: 700;">Slot</div>
                      <div style="font-size: 16px; font-weight: 600; color: #333; margin-top: 4px;">${slotData.label}</div>
                    </div>
                  </div>
                </div>

                <h3 style="color: #1a1a2e; font-size: 15px; margin-bottom: 10px;">Your Team Members (${members.length})</h3>
                <table style="width: 100%; border-collapse: collapse; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
                  <thead>
                    <tr style="background: #f4f4f4;">
                      <th style="padding: 8px 12px; text-align: left; font-size: 12px; color: #666; font-weight: 600;">Name</th>
                      <th style="padding: 8px 12px; text-align: left; font-size: 12px; color: #666; font-weight: 600;">Email</th>
                      <th style="padding: 8px 12px; text-align: left; font-size: 12px; color: #666; font-weight: 600;">Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${membersHtml}
                  </tbody>
                </table>

                <p style="font-size: 13px; color: #888; margin-top: 24px;">
                  Coordinate with your team members and be prepared for the competition. Good luck! 🚀
                </p>
                <p style="font-size: 11px; color: #aaa; margin-top: 16px;">
                  If you have any questions, contact your College Admin.
                </p>
              </div>
            `
          };
          await transporter.sendMail(mailOptions);
          sent++;
        } catch (mailErr) {
          console.error(`Failed to send group email to ${(member as any).email}:`, mailErr);
          failed++;
        }
      }
    }

    return res.json({ success: true, sent, failed, totalGroups: Object.keys(groups).length });
  } catch (err: any) {
    console.error("POST /api/groups/notify error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// =====================================
// COLLEGE SETTINGS
// =====================================
app.get('/api/college-settings/:college_id', async (req: Request, res: Response): Promise<any> => {
  const { college_id } = req.params;
  try {
    const { data, error } = await supabaseAdmin
      .from('college_settings')
      .select('*')
      .eq('college_id', college_id)
      .maybeSingle();

    if (error) {
      console.error("GET /api/college-settings error:", error);
      return res.status(500).json({ success: false, error: error.message });
    }

    // Default to not-started if no settings exist yet
    if (!data) {
      return res.json({
        success: true,
        data: {
          round1_status: 'not-started',
          round2_status: 'not-started',
          round3_status: 'not-started'
        }
      });
    }

    return res.json({ success: true, data });
  } catch (err: any) {
    console.error("Unexpected error in GET /api/college-settings:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/college-settings/:college_id', async (req: Request, res: Response): Promise<any> => {
  const { college_id } = req.params;
  const { round1_status, round2_status, round3_status } = req.body;
  
  try {
    const { error } = await supabaseAdmin
      .from('college_settings')
      .upsert({
        college_id,
        round1_status,
        round2_status,
        round3_status,
        updated_at: new Date().toISOString()
      }, { onConflict: 'college_id' });

    if (error) {
      console.error("POST /api/college-settings error:", error);
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true });
  } catch (err: any) {
    console.error("Unexpected error in POST /api/college-settings:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// =====================================
// QUESTIONS BANK
// =====================================
app.get('/api/questions', async (req: Request, res: Response): Promise<any> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('Question_bank')
      .select('*');

    if (error) {
      console.error("GET /api/questions error:", error);
      return res.status(500).json({ success: false, error: error.message });
    }

    // Shuffle and select up to 40 questions
    const shuffled = (data || []).sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 40);

    return res.json({ success: true, data: selected });
  } catch (err: any) {
    console.error("Unexpected error in GET /api/questions:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// =====================================
// SCORE SUBMISSION
// =====================================
app.post('/api/students/:id/submit-score', async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const { score, round, total_questions } = req.body;
  
  if (score === undefined || !round) {
    return res.status(400).json({ success: false, error: 'Missing fields' });
  }

  try {
    // 0. Check if a score has already been submitted for this student and round
    const { data: existingScore, error: checkError } = await supabaseAdmin
      .from('scores')
      .select('id')
      .eq('student_id', id)
      .eq('round', round)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking existing score:", checkError);
      return res.status(500).json({ success: false, error: checkError.message });
    }

    if (existingScore) {
      return res.status(400).json({ success: false, error: 'You have already submitted a score for this round.' });
    }

    // 1. Insert into scores table
    const { error: scoreError } = await supabaseAdmin
      .from('scores')
      .insert([{
        student_id: id,
        round,
        score,
        total_questions: total_questions || 30,
        submitted_at: new Date().toISOString()
      }]);

    if (scoreError) {
      console.error("POST /api/students/:id/submit-score error:", scoreError);
      return res.status(500).json({ success: false, error: scoreError.message });
    }

    // 2. Update students table directly
    const { error: studentError } = await supabaseAdmin
      .from('students')
      .update({
        r1_score: score,
        round1_status: 'submitted'
      })
      .eq('id', id);

    if (studentError) {
      console.error("Update students r1_score error:", studentError);
    }

    return res.json({ success: true });
  } catch (err: any) {
    console.error("Unexpected error in POST /api/students/:id/submit-score:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// =====================================
// ROUND 2 / 3 SUBMISSIONS
// =====================================
app.post('/api/students/:id/submit-round', async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const { roundKey, link, note } = req.body;

  if (!roundKey || !['round2', 'round3'].includes(roundKey) || link === undefined) {
    return res.status(400).json({ success: false, error: 'Missing or invalid fields' });
  }

  try {
    // 1. Fetch the student's team_id and check if they are the leader
    const { data: student, error: fetchErr } = await supabaseAdmin
      .from('students')
      .select('college_id, team_id, teams:teams!students_team_id_fkey(leader_id)')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr || !student) {
      return res.status(404).json({ success: false, error: 'Student profile not found.' });
    }

    const { college_id, team_id, teams } = student as any;

    if (!team_id) {
      return res.status(400).json({ success: false, error: 'You are not assigned to any team. Contact your College Admin.' });
    }

    if (teams && teams.leader_id !== id) {
      return res.status(403).json({ success: false, error: 'Only the Team Leader is authorized to submit for your team.' });
    }

    // Check round status in college settings
    const { data: settings, error: settingsErr } = await supabaseAdmin
      .from('college_settings')
      .select('*')
      .eq('college_id', college_id)
      .maybeSingle();

    if (settingsErr) {
      console.error("Fetch college settings error:", settingsErr);
      return res.status(500).json({ success: false, error: 'Could not verify round status.' });
    }

    const roundStatus = settings
      ? (roundKey === 'round2' ? settings.round2_status : settings.round3_status)
      : 'not-started';

    if (roundStatus !== 'live') {
      const roundName = roundKey === 'round2' ? 'Round 2' : 'Round 3';
      if (roundStatus === 'not-started') {
        return res.status(403).json({ success: false, error: `${roundName} submissions have not been opened yet.` });
      } else if (roundStatus === 'closed') {
        return res.status(403).json({ success: false, error: `${roundName} submissions are now closed.` });
      } else {
        return res.status(403).json({ success: false, error: `${roundName} submissions are currently unavailable.` });
      }
    }

    // Check if all team members have completed Round 1
    const { data: teamMembers, error: membersErr } = await supabaseAdmin
      .from('students')
      .select('id, name, round1_status')
      .eq('team_id', team_id);

    if (membersErr || !teamMembers || teamMembers.length === 0) {
      console.error("Fetch team members error:", membersErr);
      return res.status(500).json({ success: false, error: 'Could not verify team qualification.' });
    }

    const unqualifiedMembers = teamMembers.filter(m => m.round1_status !== 'submitted');
    if (unqualifiedMembers.length > 0) {
      const names = unqualifiedMembers.map(m => `"${m.name}"`).join(', ');
      return res.status(403).json({
        success: false,
        error: `Your team cannot submit because member(s) ${names} have not completed Round 1.`
      });
    }

    // 2. Prepare update payload
    const updateData: any = {};
    if (roundKey === 'round2') {
      updateData.round2_status = 'pending';
      updateData.r2_link = link;
      updateData.r2_note = note || '';
    } else {
      updateData.round3_status = 'pending';
      updateData.r3_link = link;
      updateData.r3_note = note || '';
    }

    // 3. Update all students in the same team to keep team submission in sync
    const { error } = await supabaseAdmin
      .from('students')
      .update(updateData)
      .eq('team_id', team_id);

    if (error) {
      console.error("POST /api/students/:id/submit-round error:", error);
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true });
  } catch (err: any) {
    console.error("Unexpected error in POST /api/students/:id/submit-round:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// =====================================
// JURY REVIEWS & SCORING
// =====================================
app.post('/api/students/:id/jury-review', async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const { roundKey, status, score } = req.body;

  if (!roundKey || !['round2', 'round3'].includes(roundKey)) {
    return res.status(400).json({ success: false, error: 'Missing or invalid roundKey' });
  }

  try {
    // 1. Fetch student's team_id
    const { data: student, error: fetchErr } = await supabaseAdmin
      .from('students')
      .select('team_id')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr || !student) {
      return res.status(404).json({ success: false, error: 'Student profile not found.' });
    }

    const { team_id } = student;

    // 2. Prepare update payload
    const updateData: any = {};
    if (roundKey === 'round2') {
      if (status) updateData.round2_status = status;
      if (score !== undefined) updateData.r2_score = score;
    } else {
      if (status) updateData.round3_status = status;
      if (score !== undefined) updateData.r3_score = score;
    }

    // 3. Update the whole team if the student is assigned to one, otherwise update individual
    let query = supabaseAdmin.from('students').update(updateData);
    if (team_id) {
      query = query.eq('team_id', team_id);
    } else {
      query = query.eq('id', id);
    }

    const { error } = await query;

    if (error) {
      console.error("POST /api/students/:id/jury-review error:", error);
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true });
  } catch (err: any) {
    console.error("Unexpected error in POST /api/students/:id/jury-review:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
