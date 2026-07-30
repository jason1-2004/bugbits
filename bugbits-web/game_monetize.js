// ============================================================
// BugBits Web - Monetization System (game_monetize.js)
// Audio + Ads + Shop + Analytics + Daily Rewards
// Load AFTER game.js. Replace ad IDs before publishing.
// ============================================================

(function(){
'use strict';

// ===== 1. AUDIO SYSTEM (Web Audio API) =====
var AudioSys = {
  ctx: null, enabled: true,
  init: function() {
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch(e) { this.enabled = false; return; }
    var self = this;
    function resume() { if (self.ctx && self.ctx.state === 'suspended') self.ctx.resume(); }
    document.addEventListener('click', resume, { once: true });
    document.addEventListener('touchstart', resume, { once: true });
  },
  _tone: function(freq, dur, type, vol) {
    if (!this.enabled || !this.ctx) return;
    try {
      var osc = this.ctx.createOscillator();
      var gain = this.ctx.createGain();
      osc.type = type || 'square';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(vol || 0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + (dur || 0.2));
      osc.connect(gain); gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime);
      osc.stop(this.ctx.currentTime + (dur || 0.2));
    } catch(e) {}
  },
  _noise: function(dur, vol) {
    if (!this.enabled || !this.ctx) return;
    try {
      var sr = this.ctx.sampleRate || 44100;
      var len = Math.floor(sr * (dur || 0.2));
      var buf = this.ctx.createBuffer(1, len, sr);
      var data = buf.getChannelData(0);
      for (var i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / len) * (1 - i / len);
      }
      var src = this.ctx.createBufferSource();
      src.buffer = buf;
      var g = this.ctx.createGain();
      g.gain.setValueAtTime(vol || 0.12, this.ctx.currentTime);
      src.connect(g); g.connect(this.ctx.destination);
      src.start(this.ctx.currentTime);
    } catch(e) {}
  },
  // --- Game Sound Effects ---
  spawn: function() { this._tone(880, 0.08, 'sine', 0.12); },
  hit: function() { this._noise(0.08, 0.1); },
  collect: function() { this._tone(1200, 0.06, 'sine', 0.1); this._tone(1600, 0.06, 'sine', 0.08); },
  hurt: function() { this._noise(0.15, 0.15); this._tone(150, 0.15, 'sawtooth', 0.1); },
  win: function() {
    var self = this;
    this._tone(523, 0.15, 'sine', 0.15);
    setTimeout(function() { self._tone(659, 0.15, 'sine', 0.15); }, 150);
    setTimeout(function() { self._tone(784, 0.25, 'sine', 0.18); }, 300);
  },
  lose: function() {
    var self = this;
    this._tone(400, 0.2, 'sawtooth', 0.12);
    setTimeout(function() { self._tone(300, 0.3, 'sawtooth', 0.1); }, 200);
  },
  boss: function() { this._tone(220, 0.4, 'square', 0.15); },
  click: function() { this._tone(660, 0.05, 'sine', 0.08); },
  buy: function() { this._tone(523, 0.1, 'sine', 0.12); var self = this; setTimeout(function() { self._tone(784, 0.1, 'sine', 0.12); }, 100); },
  reward: function() {
    var self = this;
    this._tone(880, 0.12, 'sine', 0.15);
    setTimeout(function() { self._tone(1100, 0.12, 'sine', 0.15); }, 120);
    setTimeout(function() { self._tone(1320, 0.2, 'sine', 0.18); }, 240);
  }
};

// ===== 2. AD SYSTEM (Web + WeChat dual platform) =====
var AdSys = {
  cfg: {
    rwdId: 'REPLACE_WITH_REWARDED_AD_ID',
    intId: 'REPLACE_WITH_INTERSTITIAL_AD_ID',
    banId: 'REPLACE_WITH_BANNER_AD_ID',
    minInt: 45, intEvery: 3,
    en: { banner: true, interstitial: true, rewarded: true }
  },
  plat: 'web', ses: 0, lastInt: 0, lvCnt: 0,
  st: { rwdV: 0, intV: 0, banV: 0, rev: 0 },
  _bannerAd: null,

  init: function() {
    if (typeof wx !== 'undefined' && wx && wx.createRewardedVideoAd) this.plat = 'wechat';
    try {
      var saved = JSON.parse(localStorage.getItem('bb_ad') || '{}');
      if (saved.s) this.ses = saved.s;
      if (saved.r) this.st.rev = saved.r;
      if (saved.v) this.st.rwdV = saved.v;
    } catch(e) {}
  },
  save: function() {
    try { localStorage.setItem('bb_ad', JSON.stringify({ s: this.ses, r: this.st.rev, v: this.st.rwdV })); } catch(e) {}
  },

  // --- Rewarded Video Ad ---
  rwd: function(callback) {
    AudioSys.click();
    if (this.plat === 'wechat') {
      try {
        var ad = wx.createRewardedVideoAd({ adUnitId: this.cfg.rwdId });
        ad.onLoad(function() { ad.show(); });
        ad.onClose(function(res) {
          if (res && res.isEnded) { AudioSys.reward(); if (callback) callback(true); }
          else { if (callback) callback(false); }
        });
        ad.onError(function(err) { console.warn('[Ad]', err); if (callback) callback(false); });
      } catch(e) { if (callback) callback(false); }
    } else {
      // Web: simulated rewarded ad
      this.st.rwdV++;
      this.st.rev += 0.03;
      this.save();
      AudioSys.reward();
      if (callback) callback(true);
    }
  },

  // --- Interstitial Ad ---
  int: function() {
    if (!this.cfg.en.interstitial) return false;
    var now = Date.now() / 1000;
    if (now - this.lastInt < this.cfg.minInt) return false;
    this.lastInt = now;
    this.lvCnt++;
    if (this.lvCnt % this.cfg.intEvery !== 0) return false;
    AudioSys.click();
    if (this.plat === 'wechat') {
      try { wx.createInterstitialAd({ adUnitId: this.cfg.intId }).show(); } catch(e) {}
    } else {
      this.st.intV++; this.st.rev += 0.01; this.save();
    }
    return true;
  },

  // --- Banner Ad ---
  ban: function(visible) {
    if (!this.cfg.en.banner) return;
    if (this.plat === 'wechat') {
      try {
        if (!this._bannerAd) {
          this._bannerAd = wx.createBannerAd({
            adUnitId: this.cfg.banId,
            style: { left: 0, top: 0, width: 320, height: 50 }
          });
        }
        if (visible) this._bannerAd.show(); else this._bannerAd.hide();
      } catch(e) {}
    } else {
      this.st.banV++;
    }
  },

  // --- Revenue Display ---
  revFmt: function() { return '¥' + (this.st.rev * 7).toFixed(2) + ' (est.)'; }
};

// ===== 3. SHOP / IN-APP PURCHASES =====
var Shop = {
  items: [
    { id: 'n_s', n: 'Small Nectar', d: '+60 Nectar (Starter Deal)', p: 1, nec: 60, ess: 0, hot: true },
    { id: 'n_m', n: 'Medium Nectar', d: '+150 Nectar', p: 3, nec: 150, ess: 0 },
    { id: 'n_l', n: 'Large Nectar', d: '+400 Nectar', p: 6, nec: 400, ess: 0, hot: true },
    { id: 'e_s', n: 'Small Essence', d: '+200 Essence', p: 6, nec: 0, ess: 200 },
    { id: 'e_l', n: 'Large Essence', d: '+500 Essence', p: 12, nec: 0, ess: 500, hot: true },
    { id: 'noads', n: 'Remove Ads', d: 'Remove all ads permanently', p: 18, nec: 0, ess: 0 },
    { id: 'allun', n: 'Full Unlock', d: 'Unlock all levels + Boss Rush', p: 30, nec: 0, ess: 0, hot: true },
    { id: 'start', n: 'Starter Kit', d: '+100 Nectar +100 Essence +base bugs', p: 12, nec: 100, ess: 100 }
  ],
  adFree: false, spent: 0,

  init: function() {
    try { this.adFree = localStorage.getItem('bb_nf') === '1'; this.spent = parseInt(localStorage.getItem('bb_sp') || '0'); } catch(e) {}
  },

  buy: function(id, callback) {
    var item = null;
    for (var i = 0; i < this.items.length; i++) { if (this.items[i].id === id) { item = this.items[i]; break; } }
    if (!item) { if (callback) callback(false, 'Unknown item'); return; }
    if (id === 'noads' && this.adFree) { if (callback) callback(false, 'Already purchased'); return; }
    AudioSys.click();
    // Process payment (simulated - replace with actual payment SDK)
    this._process(item, callback);
  },

  _process: function(item, callback) {
    AudioSys.buy();
    // Apply item effects
    if (item.nec > 0) {
      if (typeof nectar !== 'undefined') { nectar += item.nec; if (typeof playerBase !== 'undefined' && playerBase) playerBase.nectar = nectar; }
    }
    if (item.ess > 0) {
      if (typeof essence !== 'undefined') { essence += item.ess; localStorage.setItem('bb_e', String(essence)); }
    }
    if (item.id === 'noads') {
      this.adFree = true; localStorage.setItem('bb_nf', '1');
      AdSys.cfg.en.banner = false; AdSys.cfg.en.interstitial = false;
      if (AdSys.plat === 'wechat') { try { if (AdSys._bannerAd) AdSys._bannerAd.hide(); } catch(e) {} }
    }
    if (item.id === 'allun') {
      for (var j = 0; j < LEVELS.length; j++) { if (completed.indexOf(LEVELS[j].x) < 0) completed.push(LEVELS[j].x); }
      localStorage.setItem('bb_d', JSON.stringify(completed));
    }
    if (item.id === 'start') {
      var bugs = ['ant', 'bee', 'littlebeetle', 'wildbee', 'militant'];
      for (var k = 0; k < bugs.length; k++) { if (unlocked.indexOf(bugs[k]) < 0) unlocked.push(bugs[k]); }
      localStorage.setItem('bb_u', JSON.stringify(unlocked));
    }
    this.spent += item.p; localStorage.setItem('bb_sp', String(this.spent));
    Analytics.track('purchase', { id: item.id, price: item.p });
    showHint('Purchased! ' + item.n);
    if (typeof updateHUD === 'function') updateHUD();
    if (callback) callback(true, null);
  },

  show: function() {
    var existing = document.getElementById('shop-pnl');
    if (existing) { existing.classList.add('active'); return; }
    var div = document.createElement('div'); div.className = 'pnl'; div.id = 'shop-pnl';
    var h = '<h2 style="color:#ff9800;margin-bottom:15px">f4b0 Shop</h2>';
    for (var i = 0; i < this.items.length; i++) {
      var it = this.items[i];
      var style = 'background:rgba(255,255,255,.08);border:2px solid rgba(255,152,0,.3);border-radius:10px;padding:14px;margin:8px auto;max-width:400px;cursor:pointer;display:flex;justify-content:space-between;align-items:center';
      if (it.hot) style += ';border-color:#FF9800;box-shadow:0 0 8px rgba(255,152,0,.3)';
      h += '<div style="' + style + '" data-id="' + it.id + '">';
      h += '<div><div style="font-weight:bold;color:#FFB74D">' + it.n + '</div><div style="color:#aaa;font-size:12px">' + it.d + '</div></div>';
      h += '<div style="text-align:right"><div style="color:#4CAF50;font-weight:bold;font-size:18px">¥' + it.p + '</div></div></div>';
    }
    h += '<div style="color:#888;font-size:12px;margin:12px auto;max-width:400px;text-align:center">f512 All transactions are secure and processed by third-party payment providers.</div>';
    h += '<button class="mbtn sec" id="shop-close">Close</button>';
    h += '<div style="color:#666;font-size:11px;margin-top:10px;text-align:center" id="shop-stats">f4b0 Spent: ¥' + this.spent + ' | Ad Revenue: ' + AdSys.revFmt() + '</div>';
    div.innerHTML = h;
    div.querySelectorAll('[data-id]').forEach(function(el) {
      el.addEventListener('click', function() { Shop.buy(this.dataset.id, function(ok, err) { if (ok) showHint('Purchased!'); else showHint(err); }); });
    });
    div.querySelector('#shop-close').addEventListener('click', function() { div.classList.remove('active'); });
    document.getElementById('gc').appendChild(div); div.classList.add('active');
    AudioSys.click();
  },

  addBtn: function() {
    var m = document.querySelector('#main-menu .mbtns');
    if (!m) return;
    var b = document.createElement('button'); b.className = 'mbtn';
    b.textContent = '💰 Shop';
    b.style.background = 'linear-gradient(#FF9800,#E65100)';
    b.style.borderColor = '#FFB74D';
    b.addEventListener('click', function() { Shop.show(); });
    m.appendChild(b);
  }
};

// ===== 4. ANALYTICS =====
var Analytics = {
  init: function() {
    var today = new Date().toDateString();
    var lastDate = localStorage.getItem('bb_ld');
    var streak = parseInt(localStorage.getItem('bb_sk') || '0');
    if (lastDate !== today) {
      var yesterday = new Date(Date.now() - 86400000).toDateString();
      streak = (lastDate === yesterday) ? streak + 1 : 1;
      localStorage.setItem('bb_sk', String(streak));
      localStorage.setItem('bb_ld', today);
    }
    var sessionNum = parseInt(localStorage.getItem('bb_sn') || '0') + 1;
    localStorage.setItem('bb_sn', String(sessionNum));
    AdSys.ses = sessionNum;
    this.track('session_start', { sn: sessionNum, sk: streak });
  },

  track: function(event, data) {
    try {
      var log = JSON.parse(localStorage.getItem('bb_ev') || '[]');
      log.push({ e: event, t: Date.now(), d: data || {} });
      if (log.length > 500) log.splice(0, log.length - 500);
      localStorage.setItem('bb_ev', JSON.stringify(log));
    } catch(e) {}
  },

  stats: function() {
    return {
      sn: parseInt(localStorage.getItem('bb_sn') || '0'),
      sk: parseInt(localStorage.getItem('bb_sk') || '0'),
      ess: parseInt(localStorage.getItem('bb_e') || '0'),
      lv: (JSON.parse(localStorage.getItem('bb_d') || '[]')).length,
      bs: (JSON.parse(localStorage.getItem('bb_b') || '[]')).length,
      nf: localStorage.getItem('bb_nf') === '1',
      sp: parseInt(localStorage.getItem('bb_sp') || '0')
    };
  },

  dash: function() {
    var d = this.stats();
    var existing = document.getElementById('stats-pnl');
    if (existing) { existing.classList.add('active'); return; }
    var h = '<h2 style="color:#2196F3">📊 Analytics & Stats</h2><div class="rstats">';
    h += '📅 Sessions: ' + d.sn + '<br>';
    h += '🔥 Streak: ' + d.sk + ' days<br>';
    h += '🫠 Essence: ' + d.ess + '<br>';
    h += '✅ Levels Completed: ' + d.lv + '<br>';
    h += '👑 Bosses Defeated: ' + d.bs + '<br>';
    h += '💰 Money Spent: ¥' + d.sp + '<br>';
    h += '📢 Ad Revenue: ' + AdSys.revFmt() + '<br>';
    if (d.nf) h += '🔕 No Ads (Purchased)<br>';
    h += '</div>';
    var p = document.createElement('div'); p.className = 'pnl'; p.id = 'stats-pnl'; p.innerHTML = h;
    var b = document.createElement('button'); b.className = 'mbtn sec';
    b.textContent = 'Close'; b.addEventListener('click', function() { p.classList.remove('active'); });
    p.appendChild(b);
    document.getElementById('gc').appendChild(p); p.classList.add('active');
  },

  addBtn: function() {
    var m = document.querySelector('#main-menu .mbtns');
    if (m) {
      var b = document.createElement('button'); b.className = 'mbtn sec';
      b.textContent = '📊 Analytics';
      b.addEventListener('click', function() { Analytics.dash(); });
      m.appendChild(b);
    }
  }
};

// ===== 5. DAILY REWARD =====
var Daily = {
  init: function() {
    var today = new Date().toDateString();
    var lastClaim = localStorage.getItem('bb_dl');
    var btn = document.getElementById('daily-btn');
    if (btn) btn.style.display = (lastClaim !== today) ? 'block' : 'none';
  },

  claim: function() {
    var today = new Date().toDateString();
    if (localStorage.getItem('bb_dl') === today) { showHint('Already claimed today!'); return; }
    var streak = parseInt(localStorage.getItem('bb_sk') || '0');
    var reward = Math.min(30 + streak * 5, 100);
    if (typeof essence !== 'undefined') { essence += reward; localStorage.setItem('bb_e', String(essence)); }
    localStorage.setItem('bb_dl', today);
    var btn = document.getElementById('daily-btn');
    if (btn) btn.style.display = 'none';
    showHint('🎁 Daily Reward +' + reward + ' Essence! (Streak: ' + streak + ' days)');
    AudioSys.buy();
    if (typeof updateHUD === 'function') updateHUD();
    Analytics.track('daily_reward', { streak: streak, reward: reward });
  },

  addBtn: function() {
    var btn = document.createElement('button');
    btn.id = 'daily-btn';
    btn.style.cssText = 'position:fixed;top:10px;right:10px;z-index:200;padding:8px 16px;background:linear-gradient(#FFD700,#FFA000);border:none;border-radius:20px;color:#333;font-weight:bold;font-size:14px;cursor:pointer;box-shadow:0 2px 10px rgba(255,215,0,.5);display:none';
    btn.textContent = '🎁 Daily Reward';
    btn.addEventListener('click', function() { Daily.claim(); });
    document.body.appendChild(btn);
  }
};

// ===== 6. REWARDED AD FEATURES =====
var Rwd = {
  double: function(essGain) {
    var rp = document.getElementById('results');
    if (!rp) return;
    var existing = rp.querySelector('.dbl-btn');
    if (existing) existing.remove();
    var b = document.createElement('button');
    b.className = 'mbtn dbl-btn';
    b.style.cssText = 'background:linear-gradient(#FF6F00,#E65100);border-color:#FFB74D;font-size:16px;margin-top:10px';
    b.textContent = '📺 Double Essence (Watch Ad)';
    var self = this;
    b.addEventListener('click', function() {
      b.disabled = true; b.textContent = 'Loading...';
      AdSys.rwd(function(ok) {
        if (ok) {
          if (typeof essence !== 'undefined') { essence += essGain; localStorage.setItem('bb_e', String(essence)); }
          b.textContent = '✅ +' + essGain + ' Essence!'; b.style.background = 'linear-gradient(#4CAF50,#2E7D32)';
          AudioSys.buy(); showHint('🎉 Double Essence claimed!');
          if (typeof updateHUD === 'function') updateHUD();
          Analytics.track('double_reward', { gain: essGain });
        } else {
          b.disabled = false; b.textContent = '📺 Try Again';
        }
      });
    });
    rp.appendChild(b);
  },

  nectar: function() {
    if (typeof state === 'undefined' || (state !== 'playing' && state !== 'bossfight')) return;
    AudioSys.click();
    AdSys.rwd(function(ok) {
      if (ok) {
        if (typeof nectar !== 'undefined') nectar += 25;
        if (typeof playerBase !== 'undefined' && playerBase) playerBase.nectar = nectar;
        if (typeof updateHUD === 'function') updateHUD();
        showHint('+25 Nectar (Ad)');
        Analytics.track('nectar_ad', {});
      }
    });
  }
};

// ===== 7. HOOK INTO GAME ENGINE =====
var _origResults, _origInit, _origDmg;

function hook() {
  // Initialize subsystems
  AudioSys.init(); AdSys.init(); Shop.init(); Analytics.init();
  Daily.addBtn(); Shop.addBtn(); Analytics.addBtn();

  // Hook showResults (win/lose screen)
  if (typeof showResults === 'function') {
    _origResults = showResults;
    showResults = function(victory) {
      _origResults(victory);
      if (victory) {
        AudioSys.win();
        var eg = Math.floor(10 + (typeof gTime !== 'undefined' ? gTime : 0) * 0.1);
        setTimeout(function() { AdSys.int(); }, 500);
        setTimeout(function() { Rwd.double(eg); }, 300);
        Analytics.track('level_win', { lv: typeof selLv !== 'undefined' ? selLv : '?', t: typeof gTime !== 'undefined' ? gTime : 0 });
      } else {
        AudioSys.lose();
        Analytics.track('level_lose', { lv: typeof selLv !== 'undefined' ? selLv : '?', t: typeof gTime !== 'undefined' ? gTime : 0 });
      }
    };
  }

  // Hook initLevel
  if (typeof initLevel === 'function') {
    _origInit = initLevel;
    initLevel = function(lv) {
      _origInit(lv);
      AdSys.ban(true);
      Analytics.track('level_start', { lv: lv ? lv.x : '?' });
    };
  }

  // Hook takeDmg for audio
  if (typeof takeDmg === 'function') {
    _origDmg = takeDmg;
    takeDmg = function(entity, dmg) {
      _origDmg(entity, dmg);
      if (entity === playerBase || (entity && entity.team === 'p')) AudioSys.hurt();
    };
  }

  // Daily reward check after DOM ready
  setTimeout(function() { Daily.init(); }, 500);

  // Add emergency nectar button
  setTimeout(function() {
    var bp = document.getElementById('bug-panel');
    if (bp) {
      var nb = document.createElement('button'); nb.className = 'bbtn';
      nb.style.cssText = 'width:auto;padding:0 10px;background:rgba(255,152,0,.3);border-color:#FF9800;font-size:13px';
      nb.textContent = '📺+🍯'; nb.title = 'Watch ad for Nectar';
      nb.addEventListener('click', function() { Rwd.nectar(); });
      bp.appendChild(nb);
    }
  }, 1000);

  // Console info
  console.log('%c BugBits Monetization Active', 'font-size:18px;color:#4CAF50;font-weight:bold');
  console.log('%c Platform: ' + AdSys.plat, 'color:#FF9800;font-weight:bold');

  // Add ad stats to options panel
  setTimeout(function() {
    var o = document.getElementById('options');
    if (o) {
      var s = document.createElement('div');
      s.style.cssText = 'color:#666;font-size:11px;margin-top:20px;border-top:1px solid #333;padding-top:10px';
      s.innerHTML = '📊 Ads: ' + AdSys.st.rwdV + ' rewarded | ' + AdSys.st.intV + ' interstitial | ' + AdSys.st.banV + ' banner<br>' + '💰 Est. Revenue: ' + AdSys.revFmt() + '<br>' + '💡 Replace ad IDs in game_monetize.js with real values before publishing to earn money';
      o.appendChild(s);
    }
  }, 1500);
}

if (document.readyState === 'complete') hook();
else window.addEventListener('load', hook);

})();