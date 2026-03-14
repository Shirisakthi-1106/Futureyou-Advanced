# FutureYou - Text Input Examples for Testing

## Feature 1: Natural Language Input 🗣️

Copy and paste these into the "Describe Your Day" textarea on the Home page. Each will parse to different habit values and demonstrate the NLP capability.

### Example 1: Struggling Student (Bad Habits)
```
I've been really struggling lately. I only get about 3-4 hours of sleep because I'm always scrolling on my phone. 
I spend maybe 1 hour actually studying, but honestly I waste like 6-7 hours a day on TikTok and Instagram. 
I almost never exercise, maybe once a month if I'm feeling motivated. My diet is pretty bad - lots of fast food. 
My mental health is around a 3 out of 10, I'm constantly stressed. My mood is really low, like 2 or 3. 
Screen time is basically all my free time - probably 10+ hours a day.
```

### Example 2: Average Student (Mixed Habits)
```
I get a pretty normal amount of sleep, maybe 6-7 hours most nights. I try to study for about 3 hours a day, 
though some days I get more done than others. I probably spend 2-3 hours on social media daily. 
I go to the gym about twice a week. My diet is okay, nothing fancy but not terrible. 
My mood is around 6 out of 10, some good days and some bad days. Mental health rating is probably 6 as well. 
I'd say I'm on screens about 5 hours a day for entertainment and work.
```

### Example 3: Disciplined Student (Great Habits)
```
I'm pretty consistent with my sleep schedule - I get about 8-9 hours every night because I know it matters. 
I study hard, probably 6-7 hours a day across all my classes. I keep social media to a minimum, maybe 30 minutes to an hour. 
I exercise 5-6 times a week, it's become part of my routine. I eat pretty well, lots of fruits and vegetables. 
My mental health is strong, 8 or 9 out of 10. My mood is generally positive, also around 8-9. 
Screen time is maybe 3-4 hours a day and that includes productive work.
```

### Example 4: Burned Out Student (Critical Habits)
```
I'm completely exhausted. I sleep maybe 4-5 hours because I'm up till 2am every night either studying or just procrastinating. 
I probably only get 2-3 hours of actual focused study done. I'm on my phone constantly - easily 8+ hours of social media daily. 
I haven't exercised in months. My diet is basically energy drinks and junk food. 
My mental health is terrible, like a 2 out of 10. I'm severely stressed and depressed. 
My mood score is probably 1 or 2. Screen time is just... everything. 15+ hours a day easily.
```

### Example 5: Athletic Student (Exercise Focused)
```
I'm really into fitness. I work out 6-7 days a week, mix of cardio and weights. I sleep about 7-8 hours because recovery is important. 
My diet is pretty disciplined, lots of protein and healthy foods. I study reasonably well, maybe 3-4 hours daily. 
I don't spend much time on social media, maybe 1 hour max. My mental health is very good, 8-9 out of 10. 
My mood is upbeat, 8 out of 10. Screen time is low, only about 2-3 hours when you exclude studying.
```

### Example 6: Social Butterfly (High Social Media)
```
Honestly I'm pretty social. I spend a lot of time on my phone, probably 5-6 hours on social media every day just staying connected. 
I sleep okay, about 6 hours. I try to study maybe 2-3 hours but I get distracted a lot. 
I exercise maybe once or twice a week. Food is casual - whatever is convenient. 
My mental health is fine I guess, around 5-6 out of 10, I like being around people but it's a lot sometimes. 
Mood is generally okay, 6 out of 10. Total screen time is pretty high, like 8-9 hours including school stuff.
```

### Example 7: Balanced Life (Ideal Habits)
```
I try to keep things balanced. I sleep 7-8 hours most nights. I study seriously for about 4-5 hours daily. 
Social media is kept to maybe 1-2 hours. I exercise 3-4 times a week. My diet is decent - I cook sometimes but also use convenience. 
Mental health feels good, 7-8 out of 10. Mood is positive, around 7-8. Screen time total is about 4-5 hours which feels right.
```

### Example 8: Late Night Coder/Student (Night Owl)
```
I'm a night person. I usually sleep from 3am to 6am so only 3 hours but I'm productive at night. 
I study intense for like 5-6 hours but only late evening. I'm on my computer a lot for both work and scrolling, maybe 7 hours total. 
Social media probably 2 hours. Almost no exercise because my schedule is weird. Food is whatever I grab quickly. 
Mental health is like 4 out of 10, I'm isolated and tired. Mood is low, 3 out of 10. Just need sleep probably.
```

---

## Feature 5: Agentic Memory Chat 🤖

Copy these prompts into the Chat page to test the memory feature.

### First Conversation (After Initial Prediction)
```
What's my biggest challenge based on these habits?
```

```
Should I focus on sleep or study more?
```

```
Be honest - am I going to drop out based on this?
```

```
What's your biggest concern about my path?
```

```
If I make one change, what should it be?
```

### Second Conversation (After Creating Negative Habit Change)
```
I made some changes to my habits - things got worse. What do you see?
```

```
I've been slipping up lately. How bad is it?
```

```
Compare me to when we last talked.
```

```
Am I on the declining path now?
```

```
You were more optimistic before. What changed?
```

### Third Conversation (After Optimizing Habits)
```
I really committed to improving. How am I doing now?
```

```
Did you notice I fixed my sleep schedule?
```

```
I'm doing the optimized path, right?
```

```
Are you proud of the improvements I made?
```

```
What changed between our first conversation and now?
```

### General Conversation Starters
```
Tell me about my future in 5 years if I keep this up.
```

```
Which of my habits is secretly helping the most?
```

```
What would happen if I just quit everything and rested?
```

```
Do you think I have the mental health to succeed?
```

```
What's the one habit I'm overlooking that matters most?
```

```
Am I stressed because of my habits or something else?
```

```
Can I actually balance all this or should I pick one area?
```

```
Be my accountability partner - is my mood reflecting reality?
```

---

## Feature 2: SHAP Insights Context 🧠

These aren't text inputs, but here's what to expect to see after generating predictions with different habit profiles:

### High Sleep, High Study (Should See Positive Exam Impact)
Expected SHAP insights:
- Study Hours: **+15%** to exam score
- Sleep Hours: **+8%** to exam score  
- Screen Time: **-4%** to exam score

### Low Sleep, High Social Media (Should See Negative Impacts)
Expected SHAP insights:
- Sleep Hours: **-18%** to exam score
- Social Media Hours: **+12%** to stress level
- Mental Health: **-10%** to wellbeing

---

## Quick Testing Sequence

### 30-Second Demo
1. **Feature 1:** Paste "Example 1: Struggling Student" → Click Extract → See sliders populate
2. **Feature 2:** Click Generate → Scroll up to see AI Insights with red factors
3. **Feature 3:** See the multiverse chart with declining path at bottom
4. **Feature 4:** Note the wave is red/purple and chaotic
5. **Feature 5:** Go to Chat → Ask "What's my biggest challenge?" → Note specific numbers
6. **Feature 6:** On Dashboard bottom → Log some data

### 2-Minute Demo
1. **Feature 1:** Paste "Example 3: Disciplined Student" → Extract
2. **Feature 2:** Generate → Show AI Insights (all green/positive)
3. **Feature 3:** Point to optimized path at top
4. **Feature 4:** Wave is cyan and calm
5. **Feature 5:** Chat → Make habits much worse → Return to Chat
6. Ask "I've been slipping up" → See it detects the decline

---

## Copy-Paste Ready Templates

### For Bad Habits Demo
```
I sleep 3 hours, study 1 hour, spend 8 hours on social media, don't exercise, eat junk, 
mental health is 2/10, mood is 2/10, screen time is 10+ hours. I'm completely stressed out.
```

### For Good Habits Demo
```
I sleep 8 hours, study 6 hours, spend 1 hour on social media, exercise 5 times a week, 
eat well, mental health is 8/10, mood is 8/10, screen time is 3 hours. I feel great.
```

### For Testing Memory - Past Performance
```
Based on my habits right now, what do you predict for my exam score?
```

### For Testing Memory - Change Detection
(After changing habits for the worse)
```
I made some big changes to my routine. What's your read on me now?
```

---

## Pro Tips for Testing

1. **NLP Accuracy Test:** Paste "Example 1" and "Example 3" back-to-back, compare how sliders move
2. **SHAP Contrast:** Check AI Insights for Example 1 vs Example 3 - totally opposite colors
3. **Memory Test:** After "Example 1" chat, paste "Example 3" and chat again - Future Self should notice the difference
4. **Multiverse Comparison:** Generate with different examples and watch the trajectory lines move dramatically

---

Enjoy testing! 🚀
