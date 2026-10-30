// 生活安全防護網 - 終極王者戰情室全功能版 (Ultimate Cyber Shield Pro + HP & AI Dialogues)
let gameState = "START"; 
let score = 0;           
let currentQuestionIndex = 0; 
let selectedAnswer = ""; 
let isCorrect = false;   

// 特效與遊戲性變數
let particles = [];
let wireframes = [];      
let dataBeams = [];       
let clickSparks = [];     
let fireworks = [];       
let shieldAngle = 0;      
let comboCount = 0;       
let maxCombo = 0;         

// 核心功能變數
let timeLeft = 15;        
let hasUsedHint = false;  
let eliminatedOptions = []; 
let isBgmOn = false;      
let wrongQuestionsLog = []; 

// 防護罩血量 (HP) 與 AI 對話氣泡變數
let shieldHP = 100;       // 初始防護罩血量 100%
let aiMessage = "系統待命中，請啟動防護！"; // AI 導航員當前對話

// 音效合成器
let osc;
let bgmStep = 0;

const QUESTIONS = [
  { 
    category: "交通安全",
    q: "在馬路上走路時，如果人行道旁有騎樓，應該走在哪裡？", 
    options: ["馬路最外側", "人行道／騎樓內側", "馬路正中央"], 
    answer: "人行道／騎樓內側", 
    explain: "走在人行道或騎樓內側可以避免被車輛擦撞，是最安全的選擇！" 
  },
  { 
    category: "校園防護",
    q: "在學校不小心大腿擦傷流血了，第一步應該怎麼做？", 
    options: ["不管它繼續跑", "用清水清洗傷口", "塗抹醬油消毒"], 
    answer: "用清水清洗傷口", 
    explain: "輕微擦傷時，先用清水和肥皂沖洗傷口，把細菌沖掉才不會感染。" 
  },
  { 
    category: "飲食健康",
    q: "買回來的生鮮水果和蔬菜，在吃之前為什麼一定要洗？", 
    options: ["洗掉農藥和灰塵", "讓水果變大顆", "讓水果變甜"], 
    answer: "洗掉農藥和灰塵", 
    explain: "蔬果在種植和運送會有灰塵或農藥殘留，洗乾淨才能吃得健康。" 
  },
  { 
    category: "校園防護",
    q: "下雨天走在學校走廊或樓梯時，應該怎麼走才安全？", 
    options: ["奔跑比較快回家", "放慢腳步、不奔跑", "穿雨衣溜滑梯"], 
    answer: "放慢腳步、不奔跑", 
    explain: "雨天地板容易潮濕積水，奔跑非常容易滑倒受傷。" 
  },
  { 
    category: "環保節約",
    q: "離開房間時發現電燈和電扇還開著，最好的做法是？", 
    options: ["不管它", "隨手關燈、關電扇", "把插頭剪斷"], 
    answer: "隨手關燈、關電扇", 
    explain: "隨手關燈不僅省電，也能減少能源浪費，是愛護地球的好習慣！" 
  },
  { 
    category: "生活安全",
    q: "遇到不認識的人拿糖果請你吃，說要帶你去找爸媽，怎麼做？", 
    options: ["開心地跟著他走", "大聲拒絕並趕快跑開", "謝謝他並吃糖果"], 
    answer: "大聲拒絕並趕快跑開", 
    explain: "絕不接受陌生人食物或跟陌生人走，遇到危險要立刻找信任的大人！" 
  }
];

function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(CENTER, CENTER);
  rectMode(CENTER);

  try {
    osc = new p5.Oscillator('sine');
  } catch (e) {
    console.log("Audio not supported");
  }

  for (let i = 0; i < 40; i++) {
    particles.push({ x: random(width), y: random(height), size: random(2, 4), speedY: random(0.3, 0.8), alpha: random(80, 180) });
  }
  for (let i = 0; i < 5; i++) {
    wireframes.push({ x: random(width), y: random(height), size: random(40, 80), speedY: random(0.2, 0.5), angle: random(TWO_PI), rotSpeed: random(-0.015, 0.015) });
  }
  for (let i = 0; i < 4; i++) {
    dataBeams.push({ x: random(width), y: random(-height, 0), speed: random(3, 5), length: random(150, 250) });
  }
}

function draw() {
  cursor(ARROW);
  background(26, 26, 46);

  if (isBgmOn && frameCount % 25 === 0 && gameState === "QUIZ") {
    playBgmBeat();
  }

  if (gameState === "FEEDBACK") {
    noStroke();
    rectMode(CORNER);
    if (isCorrect) fill(0, 255, 136, 25);
    else fill(255, 51, 102, 25);
    rect(0, 0, width, height);
    rectMode(CENTER);
  }

  drawCyberGridAndBeams();
  drawParticlesAndWireframes();
  drawHUDFrame();
  drawAIAssistantOrb();  // 繪製 AI 導航員與即時對話泡泡
  updateAndDrawSparks();
  updateAndDrawFireworks(); 

  if (gameState === "START") {
    drawStartScreen();
  } else if (gameState === "QUIZ") {
    drawQuizScreen();
  } else if (gameState === "FEEDBACK") {
    drawFeedbackScreen();
  } else if (gameState === "RESULT") {
    drawResultScreen();
  }
}

// 音效處理
function playSound(type) {
  try {
    userStartAudio();
    if (!osc) return;
    osc.stop();
    if (type === "click") {
      osc.setType('sine'); osc.freq(400); osc.amp(0.1, 0.05); osc.start(); osc.amp(0, 0.1);
    } else if (type === "correct") {
      osc.setType('sine'); osc.freq(523.25); osc.amp(0.15, 0.05); osc.start();
      setTimeout(() => { try { osc.freq(659.25); } catch(e){} }, 100);
      setTimeout(() => { try { osc.amp(0, 0.2); } catch(e){} }, 250);
    } else if (type === "wrong") {
      osc.setType('sawtooth'); osc.freq(150); osc.amp(0.2, 0.05); osc.start();
      setTimeout(() => { try { osc.amp(0, 0.2); osc.setType('sine'); } catch(e){} }, 300);
    } else if (type === "hint") {
      osc.setType('sine'); osc.freq(880); osc.amp(0.1, 0.05); osc.start();
      setTimeout(() => { try { osc.freq(1108.73); } catch(e){} }, 100);
      setTimeout(() => { try { osc.amp(0, 0.15); } catch(e){} }, 200);
    }
  } catch (e) {}
}

function playBgmBeat() {
  try {
    let notes = [220, 246.94, 261.63, 329.63];
    osc.setType('triangle');
    osc.freq(notes[bgmStep % notes.length]);
    osc.amp(0.03, 0.02);
    osc.start();
    setTimeout(() => { try { osc.amp(0, 0.1); osc.setType('sine'); } catch(e){} }, 100);
    bgmStep++;
  } catch (e) {}
}

// 繪製 AI 導航員與即時對話吐槽氣泡
function drawAIAssistantOrb() {
  let orbX = width - 70;
  let orbY = 70;

  noStroke();
  let pulse = map(sin(frameCount * 0.08), -1, 1, 30, 70);
  fill(0, 210, 252, pulse);
  ellipse(orbX, orbY, 70, 70);

  fill(22, 33, 62);
  stroke(0, 210, 252);
  strokeWeight(2);
  ellipse(orbX, orbY, 50, 50);

  noStroke();
  fill(isBgmOn ? color(0, 255, 136) : color(255, 51, 102));
  ellipse(orbX, orbY, 15, 15);

  textSize(11);
  fill(0, 210, 252);
  textAlign(CENTER, CENTER);
  text(isBgmOn ? "BGM: ON" : "BGM: OFF", orbX, orbY + 40);

  // AI 即時對話吐槽氣泡框
  if (aiMessage !== "") {
    let boxW = 230;
    let boxH = 45;
    let boxX = orbX - boxW - 20;
    let boxY = orbY - 15;

    fill(20, 30, 55, 235);
    stroke(0, 210, 252);
    strokeWeight(1.5);
    rectMode(CORNER);
    rect(boxX, boxY, boxW, boxH, 8);

    noStroke();
    fill(255, 211, 105);
    textSize(12);
    textAlign(LEFT, CENTER);
    text("🤖 AI: " + aiMessage, boxX + 12, boxY + boxH / 2, boxW - 24);
    textAlign(CENTER, CENTER); // 還原對齊
    rectMode(CENTER);          // 還原 rectMode 避免影響後續渲染
  }
}

// 滿分煙火系統
function updateAndDrawFireworks() {
  if (gameState === "RESULT" && score === 6 && shieldHP > 0 && frameCount % 20 === 0) {
    let fx = random(100, width - 100);
    let fy = random(100, height / 2);
    for (let i = 0; i < 40; i++) {
      let angle = random(TWO_PI);
      let speed = random(2, 7);
      fireworks.push({
        x: fx, y: fy, vx: cos(angle) * speed, vy: sin(angle) * speed,
        r: random(100, 255), g: random(100, 255), b: 255, alpha: 255, size: random(3, 7)
      });
    }
  }

  for (let i = fireworks.length - 1; i >= 0; i--) {
    let f = fireworks[i];
    noStroke();
    fill(f.r, f.g, f.b, f.alpha);
    ellipse(f.x, f.y, f.size);
    f.x += f.vx; f.y += f.vy; f.vy += 0.1; f.alpha -= 5;
    if (f.alpha <= 0) fireworks.splice(i, 1);
  }
}

// 背景繪製
function drawCyberGridAndBeams() {
  stroke(0, 210, 252, 18);
  strokeWeight(1);
  let gridSize = 70;
  for (let x = 0; x < width; x += gridSize) line(x, 0, x, height);
  for (let y = 0; y < height; y += gridSize) line(0, y, width, y);

  noStroke();
  for (let beam of dataBeams) {
    fill(0, 255, 136, 30);
    rect(beam.x, beam.y, 2, beam.length);
    beam.y += beam.speed;
    if (beam.y > height) { beam.y = random(-300, -50); beam.x = random(width); }
  }
}

function drawParticlesAndWireframes() {
  noStroke();
  for (let p of particles) {
    fill(0, 210, 252, p.alpha);
    ellipse(p.x, p.y, p.size);
    p.y -= p.speedY;
    if (p.y < 0) { p.y = height; p.x = random(width); }
  }

  for (let shape of wireframes) {
    push();
    translate(shape.x, shape.y);
    rotate(shape.angle);
    stroke(0, 210, 252, 50);
    strokeWeight(1.5);
    noFill();
    rectMode(CENTER);
    rect(0, 0, shape.size, shape.size);
    pop();
    shape.y -= shape.speedY;
    shape.angle += shape.rotSpeed;
    if (shape.y < -50) { shape.y = height + 50; shape.x = random(width); }
  }
}

function drawHUDFrame() {
  stroke(0, 210, 252, 180);
  strokeWeight(3);
  noFill();
  let m = 30, len = 40;
  line(m, m + len, m, m); line(m, m, m + len, m);
  line(width - m - len, m, width - m, m); line(width - m, m, width - m, m + len);
  line(m, height - m - len, m, height - m); line(m, height - m, m + len, height - m);
  line(width - m - len, height - m, width - m, height - m); line(width - m, height - m - len, width - m, height - m);

  noStroke();
  fill(0, 210, 252, map(sin(frameCount * 0.1), -1, 1, 100, 255));
  textSize(12);
  textAlign(LEFT, TOP);
  text(">> [SECURE_LINK: ONLINE] // SYSTEM_SHIELD_ACTIVE", m + 15, m + 5);
  textAlign(RIGHT, BOTTOM);
  text("CYBER_ED_PROJECT v5.0 [AI_PRO]", width - m - 15, height - m - 5);
  textAlign(CENTER, CENTER);
}

function updateAndDrawSparks() {
  for (let i = clickSparks.length - 1; i >= 0; i--) {
    let s = clickSparks[i];
    noStroke();
    fill(s.r, s.g, s.b, s.alpha);
    ellipse(s.x, s.y, s.size);
    s.x += s.vx; s.y += s.vy; s.alpha -= 8; s.size *= 0.95;
    if (s.alpha <= 0) clickSparks.splice(i, 1);
  }
}

function triggerSpark(px, py) {
  for (let i = 0; i < 25; i++) {
    let angle = random(TWO_PI);
    let speed = random(1.5, 6);
    clickSparks.push({
      x: px, y: py, vx: cos(angle) * speed, vy: sin(angle) * speed,
      size: random(4, 9), r: random(0, 100), g: 255, b: random(150, 255), alpha: 255
    });
  }
}

function drawButton(x, y, w, h, label, isHovered, isDisabled) {
  rectMode(CENTER);
  if (isDisabled) {
    fill(40, 40, 50, 160);
    stroke(80, 80, 100);
    strokeWeight(1.5);
  } else if (isHovered) {
    fill(0, 255, 136, 70); 
    stroke(0, 255, 136);     
    strokeWeight(3);
    cursor(HAND);
  } else {
    fill(22, 33, 62, 230);   
    stroke(0, 210, 252);     
    strokeWeight(2);
  }
  rect(x, y, w, h, 10);
  noStroke();
  fill(isDisabled ? color(110) : (isHovered ? color(0, 255, 136) : color(224, 247, 250)));
  textSize(18);
  text(label, x, y);
}

// 1. 開始畫面
function drawStartScreen() {
  let centerX = width / 2;
  let centerY = height / 2;

  push();
  translate(centerX, centerY + 20);
  rotate(shieldAngle);
  stroke(0, 210, 252, 60);
  strokeWeight(2);
  noFill();
  ellipse(0, 0, 320, 320);
  for (let a = 0; a < TWO_PI; a += PI/3) {
    line(cos(a)*150, sin(a)*150, cos(a)*160, sin(a)*160);
  }
  pop();
  shieldAngle += 0.01;

  fill(0, 210, 252);
  textSize(min(width, height) * 0.055);
  textStyle(BOLD);
  text("🛡️ CYBER SHIELD : 生活安全防護網 🛡️", centerX, centerY - 80);
  textStyle(NORMAL);

  textSize(min(width, height) * 0.022);
  fill(160, 220, 240);
  text("啟動防護系統，透過情境模擬測驗你的生存常識！", centerX, centerY - 20);

  let isHover = mouseX > centerX - 110 && mouseX < centerX + 110 && mouseY > centerY + 35 && mouseY < centerY + 85;
  if (isHover) cursor(HAND);

  rectMode(CENTER);
  fill(isHover ? color(0, 255, 136) : color(0, 210, 252));
  noStroke();
  rect(centerX, centerY + 60, 220, 50, 10);

  fill(26, 26, 46);
  textStyle(BOLD);
  textSize(20);
  text("啟動防護", centerX, centerY + 60);
  textStyle(NORMAL);
}

// 2. 作答畫面 (包含防護罩血量 HP 條與倒數)
function drawQuizScreen() {
  let centerX = width / 2;
  let centerY = height / 2;
  let qData = QUESTIONS[currentQuestionIndex];

  // 倒數計時與逾時判定
  if (frameCount % 60 === 0 && timeLeft > 0) {
    timeLeft--;
    if (timeLeft <= 5) {
      aiMessage = "⚠️ 警告！時間快到了，快做決定！";
    }
    if (timeLeft === 0) {
      isCorrect = false;
      comboCount = 0;
      shieldHP -= 20; // 超時扣血
      aiMessage = "❌ 超時防護失守！扣 20% 血量！";
      wrongQuestionsLog.push({ q: qData.q, category: qData.category, answer: qData.answer, explain: qData.explain });
      playSound("wrong");

      if (shieldHP <= 0) {
        gameState = "RESULT";
      } else {
        gameState = "FEEDBACK";
      }
    }
  }

  // 頂部進度條
  let barWidth = 400;
  let progress = (currentQuestionIndex / QUESTIONS.length) * barWidth;
  fill(40, 50, 80, 200);
  noStroke();
  rectMode(CENTER);
  rect(centerX, centerY - 190, barWidth, 8, 4);
  fill(0, 255, 136);
  rect(centerX - (barWidth - progress) / 2, centerY - 190, progress, 8, 4);

  // 防護罩血量 (HP Bar)
  fill(255, 51, 102);
  rect(centerX - 150, centerY - 165, 120, 10, 5);
  fill(0, 255, 136);
  let hpWidth = map(shieldHP, 0, 100, 0, 120);
  rect(centerX - 210 + hpWidth / 2, centerY - 165, hpWidth, 10, 5);

  fill(255, 211, 105);
  textSize(13);
  text(`🛡️ HP: ${shieldHP}% | ⏱️ ${timeLeft}s`, centerX - 150, centerY - 145);

  // 分類標籤
  fill(0, 210, 252);
  rect(centerX - 20, centerY - 130, 90, 30, 6);
  fill(26, 26, 46);
  textSize(13);
  text(qData.category, centerX - 20, centerY - 130);

  // 進度
  fill(224, 247, 250);
  textSize(16);
  text(`進度:${currentQuestionIndex + 1}/${QUESTIONS.length}`, centerX + 120, centerY - 130);

  // 提示道具按鈕
  let hintHover = mouseX > centerX + 150 && mouseX < centerX + 230 && mouseY > centerY - 150 && mouseY < centerY - 110;
  if (!hasUsedHint && hintHover) cursor(HAND);
  fill(hasUsedHint ? color(50) : (hintHover ? color(255, 193, 7) : color(200, 150, 0)));
  rect(centerX + 190, centerY - 130, 75, 30, 6);
  fill(26, 26, 46);
  textSize(12);
  text(hasUsedHint ? "已用提示" : "💡 提示", centerX + 190, centerY - 130);

  // 連擊展示
  if (comboCount > 1) {
    fill(255, 211, 105);
    textSize(20);
    text(`🔥 COMBO x${comboCount} !`, centerX, centerY - 100);
  }

  // 題目文字
  fill(255);
  textSize(22);
  text(qData.q, centerX, centerY - 55);

  // 選項按鈕
  let hoveringAny = false;
  for (let i = 0; i < qData.options.length; i++) {
    let btnY = centerY + 15 + i * 65;
    let isDisabled = eliminatedOptions.includes(i);
    let isHover = !isDisabled && mouseX > centerX - 225 && mouseX < centerX + 225 && mouseY > btnY - 22 && mouseY < btnY + 22;
    if (isHover) hoveringAny = true;

    drawButton(centerX, btnY, 450, 45, qData.options[i], isHover, isDisabled);
  }
  if (!hoveringAny && !hintHover) cursor(ARROW);
}

// 3. 立即回饋畫面
function drawFeedbackScreen() {
  let centerX = width / 2;
  let centerY = height / 2;
  let qData = QUESTIONS[currentQuestionIndex];

  if (isCorrect) {
    fill(0, 255, 136);
    textSize(32);
    text("⚡ SYSTEM SECURE : 防護成功！", centerX, centerY - 140);
  } else {
    fill(255, 51, 102);
    textSize(32);
    text("⚠️ WARNING : 防護破口 (HP -20%)！", centerX, centerY - 140);
  }

  fill(224, 247, 250);
  textSize(18);
  text(`正確安全協定：${qData.answer}`, centerX, centerY - 80);
  
  fill(20, 30, 55, 230);
  stroke(0, 210, 252);
  strokeWeight(2);
  rectMode(CENTER);
  rect(centerX, centerY + 10, 520, 90, 10);
  noStroke();
  fill(255, 211, 105);
  textSize(16);
  text("💡 系統診斷報告：" + qData.explain, centerX, centerY + 10, 480, 80);

  let isHover = mouseX > centerX - 100 && mouseX < centerX + 100 && mouseY > centerY + 95 && mouseY < centerY + 145;
  if (isHover) cursor(HAND); else cursor(ARROW);
  fill(isHover ? color(0, 255, 136) : color(0, 210, 252));
  rect(centerX, centerY + 120, 200, 50, 10);
  fill(26, 26, 46);
  textSize(18);
  text(shieldHP <= 0 ? "查看防線崩潰報告 ➔" : "下一防區 ➔", centerX, centerY + 120);
}

// 4. 成績畫面 (修正錯題檢討文字跑出框外的排版問題)
function drawResultScreen() {
  let centerX = width / 2;
  let centerY = height / 2;

  fill(0, 210, 252);
  noStroke();
  textSize(32);
  textStyle(BOLD);
  text("🏆 防護系統結算報表", centerX, centerY - 155);
  textStyle(NORMAL);

  fill(224, 247, 250);
  textSize(17);
  text(`防護罩剩餘血量: ${shieldHP}% | 答對: ${score}/${QUESTIONS.length} 題`, centerX, centerY - 115);

  fill(0, 255, 136);
  textSize(16);
  let feedbackText = "";
  if (shieldHP <= 0) {
    feedbackText = "💥 【防線潰決】血量歸零！請重新加強安全常識！";
  } else if (score === 6) {
    feedbackText = "🌟 【頂級防護官】完美滿分！煙火慶祝中🎉";
  } else {
    feedbackText = "⚡ 【高級防護員】順利通關，表現優異！";
  }
  text(feedbackText, centerX, centerY - 85);

  // 錯題檢討專區面板 (精準鎖定在中央方框內)
  let boxW = min(width * 0.88, 620);
  let boxH = 150;
  let boxCenterX = centerX;
  let boxCenterY = centerY + 15;

  fill(20, 30, 55, 235);
  stroke(0, 210, 252);
  strokeWeight(1.5);
  rectMode(CENTER);
  rect(boxCenterX, boxCenterY, boxW, boxH, 10);

  // 切換為 CORNER 模式繪製文字，邊距內縮，確保 100% 緊貼框內不跑版
  rectMode(CORNER);
  noStroke();
  let padX = 22;
  let padY = 15;
  let leftX = boxCenterX - boxW / 2 + padX;
  let topY = boxCenterY - boxH / 2 + padY;
  let contentW = boxW - padX * 2;

  if (wrongQuestionsLog.length === 0) {
    fill(255, 211, 105);
    textSize(15);
    textStyle(BOLD);
    textAlign(LEFT, TOP);
    text("📋 錯題系統診斷專區：", leftX, topY);
    
    fill(0, 255, 136);
    textSize(16);
    textAlign(CENTER, CENTER);
    text("🛡️ 本次模擬無任何安全失誤，防護網完美無缺！🎉", boxCenterX, boxCenterY + 12);
  } else {
    fill(255, 211, 105);
    textSize(14);
    textStyle(BOLD);
    textAlign(LEFT, TOP);
    text(`📋 錯題系統診斷專區（共失誤 ${wrongQuestionsLog.length} 題）：`, leftX, topY);
    textStyle(NORMAL);

    let startY = topY + 25;
    let displayCount = min(wrongQuestionsLog.length, 2);

    for (let i = 0; i < displayCount; i++) {
      let item = wrongQuestionsLog[i];
      let itemY = startY + i * 44;

      fill(255, 100, 120);
      textSize(13);
      textStyle(BOLD);
      textAlign(LEFT, TOP);
      let catTag = item.category ? `【${item.category}】` : "";
      text(`❌ ${catTag}${item.q}`, leftX, itemY, contentW, 20);

      fill(200, 235, 255);
      textSize(12);
      textStyle(NORMAL);
      text(`   💡 正確指引：${item.answer} — ${item.explain}`, leftX, itemY + 18, contentW, 24);
    }

    if (wrongQuestionsLog.length > 2) {
      fill(255, 211, 105);
      textSize(11);
      textAlign(RIGHT, BOTTOM);
      text(`（尚有 ${wrongQuestionsLog.length - 2} 項失誤未列出，請全面複習相關領域）`, boxCenterX + boxW / 2 - padX, boxCenterY + boxH / 2 - 8);
    }
  }

  // 還原文字對齊與繪製模式
  textAlign(CENTER, CENTER);
  rectMode(CENTER);

  // 重新啟動按鈕
  let btnY = boxCenterY + boxH / 2 + 35;
  let isHover = mouseX > centerX - 100 && mouseX < centerX + 100 && mouseY > btnY - 22 && mouseY < btnY + 22;
  if (isHover) cursor(HAND); else cursor(ARROW);
  
  rectMode(CENTER);
  fill(isHover ? color(0, 255, 136) : color(0, 210, 252));
  noStroke();
  rect(centerX, btnY, 200, 44, 10);
  
  fill(26, 26, 46);
  textStyle(BOLD);
  textSize(16);
  text("重新啟動", centerX, btnY);
  textStyle(NORMAL);
}

// 滑鼠點擊事件
function mousePressed() {
  let centerX = width / 2;
  let centerY = height / 2;

  let orbX = width - 70;
  let orbY = 70;
  if (dist(mouseX, mouseY, orbX, orbY) < 40) {
    isBgmOn = !isBgmOn;
    if (isBgmOn) {
      playSound("click");
      aiMessage = "背景電子節奏已啟動！";
    } else {
      if (osc) osc.stop();
      aiMessage = "已靜音。";
    }
    return;
  }

  triggerSpark(mouseX, mouseY);
  playSound("click"); 

  if (gameState === "START") {
    if (mouseX > centerX - 110 && mouseX < centerX + 110 && mouseY > centerY + 35 && mouseY < centerY + 85) {
      gameState = "QUIZ";
      currentQuestionIndex = 0;
      score = 0;
      comboCount = 0;
      maxCombo = 0;
      fireworks = [];
      wrongQuestionsLog = [];
      hasUsedHint = false;
      eliminatedOptions = [];
      timeLeft = 15;
      shieldHP = 100; // 重置血量
      aiMessage = "防護網啟動！祝你好運！";
    }
  } else if (gameState === "QUIZ") {
    let qData = QUESTIONS[currentQuestionIndex];

    let hintX = centerX + 190;
    let hintY = centerY - 130;
    if (!hasUsedHint && mouseX > hintX - 40 && mouseX < hintX + 40 && mouseY > hintY - 15 && mouseY < hintY + 15) {
      hasUsedHint = true;
      playSound("hint");
      aiMessage = "已呼叫系統協助，幫你排除一個陷阱！";
      for (let i = 0; i < qData.options.length; i++) {
        if (qData.options[i] !== qData.answer && !eliminatedOptions.includes(i)) {
          eliminatedOptions.push(i);
          break; 
        }
      }
      return;
    }

    for (let i = 0; i < qData.options.length; i++) {
      let btnY = centerY + 15 + i * 65;
      if (!eliminatedOptions.includes(i) && mouseX > centerX - 225 && mouseX < centerX + 225 && mouseY > btnY - 22 && mouseY < btnY + 22) {
        selectedAnswer = qData.options[i];
        if (selectedAnswer === qData.answer) {
          isCorrect = true;
          score++;
          comboCount++; 
          if (comboCount > maxCombo) maxCombo = comboCount;
          playSound("correct"); 
          aiMessage = "幹得漂亮！防護網能量上升！";
        } else {
          isCorrect = false;
          comboCount = 0; 
          shieldHP -= 20; // 答錯扣 20% 血量
          wrongQuestionsLog.push({ q: qData.q, category: qData.category, answer: qData.answer, explain: qData.explain });
          playSound("wrong"); 
          aiMessage = "哎呀！防護罩受損，扣 20% 血量！";
        }
        
        // 如果血量歸零，直接強制進入結算畫面
        if (shieldHP <= 0) {
          gameState = "RESULT";
        } else {
          gameState = "FEEDBACK";
        }
        break;
      }
    }
  } else if (gameState === "FEEDBACK") {
    if (mouseX > centerX - 100 && mouseX < centerX + 100 && mouseY > centerY + 95 && mouseY < centerY + 145) {
      currentQuestionIndex++;
      hasUsedHint = false;
      eliminatedOptions = [];
      timeLeft = 15; 
      aiMessage = "進入下一個安全防區，請專注！";
      if (currentQuestionIndex < QUESTIONS.length) {
        gameState = "QUIZ";
      } else {
        gameState = "RESULT";
      }
    }
  } else if (gameState === "RESULT") {
    let boxCenterY = centerY + 15;
    let boxH = 150;
    let btnY = boxCenterY + boxH / 2 + 35;
    if (mouseX > centerX - 100 && mouseX < centerX + 100 && mouseY > btnY - 22 && mouseY < btnY + 22) {
      gameState = "START";
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
