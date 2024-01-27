import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { NgxTiptapModule } from 'ngx-tiptap';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  imports: [FormsModule, NgxTiptapModule],
  selector: 'app-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tiptap-editor
    [editor]="editor"
    [(ngModel)]="value"
  ></tiptap-editor> `,
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
  editor = new Editor({
    extensions: [StarterKit],
  });

  value = '<p>Hello, Tiptap!</p>';

  ngOnDestroy(): void {
    this.editor.destroy();
  }
}
