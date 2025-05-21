import { ChartData } from './chart';

export function renderHTML(charts: ChartData[]): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Stock Options Charts</title>
  <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .chart-container { margin-bottom: 40px; }
    .chart-plot { width: 100%; min-height: 400px; }
  </style>
</head>
<body>
  <h1>Stock Options Scatter Charts</h1>
  ${charts.map(chart => `
    <div class="chart-container">
      <h2>${chart.ticker}</h2>
      <div id="chart-${chart.ticker}" class="chart-plot"></div>
      <script>
        Plotly.newPlot(
          'chart-${chart.ticker}',
          ${JSON.stringify(chart.plotData)},
          Object.assign(${JSON.stringify(chart.layout)}, {autosize: true, width: null}),
          {responsive: true}
        );
        window.addEventListener('resize', () => {
          Plotly.Plots.resize(document.getElementById('chart-${chart.ticker}'));
        });
      </script>
    </div>
  `).join('')}
</body>
</html>
  `;
}