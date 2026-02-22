// ================================================
// FORM HANDLER FONKSİYONLARI
// Bu kodları supabase-integration.js dosyasının
// en SONUNA ekle (son satırdan önce)
// ================================================

function handleLogin() {
  const email = document.querySelector('#loginModal input[type="email"]').value.trim();
  const password = document.getElementById('loginPass').value;
  if (!email || !password) { showToast('⚠️ E-posta ve şifre girin.'); return; }
  
  // Hata alanı oluştur
  let errEl = document.getElementById('loginError');
  if (!errEl) {
    errEl = document.createElement('p');
    errEl.id = 'loginError';
    errEl.style.cssText = 'color:#C04E2A;font-size:0.82rem;margin-bottom:0.5rem;display:none';
    document.getElementById('loginPass').parentNode.after(errEl);
  }
  errEl.style.display = 'none';

  // Login butonu güncelle
  const btn = document.querySelector('#loginModal .btn-primary');
  if (btn) { btn.id = 'loginBtn'; }

  signIn(email, password);
}

function handleRegister() {
  const modal = document.getElementById('registerModal');
  const inputs = modal.querySelectorAll('input');
  const ad = inputs[0]?.value.trim();
  const soyad = inputs[1]?.value.trim();
  const email = inputs[2]?.value.trim();
  const telefon = inputs[3]?.value.trim();
  const password = document.getElementById('regPass')?.value;
  const password2 = document.getElementById('regPass2')?.value;
  const kvkk = document.getElementById('kvkk')?.checked;

  if (!ad || !soyad || !email || !password) { showToast('⚠️ Zorunlu alanları doldurun.'); return; }
  if (password !== password2) { showToast('⚠️ Şifreler eşleşmiyor.'); return; }
  if (!kvkk) { showToast('⚠️ Sözleşmeyi onaylayın.'); return; }
  if (password.length < 6) { showToast('⚠️ Şifre en az 6 karakter olmalı.'); return; }

  const btn = document.querySelector('#registerModal .btn-primary');
  if (btn) btn.id = 'registerBtn';

  let errEl = document.getElementById('registerError');
  if (!errEl) {
    errEl = document.createElement('p');
    errEl.id = 'registerError';
    errEl.style.cssText = 'color:#C04E2A;font-size:0.82rem;margin-bottom:0.5rem;display:none';
    btn?.before(errEl);
  }

  signUp(email, password, ad, soyad, telefon);
}

function handleBusinessRegister() {
  const modal = document.getElementById('businessModal');
  const inputs = modal.querySelectorAll('input');
  const selects = modal.querySelectorAll('select');

  const isletme_adi = inputs[0]?.value.trim();
  const yetkili_adi = inputs[1]?.value.trim();
  const email = inputs[2]?.value.trim();
  const telefon = inputs[3]?.value.trim();
  const il = selects[0]?.value;
  const ilce = inputs[4]?.value.trim();
  const isletme_turu = selects[1]?.value;

  if (!isletme_adi || !yetkili_adi || !email || !telefon) {
    showToast('⚠️ Zorunlu alanları doldurun.');
    return;
  }

  if (!currentUser) {
    closeModal('businessModal');
    openModal('loginModal');
    showToast('⚠️ Önce giriş yapın.');
    return;
  }

  const btn = document.querySelector('#businessModal .btn-primary');
  if (btn) btn.id = 'businessBtn';

  let errEl = document.getElementById('businessError');
  if (!errEl) {
    errEl = document.createElement('p');
    errEl.id = 'businessError';
    errEl.style.cssText = 'color:#C04E2A;font-size:0.82rem;margin-bottom:0.5rem;display:none';
    btn?.before(errEl);
  }

  registerBusiness({ isletme_adi, yetkili_adi, email, telefon, il, ilce, isletme_turu });
}

// Rezervasyon form handler
function handleRezervasyon() {
  const inputs = document.querySelectorAll('#tab-reservation input, #tab-reservation select, #tab-reservation textarea');
  const musteri_adi = inputs[0]?.value.trim();
  const musteri_telefon = inputs[1]?.value.trim();
  const tarih = inputs[2]?.value;
  const saat = inputs[3]?.value;
  const kisi_sayisi = inputs[4]?.value;
  const ozel_istek = inputs[5]?.value;

  if (!musteri_adi || !musteri_telefon || !tarih || !saat) {
    showToast('⚠️ Zorunlu alanları doldurun.');
    return;
  }

  const btn = document.querySelector('#tab-reservation .btn-primary');
  if (btn) btn.id = 'rezervasyonBtn';

  createRezervasyon({ musteri_adi, musteri_telefon, tarih, saat, kisi_sayisi, ozel_istek });
}

// Rezervasyon butonunu güncelle
document.addEventListener('DOMContentLoaded', () => {
  const rezBtn = document.querySelector('#tab-reservation .btn-primary');
  if (rezBtn) rezBtn.setAttribute('onclick', 'handleRezervasyon()');
});
