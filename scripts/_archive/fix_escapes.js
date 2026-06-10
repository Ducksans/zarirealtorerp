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
  // If the file contains literal '\n', we unescape it.
  if (content.includes('\\n')) {
    // Replace literal '\n' with actual newline
    content = content.replace(/\\n/g, '\n');
    // Replace literal '\"' with actual quote
    content = content.replace(/\\"/g, '"');
    // Replace literal '\t' with actual tab
    content = content.replace(/\\t/g, '\t');
    
    fs.writeFileSync(file, content, 'utf-8');
    fixedCount++;
  }
});

console.log(`Fixed literal escape sequences in ${fixedCount} files.`);
