import {Component, Input} from '@angular/core';
import {Todo} from "../types";
import {MatIconModule} from "@angular/material/icon";


@Component({
    imports: [MatIconModule],
    selector: 'todo-item',
    template: `
    <div class="flex gap-4 ">
      <div class="w-12">
        {{todo.id}}
      </div>
      <div class="w-12">
        @if (todo.completed) {
          <mat-icon>check</mat-icon>
        } @else {
          <mat-icon>close</mat-icon>
        }
      </div>
      <div>
        {{todo.title}}
      </div>
    </div>
    `,
    styles: [`
    :host {
      display:block;
      padding: 32px 64px 32px 64px;
    }
  `]
})
export class TodoItemComponent {
  @Input({required: true}) todo!: Todo;
}
