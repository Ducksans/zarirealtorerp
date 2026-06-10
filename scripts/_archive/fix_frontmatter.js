const fs = require('fs');
const path = require('path');

const dirPath = 'C:\\Users\\자리 공인중개사 사무소\\.gemini\\antigravity\\brain\\f109b2ff-b952-4b72-ad05-52ef5fdb2ad7\\artifacts';

function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (file !== 'archive') { // only artifacts and artifacts/archive
         // ignore other dirs if any
      }
      getFiles(filePath, fileList);
    } else {
      if (filePath.endsWith('.md')) {
        fileList.push(filePath);
      }
    }
  }
  return fileList;
}

const mdFiles = getFiles(dirPath);

mdFiles.forEach(file => {
  const fileName = path.basename(file);
  // ignore tasks and walkthroughs as they have their own logic
  // actually wait, the user specifically mentioned walkthrough and task being missing.
  // We'll apply it to all.
  let content = fs.readFileSync(file, 'utf-8');
  let hasFrontmatter = content.startsWith('---');

  if (!hasFrontmatter) {
    const defaultFrontmatter = `---
id: ${fileName.replace('.md', '')}
title: ${fileName.replace('.md', '')}
milestone: Core
why: 자동 생성된 메타데이터
backlinks: [[M16_Neural_Sync_Master.md]]
---\n`;
    content = defaultFrontmatter + content;
  } else {
    // Has frontmatter, check for backlinks
    const endIdx = content.indexOf('---', 3);
    if (endIdx !== -1) {
      const fm = content.substring(3, endIdx);
      if (!fm.includes('backlinks:')) {
        const newFm = fm.trim() + '\nbacklinks: [[M16_Neural_Sync_Master.md]]\n';
        content = '---\n' + newFm + content.substring(endIdx);
      }
      if (!fm.includes('id:')) {
        const newFm = fm.trim() + `\nid: ${fileName.replace('.md', '')}\n`;
        content = '---\n' + newFm + content.substring(endIdx);
      }
    }
  }

  fs.writeFileSync(file, content, 'utf-8');
});

console.log(`Processed ${mdFiles.length} files.`);
