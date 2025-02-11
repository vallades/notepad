import { useState, useEffect, useRef } from 'react';
import { Box, AppBar, Toolbar, Typography, Tab, Tabs, Menu, MenuItem, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import MonacoEditor from 'react-monaco-editor';
const { ipcRenderer } = window.require('electron');

function App() {
  const [tabs, setTabs] = useState([{ id: 1, name: 'Untitled', content: '' }]);
  const [activeTab, setActiveTab] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuType, setMenuType] = useState(null);
  const [splitView, setSplitView] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [markdownPreview, setMarkdownPreview] = useState(false);
  const editorRef = useRef(null);

  const handleMenuClick = (event, type) => {
    setAnchorEl(event.currentTarget);
    setMenuType(type);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuType(null);
  };

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  const handleEditorChange = (value) => {
    const updatedTabs = tabs.map((tab, index) => {
      if (index === activeTab) {
        return { ...tab, content: value };
      }
      return tab;
    });
    setTabs(updatedTabs);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleFind = () => {
    if (editorRef.current) {
      const editor = editorRef.current;
      editor.getAction('actions.find').run();
    }
  };

  const handleReplace = () => {
    if (editorRef.current) {
      const editor = editorRef.current;
      editor.getAction('editor.action.startFindReplaceAction').run();
    }
  };

  const handleUndo = () => {
    if (editorRef.current) {
      editorRef.current.trigger('keyboard', 'undo', null);
    }
  };

  const handleRedo = () => {
    if (editorRef.current) {
      editorRef.current.trigger('keyboard', 'redo', null);
    }
  };

  const getFileLanguage = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    const languageMap = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'md': 'markdown',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'go': 'go',
      'rs': 'rust',
      'php': 'php',
      'rb': 'ruby',
      'sql': 'sql',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml'
    };
    return languageMap[extension] || 'plaintext';
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: '#1a1a1a' }}>
      <AppBar position="static" sx={{ bgcolor: '#2d2d2d' }}>
        <Toolbar variant="dense" sx={{ minHeight: '32px' }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Typography
              onClick={(e) => handleMenuClick(e, 'file')}
              sx={{
                color: '#fff',
                fontSize: '14px',
                cursor: 'pointer',
                '&:hover': { color: '#61dafb' }
              }}
            >
              File
            </Typography>
            <Typography
              onClick={(e) => handleMenuClick(e, 'edit')}
              sx={{
                color: '#fff',
                fontSize: '14px',
                cursor: 'pointer',
                '&:hover': { color: '#61dafb' }
              }}
            >
              Edit
            </Typography>
            <Typography
              onClick={(e) => handleMenuClick(e, 'view')}
              sx={{
                color: '#fff',
                fontSize: '14px',
                cursor: 'pointer',
                '&:hover': { color: '#61dafb' }
              }}
            >
              View
            </Typography>
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl) && menuType === 'file'}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={async () => {
              handleMenuClose();
              try {
                const result = await ipcRenderer.invoke('open-file');
                if (result) {
                  const { fileName, content, filePath } = result;
                  const newTab = {
                    id: Date.now(),
                    name: fileName,
                    content,
                    filePath,
                    language: getFileLanguage(fileName)
                  };
                  setTabs([...tabs, newTab]);
                  setActiveTab(tabs.length);
                }
              } catch (error) {
                console.error('Error opening file:', error);
              }
            }}>Open</MenuItem>
            <MenuItem onClick={async () => {
              handleMenuClose();
              try {
                const currentTab = tabs[activeTab];
                if (!currentTab.filePath) {
                  const { dialog } = window.require('@electron/remote');
                  const { filePath } = await dialog.showSaveDialog({
                    filters: [
                      { name: 'Text Files', extensions: ['txt', 'md', 'json', 'xml', 'csv'] },
                      { name: 'All Files', extensions: ['*'] }
                    ]
                  });
                  if (filePath) {
                    await ipcRenderer.invoke('save-file', { filePath, content: currentTab.content });
                    const fileName = filePath.split('/').pop();
                    const updatedTabs = tabs.map((tab, index) => {
                      if (index === activeTab) {
                        return { ...tab, name: fileName, filePath, language: getFileLanguage(fileName) };
                      }
                      return tab;
                    });
                    setTabs(updatedTabs);
                  }
                } else {
                  await ipcRenderer.invoke('save-file', { filePath: currentTab.filePath, content: currentTab.content });
                }
              } catch (error) {
                console.error('Error saving file:', error);
              }
            }}>Save</MenuItem>
            <MenuItem onClick={async () => {
              handleMenuClose();
              try {
                const { dialog } = window.require('@electron/remote');
                const { filePath } = await dialog.showSaveDialog({
                  filters: [
                    { name: 'Text Files', extensions: ['txt', 'md', 'json', 'xml', 'csv'] },
                    { name: 'All Files', extensions: ['*'] }
                  ]
                });
                if (filePath) {
                  await ipcRenderer.invoke('save-file', { filePath, content: tabs[activeTab].content });
                  const fileName = filePath.split('/').pop();
                  const updatedTabs = tabs.map((tab, index) => {
                    if (index === activeTab) {
                      return { ...tab, name: fileName, filePath, language: getFileLanguage(fileName) };
                    }
                    return tab;
                  });
                  setTabs(updatedTabs);
                }
              } catch (error) {
                console.error('Error saving file:', error);
              }
            }}>Save As...</MenuItem>
            <MenuItem onClick={() => {
              handleMenuClose();
              window.close();
            }}>Exit</MenuItem>
          </Menu>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl) && menuType === 'edit'}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => { handleMenuClose(); handleUndo(); }}>Undo</MenuItem>
            <MenuItem onClick={() => { handleMenuClose(); handleRedo(); }}>Redo</MenuItem>
            <MenuItem onClick={() => { handleMenuClose(); handleFind(); }}>Find</MenuItem>
            <MenuItem onClick={() => { handleMenuClose(); handleReplace(); }}>Replace</MenuItem>
          </Menu>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl) && menuType === 'view'}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => {
              handleMenuClose();
              setTabs([...tabs, { id: Date.now(), name: 'Untitled', content: '' }]);
            }}>New Tab</MenuItem>
            <MenuItem onClick={() => {
              handleMenuClose();
              setSplitView(!splitView);
            }}>Split View</MenuItem>
            <MenuItem onClick={() => {
              handleMenuClose();
              setCompareMode(!compareMode);
            }}>Compare Files</MenuItem>
            <MenuItem onClick={() => {
              handleMenuClose();
              setMarkdownPreview(!markdownPreview);
            }}>Markdown Preview</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      
      <Box sx={{ bgcolor: '#2d2d2d', borderBottom: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          sx={{
            minHeight: '32px',
            '& .MuiTab-root': {
              minHeight: '32px',
              padding: '4px 8px',
              textTransform: 'none',
              fontSize: '0.875rem',
              color: 'rgba(255,255,255,0.7)',
              '&.Mui-selected': {
                color: '#61dafb',
                bgcolor: 'rgba(97, 218, 251, 0.1)'
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#61dafb'
            }
          }}
        >
          {tabs.map((tab, index) => (
            <div
              key={tab.id}
              role="tab"
              aria-selected={activeTab === index ? "true" : "false"}
              tabIndex={activeTab === index ? 0 : -1}
              aria-controls={`panel-${tab.id}`}
              id={`tab-${tab.id}`}
              onClick={(e) => handleTabChange(e, index)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleTabChange(e, index);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: activeTab === index ? '#2d2d2d' : 'transparent',
                color: activeTab === index ? '#61dafb' : 'rgba(255,255,255,0.7)',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                minHeight: '32px',
                fontSize: '0.875rem'
              }}
            >
              {tab.name}
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  const newTabs = tabs.filter((_, i) => i !== index);
                  setTabs(newTabs);
                  if (activeTab >= index && activeTab > 0) setActiveTab(activeTab - 1);
                }}
                sx={{ 
                  opacity: 0.7,
                  padding: '2px',
                  color: 'inherit',
                  '&:hover': { 
                    opacity: 1,
                    bgcolor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                <CloseIcon sx={{ fontSize: '16px' }} />
              </IconButton>
            </div>
          ))}
        </Tabs>
      </Box>

      <Box sx={{ 
        flexGrow: 1, 
        overflow: 'hidden', 
        bgcolor: '#1e1e1e',
        display: 'flex', 
        flexDirection: 'column', 
        width: '100%', 
        height: 'calc(100% - 48px - 48px)'
      }}>
        <Box sx={{ 
          flexGrow: 1, 
          width: '100%', 
          height: '100%',
          display: 'flex',
          flexDirection: splitView || compareMode ? 'row' : 'column'
        }}>
          <Box sx={{ flex: 1, height: '100%' }}>
            <MonacoEditor
              width="100%"
              height="100%"
              language={tabs[activeTab].language || 'plaintext'}
              theme="vs-dark"
              value={tabs[activeTab].content}
              onChange={handleEditorChange}
              editorDidMount={handleEditorDidMount}
              options={{
                minimap: { enabled: true },
                fontSize: 14,
                fontFamily: '"Fira Code", "JetBrains Mono", monospace',
                fontLigatures: true,
                wordWrap: 'on',
                automaticLayout: true,
                padding: { top: 15, bottom: 15 },
                lineHeight: 1.6,
                renderLineHighlight: 'all',
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: true,
                find: {
                  addExtraSpaceOnTop: false,
                  autoFindInSelection: 'never',
                  seedSearchStringFromSelection: 'always'
                },
                lineNumbers: 'on',
                folding: true,
                foldingStrategy: 'indentation',
                showFoldingControls: 'always',
                renderIndentGuides: true,
                suggestOnTriggerCharacters: true,
                quickSuggestions: true,
                suggest: {
                  snippetsPreventQuickSuggestions: false
                },
                wordBasedSuggestions: true,
                parameterHints: {
                  enabled: true
                },
                formatOnType: true,
                formatOnPaste: true
              }}
            />
          </Box>
          {(splitView || compareMode) && (
            <Box sx={{ flex: 1, height: '100%', borderLeft: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
              <MonacoEditor
                width="100%"
                height="100%"
                language={compareMode ? tabs[activeTab].language : (tabs[activeTab + 1]?.language || 'plaintext')}
                theme="vs-dark"
                value={compareMode ? tabs[activeTab].content : (tabs[activeTab + 1]?.content || '')}
                onChange={compareMode ? undefined : handleEditorChange}
                options={{
                  readOnly: compareMode,
                  minimap: { enabled: true },
                  fontSize: 14,
                  fontFamily: '"Fira Code", "JetBrains Mono", monospace',
                  fontLigatures: true,
                  wordWrap: 'on',
                  automaticLayout: true
                }}
              />
            </Box>
          )}
          {markdownPreview && tabs[activeTab].language === 'markdown' && (
            <Box sx={{ 
              flex: 1, 
              height: '100%', 
              borderLeft: 1, 
              borderColor: 'rgba(255,255,255,0.1)',
              overflow: 'auto',
              p: 2,
              color: '#fff',
              '& img': { maxWidth: '100%' }
            }}>
              <ReactMarkdown>{tabs[activeTab].content}</ReactMarkdown>
            </Box>
          )}
        </Box>
        <Box sx={{
          borderTop: 1,
          borderColor: 'rgba(255,255,255,0.1)',
          bgcolor: '#2d2d2d',
          py: 0.75,
          px: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: 'rgba(255,255,255,0.5)',
          fontFamily: '"Inter", sans-serif'
        }}>
          <div>{tabs[activeTab].language || 'Plain Text'}</div>
          <div>
            Lines: {tabs[activeTab].content.split('\n').length} | 
            Characters: {tabs[activeTab].content.length} | 
            Words: {tabs[activeTab].content.trim() ? tabs[activeTab].content.trim().split(/\s+/).length : 0}
          </div>
        </Box>
      </Box>
    </Box>
  )
}

export default App
