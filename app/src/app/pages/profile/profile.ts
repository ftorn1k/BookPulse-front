import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, MeUser } from '../../core/auth/auth.service';

import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { Chart, registerables } from 'chart.js';
import { GenreStat, MonthStat } from '../../core/types';
import { ApiService } from '../../core/api';
import { firstValueFrom } from 'rxjs';
Chart.register(...registerables);

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit {
  private router = inject(Router);
  private auth = inject(AuthService);

  user = signal<MeUser | null>(null);

  name = signal('');
  email = signal('');
  password = signal('');

  saving = signal(false);
  saveError = signal('');
  saveOk = signal(false);

  genreStats = signal<GenreStat[]>([]);
  monthStats = signal<MonthStat[]>([]);

  pieData = signal<ChartConfiguration<'pie'>['data']>({
    labels: [],
    datasets: [{ data: [] }],
  });

  barData = signal<ChartConfiguration<'bar'>['data']>({
    labels: [],
    datasets: [{ data: [] }],
  });

  pieOptions: ChartConfiguration<'pie'>['options'] = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        boxWidth: 10,
        padding: 1,
        font: { size: 12 },

        generateLabels: (chart) => {
          const data = chart.data;
          if (!data.labels) return [];

          const labels = data.labels as string[];
          const ds = data.datasets[0];

          return labels.map((text, i) => {
            const value = (ds.data as any[])[i];

            const max = 22;
            const t = String(text);
            const parts = t.length > max
              ? [t.slice(0, max) + '…', t.slice(max)]
              : [t];

            return {
              text: parts as any, 
              fillStyle: (ds as any).backgroundColor?.[i],
              strokeStyle: (ds as any).borderColor?.[i],
              lineWidth: (ds as any).borderWidth,
              hidden: !chart.getDataVisibility(i),
              index: i,
            } as any;
          });
        },
      },
    },
    tooltip: {
      callbacks: {
        label: (ctx: any) => `${ctx.label}: ${ctx.parsed}`,
      },
    },
  },
};

  barOptions: ChartConfiguration<'bar'>['options'] = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        title: (items: any) => `Месяц: ${items?.[0]?.label ?? ''}`,
        label: (ctx: any) => `Добавлено: ${ctx.parsed.y}`,
      },
    },
  },
  scales: {
    y: { beginAtZero: true, ticks: { precision: 0 } },
    x: { ticks: { maxRotation: 0, minRotation: 0 } },
  },
};

  constructor(private api: ApiService){}
  async ngOnInit() {
    await this.loadMe();
    await this.loadStats();
  }

  private async loadMe() {
    const res = await firstValueFrom(this.auth.loadMe())
    if(!res){
      this.router.navigateByUrl('/auth');
    }
    this.user.set(res);
    this.name.set(res?.name ?? '');
    this.email.set(res?.email ?? '');
  }

  private async loadStats() {
    const res = await firstValueFrom(this.api.stats)
    this.genreStats.set([]);
    this.monthStats.set([]);
    this.pieData.set({ labels: [], datasets: [{ data: [] }] });
    this.barData.set({ labels: [], datasets: [{ data: [] }] });
    if(res){
       const genres = res.genres ?? [];
        const months = res.months ?? [];

        this.genreStats.set(genres);
        this.monthStats.set(months);

        this.pieData.set({
          labels: genres.map(x => x.genre),
          datasets: [{ data: genres.map(x => x.cnt) }],
        });

        this.barData.set({
          labels: months.map(x => x.month),
          datasets: [{ data: months.map(x => x.cnt) }],
        });
    }
  }

  save() {

    this.saveError.set('');
    this.saveOk.set(false);

    const name = this.name().trim();
    const pass = this.password().trim();

    if (name) {
        this.saving.set(true);
        this.api.changeName(name).subscribe(()=>{
          this.saving.set(false);
          this.saveOk.set(true);
          this.loadMe(); 
        }, (e) => {
          this.saving.set(false);
        this.saveError.set(e?.error?.message || 'Ошибка сохранения');
        })
    }

    if (pass) {
        this.saving.set(true);
        this.api.changePassword(pass).subscribe(()=>{
          this.saving.set(false);
          this.saveOk.set(true);
          this.password.set('');
          this.loadMe(); 
        }, (e) => {
          this.saving.set(false);
        this.saveError.set(e?.error?.message || 'Ошибка сохранения');
        })
    }


  }
}
