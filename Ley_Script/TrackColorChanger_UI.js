/* 
- まいこ氏作スクリプト（TrackColorChanger_MaterialDesign.js, TrackColorChanger_SVColor.js）を元に改変。
- カラーコードもしくはHSV形式でトラックカラーを設定し変更できます。
  -「トラックカラー取得」ボタンから現在選択中のトラックカラーを取得できます。
    - カラー変更自体はトラックカラーを取得しなくても可能です。
- プリセットを選択すると事前に設定しておいた色を選べます。
  - 自分でプリセットを追加する場合はプリセットセット定義（var presetSets）を編集してください。
    - typeのcolumnsは一列に表示する数です。
    - typeのlabelでプリセットの表示を区切ったりできます。（なくても大丈夫）
- トラックカラー変更後も同じトラックを再選択します。

*/

function getClientInfo() {
  return {
    "name" : "Track Color Changer UI",
    "author" : "Ley",
    "versionNumber" : 1.0,
    "minEditorVersion" : 131329,
    "type": "SidePanelSection",
    "category" : "Ley Script"
  };
}



function getTranslations(lang) {
  if (lang === "ja-jp") {
    return [
      ["Track Color Changer (HSV)", "トラックカラー変更（HSV版）"],
      ["Hue", "色相"],
      ["Hue （R←Y←G←C→B→M→R）", "色相 （赤←黄←緑↔青→紫→赤）"],
      ["Saturation", "彩度"],
      ["Saturation （Dull ↔ Vivid）", "彩度 （くすんだ ↔ 鮮やか）"],
      ["Value", "明度"],
      ["Value （Dark ↔ Bright）", "明度 （暗い ↔ 明るい）"],
      ["Apply", "適用"],
      ["Color Code", "カラーコード"],
      ["Get Track Color", "現在のトラックカラーを取得"],
    ];
  }
  return [];
}

var isPresetApplying = false;

// WidgetValue
var hueValue = SV.create("WidgetValue");
var satValue = SV.create("WidgetValue");
var valValue = SV.create("WidgetValue");
var applyButton = SV.create("WidgetValue");
var colorCodeValue = SV.create("WidgetValue");
var getTrackColorButton = SV.create("WidgetValue");


// ---- プリセットセット定義（ラベル optional、列数可変） ----
var presetSets = {
    "Select Preset Set": { // デフォルト設定
        layout: []   // ← 何も表示しない
    },

  "SV Colors": {
        layout: [
            { type: "grid", columns: 3, items: [  // columns: 3 = ボタン３つ並び
                { name : "Red", rgb : "ffd14f5b" }, 
                { name : "Orange", rgb : "ffc27455" }, 
                { name : "Brown", rgb : "ffc2a153" }, 
                { name : "Yellow", rgb : "ffd6bc43" }, 
                { name : "Lime", rgb : "ff7db235" }, 
                { name : "Green", rgb : "ff3bb26c" }, 
                { name : "Teal", rgb : "ff3eb2a8" }, 
                { name : "Light Blue", rgb : "ff4795cc" }, 
                { name : "Blue", rgb : "ff5478c7" }, 
                { name : "Blue Violet", rgb : "ff6959d4" }, 
                { name : "Purple", rgb : "ff9153d4" }, 
                { name : "Pink", rgb : "ffb853b3" }, 
              ]},
            { type: "label", text: "Pastel Color" },
            { type: "grid", columns: 3, items: [
                { name : "Red", rgb : "ffff8c94" },
                { name : "Orange", rgb : "ffffb38c" },
                { name : "Brown", rgb : "ffe6c68c" },
                { name : "Yellow", rgb : "ffffe78c" },
                { name : "Lime", rgb : "ffd4ff99" },
                { name : "Green", rgb : "ff8cffb3" },
                { name : "Teal", rgb : "ff8cffe7" },
                { name : "Light Blue", rgb : "ff8cd6ff" },
                { name : "Blue", rgb : "ff8cb3ff" },
                { name : "Blue Violet", rgb : "ffa799ff" },
                { name : "Purple", rgb : "ffb38cff" },
                { name : "Pink", rgb : "ffff8cd6" }
              ]},            
        ]
    },
    "AHS Colors": { // 色名が???になっているものはまだ未設定
        layout: [
            { type: "label", text: "Tsurumaki Maki AI 2" },
            { type: "grid", columns: 3, items: [
                { name : "Alvis Red", rgb : "ff560000" },
                { name : "Red", rgb : "ffac0021" },
                { name : "Rose", rgb : "ffF1485D" },
              ]}, 
            { type: "label", text: "Tsuina-Chan" },
            { type: "grid", columns: 3, items: [
                { name : "Varmilion", rgb : "ffD5371F" },
                { name : "Orange", rgb : "ffF8551A" },
                { name : "???", rgb : "ffF1485D" },
              ]}, 
            { type: "label", text: "Kyomachi Seika" },
            { type: "grid", columns: 3, items: [
                { name : "Green", rgb : "54B664" },
                { name : "Sea Green", rgb : "8DE23A" },
                { name : "Carrot", rgb : "EC662C" },
              ]}, 
            { type: "label", text: "Haruno Sora AI 2" },
            { type: "grid", columns: 3, items: [
                { name : "???", rgb : "D02352" },
                { name : "???", rgb : "F64676" },
                { name : "???", rgb : "FF95BC" },
              ]}, 
            { type: "label", text: "Frimomen AI" },
            { type: "grid", columns: 3, items: [
                { name : "???", rgb : "D02352" },
                { name : "???", rgb : "F64676" },
                { name : "???", rgb : "FF95BC" },
              ]}, 
            { type: "label", text: "Miyamai Moca AI 2" },
            { type: "grid", columns: 3, items: [
                { name : "???", rgb : "D02352" },
                { name : "???", rgb : "F64676" },
                { name : "???", rgb : "FF95BC" },
              ]}, 
            { type: "label", text: "miki" },
            { type: "grid", columns: 3, items: [
                { name : "Poinsettia", rgb : "AE0B27" },
                { name : "Fraise", rgb : "DA004E" },  // Strawberry のように長い一単語だと途中で切れてしまう
                { name : "Flamingo", rgb : "E483B0" },
              ]}, 
            { type: "label", text: "Hiyama Kiyoteru AI 2" },
            { type: "grid", columns: 3, items: [
                { name : "???", rgb : "D02352" },
                { name : "???", rgb : "F64676" },
                { name : "???", rgb : "FF95BC" },
              ]},
            { type: "label", text: "Asumi Shuo AI 2" },
            { type: "grid", columns: 3, items: [
                { name : "Berry Pink", rgb : "EB4366" },
                { name : "Rose Glory", rgb : "E284A3" },
                { name : "Piglet Pink", rgb : "EC9B9F" },
              ]}, 
            { type: "label", text: "Asumi Ririse AI 2" },
            { type: "grid", columns: 3, items: [
                { name : "???", rgb : "D02352" },
                { name : "???", rgb : "F64676" },
                { name : "???", rgb : "FF95BC" },
              ]},
            { type: "label", text: "Kasane Teto AI 2" },
            { type: "grid", columns: 3, items: [
                { name : "Valentine", rgb : "D02352" },
                { name : "Pop Pink", rgb : "F64676" },
                { name : "Primrose", rgb : "FF95BC" },
              ]},               
            { type: "label", text: "Nekomura Iroha AI 2" },
            { type: "grid", columns: 3, items: [
                { name : "???", rgb : "D02352" },
                { name : "???", rgb : "F64676" },
                { name : "???", rgb : "FF95BC" },
              ]},               
            { type: "label", text: "Koharu Rikka" },
            { type: "grid", columns: 3, items: [
                { name : "???", rgb : "D02352" },
                { name : "???", rgb : "F64676" },
                { name : "???", rgb : "FF95BC" }
            ]},
            { type: "label", text: "Natsuki Karin AI" },
            { type: "grid", columns: 3, items: [
                { name : "???", rgb : "D02352" },
                { name : "???", rgb : "F64676" },
                { name : "???", rgb : "FF95BC" }
            ]},
            { type: "label", text: "Hanakuma Chifuyu AI" },
            { type: "grid", columns: 3, items: [
                { name : "???", rgb : "D02352" },
                { name : "???", rgb : "F64676" },
                { name : "???", rgb : "FF95BC" }
            ]},
        ]
    },  /*
    "Internet Colors": {
        layout: [
            { type: "label", text: "GUMI" },
            { type: "grid", columns: 3, items: [
                { name : "???", rgb : "D02352" },
                { name : "???", rgb : "F64676" },
                { name : "???", rgb : "FF95BC" }
              ]}, 
            { type: "label", text: "Hibiki Koto AI" },
            { type: "grid", columns: 3, items: [
                { name : "???", rgb : "D02352" },
                { name : "???", rgb : "F64676" },
                { name : "???", rgb : "FF95BC" }
              ]}, 
            { type: "label", text: "Otomachi Una AI" },
            { type: "grid", columns: 3, items: [
                { name : "???", rgb : "D02352" },
                { name : "???", rgb : "F64676" },
                { name : "???", rgb : "FF95BC" }
              ]}, 
        ]
    },  */ /*
    "夢ノ結唱 Colors": {
        layout: [
            { type: "label", text: "POPY" },
            { type: "grid", columns: 3, items: [
                { name : "???", rgb : "D02352" },
                { name : "???", rgb : "F64676" },
                { name : "???", rgb : "FF95BC" }
              ]}, 
            { type: "label", text: "PASTEL" },
            { type: "grid", columns: 3, items: [
                { name : "???", rgb : "D02352" },
                { name : "???", rgb : "F64676" },
                { name : "???", rgb : "FF95BC" }
              ]}, 
            { type: "label", text: "HALO" },
            { type: "grid", columns: 3, items: [
                { name : "???", rgb : "D02352" },
                { name : "???", rgb : "F64676" },
                { name : "???", rgb : "FF95BC" }
              ]}, 
            { type: "label", text: "AVER" },
            { type: "grid", columns: 3, items: [
                { name : "???", rgb : "D02352" },
                { name : "???", rgb : "F64676" },
                { name : "???", rgb : "FF95BC" }
              ]}, 
        ]
    },  */
};

var presetValues = [];
var presetSetValue = SV.create("WidgetValue");
var presetSetNames = Object.keys(presetSets);
presetSetValue.setValue(0);

// セット変更時は UI 再生成
presetSetValue.setValueChangeCallback(function(){
    SV.refreshSidePanel();
});

// ---- プリセットコールバック ----
presetValues.forEach(function(val, i) {
    val.setValueChangeCallback(function () {
        selectPreset(i);
        val.setValue(false);
        SV.refreshSidePanel();
    });
});

// presetValues を「選択されたセットの items 数だけ動的生成」
function buildPresetValues() {
    var setName = presetSetNames[presetSetValue.getValue()];
    var layout = presetSets[setName].layout;

    var items = [];
    for (var i = 0; i < layout.length; i++) {
        if (layout[i].type === "grid") {
            for (var j = 0; j < layout[i].items.length; j++) {
                items.push(layout[i].items[j]);
            }
        }
    }

    // presetValues を作り直す
    presetValues = items.map(function(){ return SV.create("WidgetValue"); });

    // コールバック再設定
    presetValues.forEach(function(val, i){
        val.setValueChangeCallback(function(){
            selectPreset(i);
            val.setValue(false);
            SV.refreshSidePanel();
        });
    });

    return items;
}

// 初期値
hueValue.setValue(180);
satValue.setValue(50);
valValue.setValue(50);
colorCodeValue.setValue("");

// HSV スライダー変更 → カラーコード更新（コールバック）
hueValue.setValueChangeCallback(function() {
    if (!isPresetApplying) updateColorCodeFromSliders();
    // updateColorCodeFromSliders();
    // SV.refreshSidePanel();
});

satValue.setValueChangeCallback(function() {
    // updateColorCodeFromSliders();
    if (!isPresetApplying) updateColorCodeFromSliders();
    // SV.refreshSidePanel();
});

valValue.setValueChangeCallback(function() {
    // updateColorCodeFromSliders();
    if (!isPresetApplying) updateColorCodeFromSliders();
    // SV.refreshSidePanel();
});

// ---- 「現在のトラックカラーを取得」ボタン ----
getTrackColorButton.setValueChangeCallback(function() {
    var editor = SV.getMainEditor();
    var track = editor.getCurrentTrack();
    if (track) {
        applyTrackColorToUI(track);
        SV.refreshSidePanel();
    }
    getTrackColorButton.setValue(0);
});

function parseHexColor(hex) {
    hex = hex.trim().toLowerCase();

    // # を許容する（任意）
    if (hex.startsWith("#")) hex = hex.substring(1);

    // RGB（6桁）
    if (/^[0-9a-f]{6}$/.test(hex)) {
        return {
            a: "ff",
            r: hex.substring(0,2),
            g: hex.substring(2,4),
            b: hex.substring(4,6)
        };
    }

    // ARGB（8桁）
    if (/^[0-9a-f]{8}$/.test(hex)) {
        return {
            a: hex.substring(0,2),
            r: hex.substring(2,4),
            g: hex.substring(4,6),
            b: hex.substring(6,8)
        };
    }

    // 不正な形式
    return null;
}

// ---- トラックカラーを UI に反映する共通関数 ----
function applyTrackColorToUI(track) {
    var argb = track.getDisplayColor(); // 常に8桁
    var c = parseHexColor(argb);
    if (!c) return;

    var r = parseInt(c.r, 16);
    var g = parseInt(c.g, 16);
    var b = parseInt(c.b, 16);

    var hsv = rgbToHsv(r, g, b);

    hueValue.setValue(hsv.h);
    satValue.setValue(hsv.s);
    valValue.setValue(hsv.v);

    // カラーコード欄は RGB6桁で統一
    colorCodeValue.setValue(c.r + c.g + c.b);
}
/*
function applyTrackColorToUI(track) {
    var argb = track.getDisplayColor();
    var rgb = argb.substring(2);

    var r = parseInt(rgb.substring(0, 2), 16);
    var g = parseInt(rgb.substring(2, 4), 16);
    var b = parseInt(rgb.substring(4, 6), 16);

    var hsv = rgbToHsv(r, g, b);

    hueValue.setValue(hsv.h);
    satValue.setValue(hsv.s);
    valValue.setValue(hsv.v);
    colorCodeValue.setValue(rgb);
}
*/


// Apply ボタン
applyButton.setValueChangeCallback(function () {
  var editor = SV.getMainEditor();
  var savedTrack = editor.getCurrentTrack();
  var savedGroup = editor.getCurrentGroup();

  var track = savedTrack;
  if (!track) return;

  // HSV → RGB
  var h = parseFloat(hueValue.getValue());
  var s = parseFloat(satValue.getValue());
  var v = parseFloat(valValue.getValue());

  var rgb = hsvToRgb(h, s, v);
  var hex =
    toHex(rgb.r) +
    toHex(rgb.g) +
    toHex(rgb.b);

  colorCodeValue.setValue(hex);

  // 色変更（ARGB）
  track.setDisplayColor("ff" + hex); // ffをつけないと一部スケルトンカラーになる

  // 画面更新
  var tmp = SV.getProject().addTrack(SV.create("Track"));
  SV.getProject().removeTrack(tmp);

  // トラックとグループの選択状態を復元
  editor.setCurrentTrack(savedTrack);
  editor.setCurrentGroup(savedGroup);
});

// ---- カラーコード欄を編集したらスライダーへ反映 ----
colorCodeValue.setValueChangeCallback(function() {
    var hex = colorCodeValue.getValue().trim();
    var c = parseHexColor(hex);
    if (!c) return;

    var r = parseInt(c.r, 16);
    var g = parseInt(c.g, 16);
    var b = parseInt(c.b, 16);

    var hsv = rgbToHsv(r, g, b);

    hueValue.setValue(hsv.h);
    satValue.setValue(hsv.s);
    valValue.setValue(hsv.v);

    SV.refreshSidePanel();
});
/*
colorCodeValue.setValueChangeCallback(function() {
    var hex = colorCodeValue.getValue().trim();

    // 6桁の16進数でなければ無視
    if (!/^[0-9a-fA-F]{6}$/.test(hex)) return;

    var r = parseInt(hex.substring(0, 2), 16);
    var g = parseInt(hex.substring(2, 4), 16);
    var b = parseInt(hex.substring(4, 6), 16);

    var hsv = rgbToHsv(r, g, b);

    hueValue.setValue(hsv.h);
    satValue.setValue(hsv.s);
    valValue.setValue(hsv.v);

    // UI 更新
    SV.refreshSidePanel();
});
*/

// ---- スライダー変更時にカラーコードを更新 ----
function updateColorCodeFromSliders() {
    var h = parseFloat(hueValue.getValue());
    var s = parseFloat(satValue.getValue());
    var v = parseFloat(valValue.getValue());

    var rgb = hsvToRgb(h, s, v);
    var hex = toHex(rgb.r) + toHex(rgb.g) + toHex(rgb.b);

    colorCodeValue.setValue(hex);
}

// プリセット選択
function selectPreset(i) {
    isPresetApplying = true;

    var setName = presetSetNames[presetSetValue.getValue()];
    var layout = presetSets[setName].layout;

    var items = [];
    for (var a = 0; a < layout.length; a++) {
        if (layout[a].type === "grid") {
            for (var b = 0; b < layout[a].items.length; b++) {
                items.push(layout[a].items[b]);
            }
        }
    }

    var c = parseHexColor(items[i].rgb);
    if (!c) { isPresetApplying = false; return; }

    var r = parseInt(c.r, 16);
    var g = parseInt(c.g, 16);
    var b = parseInt(c.b, 16);

    var hsv = rgbToHsv(r, g, b);

    hueValue.setValue(hsv.h);
    satValue.setValue(hsv.s);
    valValue.setValue(hsv.v);

    // カラーコード欄は RGB6桁で統一
    colorCodeValue.setValue(c.r + c.g + c.b);

    isPresetApplying = false;
}
/*
function selectPreset(i) {
    isPresetApplying = true;

    var setName = presetSetNames[presetSetValue.getValue()];
    var layout = presetSets[setName].layout;

    // items を抽出
    var items = [];
    for (var a = 0; a < layout.length; a++) {
        if (layout[a].type === "grid") {
            for (var b = 0; b < layout[a].items.length; b++) {
                items.push(layout[a].items[b]);
            }
        }
    }
    
    var argb = items[i].rgb;   // 例: "fff44336"
    var rgb = argb.substring(2); // "f44336"
    // var rgb = items[i].rgb;

    var r = parseInt(rgb.substring(0,2),16);
    var g = parseInt(rgb.substring(2,4),16);
    var b = parseInt(rgb.substring(4,6),16);

    var hsv = rgbToHsv(r,g,b);

    // スライダーへ反映
    hueValue.setValue(hsv.h);
    satValue.setValue(hsv.s);
    valValue.setValue(hsv.v);   

    // カラーコード欄へ反映
    colorCodeValue.setValue(rgb);

    isPresetApplying = false;
}
*/

// ---- SidePanelSection UI ----
function getSidePanelSectionState() {
  // rows を配列で組み立ててから、最後にプリセット行を追加する
  var rows = [];

  // Get Track Color ボタン
  rows.push({
    type: "Container",
    columns: [
      {
        type: "Button",
        text: SV.T("Get Track Color"),
        value: getTrackColorButton,
        width: 1.0
      }
    ]
  });

  // Color Code ラベル
  rows.push({ type: "Label", text: SV.T("Color Code") });

  // Color Code テキストボックス
  rows.push({
    type: "Container",
    columns: [
      {
        type: "TextBox",
        value: colorCodeValue,
        readOnly: false,
        width: 1.0
      }
    ]
  });

  // Hue
  rows.push({
    type: "Container",
    columns: [
      {
        type: "Slider",
        text: SV.T("Hue （R←Y←G←C→B→M→R）"),
        format: "%1.0f",
        minValue: 0,
        maxValue: 360,
        interval: 1,
        value: hueValue
      }
    ]
  });

  // Saturation
  rows.push({
    type: "Container",
    columns: [
      {
        type: "Slider",
        text: SV.T("Saturation （Dull ↔ Vivid）"),
        format: "%1.0f",
        minValue: 0,
        maxValue: 100,
        interval: 1,
        value: satValue
      }
    ]
  });

  // Value
  rows.push({
    type: "Container",
    columns: [
      {
        type: "Slider",
        text: SV.T("Value （Dark ↔ Bright）"),
        format: "%1.0f",
        minValue: 0,
        maxValue: 100,
        interval: 1,
        value: valValue
      }
    ]
  });

  // Apply ボタン
  rows.push({
    type: "Container",
    columns: [
      {
        type: "Button",
        text: SV.T("Apply"),
        value: applyButton,
        width: 1.0
      }
    ]
  });

  // プリセットセット選択
  rows.push({
      type: "Container",
      columns: [
          {
              type: "ComboBox",
              choices: presetSetNames,
              value: presetSetValue
          }
      ]
  });

  // 選択されたセットの items を取得
  var items = buildPresetValues();

  // レイアウト生成
  var setName = presetSetNames[presetSetValue.getValue()];
  var layout = presetSets[setName].layout;

  var globalIndex = 0;

  for (var i = 0; i < layout.length; i++) {
      var block = layout[i];

      if (block.type === "label") {
          rows.push({ type: "Label", text: block.text });
      }

      if (block.type === "grid") {
          var cols = block.columns;
          var list = block.items;

          for (var j = 0; j < list.length; j += cols) {
              var row = { type: "Container", columns: [] };

              for (var k = 0; k < cols; k++) {
                  var idx = j + k;
                  if (idx < list.length) {
                      row.columns.push({
                          type: "Button",
                          text: list[idx].name,
                          width: 1.0 / cols,
                          value: presetValues[globalIndex] 
                      });
                      globalIndex++;
                  }
              }

              rows.push(row);
          }
      }
  }

  return {
    title: SV.T("Track Color Changer (HSV)"),
    rows: rows
  };
}


// HSV処理
function toHex(v) {
  var h = v.toString(16);
  return h.length < 2 ? "0" + h : h;
}

function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;

  var max = Math.max(r, g, b);
  var min = Math.min(r, g, b);
  var d = max - min;

  var h = 0;
  if (d !== 0) {
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * (((b - r) / d) + 2);
    else h = 60 * (((r - g) / d) + 4);
  }
  if (h < 0) h += 360;

  var s = max === 0 ? 0 : (d / max) * 100;
  var v = max * 100;

  return { h: h, s: s, v: v };
}

function hsvToRgb(h, s, v) {
  s /= 100;
  v /= 100;

  var c = v * s;
  var x = c * (1 - Math.abs((h / 60) % 2 - 1));
  var m = v - c;

  var r = 0, g = 0, b = 0;

  if (h < 60)      { r = c; g = x; b = 0; }
  else if (h < 120){ r = x; g = c; b = 0; }
  else if (h < 180){ r = 0; g = c; b = x; }
  else if (h < 240){ r = 0; g = x; b = c; }
  else if (h < 300){ r = x; g = 0; b = c; }
  else             { r = c; g = 0; b = x; }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  };
}
