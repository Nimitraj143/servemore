require('dotenv').config({ path: './.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// ─── SESSION aur PASSPORT sabse pehle ────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'servemore_secret_key',
  resave: true,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// Static files baad mein
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// ─── MongoDB ──────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/servemore')
  .then(async () => {
    console.log('✅ MongoDB connected');
    await seedData();
  })
  .catch(err => console.error('❌ MongoDB error:', err));

// ─── Schemas ──────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  googleId:    { type: String, required: true, unique: true },
  displayName: String,
  email:       String,
  photo:       String,
  createdAt:   { type: Date, default: Date.now }
});

const foodSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: String,
  category:    { type: String, default: 'other' },
  quantity:    { type: Number, default: 1 },
  location:    String,
  image:       String,
  donorId:     String,
  donorName:   String,
  donorEmail:  String,
  donorPhoto:  String,
  phone:       String,
  status:      { type: String, default: 'available' },
  claimedBy:   [{ userId: String, userName: String, qty: Number, claimedAt: Date }],
  isSeeded:    { type: Boolean, default: false },
  createdAt:   { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Food = mongoose.model('Food', foodSchema);

// ─── SEED DATA ────────────────────────────────────────────────
const SEED_LISTINGS = [
  { title: 'Dal Makhani & Rice', description: 'Freshly cooked, enough for 4 people. Made this morning!', category: 'cooked', quantity: 4, location: 'Lajpat Nagar, Delhi', phone: '9810012345', donorName: 'Priya Sharma', donorId: 'seed_1', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80' },
  { title: 'Homemade Chole Bhature', description: 'Made fresh for a party, lots leftover. Spicy!', category: 'cooked', quantity: 6, location: 'Saket, Delhi', phone: '9899123456', donorName: 'Amit Verma', donorId: 'seed_2', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80' },
  { title: 'Assorted Fruits Basket', description: 'Apples, bananas, oranges — from grocery run. Take all!', category: 'fruits', quantity: 8, location: 'Hauz Khas, Delhi', phone: '9711234567', donorName: 'Neha Gupta', donorId: 'seed_3', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80' },
  { title: 'Bread & Butter Packets', description: 'Unopened packs from bakery. Expires in 3 days.', category: 'bakery', quantity: 5, location: 'Connaught Place, Delhi', phone: '9818765432', donorName: 'Rahul Bose', donorId: 'seed_4', image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&q=80' },
  { title: 'Paneer Butter Masala', description: 'Restaurant-style. Made extra for guests who cancelled.', category: 'cooked', quantity: 3, location: 'Dwarka, Delhi', phone: '9971122334', donorName: 'Sunita Mehta', donorId: 'seed_5', image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&q=80' },
  { title: 'Biryani (Veg)', description: 'Full pot leftover from function. Best before evening!', category: 'cooked', quantity: 10, location: 'Rohini, Delhi', phone: '9650987654', donorName: 'Karim Khan', donorId: 'seed_6', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80' },
  { title: 'Fresh Vegetables Mix', description: 'Tomatoes, onions, potatoes, spinach — from wholesale.', category: 'raw', quantity: 7, location: 'Janakpuri, Delhi', phone: '9312233445', donorName: 'Ravi Tiwari', donorId: 'seed_7', image: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&q=80' },
  { title: 'Pav Bhaji & Pav', description: 'Street-style bhaji with buttered pavs. 8 plates ready!', category: 'cooked', quantity: 8, location: 'Pitampura, Delhi', phone: '9899001122', donorName: 'Deepa Joshi', donorId: 'seed_8', image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&q=80' },
];

// Fake donors for live activity feed
const FAKE_DONORS = ['Anjali S.', 'Rohan M.', 'Kavya P.', 'Arjun K.', 'Meena D.', 'Suresh R.', 'Pooja T.', 'Vikram B.'];
const FAKE_FOODS  = ['Poha', 'Khichdi', 'Sambar Rice', 'Upma', 'Idli', 'Roti Sabzi', 'Pasta', 'Sandwich', 'Cake Slices', 'Fruits'];
const FAKE_AREAS  = ['Karol Bagh', 'Vasant Kunj', 'Malviya Nagar', 'Rajouri Garden', 'Greater Kailash', 'Mayur Vihar'];

async function seedData() {
  try {
    const existing = await Food.countDocuments({ isSeeded: true });
    if (existing > 0) {
      console.log(`🌱 Seed data already present (${existing} listings)`);
      return;
    }
    const docs = SEED_LISTINGS.map(s => ({
      ...s,
      donorEmail: '',
      donorPhoto: '',
      status: 'available',
      isSeeded: true,
      createdAt: new Date(Date.now() - Math.random() * 2 * 60 * 60 * 1000) // random last 2 hrs
    }));
    await Food.insertMany(docs);
    console.log(`🌱 Seeded ${docs.length} sample listings!`);
  } catch(err) {
    console.error('Seed error:', err);
  }
}

// ─── Live Activity Simulator — har 2 min pe ──────────────────
function startActivitySimulator() {
  setInterval(() => {
    const donor = FAKE_DONORS[Math.floor(Math.random() * FAKE_DONORS.length)];
    const food  = FAKE_FOODS[Math.floor(Math.random() * FAKE_FOODS.length)];
    const area  = FAKE_AREAS[Math.floor(Math.random() * FAKE_AREAS.length)];
    const type  = Math.random() > 0.4 ? 'donated' : 'grabbed';

    const event = type === 'donated'
      ? { type: 'live-activity', action: 'donated', message: `${donor} just donated ${food}`, location: area }
      : { type: 'live-activity', action: 'grabbed',  message: `Someone grabbed ${food}`,       location: area };

    io.emit('live-activity', event);
    console.log(`📡 Live activity: ${event.message}`);
  }, 2 * 60 * 1000); // 2 minutes
}

// ─── Passport Google OAuth ────────────────────────────────────
passport.use(new GoogleStrategy({
  clientID:     process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL:  process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ googleId: profile.id });
    if (!user) {
      user = await User.create({
        googleId:    profile.id,
        displayName: profile.displayName,
        email:       profile.emails?.[0]?.value,
        photo:       profile.photos?.[0]?.value
      });
    }
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user, done) => done(null, user._id.toString()));
passport.deserializeUser(async (id, done) => {
  try { done(null, await User.findById(id)); } catch(err) { done(err); }
});

// ─── Auth Middleware ──────────────────────────────────────────
function requireAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: 'Login required' });
}

// ─── Auth Routes ──────────────────────────────────────────────
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/?auth=failed' }),
  (req, res) => {
    console.log('✅ Google login success:', req.user?.displayName);
    res.redirect('/?auth=success');
  }
);

app.get('/auth/logout', (req, res) => req.logout(() => res.redirect('/')));

app.get('/auth/me', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ loggedIn: true, id: req.user.googleId, name: req.user.displayName, email: req.user.email, photo: req.user.photo });
  } else {
    res.json({ loggedIn: false });
  }
});

// ─── Multer ───────────────────────────────────────────────────
if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './uploads'),
  filename:    (req, file, cb) => cb(null, `food_${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// ─── Food Routes ──────────────────────────────────────────────
app.get('/api/foods', async (req, res) => {
  try {
    const foods = await Food.find({ status: 'available' }).sort({ createdAt: -1 });
    res.json(foods);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/foods/my', requireAuth, async (req, res) => {
  try {
    const foods = await Food.find({ donorId: req.user.googleId }).sort({ createdAt: -1 });
    res.json(foods);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/foods', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const { title, description, category, quantity, location } = req.body;
    const food = await Food.create({
      title, description, category,
      quantity: parseInt(quantity) || 1,
      location,
      image:      req.file ? `/uploads/${req.file.filename}` : null,
      donorId:    req.user.googleId,
      donorName:  req.user.displayName,
      donorEmail: req.user.email,
      donorPhoto: req.user.photo
    });
    io.emit('food-added', food);
    // Also emit as live-activity
    io.emit('live-activity', {
      action:   'donated',
      message:  `${req.user.displayName.split(' ')[0]} donated ${title}`,
      location: location || ''
    });
    res.status(201).json(food);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/foods/:id', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);
    if (!food) return res.status(404).json({ error: 'Not found' });
    if (food.donorId !== req.user.googleId) return res.status(403).json({ error: 'Not your listing' });
    const { title, description, category, quantity, location } = req.body;
    if (title)       food.title       = title;
    if (description) food.description = description;
    if (category)    food.category    = category;
    if (quantity)    food.quantity    = parseInt(quantity);
    if (location)    food.location    = location;
    if (req.file)    food.image       = `/uploads/${req.file.filename}`;
    await food.save();
    io.emit('food-updated', food);
    res.json(food);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/foods/:id', requireAuth, async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);
    if (!food) return res.status(404).json({ error: 'Not found' });
    if (food.donorId !== req.user.googleId) return res.status(403).json({ error: 'Not your listing' });
    await food.deleteOne();
    io.emit('food-removed', { id: req.params.id });
    res.json({ success: true });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/foods/:id/grab', requireAuth, async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);
    if (!food || food.status !== 'available') return res.status(400).json({ error: 'Not available' });
    const qty = parseInt(req.body.qty) || 1;
    if (qty > food.quantity) return res.status(400).json({ error: 'Quantity exceeds available' });
    food.claimedBy.push({ userId: req.user.googleId, userName: req.user.displayName, qty, claimedAt: new Date() });
    food.quantity -= qty;
    if (food.quantity <= 0) food.status = 'grabbed';
    await food.save();
    io.emit('food-updated', food);
    io.emit(`donor-notify-${food.donorId}`, {
      message: `${req.user.displayName} grabbed ${qty} of "${food.title}"`,
      foodId:  food._id,
      grabber: req.user.displayName
    });
    io.emit('live-activity', {
      action:   'grabbed',
      message:  `Someone grabbed ${food.title}`,
      location: food.location || ''
    });
    res.json(food);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/leaderboard', async (req, res) => {
  try {
    const foods = await Food.find({});
    const stats = {};
    foods.forEach(f => {
      if (!stats[f.donorId]) stats[f.donorId] = { name: f.donorName, photo: f.donorPhoto, count: 0, grabbed: 0 };
      stats[f.donorId].count++;
      if (f.status === 'grabbed') stats[f.donorId].grabbed++;
    });
    res.json(Object.values(stats).sort((a, b) => b.count - a.count).slice(0, 10));
  } catch(err) { res.status(500).json({ error: err.message }); }
});

// ─── Socket.io ────────────────────────────────────────────────
io.on('connection', socket => {
  console.log('🔌 Connected:', socket.id);
  socket.on('disconnect', () => console.log('🔌 Disconnected:', socket.id));
});

// ─── Fallback ─────────────────────────────────────────────────
app.get('/{*path}', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// ─── Start ────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 ServeMore running on http://localhost:${PORT}`);
  startActivitySimulator();
  console.log('⏱️  Live activity simulator started (every 2 min)');
});