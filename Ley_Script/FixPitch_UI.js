/*スクリプトパネル用スクリプト
- 此岸さくら氏作スクリプト（Fix Pitch.lua）とまいこ氏作スクリプト（SelectPlayPosiNote.js）を元に改変。
- ピッチコントロール生成間隔と開始オフセットをスライダーで調整できるようにしたもの。
*/

var SCRIPT_TITLE = "Fix Pitch Panel";

function getClientInfo() {
  return {
    "name": SCRIPT_TITLE,
    "author": "Ley",
    "versionNumber": 1.0,
    "minEditorVersion": 131329,
    "category": "Ley Script",
    "type": "SidePanelSection"
  };
}

function getTranslations(langCode) {
  if (langCode == "ja-jp") {
    return [
      ["Fix Pitch Panel", "ピッチ修正パネル"],
      ["Start Offset", "開始オフセット"],
      ["Interval", "間隔"],
      ["Delete Pitch Controls", "ピッチコントロール削除"],
      ["Select note at playback position", "再生位置のノートを選択"],
    ];
  }
  return [];
}

/* ScriptData keys */
var FP_KEYS = {
  offset: "fp_offset",
  interval: "fp_interval"
};

/* UI controls */
var controls = {
  offset: {
    value: SV.create("WidgetValue"),
    defaultValue: 0.125,   // 32分音符 = 1/8拍
    paramKey: FP_KEYS.offset
  },
  interval: {
    value: SV.create("WidgetValue"),
    defaultValue: 0.25,    // 16分音符 = 1/4拍
    paramKey: FP_KEYS.interval
  }
};

// ボタン定義
var btnDelete = SV.create("WidgetValue");
btnDelete.setValue(0);
var btnSelectAtPlayhead = SV.create("WidgetValue");
btnSelectAtPlayhead.setValue(0);

/* 初期値セット */
for (var key in controls) {
  controls[key].value.setValue(controls[key].defaultValue);
}

/* ScriptData 読み込み */
function loadParams(note) {
  var ret = {};
  for (var key in controls) {
    var v = note.getScriptData(controls[key].paramKey);
    ret[key] = (v !== undefined) ? v : controls[key].defaultValue;
  }
  return ret;
}

/* ScriptData 保存 */
function saveParams(note, params) {
  for (var key in controls) {
    note.setScriptData(controls[key].paramKey, params[key]);
  }
}

/* ノート範囲内の PitchControl を全削除 */
function deletePitchControlsInNote(note, group) {
  var onset = note.getOnset();
  var end = note.getEnd();

  for (var i = group.getNumPitchControls() - 1; i >= 0; i--) {
    var pc = group.getPitchControl(i);
    var pos = pc.getPosition();
    if (pos >= onset && pos <= end) {
      group.removePitchControl(i);
    }
  }
}

/* PitchControl 再生成 */
function regeneratePitch(note, group, params) {
  var onset = note.getOnset();
  var end = note.getEnd();
  var dur = note.getDuration();
  var pitch = note.getPitch();

  var offsetBlick = params.offset * SV.QUARTER;


  // var intervalBlick = params.interval * SV.QUARTER;  // 左側が間隔狭く、右側が間隔広く
  /* スライダー反転ロジック（右が細かい） */
  var intervalBlick = (1.0 - params.interval + 0.05) * SV.QUARTER;

  /* 既存 PitchControl 全削除 */
  deletePitchControlsInNote(note, group);

  /* 短いノートは中央に1点 */
  if (dur <= SV.QUARTER / 4) {
    var p = SV.create("PitchControlPoint");
    p.setPitch(pitch);
    p.setPosition(onset + dur / 2);
    group.addPitchControl(p);
    return;
  }

  /* 通常：offset から interval ごとに打つ */
  for (var t = onset + offsetBlick; t < end; t += intervalBlick) {
    var p = SV.create("PitchControlPoint");
    p.setPitch(pitch);
    p.setPosition(t);
    group.addPitchControl(p);
  }
}

/* ノート選択変更時に UI を復元 */
function onSelectionChanged() {
  var selection = SV.getMainEditor().getSelection();
  var notes = selection.getSelectedNotes();

  if (notes.length == 0) {
    controls.offset.value.setValue(controls.offset.defaultValue);
    controls.interval.value.setValue(controls.interval.defaultValue);
    return;
  }

  var params = loadParams(notes[0]);
  controls.offset.value.setValue(params.offset);
  controls.interval.value.setValue(params.interval);
}

/* メイン処理（リアルタイム反映） */
function applyFixPitch() {
  var editor = SV.getMainEditor();
  var selection = editor.getSelection();
  var notes = selection.getSelectedNotes();
  if (notes.length == 0) return;

  var group = editor.getCurrentGroup().getTarget();

  var params = {
    offset: controls.offset.value.getValue(),
    interval: controls.interval.value.getValue()
  };

  /* ScriptData 保存 */
  for (var i = 0; i < notes.length; i++) {
    saveParams(notes[i], params);
  }

  /* PitchControl 再生成 */
  for (var i = 0; i < notes.length; i++) {
    regeneratePitch(notes[i], group, params);
  }

  /* 選択復元 */
  for (var i = 0; i < notes.length; i++) {
    selection.selectNote(notes[i]);
  }
}

/* 削除ボタン */
btnDelete.setValueChangeCallback(function() {
  var editor = SV.getMainEditor();
  var selection = editor.getSelection();
  var notes = selection.getSelectedNotes();
  if (notes.length == 0) return;

  var group = editor.getCurrentGroup().getTarget();

  // ★ ピッチコントロール削除
  for (var i = 0; i < notes.length; i++) {
    deletePitchControlsInNote(notes[i], group);
  }

  // ★ ScriptData を初期化（スライダーを初期値に戻す）
  for (var i = 0; i < notes.length; i++) {
    notes[i].setScriptData(FP_KEYS.offset, controls.offset.defaultValue);
    notes[i].setScriptData(FP_KEYS.interval, controls.interval.defaultValue);
  }

  // ★ ノート選択を維持
  selection.clearAll();
  for (var i = 0; i < notes.length; i++) {
    selection.selectNote(notes[i]);
  }

  btnDelete.setValue(0);
});

/* 再生位置のノートを選択 */
btnSelectAtPlayhead.setValueChangeCallback(function(value) {
  if (value == 1) {

    var editor = SV.getMainEditor();
    var groupRef = editor.getCurrentGroup();
    var group = groupRef.getTarget();
    var selection = editor.getSelection();

    var playback = SV.getPlayback();
    var timeAxis = SV.getProject().getTimeAxis();
    var position = timeAxis.getBlickFromSeconds(playback.getPlayhead());
    var target = position - groupRef.getTimeOffset();

    for (var i = 0; i < group.getNumNotes(); i++) {
      var note = group.getNote(i);
      if (note.getOnset() < target && target < note.getEnd()) {

        // ★ 同じノートでも確実に再選択させるためのダミー選択
        selection.clearAll();
        if (group.getNumNotes() > 1) {
          var dummy = (i === 0) ? group.getNote(1) : group.getNote(0);
          selection.selectNote(dummy);
        }

        selection.clearAll();
        selection.selectNote(note);
        break;
      }
    }

    // ★ 次回も確実に発火させるために 0 に戻す
    btnSelectAtPlayhead.setValue(0);
  }
});

/* スライダー変更時に applyFixPitch を呼ぶ */
controls.offset.value.setValueChangeCallback(function() {
  applyFixPitch();
});
controls.interval.value.setValueChangeCallback(function() {
  applyFixPitch();
});

/* SelectionCallback */
SV.getMainEditor().getSelection().registerSelectionCallback(function(type, sel) {
  if (type == "note") onSelectionChanged();
});
SV.getMainEditor().getSelection().registerClearCallback(function(type) {
  if (type == "notes") onSelectionChanged();
});


/* パネル UI */
function getSidePanelSectionState() {
  return {
    "title": SV.T("Fix Pitch Panel"),
    "rows": [
      {
        "type": "Container",
        "columns": [
          {
            "type": "Button",
            "text": SV.T("Select note at playback position"),
            "value": btnSelectAtPlayhead,
            "width": 1.0
          }
        ]
      },
      {
        "type": "Container",
        "columns": [
          {
            "type": "Slider",
            "text": SV.T("Start Offset"),
            "format": "%1.2f",
            "minValue": 0.0,
            "maxValue": 1.0,
            "interval": 0.01,
            "value": controls.offset.value,
            "width": 1.0
          }
        ]
      },
      {
        "type": "Container",
        "columns": [
          {
            "type": "Slider",
            "text": SV.T("Interval"),
            "format": "%1.2f",
            "minValue": 0.05,
            "maxValue": 1.0,
            "interval": 0.01,
            "value": controls.interval.value,
            "width": 1.0
          }
        ]
      },
      {
        "type": "Container",
        "columns": [
          {
            "type": "Button",
            "text": SV.T("Delete Pitch Controls"),
            "value": btnDelete,
            "width": 1.0
          }
        ]
      }
    ]
  };
}
