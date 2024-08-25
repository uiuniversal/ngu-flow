import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  imports: [FormsModule],
  selector: 'app-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ``,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
        padding: 0.75rem;
      }
    `,
  ],
})
export class EditorComponent implements OnDestroy {
  value = '<p>Hello, Tiptap!</p>';

  ngOnDestroy(): void {}
}
