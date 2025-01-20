document.getElementById('select-folder-btn').addEventListener('click', async () => {
  const folderPath = await window.electron.selectFolder();

  if (folderPath) {
    document.getElementById('selected-folder').textContent = `Selected Folder: ${folderPath}`;
  } else {
    document.getElementById('selected-folder').textContent = 'No folder selected';
  }
});
