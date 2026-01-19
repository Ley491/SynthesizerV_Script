/*スクリプトパネル用スクリプト
- まいこ氏作スクリプトSmoothNavigationPlayPlus.js（縦スクロール機能）とAutoVerticalScroll.js（横スクロール機能）とSelectPlayPosiNote.js（再生中ノート選択機能）、此岸さくら氏作スクリプトSelectPlayingNote Patched.js（再生中ノート選択Pitch版機能）を元にスクリプトパネルで設定を微調整できるように改変。
  - トラックビューもスムーズスクロールされます。
  - パネルのスライドバーで上下左右の余白範囲を変更可能です。
  - スクロール速度も微調整できます。
  - 同じトラック内の次のグループに自動で切り替える機能をも追加しました。
- コードには残っていますがプリセット機能は動きません（UIにも表示してません）。
*/

function getClientInfo() {
  return {
    "name" : "Scroll Settings UI",
    "author" : "Ley", 
    "versionNumber" : 1.2,
    "minEditorVersion" : 131330,
    "type": "SidePanelSection",
    "category" : "Ley Script"
  };
}

// ローカライズ設定
function getTranslations(langCode) {
  if (langCode === "ja-jp") {
    return [
      ["Scroll Settings UI", "スクロール設定UI"],
      // ["Ley Script", "Leyのスクリプト"],
      ["Scroll Settings", "スクロール設定"],
      ["Lookahead Bars", "先読み小節数"],
      ["Vertical Scroll Margin", "縦スクロール設定"],
      ["Top Margin", "上余白"],
      ["Bottom Margin", "下余白"],
      ["Horizontal Scroll Settings", "横スクロール設定"],
      ["Right Margin", "右余白"],
      ["Page Turn Offset", "左余白"],
      ["Horizontal Scroll Speed","横方向"],
      ["Scroll Speed", "縦方向"],
      ["Scroll Speed Setting", "スクロール速度"],
      ["Preset Management", "プリセット管理"],
      ["Preset", "プリセット"],
      ["Preset Name", "プリセット名"],
      ["Save Preset", "プリセットを保存"],
      ["Delete Preset", "プリセットを削除"],
      ["Reset to Default", "デフォルトに戻す"],
      ["Rename Preset", "プリセット名を変更"],
      ["New Preset Name", "新しいプリセット名"],
      ["Enable Scroll Logic", "スクロール処理を有効にする"]
    ];
  }
  return [];
}

// WidgetValues
var lookAheadBars = SV.create("WidgetValue");   // 先読み
var topMargin = SV.create("WidgetValue");   // 上余白
var bottomMargin = SV.create("WidgetValue");    // 下余白
var rightMargin = SV.create("WidgetValue");   // 右余白
var pageTurnOffset = SV.create("WidgetValue");    // 左余白
var scrollSpeed = SV.create("WidgetValue");   // 縦方向速度
var horizontalScrollSpeed = SV.create("WidgetValue");   // 横方向速度

var resetButton = SV.create("WidgetValue");   // リセットボタン
var presetSelector = SV.create("WidgetValue");  // プリセット選択ボタン
presetSelector.setValue("Default"); 

var enableScrollLogic = SV.create("WidgetValue");   // オートスクロール切り替え
enableScrollLogic.setValue(false); // 初期状態はオートスクロール無効

// WidgetValues初期化
lookAheadBars.setValue(2);
topMargin.setValue(4);
bottomMargin.setValue(9);
rightMargin.setValue(4);
pageTurnOffset.setValue(0); // 0 = 左端までスクロール
scrollSpeed.setValue(0.4);
horizontalScrollSpeed.setValue(0.1); // 初期値（ゆっくり）


// デフォルト設定
var defaultValues = {
  lookAheadBars: 2,
  topMargin: 4,
  bottomMargin: 9,
  rightMargin: 4,
  pageTurnOffset: 0,
  scrollSpeed: 0.4,
  horizontalScrollSpeed: 0.1,
};

// プリセット
var presets = {
  "Preset A": {
    lookAheadBars: 1,
    topMargin: 2,
    bottomMargin: 6,
    rightMargin: 2,
    horizontalScrollSpeed: 0.2,
    scrollSpeed: 0.2
  },
  "Preset B": {
    lookAheadBars: 3,
    topMargin: 6,
    bottomMargin: 12,
    rightMargin: 1,
    horizontalScrollSpeed: 0.3,
    scrollSpeed: 0.5
  },
  "Preset C": {
    lookAheadBars: 4,
    topMargin: 8,
    bottomMargin: 10,
    rightMargin: 1,
    horizontalScrollSpeed: 0,
    scrollSpeed: 0.25
  }
};


// 定数
var updatePeriod = 50; // 50msごとにチェック※ 100msだと先読み小節数への反応が鈍く、20msだと敏感
var selectHyphen = false;
var enableAutoNextGroup = true;

// デフォルトに戻す
resetButton.setValueChangeCallback(function() {
  lookAheadBars.setValue(defaultValues.lookAheadBars);
  topMargin.setValue(defaultValues.topMargin);
  bottomMargin.setValue(defaultValues.bottomMargin);
  rightMargin.setValue(defaultValues.rightMargin);
  pageTurnOffset.setValue(defaultValues.pageTurnOffset);
  scrollSpeed.setValue(defaultValues.scrollSpeed);
  horizontalScrollSpeed.setValue(defaultValues.horizontalScrollSpeed);
});

// プリセットを選ぶ
presetSelector.setValueChangeCallback(function(name) {
  var preset = presets[name];
  if (!preset) return;
  lookAheadBars.setValue(preset.lookAheadBars);
  topMargin.setValue(preset.topMargin);
  bottomMargin.setValue(preset.bottomMargin);
  rightMargin.setValue(preset.rightMargin);
  scrollSpeed.setValue(preset.scrollSpeed);
});


// 再生監視ループ（即実行せず一定間隔でcallback）
function setInterval(t, callback) {
  SV.setTimeout(t, function() {
    callback();
    setInterval(t, callback);
  });
}

// 旧再生監視ループ
// function setInterval(t, callback) {
  // callback();
  // SV.setTimeout(t, function() {
    // setInterval(t, callback);
  // });
// }

// 横スクロール処理
function makePageTurner(coordSystem) {
  var playback = SV.getPlayback();
  var timeAxis = SV.getProject().getTimeAxis();
  var isPageTurning = false;
  var targetPositionLeft = 0;

      return function() {
    var seconds = playback.getPlayhead();
    if (seconds === null) return;
    var position = timeAxis.getBlickFromSeconds(seconds);
    var viewRange = coordSystem.getTimeViewRange();
    // var margin = SV.QUARTER * 4; // 固定値
    var margin = rightMargin.getValue() * SV.QUARTER;

    if (isPageTurning && viewRange[0] < targetPositionLeft - margin) {
      // coordSystem.setTimeLeft(viewRange[0] * 0.9 + targetPositionLeft * 0.1);    // 固定値
      var speed = horizontalScrollSpeed.getValue(); // 0.01〜1.0

      coordSystem.setTimeLeft(
        viewRange[0] * (1 - speed) + targetPositionLeft * speed
      );
    } else if (position > viewRange[1] - margin) {
      isPageTurning = true;
      // targetPositionLeft = viewRange[1]; // 左端まで固定
      // ページ送り後の左端位置を調整する
      var offset = pageTurnOffset.getValue() * SV.QUARTER * 4; 
      // （pageTurnOffset は「小節数」なので ×4 で四分音符数に変換）
      targetPositionLeft = viewRange[1] - offset;

    } else {
      isPageTurning = false;
    }
  };
}

// 縦スクロール処理
function makeVerticalScroll(coordSystem) {
  var playback = SV.getPlayback();
  var timeAxis = SV.getProject().getTimeAxis();
  var uuid, groupIndex, lastCenter = null, scrollTarget = null;

  return function() {
    var seconds = playback.getPlayhead();
    if (seconds === null) return;
    var position = timeAxis.getBlickFromSeconds(seconds);
    var viewRange = coordSystem.getValueViewRange();
    var groupReference = SV.getMainEditor().getCurrentGroup();
    var group = groupReference.getTarget();
    if (!group) return;

    if (group.getUUID() !== uuid || groupReference.getIndexInParent() !== groupIndex) {
      uuid = group.getUUID();
      groupIndex = groupReference.getIndexInParent();
      lastCenter = null;
      scrollTarget = null;
    }

    var groupOffset = groupReference.getTimeOffset();
    // 小節じゃなくて “Blick距離” で先読みする
    var lookAheadBlick = lookAheadBars.getValue() * SV.QUARTER * 4;

    var rangeStart = position - groupOffset;
    var rangeEnd = rangeStart + lookAheadBlick;

    var maxPitch = -Infinity, minPitch = Infinity, found = false;
    for (var i = 0; i < group.getNumNotes(); i++) {
      var note = group.getNote(i);
      if (note.getEnd() >= rangeStart && note.getOnset() <= rangeEnd) {
        var lyrics = note.getLyrics();
        if (lyrics === "br") continue;
        var p = note.getPitch();
        if (p > maxPitch) maxPitch = p;
        if (p < minPitch) minPitch = p;
        found = true;
      }
    }
    if (!found) return;

    var viewTop = viewRange[1] - topMargin.getValue();
    var viewBottom = viewRange[0] + bottomMargin.getValue();
    var center = viewRange[0] + (viewRange[1] - viewRange[0]) / 2;
    var hysteresis = 2.5;
    var needScrollUp = maxPitch > viewTop + hysteresis;
    var needScrollDown = minPitch < viewBottom - hysteresis;

    if (!scrollTarget) scrollTarget = center;
    if (needScrollUp && needScrollDown) scrollTarget = (maxPitch + minPitch) / 2;
    else if (needScrollUp) scrollTarget = center + scrollSpeed.getValue();  // 縦スクロール速度
    else if (needScrollDown) scrollTarget = center - scrollSpeed.getValue();

    var smoothing = 0.1;
    if (lastCenter === null) lastCenter = center;
    lastCenter = lastCenter * (1 - smoothing) + scrollTarget * smoothing;
    coordSystem.setValueCenter(lastCenter);
  };
}

// 再生位置のノートを取得する
function makeNoteChecker() {
  var playback = SV.getPlayback();
  var timeAxis = SV.getProject().getTimeAxis();
  var selection = SV.getMainEditor().getSelection();
  var uuid, groupIndex, skipNote = 0;

  return function() {
    var seconds = playback.getPlayhead();
    if (seconds === null) return;
    var position = timeAxis.getBlickFromSeconds(seconds);
    var groupReference = SV.getMainEditor().getCurrentGroup();
    var group = groupReference.getTarget();
    if (!group) return;

    if (group.getUUID() !== uuid || groupReference.getIndexInParent() !== groupIndex) {
      uuid = group.getUUID();
      groupIndex = groupReference.getIndexInParent();
      skipNote = 0;
    }

    var offset = timeAxis.getBlickFromSeconds(updatePeriod / 1000);
    var target = position - groupReference.getTimeOffset() + offset;

    for (var i = skipNote; i < group.getNumNotes(); i++) {
      var note = group.getNote(i);
      if (target < note.getEnd()) {
        var lyrics = note.getLyrics();
        // if (!selectHyphen && (lyrics === "-" || lyrics === "+" || lyrics === "br")) break;
        if (!selectHyphen && (lyrics === "br")) break;
        if (note.getOnset() < target) {
          selection.clearNotes();
          selection.selectNote(note);
          skipNote = i + 1;
          break;
        }
        skipNote = i;
        break;
      }
    }
  };
}

// グループ自動切り替え
function switchToNextGroupIfNeeded() {
  if (!enableAutoNextGroup) return;
  var playback = SV.getPlayback();
  var timeAxis = SV.getProject().getTimeAxis();
  var seconds = playback.getPlayhead();
  if (seconds === null) return;
  var position = timeAxis.getBlickFromSeconds(seconds);
  var groupRef = SV.getMainEditor().getCurrentGroup();
  if (!groupRef) return;

  var group = groupRef.getTarget();
  if (!group) return;

  var groupEnd = 0;
  for (var i = 0; i < group.getNumNotes(); i++) {
    var note = group.getNote(i);
    if (note.getEnd() > groupEnd) groupEnd = note.getEnd();
  }
  var currentEnd = groupRef.getTimeOffset() + groupEnd;

  if (position > currentEnd) {
    var targetUUID = group.getUUID();
    var project = SV.getProject();
    for (var t = 0; t < project.getNumTracks(); t++) {
      var track = project.getTrack(t);
      for (var i = 0; i < track.getNumGroups(); i++) {
        var g = track.getGroupReference(i);
        var target = g.getTarget();
        if (target && target.getUUID() === targetUUID) {
          var nextIndex = i + 1;
          if (nextIndex < track.getNumGroups()) {
            var nextGroup = track.getGroupReference(nextIndex);
            SV.getMainEditor().setCurrentGroup(nextGroup);
          }
          return;
        }
      }
    }
  }
}



var verticalScroll = makeVerticalScroll(SV.getMainEditor().getNavigation());  // 縦スクロール
var pageTurnerMain = makePageTurner(SV.getMainEditor().getNavigation());    // 横スクロール（ピアノロール）
var pageTurnerArrange = makePageTurner(SV.getArrangement().getNavigation());  // 横スクロール（トラック）
var noteChecker = makeNoteChecker();  // 再生位置のノートを選択

// スクリプト実行処理
function checkPlayhead() {
  if (!enableScrollLogic.getValue()) return; // チェックが外れていたら何もしない

  var playback = SV.getPlayback();
  if (playback.getStatus() === "stopped") return;
  verticalScroll();
  pageTurnerMain();
  pageTurnerArrange();
  noteChecker();
  switchToNextGroupIfNeeded();
}

setInterval(updatePeriod, checkPlayhead);

// スクリプトパネルUI
function getSidePanelSectionState() {
  return {
    title: SV.T("Scroll Settings"),
    rows: [
      { type: "Label", text: SV.T("Vertical Scroll Margin") },
      {  // 縦スクロール設定
        type: "Container",
        columns: [
          {   // 上余白
            type: "Slider",
            text: SV.T("Top Margin"),
            format: "%1.0f", // 表示は小数点なし(0)
            minValue: 0,
            maxValue: 20,
            interval: 1,
            value: topMargin,
            width: 0.5
          },
          {   // 下余白
            type: "Slider",
            text: SV.T("Bottom Margin"),
            format: "%1.0f",
            minValue: 0,
            maxValue: 20,
            interval: 1,
            value: bottomMargin,
            width: 0.5
          }
        ]
      },
      // { type: "Label", text: SV.T("Lookahead Bars") },
      {
        type: "Container",
        columns: [
          {   // 先読み設定
            type: "Slider",
            text: SV.T("Lookahead Bars"),
            format: "%1.0f", 
            minValue: 1,
            maxValue: 5,
            interval: 1,
            value: lookAheadBars,
            width: 1.0
          }
        ]
      },
      { type: "Label", text: SV.T("Horizontal Scroll Settings") },
      {  // 横スクロール設定
        type: "Container",
        columns: [
          {   // 左余白
            type: "Slider",
            text: SV.T("Page Turn Offset"),
            format: "%1.1f",  // 数字は小数点以下有り(0.1)
            minValue: 0,
            maxValue: 4,   // 数字が大きいと中央に寄る
            interval: 0.5,
            value: pageTurnOffset,
            width: 0.5
          },
          {   // 右余白
            type: "Slider",
            text: SV.T("Right Margin"),
            format: "%1.0f bar",
            minValue: 1,
            maxValue: 16,
            interval: 1,
            value: rightMargin,
            width: 0.5
          }
        ]
      },
      { type: "Label", text: SV.T("Scroll Speed Setting") },
      {   // スクロール速度設定
        type: "Container",
        columns: [
          {   // 縦スクロール速度
            type: "Slider",
            text: SV.T("Scroll Speed"),
            format: "%1.1f",
            minValue: 0.1,
            maxValue: 1.0,
            interval: 0.1,
            value: scrollSpeed,
            width: 0.5
          },
          {   // 横スクロール速度
            type: "Slider",
            text: SV.T("Horizontal Scroll Speed"),
            format: "%1.2f",  // 数字は小数点以下有り(0.02)
            minValue: 0.02, // 0.01だと挙動が少しおかしい
            maxValue: 0.25, // これ以上大きいと即ページめくり挙動に近い
            interval: 0.01,
            value: horizontalScrollSpeed,
            width: 0.5
          }
        ]
      },
      // { type: "Label", text: SV.T("Preset Management") },
      {
        type: "Container",
        columns: [
          {   // デフォルト設定に戻す
            type: "Button",
            text: SV.T("Reset to Default"),
            value: resetButton,
            width: 0.5
          }
          /*
          ,
          {
            type: "ComboBox",
            text: SV.T("Preset"),
            value: presetSelector,
            options: ["Default", "Preset A", "Preset B", "Preset C"], // ← 手動で追加
            width: 0.5
          }
          */
          ]
      },
      {
      "type": "Container",
      "columns":[
      {   // スクロール機能実行切り替え
          "type": "CheckBox",
          "text": SV.T("Enable Scroll Logic"),
          "value": enableScrollLogic,
        }],
      },
    ]
  };
}

