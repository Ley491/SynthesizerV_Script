/*
- 此岸さくら氏作スクリプト（ScaleManager.js）を参考に作成したスクリプトパネル用スクリプト。
  - 主音推定方式ではなく構成音からスケール候補をピックアップするスケール解析ツール。
    - 曲調から候補を絞り込むことも可能。
  - 構成音が全く同じスケール（平行調やモードなど）はひとまとめにして表示されます。
*/

function getClientInfo() {
  return {
    "name": "Scale Analyzer",
    "author": "Ley",
    "versionNumber": 1.0,
    "minEditorVersion": 131330,
    "type": "SidePanelSection",
    "category": "Ley Script"
  };
}


function getTranslations(langCode) {
  if(langCode == "ja-jp") {
    return [
        ["Scale Analyzer", "スケール解析ツール"],
        ["Analyze Scales", "スケール適合率を解析"],
        ["No notes found.", "ノートが見つかりません。"],
        ["Match:", "適合率:"],
        ["Any Mood", "指定なし"],
        ["Bright / Standard", "明るい / 王道"], // moods = 1
        ["Dark / Emotional", "切ない / 哀愁"], // moods = 2
        ["Jazzy / Groovy", "おしゃれ / 都会的"], // moods = 3
        ["Exotic / Dramatic", "異国感 / 劇的"], // moods = 4
    ];
  }
  return [];
}


// 複数に該当しそうなものは配列に複数入れる
var SCALE_DEFS = [
  { name: "Major", iv: [0, 2, 4, 5, 7, 9, 11], moods: [1] },
  { name: "Natural Minor", iv: [0, 2, 3, 5, 7, 8, 10], moods: [2] },
  { name: "Harmonic Minor", iv: [0, 2, 3, 5, 7, 8, 11] , moods: [2, 4] },
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
  { name: "Octatonic (H-W)", iv: [0, 1, 3, 4, 6, 7, 9, 10], moods: [4] },
  { name: "Octatonic (W-H)", iv: [0, 2, 3, 5, 6, 8, 9, 11], moods: [4] },
];

var NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

var maskGroups = {};
for (var i = 0; i < SCALE_DEFS.length; i++) {
  for (var root = 0; root < 12; root++) {
    var mask = 0;
    for (var j = 0; j < SCALE_DEFS[i].iv.length; j++) {
      var pitchClass = (root + SCALE_DEFS[i].iv[j]) % 12;
      mask |= (1 << (11 - pitchClass));
    }
    
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

var textValue = SV.create("WidgetValue");
var buttonValue = SV.create("WidgetValue");
var moodCombo = SV.create("WidgetValue");
moodCombo.setValue(0); 
var mainEditor = SV.getMainEditor();


buttonValue.setValueChangeCallback(function(){
  var selection = mainEditor.getSelection();
  var targetGroup = mainEditor.getCurrentGroup().getTarget();
  var sourceNotes = [];
  
  if (selection.hasSelectedNotes()) {
    var selectedNotes = selection.getSelectedNotes();
    for (var i = 0; i < selectedNotes.length; i++) sourceNotes.push(selectedNotes[i]);
  } else {
    var numNote = targetGroup.getNumNotes();
    for (var i = 0; i < numNote; i++) sourceNotes.push(targetGroup.getNote(i));
  }

  var totalNotes = sourceNotes.length;
  if (totalNotes === 0) {
    textValue.setValue(SV.T("No notes found."));
    return;
  }

  var pitchCounts = [0,0,0,0,0,0,0,0,0,0,0,0];
  for (var i = 0; i < totalNotes; i++) {
    var p = sourceNotes[i].getPitch();
    var pitchClass = ((p % 12) + 12) % 12;
    pitchCounts[pitchClass]++;
  }

  var selectedMood = moodCombo.getValue(); // 0:指定なし, 1:明るめ, 2:切ない, 3:おしゃれ, 4:異国情緒
  var results = [];

  for (var maskStr in maskGroups) {
    var maskInt = parseInt(maskStr);
    var matchedNotesCount = 0;
    
    for (var pc = 0; pc < 12; pc++) {
      if ((maskInt & (1 << (11 - pc))) !== 0) {
        matchedNotesCount += pitchCounts[pc];
      }
    }
    
    var percentage = (matchedNotesCount / totalNotes) * 100;

    // 70%未満は省く
    if (percentage < 70) continue;

    // 選択された雰囲気に合致するスケール名だけを抽出
    var filteredNames = [];
    var scalesInMask = maskGroups[maskStr];
    for (var n = 0; n < scalesInMask.length; n++) {
        if (selectedMood === 0 || scalesInMask[n].moods.indexOf(selectedMood) !== -1) {
            filteredNames.push(scalesInMask[n].name);
        }
    }
    
    // 合致するスケール名が1つ以上ある場合のみ、結果リストに追加
    if (filteredNames.length > 0) {
        results.push({
          mask: maskInt,
          names: filteredNames,
          score: percentage
        });
    }
  }

  results.sort(function(a, b) {
    if (Math.abs(b.score - a.score) > 0.1) {
        return b.score - a.score;
    }
    var aBitCount = 0, bBitCount = 0;
    for(var i=0; i<12; i++) {
        if((a.mask & (1<<i)) !== 0) aBitCount++;
        if((b.mask & (1<<i)) !== 0) bBitCount++;
    }
    return bBitCount - aBitCount;
  });

  // --- 表示用のテキスト組み立て処理を改修 ---
  var outputText = "";
  
  // スコア（小数点第1位まで）をキーにしてグループ化
  var scoreGroups = {};
  var scoreKeys = [];

  for (var i = 0; i < results.length; i++) {
    var res = results[i];
    var scoreStr = res.score.toFixed(1);
    
    if (!scoreGroups[scoreStr]) {
      scoreGroups[scoreStr] = [];
      scoreKeys.push(scoreStr); // 順序を保持
    }
    // 同じ構成音のスケール名リストを追加
    scoreGroups[scoreStr].push(res.names);
  }

  // 上位のスコアグループをいくつか表示（適合率70％以上の上位5つのスコア帯まで表示）
  var numScoresToShow = Math.min(5, scoreKeys.length);

  for (var i = 0; i < numScoresToShow; i++) {
    var scoreStr = scoreKeys[i];
    outputText += "【" + SV.T("Match:") + " " + scoreStr + "%】\n";
    
    var groups = scoreGroups[scoreStr];
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

  textValue.setValue(outputText.trim());
});

function getSidePanelSectionState() {
  var section = {
    "title": SV.T("Scale Analyzer"),
    "rows": [
      {
        "type": "Container",
        "columns":[
            {
            "type": "ComboBox",
            "choices": [
                SV.T("Any Mood"),
                SV.T("Bright / Standard"),
                SV.T("Dark / Emotional"),
                SV.T("Jazzy / Groovy"),
                SV.T("Exotic / Dramatic"),
            ],
            "value": moodCombo
            }
        ]
      },
      {
        "type": "Container",
        "columns":[
            {
            "type": "TextArea",
            "value": textValue,
            "height": 280,
            }
        ],
      },
      {
        "type": "Container",
        "columns":[
            {
            "type": "Button",
            "value": buttonValue,
            "text": SV.T("Analyze Scales"),
            }
        ],
      }
    ],
  };

  moodCombo.setValue(0); // デフォルトは「指定なし」
  textValue.setValue(SV.T("Analyze Scales"));
  textValue.setEnabled(false);
  return section;
}
