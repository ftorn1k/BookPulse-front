import {Component} from '@angular/core';
import {Header} from "../header/header";
import {RouterOutlet} from "@angular/router";

@Component({
    selector: 'app-shell',
    standalone: true,
    imports: [Header, RouterOutlet],
    templateUrl: './app-shell.html',
    styleUrl: './app-shell.scss',
})
export class AppShell {
}
