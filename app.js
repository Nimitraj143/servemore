// ===== DATA =====
const foodData = [
  { id:1, title:"Dal Makhani + Roti", cat:"veg", status:"fresh", servings:6, address:"Sector 14, Gurugram", donor:"Priya S.", donorSeed:"user2", desc:"Freshly cooked dal makhani with 10 rotis. No onion/garlic. Good for 6 people.", imgSeed:"biryani", expiryMin:180, phone:"9876543210" },
  { id:2, title:"Chicken Biryani", cat:"nonveg", status:"urgent", servings:4, address:"DLF Phase 2, Gurugram", donor:"Rahul K.", donorSeed:"user1", desc:"Dum biryani with raita. Hot and fresh. Urgent — made 2 hrs ago!", imgSeed:"food", expiryMin:45, phone:"9812345678" },
  { id:3, title:"Pav Bhaji (Full Pot)", cat:"veg", status:"fresh", servings:10, address:"MG Road, Gurugram", donor:"Anjali M.", donorSeed:"user3", desc:"Big pot of pav bhaji with 20 pavs. Event leftovers. Still hot!", imgSeed:"meal", expiryMin:120, phone:"9898989898" },
  { id:4, title:"Paneer Butter Masala", cat:"veg", status:"fresh", servings:5, address:"Cyber Hub, Gurugram", donor:"Nimit R.", donorSeed:"user42", desc:"Restaurant-style paneer butter masala. Take a container!", imgSeed:"curry", expiryMin:240, phone:"9811112222" },
  { id:5, title:"Mutton Curry + Rice", cat:"nonveg", status:"urgent", servings:3, address:"Sushant Lok, Gurugram", donor:"Vikram D.", donorSeed:"user5", desc:"Home cooked mutton curry with 2kg rice. Very spicy!", imgSeed:"spicy", expiryMin:30, phone:"9934561234" },
  { id:6, title:"Fruit Salad Bowl", cat:"veg", status:"fresh", servings:8, address:"South City 1, Gurugram", donor:"Meera T.", donorSeed:"user6", desc:"Mixed seasonal fruits — mango, papaya, apple, banana. Very fresh!", imgSeed:"fruits", expiryMin:300, phone:"9723456789" },
  { id:7, title:"Chole Bhature", cat:"veg", status:"fresh", servings:7, address:"Palam Vihar, Gurugram", donor:"Sunita R.", donorSeed:"user7", desc:"Homemade chole with 15 bhaturas. Morning leftovers. Tasty!", imgSeed:"breakfast", expiryMin:90, phone:"9845671234" },
  { id:8, title:"Fish Curry + Steamed Rice", cat:"nonveg", status:"urgent", servings:4, address:"Sector 56, Gurugram", donor:"Rajan P.", donorSeed:"user8", desc:"Bengali style fish curry. Rice portion for 4 adults.", imgSeed:"seafood", expiryMin:60, phone:"9701234567" },
  { id:9, title:"Rajma Chawal", cat:"veg", status:"fresh", servings:6, address:"Sector 45, Gurugram", donor:"Deepa N.", donorSeed:"user9", desc:"Classic rajma chawal. Sunday special. Still warm.", imgSeed:"beans", expiryMin:150, phone:"9654321098" },
  { id:10, title:"Gulab Jamun (50pcs)", cat:"veg", status:"fresh", servings:10, address:"Udyog Vihar, Gurugram", donor:"Ramesh G.", donorSeed:"user10", desc:"Office celebration leftover gulab jamuns. Sealed container.", imgSeed:"dessert", expiryMin:480, phone:"9567890123" },
  { id:11, title:"Aloo Paratha + Curd", cat:"veg", status:"fresh", servings:5, address:"Sector 23, Gurugram", donor:"Kavya S.", donorSeed:"user11", desc:"8 fresh aloo parathas with homemade curd and pickle.", imgSeed:"bread", expiryMin:200, phone:"9412345678" },
  { id:12, title:"Egg Curry + Chapati", cat:"nonveg", status:"urgent", servings:4, address:"Maruti Vihar, Gurugram", donor:"Arjun K.", donorSeed:"user12", desc:"6 egg curry with 12 chapatis. Made an hour ago.", imgSeed:"eggs", expiryMin:50, phone:"9312312312" },
];

const claimedData = [
  { id:1, title:"Chole Bhature", imgSeed:"breakfast", donor:"Sunita R.", address:"Palam Vihar", claimedAt:"Today, 10:30 AM", status:"Ready for pickup" },
  { id:2, title:"Dal Makhani + Roti", imgSeed:"biryani", donor:"Priya S.", address:"Sector 14", claimedAt:"Today, 9:15 AM", status:"Ready for pickup" },
  { id:3, title:"Paneer Butter Masala", imgSeed:"curry", donor:"Nimit R.", address:"Cyber Hub", claimedAt:"Today, 8:00 AM", status:"Ready for pickup" },
];

const pastClaimsData = [
  { name:"Pav Bhaji", date:"Yesterday, 7:30 PM", tag:"Collected" },
  { name:"Mutton Curry", date:"May 28, 1:15 PM", tag:"Collected" },
  { name:"Rajma Chawal", date:"May 27, 12:00 PM", tag:"Collected" },
  { name:"Biryani", date:"May 25, 6:45 PM", tag:"Collected" },
  { name:"Fruit Salad", date:"May 23, 11:00 AM", tag:"Expired" },
];

const leaderboardData = [
  { rank:4, name:"Vikram D.", seed:"user5", meals:28, me:false },
  { rank:5, name:"Kavya S.", seed:"user11", meals:25, me:false },
  { rank:6, name:"Sunita R.", seed:"user7", meals:22, me:false },
  { rank:7, name:"Deepa N.", seed:"user9", meals:19, me:false },
  { rank:8, name:"Nimit R.", seed:"user42", meals:42, me:true },
  { rank:9, name:"Meera T.", seed:"user6", meals:15, me:false },
  { rank:10, name:"Arjun K.", seed:"user12", meals:13, me:false },
];

const weeklyData = [3, 1, 5, 2, 4, 6, 3];

// ===== STATE =====
let currentFilter = 'all';
let currentModal = null;
let grabTimer = null;
let timers = {};

// ===== NAVIGATION =====
function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelector(`[data-page="${page}"]`).classList.add('active');

  // Close sidebar on mobile
  if (window.innerWidth <= 720) {
    document.getElementById('sidebar').classList.remove('open');
  }
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ===== RENDER FOOD GRID =====
function formatTime(mins) {
  if (mins <= 0) return 'Expired';
  if (mins < 60) return mins + 'm left';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h + 'h ' + (m > 0 ? m + 'm' : '') + ' left';
}

function renderFoodGrid(filter = 'all') {
  const grid = document.getElementById('food-grid');
  let items = foodData;
  if (filter === 'urgent') items = foodData.filter(f => f.status === 'urgent');
  else if (filter === 'fresh') items = foodData.filter(f => f.status === 'fresh');
  else if (filter === 'veg') items = foodData.filter(f => f.cat === 'veg');
  else if (filter === 'nonveg') items = foodData.filter(f => f.cat === 'nonveg');

  grid.innerHTML = items.map(food => {
    const isUrgent = food.status === 'urgent';
    const timerClass = isUrgent ? 'food-card-timer' : 'food-card-timer safe';
    return `
      <div class="food-card" data-cat="${food.cat}" data-status="${food.status}" onclick="openModal(${food.id})">
        <img class="food-card-img" src="https://picsum.photos/seed/${food.imgSeed}/400/200" alt="${food.title}" loading="lazy">
        <div class="food-card-body">
          <div class="food-card-badges">
            ${isUrgent ? '<span class="badge urgent">⚡ Urgent</span>' : '<span class="badge fresh">✅ Fresh</span>'}
            <span class="badge ${food.cat}">${food.cat === 'veg' ? '🌿 Veg' : '🍗 Non-Veg'}</span>
          </div>
          <div class="food-card-title">${food.title}</div>
          <div class="food-card-meta">
            <span>👤 ${food.servings} servings</span>
            <span class="${timerClass}" id="timer-card-${food.id}">${formatTime(food.expiryMin)}</span>
          </div>
          <div style="font-size:0.78rem;color:var(--text2);margin-bottom:10px;">📍 ${food.address}</div>
          <button class="btn-grab" onclick="event.stopPropagation(); openModal(${food.id})">Grab This 🤝</button>
        </div>
      </div>
    `;
  }).join('');

  // Start live countdown
  clearAllTimers();
  items.forEach(food => startCountdown(food));
}

function clearAllTimers() {
  Object.values(timers).forEach(t => clearInterval(t));
  timers = {};
}

function startCountdown(food) {
  let mins = food.expiryMin;
  const el = () => document.getElementById('timer-card-' + food.id);
  timers[food.id] = setInterval(() => {
    mins--;
    food.expiryMin = mins;
    const node = el();
    if (node) {
      node.textContent = formatTime(mins);
      if (mins <= 30) {
        node.style.color = 'var(--red)';
        food.status = 'urgent';
      }
    }
    if (mins <= 0) clearInterval(timers[food.id]);
  }, 60000);
}

function filterFood(btn, filter) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentFilter = filter;
  renderFoodGrid(filter);
}

// ===== MODAL =====
function openModal(id) {
  const food = foodData.find(f => f.id === id);
  if (!food) return;
  currentModal = food;

  document.getElementById('modal-img').src = `https://picsum.photos/seed/${food.imgSeed}/800/400`;
  document.getElementById('modal-title').textContent = food.title;
  document.getElementById('modal-badges').innerHTML = `
    ${food.status === 'urgent' ? '<span class="badge urgent">⚡ Urgent</span>' : '<span class="badge fresh">✅ Fresh</span>'}
    <span class="badge ${food.cat}">${food.cat === 'veg' ? '🌿 Veg' : '🍗 Non-Veg'}</span>
  `;
  document.getElementById('modal-meta').innerHTML = `
    <span>👤 ${food.servings} servings</span>
    <span>📍 ${food.address}</span>
    <span>📞 ${food.phone}</span>
  `;
  document.getElementById('modal-desc').textContent = food.desc;
  document.getElementById('modal-donor').innerHTML = `
    <img src="https://picsum.photos/seed/${food.donorSeed}/60/60" alt="${food.donor}">
    <div>
      <div style="font-weight:600">${food.donor}</div>
      <div style="font-size:0.75rem;color:var(--text2)">Donor · ⭐ 4.8</div>
    </div>
  `;
  document.getElementById('modal-timer').textContent = formatTime(food.expiryMin);
  document.getElementById('modal-overlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  currentModal = null;
}

function confirmGrab() {
  if (!currentModal) return;
  closeModal();
  showToast(`🎉 You grabbed "${currentModal.title}"! Head to ${currentModal.address}`);
  // Update badge
  const badge = document.getElementById('badge-claimed');
  badge.textContent = parseInt(badge.textContent) + 1;
}

// ===== CLAIMED PAGE =====
function renderClaimedGrid() {
  document.getElementById('claimed-grid').innerHTML = claimedData.map(c => `
    <div class="claimed-card">
      <img class="claimed-card-img" src="https://picsum.photos/seed/${c.imgSeed}/400/200" alt="${c.title}" loading="lazy">
      <div class="claimed-card-body">
        <div class="claimed-card-title">${c.title}</div>
        <div class="claimed-card-meta">👤 ${c.donor} · 📍 ${c.address}</div>
        <div class="claimed-card-meta">🕐 ${c.claimedAt}</div>
        <span class="claimed-status">✅ ${c.status}</span>
      </div>
    </div>
  `).join('');

  document.getElementById('past-list').innerHTML = pastClaimsData.map(p => `
    <div class="past-item">
      <div class="past-item-info">
        <div class="past-item-name">${p.name}</div>
        <div class="past-item-date">${p.date}</div>
      </div>
      <span class="past-item-tag">${p.tag}</span>
    </div>
  `).join('');
}

function claimedTab(btn, sectionId) {
  document.querySelectorAll('.ctab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.claimed-section').forEach(s => s.style.display = 'none');
  document.getElementById(sectionId).style.display = 'block';
}

// ===== IMPACT BAR CHART =====
function renderBarChart() {
  const max = Math.max(...weeklyData);
  document.getElementById('bar-chart').innerHTML = weeklyData.map((val, i) => `
    <div class="bar ${i === 5 ? 'highlight' : ''}" style="height:${(val/max)*100}%" title="${val} donations"></div>
  `).join('');
}

// ===== LEADERBOARD =====
function renderLeaderboard() {
  document.getElementById('leaderboard-list').innerHTML = leaderboardData.map(u => `
    <div class="lb-row ${u.me ? 'me' : ''}">
      <div class="lb-rank">#${u.rank}</div>
      <img class="lb-avatar" src="https://picsum.photos/seed/${u.seed}/80/80" alt="${u.name}" loading="lazy">
      <div class="lb-name">${u.name} ${u.me ? '<span class="lb-you">YOU</span>' : ''}</div>
      <div class="lb-meals">${u.meals} meals</div>
    </div>
  `).join('');
}

// ===== DONATE FORM =====
function previewPhoto(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const preview = document.getElementById('photo-preview');
    preview.src = e.target.result;
    preview.style.display = 'block';
    document.getElementById('photo-drop').style.display = 'none';
  };
  reader.readAsDataURL(file);
}

function submitDonation() {
  const name = document.getElementById('food-name').value.trim();
  const address = document.getElementById('food-address').value.trim();
  if (!name) { showToast('⚠️ Please enter food name'); return; }
  if (!address) { showToast('⚠️ Please enter pickup address'); return; }

  // Reset form
  ['food-name','food-address','food-phone','food-desc'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('photo-preview').style.display = 'none';
  document.getElementById('photo-drop').style.display = 'block';

  // Update count
  const count = parseInt(document.getElementById('my-donations-count').textContent);
  document.getElementById('my-donations-count').textContent = count + 1;

  showToast(`✅ "${name}" listed! Others can now grab it.`);

  // Navigate to food board
  setTimeout(() => navigate('food-board'), 1200);
}

// ===== TOAST =====
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  renderFoodGrid();
  renderClaimedGrid();
  renderBarChart();
  renderLeaderboard();
});

// Close sidebar on outside click (mobile)
document.addEventListener('click', e => {
  const sidebar = document.getElementById('sidebar');
  const hamburger = document.getElementById('hamburger');
  if (window.innerWidth <= 720 && sidebar.classList.contains('open')) {
    if (!sidebar.contains(e.target) && !hamburger.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  }
});