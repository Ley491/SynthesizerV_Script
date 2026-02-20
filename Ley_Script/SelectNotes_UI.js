/*
- SelectNotesBefore.js, SelectNotesAfter.js, SelectNotesByLyrics.jsの3つのノート選択系スクリプトをスクリプトパネル版に統合。
  - 前を選択: 選択中のノートを基準に、そのノート自身と前方のノートをすべて選択する
  - 後ろを選択: 選択中のノートを基準に、そのノート自身と後方のノートをすべて選択する
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
      ["Lyric", "歌詞"],
      ["Select by lyric", "歌詞で選択"],
      ["Not found", "見つかりません"],
      ["The lyric \"%1\" was not found.", "「%1」は見つかりませんでした。"]
    ];
  }
  return [];
}

// 前を選択
function selectBefore() {
  var editor = SV.getMainEditor();
  var selection = editor.getSelection();
  var notes = selection.getSelectedNotes();
  if (notes.length === 0) return;

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
}

// 後ろを選択
function selectAfter() {
  var editor = SV.getMainEditor();
  var selection = editor.getSelection();
  var notes = selection.getSelectedNotes();
  if (notes.length === 0) return;

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
}

// 歌詞で選択
var msgString = "";

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
    msgString = SV.T("The lyric \"%1\" was not found.").replace("%1", target);
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

