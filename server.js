//Libraries
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const session = require('express-session');
const puppeteer = require('puppeteer');
const fs = require('fs');

const app = express();

// Sessions
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname));

// DataBase connection
const dbURI = 'mongodb+srv://teencareer_db_user:jO38uGY9loz1xVar@cluster0.ylxecao.mongodb.net/TeenCareerDB?retryWrites=true&w=majority';

// User info
const userSchema = new mongoose.Schema({
  username: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  dob: Date,
  phone: String
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
        if (existingUser) return res.send("Този имейл вече е регистриран.");

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ 
            email, 
            password: hashedPassword,
            username: username || email.split('@')[0] 
        });
        
        const savedUser = await newUser.save();
        req.session.userId = savedUser._id; 
        res.redirect('/profile'); 
    } catch (error) {
        console.error(error);
        res.status(500).send("Грешка при регистрацията.");
    }
});
// Logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Update Profile API
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
    const { fullName, email, phone, city, education, experience, skills, languages, summary, date, text, template } = req.body;

    // 1. Read the CSS file to include styles in the PDF
    let css = '';
    try {
        css = fs.readFileSync(path.join(__dirname, 'cv.css'), 'utf8');
    } catch (e) {
        console.error("Could not read cv.css", e);
    }

    // 2. Construct the HTML structure (similar to your preview)
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
        // 3. Launch Puppeteer to generate PDF
        const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
        const page = await browser.newPage();
        
        // Set content and wait for fonts/network
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        
        const pdfBuffer = await page.pdf({ 
            format: 'A4', 
            printBackground: true,
            margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
        });

        await browser.close();

        // 4. Send PDF to client
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="CV_${fullName || 'user'}.pdf"`,
            'Content-Length': pdfBuffer.length
        });
        res.send(pdfBuffer);

    } catch (error) {
        console.error("PDF Generation Error:", error);
        res.status(500).send("Error generating PDF");
    }
});

const PORT = 3000;
mongoose.connect(dbURI)
  .then(() => {
    console.log('Connected to MongoDB Atlas!');
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((err) => console.error('Error connecting:', err));