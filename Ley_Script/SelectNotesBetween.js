/*
- 選択ノートと再生バーの位置を基準に、その2点の間にあるノートをすべて選択するスクリプト
*/

function getClientInfo() {
  return {
    "name": SV.T("Select Notes Between"),
    "author": "Ley",
    "versionNumber": 1.0,
    "minEditorVersion": 65537,
    "category": "Ley Script",
  };
}


function getTranslations(lang) {
  if (lang === "ja-jp") {
    return [
      ["Select Notes Between", "指定範囲を全選択"],
      ["No note is selected.", "ノートが選択されていません"],
    ];
  }
  return [];
}

function main() {
  var editor = SV.getMainEditor();
  var selection = editor.getSelection();
  var notes = selection.getSelectedNotes();

  if (notes.length === 0) {
    SV.showMessageBox("Error", SV.T("No note is selected."));
    return;
  }

  var base = notes[0]; // 基準ノート
  var baseOnset = base.getOnset();
  var baseEnd = base.getEnd();

  var groupRef = editor.getCurrentGroup();
  var group = groupRef.getTarget();

  // 再生バー位置（グループオフセット補正後）
  var playback = SV.getPlayback();
  var timeAxis = SV.getProject().getTimeAxis();
  var playPos = timeAxis.getBlickFromSeconds(playback.getPlayhead());
  var playPosLocal = playPos - groupRef.getTimeOffset();

  // 区間を決定（小さい方が start、大きい方が end）
  var start = Math.min(baseOnset, playPosLocal);
  var end = Math.max(baseEnd, playPosLocal);

  // 選択し直し
  selection.clearAll();

  for (var i = 0; i < group.getNumNotes(); i++) {
    var n = group.getNote(i);
    var onset = n.getOnset();
    var nEnd = n.getEnd();

    // ノートが区間にかかっていれば選択
    if (nEnd >= start && onset <= end) {
      selection.selectNote(n);
    }
  }
}
