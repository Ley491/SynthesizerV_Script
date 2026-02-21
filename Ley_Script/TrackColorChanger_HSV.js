/* 
- まいこ氏作スクリプト（TrackColorChanger_MaterialDesign.js, TrackColorChanger_SVColor.js）を元に改変。
- HSV形式でトラックカラーを設定し変更できます。
  - 現在選択中のトラックカラーがまず反映されているので、そこからスライダーで色調の変更が可能です。
  - カラーコードも表示されていますが、スライダーで変更した色は反映されません。
- トラックカラー変更後も同じトラックを再選択します。
*/

function getClientInfo() {
  return {
    name: SV.T("Track Color Changer (HSV)"),
    author: "Ley",
    versionNumber: 1.0,
    minEditorVersion: 65537,
    category: "Ley Script"
  };
}

function getTranslations(lang) {
  if (lang === "ja-jp") {
    return [
      ["Track Color Changer (HSV)", "トラックカラー変更（HSV版）"],
      ["Hue", "色相"],
      ["Hue　（R←Y←G←C→B→M→R）", "色相　（赤←黄←緑↔青→紫→赤）"],
      ["Saturation", "彩度"],
      ["Saturation　（Dull ↔ Vivid）", "彩度　（くすんだ ↔ 鮮やか）"],
      ["Value", "明度"],
      ["Value　（Dark ↔ Bright）", "明度　（暗い ↔ 明るい）"],
      ["Color Code", "現在のトラックカラー（カラーコード）"]
    ];
  }
  return [];
}

function main() {

  var editor = SV.getMainEditor();
  var track = editor.getCurrentTrack();
  if (!track) {
    SV.finish();
    return;
  }

  // ---- トラックとグループのオブジェクトを保存 ----
  var savedTrack = editor.getCurrentTrack();
  var savedGroup = editor.getCurrentGroup();

  // ---- 現在のトラックカラーを取得（ARGB8桁）----
  var argb = track.getDisplayColor(); // "ffaabbcc"
  var rgb = argb.substring(2);        // "aabbcc"

  var r = parseInt(rgb.substring(0, 2), 16);
  var g = parseInt(rgb.substring(2, 4), 16);
  var b = parseInt(rgb.substring(4, 6), 16);

  var hsv = rgbToHsv(r, g, b);

  // ---- ダイアログ ----
  var form = {
    "title": SV.T("Track Color Changer (HSV)"),
    "buttons": "OkCancel",
    "widgets": [
      {
        "name": "code",
        "type": "TextBox",
        "label": SV.T("Color Code"),
        "default": rgb,
        "readOnly": true
      },
      {
        "name": "hue",
        "type": "Slider",
        "label": SV.T("Hue　（R←Y←G←C→B→M→R）"),
        "format" : "%1.0f",
        "minValue": 0,
        "maxValue": 360,
        "interval": 1,
        "default": hsv.h
      },
      {
        "name": "sat",
        "type": "Slider",
        "label": SV.T("Saturation　（Dull ↔ Vivid）"),
        "format" : "%1.0f",
        "minValue": 0,
        "maxValue": 100,
        "interval": 1,
        "default": hsv.s
      },
      {
        "name": "val",
        "type": "Slider",
        "label": SV.T("Value　（Dark ↔ Bright）"),
        "format" : "%1.0f",
        "minValue": 0,
        "maxValue": 100,
        "interval": 1,
        "default": hsv.v
      },
    ]
  };

  var result = SV.showCustomDialog(form);
  if (!result.status) {
    SV.finish();
    return;
  }

  // ---- Slider の値を float に変換 ----
  var h = parseFloat(result.answers.hue);
  var s = parseFloat(result.answers.sat);
  var v = parseFloat(result.answers.val);

  // ---- HSV → RGB ----
  var rgb2 = hsvToRgb(h, s, v);
  var newRGB =
    toHex(rgb2.r) +
    toHex(rgb2.g) +
    toHex(rgb2.b);

  // ---- 色を反映（ARGB8桁）----
  track.setDisplayColor("ff" + newRGB); // 反映する時はffをつけないとトラックとノートカラー（グループ以外）がスケルトンになってしまう。

  // ---- 画面更新 ----
  var tmp = SV.getProject().addTrack(SV.create("Track"));
  SV.getProject().removeTrack(tmp);

  // ---- トラックとグループの選択状態を復元 ----
  editor.setCurrentTrack(savedTrack);
  editor.setCurrentGroup(savedGroup);

  SV.finish();
}

// ---- Utility ----

function toHex(v) {
  var h = v.toString(16);
  return (h.length < 2 ? "0" + h : h);
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
