---
title: "2025 painting stats"
date: 2025-12-31
draft: false
description: "A year of painting, in numbers"
---

218 miniatures painted across 59 sessions — not bad for the first year back in the hobby.

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
  labels: ['Vampiric Undead', 'High Elves', 'Gondor', 'Mordor', 'Wood Elves', 'Gladiators', 'Space Marines'],
  datasets: [{
    label: 'Miniatures painted',
    data: [89, 54, 31, 27, 12, 4, 1]
  }]
}
{{< /chart >}}

## Biggest units

{{< chart >}}
type: 'bar',
data: {
  labels: ['Zombies', 'Orcs of Morannon', 'High Elf Spearmen', 'Warriors of Gondor', 'Rangers of Gondor', 'High Elf Archers', 'Zombie Wolves', 'Skeleton Guard', 'Skeleton Knights', 'Werewolves'],
  datasets: [{
    label: 'Miniatures painted',
    data: [40, 24, 20, 12, 12, 10, 10, 10, 10, 6]
  }]
},
options: {
  indexAxis: 'y'
}
{{< /chart >}}
