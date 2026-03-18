//Libraries
require('dotenv').config(); 
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo').default;
const puppeteer = require('puppeteer');
const fs = require('fs');
const cors = require('cors');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const Anthropic = require('@anthropic-ai/sdk');

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    if (reason && reason.code !== 'ECONNREFUSED' && reason.syscall !== 'querySrv') {
        console.error('Unhandled Rejection:', reason);
    }
}); 

const app = express();

// DataBase connection
const dbURI = "mongodb+srv://new-user31:pbOLxEJKudngaIZY@cluster0.ylxecao.mongodb.net/?appName=Cluster0";

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

        const apiResponse = await fetch("https://text.pollinations.ai/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                messages: [
                    {
                        role: "system",
                        content: "Ти си експерт по подбор на персонал. Генерирай точно 5 въпроса за интервю за работа. Въпросите трябва да са подходящи за тийнейджъри или хора без опит. Напиши САМО списък с 5 въпроса на български език, номерирани от 1 до 5. Не добавяй въведения, поздрави или обяснения."
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

        try {
            const verificationUrl = `${req.protocol}://${req.get('host')}/verify?token=${token}`;
            
            const mailOptions = {
                from: `"TeenCareer" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'Потвърждение на регистрация в TeenCareer',
                html: `<h3>Добре дошли в TeenCareer!</h3>
                       <p>Моля, потвърдете имейла си, като кликнете на линка по-долу:</p>
                       <a href="${verificationUrl}" style="background-color: #09989e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Потвърди моя профил</a>`
            };

            const info = await transporter.sendMail(mailOptions);
            console.log("Verification email sent:", info.response);
            res.send("<script>alert('Регистрацията е успешна! Моля, проверете имейла си (и папката за спам) за линк за потвърждение.'); window.location='/';</script>"); 
        } catch (emailError) {
            console.error("CRITICAL: Error sending verification email:", emailError);
            res.status(500).send("<script>alert('Регистрацията е успешна, но имаше проблем с изпращането на имейла за потвърждение. Моля, свържете се с администратор.'); window.location='/';</script>");
        }
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

    try {
        res.set({
            'Content-Type': 'text/html; charset=utf-8',
            'Content-Disposition': `attachment; filename="CV_${fullName || 'user'}.html"`
        });
        res.send(htmlContent);

    } catch (error) {
        console.error("PDF Generation Error:", error);
        res.status(500).send("Error generating file");
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

    try {
        res.set({
            'Content-Type': 'text/html; charset=utf-8',
            'Content-Disposition': `attachment; filename="Portfolio_${full_name || 'user'}.html"`
        });
        res.send(htmlContent);
    } catch (error) {
        console.error("Portfolio PDF Error:", error);
        res.status(500).send("Error generating Portfolio");
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
        const cvText = pdfData.text?.trim();

        if (!cvText || cvText.length < 50) {
            return res.status(400).json({ error: 'PDF-ът изглежда празен или не може да се прочете.' });
        }

        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

        const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
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
        });

        res.json({ recommendation: message.content[0].text });

    } catch (error) {
        console.error('CV Analysis Error:', error.message);
        res.status(500).json({ error: 'Грешка при анализа. Опитай отново.' });
    }
});
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
let isConnected = false;

const connectDB = () => {
  mongoose.connect(dbURI, {
    retryWrites: true,
    w: 'majority'
  })
    .then(() => {
      console.log('Connected to MongoDB Atlas!');
      isConnected = true;
    })
    .catch((err) => {
      if (!isConnected) {
        console.error('Error connecting to MongoDB:', err.message);
        console.log('Server is running but database connection failed. Retrying in 10 seconds...');
      }
    });
};

connectDB();
setInterval(() => {
  if (!isConnected && mongoose.connection.readyState === 0) {
    connectDB();
  }
}, 10000);

  