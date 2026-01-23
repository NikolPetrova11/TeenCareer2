//Libraries
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const session = require('express-session');

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
mongoose.connect(dbURI)
  .then(() => console.log('Connected to MongoDB Atlas!'))
  .catch((err) => console.error('Error connecting:', err));

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

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));