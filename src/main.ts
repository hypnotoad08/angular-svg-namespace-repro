import { AfterViewInit, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, RouterOutlet, Routes } from '@angular/router';

const HTML_NS = 'http://www.w3.org/1999/xhtml';
const SVG_NS = 'http://www.w3.org/2000/svg';

@Component({
  selector: 'app-child',
  template: `<div class="box">routed content</div>`,
  styles: [`.box { width: 100%; background: #cfc; padding: 24px; }`],
})
export class Child {}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `
    <!-- A closed <svg>, only a PRECEDING SIBLING of the outlet.
         Remove it, or move it below the @if, and the bug disappears. -->
    <svg width="1" height="1"><path d="M0 0" /></svg>

    @if (show) {
      <router-outlet></router-outlet>
    }

    <pre id="result">measuring...</pre>
  `,
})
export class App implements AfterViewInit {
  protected show = true;

  ngAfterViewInit(): void {
    setTimeout(() => {
      const outlet = document.querySelector('router-outlet');
      const host = document.querySelector('app-child');
      const r = host?.getBoundingClientRect();
      const ns = (n: Element | null | undefined) =>
        n?.namespaceURI === SVG_NS ? 'SVG' : n?.namespaceURI === HTML_NS ? 'HTML' : String(n?.namespaceURI);

      document.getElementById('result')!.textContent = [
        `Angular            : ${(window as any).ng?.version?.full ?? '(see package.json)'}`,
        `<router-outlet> ns : ${ns(outlet)}`,
        `<app-child> host ns: ${ns(host)}`,
        `<app-child> size   : ${Math.round(r?.width ?? 0)}x${Math.round(r?.height ?? 0)}`,
        '',
        host?.namespaceURI === SVG_NS
          ? 'BUG: routed host created in the SVG namespace -> no CSS box -> blank'
          : 'OK: routed host created in the HTML namespace',
      ].join('\n');
    });
  }
}

const routes: Routes = [{ path: '**', component: Child }];

bootstrapApplication(App, { providers: [provideRouter(routes)] }).catch((e) => console.error(e));
