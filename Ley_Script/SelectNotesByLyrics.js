/*
- 選択中のグループもしくはノートの選択範囲の中から、指定した歌詞を検索して選択するスクリプト
*/

function getClientInfo() {
  return {
    "name": SV.T("Select Notes by Lyric"),
    "author": "Ley",
    "versionNumber": 1.0,
    "minEditorVersion": 65537,
    "category": "Ley Script",
  };
}


function getTranslations(lang) {
  if (lang === "ja-jp") {
    return [
      ["Select Notes by Lyric", "歌詞でノートを選択"],
      ["Enter the lyric to select", "選択したい歌詞を入力してください"],
      ["Not found", "見つかりません"],
      ["The lyric \"%1\" was not found.", "指定した歌詞「%1」は見つかりませんでした。"],
    ];
  }
  return [];
}


function main() {
  var editor = SV.getMainEditor();
  var selection = editor.getSelection();
  var selected = selection.getSelectedNotes();
  var group = editor.getCurrentGroup().getTarget();

  // showInputBox は文字列 or null を返す
  var text = SV.showInputBox(SV.T("Select Notes by Lyric"), SV.T("Enter the lyric to select"), "");
  if (text == null) return;
  var target = text;

  selection.clearAll();

  var count = 0;  // 見つかった数をカウント

  if (selected.length > 0) {
    // 選択範囲の中だけ検索
    for (var i = 0; i < selected.length; i++) {
      if (selected[i].getLyrics() == target) {
        selection.selectNote(selected[i]);
        count++;
      }
    }
  } else {
    // 選択範囲がない場合は GroupReference 全体
    for (var i = 0; i < group.getNumNotes(); i++) {
      var n = group.getNote(i);
      if (n.getLyrics() == target) {
        selection.selectNote(n);
        count++;
      }
    }
  }

  // 見つからなかった場合のダイアログ
  if (count == 0) {
    SV.showMessageBox(SV.T("Not Found"), SV.T("The lyric \"%1\" was not found.").replace("%1", target));
  }

  SV.finish();
}
