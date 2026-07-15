# 🧪 SPLASH SCREEN TESTING GUIDE
**Date:** 2026-07-16 01:34
**Version:** Post-Optimization

---

## 🎯 Testing Objectives

1. ✅ Verify splash screen displays completely
2. ✅ Confirm loading time improved (<2s)
3. ✅ Check all animations working
4. ✅ Validate performance metrics

---

## 📋 Step-by-Step Testing

### Step 1: Clear Cache & Hard Refresh
\\\
Windows/Linux: Ctrl + Shift + R
Mac: Cmd + Shift + R
\\\

### Step 2: Open DevTools
\\\
Press F12 or Right-click → Inspect
\\\

### Step 3: Check Network Tab
**What to verify:**
- [ ] logotum.png loads first (preloaded)
- [ ] Total load time < 4s
- [ ] Fonts load asynchronously
- [ ] Font Awesome deferred

**Expected Timeline:**
- 0-500ms: Initial loader visible
- 500ms-1s: Logo and brand name appear
- 1-2s: React hydrates, splash animations start
- 2.5s: Transition to Welcome/Main app

### Step 4: Check Performance Tab
**Run Lighthouse Audit:**
1. Click "Performance" or "Lighthouse" tab
2. Generate report
3. Check scores:
   - [ ] Performance: >80
   - [ ] First Contentful Paint: <1.5s
   - [ ] Largest Contentful Paint: <3s
   - [ ] Time to Interactive: <4s

### Step 5: Visual Inspection
**Verify all elements visible:**
- [ ] Logo image appears
- [ ] "TumbasNa" text (green + orange)
- [ ] Ornamental divider with diamond
- [ ] Tagline text
- [ ] 3 floating leaves (animated)
- [ ] Loading dots (bouncing)
- [ ] Glow orbs (top green, bottom orange)
- [ ] Bottom gradient fade

### Step 6: Animation Check
**Verify smooth animations:**
- [ ] Logo fades in and scales
- [ ] Leaves float smoothly
- [ ] Loading dots bounce
- [ ] Glow orbs pulse
- [ ] Text fades up
- [ ] No jank or stuttering

---

## 🐛 Troubleshooting

### Issue: Logo doesn't appear
**Solutions:**
1. Check /logotum.png exists in public folder
2. Clear browser cache
3. Check console for 404 errors

### Issue: Animations not smooth
**Solutions:**
1. Close other browser tabs
2. Check CPU usage
3. Try incognito mode
4. Check GPU acceleration enabled

### Issue: Still loading slow
**Solutions:**
1. Check network throttling disabled
2. Verify preload tags in index.html
3. Check for large bundle sizes
4. Run production build (npm run build)

### Issue: Elements missing
**Solutions:**
1. Verify Splash.tsx has all elements
2. Check Splash.css loaded
3. Clear cache completely
4. Check React DevTools for errors

---

## 📊 Performance Benchmarks

### Target Metrics:
| Metric | Target | Acceptable | Poor |
|--------|--------|------------|------|
| First Paint | <500ms | <1s | >1s |
| LCP | <2s | <3s | >3s |
| TTI | <3s | <4s | >4s |
| Total Load | <3s | <5s | >5s |

### Network Conditions Testing:

**Fast 3G:**
\\\
DevTools → Network → Throttling → Fast 3G
Expected: 3-5s total load
\\\

**Slow 3G:**
\\\
DevTools → Network → Throttling → Slow 3G
Expected: 5-8s total load
\\\

**Offline:**
\\\
Should show cached initial loader immediately
\\\

---

## ✅ Success Criteria

### Minimum Requirements:
- ✅ Logo visible within 1s
- ✅ All splash elements render
- ✅ Animations run smoothly (>30fps)
- ✅ Total load time < 5s (normal connection)
- ✅ No console errors

### Optimal Results:
- ⭐ Logo visible within 500ms
- ⭐ All elements with animations
- ⭐ Smooth 60fps animations
- ⭐ Total load time < 3s
- ⭐ Lighthouse Performance >90

---

## 📱 Mobile Testing

### Android (Chrome):
1. Open DevTools
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select mobile device
4. Test with throttling

### iOS (Safari):
1. Connect device via USB
2. Enable Web Inspector
3. Test on actual device
4. Check iOS-specific animations

---

## 🔧 DevTools Commands

### Check Preloaded Resources:
\\\javascript
// Run in Console
performance.getEntriesByType('resource')
  .filter(r => r.name.includes('logotum.png'))
  .map(r => ({ name: r.name, duration: r.duration, priority: r.initiatorType }))
\\\

### Check First Paint:
\\\javascript
// Run in Console
performance.getEntriesByType('paint')
  .map(p => ({ name: p.name, time: p.startTime }))
\\\

### Monitor Frame Rate:
\\\javascript
// Run in Console
let lastTime = performance.now();
let frames = 0;
function checkFPS() {
  frames++;
  const now = performance.now();
  if (now >= lastTime + 1000) {
    console.log('FPS:', frames);
    frames = 0;
    lastTime = now;
  }
  requestAnimationFrame(checkFPS);
}
checkFPS();
\\\

---

## 📝 Test Results Template

\\\
Date: ___________
Browser: ___________
Network: ___________

Visual Check:
[ ] Logo visible
[ ] Text visible
[ ] Leaves visible
[ ] Dots visible
[ ] Animations smooth

Performance:
First Paint: ______ ms
LCP: ______ ms
TTI: ______ ms
Total Load: ______ s

Network:
logotum.png: ______ ms
main.tsx: ______ ms
fonts: ______ ms

Score: _____ / 100
Notes: _________________
\\\

---

## 🚀 Next Actions

### If Tests Pass:
1. ✅ Mark optimization complete
2. ✅ Commit changes
3. ✅ Deploy to staging
4. ✅ Monitor production metrics

### If Tests Fail:
1. 📝 Document issues
2. 🔍 Debug root cause
3. 🔧 Apply fixes
4. 🔄 Retest

---

**Status:** Ready for Testing
**Expected Outcome:** All tests pass ✅
