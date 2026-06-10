const fs = require('fs');
const path = require('path');
const readline = require('readline');

const transcriptPath = 'C:\\Users\\자리 공인중개사 사무소\\.gemini\\antigravity\\brain\\f109b2ff-b952-4b72-ad05-52ef5fdb2ad7\\.system_generated\\logs\\transcript.jsonl';
const artifactsDir = 'C:\\Users\\자리 공인중개사 사무소\\.gemini\\antigravity\\brain\\f109b2ff-b952-4b72-ad05-52ef5fdb2ad7\\artifacts';

async function recover() {
  const fileStream = fs.createReadStream(transcriptPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const fileContents = {};

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const step = JSON.parse(line);
      if (step.tool_calls) {
        for (const call of step.tool_calls) {
          if (call.name === 'write_to_file' || call.name === 'multi_replace_file_content') {
            let targetFile = call.args?.TargetFile;
            if (!targetFile) continue;
            
            // if it's a string that starts with quote, JSON.parse it
            if (typeof targetFile === 'string' && targetFile.startsWith('"')) {
               try { targetFile = JSON.parse(targetFile); } catch(e){}
            }

            // We only want to recover if we have the full content from write_to_file.
            // multi_replace_file_content only has chunks, so we'll skip it unless it's easy. But write_to_file has full CodeContent.
            if (call.name === 'write_to_file') {
                let codeContent = call.args?.CodeContent;
                if (!codeContent) continue;
                if (typeof codeContent === 'string' && codeContent.startsWith('"')) {
                    try { codeContent = JSON.parse(codeContent); } catch(e){}
                }

                if (targetFile.startsWith(artifactsDir) && targetFile.endsWith('.md')) {
                  if (!codeContent.includes('??????')) {
                    fileContents[targetFile] = codeContent;
                  }
                }
            }
          }
        }
      }
    } catch(e) {}
  }

  // Also include the ones modified recently if needed, but we don't want to overwrite the good ones we just made.
  // Good ones to skip: implementation_plan.md, task.md, walkthrough.md (the latest ones we manually made)
  const skipFiles = ['implementation_plan.md', 'task.md', 'walkthrough.md'];

  let restoredCount = 0;
  for (const [filePath, content] of Object.entries(fileContents)) {
    if (fs.existsSync(filePath)) {
       const fileName = path.basename(filePath);
       if (skipFiles.includes(fileName)) continue;

       const currentContent = fs.readFileSync(filePath, 'utf-8');
       // If current is corrupted (contains ??)
       if (currentContent.includes('??') || currentContent.includes('?')) {
           
           let finalContent = content;
           
           if (!finalContent.startsWith('---')) {
               finalContent = `---\nid: ${fileName.replace('.md', '')}\ntitle: ${fileName.replace('.md', '')}\nmilestone: M16\nwhy: 자동 복구된 문서\nbacklinks: [[M16_Neural_Sync_Master.md]]\n---\n` + finalContent;
           } else {
               const endIdx = finalContent.indexOf('---', 3);
               if (endIdx !== -1) {
                  const fm = finalContent.substring(3, endIdx);
                  if (!fm.includes('backlinks:')) {
                     finalContent = '---\n' + fm.trim() + '\nbacklinks: [[M16_Neural_Sync_Master.md]]\n---\n' + finalContent.substring(endIdx + 3);
                  }
               }
           }
           
           fs.writeFileSync(filePath, finalContent, 'utf-8');
           restoredCount++;
           console.log(`Restored: ${fileName}`);
       }
    }
  }
  console.log(`\nSuccessfully restored ${restoredCount} corrupted markdown files from transcript logs.`);
}

recover();
