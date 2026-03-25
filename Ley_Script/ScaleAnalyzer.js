/*
- 此岸さくら氏作スクリプト（ScaleManager.js）を参考に作成したスクリプトパネル用スクリプト。
  - 主音推定方式ではなく構成音からスケール候補をピックアップするスケール解析ツール。
    - 曲調から候補を絞り込むことも可能。
  - 構成音が全く同じスケール（平行調やモードなど）はひとまとめにして表示されます。
    - OctatonicスケールのHalf-Whole（半音-全音）はSV2 Editor のスケール設定が非対応なので除外しています。
  - 一度解析したスケールはプロジェクトファイルに保存されるのでグループ別に解析結果を保持できます。
    - 此岸さくら氏作スクリプト（ParameterBox.js）のScriptData管理方式を参考に実装。
*/

function getClientInfo() {
  return {
    "name": "Scale Analyzer",
    "author": "Ley",
    "versionNumber": 1.2,
    "minEditorVersion": 131330,
    "type": "SidePanelSection",
    "category": "Ley Script"
  };
}


function getTranslations(langCode) {
  if (langCode == "ja-jp") {
    return [
      ["Scale Analyzer", "スケール解析ツール"],
      ["Analyze Scales", "スケール適合率を解析"],
      ["Any Mood", "指定なし"],
      ["Bright / Standard", "明るい / 王道"], // moods = 1
      ["Dark / Emotional", "切ない / 哀愁"], // moods = 2
      ["Jazzy / Groovy", "おしゃれ / 都会的"], // moods = 3
      ["Exotic / Dramatic", "異国感 / 劇的"], // moods = 4
      ["No notes found.", "ノートが見つかりません。"],
      ["Too few notes selected. Please select at least 3 notes.", "選択ノート数が少なすぎます。3つ以上選択してください。"], // 翻訳文に\nは使えない？
      ["Match:", "適合率:"],
      ["Note Analysis", "ノート解析"],
      ["Bars", "小節"],
      ["to", "～"],
    ];
  }
  return [];
}


// スケール名、構成音、曲の雰囲気（複数に該当しそうなものは配列に複数入れる）
var SCALE_DEFS = [
  { name: "Major", iv: [0, 2, 4, 5, 7, 9, 11], moods: [1] },
  { name: "Natural Minor", iv: [0, 2, 3, 5, 7, 8, 10], moods: [2] },
  { name: "Harmonic Minor", iv: [0, 2, 3, 5, 7, 8, 11], moods: [2, 4] },
  { name: "Melodic Minor", iv: [0, 2, 3, 5, 7, 9, 11], moods: [2, 3] },
  { name: "Maj. Pentatonic", iv: [0, 2, 4, 7, 9], moods: [1] },
  { name: "Min. Pentatonic", iv: [0, 3, 5, 7, 10], moods: [2] },
  { name: "Major Blues", iv: [0, 2, 3, 4, 7, 9], moods: [1, 3] },
  { name: "Minor Blues", iv: [0, 3, 5, 6, 7, 10], moods: [2, 3] },
  { name: "Dorian", iv: [0, 2, 3, 5, 7, 9, 10], moods: [3] },
  { name: "Phrygian", iv: [0, 1, 3, 5, 7, 8, 10], moods: [2, 4] },
  { name: "Lydian", iv: [0, 2, 4, 6, 7, 9, 11], moods: [1, 3] },
  { name: "Mixolydian", iv: [0, 2, 4, 5, 7, 9, 10], moods: [3] },
  { name: "Locrian", iv: [0, 1, 3, 5, 6, 8, 10], moods: [4] },
  { name: "Whole Tone", iv: [0, 2, 4, 6, 8, 10], moods: [4] },
  { name: "Octatonic (Half-Whole)", iv: [0, 1, 3, 4, 6, 7, 9, 10], moods: [4] },  // SV2 Editor のスケール設定には含まれていない（Combination of Diminished Scale）
  { name: "Octatonic (Whole-Half)", iv: [0, 2, 3, 5, 6, 8, 9, 11], moods: [4] },  // Diminished Scale
];

// 音名
var NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// マスクグループ（構成音のビットマスクをキー、スケール名とムードタグの配列を値とする）
var maskGroups = {};
for (var i = 0; i < SCALE_DEFS.length; i++) {
  for (var root = 0; root < 12; root++) {
    var mask = 0;
    for (var j = 0; j < SCALE_DEFS[i].iv.length; j++) {
      var pitchClass = (root + SCALE_DEFS[i].iv[j]) % 12;
      mask |= (1 << (11 - pitchClass));
    }
    // マスクグループにスケール名とムードタグを追加
    if (!maskGroups[mask]) {
      maskGroups[mask] = [];
    }
    // スケール名と一緒に、そのスケールが持つ雰囲気タグも保存
    maskGroups[mask].push({
      name: NOTE_NAMES[root] + " " + SCALE_DEFS[i].name,
      moods: SCALE_DEFS[i].moods
    });
  }
}

var textValue = SV.create("WidgetValue"); // テキスト表示用
var buttonValue = SV.create("WidgetValue"); // ボタン用
var moodCombo = SV.create("WidgetValue"); // ムードコンボボックス用
// moodCombo.setValue(0); // デフォルトは「指定なし」
if (moodCombo.getValue() == null) {   // moodCombo が null の場合（初期状態）は 0 をセット（一度だけ初期化）
  moodCombo.setValue(0);
}
var mainEditor = SV.getMainEditor();  // メインエディタ
var clearButtonValue = SV.create("WidgetValue");  // クリアボタン用
var allClearButtonValue = SV.create("WidgetValue");  // 全クリアボタン用

// Octatonic スケール名の正規化
function normalizeOctatonicName(name) {

  // 非対応スケール（Half–Whole / H-W）は null を返す
  if (
    name.indexOf("Half-Whole") !== -1 ||
    name.indexOf("H-W") !== -1
  ) {
    return null;
  }

  // 対応スケール（Whole–Half / W-H）はキー名を残して Octatonic に統一
  if (
    name.indexOf("Whole-Half") !== -1 ||
    name.indexOf("W-H") !== -1
  ) {
    // 例: "E Octatonic (Whole-Half)" → "E Octatonic"
    return name.replace(/\s*\(.*?\)/, "");
  }

  return name;
}

// 特定の歌詞を除外する
function isNoteExcluded(note) {
  var lyr = note.getLyrics();

  // br は常に除外
  if (lyr === "br") return true;

  // チェックボックスで除外対象を切り替えたい場合
  // if (excludeDash && (lyr === "-" || lyr === "+")) return true;

  return false;
}

// ボタンが押されたときの処理
buttonValue.setValueChangeCallback(function () {
  var selection = mainEditor.getSelection();
  var targetGroup = mainEditor.getCurrentGroup().getTarget();
  var sourceNotes = [];

  // ノートの取得
  if (selection.hasSelectedNotes()) {
    var selectedNotes = selection.getSelectedNotes();
    // ノート選択時の安全チェック（例：3 ノート未満なら解析禁止）
    var filteredNotes = [];
    for (var i = 0; i < selectedNotes.length; i++) {
      if (!isNoteExcluded(selectedNotes[i])) {
        filteredNotes.push(selectedNotes[i]);
      }
    }
    // 警告文
    if (filteredNotes.length < 3) {
      textValue.setValue(SV.T("Too few notes selected. Please select at least 3 notes."));
      return;
    }
    // for (var i = 0; i < selectedNotes.length; i++) sourceNotes.push(selectedNotes[i]);   // br も含まれる
    // 特定歌詞 を除外
    for (var i = 0; i < filteredNotes.length; i++) {
      sourceNotes.push(filteredNotes[i]);
    }

  } else {  // ノートが選択されていない場合は全ノートを取得（グループ選択時）
    var numNote = targetGroup.getNumNotes();
    // for (var i = 0; i < numNote; i++) sourceNotes.push(targetGroup.getNote(i));   // br も含まれる
    // 特定歌詞 を除外
    for (var i = 0; i < numNote; i++) {
      var note = targetGroup.getNote(i);
      if (!isNoteExcluded(note)) {
        sourceNotes.push(note);
      }
    }
  }
  // ノート数の確認
  var totalNotes = sourceNotes.length;
  if (totalNotes === 0) {
    textValue.setValue(SV.T("No notes found."));
    return;
  }

  // 音階のカウント
  var pitchCounts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (var i = 0; i < totalNotes; i++) {
    var p = sourceNotes[i].getPitch();
    var pitchClass = ((p % 12) + 12) % 12;
    pitchCounts[pitchClass]++;
  }

  // ムードの取得
  var selectedMood = moodCombo.getValue(); // 0:指定なし, 1:明るめ, 2:切ない, 3:おしゃれ, 4:異国情緒
  var results = [];

  // マスクグループのループ
  for (var maskStr in maskGroups) {
    var maskInt = parseInt(maskStr);
    var matchedNotesCount = 0;

    // 音階のカウント
    for (var pc = 0; pc < 12; pc++) {
      if ((maskInt & (1 << (11 - pc))) !== 0) {
        matchedNotesCount += pitchCounts[pc];
      }
    }

    // 適合率の計算
    var percentage = (matchedNotesCount / totalNotes) * 100;

    // 70%未満は省く
    if (percentage < 70) continue;

    // 選択された雰囲気に合致するスケール名だけを抽出
    var filteredNames = [];
    var scalesInMask = maskGroups[maskStr];
    for (var n = 0; n < scalesInMask.length; n++) {
      var name = scalesInMask[n].name;

      // 表示から Half–Whole を除外する場合
      if (!(name = normalizeOctatonicName(name))) continue;

      if (selectedMood === 0 || scalesInMask[n].moods.indexOf(selectedMood) !== -1) {
        // filteredNames.push(scalesInMask[n].name);  // 元の名前で表示される
        filteredNames.push(name); // normalizeOctatonicName が存在しない時は何もしない（元の名前）
      }
    }

    // 合致するスケール名が1つ以上ある場合のみ、結果リストに追加
    if (filteredNames.length > 0) {
      results.push({
        mask: maskInt,
        names: filteredNames,
        score: percentage,
        moods: scalesInMask.map(function (x) { return x.moods; })   // mood 情報を保存
      });
    }
  }

  // 結果のソート
  results.sort(function (a, b) {
    if (Math.abs(b.score - a.score) > 0.1) {
      return b.score - a.score;
    }
    // 音階の数でソート
    var aBitCount = 0, bBitCount = 0;
    for (var i = 0; i < 12; i++) {
      if ((a.mask & (1 << i)) !== 0) aBitCount++;
      if ((b.mask & (1 << i)) !== 0) bBitCount++;
    }
    return bBitCount - aBitCount;
  });

  // --- 表示用のテキスト組み立て処理を改修 ---
  var outputText = "";

  // スコア（小数点第1位まで）をキーにしてグループ化
  var scoreGroups = {};
  var scoreKeys = [];

  // スコアグループのループ
  for (var i = 0; i < results.length; i++) {
    var res = results[i];
    var scoreStr = res.score.toFixed(1);

    // スコアグループの作成
    if (!scoreGroups[scoreStr]) {
      scoreGroups[scoreStr] = [];
      scoreKeys.push(scoreStr); // 順序を保持
    }
    // 同じ構成音のスケール名リストを追加
    scoreGroups[scoreStr].push(res.names);
  }

  // 上位のスコアグループをいくつか表示（適合率70％以上の上位5つのスコア帯まで表示）
  var numScoresToShow = Math.min(5, scoreKeys.length);

  // スコアグループのループ
  for (var i = 0; i < numScoresToShow; i++) {
    var scoreStr = scoreKeys[i];
    outputText += "【" + SV.T("Match:") + " " + scoreStr + "%】\n";

    var groups = scoreGroups[scoreStr];
    // スケール名のループ
    for (var g = 0; g < groups.length; g++) {
      var namesList = groups[g].join(" / ");

      var formattedNames = "";  // 初期化（開業しない場合は不要）
      var words = namesList.split(" / ");
      var line = "";

      /*
      // テキストエリアの幅に合わせて適度に改行する場合（38文字）
      for(var w = 0; w < words.length; w++) {
          if(line.length + words[w].length > 38) {
              formattedNames += line + "\n    ";
              line = words[w] + " / ";
          } else {
              line += words[w] + " / ";
          }
      }
      formattedNames += line.slice(0, -3); // 最後の不要な " / " を削除
      */
      // 改行しない場合
      var formattedNames = words.join(" / ");

      outputText += "  " + formattedNames + "\n";
    }
    outputText += "\n";
  }

  // 解析結果保存処理（ScriptData）
  var nowGroupRef = mainEditor.getCurrentGroup();
  var TA = SV.getProject().getTimeAxis();

  // ノート解析かどうか判定
  var header = "";
  if (selection.hasSelectedNotes()) {
    var startBlick = filteredNotes[0].getOnset();
    var endBlick = filteredNotes[filteredNotes.length - 1].getEnd();
    var TA = SV.getProject().getTimeAxis();
    var startBar = TA.getMeasureAt(startBlick);
    var endBar = TA.getMeasureAt(endBlick);
    header = "["
      + SV.T("Note Analysis") + ": "
      + SV.T("Bars") + " " + startBar + " " + SV.T("to") + " " + endBar
      + "]";
  } else {
    header = "";  // Group解析のヘッダー情報はなし
  }

  // 保存（テキスト＋JSON＋ヘッダー）
  nowGroupRef.setScriptData("scaleAnalyzer_text", outputText.trim());
  nowGroupRef.setScriptData("scaleAnalyzer_raw", JSON.stringify(results));
  nowGroupRef.setScriptData("scaleAnalyzer_header", header);

  // mood の選択状態を保存
  nowGroupRef.setScriptData("scaleAnalyzer_mood", selectedMood);

  if (header !== "") {  // ノート解析の場合、ヘッダーを表示
    textValue.setValue(header + "\n" + outputText.trim());
  } else {  // Group解析の場合、ヘッダーを表示しない
    textValue.setValue(outputText.trim());
  }
  SV.refreshSidePanel();   // UI更新
});


// mood 絞り込み（JSON を再整形）
function rebuildTextFromRaw(rawJson, mood) {
  var results = JSON.parse(rawJson);
  var output = "";

  // mood 絞り込み
  var filtered = [];
  for (var i = 0; i < results.length; i++) {
    var names = results[i].names.filter(function (n, idx) {
      return mood === 0 || results[i].moods[idx].indexOf(mood) !== -1;
    });
    if (names.length > 0) {
      filtered.push({
        score: results[i].score,
        names: names
      });
    }
  }

  // ソート
  filtered.sort(function (a, b) { return b.score - a.score; });

  // 整形
  for (var i = 0; i < filtered.length; i++) {
    output += "【" + SV.T("Match") + " " + filtered[i].score.toFixed(1) + "%】\n";
    output += "  " + filtered[i].names.join(" / ") + "\n\n";
  }

  return output.trim();
}

// クリアボタンが押されたときの処理
clearButtonValue.setValueChangeCallback(function () {
  var nowGroupRef = mainEditor.getCurrentGroup();
  nowGroupRef.removeScriptData("scaleAnalyzer_text");
  nowGroupRef.removeScriptData("scaleAnalyzer_raw");
  nowGroupRef.removeScriptData("scaleAnalyzer_header");
  nowGroupRef.removeScriptData("scaleAnalyzer_mood");
  moodCombo.setValue(0);  // mood を「指定なし」に戻す
  SV.refreshSidePanel();  // UI更新
});

// 全クリアボタンが押されたときの処理
allClearButtonValue.setValueChangeCallback(function () {
  var project = SV.getProject();
  var numTracks = project.getNumTracks();

  for (var t = 0; t < numTracks; t++) {
    var track = project.getTrack(t);
    var numGroups = track.getNumGroups();

    for (var g = 0; g < numGroups; g++) {
      var groupRef = track.getGroupReference(g);
      groupRef.removeScriptData("scaleAnalyzer_text");
      groupRef.removeScriptData("scaleAnalyzer_raw");
      groupRef.removeScriptData("scaleAnalyzer_header");
      groupRef.removeScriptData("scaleAnalyzer_mood");
    }
  }

  moodCombo.setValue(0);  // mood を「指定なし」に戻す
  SV.refreshSidePanel();  // UI更新
});

// mood 変更時に JSON を再整形（savedRaw を毎回読み直す）
moodCombo.setValueChangeCallback(function () {
  var nowGroupRef = mainEditor.getCurrentGroup();
  var raw = nowGroupRef.getScriptData("scaleAnalyzer_raw");
  var header = nowGroupRef.getScriptData("scaleAnalyzer_header");

  // mood を保存
  nowGroupRef.setScriptData("scaleAnalyzer_mood", moodCombo.getValue());

  // raw が無い時は何もしない
  if (!raw) return;

  var rebuilt = rebuildTextFromRaw(raw, moodCombo.getValue());

  if (header && header !== "") {
    textValue.setValue(header + "\n" + rebuilt);
  } else {
    textValue.setValue(rebuilt);
  }
});



// グループ選択変更・クリア時にテキストを自動更新
var mainSelection = mainEditor.getSelection();

function onSelectionChanged() {
  var nowGroupRef = mainEditor.getCurrentGroup();
  var savedText = nowGroupRef.getScriptData("scaleAnalyzer_text");
  var savedHeader = nowGroupRef.getScriptData("scaleAnalyzer_header");
  // mood の選択状態を復元
  var savedMood = nowGroupRef.getScriptData("scaleAnalyzer_mood");
  if (savedMood != null) {
    moodCombo.setValue(parseInt(savedMood));
  } else {
    moodCombo.setValue(0);
  }

  if (savedText) {
    if (savedHeader && savedHeader !== "") {  // ノート解析の場合ヘッダーを表示
      textValue.setValue(savedHeader + "\n" + savedText);
    } else {
      textValue.setValue(savedText);  // グループ解析の場合ヘッダーを表示しない
    }
  } else {
    textValue.setValue(SV.T("Analyze Scales"));
  }

  SV.refreshSidePanel();
}

mainSelection.registerSelectionCallback(function (type, isSelected) {
  onSelectionChanged();
});

mainSelection.registerClearCallback(function (type) {
  onSelectionChanged();
});

// サイドパネルのUI構築
function getSidePanelSectionState() {
  var nowGroupRef = mainEditor.getCurrentGroup();
  var savedText = nowGroupRef.getScriptData("scaleAnalyzer_text");
  var savedRaw = nowGroupRef.getScriptData("scaleAnalyzer_raw");
  var savedHeader = nowGroupRef.getScriptData("scaleAnalyzer_header");
  // mood の選択状態を復元
  var savedMood = nowGroupRef.getScriptData("scaleAnalyzer_mood");
  if (savedMood != null) {
    moodCombo.setValue(parseInt(savedMood));
  } else {
    moodCombo.setValue(0);
  }

  var section = {
    "title": SV.T("Scale Analyzer"),
    "rows": [
      {
        "type": "Container",
        "columns": [
          { // 曲の雰囲気の指定
            "type": "ComboBox",
            "choices": [
              SV.T("Any Mood"), // 指定なし
              SV.T("Bright / Standard"), // 明るめ
              SV.T("Dark / Emotional"), // 切ない
              SV.T("Jazzy / Groovy"), // おしゃれ
              SV.T("Exotic / Dramatic"), // 異国情緒
            ],
            "value": moodCombo
          }
        ]
      },
      {
        "type": "Container",
        "columns": [
          { // スケール解析結果の表示
            "type": "TextArea",
            "value": textValue,
            "height": 280,
          }
        ]
      },
      {
        "type": "Container",
        "columns": [
          { // スケール解析の実行
            "type": "Button",
            "value": buttonValue,
            "text": SV.T("Analyze Scales"),
          }
        ]
      }
    ]
  };

  // saved がある時だけ Clear / All Clear ボタンを追加
  if (savedText) {
    section.rows.push({
      "type": "Container",
      "columns": [
        {
          "type": "Button",
          "text": "Clear",
          "value": clearButtonValue,
          "width": 0.5
        },
        {
          "type": "Button",
          "text": "All Clear",
          "value": allClearButtonValue,
          "width": 0.5
        },
      ]
    });
  }

  // 初期表示
  if (savedText) {
    if (savedHeader && savedHeader !== "") {  // ノート解析の場合ヘッダーを表示
      textValue.setValue(savedHeader + "\n" + savedText);
    } else {
      textValue.setValue(savedText);  // グループ解析の場合ヘッダーを表示しない
    }
  } else {
    textValue.setValue(SV.T("Analyze Scales"));
  }

  // テキストエリアを編集不可にする
  textValue.setEnabled(false);
  return section;
}
