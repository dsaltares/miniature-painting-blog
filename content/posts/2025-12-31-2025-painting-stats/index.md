---
title: "2025 painting stats"
date: 2025-12-31
draft: false
description: "A year of painting, in numbers"
---

218 miniatures painted across 59 sessions. Not bad for the first year back in the hobby!

## Miniatures per month

{{< chart >}}
type: 'bar',
data: {
  labels: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  datasets: [{
    label: 'Miniatures painted',
    data: [12, 35, 16, 7, 0, 15, 2, 44, 26, 41, 20]
  }]
}
{{< /chart >}}

## By army

{{< chart >}}
type: 'doughnut',
data: {
  labels: ['Vampire Counts', 'High Elves', 'Gondor', 'Mordor', 'Wood Elves', 'Gladiators', 'Space Marines'],
  datasets: [{
    label: 'Miniatures painted',
    data: [89, 54, 31, 27, 12, 4, 1],
    backgroundColor: ['#8e44ad', '#6baed6', '#bdc3c7', '#922b21', '#2e8b57', '#cd853f', '#2e4bc6'],
    borderWidth: 0
  }]
}
{{< /chart >}}
