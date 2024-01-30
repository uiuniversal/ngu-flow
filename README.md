# Angular Flow

Angular Flow is a component that allows you to create a flow diagram using Angular.
Live Demo [link](https://uiuniversal.github.io/ngu-flow/)

Stackblitz Demo [link](https://stackblitz.com/edit/ngu-flow)

## Installation

```bash
npm install @ngu/flow
```

## Usage

```ts
import { Component } from "@angular/core";
import { FlowComponent, FlowChildComponent } from "@ngu/flow";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [FlowComponent, FlowChildComponent],
  template: `
    <ngu-flow class="flow">
      @for (item of lists; track item.id; let i = $index) {
      <div [flowChild]="item" class="child">{{ i }}</div>
      }
    </ngu-flow>
  `,
  styles: `
  .flow {
    min-height: 90vh;
    background: #eee;
  }
  .child {
    border: 1px solid #ccc;
    width: 100px;
    height: 50px;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  `,
})
export class AppComponent {
  lists = [
    { id: "1", x: 0, y: 0, deps: [] },
    { id: "2", x: 0, y: 0, deps: ["1"] },
  ];
}
```
