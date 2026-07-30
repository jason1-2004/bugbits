# BugBits Monetization Guide

## Complete Publishing & Revenue Guide

This guide explains how to publish BugBits and start
earning revenue through your WeChat account.

---

## Option A: WeChat Mini Game (Recommended)

### Step 1: Register WeChat Mini Program
1. Go to https://mp.weixin.qq.com/
2. Click Register > Mini Program > Individual
3. Complete registration with your WeChat account
4. Pay the 300 RMB verification fee (one-time)
5. Note your AppID from Settings page

### Step 2: Set Up Developer Tools
1. Download WeChat Dev Tools
2. Install and login with your WeChat account
3. Create project: Type=Mini Game, use wechat_minigame/ dir
4. Enter your AppID from Step 1

### Step 3: Enable Ad Monetization
1. WeChat MP Backend > Settings > Ad Management
2. Enable: Rewarded Video, Interstitial, Banner
3. Copy each ad Unit ID
4. In game_monetize.js, replace the 3 ad IDs

### Step 4: Submit & Publish
1. Dev Tools > Upload (version 1.0.0)
2. Backend > Version Management > Submit for Review
3. Wait 1-7 days for approval
4. Click Release

### Revenue Payment
- Ads revenue settled monthly to WeChat Pay
- Minimum payout: 100 RMB
- Backend > Finance > Revenue to withdraw

---

## Option B: Web Publishing (Global)

### Hosting (Free)
- GitHub Pages: Upload bugbits-web/ to a repo, enable Pages
- Netlify: Drag-drop bugbits-web/ folder
- Vercel: Connect GitHub repo

### Ad Networks
- Google AdSense (Global)
- Baidu Union (China)
- Pangle / TikTok Ads (China)

---

## Revenue Optimization
- Rewarded Video: Highest CPM 20-80 RMB/1000 views
- Interstitial: Every 3 levels, min 45s interval
- Banner: Persistent during gameplay
- Daily Rewards: Streak-based retention booster
- Analytics: Track user behavior

## Pre-Publish Checklist
- [ ] Replace all 3 ad IDs in game_monetize.js
- [ ] Test locally: open bugbits-web/game.html
- [ ] Register WeChat Mini Program account
- [ ] Configure ad slots in WeChat backend
- [ ] Upload and submit for review
- [ ] Release and monitor revenue

## Files Created/Modified
- bugbits-web/game_monetize.js: Audio + Ads + Shop + Analytics
- bugbits-web/game.html: Updated to load monetize script
- wechat_minigame/: WeChat Mini Game project structure
- bugbits-web/MONETIZATION_GUIDE.md: This guide

Good luck! The monetization infrastructure is ready.
Now publish and grow your audience.
