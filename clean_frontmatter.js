const fs = require('fs');
const path = require('path');

const dirPath = 'C:\\Users\\자리 공인중개사 사무소\\.gemini\\antigravity\\brain\\f109b2ff-b952-4b72-ad05-52ef5fdb2ad7\\artifacts';

function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
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
let fixedCount = 0;

mdFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  
  // Find all occurrences of "---"
  const matches = [...content.matchAll(/^---$/gm)];
  if (matches.length > 2) {
    // There are more than 2 "---" blocks, which means duplicate frontmatter.
    // Let's extract the very first frontmatter block, and delete any other frontmatter lines until the actual content begins.
    const firstIdx = content.indexOf('---');
    const secondIdx = content.indexOf('---', firstIdx + 3);
    
    if (firstIdx !== -1 && secondIdx !== -1) {
        const trueFrontmatter = content.substring(firstIdx, secondIdx + 3);
        let remainder = content.substring(secondIdx + 3).trim();
        
        // If remainder starts with another "---", it's a duplicate block
        while (remainder.startsWith('---')) {
            const nextIdx = remainder.indexOf('---', 3);
            if (nextIdx !== -1) {
                remainder = remainder.substring(nextIdx + 3).trim();
            } else {
                break;
            }
        }
        
        // Also remove instances where it's something like "--- id: ... ---" on one line or weird formatting
        // Wait, the issue might be that the frontmatter doesn't have line breaks?
        // Let's just do a simple replace of multiple frontmatters
        
        fs.writeFileSync(file, trueFrontmatter + '\n\n' + remainder, 'utf-8');
        fixedCount++;
    }
  } else if (content.startsWith('---') && content.includes('---', 3)) {
      // Check if it's rendered in a single line like `--- id: ... title: ... ---` due to missing newlines
      const endIdx = content.indexOf('---', 3);
      const fm = content.substring(3, endIdx);
      if (!fm.includes('\n') && fm.includes('id:')) {
          // Missing newlines in frontmatter!
          const fixedFm = fm
            .replace(/id:/g, '\nid:')
            .replace(/title:/g, '\ntitle:')
            .replace(/milestone:/g, '\nmilestone:')
            .replace(/why:/g, '\nwhy:')
            .replace(/backlinks:/g, '\nbacklinks:')
            .replace(/date:/g, '\ndate:')
            .replace(/\n\n/g, '\n');
          fs.writeFileSync(file, '---\n' + fixedFm.trim() + '\n---\n\n' + content.substring(endIdx + 3).trim(), 'utf-8');
          fixedCount++;
      }
  }
});

console.log(`Cleaned up frontmatter in ${fixedCount} files.`);
