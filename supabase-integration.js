// ================================================
// MenüŞalonu — Supabase Entegrasyonu
// Bu dosyayı GitHub'a yükle
// ================================================

// Supabase Client Başlat
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// ================================================
// KULLANICI DURUMU
// ================================================
let currentUser = null;
let currentBusiness = null;

// Sayfa yüklenince oturumu kontrol et
async function initApp() {
  const { data: { session } } = await db.auth.getSession();
  if (session) {
    currentUser = session.user;
    updateNavForLoggedIn(session.user);
    await loadUserBusiness(session.user.id);
  }
  // Gerçek işletmeleri yükle
  await loadBusinesses();
}

// Oturum değişimlerini dinle
db.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN') {
    currentUser = session.user;
    updateNavForLoggedIn(session.user);
    await loadUserBusiness(session.user.id);
    await loadBusinesses();
  } else if (event === 'SIGNED_OUT') {
    currentUser = null;
    currentBusiness = null;
    updateNavForLoggedOut();
    await loadBusinesses();
  }
});

// ================================================
// NAV GÜNCELLEME
// ================================================
function updateNavForLoggedIn(user) {
  const navActions = document.querySelector('.nav-actions');
  if (!navActions) return;
  const email = user.email || '';
  const name = email.split('@')[0];
  navActions.innerHTML = `
    <span style="font-size:0.85rem;color:var(--warm-gray);padding:0 0.5rem">👤 ${name}</span>
    ${currentBusiness ? `<button class="btn btn-ghost" onclick="showPage('panel')" style="font-size:0.82rem;padding:0.5rem 1rem">🏪 Panel</button>` : `<button class="btn btn-ghost" onclick="openModal('businessModal')" style="font-size:0.82rem;padding:0.5rem 1rem">+ İşletme Ekle</button>`}
    <button class="btn btn-primary" onclick="signOut()" style="font-size:0.82rem;padding:0.5rem 1rem">Çıkış</button>
  `;
}

function updateNavForLoggedOut() {
  const navActions = document.querySelector('.nav-actions');
  if (!navActions) return;
  navActions.innerHTML = `
    <button class="btn btn-ghost" onclick="openModal('loginModal')">Giriş Yap</button>
    <button class="btn btn-primary" onclick="openModal('registerModal')">Üye Ol</button>
    <div class="hamburger" onclick="toggleMobileMenu()" id="hamburger">
      <span></span><span></span><span></span>
    </div>
  `;
}

// ================================================
// KAYIT / GİRİŞ / ÇIKIŞ
// ================================================
async function signUp(email, password, ad, soyad, telefon) {
  showLoading('registerBtn', 'Kayıt yapılıyor...');
  const { data, error } = await db.auth.signUp({
    email,
    password,
    options: { data: { ad, soyad, telefon } }
  });
  if (error) {
    showError('registerError', hataMetni(error.message));
    hideLoading('registerBtn', 'Kayıt Ol');
    return;
  }
  // Profil güncelle
  await db.from('users').upsert({ id: data.user.id, ad, soyad, telefon });
  closeModal('registerModal');
  showToast('✅ Kayıt başarılı! E-postanı doğrula.');
}

async function signIn(email, password) {
  showLoading('loginBtn', 'Giriş yapılıyor...');
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error) {
    showError('loginError', hataMetni(error.message));
    hideLoading('loginBtn', 'Giriş Yap');
    return;
  }
  closeModal('loginModal');
  showToast('✅ Hoş geldiniz!');
}

async function signOut() {
  await db.auth.signOut();
  showToast('👋 Çıkış yapıldı.');
}

// ================================================
// İŞLETME KAYIT
// ================================================
async function registerBusiness(formData) {
  if (!currentUser) {
    openModal('loginModal');
    showToast('⚠️ Önce giriş yapın.');
    return;
  }
  showLoading('businessBtn', 'Kaydediliyor...');
  const { data, error } = await db.from('businesses').insert({
    user_id: currentUser.id,
    isletme_adi: formData.isletme_adi,
    yetkili_adi: formData.yetkili_adi,
    email: formData.email,
    telefon: formData.telefon,
    il: formData.il,
    ilce: formData.ilce,
    isletme_turu: formData.isletme_turu,
    abonelik_turu: 'demo'
  }).select().single();

  if (error) {
    showError('businessError', hataMetni(error.message));
    hideLoading('businessBtn', 'İşletmeyi Kaydet');
    return;
  }
  currentBusiness = data;
  closeModal('businessModal');
  showToast('🎉 İşletmeniz kaydedildi! Panel hazırlanıyor...');
  updateNavForLoggedIn(currentUser);
  setTimeout(() => showPage('panel'), 1500);
}

// ================================================
// İŞLETMELERİ YÜKLE (Ana Sayfa)
// ================================================
async function loadBusinesses(filters = {}) {
  let query = db.from('businesses').select('*').eq('aktif', true);
  if (filters.il) query = query.eq('il', filters.il);
  if (filters.isletme_turu) query = query.eq('isletme_turu', filters.isletme_turu);
  if (filters.search) query = query.ilike('isletme_adi', `%${filters.search}%`);
  query = query.order('created_at', { ascending: false }).limit(20);
  const { data, error } = await query;
  if (error || !data || data.length === 0) {
    // Demo verileri göster
    renderCards(demoRestaurants);
    return;
  }
  renderRealCards(data);
}

function renderRealCards(businesses) {
  const grid = document.getElementById('restaurantGrid');
  if (!grid) return;
  const emojis = { 'Restoran': '🍽️', 'Kafe': '☕', 'Fırın/Pastane': '🥐', 'Bar': '🍺', 'Fast Food': '🍔', 'Lokanta': '🥘' };
  grid.innerHTML = businesses.map(b => `
    <a class="listing-card" onclick="loadBusinessProfile('${b.id}');return false" href="#">
      <div class="listing-card-img" style="background:linear-gradient(135deg,#D4A82E 0%,#C04E2A 100%)">
        <span style="font-size:3.5rem">${emojis[b.isletme_turu] || '🍽️'}</span>
        <span class="listing-card-badge open">Açık</span>
      </div>
      <div class="listing-card-body">
        <div class="listing-card-header">
          <div class="listing-card-name">${b.isletme_adi}</div>
          <button class="listing-card-fav" onclick="event.stopPropagation();toggleFavorite('${b.id}',this)">🤍</button>
        </div>
        <div class="listing-card-meta">
          <span>🍽️ ${b.isletme_turu || 'İşletme'}</span>
          <span>📍 ${b.il || ''}</span>
        </div>
        <div class="listing-card-actions">
          <span class="btn-sm btn-sm-primary">Menü İncele</span>
          <span class="btn-sm btn-sm-outline">Profil</span>
        </div>
      </div>
    </a>
  `).join('');
  document.getElementById('listingCount').textContent = businesses.length + ' işletme listeleniyor';
}

// ================================================
// İŞLETME PROFİL SAYFASI
// ================================================
async function loadBusinessProfile(businessId) {
  const { data: business, error } = await db.from('businesses').select('*').eq('id', businessId).single();
  if (error || !business) return;

  // Profil bilgilerini doldur
  document.querySelector('.profile-name').textContent = business.isletme_adi;
  document.querySelector('.profile-category').innerHTML = `
    <span>🍽️ ${business.isletme_turu || ''}</span>
    <span>📍 ${business.il || ''}, ${business.ilce || ''}</span>
  `;

  // Menüyü yükle
  await loadBusinessMenu(businessId);

  showPage('profile');
  window._currentProfileId = businessId;
}

async function loadBusinessMenu(businessId) {
  const { data: kategoriler } = await db.from('menu_kategorileri').select('*').eq('business_id', businessId).eq('gizli', false).order('sira');
  const { data: urunler } = await db.from('menu_urunleri').select('*').eq('business_id', businessId).eq('aktif', true);

  if (!kategoriler || kategoriler.length === 0) return;

  const menuContainer = document.getElementById('tab-menu');
  if (!menuContainer) return;

  // Kategori chips güncelle
  const catChips = kategoriler.map(k => `
    <div class="menu-cat-chip" onclick="switchMenuCat(this,'${k.id}')">${k.ikon || ''} ${k.ad}</div>
  `).join('');

  // Ürünleri kategoriye göre grupla
  const menuHTML = kategoriler.map(kat => {
    const katUrunler = (urunler || []).filter(u => u.kategori_id === kat.id);
    if (katUrunler.length === 0) return '';
    return `
      <h3 class="menu-section-title">${kat.ikon || '🍽️'} ${kat.ad}</h3>
      <div class="menu-items">
        ${katUrunler.map(u => `
          <div class="menu-item">
            <div class="menu-item-img">${u.gorsel_url ? `<img src="${u.gorsel_url}" style="width:100%;height:100%;object-fit:cover;border-radius:12px">` : '🍽️'}</div>
            <div class="menu-item-body">
              <div class="menu-item-name">${u.ad}</div>
              <div class="menu-item-desc">${u.aciklama || ''}</div>
            </div>
            <div class="menu-item-right">
              <div class="menu-item-price">₺${u.fiyat || '—'}</div>
              <div class="menu-item-status ${u.aktif ? 'status-available' : 'status-out'}">${u.aktif ? '● Mevcut' : '○ Tükendi'}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }).join('');

  // Mevcut içeriği koru, sadece kategori ve menü kısmını güncelle
  const existingSearch = menuContainer.querySelector('.menu-search-box');
  menuContainer.innerHTML = '';
  if (existingSearch) menuContainer.appendChild(existingSearch);

  const catDiv = document.createElement('div');
  catDiv.className = 'menu-categories';
  catDiv.innerHTML = `<div class="menu-cat-chip active" onclick="switchMenuCat(this,'all')">Tümü</div>` + catChips;
  menuContainer.appendChild(catDiv);

  const menuDiv = document.createElement('div');
  menuDiv.id = 'menuContent';
  menuDiv.innerHTML = menuHTML;
  menuContainer.appendChild(menuDiv);
}

// ================================================
// KULLANICININ İŞLETMESİNİ YÜKLEme
// ================================================
async function loadUserBusiness(userId) {
  const { data } = await db.from('businesses').select('*').eq('user_id', userId).single();
  if (data) currentBusiness = data;
}

// ================================================
// REZERVASyon
// ================================================
async function createRezervasyon(formData) {
  if (!window._currentProfileId) return;
  showLoading('rezervasyonBtn', 'Gönderiliyor...');
  const { error } = await db.from('rezervasyonlar').insert({
    business_id: window._currentProfileId,
    user_id: currentUser?.id || null,
    musteri_adi: formData.musteri_adi,
    musteri_telefon: formData.musteri_telefon,
    tarih: formData.tarih,
    saat: formData.saat,
    kisi_sayisi: formData.kisi_sayisi,
    ozel_istek: formData.ozel_istek,
    durum: 'beklemede'
  });
  hideLoading('rezervasyonBtn', 'Rezervasyon Talebi Gönder');
  if (error) { showToast('❌ Hata: ' + hataMetni(error.message)); return; }
  showToast('✅ Rezervasyonunuz alındı!');
}

// ================================================
// FAVORİLER
// ================================================
async function toggleFavorite(businessId, btn) {
  if (!currentUser) { openModal('loginModal'); return; }
  const { data: existing } = await db.from('favoriler').select('id').eq('user_id', currentUser.id).eq('business_id', businessId).single();
  if (existing) {
    await db.from('favoriler').delete().eq('id', existing.id);
    btn.textContent = '🤍';
    btn.classList.remove('active');
  } else {
    await db.from('favoriler').insert({ user_id: currentUser.id, business_id: businessId });
    btn.textContent = '❤️';
    btn.classList.add('active');
  }
}

// ================================================
// YORUM
// ================================================
async function submitYorum(puan, yorum) {
  if (!currentUser) { openModal('loginModal'); return; }
  if (!window._currentProfileId) return;
  const { error } = await db.from('yorumlar').insert({
    business_id: window._currentProfileId,
    user_id: currentUser.id,
    puan,
    yorum,
    durum: 'onaylı'
  });
  if (error) { showToast('❌ ' + hataMetni(error.message)); return; }
  showToast('✅ Yorumunuz eklendi!');
}

// ================================================
// ARAMA
// ================================================
async function searchBusinesses(q) {
  if (!q || q.length < 2) { await loadBusinesses(); return; }
  await loadBusinesses({ search: q });
}

// ================================================
// YARDIMCI FONKSİYONLAR
// ================================================
function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = 'position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);background:#1A1208;color:#F5F0E8;padding:0.85rem 1.5rem;border-radius:12px;font-family:DM Sans,sans-serif;font-size:0.9rem;font-weight:600;z-index:9999;box-shadow:0 8px 32px rgba(0,0,0,0.3);transition:opacity 0.3s;';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  setTimeout(() => { toast.style.opacity = '0'; }, 3000);
}

function showError(elId, msg) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
}

function showLoading(btnId, msg) {
  const btn = document.getElementById(btnId);
  if (btn) { btn.textContent = msg; btn.disabled = true; }
}

function hideLoading(btnId, msg) {
  const btn = document.getElementById(btnId);
  if (btn) { btn.textContent = msg; btn.disabled = false; }
}

function hataMetni(msg) {
  const hatalar = {
    'Invalid login credentials': 'E-posta veya şifre hatalı.',
    'Email not confirmed': 'E-posta adresinizi doğrulayın.',
    'User already registered': 'Bu e-posta zaten kayıtlı.',
    'Password should be at least 6 characters': 'Şifre en az 6 karakter olmalı.',
  };
  return hatalar[msg] || msg;
}

// Demo restoranlar (veritabanı boşsa gösterilir)
const demoRestaurants = [
  { id:'demo1', emoji:'🍕', name:'La Bella Cucina', cat:'İtalyan Mutfağı', location:'Kadıköy, İstanbul', rating:4.8, reviews:312, tags:['İtalyan','Pizza'], badge:'open', badgeText:'Açık' },
  { id:'demo2', emoji:'🍣', name:'Sushi Nakama', cat:'Japon Mutfağı', location:'Beşiktaş, İstanbul', rating:4.6, reviews:187, tags:['Japon','Sushi'], badge:'open', badgeText:'Açık' },
  { id:'demo3', emoji:'☕', name:'Brew & Roast', cat:'Kafe', location:'Beyoğlu, İstanbul', rating:4.9, reviews:543, tags:['Kahve','Kahvaltı'], badge:'open', badgeText:'Açık' },
  { id:'demo4', emoji:'🥙', name:'Ocakbaşı Erzurum', cat:'Türk Mutfağı', location:'Fatih, İstanbul', rating:4.7, reviews:298, tags:['Kebap','Türk'], badge:'open', badgeText:'Açık' },
  { id:'demo5', emoji:'🍔', name:'Smash Burger Co.', cat:'Fast Food', location:'Şişli, İstanbul', rating:4.4, reviews:156, tags:['Burger','Fast Food'], badge:'open', badgeText:'Açık' },
  { id:'demo6', emoji:'🌱', name:'Green Bowl', cat:'Vegan & Sağlıklı', location:'Nişantaşı, İstanbul', rating:4.5, reviews:89, tags:['Vegan','Salata'], badge:'open', badgeText:'Açık' },
];

// Uygulamayı başlat
document.addEventListener('DOMContentLoaded', initApp);
