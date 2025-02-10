// StockChart.js
function StockChart(props) {
  // Récupérer les composants de Recharts
  const {
      BarChart, Bar, XAxis, YAxis,
      CartesianGrid, Tooltip, Legend,
      ResponsiveContainer
  } = Recharts;

  // Vérification des données
  const data = props.data || [];
  if (!Array.isArray(data) || data.length === 0) {
      return React.createElement('div', {
          className: 'flex items-center justify-center h-full'
      }, 'Aucune donnée disponible');
  }

  // Préparation des données
  const chartData = {};
  data.forEach(item => {
      const vendor = item['Nom vendeur'];
      if (!chartData[vendor]) {
          chartData[vendor] = {
              name: vendor,
              enStock: 0,
              horsStock: 0
          };
      }
      if (item.Quantite > 0) {
          chartData[vendor].enStock++;
      } else {
          chartData[vendor].horsStock++;
      }
  });

  const formattedData = Object.values(chartData);

  // Construction du graphique
  return React.createElement(ResponsiveContainer, {
      width: '100%',
      height: '100%'
  }, React.createElement(BarChart, {
      data: formattedData,
      margin: { top: 20, right: 30, left: 20, bottom: 50 }
  }, [
      React.createElement(CartesianGrid, {
          key: 'grid',
          strokeDasharray: '3 3'
      }),
      React.createElement(XAxis, {
          key: 'x',
          dataKey: 'name',
          angle: -45,
          textAnchor: 'end',
          height: 70,
          interval: 0
      }),
      React.createElement(YAxis, { key: 'y' }),
      React.createElement(Tooltip, { key: 'tooltip' }),
      React.createElement(Legend, { key: 'legend' }),
      React.createElement(Bar, {
          key: 'barInStock',
          dataKey: 'enStock',
          fill: '#16a34a',
          name: 'En Stock'
      }),
      React.createElement(Bar, {
          key: 'barOutStock',
          dataKey: 'horsStock',
          fill: '#dc2626',
          name: 'Hors Stock'
      })
  ]));
}

// Exporter le composant
window.StockChart = StockChart;