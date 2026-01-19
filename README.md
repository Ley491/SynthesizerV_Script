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
- ScrollSettings_UI.js: スクロール設定編集用

### LyricsPhonemesEditor.js
- スクリプトパネル用歌詞・音素編集スクリプト
    - まいこ氏作スクリプト（EditLyrics.js, SelectPlayPosiNote.js）を元に改変。
- 対象を選択ノート一つに限定し、歌詞と一緒に音素も編集できるようにしたもの。
    - 音素はデフォルト（未編集）状態では何も表示されません。
- 「取得」ボタンを押すとノート未選択でも再生バーの位置にあるノートの歌詞と音素を取得します。
    - スマートピッチ編集ツールやスマートピッチペンツール使用時に使うと便利かも？
- チェックボックスの「再生位置のノートを取得」をONにすると、常にノートが未選択状態でも再生バーの位置にあるノートの歌詞と音素を取得できます。
    - ただし再生バーを動かしただけでは反映されず、ピアノロール上でクリックや選択などの操作を行ったタイミングで更新されます。


### ScrollSettings_UI.js
- スクリプトパネル用スクロール設定編集スクリプト
    - まいこ氏作スクリプト（SmoothNavigationPlayPlus.js, AutoVerticalScroll.js, SelectPlayPosiNote.js）と此岸さくら氏作スクリプト（SelectPlayingNote Patched.js）を参考に改変。
- 再生中の縦・横スクロール挙動を細かく調整できるようにしたもの。
    - 上下の余白、先読み小節数、縦スクロール速度を調整可能。
    - 右余白によるページ送り、ページ送り後の左余白（オフセット）、横スクロール速度を調整可能。
    - ピアノロールとアレンジビューの両方に対応。
- 再生中ノートの自動選択機能を搭載（br は除外）。
- 同じトラックの次のグループに自動で選択を切り替える機能を搭載。
- デフォルト値へのリセット、スクロール処理の ON/OFF 切り替えに対応。

## 更新履歴
### 2026-01-19
- LyricsPhonemesEditor.js と ScrollSettings_UI.js を公開しました。

## 連絡先
- Ley
    - Twitter/X: https://x.com/Ley491
    - GitHub: https://github.com/Ley491
- 配布場所： https://github.com/Ley491/SynthesizerV_Script
