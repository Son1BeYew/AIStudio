// Pie Chart
new Chart(document.getElementById("pieChart"), {
  type: "doughnut",
  data: {
    labels: ["Total Order", "Customer Growth", "Total Revenue"],
    datasets: [
      {
        data: [81, 22, 62],
        backgroundColor: ["#ff6b6b", "#20c997", "#4dabf7"],
      },
    ],
  },
});

// Line Chart
new Chart(document.getElementById("lineChart"), {
  type: "line",
  data: {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    datasets: [
      {
        label: "Orders",
        data: [100, 200, 180, 300, 250, 400],
        borderColor: "#4dabf7",
        fill: true,
        tension: 0.4,
      },
    ],
  },
});

// Bar Chart
new Chart(document.getElementById("barChart"), {
  type: "bar",
  data: {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "2020",
        data: [20, 30, 40, 25, 35, 50],
        backgroundColor: "#ff6b6b",
      },
      {
        label: "2021",
        data: [25, 35, 45, 30, 40, 55],
        backgroundColor: "#4dabf7",
      },
    ],
  },
  options: { responsive: true, scales: { y: { beginAtZero: true } } },
});
