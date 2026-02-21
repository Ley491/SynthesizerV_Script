/*
- 選択中のノートを基準に、そのノート自身と前方のノートをすべて選択するスクリプト
*/

function getClientInfo() {
  return {
    "name": SV.T("Select Notes Before"),
    "author": "Ley",
    "versionNumber": 1.0,
    "minEditorVersion": 65537,
    "category": "Ley Script",
  };
}


function getTranslations(lang) {
  if (lang === "ja-jp") {
    return [
      ["Select Notes Before", "指定ノートまでを選択"],
    ];
  }
  return [];
}

function main() {
  var editor = SV.getMainEditor();
  var selection = editor.getSelection();
  var notes = selection.getSelectedNotes();
  if (notes.length == 0) return;

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

  // 基準ノートも選択し直す
  selection.selectNote(base);

  SV.finish();
}
