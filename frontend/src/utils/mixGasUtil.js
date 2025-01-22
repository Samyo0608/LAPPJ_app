export const parseGasMixture = (inputString) => {
  try {
    const cleanString = inputString.replace(/\s/g, '');
    const gasEntries = cleanString.split(',');
    const gasObject = {};
    
    // 檢查是否有輸入
    if (!cleanString) {
      throw new Error('請輸入氣體成分');
    }

    // 檢查格式
    const validFormat = /^([A-Za-z0-9-]+:\d+\.?\d*,?)+$/;
    if (!validFormat.test(cleanString)) {
      throw new Error('格式錯誤，請使用 "氣體:百分比" 的格式，以逗號分隔');
    }

    gasEntries.forEach(entry => {
      const [gas, percentage] = entry.split(':');
      const value = parseFloat(percentage);
      
      // 檢查百分比是否為有效數字
      if (isNaN(value)) {
        throw new Error(`無效的百分比數值: ${percentage}`);
      }
      
      // 檢查百分比是否在有效範圍
      if (value < 0 || value > 100) {
        throw new Error('百分比必須在 0-100 之間');
      }

      gasObject[gas.trim()] = value;
    });

    const total = Object.values(gasObject).reduce((sum, val) => sum + val, 0);
    if (Math.abs(total - 100) > 0.01) {
      throw new Error(`氣體百分比總和為 ${total}%，必須為 100%`);
    }

    return gasObject;
  } catch (error) {
    throw new Error('氣體格式錯誤: ' + error.message);
  }
};