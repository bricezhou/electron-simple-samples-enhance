const os = require('os')
const fs = require('fs')
const { remote, clipboard, nativeImage } = require('electron')
const { dialog} = remote
var chart = null;
var memoryChart = null
var lastMeasureTimes = [];

function setLastMeasureTimes(cpus) {
  for (let i = 0; i < cpus.length; i++) {
    lastMeasureTimes[i] = getCpuTimes(cpus[i]);
  }
}

function getDatasets() {
  const datasets = []
  const cpus = os.cpus()

  for (let i = 0; i < cpus.length; i++) {
    const cpu = cpus[i]
    const cpuData = {
      data: getCpuTimes(cpu),
      backgroundColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)'
      ]
    }
    datasets.push(cpuData)
  }
  testCpus = os.cpus();
  return datasets;
}

function updateDatasets() {
  const cpus = os.cpus()
  for (let i = 0; i < cpus.length; i++) {
    const cpu = cpus[i]
    chart.data.datasets[i].data = getCpuTimes(cpu);
    chart.data.datasets[i].data[0] -= lastMeasureTimes[i][0];
    chart.data.datasets[i].data[1] -= lastMeasureTimes[i][1];
    chart.data.datasets[i].data[2] -= lastMeasureTimes[i][2];
  }
  chart.update();
  setLastMeasureTimes(cpus);
}

function getCpuTimes(cpu) {
  return [
    cpu.times.user,
    cpu.times.sys,
    cpu.times.idle,
  ];
}

function drawChart() {
  chart = new Chart($('.chart'), {
    type: 'doughnut',
    data: {
      labels: [
        'User Time (ms)',
        'System Time (ms)',
        'Idle Time (ms)'
      ],
      datasets: getDatasets()
    },
    options: {
      maintainAspectRatio: false,
      title: {
        display: true,
        text: 'CPU Activity',
        fontColor: 'rgb(250, 250, 250)',
        fontSize: 16
      },
      legend: {
        display: true,
        labels: {
          fontColor: 'rgb(250, 250, 250)',
          fontSize: 12
        }
      }
    }
  });

  setInterval(updateDatasets, 1000);
}

function drawMemoryChart() {
  memoryChart = new Chart($('.memory-chart'), {
    type: 'doughnut',
    data: {
      labels: [
        'Free Memory (MB)',
        'Used Memory (MB)',
      ],
      datasets: getMemoryDatasets()
    },
    options: {
      maintainAspectRatio: false,
      title: {
        display: true,
        text: 'Memory Activity',
        fontColor: 'rgb(250, 250, 250)',
        fontSize: 16
      },
      legend: {
        display: true,
        labels: {
          fontColor: 'rgb(250, 250, 250)',
          fontSize: 12
        }
      }
    }
  });

  setInterval(updateMemoryDatasets, 1000);
}

  function getMemoryDatasets() {
    const datasets = []
    const memoryUsage = process.getSystemMemoryInfo();
    const memoryDate = {
      data: getMemoryUsage(),
      backgroundColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
      ]
    }
    datasets.push(memoryDate)
    return datasets
  }
  function getMemoryUsage() {
    const memoryUsage = process.getSystemMemoryInfo()
    const freeMB = (memoryUsage.free/1024).toFixed(2)
    const usedMB = ((memoryUsage.total - memoryUsage.free)/1024).toFixed(2)
    return [freeMB, usedMB]
  }
  function updateMemoryDatasets() {
    memoryChart.data.datasets[0].data = getMemoryUsage()
    memoryChart.update();
  }

$(() => {
  setLastMeasureTimes(os.cpus());
  drawMemoryChart()
  drawChart();
  $('#saveNative').click((e)=> {
      dialog.showSaveDialog(
        remote.getCurrentWindow(), 
        {
        title: 'Save Image',
        buttonLabel: 'Save',
        showsTagField: true
      }, (fileName) => {
        $('.chart').get(0).toBlob(blob => {
            const fileReader = new FileReader()
            fileReader.onloadend = ()=> {
                fs.writeFile(fileName, new Uint8Array(fileReader.result), (err) => {
                    if (err) {
                        console.log('Save image error' + err.message)
                    }
                    console.log('Save file successfully!')
                })
            }
            fileReader.readAsArrayBuffer(blob)
        });
      })
  })
  $('#copyImage').click((e) => {
        const dateUrl = $('.chart').get(0).toDataURL('image/png')
        const img = nativeImage.createFromDataURL(dateUrl)
        clipboard.writeImage(img, 'PNG')
  })
})


function download1(){
  var download = document.getElementById("download_link");
  var image = $('.chart').get(0).toDataURL('image/png').replace("image/png", "image/octet-stream");
  download.setAttribute("href", image);
}
function downloadCSV () {
  const cpus = os.cpus()
  let csvData = 'data:application/csv;charset=utf-8,CPU Number,User Time (ms),System Time (ms),Idle Time (ms)\r\n'
  cpus.forEach((cpu, index) => {
      const cpuData = getCpuTimes(cpu)
      const row = ++index + ',' + cpuData.join(',') + '\r\n'
      csvData += row
  })
  var download = document.getElementById("download_csv");
  download.setAttribute("href", encodeURIComponent(csvData));
}