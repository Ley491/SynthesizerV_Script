/* スクリプトパネル用スクリプト
- まいこ氏作スクリプト（EditLyrics.js, SelectPlayPosiNote.js）を元に改変。
- 対象を選択ノート一つに限定し、歌詞と一緒に音素も編集できるようにしたもの。（br, +/- も取得対象）
  - 音素はデフォルト（未編集）状態では何も表示されません。
  - 歌唱言語もプルダウンから変更できるようにしました。
- 「取得」ボタンを押すとノート未選択でも再生バーの位置にあるノートの歌詞と音素を取得します。
  - スマートピッチ編集ツールやスマートピッチペンツール使用時に使うと便利。
- チェックボックスの「再生位置のノートを取得」をONにすると、常にノートが未選択状態でも再生バーの位置にあるノートの歌詞と音素を取得し続けます。（
  - 此岸さくら氏の ParameterBox.js の monitorParameter を参考
  - OFFの時は選択ノートの対象を前/後ろのノートに変更できるボタンが表示されます。
)
*/

function getClientInfo() {
  return {
    "name": ".LyricsPhonemesEditor",
    "author": "Ley",
    "versionNumber": 1.4,
    "minEditorVersion": 131330,
    "type": "SidePanelSection",
    "category": "Ley Script",
  };
}

// ローカライズ設定
function getTranslations(langCode) {
  if (langCode == "ja-jp") {
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
      ["Apply", "適用"],
      ["◀ Previous", "◀ 前のノート"],
      ["Next ▶", "次のノート ▶"]
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
var prevNoteButton = SV.create("WidgetValue");  // 前のノートへ移動
var nextNoteButton = SV.create("WidgetValue");  // 次のノートへ移動
var lastLyricsValue = ""; // 歌詞欄の最終適用値（Enter検出用）
var lastPhonemesValue = ""; // 音素欄の最終適用値（Enter検出用）
// コードから setValue() を呼び出している最中かどうかを示すフラグ
var isUpdatingFromCode = false; // true の間はコールバックによる自動適用を抑制する
var editingNoteIndex = -1; // 現在UI（歌詞・音素欄）に表示・編集中のノートのインデックス



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
// モニターモード用変数追加（此岸さくら氏の ParameterBox.js の monitorParameter を参考）
var monitorInterval = 50;
var lastNoteIndex = -1;

// 再生位置を追従して自動更新するループ関数
function monitorPlaybackNote() {
  // チェックボックスがONの間だけ実行
  if (selectAtPlaybackCheck.getValue()) {
    var note = selectNoteAtPlayback();
    if (note) {
      // 取得したノートが前回と違う場合のみテキストを更新する（入力中の上書き防止）
      if (lastNoteIndex !== note.getIndexInParent()) {
        isUpdatingFromCode = true;  // プログラムからのUI更新中フラグを立てる（コールバック抑制）
        lyricsField.setValue(note.getLyrics());
        var ph = note.getPhonemes();
        phonemesField.setValue(ph && ph.trim() !== "" ? ph : "");

        // 言語設定プルダウンの更新
        var attr = note.getAttributes();
        var lang = attr.languageOverride || "default";
        for (var i = 0; i < languageCodes.length; i++) {
          if (languageCodes[i] === lang) {
            languageSelect.setValue(i);
            break;
          }
        }
        lastNoteIndex = note.getIndexInParent();
        editingNoteIndex = note.getIndexInParent(); // 表示中のノートインデックスを記憶
        isUpdatingFromCode = false; // プログラムからの更新が完了したのでフラグを解除する
      }
    } else {
      // ノートが無くなった場合
      if (lastNoteIndex !== -1) {
        isUpdatingFromCode = true;  // プログラムからのUI更新中フラグを立てる
        lyricsField.setValue("");
        phonemesField.setValue("");
        editingNoteIndex = -1;       // 表示中ノートインデックスをクリア
        isUpdatingFromCode = false; // プログラムからの更新が完了したのでフラグを解除する
        lastNoteIndex = -1;
      }
    }
    // 50ms後に再度自身を呼び出す
    SV.setTimeout(monitorInterval, monitorPlaybackNote);
  }
}

// チェックボックス切り替え式再生位置のノートを取得コールバック
selectAtPlaybackCheck.setValueChangeCallback(function (value) {
  if (value) {
    lastNoteIndex = -1; // 強制更新のためリセット
    monitorPlaybackNote(); // モニターモード開始
  } else {
    // OFFに戻したら現在の選択ノートを反映
    onSelectionChanged();
  }
  SV.refreshSidePanel();  // ON/OFFでボタンの表示を変えるため
});

// ボタン式再生位置のノートを取得コールバック
getPlaybackNoteButton.setValueChangeCallback(function (value) {
  if (value == 1) {
    var note = selectNoteAtPlayback();
    isUpdatingFromCode = true; // プログラムからのUI更新中フラグを立てる（コールバック抑制）
    if (note) {
      lyricsField.setValue(note.getLyrics());
      var ph = note.getPhonemes();
      phonemesField.setValue(ph && ph.trim() !== "" ? ph : "");
      editingNoteIndex = note.getIndexInParent(); // 表示中のノートインデックスを記憶
    } else {
      lyricsField.setValue("");
      phonemesField.setValue("");
      editingNoteIndex = -1;       // 表示中ノートインデックスをクリア
    }
    isUpdatingFromCode = false; // プログラムからの更新が完了したのでフラグを解除する
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
applyButtonValue.setValueChangeCallback(function () {
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

// ノート選択コールバック
SV.getMainEditor().getSelection().registerSelectionCallback(function (selectionType, isSelected) {
  if (selectionType == "note") {
    onSelectionChanged();
  }
});
SV.getMainEditor().getSelection().registerClearCallback(function (selectionType) {
  if (selectionType == "notes") {
    onSelectionChanged();
  }
});

// 音素編集をリセットする処理
resetPhonemeButton.setValueChangeCallback(function () {
  var selection = SV.getMainEditor().getSelection();
  var notes = selection.getSelectedNotes();
  if (notes.length == 0) return;

  var note = notes[0];
  note.setPhonemes(""); // 未編集状態に戻す
  phonemesField.setValue("");
});

// 前のノートへ移動
prevNoteButton.setValueChangeCallback(function () {
  moveSelection(-1);
  prevNoteButton.setValue(0);
});

// 次のノートへ移動
nextNoteButton.setValueChangeCallback(function () {
  moveSelection(1);
  nextNoteButton.setValue(0);
});

// 歌詞欄のEnterを検知して適用
lyricsField.setValueChangeCallback(function (newValue) {

  // コードから setValue() を呼んでいる最中（ノート切り替え時など）は何もしない
  if (isUpdatingFromCode) return;

  // Apply ボタンの中身をそのまま呼ぶ
  var selection = SV.getMainEditor().getSelection();
  var notes = selection.getSelectedNotes();
  if (notes.length == 0) return;

  var note = notes[0];

  // 編集開始時のノートと現在選択中のノートが異なる場合（別ノート選択によるフォーカスアウト時等）は適用しない
  if (editingNoteIndex < 0 || note.getIndexInParent() !== editingNoteIndex) return;

  var lyric = lyricsField.getValue();
  if (lyric && lyric.trim() !== "") {
    note.setLyrics(lyric);
  }

  var ph = phonemesField.getValue();
  if (ph && ph.trim() !== "") {
    note.setPhonemes(ph);
  } else {
    note.setPhonemes("");
  }

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



// 音素欄のEnterを検知して適用
phonemesField.setValueChangeCallback(function (newValue) {
  // コードから setValue() を呼んでいる最中（ノート切り替え時など）は何もしない
  if (isUpdatingFromCode) return;

  var selection = SV.getMainEditor().getSelection();
  var notes = selection.getSelectedNotes();
  if (notes.length == 0) return;

  var note = notes[0];

  // 編集開始時のノートと現在選択中のノートが異なる場合（別ノート選択によるフォーカスアウト時等）は適用しない
  if (editingNoteIndex < 0 || note.getIndexInParent() !== editingNoteIndex) return;

  var lyric = lyricsField.getValue();
  if (lyric && lyric.trim() !== "") {
    note.setLyrics(lyric);
  }

  var ph = phonemesField.getValue();
  if (ph && ph.trim() !== "") {
    note.setPhonemes(ph);
  } else {
    note.setPhonemes("");
  }

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




// 再生位置のノートを選択する関数
function selectNoteAtPlayback() {
  var groupReference = SV.getMainEditor().getCurrentGroup();
  if (!groupReference) return null;
  var group = groupReference.getTarget();
  if (!group) return null;
  var selection = SV.getMainEditor().getSelection();
  var playback = SV.getPlayback();
  var timeAxis = SV.getProject().getTimeAxis();
  var seconds = playback.getPlayhead();
  // if (seconds === null) return null;    // 起動直後エラーの可能性
  if (typeof seconds !== "number" || isNaN(seconds)) return null;  // 数値である場合はOK
  var position = timeAxis.getBlickFromSeconds(seconds);
  var target = position - groupReference.getTimeOffset();

  for (var i = 0; i < group.getNumNotes(); i++) {
    var note = group.getNote(i);
    if (note.getOnset() <= target && target < note.getEnd()) {
      var selNotes = selection.getSelectedNotes();
      var alreadySelected = (selNotes.length === 1 && selNotes[0].getIndexInParent() === note.getIndexInParent());
      // 既にそのノートが選択されている場合は再選択しない（イベント競合防止）
      if (!alreadySelected) {
        selection.clearAll();
        selection.selectNote(note);
      }
      return note;
    } else if (note.getOnset() > target) {
      break; // 未来のノートに到達したら探索終了
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
      isUpdatingFromCode = true;      // プログラムからのUI更新中フラグを立てる（コールバック抑制）
      lyricsField.setValue("");
      phonemesField.setValue("");
      editingNoteIndex = -1;       // 表示中ノートインデックスをクリア
      isUpdatingFromCode = false;     // プログラムからの更新が完了したのでフラグを解除する
      return;
    }
    // 歌詞・音素
    isUpdatingFromCode = true;      // プログラムからのUI更新中フラグを立てる（コールバック抑制）
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
    editingNoteIndex = note.getIndexInParent(); // 表示中のノートインデックスを記憶
    isUpdatingFromCode = false;     // プログラムからの更新が完了したのでフラグを解除する
    return;

  }

  // 通常モード（選択ノートを反映）
  if (notes.length == 0) {
    isUpdatingFromCode = true;      // プログラムからのUI更新中フラグを立てる
    lyricsField.setValue("");
    phonemesField.setValue("");
    editingNoteIndex = -1;       // 表示中ノートインデックスをクリア
    isUpdatingFromCode = false;     // プログラムからの更新が完了したのでフラグを解除する
    return;
  }
  var note = notes[0];

  // フラグを立ててから setValue() → コールバックを抑制
  isUpdatingFromCode = true;

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
  editingNoteIndex = note.getIndexInParent(); // 表示中のノートインデックスを記憶
  isUpdatingFromCode = false;     // プログラムからの更新が完了したのでフラグを解除する
}

// 前後のノートに移動する
function moveSelection(offset) {
  var selection = SV.getMainEditor().getSelection();
  var notes = selection.getSelectedNotes();
  if (notes.length !== 1) return;

  var currentNote = notes[0];

  // 現在のグループを取得
  var groupRef = SV.getMainEditor().getCurrentGroup();
  if (!groupRef) return;
  var group = groupRef.getTarget();
  if (!group || typeof group.getNumNotes !== "function") return;

  var num = group.getNumNotes();
  var idx = currentNote.getIndexInParent();
  var nextIdx = idx + offset;

  if (nextIdx < 0 || nextIdx >= num) return;

  var nextNote = group.getNote(nextIdx);

  // 選択を切り替える
  selection.clearAll();
  selection.selectNote(nextNote);

  // UI 更新
  onSelectionChanged();
}


// Panel section（パネルUI）
function getSidePanelSectionState() {

  var showManualButtons = !selectAtPlaybackCheck.getValue();

  return {
    "title": SV.T("Lyrics/Phonemes Editor"),
    "rows": [

      {
        "type": "Container",
        "columns": [
          {  // 常に再生位置のノートを取得（ON/OFF切り替え）
            "type": "CheckBox",
            "text": SV.T("Select note at playback position"),
            "value": selectAtPlaybackCheck,
            "width": 0.7
          },
          { // 再生位置のノートを取得する
            "type": "Button",
            "text": SV.T("Get note at playback"),
            "value": getPlaybackNoteButton,
            "width": 0.3
          }
        ]
      },

      // ◀  ▶ ボタン（OFF のときだけ）
      showManualButtons ? {

        "type": "Container",
        "columns": [
          { // 前のノートへ移動
            "type": "Button",
            "text": SV.T("◀ Previous"),
            "value": prevNoteButton,
            "width": 0.4
          },
          // { "type": "Button", "text": SV.T("Get note at playback"), "value": getPlaybackNoteButton, "width": 0.2 },
          { // 次のノートへ移動
            "type": "Button",
            "text": SV.T("Next ▶"),
            "value": nextNoteButton,
            "width": 0.4
          }
        ]
      } : null,

      { "type": "Label", "text": SV.T("Language") },
      {
        "type": "Container",
        "columns": [
          {   // 歌唱言語選択
            "type": "ComboBox",
            "choices": languageChoices,
            "value": languageSelect
          }
        ]
      },
      { "type": "Label", "text": SV.T("Phonemes") },
      {
        "type": "Container",
        "columns": [
          {   // 音素編集エリア
            "type": "TextBox",
            "value": phonemesField,
            "width": 1.0
          }
        ]
      },
      { "type": "Label", "text": SV.T("Lyrics") },
      {
        "type": "Container",
        "columns": [
          {   // 歌詞編集エリア
            "type": "TextBox",
            "value": lyricsField,
            "width": 1.0
          }
        ]
      },
      {
        "type": "Container",
        "columns": [
          { // 適用
            "type": "Button",
            "text": SV.T("Apply"),
            "value": applyButtonValue,
            "width": 0.5
          },
          { // 音素リセット
            "type": "Button",
            "text": SV.T("Reset Phoneme"),
            "value": resetPhonemeButton,
            "width": 0.5
          }
        ]
      }
    ].filter(Boolean) // ← null を除去
  };
}

/*

function getSidePanelSectionState() {
  var rows = [
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
    {
      "type": "Container",
      "columns": [
        { // 適用ボタン
          "type": "Button",
          "text": SV.T("Apply"),
          "width": 0.5,
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
  ];
  // ★ selectAtPlaybackCheck が OFF のときだけ追加する
  if (!selectAtPlaybackCheck.getValue()) {
    rows.push({
      "type": "Container",
      "columns": [
        {
          "type": "Button",
          "text": SV.T("◀ Previous"),
          "width": 0.5,
          "value": prevNoteButton
        },
        {
          "type": "Button",
          "text": SV.T("Next ▶"),
          "width": 0.5,
          "value": nextNoteButton
        }
      ]
    });
  }

  return {
    "title": SV.T("Lyrics/Phonemes Editor"),
    "rows": rows
  };
}
*/
