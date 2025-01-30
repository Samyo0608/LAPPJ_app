import React, { useRef } from 'react';

const LabWeb = () => {
  const webviewRef = useRef(null);

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <webview
        ref={webviewRef}
        src="https://www.neatlab.net/"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default LabWeb;
