import { Component, OnInit } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-container',
  template: `<div></div>`,
  styles: [
    `
      div {
        display: flex;
        width: 150px;
        height: 300px;
        box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.3);
        border-radius: 5px;
      }
    `,
  ],
})
export class ContainerComponent implements OnInit {
  constructor() {}

  ngOnInit() {}
}
