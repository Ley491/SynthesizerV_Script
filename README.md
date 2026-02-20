# SynthesizerV_Script
Microsoft Copilotを使って作成したSynthesizer V 2用スクリプト集。

動作確認環境：Windows 11 / Synthesizer V Studio 2 Pro

## 利用規約
- スクリプトを利用して発生した問題については責任を取りませんので自己責任でご利用ください。
- 自作発言・再配布禁止。
- [まいこ氏](https://drive.google.com/drive/folders/13YUromADAUrgNrRqJ8k7qAja627rYjXG?usp=sharing)、[此岸さくら氏](https://drive.google.com/drive/folders/1I3iou07fsYIhmf_ZmFItZBCExF285nRa)のスクリプトを参考にしている為、そちらの利用規約も参照ください。

## 導入方法
scriptフォルダ（Synthesizer V Studio 2 Proの「スクリプトフォルダを開く」で表示されたフォルダ）にスクリプト（フォルダごとでもOK）とこのREADME.mdを入れてください。  
任意のフォルダに入れても正常に読み込みます。ファイルのフォルダ分けはカテゴリー分けに影響しないのでご自由にどうぞ。
- 例（Windows標準設定の場合）：  
    C:\Users\<ユーザー名>\AppData\Roaming\Dreamtonics\Synthesizer V Studio 2\scripts\Ley_Script


## スクリプトの説明
- LyricsPhonemesEditor.js: 歌詞・音素編集用
- ScrollSettings_UI.js: 自動スクロール設定編集用
- TrackColorChanger_HSV.js: HSV版トラックカラー変更機能
- TrackColorChanger_UI.js: HSV版トラックカラー変更機能（スクリプトパネル版）
- FixPitch_UI.js: ピッチ修正スクリプトのパネルコントロール用
- SelectNotesBefore.js: 選択ノート以前を全選択するノート選択系スクリプト
- SelectNotesAfter.js: 選択ノート以降を全選択するノート選択系スクリプト
- SelectNotesByLyrics.js: 指定した歌詞を選択するノート選択系スクリプト
- SelectNotes_UI.js: ノート選択系スクリプトの統合版（スクリプトパネル用）

 ---

### LyricsPhonemesEditor.js
- スクリプトパネル用歌詞・音素編集スクリプト
    - まいこ氏作スクリプト（EditLyrics.js, SelectPlayPosiNote.js）を元に改変。
- 対象を選択ノート一つに限定し、歌詞と一緒に音素も編集できるようにしたもの。
    - 音素はデフォルト（未編集）状態では何も表示されません。
    - 歌唱言語もプルダウンから変更可能です。
- 「取得」ボタンを押すとノート未選択でも再生バーの位置にあるノートの歌詞と音素を取得します。
    - スマートピッチ編集ツールやスマートピッチペンツール使用時に使うと便利かも？
- チェックボックスの「再生位置のノートを取得」をONにすると、常にノートが未選択状態でも再生バーの位置にあるノートの歌詞と音素を取得できます。
    - ただし再生バーを動かしただけでは反映されず、ピアノロール上でクリックや選択などの操作を行ったタイミングで更新されます。


### ScrollSettings_UI.js
- スクリプトパネル用自動スクロール設定編集スクリプト
    - まいこ氏作スクリプト（SmoothNavigationPlayPlus.js, AutoVerticalScroll.js, SelectPlayPosiNote.js）と此岸さくら氏作スクリプト（SelectPlayingNote Patched.js）を参考に改変。
- 再生中の縦・横スクロール挙動を細かく調整できるようにしたもの。
    - 上下の余白、先読み小節数、縦スクロール速度を調整可能。
    - 右余白によるページ送り、ページ送り後の左余白（オフセット）、横スクロール速度を調整可能。
    - ピアノロールとアレンジビューの両方に対応。
- 再生中ノートの自動選択機能を搭載（br は除外）。
- デフォルト値へのリセット、自動スクロール処理の ON/OFF 切り替えに対応。

### TrackColorChanger_HSV.js
- スクリプトリストもしくはショートカット実行用HSV版トラックカラー変更スクリプト
    - まいこ氏作スクリプト（TrackColorChanger_MaterialDesign.js, TrackColorChanger_SVColor.js）を元に改変。
    - HSV形式でトラックカラーを設定し変更できます。
        - 現在選択中のトラックカラーがまず反映されているので、そこからスライダーで色調の変更が可能です。
        - カラーコードも表示されていますが、スライダーで変更した色は反映されません。
    - トラックカラー変更後も同じトラックを再選択します。

### TrackColorChanger_UI.js
- スクリプトパネル用HSV版トラックカラー変更スクリプト
    - まいこ氏作スクリプト（TrackColorChanger_MaterialDesign.js, TrackColorChanger_SVColor.js）を元に改変。
    - TrackColorChanger_HSV.jsのHSV式トラックカラー変更機能をスクリプトパネル化。
    - プリセット機能を追加。
        - プリセットセット定義（var presetSets）を編集することでプリセットをカスタマイズ可能。
        - プリセット内容は追加途中です。

### FixPitch_UI.js
- スクリプトパネル用ピッチ修正コントロールスクリプト
    - 此岸さくら氏作スクリプト（Fix Pitch.lua）とまいこ氏作スクリプト（SelectPlayPosiNote.js）を元に改変。
    - ピッチコントロール生成間隔と開始オフセットをスライダーで調整できるようにしたもの。
        - 再生位置のノートを取得する機能と選択ノートのピッチコントロールを削除する機能も含まれています。

### SelectNotesBefore.js
- スクリプトリストもしくはショートカット実行用前方ノートを全選択するノート選択スクリプト
    - 選択中のノートを基準に、そのノート自身と前方のノートをすべて選択します。

### SelectNotesAfter.js
- スクリプトリストもしくはショートカット実行用後方ノートを全選択するノート選択スクリプト
    選択中のノートを基準に、そのノート自身と後方のノートをすべて選択します。

### SelectNotesByLyrics.js
- スクリプトリストもしくはショートカット実行用指定歌詞を全選択するノート選択スクリプト
    - 選択中のグループもしくはノートの選択範囲の中から、指定した歌詞を検索して選択します。

### SelectNotes_UI.js
- スクリプトパネル用ノート選択スクリプト（統合版）
    - SelectNotesBefore.js, SelectNotesAfter.js, SelectNotesByLyrics.jsの3つのノート選択系スクリプトを統合したもの。
        - 前を選択: 選択中のノートを基準に、そのノート自身と前方のノートをすべて選択する。
        - 後ろを選択: 選択中のノートを基準に、そのノート自身と後方のノートをすべて選択する。
        - 歌詞で選択: 入力した歌詞と一致するノートをすべて選択する。


## 更新履歴
### 2026-02-21
- SelectNotesBefore.js と SelectNotesAfter.js と SelectNotesByLyrics.js と SelectNotes_UI.js を追加。

### 2026-02-19
- FixPitch_UI.js を追加。

### 2026-02-17
- TrackColorChanger_UI.js を追加。

### 2026-01-22
- TrackColorChanger_HSV.js を追加。

### 2026-01-21
- LyricsPhonemesEditor.jsを更新。
    - 歌唱言語変更機能の追加。

### 2026-01-19
- LyricsPhonemesEditor.js と ScrollSettings_UI.js を公開。


## 連絡先
- Ley
    - Twitter/X: https://x.com/Ley491
    - GitHub: https://github.com/Ley491
- 配布場所： https://github.com/Ley491/SynthesizerV_Script
