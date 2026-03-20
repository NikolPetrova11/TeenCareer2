//Libraries
require('dotenv').config(); 
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo').default;
const fs = require('fs');
const cors = require('cors');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { HfInference } = require('@huggingface/inference');
const puppeteer = require('puppeteer');

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    if (reason && reason.code !== 'ECONNREFUSED' && reason.syscall !== 'querySrv') {
        console.error('Unhandled Rejection:', reason);
    }
}); 

const app = express();

// DataBase connection
// Development mode: Use mock database if real connection fails
const dbURI = process.env.MONGODB_URI || "mongodb://localhost:27017/teencareer2";
let isConnected = false;
let useMockDB = false;

// Sessions
const sessionStore = new MongoStore({ mongoUrl: dbURI }).on('error', (err) => {
    console.warn('MongoStore connection error:', err.message);
});

app.use(session({
    secret: process.env.SESSION_SECRET || 'your_secret_key',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname));

// Nodemailer configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verify Nodemailer connection on startup
transporter.verify((error, success) => {
    if (error) {
        console.error("Nodemailer configuration error:", error);
    } else {
        console.log("Server is ready to send emails via Nodemailer");
    }
});

// Chatbot API 
app.post('/chat', async (req, res) => {
    try {
        const { message } = req.body; 
        if (!message) {
            return res.status(400).json({ error: "Please enter a message." });
        }

        console.log("Server received message:", message);

        let fetchImpl = global.fetch;
        if (!fetchImpl) {
            // Fallback for Node versions < 18 or if global fetch is missing
            fetchImpl = (await import('node-fetch')).default;
        }

        const apiResponse = await fetchImpl("https://text.pollinations.ai/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                messages: [
                    {
                        role: "system",
                        content: "Ти си експерт по подбор на персонал. Генерирай 5 въпроса, като първо задаваш един, изчакваш отговор на потребителя и след това задаваш следващия. Въпросите трябва да са подходящи за хора, които търсят първа работа или стаж, и да помагат за разкриване на техните умения, интереси и цели. Въпросите трябва да са на български език и да са формулирани по начин, който насърчава младите хора да споделят повече за себе си. След като потребителят отговори на всички въпроси, дай кратка препоръка за подходяща професия или област на развитие, базирана на отговорите им. Идеята е да проведеш едно интервю от което потребителя да получи обратна връзка."
                    },
                    { role: "user", content: message }
                ],
                model: "openai",
                seed: Math.floor(Math.random() * 100000)
            })
        });

        if (!apiResponse.ok) {
            console.error("API error status:", apiResponse.status);
            return res.status(500).json({ error: "Chatbot API returned an error." });
        }

        const text = await apiResponse.text();

        res.json({ reply: text }); 

    } catch (error) {
        console.error("Chatbot API Error:", error.message || error);
        res.status(500).json({ error: "Error communicating with chatbot. Please try again later." });
    }
});

// User info
const userSchema = new mongoose.Schema({
  username: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  dob: Date,
  phone: String,
  isVerified: { type: Boolean, default: false },
  verificationToken: String,
  cvs: [{ data: mongoose.Schema.Types.Mixed, createdAt: { type: Date, default: Date.now } }],
  portfolios: [{ data: mongoose.Schema.Types.Mixed, createdAt: { type: Date, default: Date.now } }],
  favorites: [{ 
    title: String,
    company: String,
    city: String,
    link: String,
    experience: Number,
    addedAt: { type: Date, default: Date.now }
  }],
  chatHistory: [{
    title: { type: String, default: 'Нов чат' },
    updatedAt: { type: Date, default: Date.now },
    messages: [{ sender: String, text: String, createdAt: { type: Date, default: Date.now } }]
  }]
});
const User = mongoose.model('User', userSchema);

// routes

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const redirectIfLoggedOut = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/');
    }
    next();
};

app.get('/profile', redirectIfLoggedOut, (req, res) => {
    res.sendFile(path.join(__dirname, 'profile.html'));
});

app.get('/api/user-data', async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Не сте логнати" });
    
    try {
        const user = await User.findById(req.session.userId).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: "Грешка" });
    }
});

app.get('/api/chat-history', async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Не сте логнати" });
    try {
        const user = await User.findById(req.session.userId).select('chatHistory');
        const history = (user?.chatHistory || []).map((chat) => ({
            id: chat._id,
            title: chat.title,
            updatedAt: chat.updatedAt,
            lastMessage: chat.messages?.[chat.messages.length - 1]?.text || ''
        }));
        res.json(history);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Грешка при зареждане на историята" });
    }
});

app.post('/api/chat-history', async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Не сте логнати" });
    try {
        const newChat = { title: req.body.title || 'Нов чат', messages: req.body.messages || [], updatedAt: new Date() };
        const user = await User.findById(req.session.userId);
        if (!user) return res.status(404).json({ error: 'Потребител не е намерен' });
        user.chatHistory.push(newChat);
        await user.save();
        const added = user.chatHistory[user.chatHistory.length - 1];
        res.json({ id: added._id, title: added.title, updatedAt: added.updatedAt, messages: added.messages });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Грешка при записване на чат" });
    }
});

app.put('/api/chat-history/:chatId', async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Не сте логнати" });
    try {
        const { chatId } = req.params;
        const { message } = req.body;
        const user = await User.findById(req.session.userId);
        if (!user) return res.status(404).json({ error: 'Потребител не е намерен' });

        const chat = user.chatHistory.id(chatId);
        if (!chat) return res.status(404).json({ error: 'Чат не е намерен' });

        if (message) {
            chat.messages.push({ sender: message.sender, text: message.text, createdAt: new Date() });
        }
        chat.updatedAt = new Date();
        await user.save();
        res.json({ success: true, chatId: chat._id, updatedAt: chat.updatedAt });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Грешка при обновяване на чат" });
    }
});

app.get('/api/chat-history/:chatId', async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Не сте логнати" });
    try {
        const { chatId } = req.params;
        const user = await User.findById(req.session.userId).select('chatHistory');
        if (!user) return res.status(404).json({ error: 'Потребител не е намерен' });
        const chat = user.chatHistory.id(chatId);
        if (!chat) return res.status(404).json({ error: 'Чат не е намерен' });
        res.json({ id: chat._id, title: chat.title, messages: chat.messages, updatedAt: chat.updatedAt });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Грешка при зареждане на чат" });
    }
});

// save CV for logged-in users
app.post('/save-cv', async (req,res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Не сте логнати" });
    const cvData = req.body;
    try {
        await User.findByIdAndUpdate(req.session.userId, {$push: { cvs: { data: cvData } }});
        res.json({ success: true });
    } catch(err) {
        console.error("Error saving CV:", err);
        res.status(500).json({ error: "Грешка при съхранение" });
    }
});

app.post('/save-portfolio', async (req,res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Не сте логнати" });
    const portData = req.body;
    try {
        await User.findByIdAndUpdate(req.session.userId, {$push: { portfolios: { data: portData } }});
        res.json({ success: true });
    } catch(err) {
        console.error("Error saving portfolio:", err);
        res.status(500).json({ error: "Грешка при съхранение" });
    }
});

app.get('/api/user-cvs', async (req,res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Не сте логнати" });
    const user = await User.findById(req.session.userId).select('cvs');
    res.json(user.cvs || []);
});

app.get('/api/user-portfolios', async (req,res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Не сте логнати" });
    const user = await User.findById(req.session.userId).select('portfolios');
    res.json(user.portfolios || []);
});

// Login
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("Опит за вход с:", email); 

        const user = await User.findOne({ email });
        if (!user) {
            console.log("Потребителят не е намерен");
            return res.send("<script>alert('Грешен имейл'); window.location='/';</script>");
        }

        if (!user.isVerified) {
            return res.send("<script>alert('Моля, потвърдете имейла си, преди да влезете! Проверете пощата си.'); window.location='/';</script>");
        }

        const isMatch = await bcrypt.compare(password, user.password);
        console.log("Паролата съвпада:", isMatch);

        if (isMatch) {
            req.session.userId = user._id; 
            console.log("Сесията е създадена за ID:", req.session.userId);
            
            req.session.save((err) => {
                if(err) console.error("Грешка при сейв на сесия:", err);
                res.redirect('/profile');
            });
        } else {
            res.send("<script>alert('Грешна парола'); window.location='/';</script>");
        }
    } catch (error) {
        console.error("Грешка в сървъра:", error);
        res.status(500).send("Грешка при влизане.");
    }
});

// Register
app.post('/register', async (req, res) => {
    try {
        const { email, password, username } = req.body; 

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.send("<script>alert('Този имейл вече е регистриран.'); window.location='/';</script>");

        const hashedPassword = await bcrypt.hash(password, 10);
        const token = crypto.randomBytes(32).toString('hex');

        const newUser = new User({ 
            email, 
            password: hashedPassword,
            username: username || email.split('@')[0],
            isVerified: false,
            verificationToken: token
        });
        
        await newUser.save();

        // Send verification email in background (non-blocking)
        const verificationUrl = `${req.protocol}://${req.get('host')}/verify?token=${token}`;
        
        const mailOptions = {
            from: `"TeenCareer" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Потвърждение на регистрация в TeenCareer',
            html: `<h3>Добре дошли в TeenCareer!</h3>
                   <p>Моля, потвърдете имейла си, като кликнете на линка по-долу:</p>
                   <a href="${verificationUrl}" style="background-color: #09989e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Потвърди моя профил</a>`
        };

        // Send email asynchronously without waiting
        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.error("Error sending verification email:", err);
            } else {
                console.log("Verification email sent:", info.response);
            }
        });

        // Return response immediately
        res.send("<script>alert('Регистрацията е успешна! Проверете имейла си (и папката за спам) за линк за потвърждение.'); window.location='/';</script>");
    } catch (error) {
        console.error(error);
        res.status(500).send("Грешка при регистрацията.");
    }
});

// Email Route
app.get('/verify', async (req, res) => {
    const { token } = req.query;
    if (!token) return res.send("<script>alert('Невалиден линк.'); window.location='/';</script>");

    try {
        const user = await User.findOne({ verificationToken: token });
        if (!user) return res.send("<script>alert('Невалиден или изтекъл линк за потвърждение.'); window.location='/';</script>");

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        req.session.userId = user._id; 
        res.send("<script>alert('Имейлът е потвърден успешно!'); window.location='/profile';</script>");
    } catch (error) {
        console.error(error);
        res.send("<script>alert('Грешка при потвърждение.'); window.location='/';</script>");
    }
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Profile API
app.post('/api/update-profile', async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Не сте логнати" });
    
    try {
        const { username, dob, phone, email } = req.body;
        await User.findByIdAndUpdate(req.session.userId, { username, dob, phone, email });
        res.json({ success: true });
    } catch (error) {
        console.error("Update error:", error);
        res.status(500).json({ error: "Грешка при обновяване" });
    }
});

// Edit Profile Page
app.get('/edit-profile', redirectIfLoggedOut, (req, res) => {
    res.sendFile(path.join(__dirname, 'edit-profile.html'));
});

// Generate PDF Route
app.post('/generate-pdf', async (req, res) => {
    console.log("Generating CV PDF...");
    const { fullName, email, phone, city, education, experience, skills, languages, summary, date, text, template } = req.body;

    let css = '';
    try {
        css = fs.readFileSync(path.join(__dirname, 'CV_maker.css'), 'utf8');
    } catch (e) {
        console.error("Could not read CV_maker.css", e);
    }

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <link href="https://fonts.googleapis.com/css2?family=Comforter+Brush&family=Montserrat:ital,wght@0,600;1,600&display=swap" rel="stylesheet">
        <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap" rel="stylesheet">
        <style>
            ${css}
            body { background: white; margin: 0; padding: 0; }
            .cv-paper {
                box-shadow: none;
                margin: 0;
                max-width: none;
                width: 100%;
                min-height: 100vh;
                padding: 40px;
            }
            /* Ensure background colors print correctly */
            * { -webkit-print-color-adjust: exact; }
        </style>
    </head>
    <body>
        <div class="cv-preview-side" style="padding:0; background:white; display:block;">
            <div class="cv-paper ${template || 'default'}">
                <div class="preview-header">
                    <div class="header-info">
                        <div class="preview-name">${fullName || ''}</div>
                        <div class="preview-contact">
                            ${email ? `<span>${email}</span> | ` : ''}
                            ${phone ? `<span>${phone}</span> | ` : ''}
                            ${city ? `<span>${city}</span> | ` : ''}
                            ${date ? `<span>${date}</span>` : ''}
                        </div>
                    </div>
                </div>
                
                <div class="main-content-card">
                    ${summary ? `
                    <div class="preview-section">
                        <div class="preview-section-title">За мен</div>
                        <div class="preview-content">${summary.replace(/\n/g, '<br>')}</div>
                    </div>` : ''}

                    ${education ? `
                    <div class="preview-section">
                        <div class="preview-section-title">Образование</div>
                        <div class="preview-content">${education.replace(/\n/g, '<br>')}</div>
                    </div>` : ''}

                    ${experience ? `
                    <div class="preview-section">
                        <div class="preview-section-title">Опит</div>
                        <div class="preview-content">${experience.replace(/\n/g, '<br>')}</div>
                    </div>` : ''}

                    ${text ? `
                    <div class="preview-section">
                        <div class="preview-section-title">Повече за моя опит</div>
                        <div class="preview-content">${text.replace(/\n/g, '<br>')}</div>
                    </div>` : ''}

                    ${skills ? `
                    <div class="preview-section">
                        <div class="preview-section-title">Умения</div>
                        <div class="preview-content">${skills.replace(/\n/g, '<br>')}</div>
                    </div>` : ''}

                    ${languages ? `
                    <div class="preview-section">
                        <div class="preview-section-title">Езици</div>
                        <div class="preview-content">${languages}</div>
                    </div>` : ''}
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

    let browser;
    try {
        console.log("Generating PDF - Full Name:", fullName);
        
        if (!fullName) {
            console.warn("Warning: No fullName provided");
        }

        // Launch browser with proper options for production environments (Render compatible)
        const launchOptions = {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
        };
        
        // On Render, use system-installed Chromium
        if (process.env.RENDER === 'true') {
            launchOptions.executablePath = '/usr/bin/chromium-browser';
        }
        
        try {
            browser = await puppeteer.launch(launchOptions);
        } catch (launchErr) {
            console.error("Standard launch failed, trying alternative paths...", launchErr.message);
            // Fallback: try other common Chromium paths
            const chromiumPaths = [
                '/usr/bin/chromium',
                '/usr/bin/google-chrome',
                '/snap/bin/chromium'
            ];
            for (const path of chromiumPaths) {
                try {
                    launchOptions.executablePath = path;
                    browser = await puppeteer.launch(launchOptions);
                    console.log("Successfully launched with:", path);
                    break;
                } catch (err) {
                    continue;
                }
            }
            if (!browser) throw launchErr; // Re-throw original error if all fail
        }

        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        // Generate PDF buffer
        const pdfBuffer = await page.pdf({
            format: 'A4',
            margin: { top: 0, bottom: 0, left: 0, right: 0 },
            printBackground: true
        });

        await browser.close();

        // Send PDF to client
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="CV_${fullName || 'user'}.pdf"`
        });
        res.send(pdfBuffer);
        console.log("CV PDF generated and sent successfully");

    } catch (error) {
        if (browser) {
            await browser.close().catch(() => {});
        }
        console.error("PDF Generation Error Details:", {
            message: error.message,
            stack: error.stack,
            fullName: fullName
        });
        res.status(500).json({ 
            error: "Error generating PDF",
            details: error.message 
        });
    }
});

// Generate Portfolio PDF Route
app.post('/generate-portfolio', async (req, res) => {
    console.log("Generating Portfolio PDF...");
    const { full_name, email, phone, education, experience } = req.body;

    let css = '';
    try {
        css = fs.readFileSync(path.join(__dirname, 'CV_maker.css'), 'utf8');
    } catch (e) {
        console.error("Could not read CV_maker.css", e);
    }
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <link href="https://fonts.googleapis.com/css2?family=Comforter+Brush&family=Montserrat:ital,wght@0,600;1,600&display=swap" rel="stylesheet">
        <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap" rel="stylesheet">
        <style>
            ${css}
            body { background: white; margin: 0; padding: 0; }
            .cv-paper {
                box-shadow: none;
                margin: 0;
                max-width: none;
                width: 100%;
                min-height: 100vh;
                padding: 40px;
            }
            /* Ensure background colors print correctly */
            * { -webkit-print-color-adjust: exact; }
            
            /* Portfolio specific overrides reusing CV classes */
            .preview-header { text-align: center; border-bottom: 2px solid #09989e; display: block; }
            .preview-name { color: #8274A1; font-size: 36px; text-align: center; }
            .preview-contact { justify-content: center; margin-top: 10px; }
        </style>
    </head>
    <body>
        <div class="cv-preview-side" style="padding:0; background:white; display:block;">
            <div class="cv-paper default landscape">
                <div class="preview-header">
                    <div class="preview-name">${full_name || 'Portfolio'}</div>
                    <div class="preview-contact">
                        ${email ? `<span>${email}</span>` : ''}
                        ${phone ? ` | <span>${phone}</span>` : ''}
                    </div>
                </div>

                <div class="main-content-card">
                    ${education ? `
                    <div class="preview-section">
                        <div class="preview-section-title">Образование</div>
                        <div class="preview-content">${education.replace(/\n/g, '<br>')}</div>
                    </div>` : ''}

                    ${experience ? `
                    <div class="preview-section">
                        <div class="preview-section-title">Професионален Опит & Проекти</div>
                        <div class="preview-content">${experience.replace(/\n/g, '<br>')}</div>
                    </div>` : ''}
                    
                    <div style="margin-top: 50px; text-align: center; font-size: 12px; color: #aaa;">
                        Създадено с TeenCareer Portfolio Maker
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

    let browser;
    try {
        console.log("Generating Portfolio PDF - Full Name:", full_name);
        
        // Launch browser with proper options for production environments (Render compatible)
        const launchOptions = {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
        };
        
        // On Render, use system-installed Chromium
        if (process.env.RENDER === 'true') {
            launchOptions.executablePath = '/usr/bin/chromium-browser';
        }
        
        try {
            browser = await puppeteer.launch(launchOptions);
        } catch (launchErr) {
            console.error("Standard launch failed, trying alternative paths...", launchErr.message);
            // Fallback: try other common Chromium paths
            const chromiumPaths = [
                '/usr/bin/chromium',
                '/usr/bin/google-chrome',
                '/snap/bin/chromium'
            ];
            for (const path of chromiumPaths) {
                try {
                    launchOptions.executablePath = path;
                    browser = await puppeteer.launch(launchOptions);
                    console.log("Successfully launched with:", path);
                    break;
                } catch (err) {
                    continue;
                }
            }
            if (!browser) throw launchErr; // Re-throw original error if all fail
        }

        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        // Generate PDF buffer
        const pdfBuffer = await page.pdf({
            format: 'A4',
            margin: { top: 0, bottom: 0, left: 0, right: 0 },
            printBackground: true
        });

        await browser.close();

        // Send PDF to client
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="Portfolio_${full_name || 'user'}.pdf"`
        });
        res.send(pdfBuffer);
        console.log("Portfolio PDF generated and sent successfully");

    } catch (error) {
        if (browser) {
            await browser.close().catch(() => {});
        }
        console.error("Portfolio PDF Error:", error);
        res.status(500).json({ 
            error: "Error generating portfolio",
            details: error.message 
        });
    }
});
// CV Upload & Career Analysis
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

app.post('/api/analyze-cv', upload.single('cv'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Моля качете PDF файл.' });
        }

        // Извличане на текст от PDF
        const pdfData = await pdfParse(req.file.buffer);
        let cvText = pdfData.text?.trim();

        if (!cvText || cvText.length < 50) {
            return res.status(400).json({ error: 'PDF-ът изглежда празен или не може да се прочете.' });
        }

        // Изрязване на текста, ако е твърде дълъг (над 6000 символа), за да не гърми API-то
        if (cvText.length > 6000) {
            cvText = cvText.substring(0, 6000) + "...";
        }

        if (!process.env.HF_API_KEY_1) {
            console.error("Missing HF_API_KEY_1");
            return res.status(500).json({ error: 'Липсва API ключ за Hugging Face в .env файла.' });
        }

        console.log("Analyzing CV with Hugging Face (Zephyr)...");
        const hf = new HfInference(process.env.HF_API_KEY_1);

        const response = await hf.chatCompletion({
            model: "meta-llama/Llama-3.1-8B-Instruct",
            max_tokens: 1024,
            messages: [{
                role: 'user',
                content: `Ти си кариерен консултант за тийнейджъри и млади хора.
Анализирай следното CV и препоръчай точно 3 подходящи професии.

За всяка професия напиши:
- Името на професията
- 2-3 изречения защо е подходяща за този човек, базирано на уменията и опита в CV-то
- 1 практичен съвет как да започне в тази посока

Отговори само на български език. Бъди позитивен и мотивиращ.

CV:
${cvText}`
            }]
        }, { waitForModel: true });

        res.json({ recommendation: response.choices[0].message.content });

    } catch (error) {
        console.error('CV Analysis Error:', JSON.stringify(error, null, 2));
        res.status(500).json({ error: 'Грешка при анализа. Опитай отново.' });
    }
});

// Favorites Routes
// Add job to favorites
app.post('/add-favorite', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not logged in' });
    }

    const { title, company, city, link, experience } = req.body;

    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if job already exists in favorites
        const exists = user.favorites.some(fav => fav.title === title && fav.company === company);
        if (exists) {
            return res.status(400).json({ error: 'Job already in favorites' });
        }

        user.favorites.push({ title, company, city, link, experience });
        await user.save();

        res.json({ success: true, message: 'Job added to favorites' });
    } catch (error) {
        console.error('Add favorite error:', error);
        res.status(500).json({ error: 'Error adding to favorites' });
    }
});

// Remove job from favorites
app.post('/remove-favorite', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not logged in' });
    }

    const { title, company } = req.body;

    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.favorites = user.favorites.filter(fav => !(fav.title === title && fav.company === company));
        await user.save();

        res.json({ success: true, message: 'Job removed from favorites' });
    } catch (error) {
        console.error('Remove favorite error:', error);
        res.status(500).json({ error: 'Error removing from favorites' });
    }
});

// Get user's favorite jobs
app.get('/get-favorites', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Not logged in' });
    }

    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ favorites: user.favorites || [] });
    } catch (error) {
        console.error('Get favorites error:', error);
        res.status(500).json({ error: 'Error fetching favorites' });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

const connectDB = () => {
  mongoose.connect(dbURI, {
    retryWrites: true,
    w: 'majority',
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000
  })
    .then(() => {
      console.log('✓ Connected to MongoDB!');
      isConnected = true;
      useMockDB = false;
    })
    .catch((err) => {
      if (!isConnected && !useMockDB) {
        console.warn('⚠ MongoDB connection failed, running in MOCK MODE (testing only)');
        console.warn('Database operations are simulated. Data will not persist.');
        useMockDB = true;
        isConnected = true; // Mark as ready even in mock mode
      }
    });
};

connectDB();
setInterval(() => {
  if (!isConnected && mongoose.connection.readyState === 0) {
    console.log('Attempting to reconnect to MongoDB...');
    connectDB();
  }
}, 10000);

  