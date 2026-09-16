export function createLineChart(data: { labels: string[]; datasets: { name: string; values: number[]; color: string }[] }, height: number = 250): string {
  const padding = { top: 30, right: 30, bottom: 40, left: 60 };
  const chartWidth = 600;
  const chartHeight = height;
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  let allValues: number[] = [];
  data.datasets.forEach((ds) => allValues = allValues.concat(ds.values));
  const minVal = Math.min(...allValues) * 0.9;
  const maxVal = Math.max(...allValues) * 1.1;
  const valueRange = maxVal - minVal || 1;

  let gridSvg = '';
  for (let i = 0; i <= 5; i++) {
    const y = padding.top + (plotHeight / 5) * i;
    const value = Math.round(maxVal - (valueRange / 5) * i);
    gridSvg += `
      <line x1="${padding.left}" y1="${y}" x2="${chartWidth - padding.right}" y2="${y}" stroke="#e9ecef" stroke-width="1"/>
      <text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" fill="#6c757d" font-size="10">₨ ${(value / 1000).toFixed(0)}K</text>
    `;
  }

  const labelSpacing = plotWidth / (data.labels.length - 1);
  let labelsSvg = '';
  data.labels.forEach((label, i) => {
    const x = padding.left + labelSpacing * i;
    labelsSvg += `<text x="${x}" y="${chartHeight - 10}" text-anchor="middle" fill="#6c757d" font-size="10">${label}</text>`;
  });

  let linesSvg = '';
  data.datasets.forEach((ds) => {
    let pathD = '';
    let areaD = '';

    ds.values.forEach((val, i) => {
      const x = padding.left + labelSpacing * i;
      const y = padding.top + plotHeight - ((val - minVal) / valueRange) * plotHeight;
      
      if (i === 0) {
        pathD += `M ${x} ${y}`;
        areaD += `M ${x} ${padding.top + plotHeight} L ${x} ${y}`;
      } else {
        pathD += ` L ${x} ${y}`;
        areaD += ` L ${x} ${y}`;
      }
    });

    const lastX = padding.left + labelSpacing * (ds.values.length - 1);
    areaD += ` L ${lastX} ${padding.top + plotHeight} Z`;

    linesSvg += `
      <defs>
        <linearGradient id="areaGrad${ds.color.replace('#', '')}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:${ds.color};stop-opacity:0.3"/>
          <stop offset="100%" style="stop-color:${ds.color};stop-opacity:0.05"/>
        </linearGradient>
      </defs>
      <path d="${areaD}" fill="url(#areaGrad${ds.color.replace('#', '')})"/>
      <path d="${pathD}" fill="none" stroke="${ds.color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    `;

    ds.values.forEach((val, i) => {
      const x = padding.left + labelSpacing * i;
      const y = padding.top + plotHeight - ((val - minVal) / valueRange) * plotHeight;
      linesSvg += `<circle cx="${x}" cy="${y}" r="4" fill="white" stroke="${ds.color}" stroke-width="2"/>`;
    });
  });

  let legendSvg = '';
  data.datasets.forEach((ds, i) => {
    const x = padding.left + i * 120;
    legendSvg += `
      <rect x="${x}" y="8" width="12" height="12" rx="2" fill="${ds.color}"/>
      <text x="${x + 18}" y="18" fill="#495057" font-size="11">${ds.name}</text>
    `;
  });

  return `
    <svg viewBox="0 0 ${chartWidth} ${chartHeight}" class="w-100" style="max-height: ${height}px;">
      ${gridSvg}
      ${labelsSvg}
      ${linesSvg}
      ${legendSvg}
    </svg>
  `;
}

export function createBarChart(data: { labels: string[]; values: number[]; colors: string[] }, height: number = 250): string {
  const padding = { top: 30, right: 20, bottom: 40, left: 60 };
  const chartWidth = 600;
  const chartHeight = height;
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  const maxVal = Math.max(...data.values) * 1.1;
  const barWidth = (plotWidth / data.labels.length) * 0.6;
  const barGap = (plotWidth / data.labels.length) * 0.4;

  let gridSvg = '';
  for (let i = 0; i <= 5; i++) {
    const y = padding.top + (plotHeight / 5) * i;
    const value = Math.round(maxVal - (maxVal / 5) * i);
    gridSvg += `
      <line x1="${padding.left}" y1="${y}" x2="${chartWidth - padding.right}" y2="${y}" stroke="#e9ecef" stroke-width="1"/>
      <text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" fill="#6c757d" font-size="10">₨ ${(value / 1000).toFixed(0)}K</text>
    `;
  }

  let barsSvg = '';
  data.labels.forEach((label, i) => {
    const x = padding.left + (plotWidth / data.labels.length) * i + barGap / 2;
    const barHeight = (data.values[i] / maxVal) * plotHeight;
    const y = padding.top + plotHeight - barHeight;

    barsSvg += `
      <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${data.colors[i]}" rx="4"/>
      <text x="${x + barWidth / 2}" y="${chartHeight - 10}" text-anchor="middle" fill="#6c757d" font-size="10">${label}</text>
      <text x="${x + barWidth / 2}" y="${y - 5}" text-anchor="middle" fill="#495057" font-size="9" font-weight="600">₨ ${(data.values[i] / 1000).toFixed(1)}K</text>
    `;
  });

  return `
    <svg viewBox="0 0 ${chartWidth} ${chartHeight}" class="w-100" style="max-height: ${height}px;">
      ${gridSvg}
      ${barsSvg}
    </svg>
  `;
}

export function createDonutChart(data: { labels: string[]; values: number[]; colors: string[] }, height: number = 200): string {
  const size = 200;
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = 70;
  const innerRadius = 45;

  const total = data.values.reduce((a, b) => a + b, 0);
  let currentAngle = -90;

  let arcsSvg = '';
  data.values.forEach((val, i) => {
    const angle = (val / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

    const ix1 = centerX + innerRadius * Math.cos(startRad);
    const iy1 = centerY + innerRadius * Math.sin(startRad);
    const ix2 = centerX + innerRadius * Math.cos(endRad);
    const iy2 = centerY + innerRadius * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;

    arcsSvg += `
      <path d="M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1} Z" 
            fill="${data.colors[i]}" opacity="0.85"/>
    `;

    currentAngle = endAngle;
  });

  arcsSvg += `
    <text x="${centerX}" y="${centerY - 5}" text-anchor="middle" fill="#495057" font-size="14" font-weight="700">₨ ${(total / 100000).toFixed(1)}L</text>
    <text x="${centerX}" y="${centerY + 12}" text-anchor="middle" fill="#6c757d" font-size="10">Total</text>
  `;

  let legendSvg = '';
  data.labels.forEach((label, i) => {
    const y = 20 + i * 20;
    legendSvg += `
      <rect x="${size + 20}" y="${y}" width="12" height="12" rx="2" fill="${data.colors[i]}"/>
      <text x="${size + 38}" y="${y + 10}" fill="#495057" font-size="11">${label}</text>
    `;
  });

  return `
    <div class="d-flex align-items-center justify-content-center">
      <svg viewBox="0 0 ${size + 150} ${size}" style="max-height: ${height}px;">
        ${arcsSvg}
        ${legendSvg}
      </svg>
    </div>
  `;
}

export function createHorizontalBarChart(data: { labels: string[]; values: number[]; colors: string[] }, height: number = 200): string {
  const padding = { top: 20, right: 80, bottom: 20, left: 120 };
  const chartWidth = 500;
  const chartHeight = height;
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  const maxVal = Math.max(...data.values) * 1.1;
  const barHeight = (plotHeight / data.labels.length) * 0.7;
  const barGap = (plotHeight / data.labels.length) * 0.3;

  let barsSvg = '';
  data.labels.forEach((label, i) => {
    const y = padding.top + (plotHeight / data.labels.length) * i + barGap / 2;
    const barWidth = (data.values[i] / maxVal) * plotWidth;

    barsSvg += `
      <text x="${padding.left - 10}" y="${y + barHeight / 2 + 4}" text-anchor="end" fill="#495057" font-size="10">${label}</text>
      <rect x="${padding.left}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${data.colors[i]}" rx="4"/>
      <text x="${padding.left + barWidth + 8}" y="${y + barHeight / 2 + 4}" fill="#495057" font-size="10" font-weight="600">₨ ${(data.values[i] / 1000).toFixed(0)}K</text>
    `;
  });

  return `
    <svg viewBox="0 0 ${chartWidth} ${chartHeight}" class="w-100" style="max-height: ${height}px;">
      ${barsSvg}
    </svg>
  `;
}

export function createSparkline(values: number[], color: string, width: number = 100, height: number = 30): string {
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);
  const range = maxVal - minVal || 1;
  
  const points = values.map((val, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((val - minVal) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return `
    <svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <defs>
        <linearGradient id="sparkGrad${color.replace('#', '')}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:${color};stop-opacity:0.3"/>
          <stop offset="100%" style="stop-color:${color};stop-opacity:0.05"/>
        </linearGradient>
      </defs>
      <polygon points="${areaPoints}" fill="url(#sparkGrad${color.replace('#', '')})"/>
      <polyline points="${points}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
}
