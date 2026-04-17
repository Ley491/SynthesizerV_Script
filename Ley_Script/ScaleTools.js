/*
- 此岸さくら氏作スクリプト（ScaleManager.js）を参考に作成したスクリプトパネル用スクリプト。
  - 設定したスケールに基づいて、選択ノートを補正・移動するためのツール。
    - スケールから外れている音を修正したり、ハモリ用に 3 度上・5 度上などへ移動したりできます。
      - showAdvancedIntervals をtrue にすると8度・4度・6度・7度へも移動可能。
  - スケール設定はグループ別にプロジェクトファイルに保存されます。
    - 此岸さくら氏作スクリプト（ParameterBox.js）のScriptData管理方式を参考に実装。
  - 選択ノートの音名を C4 / mid2C などの形式で表示します。
    - ノートが複数選択されている場合は、最低音～最高音の音域を表示します。
*/

// デバッグモード
var debugMode = false;

// 8度・4度・6度・7度移動ボタンを表示するかどうか
var showAdvancedIntervals = true;


function getClientInfo() {
  return {
    "name": "Scale Tools",
    "author": "Ley",
    "versionNumber": 1.0,
    "minEditorVersion": 131330,
    "type": "SidePanelSection",
    "category": "Ley Script"
  };
}

function getTranslations(langCode) {
  if (langCode == "ja-jp") {
    return [
      ["Scale Tools", "スケールツール"],
      ["3rd -", "3度 ↓"],
      ["3rd +", "3度 ↑"],
      ["5th -", "5度 ↓"],
      ["5th +", "5度 ↑"],
      ["8ve -", "Oct ↓"],
      ["8ve +", "Oct ↑"],
      ["4th -", "4度 ↓"],
      ["4th +", "4度 ↑"],
      ["6th -", "6度 ↓"],
      ["6th +", "6度 ↑"],
      ["7th -", "7度 ↓"],
      ["7th +", "7度 ↑"],
      ["⚠ No notes selected", "⚠ ノートを選択して下さい"],
      ["No notes selected", "ノートが選択されていません"],
      ["⚠ All notes are in scale (no change)", "⚠ 修正対象はありません"],
      ["Bars", "小節目"],
      ["Note Range", "音域"],
      ["Note: ", "ノート："],
      ["Range: ", "音域："],
      ["Outside 88-key range(", "88鍵盤範囲外("],
      ["Outside 88-key range", "88鍵盤範囲外"],
      ["Correct Scale", "スケール修正"],
      ["Corrected the notes out of scale.", "スケール外のノートを修正しました"],
      ["Notes in scale only", "スケール内のノートのみ"],
      ["Notes corrected", "個のノートを修正しました"],
      ["The selection includes notes outside the editor's display range. The process has been canceled.", "選択範囲にエディター表示外の音域が含まれています。処理を中止しました。"],
      ["Out of range after correction: ", "ノートが表示範囲外になります: "],
      ["⚠ Cancel moving the notes", "⚠ 移動できません"],
      ["Notes moved", "個のノートを移動しました"],
    ];
  }
  return [];
}

// スケール定義
var SCALE_DEFS_HARMONIZER = [
  { name: "Major", iv: [0, 2, 4, 5, 7, 9, 11] },
  { name: "Natural Minor", iv: [0, 2, 3, 5, 7, 8, 10] },
  { name: "Harmonic Minor", iv: [0, 2, 3, 5, 7, 8, 11] },
  { name: "Melodic Minor", iv: [0, 2, 3, 5, 7, 9, 11] },
  { name: "Maj. Pentatonic", iv: [0, 2, 4, 7, 9] },
  { name: "Min. Pentatonic", iv: [0, 3, 5, 7, 10] },
  { name: "Major Blues", iv: [0, 2, 3, 4, 7, 9] },
  { name: "Minor Blues", iv: [0, 3, 5, 6, 7, 10] },
  { name: "Dorian", iv: [0, 2, 3, 5, 7, 9, 10] },
  { name: "Phrygian", iv: [0, 1, 3, 5, 7, 8, 10] },
  { name: "Lydian", iv: [0, 2, 4, 6, 7, 9, 11] },
  { name: "Mixolydian", iv: [0, 2, 4, 5, 7, 9, 10] },
  { name: "Locrian", iv: [0, 1, 3, 5, 6, 8, 10] },
  { name: "Whole Tone", iv: [0, 2, 4, 6, 8, 10] },
  // { name: "Octatonic (Half-Whole)", iv: [0, 1, 3, 4, 6, 7, 9, 10] },  // SV2 Editor のスケール設定には含まれていない（Combination of Diminished Scale）
  { name: "Octatonic (Whole-Half)", iv: [0, 2, 3, 5, 6, 8, 9, 11] },  // Diminished Scale
];

// 音名
var NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// 音名変換
function pitchToName(pitch) {
  var pc = pitch % 12;
  var oct = Math.floor(pitch / 12) - 1; // C4=60 なら -1 補正
  return NOTE_NAMES[pc] + oct;
}

// ノートの高さに応じて音名変換（C4 = 60：中央のド）
function pitchToVocalName(pitch) {
  var pc = pitch % 12;
  var base = NOTE_NAMES[pc];

  // lowlow = A0〜G1 (21〜32)
  if (pitch >= 21 && pitch <= 32) return "lowlow" + base;

  // low = A1〜G2 (33〜44)
  if (pitch >= 33 && pitch <= 44) return "low" + base;

  // mid1 = A2〜G3 (45〜56)
  if (pitch >= 45 && pitch <= 56) return "mid1" + base;

  // mid2 = A3〜G4 (57〜68)
  if (pitch >= 57 && pitch <= 68) return "mid2" + base;

  // hi = A4〜G5 (69〜80)
  if (pitch >= 69 && pitch <= 80) return "hi" + base;

  // hihi = A5〜G6 (81〜92)
  if (pitch >= 81 && pitch <= 92) return "hihi" + base;

  // hihihi = A6〜G7 (93〜104)
  if (pitch >= 93 && pitch <= 104) return "hihihi" + base;

  // hihihihi = A7〜C8 (105〜108)
  if (pitch >= 105 && pitch <= 108) return "hihihihi" + base;

  // それより下 / 上（ピアノの88鍵盤の範囲外）
  return SV.T("Outside 88-key range");
  // return SV.T("Outside 88-key range(") + base + ")";
}




// 各種UIの初期値

var rootValue = SV.create("WidgetValue", 0);  // ルート音
var scaleValue = SV.create("WidgetValue", 0);  // スケール
var isLoadingScale = false; // スケール読み込み中フラグ

var labelRangeText = SV.T("No notes selected"); // 音名初期表示（初期値は翻訳対象外）


// var btnSemiDown = SV.create("WidgetValue");
// var btnSemiUp = SV.create("WidgetValue");
var btnCorrect = SV.create("WidgetValue");  // スケールにない音をスケール内の最も近い音に修正
var btnThirdDown = SV.create("WidgetValue");  // スケール内の3度下の音に移動
var btnThirdUp = SV.create("WidgetValue");    // スケール内の3度上の音に移動
var btnFifthDown = SV.create("WidgetValue");  // スケール内の5度下の音に移動
var btnFifthUp = SV.create("WidgetValue");    // スケール内の5度上の音に移動

var btn8veDown = SV.create("WidgetValue");  // スケール内の8度下の音に移動
var btn8veUp = SV.create("WidgetValue");    // スケール内の8度上の音に移動

var btnFourthDown = SV.create("WidgetValue");  // スケール内の4度下の音に移動
var btnFourthUp = SV.create("WidgetValue");    // スケール内の4度上の音に移動
var btnSixthDown = SV.create("WidgetValue");  // スケール内の6度下の音に移動
var btnSixthUp = SV.create("WidgetValue");    // スケール内の6度上の音に移動
var btnSeventhDown = SV.create("WidgetValue");  // スケール内の7度下の音に移動
var btnSeventhUp = SV.create("WidgetValue");    // スケール内の7度上の音に移動

var logText = SV.create("WidgetValue", ""); // ログ表示用
var btnClearLog = SV.create("WidgetValue"); // ログクリア用
var showLogText = SV.create("WidgetValue", false);  // ログを表示するかどうか

var lastSelectionPitches = [];  // 最後に選択したノートのピッチを保存
var pitchWatchTimer = null;  // ピッチ監視用タイマー


// 基音の選択肢
function getRootOptions() {
  return NOTE_NAMES;
}

// スケールの選択肢
function getScaleOptions() {
  var arr = [];
  for (var i = 0; i < SCALE_DEFS_HARMONIZER.length; i++) {
    arr.push(SCALE_DEFS_HARMONIZER[i].name);
  }
  return arr;
}

// 現在の基音／スケール設定をグループに保存
function saveRootScaleToGroup() {
  var groupRef = SV.getMainEditor().getCurrentGroup();
  if (!groupRef) return;

  groupRef.setScriptData("ScaleTools", JSON.stringify({
    root: rootValue.getValue(),
    scale: scaleValue.getValue()
  }));
}

// グループからルート／スケール設定を読み込む
function loadRootScaleFromGroup() {
  var groupRef = SV.getMainEditor().getCurrentGroup();
  if (!groupRef) return;

  var saved = groupRef.getScriptData("ScaleTools");
  if (!saved) return;

  try {
    var obj = JSON.parse(saved);

    isLoadingScale = true;  // 読み込み中は保存を無効化

    if (typeof obj.root === "number") rootValue.setValue(obj.root);
    if (typeof obj.scale === "number") scaleValue.setValue(obj.scale);

  } catch (e) {
    // 壊れてたら無視
  } finally {
    isLoadingScale = false; // 読み込み完了
  }
}



// 選択ノートから min/max を取る（最低音/最高音）
function analyzeSelectionRange() {
  var editor = SV.getMainEditor();
  var selection = editor.getSelection();
  var notes = selection.getSelectedNotes();

  if (!notes || notes.length == 0) {
    return SV.T("No notes selected");
  }

  var minPitch = 999;
  var maxPitch = -999;
  var validNoteCount = 0;

  for (var i = 0; i < notes.length; i++) {
    // br を除外
    var lyric = notes[i].getLyrics();
    if (lyric === "br") continue;

    var p = notes[i].getPitch();
    validNoteCount++;
    if (p < minPitch) minPitch = p;
    if (p > maxPitch) maxPitch = p;
  }

  // br しか無かった場合
  if (validNoteCount === 0) return SV.T("No notes selected");

  if (minPitch == maxPitch) {
    var name1 = pitchToName(minPitch);
    var name2 = pitchToVocalName(minPitch);
    return SV.T("Note: ") + name1 + " / " + name2;
  } else {
    var lo1 = pitchToName(minPitch);
    var lo2 = pitchToVocalName(minPitch);
    var hi1 = pitchToName(maxPitch);
    var hi2 = pitchToVocalName(maxPitch);
    return SV.T("Range: ") + lo1 + " / " + lo2 + "  –  " + hi1 + " / " + hi2;
  }
}




// スケール構築
function buildScale() {
  var root = rootValue.getValue();
  var scaleIndex = scaleValue.getValue();
  var scaleDef = SCALE_DEFS_HARMONIZER[scaleIndex];

  var scale = [];
  for (var i = 0; i < scaleDef.iv.length; i++) {
    scale.push((root + scaleDef.iv[i]) % 12);
  }
  return scale;
}

// 最寄りスケールインデックス取得
function getNearestIndex(pc, scale) {
  var minDiff = 12;
  var nearest = 0;

  for (var i = 0; i < scale.length; i++) {
    var diff = Math.abs(scale[i] - pc);
    diff = Math.min(diff, 12 - diff);

    if (diff < minDiff) {
      minDiff = diff;
      nearest = i;
    }
  }
  return nearest;
}


// スケールにない音をスケール内の最も近い音に修正（Correct Scale 用）
function correctScaleOnly() {
  // ログをリセット
  showLogText.setValue(false);
  logText.setValue("");

  var editor = SV.getMainEditor();
  var notes = editor.getSelection().getSelectedNotes();

  if (debugMode) {
    if (!notes || notes.length == 0) {
      logText.setValue(SV.T("⚠ No notes selected"));
      showLogText.setValue(true);   // ログを表示
    }
  }
  if (!notes || notes.length == 0) {
    // 一時メッセージ
    showTemporaryMessage(SV.T("⚠ No notes selected"), 3000);
    return;
  }

  var scale = buildScale();
  var TA = SV.getProject().getTimeAxis();

  var logs = [];
  var planned = [];  // 1で newPitch を記録する

  // 1：全ノートの安全チェック
  for (var i = 0; i < notes.length; i++) {
    var note = notes[i];
    var pitch = note.getPitch();
    var pc = pitch % 12;

    if (scale.indexOf(pc) >= 0) continue;

    var newPitch = snapToNearest(pitch, scale);
    var diff = newPitch - pitch;

    // 範囲外ノートのチェック
    if (!isPitchSafe(newPitch)) {

      // デバッグモード
      if (debugMode) {
        var bar = TA.getMeasureAt(note.getOnset());
        var lyric = note.getLyrics();

        logText.setValue(
          SV.T("Out of range after correction: ") + "\n" +
          (bar + 1) + SV.T("Bars") + "  「" + lyric + "」 : " +
          pitchToName(pitch) + " → " + pitchToName(newPitch)
        );
        showLogText.setValue(true);
      }

      // 一時メッセージ
      showTemporaryMessage(SV.T("⚠ Cancel moving the notes"), 3000);

      SV.refreshSidePanel();
      return;
    }

    var onset = note.getOnset();
    var bar = TA.getMeasureAt(onset); // 小節数のカウントは0から

    // ログに小節番号（1から）と歌詞と音名を表示
    var lyric = note.getLyrics();
    logs.push(
      (bar + 1) + SV.T("Bars") + "  「" + lyric + "」 : " + pitchToName(pitch) + " → " + pitchToName(newPitch)
    );

    // 後からsetPitchでまとめて適用
    planned.push({ note: note, oldPitch: pitch, newPitch: newPitch });
  }

  // 2：まとめて適用
  for (var i = 0; i < planned.length; i++) {
    var item = planned[i];
    var note = item.note;
    var oldPitch = item.oldPitch;
    var newPitch = item.newPitch;
    var diff = newPitch - oldPitch;

    // ノートのピッチを変更
    note.setPitch(newPitch);

    var group = note.getParent();
    var onset = note.getOnset();
    var end = note.getEnd();

    for (var p = 0; p < group.getNumPitchControls(); p++) {
      var pit = group.getPitchControl(p);
      var pos = pit.getPosition();
      if (pos > onset && pos < end) pit.setPitch(pit.getPitch() + diff);
    }

    // ログに小節番号（1から）と歌詞と音名を表示
    if (debugMode) {
      var bar = TA.getMeasureAt(onset); // 小節数のカウントは0から
      var lyric = note.getLyrics();
      logs.push(
        (bar + 1) + SV.T("Bars") + "  「" + lyric + "」 : " +
        pitchToName(oldPitch) + " → " + pitchToName(newPitch)
      );
    }
  }

  // ログ情報（デバッグ欄）
  if (debugMode) {
    if (logs.length == 0) logText.setValue(SV.T("All notes are in scale (no change)"));
    else logText.setValue(logs.join("\n"));
  }

  // 一時メッセージ表示
  if (logs.length == 0) {
    showTemporaryMessage(SV.T("⚠ All notes are in scale (no change)"), 3000);
  } else {
    showTemporaryMessage(logs.length + SV.T("Notes corrected"), 3000);
  }

  // デバッグモードかつログがある時だけ表示
  if (debugMode) {
    showLogText.setValue(logText.getValue() !== "");
  }
  SV.refreshSidePanel();  // パネル更新
}




// スケール内の音程分だけ移動（Move Scale Step 用）
function moveScaleStep(step) {
  // ログをリセット
  showLogText.setValue(false);
  logText.setValue("");

  var editor = SV.getMainEditor();
  var notes = editor.getSelection().getSelectedNotes();

  if (debugMode) {
    if (!notes || notes.length == 0) {
      logText.setValue(SV.T("⚠ No notes selected"));
      showLogText.setValue(true);   // ログを表示
    }
  }
  if (!notes || notes.length == 0) {
    // 一時メッセージ
    showTemporaryMessage(SV.T("⚠ No notes selected"), 3000);
    return;
  }

  var scalePc = buildScale(); // 例: E Nat.Min → [4,6,7,9,11,0,2]
  var TA = SV.getProject().getTimeAxis();
  var logs = [];
  var usedSnap = false;  // スケール外修正したかどうか

  // 0〜127 の範囲で「スケール直線」を作る
  var scaleLine = [];
  for (var oct = 0; oct <= 10; oct++) {
    for (var i = 0; i < scalePc.length; i++) {
      var p = oct * 12 + scalePc[i];
      if (p >= 0 && p <= 127) scaleLine.push(p);
    }
  }
  // 念のためソート
  scaleLine.sort(function (a, b) { return a - b; });

  var planned = [];  // 1で newPitch を記録する

  // 1：計画（パス1）
  for (var n = 0; n < notes.length; n++) {
    var note = notes[n];
    var originalPitch = note.getPitch();
    var pitch = originalPitch;

    var pc = pitch % 12;

    // スケール外なら correctScaleOnly と同じ snapToNearest を使う
    if (scalePc.indexOf(pc) < 0) {
      var snapped = snapToNearest(pitch, scalePc);

      // 範囲外ノートのチェック
      if (!isPitchSafe(snapped)) {

        // デバッグモード
        if (debugMode) {
          var bar = TA.getMeasureAt(note.getOnset());
          var lyric = note.getLyrics();

          logText.setValue(
            SV.T("Out of range after correction: ") + "\n" +
            (bar + 1) + SV.T("Bars") + "  「" + lyric + "」 : " +
            pitchToName(pitch) + " → " + pitchToName(snapped)
          );
          showLogText.setValue(true);
        }

        // 一時メッセージ
        showTemporaryMessage(SV.T("⚠ Cancel moving the notes"), 3000);
        SV.refreshSidePanel();
        return;
      }

      if (snapped !== pitch) {
        usedSnap = true;
        pitch = snapped;
      }
    }

    // スケール直線上で degree 移動
    var bestIdx = 0;
    var bestDiff = 9999;
    for (var i = 0; i < scaleLine.length; i++) {
      var d = Math.abs(scaleLine[i] - pitch);
      if (d < bestDiff) {
        bestDiff = d;
        bestIdx = i;
      }
    }

    var targetIdx = bestIdx + step;
    if (targetIdx < 0 || targetIdx >= scaleLine.length) {
      // 範囲外ならスキップ
      continue;
    }

    var newPitch = scaleLine[targetIdx];

    // 範囲外ノートのチェック
    if (!isPitchSafe(newPitch)) {

      // デバッグモード
      if (debugMode) {
        var bar = TA.getMeasureAt(note.getOnset());
        var lyric = note.getLyrics();

        logText.setValue(
          SV.T("Out of range after correction: ") + "\n" +
          (bar + 1) + SV.T("Bars") + "  「" + lyric + "」 : " +
          pitchToName(pitch) + " → " + pitchToName(newPitch)
        );
        showLogText.setValue(true);
      }

      showTemporaryMessage(SV.T("⚠ Cancel moving the notes"), 3000);
      SV.refreshSidePanel();
      return;
    }

    // setPitch しない。後でまとめて適用する。
    planned.push({
      note: note,
      oldPitch: originalPitch,
      snappedPitch: pitch,
      newPitch: newPitch
    });
  }

  // 2：まとめて適用
  for (var i = 0; i < planned.length; i++) {
    var item = planned[i];
    var note = item.note;
    var oldPitch = item.oldPitch;
    var snappedPitch = item.snappedPitch;
    var newPitch = item.newPitch;

    // snap が必要ならまず snap 位置へ
    if (snappedPitch !== oldPitch) {
      var diffSnap = snappedPitch - oldPitch;
      note.setPitch(snappedPitch);

      var groupSnap = note.getParent();
      var onsetSnap = note.getOnset();
      var endSnap = note.getEnd();

      for (var p = 0; p < groupSnap.getNumPitchControls(); p++) {
        var pitSnap = groupSnap.getPitchControl(p);
        var posSnap = pitSnap.getPosition();
        if (posSnap > onsetSnap && posSnap < endSnap) {
          pitSnap.setPitch(pitSnap.getPitch() + diffSnap);
        }
      }
    }

    // その上で degree 移動
    var diff = newPitch - snappedPitch;
    note.setPitch(newPitch);

    var group = note.getParent();
    var onset = note.getOnset();
    var end = note.getEnd();

    for (var p2 = 0; p2 < group.getNumPitchControls(); p2++) {
      var pit = group.getPitchControl(p2);
      var pos = pit.getPosition();
      if (pos > onset && pos < end) pit.setPitch(pit.getPitch() + diff);
    }

    // ログに小節番号（1から）と歌詞と音名を表示
    if (debugMode) {
      var bar = TA.getMeasureAt(onset); // 小節数のカウントは0から
      var lyric = note.getLyrics();
      logs.push(
        (bar + 1) + SV.T("Bars") + "「" + lyric + "」: " +
        pitchToName(oldPitch) + " → " + pitchToName(newPitch)
      );
    }
  }

  // スケール情報もログに含める
  if (debugMode) {
    var rootName = NOTE_NAMES[rootValue.getValue()];
    var scaleName = SCALE_DEFS_HARMONIZER[scaleValue.getValue()].name;
    logs.unshift("Scale: " + rootName + " " + scaleName);
  }

  // 一時メッセージ表示
  if (usedSnap) {
    showTemporaryMessage(SV.T("Corrected the notes out of scale."), 3000);
  } else {
    labelRangeText = analyzeSelectionRange();
  }

  // デバッグモードかつログがある時だけ表示（キャンセルされなかった時だけ）
  if (debugMode && logs.length > 0) {
    logText.setValue(logs.join("\n"));  // 空文字で上書きして非表示扱いに
    showLogText.setValue(true);
  }

  SV.refreshSidePanel();  // パネル更新
}



// スケールにない音をスケール内の最も近い音に修正（最寄りスケール音への上下自動判定）※ 同距離なら上の音を優先
function snapToNearest(pitch, scale) {
  var pc = pitch % 12;
  var octave = Math.floor(pitch / 12);

  var bestPitch = pitch;
  var bestDiff = 999;

  for (var o = octave - 1; o <= octave + 1; o++) {
    for (var i = 0; i < scale.length; i++) {
      var cand = o * 12 + scale[i];
      var diff = Math.abs(cand - pitch);

      if (diff < bestDiff) {
        bestDiff = diff;
        bestPitch = cand;
      }
      else if (diff == bestDiff && cand > bestPitch) {
        bestPitch = cand; // 同距離なら上
      }
    }
  }
  return bestPitch;
}

// 半音単位で直接ピッチを移動（8ve(±12), 9th(±14), tritone(±6), etc.）
function movePitchByInterval(semitoneOffset) {

  // ログをリセット
  showLogText.setValue(false);
  logText.setValue("");

  var editor = SV.getMainEditor();
  var notes = editor.getSelection().getSelectedNotes();

  if (debugMode) {
    if (!notes || notes.length == 0) {
      logText.setValue(SV.T("⚠ No notes selected"));
      showLogText.setValue(true);
    }
  }
  if (!notes || notes.length == 0) {
    showTemporaryMessage(SV.T("⚠ No notes selected"), 3000);
    return;
  }

  var TA = SV.getProject().getTimeAxis();
  var logs = [];

  // 1：全ノートの安全チェック
  for (var i = 0; i < notes.length; i++) {
    var note = notes[i];
    var oldPitch = note.getPitch();
    var newPitch = oldPitch + semitoneOffset;

    if (!isPitchSafe(newPitch)) {

      // デバッグログ
      if (debugMode) {
        var bar = TA.getMeasureAt(note.getOnset());
        var lyric = note.getLyrics();

        logText.setValue(
          SV.T("Out of range after correction: ") + "\n" +
          (bar + 1) + SV.T("Bars") + "「" + lyric + "」: " +
          pitchToName(oldPitch) + " → " + pitchToName(newPitch)
        );
        showLogText.setValue(true);
      }

      showTemporaryMessage(SV.T("⚠ Cancel moving the notes"), 3000);
      SV.refreshSidePanel();
      return; // ★ 全キャンセル
    }
  }

  // 2：全ノートをまとめて移動
  for (var i = 0; i < notes.length; i++) {
    var note = notes[i];
    var oldPitch = note.getPitch();
    var newPitch = oldPitch + semitoneOffset;

    note.setPitch(newPitch);

    // PitchControl 補正
    var group = note.getParent();
    var onset = note.getOnset();
    var end = note.getEnd();
    var diff = newPitch - oldPitch;

    for (var p = 0; p < group.getNumPitchControls(); p++) {
      var pit = group.getPitchControl(p);
      var pos = pit.getPosition();
      if (pos > onset && pos < end) pit.setPitch(pit.getPitch() + diff);
    }

    // ログ（debugMode のときだけ）
    if (debugMode) {
      var bar = TA.getMeasureAt(onset);
      var lyric = note.getLyrics();

      logs.push(
        (bar + 1) + SV.T("Bars") + "「" + lyric + "」: " +
        pitchToName(oldPitch) + " → " + pitchToName(newPitch)
      );
    }
  }

  // ログ表示
  if (debugMode && logs.length > 0) {
    logText.setValue(logs.join("\n"));
    showLogText.setValue(true);
  }

  // 音名表示更新
  labelRangeText = analyzeSelectionRange();

  SV.refreshSidePanel();
}





// 安全ガード（範囲外ノートのチェック）
function isPitchSafe(pitch) {
  return pitch >= 13 && pitch <= 111;
}


// スケールがグループに保存されているか判定
function isScaleSaved() {
  var groupRef = SV.getMainEditor().getCurrentGroup();
  if (!groupRef) return false;
  return !!groupRef.getScriptData("ScaleTools");
}

// 最後に選択したノートのピッチを保存
function recordSelectionPitches(notes) {
  lastSelectionPitches = [];
  for (var i = 0; i < notes.length; i++) {
    lastSelectionPitches.push(notes[i].getPitch());
  }
}

// 最後に選択したノートのピッチが変更されたか判定
function hasPitchChanged(notes) {
  if (notes.length !== lastSelectionPitches.length) return true;

  for (var i = 0; i < notes.length; i++) {
    if (notes[i].getPitch() !== lastSelectionPitches[i]) return true;
  }
  return false;
}

// ピッチ監視
function watchPitchChange() {
  var notes = SV.getMainEditor().getSelection().getSelectedNotes();
  if (!notes || notes.length === 0) return;

  // ピッチ変化チェック
  if (hasPitchChanged(notes)) {
    labelRangeText = analyzeSelectionRange();
    SV.refreshSidePanel();
    recordSelectionPitches(notes);
  }

  // 次のチェックを予約
  pitchWatchTimer = SV.setTimeout(100, watchPitchChange); // 100msごと
}



// 一時メッセージ表示
function showTemporaryMessage(msg, durationMs) {
  labelRangeText = msg;
  SV.refreshSidePanel();

  SV.setTimeout(durationMs, function () {
    labelRangeText = analyzeSelectionRange();  // 元の音名表示に戻す
    SV.refreshSidePanel();
  });
}


// 各種UIのコールバック

// 基音変更時にグループへ保存
rootValue.setValueChangeCallback(function (v) {
  if (isLoadingScale) return;  // 読み込み中は保存しない
  saveRootScaleToGroup();  // 基音とスケール設定をグループに保存
});

// スケール変更時にグループへ保存
scaleValue.setValueChangeCallback(function (v) {
  if (isLoadingScale) return;  // 読み込み中は保存しない
  saveRootScaleToGroup();  // 基音とスケール設定をグループに保存
});

// ノートの選択を検出
SV.getMainEditor().getSelection().registerSelectionCallback(function (selectionType, isSelected) {
  if (selectionType == "note") {
    var notes = SV.getMainEditor().getSelection().getSelectedNotes();

    // 音名表示更新
    labelRangeText = analyzeSelectionRange();
    SV.refreshSidePanel();

    // pitch を記録
    recordSelectionPitches(notes);

    // pitch 監視開始
    if (!pitchWatchTimer) {
      pitchWatchTimer = SV.setTimeout(100, watchPitchChange);
    }
  }
});


/*
SV.getMainEditor().getSelection().registerSelectionCallback(function (selectionType, isSelected) {
  if (selectionType == "note") {
    labelRangeText = analyzeSelectionRange();
    SV.refreshSidePanel();
  }
});
*/

// ノートの選択解除を検出
SV.getMainEditor().getSelection().registerClearCallback(function (selectionType) {
  if (selectionType == "notes") {
    pitchWatchTimer = null;
    labelRangeText = analyzeSelectionRange();
    SV.refreshSidePanel();
  }
});


/*
SV.getMainEditor().getSelection().registerClearCallback(function (selectionType) {
  if (selectionType == "notes") {
    labelRangeText = analyzeSelectionRange();
    SV.refreshSidePanel();
  }
});
*/

// スケールにない音をスケール内の最も近い音に修正（Correct Scale 用）
btnCorrect.setValueChangeCallback(function (v) {
  if (v) {  // ボタンが押された時
    if (!isScaleSaved()) saveRootScaleToGroup();  // スケールが保存されていない場合、グループに保存
    correctScaleOnly();  // スケールにない音をスケール内の最も近い音に修正
    btnCorrect.setValue(0);  // ボタンをリセット
  }
});


// スケール内の音程分だけ移動（-3度 用）
btnThirdDown.setValueChangeCallback(function (v) {
  if (v) {
    if (!isScaleSaved()) saveRootScaleToGroup();  // スケールが保存されていない場合、グループに保存
    moveScaleStep(-2);  // スケール内の音程分だけ移動
    btnThirdDown.setValue(0);  // ボタンをリセット
  }
});

// スケール内の音程分だけ移動（+3度 用）
btnThirdUp.setValueChangeCallback(function (v) {
  if (v) {
    if (!isScaleSaved()) saveRootScaleToGroup();  // スケールが保存されていない場合、グループに保存
    moveScaleStep(2);  // スケール内の音程分だけ移動
    btnThirdUp.setValue(0);  // ボタンをリセット
  }
});

// スケール内の音程分だけ移動（-1オクターブ 用）
btn8veDown.setValueChangeCallback(function (v) {
  if (v) {
    if (!isScaleSaved()) saveRootScaleToGroup();  // スケールが保存されていない場合、グループに保存
    movePitchByInterval(-12);  // スケール内の音程分だけ移動
    btn8veDown.setValue(0);  // ボタンをリセット
  }
});

// スケール内の音程分だけ移動（+1オクターブ 用）
btn8veUp.setValueChangeCallback(function (v) {
  if (v) {
    if (!isScaleSaved()) saveRootScaleToGroup();  // スケールが保存されていない場合、グループに保存
    movePitchByInterval(+12);  // スケール内の音程分だけ移動
    btn8veUp.setValue(0);  // ボタンをリセット
  }
});

// スケール内の音程分だけ移動（-5度 用）
btnFifthDown.setValueChangeCallback(function (v) {
  if (v) {
    if (!isScaleSaved()) saveRootScaleToGroup();  // スケールが保存されていない場合、グループに保存
    moveScaleStep(-4);  // スケール内の音程分だけ移動
    btnFifthDown.setValue(0);  // ボタンをリセット
  }
});

// スケール内の音程分だけ移動（+5度 用）
btnFifthUp.setValueChangeCallback(function (v) {
  if (v) {
    if (!isScaleSaved()) saveRootScaleToGroup();  // スケールが保存されていない場合、グループに保存
    moveScaleStep(4);  // スケール内の音程分だけ移動
    btnFifthUp.setValue(0);  // ボタンをリセット
  }
});

// スケール内の音程分だけ移動（-4度 用）
btnFourthDown.setValueChangeCallback(function (v) {
  if (v) {
    if (!isScaleSaved()) saveRootScaleToGroup();  // スケールが保存されていない場合、グループに保存
    moveScaleStep(-3);  // スケール内の音程分だけ移動
    btnFourthDown.setValue(0);  // ボタンをリセット
  }
});

// スケール内の音程分だけ移動（+4度 用）
btnFourthUp.setValueChangeCallback(function (v) {
  if (v) {
    if (!isScaleSaved()) saveRootScaleToGroup();  // スケールが保存されていない場合、グループに保存
    moveScaleStep(3);  // スケール内の音程分だけ移動
    btnFourthUp.setValue(0);  // ボタンをリセット
  }
});

// スケール内の音程分だけ移動（-6度 用）
btnSixthDown.setValueChangeCallback(function (v) {
  if (v) {
    if (!isScaleSaved()) saveRootScaleToGroup();  // スケールが保存されていない場合、グループに保存
    moveScaleStep(-5);  // スケール内の音程分だけ移動
    btnSixthDown.setValue(0);  // ボタンをリセット
  }
});

// スケール内の音程分だけ移動（+6度 用）
btnSixthUp.setValueChangeCallback(function (v) {
  if (v) {
    if (!isScaleSaved()) saveRootScaleToGroup();  // スケールが保存されていない場合、グループに保存
    moveScaleStep(5);  // スケール内の音程分だけ移動
    btnSixthUp.setValue(0);  // ボタンをリセット
  }
});

// スケール内の音程分だけ移動（-7度 用）
btnSeventhDown.setValueChangeCallback(function (v) {
  if (v) {
    if (!isScaleSaved()) saveRootScaleToGroup();  // スケールが保存されていない場合、グループに保存
    moveScaleStep(-6);  // スケール内の音程分だけ移動
    btnSeventhDown.setValue(0);  // ボタンをリセット
  }
});

// スケール内の音程分だけ移動（+7度 用）
btnSeventhUp.setValueChangeCallback(function (v) {
  if (v) {
    if (!isScaleSaved()) saveRootScaleToGroup();  // スケールが保存されていない場合、グループに保存
    moveScaleStep(6);  // スケール内の音程分だけ移動
    btnSeventhUp.setValue(0);  // ボタンをリセット
  }
});

// デバッグログクリア
btnClearLog.setValueChangeCallback(function (v) {
  if (v) {
    logText.setValue("");
    showLogText.setValue(false);
    SV.refreshSidePanel();
  }
});


// 度数ボタン定義
const INTERVAL_BUTTONS = [
  { key: "3rd", up: btnThirdUp, down: btnThirdDown },
  { key: "5th", up: btnFifthUp, down: btnFifthDown },
  { key: "8ve", up: btn8veUp, down: btn8veDown },
  { key: "4th", up: btnFourthUp, down: btnFourthDown },
  { key: "6th", up: btnSixthUp, down: btnSixthDown },
  { key: "7th", up: btnSeventhUp, down: btnSeventhDown },
];

// 基本の度数ボタン（3度・5度・8度）
function getBasicIntervalButtons() {
  return showAdvancedIntervals
    ? INTERVAL_BUTTONS.slice(0, 3)  // 3rd/5th/8ve
    : INTERVAL_BUTTONS.slice(0, 2); // 3rd/5th
}

// advanced度数ボタン（4度・6度・7度）
function getAdvancedIntervalButtons() {
  return INTERVAL_BUTTONS.slice(3, 6); // 4th/6th/7th
}


// 度数ボタンの行を作成
function makeIntervalRows(buttons) {
  var upRow = {
    "type": "Container",
    "columns": buttons.map(function (btn) {
      return {
        "type": "Button",
        "value": btn.up,
        "text": SV.T(btn.key + " +")
      };
    })
  };

  var downRow = {
    "type": "Container",
    "columns": buttons.map(function (btn) {
      return {
        "type": "Button",
        "value": btn.down,
        "text": SV.T(btn.key + " -")
      };
    })
  };

  return [upRow, downRow];
}


// UI定義
function getSidePanelSectionState() {

  // グループに保存されているスケール設定を復元
  loadRootScaleFromGroup();

  // スクリプト読み込み時に既存の選択ノートを反映
  (function initSelectionDisplay() {
    var notes = SV.getMainEditor().getSelection().getSelectedNotes();

    if (notes && notes.length > 0) {
      labelRangeText = analyzeSelectionRange();
      recordSelectionPitches(notes);

      // ピッチ監視を開始
      if (!pitchWatchTimer) {
        pitchWatchTimer = SV.setTimeout(100, watchPitchChange);
      }

    } else {
      labelRangeText = SV.T("No notes selected");
    }
  })();

  var logArea = null;
  var logClearArea = null;

  if (debugMode && showLogText.getValue()) {
    logArea = {
      "type": "Container",
      "columns": [
        {
          // デバッグ用ログ欄
          "type": "TextArea",
          "value": logText,
          "height": 120,
        }
      ]
    };

    // Clear ボタンは別コンテナ
    logClearArea = {
      "type": "Container",
      "columns": [
        {
          "type": "Button",
          "text": "Log Clear",
          "value": btnClearLog
        }
      ]
    };
  }

  // rows をまず作る
  var rows = [

    { // ルートとスケールの選択
      "type": "Container",
      "columns": [
        { "type": "ComboBox", "value": rootValue, "choices": getRootOptions(), "width": 0.3 },
        { "type": "ComboBox", "value": scaleValue, "choices": getScaleOptions(), "width": 0.7 }
      ]
    },

    { // スケールにない音をスケール内の最も近い音に修正
      "type": "Container",
      "columns": [
        { "type": "Button", "value": btnCorrect, "text": SV.T("Correct Scale"), "width": 0.5 }
      ]
    },
  ];

  // 基本セット（3rd/5th/8ve or 3rd/5th）
  rows = rows.concat(makeIntervalRows(getBasicIntervalButtons()));

  // フラグで追加表示
  if (showAdvancedIntervals) {

    // 区切り線
    rows.push({
      "type": "Label",
      "text": " - - - - - - - - - - - - - - - - - - - - - - - - - - - - "
    });

    // advanced セット（4th/6th/7th）
    rows = rows.concat(makeIntervalRows(getAdvancedIntervalButtons()));
  }

  rows.push({ // 音名表示
    "type": "Label",
    "text": labelRangeText
  });

  // ログ欄を rows の末尾に追加
  if (logArea) rows.push(logArea);
  if (logClearArea) rows.push(logClearArea);

  // 最後に return
  return {
    "title": SV.T("Scale Tools"),
    "rows": rows
  };
}
