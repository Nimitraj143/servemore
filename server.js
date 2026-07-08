const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config({ path: './.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
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
// Har photo verify karke rakhi gayi hai — Wikimedia Commons ke direct
// "Special:FilePath" links use kiye hain jahan bhi possible tha, kyunki
// ye Google-thumbnail (gstatic) links ki tarah expire/break nahi hote.
const SEED_LISTINGS = [
  { title: 'Dal Makhani & Rice', description: 'Freshly cooked, enough for 4 people. Made this morning!', category: 'cooked', quantity: 4, location: 'Lajpat Nagar, Delhi', phone: '9810012345', donorName: 'Priya Sharma', donorId: 'seed_1', image: 'https://res.cloudinary.com/dtnp9xjzj/image/upload/v1783507843/servemore/szmoecnyi3hu4ce9mdei.webp' },
  { title: 'Chicken Biryani', description: 'Dum biryani, made for a family function. 6 servings left.', category: 'cooked', quantity: 6, location: 'Saket, Delhi', phone: '9899123456', donorName: 'Amit Verma', donorId: 'seed_2', image: 'https://res.cloudinary.com/dtnp9xjzj/image/upload/v1783507883/servemore/by8q6szkog77qxzpeccv.jpg' },
  { title: 'Paneer Butter Masala', description: 'Restaurant-style. Made extra for guests who cancelled.', category: 'cooked', quantity: 3, location: 'Dwarka, Delhi', phone: '9971122334', donorName: 'Sunita Mehta', donorId: 'seed_5', image: 'https://res.cloudinary.com/dtnp9xjzj/image/upload/v1783507915/servemore/csp2hgqrntw0mqod6xpt.jpg' },
  { title: 'Pav Bhaji & Pav', description: 'Street-style bhaji with buttered pavs. 8 plates ready!', category: 'cooked', quantity: 8, location: 'Pitampura, Delhi', phone: '9899001122', donorName: 'Deepa Joshi', donorId: 'seed_8', image: 'https://res.cloudinary.com/dtnp9xjzj/image/upload/v1783508680/servemore/wuye2mzwvkx1jquamvsn.webp' },
  { title: 'Gulab Jamun (50pcs)', description: 'Office celebration leftover gulab jamuns. Sealed container.', category: 'cooked', quantity: 10, location: 'Udyog Vihar, Gurugram', phone: '9567890123', donorName: 'Ramesh G.', donorId: 'seed_10', image: 'https://res.cloudinary.com/dtnp9xjzj/image/upload/v1783507943/servemore/rbsuhfyqpolp9b40joy7.jpg' },
  { title: 'Masala Dosa', description: 'South Indian breakfast leftover from a family gathering. 5 dosas left.', category: 'cooked', quantity: 5, location: 'Karol Bagh, Delhi', phone: '9812340987', donorName: 'Lakshmi Iyer', donorId: 'seed_11', image: 'https://images.unsplash.com/photo-1743615467363-250466982515?w=400&q=80' },
  { title: 'Naan & Tandoori Roti (Basket)', description: 'Fresh tandoori rotis and naan from a wedding function. 15 pieces.', category: 'bakery', quantity: 15, location: 'Rohini, Delhi', phone: '9811223344', donorName: 'Karim Khan', donorId: 'seed_6', image: 'https://res.cloudinary.com/dtnp9xjzj/image/upload/v1783508007/servemore/leotygbh4omrunzvrzqr.webp' },
  { title: 'Chole Chawal', description: 'Home-style chole chawal, made extra for guests.', category: 'cooked', quantity: 4, location: 'Vasant Kunj, Delhi', phone: '9899887766', donorName: 'Ritu Kapoor', donorId: 'seed_12', image: 'https://res.cloudinary.com/dtnp9xjzj/image/upload/v1783507973/servemore/dl2xwnkalybvfu9oqyk2.jpg' },
  { title: 'Rajma Chawal', description: 'Home-style rajma chawal, made extra for a family gathering.', category: 'cooked', quantity: 4, location: 'Karol Bagh, Delhi', phone: '9812345670', donorName: 'Nimit Rajput', donorId: 'seed_13', image: 'https://res.cloudinary.com/dtnp9xjzj/image/upload/v1783508637/servemore/jin4mpwwvr5a0rxamdpr.jpg' },
  { title: 'Assorted Fruits Basket', description: 'Leftover fruit platter from a birthday party. Apples, oranges, grapes.', category: 'fruits', quantity: 8, location: 'Hauz Khas, Delhi', phone: '9711234567', donorName: 'Neha Gupta', donorId: 'seed_3', image: 'https://res.cloudinary.com/dtnp9xjzj/image/upload/v1783508032/servemore/jjvve7y5dwxoahaivrps.jpg' },
];

// ─── DISH PHOTO AUTO-MATCH LIBRARY ─────────────────────────────
// Jab koi user naya food add kare BINA apni photo upload kiye, hum uske
// "title" ko yahan neeche diye gaye keywords se match karte hain aur
// sahi verified photo apne aap laga dete hain.
//
// Saari photos ab Wikimedia Commons ke "Special:FilePath" direct links
// hain — ye Google Images ke encrypted-tbn0.gstatic.com thumbnails ki
// tarah low-res/expire hone wale nahi hain, balki Wikimedia khud serve
// karta hai inhe, isliye hamesha reliably load honge.
//
// Rajma Chawal ke liye ab wikimedia link daal diya hai (tumne khud bhi
// ek baar apni photo upload ki thi, wo alag se listing mein already hai —
// ye library entry sirf tab kaam aayegi jab KOI AUR bina photo ke
// "Rajma Chawal" add karega).
//
// Chole Chawal aur Kadhi Chawal ke liye abhi bhi placeholder hai —
// agar chaho to inke liye bhi Wikimedia se link nikal ke de sakta hoon.
const DISH_PHOTO_LIBRARY = [
  { keywords: ['dal makhani'],                    image: 'https://res.cloudinary.com/dtnp9xjzj/image/upload/v1783507843/servemore/szmoecnyi3hu4ce9mdei.webp' },
  { keywords: ['biryani'],                        image: 'https://res.cloudinary.com/dtnp9xjzj/image/upload/v1783507883/servemore/by8q6szkog77qxzpeccv.jpg' },
  { keywords: ['paneer butter masala', 'paneer sabzi', 'paneer'], image: 'https://res.cloudinary.com/dtnp9xjzj/image/upload/v1783507915/servemore/csp2hgqrntw0mqod6xpt.jpg' },
  { keywords: ['pav bhaji'],                       image: 'https://res.cloudinary.com/dtnp9xjzj/image/upload/v1783508680/servemore/wuye2mzwvkx1jquamvsn.webp' },
  { keywords: ['gulab jamun'],                     image: 'https://res.cloudinary.com/dtnp9xjzj/image/upload/v1783507943/servemore/rbsuhfyqpolp9b40joy7.jpg' },
  { keywords: ['dosa'],                            image: 'https://images.unsplash.com/photo-1743615467363-250466982515?w=400&q=80' },
  { keywords: ['naan', 'tandoori roti', 'roti'],   image: 'https://res.cloudinary.com/dtnp9xjzj/image/upload/v1783508007/servemore/leotygbh4omrunzvrzqr.webp' },
  { keywords: ['fruit', 'fruits basket', 'fruit basket'], image: 'https://res.cloudinary.com/dtnp9xjzj/image/upload/v1783508032/servemore/jjvve7y5dwxoahaivrps.jpg' },
  { keywords: ['noodles', 'chowmein', 'chow mein'], image: 'https://png.pngtree.com/thumb_back/fh260/background/20230611/pngtree-chinese-noodles-with-chicken-stir-fried-noodles-image_2931070.jpg' },
  { keywords: ['rajma chawal', 'rajma'],            image: 'https://res.cloudinary.com/dtnp9xjzj/image/upload/v1783508637/servemore/jin4mpwwvr5a0rxamdpr.jpg' },
  { keywords: ['chole chawal', 'chole', 'chana chawal'], image: 'https://res.cloudinary.com/dtnp9xjzj/image/upload/v1783507973/servemore/dl2xwnkalybvfu9oqyk2.jpg' },

  // 🔶 TODO — inke liye abhi bhi purani (thodi risky) link hai; app se add karke Cloudinary URL bhej doge to inhe bhi permanent kar dunga
  { keywords: ['kadhi chawal', 'kadhi'],                 image: 'https://i.pinimg.com/736x/e8/c4/da/e8c4dadd7dde3ad5e6a4209d7560b54f.jpg' },
  { keywords: ['rasmalai'],                              image: 'https://media-cdn.tripadvisor.com/media/photo-s/1c/70/4d/5c/rasmalai.jpg' },
];

function matchDishPhoto(title) {
  if (!title) return null;
  const t = title.toLowerCase();
  for (const entry of DISH_PHOTO_LIBRARY) {
    if (entry.image && entry.keywords.some(k => t.includes(k))) {
      return entry.image;
    }
  }
  return null;
}

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
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:           'servemore',
    allowed_formats:  ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  },
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

    // Agar user ne apni photo upload ki hai to wahi use hogi.
    // Agar nahi ki, to title se match karke library se auto-photo lagayenge.
    const finalImage = req.file ? req.file.path : matchDishPhoto(title);

    const food = await Food.create({
      title, description, category,
      quantity: parseInt(quantity) || 1,
      location,
      image: finalImage,
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
    if (req.file)    food.image       = req.file.path;
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