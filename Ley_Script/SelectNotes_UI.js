/*
- SelectNotesBefore.js, SelectNotesAfter.js, SelectNotesByLyrics.jsの3つのノート選択系スクリプトをスクリプトパネル版に統合。
  - 前を選択: 選択中のノートを基準に、そのノート自身と前方のノートをすべて選択する
  - 後ろを選択: 選択中のノートを基準に、そのノート自身と後方のノートをすべて選択する
  - 指定範囲を選択: 選択ノートと再生バーの位置を基準に、その2点の間にあるノートをすべて選択する。
  - 歌詞で選択: 入力した歌詞と一致するノートをすべて選択する
*/

function getClientInfo() {
  return {
    "name": "Note Selection Tools",
    "author": "Ley",
    "versionNumber": 1.0,
    "minEditorVersion": 131330,
    "type": "SidePanelSection",
    "category": "Ley Script",
  };
}


function getTranslations(lang) {
  if (lang === "ja-jp") {
    return [
      ["Note Selection Tools", "ノート選択ツール"],
      ["Select notes before", "前を選択"],
      ["Select notes after", "後ろを選択"],
      ["Select between playhead", "指定範囲を選択"],
      ["Lyric", "歌詞"],
      ["Select by lyric", "歌詞で選択"],
      ["Not found", "見つかりません"],
      ["⚠ The lyric \"%1\" was not found.", "⚠ 「%1」は見つかりませんでした。"],
      ["⚠ No note is selected.", "⚠ ノートが選択されていません。"],
    ];
  }
  return [];
}

// エラーメッセージ用定義
var msgString = "";


// 前を選択
function selectBefore() {
  var editor = SV.getMainEditor();
  var selection = editor.getSelection();
  var notes = selection.getSelectedNotes();

  // ノート未選択 → エラーメッセージ表示
  if (notes.length === 0) {
    msgString = SV.T("⚠ No note is selected.");
    SV.refreshSidePanel();
    return;
  }

  var group = editor.getCurrentGroup().getTarget();
  var base = notes[0];
  var baseOnset = base.getOnset();

  selection.clearAll();

  for (var i = 0; i < group.getNumNotes(); i++) {
    var n = group.getNote(i);
    if (n.getOnset() < baseOnset) {
      selection.selectNote(n);
    }
  }
  selection.selectNote(base);

  // 成功したらメッセージ消す
  msgString = "";
  SV.refreshSidePanel();
}


// 後ろを選択
function selectAfter() {
  var editor = SV.getMainEditor();
  var selection = editor.getSelection();
  var notes = selection.getSelectedNotes();

  // ノート未選択 → エラーメッセージ表示
  if (notes.length === 0) {
    msgString = SV.T("⚠ No note is selected.");
    SV.refreshSidePanel();
    return;
  }

  var group = editor.getCurrentGroup().getTarget();
  var base = notes[0];
  var baseOnset = base.getOnset();

  selection.clearAll();

  for (var i = 0; i < group.getNumNotes(); i++) {
    var n = group.getNote(i);
    if (n.getOnset() > baseOnset) {
      selection.selectNote(n);
    }
  }
  selection.selectNote(base);

  // 成功したらメッセージ消す
  msgString = "";
  SV.refreshSidePanel();
}


// 指定範囲を選択
function selectBetweenPlayhead() {
  var editor = SV.getMainEditor();
  var selection = editor.getSelection();
  var notes = selection.getSelectedNotes();

  // ノート未選択 → エラーメッセージ表示
  if (notes.length === 0) {
    msgString = SV.T("⚠ No note is selected.");
    SV.refreshSidePanel();
    return;
  }

  var groupRef = editor.getCurrentGroup();
  var group = groupRef.getTarget();

  var base = notes[0];
  var baseOnset = base.getOnset();
  var baseEnd = base.getEnd();

  // 再生バー位置（グループオフセット補正）
  var playback = SV.getPlayback();
  var timeAxis = SV.getProject().getTimeAxis();
  var playPos = timeAxis.getBlickFromSeconds(playback.getPlayhead());
  var playPosLocal = playPos - groupRef.getTimeOffset();

  // 区間決定（小さい方が start、大きい方が end）
  var start = Math.min(baseOnset, playPosLocal);
  var end = Math.max(baseEnd, playPosLocal);

  selection.clearAll();

  for (var i = 0; i < group.getNumNotes(); i++) {
    var n = group.getNote(i);
    if (n.getEnd() >= start && n.getOnset() <= end) {
      selection.selectNote(n);
    }
  }

  // 成功したらメッセージ消す
  msgString = "";
  SV.refreshSidePanel();
}



// 歌詞で選択
function selectByLyric() {
  var editor = SV.getMainEditor();
  var selection = editor.getSelection();
  var selected = selection.getSelectedNotes();
  var group = editor.getCurrentGroup().getTarget();

  var target = (lyricText.getValue() || "").trim();
  if (target === "") return;

  selection.clearAll();
  var count = 0;

  if (selected.length > 0) {
    for (var i = 0; i < selected.length; i++) {
      if (selected[i].getLyrics() === target) {
        selection.selectNote(selected[i]);
        count++;
      }
    }
  } else {
    for (var i = 0; i < group.getNumNotes(); i++) {
      var n = group.getNote(i);
      if (n.getLyrics() === target) {
        selection.selectNote(n);
        count++;
      }
    }
  }

  if (count === 0) {
    msgString = SV.T("⚠ The lyric \"%1\" was not found.").replace("%1", target);
    SV.refreshSidePanel();
    return;
  }

  // 成功したら非表示
  msgString = "";
  SV.refreshSidePanel();
}


// ボタン・テキスト用 WidgetValue
var btnBefore = SV.create("WidgetValue");
btnBefore.setValue(0);

var btnAfter = SV.create("WidgetValue");
btnAfter.setValue(0);

var btnBetween = SV.create("WidgetValue");
btnBetween.setValue(0);

var btnLyric = SV.create("WidgetValue");
btnLyric.setValue(0);

var lyricText = SV.create("WidgetValue");
lyricText.setValue("");

var msgText = SV.create("WidgetValue");
msgText.setValue("");   // ← 普段は空（非表示）

// コールバック
btnBefore.setValueChangeCallback(function(value) {
  if (value == 1) {
    selectBefore();
    btnBefore.setValue(0);
  }
});

btnAfter.setValueChangeCallback(function(value) {
  if (value == 1) {
    selectAfter();
    btnAfter.setValue(0);
  }
});

btnBetween.setValueChangeCallback(function(value) {
  if (value == 1) {
    selectBetweenPlayhead();
    btnBetween.setValue(0);
  }
});

btnLyric.setValueChangeCallback(function(value) {
  if (value == 1) {
    selectByLyric();
    btnLyric.setValue(0);
  }
});

// パネル定義
function getSidePanelSectionState() {
  return {
    "title": SV.T("Note Selection Tools"),
    "rows": [
      {
        "type": "Container",
        "columns": [
          {
            "type": "Button",
            "name": "btnBefore",
            "text": SV.T("Select notes before"),
            "value": btnBefore,
            "width": 0.5
          },
          {
            "type": "Button",
            "name": "btnAfter",
            "text": SV.T("Select notes after"),
            "value": btnAfter,
            "width": 0.5
          }
        ]
      },
      {
        "type": "Container",
        "columns": [
          {
            "type": "Button",
            "name": "btnBetween",
            "text": SV.T("Select between playhead"),
            "value": btnBetween,
            "width": 1.0
          }
        ]
      },
      {
        "type": "Label",
        "text": SV.T("Lyric")
      },
      {
        "type": "Container",
        "columns": [
          {
            "type": "TextBox",
            "value": lyricText,
            "width": 0.6
          },
          {
            "type": "Button",
            "name": "btnLyric",
            "text": SV.T("Select by lyric"),
            "value": btnLyric,
            "width": 0.4
          }
        ]
      },
      {
        "type": "Label",
        "text": msgString
      },
    ]
  };
}

