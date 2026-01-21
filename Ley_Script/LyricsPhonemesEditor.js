/* スクリプトパネル用スクリプト
- まいこ氏作スクリプト（EditLyrics.js, SelectPlayPosiNote.js）を元に改変。
- 対象を選択ノート一つに限定し、歌詞と一緒に音素も編集できるようにしたもの。
  - 音素はデフォルト（未編集）状態では何も表示されません。
  - 歌唱言語もプルダウンから変更できるようにしました。（広東語だけUI表示を翻訳してくれません）
- 「取得」ボタンを押すとノート未選択でも再生バーの位置にあるノートの歌詞と音素を取得します。
  - スマートピッチ編集ツールやスマートピッチペンツール使用時に使うと便利。
- チェックボックスの「再生位置のノートを取得」をONにすると、常にノートが未選択状態でも再生バーの位置にあるノートの歌詞と音素を取得できます。
  - ただし再生バーを動かしただけでは反映されず、ピアノロール上でクリックや選択などの操作を行ったタイミングで更新されます。
*/

function getClientInfo() {
  return {
    "name" : ".LyricsPhonemesEditor",
    "author" : "Ley", 
    "versionNumber" : 1.1,
    "minEditorVersion" : 131330,
    "type": "SidePanelSection",
    "category" : "Ley Script"
  };
}

// ローカライズ設定
function getTranslations(langCode) {
  if(langCode == "ja-jp") {
    return [
      ["Lyrics/Phonemes Editor", "歌詞・音素編集"],
      ["Lyrics", "歌詞"],
      ["Select note at playback position", "再生位置のノートを取得"],
      ["Get note at playback", "取得"],
      ["Language", "言語"],
      ["Default Language", "デフォルト言語"],
      ["English", "英語"],
      ["Mandarin Chinese", "中国語標準語"],
      ["Japanese", "日本語"],
      ["Spanish", "スペイン語"],
      ["Cantonese Chinese", "広東語"], // Chineseをつけないと翻訳してくれない
      ["Korean", "韓国語"],
      // ["Skip br", "brをスキップする"],,
      // ["Skip a-z", "a-zをスキップする"],
      ["Reset Phoneme", "音素をリセット"],
      ["Apply", "適用"]
    ];
  }
  return [];
}

// initialize（初期化）
var selectAtPlaybackCheck = SV.create("WidgetValue"); // 再生位置のノートを取得
var getPlaybackNoteButton = SV.create("WidgetValue"); // 再生位置ノート取得ボタン
var lyricsField = SV.create("WidgetValue"); // 歌詞編集
var phonemesField = SV.create("WidgetValue"); // 音素編集
// var skipBr = SV.create("WidgetValue"); // br除外
// var skipAZ = SV.create("WidgetValue"); // a-z除外
var resetPhonemeButton = SV.create("WidgetValue"); // 音素編集をリセット
var applyButtonValue = SV.create("WidgetValue"); // 適用ボタン
var languageSelect = SV.create("WidgetValue"); // 歌唱言語プルダウン

// デフォルト値
selectAtPlaybackCheck.setValue(false); // デフォルトはOFF
// onSelectionChanged();
// skipBr.setValue(true);  // デフォルトはbr除外する 
// skipAZ.setValue(false); // デフォルトはa-zを除外しない
// languageSelect.setValue("Default Language"); // 初期値が必要。デフォルトはボイスの収録言語（表示名）

// プルダウン用表示名リスト
var languageChoices = [
  SV.T("Default Language"),
  SV.T("English"),
  SV.T("Mandarin Chinese"),
  SV.T("Japanese"),
  SV.T("Spanish"),
  SV.T("Cantonese Chinese"),  // Chineseをつけないと翻訳してくれない
  SV.T("Korean")
];


// 内部値マッピング
var languageCodes = [
  "",   // index 0  ※ 内部値は未設定
  "english",   // 1
  "mandarin",  // 2
  "japanese",  // 3
  "spanish",   // 4
  "cantonese", // 5
  "korean"     // 6
];

// デフォルト値（インデックスで指定）
selectAtPlaybackCheck.setValue(false);
languageSelect.setValue(0); // "Default Language"


// コールバック
// チェックボックス切り替え式再生位置のノートを取得コールバック
selectAtPlaybackCheck.setValueChangeCallback(function(value){
  if (value) {
    var note = selectNoteAtPlayback();
    if (note) {
      lyricsField.setValue(note.getLyrics());
      var ph = note.getPhonemes();
      phonemesField.setValue(ph && ph.trim() !== "" ? ph : "");
    } else {
      lyricsField.setValue("");
      phonemesField.setValue("");
    }
  } else {
    // OFFに戻したら現在の選択ノートを反映
    onSelectionChanged();
  }
});
// ボタン式再生位置のノートを取得コールバック
getPlaybackNoteButton.setValueChangeCallback(function(value){
  if (value == 1) {
    var note = selectNoteAtPlayback();
    if (note) {
      lyricsField.setValue(note.getLyrics());
      var ph = note.getPhonemes();
      phonemesField.setValue(ph && ph.trim() !== "" ? ph : "");
    } else {
      lyricsField.setValue("");
      phonemesField.setValue("");
    }
    getPlaybackNoteButton.setValue(0); // ボタンをリセット
  }
});

/*
//  プルダウン変更時に歌唱言語をノートへ適用
languageSelect.setValueChangeCallback(function(index){
  var value = languageCodes[index]; // 内部コード取得

  var selection = SV.getMainEditor().getSelection();
  var notes = selection.getSelectedNotes();
  if (notes.length == 0) return;

  var note = notes[0];
  var attr = note.getAttributes();

  if (value === "default") {
    // デフォルトに戻す → languageOverride を削除
    delete attr.languageOverride;
  } else {
    // 言語を明示設定
    attr.languageOverride = value;
  }

  note.setAttributes(attr);
});
*/

// Click event（適用ボタン実行処理）
applyButtonValue.setValueChangeCallback(function() {
  var selection = SV.getMainEditor().getSelection();
  var notes = selection.getSelectedNotes();
  if (notes.length == 0) return; // ノート未選択なら何もしない

  var note = notes[0]; // 常に最初の1ノートだけ扱う

  // 歌詞を適用
  var lyric = lyricsField.getValue();
  if (lyric && lyric.trim() !== "") {
    note.setLyrics(lyric);
  }

  // 音素を適用（空なら自動推定）
  var ph = phonemesField.getValue();
  if (ph && ph.trim() !== "") {
    note.setPhonemes(ph);
  } else {
    note.setPhonemes("");
  }

  // 歌唱言語設定を適用
  var idx = languageSelect.getValue();
  var value = languageCodes[idx];
  var attr3 = note.getAttributes();
  if (value === "default") {
    delete attr3.languageOverride;
  } else {
    attr3.languageOverride = value;
  }
  note.setAttributes(attr3);

});

/*
// "br, a-zをスキップするか選択できる機能
function shouldChangeLyric(note) {
  var regex = /^[a-z]$/;
  // if (skipBr.getValue() && (note.getLyrics() == "br" || note.getLyrics() == "-" || note.getLyrics() == "ー")) {
  if (skipBr.getValue() && (note.getLyrics() == "br")) {
    return false;
  } else if (skipAZ.getValue() && regex.test(note.getLyrics())){
    return false;
  } else{
    return true;
  }
}
function getSelectedNotes() {
  var selection = SV.getMainEditor().getSelection();
  var selectedNotes = selection.getSelectedNotes();
  return selectedNotes.sort(function(first, second){
    return first.getIndexInParent() - second.getIndexInParent();
  });
}
*/

// Note selection callback
SV.getMainEditor().getSelection().registerSelectionCallback(function(selectionType, isSelected) {
  if(selectionType == "note") {
    onSelectionChanged();
  }
});
SV.getMainEditor().getSelection().registerClearCallback(function(selectionType) {
  if(selectionType == "notes") {
    onSelectionChanged();
  }
});

// 音素編集をリセットする処理
resetPhonemeButton.setValueChangeCallback(function() {
  var selection = SV.getMainEditor().getSelection();
  var notes = selection.getSelectedNotes();
  if (notes.length == 0) return;

  var note = notes[0];
  note.setPhonemes(""); // 未編集状態に戻す
  phonemesField.setValue("");
});

// 再生位置のノートを選択する関数
function selectNoteAtPlayback() {
  var groupReference = SV.getMainEditor().getCurrentGroup();
  var group = groupReference.getTarget();
  var selection = SV.getMainEditor().getSelection();
  var playback = SV.getPlayback();
  var timeAxis = SV.getProject().getTimeAxis();
  var position = timeAxis.getBlickFromSeconds(playback.getPlayhead());
  var target = position - groupReference.getTimeOffset();

  for (var i = 0; i < group.getNumNotes(); i++) {
    var note = group.getNote(i);
    if (note.getOnset() < target && target < note.getEnd()) {
      selection.clearAll();
      selection.selectNote(note);
      return note;
    }
  }
  return null;
}

// 選択変更時の更新
function onSelectionChanged() {
  var selection = SV.getMainEditor().getSelection();
  var notes = selection.getSelectedNotes();

  // 再生位置モードがONなら再生位置からノートを取得
  if (selectAtPlaybackCheck.getValue()) {
    var note = selectNoteAtPlayback();
    if (!note) {
      lyricsField.setValue("");
      phonemesField.setValue("");
      return;
    }
    // 歌詞・音素
    lyricsField.setValue(note.getLyrics());
    var ph = note.getPhonemes();
    phonemesField.setValue(ph && ph.trim() !== "" ? ph : "");

    // 歌唱言語
    var attr = note.getAttributes();
    var lang = attr.languageOverride || "default";

    // lang に対応するインデックスを探してセット
    for (var i = 0; i < languageCodes.length; i++) {
      if (languageCodes[i] === lang) {
        languageSelect.setValue(i);
        break;
      }
    }
    return;

  }

  // 通常モード（選択ノートを反映）
  if (notes.length == 0) {
    lyricsField.setValue("");
    phonemesField.setValue("");
    return;
  }
  var note = notes[0];
  // 歌詞・音素
  lyricsField.setValue(note.getLyrics());
  var ph = note.getPhonemes();
  phonemesField.setValue(ph && ph.trim() !== "" ? ph : "");

  // 歌唱言語
  var attr = note.getAttributes();
  var lang = attr.languageOverride || "default";

  // lang に対応するインデックスを探してセット
  for (var i = 0; i < languageCodes.length; i++) {
    if (languageCodes[i] === lang) {
      languageSelect.setValue(i);
      break;
    }
  }
}


// Panel section（パネルUI）
function getSidePanelSectionState() {
  var section = {
    "title": SV.T("Lyrics/Phonemes Editor"),
    "rows": [
      { // 再生位置のノートを取得する
        "type": "Container",
        "columns": [
          {
            "type": "CheckBox",
            "text": SV.T("Select note at playback position"),
            "value": selectAtPlaybackCheck,
            "width": 0.7
          },
          {
            "type": "Button",
            "text": SV.T("Get note at playback"),
            "value": getPlaybackNoteButton,
            "width": 0.3
          }
        ]
      },
      {
        "type": "Label",
        "text": SV.T("Language"),
      },
      {
        "type": "Container",
        "columns": [
          { // 歌唱言語
            "type": "ComboBox",
            "choices": languageChoices,
            "value": languageSelect
          }
        ]
      },
      {
        "type": "Label",
        "text": SV.T("Phonemes")
      },
      {  // 音素編集エリア
        "type": "Container",
        "columns": [
          { 
            "type": "TextArea", 
            "value": phonemesField,
            "height": 30, 
            "width": 1.0 
          }
        ]
      },
      {
        "type": "Label",
        "text": SV.T("Lyrics")
      },
      { // 歌詞編集エリア
        "type": "Container",
        "columns": [
          {
            "type": "TextArea",
            "value": lyricsField,
            "height": 30, // 100
            "width": 1.0
          }
        ]
      },
     /*
      { // brを除外するチェックボックス
        "type": "Container",
        "columns": [
          {
            "type": "CheckBox",
            "text": SV.T("Skip br"),
            "value": skipBr,
            "width": 1.0
          }
        ]
      },
      { // a-zを除外するチェックボックス
        "type": "Container",
        "columns": [
          {
            "type": "CheckBox",
            "text": SV.T("Skip a-z"),
            "value": skipAZ,
            "width": 1.0
          }
        ]
      },
      */
      { 
        "type": "Container",
        "columns": [
          { // 適用ボタン
            "type": "Button",
            "text": SV.T("Apply"),
            "width": 0.5, // 1.0
            "value": applyButtonValue
          },
          { // 音素編集のリセットボタン
            "type": "Button",
            "text": SV.T("Reset Phoneme"),
            "width": 0.5,
            "value": resetPhonemeButton
          }
        ]
      },
    ]
  };
  return section;
}
