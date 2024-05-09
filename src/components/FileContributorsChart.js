import React, { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';

function FileContributorsChart({ username, repo }) {
  const [fileContributors, setFileContributors] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const commitsResponse = await fetch(`https://api.github.com/repos/${username}/${repo}/commits`);
      const commitsData = await commitsResponse.json();

      const fileCommits = {};
      for (const commit of commitsData) {
        const commitSha = commit.sha;
        const commitResponse = await fetch(`https://api.github.com/repos/${username}/${repo}/commits/${commitSha}`);
        const commitDetails = await commitResponse.json();

        for (const file of commitDetails.files) {
          const fileName = file.filename;
          const authorLogin = commit.author ? commit.author.login : 'Unknown Author';

          if (!fileCommits[fileName]) {
            fileCommits[fileName] = {};
          }

          if (!fileCommits[fileName][authorLogin]) {
            fileCommits[fileName][authorLogin] = 1;
          } else {
            fileCommits[fileName][authorLogin] += 1;
          }
        }
      }

      const filesAndContributors = Object.keys(fileCommits).map(fileName => ({
        fileName,
        contributors: Object.keys(fileCommits[fileName]).map(contributor => ({
          name: contributor,
          commits: fileCommits[fileName][contributor]
        }))
      }));

      setFileContributors(filesAndContributors);
    }

    fetchData();
  }, [username, repo]);

  // Convert the complex data structure to a format suitable for ApexCharts
  const processDataForChart = () => {
    const series = [];
    const categories = [];

    fileContributors.forEach(file => {
      file.contributors.forEach(contributor => {
        let seriesIndex = series.findIndex(s => s.name === contributor.name);
        if (seriesIndex === -1) {
          series.push({
            name: contributor.name,
            data: [],
          });
          seriesIndex = series.length - 1;
        }

        categories.push(file.fileName);
        series[seriesIndex].data.push(contributor.commits);
      });
    });

    return { series, categories };
  };

  const { series, categories } = processDataForChart();

  const chartOptions = {
    chart: {
      type: 'bar',
      height: 800, // Set a large height to accommodate all data
    },
    plotOptions: {
      bar: {
        horizontal: false,
        distributed: true,
        dataLabels: {
          position: 'top',
        },
      },
    },
    dataLabels: {
      enabled: true,
    },
    xaxis: {
      categories: categories,
    },
    yaxis: {
      min: 0,
      tickAmount: 5, // Adjust based on your data
    },
    legend: {
      show: true,
    },
  };

  return (
    <div className="container mt-3">
      <div className="card mb-3">
        <div className="card-header">
          <h2 className="h6 card-title">Files and Their Contributors</h2>
        </div>
        <div className="card-body">
          <ReactApexChart options={chartOptions} series={series} type="bar" height={800} />
        </div>
        <div className="card-footer text-muted">
          Data fetched from{' '}
          <a href={`https://github.com/${username}/${repo}`} target="_blank" rel="noopener noreferrer">
            GitHub API
          </a>
        </div>
      </div>
    </div>
  );
}

export default FileContributorsChart;
