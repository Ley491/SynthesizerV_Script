/*スクリプトパネル用スクリプト
- まいこ氏作スクリプトSmoothNavigationPlayPlus.js（横スクロール機能）とAutoVerticalScroll.js（縦スクロール機能）とSelectPlayPosiNote.js（再生中ノート選択機能）、此岸さくら氏作スクリプトSelectPlayingNote Patched.js（再生中ノート選択Pitch版機能）を元にスクリプトパネルで設定を微調整できるように改変。
- 再生中の縦・横スクロール挙動を細かく調整できるようにしたもの。
    - 上下の余白、先読み小節数、縦スクロール速度を調整可能。
    - 右余白によるページ送り、ページ送り後の左余白（オフセット）、横スクロール速度を調整可能。
    - ピアノロールとアレンジビューの両方に対応。
- 再生中ノートの自動選択機能を搭載（br は除外）。
  - スクリプトパネルのチェックボックスでON/OFF可能。
- 次のグループに自動で選択を切り替えます。
    - 選択トラックの再生位置にノートが存在しない場合、他のトラックを探索して自動で切り替えます（ON/OFF 可能）。
    - ミュートトラック・ミュートグループは除外し、ソロトラックが存在する場合は、ソロトラックのみを対象とします。
    - 対象が複数存在する場合は、トラック名の優先度リスト（var priorityLists / downgradeLists）と数字、トラックの表示順に従って切り替わります。
- デフォルト値へのリセット、スクロール処理の ON/OFF 切り替え可能です。
- プリセット機能を実装。var presets を編集することで自由にプリセット登録できます。
    - プリセット機能が不要の場合はvar enablePresetUI を false に書き換えてください。
*/

var enablePresetUI = true;   // ← false にするとプリセットUIが非表示になる

// トラック優先度リスト（同じリスト内にある文字はすべて同じ優先度として扱う）※小文字でも大文字でも同一扱い
var priorityLists = [
  ["main", "vo", "vocal"], // 第一優先（最も優先されるトラック名：部分一致）
  ["sub", "ham"], // 第二優先
  // ["Cho", "Chorus"], // このように[]で囲ったリストを増やせば優先リストを増やせます。
  // 優先度リストを使わない場合は空の配列にしてください
  // 例：var priorityLists = [];
];

// トラック名の優先度を下げるリスト ※小文字でも大文字でも良い
var downgradeLists = ["コピー", "copy", "test"];
// 優先度を下げるリストを使わない場合は空の配列にしてください
// 例：var downgradeLists = [];



function getClientInfo() {
  return {
    "name": "Scroll Settings UI",
    "author": "Ley",
    "versionNumber": 1.9,
    "minEditorVersion": 131330,
    "type": "SidePanelSection",
    "category": "Ley Script"
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
      ["Horizontal Scroll Speed", "横方向"],
      ["Scroll Speed", "縦方向"],
      ["Scroll Speed Setting", "スクロール速度"],
      ["Preset Management", "プリセット管理"],
      ["Preset", "プリセット"],
      ["Reset to Default", "デフォルトに戻す"],
      ["Enable Track Auto-Switch", "トラックを自動で切り替える"],
      ["Enable Scroll Logic", "スクロール処理を有効にする"],
      ["Enable Note Selection", "再生バー位置のノートを選択する"],
    ];
  }
  return [];
}


// デフォルト設定（ボタン操作時）
var defaultValues = {
  lookAheadBars: 2,             // 先読み
  topMargin: 4,                 // 上余白
  bottomMargin: 9,              // 下余白
  rightMargin: 4,               // 右余白
  pageTurnOffset: 0,            // 左余白
  scrollSpeed: 0.4,             // 縦方向速度
  horizontalScrollSpeed: 0.1,   // 横方向速度
  enableNoteSelection: true,   // 再生バー位置のノートを選択する（true = 有効）
  enableTrackSwitch: true,      // トラック自動切り替え（true = 有効）
  enableScrollLogic: true,      // 自動スクロール機能（true = 有効）
};

// プリセット（編集して自由に追加・変更可能）
var presets = {
  "Preset A": { // プリセット名
    lookAheadBars: 1,
    topMargin: 2,
    bottomMargin: 6,
    rightMargin: 2,
    pageTurnOffset: 1,
    horizontalScrollSpeed: 0.2,
    scrollSpeed: 0.2,
    enableNoteSelection: false,   // 再生バー位置のノートを選択する（true = 有効）
    enableTrackSwitch: false,
    enableScrollLogic: true,
  },
  "Preset B": {
    lookAheadBars: 3,
    topMargin: 6,
    bottomMargin: 12,
    rightMargin: 1,
    pageTurnOffset: 2,
    horizontalScrollSpeed: 0.3,
    scrollSpeed: 0.5,
    enableNoteSelection: false,   // 再生バー位置のノートを選択する（true = 有効）
    enableTrackSwitch: true,
    enableScrollLogic: false,
  },
  "Preset C": {
    lookAheadBars: 4,
    topMargin: 8,
    bottomMargin: 10,
    rightMargin: 1,
    pageTurnOffset: 3,
    horizontalScrollSpeed: 0,
    scrollSpeed: 0.25,
    enableNoteSelection: true,   // 再生バー位置のノートを選択する（true = 有効）
    enableTrackSwitch: false,
    enableScrollLogic: false,
  },
  // 増やす場合はこの下に追加
};

// プリセット（choices）用の配列（プリセット選択ラベル+プリセット自動登録）
var presetList = ["Select Preset"].concat(getPresetNames());

// プリセット自動生成
function getPresetNames() {
  return Object.keys(presets);  // プリセット名を取得
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
presetSelector.setValue(0); // 0 = Default（初期値）

var enableNoteSelection = SV.create("WidgetValue");   // 再生バー位置のノートを選択する
enableNoteSelection.setValue(false); // 初期値はノート選択無効
var enableTrackSwitch = SV.create("WidgetValue");   // トラック切り替え機能
enableTrackSwitch.setValue(false); // 初期値は自動トラック切り替え無効
var enableScrollLogic = SV.create("WidgetValue");   // オートスクロール切り替え
enableScrollLogic.setValue(false); // 初期状態はオートスクロール無効

var wasPlaying = false; // 前フレームの再生状態を保持するフラグ（リセット機能）

// WidgetValues初期化
lookAheadBars.setValue(2);
topMargin.setValue(4);
bottomMargin.setValue(9);
rightMargin.setValue(4);
pageTurnOffset.setValue(0); // 0 = 左端までスクロール
scrollSpeed.setValue(0.4);
horizontalScrollSpeed.setValue(0.1); // 初期値（ゆっくり）


// 定数
var updatePeriod = 50; // 50msごとにチェック※ 100msだと先読み小節数への反応が鈍く、20msだと敏感
var lastPreset = "Select Preset";  // プリセット反映用（初期値）
var selectHyphen = false;
var enableAutoNextGroup = true;
var resetters = []; // スクロール処理のリセット用関数を格納する配列
var forceTrackSearch = false; // 強制的にトラックを検索するフラグ
var trackPriority = 0;  // トラックの優先度初期値
var mutedMap = {};      // 全トラック・全グループのミュート状態を保持するマップ


// デフォルトに戻す
resetButton.setValueChangeCallback(function () {
  lookAheadBars.setValue(defaultValues.lookAheadBars);
  topMargin.setValue(defaultValues.topMargin);
  bottomMargin.setValue(defaultValues.bottomMargin);
  rightMargin.setValue(defaultValues.rightMargin);
  pageTurnOffset.setValue(defaultValues.pageTurnOffset);
  scrollSpeed.setValue(defaultValues.scrollSpeed);
  horizontalScrollSpeed.setValue(defaultValues.horizontalScrollSpeed);
  enableNoteSelection.setValue(defaultValues.enableNoteSelection);
  enableTrackSwitch.setValue(defaultValues.enableTrackSwitch);
  enableScrollLogic.setValue(defaultValues.enableScrollLogic);
});


// プリセット反映用
function applyPreset(name) {
  if (name === "Select Preset") {
    // 案内ラベルなので何もしない
    return;
  }
  // プリセット名からプリセットを取得
  var preset = presets[name];
  if (!preset) return;

  lookAheadBars.setValue(preset.lookAheadBars);
  topMargin.setValue(preset.topMargin);
  bottomMargin.setValue(preset.bottomMargin);
  rightMargin.setValue(preset.rightMargin);
  pageTurnOffset.setValue(preset.pageTurnOffset);
  scrollSpeed.setValue(preset.scrollSpeed);
  horizontalScrollSpeed.setValue(preset.horizontalScrollSpeed);
  enableNoteSelection.setValue(preset.enableNoteSelection);
  enableTrackSwitch.setValue(preset.enableTrackSwitch);
  enableScrollLogic.setValue(preset.enableScrollLogic);
}

// 再生監視ループ（即実行せず一定間隔でcallback）
function setInterval(t, callback) {
  SV.setTimeout(t, function () {
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
function makePageTurner(getCoordSystem) {
  // var playback = SV.getPlayback(); // 起動直後エラーの可能性
  // var timeAxis = SV.getProject().getTimeAxis(); // 起動直後エラーの可能性
  var isPageTurning = false;
  var targetPositionLeft = 0;

  var turner = function () {
    var coordSystem = getCoordSystem();
    if (!coordSystem) return;

    var project = SV.getProject();
    if (!project) return;
    var playback = SV.getPlayback();
    var timeAxis = project.getTimeAxis();

    var seconds = playback.getPlayhead();
    if (seconds === null) return;
    // if (typeof seconds !== "number" || isNaN(seconds)) return;  // 数値である場合はOK
    var position = timeAxis.getBlickFromSeconds(seconds);
    var viewRange = coordSystem.getTimeViewRange();
    // getTimeViewRange が無効な値を返した場合はスキップ（編集操作直後などに一時的に不正な値になることがある）
    if (!viewRange || viewRange[1] - viewRange[0] < SV.QUARTER) return;

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

  turner.reset = function () {
    isPageTurning = false;
    targetPositionLeft = 0;
  };
  resetters.push(turner.reset);

  return turner;
}


// ジャンプ時はスムーズスクロール禁止フラグ
var justJumped = false;
// 縦スクロール処理
function makeVerticalScroll(getCoordSystem) {
  // var playback = SV.getPlayback(); // 起動直後エラーの可能性
  // var timeAxis = SV.getProject().getTimeAxis(); // 起動直後エラーの可能性
  var uuid, groupIndex, lastCenter = null, scrollTarget = null;

  var vScroll = function () {
    var coordSystem = getCoordSystem();
    if (!coordSystem) return;

    var project = SV.getProject();

    if (!project) return;
    var playback = SV.getPlayback();
    var timeAxis = project.getTimeAxis();

    var seconds = playback.getPlayhead();
    if (seconds === null) return;
    // if (typeof seconds !== "number" || isNaN(seconds)) return;  // 数値である場合はOK
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

    /*
      var smoothing = 0.1;
      if (lastCenter === null) lastCenter = center;
      lastCenter = lastCenter * (1 - smoothing) + scrollTarget * smoothing;
      coordSystem.setValueCenter(lastCenter);
    */

    // 再生バーの位置に少しだけ先読みを足す
    var early = SV.QUARTER * 0.5;  // ← ここが「どれくらい手前でジャンプするか」（数値が大きいと早く、小さいとギリギリ）
    // 再生バーがノートにかかった瞬間にだけジャンプする
    var playheadInGroup = position - groupOffset + early;
    var activeNote = null;

    for (var i = 0; i < group.getNumNotes(); i++) {
      var note = group.getNote(i);
      if (note.getOnset() <= playheadInGroup && playheadInGroup <= note.getEnd()) {
        activeNote = note;
        break;
      }
    }

    if (activeNote) {
      var p = activeNote.getPitch();

      var screenTop = viewRange[1];
      var screenBottom = viewRange[0];

      if (p > screenTop || p < screenBottom) {

        var targetCenter = scrollTarget * 0.8 + p * 0.2;

        coordSystem.setValueCenter(targetCenter);
        lastCenter = targetCenter;

        justJumped = true;  // このフレームはスムーズスクロール禁止
        return;
      }
    }

    // ジャンプ直後のフレームはスムーズスクロールしない
    if (justJumped) {
      justJumped = false;
      return;
    }

    // 通常のスムーズスクロール
    var smoothing = 0.1;
    if (lastCenter === null) lastCenter = center;
    lastCenter = lastCenter * (1 - smoothing) + scrollTarget * smoothing;
    coordSystem.setValueCenter(lastCenter);
  };

  vScroll.reset = function () {
    uuid = undefined;
    groupIndex = undefined;
    lastCenter = null;
    scrollTarget = null;
    justJumped = false;
  };
  resetters.push(vScroll.reset);

  return vScroll;
}


// 再生位置のノートを取得する
function makeNoteChecker() {
  // var playback = SV.getPlayback(); // 起動直後エラーの可能性
  // var timeAxis = SV.getProject().getTimeAxis(); // 起動直後エラーの可能性
  // var selection = SV.getMainEditor().getSelection(); // 起動直後エラーの可能性
  var uuid, groupIndex;

  var checker = function () {
    var project = SV.getProject();
    if (!project) return;
    var playback = SV.getPlayback();
    var timeAxis = project.getTimeAxis();
    var selection = SV.getMainEditor().getSelection();

    var seconds = playback.getPlayhead();
    if (seconds === null) return;
    // if (typeof seconds !== "number" || isNaN(seconds)) return;  // 数値である場合はOK
    var position = timeAxis.getBlickFromSeconds(seconds);
    var groupReference = SV.getMainEditor().getCurrentGroup();
    if (!groupReference) return;
    var group = groupReference.getTarget();
    if (!group) return;

    if (group.getUUID() !== uuid || groupReference.getIndexInParent() !== groupIndex) {
      uuid = group.getUUID();
      groupIndex = groupReference.getIndexInParent();
    }

    var offset = timeAxis.getBlickFromSeconds(updatePeriod / 1000);
    var target = position - groupReference.getTimeOffset() + offset;

    var activeNote = null;
    for (var i = 0; i < group.getNumNotes(); i++) {
      var note = group.getNote(i);
      if (note.getOnset() <= target && target < note.getEnd()) {
        var lyrics = note.getLyrics();
        if (!selectHyphen && (lyrics === "br")) {
          continue; // brの場合はスキップし、次のノートを見る必要はないがここで探索終了
        }
        activeNote = note;
        break;
      } else if (note.getOnset() > target) {
        break; // 以降のノートはすべて target より未来なので探索終了
      }
    }

    if (activeNote) {
      var selNotes = selection.getSelectedNotes();
      var alreadySelected = (selNotes.length === 1 && selNotes[0].getIndexInParent() === activeNote.getIndexInParent());
      // 既にそのノートが選択されている場合は再選択しない（イベント競合防止）
      if (!alreadySelected) {
        selection.clearNotes();
        selection.selectNote(activeNote);
      }
    }
  };

  checker.reset = function () {
    uuid = undefined;
    groupIndex = undefined;
  };
  resetters.push(checker.reset);

  return checker;
}

// グループ自動切り替え（カレントトラック内で現在位置に最適なグループを探す）
function switchToNextGroupIfNeeded() {
  if (!enableAutoNextGroup) return;
  var playback = SV.getPlayback();
  var timeAxis = SV.getProject().getTimeAxis();
  var seconds = playback.getPlayhead();
  if (seconds === null) return;
  var position = timeAxis.getBlickFromSeconds(seconds);
  var currentGroupRef = SV.getMainEditor().getCurrentGroup();
  if (!currentGroupRef) return;

  var currentGroup = currentGroupRef.getTarget();
  if (!currentGroup) return;

  var lookAhead = SV.QUARTER * 4 * lookAheadBars.getValue();

  // グループのノートが占めている時間範囲を取得する
  function getGroupRange(gRef) {
    var g = gRef.getTarget();
    if (!g || g.getNumNotes() === 0) return null;
    var offset = gRef.getTimeOffset();
    var start = Infinity;
    var end = -Infinity;
    for (var i = 0; i < g.getNumNotes(); i++) {
      var n = g.getNote(i);
      if (n.getOnset() < start) start = n.getOnset();
      if (n.getEnd() > end) end = n.getEnd();
    }
    return { start: start + offset, end: end + offset };
  }

  // 1. まず現在のグループの範囲内にいるかチェック
  var curRange = getGroupRange(currentGroupRef);
  if (curRange) {
    // 再生位置が現在のグループの「開始より少し手前〜終了時間」に収まっていれば現状維持
    if (position >= curRange.start - lookAhead && position <= curRange.end) {
      return;
    }
  }

  // 2. 現在のグループの範囲外なので、カレントトラック内の他の最適なグループを探す
  var project = SV.getProject();
  var currentTrack = null;
  var currentTrackIndex = -1;  // 現在のトラック番号を記録
  var targetUUID = currentGroup.getUUID();
  // 今操作しているトラックを見つける
  for (var t = 0; t < project.getNumTracks(); t++) {
    var track = project.getTrack(t);
    for (var i = 0; i < track.getNumGroups(); i++) {
      var g = track.getGroupReference(i);
      var target = g.getTarget();
      if (target && target.getUUID() === targetUUID) {
        currentTrack = track;
        currentTrackIndex = t;  // 現在のトラック番号を記録
        break;
      }
    }
    if (currentTrack) break;
  }
  if (!currentTrack) return;

  var bestGroupRef = null;
  var minDistance = Infinity;

  // トラック内の全グループを走査し、再生バー位置に一番ふさわしいグループを見つける
  for (var i = 0; i < currentTrack.getNumGroups(); i++) {
    // 事前検知でミュートされている場合はスキップ
    if (mutedMap[currentTrackIndex + ":" + i]) continue;
    var groupRef = currentTrack.getGroupReference(i);
    var range = getGroupRange(groupRef);
    if (!range) continue; // ノートがない空のグループは無視

    // パターンA: 巻き戻し・早送りによって、再生バーが直接そのグループの範囲内に入った場合
    if (position >= range.start - lookAhead && position <= range.end) {
      bestGroupRef = groupRef;
      break; // 範囲に入っているものが見つかれば即確定
    }

    // パターンB: どれも範囲外の場合（空白区間にいる）、未来方向の直近のグループを選ぶ
    if (!enableTrackSwitch.getValue() && range.start > position) {
      /*
      if (range.start > position) {
      */
      var dist = range.start - position;
      if (dist < minDistance) {
        minDistance = dist;
        bestGroupRef = groupRef;
      }
    }
  }

  // もし条件を満たすグループが見つかれば切り替える
  if (bestGroupRef && bestGroupRef.getTarget().getUUID() !== targetUUID) {
    SV.getMainEditor().setCurrentGroup(bestGroupRef);
  }
}



// トラック探索+切り替え
function switchToOtherTrackIfNeeded() {
  // 自動トラック切り替え無効時は何もしない
  if (!enableTrackSwitch.getValue()) {
    forceTrackSearch = false; // 念のためOFFになっている時はシーク検知フラグを破棄する
    return;
  }

  var playback = SV.getPlayback();
  var timeAxis = SV.getProject().getTimeAxis();
  var seconds = playback.getPlayhead();
  if (seconds === null) return;
  // if (typeof seconds !== "number" || isNaN(seconds)) return;  // 数値である場合はOK

  var position = timeAxis.getBlickFromSeconds(seconds);
  var project = SV.getProject();
  var currentTrack = SV.getMainEditor().getCurrentTrack();
  var currentGroupRef = SV.getMainEditor().getCurrentGroup();
  var currentGroup = currentGroupRef.getTarget();
  var currentOffset = currentGroupRef.getTimeOffset();

  // 先読み範囲（1 小節 = SV.QUARTER * 4）（UI設定値と連動）
  var lookAhead = SV.QUARTER * 4 * lookAheadBars.getValue();
  var rangeStart = position - currentOffset;
  var rangeEnd = rangeStart + lookAhead;

  // 現在のトラック番号を特定
  var currentTrackIndex = -1;
  for (var tIdx = 0; tIdx < project.getNumTracks(); tIdx++) {
    if (project.getTrack(tIdx) === currentTrack) {
      currentTrackIndex = tIdx; break;
    }
  }

  // 現在のグループにノートがあるかチェック
  var hasNote = false;
  // 現在の場所がミュート中（mutedMapにあり）なら、ノートがあっても強制的に hasNote=false で他を探す
  var isCurrentMuted = (currentTrackIndex !== -1) ? mutedMap[currentTrackIndex + ":" + currentGroupRef.getIndexInParent()] : false;

  if (!isCurrentMuted) { // ミュートされていない場合のみ、ノートがあるか確認
    for (var i = 0; i < currentGroup.getNumNotes(); i++) {
      var note = currentGroup.getNote(i);
      if (note.getEnd() > rangeStart && note.getOnset() < rangeEnd) {
        hasNote = true;
        break;
      }
    }
  }

  // シーク直後は下記の切り替え判定を一時的に無効化して、他トラック（全トラック）の探索を強制する
  if (forceTrackSearch) {
    hasNote = false;
    forceTrackSearch = false; // 1回やり直したらフラグを戻す
  }

  // ノートがあるなら切り替え不要
  // if (hasNote) return;
  // ミュート中であるか、ノートがなければ他を探す（それ以外なら現状維持）
  if (hasNote && !isCurrentMuted) return;


  // 最も早いトラックを選ぶための変数
  var bestGroupRef = null;  // 最も早いグループ参照
  var bestTrack = currentTrack;  // 数字比較のために現在ベストなトラック自体を保持
  /*
  var minOnset = Infinity;  // 条件1番優先：ノートの発音開始位置
  var bestTrackPriority = -Infinity;  // 条件2番優先：トラック名の優先度スコア
  var bestOffset = Infinity; // 条件4番優先：発音同着時のグループ始点(offset)
  */

  // 今の自分の位置と優先度を「基準値（最底辺）」として設定
  var minOnset = hasNote ? position : Infinity;     // ノートがあるなら現在位置、なければ無限大
  var bestTrackPriority = hasNote ? getTrackPriority(currentTrack) : -Infinity;  // ノートがあるなら現在のトラック優先度、なければ無限大
  var bestOffset = hasNote ? currentOffset : Infinity;  // ノートがあるなら現在のオフセット、なければ無限大
  var bestGroupRef = null;  // 最も早いグループ参照
  // var bestTrack = null;  // 数字比較のために現在ベストなトラック自体を保持

  // 他のトラックをチェック
  for (var t = 0; t < project.getNumTracks(); t++) {  // トラックの数を取得
    var track = project.getTrack(t);  // トラックを取得

    // 現在のトラックはスキップ
    // if (track === SV.getMainEditor().getCurrentTrack()) continue;
    // 【変更】今の自分のトラックも検索対象に含め、プロジェクト全体から「今」最適なものを探す

    // トラック内のグループの数を取得
    for (var g = 0; g < track.getNumGroups(); g++) {
      // 事前検知でミュートされている場合はスキップ
      if (mutedMap[t + ":" + g]) continue;

      var groupRef = track.getGroupReference(g);
      // トラック内のグループ参照を取得
      var group = groupRef.getTarget();  // グループを取得
      if (!group) continue;
      var offset = groupRef.getTimeOffset();  // グループのオフセットを取得

      // このグループに先読み範囲のノートがあるか？
      for (var n = 0; n < group.getNumNotes(); n++) {
        var note = group.getNote(n);  // ノートを取得
        var lyrics = note.getLyrics();  // ノートの歌詞を取得

        // ブレスは「存在しないもの」として判定から除外（スキップ）する
        if (lyrics === "br") {  // 追加したい場合は "br" || "追加したい文字列" のようにつなげる
          continue;
        }

        var ns = note.getOnset() + offset;  // ノートの開始位置
        var ne = note.getEnd() + offset;  // ノートの終了位置

        // ノートが再生バーの先読み範囲内（または現在発音中）に入っている場合
        if (ne > position && ns < position + lookAhead) {

          // 再生バーより過去にあるノート（まだ歌っている）の場合は、現在のpositionとして扱う
          var effectiveOnset = Math.max(position, ns);
          var trackPriority = getTrackPriority(track); // トラック名の総合スコアを取得

          // 条件1: ノートの発音が明確に早い場合
          if (effectiveOnset < minOnset) {
            minOnset = effectiveOnset;  // 条件1番優先：ノートの発音開始位置
            bestTrackPriority = trackPriority;  // 条件2番優先：トラック名の優先度スコア
            bestOffset = offset;  // 条件3番優先：発音同着時のグループ始点(offset)
            bestGroupRef = groupRef;  // 最優先
            bestTrack = track;  // ベストトラック更新
          }

          // 条件2: ノートの発音開始が同着（完全に同時）の場合、トラック名が優先ルールに合致する方を優先
          else if (effectiveOnset === minOnset) {
            if (trackPriority > bestTrackPriority) {
              bestTrackPriority = trackPriority;  // 条件2番優先：トラック名の優先度スコア
              bestOffset = offset;  // 条件3番優先：発音同着時のグループ始点(offset)
              bestGroupRef = groupRef;  // 最優先
              bestTrack = track;  // ベストトラック更新
            }

            // 条件3: 発音もトラック名の優先順位もかち合った場合、UIの表示順を新しい条件3として比較する
            else if (trackPriority === bestTrackPriority) {

              // 万が一APIが存在しないバージョンのためにフォールバック(Infinity)を用意
              var currentOrder = typeof track.getDisplayOrder === "function" ? track.getDisplayOrder() : Infinity;
              var bestOrder = typeof bestTrack.getDisplayOrder === "function" ? bestTrack.getDisplayOrder() : Infinity;

              // 表示順に差があるなら、UI上で上にある（数値が小さい）トラックを無条件で優先する
              if (currentOrder !== bestOrder) { //表示順に差がある場合  
                if (currentOrder < bestOrder) { //表示順が若い方を優先
                  bestOffset = offset;  // 条件3番優先：発音同着時のグループ始点(offset)
                  bestGroupRef = groupRef;  // 最優先
                  bestTrack = track;  // ベストトラック更新
                }
              }
              // 条件4: 画面上の並び順すら同じ場合（通常あり得ないがAPI未対応時などの保険）、元のトラック名の数字で比較する（まず「先頭の数字」で比較し、次に「末尾の数字」で枝番比較する）
              // else if (trackPriority === bestTrackPriority) {
              else {

                var currentName = track.getName();  // 評価中のトラック名
                var bestName = bestTrack.getName();  // ベストなトラック名

                // 前半：先頭の数字（トラック順位）による比較
                // まずトラック名から先頭の数字だけを抽出する
                var currentHead = currentName.match(/^\d+/);
                var bestHead = bestName.match(/^\d+/);
                // 数字がない場合は Infinity（最下位）
                var currentHeadNum = currentHead ? parseInt(currentHead[0], 10) : Infinity;
                var bestHeadNum = bestHead ? parseInt(bestHead[0], 10) : Infinity;

                // もし先頭の数字に差があるなら、ベース名に関係なく数字が若い方を優先
                if (currentHeadNum !== bestHeadNum) { //数字が違う場合
                  if (currentHeadNum < bestHeadNum) { //数字が若い方を優先
                    bestOffset = offset;  // 条件3番優先：発音同着時のグループ始点(offset)
                    bestGroupRef = groupRef;  // 最優先
                    bestTrack = track;  // ベストトラック更新
                  }
                }
                // 後半：末尾の数字（枝番）による比較
                // 先頭の数字が同じ（または両方なし）の場合は、末尾の数字を比較する
                else { //先頭の数字が同じ場合
                  // トラック名から末尾の数字（枝番）のみを抽出
                  var currentTail = currentName.match(/\d+$/);
                  var bestTail = bestName.match(/\d+$/);
                  // 枝番がない（無印）場合は「0」を割り当て、複製元のオリジナル（0）が複製先（1, 2）よりも最優先されるようにする
                  var currentTailNum = currentTail ? parseInt(currentTail[0], 10) : 0;
                  var bestTailNum = bestTail ? parseInt(bestTail[0], 10) : 0;

                  // 派生元を識別するため、トラック名から【末尾の枝番と、その手前のアンダーバー・ハイフン・空白】のみを除去した「ベース名」を取得
                  var currentBase = currentName.replace(/[\s_\-]*\d+$/g, "");
                  var bestBase = bestName.replace(/[\s_\-]*\d+$/g, "");

                  // ベース名が一致する場合（＝派生トラック同士の場合）のみ、枝番を比較
                  if (currentBase === bestBase && currentTailNum !== bestTailNum) { //ベース名が同じで枝番が違う場合
                    // 数字が若い方（無印は0扱い）が勝つ
                    if (currentTailNum < bestTailNum) { //枝番が若い方を優先
                      bestOffset = offset;  // 条件3番優先：発音同着時のグループ始点(offset)
                      bestGroupRef = groupRef;  // 最優先
                      bestTrack = track;  // ベストトラック更新
                    }
                  }
                }
                /* グループ始点による優先順位付けは廃止
                // 条件4: ベース名も違う全くの別トラック、または先頭も末尾も同じ場合は、グループ始点が早い方を優先
                else {
                  if (offset < bestOffset) { //グループ始点が早い方を優先
                    bestOffset = offset;  // 条件3番優先：発音同着時のグループ始点(offset)
                    bestGroupRef = groupRef;  // 最優先
                    bestTrack = track;  // ベストトラック更新
                  }
                }
                */
              }
            }
          }

          break; // 次のグループをチェックする
        }
      }
    }
  }

  // もし、今よりも「より良い候補」が見つかれば切り替える
  if (bestGroupRef && bestGroupRef.getTarget().getUUID() !== currentGroup.getUUID()) {
    SV.getMainEditor().setCurrentGroup(bestGroupRef);
  }

}

// トラックの優先度スコアを判定する関数
function getTrackPriority(track) {
  // トラック名を小文字に変換
  var name = track.getName().toLowerCase();
  // 優先度スコア
  var score = 0;

  // リストが未定義（または空）の場合のエラー回避用ガード
  var dList = (typeof downgradeLists !== "undefined" && Array.isArray(downgradeLists)) ? downgradeLists : []; // 優先度を下げるリスト
  var pList = (typeof priorityLists !== "undefined" && Array.isArray(priorityLists)) ? priorityLists : []; // 優先度リスト

  // 1. マイナスリストに該当する場合は -1（returnせず続行）
  for (var k = 0; k < dList.length; k++) {
    if (name.indexOf(dList[k].toLowerCase()) >= 0) {
      score -= 1;
      break;
    }
  }

  // 2. 優先リストに該当する場合は +n（第一優先なら最大値）
  for (var i = 0; i < pList.length; i++) {
    var list = pList[i];
    if (!Array.isArray(list)) continue; // 二次元配列の一部が欠けている場合をガード
    for (var j = 0; j < list.length; j++) {
      if (name.indexOf(list[j].toLowerCase()) >= 0) {
        // 第一優先なら一番大きい数字が返り、第二優先ならその次の数字が返る
        score += pList.length - i;
        break;
      }
    }
  }
  return score; // 0なら通常、マイナスなら優先度↓、プラスなら優先度↑
}




// 内部状態を初期化
function resetInternalState() {
  /* 初期化処理を変更
  lastCenter = null;
  justJumped = false;
  lastTrackIndex = null;
  lastGroupIndex = null;
  lastScrollPos = null;
  */
  // 各スクロール処理のresetters配列に入っている関数をすべて実行
  for (var i = 0; i < resetters.length; i++) {
    resetters[i]();
  }
}


var verticalScroll = makeVerticalScroll(function () { return SV.getMainEditor().getNavigation(); });  // 縦スクロール
var pageTurnerMain = makePageTurner(function () { return SV.getMainEditor().getNavigation(); });    // 横スクロール（ピアノロール）
// アレンジビュー（トラックの横スクロール）のNavigation取得（取得失敗時はnullを返す）
var pageTurnerArrange = makePageTurner(function () {
  var arr = SV.getArrangement();
  return arr ? arr.getNavigation() : null;
});
var noteChecker = makeNoteChecker();  // 再生位置のノートを選択


// スクリプト実行処理
function checkPlayhead() {
  // プリセット変化監視
  var index = presetSelector.getValue();   // 0,1,2,3...
  var name = presetList[index];            // "Select Preset" or "Preset A" etc.

  if (name !== lastPreset) {
    applyPreset(name);
    lastPreset = name;
  }

  // オートスクロール実行確認
  if (!enableScrollLogic.getValue()) {
    lastPlayheadSeconds = -1;
    return; // チェックが外れていたら何もしない
  }
  var playback = SV.getPlayback();  // 再生状態を取得
  if (playback.getStatus() === "stopped") { // 停止状態なら
    lastPlayheadSeconds = -1; // 再生位置をリセット
    return;
  }

  // 事前スキャン（ミュート・ソロ状態の把握と負荷軽減）
  mutedMap = {};
  if (enableTrackSwitch.getValue()) {
    var proj = SV.getProject();
    var numTracks = proj.getNumTracks();

    // 1段目：ソロ状態のプレビュー
    var hasSolo = false;
    var soloFlags = [];
    var muteFlags = [];

    for (var tSc = 0; tSc < numTracks; tSc++) {
      var trkSc = proj.getTrack(tSc);
      var mixer = (typeof trkSc.getMixer === "function") ? trkSc.getMixer() : null;
      var isSolo = mixer ? mixer.isSolo() : false;
      var isTrkMuted = mixer ? mixer.isMuted() : ((typeof trkSc.getMute === "function" && trkSc.getMute()) || (typeof trkSc.isMuted === "function" && trkSc.isMuted()));

      soloFlags[tSc] = isSolo;
      muteFlags[tSc] = isTrkMuted;
      if (isSolo) hasSolo = true; // 1つでもソロがあればフラグON
    }

    // 2段目：本スキャン（除外マップへの登録）
    for (var tSc = 0; tSc < numTracks; tSc++) {
      var trkSc = proj.getTrack(tSc);
      var isTrkMuted = muteFlags[tSc];
      var isSolo = soloFlags[tSc];

      // プロジェクト内にソロトラックが存在する場合ソロトラック以外をミュート扱いにする
      if (hasSolo && !isSolo) {
        isTrkMuted = true; // ソロが存在する時の非ソロトラックは候補から完全除外
      }

      // トラック自体がミュート扱いなら全グループを除外
      if (isTrkMuted) {
        var numGrps = trkSc.getNumGroups();
        for (var gAll = 0; gAll < numGrps; gAll++) {
          mutedMap[tSc + ":" + gAll] = true;
        }
        continue;
      }

      // トラックがミュート扱いでない時は、内部のグループがミュートされていないか個別に確認
      var numGrps = trkSc.getNumGroups();
      for (var gSc = 0; gSc < numGrps; gSc++) {
        var grSc = trkSc.getGroupReference(gSc);
        if ((typeof grSc.getMute === "function" && grSc.getMute()) || (typeof grSc.isMuted === "function" && grSc.isMuted())) {
          mutedMap[tSc + ":" + gSc] = true;
        }
      }
    }
  }


  /* ミュートグループのみ除外
  // 事前ミュートスキャン
  mutedMap = {};
  if (enableTrackSwitch.getValue()) {
    var proj = SV.getProject();
    for (var tSc = 0; tSc < proj.getNumTracks(); tSc++) {
      var trkSc = proj.getTrack(tSc);
      var trkMuted = (typeof trkSc.getMute === "function" && trkSc.getMute()) || (typeof trkSc.isMuted === "function" && trkSc.isMuted());
      for (var gSc = 0; gSc < trkSc.getNumGroups(); gSc++) {
        var grSc = trkSc.getGroupReference(gSc);
        if (trkMuted || (typeof grSc.getMute === "function" && grSc.getMute()) || (typeof grSc.isMuted === "function" && grSc.isMuted())) {
          mutedMap[tSc + ":" + gSc] = true;
        }
      }
    }
  }
  */

  // シーク（再生バー移動）検知
  var currentSeconds = playback.getPlayhead();
  if (typeof currentSeconds === "number" && !isNaN(currentSeconds)) {
    if (lastPlayheadSeconds !== -1) {
      if (Math.abs(currentSeconds - lastPlayheadSeconds) > 0.4) {
        // 0.4秒以上時間が飛んだらユーザーのシーク操作判断してリセットする
        resetInternalState();

        // トラック自動切り替えがONの時だけ、探知強制やり直しのフラグを立てる
        if (enableTrackSwitch.getValue()) {
          forceTrackSearch = true;
        }
      }
    }
    lastPlayheadSeconds = currentSeconds;
  }


  // 内部リセット（再生開始・停止時）
  var isPlaying = (playback.getStatus() === "playing");

  // 再生開始時に初期化
  if (!wasPlaying && isPlaying) {
    resetInternalState();
  }
  // 再生終了時に初期化
  if (wasPlaying && !isPlaying) {
    resetInternalState();
  }
  wasPlaying = isPlaying;

  verticalScroll();  // 縦スクロール
  pageTurnerMain();  // 横スクロール（ピアノロール）
  try { pageTurnerArrange(); } catch (e) { }  // pageTurnerArrange は例外発生時にループが止まらないよう try-catch で保護する
  if (enableNoteSelection.getValue()) noteChecker();  // 再生バー位置のノートを選択する
  if (enableTrackSwitch.getValue()) {
    switchToOtherTrackIfNeeded(); // 全トラック（自分含む）から探すこの関数一つに任せる
  } else {
    switchToNextGroupIfNeeded();  // 次のグループに切り替える
  }

}

setInterval(updatePeriod, checkPlayhead);


// スクリプトパネルUI
function getSidePanelSectionState() {
  var rows = [
    { type: "Label", text: SV.T("Vertical Scroll Margin") },
    /*
    return {
      title: SV.T("Scroll Settings"),
      rows: [
        { type: "Label", text: SV.T("Vertical Scroll Margin") },  */
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

  ];

  // プリセットUIを使う場合だけ表示
  if (enablePresetUI) {
    rows.push({
      type: "Container",
      columns: [
        {   // デフォルトに戻す
          type: "Button",
          text: SV.T("Reset to Default"),
          value: resetButton,
          width: 0.5
        },
        {   // プリセット選択
          type: "ComboBox",
          text: SV.T("Preset"),
          value: presetSelector,
          choices: presetList,
          width: 0.5
        }
      ]
    });
  } else {
    // プリセットUIを使わない場合は Reset ボタンのみ
    rows.push({
      type: "Container",
      columns: [
        {   // デフォルトに戻す
          type: "Button",
          text: SV.T("Reset to Default"),
          value: resetButton,
          width: 1.0
        }
      ]
    });
  }

  // 残りのチェックボックス
  rows.push({
    type: "Container",
    columns: [
      {   // 再生バー位置のノートを選択する
        type: "CheckBox",
        text: SV.T("Enable Note Selection"),
        value: enableNoteSelection
      }
    ]
  });

  rows.push({
    type: "Container",
    columns: [
      {   // トラック自動切り替え機能
        type: "CheckBox",
        text: SV.T("Enable Track Auto-Switch"),
        value: enableTrackSwitch
      }
    ]
  });

  rows.push({
    type: "Container",
    columns: [
      {   // オートスクロール切り替え
        type: "CheckBox",
        text: SV.T("Enable Scroll Logic"),
        value: enableScrollLogic
      }
    ]
  });

  return {
    title: SV.T("Scroll Settings"),
    rows: rows
  };
}
