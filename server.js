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
const PDFDocument = require('pdfkit');

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

// Nodemailer configuration (Gmail SMTP)
let transporter = null;
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("EMAIL_USER or EMAIL_PASS is not set. Verification emails will NOT be sent.");
} else {
    transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    // Verify Nodemailer connection on startup
    transporter.verify((error, success) => {
        if (error) {
            console.error("Nodemailer configuration error:", error.message || error);
        } else {
            console.log("Server is ready to send emails via Nodemailer");
        }
    });
}

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

        // If mail transport is not configured, don't pretend email was sent
        if (!transporter) {
            console.warn('Registration: transporter is not configured, cannot send verification email.');
            return res.send("<script>alert('Регистрацията е успешна, но в момента не можем да изпратим имейл за потвърждение. Свържете се с нас или опитайте по-късно.'); window.location='/';</script>");
        }

        const verificationUrl = `${req.protocol}://${req.get('host')}/verify?token=${token}`;
        
        const mailOptions = {
            from: `"TeenCareer" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Потвърждение на регистрация в TeenCareer',
            html: `<h3>Добре дошли в TeenCareer!</h3>
                   <p>Моля, потвърдете имейла си, като кликнете на линка по-долу:</p>
                   <a href="${verificationUrl}" style="background-color: #09989e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Потвърди моя профил</a>`
        };

        try {
            const info = await transporter.sendMail(mailOptions);
            console.log('Verification email sent:', info.response);
            return res.send("<script>alert('Регистрацията е успешна! Проверете имейла си (и папката за спам) за линк за потвърждение.'); window.location='/';</script>");
        } catch (mailErr) {
            console.error('Error sending verification email:', mailErr);
            return res.send("<script>alert('Регистрацията е успешна, но имаше проблем при изпращането на имейл за потвърждение. Опитайте отново по-късно или използвайте друг имейл.'); window.location='/';</script>");
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

// Generate PDF Route (using pdfkit instead of Puppeteer)
app.post('/generate-pdf', (req, res) => {
    console.log("Generating CV PDF with pdfkit...");
    const { fullName, email, phone, city, education, experience, skills, languages, summary, date, text } = req.body;

    try {
        const fileName = `CV_${(fullName || 'user').replace(/\s+/g, '_')}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        doc.pipe(res);

        const addSection = (title, content) => {
            if (!content) return;
            doc.moveDown();
            doc.fontSize(12).fillColor('#09989e').text(title.toUpperCase());
            doc.moveDown(0.3);
            doc.fontSize(10).fillColor('#000000').text(String(content), {
                width: doc.page.width - doc.options.margins.left - doc.options.margins.right
            });
        };

        // Header
        doc.fontSize(22).fillColor('#8274A1').text(fullName || 'CV', { align: 'left' });
        doc.moveDown(0.5);

        const contactParts = [];
        if (email) contactParts.push(email);
        if (phone) contactParts.push(phone);
        if (city) contactParts.push(city);
        if (date) contactParts.push(date);
        if (contactParts.length) {
            doc.fontSize(10).fillColor('#333333').text(contactParts.join(' | '));
        }

        // Sections
        addSection('За мен', summary);
        addSection('Образование', education);
        addSection('Опит', experience);
        addSection('Повече за моя опит', text);
        addSection('Умения', skills);
        addSection('Езици', languages);

        doc.end();
    } catch (error) {
        console.error('Error generating CV PDF with pdfkit:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Error generating PDF' });
        } else {
            res.end();
        }
    }
});

// Generate Portfolio PDF Route (using pdfkit instead of Puppeteer)
app.post('/generate-portfolio', (req, res) => {
    console.log("Generating Portfolio PDF with pdfkit...");
    const { full_name, email, phone, education, experience } = req.body;

    try {
        const fileName = `Portfolio_${(full_name || 'user').replace(/\s+/g, '_')}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

        const doc = new PDFDocument({ size: 'A4', margin: 50, layout: 'portrait' });
        doc.pipe(res);

        const addSection = (title, content) => {
            if (!content) return;
            doc.moveDown();
            doc.fontSize(12).fillColor('#09989e').text(title.toUpperCase());
            doc.moveDown(0.3);
            doc.fontSize(10).fillColor('#000000').text(String(content), {
                width: doc.page.width - doc.options.margins.left - doc.options.margins.right
            });
        };

        // Header
        doc.fontSize(24).fillColor('#8274A1').text(full_name || 'Portfolio', { align: 'center' });
        doc.moveDown(0.5);

        const contactParts = [];
        if (email) contactParts.push(email);
        if (phone) contactParts.push(phone);
        if (contactParts.length) {
            doc.fontSize(10).fillColor('#333333').text(contactParts.join(' | '), { align: 'center' });
        }

        // Sections
        addSection('Образование', education);
        addSection('Професионален Опит & Проекти', experience);

        doc.moveDown(2);
        doc.fontSize(8).fillColor('#aaaaaa').text('Създадено с TeenCareer Portfolio Maker', { align: 'center' });

        doc.end();
    } catch (error) {
        console.error('Error generating Portfolio PDF with pdfkit:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Error generating portfolio PDF' });
        } else {
            res.end();
        }
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

  