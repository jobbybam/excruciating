# How to add your own games

You can add a game yourself through GitHub. You do not need to edit the site's JavaScript.

## 1. Check the game's permission first

Use a game you made, a game whose licence explicitly allows redistribution/self-hosting, or a game whose creator has given you written permission.

A game being on GitHub does not automatically make it free to copy. Projects with no licence are still copyrighted. Check the code, sprites, music, sound effects, fonts and other assets too. Keep the original licence and attribution files.

## 2. Prepare the game folder

Extract the game files on your computer. The folder must have an `index.html` file at its top level and all its assets beside it, preserving the paths the game expects.

Example:

```text
games/
  my-new-game/
    index.html
    game.js
    styles.css
    assets/
      player.png
      music.ogg
    LICENSE
    ATTRIBUTION.md
```

The folder name is the slug. Use lowercase letters, numbers and hyphens only, for example `my-new-game`.

## 3. Upload to this repository

**For a single-file HTML game (GitHub in your browser):**

1. Open https://github.com/jobbybam/excruciating.
2. Choose **Add file → Create new file**.
3. In the filename box, enter `games/my-new-game/index.html`.
4. Paste the complete HTML game source.
5. Commit the new file to `main`.

**For a game with multiple files/assets (recommended):**

1. Install/open GitHub Desktop and clone `jobbybam/excruciating`.
2. On your computer, copy the complete extracted game folder into the repository's `games/` folder, naming it `my-new-game`.
3. Check that `games/my-new-game/index.html` exists and all asset subfolders are present.
4. In GitHub Desktop, commit the changes and push to `main`.

Do not flatten the folder or rename asset files: preserve the structure expected by the game's HTML/CSS/JavaScript.

## 4. Publish it on the website

1. Let the Cloudflare Pages deployment finish.
2. Open your website's `/admin` page and sign in.
3. In **Add a game**, enter the game's title, category and slug (`my-new-game`).
4. Enter a thumbnail path such as `/games/my-new-game/thumb.png` if you included one.
5. Enter its original source URL, licence/permission and required attribution.
6. Select **Publish in catalogue**.

The admin form checks that `/games/my-new-game/index.html` is deployed before adding the game to the catalogue.

## 5. Remove a game

Use **Remove** in the admin game list to hide it from the catalogue. To delete the actual files, delete its `games/<slug>/` folder in GitHub too.

## Important

Do not upload paid commercial game files or copyrighted assets without permission. For example, official Undertale, Deltarune, FNAF, DDLC and other proprietary game files must not be copied into this public repository unless the rights holder has authorised redistribution. A Scratch project shared on Scratch may be remixed under Scratch's Share-Alike rules; preserve attribution and comply with the applicable licence. See the Scratch Help Center: https://mitscratch.freshdesk.com/en/support/solutions/articles/4000156817-how-can-i-stop-people-from-remixing-my-projects
